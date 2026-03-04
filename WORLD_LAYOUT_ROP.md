# RoP World Layout & Lore

**Version**: 1.0  
**Date**: March 3, 2026  
**Phase**: 11 - Area & Lore Recreation

---

## World Structure

### Core Zones

#### 1. **Midgaard (Main Hub)**
- **vnum range**: 3000-3399
- **Level**: 1-10 (newbie-friendly with some escalation)
- **Locations**:
  - Market District: Safe trading zone with vendors (no fighting)
  - Good Temple: Neutral sanctuary for good-aligned players (no fighting)
  - Evil Stronghold: Neutral sanctuary for evil-aligned players (no fighting)
  - Colosseum Arena: PvP arena for free-for-all combat (no item loss, no warpoint gain)
  - Road of Kings: Main thoroughfare with inns and shops

#### 2. **Sect Halls (New for RoP)**
- **vnum range**: 8000-8399 (allocated)
- **Locations**: 8 individual halls, one per sect
  - **Good Aligned Sects** (vnum 8000-8099):
    - Aethelhelm (Valiant) - vnum 8000: Stone fortress with training grounds
    - Kiri (Sacred) - vnum 8050: Holy shrine with cleansing pools
    - Baalzom (Ancient) - vnum 8100: Library of knowledge, scrolls and tomes
    - Ishta (Benevolent) - vnum 8150: Grove sanctuary with nature theme
  
  - **Evil Aligned Sects** (vnum 8200-8399):
    - Zod (Tyranny) - vnum 8200: Iron fortress of domination
    - Jalaal (Shadowy) - vnum 8250: Underground assassin's den
    - Xix (Destructive) - vnum 8300: Volcano of chaos and destruction
    - Talice (Deceptive) - vnum 8350: Illusory halls of tricks and magic

#### 3. **Starting Village**
- **vnum range**: 2000-2099 (new character spawn)
- **Level**: 1 (tutorial area)
- **Mob Types**: Peaceful trainers, equipment vendors, healing potions

#### 4. **Early Dungeons (1-20)**
- Goblin caves
- Forest ruins
- Abandoned monastery
- Coastal caverns

#### 5. **Mid-Tier Dungeons (20-35)**
- Draconia (dragon lair)
- Moria (underground city)
- Astral plane (elemental zones)
- Drow undercity

#### 6. **High-Tier Dungeons (35-50+)**
- Olympus (god realm)
- Nirvana (enlightenment zone)
- Dream realm (nightmare creatures)
- Ancient pyramid (undead lair)

---

## Mob Alignment Assignment

### Alignment Categories

**Good-Aligned (+500 to +1000)**
- Guards and soldiers in good zones
- Clerics and priests
- Paladins and holy knights
- Forest creatures (deer, eagles)
- Good villagers

**Evil-Aligned (-1000 to -500)**
- Dark cultists
- Demons and devils
- Black knights and assassins
- Undead creatures
- Evil villagers trapped in evil zones

**Neutral (0)**
- Merchants and traders
- Wildlife (wolves, bears) in neutral zones
- Constructs and golems
- Mindless creatures (oozes, jellies)

### MOB Types (Special)

**Avatar NPCs** (rare, high CR)
- **Aethelhelm Avatar**: Holy knight with blessed weapon
- **Kiri Avatar**: Sacred priestess with healing aura
- **Baalzom Avatar**: Ancient sage with knowledge spells
- **Ishta Avatar**: Nature druid with animal companions
- **Zod Avatar**: Dark warlord with domination spells
- **Jalaal Avatar**: Shadow assassin with stealth abilities
- **Xix Avatar**: Chaos demon with destruction magic
- **Talice Avatar**: Trickster with illusion spells

**Minion Types** (faction-themed creatures that help aligned players)
- Good: Angels, celestials, holy warriors
- Evil: Demons, devils, dark servants

---

## Loot Tables by Profession

### Warrior Loot
- Heavy plate armor pieces
- Two-handed swords and axes
- Tower shields
- Strength-enhancing items (+STR rings, amulets)
- Stamina potions (HP recovery)

### Cleric Loot
- Plate mail and holy symbols
- Maces and holy water
- Wisdom-enhancing items (+WIS rings, robes)
- Healing potions (MANA recovery)
- Blessed items with healing properties

### Templar Loot
- Heavy/medium hybrid armor
- Holy warriors' gear (half plate + shield)
- Blessed weapons (mace + holy symbol)
- Wisdom/Strength items
- Protection spells and shields

### Monk Loot
- Light leather armor
- Martial arts weapons (staffs, fists wraps)
- Dexterity items (+DEX rings, light boots)
- Speed enhancement items
- Discipline scrolls and manuals

### Warlock Loot
- Dark robes and cloaks
- Staves with shadow runes
- Intelligence-enhancing items (+INT rings, grimoires)
- Curse scrolls and dark spell books
- Soul gems and dark artifacts

### Thief Loot
- Light leather armor
- Daggers and short swords
- Lockpicks and tools
- Dexterity items (+DEX rings, shadow wraps)
- Stealth potions (invisibility, blur)

### Ninja Loot
- Black leather and silks
- Throwing stars and blowguns
- Shadow techniques (scrolls)
- Dexterity/Shadow hybrid items
- Silent step boots

### Mage Loot
- Robes and wizard hats
- Staves with spell runes
- Intelligence items (+INT rings, spell books)
- Mana potions
- Elemental artifacts (wands, staffs)

### Alchemist Loot
- Alchemist's robes
- Brewing equipment
- Vials and containers
- Ingredient pouches
- Recipe scrolls

---

## Warpoint Vendor System

### Vendor Locations
- **Good Alignment Vendor**: Market District (buys warpoints for good players)
- **Evil Alignment Vendor**: Evil Stronghold (buys warpoints for evil players)
- **Neutral Merchant**: Central Market (buys warpoints at reduced rate)

### Available Items by Warpoint Cost
- **100 warpoints**: Stat-boosting items, basic enchanted gear
- **250 warpoints**: Profession-specific armor pieces, advanced potions
- **500 warpoints**: Powerful weapons, high-level armor sets
- **1000+ warpoints**: Rare artifacts, sect-exclusive equipment

---

## World Events (Placeholder)

### Seasonal Events
- **War of Alignment** (spring): Increased warpoint gain in specific zones, PvP tournaments
- **Sect Summit** (summer): All sects invited to neutral territory for brief peace
- **Alignment Clash** (fall): Good vs Evil faction competition, alliance rewards
- **Winter Solstice** (winter): Universal truce, holiday events, gift exchanges

### Dynamic Events
- Avatar appearances: Rare boss spawns granting high experience
- Warpoint bonuses: Double warpoint weekends
- Boss rushes: Timed challenges with leaderboards
- Territory control: Zones shift alignment based on player activity

---

## area/*.are Files Summary

| File | vnum Range | Type | Purpose |
|------|-----------|------|---------|
| midgaard.are | 3000-3399 | Hub zone | Main marketplace, temples, colosseum |
| sect_halls.are | 8000-8399 | NEW | 8 sect-specific headquarters |
| starting_village.are | 2000-2099 | NEW | Newbie tutorial zone |
| immort.are | 1200-1299 | Admin | Immortal area (unchanged) |
| existing zones | various | Dungeons | Modified with alignment assignments |

---

## Implementation Status

- [x] Task 11.1: World Layout documented
- [ ] Task 11.2: Create sect_halls.are file
- [ ] Task 11.3: Add alignment to existing mobs, create new aligned types
- [ ] Task 11.4: Create loot/equipment drop tables
- [ ] Task 11.5: Implement world event infrastructure

---

**Next Steps**: Create sect_halls.are with 8 halls, update mob alignments, implement loot tables, add seasonal event hooks
