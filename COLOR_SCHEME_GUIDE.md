# ROM Game Server - Colorful Display Scheme

## Overview
This document outlines all the color changes made to the ROM 2.4 game server to provide a vibrant, uniform, and visually appealing interface across all player displays.

---

## Color Codes Reference

### Basic Colors
- **{W** = Bright White (titles, names, numbers)
- **{Y** = Bright Yellow (descriptions, gold/silver, warnings)
- **{G** = Bright Green (positive values, exits, highlights)
- **{C** = Bright Cyan (labels, headers)
- **{R** = Bright Red (special markers, danger)
- **{B** = Bright Blue (secondary info)
- **{M** = Bright Magenta (decorative borders)
- **{D** = Dark Grey (disabled, unavailable items)
- **{x** = Reset to default color

---

## Updated Displays

### 1. Room Display (LOOK command)

#### Room Title
```
{W[Room Name Here]{x
```
- **Color**: Bright White `{W`
- **Purpose**: Makes room names stand out immediately
- **Previously**: Used variable player color `{s`

#### Room Description
```
{Y[Room description text goes here]{x
```
- **Color**: Bright Yellow `{Y`
- **Purpose**: Makes descriptions readable and warm
- **Previously**: Used variable player color `{S`

#### Room VNUM (for Builders)
```
{C[{BRoom 1234{C]{x
```
- **Color**: Cyan border with Blue room number
- **Purpose**: Distinguishes builder information

#### Obvious Exits

**Automatic Display (on LOOK):**
```
{M[{Conorth{x {Gsouth{x {Geast{x {Gwest{x]{x
```

**Detailed Display (standalone):**
```
{C--- Obvious exits ---{x
{G[direction]{x - {Y[room name]{x
```
- **Direction Name**: Bright Green `{G` for easy scanning
- **Destination**: Bright Yellow `{Y` for clarity
- **Border**: Cyan `{C` for framing

---

### 2. Who List

#### Header
```
{M========================================{x
{W                PLAYER LIST{x
{M========================================{x
```
- **Borders**: Magenta `{M` for visual separation
- **Title**: White `{W` for prominence

#### Player Entries (Immortal)
```
{M[{Y 51{M {GHUMAN{M {CCREATOR{M]{x {R(KILLER){x {Wplayer name title{x
```
- **Bracket**: Magenta `{M`
- **Level**: Bright Yellow `{Y`
- **Race**: Bright Green `{G`
- **Class**: Cyan `{C`
- **Name/Title**: Bright White `{W`
- **Status Flags**: Red `{R` for imminent warnings

#### Player Entries (Mortal)
```
{C[{W 30{C {GELF{C {BWARRIOR{C]{x {Y(AFK){x {WLurian the Barbarian{x
```
- **Bracket**: Cyan `{C`
- **Level**: Bright White `{W`
- **Race**: Bright Green `{G`
- **Class**: Bright Blue `{B`
- **Name/Title**: Bright White `{W`
- **AFK Status**: Bright Yellow `{Y` (noticeable but not alarming)

#### Footer
```
{M========================================{x
{G42 Player(s) Online{x
{M========================================{x
```
- **Borders**: Magenta `{M`
- **Count**: Bright Green `{G`

---

### 3. Inventory Display

#### Header
```
{C--- {W[Inventory]{C ---{x
```
- **Brackets**: Cyan `{C`
- **Title**: Bright White `{W`
- **Purpose**: Clear visual separator from other output

#### Items
Your items will be displayed in their default colors (as configured in object data)

---

### 4. Equipment Display

#### Header
```
{M--- {Y[Equipment]{M ---{x
```
- **Brackets**: Magenta `{M`
- **Title**: Bright Yellow `{Y`
- **Purpose**: Distinguishes from inventory

#### Worn Locations
```
{G<worn location>{x <item description>
```
- **Location**: Bright Green `{G` for easy identification
- **Item**: Standard colors

#### Empty Slot Message
```
{D(nothing equipped){x
```
- **Color**: Dark Grey `{D` for unavailable/empty slots

---

### 5. Score Display (SCORE command)

Complete reformat with uniform coloring:

```
{M========================================{x
{WCharactername{x, {Clevel {W1{x, {C50{x {Cyears old{x ({G2400{x {Chours{x)
{M========================================{x
{CRace:{x {WHuman{x  {CSex:{x {Wmale{x  {CClass:{x {WWarrior{x
{GHit: {W100{G/{W100{x  {BMana: {W50{B/{W50{x  {YMovement: {W150{Y/{W150{x
{CPractices: {W5{x  {CTraining sessions: {W3{x
{CCarrying: {W15{C/{W20{x {Citems{x ({Y1250{C/{Y2000{x {Cpounds{x)
{MStr:{x {W18{x({G20{x)  {MInt:{x {W16{x({G18{x)  {MWis:{x {W14{x({G16{x)  {MDex:{x {W15{x({G17{x)  {MCon:{x {W17{x({G19{x)
{CExperience: {W125000{x  {CGold: {Y5000{x  {CSilver: {W3500{x
{MWarpoints: {W500{x   {MRank: {GWarlord{x
```

**Color Breakdown:**
- **Headers**: White `{W` names/numbers, Cyan `{C` labels
- **Attributes**: Magenta `{M` labels, White `{W` permanent, Green `{G` current (bonus)
- **Resources**: Green `{G` for hit/movement, Blue `{B` for mana
- **Gold/Money**: Yellow `{Y` for gold (valuable), White `{W` for silver
- **Rank**: Green `{G` for rank name
- **Warpoints**: White `{W` for value
- **Decorative**: Magenta borders `{M` and reset codes `{x`

---

### 6. Worth Display

#### Player Version
```
{Y5000{x {Ygold{x, {Y3500{x {Ysilver{x, and {C125000{x {Cexperience{x ({G45000{x {Gexp to level{x).
```
- **Gold/Silver**: Bright Yellow `{Y` (precious, noticeable)
- **Experience**: Cyan `{C` (important for progression)
- **Remaining**: Green `{G` (positive information)

#### Mobile Version
```
{Y1000{x {Ygold{x and {Y500{x {Ysilver{x.
```
- **All Values**: Bright Yellow `{Y` (all money is important)

---

## Visual Design Philosophy

### Consistency
- **Room Titles**: Always Bright White `{W`
- **Room Descriptions**: Always Bright Yellow `{Y`
- **Labels**: Always Cyan `{C` or Magenta `{M`
- **Good News**: Always Bright Green `{G` (bonuses, full health, available exits)
- **Warnings**: Red `{R` (killer flag, thief flag)
- **Unavailable**: Dark Grey `{D` (empty slots, dark areas)

### Hierarchy
1. **Most Important**: White (names, titles, main values)
2. **Important**: Cyan (labels, headers)
3. **Secondary Information**: Green (stats bonuses, exits, highlights)
4. **Supporting Information**: Yellow (descriptions, gold)
5. **Special Attention**: Red (danger flags)
6. **Disabled**: Dark Grey (empty items, unavailable)

### Accessibility
- Colors are vibrant and distinct
- Dark Grey only used for disabled/empty states
- Primary information is in high-contrast colors
- No reliance on single-color distinction for important data

---

## Customization

Players can still customize some displays:
- **`:prompt` color**: Can set their own prompt color scheme  `{p`
- **Gossip/Tells**: Can customize via `color` command
- **Special Channels**: Wiznet, Immortal Talk etc. have customizable colors

The defaults provided here enhance the base experience without preventing individual customization.

---

## Testing the Changes

After recompiling the server:

1. **Test Room Display**
   ```
   look
   ```
   - Should see white title, yellow description, green exits

2. **Test Who List**
   ```
   who
   ```
   - Should see colorful format with immortals in magenta theme, mortals in cyan theme

3. **Test Score**
   ```
   score
   ```
   - Should see detailed character information with vibrant colors

4. **Test Equipment**
   ```
   equip
   ```
   - Should see green location labels, grey for empty slots

5. **Test Inventory**
   ```
   inventory
   ```
   - Should see white header with inventory items

---

## Technical Details

**Color Code Implementation:**
- All changes implemented in `src/act_info.c`
- Color codes use ANSI escape sequences defined in `src/merc.h`
- Player setting `PLR_COLOUR` controls whether colors are displayed
- Separate handling for immortals vs. mortals in who list

**Files Modified:**
- `src/act_info.c`: Do_look, do_who, do_inventory, do_equipment, do_exits, do_worth, do_score

---

## Color Code Quick Reference

```
Lowercase (Normal Intensity):
{r = Red        {g = Green      {y = Yellow
{c = Cyan       {b = Blue       {m = Magenta
{w = White

Uppercase (Bright Intensity):
{R = Bright Red   {G = Bright Green   {Y = Bright Yellow
{C = Bright Cyan  {B = Bright Blue    {M = Bright Magenta
{W = Bright White

Special:
{D = Dark Grey
{x = Reset color
{s = Room Title (player customizable)
{S = Room Text (player customizable)
{o = Room Exits (player customizable)
{O = Room Objects (player customizable)
```

---

## Summary

Your ROM 2.4 game server now features:
- ✅ Uniform, colorful displays across all player-facing output
- ✅ White room titles for immediate visual clarity
- ✅ Colorful who list with immortal/mortal distinction
- ✅ Beautiful equipment and inventory headers
- ✅ Enhanced exits display with green directional names
- ✅ Vibrant score display with organized information
- ✅ Distinct colors for gold (yellow), experience (cyan), and bonuses (green)
- ✅ Consistent use of magenta borders and cyan labels
- ✅ Accessibility with high-contrast, distinct colors

The game now has a modern, colorful appearance that makes all information stand out while remaining consistent and professional!

