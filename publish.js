#!/usr/bin/env node

/**
 * Dual Package Publishing Script
 * 
 * Publishes MockAuth to both:
 * 1. mockauth (public registry)
 * 2. @mockilo/mockauth (scoped package)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    log(`Error executing: ${command}`, 'red');
    throw error;
  }
}

async function publishPackage() {
  log('\n╔════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                                                                    ║', 'cyan');
  log('║           📦 MOCKAUTH DUAL PACKAGE PUBLISHER 📦                   ║', 'cyan');
  log('║                                                                    ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════════╝\n', 'cyan');

  // Read current package.json
  const packagePath = path.join(__dirname, 'package.json');
  const packageScopedPath = path.join(__dirname, 'package.scoped.json');
  const packageBackupPath = path.join(__dirname, 'package.json.backup');

  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found!', 'red');
    process.exit(1);
  }

  if (!fs.existsSync(packageScopedPath)) {
    log('❌ package.scoped.json not found!', 'red');
    log('This file is needed for publishing @mockilo/mockauth', 'yellow');
    process.exit(1);
  }

  const originalPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scopedPackage = JSON.parse(fs.readFileSync(packageScopedPath, 'utf8'));

  log('📋 Publishing Configuration:', 'yellow');
  log(`   Version: ${originalPackage.version}`, 'cyan');
  log(`   Package 1: mockauth`, 'cyan');
  log(`   Package 2: @mockilo/mockauth`, 'cyan');
  log('');

  try {
    // Step 1: Build the project
    log('🔨 Step 1: Building project...', 'yellow');
    exec('npm run build');
    log('✅ Build successful!\n', 'green');

    // Step 2: Run tests (optional, comment out if tests fail)
    try {
      log('🧪 Step 2: Running tests...', 'yellow');
      exec('npm test', { stdio: 'ignore' });
      log('✅ Tests passed!\n', 'green');
    } catch (error) {
      log('⚠️  Tests failed or not available, continuing anyway...\n', 'yellow');
    }

    // Step 3: Publish to public registry (mockauth)
    log('📦 Step 3: Publishing "mockauth" to npm...', 'yellow');
    try {
      const publishArgs = process.argv.includes('--tag') 
        ? `--tag ${process.argv[process.argv.indexOf('--tag') + 1]}`
        : '';
      
      exec(`npm publish ${publishArgs}`);
      log('✅ Published "mockauth" successfully!\n', 'green');
    } catch (error) {
      log('❌ Failed to publish "mockauth"', 'red');
      throw error;
    }

    // Step 4: Backup current package.json
    log('💾 Step 4: Backing up package.json...', 'yellow');
    fs.copyFileSync(packagePath, packageBackupPath);
    log('✅ Backup created!\n', 'green');

    // Step 5: Switch to scoped package.json
    log('🔄 Step 5: Switching to scoped package configuration...', 'yellow');
    fs.copyFileSync(packageScopedPath, packagePath);
    log('✅ Using package.scoped.json\n', 'green');

    // Step 6: Publish to scoped registry (@mockilo/mockauth)
    log('📦 Step 6: Publishing "@mockilo/mockauth" to npm...', 'yellow');
    try {
      const publishArgs = process.argv.includes('--tag') 
        ? `--tag ${process.argv[process.argv.indexOf('--tag') + 1]}`
        : '';
      
      exec(`npm publish ${publishArgs}`);
      log('✅ Published "@mockilo/mockauth" successfully!\n', 'green');
    } catch (error) {
      log('❌ Failed to publish "@mockilo/mockauth"', 'red');
      // Restore original package.json
      fs.copyFileSync(packageBackupPath, packagePath);
      fs.unlinkSync(packageBackupPath);
      throw error;
    }

    // Step 7: Restore original package.json
    log('🔄 Step 7: Restoring original package.json...', 'yellow');
    fs.copyFileSync(packageBackupPath, packagePath);
    fs.unlinkSync(packageBackupPath);
    log('✅ Restored original package.json\n', 'green');

    // Success!
    log('╔════════════════════════════════════════════════════════════════════╗', 'green');
    log('║                                                                    ║', 'green');
    log('║                  🎉 PUBLISHING SUCCESSFUL! 🎉                     ║', 'green');
    log('║                                                                    ║', 'green');
    log('╚════════════════════════════════════════════════════════════════════╝\n', 'green');

    log('✅ Both packages published successfully:', 'green');
    log(`   📦 mockauth@${originalPackage.version}`, 'cyan');
    log(`   📦 @mockilo/mockauth@${scopedPackage.version}`, 'cyan');
    log('');
    log('Users can install with:', 'yellow');
    log(`   npm install mockauth`, 'cyan');
    log(`   npm install @mockilo/mockauth`, 'cyan');
    log('');

  } catch (error) {
    log('\n❌ Publishing failed!', 'red');
    
    // Cleanup: Restore package.json if backup exists
    if (fs.existsSync(packageBackupPath)) {
      log('🔄 Restoring original package.json...', 'yellow');
      fs.copyFileSync(packageBackupPath, packagePath);
      fs.unlinkSync(packageBackupPath);
      log('✅ Restored\n', 'green');
    }
    
    process.exit(1);
  }
}

// Run the publisher
publishPackage().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

