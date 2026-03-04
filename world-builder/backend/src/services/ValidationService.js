/**
 * Validation Service
 * Performs referential integrity and domain validation on area data
 * Includes ROM/ROP specific rules and constraints
 */

// ROM flag constants and validation
const ROM_CONSTANTS = {
  // Affect flags (second byte of act/affect flags)
  affectFlags: {
    BLIND: 0,
    INVISIBLE: 1,
    DETECT_EVIL: 2,
    DETECT_GOOD: 3,
    DETECT_INVIS: 4,
    DETECT_MAGIC: 5,
    DETECT_HIDDEN: 6,
    HOLD: 7,
    SLEEP: 8,
    SLOW: 9,
    HASTE: 10,
    FAERIE_FIRE: 11,
    POISON: 12,
    PROT_EVIL: 13,
    PROT_GOOD: 14,
    SANC: 15,
    CURSE: 16,
    FLANK: 17,
  },

  // Item types for objects
  itemTypes: {
    LIGHT: 1,
    SCROLL: 2,
    WAND: 3,
    STAFF: 4,
    WEAPON: 5,
    TREASURE: 8,
    ARMOR: 9,
    POTION: 10,
    WORN: 11,
    FURNITURE: 12,
    TRASH: 13,
    CONTAINER: 15,
    DRINK_CON: 17,
    KEY: 18,
    FOOD: 19,
    MONEY: 20,
    BOAT: 22,
    CORPSE_NPC: 23,
    CORPSE_PC: 24,
    FOUNTAIN: 25,
    PILL: 26,
    PORTAL: 27,
    EGG: 29,
    SIGN: 30,
    BOOTS: 32,
    SPELLBOOK: 33,
  },

  // Known ROM special procedures (partial list - can be extended)
  specProcs: [
    'spec_breath_any',
    'spec_breath_acid',
    'spec_breath_fire',
    'spec_breath_frost',
    'spec_breath_gas',
    'spec_breath_lightning',
    'spec_cast_adept',
    'spec_cast_cleric',
    'spec_cast_judge',
    'spec_cast_mage',
    'spec_cast_undead',
    'spec_executioner',
    'spec_fido',
    'spec_guard',
    'spec_janitor',
    'spec_mayor',
    'spec_poison',
    'spec_thief',
    'spec_nasty',
    'spec_troll_member',
    'spec_ogre_member',
    // Add more known specs as needed
  ],
};

export class ValidationService {
  /**
   * Validate complete area data
   * @param {Object} areaData - Parsed area data
   * @returns {Object} { valid: boolean, errors: [], warnings: [] }
   */
  static validate(areaData) {
    const errors = [];
    const warnings = [];

    this.validateRooms(areaData, errors, warnings);
    this.validateMobiles(areaData, errors, warnings);
    this.validateObjects(areaData, errors, warnings);
    this.validateResets(areaData, errors, warnings);
    this.validateShops(areaData, errors, warnings);
    this.validateSpecials(areaData, errors, warnings);

    return {
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      errors,
      warnings,
    };
  }

  /**
   * Validate rooms section
   */
  static validateRooms(areaData, errors, warnings) {
    const rooms = areaData.rooms || [];
    const roomVnumSet = new Set(rooms.map(r => r.vnum));

    // Check duplicate vnums
    const seenVnums = new Set();
    rooms.forEach(room => {
      if (seenVnums.has(room.vnum)) {
        errors.push(`Duplicate room vnum: ${room.vnum}`);
      }
      seenVnums.add(room.vnum);
    });

    // Check for missing/empty names
    rooms.forEach(room => {
      if (!room.name || String(room.name).trim() === '') {
        errors.push(`Room ${room.vnum} has no name`);
      }
    });

    // Check for exits pointing to non-existent rooms
    rooms.forEach(room => {
      (room.exits || []).forEach(exit => {
        if (!roomVnumSet.has(exit.targetVnum)) {
          warnings.push(`Room ${room.vnum} exit ${exit.direction} points to non-existent room ${exit.targetVnum}`);
        }
      });
    });

    // Check for key objects in exits
    const objectVnums = new Set((areaData.objects || []).map(o => o.vnum));
    rooms.forEach(room => {
      (room.exits || []).forEach(exit => {
        if (exit.keyVnum && exit.keyVnum > 0) {
          if (!objectVnums.has(exit.keyVnum)) {
            warnings.push(`Room ${room.vnum} exit ${exit.direction} references non-existent key object ${exit.keyVnum}`);
          }
        }
      });
    });
  }

  /**
   * Validate mobiles section
   */
  static validateMobiles(areaData, errors, warnings) {
    const mobiles = areaData.mobiles || [];
    const mobileVnumSet = new Set(mobiles.map(m => m.vnum));

    // Check duplicate vnums
    const seenVnums = new Set();
    mobiles.forEach(mobile => {
      if (seenVnums.has(mobile.vnum)) {
        errors.push(`Duplicate mobile vnum: ${mobile.vnum}`);
      }
      seenVnums.add(mobile.vnum);
    });

    // Check for missing keywords
    mobiles.forEach(mobile => {
      if (!mobile.keywords || String(mobile.keywords).trim() === '') {
        warnings.push(`Mobile ${mobile.vnum} has no keywords`);
      }
      if (!mobile.short || String(mobile.short).trim() === '') {
        warnings.push(`Mobile ${mobile.vnum} has no short description`);
      }
    });

    // Validate mobile stats
    mobiles.forEach(mobile => {
      // Level bounds
      if (mobile.level && (mobile.level < 1 || mobile.level > 60)) {
        warnings.push(`Mobile ${mobile.vnum} level ${mobile.level} is outside recommended range (1-60)`);
      }

      // Alignment bounds
      if (mobile.alignment && (mobile.alignment < -1000 || mobile.alignment > 1000)) {
        warnings.push(`Mobile ${mobile.vnum} alignment ${mobile.alignment} is outside ROM range (-1000 to 1000)`);
      }

      // HP/AC sanity
      if (mobile.hitDice && mobile.hitDice < 1) {
        errors.push(`Mobile ${mobile.vnum} has invalid HP dice count: ${mobile.hitDice}`);
      }

      if (mobile.ac && Array.isArray(mobile.ac)) {
        mobile.ac.forEach((ac, idx) => {
          if (ac < 0 || ac > 200) {
            warnings.push(`Mobile ${mobile.vnum} AC value at index ${idx} (${ac}) seems unreasonable`);
          }
        });
      }
    });
  }

  /**
   * Validate objects section
   */
  static validateObjects(areaData, errors, warnings) {
    const objects = areaData.objects || [];

    // Check duplicate vnums
    const seenVnums = new Set();
    objects.forEach(obj => {
      if (seenVnums.has(obj.vnum)) {
        errors.push(`Duplicate object vnum: ${obj.vnum}`);
      }
      seenVnums.add(obj.vnum);
    });

    // NOTE: In ROM, vnums CAN be shared between rooms/mobiles/objects
    // This is common practice and not an error

    // Validate object properties
    objects.forEach(obj => {
      if (!obj.keywords || String(obj.keywords).trim() === '') {
        warnings.push(`Object ${obj.vnum} has no keywords`);
      }
      if (!obj.short || String(obj.short).trim() === '') {
        warnings.push(`Object ${obj.vnum} has no short description`);
      }

      // Check item type validity
      if (obj.itemType && !Object.values(ROM_CONSTANTS.itemTypes).includes(obj.itemType)) {
        warnings.push(`Object ${obj.vnum} has unusual item type: ${obj.itemType}`);
      }

      // Check for reasonable value ranges
      if (obj.value && Array.isArray(obj.value)) {
        obj.value.forEach((val, idx) => {
          if (typeof val === 'number') {
            if (val < -1000 || val > 100000) {
              warnings.push(`Object ${obj.vnum} value[${idx}] (${val}) seems unreasonable`);
            }
          }
        });
      }

      // Weight should be positive
      if (obj.weight && obj.weight < 0) {
        errors.push(`Object ${obj.vnum} has negative weight: ${obj.weight}`);
      }

      // Cost should be non-negative
      if (obj.cost && obj.cost < 0) {
        errors.push(`Object ${obj.vnum} has negative cost: ${obj.cost}`);
      }
    });
  }

  /**
   * Validate resets section
   */
  static validateResets(areaData, errors, warnings) {
    const resets = areaData.resets || [];
    const roomVnums = new Set((areaData.rooms || []).map(r => r.vnum));
    const mobileVnums = new Set((areaData.mobiles || []).map(m => m.vnum));
    const objectVnums = new Set((areaData.objects || []).map(o => o.vnum));

    resets.forEach((reset, idx) => {
      const cmd = reset.command;

      switch (cmd) {
        case 'M':
          if (reset.values.length >= 2) {
            const mobileVnum = reset.values[1];
            if (!mobileVnums.has(mobileVnum)) {
              errors.push(`Reset ${idx}: M command references non-existent mobile ${mobileVnum}`);
            }
            if (reset.values.length >= 4) {
              const roomVnum = reset.values[3];
              if (!roomVnums.has(roomVnum)) {
                errors.push(`Reset ${idx}: M command places mobile in non-existent room ${roomVnum}`);
              }
            }
          }
          break;

        case 'O':
          if (reset.values.length >= 2) {
            const objectVnum = reset.values[1];
            if (!objectVnums.has(objectVnum)) {
              errors.push(`Reset ${idx}: O command references non-existent object ${objectVnum}`);
            }
            if (reset.values.length >= 4) {
              const roomVnum = reset.values[3];
              if (!roomVnums.has(roomVnum)) {
                errors.push(`Reset ${idx}: O command places object in non-existent room ${roomVnum}`);
              }
            }
          }
          break;

        case 'G':
        case 'E':
          if (reset.values.length >= 2) {
            const objectVnum = reset.values[1];
            if (!objectVnums.has(objectVnum)) {
              warnings.push(`Reset ${idx}: ${cmd} command references non-existent object ${objectVnum}`);
            }
          }
          break;

        case 'P':
          if (reset.values.length >= 2) {
            const objectVnum = reset.values[1];
            if (!objectVnums.has(objectVnum)) {
              warnings.push(`Reset ${idx}: P command references non-existent object ${objectVnum}`);
            }
            if (reset.values.length >= 4) {
              const containerVnum = reset.values[3];
              if (!objectVnums.has(containerVnum)) {
                warnings.push(`Reset ${idx}: P command references non-existent container object ${containerVnum}`);
              }
            }
          }
          break;

        case 'D':
          if (reset.values.length >= 2) {
            const roomVnum = reset.values[1];
            if (!roomVnums.has(roomVnum)) {
              warnings.push(`Reset ${idx}: D command references non-existent room ${roomVnum}`);
            }
          }
          break;

        case 'R':
          if (reset.values.length >= 2) {
            const roomVnum = reset.values[1];
            if (!roomVnums.has(roomVnum)) {
              warnings.push(`Reset ${idx}: R command references non-existent room ${roomVnum}`);
            }
          }
          break;

        case 'S':
          // Shop resets - shop vnum should be valid
          if (reset.values.length >= 1) {
            // Shops are defined in shops section, harder to validate here
          }
          break;
      }
    });
  }

  /**
   * Validate shops section
   */
  static validateShops(areaData, errors, warnings) {
    const shops = areaData.shops || [];
    const mobileVnums = new Set((areaData.mobiles || []).map(m => m.vnum));

    // Check duplicate shop vnums
    const seenVnums = new Set();
    shops.forEach(shop => {
      if (seenVnums.has(shop.vnum)) {
        errors.push(`Duplicate shop vnum: ${shop.vnum}`);
      }
      seenVnums.add(shop.vnum);
    });

    shops.forEach(shop => {
      // Validate keeper mobile exists
      if (!mobileVnums.has(shop.keeperVnum)) {
        errors.push(`Shop ${shop.vnum}: keeper mobile ${shop.keeperVnum} does not exist`);
      }

      // Validate buy types - typically 0-50 range (item types)
      if (shop.buyTypes && Array.isArray(shop.buyTypes)) {
        shop.buyTypes.forEach((buyType, idx) => {
          if (buyType < 0 || buyType > 100) {
            warnings.push(`Shop ${shop.vnum}: buy type at index ${idx} (${buyType}) seems unusual (expected 0-50)`);
          }
        });
      }

      // Validate profit percentages
      if (shop.profitBuy !== undefined) {
        if (shop.profitBuy < 50 || shop.profitBuy > 200) {
          warnings.push(`Shop ${shop.vnum}: buy profit ${shop.profitBuy}% is unusual (expected 50-200%)`);
        }
      }

      if (shop.profitSell !== undefined) {
        if (shop.profitSell < 50 || shop.profitSell > 200) {
          warnings.push(`Shop ${shop.vnum}: sell profit ${shop.profitSell}% is unusual (expected 50-200%)`);
        }
      }

      // Validate open/close times
      if (shop.openTime !== undefined) {
        if (shop.openTime < 0 || shop.openTime > 23) {
          errors.push(`Shop ${shop.vnum}: opening time ${shop.openTime} is invalid (must be 0-23)`);
        }
      }

      if (shop.closeTime !== undefined) {
        if (shop.closeTime < 0 || shop.closeTime > 23) {
          errors.push(`Shop ${shop.vnum}: closing time ${shop.closeTime} is invalid (must be 0-23)`);
        }
      }

      // Warn if shop is never open (opening time == closing time)
      if (shop.openTime !== undefined && shop.closeTime !== undefined && shop.openTime === shop.closeTime) {
        warnings.push(`Shop ${shop.vnum}: shop is open 24 hours (open=${shop.openTime}, close=${shop.closeTime})`);
      }
    });
  }

  /**
   * Validate specials section
   */
  static validateSpecials(areaData, errors, warnings) {
    const specials = areaData.specials || [];
    const mobileVnums = new Set((areaData.mobiles || []).map(m => m.vnum));
    const objectVnums = new Set((areaData.objects || []).map(o => o.vnum));
    const roomVnums = new Set((areaData.rooms || []).map(r => r.vnum));

    specials.forEach((special, idx) => {
      // Validate type is M, O, or R
      if (!['M', 'O', 'R'].includes(special.type)) {
        errors.push(`Special ${idx}: invalid type '${special.type}' (must be M, O, or R)`);
        return;
      }

      // Validate target entity exists
      switch (special.type) {
        case 'M':
          if (!mobileVnums.has(special.vnum)) {
            errors.push(`Special ${idx}: mobile ${special.vnum} does not exist`);
          }
          break;
        case 'O':
          if (!objectVnums.has(special.vnum)) {
            errors.push(`Special ${idx}: object ${special.vnum} does not exist`);
          }
          break;
        case 'R':
          if (!roomVnums.has(special.vnum)) {
            errors.push(`Special ${idx}: room ${special.vnum} does not exist`);
          }
          break;
      }

      // Validate spec function name is known (or warn if unknown)
      if (special.specName) {
        if (!ROM_CONSTANTS.specProcs.includes(special.specName)) {
          warnings.push(`Special ${idx}: unknown spec function '${special.specName}' (may be custom)`);
        }
      } else {
        errors.push(`Special ${idx}: missing spec function name`);
      }

      // Check for duplicate special assignments
      const duplicates = specials.filter((s, i) => 
        i !== idx && s.type === special.type && s.vnum === special.vnum
      );
      if (duplicates.length > 0) {
        warnings.push(`Special ${idx}: ${special.type} ${special.vnum} has multiple special procedures assigned`);
      }
    });
  }

  /**
   * Get reference count for a vnum
   * @returns {Object} { rooms: [], mobiles: [], objects: [], resets: [], shops: [], specials: [] }
   */
  static getReferences(areaData, vnum) {
    const refs = {
      rooms: [],
      mobiles: [],
      objects: [],
      resets: [],
      shops: [],
      specials: [],
    };

    // Check room exits
    (areaData.rooms || []).forEach(room => {
      if (room.vnum === vnum) {
        refs.rooms.push(`Room ${room.vnum} itself`);
      }
      (room.exits || []).forEach(exit => {
        if (exit.targetVnum === vnum) {
          refs.rooms.push(`Room ${room.vnum} exit to ${exit.direction}`);
        }
        if (exit.keyVnum === vnum) {
          refs.rooms.push(`Room ${room.vnum} exit key`);
        }
      });
    });

    // Check resets
    (areaData.resets || []).forEach((reset, idx) => {
      const cmd = reset.command;
      let referenced = false;

      if ((cmd === 'M' || cmd === 'O') && reset.values.length >= 2 && reset.values[1] === vnum) {
        refs.resets.push(`Reset ${idx}: ${cmd} command`);
        referenced = true;
      }
      if ((cmd === 'G' || cmd === 'E') && reset.values.length >= 2 && reset.values[1] === vnum) {
        refs.resets.push(`Reset ${idx}: ${cmd} command`);
        referenced = true;
      }
      if (cmd === 'P' && reset.values.length >= 2 && reset.values[1] === vnum) {
        refs.resets.push(`Reset ${idx}: ${cmd} object`);
        referenced = true;
      }
      if (cmd === 'P' && reset.values.length >= 4 && reset.values[3] === vnum) {
        refs.resets.push(`Reset ${idx}: ${cmd} container`);
        referenced = true;
      }
      if ((cmd === 'M' || cmd === 'O') && reset.values.length >= 4 && reset.values[3] === vnum) {
        refs.resets.push(`Reset ${idx}: ${cmd} room`);
        referenced = true;
      }
      if (cmd === 'D' && reset.values.length >= 2 && reset.values[1] === vnum) {
        refs.resets.push(`Reset ${idx}: ${cmd} room`);
        referenced = true;
      }
    });

    // Check shops
    (areaData.shops || []).forEach(shop => {
      if (shop.vnum === vnum) {
        refs.shops.push(`Shop ${shop.vnum} itself`);
      }
      if (shop.keeperVnum === vnum) {
        refs.shops.push(`Shop ${shop.vnum} keeper mobile`);
      }
    });

    // Check specials
    (areaData.specials || []).forEach((special, idx) => {
      if (special.vnum === vnum) {
        refs.specials.push(`Special ${idx}: ${special.type} ${special.vnum} ${special.specName || ''}`);
      }
    });

    return refs;
  }
}

export default ValidationService;
