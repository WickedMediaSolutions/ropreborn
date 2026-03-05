# ROM 2.4 World Builder - GUI Design & Architecture

**Graphical Area & Room Editor for ROP Conversion**  
**Version**: 1.0 (Design Phase)  
**Purpose**: Enable rapid area/room creation with visual editing  
**Date**: March 3, 2026

---

## Executive Summary

A **web-based graphical world builder** that allows builders to:
- ✅ Create rooms visually by clicking + arrow keys
- ✅ Define exits (N, S, E, W, U, D, NE, NW, SE, SW)
- ✅ Edit room properties (name, desc, flags, type)
- ✅ Add/edit NPCs and objects in rooms
- ✅ Save directly to ROM `area.lst` compatible .are files
- ✅ Load existing areas for editing
- ✅ Preview room layout in 2D/3D grid
- ✅ Bulk edit metadata across multiple rooms

**Target**: Convert hours of manual .are file editing into minutes of visual creation.

---

## Architecture Overview

### Core Design Decision: Web-Based GUI

**Why Web?**
- ✅ Cross-platform (Windows, Mac, Linux)
- ✅ Easy to use (familiar UI paradigms)
- ✅ Fast iteration (HTML/CSS/JS changes hot-reload)
- ✅ Can be local or deployed to network
- ✅ No installation complexity (just open browser)
- ✅ Future: Can expose on network for team collaboration

**Tech Stack**:
```
Frontend:
  - React.js (component framework)
  - Redux or Context API (state management)
  - Three.js or Babylon.js (3D room visualization)
  - Tailwind CSS (UI styling)
  - Monaco Editor (room description editor)

Backend:
  - Node.js (local file serving)
  - Express.js (API endpoints)
  - Chokidar (file watching for .are changes)
  - js-yaml or custom parser (ROM .are file format)

Desktop Wrapper (Optional):
  - Electron (if desktop app is preferred)
  - Can package React app as standalone .exe

File System:
  - Direct file I/O to area/ directory
  - Parse/generate .are format
  - Backup before save
  - Version control integration
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│         World Builder Web App (React)                │
│  ┌───────────────────────────────────────────────┐  │
│  │         React Component Tree                  │  │
│  │  ┌─────────────────────────────────────────┐ │  │
│  │  │    Main Editor View                     │ │  │
│  │  │  ┌──────────────┐  ┌──────────────────┐│ │  │
│  │  │  │Room Grid     │  │Property Panel    ││ │  │
│  │  │  │(2D Map)      │  │(Room Details)    ││ │  │
│  │  │  └──────────────┘  └──────────────────┘│ │  │
│  │  │  ┌──────────────┐  ┌──────────────────┐│ │  │
│  │  │  │3D Preview    │  │NPC/Obj Editor    ││ │  │
│  │  │  └──────────────┘  └──────────────────┘│ │  │
│  │  └─────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
│  Redux State: SelectedRoom, Rooms[], CurrentArea    │
└─────────────────────────────────────────────────────┘
         │                          │
         │ (Fetch/Save)            │ (View/Edit)
         │                          │
┌────────▼──────────────────────────▼────────────────┐
│    Backend API (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  /api/areas         - List all areas         │  │
│  │  /api/areas/:area   - Load area (parse .are) │  │
│  │  /api/rooms         - Get rooms in area      │  │
│  │  /api/room/:id      - Get/update room       │  │
│  │  /api/save          - Save area to .are file│  │
│  │  /api/new-room      - Create room in grid   │  │
│  │  /api/npcs/:room    - List NPCs in room     │  │
│  └──────────────────────────────────────────────┘  │
└────────┬──────────────────────────────────────────┘
         │
         │ (File I/O)
         │
┌────────▼──────────────────────────────────────────┐
│    File System: area/ directory                   │
│  ┌──────────────────────────────────────────────┐  │
│  │  midgaard.are     - Area definition          │  │
│  │  draconia.are     - Area definition          │  │
│  │  sect_halls.are   - Area definition          │  │
│  │  ...50 other .are files...                   │  │
│  │                                               │  │
│  │  FORMAT:                                       │  │
│  │  #ROOMS                                        │  │
│  │  #1000                                         │  │
│  │  Main Entrance~                               │  │
│  │  You stand in the main square~                │  │
│  │  [EXITS] [FLAGS]                              │  │
│  │  #1001                                         │  │
│  │  ...                                           │  │
│  │                                               │  │
│  │  #MOBILES                                      │  │
│  │  #2000 innkeeper~                             │  │
│  │  ...                                           │  │
│  │                                               │  │
│  │  #OBJECTS                                      │  │
│  │  #3000 sword~                                 │  │
│  │  ...                                           │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## Feature Breakdown

### Phase 1: Core Room Editing

#### **1.1 Area Selection & Loading**
- List all areas in `area/` directory
- Load area file (parse .are format)
- Display room count, NPC count, object count
- Show area metadata (vnum range, description)

**UI Component**:
```
┌─ Area Browser ──────────────────┐
│ [Select Area]                   │
│  ├─ midgaard.are (125 rooms)    │
│  ├─ draconia.are (89 rooms)     │
│  ├─ sect_halls.are (24 rooms)   │
│  └─ [+ New Area]                │
└─────────────────────────────────┘
```

#### **1.2 Room Grid Visualization**

Display rooms in a 2D grid based on exit connections:
- Click on room → select it
- Arrow keys: Create exits in N/S/E/W directions
- Show room vnums in grid squares
- Color-code by room type (temple, outdoor, shop, etc.)

**Example grid**:
```
        [1002]
         (N↓)
[1001] ← [1000] → [1003]
         (↑S)
        [1004]
```

**Features**:
- Pan/zoom the grid
- Click room to edit
- Right-click: context menu (delete, properties, copy)
- Drag to rearrange room positions (visual only, doesn't affect .are)

#### **1.3 Property Editor Panel**

When room is selected, show/edit:
- **Room Vnum** (unique ID, 1000-1999 for area)
- **Room Name** (title, max 80 char)
- **Description** (full room text, multi-line editor)
- **Room Flags** (SAFE, DARK, UNDERWATER, etc. - checkboxes)
- **Room Type** (dropdown: Normal, Temple, Healing, Shop, Guild)
- **Terrain Type** (optional: Forest, Mountain, Water, etc.)

**UI Layout**:
```
┌─ Room Editor ──────────────────────┐
│ Vnum: [1000________________]        │
│ Name: [Town Square_________]        │
│                                      │
│ Description:                         │
│ ┌──────────────────────────────────┐│
│ │You stand in the town square.     ││
│ │ The air is cool and fresh.       ││
│ │                                  ││
│ │ [Monaco Editor - Full Features] ││
│ └──────────────────────────────────┘│
│                                      │
│ Flags: ☑ SAFE ☐ DARK ☐ PRIVATE   │
│        ☐ NO_MOB ☐ NO_BOT ☐ PK_OK  │
│                                      │
│ Type: [Normal▼]  Terrain: [Any▼]  │
│                                      │
│ [Save] [Cancel] [Preview]           │
└────────────────────────────────────┘
```

#### **1.4 Room Connection Editor**

Edit exits in a structured format:
- Direction dropdown (N, S, E, W, U, D, NE, NW, SE, SW)
- Target room vnum (auto-complete from area)
- Exit description (optional)
- Door type (no door, normal door, locked door, hidden door)

**UI Layout**:
```
┌─ Exits ────────────────────────┐
│ North    → [1002] (normal)     │
│ South    → [1004] (locked)     │
│ East     → [1003] (no door)    │
│ West     → [----] (unused)     │
│ Up       → [1010] (normal)     │
│ Down     → [----] (unused)     │
│                                 │
│ [+ Add Exit]                   │
│ [Auto-Connect N/S/E/W]         │
└─────────────────────────────────┘
```

**Smart Features**:
- **Auto-connect**: If room 1001 goes NORTH to 1002, auto-add SOUTH exit from 1002 to 1001
- Validate vnums (must exist in area)
- Warn on circular connections

---

### Phase 2: Advanced Room Features

#### **2.1 NPC Editor**

Add/edit mobs that spawn in room:
- Mobile vnum (reference from mob section)
- Spawn chance (%)
- Spawn limit (max concurrent)
- Aggression level (aggressive, passive, defensive)

**UI**:
```
┌─ NPCs in Room ─────────────────┐
│ ☑ Innkeeper (vnum 2001)        │
│   [Spawn: 100%] [Limit: 1]     │
│   [Edit] [Remove]              │
│                                 │
│ ☑ Bard (vnum 2003)             │
│   [Spawn: 50%] [Limit: 2]      │
│   [Edit] [Remove]              │
│                                 │
│ [+ Add NPC]                    │
└─────────────────────────────────┘
```

#### **2.2 Object Editor**

Add/edit items in room:
- Object vnum
- Max quantity
- Respawn timer (ticks)
- Loot probability

**UI**:
```
┌─ Objects in Room ──────────────┐
│ ☑ Gold (vnum 3001)             │
│   [Max: 10] [Respawn: 20]       │
│   [Edit] [Remove]              │
│                                 │
│ ☑ Potion (vnum 3002)           │
│   [Max: 5] [Respawn: 30]        │
│   [Edit] [Remove]              │
│                                 │
│ [+ Add Object]                 │
└─────────────────────────────────┘
```

#### **2.3 3D Room Preview**

Show a 3D preview of the room layout:
- Use Three.js or Babylon.js
- Render room as 3D box with exits as doors
- Show NPCs and objects as icons
- Interactive: click to select elements

```
     ┌─────────────────┐
    /│      ROOM       /│
   / │  (1000)        / │
  ┌─────────────────┐  │
  │ [NPC] [OBJ]    │ /
  │                │/
  └─────────────────┘
   (exits shown as arrows)
```

---

### Phase 3: Bulk Operations

#### **3.1 Area-Wide Operations**

- **Renumber vnums**: Shift all room vnums up/down (when copying area)
- **Replace text**: Find/replace in all room descriptions
- **Bulk edit flags**: Apply flag to multiple rooms
- **Copy area**: Duplicate entire area with new vnums

#### **3.2 Templates**

Pre-made room templates:
- Tavern (exits, NPC innkeeper, objects)
- Temple (healing location, safe flag, healer NPC)
- Shop (NPC shopkeeper, objects for sale)
- Guild Hall (safe, dedicated NPCs)
- Outdoor (exposed to weather/PK, etc.)

Click template → select rooms → apply

#### **3.3 Auto-Layout**

Intelligent room organization:
- Create grid of rooms (5x5, 10x10, etc.)
- Auto-connect adjacent rooms
- Assign sequential vnums
- Generate basic descriptions

---

## File Format Handling

### ROM 2.4 .are File Format

Current format (from existing area files):
```
#AREA
Name of Area~
Author Name~
Level range~
vnumrange~

#ROOMS
#1000
Main Room~
This is a longer description of the room.
It can span multiple lines.
~
[-1 -1 -1 -1 -1 -1 -1 -1 -1 -1]
[0 0 0 0 0 0 0 0 0 0]
S

#1001
Second Room~
Another room description~
[-1 1000 -1 -1 -1 -1 -1 -1 -1 -1]
[0 0 0 0 0 0 0 0 0 0]
S

#MOBILES
#2000
innkeeper~
The innkeeper~
townspeople innkeeper barkeep~
A grizzled innkeeper stands behind the bar.
~
...

#OBJECTS
#3000
key~
a rusty key~
key rusty~
A rusty iron key sits here.
~
...

#$
```

### Parser Strategy

**Frontend**:
- Minimal parsing (send to backend)

**Backend**:
```javascript
class AreParser {
  parse(content) {
    // Split by #SECTION
    // Extract ROOMS section and parse each room
    // Extract MOBILES section and parse each mob
    // Extract OBJECTS section and parse each object
    // Return structured data
    {
      rooms: [ {vnum, name, desc, exits[], flags} ],
      mobiles: [ {vnum, name, short, long, ...} ],
      objects: [ {vnum, name, ...} ]
    }
  }
  
  generate(data) {
    // Reverse process: take structured data
    // Output valid .are file format
    // Write to disk
  }
}
```

**Data Structure**:
```javascript
{
  area: {
    name: "Midgaard",
    author: "Kahn",
    levelRange: "1-20",
    vnumRange: [1000, 1999]
  },
  rooms: [
    {
      vnum: 1000,
      name: "Main Square",
      desc: "You stand in the town square...",
      flags: ["SAFE"],
      type: "outdoor",
      exits: [
        { direction: "north", targetVnum: 1002, doorType: "normal" },
        { direction: "south", targetVnum: 1004, doorType: "locked" }
      ],
      npcs: [
        { vnum: 2001, spawnChance: 100, limit: 1 }
      ],
      objects: [
        { vnum: 3001, max: 5, respawnTime: 20 }
      ]
    },
    // ... more rooms
  ],
  mobiles: [ /* ... */ ],
  objects: [ /* ... */ ]
}
```

---

## User Workflow

### Scenario 1: Create New Area from Scratch

```
1. Click [+ New Area]
2. Enter area name: "Dragon's Lair"
3. Enter vnum range: 5000-5099
4. Click [Create]
   → Empty 10x10 grid appears

5. Click [+ Create Room] or Right-click grid
6. New room spawn at click location
   → Room 5000 created, selected
   
7. Edit properties in panel:
   - Name: "Dragon's Chamber"
   - Desc: "An ancient chamber where..."
   - Type: "Boss_Arena"
   
8. Arrow keys or click neighbors to create exits:
   → Press RIGHT ARROW → New room 5001 created (East of 5000)
   → Room 5001 automatically has WEST exit back to 5000
   
9. Left-click room 5001, repeat step 7-8
10. Continue building area

11. Click [NPC Editor] on room 5000
    → Add boss dragon NPC
    
12. Click [Save Area]
    → Backup created: dragon_lair_backup.are
    → dragon_lair.are written to area/
    → Success message
    
13. area.lst auto-updated with new area (or prompt user)
```

### Scenario 2: Edit Existing Area

```
1. Click [Select Area] dropdown
2. Choose "sect_halls.are"
   → Loads 24 rooms in grid
   → Shows 8 sect hall groups visually
   
3. Click on room 8000 (Aethelhelm Hall)
   → Properties panel shows current data
   
4. Edit description in Monaco editor
   → Full syntax highlighting possible
   
5. Right-click on NPC row → [Edit NPC]
   → Opens NPC editing dialog
   
6. Click [Preview 3D] → Shows room in 3D context
   
7. Click [Save Area] → sect_halls.are updated
```

### Scenario 3: Bulk Operations

```
1. Area loaded: midgaard.are
2. Click [Tools] → [Find & Replace]
3. Find: "muddy" Replace: "dusty"
4. Search scope: [All rooms]
5. Results: "Found 12 matches in 5 rooms"
6. Click [Replace All]
   → Confirmation: "Updated 12 instances"
   
OR

1. Click [Tools] → [Copy Area]
2. Select source: "midgaard.are"
3. Enter new name: "midgaard_v2"
4. Shift vnums by: 100
   → 1000-1999 becomes 1100-1199
5. All connected vnums updated automatically
6. New file created: "midgaard_v2.are"
```

---

## Technical Specifications

### Frontend Stack

```
package.json dependencies:
  - react ^18.0 (UI framework)
  - react-redux (state management)
  - @reduxjs/toolkit (Redux utilities)
  - axios (HTTP requests)
  - tailwindcss (styling)
  - @monaco-editor/react (code editor)
  - three.js (3D visualization)
  - react-grid-layout (room grid)
  - zustand (optional alternative to Redux)
  
build tools:
  - Create React App (vite for faster builds)
  - tailwindcss cli
  - typescript (optional, for type safety)
```

### Backend Stack

```
package.json dependencies:
  - express ^4.18 (web server)
  - cors (cross-origin requests)
  - dotenv (config)
  - js-yaml (YAML parsing, if using YAML format)
  - chokidar (file watching)
  - fs-extra (file system utilities)
  - uuid (unique IDs)
  
  optional:
    - socket.io (WebSocket for live collaboration)
    - git (version control integration)
```

### Project Structure

```
world-builder/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AreaBrowser.jsx
│   │   │   ├── RoomGrid.jsx
│   │   │   ├── PropertyPanel.jsx
│   │   │   ├── NPCEditor.jsx
│   │   │   ├── ObjectEditor.jsx
│   │   │   ├── RoomPreview3D.jsx
│   │   │   └── ToolsPanel.jsx
│   │   ├── pages/
│   │   │   └── Editor.jsx
│   │   ├── store/
│   │   │   ├── areaSlice.js
│   │   │   ├── roomSlice.js
│   │   │   └── store.js
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── areas.js
│   │   │   ├── rooms.js
│   │   │   ├── npcs.js
│   │   │   └── objects.js
│   │   ├── services/
│   │   │   ├── AreParser.js
│   │   │   ├── AreGenerator.js
│   │   │   └── FileManager.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── app.js
│   │   └── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

---

## Phased Implementation Plan

### **Phase 1: MVP (Week 1-2)**
- Area loading (parse .are files)
- Room grid visualization (2D)
- Basic property editor
- Save room changes back to .are file
- **Deliverable**: Can load area, edit room names/desc, save

### **Phase 2: Full Editing (Week 3)**
- Exit editor with auto-connect
- NPC editor (add/remove/edit)
- Object editor
- Room flags and types
- **Deliverable**: Complete room creation workflow

### **Phase 3: Advanced Features (Week 4)**
- 3D room preview
- Bulk operations (find/replace)
- Area templates
- Import/export
- **Deliverable**: Professional-grade area builder

### **Phase 4: Collaboration (Future)**
- WebSocket live editing (multiple builders simultaneously)
- Version control integration (git)
- Undo/redo system
- Change history viewing

---

## Deployment Options

### Option 1: Local Desktop App (RECOMMENDED FOR PHASE 1)
```bash
# Install Node.js
# Clone repo
git clone <world-builder-repo>
cd world-builder

# Install & Run
npm install
npm start

# Opens browser to http://localhost:3000
# Automatically connects to backend
# Edits area/ files directly on disk
```

### Option 2: Web Service (For Team Collaboration)
- Deploy backend to server
- Authenticated user accounts
- Multi-user editing with conflict resolution
- Future enhancement

---

## Success Metrics

**Phase 1 Complete When**:
- ✅ Can load any existing .are file
- ✅ Can edit room properties visually
- ✅ Can save changes to disk
- ✅ No data loss or corruption
- ✅ Area.lst remains compatible

**Phase 2 Complete When**:
- ✅ Can create new rooms with arrow keys
- ✅ No manual vnum conflicts
- ✅ Exits auto-connect (bi-directional)
- ✅ NPCs/Objects editable in GUI
- ✅ Can create complete area without editing text

**Phase 3 Complete When**:
- ✅ 3D preview renders rooms accurately
- ✅ Area creation speed 10x faster than manual
- ✅ Bulk operations work reliably
- ✅ Templates save builder time
- ✅ No .are file syntax errors

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| .are file parsing errors | Comprehensive test suite, backup before save |
| Data loss | Version control, backup files, undo/redo |
| Performance (100+ rooms) | Lazy loading, virtual grid, pagination |
| User confusion | Onboarding tutorial, help buttons, tooltips |
| .are format changes | Abstraction layer, flexible parser |

---

## Tools & Libraries Summary

```
Essential:
  ✅ React - Build interactive UI
  ✅ Express - Handle file I/O
  ✅ Three.js - 3D visualization
  ✅ Monaco Editor - Professional code editing
  ✅ TailwindCSS - Rapid UI development

Optional Enhancements:
  ? Socket.io - Live collaboration
  ? Git integration - Version control
  ? Electron - Desktop app wrapper
  ? TypeScript - Type safety
  ? Jest - Testing framework
```

---

## Next Steps

**When approved, Phase 1 implementation will:**
1. Create `/world-builder` directory
2. Initialize Node.js project with React + Express
3. Build AreParser class to handle file I/O
4. Create basic UI components
5. Test with existing area/ files
6. Integrate into development workflow

**Estimated effort**: 
- Phase 1 (MVP): 40-60 hours
- Phase 2 (Full): 20-30 hours  
- Phase 3 (Advanced): 20-40 hours
- Total: 80-130 hours for production-ready builder

---

**Document Status**: Design Phase Complete - Ready for Approval

**Next Action**: Feedback on approach → Begin Phase 1 Implementation
