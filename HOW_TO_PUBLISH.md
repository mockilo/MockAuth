# 📦 How to Publish MockAuth

## Dual Package Publishing

MockAuth publishes to **TWO** npm packages:

1. **`mockauth`** - Main public package
2. **`@mockilo/mockauth`** - Scoped package under the Mockilo ecosystem

---

## 🚀 Quick Publish

### **Simple Command:**

```bash
node publish.js
```

**Or with tag:**

```bash
# Publish as beta
node publish.js --tag beta

# Publish as latest
node publish.js --tag latest
```

---

## 📋 What Happens

The `publish.js` script automatically:

1. ✅ Builds the project (`npm run build`)
2. ✅ Runs tests (if available)
3. ✅ Publishes **`mockauth`** to npm
4. ✅ Switches to scoped configuration
5. ✅ Publishes **`@mockilo/mockauth`** to npm
6. ✅ Restores original package.json

---

## 📦 Two Package Configs

### **`package.json`** (Main)
```json
{
  "name": "mockauth",
  "version": "1.0.0-beta.2"
}
```

### **`package.scoped.json`** (Scoped)
```json
{
  "name": "@mockilo/mockauth",
  "version": "1.0.0-beta.2",
  "publishConfig": {
    "access": "public"
  }
}
```

---

## 🎯 Manual Publishing (If Needed)

### **Publish Main Package:**
```bash
npm run build
npm publish --tag beta
```

### **Publish Scoped Package:**
```bash
# Backup package.json
cp package.json package.json.backup

# Use scoped config
cp package.scoped.json package.json

# Publish
npm publish --tag beta

# Restore
cp package.json.backup package.json
rm package.json.backup
```

---

## ✅ Before Publishing

1. **Update version** in BOTH files:
   - `package.json`
   - `package.scoped.json`

2. **Update CHANGELOG.md**

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Release v1.0.0-beta.2"
   git tag v1.0.0-beta.2
   ```

4. **Run publish script:**
   ```bash
   node publish.js --tag beta
   ```

---

## 🎓 Version Management

### **Beta Release:**
```bash
# Update version to x.x.x-beta.x
npm version 1.0.0-beta.2
# Update package.scoped.json manually
node publish.js --tag beta
```

### **Production Release:**
```bash
# Update version to x.x.x
npm version 1.0.0
# Update package.scoped.json manually
node publish.js
```

---

## 📊 After Publishing

Users can install either way:

```bash
# Main package
npm install mockauth

# Scoped package
npm install @mockilo/mockauth
```

Both are **identical** - just different package names!

---

## ⚠️ Important Notes

1. **Keep versions in sync** between:
   - `package.json`
   - `package.scoped.json`

2. **Both files must exist** for publish.js to work

3. **Don't delete these files:**
   - `publish.js`
   - `package.scoped.json`

4. **Always use publish.js** for consistency

---

## 🛠️ Troubleshooting

### **Error: package.scoped.json not found**
```bash
# File was deleted, recreate it
# Copy from package.json and change name to @mockilo/mockauth
```

### **Error: You must be logged in**
```bash
npm login
```

### **Error: Package already published**
```bash
# Update version first
npm version patch  # or minor, or major
# Update package.scoped.json version too!
```

---

## ✨ That's It!

Your dual publishing setup is ready to go! 🚀

**Just run:** `node publish.js --tag beta`

---

**Last Updated:** 2024-10-14  
**Script:** publish.js  
**Packages:** mockauth + @mockilo/mockauth

