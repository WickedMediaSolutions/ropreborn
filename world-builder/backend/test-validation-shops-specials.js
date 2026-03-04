/**
 * Test validation of SHOPS and SPECIALS sections
 * Verifies that ValidationService correctly validates shops and specials
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AreParser from './src/services/AreParser.js';
import ValidationService from './src/services/ValidationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runValidationTest() {
  try {
    console.log('Starting SHOPS/SPECIALS Validation Test...\n');

    // Load midgaard test area
    const testAreaPath = path.join(__dirname, '../../', 'area', 'midgaard.are');
    
    if (!fs.existsSync(testAreaPath)) {
      console.error(`Error: Test area file not found: ${testAreaPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(testAreaPath, 'utf8');
    console.log(`✓ Loaded test area: midgaard.are (${content.length} bytes)`);

    // Parse the area
    console.log('\nParsing area data...');
    const areaData = AreParser.parse(content);
    console.log(`✓ Parsed area data`);
    console.log(`  - Rooms: ${(areaData.rooms || []).length}`);
    console.log(`  - Mobiles: ${(areaData.mobiles || []).length}`);
    console.log(`  - Objects: ${(areaData.objects || []).length}`);
    console.log(`  - Resets: ${(areaData.resets || []).length}`);
    console.log(`  - Shops: ${(areaData.shops || []).length}`);
    console.log(`  - Specials: ${(areaData.specials || []).length}`);

    // Run validation
    console.log('\nRunning validation...');
    const validation = ValidationService.validate(areaData);
    
    console.log(`\n${validation.valid ? '✓' : '✗'} Validation ${validation.valid ? 'PASSED' : 'FAILED'}`);
    console.log(`  - Errors: ${validation.errorCount}`);
    console.log(`  - Warnings: ${validation.warningCount}`);

    // Display errors
    if (validation.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      validation.errors.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
    }

    // Display warnings (limited to first 20)
    if (validation.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      const warningsToShow = Math.min(20, validation.warnings.length);
      validation.warnings.slice(0, warningsToShow).forEach((warn, idx) => {
        console.log(`  ${idx + 1}. ${warn}`);
      });
      if (validation.warnings.length > 20) {
        console.log(`  ... and ${validation.warnings.length - 20} more warnings`);
      }
    }

    // Test shop validation specifically
    console.log('\n--- Shop Validation Details ---');
    if (areaData.shops && areaData.shops.length > 0) {
      const shopErrors = validation.errors.filter(e => e.includes('Shop'));
      const shopWarnings = validation.warnings.filter(w => w.includes('Shop'));
      
      console.log(`Total shops: ${areaData.shops.length}`);
      console.log(`Shop errors: ${shopErrors.length}`);
      console.log(`Shop warnings: ${shopWarnings.length}`);
      
      if (shopErrors.length > 0) {
        console.log('\nShop errors:');
        shopErrors.forEach(err => console.log(`  - ${err}`));
      }
      
      if (shopWarnings.length > 0 && shopWarnings.length <= 10) {
        console.log('\nShop warnings:');
        shopWarnings.forEach(warn => console.log(`  - ${warn}`));
      }
    }

    // Test special validation specifically
    console.log('\n--- Special Validation Details ---');
    if (areaData.specials && areaData.specials.length > 0) {
      const specialErrors = validation.errors.filter(e => e.includes('Special'));
      const specialWarnings = validation.warnings.filter(w => w.includes('Special'));
      
      console.log(`Total specials: ${areaData.specials.length}`);
      console.log(`Special errors: ${specialErrors.length}`);
      console.log(`Special warnings: ${specialWarnings.length}`);
      
      if (specialErrors.length > 0) {
        console.log('\nSpecial errors:');
        specialErrors.forEach(err => console.log(`  - ${err}`));
      }
      
      if (specialWarnings.length > 0 && specialWarnings.length <= 10) {
        console.log('\nSpecial warnings:');
        specialWarnings.forEach(warn => console.log(`  - ${warn}`));
      }
    }

    // Test reference tracking for a shop keeper
    if (areaData.shops && areaData.shops.length > 0) {
      const firstShop = areaData.shops[0];
      console.log(`\n--- Reference Tracking for Shop Keeper ${firstShop.keeperVnum} ---`);
      const refs = ValidationService.getReferences(areaData, firstShop.keeperVnum);
      
      console.log(`References found:`);
      console.log(`  - Rooms: ${refs.rooms.length}`);
      console.log(`  - Mobiles: ${refs.mobiles.length}`);
      console.log(`  - Objects: ${refs.objects.length}`);
      console.log(`  - Resets: ${refs.resets.length}`);
      console.log(`  - Shops: ${refs.shops.length}`);
      console.log(`  - Specials: ${refs.specials.length}`);
      
      if (refs.shops.length > 0) {
        console.log(`\nShop references:`);
        refs.shops.forEach(ref => console.log(`    ${ref}`));
      }
      
      if (refs.specials.length > 0) {
        console.log(`\nSpecial references:`);
        refs.specials.forEach(ref => console.log(`    ${ref}`));
      }
    }

    console.log('\n✓ Validation test completed successfully!');

  } catch (error) {
    console.error('✗ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runValidationTest();
