# Problem: Data Inconsistency Across DeskFlow Views

## Context
DeskFlow is an Electron desktop app that tracks application usage time. The app has multiple views/pages that should display consistent data, but currently they show different data depending on the timeline filter (Today/Week/Month/All).

## Summary of Changes Attempted

We made changes to `src/App.tsx`:
1. Created `computedAppStats` useMemo that filters `allLogs` by period and excludes browser apps
2. Updated StatsPage, ProductivityPage, and SettingsPage to use `computedAppStats` instead of `appStats`

## The Problem

There are 4 data consistency issues:

### 1. Heatmap Always Shows Same Data
- **Current behavior**: Works correctly - shows last 7 days regardless of timeline filter
- **How it works**: Uses `allLogs` which is set once on mount and never changes

### 2. Planet Visualization Shows Different Apps Than Applications Page
- **Expected**: Planet should show the SAME apps as the Applications page (StatsPage)
- **Current behavior**: 
  - Applications page (`StatsPage.tsx`) receives `appStats` which filters OUT browser apps (Chrome, Firefox, Edge, etc.) and browser-tracked entries (websites)
  - Planet (OrbitSystem) receives `logs` which includes ALL activity including browser apps
  - Result: Different apps appear on each view

### 3. Top Bar Total Time Doesn't Match Timeline Selection
- **Expected**: Top bar shows total time for the selected period (Today/Week/Month/All)
- **Current behavior**: Need to verify if this works correctly

### 4. Data Filtering Logic
- The Applications page uses `getAppStats(selectedPeriod)` API which applies these filters:
  - Excludes entries where `is_browser_tracking === true`
  - Excludes browser apps: Chrome, Firefox, Safari, Edge, Brave, Opera, Google Chrome, Microsoft Edge, Comet, Browser

## Relevant Files

- `src/App.tsx` - Main component with state management
  - Line ~204: `selectedPeriod` state
  - Line ~205: `allLogs` state (all data, never changes)
  - Line ~208-224: `filteredLogs` useMemo - filters allLogs by period
  - Line ~227-229: Syncs `logs` state with `filteredLogs`
  - Line ~369-415: `computedAppStats` useMemo - attempts to filter by period + exclude browsers
  - Line ~1623: Passes `logs` to OrbitSystem (planet)
  - Line ~1842: Passes `appStats` to StatsPage (applications)

- `src/components/OrbitSystem.tsx` - Planet visualization
  - Line ~329-335: `computePlanets` function filters out browser apps and browser-tracked
  - Line ~1638-1675: `computePlanetsFromStats` alternative that uses pre-computed stats

- `src/pages/StatsPage.tsx` - Applications page that shows app statistics
  - Line ~67: Receives `appStats` prop

- `src/pages/ProductivityPage.tsx` - Productivity page
  - Line ~99: Receives `appStats` prop

## What Was Attempted

We tried to create a `computedAppStats` useMemo in App.tsx that:
1. Filters `allLogs` by period (today/week/month)
2. Excludes browser-tracked entries and browser apps
3. Groups by app and calculates totals

Then updated StatsPage, ProductivityPage, and SettingsPage to use `computedAppStats` instead of `appStats`.

## What Needs To Be Fixed

1. Ensure planet (OrbitSystem) shows exactly the same apps as the Applications page
2. Ensure the top bar total time matches the selected timeline
3. Ensure heatmap continues to work correctly (always shows last 7 days)

The key insight is that both views need to use the SAME data source with the SAME filtering logic applied consistently.