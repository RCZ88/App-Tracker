# 🌌 DeskFlow - AI-Powered Productivity Tracker

**Electron desktop app that visualizes your app usage as an interactive 3D galaxy.**

---

## 🚀 Quick Start

### Option 1: Use the Desktop App (Recommended)

1. **Double-click** `DeskFlow.lnk` on your desktop
2. The app will launch with a window
3. Click the **system tray icon** (blue circle) to show/hide the window

That's it! The app runs in the background and tracks your active applications.

### Option 2: Run from Source Code

If you want to modify or develop the app:

```bash
# 1. Clone or download this repository
cd "App Tracker"

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev
```

The app will open in your browser with hot reload.

---

## 📦 Installation

### Building the Executable

If you need to create a fresh executable:

```bash
# Install dependencies (first time only)
npm install

# Build the app
npm run build

# Package as Windows executable
npx electron-builder --win portable
```

The executable will be created at:
```
release/win-unpacked/DeskFlow.exe
```

### Adding to Desktop

1. Go to `release/win-unpacked/`
2. Right-click `DeskFlow.exe`
3. Send to > Desktop (create shortcut)

Or use the auto-created shortcut on your desktop.

---

## 📖 How to Use

### First Launch

1. **Grant permissions** when prompted (for window tracking)
2. The app starts tracking immediately
3. Use the app normally - it runs in the background

### System Tray

| Action | Result |
|--------|--------|
| Click tray icon | Show/hide DeskFlow window |
| Right-click tray | Context menu (Show/Toggle Tracking/Quit) |

### Main Features

| Feature | Description |
|---------|-------------|
| **Galaxy View** | Two separate 3D galaxies - apps (blue) and websites (cyan/violet nebula) |
| **Dashboard** | See today's focus time and productivity with heatmap |
| **Applications** | Detailed breakdown by app with time totals |
| **Browser Activity** | Track websites in Chrome/Firefox |
| **Settings** | Customize categories, colors, animation speed, auto-start |

### Galaxy Navigation

| Action | Result |
|--------|--------|
| Drag left | Return to Apps Galaxy |
| Drag right | Visit Websites Galaxy |
| Click planet | Fly camera to that planet |
| Click legend item | Fly camera to that planet |

### Timeline Selection

Use the timeline buttons (Today/Week/Month/All) to filter data on:
- Applications page
- Browser Activity page
- Galaxy view

### Auto-Start

To start DeskFlow automatically when you turn on your computer:

1. Open DeskFlow
2. Go to Settings
3. Enable "Start on system boot"

---

## 🛠️ Troubleshooting

### "Active-win" error on startup

The app needs `active-win` native module. If you see errors:

```bash
# Rebuild native modules
npm run postinstall
# Or manually:
npx electron-rebuild
```

### App not tracking

1. Make sure tracking is enabled (click tray icon > Toggle Tracking)
2. Check that no other window tracking app is running
3. Restart the app

### Browser tracking not working

1. Make sure the DeskFlow browser extension is installed
2. Enable "Allow in incognito" in Chrome/Firefox extensions page
3. Enable "Allow access to file URLs" if using file:// protocol
4. Click the extension icon to confirm it's tracking
5. Check that the extension shows a green indicator when visiting sites

### Storage shows "Loading..."

The database may be initializing. Wait a few seconds. If it persists:

1. Check the app has write permissions to its data folder
2. Clear data in Settings > General > Clear Data
3. Restart the app

---

## 📁 Project Structure

```
App Tracker/
├── src/
│   ├── main.ts              # Electron main process (tracking, DB, IPC)
│   ├── preload.ts           # IPC bridge (contextBridge)
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app (routing, state, computation)
│   ├── components/
│   │   └── OrbitSystem.tsx  # 3D galaxy visualization
│   └── pages/
│       ├── StatsPage.tsx          # Applications breakdown
│       ├── ProductivityPage.tsx   # Productivity scores & trends
│       ├── BrowserActivityPage.tsx # Website tracking
│       ├── SettingsPage.tsx       # Category/colors/settings
│       └── DatabasePage.tsx       # DB viewer
├── browser-extension/       # Chrome/Firefox extension
├── agent/                   # AI agent resources & docs
├── public/                  # Static assets
├── dist/                    # Built renderer
├── dist-electron/           # Built Electron main/preload
├── release/win-unpacked/    # Packaged executable
│   └── DeskFlow.exe
└── PROBLEMS.md             # Known issues

---

## 🧰 Tech Stack

### Core Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | ^41.1.1 | Desktop wrapper |
| React | ^19.2.0 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | ^7.3.1 | Build tool |
| Tailwind CSS | ^4.2.1 | Styling |
| React Router | ^7.13.1 | Navigation |

### 3D & Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| Three.js | ^0.183.2 | 3D rendering engine |
| @react-three/fiber | ^9.5.0 | React Three.js integration |
| @react-three/drei | ^10.7.7 | Three.js helpers & components |
| @react-three/postprocessing | ^3.0.4 | Post-processing effects |
| postprocessing | ^6.39.0 | GPU-accelerated effects |
| r3f-perf | ^7.2.3 | Performance monitoring |

### Data & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| better-sqlite3 | ^12.8.0 | Local SQLite database |
| active-win | ^8.2.1 | Active window detection |
| date-fns | ^4.1.0 | Date manipulation |

### UI & Animation
| Technology | Version | Purpose |
|------------|---------|---------|
| Framer Motion | ^12.35.0 | React animations |
| Lucide React | ^0.577.0 | Icons |
| Chart.js | ^4.5.1 | Data visualization |
| react-chartjs-2 | ^5.3.1 | React Chart.js wrapper |
| canvas-confetti | ^1.9.4 | Celebration effects |
| @dnd-kit | ^6.3.1 | Drag and drop |

---

## 🌟 Advanced Features

### 3D Galaxy Visualization
- **Two-Galaxy System** - Apps Galaxy and Websites Galaxy are separate 3D worlds
- **Apps Galaxy** - Spiral galaxy with 8,000+ particles, blue/purple color theme
- **Websites Galaxy** - Nebula-style dust cloud with cyan/violet colors
- **Camera-Based Detection** - Drag right to visit Websites Galaxy, left for Apps Galaxy
- **Spiral Galaxy Rendering** - 8,000+ particles with custom color gradients
- **Solar System View** - Animated planets with orbits, rings, and moons
- **Custom Shaders** - GLSL shaders for particle systems and effects
- **Post-Processing** - Bloom, tone mapping, vignette, chromatic aberration
- **Performance Optimization** - Adaptive quality with PerformanceMonitor
- **GPU Acceleration** - High-performance WebGL settings

### Visual Effects
- **Bloom/Glow** - HDR bloom for emissive objects (sun, stars)
- **ACES Filmic Tone Mapping** - Cinematic color grading
- **Atmospheric Scattering** - Fresnel effects for planet atmospheres
- **Layered Corona** - Multi-layer sun glow with additive blending
- **Vignette & Chromatic Aberration** - Cinematic lens effects

### Graphics Pipeline
- **Custom Point Materials** - Soft glow particles with vertex colors
- **Emissive Materials** - High-intensity emissive with toneMapped=false
- **Additive Blending** - For all glow effects
- **Depth Management** - Proper depthWrite handling for transparency

### Electron Features
- **System Tray** - Background operation with show/hide toggle
- **Window Tracking** - Native active window detection via active-win
- **Browser Extension** - Chrome/Firefox website tracking with delta-based updates
- **SQLite Storage** - Persistent local data with JSON fallback
- **Auto-Start** - Launch on system boot (configurable)

---

## 🤖 For Developers

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Packaging

```bash
# Portable exe (single file)
npx electron-builder --win portable

# Installer
npx electron-builder --win nsis
```

---

## 📋 Key Features

- 🌌 **Two-Galaxy System** - Apps Galaxy (blue/purple) + Websites Galaxy (cyan/violet nebula)
- 📊 **Dashboard** - Focus time, productivity scores, and heatmap with week navigation
- 🌐 **Browser Tracking** - Track websites in Chrome/Firefox via browser extension
- 🔍 **Deep Search** - Query your usage history across all apps and websites
- ⚡ **Auto-start** - Launch on system boot
- 🔔 **System Tray** - Runs in background, click to show/hide
- 📈 **Heatmap** - Daily activity visualization with week navigation
- 🎯 **Focus Tracking** - Categorize apps as Productive/Neutral/Distracting
- 🎨 **Custom Colors** - Per-app and per-category color customization
- 📱 **Category Overrides** - Override automatic categorization for any app/website

---

## 📚 Documentation

- **Quick Start Guide** - Above
- **Development** - [`agent/`](agent/)
- **Project State** - [`agent/state.md`](agent/state.md)
- **Architecture** - [`agent/context.md`](agent/context.md)
- **Known Issues** - [`agent/PROBLEMS.md`](agent/PROBLEMS.md)
- **Browser Extension** - [`browser-extension/`](browser-extension/)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-04 | Initial release |
| 1.1 | 2026-04-05 | Fixed data persistence, added storage diagnostics |
| 1.2 | 2026-04-05 | Solar system visual overhaul, DB expansion, period filtering |
| 1.3 | 2026-04-07 | Data persistence fixes, heatmap fix, time period unification |
| 1.4 | 2026-04-07 | Productivity tracking, smart YouTube categorization |
| 1.5 | 2026-04-08 | Browser tracking delta fix, data cleanup button |
| 1.6 | 2026-04-09 | Customizable productivity & category system |
| 1.7 | 2026-04-09 | Focus/Total pie chart sync, historical data toggle |
| 1.7.1 | 2026-04-10 | Real-time 30-second polling, day change detection |
| 1.11 | 2026-04-14 | Fixed Top Bar Total, OrbitSystem data filtering |
| 1.12 | 2026-04-15 | App colors persistence, console spam removal |
| 1.14 | 2026-04-16 | Settings page verification - all features working |
| 1.15 | 2026-04-16 | Category override reload fix |
| 1.17 | 2026-04-16 | Category config persistence across restarts |
| 1.18 | 2026-04-16 | Two-galaxy system: Apps + Websites separate |
| 1.19 | 2026-04-16 | Reflection documentation, auto-reflect rules |

---

## 🚀 Development Highlights

### Recent Updates (v1.18 - Two Galaxy System)
- **Two-Galaxy System** - Apps Galaxy and Websites Galaxy are now separate
- **Apps Galaxy** - 8,000+ particles with spiral arm distribution (blue/purple theme)
- **Websites Galaxy** - Nebula-style dust cloud (cyan/violet theme)
- **Camera-Based Detection** - Automatically switches galaxy when you drag
- **Galaxy Type Indicator** - UI shows current galaxy (APPS / WEBSITES)
- **Data Consistency** - Galaxy data now matches Applications page exactly

### Previous Updates (v1.12 - v1.17)
- **Category Override Persistence** - Changes now persist across app restarts
- **Real-Time Data Refresh** - 30-second polling keeps all views updated
- **Heatmap Week Navigation** - LEFT/RIGHT arrows to navigate weeks
- **Productivity Score Sync** - Dashboard and Productivity page now match
- **App Colors Persistence** - Colors saved and restored correctly
- **Console Spam Removal** - Removed 10+ debug logs flooding console

### Building from Source
```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production build
npm run build

# Package as executable
npx electron-builder --win portable
```

---

## 🔧 Debugging & Development

### Opening DevTools
Press **Ctrl+Shift+I** to open the developer console. This works in both development and production modes.

### Performance Monitoring
The app includes a built-in PerformanceMonitor that:
- Monitors FPS during 3D rendering
- Automatically reduces quality if FPS drops below 30
- Can increase quality when performance improves

### Console Logs
Check the console for:
- `[DeskFlow]` - App state and loading information
- `[OrbitSystem]` - 3D visualization logs
- Errors will appear in red

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section above
2. Check [`PROBLEMS.md`](PROBLEMS.md) for known issues
3. Restart the app
4. Clear data in Settings if needed

---

**Last Updated:** 2026-04-16

**Maintained By:** DeskFlow Team