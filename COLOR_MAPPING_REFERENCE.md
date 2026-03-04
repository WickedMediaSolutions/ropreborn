# ROM24 QuickMUD Color Mapping Reference

## Complete Color Scheme Documentation

This document catalogs all color codes used across the ROM24 QuickMUD system and their associated text segments and purposes.

---

## Color Code Legend

| Code | Color | Style | ANSI Code | Usage |
|------|-------|-------|-----------|-------|
| {W | White | Bright | \e[1;37m | Primary text, values, names |
| {C | Cyan | Bright | \e[1;36m | Labels, headers, category titles |
| {G | Green | Bright | \e[1;32m | Positive info, bonuses, commands |
| {Y | Yellow | Bright | \e[1;33m | Resources (gold, XP), highlights |
| {M | Magenta | Bright | \e[1;35m | Borders, separators, decorative |
| {B | Blue | Bright | \e[1;34m | HP/Mana values, numeric data |
| {R | Red | Bright | \e[1;31m | Warnings, dangers, negative status |
| {D | Dark Grey | Bright | \e[1;30m | Disabled/empty items, unavailable |
| {x | Reset | Normal | \e[0m | Color reset to default |

---

## System-Wide Color Usage by Feature

### 1. ROOM DISPLAYS (do_look)

**Location:** `src/act_info.c` - do_look function

```
Room Title:        {W (white bright)
Room Description:  {Y (yellow bright)
Room Vnum:         {C[{BRoom #### - cyan brackets with blue number
```

**Example Output:**
```
{WThe Grand Marketplace{x
  {YBlah blah blah, a busy marketplace filled with merchants...{x
  {C[{BRoom 3000{C]{x
```

---

### 2. WHO LIST (do_who)

**Location:** `src/act_info.c` - do_who function

```
Header Border:     {M========================================{x (magenta)
Title:             {W PLAYER LIST{x (white)
Format:            {C[{W Level {C ]{x Player Name{x
Footer Border:     {M========================================{x (magenta)
Player Count:      {G X Player(s) Online{x (green)
```

**Example Output:**
```
{M========================================{x
{W                PLAYER LIST{x
{M========================================{x
{C[{W Level 54 {C ]{x Glory{x
{C[{W Level 1 {C ]{x Nofx{x
{M========================================{x
{G3 Player(s) Online{x
```

---

### 3. EQUIPMENT DISPLAY (do_equipment)

**Location:** `src/act_info.c` - do_equipment function

```
Wear Location:     {C (cyan bright)
Item Names:        {W (white bright)
Empty Slots:       {D (dark grey)
```

**Example Output:**
```
{C<worn on head>{x       {WA hood made of thin cloth{x
{C<worn on body>{x       {WA thin cloth shirt{x
{C<floating nearby>{x    {WA glowing orb (brightly lit){x
{C<worn as flair>{x      {WA blue ribbon bearing ...{x
```

---

### 4. INVENTORY DISPLAY (do_inventory)

**Location:** `src/act_info.c` - do_inventory function

```
Header:            {C--- {W[Inventory]{C ---{x
Items:             Default formatting
```

**Example Output:**
```
{C--- {W[Inventory]{C ---{x
You are carrying:
 1000 copper coins
 [x2] A massive turkey leg
```

---

### 5. EXITS DISPLAY (do_exits)

**Location:** `src/act_info.c` - do_exits function

```
Border Left:       {M[{C (magenta/cyan)
Direction Names:   {G (green bright)
Room Names:        {Y (yellow bright)
Room Vnum:         {C (cyan bright)
Dark Areas:        {D (dark grey)
Border Right:      {C]{x (cyan)
```

**Example Output:**
```
{M[{C {Gnorth{C]{x to {YThe Bakery{x {C({BRoom 100{C){x
{M[{C {Gsouth{C]{x to {YThe Inn{x {C({BRoom 200{C){x
{M[{C {Geast{C]{x  to {YThe Market{x {C({BRoom 300{C){x
```

---

### 6. WORTH DISPLAY (do_worth)

**Location:** `src/act_info.c` - do_worth function

```
Gold/Silver:       {Y (yellow bright)
Experience:        {C (cyan bright)
Remaining to XP:   {G (green bright)
```

**Example Output:**
```
You have {Y1000{x {Ygold{x and {Y500{x {Ysilver{x.
You have {C50000{x {Cexperience{x.
You need {G50000{x {Gmore experience to advance{x.
```

---

### 7. SCORE DISPLAY (do_score)

**Location:** `src/act_info.c` - do_score function

```
Header/Footer:     {M========================================{x (magenta)
Name/Level:        {W (white bright) / {C (cyan) labels
Race/Sex/Class:    {C (cyan labels) / {W (white values)
Hit Points:        {B{W HP now / max{x (blue now, white max)
Mana:              {B{W Mana now / max{x (blue now, white max)
Move:              {G{W Movement now / max{x (green label, white values)
Practices/Train:   {C (cyan label) / {W (white value)
Stats (Str/Con):   {M (magenta label) / {W permanent / {G bonus{x
Experience:        {C (cyan label) / {W (white value)
Gold/Silver:       {Y (yellow) / {W (white)
Warpoints/Rank:    {M (magenta) / {W value{x
```

**Example Output:**
```
{M========================================{x
{W        Glory{x {Clvl{x {W54{x
{C Race:{x {WTroll{x     {C Sex:{x {WFemale{x     {C Class:{x {WWarrior{x

{B HP:{x {W20{x/{W20{x  {G MV:{x {W89{x/{W89{x  {B Mana:{x {W33{x/{W33{x

{C Strength:{x {W18{x ({G+2{x)      {C Intelligence:{x {W16{x ({G+1{x)
{C Wisdom:{x {W14{x ({G+0{x)       {C Dexterity:{x {W15{x ({G+1{x)
{C Constitution:{x {W17{x ({G+2{x)   {C Luck:{x {W12{x ({G-1{x)

{C Experience:{x {W1250000{x  {C Gold:{x {Y10000{x  {C Silver:{x {W5000{x
{C Warpoints:{x {W800{x  {C Rank:{x {GWarlord{x
{M========================================{x
```

---

### 8. HELP SYSTEM (do_help)

**Location:** `area/help.are` - SUMMARY help entry

```
Header:            {M========================================{x (magenta)
Title:             {W HELP SYSTEM{x (white)
Category Headers:  {C (cyan bright)
Command Lists:     {W (white bright)
Highlights:        {Y (yellow bright for special topics)
Separators:        {M (magenta)
```

**Example Output:**
```
{M========================================{x
{W              HELP SYSTEM{x
{M========================================{x

{C Movement Commands...{x         {C Grouping Commands...{x
{W north south east west up down       follow group gtell split{x
{W exits recall                        {x

{C Object Commands...{x            {C Information Cmds...{x
{W get put drop give sacrifice         help credits commands areas{x
{W wear wield hold                     report score time weather where who{x
```

---

### 9. HELP NEWBIE (Comprehensive Tutorial)

**Location:** `area/help.are` - NEWBIE help entry

```
Header/Footer:     {M====...===={x (magenta borders)
Title:             {C (cyan bright)
Section Numbers:   {C{C1-10.{x (cyan bright)
Command Examples:  {G (green bright for actual command names)
Regular Text:      {W (white)
Important Notes:   {Y (yellow for highlights)
```

**Example Output:**
```
{M========================================{x
{C          TOP 10 THINGS NEW PLAYERS SHOULD KNOW{x
{M========================================{x

{C1. Alignment Defines Your Allies and Enemies{x
   Your alignment (good or evil) determines who can attack you...
   Type {Ghelp alignment{x to learn more...

{C2. Use CONSIDER and SCAN Before Every Fight{x
   Always {{Gconsider <mob>{{x before attacking...
```

---

### 10. HELP PROMPT (Customization Guide)

**Location:** `area/help.are` - PROMPT help entry

```
Header/Footer:     {M====...===={x (magenta borders)
Title:             {C (cyan bright)
Syntax Lines:      {G (green for command) / {W (white for syntax)
Legend Headers:    {C (cyan bright)
Variable Names:    {G (green bright)
Variable Types:    {W (white)
Color References:  {B {G {Y etc. (literal color examples)
Preset Options:    {G[A-P]{x with colored examples
```

**Example Output:**
```
{M========================================{x
{C            CUSTOMIZE YOUR PLAYER PROMPT{x
{M========================================{x

{GSyntax: {Wprompt                     {G- Show all default prompts{x
{GSyntax: {Wprompt <letter>            {G- Use default prompt A-P{x

{C==================== Legend for Player Prompts ===================={x

{G*hn*   {W= HP now
{G*hm*   {W= HP max
{G*mn*   {W= MV now
{G*mm*   {W= MV max

{C==================== Default Prompts (prompt all) ===================={x

{G[A] {B20{W/{B20{Whp {G89{W/{G89{Wmv {B33{W/{B33{Wm {W>
{G[B] {B20{W/{B20{Wh {G89{W/{G89{Wmv {B33{W/{B33{Wm {W>
```

---

### 11. HELP CHAT/GOSSIP/SHOUT (Communication)

**Location:** `area/help.are` - CHAT help entry

```
Header/Footer:     {M====...===={x (magenta borders)
Title:             {C (cyan bright)
Syntax Lines:      {G (green) / {W (white)
Channel Names:     {C{W bold cyan/white{x
Description Text:  {W (white)
Channel Details:   {C (cyan headers for each channel)
Management Info:   {W (white) with {{G{{W formatting
Did-Use-For:       {G{W** DO USE{x (green header, white text)
Don't-Use-For:     {R{W** DO NOT{x (red header, white text)
Related Commands:  {W (white with {G green command names)
```

**Example Output:**
```
{M========================================{x
{C              COMMUNICATION CHANNELS{x
{M========================================{x

{GSyntax: {Wgossip <message>{x   {G- Send to all interested players{x

{C{WGOSSIP / . (DOT){x
   Sends your message to all players interested in gossip...
   Type {Wgossip{x with no arguments to toggle...

{G** DO USE GOSSIP FOR:{x
   {W- Trading items
   {W- Finding groups
   {W- General socializing{x
```

---

### 12. HELP PRAY (Admin Communication)

**Location:** `area/help.are` - PRAY help entry

```
Header/Footer:     {M====...===={x (magenta borders)
Title:             {C (cyan bright)
Syntax Lines:      {G (green) / {W (white)
Usage Info:        {W (white)
Do Use For:        {G (green header) with {W (white text)
Don't Use For:     {R (red header) with {W (white text)
Related Commands:  {G (green) with {x resets
```

**Example Output:**
```
{M========================================{x
{C                 COMMUNICATE WITH ADMINS{x
{M========================================{x

{GSyntax: {Wimmtalk <message>{x

{{G** DO USE IMMTALK FOR:{{x
   {W- Important rule questions
   {W- Report bugs or exploits
   {W- Emergency situations{x

{{R** DO NOT USE IMMTALK FOR:{{x
   {W- Requesting battlegrounds
   {W- General questions{x
```

---

## Color Usage Summary by Purpose

### Structural Elements
- **{M Magenta** - Borders, separators, decorative elements
- **{C Cyan** - Labels, headers, category titles, section breaks

### Data Display
- **{W White** - Primary text, names, main values
- **{B Blue** - HP, Mana, numeric health values
- **{G Green** - Positive bonuses, movement points, available actions
- **{Y Yellow** - Resources (gold, experience, rewards), highlights

### Status Indicators
- **{R Red** - Dangers, warnings, negative status
- **{D Dark Grey** - Unavailable items, empty slots, disabled features
- **{x Reset** - Reset to default color

### Interactive Elements
- **{G Green** - Actual command names that users can execute
- **{W White** - Descriptions and examples
- **{C Cyan** - Command syntax and options

---

## Implementation Details

### File Locations

**Color Usage:**
1. **act_info.c** - Do_look, do_who, do_inventory, do_equipment, do_exits, do_worth, do_score
2. **help.are** - All help entries (SUMMARY, NEWBIE, PROMPT, CHAT, PRAY)

### Color Processing

**Color Code Handler:** `src/comm.c` - `colour()` function (line 2490)

**Color Application:**
- `send_to_char()` - Line 2063 (checks PLR_COLOUR flag)
- `page_to_char()` - Line 2183 (paging system)

**Color Definitions:** `src/merc.h` (lines 200-215)

### PLR_COLOUR Flag

Colors only display if player has `PLR_COLOUR` flag enabled. Default is ON for new characters.

Toggle with: `color on/off` or `colour on/off`

---

## Color Consistency Guidelines

### For Headers/Titles
- Use **{M Magenta** for borders: `{M====...===={x`
- Use **{C Cyan** for titles: `{C Title Text{x`

### For Commands/Interactive
- Use **{G Green** for command names: `{Gcommand{x`
- Use **{W White** for syntax/examples: `{Wexample{x`

### For Status Display
- Use **{B Blue** for HP/status numbers
- Use **{G Green** for bonuses/positive info
- Use **{Y Yellow** for resources/rewards
- Use **{R Red** for warnings/negative
- Use **{D Dark** for unavailable/empty

### For Descriptions
- Use **{W White** for primary text
- Use **{C Cyan** for labels

---

## Testing Colors

To verify colors are working:

1. **In Game:** Type `color on` (or `colour on`)
2. **Test Commands:**
   - `look` - See room colors
   - `who` - See WHO list colors
   - `equipment` - See equipment colors
   - `inventory` - See inventory colors
   - `exits` - See exit colors
   - `score` - See full character color display
   - `help` - See help system colors
   - `help newbie` - See comprehensive colors
   - `help prompt` - See prompt options
   - `help chat` - See communication colors
   - `help pray` - See admin contact colors

3. **Disable Colors:** Type `color off` to verify ANSI output

---

## Future Enhancement Opportunities

1. **Item Quality Coloring** - Different colors for item rarity/quality
2. **Experience Bars** - Color progression from yellow to gold/green
3. **Combat Output** - Color-coded damage/healing numbers
4. **Spell Names** - Unique colors per spell type
5. **NPC Names** - Color by alignment (good/neutral/evil)
6. **Status Effects** - Color-coded buff/debuff display

---

## References

- ROM 2.4 Documentation
- ANSI Color Code Standards
- MUD Client Color Support (XTERM 256-color)

**Last Updated:** March 3, 2026
**ROM Version:** rom24-quickmud
**Color System Status:** ✅ Complete and Functional
