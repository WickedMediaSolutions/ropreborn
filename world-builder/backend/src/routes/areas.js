/**
 * API Route: Areas
 * Handles area loading, listing, creating, saving
 */

import express from 'express';
import { FileManager } from '../services/FileManager.js';
import { ValidationService } from '../services/ValidationService.js';

const router = express.Router();

/**
 * GET /api/areas
 * List all available areas
 */
router.get('/', async (req, res) => {
  try {
    const areas = await FileManager.listAreas();

    const areasWithCounts = await Promise.all(
      areas.map(async (area) => {
        try {
          const areaData = await FileManager.loadArea(area.name);
          return {
            ...area,
            counts: {
              rooms: areaData.rooms?.length || 0,
              mobiles: areaData.mobiles?.length || 0,
              objects: areaData.objects?.length || 0,
            },
          };
        } catch (loadError) {
          return {
            ...area,
            counts: {
              rooms: 0,
              mobiles: 0,
              objects: 0,
            },
            countError: loadError.message,
          };
        }
      })
    );

    res.json({ success: true, areas: areasWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/areas/:areaName
 * Load a specific area
 */
router.get('/:areaName', async (req, res) => {
  try {
    const { areaName } = req.params;
    const areaData = await FileManager.loadArea(areaName);
    const counts = {
      rooms: areaData.rooms?.length || 0,
      mobiles: areaData.mobiles?.length || 0,
      objects: areaData.objects?.length || 0,
    };
    res.json({ success: true, areaData, counts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/areas
 * Create a new area
 */
router.post('/', async (req, res) => {
  try {
    const { name, author, levelRange, vnumRange } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Area name required' });
    }

    const areaData = await FileManager.createArea(name, {
      author,
      levelRange,
      vnumRange,
    });

    res.json({ success: true, areaData, message: `Created area: ${name}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/areas/:areaName
 * Save/update an area with validation
 */
router.put('/:areaName', async (req, res) => {
  try {
    const { areaName } = req.params;
    const { areaData, skipValidation } = req.body;

    if (!areaData) {
      return res.status(400).json({ success: false, error: 'Area data required' });
    }

    // Run validation unless explicitly skipped
    const validation = !skipValidation ? ValidationService.validate(areaData) : null;

    // Block save on hard errors
    if (validation && !validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: cannot save with errors',
        validation,
      });
    }

    // Proceed with save
    const result = await FileManager.saveArea(areaName, areaData, true);
    
    res.json({
      success: true,
      ...result,
      validation: validation ? {
        errorCount: validation.errorCount,
        warningCount: validation.warningCount,
        warnings: validation.warnings.slice(0, 10), // Limit to first 10
      } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/areas/:areaName
 * Delete an area
 */
router.delete('/:areaName', async (req, res) => {
  try {
    const { areaName } = req.params;
    const result = await FileManager.deleteArea(areaName);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
