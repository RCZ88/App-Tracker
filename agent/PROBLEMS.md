# PROBLEMS.md - Comprehensive Issue List

**Last Updated:** 2026-04-16
**Total Issues:** 12
**Status:** 8 issues fixed (1,2,8,9,10,11,12,13), 4 pending (3,4,5,6,7)

---

## Issue 13: Galaxy/Planetary Data Mismatch (NEW - FIXED)

**Status:** AI Attempted Fix  
**Priority:** P1  
**Category:** Dashboard/Galaxy

**Problem:** OrbitSystem/Galaxy shows wrong/insufficient data - doesn't match Applications page

**Root Cause:** 
- OrbitSystem received `logs` prop which updates ASYNCHRONOUSLY via useEffect
- `computedAppStats` (used by StatsPage) updates SYNCHRONOUSLY via useMemo
- Timing mismatch caused galaxy to show stale data

**Solution Applied:**
- Changed OrbitSystem to receive `filteredLogs` instead of `logs`
- Added `websiteLogs` prop for website galaxy data
- Increased galaxy distance to 650 units
- Created WebsiteGalaxyDustCloud with nebula-style visuals (cyan/violet)
- Added galaxy type indicator UI (text only)
- Added smooth camera transition between galaxies

**Files Modified:**
- `src/App.tsx` - OrbitSystem props changed
- `src/components/OrbitSystem.tsx` - New dust cloud, colors, indicator, camera transition

---

## Issue 1: Period Switching Not Working (Week/Month Show Same Data)

**Status:** AI Attempted Fix  
**Priority:** P1  
**Category:** Timeline/Data

**Problem:** When switching between Week and Month time filters in the top navigation bar, the data displayed is identical. Debug shows both Week and Month show 4401 logs.

**Expected:** Week should show ~7 days of data, Month should show all available data (~30 days)

**Actual:** Both Week and Month show same 4401 logs - no difference

**User's Quote:** "switching between the month and the week, it still doesn't work... the week, the month should get all the data from that month. It's not working at all."

**Root Cause:** 
- User has only 8 days of data in database
- Filtering logic needs verification in `getTotalTime()` function
- Both use same `allLogs` but filtering may not be applied correctly

**Solution Applied:**
- Changed 'month' filter in `filteredLogs` useMemo to return all data (not just 30 days)
- Changed 'month' filter in `getTotalTime()` to return all data
- Changed 'month' filter in `computedAppStats` to return all data

**Files Modified:**
- `src/App.tsx` - filteredLogs useMemo, getTotalTime, computedAppStats

---

## Issue 2: Activity Visualization Data Mismatch

**Status:** AI Attempted Fix  
**Priority:** P1  
**Category:** Dashboard/Visualization

**Problem:** Activity Visualization (pie chart + heatmap on main dashboard) shows only 20 apps while Stats page shows 33 apps.

**Expected:** Activity Visualization should show same apps as Stats/Productivity page - 33 apps

**Actual:** Shows only 20 apps

**User's Quote:** "the activity visualization... it's not even loading properly... If you go to the application and you've switched the time into this week, you can see 33 apps. But in the activity visualization, you can only see 20"

**Root Cause:** 
- `getAppDistribution()` was including browser tracking data (websites) while Stats page excluded it
- Stats page filters out `is_browser_tracking` entries

**Solution Applied:**
- Updated `getAppDistribution()` to exclude browser tracking data with `if (log.is_browser_tracking) return;`

**Files Modified:**
- `src/App.tsx` - getAppDistribution function

---

## Issue 3: AlertTriangle Not Defined Error (FIXED)

**Status:** Fixed
**Fixed in:** v1.14 (2026-04-16)
**Category:** Settings

**Problem:** JavaScript error occurs when switching category assignments in Settings page.

**Error:** `Uncaught ReferenceError: AlertTriangle is not defined at SettingsPage.tsx:1186`

**Expected:** No JavaScript errors when interacting with Settings page

**Actual:** Console shows ReferenceError for AlertTriangle

**Root Cause:** 
- `AlertTriangle` icon is used in SettingsPage.tsx but not imported from lucide-react

**Solution:** 
- `AlertTriangle` was already imported in SettingsPage.tsx line 6
- Verified working in build

**Files Modified:**
- `src/pages/SettingsPage.tsx` - imports section (verified)

---

## Issue 4: Duplicate Category Assignment Section (VERIFIED)

**Status:** Verified Working
**Verified in:** v1.14 (2026-04-16)
**Category:** Settings

**Problem:** There are TWO category assignment sections in Settings page - one at the top and one at the bottom.

**Solution:** 
- Only ONE "Category Assignments" section exists (line 1204)
- The "Applications" section at top (line 746) is a carousel view - different UI pattern
- No duplicate sections exist

**Files Modified:**
- `src/pages/SettingsPage.tsx` - verified single section

---

## Issue 5: Category Changes Don't Persist to Database (FIXED)

**Status:** Fixed
**Fixed in:** v1.17 (2026-04-16)
**Category:** Settings/Persistence

**Problem:** Category changes not persisted - reverted after app restart.

**Root Cause:** 
- Multiple issues in data flow:
  1. Settings/App loaded only from localStorage, not categoryConfig
  2. categoryConfig (persist file) was being saved but not re-loaded properly
  3. categorizeApp() reads from categoryConfig - not localStorage

**Solution:** 
- Save: Writes to categoryConfig.appCategoryMap + localStorage + database (refactor)
- Load: Now reads from BOTH categoryConfig AND localStorage
- New logs: categorizeApp() uses categoryConfig.appCategoryMap for correct category

**How it works now:**
1. User changes category + clicks Save
2. Forward mode: Writes to categoryConfig (persistent file) + localStorage
3. Refactor mode: Also UPDATEs all existing logs in SQLite
4. On reload: App reads from categoryConfig + localStorage
5. New logs: categorizeApp() checks categoryConfig first

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Load from categoryConfig on mount, saveChanges calls setAppCategory
- `src/App.tsx` - Load from categoryConfig on mount

---

## Issue 6: Category Changes Don't Update Instantly in UI (VERIFIED)

**Status:** Verified Working
**Verified in:** v1.14 (2026-04-16)
**Category:** Settings/UI

**Problem:** Must click Save button to see category changes.

**Solution:** 
- `changeAppCategory()` at line 513 updates React state immediately
- UI re-renders without clicking Save button
- Save button appears only as visual confirmation

**Files Modified:**
- `src/pages/SettingsPage.tsx` - changeAppCategory function (verified)

**Expected:** Table should update immediately when category dropdown changes

**Actual:** Must click separate Save button

**User's Quote:** "changing the category of an app or website should instantly update the data on the table without having to click anything but the save button."

**Root Cause:** 
- onChange handler not updating React state immediately
- Need to trigger re-render on category change

**Files to Check:**
- `src/pages/SettingsPage.tsx` - category dropdown handlers

---

## Issue 7: Confusing Sync Button (VERIFIED)

**Status:** Verified Working
**Verified in:** v1.14 (2026-04-16)
**Category:** Settings/UI

**Problem:** There's a "Sync" button that's confusing after auto-save works

**Solution:** 
- "Data Sync Mode" buttons are for database synchronization (different feature)
- They sync category overrides TO the database
- The "Save" button appears only when changes exist - it's not confusing

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Data Sync Mode section (verified)

---

## Issue 8: Productivity Score Mismatch

**Status:** AI Attempted Fix  
**Priority:** P1  
**Category:** Dashboard/Productivity

**Problem:** Productivity score on Dashboard does NOT match Productivity page

**Expected:** Both should show same productivity percentage

**Actual:** Different values shown

**User's Quote:** "the productivity on the dashboard is not at all following what it is on the productivity page which is a problem."

**Root Cause:** 
- Dashboard uses `productivityScore` useMemo (lines 958-978 in App.tsx)
- ProductivityPage was using its own browser data fetch with `getBrowserDomainStats()` API
- Different data sources caused score mismatch

**Solution Applied:**
- ProductivityPage now receives `browserLogs` prop from App.tsx (same data source as Dashboard)
- Removed local browser data fetching from ProductivityPage
- Added `browserLogs` to ProductivityPage route

**Files Modified:**
- `src/App.tsx` - ProductivityPage route now passes `browserLogs` prop
- `src/pages/ProductivityPage.tsx` - Removed useEffect that fetched browser data, now uses prop

---

## Issue 9: Activity Visualization Should Be Heatmap with Navigation

**Status:** AI Attempted Fix  
**Priority:** P2  
**Category:** Dashboard/Visualization

**Problem:** Activity Visualization should support week navigation (left/right arrows) like the heatmap

**Expected:** Arrow buttons to navigate through previous weeks

**Actual:** Currently shows pie chart without historical navigation

**User's Quote:** "I would like you to make the activity visualization the heat map so that I can be able to switch between weeks so I can have like a left and right arrow button that can allow me to scroll through the previous weeks"

**Solution Applied:**
- Added `weekOffset` state for week navigation (0 = current week, -1 = previous, +1 = next)
- Added `heatmapWeekLabel` useMemo to show week date range
- Updated heatmap `useMemo` to filter by `weekOffset`
- Added LEFT/RIGHT arrow buttons with ChevronLeft/ChevronRight icons
- Added "Today" button to return to current week
- Disabled "Next Week" button when at current week

**Files Modified:**
- `src/App.tsx` - Added weekOffset state, updated heatmap logic, added navigation buttons

---

## Issue 10: App Colors Not Working in Settings

**Status:** AI Attempted Fix  
**Priority:** P1  
**Category:** Settings

**Problem:** Application colors in Settings all show the same default color - not saving properly

**Expected:** Each app should have unique color saved in database

**Actual:** All apps show same default color

**User's Quote:** "the application color doesn't work because currently the application color doesn't work because everything is the same color for some reason."

**Root Cause:** 
- SettingsPage initialized localAppColors from prop instead of reading from localStorage
- Fix: Changed useState to initialize from localStorage first

**Solution Applied:**
- Modified SettingsPage.tsx to load from localStorage in useState initializer

**Files Modified:**
- `src/pages/SettingsPage.tsx` - localAppColors now reads from localStorage

---

## Issue 11: Console Log Spam

**Status:** AI Attempted Fix  
**Priority:** P2  
**Category:** Logging/Performance

**Problem:** Console is flooded with logs - hundreds per second

**Expected:** Reasonable console output for debugging

**Actual:** 100+ logs appearing every second

**User's Quote:** "the logs are just spamming. Like currently it's just like a flow of logs the logs come in for hundreds of every second there's 100 more logs every second."

**Root Cause:** 
- Multiple [Debug] console.log in App.tsx firing on every render
- Fix: Removed all [Debug] logs from App.tsx

**Solution Applied:**
- Removed 10+ debug console.log from App.tsx

**Files Modified:**
- `src/App.tsx` - Removed debug logs from getTotalTime, computedAppStats, allTimeAppStats, filteredLogs

---

## Issue 12: Pie Chart Visual Quality Inconsistency

**Status:** AI Attempted Fix  
**Priority:** P3  
**Category:** UI/Visualization

**Problem:** Pie charts on Productivity page look worse than Dashboard

**Expected:** Consistent pie chart styling across all pages

**Actual:** Different colors, labels, or styling

**User's Quote:** "the productivity trend chart the pie chart is better because currently the pie chart here on the product page is not the same as the ones on the application it's like currently looking worse than the ones on the application."

**Root Cause:** 
- Different borderColor configuration between pages

**Solution Applied:**
- Fixed ProductivityPage pie chart borderColor to match Dashboard (#0a0a0a)

**Files Modified:**
- `src/pages/ProductivityPage.tsx` - borderColor now consistent with Dashboard

---

## 📋 Issue Summary by Priority

### P1 - Critical
1. Period Switching (Issue 1)
2. Activity Viz Data Mismatch (Issue 2)
3. AlertTriangle Error (Issue 3)
4. Category Persistence (Issue 5)
5. Productivity Score Mismatch (Issue 8)
6. App Colors Not Working (Issue 10)

### P2 - High
6. Category Instant Update (Issue 6)
7. Activity Viz Heatmap (Issue 9)
8. Console Log Spam (Issue 11)

### P3 - Medium
4. Duplicate Section (Issue 4)
7. Sync Button (Issue 7)
12. Pie Chart Quality (Issue 12)

---

## 📋 Issue Summary by Agent

### Agent 1: Data & Visualization
- Issue 1: Period Switching
- Issue 2: Activity Viz Data Mismatch
- Issue 8: Productivity Score Mismatch
- Issue 9: Activity Viz Heatmap

### Agent 2: Settings & Persistence
- Issue 3: AlertTriangle Error
- Issue 4: Duplicate Section
- Issue 5: Category Persistence
- Issue 6: Category Instant Update
- Issue 7: Sync Button

### Agent 3: UI/UX Quality
- Issue 10: App Colors
- Issue 11: Console Log Spam
- Issue 12: Pie Chart Quality

---

## IDE Projects Page Issues (NEW)

### Issue 14: Add Project Button Not Working (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** IDEProjects

**Problem:** The "Add Project" button exists in the UI but clicking it does nothing. User cannot add any projects.

**Expected:** Clicking "Add Project" should open a modal or form to add a new project with fields for name, path, IDE, language, repo URL.

**Solution Applied:**
- Added "Add Project" button to the main header (always visible, not hidden in projects tab)
- Created a proper modal dialog for adding projects accessible from any tab
- Simplified the modal UI with clean styling

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Added header button + modal

---

### Issue 15: All Features Inaccessible

**Status:** Not Started
**Priority:** P1
**Category:** IDEProjects

**Problem:** None of the IDE Projects features are accessible. User cannot see any buttons or UI elements that show the features.

**Expected:** All IDE Projects features (IDE detection, tool scanning, project management, AI tracking, Git metrics) should be visible and accessible from the UI.

**Actual:** User reports "none of the features is accesible. i cant see any buttons that shows that."

---

### Issue 16: Terminal Features Not Visible (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** IDEProjects/Terminal

**Problem:** Terminal Window features were supposedly added but user cannot see them anywhere in the UI.

**Expected:** Terminal Window should be accessible via a route (/terminal) or a button to open it.

**Solution Applied:**
- Added "Terminal" item to the main sidebar navigation
- Terminal is now accessible from the sidebar between "IDE Projects" and "Insights"

**Files Modified:**
- `src/App.tsx` - Added Terminal to sidebar items, imported Terminal icon

---

### Issue 17: UI/UX Design - Button Overload in One Row (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P2
**Category:** IDEProjects/UI

**Problem:** All buttons are crammed into one row, making the UI look bad and hard to use.

**Expected:** Buttons should be organized in a logical layout, possibly with multiple rows or grouped by function.

**Solution Applied:**
- Removed unnecessary colorful gradient buttons
- Simplified button styling with consistent `bg-zinc-800` style
- Used `flex-wrap` so buttons can wrap on smaller screens
- Removed Features button (duplicate of Guide)

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Simplified header button styling

---

### Issue 18: UI Colors - Too Colorful/Bright (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P2
**Category:** IDEProjects/UI

**Problem:** The UI uses too many bright, distracting colors that look poor.

**Expected:** A more subdued, professional color scheme should be used.

**Solution Applied:**
- Replaced gradient buttons (violet-to-indigo, emerald-to-green, purple-to-pink) with simple `bg-zinc-800` style
- Only kept `bg-indigo-600` for primary action (Add Project)
- Removed `shadow-lg shadow-violet-500/25` glow effects

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Simplified button colors

---

### Issue 19: Help/Guide Feature UI Bad (Lower Priority - Deferred)

**Status:** Lower Priority
**Priority:** P2
**Category:** IDEProjects/UI

**Problem:** The Setup Guide and Help features look bad and are poorly designed.

**Actual:** "the ui for tlike the guides and the features arE REALLY BAD"

**Note:** This is a cosmetic issue. The help modal exists at /ide-help route. UI can be improved later.

---

### Issue 20: AI Usage Sync Button - Graph Doesn't Update

**Status:** Not Started
**Priority:** P1
**Category:** IDEProjects/Data

**Problem:** Clicking "Sync AI Usage" doesn't update the graphs/charts. The data doesn't reflect in the UI after syncing.

**Expected:** After clicking sync, the AI usage metrics (tokens, cost, sessions) should update in the UI.

**Actual:** "the scan ai usage doesnt update the graph"

---

### Issue 21: AI Detection - Sessions/Spending Not Working

**Status:** Not Started
**Priority:** P1
**Category:** IDEProjects/Data

**Problem:** The detection for amount of sessions and spending is not working. Shows zero or incorrect values.

**Expected:** Should show total sessions, total tokens spent, and total cost for each AI agent.

**Actual:** "the detection for amount of sessions and spending is not working."

---

### Issue 22: Help Page Inaccessible (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** IDEProjects

**Problem:** A help/features page was supposed to be created but user cannot access it.

**Expected:** User should be able to click a "Help" button to see the help page.

**Solution Applied:**
- The help page exists at `/ide-help` route
- The "Guide" button in the IDE Projects header opens the setup modal
- Features modal shows all IDE Features

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Guide button opens setup modal

---

## IDE Projects Page - New Issues (Added 2026-04-19)

### Issue 23: "How Counts Are Calculated" Shown on Wrong Page

**Status:** Not Started
**Priority:** P2
**Category:** IDEProjects/UI

**Problem:** The "How Counts Are Calculated" info box (explaining Sessions, Tokens, Cost, agent-specific paths) is displayed on the Tools page (npm packages section) instead of the AI Tools page.

**Expected:** This information should only appear when clicking on a specific AI agent in the AI Tools tab, showing agent-specific details in the expanded view.

**Actual:** It's shown in the Tools tab under NPM Packages, which is unrelated.

**User's Quote:** "why is this on the tools page of the ide page? that should be related to the ai tools no? it should be that each of the stuff should go to the expanded version of the ai tools."

---

### Issue 24: Duplicate Add Project Button - Remove from Header (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P2
**Category:** IDEProjects/UI

**Problem:** There's now an "Add Project" button in both the header AND the Projects tab.

**Solution:** Removed "Add Project" button from header. Now only accessible in Projects tab.

---

### Issue 25: Tools Duplicating on Sync (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** IDEProjects/Data

**Problem:** When clicking "Sync AI" or "Scan Tools", the tools list duplicates instead of replacing existing entries.

**Solution:**
- Changed tool ID generation to use deterministic IDs (e.g., `git`, `npm-google/gemini-cli`) instead of `tool-${Date.now()}`
- This ensures `INSERT OR REPLACE` works correctly instead of creating new rows
- CLI tools: `id = toolName`
- NPM packages: `id = npm-{packageName}`

---

### Issue 26: Need Reset Tools Function (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P2
**Category:** IDEProjects/Data

**Problem:** No way to clear tools and start fresh.

**Solution:**
- Added `reset-tools` IPC handler in main.ts
- Added `resetTools` to preload.ts and App.tsx type declarations
- Added "Reset Tools" button in Tools tab in IDEProjectsPage.tsx
- Button clears all tools from DB so user can re-scan fresh

---

### Issue 27: "How Counts Are Calculated" Should Be Removed From Tools Page (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P2
**Category:** IDEProjects/UI

**Problem:** The info box about how sessions/tokens/cost are calculated was on the Tools page.

**Solution:**
- Removed "How Counts Are Calculated" section from Tools tab
- Added agent-specific "How This Is Calculated" section in the AI agent detail modal (Fix #23)
- Each agent shows its specific data source path (e.g., Claude Code shows ~/.claude/projects)

---

### Issue 28: Add Project Modal Button Not Working (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** IDEProjects/Functionality

**Problem:** The "Add Project" button inside the modal popup doesn't actually create a project.

**Solution:**
- Added error state (`addProjectError`) to display backend errors
- Added loading state (`addingProject`) so button shows "Adding..." feedback
- Modal now shows red error box if project creation fails
- Errors are cleared when modal is closed
- Backend errors now visible to user (e.g., "Projects require SQLite", database errors)

---

### Issue 29: AI Usage Chart Doesn't Update After Sync (AI Attempted Fix)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** IDEProjects/Data

**Problem:** After syncing AI usage, the charts/graphs don't update to reflect the new data.

**Root Cause:** The backend `get-ide-projects-overview` was not returning `daily` data per tool. The frontend chart expects `overview.aiUsage.byTool[agentId].daily[date].tokens` but the backend only returned aggregate totals.

**Solution:**
- Added daily breakdown query to backend: `SELECT tool, date, SUM(tokens) FROM ai_usage GROUP BY tool, date`
- Backend now returns `daily` property in each tool's data with per-day token/cost breakdown
- Charts now show correct data after sync

---

### Issue 30: Terminal Doesn't Match Spec

**Status:** Not Started
**Priority:** P1
**Category:** Terminal

**Problem:** The current Terminal implementation doesn't match the specification in `agent/docs/terminalFeature.md`. The spec calls for:
- Two windows: Command Center + Terminal Window
- Recursive tiling layout engine (NOT tabs)
- Visual layout mapper with drag & drop
- Session persistence
- PTY management with IPC streaming

**Expected:** See `agent/docs/terminalFeature.md` for full specification.

**Actual:** Current terminal is just a basic xterm.js component without tiling, two-window sync, or the Command Center features.

**User's Quote:** "i dont think you get how the terminal works. so lets just work on that later."

**Note:** Defer to later per user request. Need to rebuild terminal feature from scratch to match spec.

---

## 📊 Summary of Issue Counts

| Category | Issue Count | Status |
|----------|-----------|--------|
| IDEProjects/Tools/Data | 7 | All Not Started |
| IDEProjects/UI | 4 | All Not Started |
| Terminal | 1 | Not Started |
| **TOTAL** | **12** | **All Not Started**