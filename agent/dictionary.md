# App Tracker Context Dictionary

## Key Terms & Meanings

### Tracking Browser
- **Setting Location:** Settings → Browser Activity page
- **What it is:** The browser with the DeskFlow extension installed (e.g., "Comet ★")
- **How it works:** When this browser is detected as active window, tracking switches from APP mode to WEBSITE mode
- **Important:** This is DYNAMIC - reads from `browserWithExtension` preference in Settings

### Recent Sessions / Activity Feed
- **Location:** Dashboard page, bottom section
- **What it shows:** List of tracked apps and websites with live stopwatches
- **Active session:** Has green pulsing dot, shows live timer counting up (格式: HH:MM:SS)
- **Completed session:** Shows "X ago" (time since finished)

### Timer / Stopwatch
- **Location:** Dashboard page, main hero section
- **What it tracks:** Productive time only (from productive-tier apps/websites)
- **Behavior:** 
  - Counts UP when using productive apps
  - Resets/pauses based on timerBehavior settings when switching to distracting apps
  - Continues tracking when in browser (uses website category, not app category)

### Tracking Modes

| Mode | When Active | Shows in Timer | Shows in Recent Sessions |
|-----|-------------|--------------|-------------------------|
| **App** | Any non-browser app | App name, category | App name with live stopwatch |
| **Browser** | Tracking browser window | Website title, category | Website domain with live stopwatch |
| **Electron** | DeskFlow/Electron window | Previous app (hides Electron) | Previous app |

### Categories / Tiers

| Tier | Default Apps | Timer Behavior |
|------|-------------|----------------|
| **Productive** | IDE, AI Tools, Education, Productivity | Timer counts up |
| **Neutral** | Communication, Design, Browser | Timer continues (configurable) |
| **Distracting** | Entertainment, Social Media | Timer resets/stops (configurable) |

### timerBehavior Settings
- **Location:** Settings → Behavior section
- **Options per tier:** `pause`, `reset`, `ignore`
- **neutralAction:** What happens when switching FROM productive TO neutral
- **distractingAction:** What happens when switching FROM productive TO distracting

### IPC Endpoints

| Endpoint | Purpose |
|----------|---------|
| `browserWithExtension` | Gets/Sets the tracking browser name from Settings |
| `timerBehavior` | Gets/Sets timer behavior (neutralAction, distractingAction) |
| `onForegroundChange` | Event: active window changed |
| `onBrowserTrackingEvent` | Event: browser tab changed (from extension) |
| `addLog` | Saves app/website session to database |

### File References

| File | Purpose |
|------|---------|
| `src/pages/DashboardPage.tsx` | Main UI: timer, recent sessions, heatmap |
| `src/pages/SettingsPage.tsx` | Settings UI: timerBehavior, browserWithExtension |
| `src/App.tsx` | Main app shell, loads preferences, passes to Dashboard |
| `src/main.ts` | Electron main process, database, IPC handlers |

### Key State Variables

| Variable | Where Defined | Purpose |
|----------|---------------|---------|
| `trackingBrowser` | App.tsx | Browser name from Settings (e.g., "Comet") |
| `isInBrowser` | DashboardPage.tsx | Boolean - is user currently in tracking browser |
| `currentApp` | DashboardPage.tsx | Current foreground app data |
| `currentWebsite` | DashboardPage.tsx | Current website data from browser extension |
| `activityFeed` | DashboardPage.tsx | Array of recent sessions with timestamps |
| `timerBehavior` | App.tsx / DashboardPage.tsx | { neutralAction, distractingAction } |
| `tierAssignments` | App.tsx / DashboardPage.tsx | { productive, neutral, distracting } arrays |

### Flow: How Tracking Works

1. **App active** → `onForegroundChange` fires → check if tracking browser
2. **If tracking browser** → set `isInBrowser = true`, don't update `currentApp`
3. **Browser tab changes** → `onBrowserTrackingEvent` fires → show website
4. **Switch away from browser** → set `isInBrowser = false`, resume app tracking
5. **Timer logic** → uses `currentApp.category` OR `currentWebsite.category` depending on mode