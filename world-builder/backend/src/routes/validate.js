/**
 * API Route: Validate
 * Performs area validation and reports referential integrity issues
 */

import express from 'express';
import { ValidationService } from '../services/ValidationService.js';

const router = express.Router();

/**
 * POST /api/areas/:areaName/validate
 * Validate area data integrity
 */
router.post('/:areaName/validate', (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const result = ValidationService.validate(areaData);

    res.json({
      success: true,
      validation: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/areas/:areaName/reference/:vnum
 * Get all references to a vnum
 */
router.post('/:areaName/reference/:vnum', (req, res) => {
  try {
    const { areaName, vnum } = req.params;
    const { areaData } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    const vnumNum = parseInt(vnum, 10);
    const references = ValidationService.getReferences(areaData, vnumNum);

    res.json({
      success: true,
      vnum: vnumNum,
      references,
      totalReferences: Object.values(references).reduce((sum, arr) => sum + arr.length, 0),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
