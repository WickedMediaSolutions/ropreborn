/**
 * API Route: Shops
 * Handles shop CRUD operations
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/areas/:areaName/shops
 * List all shops in an area
 */
router.get('/:areaName/shops', (req, res) => {
  try {
    const { areaName } = req.params;
    // Area is passed in body for state preservation
    const { areaData } = req.body || {};
    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }
    const shops = areaData.shops || [];
    res.json({ success: true, shops });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/areas/:areaName/shops
 * Create a new shop
 */
router.post('/:areaName/shops', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData, shop } = req.body;

    if (!areaData || !shop) {
      return res.status(400).json({ success: false, error: 'Area data and shop required' });
    }

    if (shop.vnum === undefined || shop.vnum === null) {
      return res.status(400).json({ success: false, error: 'Shop vnum required' });
    }

    if (shop.keeperVnum === undefined || shop.keeperVnum === null) {
      return res.status(400).json({ success: false, error: 'Shop keeper vnum required' });
    }

    // Check for duplicate vnum
    if ((areaData.shops || []).find(s => s.vnum === shop.vnum)) {
      return res.status(400).json({ success: false, error: `Shop vnum ${shop.vnum} already exists` });
    }

    // Validate keeper vnum exists in mobiles
    const keeperExists = (areaData.mobiles || []).find(m => m.vnum === shop.keeperVnum);
    if (!keeperExists) {
      return res.status(400).json({ success: false, error: `Keeper mobile ${shop.keeperVnum} not found` });
    }

    areaData.shops = areaData.shops || [];
    areaData.shops.push(shop);

    res.json({ success: true, areaData, message: `Created shop ${shop.vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/areas/:areaName/shops/:vnum
 * Update a shop
 */
router.put('/:areaName/shops/:vnum', (req, res) => {
  try {
    const { areaName, vnum } = req.params;
    const { areaData, shop } = req.body;

    if (!areaData || !shop) {
      return res.status(400).json({ success: false, error: 'Area data and shop required' });
    }

    const vnumNum = parseInt(vnum, 10);
    const idx = (areaData.shops || []).findIndex(s => s.vnum === vnumNum);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: `Shop ${vnum} not found` });
    }

    // If keeper changed, validate it exists
    if (shop.keeperVnum !== undefined && shop.keeperVnum !== areaData.shops[idx].keeperVnum) {
      const keeperExists = (areaData.mobiles || []).find(m => m.vnum === shop.keeperVnum);
      if (!keeperExists) {
        return res.status(400).json({ success: false, error: `Keeper mobile ${shop.keeperVnum} not found` });
      }
    }

    areaData.shops[idx] = { ...areaData.shops[idx], ...shop };

    res.json({ success: true, areaData, message: `Updated shop ${vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/areas/:areaName/shops/:vnum
 * Delete a shop
 */
router.delete('/:areaName/shops/:vnum', (req, res) => {
  try {
    const { areaName, vnum } = req.params;
    const { areaData } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const vnumNum = parseInt(vnum, 10);
    const idx = (areaData.shops || []).findIndex(s => s.vnum === vnumNum);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: `Shop ${vnum} not found` });
    }

    areaData.shops.splice(idx, 1);

    res.json({ success: true, areaData, message: `Deleted shop ${vnum}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
