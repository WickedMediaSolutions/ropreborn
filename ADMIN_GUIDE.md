# RoP Administration Guide

**For Immortals & Server Administrators**  
**Version**: 1.0  
**Last Updated**: March 3, 2026

---

## Quick Reference: Admin Commands

### Warpoint Management

```
warpoint_set <character> <amount>
  Sets character's warpoint to exact value
  Logs action to log/warpoint.log
  Example: warpoint_set Malthiel 500
  
warpoint_show <character>
  Displays:
    - Current warpoint count
    - Rank (Novice/Adept/Veteran/Champion/Legend)
    - Kill history (last 5 kills)
    - Death count
    - PK ratio (kills/deaths)
  Example: warpoint_show Cleanliness
  
warpoint_strip <character>
  Resets warpoints to 0 (punishment for exploit)
  Logs to log/warpoint.log with immortal name
  Example: warpoint_strip BadActor
```

### Sect & Alignment Override

```
sect_set <character> <sect_name>
  Forces character to a specific sect
  Available sects: aethelhelm, kiri, baalzom, ishta (good)
                   zod, jalaal, xix, talice (evil)
  Updates character alignment
  Example: sect_set Necromancer zod
  
sect_alignment <character> <good|evil>
  Locks character to alignment permanently
  Overrides player preference
  Useful for admin-chosen NPCs or forced assignments
  Example: sect_alignment AdminBot good
```

### Freeze & Ban System

```
freeze <character> <reason>
  Prevents character login
  Displays reason to character on login attempt
  Logs to log/frozen.log with timestamp
  Reason stored in character file
  Example: freeze Cheater "Caught using warpoint exploit"
  
unfreeze <character>
  Removes freeze, allows login
  Logs removal to log/frozen.log
  Example: unfreeze Cheater
  
siteban <IP_address>
  Prevents login from specified IP address
  Blocks ALL characters from that IP
  Useful for multi-boxing abusers
  Logs to log/frozen.log
  Example: siteban 192.168.1.100
  
account_ban <character>
  Freezes all characters from same IP as <character>
  Logs to log/frozen.log
  Nuclear option for coordinated multi-account abuse
  Example: account_ban MainCheater
```

### Multi-Login Detection

```
alts <character>
  Shows all characters logged in from same IP
  Displays:
    - Character name
    - Level
    - Class
    - Online duration
    - Last command timestamp
  Example: alts Suspicious
  Output shows if same player is farming warpoints with alts
  
suspects
  Lists all flagged suspicious characters
  Shows:
    - Character name
    - Reason (idle_no_xp, command_velocity, etc)
    - Severity (1-10)
    - Last checked timestamp
  Example: suspects
  Review weekly to catch bots
  
botcheck <character>
  Deep analysis of command patterns
  Measures:
    - Commands per second (velocity)
    - Command variance (repetitive = bot-like)
    - Idle time vs XP gained
    - Movement patterns
  Example: botcheck SuspiciousBot
  Velocity > 10 cmds/sec triggers automatic bot flag
```

---

## Logging System Reference

### Log File Locations
```
log/warpoint.log      - All warpoint changes (set/strip/kill events)
log/frozen.log        - All freeze/unfreeze/ban actions
log/security.log      - Multi-login, bot detection, suspicious flags
log/daily_report.log  - Once-daily summary of security events
```

### Log Entry Format

**warpoint.log**:
```
[2026-03-03 14:32:15] Malthiel kills Darkblade (10 WP gained) [total: 500]
[2026-03-03 14:33:42] Immortal Godlike: warpoint_set Cheater 0
[2026-03-03 14:35:00] Darkblade kills Malthiel (warpoint farmcheck: kill #3 in 30min, gain halved to 5 WP)
```

**frozen.log**:
```
[2026-03-03 15:00:00] Immortal Admin: freeze Cheater "Caught exploiting corpse dupe"
[2026-03-03 15:05:32] Character Cheater attempted login (FROZEN: "Caught exploiting corpse dupe")
[2026-03-03 16:00:00] Immortal Godlike: unfreeze Cheater
[2026-03-03 16:45:00] Immortal Godlike: siteban 192.168.0.50
```

**security.log**:
```
[2026-03-03 12:00:00] Multi-login detected: BotfarmA (192.168.0.1) connects while BotfarmB active
[2026-03-03 12:00:05] Spy detection: IdleBot idle 30min, 0 XP gained (FLAGGED)
[2026-03-03 12:15:00] Bot detection: SpamBot 47 cmds/10sec (FLAGGED: command_velocity > 10 threshold)
```

---

## Troubleshooting Guide

### "Player claims I froze them but they weren't cheating"

**Check frozen.log**:
```
grep "freeze" log/frozen.log | grep <character>
```

**Reason display**:
```
warpoint_show <character>  # Shows if frozen and why
```

**Recovery steps**:
1. Verify reason in frozen.log
2. If mistaken, run: `unfreeze <character>`
3. Apologize in-game and explain

### "Warpoints aren't updating on kill"

**Check warpoint.log**:
```
grep <character> log/warpoint.log | tail -10
```

**Possible causes**:
1. **Farm check triggered** - killed same player 3x in 30min (warpoint gain halved)
2. **Victim has 0 warpoints** - you only gain 10 base WP
3. **Server issue** - check native server logs:
  ```
  tail -50 log/*.log
  ```

**Verify in-game**:
```
warpoint_show <character>  # Check exact count
```

### "Player says 'alts' command shows wrong IP"

**Explanation**: IP address captured at login time, shows connection source
- Player using VPN? IP will be VPN endpoint
- Player behind NAT/router? IP will be gateway
- Player on mobile hotspot? IP will be carrier's server

**Verify authenticity**:
```
alts <character>      # Show all chars from same IP
warpoint_show alt1    # Check alt's warpoint (high = intentional farm)
warpoint_show alt2    # Compare to other alt
```

If warpoints suspiciously balanced between alts → likely same player farming.

### "Frozen character trying to contact immortals"

**Policy**:
1. Check frozen.log for freeze reason
2. If legitimate mistake, `unfreeze` them
3. If not, direct to appeals process (email admin)
4. **Never discuss through in-game channels** (security issue)

### "Sect change isn't showing in game"

**Debug**:
```
warpoint_show <character>  # Verify sect changed
```

**Force reload**:
1. Character must logout completely
2. Sect unlocks next login
3. Verify with: `score` command in-game

---

## Common Exploit Detection

### Warpoint Farming
**Pattern**: Same player A kills player B 10 times in 1 hour
- **Auto-detection**: warpoint gain halved after 3 kills in 30min
- **Your action**: Review kills in warpoint.log, warn or freeze

**Prevention**:
```
warpoint_show <suspectA>
warpoint_show <suspectB>
# If both warpoints growing suspiciously fast:
freeze suspectA "Coordinated warpoint farming"
warpoint_strip suspectA  # Reset to 0
```

### Multi-Account Abusing
**Pattern**: Player A and Player B always log in together, never PK each other
- **Detection**: Run `alts <playerA>`, check if playerB also connected
- **Warpoint check**: If playerA only PKs playerC, playerB only PKs playerD (coordinated)

**Prevention**:
```
alts MainPlayer      # Shows all alts from same IP
account_ban MainPlayer  # Freeze all of them at once
```

### Bot Farming
**Pattern**: Character spams same command 50+ times/second, never moves, never gains XP
- **Auto-detection**: Flagged in security.log if velocity > 10 cmds/sec
- **Your action**: Review botcheck output

**Prevention**:
```
botcheck SuspiciousBot
# If output shows: "command_velocity: 47 cmds/sec (CRITICAL)"
freeze SuspiciousBot "Automated bot farming detected"
```

### Idle Spy Detection
**Pattern**: Character sits in good temple for 8 hours, idle the whole time, 0 XP gained
- **Auto-detection**: Flagged in security.log as "idle_no_xp"
- **Your action**: Check if intentional (AFK player) or bot (likely the latter)

**Prevention**:
```
botcheck IdleCharacter
# If output shows: "idle_time: 480min, XP_gained: 0 (SUSPICIOUS)"
freeze IdleCharacter "Idle spy bot detected"
```

---

## Daily Admin Procedures

### Morning Checklist
1. **Review security.log**:
   ```
   tail -20 log/security.log
   ```
   Check for any suspicious activity overnight

2. **Check suspects list**:
   ```
   suspects
   ```
   Review new flagged characters

3. **Monitor warpoint.log** for farming patterns:
   ```
   grep "farmcheck" log/warpoint.log
   ```

### Weekly Checklist
1. **Audit frozen.log** for trends:
   ```
   grep "freeze" log/frozen.log | wc -l  # Count total freezes
   ```

2. **Check warpoint leaders** for suspicious progression:
   ```
   # In-game: show top 10 warpoint holders
   # Check if balanced or dominated by one player
   ```

3. **Review all admin actions**:
   ```
   grep "warpoint_set\|warpoint_strip\|freeze" log/warpoint.log log/frozen.log
   # Verify only authorized admins made changes
   ```

### Monthly Report
Generate using daily_report.log summary:
- Total freezes this month
- Total siteban IPs
- Most common exploit types
- Warpoint distribution graphs
- Performance metrics

---

## Emergency Procedures

### Server Compromised
**If warpoints being set arbitrarily**:
1. Take server offline immediately
2. Capture current logs: `tail -500 log/*.log > /tmp/logs.txt`
3. Review all .c files for injection vectors
4. Verify running process and listener: `ps -ef | grep -E "area/rom|startup"` and `ss -ltnp | grep :4000`
5. Rollback to previous stable snapshot

### Severe Duplication Exploit
**If items duplicating in corpses**:
1. Disable corpse creation: Set `CORPSE_DECAY_TIME = 10` (10 seconds)
2. Freeze all suspected exploiters
3. Review fight.c make_corpse() function
4. Check item handlers in object.c
5. Roll back changes until fixed

### Database Corruption
**If character saves not loading**:
1. Check player/ directory for .bin files (old ROM format)
2. Try loading from backup (if available)
3. Review save.c for parsing errors
4. Check character file format in binary editor
5. Restore from last known-good backup

---

## Security Best Practices

### Command Usage
- **warpoint_set**: Use only for balance corrections, ALWAYS log reason
- **freeze**: Use for cheaters only, frozen_reason must be specific
- **siteban**: Use sparingly, may block legitimate players behind shared IP

### Logging Sensitive Actions
```
# GOOD - specific reason
freeze Exploiter "Duped 100 Demon Ore using corpse bug in area/draconia.are"

# BAD - vague reason
freeze Exploiter "Bad behavior"

# GOOD - clear crime
warpoint_set Farmer 0  # Reset from 9999, caught warpoint farming with alt accounts

# BAD - no context
warpoint_strip BadGuy
```

### Immortal Code of Conduct
1. **Log all interventions** - warpoint changes, freezes, sector overrides
2. **Never use for personal gain** - don't give yourself items, warpoints, levels
3. **Announce major actions** - Public message when freezing known griefer
4. **Impartial enforcement** - Treat friends same as enemies
5. **Document reasoning** - Frozen.log reason must explain why

---

## Denied Access Recovery

### Player claims "I didn't cheat but I'm frozen"

**Investigation**:
1. Check frozen.log: `grep <character> log/frozen.log`
2. Check warpoint.log for suspicious activity
3. Run `alts <character>` to see if intentional multi-abuse
4. Check security.log for auto-flags (bot/spy detection)

**Decision tree**:
- If reason unclear → **unfreeze with apology**
- If exploit confirmed → **stay frozen, explain clearly**
- If shared IP with cheater → **keep frozen but offer alt character reset**

### Player wants to know why they're flagged "suspicious"

**Transparency**:
```
botcheck <character>
# Show them the output: "You had X commands/second, threshold is 10"
# OR "You were idle for Y hours with 0 XP gained"
```

**Resolution**:
- If legitimate (lag spike, AFK), flag clears after 24 hours
- If sustained, escalate to freeze

---

## Tips & Tricks

### Quick warpoint leaderboard
```
In-game command: score
Shows top 5 warpoint holders + your rank
```

### Bulk freeze operation
```
# Freeze all chars from same IP:
account_ban MainCheater1
account_ban MainCheater2
# This freezes all their alts in one command
```

### Audit trail verification
```
# Who froze someone:
grep "freeze" log/frozen.log | grep Character
# When was action:
grep "2026-03-03" log/frozen.log | grep "freeze"
```

### Monitor live warpoint changes
```
# Terminal: continuous tail
tail -f log/warpoint.log | grep "gained\|set\|strip"
```

---

## Support Contacts

**Code Issues**: Check src/ directory comments or reach out to lead developer  
**Balance Questions**: Reference BALANCE.md parameters  
**Player Appeals**: Document in frozen.log, schedule review  
**Emergency**: stop server (`shutdown` in-game), then restart with `./startup`

---

**Version**: Admin Guide v1.0 ROP  
**Last Revision**: Phase 12 Completion  
**Next Review**: After first week of v2.4-ROP-ALPHA live deployment
