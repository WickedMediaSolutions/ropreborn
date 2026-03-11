# Tower QA Checklist

Use this checklist once the MUD runtime is available. The goal is to validate the new White Tower and Obsidian Tower onboarding flow end to end.

## Setup

- Rebuild/restart the server so `src/nanny.c` and the updated `.are` files are loaded.
- Make sure `white_tower.are` and `obsidian_tower.are` are present in `area/area.lst`.
- Test with fresh level 0 characters.
- For immortal-speed checks, use `goto 9800` and `goto 9900` to jump between tower starts.
- Use `at 9800 <command>` or `at 9900 <command>` for remote spot checks without relocating.

## Spawn Routing

### Good homeland tests

- Create a `human` and confirm spawn in `White Tower` room `9800`.
- Create a `dwarf` and confirm spawn in `White Tower` room `9800`.
- Create a race that uses alias mapping, such as `stone giant` or `high elf`, and confirm spawn in `White Tower` room `9800`.

### Evil homeland tests

- Create an `orc` and confirm spawn in `Obsidian Tower` room `9900`.
- Create a `drow` and confirm spawn in `Obsidian Tower` room `9900`.
- Create a race that uses alias mapping, such as `ogre`, `duergar`, `lich`, or `kenku`, and confirm spawn in `Obsidian Tower` room `9900`.

### Fallback tests

- Create a race not listed in either homeland group and verify alignment fallback still chooses the correct tower.
- Temporarily break one tower room in a dev copy and confirm fallback to `ROOM_VNUM_SCHOOL` still works.

## Starter Kit

### Auto-equip

- Create a new `warrior` and confirm torso armor, shield, and sword are already equipped.
- Create a new `cleric` and confirm torso armor, shield, and mace are already equipped.
- Create a new `mage` and confirm torso armor, shield, and dagger are already equipped.
- Confirm ration and waterskin are present in inventory but not auto-equipped.

### No resale exploit

- Attempt to sell granted starter weapon, vest, shield, ration, and waterskin.
- Confirm the granted copies return `0` or are otherwise worthless to sell.

### Replacement purchases

- Drop or junk the equipped starter weapon.
- Buy a replacement from the tower shop at level 0.
- Confirm level 0 characters can buy sword, dagger, mace, vest, shield, ration, and waterskin.

## Trainer Functions

- Use `gain list` beside the tower marshal and confirm the command works.
- Confirm `practice` works beside the marshal.
- Confirm `train` works beside the marshal.

## Recovery Hub

- Fight on a trial floor and return to room `9800` or `9900`.
- Confirm healing and mana recovery are noticeably faster than normal rooms.

## Floor Loot Checks

### White Tower

- Kill `a White Tower initiate` and confirm `an initiate's shortblade` can drop.
- Kill `a White Tower sentry` and confirm `a sentry cap` can drop.
- Kill `a White Tower defender` and confirm `a defender's mail shirt` can drop.
- Kill `a White Tower knight` and confirm `a pair of knight greaves` can drop.
- Kill `a White Tower warden` and confirm `a warden's longsword` can drop.

### Obsidian Tower

- Kill `an Obsidian Tower initiate` and confirm `an initiate's blade` can drop.
- Kill `an Obsidian Tower sentry` and confirm `a sentry helm` can drop.
- Kill `an Obsidian Tower defender` and confirm `a defender's mail shirt` can drop.
- Kill `an Obsidian Tower knight` and confirm `a pair of knight greaves` can drop.
- Kill `an Obsidian Tower warden` and confirm `a warden's longsword` can drop.
- Kill one mob on each floor band and confirm corpses no longer contain stacked cleric, mage, and thief weapon bundles.

## Shop Weapon Ladders

### Cleric weapons

- At the White Tower weaponsmith, confirm the cleric mace ladder appears in `list` output.
- At the Obsidian Tower weaponsmith, confirm the cleric mace ladder appears in `list` output.
- Verify the cleric ladder includes starter, early, mid, and top-end tower maces.

### Mage weapons

- At the White Tower weaponsmith, confirm the mage staff ladder appears in `list` output.
- At the Obsidian Tower weaponsmith, confirm the mage staff ladder appears in `list` output.
- Verify the mage ladder includes starter, early, mid, and top-end tower staffs.

### Thief weapons

- At the White Tower weaponsmith, confirm the thief dagger ladder appears in `list` output.
- At the Obsidian Tower weaponsmith, confirm the thief dagger ladder appears in `list` output.
- Verify the thief ladder includes starter, early, mid, and top-end tower daggers.

## Armor Ladders

### White Tower

- At the White Tower quartermaster, confirm warrior, cleric, mage, and thief body-armor ladders appear in `list` output.
- Verify the White Tower armor stock includes level 5, 10, and 14 upgrades for each archetype.
- Buy one class-themed armor piece and confirm its stat accent applies correctly.
- Confirm warrior off-slot gauntlet ladder appears (hands slot).
- Confirm cleric off-slot circlet ladder appears (head slot).
- Confirm mage off-slot cloak ladder appears (about slot).
- Confirm thief off-slot boot ladder appears (feet slot).

### Obsidian Tower

- At the Obsidian Tower quartermaster, confirm warrior, cleric, mage, and thief body-armor ladders appear in `list` output.
- Verify the Obsidian Tower armor stock includes level 5, 10, and 14 upgrades for each archetype.
- Buy one class-themed armor piece and confirm its stat accent applies correctly.
- Confirm warrior off-slot gauntlet ladder appears (hands slot).
- Confirm cleric off-slot circlet ladder appears (head slot).
- Confirm mage off-slot cloak ladder appears (about slot).
- Confirm thief off-slot boot ladder appears (feet slot).

## Shop Margins

- Confirm quartermaster and weaponsmith use `profit_buy 110` and `profit_sell 70` in both towers.
- Confirm provisioners use `profit_buy 105` and `profit_sell 60` in both towers.
- Verify resale no longer returns near full value for normal purchased starter-path gear.

## Mirror Integrity

- Walk both towers and confirm exits remain mirrored room-for-room.
- Confirm the same services exist in both towers: trainer, weaponsmith, armorer, provisioner.
- Confirm the same five combat floors exist in both towers.

## Regression Checks

- Verify legacy `school.are` start flow still works when tower routing falls back.
- Verify new players still receive the map.
- Verify no starter tower mob is aggressive by default.
- Verify tower shop inventory and mob resets reload correctly after area reset.
