/**
 * API Route: Specials
 * Handles special CRUD operations
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/areas/:areaName/specials
 * List all specials in an area
 */
router.get('/:areaName/specials', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData } = req.body || {};
    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }
    const specials = areaData.specials || [];
    res.json({ success: true, specials });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/areas/:areaName/specials
 * Create a new special
 */
router.post('/:areaName/specials', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData, special } = req.body;

    if (!areaData || !special) {
      return res.status(400).json({ success: false, error: 'Area data and special required' });
    }

    if (!special.type || !special.vnum || !special.specName) {
      return res.status(400).json({ success: false, error: 'Special type, vnum, and specName required' });
    }

    // Validate type is M, O, or R
    if (!['M', 'O', 'R'].includes(special.type)) {
      return res.status(400).json({ success: false, error: 'Special type must be M, O, or R' });
    }

    // Validate vnum exists based on type
    const vnumNum = parseInt(special.vnum, 10);
    let entityExists = false;

    switch (special.type) {
      case 'M':
        entityExists = (areaData.mobiles || []).find(m => m.vnum === vnumNum);
        break;
      case 'O':
        entityExists = (areaData.objects || []).find(o => o.vnum === vnumNum);
        break;
      case 'R':
        entityExists = (areaData.rooms || []).find(r => r.vnum === vnumNum);
        break;
    }

    if (!entityExists) {
      return res.status(400).json({ success: false, error: `Entity ${special.type} ${special.vnum} not found` });
    }

    areaData.specials = areaData.specials || [];
    areaData.specials.push(special);

    res.json({ success: true, areaData, message: 'Created special' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/areas/:areaName/specials/:index
 * Update a special
 */
router.put('/:areaName/specials/:index', (req, res) => {
  try {
    const { areaName, index } = req.params;
    const { areaData, special } = req.body;

    if (!areaData || !special) {
      return res.status(400).json({ success: false, error: 'Area data and special required' });
    }

    const idx = parseInt(index, 10);
    if (idx < 0 || idx >= (areaData.specials || []).length) {
      return res.status(404).json({ success: false, error: `Special ${index} not found` });
    }

    // If type/vnum changed, validate entity exists
    const oldSpecial = areaData.specials[idx];
    const newType = special.type !== undefined ? special.type : oldSpecial.type;
    const newVnum = special.vnum !== undefined ? special.vnum : oldSpecial.vnum;

    if (newType !== oldSpecial.type || newVnum !== oldSpecial.vnum) {
      if (!['M', 'O', 'R'].includes(newType)) {
        return res.status(400).json({ success: false, error: 'Special type must be M, O, or R' });
      }

      const vnumNum = parseInt(newVnum, 10);
      let entityExists = false;

      switch (newType) {
        case 'M':
          entityExists = (areaData.mobiles || []).find(m => m.vnum === vnumNum);
          break;
        case 'O':
          entityExists = (areaData.objects || []).find(o => o.vnum === vnumNum);
          break;
        case 'R':
          entityExists = (areaData.rooms || []).find(r => r.vnum === vnumNum);
          break;
      }

      if (!entityExists) {
        return res.status(400).json({ success: false, error: `Entity ${newType} ${newVnum} not found` });
      }
    }

    areaData.specials[idx] = { ...areaData.specials[idx], ...special };

    res.json({ success: true, areaData, message: `Updated special ${index}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/areas/:areaName/specials/:index
 * Delete a special
 */
router.delete('/:areaName/specials/:index', (req, res) => {
  try {
    const { areaName, index } = req.params;
    const { areaData } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const idx = parseInt(index, 10);
    if (idx < 0 || idx >= (areaData.specials || []).length) {
      return res.status(404).json({ success: false, error: `Special ${index} not found` });
    }

    areaData.specials.splice(idx, 1);

    res.json({ success: true, areaData, message: `Deleted special ${index}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
