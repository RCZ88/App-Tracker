# Graph Report - .  (2026-04-19)

## Corpus Check
- 18 files · ~277,828 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 146 nodes · 178 edges · 20 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `updateActiveTab()` - 7 edges
2. `onStartup()` - 7 edges
3. `saveState()` - 6 edges
4. `logPreviousSession()` - 5 edges
5. `sanitizeUrl()` - 4 edges
6. `periodicSync()` - 4 edges
7. `saveCategoryConfig()` - 4 edges
8. `addLog()` - 4 edges
9. `handleBrowserData()` - 4 edges
10. `beep()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `pollForeground()` --calls--> `addLog()`  [EXTRACTED]
  src\main.ts → src\main.ts  _Bridges community 10 → community 7_

## Communities

### Community 0 - "App State Management"
Cohesion: 0.07
Nodes (2): handleStorage(), reloadOverrides()

### Community 1 - "OrbitSystem Visualization"
Cohesion: 0.09
Nodes (10): adjustColor(), animateCamera(), computePlanets(), focusOnPlanet(), getCategoryColor(), getSystemPosition(), handleEnterSystem(), hexToRgb() (+2 more)

### Community 2 - "Electron Main Process"
Cohesion: 0.09
Nodes (0): 

### Community 3 - "Browser Extension Background"
Cohesion: 0.34
Nodes (13): checkBrowserFocus(), extractDomain(), healthCheck(), loadState(), logPreviousSession(), onStartup(), periodicSync(), sanitizeUrl() (+5 more)

### Community 4 - "Notification System"
Cohesion: 0.47
Nodes (5): beep(), main(), Play a simple system beep., Speak text using offline TTS (pyttsx3 if available).     Falls back to system TT, speak()

### Community 5 - "Category Management"
Cohesion: 0.33
Nodes (4): Check GRAPH_REPORT.md exists and has content. Regenerate if broken., Sync graphify-out/ to Obsidian vault., sync_to_vault(), validate_report()

### Community 6 - "Browser Activity Page"
Cohesion: 0.33
Nodes (0): 

### Community 7 - "Settings Page"
Cohesion: 0.4
Nodes (5): categorizeApp(), categorizeDomain(), loadCategoryConfig(), pollForeground(), saveCategoryConfig()

### Community 8 - "Data Logging and Aggregation"
Cohesion: 0.4
Nodes (0): 

### Community 9 - "Database Page"
Cohesion: 0.4
Nodes (0): 

### Community 10 - "AI Pricing Integration"
Cohesion: 0.67
Nodes (4): addLog(), handleBrowserData(), saveJsonLogs(), updateAggregates()

### Community 11 - "Graphify Pipeline"
Cohesion: 0.67
Nodes (2): formatCellValue(), formatDuration()

### Community 12 - "Browser Tracking Server"
Cohesion: 0.67
Nodes (3): calculateCost(), getModelPricing(), syncAllAIAgents()

### Community 13 - "Productivity Scoring"
Cohesion: 1.0
Nodes (1): Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline

### Community 14 - "Vite Config"
Cohesion: 1.0
Nodes (2): calculateProductivityScore(), getTierForCategory()

### Community 15 - "ESLint Config"
Cohesion: 1.0
Nodes (2): startBrowserSessionFlushTimer(), startBrowserTrackingServer()

### Community 16 - "Build Configuration"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Preload Bridge"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **5 isolated node(s):** `Play a simple system beep.`, `Speak text using offline TTS (pyttsx3 if available).     Falls back to system TT`, `Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline`, `Check GRAPH_REPORT.md exists and has content. Regenerate if broken.`, `Sync graphify-out/ to Obsidian vault.`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Productivity Scoring`** (2 nodes): `graphify-pipeline.py`, `Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Config`** (2 nodes): `calculateProductivityScore()`, `getTierForCategory()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (2 nodes): `startBrowserSessionFlushTimer()`, `startBrowserTrackingServer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Build Configuration`** (2 nodes): `preload.ts`, `handler()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Preload Bridge`** (1 nodes): `electron.vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `eslint.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Play a simple system beep.`, `Speak text using offline TTS (pyttsx3 if available).     Falls back to system TT`, `Graphify Pipeline for Windows Runs the full knowledge graph extraction pipeline` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App State Management` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `OrbitSystem Visualization` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Electron Main Process` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._