# Human Testing Checklist

**Last Updated:** 2026-04-27

---

## Issues Needing User Testing

| Issue | What Was Changed | Test Steps | Expected | Status |
|-------|-----------------|------------|----------|--------|
| #51 App switching | Fixed - now uses exact match, clears browser state when leaving browser | 1. Set Chrome as tracking browser 2. Open YouTube 3. Switch to VS Code | Timer shows VS Code, not YouTube | ⏳ Test |
| #52 Timer colors | Added tier-based colors: green (productive), red (distracting), purple (external), gray (idle) | 1. Open productive app 2. Open distracting app 3. Start external | Border/timer changes color | ⏳ Test |
| #53 Elapsed time | Fixed inverted time calculation | 1. View Recent Sessions | Positive durations | ⏳ Test |
| #54 Fullscreen | Changed to h-screen for fullscreen | 1. Click fullscreen on Solar | Full height | ⏳ Test |
| #50 Duplicate buttons | Removed duplicate | 1. Go to External | No duplicates | ⏳ Test |
| #55 Distracting timer | Changed default to 'ignore' | 1. Open distracting app | Timer runs (not paused) | ⏳ Test |

---

## How to Test

### Issue #51: App Switching (MOST IMPORTANT)
1. Go to Settings → set Chrome as Browser with extension
2. Go to YouTube in Chrome
3. Switch to VS Code (or any non-Chrome app)
4. Timer should show VS Code (not YouTube)
5. Wait 10+ seconds - should stay on VS Code
6. ✅ Pass if timer stays on VS Code

### Issue #55: Distracting Timer
1. Open a distracting app (game, etc)
2. Timer should continue running (not pause/reset)
3. ✅ Pass if timer is active

---

## Results

| Issue | ✅ Pass | ❌ Fail | Notes |
|-------|--------|--------|-------|
| #51 | | | |
| #52 | | | |
| #53 | | | |
| #54 | | | |
| #50 | | | |
| #55 | | | |

---