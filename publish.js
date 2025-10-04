#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = __dirname;
const standalonePkg = path.join(repoRoot, "package.json");
const scopedPkg = path.join(repoRoot, "package.scoped.json");

// --- NEW: branch guard ---
function getCurrentBranch() {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  } catch {
    return null;
  }
}

const branch = getCurrentBranch();
if (branch && branch !== "main") {
  console.log(`⚠️  Skipping publish: current branch is '${branch}', not 'main'.`);
  process.exit(0);
}
// -------------------------

// Parse version into [major, minor, patch, pre, preNum]
function parseVersion(v) {
  const [main, pre] = v.split("-");
  const [major, minor, patch] = main.split(".").map((n) => parseInt(n));
  let preNum = null;
  if (pre) {
    const match = pre.match(/([a-z]+)\.?(\d+)?/i);
    if (match) preNum = parseInt(match[2] || 0);
  }
  return { major, minor, patch, pre, preNum };
}

function bumpBeta(version) {
  const { major, minor, patch, pre, preNum } = parseVersion(version);
  if (pre && pre.startsWith("beta")) {
    return `${major}.${minor}.${patch}-beta.${preNum + 1}`;
  } else {
    return `${major}.${minor}.${patch}-beta.1`;
  }
}

function getPublishedVersion(pkgName) {
  try {
    return execSync(`npm view ${pkgName} version`, { stdio: ["pipe", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

function updateVersion(pkgPath, newVersion) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  console.log(`🔼 Updated ${pkg.name} to version ${newVersion}`);
  return newVersion;
}

function publishPackage(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const publishedVersion = getPublishedVersion(pkg.name);
  let newVersion = pkg.version;

  if (publishedVersion && publishedVersion === pkg.version) {
    newVersion = bumpBeta(publishedVersion);
    updateVersion(pkgPath, newVersion);
  }

  console.log(`📦 Publishing ${pkg.name}@${newVersion}...`);
  execSync("npm publish --access public", { cwd: repoRoot, stdio: "inherit" });

  return newVersion;
}

function publishBoth() {
  publishPackage(standalonePkg);

  if (fs.existsSync(scopedPkg)) {
    const backupPkg = path.join(repoRoot, "package.json.bak");
    fs.renameSync(standalonePkg, backupPkg);
    fs.copyFileSync(scopedPkg, standalonePkg);
    publishPackage(standalonePkg);
    fs.renameSync(backupPkg, standalonePkg);
  }

  console.log("✅ All packages published successfully!");
}

publishBoth();
