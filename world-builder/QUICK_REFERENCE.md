# ROM World Builder - Quick Reference Card

## 🚀 QUICK START (30 seconds)

```powershell
cd e:\mud\rom24-quickmud\world-builder
.\start.bat
# Browser opens → http://localhost:3000
```

---

## 🎮 BASIC WORKFLOW

### 1. Load an Area
- **Left Panel** → Select area from dropdown
- **Wait** for area to load in grid
- **See** all rooms displayed as grid cells

### 2. Edit a Room (Property Panel - Right)
- **Click** room in grid to select
- **Edit** name, description
- **Set** room type (CITY, FOREST, etc.)
- **Check** room flags (SAFE, NO_SUMMON, etc.)

### 3. Create New Room
- **Click + Ctrl** in empty grid cell
- **Room created** with auto vnum
- **Edit** properties immediately

### 4. Add Exit
- **Select** from room
- **Right Panel** → "Add Exit"
- **Choose** direction (north, south, east, west, etc.)
- **Enter** target room vnum
- **Auto-reciprocal** = auto-add return exit

### 5. Save
- **Menu** → Save (or Ctrl+S)
- **Backup** created automatically
- **File** written to area/

---

## 🗂️ KEY DIRECTORIES

```
world-builder/
├── backend/          (Node.js API server)
├── frontend/         (React web app)
└── docs/             (README, API docs, guides)
```

---

## 🔧 Manual Start (2 Terminals)

**Terminal 1:**
```bash
cd world-builder/backend
npm start
# Waits for: "Server running on port 5000"
```

**Terminal 2:**
```bash
cd world-builder/frontend
npm start
# Browser opens automatically
```

---

## 📋 COMMON TASKS

| Task | How |
|------|-----|
| Load area | Select from dropdown → Wait |
| Create room | Ctrl+Click empty grid cell |
| Edit room | Click room → Fill properties |
| Add exit | Room → Add Exit → Direction → Vnum |
| Remove exit | Room → Exits → Delete button |
| Save area | Menu → Save (backup auto-created) |
| Delete area | Area menu → Delete |
| Create new area | Area menu → Create |

---

## 🎯 KEYBOARD SHORTCUTS

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save current area |
| Ctrl+Click | Create room in grid |
| Click | Select room |
| Escape | Deselect room |
| Delete | Delete selected room |

---

## ⚙️ CONFIGURATION FILES

### Backend (.env)
```
PORT=5000                    # API server port
NODE_ENV=development         # Debug mode
AREA_DIR=../../area          # Area files location
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🔗 IMPORTANT URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Web app (frontend) |
| http://localhost:5000 | API server (backend) |
| http://localhost:5000/api/areas | List areas endpoint |

---

## 🐛 QUICK FIXES

**"Server won't start"**
→ `netstat -ano \| findstr :5000` (kill process using port 5000)

**"React app blank"**
→ Clear cache: Ctrl+Shift+Delete

**"Can't load areas"**
→ Check that `area/` directory exists with .are files

**"Save failed"**
→ Check write permissions on `area/` directory

---

## 📦 DEPENDENCIES

### Backend (4 key packages)
- `express` - Web server
- `fs-extra` - File operations
- `cors` - Cross-origin requests
- `uuid` - Unique IDs

### Frontend (3 key packages)
- `react` - UI framework
- `axios` - HTTP client
- `zustand` - State management

---

## 🔍 ROOM PROPERTIES

| Property | Values | Example |
|----------|--------|---------|
| Type | CITY, FOREST, INSIDE, etc. | CITY |
| Flags | SAFE, NO_SUMMON, NO_MOB, etc. | SAFE,NO_SUMMON |
| Name | Text | "Town Square" |
| Description | Text (multi-line) | "You are in..." |
| VNUM | Number | 3001 |

---

## 🚪 EXIT DIRECTIONS (10 total)

- **Horizontal**: north, south, east, west
- **Diagonal**: northeast, northwest, southeast, southwest
- **Vertical**: up, down

---

## 📚 DOCUMENTATION

| File | Content |
|------|---------|
| README.md | Complete user guide |
| API_DOCS.md | REST API reference |
| BUILD_REPORT.md | Full build details |
| SETUP_COMPLETE.md | Installation status |

---

## ✅ PRE-FLIGHT CHECKLIST

Before starting:
- [ ] Node.js installed (`node -v` shows 16+)
- [ ] npm installed (`npm -v` shows 7+)
- [ ] Port 5000 available
- [ ] Port 3000 available
- [ ] `area/` directory exists
- [ ] Write permissions on `area/`

---

## 🎓 SYSTEM ARCHITECTURE

```
Browser (localhost:3000)
┌─────────────────────────┐
│  React App              │
│  ├─ AreaBrowser        │
│  ├─ RoomGrid           │
│  ├─ PropertyPanel      │
│  └─ Notifications      │
└────────┬────────────────┘
         │ HTTP
         ▼
┌─────────────────────────┐
│  Express API (5000)     │
│  ├─ /api/areas         │
│  ├─ /api/areas/:name   │
│  └─ /api/.../rooms     │
└────────┬────────────────┘
         │ Disk I/O
         ▼
      area/*.are files
```

---

## 🎨 UI LAYOUT

```
┌──────────────────────────────────────────────────────┐
│  AREA BROWSER (20%)  │  ROOM GRID (55%)  │  PROPS (25%)
│                      │                   │
│ [Select area ▼]      │  [   ] [   ] [ ]  │ Name: ______
│ [Create new]         │  [XXX] [   ] [ ]  │ Desc: ______
│ [Delete]             │  [ ]  [   ] [ ]   │ Type: ______
│                      │                   │ Flags: _____
│ Room count: 100      │                   │ EXITS
│ Version: 2.4         │                   │ [Add][Remove]
│                      │                   │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 SECURITY

✅ **Secure:**
- Path traversal protection
- Automatic backups
- Input validation
- Safe file ops

❌ **Not Secure (local dev only):**
- No authentication
- CORS open
- No rate limiting

---

## 📞 HELP

**Stuck?** Check documentation:
1. README.md (quickest answers)
2. API_DOCS.md (API questions)
3. BUILD_REPORT.md (detailed info)
4. Backend console (error messages)
5. Frontend DevTools (F12)

---

## 🚀 START NOW

```
.\start.bat
```

App opens in 3-5 seconds... Good luck! 🎮

---

**Phase 13 Complete** ✓ | Ready to Build | Point-and-Click Editing

