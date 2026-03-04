/**
 * API Route: Resets
 * Handles reset CRUD operations
 */

import express from 'express';

const router = express.Router();

/**
 * GET /api/areas/:areaName/resets
 * List all resets in an area
 */
router.get('/:areaName/resets', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData } = req.body || {};
    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }
    const resets = areaData.resets || [];
    res.json({ success: true, resets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/areas/:areaName/resets
 * Create a new reset command
 */
router.post('/:areaName/resets', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData, reset } = req.body;

    if (!areaData || !reset) {
      return res.status(400).json({ success: false, error: 'Area data and reset required' });
    }

    if (!reset.command) {
      return res.status(400).json({ success: false, error: 'Reset command required' });
    }

    areaData.resets = areaData.resets || [];
    areaData.resets.push(reset);

    res.json({ success: true, areaData, message: 'Created reset command' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/areas/:areaName/resets/:index
 * Update a reset command
 */
router.put('/:areaName/resets/:index', (req, res) => {
  try {
    const { areaName, index } = req.params;
    const { areaData, reset } = req.body;

    if (!areaData || !reset) {
      return res.status(400).json({ success: false, error: 'Area data and reset required' });
    }

    const idx = parseInt(index, 10);
    if (idx < 0 || idx >= (areaData.resets || []).length) {
      return res.status(404).json({ success: false, error: `Reset ${index} not found` });
    }

    areaData.resets[idx] = { ...areaData.resets[idx], ...reset };

    res.json({ success: true, areaData, message: `Updated reset ${index}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/areas/:areaName/resets/:index
 * Delete a reset command
 */
router.delete('/:areaName/resets/:index', (req, res) => {
  try {
    const { areaName, index } = req.params;
    const { areaData } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const idx = parseInt(index, 10);
    if (idx < 0 || idx >= (areaData.resets || []).length) {
      return res.status(404).json({ success: false, error: `Reset ${index} not found` });
    }

    areaData.resets.splice(idx, 1);

    res.json({ success: true, areaData, message: `Deleted reset ${index}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
