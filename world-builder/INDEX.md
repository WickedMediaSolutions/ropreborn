# World Builder Resources Index

## 📑 Complete Documentation

### Getting Started
- **[README.md](README.md)** - Start here! Complete user guide with setup instructions
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - 1-page cheat sheet for common tasks

### Technical Documentation
- **[API_DOCS.md](API_DOCS.md)** - Complete REST API reference with examples
- **[BUILD_REPORT.md](BUILD_REPORT.md)** - Detailed build report with all metrics
- **[SETUP_COMPLETE.md](SETUP_COMPLETE.md)** - Installation verification checklist
- **[MASTER_WORLD_BUILDER_TASK_LIST.md](MASTER_WORLD_BUILDER_TASK_LIST.md)** - End-to-end checklist for full suite completion
- **[SPRINT_IMPLEMENTATION_PLAN.md](SPRINT_IMPLEMENTATION_PLAN.md)** - Sequenced sprint plan with file-by-file implementation targets

### Quick Start Scripts
- **[start.bat](start.bat)** - Windows batch file (RECOMMENDED)
- **[start.ps1](start.ps1)** - Windows PowerShell script

---

## 🗂️ Project Structure

### Backend (Node.js/Express)

**Core Server:**
```
backend/
├── src/
│   ├── server.js                 Main Express server
│   ├── services/
│   │   ├── AreParser.js          Parse ROM .are files → JSON
│   │   ├── AreGenerator.js       Generate ROM .are ← JSON
│   │   └── FileManager.js        Disk I/O with backups
│   └── routes/
│       ├── areas.js              Area CRUD endpoints
│       └── rooms.js              Room CRUD endpoints
├── .env                          Configuration file
├── package.json                  Dependencies
└── node_modules/                 Installed packages (106)
```

**How it works:**
1. Server listens on port 5000
2. Receives requests from frontend
3. Uses AreParser to read .are files
4. Uses FileManager to manage disk I/O
5. Uses AreGenerator to write .are files
6. Returns JSON responses to frontend

### Frontend (React)

**Web Application:**
```
frontend/
├── src/
│   ├── App.jsx                   Main component (3-panel layout)
│   ├── App.css                   Main styles
│   ├── index.js                  React entry point
│   ├── api/
│   │   └── client.js             Axios API wrapper (14 methods)
│   ├── store/
│   │   └── store.js              Zustand state (14 actions)
│   └── components/
│       ├── AreaBrowser.jsx       Area selection UI
│       ├── RoomGrid.jsx          2D room grid
│       ├── PropertyPanel.jsx     Room property editor
│       └── Notifications.jsx     Toast notifications
├── public/
│   └── index.html                HTML root
├── .env                          Configuration
├── package.json                  Dependencies
└── node_modules/                 Installed packages (1,301)
```

**How it works:**
1. App renders 3-panel layout
2. Left: AreaBrowser (select/create areas)
3. Center: RoomGrid (visual room editing)
4. Right: PropertyPanel (edit properties/exits)
5. Makes HTTP calls to backend API
6. Uses Zustand for state management

---

## 🚀 Launching the Application

### Easiest Way (Windows)
```powershell
cd e:\mud\rom24-quickmud\world-builder
.\start.bat
```
→ Scripts will start both backend and frontend automatically

### Manual Way (2 Terminals)

**Terminal 1 - Backend:**
```bash
cd e:\mud\rom24-quickmud\world-builder\backend
npm start
# Should show: "✓ Server running on http://localhost:5000"
```

**Terminal 2 - Frontend:**
```bash
cd e:\mud\rom24-quickmud\world-builder\frontend
npm start
# Should open browser to http://localhost:3000
```

---

## 📚 Key Files to Know

### Essential Read
1. **README.md** → Full setup and usage guide
2. **QUICK_REFERENCE.md** → One-page cheat sheet
3. **API_DOCS.md** → REST API reference

### Configuration
1. **backend/.env** → Backend settings (PORT, AREA_DIR)
2. **frontend/.env** → Frontend settings (API_URL)

### Backend Services (How .are files work)
1. **AreParser.js** → Reads ROM .are format
2. **AreGenerator.js** → Writes ROM .are format
3. **FileManager.js** → Manages files on disk

### Frontend State Management
1. **store.js** → Zustand store (14 actions)
2. **client.js** → API methods (14 endpoints)

---

## 🔧 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  USER (Browser)                          │
│              http://localhost:3000                       │
└─────────────────┬──────────────────────────────────────┘
                  │ HTTP Proxy (3000→5000)
┌─────────────────▼──────────────────────────────────────┐
│         React Frontend (3-Panel Layout)                │
│  ┌──────────┬────────────────┬────────────────┐        │
│  │ Area     │   Room Grid    │   Properties   │        │
│  │ Browser  │   (2D visual)  │   Editor       │        │
│  └──────────┴────────────────┴────────────────┘        │
│         Zustand Store (14 actions)                      │
│         Axios Client (14 API methods)                   │
└─────────────────┬──────────────────────────────────────┘
                  │ REST API (port 5000)
┌─────────────────▼──────────────────────────────────────┐
│      Express.js Backend API Server                     │
│  GET/POST/PUT/DELETE routes for areas & rooms          │
│                                                        │
│  AreParser Service    AreGenerator Service             │
│  └→ Parse .are → JSON    └→ JSON → .are               │
│                                                        │
│         FileManager Service                            │
│         └→ Disk I/O with automatic backups             │
└─────────────────┬──────────────────────────────────────┘
                  │ File I/O
┌─────────────────▼──────────────────────────────────────┐
│        ../../area/ (ROM Area Directory)                │
│  ├── midgaard.are      (existing areas)                │
│  ├── dwarven.are                                       │
│  ├── ... (all .are files)                              │
│  └── *.bak files (automatic backups)                   │
└──────────────────────────────────────────────────────────┘
```

---

## 💾 Data Flow Examples

### Loading an Area
```
1. User selects area in AreaBrowser
2. Frontend calls store.loadArea("midgaard")
3. Store calls AreaAPI.loadArea("midgaard")
4. Axios POSTs to localhost:5000/api/areas/midgaard
5. Backend FileManager.loadArea() runs
6. AreParser reads midgaard.are file
7. Returns JSON: { rooms: [...], version: "2.4", ... }
8. Frontend receives JSON, updates store
9. RoomGrid renders rooms visually
10. User can now edit
```

### Creating a Room
```
1. User Ctrl+clicks empty grid cell
2. Frontend calls store.createRoom("midgaard", { vnum: 3001, ... })
3. Store calls RoomAPI.createRoom("midgaard", roomData)
4. Axios POSTs to localhost:5000/api/areas/midgaard/rooms
5. Backend creates room, updates area in memory
6. Frontend receives confirmation, updates store
7. RoomGrid refreshes to show new room
8. Area not saved yet (changes in memory only)
```

### Saving an Area
```
1. User clicks Save (menu or Ctrl+S)
2. Frontend calls store.saveArea("midgaard", areaData)
3. Store calls AreaAPI.saveArea("midgaard", areaData)
4. Axios PUTs to localhost:5000/api/areas/midgaard
5. Backend FileManager.saveArea() runs:
   - Creates backup: midgaard.are.bak
   - Validates data with AreGenerator
   - Writes JSON to .are format
   - Saves midgaard.are to disk
6. Frontend receives confirmation
7. User sees success notification
8. Changes are now permanent
```

---

## 🎯 Common Workflows

### Workflow 1: Load and Edit Existing Area
```
1. Start application (.\start.bat)
2. Left panel: Select "midgaard" from dropdown
3. Wait for area to load (grid populates)
4. Click room in grid to select
5. Right panel: Edit properties
6. Add exits between rooms
7. Menu: Save (creates backup, writes file)
8. Done!
```

### Workflow 2: Create New Area
```
1. Start application (.\start.bat)
2. Left panel: Click "Create New Area"
3. Enter name: "myarea"
4. Area created, ready for rooms
5. Ctrl+click in grid to create rooms
6. Edit each room's properties
7. Add exits between rooms
8. Save (new file created: myarea.are)
9. Done!
```

### Workflow 3: Add Exit Between Rooms
```
1. Select room #3001 (click in grid)
2. Right panel: Scroll to "EXITS"
3. Click "Add Exit"
4. Select direction: "north"
5. Enter target vnum: "3002"
6. Check "Auto-reciprocal"
7. Click Add
8. Result: 3001→3002 north, 3002→3001 south
9. Save area to persist
```

---

## 🔍 Troubleshooting Guide

### Problem: "Cannot GET http://localhost:3000"
**Solution:**
- Verify frontend npm start ran successfully
- Check frontend terminal for compilation errors
- Clear browser cache (Ctrl+Shift+Delete)
- Try `http://localhost:3000` directly

### Problem: "Connection refused - localhost:5000"
**Solution:**
- Verify backend npm start ran successfully
- Check if port 5000 is already in use: `netstat -ano | findstr :5000`
- Verify backend .env file exists
- Check backend terminal for startup errors

### Problem: "Area list is empty or won't load"
**Solution:**
- Verify `area/` directory exists with .are files
- Check file permissions in area/ directory
- Verify backend can read files: check console errors
- Try loading a specific area by name

### Problem: "Save failed - permission denied"
**Solution:**
- Check write permissions on area/ directory
- Check disk space available
- Close .are files if open elsewhere
- Verify filesystem isn't read-only

### Problem: "React app is blank or shows errors"
**Solution:**
- Check frontend console for errors (F12)
- Verify REACT_APP_API_URL in frontend/.env
- Verify backend is running
- Clear npm cache: `npm cache clean --force`

---

## 📊 Statistics at a Glance

| Metric | Count |
|--------|-------|
| Backend services | 3 |
| Frontend components | 5 |
| API endpoints | 12 |
| Zustand store actions | 14 |
| Backend packages | 106 |
| Frontend packages | 1,301 |
| Backend code lines | 1,000+ |
| Frontend code lines | 1,200+ |
| Documentation lines | 1,000+ |
| Total project files | 20+ |

---

## 🎓 For Developers

### Adding a New API Endpoint

1. Create route in `backend/src/routes/`
2. Add action to `frontend/src/store/store.js`
3. Add method to `frontend/src/api/client.js`
4. Add UI in appropriate component
5. Test with curl or Postman
6. Document in API_DOCS.md

### Adding a New React Component

1. Create file in `frontend/src/components/`
2. Import in `App.jsx`
3. Add to layout in `App.jsx`
4. Add styling to `App.css`
5. Connect to Zustand store if needed
6. Test in browser

### Modifying the .are Parser

1. Edit `backend/src/services/AreParser.js`
2. Test with existing .are files
3. Update validation rules if needed
4. Test save/load cycle
5. Update API_DOCS.md if format changes

---

## 🔗 External Resources

- **Node.js Documentation:** https://nodejs.org/en/docs/
- **React Documentation:** https://react.dev/
- **Express.js Documentation:** https://expressjs.com/
- **Zustand Documentation:** https://github.com/pmndrs/zustand
- **Axios Documentation:** https://axios-http.com/

---

## 📞 Quick Help

**Q: Where do I start?**
A: Open [README.md](README.md)

**Q: How do I launch it?**
A: Run `.\start.bat` in world-builder directory

**Q: How do I edit a room?**
A: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)

**Q: What are all the API endpoints?**
A: See [API_DOCS.md](API_DOCS.md)

**Q: Something isn't working, help!**
A: Check [BUILD_REPORT.md](BUILD_REPORT.md) troubleshooting section

---

## 📝 Project Info

**Phase:** 13 - World Builder MVP  
**Status:** Ready for Production Use  
**Created:** March 3, 2024  
**Location:** `e:\mud\rom24-quickmud\world-builder\`  
**License:** ROM 2.4 MUD License  

---

**All systems go! 🚀 Start building your world!**

