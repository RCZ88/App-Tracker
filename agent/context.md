# 📋 Project Context

**Purpose:** Comprehensive overview of the DeskFlow project architecture, tech stack, and conventions.

---

## 🎯 Project Overview

**DeskFlow** - Electron desktop app that visualizes app usage data as a 3D solar system.

**Core Features:**
- Real-time window tracking via `active-win`
- 3D orbital visualization using React Three Fiber
- Procedural planet textures based on app category
- SQLite database with JSON fallback
- Heatmap and analytics views

---

## 🛠️ Tech Stack

### Core Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| Electron | ^41.1.1 | Desktop wrapper |
| React | ^19.2.0 | UI framework |
| TypeScript | ~5.9.3 | Type safety |
| Vite | ^7.3.1 | Build tool |

### 3D & Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| Three.js | ^0.183.2 | 3D rendering |
| @react-three/fiber | ^9.5.0 | React Three.js bridge |
| @react-three/drei | ^10.7.7 | Three.js helpers |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | ^4.2.1 | Styling |
| Framer Motion | ^12.35.0 | Animations |
| Chart.js | ^4.5.1 | Charts |
| Lucide React | ^0.577.0 | Icons |

### Data & Tracking
| Technology | Version | Purpose |
|------------|---------|---------|
| better-sqlite3 | ^12.8.0 | Database |
| active-win | ^8.2.1 | Window tracking |
| date-fns | ^4.1.0 | Date handling |

---

## 📁 Project Structure

```
App Tracker/
├── src/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # IPC bridge
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Main app component
│   └── components/
│       └── OrbitSystem.tsx  # 3D solar system
├── dist/                    # Built renderer
├── dist-electron/           # Built Electron
├── agent/                   # AI agent resources
├── skills/                  # Skill definitions
├── package.json             # Dependencies
├── vite.config.ts           # Vite config
└── tsconfig.json            # TypeScript config
```

---

## 🔑 Key Architectural Decisions

### Electron Architecture
- **Main process** - `src/main.ts` → `dist-electron/main.cjs`
- **Preload script** - `src/preload.ts` → `dist-electron/preload.cjs`
- **Renderer** - Vite builds to `dist/`
- **Communication** - IPC via contextBridge

### Database Strategy
- **Primary** - SQLite via `better-sqlite3`
- **Fallback** - JSON file if SQLite fails
- **Location** - `%APPDATA%/deskflow/deskflow-data.db`

### Texture Generation
- **Procedural** - Canvas-based textures
- **Category-based** - Different patterns per app category
- **Seed-based** - Consistent textures per app name

### Lighting System
- **Ambient light** - Base visibility for all planets
- **Hemisphere light** - Sky/ground illumination
- **Sun point light** - Directional from center
- **Fill light** - Outer planet illumination
- **Emissive** - Planet self-illumination

---

## 🎨 Visual Design System

### Planet Categories
| Category | Pattern | Color Example |
|----------|---------|---------------|
| IDE | Gas giant bands | Indigo (#4f46e5) |
| AI Tools | Spiral galaxy | Purple (#8b5cf6) |
| Browser | Spotted/swirled | Blue (#3b82f6) |
| Entertainment | Radial burst | Red (#ef4444) |
| Communication | Network nodes | Teal (#14b8a6) |
| Design | Geometric | Pink (#a855f7) |
| Productivity | Grid/stripes | Slate (#64748b) |
| Other | Noise pattern | Gray (#888888) |

### Size & Distance Logic
- **Most used apps** → Largest planets, furthest from sun
- **Least used apps** → Smallest planets, closest to sun
- **Orbit spacing** → Logarithmic (8, 16.4, 31.5... AU)
- **Collision avoidance** → Minimum 2.0 AU spacing

---

## 🔧 Build System

### Development
```bash
npm run dev          # Vite dev server (web only)
npm start            # Electron app
```

### Production
```bash
npm run build:renderer  # Build React to dist/
npm run build:electron  # Build Electron to dist-electron/
npm run build           # Both
```

### Key Configs
- **Vite** - `base: './'` for file:// protocol
- **TypeScript** - ES2020 for Electron, ESNext for React
- **Electron** - CommonJS output (.cjs extension)

---

## ⚠️ Known Technical Constraints

### Electron + Native Modules
- `better-sqlite3` requires Visual Studio Build Tools
- Path with spaces causes node-gyp failures
- JSON fallback active when SQLite unavailable

### Three.js + R3F
- CanvasTexture requires `colorSpace = SRGBColorSpace`
- Texture wrapping: `RepeatWrapping` for both S and T
- Sphere geometry: 64x64 segments minimum

### React + Electron
- HashRouter required (no BrowserRouter)
- IPC via contextBridge, not direct Node access
- Preload script exposes safe APIs only

---

## 📊 Data Flow

```
active-win → main.ts → IPC → App.tsx → logs state
                                           ↓
                                    computePlanets()
                                           ↓
                                    PlanetData[]
                                           ↓
                                    TexturedPlanet
                                           ↓
                                    Canvas → Three.js
```

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-04 | Initial creation |
| 1.7 | 2026-04-09 | Added Focus/Total pie chart sync, website category change, Apply to Historical toggle, automatic database aggregation |
| 1.8 | 2026-04-13 | Settings page redesign: combined Category tab, carousel + search, visual indicators, fixed save |

---

**Last Updated:** 2026-04-13
**Maintained By:** AI Development Team
