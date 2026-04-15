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
|---------|------------|
| **Galaxy View** | Visualize apps as planets orbiting by category |
| **Dashboard** | See today's focus time and productivity |
| **Applications** | Detailed breakdown by app |
| **Browser Activity** | Track websites in Chrome/Firefox |
| **Settings** | Customize categories, colors, auto-start |

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

1. Install the DeskFlow browser extension
2. Enable "Allow in incognito" in Chrome extensions
3. Make sure the browser extension is enabled

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
│   ├── main.ts         # Electron main process
│   ├── preload.ts     # IPC bridge
│   └── App.tsx       # React app entry
├── agent/            # AI agent resources
├── public/           # Static assets
├── dist/             # Built renderer
├── dist-electron/    # Built Electron
├── release/          # Packaged executables
│   └── win-unpacked/ # DeskFlow.exe
└── PROBLEMS.md      # Known issues
```

---

## 🧰 Tech Stack

### Core Technologies
| Technology | Purpose |
|------------|---------|
| Electron 41 | Desktop wrapper |
| React 19 | UI framework |
| Vite | Build tool |
| TypeScript | Type safety |
| Tailwind CSS | Styling |

### 3D & Visualization
| Technology | Purpose |
|------------|---------|
| Three.js | 3D rendering engine |
| @react-three/fiber | React Three.js integration |
| @react-three/drei | Three.js helpers & components |
| @react-three/postprocessing | Post-processing effects |
| postprocessing | GPU-accelerated effects |

### Data & Storage
| Technology | Purpose |
|------------|---------|
| better-sqlite3 | Local SQLite database |
| active-win | Active window detection |
| date-fns | Date manipulation |

### UI & Animation
| Technology | Purpose |
|------------|---------|
| Framer Motion | React animations |
| Lucide React | Icons |
| Chart.js | Data visualization |
| react-chartjs-2 | React Chart.js wrapper |
| canvas-confetti | Celebration effects |

---

## 🌟 Advanced Features

### 3D Galaxy Visualization
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
- **System Tray** - Background operation
- **Window Tracking** - Native active window detection
- **Browser Extension** - Chrome/Firefox website tracking
- **SQLite Storage** - Persistent local data

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

- 🌌 **Galaxy View** - 3D visualization of app usage
- 📊 **Dashboard** - Focus time and productivity scores
- 🌐 **Browser Tracking** - Track website activity
- 🔍 **Deep Search** - Query your usage history
- ⚡ **Auto-start** - Launch on system boot
- 🔔 **System Tray** - Runs in background
- 📈 **Heatmap** - Daily activity visualization
- 🎯 **Focus Tracking** - Categorize productive time

---

## 📚 Documentation

- **Quick Start Guide** - Above
- **Development** - [`agent/`](agent/)
- **Project State** - [`agent/state.md`](agent/state.md)
- **Architecture** - [`agent/context.md`](agent/context.md)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-13 | Initial release |
| 1.1.0 | 2026-04-14 | Advanced 3D visuals with post-processing |

---

## 🚀 Development Highlights

### Recent Updates (v1.1.0)
- **Phenomenal 3D Graphics** - Post-processing pipeline with Bloom, tone mapping
- **Enhanced Sun Rendering** - Multi-layer corona with animated textures
- **Improved Galaxy** - 8,000 particles with spiral arm distribution
- **Performance Monitor** - Adaptive quality based on FPS
- **DevTools Access** - Press Ctrl+Shift+I to inspect

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

**Last Updated:** 2026-04-14

**Maintained By:** DeskFlow Team