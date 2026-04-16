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

## 🎯 Data Mismatch Debugging Pattern (CRITICAL)

**When data doesn't match between components, use this workflow:**

### Step 1: Find the Source of Truth
- Identify a component that shows CORRECT data
- That component is your reference

### Step 2: Trace Data Flow FROM Source
```
StatsPage (correct) → computedAppStats → worked correctly
OrbitSystem (wrong) → filteredLogs → was wrong
```

### Step 3: Compare the Two Paths
Look for WHERE the data diverges:
```javascript
// Source of truth (StatsPage)
const appLogs = filtered.filter(log => {
  if (log.is_browser_tracking) return false;  // ← Filter exists
  return true;
});

// Broken component (OrbitSystem received)
<OrbitSystem logs={filteredLogs} />  // ← No filter at source
```

### Step 4: Fix at the Divergence Point
```javascript
// Wrong: Trying to fix downstream
<OrbitSystem logs={filteredLogs} />

// Right: Fix at the source
<OrbitSystem logs={filteredLogs.filter(l => !l.is_browser_tracking)} />
```

### Key Lessons
1. **Don't fix downstream** - Fix at where data diverges
2. **Compare with working implementation** - Find what worked, trace it
3. **Trust data flow, not assumptions** - Verify what data actually contains
4. **Minimal fixes** - One line at the right place vs complex downstream fixes

### When to Apply
- Data totals don't match
- Different number of items
- Missing or extra entries
- Different values for same item

---

## 🧮 Data Computation Pattern (CRITICAL)

**When data computation is wrong or inconsistent between components:**

### The Problem
Data gets computed in MULTIPLE places with DIFFERENT logic, leading to inconsistencies.

### Step 1: Find Where Data is Computed
```typescript
// Component A - StatsPage.tsx (computing locally)
const stats = useMemo(() => { ... }, [logs]);

// Component B - App.tsx (computing globally)
const computedAppStats = useMemo(() => { ... }, [allLogs]);
```

### Step 2: Compare Computations
| Location | Logic | Result |
|----------|-------|--------|
| StatsPage | Complex, local | Wrong |
| App.tsx | Clean, centralized | Correct |

### Step 3: Apply Single Source of Truth
```typescript
// WRONG: Computing in child component
function StatsPage({ logs }) {
  const stats = useMemo(() => computeStats(logs), [logs]);
  // ...
}

// RIGHT: Pass computed data as props
function App() {
  const computedAppStats = useMemo(() => computeStats(allLogs), [allLogs]);
  return <StatsPage appStats={computedAppStats} />;
}

function StatsPage({ appStats }) {
  // Just display, don't compute
  return <div>{appStats.map(...)}</div>;
}
```

### Key Lessons
1. **Compute ONCE at highest level** - Usually App.tsx for global data
2. **Pass down as props** - Child components display, don't compute
3. **Remove redundant computations** - Delete local useMemo hooks
4. **Share computed data** - If two components need same data, compute once

### When to Apply
- Child component computing what parent already computed
- Same computation logic duplicated
- Data inconsistent between similar views
- Performance issues from duplicate computations

### Signs You're Computing Twice
```typescript
// Red flag 1: Component receives logs AND computes stats
function Component({ logs }) {
  const stats = useMemo(() => computeFromLogs(logs), [logs]);
  // ...
}

// Red flag 2: Multiple components computing same thing
// StatsPage.tsx computes stats
// ProductivityPage.tsx computes similar stats
// Dashboard.tsx computes yet another version

// Solution: Centralize in App.tsx, pass as props
```

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

## 🤖 AI-Specific Issues & Fixes

### "x is not a function" / "Callback is not defined"
**Problem:** When calling props callbacks like `onCategoryOverridesChange(...)`

**What NOT to do:**
- ❌ Call directly: `onCategoryOverridesChange(value)` - will throw if undefined
- ❌ Use optional chaining with await: `await window.deskflowAPI?.method()` - returns undefined, not promise
- ❌ Multiple nested try-catch blocks - makes debugging harder

**What TO do:**
- ✅ Check type first: `if (typeof onCallback === 'function') { onCallback(value); }`
- ✅ Wrap in try-catch: `try { onCallback(value); } catch (e) { /* ignore */ }`

**Why it fails:**
- Props may not be passed (undefined)
- Optional chaining (`?.`) returns undefined, not a caught error
- React may unmount between check and call
- TypeScript types may not match runtime

### Promise/Async Issues
**Problem:** `Uncaught (in promise) TypeError`

**Fix:**
- Always wrap async calls in try-catch
- Don't use `await` with optional chaining: `await window.api?.method()` can fail silently
- Check if result exists before using: `if (result) { ... }`

---

## 📷 3D Camera/Clipping Debugging Pattern

**When you see black squares, cut-off objects, or particles disappearing when rotating camera:**

### Step 1: Check Camera Far Plane
```typescript
// Wrong - far plane defaults to ~2000
camera={{ position: [0, 100, 200], fov: 45 }}

// Right - explicit far plane
camera={{ position: [0, 100, 200], fov: 45, near: 0.1, far: 10000 }}
```

### Step 2: Check Position Mismatches
Verify all positioned elements match their constants:
```typescript
const APPS_GALAXY_POS: [number, number, number] = [0, 0, 0];
const WEBSITES_GALAXY_POS: [number, number, number] = [3250, 0, 0];

// Element must match constant
<group position={WEBSITES_GALAXY_POS}>  // NOT [650, 0, 0]
```

### Step 3: Check OrbitControls Limits
```typescript
// Wrong - can't zoom out far enough
<OrbitControls maxDistance={800} />

// Right - allow viewing entire scene
<OrbitControls maxDistance={5000} />
```

### Step 4: Add Fog for Smooth Fade
```typescript
// Fog helps objects fade naturally instead of clipping
<fog attach="fog" args={['#0a0a14', 1500, 4500]} />
```

### Step 5: Check Stars Coverage
```typescript
// Wrong - stars disappear when zooming out
<Stars radius={500} depth={100} count={3000} />

// Right - stars cover entire viewable area
<Stars radius={4000} depth={200} count={8000} />
```

### Key Numbers to Remember for DeskFlow
| Setting | Value | Reason |
|---------|-------|--------|
| Galaxy distance | 3250 | 5x galaxy width |
| Camera far | 10000 | Covers both galaxies |
| OrbitControls maxDistance | 5000 | Can zoom to see both |
| Stars radius | 4000 | Background covers scene |
| Fog range | 1500-4500 | Smooth particle fade |

### Signs of Camera/Clipping Issues
- Black square appears when rotating
- Particles cut off sharply instead of fading
- Can't zoom out far enough
- Stars disappear when moving camera
- Objects "pop" into existence

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-04 | Initial creation |
| 1.1 | 2026-04-16 | Added callback/promise fix patterns |
| 1.2 | 2026-04-16 | Added Data Mismatch Debugging Pattern |
| 1.3 | 2026-04-16 | Added Data Computation Pattern (Single Source of Truth) |
| 1.4 | 2026-04-16 | Added 3D Camera/Clipping Debugging Pattern |

---

**Last Updated:** 2026-04-16
**Maintained By:** AI Development Team
