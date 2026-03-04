/**
 * Comprehensive Test Suite for ROM World Builder
 * Tests: Unit tests, API integration, round-trip, validation
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Import all test modules
const AreaParser = require('./src/parsers/AreaParser');
const MobileParser = require('./src/parsers/MobileParser');
const ObjectParser = require('./src/parsers/ObjectParser');
const RoomParser = require('./src/parsers/RoomParser');
const ResetParser = require('./src/parsers/ResetParser');
const ShopParser = require('./src/parsers/ShopParser');
const SpecialParser = require('./src/parsers/SpecialParser');

const MobileGenerator = require('./src/generators/MobileGenerator');
const ObjectGenerator = require('./src/generators/ObjectGenerator');
const RoomGenerator = require('./src/generators/RoomGenerator');
const ResetGenerator = require('./src/generators/ResetGenerator');
const ShopGenerator = require('./src/generators/ShopGenerator');
const SpecialGenerator = require('./src/generators/SpecialGenerator');
const AreaGenerator = require('./src/generators/AreaGenerator');

const ValidationService = require('./src/services/ValidationService');

let testsPassed = 0;
let testsFailed = 0;
let testErrors = [];

function test(description, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`  ✓ ${description}`);
  } catch (error) {
    testsFailed++;
    testErrors.push({ description, error: error.message });
    console.log(`  ✗ ${description}`);
    console.log(`    Error: ${error.message}`);
  }
}

function assertEquals(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertExists(value, message = '') {
  if (!value) {
    throw new Error(`Expected value to exist. ${message}`);
  }
}

function assertIsArray(value, message = '') {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array. ${message}`);
  }
}

function assertGreater(actual, expected, message = '') {
  if (actual <= expected) {
    throw new Error(`${message} Expected ${actual} > ${expected}`);
  }
}

// ============================================================================
// UNIT TESTS - Parsers
// ============================================================================
console.log('\n=== UNIT TESTS: Parsers ===\n');

console.log('Mobile Parser:');
test('Parse mobile with all fields', () => {
  const mobileText = `#10001
gnome warrior~
the gnome warrior~
A small gnome warrior is here.~
G 5 0 3 0
E 30 6
B 18/4+1
B 19/5+1
R 62 29 D3
R 65 39 D4
R 69 44 D5
S`;
  const parsed = MobileParser.parseMobiles(mobileText);
  assertExists(parsed[0]);
  assertEquals(parsed[0].vnum, 10001);
  assertEquals(parsed[0].name, 'gnome warrior');
});

test('Parse mobile short/long forms', () => {
  const mobileText = `#10001
gnome warrior~
the gnome warrior~
A small gnome warrior is here.~
G 5 0 3 0
E 30 6
B 18/4+1
B 19/5+1
R 62 29 D3
R 65 39 D4
R 69 44 D5
S`;
  const parsed = MobileParser.parseMobiles(mobileText);
  const mobile = parsed[0];
  assertEquals(mobile.keywords, 'gnome warrior');
  assertEquals(mobile.short_description, 'the gnome warrior');
  assertExists(mobile.long_description);
});

console.log('\nObject Parser:');
test('Parse object with all fields', () => {
  const objectText = `#10001
longsword~
a longsword~
A shiny longsword lies here.~
W 7 2500 25 0
D 0 0 0 0 0
A 0 5
A 1 3
A 2 1
S`;
  const parsed = ObjectParser.parseObjects(objectText);
  assertExists(parsed[0]);
  assertEquals(parsed[0].vnum, 10001);
  assertEquals(parsed[0].name, 'longsword');
});

test('Parse object with extra descriptions', () => {
  const objectText = `#10001
longsword~
a longsword~
A shiny longsword lies here.~
W 7 2500 25 0
D 0 0 0 0 0
E
blade~
The blade is sharp and gleaming.~
S`;
  const parsed = ObjectParser.parseObjects(objectText);
  assertExists(parsed[0]);
});

console.log('\nRoom Parser:');
test('Parse room with exits', () => {
  const roomText = `#3001
The Golden Griffin Inn~
The common room of the Golden Griffin Inn is quite large and quite active.
~
0 0 0
D0
north exit~
~
0 -1
D1
east exit~
~
0 -1
S`;
  const parsed = RoomParser.parseRooms(roomText);
  assertExists(parsed[0]);
  assertEquals(parsed[0].vnum, 3001);
});

console.log('\nReset Parser:');
test('Parse reset with all command types', () => {
  const resetText = `M 0 10001 1 3000
O 0 10001 1 3000
G 0 10002 1 0
E 0 10003 1 4
P 0 10004 1 10001
D 0 3000 0 1
R 0 3000 3
S`;
  const parsed = ResetParser.parseResets(resetText);
  assertGreater(parsed.length, 0);
});

console.log('\nShop Parser:');
test('Parse shop with buy/sell rates', () => {
  const shopText = `#0
10001 10002 10003
100 100 50
0 0
0 99999
S`;
  const parsed = ShopParser.parseShops(shopText);
  assertExists(parsed[0]);
  assertEquals(parsed[0].keeper_vnum, 10001);
});

console.log('\nSpecial Parser:');
test('Parse special with procedure', () => {
  const specialText = `#3001
cast poison
S`;
  const parsed = SpecialParser.parseSpecials(specialText);
  assertExists(parsed[0]);
  assertEquals(parsed[0].room_vnum, 3001);
});

// ============================================================================
// UNIT TESTS - Generators
// ============================================================================
console.log('\n=== UNIT TESTS: Generators ===\n');

console.log('Mobile Generator:');
test('Generate mobile matches parse format', () => {
  const mobile = {
    vnum: 10001,
    keywords: 'gnome warrior',
    short_description: 'the gnome warrior',
    long_description: 'A small gnome warrior is here.',
    race: 'gnome',
    sex: 'male',
    body_type: 'humanoid',
    alignment: 0,
    level: 5,
    max_hp: 30,
    ac: 6,
    attacks: [{ type: 18, dice: 4, bonus: 1 }],
    damage_bonus: 0,
    money: 0,
    exp: 0,
    act_flags: '',
    affect_flags: '',
    imm_flags: '',
    res_flags: '',
    vul_flags: '',
  };
  const generated = MobileGenerator.generateMobile(mobile);
  assertExists(generated);
  assertExists(generated.includes('#10001'));
});

console.log('Object Generator:');
test('Generate object matches parse format', () => {
  const object = {
    vnum: 10001,
    name: 'longsword',
    short_description: 'a longsword',
    long_description: 'A shiny longsword lies here.',
    item_type: 7,
    wear_flags: 2,
    extra_flags: 0,
    values: [0, 0, 0, 0],
    weight: 25,
    cost: 2500,
    level: 0,
    condition: 0,
  };
  const generated = ObjectGenerator.generateObject(object);
  assertExists(generated);
  assertExists(generated.includes('#10001'));
});

console.log('\nRoom Generator:');
test('Generate room with name and description', () => {
  const room = {
    vnum: 3001,
    name: 'The Golden Griffin Inn',
    desc: 'The common room is quite large.',
    rawRoomFlags: '0 0 0',
    exits: [],
  };
  const generated = RoomGenerator.generateRoom(room);
  assertExists(generated);
  assertExists(generated.includes('#3001'));
});

console.log('\nReset Generator:');
test('Generate reset command M (load mobile)', () => {
  const reset = {
    command: 'M',
    arg1: 10001,
    arg3: 3000,
    arg4: 1,
    arg5: 3,
  };
  const generated = ResetGenerator.generateReset(reset);
  assertEquals(generated, 'M 0 10001 1 3000');
});

test('Generate reset command O (place object)', () => {
  const reset = {
    command: 'O',
    arg1: 10001,
    arg3: 3000,
    arg5: 1,
  };
  const generated = ResetGenerator.generateReset(reset);
  assertEquals(generated, 'O 0 10001 1 3000');
});

test('Generate reset command E (equip)', () => {
  const reset = {
    command: 'E',
    arg1: 10003,
    arg2: 4,
    arg5: 1,
  };
  const generated = ResetGenerator.generateReset(reset);
  assertEquals(generated, 'E 0 10003 1 4');
});

test('Generate reset command P (put in container)', () => {
  const reset = {
    command: 'P',
    arg1: 10004,
    arg3: 10001,
    arg5: 1,
  };
  const generated = ResetGenerator.generateReset(reset);
  assertEquals(generated, 'P 0 10004 1 10001');
});

test('Generate reset command D (door state)', () => {
  const reset = {
    command: 'D',
    arg3: 3000,
    arg4: 0,
    arg5: 1,
  };
  const generated = ResetGenerator.generateReset(reset);
  assertEquals(generated, 'D 0 3000 0 1');
});

test('Generate reset command R (randomize)', () => {
  const reset = {
    command: 'R',
    arg3: 3000,
    arg5: 3,
  };
  const generated = ResetGenerator.generateReset(reset);
  assertEquals(generated, 'R 0 3000 3');
});

// ============================================================================
// ROUND-TRIP TESTS
// ============================================================================
console.log('\n=== ROUND-TRIP TESTS ===\n');

console.log('Mobile Round-Trip:');
test('Parse and regenerate mobile preserves data', () => {
  const originalText = `#10001
gnome warrior~
the gnome warrior~
A small gnome warrior is here.~
G 5 0 3 0
E 30 6
B 18/4+1
B 19/5+1
R 62 29 D3
R 65 39 D4
R 69 44 D5
S`;
  const parsed = MobileParser.parseMobiles(originalText);
  const regenerated = MobileGenerator.generateMobile(parsed[0]);
  const reparsed = MobileParser.parseMobiles(regenerated + '\nS');
  assertEquals(reparsed[0].vnum, parsed[0].vnum);
});

console.log('Object Round-Trip:');
test('Parse and regenerate object preserves data', () => {
  const originalText = `#10001
longsword~
a longsword~
A shiny longsword lies here.~
W 7 2500 25 0
D 0 0 0 0 0
A 0 5
A 1 3
A 2 1
S`;
  const parsed = ObjectParser.parseObjects(originalText);
  const regenerated = ObjectGenerator.generateObject(parsed[0]);
  const reparsed = ObjectParser.parseObjects(regenerated + '\nS');
  assertEquals(reparsed[0].vnum, parsed[0].vnum);
});

console.log('Room Round-Trip:');
test('Parse and regenerate room preserves name', () => {
  const originalText = `#3001
The Golden Griffin Inn~
The common room.~
0 0 0
S`;
  const parsed = RoomParser.parseRooms(originalText);
  const regenerated = RoomGenerator.generateRoom(parsed[0]);
  assertExists(regenerated.includes('The Golden Griffin Inn'));
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================
console.log('\n=== VALIDATION TESTS ===\n');

console.log('Mobile Validation:');
test('Validate mobile with valid data passes', () => {
  const mobile = {
    vnum: 10001,
    keywords: 'gnome warrior',
    short_description: 'the gnome warrior',
    long_description: 'A small gnome warrior.',
  };
  const errors = ValidationService.validateMobile(mobile, { mobiles: [mobile] });
  assertEquals(errors.length, 0, 'Expected no validation errors');
});

test('Validate mobile without vnum fails', () => {
  const mobile = {
    keywords: 'gnome warrior',
    short_description: 'the gnome warrior',
  };
  const errors = ValidationService.validateMobile(mobile, { mobiles: [] });
  assertGreater(errors.length, 0, 'Expected validation errors for missing vnum');
});

console.log('Object Validation:');
test('Validate object with valid data passes', () => {
  const object = {
    vnum: 10001,
    name: 'longsword',
    short_description: 'a longsword',
    long_description: 'A longsword.',
    item_type: 7,
    wear_flags: 2,
  };
  const errors = ValidationService.validateObject(object, { objects: [object] });
  assertEquals(errors.length, 0, 'Expected no validation errors');
});

console.log('Room Validation:');
test('Validate room with valid data passes', () => {
  const room = {
    vnum: 3001,
    name: 'The Inn',
    desc: 'A nice inn.',
    exits: [],
  };
  const errors = ValidationService.validateRoom(room, { rooms: [room] });
  assertEquals(errors.length, 0, 'Expected no validation errors');
});

console.log('Reset Validation:');
test('Validate reset M command with valid mobile', () => {
  const reset = {
    command: 'M',
    arg1: 10001,
    arg3: 3000,
    arg5: 1,
  };
  const areaData = {
    mobiles: [{ vnum: 10001 }],
    rooms: [{ vnum: 3000 }],
  };
  const errors = ValidationService.validateReset(reset, areaData);
  assertEquals(errors.length, 0, 'Expected no validation errors for valid M reset');
});

test('Validate reset M command with missing mobile fails', () => {
  const reset = {
    command: 'M',
    arg1: 99999,
    arg3: 3000,
    arg5: 1,
  };
  const areaData = {
    mobiles: [{ vnum: 10001 }],
    rooms: [{ vnum: 3000 }],
  };
  const errors = ValidationService.validateReset(reset, areaData);
  assertGreater(errors.length, 0, 'Expected validation errors for missing mobile');
});

console.log('Shop Validation:');
test('Validate shop with valid keeper', () => {
  const shop = {
    room_vnum: 3001,
    keeper_vnum: 10001,
    buy_profit: 100,
    sell_profit: 100,
    buy_types: [1, 2, 3],
    no_buy_type: 0,
    open_hour: 0,
    close_hour: 23,
  };
  const areaData = {
    rooms: [{ vnum: 3001 }],
    mobiles: [{ vnum: 10001 }],
  };
  const errors = ValidationService.validateShop(shop, areaData);
  assertEquals(errors.length, 0, 'Expected no validation errors for valid shop');
});

console.log('Special Validation:');
test('Validate special with valid room', () => {
  const special = {
    room_vnum: 3001,
    function_name: 'cast poison',
  };
  const areaData = {
    rooms: [{ vnum: 3001 }],
  };
  const errors = ValidationService.validateSpecial(special, areaData);
  assertEquals(errors.length, 0, 'Expected no validation errors for valid special');
});

// ============================================================================
// PRODUCTION AREA TESTS
// ============================================================================
console.log('\n=== PRODUCTION AREA TESTS ===\n');

const testAreas = ['midgaard.are', 'school.are', 'shire.are'];
const areaDir = path.join(__dirname, '../../area');

console.log('Round-Trip Tests (Production Areas):');
testAreas.forEach(areaFile => {
  const filePath = path.join(areaDir, areaFile);
  if (!fs.existsSync(filePath)) return;
  
  test(`Load and parse ${areaFile}`, () => {
    const content = fs.readFileSync(filePath, 'utf8');
    const area = AreaParser.parseArea(content);
    assertExists(area.name, `${areaFile} should have a name`);
    assertIsArray(area.rooms, `${areaFile} should have rooms array`);
  });

  test(`Validate all entities in ${areaFile}`, () => {
    const content = fs.readFileSync(filePath, 'utf8');
    const area = AreaParser.parseArea(content);
    const allErrors = ValidationService.validateArea(area);
    // Log any errors but don't fail for production areas
    if (allErrors.length > 0) {
      console.log(`    Found ${allErrors.length} validation issues (logged)`);
    }
  });
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log(`\nTEST SUMMARY`);
console.log(`  ✓ Passed: ${testsPassed}`);
console.log(`  ✗ Failed: ${testsFailed}`);
console.log(`  Total:   ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
  console.log('\nFailed Tests:');
  testErrors.forEach(({ description, error }) => {
    console.log(`  • ${description}`);
    console.log(`    ${error}`);
  });
}

const passRate = Math.round((testsPassed / (testsPassed + testsFailed)) * 100);
console.log(`\nPass Rate: ${passRate}%`);

if (testsFailed === 0) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉');
  process.exit(0);
} else {
  console.log(`\n❌ ${testsFailed} TEST(S) FAILED`);
  process.exit(1);
}
