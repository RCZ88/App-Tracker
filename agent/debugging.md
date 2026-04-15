# 🐛 Debugging Guide

**Purpose:** Common issues, debugging strategies, and known fixes.

---

## 🔍 Debugging Workflow

### Step 1: Identify the Issue
1. Check console errors
2. Reproduce consistently
3. Note the exact error message
4. Check when it started happening

### Step 2: Isolate the Problem
1. Check agent/state.md for known issues
2. Review recent changes
3. Test with minimal repro
4. Check file existence and paths

### Step 3: Fix and Verify
1. Make minimal fix
2. Rebuild
3. Test the fix
4. Check for regressions

---

## 🚨 Common Errors & Fixes

### ERR_FILE_NOT_FOUND
**Error:** `Failed to load URL: file:///.../dist/index.html`

**Cause:** dist/ folder doesn't exist

**Fix:**
```bash
npm run build:renderer
```

### Cannot find module 'dist-electron/main.cjs'
**Error:** `Unable to find Electron app at ...`

**Cause:** dist-electron/ doesn't have main.cjs

**Fix:**
```bash
npm run build:electron
```

### setHeatmap is not defined
**Error:** `Uncaught ReferenceError: setHeatmap is not defined`

**Cause:** Removed useState but references remain

**Fix:**
1. Search for `setHeatmap` in App.tsx
2. Remove all references
3. Use heatmap useMemo instead

### Texture Not Showing
**Symptoms:** Planets are solid colors, no patterns visible

**Checklist:**
1. `texture.colorSpace = THREE.SRGBColorSpace` ✓
2. `texture.needsUpdate = true` ✓
3. `texture.wrapS = THREE.RepeatWrapping` ✓
4. `texture.wrapT = THREE.RepeatWrapping` ✓
5. Material uses `map={texture}` ✓
6. Canvas drawing actually executes ✓
7. Category matches pattern conditions ✓

**Common Issues:**
- Emissive color overriding texture
- `color` property darkening texture
- Wrong material type (use meshStandardMaterial)
- Canvas context is null

### Orbit Path Mismatch
**Symptoms:** Planet doesn't follow the orbit line

**Fix:** Ensure same formula in both:
```typescript
// OrbitPath and useFrame must use:
const semiLatusRectum = semiMajorAxis * (1 - eccentricity * eccentricity);
const distance = semiLatusRectum / (1 + eccentricity * Math.cos(angle + longitudeOfPerihelion));
```

### Better-SQLite3 NODE_MODULE_VERSION Mismatch
**Error:** `The module 'better_sqlite3.node' was compiled against a different Node.js version`

**Cause:** Native module compiled for Node.js, not Electron

**Fix:**
1. Ensure Visual Studio Build Tools installed
2. Path must not have spaces
3. Run: `npm rebuild better-sqlite3 --runtime=electron --target=41.1.1`
4. JSON fallback will work if rebuild fails

---

## 🛠️ Debugging Tools

### Console Logging
```typescript
// Main process
console.log('[DeskFlow] ✅ SQLite initialized');
console.error('[DeskFlow] Error:', err.message);

// Renderer
console.log('[DeskFlow] Loaded', logs.length, 'logs');
console.warn('[DeskFlow] Texture fallback used');
```

### DevTools
- **Electron:** Open with Ctrl+Shift+I
- **Console:** Check for errors
- **Network:** Verify asset loading
- **Elements:** Inspect DOM

### State Inspection
```typescript
// Check current state
console.log('Planets:', planets);
console.log('Texture:', texture);
console.log('Logs:', logs.length);
```

---

## 📊 Performance Debugging

### FPS Drops
**Causes:**
- Too many planets (>12)
- High geometry segments
- Unnecessary re-renders
- Memory leaks

**Fixes:**
- Limit to 12 planets
- Use 64x64 segments max
- Memoize expensive computations
- Clean up event listeners

### Memory Leaks
**Check for:**
- Event listeners not removed
- Textures not disposed
- State growing unbounded

**Fixes:**
```typescript
useEffect(() => {
  const interval = setInterval(...);
  return () => clearInterval(interval); // Cleanup
}, []);
```

---

## 🔧 Build Issues

### Vite Build Fails
**Check:**
1. TypeScript errors
2. Missing imports
3. Circular dependencies
4. File paths correct

**Fix:**
```bash
npx tsc --noEmit  # Check types
npm run build:renderer  # Rebuild
```

### Electron Build Fails
**Check:**
1. TypeScript config correct
2. Output directory exists
3. File renamed to .cjs

**Fix:**
```bash
npx tsc src/main.ts src/preload.ts \
  --module commonjs \
  --target ES2020 \
  --esModuleInterop \
  --outDir dist-electron \
  --skipLibCheck
```

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-04 | Initial creation |

---

**Last Updated:** 2026-04-04
**Maintained By:** AI Development Team
