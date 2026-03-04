/**
 * ROM 2.4 Area File Parser
 * Parses .are files into structured JSON format
 */

export class AreParser {
  static DIRECTION_MAP = {
    0: 'north',
    1: 'east',
    2: 'south',
    3: 'west',
    4: 'up',
    5: 'down',
  };

  static parseVnumRange(line) {
    const matches = (line || '').match(/-?\d+/g) || [];
    if (matches.length >= 2) {
      return [parseInt(matches[0], 10), parseInt(matches[1], 10)];
    }
    return [0, 0];
  }

  static readTildeBlock(lines, startIndex) {
    if (startIndex >= lines.length) {
      return { text: '', nextIndex: startIndex };
    }

    const firstLine = lines[startIndex] ?? '';
    const tildePos = firstLine.indexOf('~');
    if (tildePos !== -1) {
      return {
        text: firstLine.slice(0, tildePos).trim(),
        nextIndex: startIndex + 1,
      };
    }

    const blockLines = [];
    let index = startIndex;
    while (index < lines.length) {
      const current = lines[index] ?? '';
      const currentTildePos = current.indexOf('~');
      if (currentTildePos !== -1) {
        blockLines.push(current.slice(0, currentTildePos));
        index++;
        break;
      }
      blockLines.push(current);
      index++;
    }

    return {
      text: blockLines.join('\n').trim(),
      nextIndex: index,
    };
  }

  static parseExitData(line) {
    const values = (line || '').match(/-?\d+/g) || [];
    if (values.length === 0) {
      return null;
    }
    return {
      lockFlags: parseInt(values[0], 10),
      keyVnum: values.length > 1 ? parseInt(values[1], 10) : -1,
      targetVnum: parseInt(values[values.length - 1], 10),
    };
  }

  static parseRoomBlock(lines, startIndex) {
    const header = (lines[startIndex] || '').trim();
    const vnum = parseInt(header.substring(1), 10);
    if (Number.isNaN(vnum) || vnum <= 0) {
      return { room: null, nextIndex: startIndex + 1 };
    }

    let index = startIndex + 1;
    const room = {
      vnum,
      name: '',
      desc: '',
      flags: [],
      type: 'normal',
      terrain: 'any',
      exits: [],
      npcs: [],
      objects: [],
      rawRoomFlags: '',
      extraDescriptions: [],
      trailingDirectives: [],
    };

    const roomName = this.readTildeBlock(lines, index);
    room.name = roomName.text;
    index = roomName.nextIndex;

    const roomDesc = this.readTildeBlock(lines, index);
    room.desc = roomDesc.text;
    index = roomDesc.nextIndex;

    if (index < lines.length) {
      room.rawRoomFlags = (lines[index] || '').trim();
      index++;
    }

    while (index < lines.length) {
      const token = (lines[index] || '').trim();

      if (!token) {
        index++;
        continue;
      }

      if (token === 'S') {
        index++;
        break;
      }

      if (token === 'E') {
        index++;
        const keywords = this.readTildeBlock(lines, index);
        index = keywords.nextIndex;
        const extraText = this.readTildeBlock(lines, index);
        index = extraText.nextIndex;
        room.extraDescriptions.push({
          keywords: keywords.text,
          text: extraText.text,
        });
        continue;
      }

      if (/^D\d+$/.test(token)) {
        const dirIndex = parseInt(token.substring(1), 10);
        const direction = this.DIRECTION_MAP[dirIndex] || `dir${dirIndex}`;
        index++;

        const exitDesc = this.readTildeBlock(lines, index);
        index = exitDesc.nextIndex;
        const exitKeywords = this.readTildeBlock(lines, index);
        index = exitKeywords.nextIndex;

        const exitData = this.parseExitData((lines[index] || '').trim());
        index++;

        if (exitData && Number.isInteger(exitData.targetVnum) && exitData.targetVnum >= 0) {
          room.exits.push({
            direction,
            targetVnum: exitData.targetVnum,
            keyVnum: exitData.keyVnum,
            lockFlags: exitData.lockFlags,
            keyword: exitKeywords.text,
            desc: exitDesc.text,
            doorType: exitData.keyVnum >= 0 ? 'door' : 'none',
          });
        }
        continue;
      }

      if (token.startsWith('#')) {
        break;
      }

      room.trailingDirectives.push(lines[index] || '');
      index++;
    }

    return { room, nextIndex: index };
  }

  static isSectionHeader(line) {
    const token = (line || '').trim();
    return /^#[A-Z\$]+$/.test(token);
  }

  static parseEntityBlock(lines, startIndex, type) {
    const header = (lines[startIndex] || '').trim();
    const vnum = parseInt(header.substring(1), 10);
    if (Number.isNaN(vnum) || vnum <= 0) {
      return { entity: null, nextIndex: startIndex + 1 };
    }

    let index = startIndex + 1;
    const blockLines = [];

    while (index < lines.length) {
      const raw = lines[index] ?? '';
      const trimmed = raw.trim();

      if (trimmed === '#0') {
        break;
      }

      if (/^#\d+$/.test(trimmed)) {
        break;
      }

      if (this.isSectionHeader(trimmed)) {
        break;
      }

      blockLines.push(raw);
      index++;
    }

    const entity = {
      type,
      vnum,
      keywords: '',
      short: '',
      long: '',
      desc: '',
      race: '',
      rawLines: blockLines,
    };

    if (blockLines.length > 0) {
      const firstTilde = this.readTildeBlock(blockLines, 0);
      entity.keywords = firstTilde.text;

      if (firstTilde.nextIndex < blockLines.length) {
        const secondTilde = this.readTildeBlock(blockLines, firstTilde.nextIndex);
        entity.short = secondTilde.text;

        if (secondTilde.nextIndex < blockLines.length) {
          const thirdTilde = this.readTildeBlock(blockLines, secondTilde.nextIndex);
          entity.long = thirdTilde.text;

          if (thirdTilde.nextIndex < blockLines.length) {
            const fourthTilde = this.readTildeBlock(blockLines, thirdTilde.nextIndex);
            entity.desc = fourthTilde.text;

            if (type === 'mobile' && fourthTilde.nextIndex < blockLines.length) {
              const maybeRace = this.readTildeBlock(blockLines, fourthTilde.nextIndex);
              entity.race = maybeRace.text;
            }
          }
        }
      }
    }

    return { entity, nextIndex: index };
  }

  /**
   * Parse ROM .are file content into structured data
   * @param {string} content - Raw .are file content
   * @param {string} fileName - Name of the area file
   * @returns {Object} Parsed area data
   */
  static parse(content, fileName = 'unknown') {
    const lines = content.split('\n');
    let currentSection = null;
    let i = 0;

    const result = {
      area: {
        name: fileName.replace('.are', ''),
        author: 'Unknown',
        levelRange: '1-50',
        vnumRange: [0, 0],
      },
      rooms: [],
      mobiles: [],
      objects: [],
      resets: [],
      shops: [],
      specials: [],
      __parsedSections: [],
    };

    while (i < lines.length) {
      const line = lines[i].trim();

      // Skip empty lines and comments
      if (!line || line.startsWith('*')) {
        i++;
        continue;
      }

      // Section headers
      if (line === '#AREA') {
        i++;
        const areaName = this.readTildeBlock(lines, i);
        result.area.name = areaName.text || fileName.replace('.are', '');
        i = areaName.nextIndex;

        const areaAuthor = this.readTildeBlock(lines, i);
        result.area.author = areaAuthor.text || 'Unknown';
        i = areaAuthor.nextIndex;

        const areaLevel = this.readTildeBlock(lines, i);
        result.area.levelRange = areaLevel.text || '1-50';
        i = areaLevel.nextIndex;

        if (i < lines.length) {
          result.area.vnumRange = this.parseVnumRange((lines[i] || '').trim());
          i++;
        }
        continue;
      }

      if (line === '#ROOMS') {
        currentSection = 'rooms';
        result.__parsedSections.push('rooms');
        i++;
        continue;
      }

      if (line === '#MOBILES') {
        currentSection = 'mobiles';
        result.__parsedSections.push('mobiles');
        i++;
        continue;
      }

      if (line === '#OBJECTS') {
        currentSection = 'objects';
        result.__parsedSections.push('objects');
        i++;
        continue;
      }

      if (line === '#RESETS') {
        currentSection = 'resets';
        result.__parsedSections.push('resets');
        i++;
        const resetBlock = this.parseResetsSection(lines, i);
        result.resets = resetBlock.resets;
        i = resetBlock.nextIndex;
        currentSection = null;
        continue;
      }

      if (line === '#SHOPS') {
        currentSection = 'shops';
        result.__parsedSections.push('shops');
        i++;
        const shopBlock = this.parseShopsSection(lines, i);
        result.shops = shopBlock.shops;
        i = shopBlock.nextIndex;
        currentSection = null;
        continue;
      }

      if (line === '#SPECIALS') {
        currentSection = 'specials';
        result.__parsedSections.push('specials');
        i++;
        const specialBlock = this.parseSpecialsSection(lines, i);
        result.specials = specialBlock.specials;
        i = specialBlock.nextIndex;
        currentSection = null;
        continue;
      }

      if (line === '#$' || line === '#END') {
        break;
      }

      if (currentSection === 'rooms' && line.startsWith('#')) {
        if (!/^#\d+$/.test(line)) {
          currentSection = null;
          i++;
          continue;
        }

        const roomBlock = this.parseRoomBlock(lines, i);
        if (roomBlock.room) {
          result.rooms.push(roomBlock.room);
        }
        i = roomBlock.nextIndex;
        continue;
      }

      if (currentSection === 'mobiles' && line.startsWith('#')) {
        if (line === '#0') {
          currentSection = null;
          i++;
          continue;
        }

        if (!/^#\d+$/.test(line)) {
          currentSection = null;
          i++;
          continue;
        }

        const mobileBlock = this.parseFullMobileBlock(lines, i);
        if (mobileBlock.mobile) {
          result.mobiles.push(mobileBlock.mobile);
        }
        i = mobileBlock.nextIndex;
        continue;
      }

      if (currentSection === 'objects' && line.startsWith('#')) {
        if (line === '#0') {
          currentSection = null;
          i++;
          continue;
        }

        if (!/^#\d+$/.test(line)) {
          currentSection = null;
          i++;
          continue;
        }

        const objectBlock = this.parseFullObjectBlock(lines, i);
        if (objectBlock.object) {
          result.objects.push(objectBlock.object);
        }
        i = objectBlock.nextIndex;
        continue;
      }

      i++;
    }

    return result;
  }

  /**
   * Get list of all room vnums in a parsed area
   * @param {Object} areaData - Parsed area data
   * @returns {Array<number>} Array of room vnums
   */
  static getRoomVnums(areaData) {
    return areaData.rooms.map(r => r.vnum).sort((a, b) => a - b);
  }

  /**
   * Find room by vnum
   * @param {Object} areaData - Parsed area data
   * @param {number} vnum - Room vnum
   * @returns {Object|null} Room object or null
   */
  static findRoom(areaData, vnum) {
    return areaData.rooms.find(r => r.vnum === vnum) || null;
  }

  /**
   * Parse a complete mobile definition block
   * Mobile format per ROM:
   * #VNUM
   * keywords~
   * short~
   * long~
   * description~ (optional multiline)
   * race~
   * act_flags affect_flags alignment gold xp
   * level class hitdice damage_dice attack_type
   * ac_pierce ac_bash ac_slash ac_magic
   * imm_flags res_flags vul_flags position_stuff
   * position gender gold_coin_value level
   * flags size gender extra
   */
  static parseFullMobileBlock(lines, startIndex) {
    const headerLine = (lines[startIndex] || '').trim();
    const vnum = parseInt(headerLine.substring(1), 10);
    
    if (Number.isNaN(vnum) || vnum <= 0) {
      return { mobile: null, nextIndex: startIndex + 1 };
    }

    let index = startIndex + 1;
    const mobile = {
      vnum,
      keywords: '',
      short: '',
      long: '',
      description: '',
      race: '',
      // Basic stats
      actFlags: '',
      affectFlags: '',
      alignment: 0,
      goldMin: 0,
      goldMax: 0, 
      xp: 0,
      // Combat stats
      level: 1,
      hitdice: '1d1+0',
      damDice: '1d1+0',
      damType: 'punch',
      // Armor values
      acPierce: 0,
      acBash: 0,
      acSlash: 0,
      acMagic: 0,
      // Immunities/Resistances
      immFlags: '',
      resFlags: '',
      vulFlags: '',
      // Position/Gender stuff
      defaultPos: 'stand',
      fightPos: 'stand',
      gender: 'neutral',
      size: 'medium',
      // Raw backup
      rawLines: [],
      trailingData: [],
    };

    // Parse as tilde blocks first
    const keywords = this.readTildeBlock(lines, index);
    mobile.keywords = keywords.text;
    index = keywords.nextIndex;

    const shortDesc = this.readTildeBlock(lines, index);
    mobile.short = shortDesc.text;
    index = shortDesc.nextIndex;

    const longDesc = this.readTildeBlock(lines, index);
    mobile.long = longDesc.text;
    index = longDesc.nextIndex;

    const desc = this.readTildeBlock(lines, index);
    mobile.description = desc.text;
    index = desc.nextIndex;

    const race = this.readTildeBlock(lines, index);
    mobile.race = race.text;
    index = race.nextIndex;

    // Now parse numeric lines
    if (index < lines.length) {
      const statsLine = (lines[index] || '').trim();
      if (statsLine && !statsLine.startsWith('#')) {
        const statTokens = statsLine.split(/\s+/);
        if (statTokens.length >= 4) {
          mobile.actFlags = statTokens[0] || '';
          mobile.affectFlags = statTokens[1] || '';
          mobile.alignment = parseInt(statTokens[2], 10) || 0;
          // Handle gold (could be single or range)
          if (statTokens.length >= 5) {
            mobile.goldMin = parseInt(statTokens[3], 10) || 0;
            mobile.goldMax = parseInt(statTokens[4], 10) || 0;
          }
          if (statTokens.length >= 6) {
            mobile.xp = parseInt(statTokens[5], 10) || 0;
          }
        }
        index++;
      }
    }

    // Parse combat stats
    if (index < lines.length) {
      const combatLine = (lines[index] || '').trim();
      if (combatLine && !combatLine.startsWith('#')) {
        const combatTokens = combatLine.split(/\s+/);
        if (combatTokens.length >= 4) {
          mobile.level = parseInt(combatTokens[0], 10) || 1;
          // Second field is sometimes "class" or other info, skip or store
          const hitStr = combatTokens[1] || '';
          const damStr = combatTokens[2] || '';
          mobile.damType = combatTokens[3] || 'punch';
          
          // Parse hit dice (e.g., "1d1+999")
          if (hitStr && hitStr.includes('d')) {
            mobile.hitdice = hitStr;
          }
          // Parse dam dice (e.g., "1d1+99")
          if (damStr && damStr.includes('d')) {
            mobile.damDice = damStr;
          }
        }
        index++;
      }
    }

    // Parse AC values
    if (index < lines.length) {
      const acLine = (lines[index] || '').trim();
      if (acLine && !acLine.startsWith('#')) {
        const acTokens = acLine.split(/\s+/);
        if (acTokens.length >= 4) {
          mobile.acPierce = parseInt(acTokens[0], 10) || 0;
          mobile.acBash = parseInt(acTokens[1], 10) || 0;
          mobile.acSlash = parseInt(acTokens[2], 10) || 0;
          mobile.acMagic = parseInt(acTokens[3], 10) || 0;
        }
        index++;
      }
    }

    // Parse immunity/resistance flags
    if (index < lines.length) {
      const flagLine = (lines[index] || '').trim();
      if (flagLine && !flagLine.startsWith('#')) {
        const flagTokens = flagLine.split(/\s+/);
        if (flagTokens.length >= 3) {
          mobile.immFlags = flagTokens[0] || '';
          mobile.resFlags = flagTokens[1] || '';
          mobile.vulFlags = flagTokens[2] || '';
          // Fourth field sometimes has position/gender
          if (flagTokens.length >= 4 && flagTokens[3]) {
            mobile.defaultPos = flagTokens[3].toLowerCase();
          }
        }
        index++;
      }
    }

    // Parse position/gender/size info
    if (index < lines.length) {
      const posLine = (lines[index] || '').trim();
      if (posLine && !posLine.startsWith('#')) {
        const posTokens = posLine.split(/\s+/);
        if (posTokens.length >= 3) {
          mobile.defaultPos = posTokens[0] || 'stand';
          mobile.fightPos = posTokens[1] || 'stand';
          mobile.gender = posTokens[2] || 'neutral';
          // Size or level might be here
          if (posTokens.length >= 4) {
            mobile.size = posTokens[3] || 'medium';
          }
        }
        index++;
      }
    }

    // Last line - additional flags
    if (index < lines.length) {
      const lastLine = (lines[index] || '').trim();
      if (lastLine && !lastLine.startsWith('#') && lastLine !== '0') {
        mobile.trailingData.push(lastLine);
        index++;
      }
    }

    // Find #0 terminator
    while (index < lines.length) {
      const line = (lines[index] || '').trim();
      if (line === '#0') {
        index++;
        break;
      }
      if (line.startsWith('#')) {
        break;
      }
      index++;
    }

    return { mobile, nextIndex: index };
  }

  /**
   * Parse a complete object definition block
   * Object format per ROM:
   * #VNUM
   * keywords~
   * short name~
   * long description~
   * material~
   * item_type wear_flags extra_flags
   * v0 v1 v2 v3 v4 (values - type dependent)
   * weight value level condition
   * E keywords~ (extra descriptions - optional, repeating)
   * description~
   * A apply_type apply_value (affects - optional, repeating)
   */
  static parseFullObjectBlock(lines, startIndex) {
    const headerLine = (lines[startIndex] || '').trim();
    const vnum = parseInt(headerLine.substring(1), 10);
    
    if (Number.isNaN(vnum) || vnum <= 0) {
      return { object: null, nextIndex: startIndex + 1 };
    }

    let index = startIndex + 1;
    const object = {
      vnum,
      keywords: '',
      short: '',
      long: '',
      material: '',
      itemType: 'trash',
      wearFlags: '0',
      extraFlags: '0',
      values: [0, 0, 0, 0, 0],
      weight: 0,
      value: 0,
      level: 0,
      condition: 0,
      extraDescriptions: [],
      affects: [],
      rawLines: [],
    };

    // Parse tilde blocks
    const keywords = this.readTildeBlock(lines, index);
    object.keywords = keywords.text;
    index = keywords.nextIndex;

    const short = this.readTildeBlock(lines, index);
    object.short = short.text;
    index = short.nextIndex;

    const long = this.readTildeBlock(lines, index);
    object.long = long.text;
    index = long.nextIndex;

    const material = this.readTildeBlock(lines, index);
    object.material = material.text;
    index = material.nextIndex;

    // Parse item type, wear and extra flags
    if (index < lines.length) {
      const typeLine = (lines[index] || '').trim();
      if (typeLine && !typeLine.startsWith('#') && !typeLine.startsWith('E') && !typeLine.startsWith('A')) {
        const typeTokens = typeLine.split(/\s+/);
        if (typeTokens.length >= 3) {
          object.itemType = typeTokens[0] || 'trash';
          object.wearFlags = typeTokens[1] || '0';
          object.extraFlags = typeTokens[2] || '0';
        }
        index++;
      }
    }

    // Parse values
    if (index < lines.length) {
      const valuesLine = (lines[index] || '').trim();
      if (valuesLine && !valuesLine.startsWith('#') && !valuesLine.startsWith('E') && !valuesLine.startsWith('A')) {
        const valueTokens = valuesLine.split(/\s+/);
        for (let v = 0; v < 5 && v < valueTokens.length; v++) {
          // Parse value - could be number or string like 'spell_name'
          const val = valueTokens[v];
          if (val.includes("'")) {
            object.values[v] = val;
          } else {
            object.values[v] = parseInt(val, 10) || 0;
          }
        }
        index++;
      }
    }

    // Parse weight, value, level, condition
    if (index < lines.length) {
      const statsLine = (lines[index] || '').trim();
      if (statsLine && !statsLine.startsWith('#') && !statsLine.startsWith('E') && !statsLine.startsWith('A')) {
        const statsTokens = statsLine.split(/\s+/);
        if (statsTokens.length >= 4) {
          object.weight = parseInt(statsTokens[0], 10) || 0;
          object.value = parseInt(statsTokens[1], 10) || 0;
          object.level = parseInt(statsTokens[2], 10) || 0;
          object.condition = statsTokens[3] ? statsTokens[3].charCodeAt(0) : 80; // ASCII value
        }
        index++;
      }
    }

    // Parse extra descriptions and applies
    while (index < lines.length) {
      const line = (lines[index] || '').trim();
      
      if (line === '#0' || line.startsWith('#')) {
        break;
      }

      if (line === 'E') {
        index++;
        const extraKeywords = this.readTildeBlock(lines, index);
        const extra = {
          keywords: extraKeywords.text,
          description: '',
        };
        index = extraKeywords.nextIndex;

        const extraDesc = this.readTildeBlock(lines, index);
        extra.description = extraDesc.text;
        index = extraDesc.nextIndex;

        object.extraDescriptions.push(extra);
        continue;
      }

      if (line === 'A') {
        index++;
        const affectLine = (lines[index] || '').trim();
        if (affectLine && !affectLine.startsWith('#')) {
          const affectTokens = affectLine.split(/\s+/);
          if (affectTokens.length >= 2) {
            object.affects.push({
              type: affectTokens[0],
              value: parseInt(affectTokens[1], 10) || 0,
            });
          }
          index++;
        }
        continue;
      }

      if (!line) {
        index++;
        continue;
      }

      // Skip unknown lines
      index++;
    }

    // Find #0 terminator
    while (index < lines.length) {
      const line = (lines[index] || '').trim();
      if (line === '#0') {
        index++;
        break;
      }
      if (line.startsWith('#')) {
        break;
      }
      index++;
    }

    return { object, nextIndex: index };
  }

  static parseResetsSection(lines, startIndex) {
    const resets = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = (lines[i] || '').trim();

      if (!line || line.startsWith('*')) {
        i++;
        continue;
      }

      if (line === 'S') {
        i++;
        break;
      }

      if (line.startsWith('#')) {
        break;
      }

      const commentPos = line.indexOf('*');
      const commandPart = commentPos !== -1 ? line.substring(0, commentPos).trim() : line;
      const comment = commentPos !== -1 ? line.substring(commentPos + 1).trim() : '';

      if (!commandPart) {
        i++;
        continue;
      }

      const tokens = commandPart.split(/\s+/);
      if (tokens.length === 0) {
        i++;
        continue;
      }

      const cmd = tokens[0];
      const numTokens = tokens.length;

      const reset = {
        command: cmd,
        rawLine: commandPart,
        comment,
        values: [],
        vnum: null,
      };

      switch (cmd) {
        case 'M':
          if (numTokens >= 5) {
            reset.values = [
              parseInt(tokens[1], 10) || 0,
              parseInt(tokens[2], 10) || 0,
              parseInt(tokens[3], 10) || 0,
              parseInt(tokens[4], 10) || 0,
            ];
            if (numTokens >= 6) {
              reset.values.push(parseInt(tokens[5], 10) || 0);
            }
            reset.vnum = reset.values[1];
          }
          break;

        case 'O':
          if (numTokens >= 5) {
            reset.values = [
              parseInt(tokens[1], 10) || 0,
              parseInt(tokens[2], 10) || 0,
              parseInt(tokens[3], 10) || 0,
              parseInt(tokens[4], 10) || 0,
            ];
            reset.vnum = reset.values[1];
          }
          break;

        case 'G':
        case 'E':
        case 'P':
          if (numTokens >= 4) {
            reset.values = [
              parseInt(tokens[1], 10) || 0,
              parseInt(tokens[2], 10) || 0,
              parseInt(tokens[3], 10) || 0,
            ];
            if (numTokens >= 5 && cmd !== 'G') {
              reset.values.push(parseInt(tokens[4], 10) || 0);
            }
            reset.vnum = reset.values[1];
          }
          break;

        case 'D':
        case 'R':
          if (numTokens >= 4) {
            reset.values = [
              parseInt(tokens[1], 10) || 0,
              parseInt(tokens[2], 10) || 0,
              parseInt(tokens[3], 10) || 0,
            ];
            if (numTokens >= 5) {
              reset.values.push(parseInt(tokens[4], 10) || 0);
            }
            reset.vnum = reset.values[1];
          }
          break;

        default:
          reset.values = tokens.slice(1).map(t => parseInt(t, 10) || 0);
          if (tokens.length >= 3) {
            reset.vnum = parseInt(tokens[2], 10) || null;
          }
      }

      resets.push(reset);
      i++;
    }

    return { resets, nextIndex: i };
  }

  /**
   * Parse SHOPS section
   * Format: keeper_vnum buy_type1 buy_type2 buy_type3 buy_type4 buy_type5 profit_buy profit_sell open_time close_time * description
   * NOTE: There is no separate shop vnum - the keeper vnum identifies the shop
   */
  static parseShopsSection(lines, startIndex) {
    const shops = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = (lines[i] || '').trim();

      // End of shops section
      if (line === '0' || line === '' || line.startsWith('#')) {
        break;
      }

      // Skip comments
      if (line.startsWith('*')) {
        i++;
        continue;
      }

      const parts = line.split(/\s+/).filter(p => p.length > 0);

      // Shop format: keeper_vnum followed by buy types and other fields
      if (parts.length >= 10) {
        const keeperVnum = parseInt(parts[0], 10);
        
        // Buy types and profit values need to be parsed carefully
        // Buy types range from 0-50, profit values are typically >= 100
        // Find the transition point from buy types to profit values
        let profitStartIndex = 6; // Default: assume buy types are 5 fields (index 1-5)
        
        for (let j = 1; j <= 7 && j < parts.length; j++) {
          const val = parseInt(parts[j], 10);
          // If we find a value >= 100, that's likely where profits start
          if (val >= 100) {
            profitStartIndex = j;
            break;
          }
        }
        
        // Parse buy types (up to 5)
        const buyTypes = [];
        for (let j = 0; j < 5; j++) {
          const idx = 1 + j;
          if (idx < profitStartIndex && idx < parts.length) {
            buyTypes.push(parseInt(parts[idx], 10));
          } else {
            buyTypes.push(0);
          }
        }
        
        // Parse profit and time fields
        const numFields = parts.length;
        const profitBuy = profitStartIndex < numFields ? parseInt(parts[profitStartIndex], 10) : 100;
        const profitSell = profitStartIndex + 1 < numFields ? parseInt(parts[profitStartIndex + 1], 10) : 100;
        const openTime = profitStartIndex + 2 < numFields ? parseInt(parts[profitStartIndex + 2], 10) : 0;
        const closeTime = profitStartIndex + 3 < numFields ? parseInt(parts[profitStartIndex + 3], 10) : 23;
        
        // Extract description (after *)
        let description = '';
        const starIndex = parts.findIndex(p => p === '*');
        if (starIndex > -1 && starIndex + 1 < parts.length) {
          description = parts.slice(starIndex + 1).join(' ');
        }
        
        const shop = {
          vnum: keeperVnum, // Shop is identified by keeper vnum
          keeperVnum,
          buyTypes,
          profitBuy,
          profitSell,
          openTime,
          closeTime,
          description,
        };

        shops.push(shop);
      }

      i++;
    }

    return {
      shops,
      nextIndex: i,
    };
  }

  /**
   * Parse SPECIALS section
   * Format: Type(M/O/R) vnum spec_function_name * description
   */
  static parseSpecialsSection(lines, startIndex) {
    const specials = [];
    let i = startIndex;

    while (i < lines.length) {
      const line = (lines[i] || '').trim();

      // End of specials section
      if (line === '0' || line === '' || line.startsWith('#')) {
        break;
      }

      // Skip comments
      if (line.startsWith('*')) {
        i++;
        continue;
      }

      const parts = line.split(/\s+/);

      // Specials format: Type vnum spec_name [* description]
      if (parts.length >= 3) {
        const type = parts[0]; // M, O, or R
        const vnum = parseInt(parts[1], 10);
        const specName = parts[2];

        // Find comment after *
        let description = '';
        const starIdx = line.indexOf('*');
        if (starIdx !== -1) {
          description = line.substring(starIdx + 1).trim();
        }

        if (['M', 'O', 'R'].includes(type)) {
          const special = {
            type,
            vnum,
            specName,
            description,
          };

          specials.push(special);
        }
      }

      i++;
    }

    return {
      specials,
      nextIndex: i,
    };
  }

  /**
   * Validate area data integrity
   * @param {Object} areaData - Parsed area data
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  static validate(areaData) {
    const errors = [];

    // Check for duplicate vnums
    const vnums = new Set();
    areaData.rooms.forEach(room => {
      if (vnums.has(room.vnum)) {
        errors.push(`Duplicate room vnum: ${room.vnum}`);
      }
      vnums.add(room.vnum);
    });

    // Check for missing room names
    areaData.rooms.forEach(room => {
      if (!room.name || room.name === '') {
        errors.push(`Room ${room.vnum} has no name`);
      }
    });

    // Check for exits pointing to non-existent rooms
    areaData.rooms.forEach(room => {
      room.exits.forEach(exit => {
        if (!areaData.rooms.find(r => r.vnum === exit.targetVnum)) {
          errors.push(`Room ${room.vnum} exit ${exit.direction} points to non-existent room ${exit.targetVnum}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default AreParser;
