# Release Minimal Diff (2026-03-04)

This manifest isolates **release-critical gameplay/runtime changes** from broader workspace edits.

## A) Release-Critical (ship in production bundle)

### Runtime source
- src/config.h
- src/merc.h
- src/const.c
- src/interp.h
- src/interp.c
- src/nanny.c
- src/fight.c
- src/act_obj.c
- src/act_info.c
- src/act_comm.c
- src/magic.c
- src/update.c
- src/skills.c
- src/db.c
- src/imc.c
- src/handler.c
- src/lookup.c
- src/comm.c
- src/ban.c
- src/act_wiz.c
- src/act_move.c
- src/save.c
- src/recycle.c
- src/mem.c
- src/string.c
- src/olc_act.c
- src/olc_save.c
- src/Makefile.linux

### World/area data
- area/area.lst
- area/sect_halls.are
- area/starting_village.are
- area/tohell.are
- area/chapel.are
- area/pyramid.are

### Runtime startup
- startup

### Verification artifact
- ROP_IMPLEMENTATION_VERIFICATION_2026-03-04.md

## B) Non-Blocking for Runtime (can ship later)

### Documentation updates (optional in runtime release)
- ADMIN_GUIDE.md
- BALANCE.md
- CODEBASE_ANALYSIS.md
- COLOR_MAPPING_REFERENCE.md
- DEVELOPER_QUICKSTART.md
- DEVELOPMENT_SETUP.md
- MODERNIZATION_COMPLETE.md
- README.md
- ROP_CONVERSION_TASKS.md
- TEST_PROCEDURES.md
- WORLD_BUILDER_DESIGN.md

### World-builder docs (optional in runtime release)
- world-builder/BUILD_REPORT.md
- world-builder/RELEASE_CHECKLIST.md

## C) One-command staging for minimal runtime release

```bash
git add \
  src/config.h src/merc.h src/const.c src/interp.h src/interp.c src/nanny.c \
  src/fight.c src/act_obj.c src/act_info.c src/act_comm.c src/magic.c src/update.c \
  src/skills.c src/db.c src/imc.c src/handler.c src/lookup.c src/comm.c src/ban.c \
  src/act_wiz.c src/act_move.c src/save.c src/recycle.c src/mem.c src/string.c \
  src/olc_act.c src/olc_save.c src/Makefile.linux \
  area/area.lst area/sect_halls.are area/starting_village.are area/tohell.are \
  area/chapel.are area/pyramid.are startup \
  ROP_IMPLEMENTATION_VERIFICATION_2026-03-04.md
```

## D) Sanity expectations for this minimal set
- Build succeeds on Linux (`make -j4` in `src/`).
- Boot reaches `ROM is ready to rock on port 4000`.
- IMC missing command table degrades cleanly (warning-level, no crash).
- No `Fix_exits` mismatch lines in boot log.
