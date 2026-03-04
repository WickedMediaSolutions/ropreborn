/**
 * API Route: Rooms
 * Handles room operations within areas
 */

import express from 'express';

const router = express.Router();

const OPPOSITE_DIRECTION = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
  up: 'down',
  down: 'up',
};

function removeReverseExit(areaData, targetVnum, reverseDirection, sourceVnum) {
  const targetRoom = areaData.rooms.find(r => r.vnum === targetVnum);
  if (!targetRoom) return;

  targetRoom.exits = (targetRoom.exits || []).filter((exit) => {
    if (exit.direction !== reverseDirection) return true;
    return exit.targetVnum !== sourceVnum;
  });
}

function upsertReverseExit(areaData, sourceVnum, sourceExit) {
  const reverseDirection = OPPOSITE_DIRECTION[sourceExit.direction];
  if (!reverseDirection) return;

  const targetRoom = areaData.rooms.find(r => r.vnum === sourceExit.targetVnum);
  if (!targetRoom) return;

  const reverseExit = {
    direction: reverseDirection,
    targetVnum: sourceVnum,
    doorType: sourceExit.doorType || 'none',
    lockFlags: sourceExit.lockFlags || 0,
    keyVnum: Number.isInteger(sourceExit.keyVnum) ? sourceExit.keyVnum : -1,
    keyword: sourceExit.keyword || '',
    desc: sourceExit.desc || '',
  };

  const reverseIndex = (targetRoom.exits || []).findIndex(e => e.direction === reverseDirection);
  if (reverseIndex >= 0) {
    targetRoom.exits[reverseIndex] = {
      ...targetRoom.exits[reverseIndex],
      ...reverseExit,
    };
    return;
  }

  targetRoom.exits = targetRoom.exits || [];
  targetRoom.exits.push(reverseExit);
}

/**
 * GET /api/rooms
 * Get rooms from current area (passed via query)
 */
router.get('/', (req, res) => {
  try {
    // Rooms are retrieved as part of area loading
    res.json({ success: true, message: 'Load area first to get rooms' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rooms
 * Create a new room in an area (room data in body)
 */
router.post('/', (req, res) => {
  try {
    const { areaData, room } = req.body;

    if (!areaData || !room) {
      return res.status(400).json({ success: false, error: 'Area and room data required' });
    }

    // Check for vnum conflict
    if (areaData.rooms.some(r => r.vnum === room.vnum)) {
      return res.status(400).json({ success: false, error: `Room vnum ${room.vnum} already exists` });
    }

    // Add room
    const newRoom = {
      vnum: room.vnum,
      name: room.name || 'New Room',
      desc: room.desc || 'A generic room.',
      rawRoomFlags: room.rawRoomFlags || '0 0 0',
      flags: room.flags || [],
      type: room.type || 'normal',
      terrain: room.terrain || 'any',
      exits: room.exits || [],
      npcs: room.npcs || [],
      objects: room.objects || [],
      trailingDirectives: room.trailingDirectives || [],
    };

    areaData.rooms.push(newRoom);
    areaData.rooms.sort((a, b) => a.vnum - b.vnum);

    res.json({
      success: true,
      room: newRoom,
      areaData,
      message: `Created room ${room.vnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/rooms/:vnum
 * Update a specific room
 */
router.put('/:vnum', (req, res) => {
  try {
    const { vnum } = req.params;
    const { areaData, roomData } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const room = areaData.rooms.find(r => r.vnum === parseInt(vnum));
    if (!room) {
      return res.status(404).json({ success: false, error: `Room ${vnum} not found` });
    }

    // Update room properties
    Object.assign(room, roomData);

    res.json({
      success: true,
      room,
      areaData,
      message: `Updated room ${vnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/rooms/:vnum
 * Delete a room
 */
router.delete('/:vnum', (req, res) => {
  try {
    const { vnum } = req.params;
    const { areaData } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const index = areaData.rooms.findIndex(r => r.vnum === parseInt(vnum));
    if (index === -1) {
      return res.status(404).json({ success: false, error: `Room ${vnum} not found` });
    }

    areaData.rooms.splice(index, 1);

    // Remove any exits pointing to deleted room
    areaData.rooms.forEach(room => {
      room.exits = room.exits.filter(exit => exit.targetVnum !== parseInt(vnum));
    });

    res.json({
      success: true,
      areaData,
      message: `Deleted room ${vnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rooms/:vnum/exits
 * Add an exit to a room
 */
router.post('/:vnum/exits', (req, res) => {
  try {
    const { vnum } = req.params;
    const { areaData, exit } = req.body;

    if (!areaData || !exit) {
      return res.status(400).json({ success: false, error: 'Area and exit data required' });
    }

    const room = areaData.rooms.find(r => r.vnum === parseInt(vnum));
    if (!room) {
      return res.status(404).json({ success: false, error: `Room ${vnum} not found` });
    }

    // Check target room exists
    const targetRoom = areaData.rooms.find(r => r.vnum === exit.targetVnum);
    if (!targetRoom) {
      return res.status(400).json({ success: false, error: `Target room ${exit.targetVnum} not found` });
    }

    const direction = String(exit.direction || '').toLowerCase();
    if (!direction) {
      return res.status(400).json({ success: false, error: 'Exit direction required' });
    }

    if (room.exits.some(e => e.direction === direction)) {
      return res.status(400).json({ success: false, error: `Exit ${direction} already exists on room ${vnum}` });
    }

    const lockFlags = Number.isInteger(exit.lockFlags) ? exit.lockFlags : parseInt(exit.lockFlags || 0, 10) || 0;
    const keyVnum = Number.isInteger(exit.keyVnum) ? exit.keyVnum : parseInt(exit.keyVnum ?? -1, 10);

    const createdExit = {
      direction,
      targetVnum: exit.targetVnum,
      doorType: exit.doorType || (lockFlags > 0 || keyVnum >= 0 ? 'door' : 'none'),
      lockFlags,
      keyVnum: Number.isNaN(keyVnum) ? -1 : keyVnum,
      keyword: exit.keyword || '',
      desc: exit.desc || '',
    };

    room.exits.push(createdExit);

    if (exit.autoLink) {
      upsertReverseExit(areaData, room.vnum, createdExit);
    }

    res.json({
      success: true,
      room,
      areaData,
      message: `Added exit ${exit.direction} from room ${vnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/rooms/:vnum/exits/:direction
 * Update an existing exit on a room
 */
router.put('/:vnum/exits/:direction', (req, res) => {
  try {
    const { vnum, direction } = req.params;
    const { areaData, exitData } = req.body;

    if (!areaData || !exitData) {
      return res.status(400).json({ success: false, error: 'Area and exit data required' });
    }

    const room = areaData.rooms.find(r => r.vnum === parseInt(vnum));
    if (!room) {
      return res.status(404).json({ success: false, error: `Room ${vnum} not found` });
    }

    const index = room.exits.findIndex(e => e.direction === direction.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: `Exit ${direction} not found` });
    }

    const targetVnum = Number.isInteger(exitData.targetVnum)
      ? exitData.targetVnum
      : parseInt(exitData.targetVnum, 10);
    if (!Number.isInteger(targetVnum)) {
      return res.status(400).json({ success: false, error: 'Valid targetVnum required' });
    }

    const targetRoom = areaData.rooms.find(r => r.vnum === targetVnum);
    if (!targetRoom) {
      return res.status(400).json({ success: false, error: `Target room ${targetVnum} not found` });
    }

    const lockFlags = Number.isInteger(exitData.lockFlags)
      ? exitData.lockFlags
      : parseInt(exitData.lockFlags || 0, 10) || 0;
    const keyVnum = Number.isInteger(exitData.keyVnum)
      ? exitData.keyVnum
      : parseInt(exitData.keyVnum ?? -1, 10);

    const previousExit = { ...room.exits[index] };

    room.exits[index] = {
      ...room.exits[index],
      targetVnum,
      doorType: exitData.doorType || (lockFlags > 0 || keyVnum >= 0 ? 'door' : 'none'),
      lockFlags,
      keyVnum: Number.isNaN(keyVnum) ? -1 : keyVnum,
      keyword: exitData.keyword || '',
      desc: exitData.desc || '',
    };

    if (exitData.autoLink) {
      const reverseDirection = OPPOSITE_DIRECTION[direction.toLowerCase()];
      if (reverseDirection && previousExit.targetVnum !== room.exits[index].targetVnum) {
        removeReverseExit(areaData, previousExit.targetVnum, reverseDirection, room.vnum);
      }
      upsertReverseExit(areaData, room.vnum, room.exits[index]);
    }

    res.json({
      success: true,
      room,
      areaData,
      message: `Updated exit ${direction} on room ${vnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/rooms/:vnum/exits/:direction
 * Remove an exit from a room
 */
router.delete('/:vnum/exits/:direction', (req, res) => {
  try {
    const { vnum, direction } = req.params;
    const { areaData, options } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const room = areaData.rooms.find(r => r.vnum === parseInt(vnum));
    if (!room) {
      return res.status(404).json({ success: false, error: `Room ${vnum} not found` });
    }

    const index = room.exits.findIndex(e => e.direction === direction.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ success: false, error: `Exit ${direction} not found` });
    }

    const removedExit = room.exits[index];
    room.exits.splice(index, 1);

    if (options?.autoRemoveReverse) {
      const reverseDirection = OPPOSITE_DIRECTION[direction.toLowerCase()];
      if (reverseDirection && removedExit && Number.isInteger(removedExit.targetVnum)) {
        removeReverseExit(areaData, removedExit.targetVnum, reverseDirection, room.vnum);
      }
    }

    res.json({
      success: true,
      room,
      areaData,
      message: options?.autoRemoveReverse
        ? `Removed exit ${direction} and reverse link from room ${vnum}`
        : `Removed exit ${direction} from room ${vnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rooms/:vnum/place-mobile
 * Place a mobile in a room by creating appropriate reset commands
 * Body: { areaData, mobileVnum, maxInWorld, maxInRoom, equipmentObjects }
 */
router.post('/:vnum/place-mobile', (req, res) => {
  try {
    const { vnum } = req.params;
    const { areaData, mobileVnum, maxInWorld, maxInRoom, equipmentObjects } = req.body;

    if (!areaData || !mobileVnum) {
      return res.status(400).json({ 
        success: false, 
        error: 'Area data and mobile vnum required' 
      });
    }

    const roomVnum = parseInt(vnum, 10);
    const mobVnum = parseInt(mobileVnum, 10);

    // Verify room exists
    const room = (areaData.rooms || []).find(r => r.vnum === roomVnum);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: `Room ${roomVnum} not found` 
      });
    }

    // Verify mobile exists
    const mobile = (areaData.mobiles || []).find(m => m.vnum === mobVnum);
    if (!mobile) {
      return res.status(404).json({ 
        success: false, 
        error: `Mobile ${mobVnum} not found` 
      });
    }

    // Create M reset command
    const mReset = {
      command: 'M',
      comment: `Load ${mobile.short || mobile.keywords || `mobile ${mobVnum}`}`,
      arg1: 0, // Always 0 for M command
      arg2: mobVnum,
      arg3: maxInWorld || 1,
      arg4: roomVnum,
      arg5: maxInRoom || 1,
    };

    areaData.resets = areaData.resets || [];
    const mResetIndex = areaData.resets.length;
    areaData.resets.push(mReset);

    // Create E (equip) reset commands for equipment if provided
    if (equipmentObjects && Array.isArray(equipmentObjects)) {
      equipmentObjects.forEach(({ objectVnum, wearLocation, maxExists }) => {
        const obj = (areaData.objects || []).find(o => o.vnum === objectVnum);
        if (!obj) return;

        const eReset = {
          command: 'E',
          comment: `Equip ${obj.short || obj.keywords || `object ${objectVnum}`}`,
          arg1: 1, // Always 1 for E command
          arg2: objectVnum,
          arg3: maxExists || 1,
          arg4: wearLocation || 0, // Wear location (neck, body, legs, etc.)
          arg5: 0, // Always 0 for E command
        };

        areaData.resets.push(eReset);
      });
    }

    res.json({
      success: true,
      areaData,
      resetsCreated: areaData.resets.length - mResetIndex,
      message: `Placed mobile ${mobVnum} in room ${roomVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rooms/:vnum/place-object
 * Place an object in a room by creating an O reset command
 * Body: { areaData, objectVnum, maxExists }
 */
router.post('/:vnum/place-object', (req, res) => {
  try {
    const { vnum } = req.params;
    const { areaData, objectVnum, maxExists } = req.body;

    if (!areaData || !objectVnum) {
      return res.status(400).json({ 
        success: false, 
        error: 'Area data and object vnum required' 
      });
    }

    const roomVnum = parseInt(vnum, 10);
    const objVnum = parseInt(objectVnum, 10);

    // Verify room exists
    const room = (areaData.rooms || []).find(r => r.vnum === roomVnum);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        error: `Room ${roomVnum} not found` 
      });
    }

    // Verify object exists
    const object = (areaData.objects || []).find(o => o.vnum === objVnum);
    if (!object) {
      return res.status(404).json({ 
        success: false, 
        error: `Object ${objVnum} not found` 
      });
    }

    // Create O reset command
    const oReset = {
      command: 'O',
      comment: `Load ${object.short || object.keywords || `object ${objVnum}`}`,
      arg1: 0, // Always 0 for O command
      arg2: objVnum,
      arg3: maxExists || 1,
      arg4: roomVnum,
      arg5: 0, // Always 0 for O command
    };

    areaData.resets = areaData.resets || [];
    areaData.resets.push(oReset);

    res.json({
      success: true,
      areaData,
      message: `Placed object ${objVnum} in room ${roomVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

