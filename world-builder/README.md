# ROM 2.4 World Builder

**Graphical Area & Room Editor for ROM MUD**

A modern web-based GUI editor for creating and editing ROM .are area files. Create complex areas with point-and-click simplicity instead of manually editing text files.

## Features

✅ **Area Management**
- List all areas in one place
- Create new areas with custom vnum ranges
- Load existing areas for editing
- Delete areas (with backup)

✅ **Room Editing**
- 2D grid visualization of room layout
- Click to select and edit room properties
- Add/remove rooms with auto-numbering
- Full ASCII description editor

✅ **Exit Management**  
- Visual exit editor (N, S, E, W, U, D)
- Auto-bidirectional exits (add N → auto-adds S)
- Point-and-click exit creation
- No manual vnum entry required

✅ **Advanced Features**
- Real-time validation
- Automatic backup before saves
- Error messages and notifications
- Responsive design (desktop & tablets)

## Quick Start

### Prerequisites
- Node.js 16+ (LTS)
- npm or yarn
- ROM 2.4 MUD installation with area/ directory

### Installation

```bash
cd world-builder

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ../..
```

### Running the Builder

**Terminal 1: Start Backend API**
```bash
cd world-builder/backend
npm start
# API runs on http://localhost:5000
```

**Terminal 2: Start Frontend (leave running)**
```bash
cd world-builder/frontend
npm start
# App opens on http://localhost:3000
```

That's it! Both services should start automatically.

## Usage

### Creating a New Area

1. Click **"+ New Area"** in left panel
2. Enter area name (e.g., `dragon_lair`)
3. Click **"Create"** → Area created and loaded

### Building Your Area

1. Click **"+ New Room"** to add first room
2. Select room in grid → Edit properties on right
3. Set room name and description
4. Click **"Exits"** section → Add exits to connect rooms
5. Click **"Save"** when done

### Editing Existing Areas

1. Select area from left panel → Loads all rooms
2. Click room in grid to select it
3. Edit properties on right side
4. Click **"Save"** to persist changes

### Exiting Connections

When you add an exit from Room 1001 **NORTH** to 1002:
- Room 1001 gets exit N→1002
- Room 1002 automatically gets exit S→1001
- Saves you manual work!

## Architecture

```
world-builder/
├── backend/
│   ├── src/
│   │   ├── services/      (AreParser, AreGenerator, FileManager)
│   │   ├── routes/        (API endpoints)
│   │   └── server.js      (Express app)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/    (React UI components)
│   │   ├── pages/         (Page views)
│   │   ├── store/         (Zustand state management)
│   │   ├── api/           (HTTP client)
│   │   └── App.jsx        (Root component)
│   └── package.json
```

## API Reference

### Areas

- `GET /api/areas` - List all areas
- `GET /api/areas/:name` - Load specific area
- `POST /api/areas` - Create new area
- `PUT /api/areas/:name` - Save area
- `DELETE /api/areas/:name` - Delete area

### Rooms

- `POST /api/rooms` - Create room
- `PUT /api/rooms/:vnum` - Update room
- `DELETE /api/rooms/:vnum` - Delete room
- `POST /api/rooms/:vnum/exits` - Add exit
- `DELETE /api/rooms/:vnum/exits/:direction` - Remove exit

## File Format

The builder reads and writes standard ROM .are format:

```
#AREA
Dragon's Lair~
Builder~
20-40~
5000 5099~

#ROOMS
#5000
Dragon's Throne~
The lair of an ancient dragon.~
[-1 -1 5001 -1 5010 -1 -1 -1 -1 -1]
[0 0 0 0 0 0 0 0 0 0]
S

#5001
Guard Chamber~
Where the dragon's minions dwell.~
[5000 -1 -1 -1 -1 -1 -1 -1 -1 -1]
[0 0 0 0 0 0 0 0 0 0]
S

#$
```

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -an | grep 5000

# Kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

### Frontend can't connect to API
- Make sure backend is running on http://localhost:5000
- Check `frontend/.env` has correct `REACT_APP_API_URL`
- Check browser console for errors (F12)

### Area file won't save
- Check `world-builder/backend/src/services/FileManager.js` AREA_DIR path
- Ensure area/ directory exists and is readable
- Check file permissions on area/ folder

### Lost unsaved changes
- Backend auto-saves when you click "Save"
- Auto-backup created before each save
- Check for `.backup` files in area/ directory

## Development

### Building for Production

```bash
# Backend: Already runs in Node.js

# Frontend: Build React app
cd frontend
npm run build
# Creates optimized build/ folder
# Ready to serve with Express
```

### Running Tests

```bash
# Frontend tests
cd frontend
npm test

# Backend: Add tests later
```

## Future Enhancements

- [ ] NPC/Object editor
- [ ] 3D room preview
- [ ] Undo/redo system
- [ ] Multi-user editing
- [ ] Git integration
- [ ] Area templates
- [ ] Bulk operations (find/replace)
- [ ] Mob/object database browser

## Support

**Issues?** Check the logs:
```bash
# Backend logs
tail -f backend/server.log

# Frontend browser console
Press F12 in browser
```

**Questions?** Review:
- WORLD_BUILDER_DESIGN.md (architecture doc)
- Component comments in source files
- API route handlers

## License

Part of ROM 2.4 QuickMUD conversion project.

---

**Happy building! 🗺️**

Started: Phase 13 of ROP conversion
Status: MVP Complete (Phase 1)
