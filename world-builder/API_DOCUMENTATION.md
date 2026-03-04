# ROM World Builder API Documentation

## Overview

The ROM World Builder backend provides a comprehensive REST API for managing ROM MUD area files. All endpoints accept and return JSON.

**Base URL:** `http://localhost:3001/api`

**Response Format:**
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  "message": "Optional success message",
  "errors": [] /* validation errors if any */
}
```

---

## Area Management

### List Areas
```
GET /api/areas
```
Returns all available areas in the `area/` directory.

**Response:**
```json
{
  "success": true,
  "data": {
    "areas": [
      { "name": "midgaard", "author": "ROM", "level_range": "1-50", "mobiles": 45, "objects": 80, "rooms": 120 },
      { "name": "school", "author": "ROM", "level_range": "1-10", "mobiles": 12, "objects": 25, "rooms": 40 }
    ]
  }
}
```

### Load Area
```
GET /api/areas/:name
```
Loads a complete area with all entities.

**Parameters:**
- `name` - Area filename without `.are` extension

**Response:**
```json
{
  "success": true,
  "data": {
    "area": {
      "name": "midgaard",
      "author": "ROM",
      "level_range": "1-50",
      "infos": { /* miscellaneous area metadata */ },
      "rooms": [ /* array of room objects */ ],
      "mobiles": [ /* array of mobile objects */ ],
      "objects": [ /* array of object objects */ ],
      "resets": [ /* array of reset command objects */ ],
      "shops": [ /* array of shop objects */ ],
      "specials": [ /* array of special objects */ ]
    }
  }
}
```

### Save Area
```
POST /api/areas/:name/save
```
Persists area data to disk with backup creation.

**Request Body:** None (uses current store state)

**Response:**
```json
{
  "success": true,
  "message": "Area 'midgaard' saved successfully",
  "data": {
    "backupPath": "/area/.backups/midgaard.are.backup.20260303_140530"
  }
}
```

### Reload Area
```
POST /api/areas/:name/load
```
Reloads area from disk, discarding unsaved changes.

**Response:**
```json
{
  "success": true,
  "message": "Area reloaded from disk"
}
```

---

## Room Management

### Create Room
```
POST /api/areas/:areaName/rooms
```

**Request Body:**
```json
{
  "vnum": 3001,
  "name": "The Golden Griffin Inn",
  "desc": "The common room is large and active.",
  "rawRoomFlags": "0 0 0"
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "data": { "room": { /* created room object */ } }
}
```

### Update Room
```
PUT /api/areas/:areaName/rooms/:vnum
```

**Request Body:** (any subset of room fields)
```json
{
  "name": "Updated Name",
  "desc": "Updated description."
}
```

### Delete Room
```
DELETE /api/areas/:areaName/rooms/:vnum
```

**Response:** (204 No Content)

---

## Exit Management

### Create Exit
```
POST /api/areas/:areaName/rooms/:vnum/exits
```

**Request Body:**
```json
{
  "direction": "north",
  "targetVnum": 3002,
  "doorType": "none",
  "lockFlags": 0,
  "keyVnum": -1,
  "keyword": "door",
  "desc": "The north exit leads deeper into the inn."
}
```

**Directions:** `north`, `south`, `east`, `west`, `up`, `down`

**Door Types:** `none` | `door`

**Lock Flags:** `0` (open) | `1` (closed) | `2` (locked)

### Update Exit
```
PUT /api/areas/:areaName/rooms/:vnum/exits/:direction
```

**Request Body:** (any subset of exit fields)
```json
{
  "doorType": "door",
  "lockFlags": 1
}
```

### Delete Exit
```
DELETE /api/areas/:areaName/rooms/:vnum/exits/:direction
```

---

## Mobile Management

### Create Mobile
```
POST /api/areas/:areaName/mobiles
```

**Request Body:**
```json
{
  "vnum": 10001,
  "keywords": "gnome warrior",
  "short_description": "the gnome warrior",
  "long_description": "A small gnome warrior stands here.",
  "race": "gnome",
  "sex": "male",
  "body_type": "humanoid",
  "alignment": 0,
  "level": 5,
  "max_hp": 30,
  "ac": 6,
  "attacks": [],
  "act_flags": "",
  "affect_flags": ""
}
```

### Get All Mobiles
```
GET /api/areas/:areaName/mobiles
```

### Update Mobile
```
PUT /api/areas/:areaName/mobiles/:vnum
```

### Delete Mobile
```
DELETE /api/areas/:areaName/mobiles/:vnum
```

---

## Object Management

### Create Object
```
POST /api/areas/:areaName/objects
```

**Request Body:**
```json
{
  "vnum": 10001,
  "name": "longsword",
  "short_description": "a longsword",
  "long_description": "A shiny longsword lies here.",
  "item_type": 7,
  "wear_flags": 2,
  "extra_flags": 0,
  "values": [0, 0, 0, 0],
  "weight": 25,
  "cost": 2500,
  "level": 0,
  "condition": 100
}
```

**Item Types:**
- 1: Light
- 2: Scroll
- 3: Wand
- 4: Staff
- 5: Weapon
- 6: Treasure
- 7: Armor
- 8: Potion
- 9: Clothing
- 10: Furniture
- 11: Trash
- 12: Container
- 13: Drink Container
- 14: Key
- 15: Food
- 16: Money
- 17: Boat
- 18: NPC Corpse
- 19: PC Corpse
- 20: Fountain
- 21: Pill
- 22: Blood
- 23: Flower

### Get All Objects
```
GET /api/areas/:areaName/objects
```

### Update Object
```
PUT /api/areas/:areaName/objects/:vnum
```

### Delete Object
```
DELETE /api/areas/:areaName/objects/:vnum
```

---

## Reset Management

### Create Reset
```
POST /api/areas/:areaName/resets
```

**Request Body:**
```json
{
  "command": "M",
  "arg1": 10001,
  "arg3": 3001,
  "arg4": 1,
  "arg5": 3
}
```

**Reset Commands:**

**M - Load Mobile**
- `arg1`: Mobile vnum
- `arg3`: Room vnum
- `arg4`: Max in room (1-255)
- `arg5`: Max in world (1-255)

**O - Place Object**
- `arg1`: Object vnum
- `arg3`: Room vnum
- `arg5`: Max exists (1-255)

**G - Give to Mobile**
- `arg1`: Object vnum
- `arg5`: Max exists (1-255)

**E - Equip Mobile**
- `arg1`: Object vnum
- `arg2`: Wear location (0-17)
- `arg5`: Max exists (1-255)

**P - Put in Container**
- `arg1`: Object vnum
- `arg3`: Container vnum
- `arg5`: Max exists (1-255)

**D - Set Door State**
- `arg3`: Room vnum
- `arg4`: Direction (0=N, 1=S, 2=E, 3=W, 4=U, 5=D)
- `arg5`: State (0=open, 1=closed, 2=locked)

**R - Randomize Exits**
- `arg3`: Room vnum
- `arg5`: Number of exits (1-6)

### Update All Resets
```
PUT /api/areas/:areaName/resets
```

**Request Body:**
```json
{
  "resets": [
    { "command": "M", "arg1": 10001, "arg3": 3001, "arg5": 1 },
    { "command": "O", "arg1": 10002, "arg3": 3001, "arg5": 1 }
  ]
}
```

---

## Placement Workflows

### Place Mobile
```
POST /api/areas/:areaName/placement/mobile
```

**Request Body:**
```json
{
  "mobile_vnum": 10001,
  "room_vnum": 3001,
  "max_in_world": 2,
  "max_in_room": 1,
  "equipment": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resets": [
      { "command": "M", "arg1": 10001, "arg3": 3001, "arg4": 1, "arg5": 2 },
      { "command": "E", "arg1": 10002, "arg2": 4, "arg5": 1 }
    ]
  }
}
```

### Place Object
```
POST /api/areas/:areaName/placement/object
```

**Request Body:**
```json
{
  "object_vnum": 10001,
  "room_vnum": 3001,
  "max_exists": 1
}
```

---

## Validation

### Validate Area
```
POST /api/areas/:areaName/validate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": [],
    "warnings": [
      "Mobile 10001 has no items equipped",
      "Room 3001 has no exits"
    ]
  }
}
```

---

## Wear Locations

Used with Equipment (E reset command):

```
0: Light (head)
1: Finger Right
2: Finger Left
3: Neck 1
4: Neck 2
5: Body
6: Head
7: Legs
8: Feet
9: Hands
10: Arms
11: Shield (right hand)
12: Torso
13: Waist
14: Wrist Right
15: Wrist Left
16: Wield (primary weapon)
17: Hold (secondary/shield)
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Description of what went wrong",
  "errors": [
    "Mobile vnum 99999 not found",
    "Room vnum 3000 not found in target area"
  ]
}
```

**HTTP Status Codes:**
- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Examples

### Complete Placement Workflow

1. **Create a room:**
```bash
curl -X POST http://localhost:3001/api/areas/test/rooms \
  -H "Content-Type: application/json" \
  -d '{"vnum": 3001, "name": "Test Room", "desc": "A test room."}'
```

2. **Create a mobile:**
```bash
curl -X POST http://localhost:3001/api/areas/test/mobiles \
  -H "Content-Type: application/json" \
  -d '{
    "vnum": 10001,
    "keywords": "gnome warrior",
    "short_description": "the gnome warrior",
    "long_description": "A gnome warrior.",
    "level": 5
  }'
```

3. **Place the mobile in the room:**
```bash
curl -X POST http://localhost:3001/api/areas/test/placement/mobile \
  -H "Content-Type: application/json" \
  -d '{
    "mobile_vnum": 10001,
    "room_vnum": 3001,
    "max_in_world": 1,
    "max_in_room": 1
  }'
```

4. **Save the area:**
```bash
curl -X POST http://localhost:3001/api/areas/test/save
```

---

## Rate Limiting

No rate limiting is currently imposed. All endpoints are synchronous and respond immediately.

---

## Versioning

Current API version: **1.0**

Future changes will maintain backward compatibility or clearly deprecate endpoints.
