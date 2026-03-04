/**
 * API Route: Mobiles
 * Handles mobile CRUD operations
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/areas/:areaName/mobiles
 * List all mobiles in an area
 */
router.get('/:areaName/mobiles', (req, res) => {
  try {
    const { areaName } = req.params;
    // Area is passed in body for state preservation
    const { areaData } = req.body || {};
    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }
    const mobiles = areaData.mobiles || [];
    res.json({ success: true, mobiles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/areas/:areaName/mobiles
 * Create a new mobile
 */
router.post('/:areaName/mobiles', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData, mobile } = req.body;

    if (!areaData || !mobile) {
      return res.status(400).json({ success: false, error: 'Area data and mobile required' });
    }

    if (!mobile.vnum) {
      return res.status(400).json({ success: false, error: 'Mobile vnum required' });
    }

    // Check for duplicate vnum
    if ((areaData.mobiles || []).find(m => m.vnum === mobile.vnum)) {
      return res.status(400).json({ success: false, error: `Mobile vnum ${mobile.vnum} already exists` });
    }

    areaData.mobiles = areaData.mobiles || [];
    areaData.mobiles.push(mobile);

    res.json({ success: true, areaData, message: `Created mobile ${mobile.vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/areas/:areaName/mobiles/:vnum
 * Update a mobile
 */
router.put('/:areaName/mobiles/:vnum', (req, res) => {
  try {
    const { areaName, vnum } = req.params;
    const { areaData, mobile } = req.body;

    if (!areaData || !mobile) {
      return res.status(400).json({ success: false, error: 'Area data and mobile required' });
    }

    const vnumNum = parseInt(vnum, 10);
    const idx = (areaData.mobiles || []).findIndex(m => m.vnum === vnumNum);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: `Mobile ${vnum} not found` });
    }

    areaData.mobiles[idx] = { ...areaData.mobiles[idx], ...mobile };

    res.json({ success: true, areaData, message: `Updated mobile ${vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/areas/:areaName/mobiles/:vnum
 * Delete a mobile
 */
router.delete('/:areaName/mobiles/:vnum', (req, res) => {
  try {
    const { areaName, vnum } = req.params;
    const { areaData, options } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const vnumNum = parseInt(vnum, 10);
    const idx = (areaData.mobiles || []).findIndex(m => m.vnum === vnumNum);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: `Mobile ${vnum} not found` });
    }

    areaData.mobiles.splice(idx, 1);

    res.json({ success: true, areaData, message: `Deleted mobile ${vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
