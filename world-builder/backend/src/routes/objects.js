/**
 * API Route: Objects
 * Handles object CRUD operations
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/areas/:areaName/objects
 * List all objects in an area
 */
router.get('/:areaName/objects', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData } = req.body || {};
    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }
    const objects = areaData.objects || [];
    res.json({ success: true, objects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/areas/:areaName/objects
 * Create a new object
 */
router.post('/:areaName/objects', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData, object } = req.body;

    if (!areaData || !object) {
      return res.status(400).json({ success: false, error: 'Area data and object required' });
    }

    if (!object.vnum) {
      return res.status(400).json({ success: false, error: 'Object vnum required' });
    }

    // Check for duplicate vnum
    if ((areaData.objects || []).find(o => o.vnum === object.vnum)) {
      return res.status(400).json({ success: false, error: `Object vnum ${object.vnum} already exists` });
    }

    areaData.objects = areaData.objects || [];
    areaData.objects.push(object);

    res.json({ success: true, areaData, message: `Created object ${object.vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/areas/:areaName/objects/:vnum
 * Update an object
 */
router.put('/:areaName/objects/:vnum', (req, res) => {
  try {
    const { areaName, vnum } = req.params;
    const { areaData, object } = req.body;

    if (!areaData || !object) {
      return res.status(400).json({ success: false, error: 'Area data and object required' });
    }

    const vnumNum = parseInt(vnum, 10);
    const idx = (areaData.objects || []).findIndex(o => o.vnum === vnumNum);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: `Object ${vnum} not found` });
    }

    areaData.objects[idx] = { ...areaData.objects[idx], ...object };

    res.json({ success: true, areaData, message: `Updated object ${vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/areas/:areaName/objects/:vnum
 * Delete an object
 */
router.delete('/:areaName/objects/:vnum', (req, res) => {
  try {
    const { areaName, vnum } = req.params;
    const { areaData, options } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const vnumNum = parseInt(vnum, 10);
    const idx = (areaData.objects || []).findIndex(o => o.vnum === vnumNum);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: `Object ${vnum} not found` });
    }

    areaData.objects.splice(idx, 1);

    res.json({ success: true, areaData, message: `Deleted object ${vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
