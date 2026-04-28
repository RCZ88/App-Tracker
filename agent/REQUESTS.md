# 📋 User Requests Log

**Purpose:** Track all user requests, their status, and history. This ensures nothing is forgotten and provides context for future sessions.

---

## 📝 How to Use This File

### Adding New Requests:
```markdown
### Request #XXX - [Short Title]

**Date:** YYYY-MM-DD
**Status:** [Pending | In Progress | Completed | Cancelled]
**Priority:** [High | Medium | Low]
**Category:** [Feature | Bug Fix | UI/UX | Documentation | Refactor]

**Request:** 
"What the user asked for"

**Context:**
- Why they asked for it
- Related issues or features

**Outcome:**
- What happened
- Links to related files/changes
```

### Updating Status:
When a request is completed, update the status and add notes about what was done.

---

## 🔄 Recent Requests

### Request #001 - External Activity Dashboard Integration
**Date:** 2026-04-26
**Status:** Completed
**Priority:** High
**Category:** Feature

**Request:** 
Dashboard should sync with external activity - show active external activity on the stopwatch, log external activities, and resume external activity after internal activity ends.

**What Was Done:**
- Dashboard timer now shows external activity time when running
- External activity name displayed on dashboard when active
- Timer switches between productive time and external time based on session state

---

### Request #002 - Remove Timeline Select from External Page
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Medium
**Category:** UI/UX

**Request:** 
Remove the dropdown timeline selector from External page - it should use the top nav timeline instead.

**What Was Done:**
- Removed select element from ExternalPage.tsx header
- External page now uses shared timeline from top navigation

---

### Request #003 - Edit External Activities
**Date:** 2026-04-26
**Status:** Completed
**Priority:** High
**Category:** Feature

**Request:** 
Ability to edit external activities - name, type, icon, color, and delete.

**What Was Done:**
- Added edit button that appears on hover over activity
- Edit modal allows changing name, type, icon, and color
- Delete functionality added
- Uses existing `updateExternalActivity` and `deleteExternalActivity` IPC handlers

---

### Request #004 - Stopwatch Randomly Resets to 0
**Date:** 2026-04-26
**Status:** Completed
**Priority:** High
**Category:** Bug Fix

**Request:** 
Stopwatch on dashboard randomly goes to 0 and shows "Paused" state.

**Root Cause Found:**
- `setIsPaused(false)` was called during reset, but timer should stay paused until productive activity resumes
- Duplicate intervals created when sessionStartTime reset

**What Was Done:**
- Changed `setIsPaused(true)` on reset (was false)
- Removed duplicate interval creation in productive return path
- Timer now properly pauses and waits for productive activity to resume

---

### Request #005 - Detect App Tracker Electron App
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Medium
**Category:** Bug Fix

**Request:** 
DeskFlow/Electron app was being hidden from tracking. Want it to show when user opens the app.

**What Was Done:**
- Changed system app detection to show DeskFlow/Electron as current app
- App is still not added to activity feed (to avoid pollution)
- User can now see what they're using when in the app

---

### Request #006 - External Activity Settings Removed from Dashboard
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Low
**Category:** UI/UX

**Request:** 
Remove the tracking mode toggle (Always On / On Interaction) from the external activity controls on dashboard.

**What Was Done:**
- Removed the tracking mode toggle and helper text
- Kept only Start/Stop buttons for simplicity

---

### Request #007 - Timer Container Width Fixed
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Low
**Category:** UI/UX

**Request:** 
Main timer section had awkward width that didn't follow any pattern.

**What Was Done:**
- Added `max-w-xl mx-auto` to center the timer and constrain width
- Responsive padding: `p-8 sm:p-12`

---

### Request #008 - Focus/Total Toggle Position Fixed
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Low
**Category:** UI/UX

**Request:** 
Focus/Total toggle position was being affected by adjacent text length.

**What Was Done:**
- Added `flex-shrink-0` to toggle container and buttons
- Fixed width `w-[80px]` for buttons
- Toggle now stays in fixed position regardless of adjacent text

---

### Request #009 - Remove Browser Blacklist from App Tracking
**Date:** 2026-04-26
**Status:** Completed
**Priority:** High
**Category:** Feature

**Request:** 
Remove the hardcoded exclusion of tracking browser (Comet Browser) from application tracking. Browser app should be included in app page stats.

**What Was Done:**
- Removed `trackingBrowser` exclusion from:
  - `computedAppStats`
  - `appsTimeByCategory`
  - `timeByCategory`
  - `timeBreakdown`
- All apps now included regardless of browser selection

---

### Request #010 - Solar System Toggle Opens Full View
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Medium
**Category:** Bug Fix

**Request:** 
Clicking App/Website toggle on Dashboard solar system was opening the full solar system modal.

**What Was Done:**
- Added `e.stopPropagation()` to toggle button clicks
- Toggle now only switches data without opening modal

---

### Request #011 - Bigger Modal Sizes & Fullscreen
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Medium
**Category:** UI/UX

**Request:** 
Heatmap and Solar System modals were too small. Add fullscreen option for solar system.

**What Was Done:**
- Heatmap modal: increased to `max-w-3xl`
- Solar modal: increased to `max-w-4xl`
- Added fullscreen toggle button to solar modal
- Fullscreen mode uses `fixed inset-4 z-50` to cover viewport

---

### Request #012 - Generic Agent Instructions
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Medium
**Category:** Documentation

**Request:** 
Create a separate generic agent instructions file that can be reused across projects.

**What Was Done:**
- Created `agent/GENERIC_AGENT.md` with:
  - PRIME STATE performance standards
  - Think before doing analysis phase
  - Phase planning for large task lists
  - Auto-reflect guidelines
  - Documentation update rules
  - Common mistakes to avoid
  - Communication best practices

---

### Request #013 - Create Requests.md for Tracking
**Date:** 2026-04-26
**Status:** Completed
**Priority:** Medium
**Category:** Documentation

**Request:** 
Create a requests tracking file to log all user requests with history.

**What Was Done:**
- Created `agent/REQUESTS.md` with:
  - How to add new requests
  - Request format template
  - Recent requests with status

---

## 📊 Request Summary by Priority

### High Priority (Completed)
- Request #001: External Activity Dashboard Integration
- Request #003: Edit External Activities
- Request #004: Stopwatch Randomly Resets
- Request #009: Remove Browser Blacklist

### Medium Priority (Completed)
- Request #002: Remove Timeline Select
- Request #005: Detect Electron App
- Request #010: Solar System Toggle Fix
- Request #011: Bigger Modals & Fullscreen
- Request #012: Generic Agent Instructions
- Request #013: Create Requests.md

### Low Priority (Completed)
- Request #006: Remove External Settings
- Request #007: Timer Container Width
- Request #008: Toggle Position Fix

---

**Last Updated:** 2026-04-26
**Total Requests:** 13