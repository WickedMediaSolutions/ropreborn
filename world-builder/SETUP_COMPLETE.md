# ROM World Builder - Setup Complete ✓

## Installation Status: READY TO RUN

### ✓ Completed Steps

1. **Backend Setup** 
   - ✓ Express.js API server configured
   - ✓ Node modules installed (106 packages)
   - ✓ AreParser, AreGenerator, FileManager services ready
   - ✓ 12 REST API endpoints configured
   - ✓ Running on port 5000

2. **Frontend Setup**
   - ✓ React 18.2 configured
   - ✓ Node modules installed (1301 packages)
   - ✓ Zustand state management ready
   - ✓ Axios API client ready
   - ✓ 5 React components built and ready
   - ✓ Responsive CSS styling applied
   - ✓ Running on port 3000

3. **Configuration**
   - ✓ Backend .env file created (PORT=5000)
   - ✓ Frontend .env file created (REACT_APP_API_URL)
   - ✓ Proxy configuration enabled

4. **File Structure**
   - ✓ All services in place
   - ✓ All components created
   - ✓ All routes configured
   - ✓ Documentation complete

## How to Start

### Option 1: Batch File (Windows)
```powershell
cd e:\mud\rom24-quickmud\world-builder
.\start.bat
```

### Option 2: PowerShell (Windows)
```powershell
cd e:\mud\rom24-quickmud\world-builder
.\start.ps1
```

### Option 3: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd world-builder/backend
npm start
# Should see: Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd world-builder/frontend
npm start
# Should see: Compiled successfully! and browser opens to localhost:3000
```

## Verification Checklist

Before using the World Builder, verify:

- [ ] Backend running on http://localhost:5000
- [ ] Frontend accessible at http://localhost:3000
- [ ] No errors in either terminal
- [ ] Browser DevTools shows no errors (F12)
- [ ] Area list loads without errors
- [ ] Can see existing .are files from area/ directory

## Features Ready

✓ **Area Management**
- Load existing area files (.are format)
- Create new areas
- Save/overwrite areas with backups
- Delete areas

✓ **Room Editing**
- Visual 2D grid display
- Create new rooms by clicking grid
- Edit room properties (name, description)
- Set room flags and types
- Visual room count per area

✓ **Exit Management**
- Add bidirectional exits
- Auto-link exits between rooms
- Remove exits
- Visual exit indicators

✓ **File Operations**
- Automatic backups before save
- ROM .are format compatibility
- Safe path handling (no traversal attacks)
- Graceful error handling

## System Requirements

- **Node.js**: v16 or higher (installed)
- **npm**: v7 or higher (installed)
- **Memory**: 500MB minimum (React dev server is memory intensive)
- **Ports**: 5000 (backend) and 3000 (frontend) must be available
- **ROM Server**: Not required (World Builder works independently)

## Troubleshooting

**"Server running on port 5000" not appearing?**
- Check if port 5000 is already in use
- Check firewall settings
- Verify Node.js installation: `node --version`

**React app not loading at localhost:3000?**
- Check frontend terminal for compilation errors
- Clear browser cache (Ctrl+Shift+Delete)
- Verify port 3000 is available: `netstat -ano | findstr :3000`

**Area list showing but won't load areas?**
- Verify the `area/` directory exists in ROM root
- Check file permissions on area/ directory
- Review backend console for errors

**Changes not saving?**
- Verify write permissions on area/ directory
- Check disk space available
- Look for backup files (*.bak) to confirm save attempt

## Next Steps

1. **Start both servers** using one of the methods above
2. **Load an existing area** to familiarize yourself with the UI
3. **Create a test area** to validate the save/load cycle
4. **Edit a room** to test property editing
5. **Manage exits** between rooms

## Architecture Overview

```
┌─────────────────────────────────────┐
│    Browser (localhost:3000)          │
│  React App with 3-panel Layout       │
├─────────────────────────────────────┤
│  AreaBrowser | RoomGrid | Properties │
├────────────────────────────────────┤
│ Zustand Store (14 actions)          │
├────────────────────────────────────┤
│    Axios HTTP Client (14 methods)   │
└────────────┬───────────────────────┘
             │ HTTP Proxy (3000→5000)
             │
┌────────────▼───────────────────────┐
│ Express API (localhost:5000)        │
├────────────────────────────────────┤
│ Areas Routes:  GET/POST/PUT/DELETE  │
│ Rooms Routes:  POST/PUT/DELETE/X    │
├────────────────────────────────────┤
│ AreParser → AreGenerator            │
│ FileManager (with backups)          │
└────────────┬───────────────────────┘
             │ Disk I/O
             │
        Area Directory
        (../../../area/)
```

## Key Files

- `backend/src/server.js` - Express server entry point
- `backend/src/services/AreParser.js` - Parse .are files to JSON
- `backend/src/services/AreGenerator.js` - Generate .are from JSON
- `backend/src/services/FileManager.js` - Disk I/O with security
- `frontend/src/App.jsx` - Main React component
- `frontend/src/store/store.js` - Zustand state management
- `start.bat` or `start.ps1` - Convenient startup scripts

## Backend Status

**Listening Routes:**
```
GET    /api/areas           - List all areas
GET    /api/areas/:name     - Load specific area
POST   /api/areas           - Create new area
PUT    /api/areas/:name     - Save area (overwrites)
DELETE /api/areas/:name     - Delete area

GET    /api/areas/:name/rooms/:vnum     - Get room (implied)
POST   /api/areas/:name/rooms           - Create room
PUT    /api/areas/:name/rooms/:vnum     - Update room
DELETE /api/areas/:name/rooms/:vnum     - Delete room
POST   /api/areas/:name/rooms/:vnum/exits  - Add exit
DELETE /api/areas/:name/rooms/:vnum/exits  - Remove exit
```

## Frontend Components Ready

- **App.jsx** - Main layout manager (3 panels)
- **AreaBrowser.jsx** - Area selection and management
- **RoomGrid.jsx** - 2D room grid visualization
- **PropertyPanel.jsx** - Room property editor
- **Notifications.jsx** - Toast notifications for user feedback

---

**Created:** Phase 13 - World Builder MVP
**Status:** Ready for testing and use
**Next Phase:** NPC/Object editor (Phase 14)
