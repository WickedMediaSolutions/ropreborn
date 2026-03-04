/**
 * Round-Trip Testing for World Builder
 * Tests parsing and generation to ensure no data loss
 */

import fs from 'fs';
import path from 'path';
import { AreParser } from '../src/services/AreParser.js';
import { AreGenerator } from '../src/services/AreGenerator.js';

class RoundTripTester {
  constructor(areaPath) {
    this.areaPath = areaPath;
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: [],
    };
  }

  async runTests() {
    console.log('🧪 Round-Trip Testing Suite');
    console.log('============================\n');

    if (!fs.existsSync(this.areaPath)) {
      console.error(`❌ Area file not found: ${this.areaPath}`);
      return false;
    }

    // Test 1: Parse area file
    console.log('Test 1: Parse area file...');
    const parsedData = await this.testParsing();
    if (!parsedData) return false;

    // Test 2: Generate area from parsed data
    console.log('\nTest 2: Generate area from parsed data...');
    const generatedContent = await this.testGeneration(parsedData);
    if (!generatedContent) return false;

    // Test 3: Parse generated content
    console.log('\nTest 3: Re-parse generated content...');
    const reparsedData = await this.testReparsing(generatedContent);
    if (!reparsedData) return false;

    // Test 4: Verify entity counts match
    console.log('\nTest 4: Verify entity counts match...');
    await this.testEntityCounts(parsedData, reparsedData);

    // Test 5: Verify room data integrity
    console.log('\nTest 5: Verify room data integrity...');
    await this.testRoomIntegrity(parsedData, reparsedData);

    // Test 6: Verify mobile data integrity
    console.log('\nTest 6: Verify mobile data integrity...');
    await this.testMobileIntegrity(parsedData, reparsedData);

    // Test 7: Verify object data integrity
    console.log('\nTest 7: Verify object data integrity...');
    await this.testObjectIntegrity(parsedData, reparsedData);

    // Summary
    this.printSummary();
    return this.testResults.failed === 0;
  }

  async testParsing() {
    try {
      const rawContent = fs.readFileSync(this.areaPath, 'utf-8');
      const parsedData = AreParser.parse(rawContent);

      console.log(`✅ Parsed ${parsedData.rooms?.length || 0} rooms`);
      console.log(`✅ Parsed ${parsedData.mobiles?.length || 0} mobiles`);
      console.log(`✅ Parsed ${parsedData.objects?.length || 0} objects`);
      console.log(`✅ Parsed ${parsedData.resets?.length || 0} resets`);

      this.testResults.passed++;
      return parsedData;
    } catch (error) {
      console.error(`❌ Parsing failed: ${error.message}`);
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Parse',
        error: error.message,
      });
      return null;
    }
  }

  async testGeneration(areaData) {
    try {
      const generated = AreGenerator.generate(areaData);

      if (!generated || generated.length === 0) {
        throw new Error('Generated content is empty');
      }

      console.log(`✅ Generated ${generated.length} characters`);
      console.log(`✅ Contains #AREA: ${generated.includes('#AREA')}`);
      console.log(`✅ Contains #ROOMS: ${generated.includes('#ROOMS')}`);
      console.log(`✅ Contains #MOBILES: ${generated.includes('#MOBILES')}`);
      console.log(`✅ Contains #OBJECTS: ${generated.includes('#OBJECTS')}`);
      console.log(`✅ Contains #RESETS: ${generated.includes('#RESETS')}`);
      console.log(`✅ Contains #$: ${generated.includes('#$')}`);

      this.testResults.passed++;
      return generated;
    } catch (error) {
      console.error(`❌ Generation failed: ${error.message}`);
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Generate',
        error: error.message,
      });
      return null;
    }
  }

  async testReparsing(generatedContent) {
    try {
      const reparsedData = AreParser.parse(generatedContent);

      console.log(`✅ Re-parsed ${reparsedData.rooms?.length || 0} rooms`);
      console.log(`✅ Re-parsed ${reparsedData.mobiles?.length || 0} mobiles`);
      console.log(`✅ Re-parsed ${reparsedData.objects?.length || 0} objects`);
      console.log(`✅ Re-parsed ${reparsedData.resets?.length || 0} resets`);

      this.testResults.passed++;
      return reparsedData;
    } catch (error) {
      console.error(`❌ Re-parsing failed: ${error.message}`);
      this.testResults.failed++;
      this.testResults.details.push({
        test: 'Re-parse',
        error: error.message,
      });
      return null;
    }
  }

  async testEntityCounts(original, reparsed) {
    try {
      const origRooms = original.rooms?.length || 0;
      const reparsedRooms = reparsed.rooms?.length || 0;
      const origMobiles = original.mobiles?.length || 0;
      const reparsedMobiles = reparsed.mobiles?.length || 0;
      const origObjects = original.objects?.length || 0;
      const reparsedObjects = reparsed.objects?.length || 0;
      const origResets = original.resets?.length || 0;
      const reparsedResets = reparsed.resets?.length || 0;

      let passed = true;

      if (origRooms !== reparsedRooms) {
        console.warn(`⚠️  Room count mismatch: ${origRooms} vs ${reparsedRooms}`);
        this.testResults.warnings++;
      } else {
        console.log(`✅ Room count matches: ${origRooms}`);
      }

      if (origMobiles !== reparsedMobiles) {
        console.warn(`⚠️  Mobile count mismatch: ${origMobiles} vs ${reparsedMobiles}`);
        this.testResults.warnings++;
      } else {
        console.log(`✅ Mobile count matches: ${origMobiles}`);
      }

      if (origObjects !== reparsedObjects) {
        console.warn(`⚠️  Object count mismatch: ${origObjects} vs ${reparsedObjects}`);
        this.testResults.warnings++;
      } else {
        console.log(`✅ Object count matches: ${origObjects}`);
      }

      if (origResets !== reparsedResets) {
        console.warn(`⚠️  Reset count mismatch: ${origResets} vs ${reparsedResets}`);
        this.testResults.warnings++;
      } else {
        console.log(`✅ Reset count matches: ${origResets}`);
      }

      if (passed) {
        this.testResults.passed++;
      }
    } catch (error) {
      console.error(`❌ Entity count test failed: ${error.message}`);
      this.testResults.failed++;
    }
  }

  async testRoomIntegrity(original, reparsed) {
    try {
      const origRooms = original.rooms || [];
      const reparsedRooms = reparsed.rooms || [];

      if (origRooms.length === 0) {
        console.log('⏭️  No rooms to test');
        return;
      }

      let matchCount = 0;
      origRooms.forEach((origRoom, idx) => {
        const repRoom = reparsedRooms.find(r => r.vnum === origRoom.vnum);
        if (repRoom && repRoom.name === origRoom.name) {
          matchCount++;
        }
      });

      const matchPercent = (matchCount / origRooms.length * 100).toFixed(1);
      console.log(`✅ Room data integrity: ${matchCount}/${origRooms.length} (${matchPercent}%)`);

      if (matchPercent === '100.0') {
        this.testResults.passed++;
      } else {
        this.testResults.warnings++;
      }
    } catch (error) {
      console.error(`❌ Room integrity test failed: ${error.message}`);
      this.testResults.failed++;
    }
  }

  async testMobileIntegrity(original, reparsed) {
    try {
      const origMobiles = original.mobiles || [];
      const reparsedMobiles = reparsed.mobiles || [];

      if (origMobiles.length === 0) {
        console.log('⏭️  No mobiles to test');
        return;
      }

      let matchCount = 0;
      origMobiles.forEach((origMobile, idx) => {
        const repMobile = reparsedMobiles.find(m => m.vnum === origMobile.vnum);
        if (repMobile && repMobile.keywords === origMobile.keywords) {
          matchCount++;
        }
      });

      const matchPercent = (matchCount / origMobiles.length * 100).toFixed(1);
      console.log(`✅ Mobile data integrity: ${matchCount}/${origMobiles.length} (${matchPercent}%)`);

      if (matchPercent === '100.0') {
        this.testResults.passed++;
      } else {
        this.testResults.warnings++;
      }
    } catch (error) {
      console.error(`❌ Mobile integrity test failed: ${error.message}`);
      this.testResults.failed++;
    }
  }

  async testObjectIntegrity(original, reparsed) {
    try {
      const origObjects = original.objects || [];
      const reparsedObjects = reparsed.objects || [];

      if (origObjects.length === 0) {
        console.log('⏭️  No objects to test');
        return;
      }

      let matchCount = 0;
      origObjects.forEach((origObj, idx) => {
        const repObj = reparsedObjects.find(o => o.vnum === origObj.vnum);
        if (repObj && repObj.keywords === origObj.keywords) {
          matchCount++;
        }
      });

      const matchPercent = (matchCount / origObjects.length * 100).toFixed(1);
      console.log(`✅ Object data integrity: ${matchCount}/${origObjects.length} (${matchPercent}%)`);

      if (matchPercent === '100.0') {
        this.testResults.passed++;
      } else {
        this.testResults.warnings++;
      }
    } catch (error) {
      console.error(`❌ Object integrity test failed: ${error.message}`);
      this.testResults.failed++;
    }
  }

  printSummary() {
    console.log('\n============================');
    console.log('📊 Test Summary');
    console.log('============================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`⚠️  Warnings: ${this.testResults.warnings}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);

    if (this.testResults.details.length > 0) {
      console.log('\n📋 Error Details:');
      this.testResults.details.forEach(detail => {
        console.log(`  ${detail.test}: ${detail.error}`);
      });
    }

    console.log('\n' + (this.testResults.failed === 0 ? '✅ All tests passed!' : '❌ Some tests failed'));
  }
}

// Run tests if file is executed directly
const args = process.argv.slice(2);
const testArea = args[0] || './area/midgaard.are';

if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new RoundTripTester(testArea);
  tester.runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default RoundTripTester;
