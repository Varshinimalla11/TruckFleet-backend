#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Truck Fleet Management Backend Tests...\n');

try {
  // Run Jest with coverage
  const command = 'npm test -- --coverage --verbose';
  console.log(`Executing: ${command}\n`);
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: join(__dirname, '..')
  });
  
  console.log('\n✅ All tests completed successfully!');
  
} catch (error) {
  console.error('\n❌ Tests failed with errors:');
  console.error(error.message);
  process.exit(1);
}

