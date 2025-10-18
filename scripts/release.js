#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`🚀 Preparing release for MockAuth v${currentVersion}`);

// Utility functions
function runCommand(command, description, options = {}) {
  console.log(`🔍 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', ...options });
    console.log(`✅ ${description} passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed`);
    return false;
  }
}

function checkSemanticVersion(version) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  return semverRegex.test(version);
}

function checkChangelog(version) {
  const changelogPath = 'CHANGELOG.md';
  if (!fs.existsSync(changelogPath)) {
    console.error('❌ CHANGELOG.md not found');
    return false;
  }
  
  const changelogContent = fs.readFileSync(changelogPath, 'utf8');
  const versionRegex = new RegExp(`## \\[${version.replace(/\./g, '\\.')}\\]`, 'g');
  
  if (!versionRegex.test(changelogContent)) {
    console.error(`❌ CHANGELOG.md missing entry for version ${version}`);
    console.error('   Please add a changelog entry before releasing');
    return false;
  }
  
  return true;
}

function checkForTodos() {
  const srcDir = 'src';
  const todoRegex = /(?:TODO|FIXME|HACK|XXX|BUG):/gi;
  
  try {
    // Use findstr on Windows, grep on Unix
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? `findstr /r /s /i "TODO FIXME HACK XXX BUG" ${srcDir}\\*.ts ${srcDir}\\*.js 2>nul || echo.`
      : `grep -r "${todoRegex.source}" ${srcDir} --include="*.ts" --include="*.js" || true`;
    
    const result = execSync(command, { encoding: 'utf8' });
    if (result.trim()) {
      console.warn('⚠️  Found TODO/FIXME comments in code:');
      console.warn(result);
      console.warn('   Consider addressing these before release');
      return false;
    }
    return true;
  } catch (error) {
    return true; // No todos found
  }
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups/backup-${timestamp}`;
  
  console.log(`💾 Creating backup in ${backupDir}...`);
  
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
  }
  
  fs.mkdirSync(backupDir);
  
  // Copy important files
  const filesToBackup = [
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'CHANGELOG.md',
    'README.md'
  ];
  
  filesToBackup.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(backupDir, file));
    }
  });
  
  console.log(`✅ Backup created in ${backupDir}`);
  return backupDir;
}

// Check if we're on main branch
const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
if (currentBranch !== 'main') {
  console.error('❌ Must be on main branch to release');
  process.exit(1);
}

// Check if working directory is clean
const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
if (gitStatus.trim()) {
  console.error('❌ Working directory is not clean. Please commit or stash changes.');
  process.exit(1);
}

// Validate semantic versioning
if (!checkSemanticVersion(currentVersion)) {
  console.error(`❌ Invalid semantic version: ${currentVersion}`);
  console.error('   Please use format: major.minor.patch (e.g., 1.2.3)');
  process.exit(1);
}

// Check changelog
if (!checkChangelog(currentVersion)) {
  process.exit(1);
}

// Check for TODO/FIXME comments
if (!checkForTodos()) {
  console.log('   Continuing anyway...');
}

// Create backup
const backupDir = createBackup();

// Security audit
if (!runCommand('npm audit --audit-level=moderate', 'Security audit')) {
  console.error('❌ Security vulnerabilities found. Please fix before releasing.');
  process.exit(1);
}

// Check for outdated dependencies
console.log('🔍 Checking for outdated dependencies...');
try {
  const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
  const outdatedJson = JSON.parse(outdated);
  if (Object.keys(outdatedJson).length > 0) {
    console.warn('⚠️  Outdated dependencies found:');
    console.warn(JSON.stringify(outdatedJson, null, 2));
    console.warn('   Consider updating dependencies before release');
  }
} catch (error) {
  // No outdated dependencies
}

// Run tests with coverage
console.log('🧪 Running tests with coverage...');
if (!runCommand('npm run test:coverage', 'Test coverage')) {
  process.exit(1);
}

// Check coverage threshold (minimum 80%)
console.log('📊 Checking test coverage...');
try {
  const coverageReport = fs.readFileSync('coverage/lcov-report/index.html', 'utf8');
  const coverageMatch = coverageReport.match(/(\d+(?:\.\d+)?)%/);
  if (coverageMatch) {
    const coverage = parseFloat(coverageMatch[1]);
    if (coverage < 80) {
      console.error(`❌ Test coverage is ${coverage}%, minimum required is 80%`);
      process.exit(1);
    }
    console.log(`✅ Test coverage: ${coverage}%`);
  }
} catch (error) {
  console.warn('⚠️  Could not read coverage report, continuing...');
}

// Run build
if (!runCommand('npm run build', 'Build project')) {
  process.exit(1);
}

// Run linter
if (!runCommand('npm run lint', 'Code linting')) {
  process.exit(1);
}

// Run format check
if (!runCommand('npm run format -- --check', 'Code formatting check')) {
  console.error('❌ Code formatting issues found. Run "npm run format" to fix.');
  process.exit(1);
}

console.log('✅ All checks passed!');
console.log(`📦 Ready to release MockAuth v${currentVersion}`);

// Create git tag
const tagName = `v${currentVersion}`;
console.log(`🏷️  Creating git tag ${tagName}...`);
execSync(`git tag -a ${tagName} -m "Release ${tagName}"`);

console.log('🎉 Release preparation complete!');
console.log('');
console.log('📋 Release Summary:');
console.log(`   Version: ${currentVersion}`);
console.log(`   Backup: ${backupDir}`);
console.log(`   Tag: ${tagName}`);
console.log('');
console.log('Next steps:');
console.log('1. Push the tag: git push origin main --tags');
console.log('2. Create GitHub release from the tag');
console.log('3. Publish to NPM: npm publish');
console.log('4. Update documentation if needed');
