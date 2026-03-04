# Developer Quickstart: ROM 2.4-ROP Edition

**Quick Guide for Contributing Developers**  
**Version**: 1.0  
**Last Updated**: March 3, 2026

---

## Quick Setup (10 minutes)

### Prerequisites
- Docker & Docker Compose installed
- Git installed
- Text editor (VS Code recommended)
- Basic C knowledge

### Clone & Run

```bash
# Clone the repo
git clone https://github.com/yourusername/rom24-quickmud.git
cd rom24-quickmud

# Build & run
docker-compose up --build

# Check logs
docker logs rom-mud-server
```

**Server available on**: localhost:4000

---

## Architecture Overview

### Project Structure

```
src/
  merc.h          - Core data structures & constants
  db.c            - Database/file loading
  fight.c         - Combat & death system
  save.c          - Character persistence
  nanny.c         - Login & character creation
  act_*.c         - Player actions & commands
  const.c         - Constants & tables (loot, warpoints)
  
area/
  sector_halls.are     - Sect headquarters [NEW ROP]
  midgaard.are        - Newbie zone
  ...50+ other zones
  
doc/
  BALANCE.md          - Balance numbers [NEW ROP]
  ADMIN_GUIDE.md      - Immortal guide [NEW ROP]
  PLAYER_GUIDE_ROP.md - Player manual [NEW ROP]
  
log/
  warpoint.log    - Warpoint transaction log [NEW ROP]
  frozen.log      - Freeze actions log [NEW ROP]
  security.log    - Security events log [NEW ROP]
```

### Key ROP Files

| File | Purpose | Phase Added |
|------|---------|-------------|
| src/merc.h | WARPOINT fields, Sect enum, Remort fields, Loot structures | 7-11 |
| src/const.c | Loot tables (9), World events (4), Season constants | 11 |
| src/fight.c | raw_kill() with XP loss, PK tracking, Corpse creation | 8 |
| src/save.c | Save/load for frozen, suspicious, warpoint fields | 9 |
| src/nanny.c | Multi-login detection, Frozen character check | 9 |
| src/act_wiz.c | freeze, unfreeze, account_ban, alts, suspects, botcheck | 9 |
| src/act_comm.c | goodtalk, eviltalk alignment channels | 10 |
| area/sect_halls.are | 8 sect headquarters with NPCs & rooms | 11 |
| BALANCE.md | All balance numbers & testing procedures | 12 |
| ADMIN_GUIDE.md | How to use admin tools & troubleshoot | 12 |
| PLAYER_GUIDE_ROP.md | Complete player manual & economy guide | 12 |

---

## Making Changes

### Code Style Guide

**C Conventions (ROM 2.4 standard)**:
```c
// Good
void raw_kill( CHAR_DATA *victim, CHAR_DATA *ch )
{
    if ( !victim )
        return;
    
    // Comment your logic
    ch->warpoints += 10;  // Base PK gain
    log_string( "warpoint.log", "%s kills %s", ch->name, victim->name );
}

// Bad
void raw_kill(CHAR_DATA *victim, CHAR_DATA *ch) {
ch->warpoints+=10; // No spacing
}
```

**Variable Naming**:
- `warpoint` (singular) - the value
- `warpoints` (plural) - the field
- `is_frozen` - boolean
- `frozen_reason` - const char*
- Prefix NPC xponents with `NPC_` (e.g., NPC_AVATAR_MASTER)

### Common Change Patterns

#### Adding a new warpoint bonus

**File: src/fight.c, function: raw_kill()**

```c
// Existing code around line 1200
int warpoint_gain = WARPOINT_PER_KILL_BASE;  // 10

// Add your bonus logic
if ( is_opposite_alignment(ch, victim) )
    warpoint_gain += WARPOINT_ALIGNMENT_BONUS;  // +5

// YOUR NEW CODE:
if ( ch->level >= 40 && victim->level <= 10 )
    warpoint_gain = warpoint_gain / 2;  // Penalty for newbie killing
```

**Then test**:
```bash
# Rebuild
docker-compose up --build

# Test: Create level 50, kill level 5
# Verify: warpoints gain 50% of normal
```

#### Adding a new admin command

**File: src/act_wiz.c**

```c
// At end of file, before final }
void do_mycommand( CHAR_DATA *ch, char *argument )
{
    CHAR_DATA *victim;
    
    if ( !IS_IMMORTAL(ch) )
    {
        send_to_char( "You are not immortal.\n\r", ch );
        return;
    }
    
    victim = get_char_world( ch, argument );
    if ( !victim )
    {
        send_to_char( "That character is not online.\n\r", ch );
        return;
    }
    
    // Your logic here
    send_to_char( "Command executed.\n\r", ch );
    
    // Log action
    sprintf( buf, "Immortal %s: mycommand on %s", ch->name, victim->name );
    log_string( "warpoint.log", buf );
}
```

**File: src/interp.c (command table)**

```c
// Find "cmd_table" array
{ "mycommand", do_mycommand, POS_DEAD, 0, IMMORTAL, 0 },
```

#### Adding a new balance constant

**File: src/merc.h, around line 150**

```c
#define WARPOINT_PER_KILL_BASE    10        /* Base warpoint for PK kill */
#define WARPOINT_VICTIM_WORTH     5         /* Boosts if victim has warpoints */
#define YOUR_NEW_CONSTANT         25        /* Your description here */
```

**File: const.c**

```c
// Reference it
int bonus = YOUR_NEW_CONSTANT * victim->level / 50;
```

---

## Compilation & Testing

### Building

```bash
# Full rebuild with logs
docker-compose up --build 2>&1 | tee build.log

# Check for errors
grep -i "error\|warning" build.log
```

### Quick Syntax Check

```bash
# Check one file
docker-compose exec rom-mud-server sh -c "cd src && make clean && make"

# Or run inside container
docker exec rom-mud-server tail -50 /build.log
```

### Testing Your Changes

```bash
# 1. Start server
docker-compose up -d

# 2. Connect with telnet
telnet localhost 4000

# 3. Test your feature
create <name>
<password>
<profession>
<sect>

# 4. In-game, test your code
say test message
kill <mob_name>
warpoint_show <character>  # If you added warpoint logic

# 5. Check logs
docker exec rom-mud-server tail -20 /var/log/warpoint.log
```

---

## Database Understanding

### Character Structure (merc.h)

```c
struct char_data
{
    ...existing ROM fields...
    
    // Phase 7-11 additions
    int         warpoints;              // ROP economy
    int         warpoint_rank;          // Calculated rank
    int         kills;                  // PK kills
    int         deaths;                 // PK deaths
    int         remort_count;           // Remort cycle number
    int         sect;                   // Sect alignment (0-7)
    
    REMORT_BENEFIT *remort_benefits;   // Stat bonuses per remort
    
    bool        frozen_flag;            // Banned from server
    char        *frozen_reason;         // Why frozen
    char        *frozen_by;             // Who froze them
    time_t      frozen_date;            // When frozen
    
    bool        suspicious_flag;        // Bot detection flag
    char        *suspicious_reason;     // Why flagged
    int         suspicious_level;       // 1-10 severity
    
    char        *current_ip;            // Login IP for multi-detection
    
    struct pksnd_data *pk_history;      // Last 5 PK victims
};
```

### Save File Impact

**Old ROM characters**:
- Load without crash ✓
- New fields initialize to 0/FALSE ✓
- Warpoints set to 0 on first load ✓

**New ROP characters**:
- All fields saved/loaded correctly
- Frozen flag persists across logout
- Warpoints never decay

---

## Key Game Mechanics

### Combat Flow

```
1. Attack initiated
   ↓
2. Roll accuracy (hit/miss)
   ↓
3. Calculate damage
   ↓
4. Apply armor reduction
   ↓
5. Reduce target HP
   ↓
6. Check if dead
   ↓
7a. If alive: Continue fighting
7b. If dead: raw_kill() called
   ↓
   - Calculate XP loss (10%)
   - Track PK (kills++, warpoints++)
   - Create corpse with items
   - Death announcements
   - Remove character from arena
```

**Key file**: src/fight.c, function: raw_kill()

### Warpoint Calculation

```
base = 10                           // WARPOINT_PER_KILL_BASE
bonus_victim = victim->warpoints / 100    // +1 WP per 100 victim WP
bonus_level = max(0, ch->level - victim->level) * 3
bonus_alignment = opposite_sect(ch, victim) ? 5 : 0
season_mult = world_events[current_season].warpoint_mult

FINAL = (base + bonus_victim + bonus_level + bonus_alignment) * season_mult

// Anti-farm check
if kill_count[victim] >= 3 in last 30min:
    FINAL = FINAL / 2
```

**Key file**: src/fight.c, function: raw_kill() (~line 1210)

### Death Penalty Calculation

```
XP Required for Next Level = 1500 * (level^1.5)
XP Lost = 10% of above (0.1x requirement)

Example:
Level 50: 1500 * (50^1.5) = 530,330 XP to next level
Death XP loss = 53,033 XP (10%)

You don't level-down, just have less XP toward next level
```

**Key file**: src/fight.c, function: raw_kill() (~line 1250)

### Item Loss on Death

```
Equipped items (armor, weapon):
  100% → corpse
  
Inventory items:
  50% split between corpse and death_bag
  
Algorithm:
  for each item in inventory:
    if random(1-100) <= 50:
      → corpse
    else:
      → death_bag (protected)
```

**Key file**: src/fight.c, function: make_corpse() (~line 1300)

---

## Testing Procedures

### Unit Test Template

```bash
#!/bin/bash
# test_warpoint.sh - Quick warpoint test

docker exec rom-mud-server telnet localhost 4000 <<EOF
# Create two test characters
create tester1
password123
warrior
aethelhelm

# Switch to test character 2
# (need separate telnet session in real test)

# Kill tester2 with tester1
kill tester2
# Expected: tester1 gains ~10 warpoints

# Verify
warpoint_show tester1
# Expected output: "Warpoints: 10"
EOF
```

### Integration Test: Death System

**Test steps**:
1. Create level 50 character
2. Equip full armor + inventory items
3. Force death from mob
4. Check corpse at death location
5. Verify XP loss persists
6. Verify items split correctly

**Success criteria**:
- [ ] Corpse contains all equipped items
- [ ] ~50% inventory items in corpse
- [ ] ~50% inventory items in death bag
- [ ] XP loss logged correctly
- [ ] Corpse decays after 60 minutes

### Load Test: Warpoint Performance

```bash
#!/bin/bash
# Simulate 1000 warpoint kills in sequence

for i in {1..1000}; do
  killer="killer_$i"
  victim="victim_$i"
  
  # Create characters
  # Run kill
  # Log warpoint gain
  
  if [ $((i % 100)) == 0 ]; then
    echo "Progress: $i / 1000"
  fi
done

# Check if server still responsive
# Expected: <100ms per kill
```

---

## Common Issues & Fixes

### Compilation Error: "undefined reference to `warpoint_table`"

**Cause**: Extern declared in merc.h but not defined in const.c

**Fix**:
```c
// In const.c, add:
WARPOINT_TABLE warpoint_table[MAX_WARPOINT_RANKS] = {
    { "Novice", 0, 99 },
    /* ... */
};
```

### Compilation Error: "multiple definition of `current_season`"

**Cause**: Variable defined in header, included by multiple files

**Fix**:
```c
// merc.h - declare as extern
extern int current_season;

// const.c - define the actual variable
int current_season = SEASON_SPRING;
```

### Corpse Items Not Splitting Correctly

**Debug**:
```c
// In make_corpse(), add logging
sprintf( buf, "%s died: %d items total, %d to corpse, %d to bag",
    ch->name, item_count, corpse_count, bag_count );
log_string( "security.log", buf );
```

### Warpoints Not Saving

**Check**:
1. Is save.c saving the `warpoint` field?
2. Is the character file being written?
3. Is the field being read back in load?

**Debug**:
```c
// In save.c, before save
sprintf( buf, "Saving %s: warpoints=%d", ch->name, ch->warpoints );
log_string( "security.log", buf );
```

---

## Performance Profiling

### Docker Stats

```bash
# Watch container performance
docker stats rom-mud-server --no-stream

# Expected at 10 players:
# CPU%: <30%
# MEM: ~250-300MB
# NET I/O: ~50-100 KB/s
```

### Code Hotspots

**Where the server spends TIME**:
1. Combat update loop (40%)
2. Character save cycle (20%)
3. Movement handling (15%)
4. NPC AI (15%)
5. Admin commands (10%)

**Optimize these if server is slow**:
1. Raw_kill() - called every combat round
2. Save/load - called on logout
3. Movement checks - called every heartbeat

---

## IDE Setup (VS Code)

### Extensions
- C/C++ (Microsoft) - IntelliSense
- Clang-Format - Code formatting
- Docker (Microsoft) - Container management

### Workspace Settings (.vscode/settings.json)

```json
{
    "C_Cpp.default.includePath": [
        "${workspaceFolder}/src"
    ],
    "C_Cpp.default.defines": [
        "__GNUC__"
    ],
    "[c]": {
        "editor.defaultFormatter": "xaver.clang-format",
        "editor.formatOnSave": true
    }
}
```

---

## Git Workflow

### Making a Feature Branch

```bash
# Current: Phase 12 complete (v2.4-ROP-ALPHA tagged)
git checkout -b feature/warpoint-scaling

# Make your changes
# Test thoroughly
# Commit with good messages
git add src/fight.c
git commit -m "Feat: Scale warpoint gain by victim rank

- Add scaling factor based on victim warpoint count
- Prevents zero-gain farming of level 1 alts
- Testing: Verified with 50 test kills

Fixes #42"

# Push and create PR
git push origin feature/warpoint-scaling
```

### Commit Message Format

```
Type: Brief description

Detailed explanation of what changed and why.
List any affected files or systems.

Testing: How you tested the change
Known issues: Any limitations

Type can be:
- Feat: New feature
- Fix: Bug fix
- Ref: Refactoring
- Doc: Documentation
- Test: Test additions
```

---

## Release Checklist

Before tagging a new version:

- [ ] All compilation errors fixed
- [ ] Docker build succeeds on clean slate
- [ ] test_balance.sh passes all tests
- [ ] No crashes in 1-hour gameplay session
- [ ] Logs are clean (no spam)
- [ ] Document what changed in CHANGELOG
- [ ] Update version in merc.h #define VERSION
- [ ] Tag with: `git tag -a v2.4-ROP-BETA-1 -m "Balance tweaks and bug fixes"`

---

## Support Resources

**Code Questions**:
- Check merc.h for data structure definitions
- Reference BALANCE.md for balance numbers
- Look at existing commands in act_wiz.c for patterns

**Design Questions**:
- EMAIL_ROM_QUESTIONS or ask in develop channel

**Build Issues**:
- Check Docker build output (docker-compose logs)
- Ensure all dependencies installed
- Try `docker-compose down && docker-compose up --build`

---

**Happy coding! Welcome to RFC 2.4-ROP development.**

Version 1.0 | Phase 12 Completion
