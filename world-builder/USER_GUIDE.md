# ROM World Builder - User Guide

## Getting Started

The ROM World Builder is a web-based UI for creating and editing ROM MUD areas. It provides visual tools for designing rooms, placing mobiles and objects, configuring resets, and managing shops and specials.

### What You Can Do

✅ Create and edit areas, rooms, mobiles, and objects  
✅ Design room layouts with a visual 2D grid  
✅ Create exits and doors with full customization  
✅ Place mobiles and objects with spawn configurations  
✅ Define reset commands (M/O/G/E/P/D/R)  
✅ Configure shops and special functions  
✅ Validate areas for common issues  
✅ Save changes safely with automatic backups  

---

## Main Interface

### Left Panel: Area Browser
- **Area List** - Shows all available areas
- **Create Area** - New area form
- **Load Area** - Select and load an area for editing

### Center Panel: Room Grid
- **2D Map View** - Visual representation of room layout
- **Drag & Drop** - Reposition rooms on the grid
- **Status Display** - Room count, legend, zoom controls
- **Keyboard Navigation** - Arrow keys to move between connected rooms

### Right Panel: Property Editor
- **Room Details** - Edit name, description, flags, sector
- **Quick Navigation** - Buttons for connected rooms
- **Place Entities** - Quick buttons to place mobiles/objects
- **Exits** - Add/edit/delete exits with door configuration
- **Entity Browser Tabs** - Mobiles, Objects, Shops, Specials, Resets

---

## Creating an Area

1. Click **Create New Area** in the left panel
2. Enter area name, author, and description
3. Click **Create**
4. The area is loaded automatically for editing

---

## Building Rooms

### Add a Room

**Method 1: Grid**
1. Click **+ New Room** in the top-right
2. Accept the auto-generated vnum
3. Click on the new room to edit properties

**Method 2: Property Panel**
1. Open the area and click any existing room
2. Click **+ New Room**

### Edit Room Properties

1. Select a room (click on it in the grid)
2. In the right panel, edit:
   - **Name** - Room title (display name)
   - **Description** - What players see when they enter
   - **Room Type (Sector)** - Terrain/location type
   - **Room Flags** - Special properties (dark, indoors, safe, etc.)

### Set Room Flags

Common room flags:
- **Dark** - Players need light to see
- **No Mob** - Prevents random mobiles from walking through
- **Indoors** - Weather doesn't affect this room
- **Private** - No more than 2 players allowed
- **Safe** - Players can't being attacked
- **Solitary** - Only 1 player allowed
- **Pet Shop** - Marks this room as a pet shop
- **No Recall** - Players can't recall/teleport out
- **Heroes Only** / **Gods Only** / **Newbies Only** - Level restrictions

---

## Creating Exits

### Add an Exit

1. Select a room
2. Scroll to **Exits** section in property panel
3. In the **Add Exit** form:
   - Select direction (north, south, east, west, up, down)
   - Select target room from dropdown
   - Set door type (none = passage, door = physical door)
   - Add optional door keyword, description, lock settings
4. Click **Create Exit**

### Edit an Exit

1. Select the room with the exit
2. In **Exits** section, find the exit you want to edit
3. Update:
   - **Target** - Which room leads here
   - **Door Type** - none, door_open, door_closed, door_locked
   - **Lock Flags** - 0=open, 1=closed, 2=locked
   - **Key Object** - vnum of key required (-1 for none)
   - **Door Keyword** - What players type to interact with door (e.g., "door", "gate")
   - **Description** - What players see when looking that direction

### Door Configuration (D Reset)

1. Select a room with exits
2. For each exit, click **🚪 Door Settings**
3. Choose door type and lock state
4. Check **Auto-create D reset** to add door state reset
5. Click **Apply**

### Quick Navigation

After creating exits, use the direction buttons at the top of the property panel to quickly move between connected rooms:
- ↑ N, ↓ S, ← W, → E, ↗ U, ↙ D

### Reverse Exits

When you create an exit from Room A to Room B north:
- Check **Auto-link reverse exit** to automatically create a south exit from Room B back to Room A
- Check **Auto-remove reverse on delete** to clean up the reverse when you delete

---

## Managing Mobiles

### Create a Mobile

1. Click **Mobiles** tab in entity browser (right side)
2. Click **+ Add Mobile**
3. Fill in details:
   - **Keywords** - What players type to target (space-separated)
   - **Short Description** - "(the gnome warrior)" format
   - **Long Description** - Full text seen on enter
   - **Level** - Monster difficulty
   - **Alignment** - -1000 to 1000 (evil to good)
   - **Act Flags** - Behavior (aggressive, wimpy, etc.)
   - **Affect Flags** - Status effects (poisoned, cursed, etc.)
4. Click **Save**

### Edit a Mobile

1. Click **Mobiles** tab
2. Click the mobile you want to edit
3. Modify fields
4. Click **Save**

### Delete a Mobile

1. Click **Mobiles** tab
2. Select the mobile
3. Click **Delete**
4. Confirm

---

## Managing Objects

### Create an Object

1. Click **Objects** tab
2. Click **+ Add Object**
3. Fill in details:
   - **Item Type** - weapon, armor, potion, container, etc.
   - **Name** - Object filename (internal)
   - **Short Description** - Display text
   - **Wear Flags** - Where it can be worn (2 = torso, 18 = wield)
   - **Values** - Item-specific stats (varies by type)
   - **Weight/Cost** - Game balance
   - **Level** - Who can use it
4. Click **Save**

### Edit an Object

1. Click **Objects** tab
2. Select the object
3. Modify fields
4. Click **Save**

### Item Types Reference

- **Weapon (7)** - Swords, bows, etc.
- **Armor (1)** - Clothing, helmets, armor
- **Potion (8)** - Magical potions
- **Container (12)** - Bags, chests
- **Food (15)** - Consumables
- **Key (14)** - Locks and doors
- **Scroll (2)** - Magical scrolls
- **Treasure (6)** - Generic items

---

## Placing Mobiles and Objects

### Method 1: Quick Placement (Easiest)

1. **Select a room** in the grid
2. **From grid** - Right-click the room → **Place Mobile/Object**
3. **From property panel** - Click **Place Mobile** or **Place Object** buttons
4. Choose entity from dropdown
5. Set spawn limits:
   - **Max in World** - Total allowed in the game
   - **Max in Room** - Total allowed in this room
6. Click **Create Reset**

### Method 2: Manual Resets

1. Click **Resets** tab
2. Select **M** (Load Mobile) or **O** (Place Object)
3. Fill in:
   - Entity vnum
   - Room vnum
   - Spawn limits
4. Click **Add Reset**

### Spawn Limits Explained

- **Max in World** - If you place 3 gnome warriors, only 3 can exist total
- **Max in Room** - Even with 3 in world, only 1-2 per room
- Set to 0 for unlimited

---

## Reset Commands

Resets define how the world resets when players rest. Use the **Reset Editor** tab to manage them.

### Reset Types

**M - Load Mobile**
- Spawn a monster in a room
- Can set max in world and max in room

**O - Place Object**
- Drop an object in a room
- Can limit how many exist

**G - Give to Mobile**
- Give object to the last-loaded mobile
- Useful for weapons/armor

**E - Equip Mobile**
- Equip object on the last-loaded mobile
- Specifies wear location
- Wear locations: 0=light, 4=neck, 5=body, 16=wield, 17=hold

**P - Put in Container**
- Place object inside a container (last O reset)
- Useful for locked chests

**D - Set Door State**
- Lock or unlock a door in a room
- States: 0=open, 1=closed, 2=locked
- Directions: 0=N, 1=S, 2=E, 3=W, 4=U, 5=D

**R - Randomize Exits**
- Shuffle a room's exits randomly
- Great for mazes

### Reset Order

Resets execute **top to bottom**. Order matters!

Example:
```
1. M 0 10001 1 3000    (Load mobile)
2. E 0 10003 1 16      (Equip weapon on mobile)
3. O 0 10002 1 3000    (Place object in room)
```

---

## Configuring Doors

### Simple Door (No Lock)

1. Create exit (door type = "Door")
2. Set lock flags = 0 (open)
3. No key needed

### Locked Door

1. Create exit (door type = "Door")
2. Set lock flags = 2 (locked)
3. Set key object vnum
4. Create object with item type **Key (14)**
5. Use door keyword so players know what to unlock

### Set Door State with Reset

1. In Exits section, click **🚪 Door Settings** on the exit
2. Choose lock state (open/closed/locked)
3. Check **Auto-create D reset**
4. Click **Apply**

---

## Creating Shops

Shops allow NPCs to buy and sell items.

1. Click **Shops** tab
2. Click **+ Add Shop**
3. Fill in:
   - **Keeper Mobile** - Who runs the shop
   - **Buy Profit** - Markup when selling to player (150 = 150%)
   - **Sell Profit** - Markup when buying from player (80 = 80%)
   - **Item Types** - What they sell
4. Click **Save**

---

## Creating Specials

Specials are special functions (spells, healing, combat bonuses, etc.) attached to rooms or mobiles.

1. Click **Specials** tab
2. Click **+ Add Special**
3. Choose target (room or mobile)
4. Choose function (cast poison, heal, etc.)
5. Click **Save**

---

## Validation and Saving

### Validate Your Area

Before saving:
1. Click **Validate** button (appears in toolbar)
2. Review errors and warnings
3. Fix any **errors** (broken references, missing vnums)
4. Consider **warnings** (design suggestions)

### Common Validation Issues

- **Vnum mismatch** - Mobile/object vnum in reset doesn't exist
- **Duplicate vnums** - Two entities with same number
- **Missing back reference** - Exit exists but reverse doesn't
- **Room not connected** - Room has no exits

### Save Your Area

1. Make sure validation passes
2. Click **Save** button
3. Automatic backup created in `/area/.backups/`
4. Area written to `/area/:name.are`

---

## Tips and Best Practices

### Room Design

- **Keep rooms descriptive** - Players enjoy immersion
- **Set appropriate sector** - Affects movement and weather
- **Use room flags** - Dark rooms need light sources
- **Connect logically** - Areas should feel navigable

### Mobile Placement

- **Balance difficulty** - Mix easy and hard mobiles
- **Set spawn limits** - Don't create lag with too many
- **Equip thoughtfully** - Give meaningful gear
- **Use specials** - Make bosses unique

### Object Placement

- **Treasure rewards** - Place valuable items where earned
- **Containers** - Use chests for hidden items
- **Keys** - Make locked content discoverable
- **Consumables** - Provide healing/utility potions

### Exits

- **Bidirectional** - All exits should have reverse
- **Logical naming** - Doors should make sense
- **Accessible** - Don't trap players behind locked content
- **Map carefully** - Test navigation before saving

### Testing

1. **Load in game** - Place fresh area and test
2. **Walk all paths** - Verify all exits work
3. **Spawn entities** - Check mobiles/objects appear
4. **Try combat** - Ensure mobiles are balanced
5. **Check spawning** - Verify resets work as intended

---

## Troubleshooting

### "Mobile/Object not found"
- Check the vnum exists
- Verify vnum is spelled correctly
- Make sure entity is in correct area

### "Room not found"
- Verify target room vnum
- Make sure room exists in area
- Check you're referencing correct area

### "Can't save area"
- Check file permissions
- Verify `/area/` directory exists
- Look for validation errors

### Area changes disappeared
- Changes are lost if you reload without saving
- Use **Load Area** to reload from disk
- Use **Save** to persist changes

### Exits not working in-game
- Check reverse exits exist (use **Sync Reverse**)
- Verify room vnums in exit targets
- Test with simple north-south pair first

---

## Keyboard Shortcuts

**In Room Grid:**
- `↑↓←→` - Navigate between rooms
- `Ctrl+N` - Create new room
- `Delete` - Delete selected room

**In Property Panel:**
- `Tab` - Move to next field
- `Enter` - Save/submit form
- `Escape` - Cancel dialog

---

## Getting Help

- **Hover tooltips** - Most fields have help text
- **Examples** - Review midgaard.are for templates
- **API Docs** - See API_DOCUMENTATION.md for endpoints
- **Validation** - Use validate button to find issues

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ↑ | Navigate north |
| ↓ | Navigate south |
| ← | Navigate west |
| → | Navigate east |
| Ctrl+N | New room |
| Delete | Delete room |
| Right-click room | Context menu (placement) |

---

**Version:** 1.0  
**Last Updated:** March 2026  
**Questions?** Check API_DOCUMENTATION.md or review existing area files for examples.
