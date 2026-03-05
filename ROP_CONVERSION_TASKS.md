# Rites of Passage (RoP) ROM 2.4 Conversion - Master Task List

**Project Goal**: Convert ROM 2.4 into a fully-featured Rites of Passage MUD with warpoint economy, 8-sect alignment system, 9-profession framework, 24 races, remort loop, and PK-based progression.

**Research Summary**: [Based on 1998-2006 archived RoP documentation with 7 high-confidence sources]

---

## Phase 0: Foundation & Data Model (Core Infrastructure)

### Task 0.1: Expand Core Constants
- [ ] **src/merc.h** - Update MAX_CLASS from 4 → 10 (allow 9 professions + buffer)
- [ ] **src/merc.h** - Update MAX_CLAN from 3 → 8 (align with 8 sects)
- [ ] **src/merc.h** - Update MAX_PC_RACE from 4 → 25 (support 24 races)
- [ ] **src/merc.h** - Add #define MAX_SECT 8
- [ ] **src/merc.h** - Add #define MAX_PROFESSION 9
- [ ] Verify no hardcoded array assumptions elsewhere (search codebase for MAX_CLASS/MAX_CLAN references)

### Task 0.2: Extend char_data Structure
- [ ] **src/merc.h** - Add to struct char_data: `int warpoint;` (PK economy currency)
- [ ] **src/merc.h** - Add to struct char_data: `int profession_rank;` (tracks progression for remort benefits)
- [ ] **src/merc.h** - Add to struct char_data: `int remort_count;` (number of remorts completed)
- [ ] **src/merc.h** - Add to struct char_data: `int sect_number;` (sect alignment, 0-7)
- [ ] **src/merc.h** - Add to struct char_data: `bool remort_benefits_applied;` (flag for stat persistence)
- [ ] **src/merc.h** - Add to struct char_data: `int remort_hp_bonus;` (customizable remort benefit)
- [ ] **src/merc.h** - Add to struct char_data: `int remort_move_bonus;` (customizable remort benefit)
- [ ] **src/merc.h** - Add to struct char_data: `int remort_skill_slots;` (customizable remort benefit)
- [ ] **src/merc.h** - Add to struct char_data: `bool remort_no_food;` (customizable remort benefit)
- [ ] **src/merc.h** - Add to struct char_data: `bool remort_no_drink;` (customizable remort benefit)

### Task 0.3: Create Profession Table Structure
- [ ] **src/merc.h** - Create struct profession_type with fields:
  - name (e.g., "Warrior")
  - who_name (e.g., "War")
  - attr_prime (primary stat: STR/INT/WIS/DEX)
  - weapon (preferred weapon type)
  - skill_adept (skill cap bonus %)
  - thac0 (to-hit bonus)
  - hp_min/hp_max (hp gains per level)
  - mana_mult (mana gain multiplier for casters)
  - base_group (group name for base skills)
  - default_group (group name for default skills)

### Task 0.4: Create Sect Table Structure
- [ ] **src/merc.h** - Create struct sect_type with fields:
  - name (e.g., "Aethelhelm")
  - who_name (e.g., "AET")
  - alignment_type (GOOD/EVIL - determines PK eligibility)
  - avatar_string (e.g., "Avatar of Aethelhelm")
  - hall_vnum (sect house location)
  - protect_good/protect_evil (alignment-specific benefits)
  - base_group (group name for sect-exclusive spells/skills)

### Task 0.5: Initialize New Structures
- [ ] **src/const.c** - Create empty profession_table[MAX_PROFESSION] array (will populate in Phase 3)
- [ ] **src/tables.c** - Create empty sect_table[MAX_SECT] array (will populate in Phase 3)
- [ ] **src/tables.c** - Update clan_table[] to use new MAX_CLAN=8 size
- [ ] **src/const.c** - Update pc_race_table[] to use new MAX_PC_RACE=25 size
- [ ] **src/const.c** - Update class_table[MAX_CLASS] to use new MAX_CLASS=10 size

---

## Phase 1: Persistence Layer (Save/Load System)

### Task 1.1: Extend Save Format
- [ ] **src/save.c** - Add save file version marker (e.g., "V3" for RoP format)
- [ ] **src/save.c** - Add to save_char(): `fprintf(fp, "Warpoint %d~\n", ch->warpoint);`
- [ ] **src/save.c** - Add to save_char(): `fprintf(fp, "ProfessionRank %d~\n", ch->profession_rank);`
- [ ] **src/save.c** - Add to save_char(): `fprintf(fp, "RemortCount %d~\n", ch->remort_count);`
- [ ] **src/save.c** - Add to save_char(): `fprintf(fp, "Sect %d~\n", ch->sect_number);`
- [ ] **src/save.c** - Add to save_char(): `fprintf(fp, "RemortBenefits %d %d %d %d %d~\n", ch->remort_hp_bonus, ch->remort_move_bonus, ch->remort_skill_slots, ch->remort_no_food, ch->remort_no_drink);`

### Task 1.2: Extend Load Format
- [ ] **src/save.c** - Add case "Warpoint": ch->warpoint = fread_number(fp);
- [ ] **src/save.c** - Add case "ProfessionRank": ch->profession_rank = fread_number(fp);
- [ ] **src/save.c** - Add case "RemortCount": ch->remort_count = fread_number(fp);
- [ ] **src/save.c** - Add case "Sect": ch->sect_number = fread_number(fp);
- [ ] **src/save.c** - Add case "RemortBenefits": parse 5 values into remort_* fields
- [ ] **src/save.c** - Add backward compatibility: default new fields to 0 if missing (old savefiles)

### Task 1.3: Test Save/Load Migration
- [ ] Create test procedure for loading old ROM 2.4 savefiles with new code
- [ ] Verify new fields initialize to correct defaults
- [ ] Test save/load cycle for new characters
- [ ] Test save/load cycle for remorted characters

---

## Phase 2: Character Creation System

### Task 2.1: Extend nanny.c State Machine
- [ ] **src/nanny.c** - Add new connection states:
  - CON_SELECT_PROFESSION (after class selection)
  - CON_SELECT_SECT (after profession selection)
  - CON_REMORT_INTRO (for remort confirmation)
  - CON_REMORT_CUSTOMIZE (remort benefit selection)
- [ ] **src/nanny.c** - Add profession_choice variable to descriptor_data
- [ ] **src/nanny.c** - Add sect_choice variable to descriptor_data

### Task 2.2: Implement Profession Selection State
- [ ] **src/nanny.c** - Create nanny_profession() handler function
  - Display 9 profession options with descriptions
  - Accept user selection (1-9)
  - Validate choice and set ch->class = profession_choice
  - Transition to CON_SELECT_SECT
  - Store profession selection in descriptor for char creation

### Task 2.3: Implement Sect Selection State
- [ ] **src/nanny.c** - Create nanny_sect() handler function
  - Display 8 sect options grouped by alignment (Good/Evil)
  - Show sect avatar names, alignment, and brief description
  - Accept user selection (1-8)
  - Enforce alignment choice for character (good sects → good alignment lock, evil sects → evil alignment lock)
  - Set ch->sect_number = sect_choice
  - Initialize ch->alignment based on sect choice (good sects: +1000, evil sects: -1000)
  - Transition to CON_PLAYING or CON_REMORT_INTRO if remort character

### Task 2.4: Update Existing Character Creation Flow
- [ ] **src/nanny.c** - Modify nanny_class() to branch:
  - If new player → select profession instead of fixed class
  - If returning remort → show remort info screen, offer remort benefits customization
  - Remove hardcoded 4-class selection
- [ ] **src/nanny.c** - Update all "class selection" screen text to say "profession selection"
- [ ] **src/nanny.c** - Test full character creation flow for new players
- [ ] **src/nanny.c** - Test remort flow for returning remorted players

### Task 2.5: Initialize New Character Fields
- [ ] **src/nanny.c** - Set ch->warpoint = 0 for new characters
- [ ] **src/nanny.c** - Set ch->profession_rank = 0 for new characters
- [ ] **src/nanny.c** - Set ch->remort_count = 0 for new characters
- [ ] **src/nanny.c** - Set ch->sect_number from user selection
- [ ] **src/nanny.c** - Set ch->alignment from sect choice (good = +1000, evil = -1000)
- [ ] **src/nanny.c** - Zero out all remort_* bonus fields for new characters

---

## Phase 3: World Tables & Constants (Definitions)

### Task 3.1: Define 9 Professions
- [ ] **src/const.c** - Populate profession_table[9] with:
  1. Warrior (STR, melee, base damage +10%, no professions spells)
  2. Cleric (WIS, healing, spell adept +20%, holy spells/shields)
  3. Templar (WIS, hybrid tank-heal, spell adept +10%, holy warrior spells)
  4. Monk (DEX, unarmed, hp bonus +20%, martial arts skills)
  5. Warlock (INT, dark magic, spell adept +25%, curse/debuff spells)
  6. Thief (DEX, stealth/backstab, skill adept +15%, no profession spells)
  7. Ninja (DEX, stealth/agility, skill adept +20%, swift techniques)
  8. Mage (INT, elemental magic, spell adept +30%, offensive spells)
  9. Alchemist (INT, support/utility, spell adept +15%, utility spells)
  
- [ ] Each profession_table entry must have: name, who_name, attr_prime, weapon, thac0, hp gains, base_group, default_group

### Task 3.2: Define 24+ Races
- [ ] **src/const.c** - Populate pc_race_table[25] with 24 playable races:
  - **Original ROM**: Human, Elf, Dwarf, Giant
  - **RoP Additions** (from 1998-2006 archives):
    1. Buckawn (deer-like, DEX +2, WIS +1)
    2. Bugbear (large insect-like, STR +2, CON +1)
    3. Half-Elf (human/elf hybrid, DEX +1, CHA +1)
    4. Orc (tusked, STR +2, CON +1, INT -1)
    5. Troll (regenerating, CON +2, INT -1)
    6. Centaur (half-horse, STR +1, CON +1, WIS +1)
    7. Svirfneblin (deep gnome, DEX +2, INT +1)
    8. Dragonkin (draconic, STR +1, CON +1, FIRE_RES)
    9. Minotaur (bovine, STR +2, WIS -1)
    10. Changelings (shifter, DEX +2, CHA +1)
    11. Faerie (small magical, DEX +1, INT +1, CHA +1)
    12. Gnoll (hyena-like, STR +1, CON +1)
    13. Hobgoblin (tactical, STR +1, INT +1)
    14. Kagonesti (feral elf, DEX +2, WIS +1)
    15. Kender (tinker small, DEX +2, CHA +1)
    16. Kobold (reptilian, DEX +1, INT -1)
    17. Mekan (construct, STR +1, CON +2, WIS -2)
    18. Ogre (large brute, STR +2, INT -2, CON +1)
    19. Pixie (fairy small, DEX +2, INT +1)
    20. Satyr (goat-legged, DEX +1, CHA +1)
    
- [ ] Each race must have: name, who_name, points cost, stat modifiers, class multipliers, special skills (size, special resist)

### Task 3.3: Define 8 Sects with Alignment
- [ ] **src/tables.c** - Populate sect_table[8]:
  - **Good Aligned (4)**:
    1. Aethelhelm (Valiant, protection magic, healing bonus)
    2. Kiri (Sacred, holy magic, blessing spells)
    3. Baalzom (Ancient, knowledge, +wisdom bonus)
    4. Ishta (Benevolent, nature, animal affinity)
  
  - **Evil Aligned (4)**:
    5. Zod (Tyranny, domination magic, force spells)
    6. Jalaal (Shadowy, assassination, darkness/stealth spells)
    7. Xix (Destructive, destruction magic, chaos spells)
    8. Talice (Deceptive, illusion magic, tricks/deception spells)

- [ ] Each sect_table entry: name, who_name, alignment_type, avatar_string, hall_vnum, base_group, protect_good/protect_evil
- [ ] Set sect halls to specific vnums (allocate from immort.are or create new area if needed)
- [ ] Create spell/skill groups for each sect's exclusive abilities

### Task 3.4: Update Clan Table Mapping
- [ ] **src/tables.c** - Map 3 original ROM clans to RP equivalents:
  - clan_table[0]: "Order" (maps to Good Alignment) → default for good players without specific sect
  - clan_table[1]: "Loner" (neutral mercenary) → players not joined any sect
  - clan_table[2]: "Chaos" (maps to Evil Alignment) → default for evil players without specific sect
- [ ] Expand clan_table[3-7] for player-created guilds/organizations (future feature, leave as placeholders)

---

## Phase 4: Command Layer (User-Facing Commands)

### Task 4.1: Implement do_remort Command
- [ ] **src/interp.c** - Add cmd_table entry for "remort" command
- [ ] **src/act_wiz.c** or new **src/act_remort.c** - Create do_remort() function:
  - Check if character level = 50 (max level before remort)
  - Display remort confirmation screen (warpoint requirement, level reset, benefits offered)
  - Branch to CON_REMORT_CUSTOMIZE state for benefit selection
  - On confirmation: reset ch->level = 1, increment ch->remort_count, apply remort benefits
  - Reset experience to 0, maintain base stats from previous remort benefits
  - Apply ch->remort_hp_bonus and ch->remort_move_bonus to max_hp/max_mana
- [ ] Test remort flow: character → level → remort → back to level 1 with benefits

### Task 4.2: Implement Warpoint Commands (do_warpoint, do_rank)
- [ ] **src/interp.c** - Add cmd_table entries for "warpoint" and "rank" commands
- [ ] **src/act_comm.c** - Create do_warpoint() display function:
  - Show character's current warpoint total
  - Show warpoint rank (based on threshold progression)
  - Show warpoint rank benefits (experience bonus, damage bonus, etc.)
  - Show progress to next rank
  - Show PK activity summary (kills/deaths this rank cycle)
- [ ] **src/act_comm.c** - Create do_rank() as alias for warpoint display
- [ ] Warpoint rank thresholds (example, to be balanced):
  - 0-99: Novice (1% XP bonus)
  - 100-249: Adept (2% XP bonus)
  - 250-499: Veteran (3% XP bonus)
  - 500-999: Champion (5% XP bonus)
  - 1000+: Legendary (10% XP bonus, +1 AC)

### Task 4.3: Implement do_sect Command
- [ ] **src/interp.c** - Add cmd_table entry for "sect" command
- [ ] **src/act_comm.c** - Create do_sect() function with subcommands:
  - `sect` (no args): Display current sect, avatar name, alignment lock status
  - `sect info <sect_name>`: Display sect lore, benefits, alignment
  - `sect list`: Show all 8 sects grouped by alignment
  - `sect leave`: (future) Allow sect changing (if mechanics support it)
- [ ] Display sect-specific benefits (skill/spell bonus, alignment lock, warpoint interaction)

### Task 4.4: Enhanced do_consider Command
- [ ] **src/act_comm.c** or **src/act_info.c** - Update do_consider() function:
  - Add alignment display (Good/Evil/Neutral of target)
  - Add sect display (if target visible/known)
  - Add warpoint display (if PK-flagged or enemy sect)
  - Add PK safety indicator ("Safe to attack in sect conflict" or "Serious consequence")
- [ ] Show clear warning if killing target would trigger opposite alignment warpoint award

### Task 4.5: Implement Sect Channels
- [ ] **src/interp.c** - Add cmd_table entries for "sectalk" and "sectell" commands
- [ ] **src/act_comm.c** - Extend do_channels() to show sect channel option
- [ ] **src/act_comm.c** - Create do_sectalk() function:
  - Send message only to sect members
  - Format: "$n sectells '$t'" or "$n [SECT_NAME]'s '$t'"
  - Gate by ch->sect_number membership
- [ ] **src/act_comm.c** - Create do_sectell() function:
  - Target-specific sect message (ignore if different sect)
  - Format: "$N sectells you '$t'"

### Task 4.6: Warpoint-Based Commands (Placeholder for Later)
- [ ] **src/interp.c** - Stub cmd_table entries: "selfishness", "groundfight", "manavial" (future advanced mechanics)
- [ ] Add documentation explaining these are RoP-specific mechanics for future expansion

---

## Phase 5: Core Gameplay - Warpoint Economy

### Task 5.1: Implement Warpoint Gain on Kill
- [ ] **src/fight.c** - Locate char_died() function
- [ ] Add logic when victim dies to a player:
  ```
  IF victim_alignment == GOOD AND killer_alignment == EVIL:
    killer->warpoint += warpoint_gain (calculate based on level difference, victim level)
  IF victim_alignment == EVIL AND killer_alignment == GOOD:
    killer->warpoint += warpoint_gain
  ELSE (same alignment):
    NO warpoint gain (can't PK same alignment in ROM lore)
  ```
- [ ] Warpoint gain formula (suggest): 
  - Base: 10 warpoints per kill
  - Level adjustment: +1 per 5 levels of victim above killer (max +20)
  - Death counter: Reduce gain if victim dies repeatedly to same killer (anti-farm)
- [ ] Add message to killer: "You gain [X] warpoints from slaying [victim]!"
- [ ] Test: Kill opposite alignment mob → verify warpoint gain and display (via do_warpoint)

### Task 5.2: Implement Warpoint Loss on Death
- [ ] **src/fight.c** - Extend char_died() for player death to player:
  - `IF killer is player AND is_opposite_alignment(killer, victim):`
  - `victim->warpoint -= warpoint_loss (10-25% of victim's current warpoints)`
- [ ] Add message to victim: "You lose [X] warpoints from being slain by [killer]!"
- [ ] Warpoint floor: Never go below 0
- [ ] Test: Die to opposite alignment → verify warpoint loss

### Task 5.3: Implement Anti-Farm Detection
- [ ] **src/fight.c** - Add per-character kill tracking:
  - Track "kills_vs_target" counter in struct (needs char_data extension or temp tracking during session)
  - Reset counter after 1 hour or on zone exit
  - After 5 kills of same target in 1 hour: reduce warpoint gain by 50%, then 75%, then 0%
- [ ] **src/fight.c** - Add level difference check:
  - If victim is 10+ levels below killer: reduce warpoint gain by 50%
  - If victim is 20+ levels below killer: warpoint gain = 0
- [ ] **src/fight.c** - Add XP farming prevention:
  - If character gains >5 levels in 2 hours: trigger admin alert
  - Reduce warpoint gain rate (not XP) if farming suspected
- [ ] Log suspicious activity to log/admin.log for investigation

### Task 5.4: Implement Warpoint Decay/Reset Policy
- [ ] **src/update.c** - Add update_warpoints() function called from heartbeat:
  - Every 24 hours (ticks): decay warpoints by 1% if character hasn't gained warpoints in 7 days
  - On month boundary: reset "kill count" and "death count" stats for ranking, but keep warpoint total
- [ ] Configuration: Make decay rate/schedule adjustable in config files (future)
- [ ] Allow immortals to force reset warpoints for events/seasons
- [ ] Log all warpoint changes for audit trail

### Task 5.5: Rank Progression Integration
- [ ] Create rank_table[] in const.c with thresholds and benefits:
  - Novice (0-99 WP): 1% XP bonus
  - Adept (100-249 WP): 2% XP bonus
  - Veteran (250-499 WP): 3% XP bonus
  - Champion (500-999 WP): 5% XP bonus
  - Legendary (1000+ WP): 10% XP bonus, +1 AC
- [ ] **src/update.c** - On each heartbeat, check for rank advancement
- [ ] **src/handler.c** - When applying XP bonus, calculate from rank table
- [ ] Add displayed rank name to "score" output and "consider" for enemy visibility

---

## Phase 6: Core Gameplay - Sects & Alignment

### Task 6.1: Implement Alignment Lock
- [ ] **src/nanny.c** - When sect is chosen, set immutable alignment:
  - Good sects → `ch->alignment = 1000` (locked)
  - Evil sects → `ch->alignment = -1000` (locked)
  - Prevent any spell/command from changing alignment below ±500
- [ ] **src/magic.c** - Prevent alignment-change spells (curse, bless) from exceeding ±500 threshold
- [ ] **src/act_obj.c** - Prevent item effects from changing alignment beyond threshold
- [ ] Add message: "Your sect alignment lock prevents this change."

### Task 6.2: Implement Sect-Specific Skill/Spell Groups
- [ ] **src/group.c** or create **src/sect_groups.c**:
  - Create skill groups for each sect's exclusive abilities
  - Aethelhelm: protection, holy shield, smite evil, bless
  - Kiri: heal, cure, divine favor, sanctuary
  - Baalzom: detect good, detect evil, ancient knowledge, lore
  - Ishta: animal call, nature bond, entangle, pass without trace
  - Zod: dominate, hold person, power word
  - Jalaal: assassinate, shadow, poison, backstab
  - Xix: fireball, meteor storm, chaos, destruction
  - Talice: phantasm, mirage, illusion, deception
- [ ] **src/interp.c** or **src/magic.c** - Modify gn_add() logic:
  - When character joins sect, automatically add sect-exclusive group
  - When gaining level, sect members automatically get sect group spells
  - Non-sect members cannot learn these spells
- [ ] Test: Create two characters with different sects → verify one can only learn sect-specific spells

### Task 6.3: Implement Sect Avatar Titles
- [ ] **src/const.c** - Extend title_table[] to include sect avatars:
  - When warpoint rank reaches Legendary, display "(Avatar of [SectName])" prefix in who/score
  - Option: Allow players to wear custom sect-specific title at high rank
- [ ] **src/comm.c** - Update who list to show sect prefix for high-rank players:
  - Format: "[AVATAR] PlayerName [SectName]"
- [ ] Test: Level character to Legendary rank → verify avatar title appears

### Task 6.4: Implement Sect Halls
- [ ] **area/sect_halls.are** - Create or update area file with 8 sect hall rooms:
  - Good halls: Aethelhelm, Kiri, Baalzom, Ishta temples/sanctuaries
  - Evil halls: Zod, Jalaal, Xix, Talice strongholds/lairs
  - Each should be thematic, have vendor/healer NPC, and brief lore description
  - Set sect_table[X].hall_vnum to each room vnum
- [ ] **src/interp.c** - Add "goto sect" immortal command to teleport to sect hall
- [ ] Create teleport portal NPCs or "sect transport" command for players
- [ ] Test: Join sect → teleport to hall → verify room description and NPCs

---

## Phase 7: Admin Tools & Immortal Commands

### Task 7.1: Warpoint Audit Commands
- [ ] **src/act_wiz.c** - Add do_warpoint_set() function:
  - `warpoint_set <character> <amount>` - set exact warpoint total
  - Requires LEVEL_GOD+ privilege
  - Log to admin.log with immortal name
- [ ] **src/act_wiz.c** - Add do_warpoint_show() function:
  - `warpoint_show <character>` - display full warpoint history for audit
  - Show current WP, rank, gains/losses this session, total kills/deaths
- [ ] **src/act_wiz.c** - Add do_warpoint_strip() function:
  - `warpoint_strip <character>` - reset warpoints to 0 (for cheaters/exploits)
  - Require confirmation and logging

### Task 7.2: Sect Override Commands
- [ ] **src/act_wiz.c** - Add do_sect_set() function:
  - `sect_set <character> <sect_name>` - force character to specific sect
  - Immediately change sect_number, alignment, and grant sect group
  - Log change to admin.log
- [ ] **src/act_wiz.c** - Add do_sect_alignment_force() function:
  - `sect_alignment <character> <good|evil>` - force alignment lock
  - Override character choice (for penalties or special events)

### Task 7.3: Profession Override Commands
- [ ] **src/act_wiz.c** - Add do_profession_set() function:
  - `profession_set <character> <profession_name>` - change character's profession
  - Requires full rebuild of spell/skill groups due to profession change
  - Save and reload character data
  - Log to admin.log

### Task 7.4: Remort Enforcement Commands
- [ ] **src/act_wiz.c** - Add do_remort_force() function:
  - `remort_force <character>` - force character to remort regardless of level
  - Useful for correcting broken remort states
  - Branch to remort customization or auto-apply default benefits
- [ ] **src/act_wiz.c** - Add do_remort_cancel() function:
  - `remort_cancel <character>` - undo last remort (restore previous level/exp)
  - Only works if character is still level < 10
  - Require confirmation

### Task 7.5: Anti-Exploit Investigation Tools
- [ ] **src/act_wiz.c** - Add do_audit_player() function:
  - `audit <character>` - show suspicious activity:
    - Fast level gains (alerts if 5+ levels in 2 hours)
    - Kill farming (alerts if 5+ kills on same target in 1 hour)
    - Warpoint anomalies (suspicious gain/loss patterns)
    - Multi-character account detection (if tracking)
  - Print to immortal with color-coded warnings
- [ ] **src/act_wiz.c** - Add do_freeze_multi() function:
  - `freeze_multi <character>` - freeze all known alts of accused character
  - Require confirmation and logging
  - Allow immortal to add note to account

### Task 7.6: Logging & Audit Trail
- [ ] **src/comm.c** - Extend admin logging:
  - Create log/warpoint.log for all warpoint changes (+/- events)
  - Create log/sectors.log for all sect join/leave events
  - Create log/remort.log for all remort events
  - Create log/exploit.log for suspected cheating
- [ ] Add timestamp, immortal name, character, and reason to all log entries
- [ ] Implement log rotation (weekly archive to log/archive/)

---

## Phase 8: Death Penalties & PK Economy

### Task 8.1: Implement Recoverable Death System
- [ ] **src/fight.c** - Modify char_died() to create recoverable corpse:
  - DO NOT remove character permanently
  - Create corpse object with victim's name containing dropped items
  - Set corpse decay timer to 1 hour (configurable)
  - Corpse contains all equipped items + some inventory items (configurable %)
- [ ] **src/handler.c** - Corpse object template:
  - Name: "{victim}'s corpse"
  - Short: "the corpse of {victim}"
  - Long: "It is the fresh corpse of {victim}..."
  - Contains: victim's equipped gear + 50% of inventory
- [ ] Test: Kill player → check for corpse → loot items → corpse decays

### Task 8.2: Implement XP Loss on Death
- [ ] **src/fight.c** - In char_died() for player death:
  - Calculate XP loss: 10% of current level's XP requirement (or 5-20%, tune for balance)
  - Subtract from ch->exp
  - Don't let character level down (stay at current level with reduced XP toward next)
  - Add message: "You lose [X] experience from death!"
- [ ] **src/save.c** - XP loss must be persisted to disk immediately
- [ ] Configuration: Make XP loss % adjustable in config files (no hardcoded %)

### Task 8.3: Implement Recoverable Item Loss
- [ ] **src/fight.c** - Extend corpse creation in char_died():
  - Move 100% of equipped items to corpse (full risk for gear)
  - Move 50% of inventory items to corpse (partial risk for consumables/loot)
  - Keep 50% of inventory in character death bag (safe items like quest items)
- [ ] **src/handler.c** - Add "death bag" mechanic (inventory still in player, not droppable):
  - Mark items with IN_DEATH_BAG flag
  - Can't be sold, traded, or dropped
  - Accessible only after character retrieves corpse
  - Once corpse retrieved, flag removed and items become normal
- [ ] Test: Kill player → check corpse has gear → pick up corpse → verify items returned

### Task 8.4: Implement PK Activity Tracking
- [ ] **src/fight.c** - Track in char_data (or temp session data):
  - kills_this_rank (reset on rank change)
  - deaths_this_rank (reset on rank change)
  - top_victim (highest-level enemy killed this rank)
  - killer_list (names of who killed player, keeps last 5)
- [ ] **src/comm.c** - Display in "score" or new "pkstats" command:
  - Kills this rank: [X]
  - Deaths this rank: [X]
  - Kill/Death ratio: [X.XX]
  - Strongest opponent: [name]
  - Last killed by: [name]
- [ ] Test: Participate in PK → verify stats appear in score

### Task 8.5: Death Announcement System
- [ ] **src/fight.c** - When player dies to opposite alignment player:
  - Broadcast to all players in alignment-based channel
  - Format: "[ALIGNMENT NEWS] {killer} has killed {victim} and earned {warpoints} warpoints!"
  - Only broadcast to opposite alignment (good news to good players, evil news to evil)
- [ ] **src/fight.c** - When player dies to mobiles/environment:
  - Broadcast to all players: "[NEWS] {victim} has fallen..."
  - Include death location

---

## Phase 9: Anti-Exploit & Anti-Multi

### Task 9.1: Implement Multi-Login Detection
- [ ] **src/db.c** or create **src/security.c** - Add IP tracking:
  - Track current_ip in descriptor_data
  - Compare new login IP against logged-in players' IPs
  - If same IP, warn immortals but allow login (for now)
  - Alert in admin chat: "ALERT: [IP] logging in with {new_char} while {existing_char} already online"
- [ ] **src/comm.c** - Add do_alts() immortal command:
  - `alts <character_name>` - show all known characters from same IP/account
  - Display playtime, level, warpoint count for each
  - Highlight suspicious coordination (log in/out same time)
- [ ] Log all multi-logins to log/security.log

### Task 9.2: Implement Spy Character Detection
- [ ] **src/update.c** - Add idle_spy_detection() to heartbeat:
  - If character idle > 1 hour AND level 1 AND near high-level player: flag suspicious
  - If character never gains XP but keeps logging in: flag suspicious
  - If character never casts spell/uses skill but stays in dungeon: flag suspicious
- [ ] **src/comm.c** - Add do_suspects() immortal command:
  - `suspects` - show all characters with suspicious activity flags
  - Display reason, last activity time, possible connections
- [ ] Log suspects to log/security.log with confidence level (low/medium/high)

### Task 9.3: Implement Script/Macro Detection
- [ ] **src/comm.c** - Add action velocity tracking in descriptor_data:
  - Track command_count per second
  - If >10 commands per second: likely automation/macro
  - If exact same sequence repeated 5x: likely script
- [ ] **src/interpret.c** - Flag rapid sequences:
  - "north, east, south, west, north" repeated = pattern
  - Track patterns and alert if repeated 10x in 1 minute
- [ ] **src/comm.c** - Add do_botcheck() immortal command:
  - `botcheck <character>` - show action velocity and detected patterns
  - Allow immortal to manually flag/freeze if confirmed bot
- [ ] Log detections to log/security.log

### Task 9.4: Enhance Admin Freeze/Ban System
- [ ] **src/act_wiz.c** - Extend do_freeze():
  - `freeze <character> <reason>` - freeze character with logged reason
  - Add reason field to database: frozen_reason, frozen_by, frozen_date
  - Reason displayed on login: "You are frozen by {immortal} for: {reason}"
- [ ] **src/act_wiz.c** - Add do_siteban():
  - `siteban <IP or IP_range>` - ban IP address range
  - Block login from IP with configurable warning message
  - Allow exception list for legitimate shared networks
- [ ] **src/act_wiz.c** - Add do_account_ban():
  - `account_ban <character_name>` - ban all known alts of character
  - Require immortal confirmation
  - Log to security.log with timestamp

### Task 9.5: Setup Security Audit Rails
- [ ] Create log/security.log for all suspicious activity
- [ ] Create log/warpoint.log for all warpoint changes
- [ ] Create log/frozen.log for all freeze/ban actions
- [ ] **src/comm.c** - Add daily security report:
  - Once per day, print to admin channel: "Daily Security Report: [multi-logins, suspicious accounts, warpoint anomalies]"
  - Allow immortals to investigate before action taken

---

## Phase 10: Quality of Life & Polish

### Task 10.1: Enhanced Consider Command
- [ ] **src/act_info.c** - Update do_consider() to show:
  - Enemy's alignment (Good/Evil/Neutral)
  - Enemy's sect name (if visible to player)
  - Enemy's warpoint rank (if visible/enemy alignment)
  - PK safety warning: "Warning: killing this target will trigger alignment conflict!" or "Safe kill."
  - Suggested strategy for combat
- [ ] Color-code output (green for safe, red for dangerous)

### Task 10.2: Ground Fight System (Placeholder)
- [ ] **src/fight.c** - Add ground_flag to room_index_data:
  - Some rooms (arenas) marked as ground fight areas
  - No looting in ground fight areas (items stay with corpse)
  - No warpoint gain in ground fights (practice only)
- [ ] **src/interp.c** - Add cmd_table entries for ground-fight arenas:
  - `groundfight` command to enter practice arenas
  - PvP allowed but no PK consequences (no warpoint, no item loss)

### Task 10.3: Mana Vial System (Placeholder)
- [ ] **src/act_obj.c** - Create mana vial item type:
  - Stackable consumable that restores mana on use
  - Some professions get bonus from mana vials
  - Rare drop from magical enemies
- [ ] **src/magic.c** - Add "manavial" spell/command to sell/trade mana vials
- [ ] Placeholder for future economy system

### Task 10.4: Alignment-Based Commands
- [ ] **src/act_comm.c** - Add `goodtalk` and `evilalk commands:
  - Macro channels for broadcasting to same-alignment faction
  - Limited range (same zone) or server-wide (tune later)
  - Format: "[GOOD] playername says: text" or "[EVIL] playername says: text"
- [ ] **src/interp.c** - Add cmd_table entries and restrict to alignment-locked sects

### Task 10.5: Clan System Overhaul
- [ ] Re-assess original ROM clan system integration:
  - Should clans be player-run organizations separate from sects?
  - Or should sects replace clans?
  - Document decision and plan clan/sect interaction
- [ ] Current decision: Sects are core faction system; clans are optional player groups (defer implementation)

---

## Phase 11: Area & Lore Recreation

### Task 11.1: Research World Layout
- [ ] From RoP archives (1998-2006), identify named locations:
  - Capital city (likely on Midgaard-like zone)
  - Sect halls (8 locations, one for each)
  - PvP arenas/ danger zones (where warpoints are contested)
  - Starting village/newbie area
  - Balanced mob zones for each level range
- [ ] Create area porting map referencing Wayback snapshots

### Task 11.2: Create/Update Core Area Files
- [ ] **area/midgaard.are** - Update to include RoP-specific locations:
  - Good temple (neutral ground, no fighting)
  - Evil stronghold (neutral ground, no fighting)
  - PvP arena/colosseum (free-for-all PK zone)
  - Market (safe trading zone with vendors)
- [ ] **area/sect_halls.are** - New area with 8 sect halls (see Phase 6.4)
- [ ] Balance mob difficulty across zones (level 1-10, 10-20, 20-30, 30-50)

### Task 11.3: Add Alignment-Appropriate MOBs
- [ ] Update existing mob pools to have alignment assigned
- [ ] Create good-aligned NPCs/mobs (+500 to +1000 alignment)
- [ ] Create evil-aligned NPCs/mobs (-1000 to -500 alignment)
- [ ] Ensure no unaligned (neutral) mobs in PK-relevant zones (players need clear targets)
- [ ] Add special monster types:
  - Avatar NPCs (high-level, rare, sect-specific boss mobs)
  - Minions (sect-themed creatures that help players)

### Task 11.4: Create Object/Loot Tables
- [ ] Define base equipment drops aligned to professions:
  - Warrior: heavy armor, two-handers, shields
  - Mage: staves, robes, intelligence items
  - Thief: leather armor, daggers, dexterity items
  - Cleric: holy symbols, plate, wisdom items
- [ ] Create profession-specific rare drops (sect-exclusive weapons, armor, artifacts)
- [ ] Implement warpoint vendors (NPCs that sell items for warpoints)
- [ ] Test: Kill mobs → get profession-appropriate loot

### Task 11.5: Implement World Events
- [ ] Placeholder for future seasonal events:
  - War of Alignment season (increased warpoint gain in specific zones)
  - Sect Summit (all sects invited to neutral location for brief peace)
  - Alignment Clash (good vs evil faction competition)
- [ ] Document mechanics for future implementation

---

## Phase 12: Balance & Testing

### Task 12.1: Experience Curve Balancing
- [ ] Test that 9 professions have similar XP requirements per level
- [ ] Verify that a single class doesn't trivialize content
- [ ] Ensure remort characters get sense of progress (not too fast, not too slow)
- [ ] Adjust exp.c constants if needed
- [ ] Target: 50-100 hours play time to reach level 50 first time, 5-10 hours for remort

### Task 12.2: Warpoint Progression Balance
- [ ] Test warpoint gain rates:
  - Ensure novice players can participate in PK without getting crushed
  - Ensure veteran players have meaningful warpoint challenges
  - Ensure warpoint decay prevents eternal high-rank status (forces seasonal activity)
- [ ] Adjust warpoint thresholds and XP bonuses as needed
- [ ] Target: Rank 5 (Legend) achievable in 50-100 hours active PK

### Task 12.3: Profession Balance Testing
- [ ] Create test characters of each profession
- [ ] Test level 1-10, 20-30, 40-50 gameplay:
  - Warrior damage output vs Mage spell output
  - Cleric healing vs Thief damage
  - Mage mana consumption vs Warlock efficiency
- [ ] Adjust spell damage, skill effects, critical rates as needed
- [ ] Target: All professions viable for both soloing and group content

### Task 12.4: Sect Alignment Testing
- [ ] Test alignment-based PK mechanics:
  - Good player should only get warpoints for killing evil players (not neutrals, not good)
  - Evil player should only get warpoints for killing good players
  - Alignment lock should not allow neutral play
- [ ] Test sect-specific spells/skills:
  - A Mage in Aethelhelm (good) should have different spells than Mage in Zod (evil)
  - Skills must not be obtainable outside sect groups
  - Avatar progression must be visible and working

### Task 12.5: Death Penalty Testing
- [ ] Test corpse creation and decay:
  - Kill player → corpse appears with correct items
  - Wait 1 hour → corpse decays and items are lost
  - Retrieve corpse → items return to player safely
- [ ] Test XP loss:
  - Die at level 50 with 5m XP → lose 500k XP, stay level 50
  - XP persists through login/logout
- [ ] Test item loss:
  - Equipped items go to corpse (100% risk)
  - Inventory items split 50/50 (50% risk)
  - Death bag protects some items

### Task 12.6: Save/Load Integrity Testing
- [ ] Save an old ROM character → load with new code
  - Verify new fields initialize to defaults
  - Verify no crashes or data loss
  - Verify character plays normally
- [ ] Create new RoP character → save → exit → load
  - Verify warpoint, remort_count, sect_number persist
  - Verify alignment lock is maintained
  - Verify sect-specific spells are learnable on reload
- [ ] Test remort cycle:
  - Create char → reach level 50 → remort → verify reset to level 1
  - Verify remort benefits (HP/move bonus) applied
  - Verify can remort again

### Task 12.7: Admin Tools Testing
- [ ] Test immortal freeze/unfreeze:
  - Freeze character with reason
  - Try login, verify frozen message
  - Unfreeze, verify character playable
- [ ] Test warpoint audit commands:
  - Set warpoint to specific value
  - Verify displayed correctly in do_warpoint()
  - Strip warpoints, verify set to 0
- [ ] Test multi-detection:
  - Login multiple characters from same IP
  - Run `alts` command, verify all listed
  - `freeze_multi` one character, verify all frozen

### Task 12.8: Full Playtest Scenario
- [ ] Create test plan:
  - Start new character (Warrior, good sect)
  - Complete level 1-10 tutorial zone
  - Join good-aligned sect (Aethelhelm)
  - Progress to level 20
  - Engage in PVP with evil character (Warlock, evil sect Zod)
  - Gain/lose warpoints based on outcomes
  - Practice remort requirements/benefits
  - Test death recovery (corpse looting, XP loss)
  - Verify rank progression and XP bonuses kick in
- [ ] Document any balance issues or bugs
- [ ] Adjust as needed

### Task 12.9: Performance & Load Testing
- [ ] Test server stability with:
  - 10 simultaneous players in PVP zones
  - 50+ NPCs in tight area (check lag)
  - 1000+ warpoint-generating kills in 1 hour (check decay performance)
  - Daily/hourly update functions (warpoint decay, rank recalc)
- [ ] Monitor CPU/memory usage via `ps -o pid,%cpu,%mem,cmd -C rom`
- [ ] Optimize if needed (cache calculations, batch updates)

### Task 12.10: Documentation & Handoff
- [ ] Document all balance numbers in README.quickmud or separate BALANCE.md
- [ ] Create admin guide (Admin_Guide.md):
  - How to freeze/ban players
  - How to detect cheating (multi, botting, farming)
  - How to reset warpoints, sects, remorts
  - Logging locations and what they mean
- [ ] Create player guide (Player_Guide_ROP.md):
  - Overview of 9 professions
  - Overview of 8 sects and alignment system
  - Warpoint economy (how to gain, how rank progresses)
  - Death penalty mechanics
  - Remort system explanation
- [ ] Create quickstart for developers modifying code
- [ ] Tag release version as v2.4-ROP-ALPHA and commit to git

---

## Summary of Major Code Changes by File

| File | Changes | Complexity |
|------|---------|-----------|
| src/merc.h | Add constants (MAX_CLASS, MAX_CLAN, MAX_SECT), extend char_data struct (10 new fields), new struct definitions (profession_type, sect_type) | HIGH |
| src/const.c | Populate profession_table[9], expand pc_race_table[25], expand class_table to MAX_CLASS | MEDIUM |
| src/tables.c | Populate sect_table[8], expand clan_table to MAX_CLAN | MEDIUM |
| src/nanny.c | Add 4 new connection states (profession, sect, remort flow), branching logic | HIGH |
| src/save.c | Add 6 new save fields, backward-compatible load logic | MEDIUM |
| src/fight.c | Warpoint gain/loss logic, anti-farm detection, death penalty logic, PK tracking | HIGH |
| src/act_comm.c | 4 new commands (warpoint, sect, sectalk, sectell), enhanced consider | MEDIUM |
| src/interp.c | Add cmd_table entries for 8+ new commands, stub advanced mechanics | LOW |
| src/act_wiz.c | 8+ new immortal commands (warpoint audit, sect override, remort force, etc.) | MEDIUM |
| src/act_info.c | Enhanced consider display with alignment/sect/warpoint info | LOW |
| src/group.c | Sect-specific skill/spell group integration | MEDIUM |
| src/update.c | Add warpoint decay, rank calculation, PK tracking updates | MEDIUM |
| src/comm.c | Multi-detection, suspicious account flagging, security logging | MEDIUM |
| area/* | Create/update sect halls, add alignment-appropriate mobs/items | MEDIUM |
| log/* | New log files (warpoint, security, remort, frozen) | LOW |

---

## Quick Reference: Roadmap

**Critical Path (Do First):**
1. Phase 0 (merc.h constants & char_data struct)
2. Phase 1 (save/load, backward compatible)
3. Phase 3.1-3.3 (profession/sect/race tables)
4. Phase 2 (nanny.c character creation)
5. Phase 4.1-4.3 (core commands)
6. Phase 5 (warpoint economy)

**After Critical Path:**
7. Phase 6-7 (sects, admin tools)
8. Phase 8-9 (death penalties, anti-exploit)
9. Phase 10-11 (QoL, areas)
10. Phase 12 (balance & testing)

**Known Challenges:**
- Backward save file compatibility (old characters must load without crashing)
- Warpoint farming abuse (anti-farm detection is critical)
- Admin tool scope creep (many tools needed for enforcement)
- Balance complexity (9 professions × 8 sects = 72 variations to test)
- Sect hall area creation (requires worldbuilding outside pure code)

---

**Last Updated**: March 3, 2026
**Version**: 1.0 - Initial Master Task List
**Status**: Ready for Phase 0 commencement
