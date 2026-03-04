/**
 * API Route: Placement Helpers
 * Provides convenient methods to create reset chains for mobiles and objects
 */

import express from 'express';

const router = express.Router();

/**
 * POST /api/placements/place-mobile
 * Create a reset chain for placing a mobile in a room
 * 
 * Expected body:
 * {
 *   mobileVnum: number,
 *   roomVnum: number,
 *   maxInArea: number (default 1),
 *   maxInRoom: number (default 1)
 * }
 * 
 * Returns a reset object ready to add to resets array:
 * { command: 'M', values: [mobileVnum, roomVnum, maxInArea, maxInRoom] }
 */
router.post('/place-mobile', (req, res) => {
  try {
    const { mobileVnum, roomVnum, maxInArea = 1, maxInRoom = 1 } = req.body;

    if (!mobileVnum || !roomVnum) {
      return res.status(400).json({
        success: false,
        error: 'Mobile vnum and room vnum required',
      });
    }

    const reset = {
      command: 'M',
      values: [mobileVnum, roomVnum, maxInArea, maxInRoom],
      description: `Place mobile ${mobileVnum} in room ${roomVnum} (max ${maxInArea} in area, ${maxInRoom} in room)`,
    };

    res.json({
      success: true,
      reset,
      message: `Created mobile placement reset for mobile ${mobileVnum} in room ${roomVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/placements/equip-mobile
 * Create reset commands to equip a mobile with an object
 * 
 * Expected body:
 * {
 *   objectVnum: number,
 *   wearLoc: number (0-19 corresponding to ROM wear locations),
 *   maxInArea: number (default 1)
 * }
 * 
 * Returns:
 * [
 *   { command: 'G', values: [objectVnum, maxInArea, 0] },      // Give to mobile
 *   { command: 'E', values: [objectVnum, wearLoc, maxInArea] }  // Equip on wear loc
 * ]
 */
router.post('/equip-mobile', (req, res) => {
  try {
    const { objectVnum, wearLoc = 0, maxInArea = 1 } = req.body;

    if (!objectVnum) {
      return res.status(400).json({
        success: false,
        error: 'Object vnum required',
      });
    }

    const resets = [
      {
        command: 'G',
        values: [objectVnum, maxInArea, 0],
        description: `Give object ${objectVnum} to mobile (max ${maxInArea} in area)`,
      },
      {
        command: 'E',
        values: [objectVnum, wearLoc, maxInArea],
        description: `Equip object ${objectVnum} at wear location ${wearLoc}`,
      },
    ];

    res.json({
      success: true,
      resets,
      message: `Created equipment resets for object ${objectVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/placements/place-object-room
 * Create reset command to place an object in a room
 * 
 * Expected body:
 * {
 *   objectVnum: number,
 *   roomVnum: number,
 *   maxInArea: number (default 1),
 *   maxInRoom: number (default 1)
 * }
 */
router.post('/place-object-room', (req, res) => {
  try {
    const { objectVnum, roomVnum, maxInArea = 1, maxInRoom = 1 } = req.body;

    if (!objectVnum || !roomVnum) {
      return res.status(400).json({
        success: false,
        error: 'Object vnum and room vnum required',
      });
    }

    const reset = {
      command: 'O',
      values: [objectVnum, maxInArea, 0, roomVnum, maxInRoom],
      description: `Place object ${objectVnum} in room ${roomVnum}`,
    };

    res.json({
      success: true,
      reset,
      message: `Created object placement reset for object ${objectVnum} in room ${roomVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/placements/place-object-in-container
 * Create reset command to place an object inside a container object
 * 
 * Expected body:
 * {
 *   objectVnum: number,      // Object to place
 *   containerVnum: number,   // Container object
 *   maxInArea: number (default 1)
 * }
 */
router.post('/place-object-in-container', (req, res) => {
  try {
    const { objectVnum, containerVnum, maxInArea = 1 } = req.body;

    if (!objectVnum || !containerVnum) {
      return res.status(400).json({
        success: false,
        error: 'Object vnum and container vnum required',
      });
    }

    const reset = {
      command: 'P',
      values: [objectVnum, maxInArea, 0, containerVnum, maxInArea],
      description: `Place object ${objectVnum} in container ${containerVnum}`,
    };

    res.json({
      success: true,
      reset,
      message: `Created container placement reset for object ${objectVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/placements/set-door-state
 * Create reset command to set a door's state
 * 
 * Expected body:
 * {
 *   roomVnum: number,
 *   direction: string ('north', 'south', 'east', 'west', 'up', 'down'),
 *   state: number (0=open, 1=closed, 2=locked)
 * }
 */
router.post('/set-door-state', (req, res) => {
  try {
    const { roomVnum, direction, state = 1 } = req.body;

    if (!roomVnum || !direction) {
      return res.status(400).json({
        success: false,
        error: 'Room vnum and direction required',
      });
    }

    const directionMap = {
      north: 0, south: 1, east: 2, west: 3, up: 4, down: 5,
    };

    const dirIndex = directionMap[direction.toLowerCase()];
    if (dirIndex === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid direction. Use: north, south, east, west, up, down',
      });
    }

    const stateNames = { 0: 'open', 1: 'closed', 2: 'locked' };

    const reset = {
      command: 'D',
      values: [roomVnum, dirIndex, state],
      description: `Set door in room ${roomVnum} direction ${direction} to ${stateNames[state]}`,
    };

    res.json({
      success: true,
      reset,
      message: `Created door state reset for ${direction} exit in room ${roomVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/placements/randomize-exits
 * Create reset command to randomize exits in a room
 * 
 * Expected body:
 * {
 *   roomVnum: number
 * }
 */
router.post('/randomize-exits', (req, res) => {
  try {
    const { roomVnum } = req.body;

    if (!roomVnum) {
      return res.status(400).json({
        success: false,
        error: 'Room vnum required',
      });
    }

    const reset = {
      command: 'R',
      values: [roomVnum, 6], // 6 = all directions
      description: `Randomize all exits in room ${roomVnum}`,
    };

    res.json({
      success: true,
      reset,
      message: `Created randomize exits reset for room ${roomVnum}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
