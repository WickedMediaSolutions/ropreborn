# RoP Reborn Master Fix Tasks (2026-03-04)

## Audit Basis
- Source parity checked against:
  - `ROP_IMPLEMENTATION_VERIFICATION_2026-03-04.md`
  - `ROP_CONVERSION_TASKS.md`
  - `COLOR_MAPPING_REFERENCE.md`
  - `COLOR_SCHEME_GUIDE.md`
- Runtime/build checks executed on Linux workspace.

## Master Task List

### Task 1 — Stabilize character creation/save crash path
**Status:** ✅ Completed

**Issues fixed:**
- Fixed null-pointer crash in `fwrite_char` prompt handling (`ch->prompt` compared only when non-null).
- Corrected malformed nanny state routing where `CON_ROP_STAT_ALLOCATION` was embedded inside `CON_SELECT_SECT` logic.
- Ensured ROP stat allocation state transitions cleanly into group selection.

**Files updated:**
- `src/save.c`
- `src/nanny.c`

**Validation:**
- Rebuild passed (`make -C src`).
- Boot succeeds from `area/` and world loads through all areas.

---

### Task 2 — Repair save/load parity for new creation-time fields
**Status:** ✅ Completed

**Issues fixed:**
- Added `stat_points` field initialization and safe lifecycle handling during character creation path.
- Removed duplicate/incorrect parsing paths that could create inconsistent read behavior.

**Files updated:**
- `src/recycle.c`
- `src/merc.h`
- `src/save.c`

**Validation:**
- Rebuild passed.
- No compile/lint diagnostics in touched files.

---

### Task 3 — Color/text parity against documented display standards
**Status:** ✅ Completed (core player-facing commands)

**Issues fixed:**
- Updated room title/description and builder vnum coloring in `do_look` to match docs.
- Updated auto exits coloring and no-exit color fallback in `do_exits`.
- Updated `do_worth` output to documented color tokens.
- Added inventory header formatting in `do_inventory`.
- Aligned empty equipment message to disabled-state color in `do_equipment`.
- Added WHO list header/footer styling and player count formatting.
- Fixed malformed color tokens in `do_score` (`{{x` artifacts).

**Files updated:**
- `src/act_info.c`

**Validation:**
- Rebuild passed.
- Runtime boot verified after changes.

---

### Task 4 — Finalize creation/login null-room crash and save-token load warnings
**Status:** ✅ Completed

**Issues fixed:**
- Fixed root-cause segfault in login flow: `do_look("auto")` was called before `char_to_room`, causing `room_is_dark(NULL)` dereference.
- Removed premature look calls in `CON_READ_MOTD` and `CON_READ_IMOTD`; look now occurs only after room placement.
- Corrected ROP numeric save tokens written with trailing `~` (`Sect/Warp/WpVi/WpTm/PnkR/Rmrt/RmBa`) that produced repeated `Fread_char: no match` warnings.
- Added compatibility handling to ignore legacy standalone `~` tokens during player-file load.

**Files updated:**
- `src/nanny.c`
- `src/save.c`

**Validation:**
- Full scripted smoke flow passed: create → sect select → mandatory stat allocation → group select → weapon pick → enter game → `save` → `quit`.
- Reconnect/load test passed for saved character (`player/Smokete`) without crash.
- Server remained running after test; no `Fread_char: no match` warnings in runtime log after parser/save-format fix.

---

## Current Runtime State
- Server boots successfully and loads all configured areas.
- IMC command-table warning remains non-fatal by design (degraded mode, no crash).
- No workspace diagnostics currently reported.

## Remaining Backlog (Non-blocking)
- Optional: deeper cosmetic harmonization of every help entry and every legacy command output to exact color guide prose where docs conflict.
- Optional: playtest-driven balancing for warpoint/rank/remort/event tuning after live telemetry.

## Completion Note
All blocker tasks discovered in this audit pass are completed and validated in build + boot + interactive create/save/reconnect checks.