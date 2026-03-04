# World Builder API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
No authentication required (local development)

## Response Format
All responses are JSON with the following structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Or on error:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Areas Endpoints

### List All Areas
```
GET /areas
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "midgaard",
      "file": "midgaard.are",
      "size": 45678,
      "roomCount": 156,
      "lastModified": "2024-03-03T12:00:00Z"
    }
  ]
}
```

---

### Load Area
```
GET /areas/:areaName
```

**Parameters:**
- `areaName` (string): Name of area without .are extension

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "midgaard",
    "version": "2.4",
    "roomCount": 156,
    "rooms": [
      {
        "vnum": 3000,
        "name": "The Temple",
        "description": "...",
        "flags": "SAFE",
        "type": "CITY",
        "exits": [
          {
            "direction": "north",
            "targetVnum": 3001
          }
        ]
      }
    ]
  }
}
```

---

### Create Area
```
POST /areas
Content-Type: application/json
```

**Body:**
```json
{
  "name": "newarea",
  "version": "2.4"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "newarea",
    "file": "newarea.are",
    "created": "2024-03-03T12:00:00Z"
  },
  "message": "Area created successfully"
}
```

---

### Save Area
```
PUT /areas/:areaName
Content-Type: application/json
```

**Parameters:**
- `areaName` (string): Name of area to save

**Body:**
```json
{
  "version": "2.4",
  "rooms": [
    {
      "vnum": 3000,
      "name": "The Temple",
      "description": "...",
      "flags": "SAFE",
      "type": "CITY",
      "exits": []
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Area saved successfully",
  "data": {
    "file": "midgaard.are",
    "backup": "midgaard.are.bak",
    "size": 45678,
    "saved": "2024-03-03T12:00:00Z"
  }
}
```

**Notes:**
- Backup created automatically before saving
- Overwrite existing area if name matches

---

### Delete Area
```
DELETE /areas/:areaName
```

**Parameters:**
- `areaName` (string): Name of area to delete

**Response:**
```json
{
  "success": true,
  "message": "Area deleted successfully",
  "data": {
    "file": "midgaard.are",
    "deletedAt": "2024-03-03T12:00:00Z"
  }
}
```

**Notes:**
- Backup is NOT deleted
- Area file moved to trash (configurable)

---

## Rooms Endpoints

### Create Room
```
POST /areas/:areaName/rooms
Content-Type: application/json
```

**Parameters:**
- `areaName` (string): Parent area name

**Body:**
```json
{
  "vnum": 3001,
  "name": "Town Square",
  "description": "You are in the town square.",
  "type": "CITY",
  "flags": "SAFE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vnum": 3001,
    "name": "Town Square",
    "exits": []
  },
  "message": "Room created successfully"
}
```

---

### Update Room
```
PUT /areas/:areaName/rooms/:vnum
Content-Type: application/json
```

**Parameters:**
- `areaName` (string): Parent area name
- `vnum` (number): Room virtual number

**Body:**
```json
{
  "name": "Updated Room Name",
  "description": "Updated description...",
  "type": "CITY",
  "flags": "SAFE,NO_SUMMON"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vnum": 3001,
    "name": "Updated Room Name",
    "description": "Updated description...",
    "type": "CITY",
    "flags": "SAFE,NO_SUMMON"
  }
}
```

---

### Delete Room
```
DELETE /areas/:areaName/rooms/:vnum
```

**Parameters:**
- `areaName` (string): Parent area name
- `vnum` (number): Room to delete

**Response:**
```json
{
  "success": true,
  "message": "Room deleted successfully",
  "data": {
    "vnum": 3001,
    "name": "Town Square"
  }
}
```

---

### Add Exit
```
POST /areas/:areaName/rooms/:vnum/exits
Content-Type: application/json
```

**Parameters:**
- `areaName` (string): Parent area name
- `vnum` (number): Room with exit

**Body:**
```json
{
  "direction": "north",
  "targetVnum": 3002,
  "reciprocal": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "from": 3001,
    "to": 3002,
    "direction": "north",
    "reciprocal": true
  },
  "message": "Exit added successfully"
}
```

**Directions:**
- `north`, `south`, `east`, `west`
- `northeast`, `northwest`, `southeast`, `southwest`
- `up`, `down`

**Notes:**
- If `reciprocal: true`, automatically adds return exit
- Example: room 3001 north→3002 also adds 3002 south→3001

---

### Remove Exit
```
DELETE /areas/:areaName/rooms/:vnum/exits
Content-Type: application/json
```

**Parameters:**
- `areaName` (string): Parent area name
- `vnum` (number): Room with exit

**Body:**
```json
{
  "direction": "north",
  "removeReciprocal": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exit removed successfully",
  "data": {
    "from": 3001,
    "removedDirection": "north",
    "reciprocalRemoved": true
  }
}
```

---

## Data Types

### Room Object
```json
{
  "vnum": 3001,
  "name": "Town Square",
  "description": "You are in a large town square...",
  "type": "CITY",
  "flags": "SAFE,NO_SUMMON",
  "exits": [
    {
      "direction": "north",
      "targetVnum": 3002
    },
    {
      "direction": "east",
      "targetVnum": 3003
    }
  ]
}
```

### Exit Object
```json
{
  "direction": "north",
  "targetVnum": 3002,
  "description": "A winding path leads north"
}
```

### Area Object
```json
{
  "name": "midgaard",
  "version": "2.4",
  "roomCount": 156,
  "rooms": [ /* Room objects */ ],
  "mobs": [],
  "mobprogs": [],
  "objects": [],
  "resetcommands": []
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request data",
  "details": "Area name is required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Area not found",
  "details": "Area 'nonexistent' does not exist"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Server error",
  "details": "Failed to save area: permission denied"
}
```

---

## Common Status Codes

| Code | Meaning |
|------|---------|
| 200  | OK - Request successful |
| 201  | Created - Resource created |
| 400  | Bad Request - Invalid parameters |
| 404  | Not Found - Resource doesn't exist |
| 409  | Conflict - Area already exists |
| 422  | Unprocessable - Invalid data format |
| 500  | Server Error |

---

## Usage Examples

### JavaScript/Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// List areas
const areas = await api.get('/areas');

// Load area
const area = await api.get('/areas/midgaard');

// Create room
await api.post('/areas/midgaard/rooms', {
  vnum: 3001,
  name: 'Town Square',
  description: 'A large town square.',
  type: 'CITY',
  flags: 'SAFE'
});

// Add exit
await api.post('/areas/midgaard/rooms/3001/exits', {
  direction: 'north',
  targetVnum: 3002,
  reciprocal: true
});

// Save area
await api.put('/areas/midgaard', area.data);
```

### cURL
```bash
# List areas
curl http://localhost:5000/api/areas

# Load area
curl http://localhost:5000/api/areas/midgaard

# Create room
curl -X POST http://localhost:5000/api/areas/midgaard/rooms \
  -H "Content-Type: application/json" \
  -d '{"vnum":3001,"name":"Town Square","description":"A large town square.","type":"CITY","flags":"SAFE"}'

# Save area
curl -X PUT http://localhost:5000/api/areas/midgaard \
  -H "Content-Type: application/json" \
  -d @area-data.json
```

---

## Rate Limiting
Not implemented (local development)

## CORS
Enabled for all origins (local development)

## File Format
- **Input/Output**: ROM .are file format
- **Internal**: JSON
- **Parser**: Custom AreParser (ROM 2.4 compatible)

---

## WebSocket Support
Not currently implemented (planned for Phase 2)

## Real-time Updates
Not currently implemented (planned for Phase 2)

---

**API Version:** 1.0.0  
**Last Updated:** 2024-03-03  
**Status:** Development
