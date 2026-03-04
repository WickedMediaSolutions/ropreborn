# World Builder Sprint Implementation Plan

**Purpose:** Convert the master checklist into an execution-ready sequence with concrete file-level work.

**Scope Target:** Full authoring support for rooms, exits, mobiles, objects, resets, shops, specials with safe, validated saves.

---

## Delivery Sequence (Recommended)

- **Sprint 1:** Backend parser/schema foundation for mobiles + objects
- **Sprint 2:** Backend resets + validation + CRUD APIs
- **Sprint 3:** Frontend mobile/object editors + list panels
- **Sprint 4:** Reset editor + room placement workflows
- **Sprint 5:** Shops/specials editor + dependency tooling
- **Sprint 6:** Hardening, test matrix, docs, release gates

---

## Sprint 1 — Parser/Generator Foundation (Mobiles + Objects)

### Goal
Add structured read/write support for `#MOBILES` and `#OBJECTS` while preserving non-edited content.

### Files to change
- `world-builder/backend/src/services/AreParser.js`
  - Add `parseMobilesSection()`
  - Add `parseObjectsSection()`
  - Capture unknown lines in passthrough arrays per entity
- `world-builder/backend/src/services/AreGenerator.js`
  - Add `generateMobilesSection()`
  - Add `generateObjectsSection()`
  - Preserve section order and untouched section text when unchanged
- `world-builder/backend/src/services/FileManager.js`
  - Extend loaded `areaData` metadata with `rawSections` for mobiles/objects
- `world-builder/backend/src/routes/areas.js`
  - Return mobile/object counts in list and detail payloads

### Data contracts to define
- `areaData.mobiles[]` structured object
- `areaData.objects[]` structured object
- `entity.rawUnknownLines[]` passthrough storage

### Acceptance criteria
- Loading existing areas returns parsed `mobiles` and `objects`
- Save with no changes does not mutate unrelated file content
- Editing one mobile does not alter object/reset/shop/special sections

### Validation commands
- Load 5+ existing areas via API and check mobile/object counts
- Save round-trip fixture copies and compare section headers/counts

---

## Sprint 2 — Resets, Integrity Engine, API CRUD

### Goal
Implement resets parsing/serialization and provide stable CRUD + validate endpoints.

### Files to change
- `world-builder/backend/src/services/AreParser.js`
  - Add `parseResetsSection()` for `M/O/G/E/P/D/R` commands
- `world-builder/backend/src/services/AreGenerator.js`
  - Add `generateResetsSection()` with stable ordering/formatting
- `world-builder/backend/src/services/ValidationService.js` (new)
  - Referential checks (room/mobile/object/shop/special references)
  - Hard error vs warning classification
- `world-builder/backend/src/routes/mobiles.js` (new)
  - list/create/update/delete mobile endpoints
- `world-builder/backend/src/routes/objects.js` (new)
  - list/create/update/delete object endpoints
- `world-builder/backend/src/routes/resets.js` (new)
  - list/create/update/delete reset endpoints
- `world-builder/backend/src/routes/validate.js` (new)
  - full area validation endpoint
- `world-builder/backend/src/server.js`
  - register new routes

### API additions
- `GET/POST/PUT/DELETE /api/areas/:name/mobiles`
- `GET/POST/PUT/DELETE /api/areas/:name/objects`
- `GET/POST/PUT/DELETE /api/areas/:name/resets`
- `POST /api/areas/:name/validate`

### Acceptance criteria
- Full CRUD works for mobiles/objects/resets on temporary copied areas
- Validation endpoint returns deterministic diagnostics
- Delete operations block or warn when dependencies exist

### Validation commands
- API smoke scripts for CRUD + dependency failure cases
- Save and reload confirms persisted reset integrity

---

## Sprint 3 — Frontend Entity Editors (Mobiles + Objects)

### Goal
Ship first-class mobile/object editing UX (not raw-only).

### Files to change
- `world-builder/frontend/src/api/client.js`
  - Add mobile/object CRUD client methods
- `world-builder/frontend/src/store/store.js`
  - Add state slices/actions for mobiles and objects
- `world-builder/frontend/src/components/EntityBrowser.jsx` (new)
  - Tabbed entity browser for Rooms/Mobiles/Objects
- `world-builder/frontend/src/components/MobileEditor.jsx` (new)
  - Structured mobile form + bitflag helpers
- `world-builder/frontend/src/components/ObjectEditor.jsx` (new)
  - Structured object form + type-aware value editor
- `world-builder/frontend/src/components/PropertyPanel.jsx`
  - Integrate mobile/object editor panels based on selected entity
- `world-builder/frontend/src/App.jsx`
  - Layout wiring for new entity tabs

### UX requirements
- Search/filter by vnum/name/keywords
- Duplicate entity action (clone + assign next vnum)
- Dependency badge (“used in N resets”)

### Acceptance criteria
- User can create/edit/delete mobiles and objects from UI
- All changes remain in-memory until explicit save
- Validation messages surface in notifications panel

---

## Sprint 4 — Reset Editor + Room Placement Workflows

### Goal
Enable placement of mobiles/objects in rooms through reset workflows.

### Files to change
- `world-builder/frontend/src/api/client.js`
  - Add reset CRUD and placement helper methods
- `world-builder/frontend/src/store/store.js`
  - Add reset state/actions and room placement actions
- `world-builder/frontend/src/components/ResetEditor.jsx` (new)
  - Typed row editor for `M/O/G/E/P/D/R`
- `world-builder/frontend/src/components/RoomGrid.jsx`
  - Add room actions: place mobile / place object / set door reset
- `world-builder/frontend/src/components/PropertyPanel.jsx`
  - Add placement widgets on selected room
- `world-builder/backend/src/routes/rooms.js`
  - Add helper endpoints to emit valid reset chains

### UX requirements
- Preserve reset order by default
- Drag reorder with validation checks
- Inline error/warning badges per reset row

### Acceptance criteria
- Builders can place a mobile into a room in < 5 clicks
- Builders can place an object in room/mobile/container contexts
- Door and randomizer reset actions are editable in UI

---

## Sprint 5 — Shops, Specials, and Dependency Tooling

### Goal
Complete remaining area systems and cross-reference tooling.

### Files to change
- `world-builder/backend/src/services/AreParser.js`
  - Add/finish shop and specials parsing details
- `world-builder/backend/src/services/AreGenerator.js`
  - Add/finish shop and specials generation
- `world-builder/backend/src/routes/shops.js` (new)
  - CRUD for shops
- `world-builder/backend/src/routes/specials.js` (new)
  - CRUD for specials
- `world-builder/backend/src/routes/references.js` (new)
  - vnum reference graph endpoint
- `world-builder/frontend/src/api/client.js`
  - shops/specials/reference methods
- `world-builder/frontend/src/components/ShopEditor.jsx` (new)
- `world-builder/frontend/src/components/SpecialEditor.jsx` (new)
- `world-builder/frontend/src/components/ReferenceInspector.jsx` (new)

### Acceptance criteria
- Shops/specials can be authored and validated from UI
- Delete/renumber operations show impacted references before confirm
- Save output remains ROM-compatible

---

## Sprint 6 — Hardening, Testing, Documentation, Release

### Goal
Pass the full quality gate and make the suite operationally safe.

### Files to change
- `world-builder/backend/src/services/ValidationService.js`
  - finalize all rule coverage and diagnostics
- `world-builder/backend/src/services/__tests__/*` (new)
  - parser/generator/validation tests
- `world-builder/backend/src/routes/__tests__/*` (new)
  - API integration tests
- `world-builder/frontend/src/components/__tests__/*` (new)
  - editor integration tests
- `world-builder/API_DOCS.md`
  - update all endpoints and payloads
- `world-builder/README.md`
  - include mobile/object/reset/shopping/special workflows
- `world-builder/QUICK_REFERENCE.md`
  - shortcuts + common operations
- `world-builder/INDEX.md`
  - final docs index updates

### Test gates (must pass)
- Section round-trip tests for rooms/mobiles/objects/resets/shops/specials
- Edit isolation tests (one section edit does not mutate others)
- CRUD endpoint tests for all entities
- Manual in-game verification on edited area copies

### Release criteria
- No critical validation defects
- Non-destructive save and backup/rollback verified
- Documentation complete for builder and operators

---

## Implementation Order Inside Each Sprint

Use this micro-order in every sprint to reduce regressions:

1. Extend data contract/schema
2. Implement parser read path
3. Implement generator write path
4. Add backend route surface
5. Add frontend API/store hooks
6. Add UI components
7. Add validation + error messages
8. Run targeted tests + round-trip checks
9. Update docs

---

## Risk Register (Track per sprint)

- **Format drift risk:** serializer rewrites untouched sections
  - Mitigation: section-level passthrough + round-trip snapshots
- **Dependency break risk:** deleting vnums leaves dangling resets
  - Mitigation: pre-delete reference checks + impact dialogs
- **Parser ambiguity risk:** legacy `.are` variants differ across files
  - Mitigation: tolerate unknown lines and preserve raw directives
- **UX complexity risk:** too many fields overwhelm builders
  - Mitigation: basic mode + advanced panels + tooltips

---

## First Work Package (start now)

If beginning implementation immediately, execute this exact set first:

1. Add `parseMobilesSection()` + `parseObjectsSection()` in `AreParser.js`
2. Add `generateMobilesSection()` + `generateObjectsSection()` in `AreGenerator.js`
3. Extend `FileManager.js` to carry raw section payload metadata
4. Expose counts in `areas.js`
5. Create a temporary round-trip script to verify no unrelated section mutation
