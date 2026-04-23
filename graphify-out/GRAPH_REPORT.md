# Graph Report - .  (2026-04-23)

## Corpus Check
- 26 files · ~372,309 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 186 nodes · 223 edges · 18 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `onStartup()` - 8 edges
2. `updateActiveTab()` - 7 edges
3. `saveState()` - 6 edges
4. `animateCamera()` - 6 edges
5. `logPreviousSession()` - 5 edges
6. `sanitizeUrl()` - 4 edges
7. `periodicSync()` - 4 edges
8. `saveCategoryConfig()` - 4 edges
9. `addLog()` - 4 edges
10. `handleBrowserData()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "App State Management"
Cohesion: 0.07
Nodes (17): addLog(), calculateCost(), calculateProductivityScore(), categorizeApp(), categorizeDomain(), getModelPricing(), getTierForCategory(), handleBrowserData() (+9 more)

### Community 1 - "OrbitSystem Visualization"
Cohesion: 0.06
Nodes (2): handleStorage(), reloadOverrides()

### Community 2 - "Electron Main Process"
Cohesion: 0.09
Nodes (12): adjustColor(), animateCamera(), computePlanets(), focusOnPlanet(), getCategoryColor(), getSystemPosition(), handleEnterSystem(), handlePlanetClick() (+4 more)

### Community 3 - "Browser Extension Background"
Cohesion: 0.28
Nodes (14): checkBrowserFocus(), extractDomain(), healthCheck(), identifyBrowser(), loadState(), logPreviousSession(), onStartup(), periodicSync() (+6 more)

### Community 4 - "Notification System"
Cohesion: 0.17
Nodes (0): 

### Community 5 - "Category Management"
Cohesion: 0.25
Nodes (0): 

### Community 6 - "Browser Activity Page"
Cohesion: 0.25
Nodes (0): 

### Community 7 - "Settings Page"
Cohesion: 0.47
Nodes (5): beep(), main(), Play a simple system beep., Speak text using offline TTS (pyttsx3 if available).     Falls back to system TT, speak()

### Community 8 - "Data Logging and Aggregation"
Cohesion: 0.33
Nodes (4): Check GRAPH_REPORT.md exists and has content. Regenerate if broken., Sync graphify-out/ to Obsidian vault., sync_to_vault(), validate_report()

### Community 9 - "Database Page"
Cohesion: 0.33
Nodes (0): 

### Community 10 - "AI Pricing Integration"
Cohesion: 0.5
Nodes (2): formatCellValue(), formatDuration()

### Community 11 - "Graphify Pipeline"
Cohesion: 0.4
Nodes (0): 

### Community 12 - "Browser Tracking Server"
Cohesion: 1.0
Nodes (1): Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline

### Community 13 - "Productivity Scoring"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Vite Config"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Build Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Preload Bridge"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **5 isolated node(s):** `Play a simple system beep.`, `Speak text using offline TTS (pyttsx3 if available).     Falls back to system TT`, `Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline`, `Check GRAPH_REPORT.md exists and has content. Regenerate if broken.`, `Sync graphify-out/ to Obsidian vault.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Browser Tracking Server`** (2 nodes): `graphify-pipeline.py`, `Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Productivity Scoring`** (2 nodes): `preload.ts`, `handler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (1 nodes): `electron.vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Configuration`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Preload Bridge`** (1 nodes): `node-pty.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Play a simple system beep.`, `Speak text using offline TTS (pyttsx3 if available).     Falls back to system TT`, `Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App State Management` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `OrbitSystem Visualization` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Electron Main Process` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._