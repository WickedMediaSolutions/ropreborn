#!/usr/bin/env node

/**
 * Test Runner - Execute round-trip tests
 * Usage: npm test [area-file]
 */

import RoundTripTester from './RoundTripTester.js';
import path from 'path';

const areaFile = process.argv[2] || '../area/midgaard.are';
const resolvedPath = path.resolve(areaFile);

console.log(`Testing area file: ${resolvedPath}\n`);

const tester = new RoundTripTester(resolvedPath);
tester.runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
