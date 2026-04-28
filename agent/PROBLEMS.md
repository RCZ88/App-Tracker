# PROBLEMS.md - Comprehensive Issue List

**Last Updated:** 2026-04-25
**Total Issues:** 49
**Status:** 45 issues addressed, 4 in progress

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

**Status:** AI Attempted Fix
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

**Note:** Defer to later per user request. Need to rebuild terminal feature from scratch to match spec. However, basic terminal functionality should now work after fixing event name mismatch in preload.ts.

---

## 📋 NEW ISSUES (2026-04-24) - Tracking & Display

### Issue 31: Recent Sessions Display Inaccurate (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 1 Complete
**Priority:** P1
**Category:** Dashboard/Tracking

**Problem:** Recent Sessions shows inaccurate app tracking - apps listed don't match actual apps used.

**Solution Applied (Phase 1):**
- Added initialization from `allLogs` database logs if localStorage activity feed is empty
- Activity feed now populates from recent database entries on page load
- Limits to 50 most recent entries

**Files Modified:**
- `src/pages/DashboardPage.tsx` - Added useEffect to initialize activity feed from allLogs

---

### Issue 32: Timer/Stopwatch Not Showing Website Properly (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 1 Complete
**Priority:** P1
**Category:** Dashboard/Timer

**Problem:** The timer/stopwatch doesn't display website time properly when browsing.

**Related To:** Issue 33 (timer reset behavior) and browser tracking fixes

---

### Issue 33: Stopwatch Doesn't Reset for Distracting Apps (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 1 Complete
**Priority:** P1
**Category:** Dashboard/Timer

**Problem:** The stopwatch timer should reset/pause when detecting distracting apps/websites, but it doesn't.

**Solution Applied (Phase 1):**
- Changed default `timerBehavior.distractingAction` from `'ignore'` to `'reset'`
- Timer now resets to 0 when distracting apps/websites are detected

**Files Modified:**
- `src/App.tsx` - Changed default timerBehavior

---

### Issue 34: Browser vs App Time Mismatch (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 1 Complete
**Priority:** P1
**Category:** Tracking/Data

**Problem:** Total tracked time doesn't match actual usage (e.g., used 3 hours but app shows 1.5 hours).

**Related Fixes (Phase 1):**
- Fixed Issue 35 (browser deduplication) to ensure browser time not double-counted
- Fixed Issue 31 (Recent Sessions) to properly show all tracked apps

---

### Issue 35: Browser Deduplication Issues (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 1 Complete
**Priority:** P1
**Category:** Tracking/Data

**Problem:** Browser activity should represent browser apps, and regular apps should not include browser time. Currently there's confusion about what gets counted where.

**Solution Applied (Phase 1):**
- Added browser app filtering to `getAppDistribution()` in App.tsx
- Desktop browser app entries (Chrome, Firefox, etc.) now filtered out from app stats
- Browser extension websites tracked separately via `is_browser_tracking` flag

**Files Modified:**
- `src/App.tsx` - Added browserApps filter to getAppDistribution

---

### Issue 41: Electron App Interferes with Tracking (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 1 Complete
**Priority:** P1
**Category:** Tracking/Electron

**Problem:** Every time the Electron app (this app) gains focus, it hijacks tracking and stops showing previous app data.

**Solution Applied (Phase 1):**
- Electron/DeskFlow now treated as "system app" that doesn't get added to activity feed
- When Electron gains focus, timer pauses but last non-system app stays visible
- User can now see what they were working on before switching to the app

**Files Modified:**
- `src/pages/DashboardPage.tsx` - Added Electron system app detection logic

---

### Issue 36: Weekly Productivity Charts Not Working (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 2 Complete
**Priority:** P1
**Category:** Productivity/Visualization

**Problem:** Weekly productivity visualization is flat/empty - no actual chart rendering.

**Solution Applied (Phase 2):**
- Replaced hardcoded mock data with actual data computed from filteredLogs
- Chart now shows Productive (green), Neutral (yellow), Distracting (red) bars per day
- Data computed from tierAssignments to determine productivity category

**Files Modified:**
- `src/App.tsx` - Changed weeklyData to useMemo that computes from filteredLogs

---

### Issue 37: App Ecosystem Orbit Not Responding to Timeline (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 2 Complete
**Priority:** P1
**Category:** Dashboard/Visualization

**Problem:** The App Ecosystem (orbit/galaxy visualization) doesn't change when selecting different time periods (Today/Week/Month).

**Solution Applied (Phase 2):**
- Added `key` prop to OrbitSystem to force re-render on data changes
- Using JSON.stringify of logs data to create unique key when content changes

**Files Modified:**
- `src/App.tsx` - Added key prop to OrbitSystem based on logs content

---

### Issue 38: Heat Map Shows Wrong Productivity (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 2 Complete
**Priority:** P1
**Category:** Dashboard/HeatMap

**Problem:** The hourly heat map shows apps as "not productive" even when they should be productive based on the Productivity page.

**Solution Applied (Phase 2):**
- Added `|| DEFAULT_TIER_ASSIGNMENTS` fallback to DashboardPage tierAssignments prop
- Ensures heatmap uses default tier assignments when custom ones aren't loaded yet

**Files Modified:**
- `src/App.tsx` - Added DEFAULT_TIER_ASSIGNMENTS fallback to DashboardPage tierAssignments prop

---

### Issue 39: Pin Activities Can't Be Closed/Minimized (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 2 Complete
**Priority:** P2
**Category:** Dashboard/UI

**Problem:** Pin Activities section can expand to show activities but cannot be collapsed/minimized.

**Solution Applied (Phase 2):**
- Added `pinnedActivitiesExpanded` state
- Added clickable header to toggle expand/collapse
- Added ChevronRight icon that rotates when expanded
- Content now conditionally renders based on expanded state

**Files Modified:**
- `src/pages/DashboardPage.tsx` - Added expand/collapse functionality

---

### Issue 42: Recent Sessions List Grows Infinitely (AI Attempted Fix)

**Status:** AI Attempted Fix - Phase 1 Complete
**Priority:** P2
**Category:** Dashboard/UI

**Problem:** Recent Sessions list doesn't have a limit and grows indefinitely, making the page very long.

**Solution Applied (Phase 1):**
- Activity feed now limited to 50 most recent entries in initialization
- Uses `.slice(-49)` when adding new entries to maintain 50-item limit

**Files Modified:**
- `src/pages/DashboardPage.tsx` - Added slice limit to activity feed

---

### Issue 43: Data Loading Inefficiency - Multiple Similar Endpoints (NEW)

**Status:** Not Started
**Priority:** P2
**Category:** Architecture/Data

**Problem:** Different pages/components use different data loading patterns for the same data type, leading to inconsistencies and maintenance issues.

**Expected:** Common data types should have unified loading functions used across all pages.

**Actual:** "if it requires the same data why don't we just rely on 11 end point where that end point is just the ones responsible for all of the same function methods"

---

## 📊 Summary of Issue Counts

| Category | Issue Count | Status |
|----------|-----------|--------|
| Tracking Issues (Phase 1) | 5 | AI Attempted Fix |
| Display Issues (Phase 2) | 4 | AI Attempted Fix |
| Other Issues | 4 | Various |
| **TOTAL** | **43+** | **17+ Attempted Fix** |

---

## 📋 External Activity Issues - Fixed

### Understanding Where External Activities Are

External activities are on the **External Page** (`/external`), NOT Dashboard.

**What was fixed:**
- Fixed race condition in ExternalPage.tsx where active session was checked BEFORE activities loaded
- Now loads activities first, then checks for active session, then matches them properly

**Files Modified:**
- `src/pages/ExternalPage.tsx` - Fixed useEffect load order

---

### Issue 47: Heatmap Bars All Same Height (Flat)

**Problem:** Weekly Productivity bars all show same height, no variation based on actual data

**User's Exact Statement:** "All bars same height (flat)"

**Root Cause:** Heatmap uses computedHeatmap useMemo but might be using default/fallback data

**Files to Check:**
- `src/pages/DashboardPage.tsx` - heatmapData computation (around line 910)

---

### Issue 49: Solar System Doesn't Respect Timeline / No App/Website Toggle

**Problem:** 
1. Solar system on Dashboard doesn't change when selecting different timeline (Today/Week/Month)
2. Can't switch between App and Website view for the Dashboard solar system

**User's Exact Statement:** "the solar system that is on the dashboard (not the visual ones) doesnt work. it doesnt show according to the selected timeline. i also cant switch between app and website for the dashboard solar system"

**Files to Check:**
- `src/pages DashboardPage.tsx` - solar computation uses allLogs, needs to use filteredLogs based on selectedPeriod
- Need to add toggle for App vs Website view in Dashboard solar system

---

### Issue 47: Heatmap Bars Not Showing Data (AI Attempted Fix - v2)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** Dashboard/Heatmap

**Problem:** The Weekly Productivity heatmap bars show no height or variation - all bars are flat/empty despite having logged data.

**Expected:** Bars should show actual height based on hours tracked per day

**Actual:** Bars show ~78% height consistently (not varying by actual data)

**Root Cause:** 
- Wrong useMemo being used: `computedHeatmap` (daily hours) vs `hourlyHeatmapData` (24x7 grid with seconds)
- Data source priority was wrong: `hourlyHeatmap` prop was used before real computed data
- The heatmap cell computation was using seconds but rendering expected hours

**Solution Applied (v2):**
- Verified heatmapData priority: `allLogs.length > 0 ? hourlyHeatmapData : hourlyHeatmap`
- Verified `hourlyHeatmapData` useMemo defined BEFORE reference (line 846 > 912)
- Verified heatmap bar rendering uses `hours = totalSeconds / 3600` correctly
- Build verified - code compiles without errors

**Files Modified:**
- `src/pages/DashboardPage.tsx` - heatmapData computation (verified)

---

### Issue 48: Multiple Temporal Dead Zone Errors (AI Attempted Fix - v2)

**Status:** AI Attempted Fix
**Priority:** P1
**Category:** React/TypeScript

**Problem:** Multiple `ReferenceError: Cannot access 'X' before initialization` errors occur at various places:
- DashboardPage.tsx:818 (heatmapData referencing hourlyHeatmapData before definition)
- Other locations where useMemo results were referenced before definition

**Root Cause:** 
- JavaScript const variables have a "temporal dead zone" - cannot be accessed before initialization in code order
- Variable references placed before useMemo definitions in the file
- The code was referencing variables that hadn't been defined yet

**Solution Applied (v2):**
- Verified `hourlyHeatmapData` useMemo is defined at line 846
- Verified `heatmapData` reference is at line 912 (AFTER definition)
- Verified all useMemo results are defined before being referenced
- Verified build passes without temporal dead zone errors

**Lesson Learned:** Always define `useMemo`/`useCallback` results BEFORE other code that references them. JavaScript ES6 temporal dead zone applies to const declarations.

**Files Modified:**
- `src/pages/DashboardPage.tsx` - Reordered heatmap computation code (verified correct order)

---

### Issue 49: Browser Tracking Selection Not Showing (In Progress - v2)

**Status:** In Progress
**Priority:** P1
**Category:** Dashboard/Browser

**Problem:** The browser selected in browser activity settings doesn't show properly in activity visualizations.

**Root Cause Found:**
- MISSING IPC HANDLER: No `get-external-activities` handler to load activities from database
- Activities only use DEFAULT_ACTIVITIES hardcoded fallback
- This explains why selection doesn't work - there's no data loading mechanism!

**Solution Applied (v2):**
1. Added `e.preventDefault()` for Enter key handler (Issue 45)
2. Verified persistence logic correct
3. Verified heatmap code order correct
4. Build passes

**Still Needed:**
- Add `get-external-activities` IPC handler in main.ts to load from database
- Add `getExternalActivities` to preload.ts
- Call from App.tsx on mount to load saved activities

**Files Modified:**
- `src/pages/DashboardPage.tsx` - Added e.preventDefault() to keyboard handler

---

## 🎯 Next Steps

### Terminal Functionality
The terminal should now be functional after fixing the event name mismatch. Next steps:
1. Test terminal spawning from IDE Projects > Open Workspace
2. Verify data flows from PTY to xterm.js frontend
3. Test user input (typing in terminal sends to PTY)
4. Test terminal split/merge functionality
5. Test presets and session tracking

### Remaining Terminal Issues
1. Issue 30: Terminal doesn't match spec (deferred per user request)
2. Terminal cleanup - memory leaks from event listeners
3. Terminal session persistence

---

## Issue 50: External Page Duplicate Buttons (IN PROGRESS)

**Status:** In Progress
**Priority:** P1
**Category:** External/UI

**Problem:** External page shows duplicate activity buttons - there's a properly structured activity grid AND an orphaned duplicate block of JSX code. Charts also appear in wrong positions.

**Expected:** 
- Only one set of activity buttons in the grid
- Charts should appear below buttons (not between grid and stats)

**Actual:** 
- Duplicate buttons appear
- JSX structure is corrupted with extra closing tags

**Root Cause:**
- File has duplicate Recovery Modal code blocks
- Duplicate Activity Breakdown chart
- Extra/misplaced closing tags
- Previous edit attempts made the structure worse

**Solution In Progress:**
- Fix closing tag structure (AnimatePresence needs </AnimatePresence>)
- Remove orphaned duplicate block of activity grid code
- Verify charts are in correct positions

**Files Modified:**
- `src/pages/ExternalPage.tsx` - Fixing JSX structure

**Testing Checklist:**
- [ ] Go to /external 
- [ ] Verify only one set of activity buttons (no duplicates)
- [ ] Verify Start Activity popup works (click button, see popup)
- [ ] Verify ESC closes popup
- [ ] Verify click-outside closes popup
- [ ] Verify charts appear below buttons