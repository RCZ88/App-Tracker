# 📌 Project State

**Purpose:** Current status, known issues, and recent changes for DeskFlow.

---

## 📊 Current Status

**Version:** 1.53
**Last Updated:** 2026-04-21
**Build Status:** ✅ Working

---

## 📝 Recent Changes

### 2026-04-21 — Browser Tracking Fix

**What Changed:**
1. ✅ Added all known browsers to the dropdown (Chrome, Firefox, Safari, Edge, Brave, Opera, Vivaldi, Arc)
2. ✅ Browser with extension now marked with "★ (with extension)" in dropdown
3. ✅ Browser with extension is set as default/pre-selected
4. ✅ Added `extensionBrowser` state to properly track which browser has the extension
5. ✅ When user selects a browser, it's saved as the browser with extension
6. ✅ Fixed case-insensitive browser deduplication (prevents Chrome/chrome duplicates)
7. ✅ Defaults to Chrome if available, otherwise first browser

**Files Modified:**
- `src/pages/BrowserActivityPage.tsx` - Added all known browsers to availableBrowsers, added extension marker (★), added separate extensionBrowser state, case-insensitive dedup

**Result:** All browser category apps should appear in dropdown. The one with the extension is marked with "★ (with extension)" and is the default selection.

### 2026-04-21 — Terminal Fix: Event Name Mismatch & Terminal Implementation

**What Changed:**
1. ✅ Fixed terminal data not reaching frontend - event name mismatch between main.ts (`terminal:data`) and preload.ts (`terminal-data`)
2. ✅ Updated `onTerminalData` listener in preload.ts to listen to `terminal:data` event
3. ✅ Terminal now properly receives PTY output data
4. ✅ Added `calculate-project-health` IPC handler that was missing
5. ✅ Fixed terminal container dimensions - added minHeight/minWidth
6. ✅ Fixed terminal layout rendering - proper flex layout
7. ✅ Added debugging logs to track terminal data flow
8. ✅ Added project details to dropdown (language, VCS type)
9. ✅ Added project stats panel to sidebar
10. ✅ Added all split directions (left, right, top, bottom) for split-screen
11. ✅ Fixed "Open Terminal" button to add terminal to layout
12. ✅ Added test text to terminal to verify rendering

**Files Modified:**
- `src/preload.ts` - Fixed `onTerminalData` to listen to `terminal:data` instead of `terminal-data`
- `src/main.ts` - Added `calculate-project-health` handler, debugging logs for terminal data
- `src/components/TerminalWindow.tsx` - Fixed container dimensions, layout rendering, split controls
- `src/pages/TerminalPage.tsx` - Added project details dropdown, project stats sidebar, fixed Open Terminal button

**Why:** Terminal was completely non-functional because: (1) IPC event names didn't match, (2) terminal container had no dimensions, (3) "Open Terminal" button spawned terminal but didn't add to layout, (4) missing project health handler.

**Result:** Terminal now spawns PTY, streams output to xterm.js frontend, handles user input. Split-screen works with 4 directions. Project details shown in dropdown and sidebar.

### 2026-04-21 — Tracking Browser Extension Setting

**What Changed:**
1. ✅ Added `browserWithExtension` preference to track which browser has the extension installed
2. ✅ Modified `get-tracked-browsers` IPC handler to only return browsers with extension (not all tracked browsers from DB)
3. ✅ Added `set-browser-with-extension` IPC handler to save which browser has the extension
4. ✅ Updated BrowserActivityPage dropdown to only show browsers that have the extension installed
5. ✅ Changed dropdown handler to use `setBrowserWithExtension` instead of generic `setPreference`

**Files Modified:**
- `src/main.ts` - Added `browserWithExtension` to UserPreferences interface, rewrote `get-tracked-browsers` handler, added `set-browser-with-extension` handler
- `src/preload.ts` - Added `setBrowserWithExtension` API binding
- `src/pages/BrowserActivityPage.tsx` - Added load browser with extension on mount, updated dropdown onChange handler

**Why:** The tracking browser dropdown was showing all browsers that were tracked (Chrome, Firefox, Edge, etc.), but it should only show browsers that have the DeskFlow extension installed. Now only the browser with the extension (e.g., Comet) appears in the dropdown.

**Result:**
- Tracking Browser dropdown only shows browsers with the extension installed
- User can select which browser has the extension from the dropdown
- Setting persists to preferences file
- Other browsers without extension are excluded from the dropdown options

### 2026-04-21 — OpenRouter AI Integration Fix & Test Button

**What Changed:**
1. ✅ Fixed OpenRouter API connection: Added required headers (`HTTP-Referer`, `X-Title`)
2. ✅ Added system prompts for both color generation and categorization
3. ✅ Changed model from `anthropic/claude-sonnet-4-5` to `anthropic/claude-3.5-sonnet` (standard OpenRouter model name)
4. ✅ Added model fallback list: `['anthropic/claude-3.5-sonnet', 'anthropic/claude-3-sonnet', 'openai/gpt-4o-mini', 'google/gemini-flash-1.5']`
5. ✅ Added `extractJsonFromResponse()` helper to parse JSON from markdown code blocks
6. ✅ Added comprehensive error handling: HTTP status checks, error object parsing, try-catch with detailed logging
7. ✅ Added `test-openrouter-key` IPC handler to verify API key works
8. ✅ Added "Test Connection" button in Settings > General next to API key input
9. ✅ Shows real-time test status: testing / success (green with model name) / error (red with message)
10. ✅ Added detailed console logging at every step for debugging

**Files Modified:**
- `src/main.ts` - Added system prompts, proper headers, JSON extraction helper, test endpoint, detailed logging
- `src/preload.ts` - Added `testOpenRouterKey` API binding
- `src/pages/SettingsPage.tsx` - Added Test Connection button with status indicators

**Why:** AI features were returning empty `{}` despite API key being loaded. Root causes were: missing OpenRouter headers, wrong model name, no JSON extraction from markdown blocks.

**Result:**
- OpenRouter API now connects properly with required headers
- AI responses are correctly parsed even if wrapped in markdown code blocks
- Users can test their API key before using Magic Color/Category
- Clear error messages if something goes wrong

### 2026-04-21 — Settings Page Grid Layout, API Key & Save Bar

**What Changed:**
1. ✅ Fixed AI API key loading: Added `dotenv` package, loaded `.env` file in main.ts
2. ✅ Added `getOpenRouterApiKey()` helper: checks preferences first, then env var fallback
3. ✅ Added OpenRouter API key input field in Settings > General tab (password type, saves to preferences)
4. ✅ Redesigned Colors tab with responsive grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
5. ✅ Colors tab now shows ALL items without scrolling container (grid layout fills space)
6. ✅ Added counter badge to Colors tab header (shows `{count} apps/websites`)
7. ✅ Implemented Discord-style bottom save bar: fixed to bottom, slide-up animation, shows "You have unsaved changes" with Reset and Save Changes buttons
8. ✅ Connected unsaved changes warning modal in App.tsx (already existed) to SettingsPage via `onHasChangesChange={setSettingsHasChanges}`
9. ✅ Removed duplicate warning modal from SettingsPage (App.tsx handles it)
10. ✅ Removed floating Save button from header (replaced by bottom bar)

**Files Modified:**
- `src/main.ts` - Added dotenv config, `getOpenRouterApiKey()` helper, updated AI handlers
- `src/pages/SettingsPage.tsx` - Added API key input, grid layout, bottom save bar, removed duplicate modal
- `src/App.tsx` - Passed `onHasChangesChange={setSettingsHasChanges}` to SettingsPage
- `package.json` - Added `dotenv` dependency

**Why:** User requested: grid layout for colors (not scroll list), API key editable in UI, Discord-style save bar, better space usage

**Result:**
- Colors tab shows responsive grid with 2-4 columns based on screen size
- OpenRouter API key can be set in Settings > General (persists to preferences)
- AI features now work with key from either preferences or .env file
- Discord-style bottom bar appears when unsaved changes exist
- App-level warning modal shows when navigating away with unsaved changes

### 2026-04-21 — Settings Page UI Revamp & Redesign

**What Changed:**
1. ✅ Removed duplicate "Category Assignments" vertical list section (150+ lines deleted)
2. ✅ Category tab: Added Show More/Less button to expand app carousel from 5 items → 15 items (3 rows)
3. ✅ Category tab: Added individual sparkle AI buttons on each app/website card (subtle, always visible, top-right corner)
4. ✅ Category tab: Styled Magic Category button with flat design (removed gradients, using `bg-zinc-800 hover:bg-zinc-700 border border-zinc-600`)
5. ✅ Colors tab: Complete redesign - now shows ALL apps/websites in compact list layout (no pagination, no hiding)
6. ✅ Colors tab: Each item shows color bar, name, category badge, and individual sparkle AI button
7. ✅ Colors tab: Scrollable container with `max-h-[500px]` for all items
8. ✅ Colors tab: Kept Apps/Websites toggle and search filter
9. ✅ Colors tab: Styled Magic Color button with flat design (no gradients)
10. ✅ Added `appCarouselExpanded` and `domainCarouselExpanded` state variables
11. ✅ Cleaned up unused variables: `colorExpanded`, `openColorPicker`, `maxAppPage`, `maxDomainPage`

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Major redesign of Category and Colors tabs

**Why:** User requested: no duplicate sections, expand to show more items (5→15), individual AI buttons per item, flat/professional button design, show ALL colors without hiding

**Result:**
- Category tab: Clean carousel with expand button (5→15 items), individual AI sparkle buttons, flat Magic Category button
- Colors tab: Compact scrollable list showing ALL apps/websites with color bars, category badges, individual AI sparkle buttons, flat Magic Color button
- No more duplicate sections
- Professional flat design throughout

### 2026-04-21 — Settings Page Complete Features Implementation

**What Changed:**
1. ✅ Fixed ColorPicker component to use rectangle/line style (w-16 h-3 / w-20 h-4) instead of circles
2. ✅ Added Apps/Websites toggle to Colors tab with colorTab state
3. ✅ Added expandable 5x3 grid layout for app colors (5 items default, 15 expanded)
4. ✅ Added Show More/Show Less button with ChevronUp/ChevronDown icons
5. ✅ Added Magic Color button with Sparkles icon and AI generation flow
6. ✅ Added Magic Category button to Applications and Websites sections
7. ✅ Added color search filter input in Colors tab
8. ✅ Added all required state variables: colorTab, colorExpanded, colorSearchFilter, openColorPicker, generatingColors, pendingColors, preAiColors, generatingCategories, pendingCategories, preAiCategories
9. ✅ Added generateAIColors and generateAICategorization to preload.ts
10. ✅ Added generate-ai-colors and generate-ai-categorization IPC handlers to main.ts using OpenRouter API
11. ✅ Added Sparkles and ChevronUp imports to SettingsPage.tsx

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Complete Colors tab redesign with rectangle color pickers, 5x3 grid, Apps/Websites toggle, Magic Color button, expandable layout
- `src/preload.ts` - Added generateAIColors and generateAICategorization API bindings
- `src/main.ts` - Added OpenRouter API integration for AI color generation and AI categorization

**Why:** Settings page was missing required features from documentation: rectangle color pickers, expandable grids, Apps/Websites toggle, and Magic Color/Category AI features

**Result:**
- Color pickers are now line/rectangle style (not circles)
- Colors tab shows 5 apps by default, expandable to 15
- Toggle between Apps and Websites color editing
- Magic Color button generates brand-appropriate colors via AI
- Magic Category button auto-categorizes apps/websites via AI
- Search filter for finding specific apps/websites

### 2026-04-21 — IDE Projects AI Charts & Agent Analytics Restoration

**What Changed:**
1. ✅ Fixed ALL bar charts not rendering — added `BarElement` and `LineElement` to `ChartJS.register()` (was missing, causing silent failures)
2. ✅ Added `message_count` and `project_path` columns to `ai_usage` table with safe ALTER TABLE migration
3. ✅ Fixed Claude Code parser to recursively scan subdirectories (including `subagents/`) for all `.jsonl` files
4. ✅ Fixed Qwen parser to count actual user+assistant message exchanges
5. ✅ Fixed OpenCode parser to extract message counts from SQLite database
6. ✅ Updated `get-ide-projects-overview` to return REAL `messageCount` (was aliasing token sum as messages)
7. ✅ Added project breakdown per AI agent (which projects each AI is used on)
8. ✅ Added model breakdown per AI agent (which models were used and how much)
9. ✅ Enhanced agent detail popup: widened to `max-w-4xl`, added 6 top metrics (tokens, messages, cost, sessions, tokens/msg, cost/session)
10. ✅ Added Project Breakdown section to agent popup
11. ✅ Added Model Breakdown section to agent popup
12. ✅ Added Multi-Agent Comparison chart with grouped bars + agent selector checkboxes
13. ✅ Added sparklines (7-day token trend) to each active agent card
14. ✅ Added AI Leaderboard cards: Most Active + Most Efficient
15. ✅ Added Export CSV button for AI usage data
16. ✅ **Fixed app freeze during AI sync** — added `setImmediate` yielding between plugins and every 10 files during parsing
17. ✅ **Massive sync speedup** — wrapped DB inserts in transactions with 100-record batches (was 1 insert = 1 disk write)
18. ✅ Added yielding to Claude and Qwen `parseDir` loops so large directories don't block the main thread
19. ✅ Agent popup top metrics now show **period-specific totals** — when you switch chart to 7D/30D/All, the Tokens/Messages/Cost/Sessions/efficiency numbers update to match that period
20. ✅ **Fixed terminal layout console spam** — added missing IPC handlers for `get-terminal-layouts` and `save-terminal-layout` in main.ts
21. ✅ Terminal layout hook now logs errors only once per project instead of every retry
22. ✅ **Fixed terminal page console spam** — added stub IPC handlers for `get-terminal-presets`, `spawn-terminal`, `resize-terminal`, `kill-terminal`, `send-terminal-input`, `get-terminal-sessions`
23. ✅ TerminalPage now deduplicates error logs using `logOnce()` helper
24. ✅ **Implemented full terminal window management** — `create-terminal-window` opens a new BrowserWindow with embedded terminal, `spawn-terminal` launches PowerShell/bash PTY, bidirectional I/O streaming
25. ✅ **Added terminal preset CRUD** — `add-terminal-preset`, `remove-terminal-preset`, `execute-terminal-preset` with DB persistence
26. ✅ **Added terminal session tracking** — `save-terminal-session`, `get-terminal-sessions`, `get-terminal-session-resume-id` for chat-to-terminal mapping
27. ✅ **Terminal control flow**: Select project → "Open Terminal" button → creates new window → spawns shell → streams output
28. ✅ **Implemented node-pty based TerminalManager** — Proper PTY spawning with `node-pty` library for full terminal functionality (input/output working)
29. ✅ **Fixed terminal I/O** — Added `terminal:create`, `terminal:write`, `terminal:resize`, `terminal:destroy` IPC handlers using TerminalManager
30. ✅ **Added terminal data forwarding** — Data from PTY is forwarded to xterm.js for rendering

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` — Fixed ChartJS.register, enhanced agent popup, added comparison chart, sparklines, leaderboard, export
- `src/main.ts` — Fixed Claude/Qwen/OpenCode parsers, added DB columns, updated overview query with project/model breakdowns

**Why:** User reported AI charts were completely broken (no rendering), message counts were actually token counts, Claude subagents were missed, and agent popup lacked detail

**Result:**
- All bar charts now render correctly on overview, AI tab, agent popup, and comparison
- Message counts are actual message exchanges, not token sums
- Claude Code now reads ALL `.jsonl` files including nested `subagents/` directories
- Agent popup shows rich breakdown: projects, models, efficiency metrics
- Users can compare multiple AIs side-by-side with grouped bar chart
- Agent cards show 7-day sparkline trend

### 2026-04-21 — Browser Tracking Fix + Live Logs + Productivity Redesign

**What Changed:**
1. ✅ Fixed multi-window browser tracking bug: `chrome.windows.onFocusChanged` handler now uses `windowId` from event instead of `currentWindow: true`
2. ✅ Fixed browser data not saving: first periodic sync now creates a new session instead of being skipped
3. ✅ Fixed browser tracking when not focused: desktop app now checks `is_browser_focused` flag and skips data when browser is not active
4. ✅ Added Live Activity Logs to dashboard showing app/browser/IDE detection events in real-time
5. ✅ Added `/browser-log` HTTP endpoint for streaming live events from extension to desktop
6. ✅ Added `onBrowserTrackingEvent` IPC channel for renderer communication
7. ✅ Added BrowserActivityPage Live Detection panel with save-to-txt button
8. ✅ Added auto-refresh (10s) to BrowserActivityPage for live data updates
9. ✅ Added Refresh button to DatabasePage
10. ✅ Redesigned Total Time calculation: browser apps now excluded from app time (tracked via browser extension instead)
11. ✅ Added "Main Browser" setting in Settings > General (dropdown with Chrome/Firefox/Edge/etc.)
12. ✅ Centralized ALL_BROWSER_APPS list in main.ts with `getMainBrowser()`/`isMainBrowserApp()` helpers
13. ✅ ProductivityPage redesign: Apps vs Websites comparison with productivity scores per type
14. ✅ ProductivityPage now shows per-type productivity bars (productive/neutral/distracting for apps vs websites)
15. ✅ Insights card now shows App Time, Website Time, and Total Tracked
16. ✅ Fixed missing terminal APIs in preload.ts (getTerminalLayouts, spawnTerminal, etc.)

**Files Modified:**
- `browser-extension/background.js` - Fixed windowId in onFocusChanged handler
- `src/main.ts` - Added ALL_BROWSER_APPS, is_browser_focused check, /browser-log endpoint, browser tracking event streaming
- `src/preload.ts` - Added terminal APIs, onBrowserTrackingEvent
- `src/App.tsx` - Added liveActivityLogs state, BROWSER_APPS exclusion from timeByCategory/timeBreakdown, live activity panel on dashboard
- `src/pages/BrowserActivityPage.tsx` - Added Live Detection panel, auto-refresh, save-to-txt
- `src/pages/ProductivityPage.tsx` - Apps vs Websites comparison, per-type productivity scores, progress bars
- `src/pages/DatabasePage.tsx` - Added Refresh button
- `src/pages/SettingsPage.tsx` - Added Main Browser dropdown setting with persistence

**Why:** 
1. Browser tracking wasn't working for chess/other websites because `currentWindow:true` queried the extension popup instead of the actual browser window
2. First periodic sync was skipped due to `is_periodic=true` check, preventing new sessions from being created
3. Browser data was being recorded even when browser wasn't focused, causing incorrect "website" tracking
4. Total time was double-counting: browser app time + website time = inflated totals
5. Terminal page was crashing due to missing APIs in preload

**Result:** 
- Browser tracking now correctly identifies which browser window is focused across multiple instances
- Website data is properly recorded and shows up in BrowserActivityPage with auto-refresh
- Dashboard "Total Time" no longer double-counts browser app time
- Productivity page shows clear Apps vs Websites comparison with individual productivity scores
- Main Browser can be configured in Settings to exclude from app tracking

**What Changed:**
1. ✅ Removed all project detail popup/modal (lines 1858-1952) - NO MORE POPUPS
2. ✅ Converted project cards to expandable accordion style (click chevron to expand)
3. ✅ Added inline expanded sections: Health Score, Git info, Recent Sessions, Presets, Tools
4. ✅ Single "Open in IDE" + "Open Workspace" buttons per card (removed duplicate)
5. ✅ Lazy-load project details on first expand (better performance)
6. ✅ Added health %, session count, tool count badges tocollapsed view
7. ✅ Fixed missing TerminalPage import (was causing ReferenceError)

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Complete redesign of project cards

**Why:** User complained popup showed too little info and wanted expandable cards instead of popup

**Result:** Projects now show rich inline expandable cards with Health, Git, Sessions, Presets, Tools - NO POPUPS required

**Related Issues:**
- Resolves: "Project detail popup shows too little" (was: project details modal)

### 2026-04-20 — Settings Page Line-Style Redesign

**What Changed:**
1. ✅ Converted app carousel to vertical line-style list (no more arrows)
2. ✅ Added App/Website toggle button
3. ✅ Both apps and websites now show in scrollable list
4. ✅ Click to edit category inline

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Converted Application section to line style

**Why:** User said Settings reverted to old carousel design

**Result:** Settings now shows apps/websites in vertical list with toggle

### 2026-04-20 — Productivity Page Filter Fix

**What Changed:**
1. Removed "Show All" button from category filter
2. Changed default filter from 'all' to 'productive'
3. Fixed layout: buttons now horizontally laid out (was incorrectly stacked vertically)
4. Removed 'all' from tierFilter type — only 3 categories now: productive, neutral, distracting
5. Changed website data source from pre-filtered to all-websites (so all categories work)

**Files Modified:**
- `src/pages/ProductivityPage.tsx` - Fixed filter UI and logic

**Why:** User reported weird layout and apps not showing correctly when "Show All" was clicked

**Result:** Initially loads productive apps/websites; filter buttons displayed in a row; all 3 categories now filter correctly

### 2026-04-20 — Browser Activity Page - Main Browser Config

**What Changed:**
1. Added main browser selector dropdown to Browser Activity page
2. Dropdown detects available browsers via IPC (checks actual browser executables)
3. Shows info text: "Excludes [browser] browsing time from stats (tracked via extension instead)"

**Files Modified:**
- `src/pages/BrowserActivityPage.tsx` - Added browser detection and selector UI
- `src/main.ts` - Added `get-available-browsers` IPC handler

**Why:** Main browser config should be on Browser page, not Settings

### 2026-04-20 — Settings Page Duplicate Fix

**What Changed:**
1. Added `motion` import to framer-motion (was only `AnimatePresence`)
2. Hid duplicate category tab block with `{false && ...}` instead of deleting (prevents breaking file)
3. Kept all carousel features intact

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Added motion import, hid duplicate

**Why:** The duplicate was causing old design to render over new

**Result:** Settings now shows carousel design, no duplicate

### 2026-04-20 — Settings Page Duplicate Removed

**What Changed:**
1. Removed duplicate `{activeTab === 'category'}` block that was causing old design to render over new
2. The file had TWO category tab sections - first one (new carousel) and second one (old list)
3. Deleted the old duplicate section

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Removed 220+ lines of duplicate old design

**Why:** The Settings page was showing old "Category Assignments" list design because of duplicate code blocks

**Result:** Settings now shows carousel design with no duplicate

### 2026-04-20 — Pie Chart Time Formatting (BrowserActivityPage)

**What Changed:**
1. Category pie chart now stores raw ms (not minutes)
2. Tooltip now correctly shows formatted duration
3. Legend now shows formatted duration per category

**Files Modified:**
- `src/pages/BrowserActivityPage.tsx` - Fixed categoryChartData and categoryPieOptions

**Result:** Pie chart hover shows "2h 30m" instead of raw numbers

---

### 2026-04-20 — AI Color Magic (v1.44)

**What Changed:**
1. Added OpenRouter API integration in main.ts for auto-generating colors
2. "Magic Color" button in Settings → Colors tab
3. Creates .env.example with OPENROUTER_API_KEY placeholder

**Files Modified:**
- `src/main.ts` - Added generate-ai-colors IPC handler
- `src/preload.ts` - Added generateAIColors to API
- `.env.example` - Created with API key placeholder

**Why:** Users can auto-generate colors for all apps/websites using AI

**Result:** Click "Magic Color" button to generate brand-appropriate colors for all items

### 2026-04-19 — Terminal Features UI (v1.44)

**What Changed:**
1. Layout persistence: Now saves to SQLite (not localStorage), restores on restart
2. TerminalPage sidebar: Presets tab (add/edit/delete/execute commands)
3. Sessions tab: Shows past sessions with date, agent, topic, cost
4. Resume button: Injects resume command (claude resume <id> or opencode resume <id>)
5. Close button on panes: Added ✕ button to close splits
6. Project filter dropdown in terminal header

**Files Modified:**
- `src/hooks/useTerminalLayout.ts` - SQLite persistence instead of localStorage
- `src/components/TerminalWindow.tsx` - Close button, loading state, event listener
- `src/pages/TerminalPage.tsx` - COMPLETELY REWRITTEN: sidebar with Presets/Sessions tabs

**Result:** Full terminal workspace with command presets and session history in sidebar

### 2026-04-19 — Planetary/Galaxy Category Fix (v1.44)

**What Changed:**
1. Fixed `computePlanets()` in OrbitSystem.tsx - Now reads database category from log.category BEFORE falling back to hardcoded APP_CATEGORIES dict
2. Fixed `computeWebsitePlanets()` - Same priority fix: user override → database category → 'Uncategorized'
3. Fixed ActivityLog interface in OrbitSystem.tsx - Added missing browser fields (is_browser_tracking, domain, url, duration_ms)

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Lines 554-557 (computePlanets), 2033-2035 (computeWebsitePlanets), 341-353 (interface)

**Why:** Planetary/Galaxy visualizations were using hardcoded APP_CATEGORIES dict instead of the actual category stored in the database. The priority is now: user override → database category → fallback dict → 'Other'

**Result:** Planetary (Apps) and Galaxy (Websites) now show the same categories as the Apps page and Database

### 2026-04-19 — Fixed Website List Always Loads All Sites (v1.44)

**What Changed:**
1. Added new IPC handler `get-all-browser-domain-stats` that queries all website data without time filtering
2. Added `allWebsiteStats` state in App.tsx that loads once on mount
3. Updated Settings page to use all-time data regardless of period selection
4. Both Category and Colors tabs now show all websites from the database

**Files Modified:**
- `src/main.ts` - Added `getAllBrowserDomainStats()` function and IPC handler
- `src/preload.ts` - Added `getAllBrowserDomainStats` API
- `src/App.tsx` - Added `allWebsiteStats` state and loading effect

**Result:** Website lists in Settings now show ALL websites from database, ignoring time period selection

### 2026-04-19 — Expandable App/Website Carousels (v1.43)

**What Changed:**
1. Added expandable carousel to Applications section: Click expand button to show 3 rows of 5 (15 apps) vs 1 row of 5
2. Added expandable carousel to Websites section: Same functionality
3. Carousel resets to page 0 when expanding/collapsing to prevent out-of-bounds

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Added appCarouselExpanded, domainCarouselExpanded state; modified carousel rendering

**Result:** Carousels now show 15 items when expanded, 5 items when collapsed

### 2026-04-19 — Terminal Features + Database Fix (v1.43)

**What Changed:**
1. Database: Wrapped ALTER TABLE in try-catch to prevent data loss when columns already exist
2. Terminal layouts: Added persistence via localStorage hook
3. Terminal presets: Added SQLite table + IPC handlers
4. Terminal sessions: Added SQLite table + IPC handlers for resume
5. Project health: Added health score calculation IPC
6. Fixed duplicate Add Project modal in Projects tab

**Files Modified:**
- `src/main.ts` - New tables (terminal_layouts, terminal_presets, terminal_sessions), new IPC handlers
- `src/preload.ts` - Added terminal preset/session/layout APIs
- `src/App.tsx` - Added terminal API types
- `src/hooks/useTerminalLayout.ts` - NEW: Layout persistence hook
- `agent/debugging.md` - Added ALTER TABLE pattern

### 2026-04-19 — IDE Projects Fixes (v1.42)

**What Changed:**
1. Fixed duplicate tools: Tool IDs now deterministic (e.g., `git`, `npm-google/gemini-cli`) instead of `tool-${Date.now()}`
2. Added Reset Tools button: Clears all tools from DB, allows fresh re-scan
3. Fixed Add Project modal: Added error display, loading state, proper feedback
4. Fixed AI chart: Backend now returns `daily` breakdown per tool for chart rendering
5. Removed "How Counts" from Tools tab, added to each AI agent detail modal
6. Removed duplicate Add Project button from header

**Files Modified:**
- `src/main.ts` - Deterministic tool IDs, reset-tools handler, daily breakdown query
- `src/preload.ts` - Added resetTools API
- `src/App.tsx` - Added resetTools type
- `src/pages/IDEProjectsPage.tsx` - Multiple UI fixes

**What Changed:**
1. Added 8 new issues to PROBLEMS.md (Issues #23-#30)
2. Created fix plan document at `agent/docs/ide-fixes-plan.md`
3. Issues include: duplicate tools, broken Add Project modal, AI chart not updating

**Files Modified:**
- `agent/PROBLEMS.md` - Added Issues #23-#30
- `agent/docs/ide-fixes-plan.md` - New fix plan document

### 2026-04-19 — IDE Projects UI Fixes (v1.40)

**What Changed:**
1. Added "Add Project" button to main header (always visible)
2. Created modal dialog for adding projects from any tab
3. Added "Terminal" to sidebar navigation for Terminal Window access
4. Simplified button styling - removed colorful gradients, using clean zinc/indigo theme
5. Used flex-wrap for buttons to prevent crowding in one row

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Simplified header, added modal
- `src/App.tsx` - Added Terminal to sidebar items

### 2026-04-19 — IDE Help Page (v1.39)

**What Changed:**
1. Created dedicated help page for IDE Projects (`/ide-help` route)
2. Added Help button link in IDE Projects page header
3. Comprehensive help content covering all features

**Files Added:**
- `src/pages/IDEHelpPage.tsx` - Help page with expandable topics

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Added Help button link
- `src/App.tsx` - Added `/ide-help` route

**Why:** User requested a separate help/features page for IDE Projects since there's a lot of functionality that was confusing to discover

### 2026-04-19 — Terminal Window Feature (v1.38 — Initial)

**What Changed:**
1. Added multi-window support to Electron - Terminal Window opens alongside main DeskFlow window
2. Added PTY backend using `node-pty` - Spawns pseudo-terminals that stream to frontend
3. Added xterm.js integration - Terminal emulator in React via `@xterm/xterm`
4. Added recursive tiling layout structure in frontend (`TerminalLayout` component)
5. Added `/terminal` route to access Terminal Window UI

**Files Added:**
- `src/components/TerminalWindow.tsx` - Terminal pane and tiling layout components
- `src/pages/TerminalPage.tsx` - Terminal Window page with xterm.js
- `src/node-pty.d.ts` - TypeScript declarations for node-pty

**Files Modified:**
- `src/main.ts` - Added Terminal Window creation and PTY management IPC handlers
- `src/preload.ts` - Added terminal IPC bridge (`spawnTerminal`, `writeTerminal`, `resizeTerminal`, `killTerminal`, `onTerminalData`, `onTerminalExit`)
- `src/App.tsx` - Added TerminalPage import and route

**Why:** First step toward spec goal of "AI Agent Terminal Manager" - creating the Execution Environment (Terminal Window) that will run AI agents like Claude, OpenCode, etc.

### 2026-04-19 — Heatmap: Fix missing today data + show live session

**What Changed:**
1. **Root cause of empty heatmap:** `targetWeekStart` wasn't zeroed to midnight — it kept the current time component (e.g., Sunday 14:30 instead of Sunday 00:00). This caused the filter `sessionStart < targetWeekStart` to exclude all logs from earlier today. On Sunday specifically (week start = today), this meant almost the entire day was filtered out.
2. Added `currentWeekStart.setHours(0, 0, 0, 0)` in heatmap calculation AND week label calculation
3. Also added live current session to heatmap (so ongoing work shows in real-time)

**Files Modified:**
- `src/App.tsx` — Fixed `targetWeekStart` to zero time component; added live session to heatmap

**Why:** The `setDate()` method doesn't zero the time portion. Since `targetWeekStart` included the current time (e.g., 14:30), any log with a timestamp before 14:30 on Sunday was excluded from the heatmap, making today look empty.

### 2026-04-19 — Heatmap: Live Current Session

**What Changed:**
1. Added the current active session to the heatmap in real-time — previously, the heatmap only showed completed sessions from the database, so it looked like "nothing was being recorded" for today
2. Refactored heatmap `useMemo` to use a shared `addSession()` helper, added logic to inject the current `sessionStart` + `elapsedTime` when viewing the current week (`weekOffset === 0`)
3. Added `isTracking`, `currentApp`, `elapsedTime`, `sessionStart` to the `useMemo` dependency array

**Files Modified:**
- `src/App.tsx` — heatmap `useMemo` now includes live current session data

**Why:** The heatmap only renders completed sessions (written to DB when you switch apps). Your current active session doesn't appear until you switch tasks, making it look like "today has no activity." Now the live session is shown in real-time.

### 2026-04-19 — Tailwind v4 CSS Build Fix (CRITICAL)

**What Changed:**
1. Fixed `src/index.css` — replaced Tailwind v3 directives (`@tailwind base/components/utilities`) with v4 directive (`@import "tailwindcss"`)
2. This was the root cause of ALL broken styling — v3 directives don't trigger content scanning in Tailwind v4, so only ~14KB of CSS was generated (custom styles + a few utilities) instead of the proper ~68KB

**Files Modified:**
- `src/index.css` — Changed from `@tailwind base; @tailwind components; @tailwind utilities;` to `@import "tailwindcss";`

**Why:** Tailwind v4 completely changed how CSS is configured. The old `@tailwind` directives are v3 syntax and don't work properly with v4 — they don't trigger automatic content detection, so most utility classes were missing from the build output.

**Result:** CSS went from 14KB (broken/missing most utilities) to 68KB (complete with all utilities). All bg-zinc-*, text-zinc-*, border-zinc-*, spacing, and color classes now present.

### 2026-04-18 — Solar System Animation Glitch Fix

**What Changed:**
1. **Fixed animation glitch causing planets to jump randomly every ~0.5 seconds**
2. **Added interaction detection** - tracks mouse down/up and wheel events to prevent state changes during user interaction
3. **Removed forced view mode exit** - commented out code that forced exit from solar system to galaxy when crossing threshold, this was the root cause
4. **Made planet angle stable** - changed from random to seeded by planet name, so position stays consistent even if component remounts

**Root Cause:**
- 500ms interval was checking camera position and forcing `setViewMode('galaxy')` when crossing the apps/websites threshold
- This happened during ANY camera movement including mouse interactions
- Also added 1-second cooldown after user interactions before any state changes

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Added interaction tracking refs and cooldown, removed forced view mode exit, stable angle init

**Build:** ✅ Successful

---

### 2026-04-18 — AI Agent Data Storage Research + Parsing Fixes

**What Changed:**

**1. Research Findings Documented:**
- Created `agent/docs/11-ai-agent-data-storage-research-18042026/result.md`
- Researched storage locations, file formats, and token tracking for 8+ AI agents
- Found actual data structures for Claude Code, Cursor, OpenCode, Gemini CLI, Aider, Windsurf

**2. Claude Code Parsing Fixed:**
- Updated to match actual JSONL format: `entry.message.usage.input_tokens`
- Looks at `entry.type === "assistant"` with `entry.message.usage`
- Gets model from `entry.message.model`
- Handles cache tokens from `entry.message.usage.cache_read_input_tokens`

**3. Cursor Parsing Updated:**
- Now queries `cursorDiskKV` table (newer Cursor format)
- Looks for keys like `bubbleId:*` which contain chat data with token counts
- Parses `data.tokenCount.inputTokens/outputTokens`
- Falls back to `ItemTable` for older format

**4. OpenCode - Already Working:**
- Uses SQLite `sessions` table with `prompt_tokens`, `completion_tokens`, `cost`

**5. IDE Detection - JetBrains via where command:**
- Added `where idea`, `where pycharm`, `where webstorm`, etc. detection

**6. Folder Picker:**
- Added native folder picker for project path selection

**Files Modified:**
- `src/main.ts` - Updated Claude Code and Cursor plugins with proper parsing
- `agent/docs/11-ai-agent-data-storage-research-18042026/` - Research documents
- `src/pages/IDEProjectsPage.tsx` - Folder picker button

**Build:** ✅ Successful

---

### 2026-04-18 — Context Maintenance Infrastructure: Graphify Fix + Maintain-Context Skill

**What Changed:**
1. Fixed empty GRAPH_REPORT.md — regenerated from existing graph.json/analysis.json data with proper community labels
2. Synced graphify-out/ to Obsidian vault (GRAPH_REPORT.md, graph.json, analysis.json, graph.html, manifest.json)
3. Created `agent/skills/maintain-context/SKILL.md` — automated post-task context sync skill
4. Rewrote `AGENTS.md` to reference maintain-context skill instead of manual update steps
5. Documented which agent .md files are still relevant vs redundant with graphify

**Files Modified:**
- `graphify-out/GRAPH_REPORT.md` — regenerated with 130 lines, labeled communities
- `AGENTS.md` — replaced old graphify section with maintain-context skill reference
- `agent/skills/maintain-context/SKILL.md` — new: post-task knowledge sync skill

**Why:** GRAPH_REPORT.md was empty/broken, making the AGENTS.md instruction to "read it first" useless. The maintain-context skill automates what was previously a manual, error-prone process.

**Result:** AI agents can now automatically run maintain-context after completing tasks, keeping graphify, state.md, PROBLEMS.md, debugging.md, and data.md in sync.

**Build:** ✅ Successful

---

### 2026-04-18 — IDE Projects: Folder Picker and Improved JetBrains Detection

**What Changed:**

**1. Folder Picker for Project Path:**
- Added native folder picker button next to Project Path input
- Click the folder icon to open Windows Explorer-style folder selection dialog
- Selected path automatically fills the Project Path field

**2. Improved JetBrains Detection:**
- Added `where` command detection for JetBrains IDEs (like VS Code)
- Now checks for: `idea`, `idea64`, `pycharm`, `pycharm64`, `webstorm`, `webstorm64`, `goland`, `goland64`, `rider`, `rider64`
- Works for both Toolbox-installed and directly-installed JetBrains IDEs

**Files Modified:**
- `src/main.ts` - Added `pick-folder` IPC handler, JetBrains `where` command detection
- `src/preload.ts` - Added `pickFolder` binding
- `src/App.tsx` - Added type definition
- `src/pages/IDEProjectsPage.tsx` - Added folder picker button next to path input

**Build:** ✅ Successful

---

### 2026-04-18 — Smart Website Categorization UI Improvements

**What Changed:**

**1. Domain Selection - Dropdown Instead of Text Input:**
- Changed from free text input to dropdown select populated from visited websites
- Only shows websites from `domainStats` that user has actually visited
- Filters out websites that already have keyword rules configured
- Shows category info in dropdown (e.g., "youtube.com (Entertainment)")

**2. Keyword Input - Tag/Chip System:**
- Replaced comma-separated text input with visual tag/chip system
- Each keyword displayed as removable chip with X button
- Input field + "Add" button to add new keywords
- Press Enter or click Add to add keyword
- Keywords shown as green chips for easy visibility
- Empty state: "No keywords added yet" when no keywords exist

**3. Fixed Editing Existing Keyword Rules:**
- When clicking "Configure" on existing domain, keywords now load properly
- Added `editingKeywords` state to track keywords being modified
- Keywords properly sync between `editingKeywords` and `domainKeywords` states
- Both add and remove operations update both states for consistency

**4. Improved Save Flow:**
- Save button now uses `editingKeywords` consistently for both new and existing domains
- Properly updates both frontend and backend state on save
- Resets all temporary states after save (editingKeywords, tempKeywordInput, newKeywordDomain)
- Added disabled state on save button when no domain selected

**5. Productivity Page Time Calculation Fix:**
- Fixed mismatch between header time and displayed items
- Header now shows sum of displayed items (top 5), not total app/website time
- Added `displayedAppSeconds` and `displayedWebsiteSeconds` calculations
- Shows "Xh Xm (Y% of total)" format for clarity

**6. Productivity Page Website Details Enhancement:**
- Websites section now shows ALL websites (up to 10), not just top 5 productive
- Each website shows category badge with color (Education, Entertainment, etc.)
- Shows "via keywords" indicator for keyword-categorized sites
- Shows checkmark (✓) for productive websites
- Added `getCategoryColor()` function for color-coded categories
- Fixed `isCurrentHour` type error in daily trend data

**7. Productivity Page Websites Section Redesign:**
- **Filter Logic:** Only shows websites that are:
  - Set to productive category (Education, Productivity, etc.) OR
  - Configured as "smart website" in Settings (has keyword rules)
- **Grouped by Domain:** Websites grouped by domain (youtube.com, reddit.com, etc.)
- **Expandable Subpages:** Click domain to expand/collapse showing individual page titles
- **Page Details:** Each subpage shows title (truncated), category badge, duration
- **Persisted Expand State:** Expand state saved to localStorage, persists across page navigations
- **Smart Website Indicator:** Shows "Smart website" badge for domains with keyword rules
- **Props Added:** `domainKeywordRules` prop to ProductivityPage
- **State Management:** `expandedDomains` state with `toggleDomain` function

**Files Modified:**
- `src/pages/ProductivityPage.tsx` - Website section redesign with grouped domains and expandable subpages
- `src/App.tsx` - Added `domainKeywordRules` state and pass to ProductivityPage

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Smart Website Categorization UI overhaul with dropdown and tag input
- `src/pages/ProductivityPage.tsx` - Website details enhancement, category colors, fixed type errors, websites section redesign
- `src/App.tsx` - Added domainKeywordRules state and pass to ProductivityPage
- `src/pages/ProductivityPage.tsx` - Fixed time calculation to show sum of displayed items

**How It Works Now:**
1. Go to Settings → Category tab
2. Click "Add Domain" in Smart Website Categorization section
3. Select website from dropdown (e.g., "youtube.com")
4. Add keywords by typing and pressing Enter (e.g., "tutorial", "course")
5. Choose default category (Entertainment)
6. Click "Add Domain" to save
7. Existing rules show keyword count and default category
8. Click "Configure" to edit keywords - they load as chips

**Build:** ✅ Successful

---

### 2026-04-18 — Keyword-Based Productivity Categorization

**What Changed:**

**1. Configurable Keyword Rules:**
- Users can now configure which keywords mark a website as "productive"
- Default YouTube keywords: tutorial, course, lecture, learn, programming, etc.
- Keywords stored in categoryConfig as `domainKeywordRules`

**2. Per-Domain Default Categories:**
- Each website can have a default category when no keywords match
- YouTube defaults to "Entertainment"
- Reddit/Twitter default to "Social Media"

**3. Smart Website Categorization Section:**
- New section in Settings → Category tab
- Add/remove domains with custom keyword lists
- Configure default category per domain

**4. Backend Implementation:**
- Updated data model with `domainKeywordRules` and `domainDefaultCategories`
- Updated `categorizeDomain()` to check keyword rules BEFORE hardcoded logic
- Added 7 new IPC handlers for keyword management

**Files Modified:**
- `src/main.ts` - Updated categoryConfig data model, categorizeDomain() logic, new IPC handlers
- `src/preload.ts` - Added new API bindings
- `src/pages/SettingsPage.tsx` - Added Smart Website Categorization UI section

**Default Keywords for YouTube:**
```
tutorial, course, lecture, learn, class, university,
physics, mathematics, chemistry, biology, science,
programming, coding, javascript, python, typescript, react,
algorithm, data structure, web development,
crash course, lesson, study, exam, revision,
masterclass, workshop, training, how to build, from scratch
```

**How It Works:**
- When visiting youtube.com/watch?v=xxx:
  - If video title contains "tutorial" → categorized as "Education"
  - If video title contains "funny cats" → categorized as "Entertainment" (default)
- User can add more websites with custom keywords in Settings

**Build:** ✅ Successful

---

### 2026-04-18 — Settings: Color Customization Revamp

**What Changed:**

**1. Modern UI Redesign:**
- Redesigned Colors tab with gradient header and modern card-based design
- Each color item is now in beautiful cards with hover effects
- Color preview bars at the bottom of each card
- Smooth Framer Motion animations

**2. Apps/Websites Toggle:**
- Added toggle between Applications and Websites color modes
- Gradient toggle buttons (emerald for apps, blue for websites)
- Icons for visual distinction

**3. Website Color Support (NEW!):**
- Users can now customize colors for individual websites
- Website colors stored in localStorage as `deskflow-domain-colors`
- Toggle shows "Individual Websites" section when in Websites mode

**4. Settings Page Expand/Collapse:**
- "Show More" / "Show Less" buttons for Applications and Websites carousels
- Shows 5 apps (1 row) collapsed, 15 apps (3 rows) expanded
- Changed from flexbox to grid layout for multi-row display

**5. Removed Duplicate Section:**
- Removed duplicate "Category Assignments" section  
- Was redundant since carousel already allows category changes

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Complete Colors tab redesign with toggle, card-based design, website colors
- Added `colorEditMode` state ('apps' | 'websites')
- Added `domainColors` state for website color persistence
- Added `handleDomainColorChange()` handler function
- Added `Globe` icon import

**Build:** ✅ Successful

---

### 2026-04-17 — IDE Projects: Open Project in IDE

**What Changed:**

**1. Default IDE for Projects:**
- Added `default_ide` column to `projects` database table
- When adding a project, can select a default IDE from detected IDEs
- IDE selector dropdown shows all detected IDEs (VS Code, IntelliJ, PyCharm, etc.)

**2. Quick Open Button:**
- Project cards now show which IDE is configured (if any)
- "Open" button to quickly open the project in its default IDE
- Backend handler `open-project` launches the project in the specified IDE

**3. Open Commands by IDE:**
| IDE | Command |
|-----|---------|
| VS Code | `code "path"` |
| Cursor | `cursor "path"` |
| JetBrains | `"install_path" "path"` |
| Android Studio | `"studio64.exe" "path"` |
| Antigravity | `agy "path"` |

**Files Modified:**
- `src/main.ts` - Added `default_ide` column, `open-project` handler
- `src/preload.ts` - Added `openProject` IPC binding
- `src/App.tsx` - Added type definitions
- `src/pages/IDEProjectsPage.tsx` - IDE selector in Add Project form, Open button on project cards

**Build:** ✅ Successful

---

### 2026-04-17 — IDE Projects: Loading Overlay and JetBrains Detection Fix

**What Changed:**

**1. Scanning Loading Overlay:**
- Added full-screen loading overlay when "Scan Environment" is clicked
- Overlay blocks all user interaction until scan completes
- Shows animated progress bar and "Scanning Environment" message
- Prevents user confusion during the scanning process

**2. Improved JetBrains IDE Detection:**
- Enhanced JetBrains Toolbox detection to support multiple env file formats:
  - `.env.project` (older format)
  - `.env.vars` (newer format)
- Added recursive directory search to find IDE executables directly
- Added fallback detection for JetBrains IDEs installed directly (not via Toolbox)
- Searches in `%LOCALAPPDATA%\JetBrains\` subdirectories

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Added scanning loading overlay component
- `src/main.ts` - Enhanced JetBrains detection logic

**Build:** ✅ Successful

---

### 2026-04-17 — IDE Projects: UI Redesign, Setup Guide, and Improved IDE Detection

**What Changed:**

**1. UI Redesign - Dropdown Actions Menu:**
- Replaced "Scan Environment" button with "Actions ▼" dropdown menu
- Primary "Sync AI Usage" button stays visible and prominent
- Dropdown contains: Scan Environment, AI Debug Info, Setup Guide
- Cleaner header with less button clutter

**2. Setup Guide Modal:**
- Full setup guide with 4 steps displayed in a modal overlay
- Shows on first visit to IDE Projects page (can be disabled)
- Includes: Add Project, AI Tracking, Git Tracking, IDE Detection
- Real-time status indicators (detected/not found) for AI tools and IDEs
- Checklist showing what's been completed
- "Don't show again" checkbox (saves to localStorage)

**3. Improved IDE Detection:**
- Added Google Antigravity IDE detection (new AI IDE from Google)
- Added IntelliJ IDEA, PyCharm, GoLand via JetBrains Toolbox detection
- Added Android Studio detection (standalone installation)
- Improved Cursor detection with better path checking
- Async extension loading for VS Code (doesn't block IDE detection)

**4. Fixed Scan Environment Freeze:**
- Made scan-tools handler truly async with Promise.all batch processing
- Added 3-second timeout per command to prevent hanging
- Runs commands in batches of 5 to avoid overwhelming the system
- npm global packages detection runs in background

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Dropdown menu, Setup modal, onboarding state
- `src/main.ts` - Async IDE detection, JetBrains Toolbox support, Antigravity, async scan-tools

**IDE Detection Paths Added:**
| IDE | Windows Path |
|-----|-------------|
| Google Antigravity | `%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe` |
| IntelliJ IDEA | `%APPDATA%\JetBrains\Toolbox\apps\IDEA-U\...` |
| PyCharm | `%APPDATA%\JetBrains\Toolbox\apps\PyCharm-P\...` |
| Android Studio | `%LOCALAPPDATA%\Android\Sdk` |

**Build:** ✅ Successful

---

### 2026-04-17 — Website Color Selection in Settings (v1.25)

**What Changed:**
1. ✅ Added `allTimeWebsiteStats` computation in App.tsx from browserLogs
2. ✅ Added `websiteStats` prop to SettingsPage
3. ✅ Added `localWebsiteColors` state for website color management
4. ✅ Added `getWebsiteColor` and `handleWebsiteColorChange` functions
5. ✅ Added Website Colors section in Settings → Colors tab

**Files Modified:**
- `src/App.tsx` - Added allTimeWebsiteStats useMemo, passed to SettingsPage
- `src/pages/SettingsPage.tsx` - Added websiteColors handling and UI section

**Why:**
- Settings page only had Application Colors, missing Website Colors
- Website tracking data exists in browserLogs but wasn't displayed in Settings

**Result:**
- Settings → Colors tab now shows 3 sections: Category Colors, Application Colors, Website Colors
- Each website can have its color customized

**Build:** ✅ Successful

---

### 2026-04-17 — Electron App Freezing Fix (Memory Leak)

**What Changed:**
1. ✅ Removed React StrictMode from main.tsx (caused double-mounting/dup WebGL)
2. ✅ Added GLCleanup component in OrbitSystem.tsx for WebGL disposal
3. ✅ Reduced particle counts: Galaxy 8000→4000, Website 6000→3000, Stars 8000→3000
4. ✅ Lazy-loaded OrbitSystem with Suspense fallback
5. ✅ Added Chart.js cleanup in StatsPage.tsx

**Files Modified:**
- `src/main.tsx` - Removed StrictMode wrapper
- `src/components/OrbitSystem.tsx` - Added GLCleanup, reduced particles
- `src/App.tsx` - Lazy-loaded OrbitSystem
- `src/pages/StatsPage.tsx` - Added Chart.js destroy() cleanup
- `src/pages/ProductivityPage.tsx` - Removed framer-motion, added cleanup
- `src/pages/BrowserActivityPage.tsx` - Removed framer-motion, added isMountedRef

**Why:**
- App froze during page navigation after extended use
- OrbitSystem had 17K+ particles with procedural textures + post-processing
- React StrictMode caused double-mounting in dev, creating duplicate WebGL contexts
- Chart.js instances not destroyed on unmount

**Result:** Build verified ✅, app runs smoothly

**Build:** ✅ Successful

---

### 2026-04-16 — IDE Projects: AI Sync Debug Panel

**What Changed:**
1. ✅ Added debug panel to AI Tools tab - shows per-agent detection status, paths, and sample files
2. ✅ Added "Show Details" button in summary bar to toggle debug panel
3. ✅ Enhanced sync result display - shows per-agent record counts
4. ✅ Improved "Not detected" message - shows path being scanned
5. ✅ Removed duplicate "Sync All AI Agents" button from bottom of AI Tools tab
6. ✅ Added `handleDebugAgents()` function to call `debugAIAgents` IPC

**Files Modified:**
- `src/pages/IDEProjectsPage.tsx` - Added debug state, handleDebugAgents function, debug panel UI, improved agent cards

**Why:**
- AI sync was showing "0" for all agents but no way to debug why
- Backend had `debug-ai-agents` handler but frontend never called it
- User couldn't see detection status, paths, or database state

**How to Use:**
1. Go to IDE Projects → AI Tools tab
2. Click "Show Details" to see:
   - Database state: total records, tokens, breakdown by tool
   - Per-agent detection: green = detected, red = not found
   - Paths being scanned for each agent
   - Sample files in those paths
3. Click "Sync AI Usage" in header
4. Check sync result for per-agent record counts

**Next Steps:**
- If agents show "Not Found" (red): tool not installed or in different location
- If agents detected but 0 records: parsing issue - need to check token field names
- IDE detection improvements (IntelliJ, Android Studio, etc.) - planned for next iteration

**Build:** ✅ Successful

---

### 2026-04-16 — Galaxy Camera & Mouse Sensitivity Fixes (v1.23)

**What Changed:**
1. ✅ Fixed mouse sensitivity bug - OrbitControls target now dynamic based on galaxy type
2. ✅ Fixed reset button - now stays in current galaxy instead of always going to apps galaxy
3. ✅ Fixed camera initial position - starts at correct galaxy based on galaxyType
4. ✅ Fixed choppy galaxy movement - replaced Math.random() with seededRandom for stable positions
5. ✅ Fixed PerformanceMonitor error - simplified to plain JSX children

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Added resetCameraToGalaxy(), dynamic OrbitControls target, seededRandom function

**Root Causes:**
- Mouse sluggishness: OrbitControls target was always `[0, 0, 0]` even when viewing websites galaxy at `[3250, 0, 0]`
- Reset always to apps: Used generic `controlsRef.current.reset()` which resets to default position
- Choppy movement: `Math.random()` called on every frame in `getSystemPosition()`
- PerformanceMonitor error: Incorrect render function pattern

**Result:**
- Smooth mouse control in both galaxies
- Reset stays in current galaxy
- Stable galaxy positions without jitter
- No PerformanceMonitor errors

**Build:** ✅ Successful

---

### 2026-04-18 — Window Focus/Visibility Resume Fix

**What Changed:**
1. ✅ Added `focus` event listener - detects when user returns to app window
2. ✅ Added `visibilitychange` event listener - detects when tab becomes visible
3. ✅ These catch return from idle even without mouse/keyboard activity inside the app

**Files Modified:**
- `src/App.tsx` - Activity listener useEffect

**Why:** Previous activity listeners only captured events INSIDE the DeskFlow window. When user returned from being away but didn't move mouse/type inside the app, tracking wouldn't resume. Now window focus/visibility events catch the return.

**Result:** Tracking resumes when user focuses the app window or switches back to the tab

---

### 2026-04-16 — Idle Detection: Immediate Resume on Activity (v1.22)

**What Changed:**
1. ✅ Activity listeners now stay active even when tracking is paused from idle
2. ✅ ANY activity immediately resumes tracking (no delay)
3. ✅ Added `wheel` event to catch mouse wheel scrolling

**Files Modified:**
- `src/App.tsx` - Idle detection useEffect

**Result:** Tracking pauses after idle → ANY mouse/keyboard/scroll immediately resumes

---

### 2026-04-16 — UI Fixes: FPS Panel & Category Dropdown (v1.21)

**What Changed:**
1. ✅ Fixed FPS panel overlap with Perf button - moved FPS panel inside control buttons container
2. ✅ Fixed CategoryDropdown to match planet legend categories - now shows all categories from data + settings

**Files Modified:**
- `src/components/OrbitSystem.tsx` - FPS panel repositioned, CategoryDropdown updated with additionalCategories prop

**Why:**
- FPS panel was absolutely positioned at `top-[110px]` but Perf button wasn't at a fixed position, causing overlap
- CategoryDropdown only showed settings categories, missing any custom categories from data

**Result:**
- FPS panel now appears directly below Perf button (as sibling in flex column)
- CategoryDropdown shows categories from BOTH settings AND actual planet data

**Build:** ✅ Successful

---

### 2026-04-16 — Galaxy Camera/Visualization Clipping Fix (v1.20)

**What Changed:**
1. ✅ Fixed dust cloud position mismatch - `WebsiteGalaxyDustCloud` now at `[3250, 0, 0]` (was 650)
2. ✅ Added camera far plane `far: 10000` (was default ~2000)
3. ✅ Added camera near plane `near: 0.1`
4. ✅ Increased `OrbitControls maxDistance` from 800 to 5000
5. ✅ Increased `Stars radius` from 500 to 4000, count from 3000 to 8000
6. ✅ Added exponential fog `fog(1500, 4500)` for smooth particle fade-out

**Root Cause:**
- Camera far plane too close - particles beyond ~2000 got clipped (black square)
- WebsiteGalaxyDustCloud at wrong position (650 vs 3250)
- OrbitControls maxDistance too small (800) - couldn't zoom out to see far galaxy
- Stars radius too small - disappeared when viewing far galaxy
- No fog - particles had harsh cutoff instead of smooth fade

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Camera config, dust cloud position, OrbitControls, Stars, fog

**Result:**
- Galaxy visualization no longer shows black square when dragging
- Particles fade naturally with fog instead of hard cutoff
- Can zoom out to 5000 units to see both galaxies
- Dust clouds align with their respective galaxies

**Build:** ✅ Successful

---

### 2026-04-16 — Reflection: Application Data Loading (v1.19)

**What Changed:**
1. ✅ Documented reflection on application data loading fix
2. ✅ Created `agent/skills/agent-reflect/logs/application-data-loading-2026-04-16.md`
3. ✅ Updated `agent/debugging.md` with "Data Computation Pattern"
4. ✅ Added AGENTS.md v1.4 with Auto-Reflect rules

**Root Cause of Data Loading Issues:**
- StatsPage was computing its own stats from `logs` prop with buggy logic
- App.tsx already had `computedAppStats` that was correct
- Two different computations = inconsistent results
- Solution: Use centralized computation, pass as props

**Key Lessons:**
1. **Single Source of Truth** - Compute once at App.tsx level
2. **Props over Local Computation** - Pass computed data down
3. **Remove Redundancy** - Delete duplicate useMemo hooks
4. **Child components display, don't compute**

**Reflections Documented:**
- Galaxy data mismatch: `agent/skills/agent-reflect/logs/galaxy-data-mismatch-2026-04-16.md`
- Application data loading: `agent/skills/agent-reflect/logs/application-data-loading-2026-04-16.md`
- Auto-reflect rules: `agent/AGENTS.md` v1.4

**Patterns Added to debugging.md:**
- Data Mismatch Debugging Pattern
- Data Computation Pattern (Single Source of Truth)

**Result:** 
- Future agents will know to:
  - Trace from source of truth for data issues
  - Use centralized computation instead of local
  - Reflect after user approval, especially after failed attempts

---

### 2026-04-16 — Galaxy Data & Two-Galaxy Visual Improvements (v1.18)

**What Changed:**
1. ✅ Fixed OrbitSystem data source - added `.filter(l => !l.is_browser_tracking)` to exclude website tracking
2. ✅ Removed 20-app limit in galaxy - now shows all apps
3. ✅ Increased galaxy distance - websites at x=3250 (5x the distance)
4. ✅ Added `websiteLogs` prop to OrbitSystem - websites in separate galaxy
5. ✅ Created WebsiteGalaxyDustCloud - nebula-style with cyan/violet colors
6. ✅ Updated camera threshold to 1625 (middle between galaxies)
7. ✅ Added galaxy type indicator UI - shows "APPS GALAXY" or "WEBSITES GALAXY"

**Root Cause (CRITICAL LESSON):**
- Previous attempts FAILED because they tried to fix inside OrbitSystem.tsx
- The fix was ONE LINE at the source: App.tsx line 1810
- StatsPage worked correctly - it used `computedAppStats` which filtered `is_browser_tracking`
- OrbitSystem received `filteredLogs` which did NOT filter browser tracking
- This is a "Data Mismatch Debugging Pattern" - always trace FROM source of truth

**Files Modified:**
- `src/App.tsx` - Added filter: `logs={filteredLogs.filter(l => !l.is_browser_tracking)}`
- `src/components/OrbitSystem.tsx` - Removed 3x `idx < 20` limits, updated galaxy positions to 3250

**Reflection Documented:**
- `agent/skills/agent-reflect/logs/galaxy-data-mismatch-2026-04-16.md`
- `agent/debugging.md` - Added "Data Mismatch Debugging Pattern" section

**Result:** 
- Galaxy shows 33 apps matching Applications page (was showing 20 with wrong data)
- Time totals now correct: 55h vs previous 50m
- Two distinct galaxies far apart

**Build:** ✅ Successful

---

### 2026-04-16 — Category Override Not Reloading (v1.15)

**What Changed:**
1. ✅ Added `onCategoryOverridesChange` callback to SettingsPageProps
2. ✅ Added callback in `saveChanges()` to notify parent component of category changes
3. ✅ Now calls `setCategoryOverrides()` immediately when Save is clicked

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Added `onCategoryOverridesChange` prop, updated saveChanges
- `src/App.tsx` - Added `onCategoryOverridesChange={setCategoryOverrides}` to SettingsPage

**Why:**
- Category overrides were being saved to localStorage but the state wasn't being updated in parent component
- App.tsx's categoryOverrides state wasn't being refreshed when Save was clicked

**Result:** When you click Save after changing categories, the app immediately uses the new categories

**Build:** ✅ Successful

---

### 2026-04-16 — Category Override Load/Save to Config File (v1.17)

**What Changed:**
1. ✅ SettingsPage now loads overrides from BOTH localStorage AND categoryConfig file
2. ✅ App.tsx now loads overrides from BOTH localStorage AND categoryConfig file  
3. ✅ Save now properly calls setAppCategory for Forward mode (new logs)
4. ✅ Added getCategoryConfig API to preload.ts for loading

**Files Modified:**
- `src/pages/SettingsPage.tsx` - useEffect to load from localStorage + categoryConfig
- `src/App.tsx` - useEffect to load from localStorage + categoryConfig
- `src/pages/SettingsPage.tsx` - saveChanges calls setAppCategory/setDomainCategory in both modes

**Why:**
- Settings was only loading from localStorage, missing entries saved in previous sessions
- categoryConfig file is the persistence layer - must read from it
- categorizeApp() reads from categoryConfig.appCategoryMap - not localStorage

**Result:** 
- Category overrides load properly from previous sessions
- Changes persist across app restarts
- New logs get correct category

**Build:** ✅ Successful

---

### 2026-04-16 — Settings Page Issues Verification (v1.14)

**What Changed:**
1. ✅ Verified Issue 3: AlertTriangle - Already imported (was fixed)
2. ✅ Verified Issue 4: Duplicate Category Section - Only ONE exists (verified correct)
3. ✅ Verified Issue 5: Category Persistence - Already saves to localStorage correctly
4. ✅ Verified Issue 6: Real-time Update - Already updates immediately without Save
5. ✅ Verified Issue 7: Sync Button - Data Sync Mode is different feature (not confusing)

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Reviewed imports, rendering logic, saveChanges function

**Why:**
- User prompt asked to verify/fix Settings page issues
- Found all features already working as intended
- Build passes successfully

**Result:** All Settings features verified working - no code changes needed

**Build:** ✅ Successful

---

### 2026-04-15 — Data Consistency & Visualization Fixes (v1.13)

**What Changed:**
1. ✅ Fixed Issue 1: Period Switching - 'Month' now shows ALL data (not just 30 days)
2. ✅ Fixed Issue 2: Activity Visualization Data Mismatch - now excludes browser tracking data to match StatsPage
3. ✅ Fixed Issue 8: Productivity Score Mismatch - ProductivityPage now receives browserLogs from App.tsx for consistent calculation
4. ✅ Added Issue 9: Heatmap Week Navigation - LEFT/RIGHT arrows to navigate between weeks

**Files Modified:**
- `src/App.tsx` - Changed 'month' filter to show all data, added weekOffset state and heatmapWeekLabel, added navigation buttons
- `src/pages/ProductivityPage.tsx` - Now receives and uses browserLogs prop from App.tsx

**Why:**
- Period switching: 'Month' was showing same data as 'Week' when user had <30 days
- Activity Viz: Was including browser tracking data (websites) while Stats excluded it
- Productivity: Dashboard and ProductivityPage were using different data sources
- Heatmap: Needed navigation to view historical weeks

**Result:** 
- Week shows ~7 days, Month shows ALL data
- Activity Viz matches Stats page app count
- Dashboard and Productivity page show same productivity %
- Heatmap has working week navigation

**Build:** ✅ Successful

---

### 2026-04-15 — UI/UX Quality Fixes (v1.12)

**What Changed:**
1. ✅ Fixed Issue 10: App colors now persist correctly in SettingsPage - now loads from localStorage on init
2. ✅ Fixed Issue 11: Removed console.log spam - removed 10+ debug logs from App.tsx
3. ✅ Fixed Issue 12: Made ProductivityPage pie chart consistent - borderColor now matches Dashboard (#0a0a0a)

**Files Modified:**
- `src/pages/SettingsPage.tsx` - localAppColors now reads from localStorage on init
- `src/App.tsx` - Removed [Debug] console.logs from getTotalTime, computedAppStats, allTimeAppStats, filteredLogs
- `src/pages/ProductivityPage.tsx` - Pie chart borderColor now consistent with Dashboard

**Why:**
- App colors: SettingsPage was initializing from prop instead of reading saved colors from localStorage
- Console spam: Multiple debug logs were firing on every render, flooding the console
- Pie chart: ProductivityPage had different borderColor per segment while Dashboard uses single color

**Result:** App colors persist, console is no longer flooded, pie charts are consistent

**Build:** ✅ Successful

---

### 2026-04-14 — OrbitSystem Data Loading Fix (v1.11)

**What Changed:**
1. ✅ Fixed Top Bar Total to use same filtering as StatsPage (exclude browser-tracked and browser apps)
2. ✅ Fixed OrbitSystem computePlanets to exclude browser-tracked and browser apps
3. ✅ Fixed getTotalTime to properly handle 'all' period
4. ✅ Removed debug console.log spam from StatsPage

**Files Modified:**
- `src/App.tsx` - getTotalTime now filters like StatsPage, handles 'all' period
- `src/components/OrbitSystem.tsx` - computePlanets filters like StatsPage
- `src/pages/StatsPage.tsx` - Removed debug logs

**Why:** The Top Bar Total, Application Page (StatsPage), and OrbitSystem all need to show the same data. Now all three use the same filtering logic: exclude is_browser_tracking entries and generic browser apps (Chrome, Firefox, etc.)

**Result:** All three views now match - Top Bar Total, Applications Page, and Planet visuals show the same data.

**Build:** ✅ Successful

---

### 2026-04-14 — OrbitSystem Data Loading Fix

**What Changed:**
1. ✅ Added `setLogs(formattedLogs)` in period change effect - was only setting `allLogs`
2. ✅ Changed `filteredLogs` from useMemo to simple reference to `logs` to avoid double-filtering
3. ✅ Now both `logs` and `allLogs` are set when period changes, ensuring consistent data

**Files Modified:**
- `src/App.tsx` - Added setLogs() call at line 410, simplified filteredLogs at lines 351-356

**Why:** The period change effect (lines 387-413) was only setting `allLogs` but NOT `logs`. The Dashboard used `logs` (via `getAppDistribution()`) while OrbitSystem also received `logs` as prop, but when period changed, `logs` wasn't updated. This caused the data mismatch between Dashboard and OrbitSystem for Weektimeframe.

**Result:** Both Dashboard and OrbitSystem now show the SAME data when "Today" or "Week" is selected.

**Build:** ✅ Successful

---

## 🔧 OrbitSystem Galaxy Fixes (2026-04-16)

### Mouse Sensitivity & Reset Camera Fix (v1.23)
**Problem:** 
1. OrbitControls target hardcoded to `[0, 0, 0]` - when viewing websites galaxy at `[3250, 0, 0]`, rotation/pan was around wrong center causing sluggish, low-DPI feel
2. Reset button always went to apps galaxy `[0, 0, 0]` instead of staying in current galaxy
3. Camera initial position always `[0, 100, 200]` regardless of galaxy type

**Solution:**
1. Made OrbitControls target dynamic: `target={galaxyType === 'websites' ? [3250, 0, 0] : [0, 0, 0]}`
2. Created `resetCameraToGalaxy()` function that animates to current galaxy's position
3. Made camera initial position dynamic based on galaxy type
4. Replaced all `controlsRef.current.reset()` calls with `resetCameraToGalaxy()`

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Added resetCameraToGalaxy(), dynamic OrbitControls target, dynamic camera position

### Seeded Random for Stable Galaxy Positions (v1.23)
**Problem:** `getSystemPosition` used `Math.random()` which was called on every frame, causing solar systems to jitter/choppy movement

**Solution:** Created `seededRandom(seed)` function that produces stable positions based on index

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Added seededRandom, replaced Math.random() in getSystemPosition

### PerformanceMonitor Fix (v1.22)
**Problem:** PerformanceMonitor.js:54 error "a is not a function or its return value is not iterable" - render function pattern was incorrect

**Solution:** Simplified PerformanceMonitor to use plain JSX children instead of render function pattern

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Simplified PerformanceMonitor

---

## 🔧 OrbitSystem Galaxy Fixes (2026-04-14)

### Data Loading Fix (CRITICAL)
**Problem:** OrbitSystem received `filteredLogs` which had less data than Dashboard's `logs` state.
**Solution:** Changed OrbitSystem to receive `logs` prop instead of `filteredLogs`. Now both Dashboard and OrbitSystem use the same data source.

### Two Galaxies System
**What Added:**
1. ✅ Apps Galaxy - Position (0, 0, 0) - Blue/Purple theme
2. ✅ Websites Galaxy - Position (300, 0, 0) - Cyan/Violet theme (Electric Nebula)
3. ✅ Camera-based galaxy detection - Automatically switches when camera moves far right
4. ✅ Galaxy indicator showing current galaxy (💻 Apps / 🌐 Websites)
5. ✅ Increased OrbitControls maxDistance to 800 for reaching both galaxies

### Galaxy Navigation
- Drag right (past x=150) to switch to Websites Galaxy
- Drag left (before x=150) to switch back to Apps Galaxy
- Galaxy indicator updates automatically based on camera position

### Legend Fix
**Problem:** Legend showed ALL apps from ALL categories.
**Solution:** Legend now shows apps from the current galaxy's solar systems.

### Time Display Fix
**Solution:** Added `formatDurationSeconds()` function that converts seconds to proper format.

### Files Modified:
- `src/components/OrbitSystem.tsx` - Complete GalaxyView rewrite, CameraTracker, camera-based galaxy detection
- `src/App.tsx` - Changed `filteredLogs` to `logs` for OrbitSystem

---

## 🔧 Advanced Visual Enhancements (2026-04-14)

### Post-Processing Pipeline
**What Changed:**
1. ✅ Added EffectComposer with Bloom (intensity 1.2, threshold 0.85)
2. ✅ ACES Filmic Tone Mapping for cinematic colors
3. ✅ Vignette effect (offset 0.3, darkness 0.5)
4. ✅ Chromatic Aberration (subtle lens effect)
5. ✅ PerformanceMonitor for adaptive quality

### Sun & Glow Enhancements
**What Changed:**
1. ✅ Increased emissive intensity (0.85 → 2.5)
2. ✅ Added toneMapped={false} for bloom to work
3. ✅ Added extra middle corona layer
4. ✅ Increased point light intensity (5 → 8)
5. ✅ Multiple glow layers with additive blending
6. ✅ Enhanced lens flare textures

### Galaxy & Particle Improvements
**What Changed:**
1. ✅ Increased particle count back to 8,000
2. ✅ Increased particle opacity (0.7 → 0.85)
3. ✅ Increased particle size (1.5 → 1.8)
4. ✅ Enhanced color palette brightness

### Space Lighting
**What Changed:**
1. ✅ Ambient light (0.03 intensity)
2. ✅ Hemisphere light for subtle gradient
3. ✅ Directional light from sun position
4. ✅ Point lights at sun for illumination

### Galaxy View (Solar Systems in Galaxy)
**What Changed:**
1. ✅ Added inner glow layer
2. ✅ Increased emissive intensity
3. ✅ Added toneMapped={false}
4. ✅ Enhanced glow sprite opacity

### Debug & Development
**What Changed:**
1. ✅ Added Ctrl+Shift+I shortcut for DevTools
2. ✅ Disabled webSecurity for local file loading
3. ✅ Added console logging for debugging
4. ✅ Added did-fail-load event handler

### Fixed Bugs
**What Changed:**
1. ✅ handleActivity ReferenceError - moved function outside if block
2. ✅ speedOptions ReferenceError - added missing state variable

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Visual enhancements
- `src/main.ts` - DevTools shortcut, logging
- `vite.config.ts` - Build configuration
- `README.md` - Updated tech stack documentation

---

## 🔧 Settings Page Redesign (2026-04-13)

**What Changed:**
1. ✅ Combined "Categories" + "Apps" tabs → single "Category" tab
2. ✅ Three stacked sections: Productivity → Applications → Websites
3. ✅ Carousel: 5 items per page with ← → arrows
4. ✅ Search filter for apps and websites
5. ✅ Visual triangle indicator for selected app/website
6. ✅ Fixed category save - now persists to localStorage
7. ✅ Removed inline category edit from Browser Activity page

**Files Modified:**
- `src/pages/SettingsPage.tsx`
- `src/pages/BrowserActivityPage.tsx`

**Fixed Issues:**
- Issue 2.4 Carousel + Search ✅
- Issue 2.10 Save persists ✅

**Skipped:**
- Issue 2.3 Drag (dnd-kit offset issue)

---

## 🔧 Recent Fixes (2026-04-13)

### Galaxy Visualization Improvements

**What Changed:**
1. ✅ Category dropdown now available in galaxy view (was only in solar system mode)
2. ✅ Solar system orbs are now larger and more visible (0.5 → 0.9 size multiplier)
3. ✅ Added trail particles behind solar systems with subtle wave animation
4. ✅ Galaxy dust cloud particles now have subtle movement (alive feel)
5. ✅ Spiral arms now 3-4 arms (was 2) with reduced contrast
6. ✅ Density gradient: disk particles now have smooth transition (not just dense vs sparse)
7. ✅ Planet labels now stay visible on zoom (distanceFactor 12 → 15)
8. ✅ Solar system labels larger and more visible (14px font, better styling)

**Files Modified:**
- `src/components/OrbitSystem.tsx` - Multiple improvements to GalaxyView, GalaxyDustCloud, TexturedPlanet

---

### Additional Issues Fixed

**What Changed:**
1. ✅ Tracking Auto-Pause Bug - Removed `setIsTracking(data.isTracking)` from heartbeat listener that was overriding manual toggle
2. ✅ Browser Sessions Empty - Added `updateAggregates()` call in handleBrowserData() to populate browser_sessions table
3. ✅ ProductivityPage Period Sync - Removed local `localPeriod` state, now uses `selectedPeriod` prop directly
4. ✅ Weekly Timeframe Bug - Still investigating (shows less time than Today: 12h Today vs 10h Week)

**Files Modified:**
- `src/App.tsx` - Fixed tracking state sync issue
- `src/main.ts` - Fixed browser_sessions aggregation, heartbeat logic
- `src/pages/ProductivityPage.tsx` - Fixed period sync

**Status:** Investigating weekly data inconsistency

---

### 17 Issues Fixed from PROBLEMS.md (2026-04-12)

**What Changed:**
1. ✅ Galaxy View Categories - OrbitSystem now receives filteredLogs based on selectedPeriod
2. ✅ Galaxy View Square Background - Reduced glow sprite scale from 3x to 2.5x
3. ✅ Galaxy View Legend - PlanetLegend now shows in both galaxy and solar system modes
4. ✅ Settings App Color Customization - Added color picker for each app in Colors tab
5. ✅ Settings Category Colors - Added category color customization in Colors tab
6. ✅ Settings Drag Reorder - Added Reorder.Group from framer-motion in Apps tab
7. ✅ Settings Animation Speed - Added selector in General tab
8. ✅ Timeline Selection - OrbitSystem receives filtered logs based on selectedPeriod
9. ✅ Dashboard Productivity - Now calculated from actual data using focusAndTotalTime
10. ✅ Dashboard Focus Score - Now calculated from actual data
11. ✅ Tracking Idle Threshold - Now uses configurable idleThreshold from settings

**Files Modified:**
- `src/App.tsx` - Fixed filteredLogs passed to OrbitSystem, fixed productivity/focus score calculations, added idleThreshold dependency, added categoryOrder state
- `src/pages/SettingsPage.tsx` - Added color customization (app and category), added animation speed selector, added drag-to-reorder categories
- `src/components/OrbitSystem.tsx` - Reduced glow sprite scale, made legend visible in galaxy mode

**Result:** Build successful, all major features verified via Playwright

---

## 🔧 Recent Fixes (2026-04-09)

### Real-Time Data Refresh (30-second Polling)

**What Changed:**
1. ✅ App Stats now polls every 30 seconds for fresh data
2. ✅ App Stats re-fetches when `selectedPeriod` changes
3. ✅ App Stats re-fetches when day changes (via `currentDateKey` dependency)
4. ✅ Productivity trend now updates in real-time (30-second polling)
5. ✅ Browser Activity page polls every 30 seconds
6. ✅ Browser Activity refreshes when page becomes visible (visibility change handler)
7. ✅ Day change detection - full data reload when midnight passes

**Files Modified:**
- `src/App.tsx` - Added currentDateKey state, 30-second polling for appStats, day change detection
- `src/pages/StatsPage.tsx` - Added 30-second polling for productivity data
- `src/pages/BrowserActivityPage.tsx` - Added 30-second polling and visibility change handler

**Root Cause:** App stats, productivity data, and browser activity were only fetched once on component mount, never updating when data changed or when navigating between tabs.

### Focus/Total Pie Chart Sync

**What Changed:**
1. ✅ Pie chart now filters apps based on Focus/Total mode
2. ✅ Focus mode: Shows only apps in productive categories
3. ✅ Total mode: Shows all apps regardless of category

**Files Modified:**
- `src/App.tsx` - getAppDistribution() now filters by timeMode

### Website Category Change on Browser Activity Page

**What Changed:**
1. ✅ Added clickable category dropdown for each domain
2. ✅ Shows all available categories including Education and Uncategorized
3. ✅ Changes are saved immediately via setDomainCategory IPC

**Files Modified:**
- `src/pages/BrowserActivityPage.tsx` - Added category change functionality

### Apply to Historical Data Toggle

**What Changed:**
1. ✅ Settings page now shows "Apply to historical data" toggle when changes are pending
2. ✅ Toggle defaults to OFF (changes apply forward only)
3. ✅ When ON: Updates ALL historical logs to new category + rebuilds aggregate tables
4. ✅ New IPC handler: apply-category-to-historical

**Backend Logic:**
- Updates all logs matching app/domain name to new category
- Rebuilds daily_stats, daily_aggregates, browser_sessions tables

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Added applyToHistorical state and toggle
- `src/main.ts` - Added apply-category-to-historical IPC handler
- `src/preload.ts` - Exposed applyCategoryToHistorical API

### Database Aggregation Functions

**What Changed:**
1. ✅ Added updateAggregates() function that runs on each log insert
2. ✅ Automatically populates: daily_stats, sessions, daily_aggregates, browser_sessions
3. ✅ Added migrateToAggregates IPC handler for one-time migration of existing data

**Files Modified:**
- `src/main.ts` - Added updateAggregates() and updateAllAggregates() functions

**What Changed:**
1. ✅ Created persistent category configuration system (`deskflow-categories.json` in userData)
2. ✅ Category config stores: app category maps, domain category maps, tier assignments, detected items
3. ✅ Added "Uncategorized" category (replaces "Other" as default)
4. ✅ Updated `categorizeApp()` - uses config with user overrides, caches detected apps
5. ✅ Updated `categorizeDomain()` - conservative smart detection:
   - YouTube: default Entertainment, only Education if very clear keywords
   - Reddit: checks subreddit from URL, maps to Productivity/Distracting
   - Twitter/X: feed/search = Productivity, individual tweets = Social Media
   - News: business news (bloomberg/reuters) = Productivity
6. ✅ Updated `calculateProductivityScore()` - uses configurable tier assignments
7. ✅ Added new IPC handlers: get-category-config, set-app-category, set-domain-category, set-app-tier, set-domain-tier, set-tier-assignments, get-default-categories

**Default Tier Assignments (configurable):**
- **Productive:** IDE, AI Tools, Developer Tools, Education, Productivity, Tools
- **Neutral:** Communication, Design, Search Engine, News, Uncategorized, Other
- **Distracting:** Entertainment, Social Media, Shopping

**Files Modified:**
- `src/main.ts` - Category config system, updated categorization functions, new IPC handlers
- `src/preload.ts` - Exposed new category config APIs

### Browser Tracking Delta Fix & Data Accuracy

**Root Cause Identified:**
- Browser extension was sending cumulative duration (total since tab started) on every periodic sync
- Desktop app was creating new database entries instead of updating existing sessions
- Result: 10 apps × 10 mins = 100 mins of false inflation

**Fix Applied:**
1. ✅ Extension now tracks `lastPeriodicSync` and sends DELTA (time since last sync) not TOTAL
2. ✅ Extension sends explicit `delta_ms` field for clarity
3. ✅ Desktop app uses explicit delta for periodic updates, updates existing session
4. ✅ Tab switches and focus loss still create new entries (correct behavior)
5. ✅ Max session capped at 1 hour to prevent heatmap inflation
6. ✅ Max delta capped at 5 minutes to prevent sleep-time artifacts

**Files Modified:**
- `browser-extension/background.js` - Added lastPeriodicSync state, delta-based periodicSync()
- `src/main.ts` - handleBrowserData() uses explicit delta when available, capped durations

**Browser Extension Events:**
- Tab switch → logs previous session (total duration) → starts new session
- Window focus lost → logs current session → pauses tracking
- Periodic sync (~5 sec) → sends delta since last sync → updates existing session
- Window focus gained → starts fresh from zero

### Data Cleanup & UI Improvements

**New Features:**
1. ✅ "Clean Data" button - deletes all entries with duration > 1 hour (corrupted data)
2. ✅ Cleaned-corrupted-data IPC handler for cleanup functionality

**Files Modified:**
- `src/main.ts` - Added clean-corrupted-data IPC handler
- `src/preload.ts` - Exposed cleanCorruptedData API
- `src/App.tsx` - Added Clean Data button in top bar

### Decimal Display Fix (Phase 0)

**Issues Fixed:**
1. ✅ All time displays now use Math.floor() - no decimals anywhere
2. ✅ Heatmap tooltip shows integers only
3. ✅ Stats cards, pie charts, productivity scores all display integers
4. ✅ Stored data unchanged - only display values floored

**Files Modified:**
- `src/App.tsx` - displayTime, appData, heatmap tooltip
- `src/main.ts` - productivity score values floored
- `src/pages/StatsPage.tsx` - productivity percentages floored

### Website/App Separation

**Issue Fixed:**
1. ✅ Settings page now filters out websites from app color customization
2. ✅ Only desktop apps appear in the app list
3. ✅ Websites still tracked in Browser Activity page

**Filter Logic:**
- Excludes domains: .com, .org, .net, .io, .ai
- Excludes known websites: youtube, google, facebook, twitter, reddit, github, chatgpt, claude, stackoverflow

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Added isWebsite helper, filtered uniqueApps

### Heatmap & Tracking Verification

**Verified Working:**
1. ✅ Heatmap hour-splitting logic - sessions properly split across hourly cells
2. ✅ Focus vs Total time logic - Focus = sum of logged sessions, Total = wall-clock time
3. ✅ Only foreground app tracked in Focus mode
4. ✅ All apps (including background) tracked in Total mode

### Data Persistence & Heatmap Fixes

**Issues Fixed:**
1. ✅ Database viewer now shows ALL records (removed LIMIT 100 restriction)
2. ✅ Heatmap now uses `allLogs` instead of filtered `logs` - historical data persists across midnight
3. ✅ Database modal displays correct record count from SQLite database
4. ✅ JSON fallback limit increased from 1000 to 50000 records

**Files Modified:**
- `src/main.ts` - `getLogs()` now returns all records (optional limit parameter)
- `src/App.tsx` - Database modal and heatmap use `allLogs`

### Time Period Selector Unification

**Issues Fixed:**
1. ✅ Removed duplicate time selector from Statistics page
2. ✅ Added "All Time" option to top navigation bar
3. ✅ Charts now adapt to selected period:
   - **Today** → Hourly breakdown (00:00-23:00)
   - **Week/Month/All** → Daily breakdown
4. ✅ Single source of truth: `selectedPeriod` in App.tsx passed as prop to StatsPage

**Files Modified:**
- `src/App.tsx` - Added 'all' to period selector, passes `selectedPeriod` to StatsPage
- `src/pages/StatsPage.tsx` - Removed `timeRange` state, accepts `selectedPeriod` prop, charts reactive

### Average Session Length Display

**Issues Fixed:**
1. ✅ Average session now shows seconds for sessions < 1 minute
2. ✅ Shows hours+minutes for sessions > 1 hour
3. ✅ Calculation uses `total_ms / sessions` for accuracy
4. ✅ Pre-computed in `appList` memo for performance

**Files Modified:**
- `src/pages/SettingsPage.tsx` - Improved avg session display logic

### Unsaved Changes Warning

**New Feature:**
1. ✅ Warning modal appears when navigating away from Settings with unsaved changes
2. ✅ Three options: Save & Navigate, Discard Changes, Cancel
3. ✅ Auto-saves before switching internal tabs (apps/colors/general)
4. ✅ Uses ref-based callback pattern for reliable save execution

**Files Modified:**
- `src/App.tsx` - Added warning modal state and handlers
- `src/pages/SettingsPage.tsx` - Registers save callback, intercepts navigation

---

## 🗄️ Data Storage Architecture

### Storage Strategy (Hybrid with Fallback)

**Primary:** SQLite via `better-sqlite3`
- **Location:** `%APPDATA%/deskflow/deskflow-data.db` (Windows)
- **Tables:**
  - `logs`: id, timestamp, app, category, duration_ms, title, project, keystrokes, clicks, window_switches, url, domain, tab_id, is_browser_tracking
  - `daily_stats`: id, date, app, category, total_sec, sessions, avg_session_sec, keystrokes, clicks, focus_score, productivity_type, total_time_sec, focus_time_sec (UNIQUE date+app)
- **Status:** Preferred, requires native module compilation

**Fallback:** JSON File
- **Location:** `%APPDATA%/deskflow/deskflow-data.json`
- **Format:** Array of log entries with same schema as SQLite
- **Status:** Automatically used if SQLite fails to initialize

**UI Preferences:** localStorage (browser-only)
- **Note:** Planet colors now use a predefined palette in OrbitSystem, not localStorage

### Storage Initialization Flow

```
app.whenReady()
  ↓
initializeStorage()
  ↓
Try SQLite (better-sqlite3)
  ↓ Success → Use SQLite (creates logs + daily_stats tables)
  ↓ Failure → Try JSON
      ↓ Success → Use JSON
      ↓ Failure → In-memory only (data lost on quit)
```

### Key Implementation Details

1. **Deferred Initialization:** Storage initialized after `app.whenReady()` to avoid module load errors
2. **Auto-Creation:** JSON file created immediately if SQLite fails and file doesn't exist
3. **Graceful Quit:** On app quit:
   - Current session logged (if > 5 seconds)
   - JSON data flushed to disk
   - SQLite connection closed properly
4. **Health Check:** IPC endpoint `get-storage-status` provides real-time status

### Data Flow

```
active-win polling (every 2s)
  ↓
pollForeground() in main.ts
  ↓ App change detected
  ↓
addLog() → SQLite INSERT or JSON write
  ↓
IPC: get-logs / get-logs-by-period → App.tsx receives logs
  ↓
computePlanets() → 3D visualization
  ↓
filteredLogs (period-aware) → charts, heatmap, stats
```

---

## ⚠️ Known Issues & Limitations

### Native Module Issues

**Problem:** `better-sqlite3` requires compilation
- **Symptoms:** SQLite fails, falls back to JSON
- **Root Cause:** Missing Visual Studio Build Tools, node-gyp issues
- **Impact:** Data still persists via JSON fallback
- **User Impact:** Minimal, JSON works fine for normal usage

**Troubleshooting:**
```bash
# Rebuild native modules
npm install
npx electron-rebuild

# Or check if module loads
node -e "require('better-sqlite3')"
```

### Path Issues

**Problem:** Windows paths with spaces
- **Symptoms:** node-gyp fails during build
- **Solution:** Install in path without spaces, or use JSON fallback

### Web Mode vs Electron Mode

**Web Mode (`npm run dev`):**
- No Electron APIs available
- Data NOT persisted
- Uses simulated seed data
- For UI development only

**Electron Mode (`npm start`):**
- Full storage support
- Data persisted to disk
- Real window tracking via active-win

### Duration Rounding

- Sessions under 60 seconds are rounded up to 1 minute (minimum display value)
- This prevents zero-minute entries in the database view

---

## 📝 Recent Changes

### 2026-04-05 — Solar System Visual Overhaul (v1.2)

**What Changed:**
1. ✅ Controls moved from bottom-left to **top-right** corner (no legend overlap)
2. ✅ Planet colors replaced with **12-color vivid palette** (no reds, all distinct)
3. ✅ Planet sizes increased: `1.0–4.0` radius (was `0.5–3.2`)
4. ✅ Camera starts further back: `[0, 50, 80]` with FOV 60
5. ✅ **Legend click flies to planet** — smooth 1.5s cubic ease-out camera animation
6. ✅ Name labels fixed: positioned at each planet's world coordinates (no longer stacked at sun)
7. ✅ Lighting overhauled: ambient 0.8→0.25, hemisphere 0.6→0.2, added directional fill
8. ✅ Textures brightened: base `#0a0a1a`→`#151530`, emissive 0.12 constant
9. ✅ Hover effect: hex-grid wireframe icosahedron hologram shell
10. ✅ Planet legend bar added below canvas with color dots, names, and minutes

**Files Modified:**
- `src/components/OrbitSystem.tsx` — Complete visual overhaul

### 2026-04-05 — Database Expansion & Period Filtering

**What Changed:**
1. ✅ Added `keystrokes`, `clicks`, `window_switches` columns to `logs` table
2. ✅ Added `daily_stats` table for historical aggregation
3. ✅ New IPC: `get-logs-by-period`, `get-daily-stats`, `get-app-stats`
4. ✅ Duration rounding: `Math.max(1, Math.round(ms/60000))` — no more zero-minute entries
5. ✅ Period-aware data: `allLogs` + `filteredLogs` pattern (Today/Week/Month)
6. ✅ Solar system respects period filtering

**Files Modified:**
- `src/main.ts` — DB schema expansion, new IPC handlers
- `src/preload.ts` — New IPC bindings
- `src/App.tsx` — Period filtering, app stats loading

### 2026-04-05 — Settings & UI Fixes

**What Changed:**
1. ✅ Idle detection buttons now functional (3/5/10 min with active state)
2. ✅ Storage status always visible (no more "check above" redirect)
3. ✅ Auto-Export toggle now works (ON/OFF with visual feedback)
4. ✅ Clear Data has confirmation modal with warning details
5. ✅ Export Data has confirmation modal
6. ✅ Heatmap legend now shows minutes (not mysterious percentages)
7. ✅ Heatmap hover tooltip shows time range, minutes, and hour usage %

### 2026-04-05 — Storage Reliability (Initial Fix)

**What Changed:**
1. ✅ Fixed storage initialization - JSON fallback now always works
2. ✅ Added storage health check IPC endpoint (`get-storage-status`)
3. ✅ Added storage status indicator in UI (Settings modal)
4. ✅ Added app quit handler to flush pending data
5. ✅ Improved error messages and logging

---

## 🎯 Next Steps / TODO

### High Priority
- [ ] Add automated tests for storage initialization
- [ ] Test JSON fallback extensively on clean install
- [ ] Verify data persistence across multiple app restarts
- [ ] Applications tab overhaul with real historical data and per-app detail cards
- [ ] Insights tab connected to real `daily_stats` data
- [x] Real-time data refresh with 30-second polling - DONE 2026-04-10

### Medium Priority
- [ ] Add data migration tool (JSON → SQLite if SQLite later succeeds)
- [ ] Add backup/export functionality
- [ ] Improve active-win error handling
- [ ] Store keystrokes/clicks per session from actual input monitoring

### Low Priority
- [ ] Consider alternative SQLite package (sql.js - WASM based, no native build)
- [ ] Add storage size limits and cleanup
- [ ] Add data integrity checks

---

## 📚 Reference

### Data Schemas

**Log Entry:**
```typescript
interface LogEntry {
  id: number;           // Auto-increment (SQLite) or timestamp (JSON)
  timestamp: string;    // ISO 8601
  app: string;          // Application name
  category: string;     // IDE, Browser, AI Tools, etc.
  duration_ms: number;  // Session duration in milliseconds
  title?: string;       // Window title (optional)
  project?: string;     // Project name (optional, IDE apps)
  keystrokes?: number;  // Estimated keystrokes during session
  clicks?: number;      // Estimated mouse clicks during session
  window_switches?: number; // Window switches during session
}
```

**Daily Stats:**
```typescript
interface DailyStat {
  id: number;
  date: string;         // YYYY-MM-DD
  app: string;
  category: string;
  total_sec: number;    // Total seconds of activity
  sessions: number;     // Number of sessions
  avg_session_sec: number; // Average session length
  keystrokes?: number;
  clicks?: number;
  focus_score?: number; // 0-100 productivity score
}
```

### IPC Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `get-logs` | invoke | Get all log entries (was limited to 100, now unlimited) |
| `get-logs-by-period` | invoke | Get logs filtered by today/week/month/all |
| `get-stats` | invoke | Get aggregated stats by app |
| `get-app-stats` | invoke | Get per-app detailed stats (first/last seen, avg session) |
| `get-daily-stats` | invoke | Get daily aggregation for week/month/all |
| `get-daily-productivity` | invoke | Get detailed productivity data for a specific date |
| `get-productivity-range` | invoke | Get productivity scores for a date range (for trends) |
| `toggle-tracking` | invoke | Toggle window tracking on/off |
| `clear-data` | invoke | Delete all stored data |
| `clear-today` | invoke | Delete only today's data |
| `get-db-path` | invoke | Get database file path |
| `get-storage-status` | invoke | Get storage health status |
| `get-browser-logs` | invoke | Get browser activity logs |
| `get-browser-domain-stats` | invoke | Get browser stats by domain |
| `get-browser-category-stats` | invoke | Get browser stats by category |
| `set-browser-tracking` | invoke | Enable/disable browser tracking |
| `get-browser-tracking-status` | invoke | Get browser tracking status |
| `set-browser-excluded-domains` | invoke | Set excluded browser domains |
| `clean-corrupted-data` | invoke | Delete all entries with duration > 1 hour |
| `get-category-config` | invoke | Get full category configuration |
| `set-app-category` | invoke | Set category for a specific app |
| `set-domain-category` | invoke | Set category for a specific domain |
| `set-app-tier` | invoke | Set productivity tier for a specific app |
| `set-domain-tier` | invoke | Set productivity tier for a specific domain |
| `set-tier-assignments` | invoke | Update tier assignment mappings |
| `get-default-categories` | invoke | Get list of all available categories |
| `set-domain-keyword-rules` | invoke | Set productivity keywords for a domain |
| `get-domain-keyword-rules` | invoke | Get productivity keywords for a domain |
| `set-domain-default-category` | invoke | Set default category for a domain |
| `get-domain-default-category` | invoke | Get default category for a domain |
| `get-keyword-enabled-domains` | invoke | Get all domains with keyword rules enabled |
| `add-keyword-domain` | invoke | Add a new domain with keyword rules |
| `remove-keyword-domain` | invoke | Remove keyword rules from a domain |
| `apply-category-to-historical` | invoke | Update all historical logs to new categories + rebuild aggregates |
| `get-tier-assignments` | invoke | Get current tier assignment configuration |
| `migrate-to-aggregates` | invoke | One-time migration to populate aggregate tables |
| `get-daily-aggregates` | invoke | Get data from daily_aggregates table |
| `get-browser-sessions` | invoke | Get data from browser_sessions table |
| `get-sessions` | invoke | Get active sessions data |

### Event Channels

| Event | Direction | Description |
|-------|-----------|-------------|
| `foreground-changed` | main → renderer | Active window changed |

### Planet Color Palette

Planets use a predefined 12-color vivid palette (no reds):
`#6366f1, #06b6d4, #f59e0b, #10b981, #8b5cf6, #ec4899, #14b8a6, #f97316, #3b82f6, #84cc16, #e879f9, #22d3ee`

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-04 | Initial creation |
| 1.1 | 2026-04-05 | Fixed data persistence, added storage diagnostics |
| 1.2 | 2026-04-05 | Solar system visual overhaul, DB expansion, period filtering, settings fixes, heatmap clarity |
| 1.3 | 2026-04-07 | Data persistence fixes, heatmap fix, time period unification, avg session display fix, unsaved changes warning |
| 1.4 | 2026-04-07 | Productivity tracking system, smart YouTube categorization, browser duration fix, heatmap decimal fix, statistics enhancement |
| 1.5 | 2026-04-08 | Browser tracking delta fix (delta-based updates, not cumulative), data cleanup button, decimal display fix, website/app separation |
| 1.6 | 2026-04-09 | Customizable productivity & category system: persistent config file, conservative smart detection (YouTube/Reddit/Twitter), configurable tier assignments, Uncategorized category |
| 1.7 | 2026-04-09 | Focus/Total pie chart sync, website category change on Browser Activity page, Apply to Historical Data toggle, automatic database aggregation |
| 1.7.1 | 2026-04-10 | Real-time data refresh: 30-second polling for app stats, productivity trend, and browser activity; day change detection for automatic data reload |
| 1.11 | 2026-04-14 | Fixed Top Bar Total, OrbitSystem, getTotalTime to filter browser-tracked and browser apps |
| 1.12 | 2026-04-15 | UI/UX Quality Fixes: App colors persistence, console.log spam removal, pie chart consistency |
| 1.14 | 2026-04-16 | Settings page issues verification: All features verified working |
| 1.18 | 2026-04-16 | Galaxy data fix: OrbitSystem now uses filteredLogs, two-galaxy with different visuals (spiral apps, nebula websites), smooth camera transitions, dashboard productivity includes websites |
| 1.19 | 2026-04-16 | Reflection documentation: Created universal self-improvement skill, documented galaxy data and application data loading patterns, added auto-reflect rules to AGENTS.md |
| 1.20 | 2026-04-16 | Galaxy camera fix: Fixed black square clipping, dust cloud position mismatch, added fog, increased camera far plane to 10000, OrbitControls maxDistance to 5000 |
| 1.22 | 2026-04-16 | PerformanceMonitor fix: Simplified to plain JSX children |
| 1.23 | 2026-04-16 | Mouse sensitivity & reset fix: Dynamic OrbitControls target, resetCameraToGalaxy(), seeded random for stable positions |
| 1.24 | 2026-04-16 | IDE Projects: Added AI sync debug panel with detection status, paths, and database state visibility |
| 1.26 | 2026-04-17 | IDE Projects UI redesign with dropdown menu, Setup Guide modal with onboarding, improved IDE detection (Antigravity, JetBrains, Android Studio), async scan-tools |
| 1.27 | 2026-04-17 | IDE Projects: Added scanning loading overlay, enhanced JetBrains detection with multiple env formats and recursive search |
| 1.28 | 2026-04-17 | IDE Projects: Add default IDE selection when adding projects, quick Open button to launch project in specified IDE |
| 1.31 | 2026-04-18 | Context maintenance infrastructure: Fixed empty GRAPH_REPORT.md, created maintain-context skill, rewrote AGENTS.md |
| 1.32 | 2026-04-18 | IDE Projects: Added folder picker for project path, improved JetBrains detection using `where` command |
| 1.33 | 2026-04-18 | AI Agent Data Storage Research: Documented storage locations for Claude Code, Cursor, OpenCode, etc. Fixed Claude Code and Cursor parsing to match actual data formats |
| 1.38 | 2026-04-19 | Terminal Window Feature: Multi-window Electron + PTY backend (node-pty) + xterm.js frontend + recursive tiling layout |
| 1.39 | 2026-04-19 | IDE Help Page: Created /ide-help route with comprehensive help content and added Help button in IDE Projects |
| 1.40 | 2026-04-19 | Settings page overhaul: Line-style color picker, App/Website toggle, expand/collapse, all data shown |
| 1.41 | 2026-04-19 | Color picker click anywhere to open, removed duplicate Category Assignments |
| 1.42 | 2026-04-19 | Fixed Category Assignments section deletion bug |
| 1.44 | 2026-04-20 | AI Color Magic: OpenRouter SDK integration for auto-generating colors with confirm/undo flow |
| 1.45 | 2026-04-20 | Projects Page Redesign: Removed popup modal, converted to expandable accordion cards with rich inline details (Health, Git, Sessions, Presets, Tools) |
| 1.46 | 2026-04-20 | Settings Page Fix: Converted app carousel to line-style list with App/Website toggle |
| 1.50 | 2026-04-21 | Terminal Fix: Fixed event name mismatch (terminal:data vs terminal-data) that prevented terminal data from reaching frontend |
| 1.51 | 2026-04-21 | Terminal Implementation: Added calculate-project-health handler, fixed terminal container dimensions, added split-screen controls (4 directions), added project details dropdown and stats sidebar |
| 1.52 | 2026-04-21 | Browser Tracking Fix: Added all known browsers to dropdown (Chrome, Firefox, Safari, etc.), marks browser with extension with ★, loads extension browser first |
| 1.53 | 2026-04-21 | Browser Tracking Fix: Fixed case-insensitive deduplication, defaults to Chrome |
| 1.39 | 2026-04-19 | IDE Help Page: Created /ide-help route with comprehensive help content and added Help button in IDE Projects |
| 1.40 | 2026-04-19 | Settings page overhaul: Line-style color picker, App/Website toggle, expand/collapse, all data shown |
| 1.41 | 2026-04-19 | Color picker click anywhere to open, removed duplicate Category Assignments |
| 1.42 | 2026-04-19 | Fixed Category Assignments section deletion bug |
| 1.44 | 2026-04-20 | AI Color Magic: OpenRouter SDK integration for auto-generating colors with confirm/undo flow |
| 1.45 | 2026-04-20 | Projects Page Redesign: Removed popup modal, converted to expandable accordion cards with rich inline details (Health, Git, Sessions, Presets, Tools) |
| 1.46 | 2026-04-20 | Settings Page Fix: Converted app carousel to line-style list with App/Website toggle |

---

**Last Updated:** 2026-04-20 (v1.46)
**Maintained By:** AI Development Team
