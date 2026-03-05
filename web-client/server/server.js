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
    online: 0
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
          ws.send(JSON.stringify({
            type: 'status',
            message: 'Connected to server'
          }));
        });

        // Handle data from ROM
        telnetSocket.on('data', (data) => {
          let text = data.toString('utf-8', 0, data.length);
          
          // Filter out telnet protocol control sequences (IAC and related bytes)
          // This removes garbage characters from telnet negotiations
          // IAC = 0xFF (255), and related control codes
          const filtered = Buffer.from(text, 'utf-8')
            .filter((byte, i, arr) => {
              // Skip telnet protocol bytes (IAC and its options)
              if (byte === 0xFF) return false; // IAC - skip this and next
              if (i > 0 && arr[i-1] === 0xFF) return false; // Skip the byte after IAC
              // Allow everything else
              return true;
            })
            .toString('utf-8');
          
          text = filtered;
          
          // Log sample of data for debugging (check for color codes)
          if (text.includes('{') || text.includes('\x1b[')) {
            console.log(`[${connectionId}] Color codes detected in ROM output - Sample:`, text.substring(0, 200));
          }
          
          // Parse player stats from mud output
          parsePlayerStats(text, playerStats);

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
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 ROM Web Client Server running on port ${PORT}`);
  console.log(`📡 Telnet bridge: ${ROM_HOST}:${ROM_PORT}`);
  console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
