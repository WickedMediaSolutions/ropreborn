# ROM Web Client

A modern, web-based player interface for the ROM 2.4 MUD (Rites of Passage edition).

## Features

✨ **Modern Web Interface**
- ⚔️ Real-time MUD interaction via WebSocket
- 🎮 Professional gaming UI with dark theme
- 📊 Live player stats dashboard
- 🌈 Full ANSI color support
- ⌨️ Command history
- 🔗 Telnet bridge (connects to ROM server)

## Architecture

```
web-client/
├── server/                # Node.js/Express WebSocket bridge
│   ├── server.js         # Main server (telnet → WebSocket)
│   ├── package.json
│   └── .env
│
└── client/                # React.js frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── App.jsx        # Main app component
    │   ├── store.js       # Zustand state management
    │   └── index.css      # Global styles
    ├── public/
    │   └── index.html
    └── package.json
```

## Installation

### Prerequisites
- Node.js 16+ (LTS)
- ROM server running on port 4000 (default)

### Setup

**Install backend dependencies:**
```bash
cd server
npm install
```

**Install frontend dependencies:**
```bash
cd client
npm install
```

## Running the Application

**Terminal 1 - Start Backend (WebSocket bridge):**
```bash
cd server
npm start
# Runs on http://localhost:5001
```

**Terminal 2 - Start Frontend (React dev server):**
```bash
cd client
npm start
# Runs on http://localhost:3000
```

Navigate to **http://localhost:3000** in your browser.

## Configuration

### Server (.env)
```
PORT=5001                    # Backend API port
ROM_HOST=localhost           # ROM server hostname
ROM_PORT=4000                # ROM server port
```

## Features Explained

### Real-Time Terminal
- Green-on-black retro terminal aesthetics
- Full ANSI color code support
- Scrollable output with auto-scroll on new messages
- Command history

### Player Dashboard
- HP/Mana/Moves bars with real-time updates
- Experience progress
- Gold counter
- Alignment indicator
- Character info (name, level, race, class)

### Quick Actions
- Equipment button
- Inventory button
- Spells button
- Map button
- Party button
- Settings button

### Server Status
- Live connection indicator
- Online/Offline status
- Error messages

## How It Works

1. **Web Client (Browser)**
   - React frontend displays the MUD interface
   - User types commands and hits Enter
   - Commands sent via WebSocket to server

2. **Backend Bridge (Node.js)**
   - Listens on WebSocket port 5001
   - Creates TCP telnet connection to ROM server (port 4000)
   - Relays commands: Browser → WebSocket → Telnet
   - Relays output: Telnet → WebSocket → Browser
   - Parses player stats from MUD output
   - Converts ANSI codes for browser display

3. **ROM Server (Telnet)**
   - Acts like any normal telnet connection
   - No modifications needed to ROM itself
   - Sends text output with ANSI colors

## Customization

### Styling
Edit `client/src/index.css` and component CSS files:
- `TerminalDisplay.css` - Terminal colors and styling
- `PlayerStats.css` - Stats panel design
- `CommandInput.css` - Command input styling

### Colors
Terminal colors are customizable in `TerminalDisplay.css`:
```css
.ansi-red { color: #ff4444; }
.ansi-green { color: #44ff44; }
/* ... etc */
```

### Adding Features

**Add a new stat:**
Edit `store.js` PlayerStats object and `PlayerStats.jsx` component.

**Add a new panel:**
Create a new component in `components/` and import in `App.jsx`.

**Customize the telnet parser:**
Edit `parsePlayerStats()` in `server/server.js`.

## Deployment

### Local Network
1. Start backend: `npm start` in server/
2. Start frontend: `npm start` in client/
3. Access from any device: `http://YOUR_IP:3000`

### Production (Ubuntu VPS)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install deps
cd web-client/server && npm install
cd ../client && npm install

# Use tmux/screen to keep running
tmux new -d -s web-client "cd ~/ropreborn/web-client/server && npm start"
tmux new -d -s web-client "cd ~/ropreborn/web-client/client && npm start"

# Or use PM2 for process management
sudo npm install -g pm2
pm2 start web-client/server/server.js --name "rom-ws-bridge"
pm2 start "npm start" --cwd web-client/client --name "rom-web-client"
pm2 save
pm2 startup
```

### SSH Port Forwarding (Secure Remote Access)
```powershell
# From Windows
ssh -L 3000:localhost:3000 -L 5000:localhost:5000 root@YOUR_VPS_IP
```

Then access at `http://localhost:3000`

## Troubleshooting

**"Cannot connect to server"**
- Check that backend is running: `curl http://localhost:5001/health`
- Check ROM server is running: `telnet localhost 4000`
- Check .env file has correct ROM_HOST and ROM_PORT

**"No colors showing"**
- ANSI codes should be auto-detected
- Check ROM server is set to output ANSI colors
- Edit parseAnsi() in TerminalDisplay.jsx if needed

**"Stats not updating"**
- The stat parser is simplified
- To add more stats, edit parsePlayerStats() in server.js
- Add regex patterns to match your MUD's stat output

## Future Enhancements

- [ ] Map display with room navigation
- [ ] Spell/skill buttons
- [ ] Equipment drag-and-drop
- [ ] Party member list
- [ ] Message history/search
- [ ] Custom keybindings
- [ ] Sound effects
- [ ] Macro system
- [ ] Multi-character support
- [ ] Character creation wizard

## License

Same as ROM 2.4 license (see ROM24/doc/rom.license)
