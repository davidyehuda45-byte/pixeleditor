/**
 * Zero-dependency test runner: `node tests/run.js`
 * Every test file exports an array of {name, fn}.
 */
import { rasterTests } from './raster.test.js';
import { colorTests } from './color.test.js';
import { compositorTests } from './compositor.test.js';
import { historyTests } from './history.test.js';
import { projectTests } from './project.test.js';
import { encoderTests } from './encoders.test.js';
import { sheetTests } from './spritesheet.test.js';
import { exporterTests } from './exporters.test.js';
import { toolTests } from './tools.test.js';
import { cliTests } from './cli.test.js';

const suites = [
  ['raster', rasterTests],
  ['color', colorTests],
  ['compositor', compositorTests],
  ['history', historyTests],
  ['project', projectTests],
  ['encoders', encoderTests],
  ['spritesheet', sheetTests],
  ['exporters', exporterTests],
  ['tools', toolTests],
  ['cli', cliTests],
];

let passed = 0, failed = 0;
const failures = [];

for (const [suiteName, tests] of suites) {
  for (const test of tests) {
    try {
      await test.fn();
      passed++;
      process.stdout.write(`\x1b[32m✓\x1b[0m ${suiteName} › ${test.name}\n`);
    } catch (error) {
      failed++;
      failures.push({ suiteName, test, error });
      process.stdout.write(`\x1b[31m✗\x1b[0m ${suiteName} › ${test.name}\n    ${error.message}\n`);
    }
  }
}

if (failures.length) {
  process.stdout.write('\n--- Failure details ---\n');
  for (const f of failures) {
    process.stdout.write(`\n${f.suiteName} › ${f.test.name}\n${f.error.stack}\n`);
  }
}
process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
process.exitCode = failed ? 1 : 0;
