/**
 * File Manager Service
 * Handles reading, writing, and managing area files
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { AreParser } from './AreParser.js';
import { AreGenerator } from './AreGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to area directory (3 levels up: services -> src -> backend -> actual area dir)
const AREA_DIR = path.resolve(__dirname, '../../../../area');

export class FileManager {
  /**
   * List all .are files in area directory
   * @returns {Promise<Array>} Array of area file information
   */
  static async listAreas() {
    try {
      const files = await fs.readdir(AREA_DIR);
      const areFiles = files.filter(f => f.endsWith('.are'));

      const areas = await Promise.all(
        areFiles.map(async (file) => {
          const filePath = path.join(AREA_DIR, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
          };
        })
      );

      return areas.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to list areas: ${error.message}`);
    }
  }

  /**
   * Load and parse an area file
   * @param {string} fileName - Name of .are file (with or without extension)
   * @returns {Promise<Object>} Parsed area data
   */
  static async loadArea(fileName) {
    try {
      const name = fileName.endsWith('.are') ? fileName : `${fileName}.are`;
      const filePath = path.join(AREA_DIR, name);

      // Security check: prevent path traversal
      if (!filePath.startsWith(AREA_DIR)) {
        throw new Error('Invalid area file path');
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const areaData = AreParser.parse(content, name);

      // Preserve original content for non-destructive round-trip saves.
      areaData.__rawContent = content;
      areaData.__fileName = name;
      areaData.__rawSections = areaData.__parsedSections || [];

      return areaData;
    } catch (error) {
      throw new Error(`Failed to load area: ${error.message}`);
    }
  }

  /**
   * Save area data to file
   * @param {string} fileName - Name of .are file
   * @param {Object} areaData - Area data to save
   * @param {boolean} backup - Create backup before saving
   * @returns {Promise<Object>} Save result
   */
  static async saveArea(fileName, areaData, backup = true) {
    try {
      const name = fileName.endsWith('.are') ? fileName : `${fileName}.are`;
      const filePath = path.join(AREA_DIR, name);

      // Security check
      if (!filePath.startsWith(AREA_DIR)) {
        throw new Error('Invalid area file path');
      }

      // Create backup if requested
      if (backup && (await fs.pathExists(filePath))) {
        const backupPath = `${filePath}.backup`;
        await fs.copy(filePath, backupPath);
      }

      // Validate data
      const validation = AreGenerator.validate(areaData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Prefer non-destructive generation using original raw content.
      // If unavailable (e.g., new files), fall back to full generation.
      let rawSource = areaData.__rawContent;
      if (!rawSource && (await fs.pathExists(filePath))) {
        rawSource = await fs.readFile(filePath, 'utf-8');
      }

      const content = AreGenerator.generate(areaData, rawSource || null);

      // Write file
      await fs.writeFile(filePath, content, 'utf-8');

      return {
        success: true,
        message: `Area saved: ${name}`,
        filePath,
      };
    } catch (error) {
      throw new Error(`Failed to save area: ${error.message}`);
    }
  }

  /**
   * Create new area file
   * @param {string} fileName - Name of new area
   * @param {Object} options - Area options (vnumRange, author, etc)
   * @returns {Promise<Object>} Created area data
   */
  static async createArea(fileName, options = {}) {
    try {
      const name = fileName.endsWith('.are') ? fileName : `${fileName}.are`;

      const areaData = {
        area: {
          name: fileName.replace('.are', ''),
          author: options.author || 'Unknown',
          levelRange: options.levelRange || '1-50',
          vnumRange: options.vnumRange || [1000, 1999],
        },
        rooms: [],
        mobiles: [],
        objects: [],
      };

      // Save empty area
      await this.saveArea(name, areaData, false);

      return areaData;
    } catch (error) {
      throw new Error(`Failed to create area: ${error.message}`);
    }
  }

  /**
   * Delete an area file
   * @param {string} fileName - Name of .are file
   * @returns {Promise<Object>} Delete result
   */
  static async deleteArea(fileName) {
    try {
      const name = fileName.endsWith('.are') ? fileName : `${fileName}.are`;
      const filePath = path.join(AREA_DIR, name);

      if (!filePath.startsWith(AREA_DIR)) {
        throw new Error('Invalid area file path');
      }

      if (!(await fs.pathExists(filePath))) {
        throw new Error('Area file not found');
      }

      await fs.remove(filePath);

      return {
        success: true,
        message: `Area deleted: ${name}`,
      };
    } catch (error) {
      throw new Error(`Failed to delete area: ${error.message}`);
    }
  }

  /**
   * Get area directory path (for testing/debugging)
   * @returns {string} Area directory path
   */
  static getAreaDir() {
    return AREA_DIR;
  }
}

export default FileManager;
