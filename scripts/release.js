#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`🚀 Preparing release for MockAuth v${currentVersion}`);

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

// Run tests
console.log('🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

// Run build
console.log('🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// Run linter
console.log('🔍 Running linter...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Linting failed');
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
console.log('Next steps:');
console.log('1. Push the tag: git push origin main --tags');
console.log('2. Create GitHub release from the tag');
console.log('3. Publish to NPM: npm publish');
