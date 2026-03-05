const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors');
const net = require('net');
require('dotenv').config();

const app = express();
expressWs(app);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const ROM_HOST = process.env.ROM_HOST || 'localhost';
const ROM_PORT = process.env.ROM_PORT || 4000;

// Store active connections
const connections = {};

// WebSocket connection handler
app.ws('/ws', (ws, req) => {
  const connectionId = `conn_${Date.now()}`;
  let telnetSocket = null;
  let initialSyncSent = false;
  let playerName = null;
  let playerStats = {
    name: '',
    level: 1,
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    moves: 100,
    maxMoves: 100,
    experience: 0,
    nextLevel: 1000,
    gold: 0,
    silver: 0,
    alignment: 0,
    race: 'Human',
    class: 'Warrior',
    practice: 0,
    damroll: 0,
    hitroll: 0,
    evasion: 0,
    warpoint: 0,
    wimpy: 10,
    remorts: 0,
    age: 0,
    playtime: 0,
    weight: 0,
    online: 0,
    equipment: {},
    inventory: [],
    skills: []
  };

  console.log(`[${connectionId}] WebSocket client connected`);
  connections[connectionId] = { ws, telnetSocket, playerStats };

  // Handle incoming messages from web client
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'command') {
        // Send command to ROM - data.command already has proper line endings from xterm
        if (telnetSocket && telnetSocket.writable) {
          telnetSocket.write(data.command);
        }
      } else if (data.type === 'connect') {
        // Establish telnet connection to ROM
        if (telnetSocket) {
          telnetSocket.destroy();
        }

        telnetSocket = net.createConnection(ROM_PORT, ROM_HOST, () => {
          console.log(`[${connectionId}] Connected to ROM at ${ROM_HOST}:${ROM_PORT}`);
          initialSyncSent = false;
          ws.send(JSON.stringify({
            type: 'status',
            message: 'Connected to server'
          }));
        });

        // Handle data from ROM
        telnetSocket.on('data', (data) => {
          // Filter out telnet protocol control sequences
          // Keep only: printable ASCII (32-126), ANSI escapes (27), and whitespace (9,10,13)
          const filtered = Buffer.from(data)
            .filter((byte) => {
              // Allow printable ASCII (32-126)
              if (byte >= 32 && byte <= 126) return true;
              // Allow ESC (27) for ANSI color codes
              if (byte === 27) return true;
              // Allow whitespace: tab (9), LF (10), CR (13)
              if (byte === 9 || byte === 10 || byte === 13) return true;
              // Block everything else (telnet control codes, etc)
              return false;
            })
            .toString('utf-8');
          
          const text = filtered;
          
          // Log sample of data for debugging (check for color codes)
          if (text.includes('{') || text.includes('\x1b[')) {
            console.log(`[${connectionId}] Color codes detected in ROM output - Sample:`, text.substring(0, 200));
          }
          
          // Parse player stats from mud output
          parsePlayerStats(text, playerStats);

          // After first in-game prompt, auto-sync key panels once.
          if (!initialSyncSent && /<\s*\d+\s*hp\s+\d+\s*m\s+\d+\s*mv\s*>/i.test(text) && telnetSocket && telnetSocket.writable) {
            initialSyncSent = true;
            const syncCommands = ['score', 'i', 'eq', 'skills'];
            syncCommands.forEach((cmd, idx) => {
              setTimeout(() => {
                if (telnetSocket && telnetSocket.writable) {
                  telnetSocket.write(`${cmd}\r\n`);
                }
              }, 80 + idx * 140);
            });
          }

          ws.send(JSON.stringify({
            type: 'output',
            data: text,
            stats: playerStats
          }));
        });

        telnetSocket.on('error', (err) => {
          console.error(`[${connectionId}] Telnet error:`, err.message);
          ws.send(JSON.stringify({
            type: 'error',
            message: `Connection error: ${err.message}`
          }));
        });

        telnetSocket.on('close', () => {
          console.log(`[${connectionId}] ROM connection closed`);
          ws.send(JSON.stringify({
            type: 'status',
            message: 'Disconnected from server'
          }));
          telnetSocket = null;
        });

        connections[connectionId].telnetSocket = telnetSocket;
      }
    } catch (err) {
      console.error(`[${connectionId}] Error:`, err);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`[${connectionId}] WebSocket client disconnected`);
    if (telnetSocket) {
      telnetSocket.destroy();
    }
    delete connections[connectionId];
  });

  ws.on('error', (err) => {
    console.error(`[${connectionId}] WebSocket error:`, err);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connections: Object.keys(connections).length });
});

// Serve static files (React build)
app.use(express.static('public'));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Enhanced ROM stat parser - handles ROM 2.4 color codes and stat format
function parsePlayerStats(text, stats) {
  // Remove ANSI escape sequences for cleaner parsing
  const cleanText = text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\{[xRBGMWYDC]\}/g, '');

  // Parse prompt stats from lines like: <20hp 100m 100mv>
  const promptMatch = cleanText.match(/<\s*(\d+)\s*hp\s+(\d+)\s*m\s+(\d+)\s*mv\s*>/i);
  if (promptMatch) {
    stats.hp = parseInt(promptMatch[1], 10);
    stats.mana = parseInt(promptMatch[2], 10);
    stats.moves = parseInt(promptMatch[3], 10);
  }
  
  // Parse character info from top section (name, race, class)
  // Pattern: "Thou art <name> the <race> <class>."
  const charMatch = cleanText.match(/Thou art\s+(\S+)\s+the\s+(\w+)\s+(\w+)/i);
  if (charMatch) {
    stats.name = charMatch[1];
    stats.race = charMatch[2];
    stats.class = charMatch[3];
  }

  // Parse level from "level <number>"
  const levelMatch = cleanText.match(/level\s+(\d+)\./i);
  if (levelMatch) {
    stats.level = parseInt(levelMatch[1]);
  }

  // Parse experience - "You have gained <exp> experience"
  const expMatch = cleanText.match(/gained\s+(\d+)\s+experience/i);
  if (expMatch) {
    stats.experience = parseInt(expMatch[1]);
  }

  // Parse exp to next level - "and need <exp> more to level"
  const nextLevelMatch = cleanText.match(/need\s+(\d+)\s+more to level/i);
  if (nextLevelMatch) {
    stats.nextLevel = parseInt(nextLevelMatch[1]);
  }

  // Parse practices - "You have <n> practices to"
  const practiceMatch = cleanText.match(/You have\s+(\d+)\s+practices/i);
  if (practiceMatch) {
    stats.practice = parseInt(practiceMatch[1]);
  }

  // Parse Health (current/max) - "Health :<space><number>  /<space><number>"
  const healthMatch = cleanText.match(/Health\s*:\s*(\d+)\s*\/\s*(\d+)/i);
  if (healthMatch) {
    stats.hp = parseInt(healthMatch[1]);
    stats.maxHp = parseInt(healthMatch[2]);
  }

  // Parse Stamina (Moves) - "Stamina:<space><number>  /<space><number>"
  const stamMatch = cleanText.match(/Stamina\s*:\s*(\d+)\s*\/\s*(\d+)/i);
  if (stamMatch) {
    stats.moves = parseInt(stamMatch[1]);
    stats.maxMoves = parseInt(stamMatch[2]);
  }

  // Parse Mana - "Mana   :<space><number>  /<space><number>"
  const manaMatch = cleanText.match(/Mana\s*:\s*(\d+)\s*\/\s*(\d+)/i);
  if (manaMatch) {
    stats.mana = parseInt(manaMatch[1]);
    stats.maxMana = parseInt(manaMatch[2]);
  }

  // Parse bonuses
  // "Attack Power Bonus:" followed by number
  const damrollMatch = cleanText.match(/Attack Power Bonus\s*:\s*(\d+)/i);
  if (damrollMatch) {
    stats.damroll = parseInt(damrollMatch[1]);
  }

  // "Offensive Bonus" followed by number
  const hitrollMatch = cleanText.match(/Offensive Bonus\s*:\s*(-?\d+)/i);
  if (hitrollMatch) {
    stats.hitroll = parseInt(hitrollMatch[1]);
  }

  // "Evasion Bonus" followed by number
  const evasionMatch = cleanText.match(/Evasion Bonus\s*:\s*(\d+)/i);
  if (evasionMatch) {
    stats.evasion = parseInt(evasionMatch[1]);
  }

  // Parse War Points - "War Points:" followed by number
  const warMatch = cleanText.match(/War Points\s*:\s*(\d+)/i);
  if (warMatch) {
    stats.warpoint = parseInt(warMatch[1]);
  }

  // Parse Wimpy percentage - "Wimpy" followed by number and percent
  const wimpyMatch = cleanText.match(/Wimpy\s*:\s*(\d+)/i);
  if (wimpyMatch) {
    stats.wimpy = parseInt(wimpyMatch[1]);
  }

  // Parse Remorts - "Remorts:" followed by number
  const remortMatch = cleanText.match(/Remorts\s*:\s*(\d+)/i);
  if (remortMatch) {
    stats.remorts = parseInt(remortMatch[1]);
  }

  // Parse gold - "carrying <gold> gold and <silver> silver"
  const moneyMatch = cleanText.match(/carrying\s+(\d+)\s+gold\s+and\s+(\d+)\s+silver/i);
  if (moneyMatch) {
    stats.gold = parseInt(moneyMatch[1]);
    stats.silver = parseInt(moneyMatch[2]);
  }

  // Parse age/hours - "You are <age> years of age (<hours> Hours)"
  const ageMatch = cleanText.match(/You are\s+(\d+)\s+years of age\s+\((\d+)\s+Hours\)/i);
  if (ageMatch) {
    stats.age = parseInt(ageMatch[1]);
    stats.playtime = parseInt(ageMatch[2]);
  }

  // Parse weight - "carrying <weight> kg(s) of weight"
  const weightMatch = cleanText.match(/carrying\s+(\d+(?:\.\d+)?)\s+kg/i);
  if (weightMatch) {
    stats.weight = parseFloat(weightMatch[1]);
  }

  // Parse alignment (if displayed) - "Alignment:" or similar
  const alignmentMatch = cleanText.match(/Alignment\s*:\s*(-?\d+)/i);
  if (alignmentMatch) {
    stats.alignment = parseInt(alignmentMatch[1]);
  }

  // Parse equipment from ROM format:
  // <worn on torso>      a sub issue vest
  // <worn as shield>     a sub issue shield
  // <wielded>            a sub issue sword
  if (/You are using:/i.test(cleanText)) {
    const nextEquipment = {};
    const equipmentLineMatches = cleanText.matchAll(/^<([^>]+)>\s+(.+)$/gm);
    for (const match of equipmentLineMatches) {
      const rawSlot = match[1].trim().toLowerCase();
      const itemName = match[2].trim();
      if (!itemName) {
        continue;
      }

      let slot = rawSlot.replace(/\s+/g, '_');
      if (rawSlot.includes('wielded')) slot = 'mainhand';
      else if (rawSlot.includes('shield')) slot = 'offhand';
      else if (rawSlot.includes('used as light')) slot = 'light';
      else if (rawSlot.includes('torso')) slot = 'chest';
      else if (rawSlot.includes('head')) slot = 'head';
      else if (rawSlot.includes('neck')) slot = 'neck';
      else if (rawSlot.includes('hands')) slot = 'hands';
      else if (rawSlot.includes('wrists')) slot = 'wrists';
      else if (rawSlot.includes('waist')) slot = 'waist';
      else if (rawSlot.includes('legs')) slot = 'legs';
      else if (rawSlot.includes('feet')) slot = 'feet';

      nextEquipment[slot] = { slot, name: itemName };
    }

    if (Object.keys(nextEquipment).length > 0) {
      stats.equipment = nextEquipment;
    }
  }

  // Parse inventory from ROM format:
  // --- [Inventory] ---
  // You are carrying:
  //      a map of the city of Midgaard
  if (/You are carrying:/i.test(cleanText)) {
    const lines = cleanText.split(/\r\n|\n\r|\n|\r/);
    const nextInventory = [];
    let inInventory = false;

    for (const rawLine of lines) {
      const line = rawLine.replace(/\t/g, '    ').replace(/^\r+/, '');
      const trimmed = line.trim();

      if (/^You are carrying:/i.test(trimmed)) {
        inInventory = true;
        continue;
      }

      if (!inInventory) {
        continue;
      }

      if (trimmed.length === 0 || /^<\s*\d+\s*hp/i.test(trimmed) || /^---\s*\[/i.test(trimmed)) {
        break;
      }

      if (/^you are carrying nothing\./i.test(trimmed)) {
        continue;
      }

      // Any non-header text line in inventory block is an item line.
      if (trimmed.length > 0) {
        nextInventory.push({
          id: `${trimmed}-${nextInventory.length}`,
          name: trimmed,
          type: 'item'
        });
      }
    }

    stats.inventory = nextInventory;
  }

  // Parse skills from ROM format lines like:
  // Level  1: axe 1% dagger 1%
  //          sword 40%
  if (/\bLevel\s+\d+\s*:/i.test(cleanText)) {
    const lines = cleanText.split(/\r?\n/);
    const parsedSkills = [];

    for (const line of lines) {
      if (!/\d+%/.test(line)) {
        continue;
      }

      const normalized = line.replace(/^\s*Level\s+\d+\s*:\s*/i, '');
      const skillMatches = normalized.matchAll(/([A-Za-z][A-Za-z\s'\-]+?)\s+(\d+)%/g);
      for (const match of skillMatches) {
        const name = match[1].trim();
        const percent = parseInt(match[2], 10);
        if (!name) {
          continue;
        }
        parsedSkills.push({
          id: `${name.toLowerCase()}-${percent}`,
          name,
          percent,
          description: `Proficiency ${percent}%`
        });
      }
    }

    if (parsedSkills.length > 0) {
      stats.skills = parsedSkills;
    }
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 ROM Web Client Server running on port ${PORT}`);
  console.log(`📡 Telnet bridge: ${ROM_HOST}:${ROM_PORT}`);
  console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
