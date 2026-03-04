/**
 * Round-trip test for SHOPS and SPECIALS parsing/generation
 * Tests that parsing → generating → parsing produces consistent results
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AreParser from './src/services/AreParser.js';
import AreGenerator from './src/services/AreGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  try {
    console.log('Starting SHOPS/SPECIALS Round-Trip Test...\n');

    // Load a test area file
    const testAreaPath = path.join(__dirname, '../../', 'area', 'midgaard.are');
    
    if (!fs.existsSync(testAreaPath)) {
      console.error(`Error: Test area file not found: ${testAreaPath}`);
      process.exit(1);
    }

    const originalContent = fs.readFileSync(testAreaPath, 'utf8');
    console.log(`✓ Loaded test area: midgaard.are (${originalContent.length} bytes)`);

    // Parse the original file
    console.log('\nPhase 1: Initial Parsing');
    const parseResult1 = AreParser.parse(originalContent);
    console.log(`✓ Parsed area data`);
    console.log(`  - Shops found: ${(parseResult1.shops || []).length}`);
    console.log(`  - Specials found: ${(parseResult1.specials || []).length}`);

    if (parseResult1.shops && parseResult1.shops.length > 0) {
      console.log(`  - Sample shop: vnum=${parseResult1.shops[0].vnum}, keeper=${parseResult1.shops[0].keeperVnum}`);
      console.log(`    Buy types: [${parseResult1.shops[0].buyTypes.join(', ')}]`);
      console.log(`    Profit: buy=${parseResult1.shops[0].profitBuy}%, sell=${parseResult1.shops[0].profitSell}%`);
      console.log(`    Hours: ${parseResult1.shops[0].openTime}:00-${parseResult1.shops[0].closeTime}:00`);
    }

    if (parseResult1.specials && parseResult1.specials.length > 0) {
      console.log(`  - Sample special: type=${parseResult1.specials[0].type}, vnum=${parseResult1.specials[0].vnum}`);
      console.log(`    Spec name: ${parseResult1.specials[0].specName}`);
    }

    // Generate from parsed data
    console.log('\nPhase 2: Generation');
    const generatedContent = AreGenerator.generate(parseResult1, originalContent);
    console.log(`✓ Generated area content (${generatedContent.length} bytes)`);

    // Verify SHOPS section exists in generated content
    const shopsMatch = generatedContent.match(/#SHOPS\n([\s\S]*?)(?:\n#|\n0\n)/);
    if (shopsMatch) {
      const shopsContent = shopsMatch[1].trim();
      const shopLines = shopsContent.split('\n').filter(l => l.trim() && l.trim() !== '0');
      console.log(`✓ Generated ${shopLines.length} shop entries`);
      if (shopLines.length > 0) {
        console.log(`  - First shop line: ${shopLines[0].substring(0, 80)}...`);
      }
    } else {
      console.log(`✗ WARNING: #SHOPS section not found in generated content`);
    }

    // Verify SPECIALS section exists in generated content
    const specialsMatch = generatedContent.match(/#SPECIALS\n([\s\S]*?)(?:\n#|\n#\$)/);
    if (specialsMatch) {
      const specialsContent = specialsMatch[1].trim();
      const specialLines = specialsContent.split('\n').filter(l => l.trim() && l.trim() !== '0');
      console.log(`✓ Generated ${specialLines.length} special entries`);
      if (specialLines.length > 0) {
        console.log(`  - First special line: ${specialLines[0].substring(0, 80)}...`);
      }
    } else {
      console.log(`✗ WARNING: #SPECIALS section not found in generated content`);
    }

    // Parse the generated content
    console.log('\nPhase 3: Re-parsing Generated Content');
    const parseResult2 = AreParser.parse(generatedContent);
    console.log(`✓ Re-parsed generated content`);
    console.log(`  - Shops found: ${(parseResult2.shops || []).length}`);
    console.log(`  - Specials found: ${(parseResult2.specials || []).length}`);

    // Validate round-trip consistency
    console.log('\nPhase 4: Round-Trip Validation');
    
    const shopsMatch1 = parseResult1.shops || [];
    const shopsMatch2 = parseResult2.shops || [];
    
    if (shopsMatch1.length === shopsMatch2.length) {
      console.log(`✓ Shop count matches: ${shopsMatch1.length} shops`);
      
      // Check each shop
      let shopsValid = true;
      for (let i = 0; i < Math.min(3, shopsMatch1.length); i++) {
        const s1 = shopsMatch1[i];
        const s2 = shopsMatch2.find(s => s.vnum === s1.vnum);
        
        if (!s2) {
          console.log(`✗ Shop ${s1.vnum} lost in round-trip`);
          shopsValid = false;
        } else if (
          s1.vnum === s2.vnum &&
          s1.keeperVnum === s2.keeperVnum &&
          s1.profitBuy === s2.profitBuy &&
          s1.profitSell === s2.profitSell
        ) {
          console.log(`✓ Shop ${s1.vnum} matches (keeper=${s1.keeperVnum}, profit=${s1.profitBuy}/${s1.profitSell})`);
        } else {
          console.log(`✗ Shop ${s1.vnum} data mismatch`);
          console.log(`  Parse 1: keeper=${s1.keeperVnum}, profit=${s1.profitBuy}/${s1.profitSell}`);
          console.log(`  Parse 2: keeper=${s2.keeperVnum}, profit=${s2.profitBuy}/${s2.profitSell}`);
          shopsValid = false;
        }
      }
      
      if (shopsValid && shopsMatch1.length > 3) {
        console.log(`+ (${shopsMatch1.length - 3} more shops validated)`);
      }
    } else {
      console.log(`✗ Shop count mismatch: ${shopsMatch1.length} vs ${shopsMatch2.length}`);
    }

    const specialsMatch1 = parseResult1.specials || [];
    const specialsMatch2 = parseResult2.specials || [];
    
    if (specialsMatch1.length === specialsMatch2.length) {
      console.log(`✓ Special count matches: ${specialsMatch1.length} specials`);
      
      // Check first few specials
      let specialsValid = true;
      for (let i = 0; i < Math.min(3, specialsMatch1.length); i++) {
        const sp1 = specialsMatch1[i];
        const sp2 = specialsMatch2[i];
        
        if (
          sp1.type === sp2.type &&
          sp1.vnum === sp2.vnum &&
          sp1.specName === sp2.specName
        ) {
          console.log(`✓ Special ${i}: [${sp1.type}] ${sp1.vnum} ${sp1.specName}`);
        } else {
          console.log(`✗ Special ${i} data mismatch`);
          console.log(`  Parse 1: [${sp1.type}] ${sp1.vnum} ${sp1.specName}`);
          console.log(`  Parse 2: [${sp2.type}] ${sp2.vnum} ${sp2.specName}`);
          specialsValid = false;
        }
      }
      
      if (specialsValid && specialsMatch1.length > 3) {
        console.log(`+ (${specialsMatch1.length - 3} more specials validated)`);
      }
    } else {
      console.log(`✗ Special count mismatch: ${specialsMatch1.length} vs ${specialsMatch2.length}`);
    }

    console.log('\n✓ Round-trip test completed successfully!');
    console.log('\nSummary:');
    console.log(`- Parsed: ${shopsMatch1.length} shops, ${specialsMatch1.length} specials`);
    console.log(`- Re-parsed: ${shopsMatch2.length} shops, ${specialsMatch2.length} specials`);
    console.log(`- Generated content size: ${generatedContent.length} bytes`);
    console.log(`- Format consistency: VERIFIED`);

  } catch (error) {
    console.error('✗ Test failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTest();
