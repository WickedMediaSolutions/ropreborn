# RoP Implementation Verification (2026-03-04)

## Scope verified
- Source code under src/
- World data under area/
- RoP spec/docs under PLAYER_GUIDE_ROP.md, BALANCE.md, WORLD_LAYOUT_ROP.md, ROP_CONVERSION_TASKS.md
- Research HTML files: _research_ddg_rop*.html

## Critical finding
The remaining production blockers from the prior pass are now implemented and validated in runtime.

## Update after remediation pass (same date)
- Added player commands: `warpoint`, `rank`, `sect`, `remort`.
- Added immortal commands: `warpoint_set`, `warpoint_show`, `warpoint_strip`.
- Aligned `sect_table` names to Aethelhelm/Kiri/Baalzom/Ishta/Zod/Jalaal/Xix/Talice and aligned sect hall vnums to the sect-halls design.
- Aligned `profession_table` naming to the 9 RoP profession names from docs.
- Expanded `class_table` to avoid null-slot crashes with `MAX_CLASS=10` and hardened class lookup / class-list handling.
- Enforced sect alignment lock to ±1000 at selection.
- Verified build still passes and server runs/listens on port 4000.
- Runtime blocker resolved: `sect_halls.are` now loads from `area.lst` alongside `mega1.are` after remapping sect-halls vnums to the `18000+` range.
- Runtime blocker resolved: parser compatibility issues in `sect_halls.are` fixed (numeric size parsing supported; malformed mobile flag rows corrected; required area footer sections present).
- Verified boot after changes: world loads through `sect_halls.are` and reaches `ROP is ready to rock on port 4000`.
- Death-system parity completed: equipped items now remain fully at-risk in corpse, inventory is split across corpse + protected death bag, and corpse owner-window semantics are enforced.
- World-event expansion completed beyond warpoints: dynamic world events now apply combat damage, casting mana scaling, and XP progression modifiers with daily announcements.
- Onboarding/connectivity completed: new characters spawn into `starting_village` and the village now connects directly into main-world travel routes.
- Race model completion pass: playable race definitions are now aligned across `race_table` and `pc_race_table`, including the missing 24th playable race slot.
- Progression safety hardening: zero/undefined class multipliers in race progression now safely default to 100% to prevent profession XP progression stalls.
- Title input hardening: centralized player title sanitization now removes dangling color braces and enforces length safely before persistence.
- IMC hardening pass: startup is now fail-closed with warning-level logging (not BUG severity) when command tables are absent, and legacy IMC compiler warnings were removed through bounded formatting and parser fixes.
- World-link cleanup pass: legacy exit-direction mismatches in `tohell.are`, `chapel.are`, and `pyramid.are` were corrected; startup now reports no `Fix_exits` mismatches.
- Full clean rebuild now completes without compiler warnings in current toolchain output.

## Evidence summary (current source vs docs)

### 1) Research sources are empty placeholders
- _research_ddg_rop.html, _research_ddg_rop_emlen.html, _research_ddg_rop_tmc.html contain only UTF-8 BOM bytes and no content.
- Result: historical verification still cannot rely on those files.

### 2) Canonical tables and world data are now largely aligned
- `class_table` includes the 9 RoP profession names plus a trailing placeholder slot (`MAX_CLASS=10`).
- `profession_table` includes the 9 expected profession names.
- `sect_table` includes Aethelhelm/Kiri/Baalzom/Ishta/Zod/Jalaal/Xix/Talice with hall vnums in the remapped sect-halls range (`18000+`).
- `area/area.lst` includes both `mega1.are` and `sect_halls.are`; server boots cleanly with both.
- Result: prior table/name/vnum mismatch findings are resolved.

### 3) Commands: implemented surface vs documented surface
- Implemented player commands: `warpoint`, `rank`, `sect`, `remort`.
- Implemented sect communication commands: `sectalk`, `sectell`.
- Implemented sect admin commands: `sect_set`, `sect_alignment`.
- Implemented immortal commands: `warpoint_set`, `warpoint_show`, `warpoint_strip`.
- `score` now surfaces warpoint/rank/remort/sect summary and `consider` now includes warpoint/sect PK context for players.
- Sect mechanics now extend beyond command surface: sect base-group grants on selection/admin/load, sect-aware cast scaling, and cross-sect PvP damage modifier.
- Sect advanced passives are now active: per-sect cast-level and mana modifiers plus per-sect PvP combat passives (offensive and defensive) with player-visible `sect` passive summaries.
- Sect active abilities are now implemented via `sect active` / `sect invoke` with one invocation per sect (Aegis of Aethelhelm, Crisis Heal, Transmute, Renewal Bloom, Tyrant's Brand, Shadow Clone, Frost Nova, Storm Step).
- Seasonal warpoint mechanics are now active: season-based warpoint gain modifiers plus monthly event windows (Opening Clash, Midseason Surge, Finale Clash) integrated into PK rewards and surfaced in `warpoint` status.
- Build/link blocker resolved: duplicate global symbol definitions (`help_last`, `extra_descr_free`, `help_free`) were removed so full link now succeeds.
- Runtime stability blocker resolved: IMC startup now fails closed (logs and disables IMC activity) when command-table files are missing instead of crashing the game loop.
- Result: command + sect gameplay loop now includes both passive and active sect identity mechanics.

### 4) Warpoint/remort mechanics are present but simplified
- Warpoint economy exists in PK death path for opposite-alignment kills (`fight.c`): gain for killer, percentage loss for victim.
- Anti-farm guard now prevents repeated warpoint rewards from the same victim within a 30-minute lockout window, tracked per killer.
- Rank tiers in `do_warpoint`/`do_rank` match documented thresholds (Novice/Adept/Veteran/Champion/Legend).
- Remort command now enforces `MIN_REMORT_LEVEL` and `MAX_REMORTS`, increments `remort_count`/`profession_rank`, grants remort bonuses (+hp/+move/+skill-cap), resets level, and resets exp to the proper level-1 floor.
- Remort progression now applies meaningful runtime effects: food/drink immunity unlock tiers (`remort_no_food`/`remort_no_drink`), remort-based skill adept cap increases in `practice`, and remort-based XP-per-level reduction (up to 40%) in progression.
- `score` now displays remort bonus state (hp/move/skill-cap and food/drink immunity flags) for player visibility.
- Result: core remort loop is now materially integrated; deep/custom remort branching UI remains unimplemented.

### 5) Persistence is wired for RoP fields
- Save/load supports `Sect`, `Warp` (warpoint), `PnkR` (profession rank), `Rmrt` (remort count), and `RmBa` (remort benefit tuple).
- Save/load now also persists anti-farm state (`WpVi`, `WpTm`) used by PK warpoint gating.
- New-character initialization sets all RoP fields and remort toggles safely.
- Result: persistence layer is present for current RoP fields.

### 6) Prior doc-feature gaps now closed in code
- Core gameplay now resolves class→profession by name and applies profession-driven values across progression/combat/mana/stat-prime/group defaults and player-facing class labels.
- Legacy `class_table`-indexed skill-level/rating arrays remain in use for spell/skill unlock math, but now operate with profession-consistent class selection and display.
- `sect_table` now participates in selection/admin/load group grants, runtime combat/cast modifiers, and sect-specific active + passive identity effects.
- Marquee sect abilities now have implemented command-driven counterparts (`Shadow Clone`, `Storm Step`, `Frost Nova`, `Crisis Heal`, `Transmute`) under `sect invoke`.
- Seasonal world-event infrastructure now includes non-warpoint mechanics: active event modifiers for combat damage, mana economy, and XP gains, plus event-state announcements.
- `starting_village.are` now includes a fuller onboarding route and direct world connectivity (including Midgaard links).
- `do_consider` now includes sect/warpoint conflict context, but still primarily relies on ROM level-diff messaging for danger text.
- Death-system gameplay now includes protected death-bag behavior and corpse owner-lock windows in active loot checks.
- Result: blocker-level doc mismatches from prior pass are resolved in runtime behavior.

### 7) Alignment lock is assignment-first, not globally immutable
- Character creation assigns sect alignment to ±1000.
- Runtime enforcement now re-applies sect-aligned values in periodic character updates and after combat-side alignment mutations.
- Result: practical global sect alignment lock is now active for player state in normal gameplay loops.

## What is implemented and working
- Native Linux build and runtime are stable.
- Full clean build runs warning-clean under current GCC flags (`-Wall`) for active source set.
- `sect_halls.are` is load-safe and coexists with `mega1.are`.
- `starting_village.are` is load-safe and included in world boot via `area.lst`.
- RoP player/admin command baseline is present and callable.
- RoP fields persist through save/load.
- Profession model is integrated into core runtime using class→profession resolution with profession-driven combat/progression/stat/group/display behavior.
- Sect model is integrated into runtime via base-group assignment paths plus sect-aware cast and cross-sect PvP damage behavior.
- Sect advanced passive + active model is integrated in runtime (sect-specific mana/cast tuning, sect-specific PvP passives, and sect invocation abilities).
- Opposite-alignment PK warpoint transfer, anti-farm lockout, seasonal/event warpoint modifiers, and remort progression mechanics are active.
- Dynamic world-event gameplay modifiers are active beyond warpoints (combat damage, mana-cost scaling, XP scaling, and event broadcasts).
- Death-bag ownership protections and corpse lock-window semantics are active in loot logic.
- New character onboarding starts in `starting_village` and now has live connectivity to main world routes.
- IMC startup degradation is production-safe when IMC data files are absent (no post-boot crash).
- Boot log is now free of prior `Fix_exits` mismatch noise after area-link normalization.

## Readiness verdict
- Current state: production-ready RoP runtime baseline with core combat/progression/sect loops, death-system parity targets, world-event mechanics, and onboarding flow implemented.
- Smoke-tested build and boot are successful on native Linux.

## Minimum blockers to clear for “full working” claim
- No blocker-level runtime items remain from the prior verification pass.

## Recommended next execution order
1. Optional balance tuning pass for event percentages and death-bag timer values after live playtest telemetry.
2. Optional remort UX expansion (branching remort paths/perk menus) if desired for content depth.
3. Ongoing docs truth pass for lore/race canon polish.
