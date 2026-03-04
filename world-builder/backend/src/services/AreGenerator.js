/**
 * ROM 2.4 Area File Generator
 * Generates .are file content from structured JSON data
 */

export class AreGenerator {
  static DIRECTION_TO_INDEX = {
    north: 0,
    east: 1,
    south: 2,
    west: 3,
    up: 4,
    down: 5,
  };

  static sanitizeText(text) {
    return String(text ?? '')
      .replace(/\r/g, '')
      .replace(/~/g, '-');
  }

  static writeTildeString(text) {
    const normalized = this.sanitizeText(text);
    if (!normalized) {
      return '~\n';
    }
    if (normalized.includes('\n')) {
      return `${normalized}\n~\n`;
    }
    return `${normalized}~\n`;
  }

  static parseHeaderVnum(line) {
    const trimmed = (line || '').trim();
    if (/^#\d+$/.test(trimmed)) {
      return parseInt(trimmed.substring(1), 10);
    }
    return null;
  }

  static findSectionEnd(lines, sectionStartIndex) {
    for (let i = sectionStartIndex + 1; i < lines.length; i++) {
      const trimmed = (lines[i] || '').trim();
      if (!trimmed.startsWith('#')) {
        continue;
      }
      if (trimmed === '#0') {
        continue;
      }
      if (this.parseHeaderVnum(trimmed) !== null) {
        continue;
      }
      return i;
    }
    return lines.length;
  }

  static updateAreaHeaderInRaw(rawContent, areaData) {
    const lines = String(rawContent).split(/\r?\n/);
    const areaIndex = lines.findIndex((line) => line.trim() === '#AREA');
    if (areaIndex === -1) {
      return rawContent;
    }

    const updated = [...lines];
    const name = areaData?.area?.name || 'unknown';
    const author = areaData?.area?.author || 'Unknown';
    const levelRange = areaData?.area?.levelRange || '1-50';
    const vnumMin = areaData?.area?.vnumRange?.[0] ?? 0;
    const vnumMax = areaData?.area?.vnumRange?.[1] ?? 0;

    if (areaIndex + 1 < updated.length) {
      updated[areaIndex + 1] = `${this.sanitizeText(name)}~`;
    }
    if (areaIndex + 2 < updated.length) {
      updated[areaIndex + 2] = `${this.sanitizeText(author)}~`;
    }
    if (areaIndex + 3 < updated.length) {
      updated[areaIndex + 3] = `${this.sanitizeText(levelRange)}~`;
    }
    if (areaIndex + 4 < updated.length) {
      updated[areaIndex + 4] = `${vnumMin} ${vnumMax}`;
    }

    return updated.join('\n');
  }

  static generateRoomsOnly(rooms) {
    const sortedRooms = [...(rooms || [])].sort((a, b) => a.vnum - b.vnum);
    let content = '';
    sortedRooms.forEach((room) => {
      content += this.generateRoom(room);
    });
    return content;
  }

  static updateSectionInRaw(rawContent, sectionName, sectionBody, appendBeforeEnd = true) {
    const lines = String(rawContent).split(/\r?\n/);
    const sectionHeader = `#${sectionName.toUpperCase()}`;
    const sectionStartIndex = lines.findIndex((line) => line.trim() === sectionHeader);

    if (sectionStartIndex !== -1) {
      const sectionEndIndex = this.findSectionEnd(lines, sectionStartIndex);
      const prefix = lines.slice(0, sectionStartIndex + 1).join('\n');
      const suffix = lines.slice(sectionEndIndex).join('\n');
      const prefixWithNewline = prefix.endsWith('\n') ? prefix : `${prefix}\n`;
      const bodyWithNewline = sectionBody.endsWith('\n') ? sectionBody : `${sectionBody}\n`;
      return `${prefixWithNewline}${bodyWithNewline}${suffix}`;
    }

    if (!appendBeforeEnd) {
      return rawContent;
    }

    const endIndex = lines.findIndex((line) => {
      const trimmed = line.trim();
      return trimmed === '#$' || trimmed === '#END';
    });

    const sectionBlock = `${sectionHeader}\n${sectionBody.endsWith('\n') ? sectionBody : `${sectionBody}\n`}`;

    if (endIndex === -1) {
      const content = String(rawContent);
      const separator = content.endsWith('\n') ? '' : '\n';
      return `${content}${separator}${sectionBlock}`;
    }

    const prefix = lines.slice(0, endIndex).join('\n');
    const suffix = lines.slice(endIndex).join('\n');
    const prefixWithNewline = prefix.endsWith('\n') ? prefix : `${prefix}\n`;
    return `${prefixWithNewline}${sectionBlock}${suffix}`;
  }

  /**
   * Generate ROM .are file content from structured data
   * @param {Object} areaData - Structured area data
   * @param {string|null} rawContent - Existing raw file content to preserve non-room sections
   * @returns {string} .are file content
   */
  static generate(areaData, rawContent = null) {
    if (rawContent && typeof rawContent === 'string' && rawContent.length > 0) {
      let content = this.updateAreaHeaderInRaw(rawContent, areaData);
      content = this.updateSectionInRaw(content, 'rooms', this.generateRoomsOnly(areaData.rooms || []), true);
      content = this.updateSectionInRaw(content, 'mobiles', this.generateMobilesOnly(areaData.mobiles || []), true);
      content = this.updateSectionInRaw(content, 'objects', this.generateObjectsOnly(areaData.objects || []), true);
      content = this.updateSectionInRaw(content, 'resets', this.generateResetsOnly(areaData.resets || []), false);
      content = this.updateSectionInRaw(content, 'shops', this.generateShopsOnly(areaData.shops || []), false);
      content = this.updateSectionInRaw(content, 'specials', this.generateSpecialsOnly(areaData.specials || []), false);
      return content;
    }

    let content = '';

    // #AREA section
    content += '#AREA\n';
    content += `${areaData.area.name}~\n`;
    content += `${areaData.area.author}~\n`;
    content += `${areaData.area.levelRange}~\n`;
    content += `${areaData.area.vnumRange[0]} ${areaData.area.vnumRange[1]}\n`;
    content += '\n';

    // #ROOMS section
    content += '#ROOMS\n';
    content += this.generateRoomsOnly(areaData.rooms || []);
    content += '\n';

    // #MOBILES section
    content += '#MOBILES\n';
    content += this.generateMobilesOnly(areaData.mobiles || []);
    content += '\n';

    // #OBJECTS section
    content += '#OBJECTS\n';
    content += this.generateObjectsOnly(areaData.objects || []);
    content += '\n';

    // #RESETS section
    content += '#RESETS\n';
    content += this.generateResetsOnly(areaData.resets || []);
    content += '\n';

    // #SHOPS section
    if (areaData.shops && areaData.shops.length > 0) {
      content += '#SHOPS\n';
      content += this.generateShopsOnly(areaData.shops);
      content += '\n';
    }

    // #SPECIALS section
    if (areaData.specials && areaData.specials.length > 0) {
      content += '#SPECIALS\n';
      content += this.generateSpecialsOnly(areaData.specials);
      content += '\n';
    }

    // End marker
    content += '#$\n';

    return content;
  }

  static generateResetsOnly(resets) {
    let content = '';
    (resets || []).forEach((reset) => {
      let line = reset.rawLine;
      if (reset.comment) {
        line = `${line}\t* ${reset.comment}`;
      }
      content += `${line}\n`;
    });
    content += 'S\n';
    return content;
  }

  static generateObjectsOnly(objects) {
    const sortedObjects = [...(objects || [])].sort((a, b) => a.vnum - b.vnum);
    let content = '';
    sortedObjects.forEach((obj) => {
      content += this.generateObject(obj);
    });
    content += '#0\n';
    return content;
  }

  /**
   * Generate mobiles section only
   * @param {Array} mobiles - Array of mobile objects
   * @returns {string} Mobiles section content
   */
  static generateMobilesOnly(mobiles) {
    const sortedMobiles = [...(mobiles || [])].sort((a, b) => a.vnum - b.vnum);
    let content = '';
    sortedMobiles.forEach((mob) => {
      content += this.generateMobile(mob);
    });
    content += '#0\n';
    return content;
  }

  /**
   * Generate single room block
   * @param {Object} room - Room object
   * @returns {string} Room block content
   */
  static generateRoom(room) {
    let content = `#${room.vnum}\n`;
    content += this.writeTildeString(room.name || `Room ${room.vnum}`);
    content += this.writeTildeString(room.desc || 'A room.');

    const roomFlags = room.rawRoomFlags && String(room.rawRoomFlags).trim()
      ? String(room.rawRoomFlags).trim()
      : '0 0 0';
    content += `${roomFlags}\n`;

    (room.exits || []).forEach((exit) => {
      const dir = String(exit.direction || '').toLowerCase();
      const dirIndex = this.DIRECTION_TO_INDEX[dir];
      if (dirIndex === undefined) {
        return;
      }

      const targetVnum = Number.isInteger(exit.targetVnum) ? exit.targetVnum : parseInt(exit.targetVnum, 10);
      if (!Number.isInteger(targetVnum) || targetVnum < 0) {
        return;
      }

      const lockFlags = Number.isInteger(exit.lockFlags) ? exit.lockFlags : 0;
      const keyVnum = Number.isInteger(exit.keyVnum) ? exit.keyVnum : -1;

      content += `D${dirIndex}\n`;
      content += this.writeTildeString(exit.desc || '');
      content += this.writeTildeString(exit.keyword || '');
      content += `${lockFlags} ${keyVnum} ${targetVnum}\n`;
    });

    (room.extraDescriptions || []).forEach((extra) => {
      content += 'E\n';
      content += this.writeTildeString(extra.keywords || '');
      content += this.writeTildeString(extra.text || '');
    });

    (room.trailingDirectives || []).forEach((line) => {
      const directive = String(line || '').trim();
      if (directive) {
        content += `${directive}\n`;
      }
    });

    content += 'S\n\n';

    return content;
  }

  /**
   * Generate single mobile block
   * @param {Object} mobile - Mobile object
   * @returns {string} Mobile block content
   */
  static generateMobile(mobile) {
    let content = `#${mobile.vnum}\n`;

    content += this.writeTildeString(mobile.keywords || mobile.name || `mobile ${mobile.vnum}`);
    content += this.writeTildeString(mobile.short || `a mobile ${mobile.vnum}`);
    content += this.writeTildeString(mobile.long || `A mobile ${mobile.vnum} is here.`);
    content += this.writeTildeString(mobile.description || 'No description.');
    content += this.writeTildeString(mobile.race || 'human');

    // Act flags, Affect flags, alignment, gold_min, gold_max, xp
    const actFlags = String(mobile.actFlags || '0').trim();
    const affectFlags = String(mobile.affectFlags || '0').trim();
    const align = Number.isInteger(mobile.alignment) ? mobile.alignment : 0;
    const goldMin = Number.isInteger(mobile.goldMin) ? mobile.goldMin : 0;
    const goldMax = Number.isInteger(mobile.goldMax) ? mobile.goldMax : 0;
    const xp = Number.isInteger(mobile.xp) ? mobile.xp : 0;
    content += `${actFlags} ${affectFlags} ${align} ${goldMin} ${goldMax}\n`;

    // Level, class(?), hitdice, damdice, damtype
    const level = Number.isInteger(mobile.level) ? mobile.level : 1;
    const hitdice = String(mobile.hitdice || '1d1+0');
    const damdice = String(mobile.damDice || '1d1+0');
    const damtype = String(mobile.damType || 'punch');
    content += `${level} 0 ${hitdice} ${damdice} ${damtype}\n`;

    // AC values: pierce, bash, slash, magic
    const acPierce = Number.isInteger(mobile.acPierce) ? mobile.acPierce : 0;
    const acBash = Number.isInteger(mobile.acBash) ? mobile.acBash : 0;
    const acSlash = Number.isInteger(mobile.acSlash) ? mobile.acSlash : 0;
    const acMagic = Number.isInteger(mobile.acMagic) ? mobile.acMagic : 0;
    content += `${acPierce} ${acBash} ${acSlash} ${acMagic}\n`;

    // Immunity, resistance, vulnerability, default position
    const immFlags = String(mobile.immFlags || '0').trim();
    const resFlags = String(mobile.resFlags || '0').trim();
    const vulFlags = String(mobile.vulFlags || '0').trim();
    const defPos = String(mobile.defaultPos || 'stand');
    content += `${immFlags} ${resFlags} ${vulFlags} ${defPos}\n`;

    // Default position, fight position, gender, size
    const fightPos = String(mobile.fightPos || 'stand');
    const gender = String(mobile.gender || 'neutral');
    const size = String(mobile.size || 'medium');
    content += `${defPos} ${fightPos} ${gender} ${size}\n`;

    return content;
  }

  /**
   * Generate single object block
   * @param {Object} obj - Object object
   * @returns {string} Object block content
   */
  static generateObject(obj) {
    let content = `#${obj.vnum}\n`;

    content += this.writeTildeString(obj.keywords || obj.name || `object ${obj.vnum}`);
    content += this.writeTildeString(obj.short || `an object ${obj.vnum}`);
    content += this.writeTildeString(obj.long || `An object ${obj.vnum} is here.`);
    content += this.writeTildeString(obj.material || '~');

    // Item type, wear flags, extra flags
    const itemType = String(obj.itemType || 'trash');
    const wearFlags = String(obj.wearFlags || '0');
    const extraFlags = String(obj.extraFlags || '0');
    content += `${itemType} ${wearFlags} ${extraFlags}\n`;

    // Values (up to 5)
    const values = obj.values || [0, 0, 0, 0, 0];
    const valueStr = values.slice(0, 5).map(v => {
      if (typeof v === 'string') {
        return v; // Already a spell name or quoted string
      }
      return String(v);
    }).join(' ');
    content += `${valueStr}\n`;

    // Weight, value, level, condition
    const weight = Number.isInteger(obj.weight) ? obj.weight : 0;
    const value = Number.isInteger(obj.value) ? obj.value : 0;
    const level = Number.isInteger(obj.level) ? obj.level : 0;
    const condChar = String.fromCharCode(obj.condition || 80); // Default 'P'
    content += `${weight} ${value} ${level} ${condChar}\n`;

    // Extra descriptions
    (obj.extraDescriptions || []).forEach((extra) => {
      content += 'E\n';
      content += this.writeTildeString(extra.keywords || '');
      content += this.writeTildeString(extra.description || '');
    });

    // Affects
    (obj.affects || []).forEach((affect) => {
      content += 'A\n';
      const affectType = String(affect.type || '0');
      const affectValue = Number.isInteger(affect.value) ? affect.value : 0;
      content += `${affectType} ${affectValue}\n`;
    });

    return content;
  }

  static generateShopsOnly(shops) {
    const sortedShops = [...(shops || [])].sort((a, b) => a.vnum - b.vnum);
    let content = '';
    sortedShops.forEach((shop) => {
      content += this.generateShop(shop);
    });
    content += '0\n';
    return content;
  }

  static generateShop(shop) {
    const buyTypes = (shop.buyTypes || [0, 0, 0, 0, 0])
      .map(t => String(t).padStart(2, ' '))
      .join(' ');
    
    const profitBuy = String(shop.profitBuy || 100).padStart(3, ' ');
    const profitSell = String(shop.profitSell || 50).padStart(3, ' ');
    const openTime = String(shop.openTime || 0).padStart(2, ' ');
    const closeTime = String(shop.closeTime || 23).padStart(2, ' ');
    const desc = shop.description ? ` * ${this.sanitizeText(shop.description)}` : '';
    
    return `  ${shop.vnum}  ${shop.keeperVnum}${buyTypes} ${profitBuy} ${profitSell} ${openTime} ${closeTime}${desc}\n`;
  }

  static generateSpecialsOnly(specials) {
    let content = '';
    const mobSpecials = (specials || []).filter(s => s.type === 'M');
    const objSpecials = (specials || []).filter(s => s.type === 'O');
    const roomSpecials = (specials || []).filter(s => s.type === 'R');
    
    // Group by type and generate
    [...mobSpecials, ...objSpecials, ...roomSpecials].forEach((special) => {
      content += this.generateSpecial(special);
    });
    content += '0\n';
    return content;
  }

  static generateSpecial(special) {
    const desc = special.description ? ` * ${this.sanitizeText(special.description)}` : '';
    return `  ${special.type} ${special.vnum} ${special.specName}${desc}\n`;
  }

  /**
   * Validate before generation
   * @param {Object} areaData - Area data to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(areaData) {
    const errors = [];

    if (!areaData.area || !areaData.area.name) {
      errors.push('Area must have a name');
    }

    if (!areaData.rooms) {
      errors.push('Area must include rooms array');
    }

    // Check for duplicate vnums
    const vnums = new Map();
    areaData.rooms.forEach((room) => {
      if (vnums.has(room.vnum)) {
        errors.push(`Duplicate room vnum: ${room.vnum}`);
      }
      vnums.set(room.vnum, true);
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default AreGenerator;
