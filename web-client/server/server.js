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
    alignment: 0,
    race: 'Human',
    class: 'Warrior',
    online: 0
  };

  console.log(`[${connectionId}] WebSocket client connected`);
  connections[connectionId] = { ws, telnetSocket, playerStats };

  // Handle incoming messages from web client
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'command') {
        // Send command to ROM
        if (telnetSocket && telnetSocket.writable) {
          telnetSocket.write(data.command + '\r\n');
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
          const text = data.toString('utf-8');
          
          // Parse player stats from mud output (simplified)
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

// Parse player stats from MUD output (simple regex parsing)
function parsePlayerStats(text, stats) {
  // This is a simplified parser - you can enhance it based on your MUD's output
  
  // Look for patterns like "HP: 50/100"
  const hpMatch = text.match(/HP:\s*(\d+)\/(\d+)/i);
  if (hpMatch) {
    stats.hp = parseInt(hpMatch[1]);
    stats.maxHp = parseInt(hpMatch[2]);
  }

  // Look for "Mana: 75/100"
  const manaMatch = text.match(/Mana:\s*(\d+)\/(\d+)/i);
  if (manaMatch) {
    stats.mana = parseInt(manaMatch[1]);
    stats.maxMana = parseInt(manaMatch[2]);
  }

  // Look for "Level: 10"
  const levelMatch = text.match(/Level:\s*(\d+)/i);
  if (levelMatch) {
    stats.level = parseInt(levelMatch[1]);
  }

  // Look for "Gold: 5000"
  const goldMatch = text.match(/Gold:\s*(\d+)/i);
  if (goldMatch) {
    stats.gold = parseInt(goldMatch[1]);
  }

  // Look for "Exp: 12345"
  const expMatch = text.match(/Exp:\s*(\d+)/i);
  if (expMatch) {
    stats.experience = parseInt(expMatch[1]);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 ROM Web Client Server running on port ${PORT}`);
  console.log(`📡 Telnet bridge: ${ROM_HOST}:${ROM_PORT}`);
  console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
