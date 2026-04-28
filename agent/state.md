# 📌 Project State

**Purpose:** Current status, known issues, and recent changes for DeskFlow.

---

## 📊 Current Status

**Version:** 1.75
**Last Updated:** 2026-04-26
**Build Status:** ✅ Working

---

## 📝 Current Page Structure (Complete Overview)

### Sidebar Navigation (Order 1-9):
1. **Dashboard** (`/`) - Main timer/stopwatch, heatmap, solar system (OrbitSystem), activity feed, pinned activities
2. **Productivity** (`/productivity`) - Productivity breakdown (productive/neutral/distracting), pie charts, daily/weekly bars, apps vs websites comparison
3. **Applications** (`/stats`) - App distribution charts, detailed per-app stats, category breakdown
4. **Browser Activity** (`/browser`) - Website tracking, domain stats, hourly charts, category filtering
5. **IDE Projects** (`/ide`) - Project management, AI agent usage tracking, Git metrics, tools scanning, health scores
6. **External** (`/external`) - External stopwatch (timed activities), sleep tracking, recovery modal, activity grid
7. **Insights** (`/reports`) - Activity breakdown, sleep trends, consistency, best day, typical day
8. **Database** (`/database`) - Raw log data viewer, record counts
9. **Settings** (`/settings`) - Categories, colors, preferences, AI settings

---

## 📊 What's on Each Page (DETAILED)

### 1. Dashboard Page (`/`)
**Features:**
- Timer/stopwatch display with formatting (HH:MM:SS)
- Current session tracking (productive time)
- Heatmap (7-day grid, weekly navigation with arrows)
- Solar System visualization (OrbitSystem - 3D planet system)
- Activity feed (recent sessions, scrollable)
- Pinned activities (expandable section)
- Stats cards: Total Time, Focus Score, Productivity Score, Sessions, Top App

**Data Sources:**
- `logs` - from main process tracking
- `filteredLogs` - period-filtered (Today/Week/Month/All)
- `hourlyHeatmap` - computed from logs
- `solarSystemData` - computed from filteredLogs

---

### 2. Productivity Page (`/productivity`)
**Features:**
- Period selector (Today/Week/Month/All)
- Focus/Total mode toggle
- Productivity score display
- Tier filter buttons (Productive/Neutral/Distracting/All)
- **App distribution pie chart** (top apps by category tier)
- **Daily productivity bars** (vertical bars: Productive/Neutral/Distracting per day)
- **Weekly comparison chart** (line chart)
- Apps section (list with category badges, hours, session counts)
- Websites section (grouped by domain, expandable, category badges)

**Data Sources:**
- `appStats` - aggregated from filteredLogs
- `browserStats` - from browserLogs
- `tierAssignments` - configurable tiers
- `domainKeywordRules` - smart website categorization

---

### 3. Applications Page (`/stats`)
**Features:**
- Period selector (Today/Week/Month/All)
- Total time header
- App list with:
  - Color bar
  - App name
  - Category badge
  - Hours (with % of total)
  - Sessions count
  - Average session length
- Category breakdown pie chart
- Hourly activity bar chart (with bar/line toggle)
- Website toggle

**Data Sources:**
- `computedAppStats` - computed in App.tsx
- `filteredLogs` - by period

---

### 4. Browser Activity Page (`/browser`)
**Features:**
- Tracking browser dropdown (select which browser tracks)
- Domain list with:
  - Domain name
  - Category dropdown (editable)
  - Time spent
  - Visit count
- Hourly activity chart
- Category pie chart (websites by category)
- Auto-refresh (10 seconds)
- Live detection panel

**Data Sources:**
- `browserLogs` - from extension tracking
- `browserStats` - aggregated domains
- `categoryOverrides` - user category changes

---

### 5. IDE Projects Page (`/ide`)
**Features:**
- Tabs: Overview, Projects, AI Tools, Tools, Git
- **Overview tab:**
  - Stats cards (Projects, AI Agents, Tools, Health)
  - Activity chart (bar chart)
  - Active agents list with sparklines
- **Projects tab:**
  - Project cards (expandable accordion)
  - Add Project button + modal
  - Health score badge
  - Git info (branch, commits ahead/behind)
  - Recent sessions count
  - Presets count
  - Tools count
- **AI Tools tab:**
  - Agent cards (Claude, OpenCode, Qwen, Cursor)
  - Usage charts per agent
  - Agent detail popup (projects, models, efficiency metrics)
  - Multi-agent comparison chart
  - Leaderboard (Most Active, Most Efficient)
- **Tools tab:**
  - CLI tools list
  - NPM packages list
  - Reset Tools button
- **Git tab:**
  - Repo status per project
  - Branch info

**Data Sources:**
- `projects` - from database
- `aiUsage` - from AI agent data files
- `toolStats` - scanned from environment

---

### 6. External Page (`/external`)
**Features:**
- Activity grid (buttons for each external activity)
- Activity types: stopwatch (timed), sleep, checkin (quick)
- **Stats summary cards:**
  - Today (total time)
  - Consistency (%)
  - Sleep Deficit
  - Avg Sleep
- **Sleep Trends** chart (always visible when data exists)
- **Activity Breakdown** chart (always visible)
- **Weekly Comparison** chart (behind toggle)
- Active session view (when running):
  - Stopwatch display (for stopwatch type)
  - Sleeping display (for sleep type)
  - Activity-specific stats (Today/Week/Month)
  - Stop/Cancel/Wake Up buttons
- Session recovery modal (on app restart)
- Add Custom Activity modal
- Edit Activity modal

**Data Sources:**
- `activities` - from external_activities table
- `stats` - from external_sessions table
- `consistency` - calculated consistency score
- `sleepTrends` - sleep data

**Current Issues:**
- None
- Sleep trends CHART appears on BOTH External and Insights (duplicated!)
- Stopwatch/timer only appears AFTER clicking an activity to start
- No way to access "timer view" without starting an activity
- When clicking activity, shows stopwatch but NO activity-specific charts

---

### 7. Insights Page (`/reports`)
**Features:**
- Period selector (Week/Month)
- Stats cards:
  - Total Time
  - Consistency (%)
  - Streak (weeks)
  - Best Day
  - Sleep Deficit
- **Charts:**
  - Weekly Consistency (line chart with target line)
  - Typical Day (hourly grid 0-23)

**Data Sources:**
- External stats API
- Consistency score API
- Sleep trends API
- Best days API
- Typical day API

**Note:**
- Activity Breakdown and Sleep Trends were MOVED from Insights to External page

---

### 8. Database Page (`/database`)
**Features:**
- Record count display
- Log entries table viewer
- Refresh button
- Column formatting

**Data Sources:**
- `get-logs` IPC

---

### 9. Settings Page (`/settings`)
**Features:**
- Tabs: Category, Colors, General, Features
- **Category tab:**
  - Productivity tier section (configurable tiers)
  - Apps carousel (line-style list, expandable)
  - Websites toggle
  - Search filter
  - Smart Website Categorization section
- **Colors tab:**
  - Apps/Websites toggle
  - Search filter
  - Color grid (responsive)
  - Expand to show all
  - Magic Color button (AI generation)
- **General tab:**
  - Animation speed slider
  - Storage status
  - AI API key input + Test Connection
  - Main Browser dropdown
- **Features tab:**
  - Tracking settings
  - Browser extension status
  - Export/Clear data buttons

**Data Sources:**
- `categoryConfig` - persistent config
- `localAppColors` - localStorage
- `appColors` - from database

---

## 🔧 External Activities (What's Currently Available)

### Default Activities (seeded):
1. **Studying** - stopwatch, icon: BookOpen, color: indigo
2. **Exercise** - stopwatch, icon: Activity, color: emerald  
3. **Gym** - stopwatch, icon: Dumbbell, color: cyan
4. **Commute** - stopwatch, icon: Bus, color: amber
5. **Reading** - stopwatch, icon: Book, color: violet
6. **Sleep** - sleep (special wake-up modal), icon: Moon, color: indigo
7. **Eating** - stopwatch, icon: Utensils, color: orange
8. **Short Break** - checkin (quick), icon: Coffee, color: pink

### Activity Types:
- **stopwatch**: Timed - user starts, timer runs, user stops
- **sleep**: Sleep tracking - user starts sleep, selects wake time when waking
- **checkin**: Quick check-in with default duration

---

## 📋 What's Unique to Each Page (No Overlap)

| Page | Unique Features |
|------|-----------------|
| Dashboard | 3D Solar System (OrbitSystem), Heatmap, Live timer |
| Productivity | Tier breakdown, App vs Website comparison, Daily bars |
| Applications | Detailed app list with avg session |
| Browser Activity | Domain-level tracking, Live detection |
| IDE Projects | AI agent metrics, Git status, Tools scanning |
| External | Stopwatch + Sleep tracking (life activities) |
| Database | Raw data viewer |
| Settings | Color customization, Tiers config |

---

## 📋 Current Data Duplication Issues

### Issue 1: Activity Breakdown (DUPLICATED)
- **External page**: Horizontal bar chart showing hours per activity
- **Insights page**: Same horizontal bar chart
- **Solution**: Move TO External, REMOVE from Insights

### Issue 2: Sleep Trends (DUPLICATED)
- **External page**: Line chart with sleep hours
- **Insights page**: Same line chart  
- **Solution**: Move TO External, REMOVE from Insights

### Issue 3: Stopwatch Accessibility
- **Problem**: Stopwatch/timer ONLY appears after clicking activity
- **User can't**: Just see the timer display without starting
- **Solution**: Add timer/stopwatch section that's always visible

---

## 💡 Proposed Insights Page Redesign (NEW CONTENT)

Since Activity Breakdown + Sleep Trends move to External, Insights needs NEW content:

### Option A: Goals & Targets
- Daily/Weekly target hours
- Actual vs Target comparison
- Goal streak tracking

### Option B: Best Times Analysis  
- Most productive hour of day
- Most productive day of week
- Pattern analysis

### Option C: Focus Flow
- Session duration analysis
- Break frequency
- Deep work indicators

**Recommendation**: Goals & Targets - tracks daily/weekly targets vs actual, similar to fitness apps

---

## 📋 External Page Redesign (Proposed)

### When clicking an activity:
**Currently shows:**
- Timer/stopwatch display
- Activity name
- Start/Stop buttons

**Should show:**
- Timer/stopwatch display ✓
- Activity-specific stats (Today/Week/Month) ✓
- Activity-specific charts (customizable per activity)
- Option to customize what charts show for each activity

### Activity customization (per activity):
- Can choose which chart types to display
- Options: bar chart, line chart, heatmap, stats only
- Stored per activity in database

---

## 📝 Recent Changes

### 2026-04-26 — External Page Race Condition Fix

**Problem:** External activity stopwatch not restoring on app restart

**Root Cause:** Race condition - getActiveExternalSession was called BEFORE activities loaded, so session couldn't be matched to activity

**What Changed:**
- Fixed useEffect order in ExternalPage.tsx
- Now loads activities FIRST, then checks for active session
- Then matches session to activity properly

**Files Modified:**
- `src/pages/ExternalPage.tsx` - Fixed load order, added handleRestoreSession function

**To Test:**
1. Go to External page (/external)
2. Start an activity stopwatch
3. Close the app completely
4. Reopen the app
5. Go to External page - should show "Resume" modal with correct activity

**Result:** ✅ Stopwatch now properly restores on app restart

---

### 2026-04-22 — IDE Project Edit + Delete Features

**What Changed:**
1. ✅ Added edit functionality for IDE projects - can change name, path, IDE, language, repo URL, VCS type
2. ✅ Added soft-delete - projects can be deleted and restored from trash
3. ✅ Added trash/restore UI tab in IDE Projects page
4. ✅ Added delete confirmation dialog with warning before deleting
5. ✅ Fixed log spam in App.tsx (reloadOverrides was logging every second)
6. ✅ Fixed log spam in TerminalWindow.tsx (removed render logging)
7. ✅ Made tabs persistent across page navigation (IDE Projects, Terminal, Settings)
8. ✅ Made project expand state persistent in IDE Projects

**Files Modified:**
- `src/main.ts` - Added `update-project`, `delete-project`, `restore-project`, `get-all-projects` IPC handlers; added `deleted_at` column to projects table
- `src/preload.ts` - Added `updateProject`, `deleteProject`, `restoreProject`, `getAllProjects` API bindings
- `src/pages/IDEProjectsPage.tsx` - Added edit modal, delete confirmation dialog, trash tab with restore/permanent delete, tab/expand persistence
- `src/pages/TerminalPage.tsx` - Added tab persistence with localStorage
- `src/pages/SettingsPage.tsx` - Added tab persistence with localStorage
- `src/App.tsx` - Fixed reloadOverrides to only log when data actually changes
- `src/components/TerminalWindow.tsx` - Removed console.log on render

**Result:** IDE Projects now supports editing existing projects, soft-delete with restore, and log spam is fixed. Tab states now persist across page navigation.

---

### 2026-04-22 — External Tracker Restructuring

**What Changed:**
1. ✅ Fixed Sleep mode - now shows static "Sleeping since [time]" instead of running timer
2. ✅ Fixed sleep after midnight logic (11PM → 7AM = 8 hours correctly calculated)
3. ✅ Added session recovery modal - detects incomplete sessions on app restart
4. ✅ Added per-activity stats display in active session view (Today/Week/Month)
5. ✅ Created InsightsPage with charts (Weekly Consistency, Sleep Trends, Activity Breakdown)
6. ✅ Updated /reports route to show InsightsPage instead of placeholder

**Files Modified:**
- `src/pages/ExternalPage.tsx` - Fixed sleep display, added activity stats, recovery modal
- `src/pages/InsightsPage.tsx` - NEW - Charts and insights page
- `src/main.ts` - Added `get-active-external-session` and `get-activity-stats` IPC handlers
- `src/preload.ts` - Added new API bindings
- `src/App.tsx` - Added InsightsPage route

**Result:** External page shows static sleep display, Insights page shows all charts

---

## ⚠️ Known Issues

### 1. Activity Breakdown DUPLICATED (HIGH)
- Both External and Insights show Activity Breakdown chart
- Should move to External, remove from Insights

### 2. Sleep Trends DUPLICATED (HIGH)
- Both External and Insights show Sleep Trends chart
- Should move to External, remove from Insights

### 3. Stopwatch Not Accessible Without Starting (MEDIUM)
- Timer view only appears after clicking an activity
- User wants ability to see timer without starting

### 4. Insights Page Empty After Consolidation (MEDIUM)
- After moving charts to External, Insights has no content
- Need new content: Goals/Targets recommended

### 5. Activity-Specific Charts Not Implemented (MEDIUM)
- When clicking activity, shows timer but no detailed charts
- User wants customizable charts per activity

---

## 🎯 Next Steps / TODO

### High Priority
- [ ] Remove Activity Breakdown from Insights (duplicate)
- [ ] Remove Sleep Trends from Insights (duplicate)
- [ ] Make Insights show Goals/Targets content
- [ ] Add always-visible timer section to External page

### Medium Priority
- [ ] Allow per-activity chart customization
- [ ] Add activity-specific detailed stats view

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.75 | 2026-04-26 | External stopwatch restore fix |
| 1.74 | 2026-04-22 | IDE edit/delete, External restructuring |
| 1.73 | 2026-04-21 | Multiple fixes (browsers, tracking, IDE) |
| ... | ... | ... |

---

**Last Updated:** 2026-04-26 (v1.75)
**Maintained By:** AI Development Team