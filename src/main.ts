"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const active_win_1 = __importDefault(require("active-win"));
const http_1 = __importDefault(require("http"));

// --- Global shortcut for DevTools ---
const { globalShortcut } = require('electron');
// --- Storage (SQLite with JSON fallback) ---
const userDataPath = electron_1.app.getPath('userData');
const dbPath = path_1.default.join(userDataPath, 'deskflow-data.db');
const jsonPath = path_1.default.join(userDataPath, 'deskflow-data.json');
// --- Category Configuration ---
const categoryConfigPath = path_1.default.join(userDataPath, 'deskflow-categories.json');
const DEFAULT_CATEGORIES = [
    'IDE', 'AI Tools', 'Browser', 'Entertainment', 'Communication',
    'Design', 'Productivity', 'Tools', 'Education', 'Developer Tools',
    'Search Engine', 'News', 'Shopping', 'Social Media', 'Uncategorized', 'Other'
];
const DEFAULT_TIER_ASSIGNMENTS = {
    productive: ['IDE', 'AI Tools', 'Developer Tools', 'Education', 'Productivity', 'Tools'],
    neutral: ['Communication', 'Design', 'Search Engine', 'News', 'Uncategorized', 'Other'],
    distracting: ['Entertainment', 'Social Media', 'Shopping']
};
const DEFAULT_APP_CATEGORIES = {
    // IDEs
    'code': 'IDE', 'pycharm': 'IDE', 'intellij': 'IDE', 'visual studio': 'IDE', 'obsidian': 'IDE',
    'vs code': 'IDE', 'vscode': 'IDE', 'webstorm': 'IDE', 'phpstorm': 'IDE', 'rubymine': 'IDE',
    'goland': 'IDE', 'clion': 'IDE', 'rider': 'IDE', 'datagrip': 'IDE', 'appcode': 'IDE',
    'sublime': 'IDE', 'atom': 'IDE', 'vim': 'IDE', 'neovim': 'IDE', 'emacs': 'IDE',
    'notepad++': 'IDE', 'textmate': 'IDE', 'bbedit': 'IDE', 'brackets': 'IDE',
    'android studio': 'IDE', 'xcode': 'IDE', 'flutter': 'IDE', 'dart': 'IDE',
    // Browsers
    'chrome': 'Browser', 'firefox': 'Browser', 'safari': 'Browser', 'edge': 'Browser',
    'brave': 'Browser', 'opera': 'Browser', 'vivaldi': 'Browser', 'arc': 'Browser',
    'comet': 'Browser', 'google chrome': 'Browser', 'microsoft edge': 'Browser',
    // AI Tools
    'claude': 'AI Tools', 'chatgpt': 'AI Tools', 'gpt': 'AI Tools', 'copilot': 'AI Tools',
    'perplexity': 'AI Tools', 'gemini': 'AI Tools', 'bard': 'AI Tools', 'mistral': 'AI Tools',
    'anthropic': 'AI Tools', 'openai': 'AI Tools', 'cursor': 'AI Tools',
    // Entertainment
    'youtube': 'Entertainment', 'netflix': 'Entertainment', 'spotify': 'Entertainment',
    'twitch': 'Entertainment', 'hulu': 'Entertainment', 'disney': 'Entertainment',
    'prime video': 'Entertainment', 'apple tv': 'Entertainment', 'hbo': 'Entertainment',
    'vimeo': 'Entertainment', 'soundcloud': 'Entertainment', 'vlc': 'Entertainment',
    // Communication
    'slack': 'Communication', 'discord': 'Communication', 'teams': 'Communication',
    'zoom': 'Communication', 'skype': 'Communication', 'telegram': 'Communication',
    'whatsapp': 'Communication', 'signal': 'Communication', 'messenger': 'Communication',
    'mail': 'Communication', 'outlook': 'Communication', 'thunderbird': 'Communication',
    // Design
    'figma': 'Design', 'photoshop': 'Design', 'illustrator': 'Design',
    'sketch': 'Design', 'adobe xd': 'Design', 'indesign': 'Design', 'affinity': 'Design',
    'canva': 'Design', 'dribbble': 'Design', 'behance': 'Design',
    'invision': 'Design', 'zeplin': 'Design', 'miro': 'Design',
    // Productivity
    'terminal': 'Productivity', 'powershell': 'Productivity', 'cmd': 'Productivity',
    'explorer': 'Productivity', 'file explorer': 'Productivity', 'finder': 'Productivity',
    'notion': 'Productivity', 'evernote': 'Productivity', 'bear': 'Productivity',
    'apple notes': 'Productivity', 'todoist': 'Productivity', 'asana': 'Productivity',
    'trello': 'Productivity', 'linear': 'Productivity',
    'logseq': 'Productivity', 'craft': 'Productivity',
    // Developer Tools
    'git': 'Developer Tools', 'github': 'Developer Tools', 'gitlab': 'Developer Tools',
    'bitbucket': 'Developer Tools', 'docker': 'Developer Tools', 'kubernetes': 'Developer Tools',
    'postman': 'Developer Tools', 'insomnia': 'Developer Tools', 'dbeaver': 'Developer Tools',
    'tableplus': 'Developer Tools', 'sequel pro': 'Developer Tools', 'mysql': 'Developer Tools',
    'mongodb': 'Developer Tools', 'redis': 'Developer Tools', 'nginx': 'Developer Tools',
    'apache': 'Developer Tools', 'xampp': 'Developer Tools', 'wamp': 'Developer Tools',
    // Tools
    'wispr': 'Tools', '1password': 'Tools', 'lastpass': 'Tools', 'bitwarden': 'Tools',
    'keepass': 'Tools', 'dropbox': 'Tools', 'google drive': 'Tools', 'onedrive': 'Tools',
    'icloud': 'Tools', 'box': 'Tools', 'syncthing': 'Tools',
    // Windows Apps
    'windows shell': 'Other', 'shell experience': 'Other', 
    'credential manager': 'Tools', 'cloudflare warp': 'Tools',
    'searchhost': 'Productivity', 'snipping': 'Productivity',
    'lenovo': 'Tools', 'vantage': 'Tools',
    'foxit': 'Productivity', 'pdf reader': 'Productivity',
    'terminal host': 'Productivity',
    'krsdk': 'Other',
    // System
    'windows': 'Other', 'macos': 'Other', 'linux': 'Other', 'ubuntu': 'Other',
    'system settings': 'Other', 'control panel': 'Other', 'task manager': 'Other',
    'activity monitor': 'Other', 'device manager': 'Other', 'disk utility': 'Other',
    // News & Reading
    'reddit': 'News', 'medium': 'News', 'substack': 'News', 'news': 'News',
    // Shopping
    'amazon': 'Shopping', 'ebay': 'Shopping', 'etsy': 'Shopping', 'shopify': 'Shopping',
    'walmart': 'Shopping', 'aliexpress': 'Shopping', 'target': 'Shopping',
    // Social Media
    'twitter': 'Social Media', 'x': 'Social Media', 'facebook': 'Social Media',
    'instagram': 'Social Media', 'linkedin': 'Social Media', 'tiktok': 'Social Media',
    'snapchat': 'Social Media', 'pinterest': 'Social Media', 'threads': 'Social Media',
    // Search
    'google': 'Search Engine', 'bing': 'Search Engine', 'duckduckgo': 'Search Engine',
    'yahoo': 'Search Engine', 'yandex': 'Search Engine', 'ecosia': 'Search Engine',
};
const DEFAULT_DOMAIN_CATEGORIES = {
    'youtube.com': 'Entertainment',
    'github.com': 'Developer Tools', 'gitlab.com': 'Developer Tools', 'stackoverflow.com': 'Developer Tools',
    'npmjs.com': 'Developer Tools', 'pypi.org': 'Developer Tools', 'dev.to': 'Developer Tools',
    'mdn.io': 'Developer Tools', 'w3schools.com': 'Developer Tools', 'codepen.io': 'Developer Tools',
    'chatgpt.com': 'AI Tools', 'claude.ai': 'AI Tools', 'bard.google.com': 'AI Tools',
    'perplexity.ai': 'AI Tools', 'copilot.microsoft.com': 'AI Tools', 'gemini.google.com': 'AI Tools',
    'twitter.com': 'Social Media', 'x.com': 'Social Media', 'facebook.com': 'Social Media',
    'instagram.com': 'Social Media', 'linkedin.com': 'Social Media', 'reddit.com': 'Social Media',
    'tiktok.com': 'Social Media', 'snapchat.com': 'Social Media',
    'netflix.com': 'Entertainment', 'twitch.tv': 'Entertainment', 'disney.com': 'Entertainment',
    'hulu.com': 'Entertainment', 'vimeo.com': 'Entertainment', 'soundcloud.com': 'Entertainment',
    'bbc.com': 'News', 'cnn.com': 'News', 'reuters.com': 'News', 'bloomberg.com': 'News',
    'medium.com': 'News', 'substack.com': 'News', 'theverge.com': 'News', 'arstechnica.com': 'News',
    'amazon.com': 'Shopping', 'ebay.com': 'Shopping', 'etsy.com': 'Shopping',
    'shopify.com': 'Shopping', 'walmart.com': 'Shopping', 'aliexpress.com': 'Shopping',
    'docs.google.com': 'Productivity', 'drive.google.com': 'Productivity', 'notion.so': 'Productivity',
    'trello.com': 'Productivity', 'asana.com': 'Productivity', 'calendar.google.com': 'Productivity',
    'figma.com': 'Design', 'canva.com': 'Design', 'dribbble.com': 'Design',
    'behance.net': 'Design', 'unsplash.com': 'Design',
    'google.com': 'Search Engine', 'bing.com': 'Search Engine', 'duckduckgo.com': 'Search Engine',
    'yahoo.com': 'Search Engine'
};
let categoryConfig = {
    version: 1,
    appCategoryMap: {},
    domainCategoryMap: {},
    appTierMap: {},
    domainTierMap: {},
    tierAssignments: { ...DEFAULT_TIER_ASSIGNMENTS },
    detectedDomains: {},
    detectedApps: {}
};
function loadCategoryConfig() {
    try {
        if (fs_1.default.existsSync(categoryConfigPath)) {
            const data = fs_1.default.readFileSync(categoryConfigPath, 'utf-8');
            const loaded = JSON.parse(data);
            categoryConfig = {
                ...{
                    version: 1,
                    appCategoryMap: {},
                    domainCategoryMap: {},
                    appTierMap: {},
                    domainTierMap: {},
                    tierAssignments: { ...DEFAULT_TIER_ASSIGNMENTS },
                    detectedDomains: {},
                    detectedApps: {}
                },
                ...loaded
            };
            console.log('[DeskFlow] ✅ Loaded category config');
        }
        else {
            saveCategoryConfig();
            console.log('[DeskFlow] ✅ Created default category config');
        }
    }
    catch (err) {
        console.warn('[DeskFlow] Failed to load category config:', err);
        categoryConfig = {
            version: 1,
            appCategoryMap: {},
            domainCategoryMap: {},
            appTierMap: {},
            domainTierMap: {},
            tierAssignments: { ...DEFAULT_TIER_ASSIGNMENTS },
            detectedDomains: {},
            detectedApps: {}
        };
    }
}
function saveCategoryConfig() {
    try {
        fs_1.default.writeFileSync(categoryConfigPath, JSON.stringify(categoryConfig, null, 2));
    }
    catch (err) {
        console.error('[DeskFlow] Failed to save category config:', err);
    }
}
function getTierForCategory(category) {
    const { tierAssignments } = categoryConfig;
    if (tierAssignments.productive.includes(category))
        return 'productive';
    if (tierAssignments.distracting.includes(category))
        return 'distracting';
    return 'neutral';
}
let db = null;
let useJson = false;
let storageError = null;
let jsonLogs = [];
// Initialize storage with robust fallback
function initializeStorage() {
    // Ensure userData directory exists
    try {
        if (!fs_1.default.existsSync(userDataPath)) {
            fs_1.default.mkdirSync(userDataPath, { recursive: true });
        }
    }
    catch (err) {
        console.error('[DeskFlow] Failed to create userData directory:', err.message);
        storageError = `Cannot create data directory: ${err.message}`;
        useJson = true;
        jsonLogs = [];
        return;
    }
    // Try SQLite first
    try {
        const Database = require('better-sqlite3');
        db = new Database(dbPath);
        db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        app TEXT NOT NULL,
        category TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        title TEXT,
        project TEXT,
        keystrokes INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        window_switches INTEGER DEFAULT 0,
        url TEXT,
        domain TEXT,
        tab_id INTEGER,
        is_browser_tracking INTEGER DEFAULT 0
      )
    `);
        // Add columns if they don't exist (migration for existing databases)
        try {
            db.exec('ALTER TABLE logs ADD COLUMN url TEXT');
        }
        catch { /* column exists */ }
        try {
            db.exec('ALTER TABLE logs ADD COLUMN domain TEXT');
        }
        catch { /* column exists */ }
        try {
            db.exec('ALTER TABLE logs ADD COLUMN tab_id INTEGER');
        }
        catch { /* column exists */ }
        try {
            db.exec('ALTER TABLE logs ADD COLUMN is_browser_tracking INTEGER DEFAULT 0');
        }
        catch { /* column exists */ }
        // Add productivity columns to daily_stats if they don't exist
        try {
            db.exec('ALTER TABLE daily_stats ADD COLUMN productivity_type TEXT DEFAULT \'unknown\'');
        }
        catch { /* column exists */ }
        try {
            db.exec('ALTER TABLE daily_stats ADD COLUMN total_time_sec INTEGER DEFAULT 0');
        }
        catch { /* column exists */ }
        try {
            db.exec('ALTER TABLE daily_stats ADD COLUMN focus_time_sec INTEGER DEFAULT 0');
        }
        catch { /* column exists */ }
        // Daily stats aggregation table with productivity tracking
        db.exec(`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        app TEXT NOT NULL,
        category TEXT NOT NULL,
        total_sec INTEGER NOT NULL DEFAULT 0,
        sessions INTEGER NOT NULL DEFAULT 0,
        avg_session_sec REAL NOT NULL DEFAULT 0,
        keystrokes INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        focus_score REAL DEFAULT 0,
        productivity_type TEXT DEFAULT 'unknown',
        total_time_sec INTEGER DEFAULT 0,
        focus_time_sec INTEGER DEFAULT 0,
        UNIQUE(date, app)
      )
    `);
        // New sessions table - tracks active sessions with UPDATE instead of INSERT
        db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app TEXT NOT NULL,
        category TEXT,
        start_time TEXT,
        end_time TEXT,
        duration_sec INTEGER DEFAULT 0,
        domain TEXT,
        url TEXT,
        title TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);
        // New daily_aggregates table - pre-computed for heatmap/planets
        db.exec(`
      CREATE TABLE IF NOT EXISTS daily_aggregates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        app TEXT NOT NULL,
        category TEXT,
        total_sec INTEGER DEFAULT 0,
        session_count INTEGER DEFAULT 0,
        UNIQUE(date, app)
      )
    `);
        // New browser_sessions table - aggregated browser data
        db.exec(`
      CREATE TABLE IF NOT EXISTS browser_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        domain TEXT NOT NULL,
        category TEXT,
        total_sec INTEGER DEFAULT 0,
        session_count INTEGER DEFAULT 0,
        UNIQUE(date, domain)
      )
    `);
        console.log('[DeskFlow] ✅ SQLite database initialized at', dbPath);
        storageError = null;
    }
    catch (err) {
        console.warn('[DeskFlow] ⚠️ SQLite failed, falling back to JSON:', err.message);
        storageError = `SQLite error: ${err.message}. Using JSON fallback.`;
        useJson = true;
        // Initialize JSON storage
        try {
            if (fs_1.default.existsSync(jsonPath)) {
                const data = fs_1.default.readFileSync(jsonPath, 'utf-8');
                jsonLogs = JSON.parse(data);
                console.log('[DeskFlow] 📄 Loaded', jsonLogs.length, 'logs from JSON');
            }
            else {
                // Create fresh JSON file
                jsonLogs = [];
                fs_1.default.writeFileSync(jsonPath, JSON.stringify([], null, 2));
                console.log('[DeskFlow] 📄 Created new JSON storage file');
            }
        }
        catch (e) {
            console.error('[DeskFlow] ❌ Failed to initialize JSON storage:', e.message);
            storageError = `JSON storage error: ${e.message}. Data will NOT persist!`;
            jsonLogs = [];
        }
    }
}
function saveJsonLogs() {
    if (useJson) {
        try {
            fs_1.default.writeFileSync(jsonPath, JSON.stringify(jsonLogs, null, 2));
        }
        catch (err) {
            console.error('[DeskFlow] Failed to save JSON logs:', err);
        }
    }
}
// --- Helper functions ---
function addLog(timestamp, app, category, duration_ms, title, project, url?, domain?, tab_id?, is_browser_tracking?) {
    // Cap duration at 1 hour max to prevent heatmap inflation
    const safeDuration = Math.min(duration_ms, MAX_LOGGED_SESSION_MS);
    if (useJson) {
        const newLog = {
            id: Date.now(),
            timestamp,
            app,
            category,
            duration_ms: safeDuration,
            title,
            project,
            url,
            domain,
            tab_id,
            is_browser_tracking
        };
        jsonLogs.unshift(newLog);
        if (jsonLogs.length > 50000)
            jsonLogs = jsonLogs.slice(0, 50000); // Increased from 1000 to 50000
        saveJsonLogs();
        console.log(`[DeskFlow] ✅ Logged: ${app} → ${Math.floor(safeDuration / 1000)}s`);
    }
    else {
        try {
            const stmt = db.prepare(`
        INSERT INTO logs (timestamp, app, category, duration_ms, title, project, url, domain, tab_id, is_browser_tracking)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            stmt.run(timestamp, app, category, safeDuration, title, project, url || null, domain || null, tab_id || null, is_browser_tracking ? 1 : 0);
            console.log(`[DeskFlow] ✅ Logged: ${app} → ${Math.floor(safeDuration / 1000)}s`);
        }
        catch (err) {
            console.error('[DeskFlow] SQLite insert failed:', err);
        }
    }
    // Update aggregated tables after inserting a log
    updateAggregates(timestamp, app, category, safeDuration, domain, is_browser_tracking);
}
function updateAggregates(timestamp, app, category, duration_ms, domain, is_browser_tracking) {
    if (useJson)
        return; // Skip for JSON storage
    const date = timestamp.split('T')[0];
    const duration_sec = Math.floor(duration_ms / 1000);
    try {
        // Update daily_stats
        const existingDaily = db.prepare(`SELECT id, total_sec, sessions FROM daily_stats WHERE date = ? AND app = ?`).get(date, app);
        if (existingDaily) {
            db.prepare(`UPDATE daily_stats SET total_sec = total_sec + ?, sessions = sessions + 1 WHERE date = ? AND app = ?`)
                .run(duration_sec, date, app);
        }
        else {
            db.prepare(`INSERT INTO daily_stats (date, app, category, total_sec, sessions) VALUES (?, ?, ?, ?, 1)`)
                .run(date, app, category, duration_sec);
        }
        // Update sessions table (active sessions tracking)
        const existingSession = db.prepare(`SELECT id, duration_sec FROM sessions WHERE app = ? AND is_active = 1 ORDER BY start_time DESC LIMIT 1`).get(app);
        if (existingSession) {
            db.prepare(`UPDATE sessions SET duration_sec = duration_sec + ? WHERE id = ?`).run(duration_sec, existingSession.id);
        }
        else {
            db.prepare(`INSERT INTO sessions (app, category, start_time, end_time, duration_sec, is_active) VALUES (?, ?, ?, ?, ?, 1)`)
                .run(app, category, timestamp, timestamp, duration_sec);
        }
        // Update daily_aggregates
        const existingAgg = db.prepare(`SELECT id, total_sec, session_count FROM daily_aggregates WHERE date = ? AND app = ?`).get(date, app);
        if (existingAgg) {
            db.prepare(`UPDATE daily_aggregates SET total_sec = total_sec + ?, session_count = session_count + 1 WHERE date = ? AND app = ?`)
                .run(duration_sec, date, app);
        }
        else {
            db.prepare(`INSERT INTO daily_aggregates (date, app, category, total_sec, session_count) VALUES (?, ?, ?, ?, 1)`)
                .run(date, app, category, duration_sec);
        }
        // Update browser_sessions if browser tracking
        if (is_browser_tracking && domain) {
            const existingBrowser = db.prepare(`SELECT id, total_sec, session_count FROM browser_sessions WHERE date = ? AND domain = ?`).get(date, domain);
            if (existingBrowser) {
                db.prepare(`UPDATE browser_sessions SET total_sec = total_sec + ?, session_count = session_count + 1 WHERE date = ? AND domain = ?`)
                    .run(duration_sec, date, domain);
            }
            else {
                db.prepare(`INSERT INTO browser_sessions (date, domain, category, total_sec, session_count) VALUES (?, ?, ?, ?, 1)`)
                    .run(date, domain, category, duration_sec);
            }
        }
        console.log('[DeskFlow] ✅ Aggregates updated for', app);
    }
    catch (err) {
        console.error('[DeskFlow] Aggregate update failed:', err);
    }
}
function getLogs(limit?: number): any[] {
    if (useJson) {
        return limit ? jsonLogs.slice(0, limit) : jsonLogs;
    }
    try {
        if (limit) {
            const stmt = db.prepare(`SELECT * FROM logs ORDER BY id DESC LIMIT ${limit}`);
            return stmt.all();
        }
        const stmt = db.prepare('SELECT * FROM logs ORDER BY id DESC');
        return stmt.all();
    }
    catch (err) {
        console.error('[DeskFlow] SQLite select failed:', err);
        return [];
    }
}
function getStats() {
    // FIX 3: For browser-tracked entries, use domain as the "app" name
    // Also exclude generic browser app entries (e.g. "Chrome", "Firefox") to prevent
    // double-counting when browser extension tracks individual domains
    const BROWSER_APPS = [
        'chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'vivaldi', 'arc',
        'google chrome', 'microsoft edge', 'comet', 'browser', 'yandex', 'duckduckgo'
    ];
    if (useJson) {
        const stats = new Map();
        jsonLogs.forEach((log) => {
            // Skip generic browser entries (individual domains are tracked separately)
            const appLower = log.app.toLowerCase();
            if (BROWSER_APPS.some(browser => appLower.includes(browser)))
                return;
            const appName = log.is_browser_tracking && log.domain ? log.domain : log.app;
            const existing = stats.get(appName) || { total_ms: 0, sessions: 0 };
            existing.total_ms += log.duration_ms;
            existing.sessions += 1;
            stats.set(appName, existing);
        });
        return Array.from(stats.entries()).map(([app, data]) => ({
            app,
            total_ms: data.total_ms,
            sessions: data.sessions
        })).sort((a, b) => b.total_ms - a.total_ms);
    }
    try {
        const stmt = db.prepare(`
      SELECT
        CASE
          WHEN is_browser_tracking = 1 AND domain IS NOT NULL AND domain != '' THEN domain
          ELSE app
        END as app,
        SUM(duration_ms) as total_ms,
        COUNT(*) as sessions
      FROM logs
      WHERE LOWER(app) NOT IN ('chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge', 'comet', 'browser', 'vivaldi', 'arc')
      AND LOWER(app) NOT LIKE '%chrome%'
      AND LOWER(app) NOT LIKE '%firefox%'
      AND LOWER(app) NOT LIKE '%browser%'
      AND LOWER(app) NOT LIKE '%edge%'
      AND LOWER(app) NOT LIKE '%comet%'
      GROUP BY
        CASE
          WHEN is_browser_tracking = 1 AND domain IS NOT NULL AND domain != '' THEN domain
          ELSE app
        END
      ORDER BY total_ms DESC
    `);
        return stmt.all();
    }
    catch (err) {
        console.error('[DeskFlow] SQLite stats failed:', err);
        return [];
    }
}
// --- Tracking state ---
let currentApp = null;
let sessionStart = Date.now();
let trackingInterval = null;
let isTracking = true;
let lastPollTime = Date.now();
let consecutiveNullPolls = 0;
const MAX_SESSION_MS = 5 * 60 * 1000; // 5 minutes — cap session to prevent sleep-time inflation
const MAX_LOGGED_SESSION_MS = 3600000; // 1 hour - cap logged sessions to prevent heatmap inflation
const SLEEP_GAP_MS = 10000; // 10 seconds — gap threshold to detect system sleep
// --- Browser tracking state ---
let browserServer = null;
let browserServerPort = 54321;
let isBrowserTrackingEnabled = true;
// FIX 1: Use a Map keyed by domain to track all active browser sessions (not just one)
let activeBrowserSessions = new Map();
let browserExcludedDomains = [];
// Track only the MOST RECENTLY active browser domain (only one active at a time)
let lastActiveBrowserDomain = null;
let lastActiveBrowserTimestamp = 0;
function categorizeApp(appName) {
    const lower = appName.toLowerCase();
    if (categoryConfig.appCategoryMap[appName]) {
        return categoryConfig.appCategoryMap[appName];
    }
    if (categoryConfig.detectedApps[lower]) {
        return categoryConfig.detectedApps[lower];
    }
    for (const [keyword, category] of Object.entries(DEFAULT_APP_CATEGORIES)) {
        if (lower.includes(keyword)) {
            categoryConfig.detectedApps[lower] = category;
            saveCategoryConfig();
            return category;
        }
    }
    return 'Uncategorized';
}
// Calculate productivity score based on daily activity
// Returns: { score: 0-100, productive_sec: number, neutral_sec: number, distracting_sec: number, total_sec: number }
function calculateProductivityScore(dayLogs) {
    const { tierAssignments } = categoryConfig;
    let productiveSec = 0;
    let neutralSec = 0;
    let distractingSec = 0;
    const breakdown = {};
    for (const log of dayLogs) {
        const durationSec = Math.floor((log.duration_ms || 0) / 1000);
        const category = log.category || 'Uncategorized';
        const tier = getTierForCategory(category);
        // Track breakdown (floor to remove decimals)
        breakdown[category] = (breakdown[category] || 0) + durationSec;
        // Classify time based on tier
        if (tier === 'productive') {
            productiveSec += durationSec;
        }
        else if (tier === 'distracting') {
            distractingSec += durationSec;
        }
        else {
            neutralSec += durationSec;
        }
    }
    const totalSec = productiveSec + neutralSec + distractingSec;
    // Calculate score (0-100)
    // Productive time = 100%, Neutral = 50%, Distracting = 0%
    let score = 0;
    if (totalSec > 0) {
        score = ((productiveSec + (neutralSec * 0.5)) / totalSec) * 100;
    }
    return {
        score: Math.floor(Math.min(100, Math.max(0, score))),
        productive_sec: Math.floor(productiveSec),
        neutral_sec: Math.floor(neutralSec),
        distracting_sec: Math.floor(distractingSec),
        total_sec: Math.floor(totalSec),
        breakdown
    };
}
// Domain categorization for browser tracking (conservative smart detection)
function categorizeDomain(domain, title, url) {
    const lower = domain.toLowerCase();
    const titleLower = (title || '').toLowerCase();
    const urlLower = (url || '').toLowerCase();
    const combinedContext = `${titleLower} ${urlLower}`;
    // Check excluded domains first
    if (browserExcludedDomains.some(excluded => lower.includes(excluded))) {
        return 'Excluded';
    }
    // 1. Check user override
    if (categoryConfig.domainCategoryMap[lower]) {
        return categoryConfig.domainCategoryMap[lower];
    }
    // 2. Check detected domains cache
    if (categoryConfig.detectedDomains[lower]) {
        return categoryConfig.detectedDomains[lower];
    }
    // 3. Conservative smart detection for specific domains
    // YouTube: CONSERVATIVE - default to Entertainment, only Education if VERY clear
    if (lower.includes('youtube')) {
        const strongEducationalKeywords = [
            'tutorial', 'course', 'lecture', 'learn', 'class', 'university',
            'physics', 'mathematics', 'chemistry', 'biology', 'science',
            'programming', 'coding', 'javascript', 'python', 'typescript', 'react',
            'algorithm', 'data structure', 'web development',
            'crash course', 'lesson', 'study', 'exam', 'revision',
            'masterclass', 'workshop', 'training', 'how to build', 'from scratch'
        ];
        const isStronglyEducational = strongEducationalKeywords.some(keyword => combinedContext.includes(keyword.toLowerCase()));
        if (isStronglyEducational) {
            return 'Education';
        }
        return 'Entertainment';
    }
    // Reddit: check subreddit from URL
    if (lower.includes('reddit')) {
        const productiveSubreddits = ['programming', 'learnprogramming', 'cscareerquestions',
            'python', 'javascript', 'reactjs', 'sysadmin', 'devops'];
        const neutralSubreddits = ['getdisciplined', 'productivity', 'zenhabits'];
        const distractingSubreddits = ['funny', 'aww', 'photography', 'music', 'movies',
            'gaming', 'pcmasterrace', 'buildapc', 'politics'];
        const match = lower.match(/reddit\.com\/r\/(\w+)/);
        if (match) {
            const subreddit = match[1].toLowerCase();
            if (productiveSubreddits.includes(subreddit))
                return 'Productivity';
            if (neutralSubreddits.includes(subreddit))
                return 'Productivity';
            if (distractingSubreddits.includes(subreddit))
                return 'Distracting';
        }
        return 'Social Media';
    }
    // Twitter/X: check if it's a feed/search vs individual tweet
    if (lower.includes('twitter') || lower.includes('x.com')) {
        if (urlLower.includes('/search') || urlLower.includes('/i/')) {
            return 'Productivity';
        }
        return 'Social Media';
    }
    // News: differentiate business vs general
    if (lower.includes('bloomberg') || lower.includes('reuters') || lower.includes('wsj') || lower.includes('ft')) {
        return 'Productivity';
    }
    // 4. Default domain-based categories
    for (const [domainKey, category] of Object.entries(DEFAULT_DOMAIN_CATEGORIES)) {
        if (lower.includes(domainKey)) {
            categoryConfig.detectedDomains[lower] = category;
            saveCategoryConfig();
            return category;
        }
    }
    // 5. Fall back to Uncategorized
    return 'Uncategorized';
}
// Real window polling using active-win
async function pollForeground() {
    if (!isTracking)
        return;
    const now = Date.now();
    try {
        const result = await (0, active_win_1.default)();
        // Track poll time for gap detection
        const timeSinceLastPoll = now - lastPollTime;
        lastPollTime = now;
        // --- Sleep / gap detection ---
        // If active-win returned null and this has happened 3+ consecutive times,
        // the system was likely asleep or locked. Reset silently.
        if (!result) {
            consecutiveNullPolls++;
            if (consecutiveNullPolls >= 3) {
                // System is unresponsive — reset session without logging
                if (currentApp) {
                    console.log(`[DeskFlow] 💤 System appears asleep, resetting session for: ${currentApp}`);
                    currentApp = null;
                    sessionStart = now;
                }
            }
            return;
        }
        // If we get a result after a gap, check if the gap was large enough to indicate sleep
        if (timeSinceLastPoll > SLEEP_GAP_MS) {
            console.log(`[DeskFlow] 💤 Sleep gap detected (${Math.round(timeSinceLastPoll / 1000)}s). Resetting session.`);
            currentApp = null;
            sessionStart = now;
            consecutiveNullPolls = 0;
            return;
        }
        // Successful poll — reset counter
        consecutiveNullPolls = 0;
        const appName = result.owner?.name || 'Unknown';
        const windowTitle = result.title || '';
        // Only log if app changed
        if (appName !== currentApp) {
            const rawDuration = now - sessionStart;
            // Log previous session if it was > 5 seconds AND within reasonable bounds
            if (currentApp && rawDuration > 5000) {
                // Cap duration to prevent sleep-time inflation from creating bogus multi-hour sessions
                const duration = Math.min(rawDuration, MAX_SESSION_MS);
                // If the raw duration was much larger than the cap, the system was likely asleep
                // Only log up to the cap and warn
                if (rawDuration > MAX_SESSION_MS) {
                    console.log(`[DeskFlow] ⚠️ Session capped: ${currentApp} had ${Math.round(rawDuration / 1000)}s, capped to ${Math.round(duration / 1000)}s (likely sleep artifact)`);
                }
                const category = categorizeApp(currentApp);
                addLog(new Date(sessionStart).toISOString(), currentApp, category, duration, `${currentApp} Window`, null);
            }
            // Start new session
            currentApp = appName;
            sessionStart = now;
            // Send to renderer
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('foreground-changed', {
                    app: appName,
                    title: windowTitle,
                    category: categorizeApp(appName),
                    timestamp: new Date().toISOString(),
                    isReal: true
                });
            }
        }
    }
    catch (err) {
        console.error('[DeskFlow] active-win error:', err.message);
        consecutiveNullPolls++;
    }
}
// --- Window ---
let mainWindow = null;
let tray = null;
let startMinimized = false;
function createTray() {
    // Create a simple tray icon programmatically (16x16 blue dot)
    // This works on all platforms without needing an icon file
    const size = 16;
    const canvas = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const idx = (y * size + x) * 4;
            // Create a blue circle icon
            const cx = x - size / 2 + 0.5;
            const cy = y - size / 2 + 0.5;
            const dist = Math.sqrt(cx * cx + cy * cy);
            if (dist < 6) {
                // Blue color (#3b82f6)
                canvas[idx] = 0x3b;     // R
                canvas[idx + 1] = 0x82; // G
                canvas[idx + 2] = 0xf6; // B
                canvas[idx + 3] = 255; // A
            } else {
                // Transparent
                canvas[idx] = 0;
                canvas[idx + 1] = 0;
                canvas[idx + 2] = 0;
                canvas[idx + 3] = 0;
            }
        }
    }
    const trayIcon = electron_1.nativeImage.createFromBuffer(canvas, { width: size, height: size });
    tray = new electron_1.Tray(trayIcon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Show DeskFlow',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        {
            label: 'Toggle Tracking',
            click: () => {
                isTracking = !isTracking;
                console.log('[DeskFlow] Tracking:', isTracking ? 'ON' : 'OFF');
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('tracking-heartbeat', { isTracking, currentApp, uptime: Date.now() });
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('DeskFlow - Time Tracker');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        // Always show and focus the window when tray is clicked
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        }
    });
    console.log('[DeskFlow] ✅ System tray created');
}
function createWindow() {
    electron_1.Menu.setApplicationMenu(null);
    const preloadPath = path_1.default.join(__dirname, 'preload.cjs');
    console.log('[DeskFlow] Preload path:', preloadPath);
    console.log('[DeskFlow] __dirname:', __dirname);
    
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false, // Allow loading local files
        },
        titleBarStyle: 'default',
        backgroundColor: '#0a0a0a',
    });
    const indexPath = path_1.default.join(__dirname, '../dist/index.html');
    console.log('[DeskFlow] Loading index.html from:', indexPath);
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(indexPath);
    }
    // Log loading errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('[DeskFlow] Failed to load:', errorCode, errorDescription);
    });
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[DeskFlow] Page loaded successfully');
    });
    // Start polling (every 2 seconds — like active-win spec)
    trackingInterval = setInterval(pollForeground, 2000);
    // Send tracking heartbeat to renderer every 5 seconds
    const heartbeatInterval = setInterval(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('tracking-heartbeat', {
                isTracking,
                currentApp,
                uptime: Date.now()
            });
        }
    }, 5000);
    mainWindow.on('closed', () => {
        if (trackingInterval)
            clearInterval(trackingInterval);
        if (heartbeatInterval)
            clearInterval(heartbeatInterval);
        mainWindow = null;
    });
    mainWindow.on('close', (event) => {
        if (!electron_1.app.isQuitting) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });

    // Toggle DevTools with Ctrl+Shift+I - only when app window is focused
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) {
            if (input.key === 'I' && input.control && input.shift) {
                event.preventDefault();
                if (mainWindow.webContents.isDevToolsOpened()) {
                    mainWindow.webContents.closeDevTools();
                } else {
                    mainWindow.webContents.openDevTools();
                }
            }
        }
    });
}
// --- IPC handlers ---
electron_1.ipcMain.handle('get-logs', () => {
    try {
        return getLogs();
    }
    catch (err) {
        console.error('[DeskFlow] get-logs error:', err);
        return [];
    }
});
// App control IPC handlers
electron_1.ipcMain.handle('quit-app', () => {
    electron_1.app.isQuitting = true;
    electron_1.app.quit();
});
electron_1.ipcMain.handle('show-window', () => {
    if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
    }
});
electron_1.ipcMain.handle('get-auto-start-status', () => {
    return electron_1.app.getLoginItemSettings().openAtLogin;
});
electron_1.ipcMain.handle('set-auto-start', (_event, enabled) => {
    const exePath = electron_1.app.isPackaged 
        ? process.execPath 
        : electron_1.app.getPath('exe');
    
    electron_1.app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true,
        path: exePath,
        args: enabled ? ['--minimized'] : []
    });
    return enabled;
});
// Migrate old logs to new schema (daily_aggregates)
electron_1.ipcMain.handle('migrate-to-aggregates', () => {
    if (useJson) {
        return { success: false, message: 'JSON mode - migration not needed' };
    }
    try {
        // Aggregate logs into daily_aggregates
        const result = db.prepare(`
      INSERT INTO daily_aggregates (date, app, category, total_sec, session_count)
      SELECT 
        date(timestamp) as date,
        app,
        category,
        SUM(duration_ms / 1000) as total_sec,
        COUNT(*) as session_count
      FROM logs
      WHERE timestamp IS NOT NULL
      GROUP BY date(timestamp), app, category
      ON CONFLICT(date, app) DO UPDATE SET
        total_sec = excluded.total_sec,
        session_count = excluded.session_count
    `).run();
        // Also aggregate browser sessions
        const browserResult = db.prepare(`
      INSERT INTO browser_sessions (date, domain, category, total_sec, session_count)
      SELECT 
        date(timestamp) as date,
        domain,
        category,
        SUM(duration_ms / 1000) as total_sec,
        COUNT(*) as session_count
      FROM logs
      WHERE is_browser_tracking = 1 AND domain IS NOT NULL
      GROUP BY date(timestamp), domain
      ON CONFLICT(date, domain) DO UPDATE SET
        total_sec = excluded.total_sec,
        session_count = excluded.session_count
    `).run();
        console.log('[DeskFlow] ✅ Migration complete:', result.changes, 'aggregates updated');
        return {
            success: true,
            aggregatesUpdated: result.changes,
            browserAggregatesUpdated: browserResult.changes
        };
    }
    catch (err) {
        console.error('[DeskFlow] Migration error:', err);
        return { success: false, message: err.message };
    }
});
// Get data from new tables
electron_1.ipcMain.handle('get-daily-aggregates', () => {
    if (useJson)
        return [];
    try {
        return db.prepare('SELECT * FROM daily_aggregates ORDER BY date DESC, total_sec DESC').all();
    }
    catch (err) {
        console.error('[DeskFlow] get-daily-aggregates error:', err);
        return [];
    }
});
electron_1.ipcMain.handle('get-browser-sessions', () => {
    if (useJson)
        return [];
    try {
        return db.prepare('SELECT * FROM browser_sessions ORDER BY date DESC, total_sec DESC').all();
    }
    catch (err) {
        console.error('[DeskFlow] get-browser-sessions error:', err);
        return [];
    }
});
electron_1.ipcMain.handle('get-sessions', () => {
    if (useJson)
        return [];
    try {
        return db.prepare('SELECT * FROM sessions WHERE is_active = 1 ORDER BY start_time DESC').all();
    }
    catch (err) {
        console.error('[DeskFlow] get-sessions error:', err);
        return [];
    }
});
electron_1.ipcMain.handle('get-table-schema', (event, tableName) => {
    if (useJson)
        return { error: 'JSON mode' };
    try {
        const stmt = db.prepare(`PRAGMA table_info(${tableName})`);
        return stmt.all();
    }
    catch (err) {
        console.error('[DeskFlow] get-table-schema error:', err);
        return { error: err.message };
    }
});
electron_1.ipcMain.handle('get-database-tables', () => {
    if (useJson)
        return { tables: [], type: 'json' };
    try {
        const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
        return { tables: stmt.all().map((t) => t.name), type: 'sqlite' };
    }
    catch (err) {
        console.error('[DeskFlow] get-database-tables error:', err);
        return { tables: [], error: err.message };
    }
});
electron_1.ipcMain.handle('get-table-data', (event, tableName, limit = 50) => {
    if (useJson)
        return { error: 'JSON mode' };
    try {
        const stmt = db.prepare(`SELECT * FROM ${tableName} ORDER BY ROWID DESC LIMIT ?`);
        return stmt.all(limit);
    }
    catch (err) {
        console.error('[DeskFlow] get-table-data error:', err);
        return { error: err.message };
    }
});

electron_1.ipcMain.handle('update-categories-from-overrides', (event, appOverrides, domainOverrides) => {
    if (useJson) {
        try {
            let updatedCount = 0;
            jsonLogs = jsonLogs.map(log => {
                // Check app overrides
                const appKey = log.app?.toLowerCase();
                if (appKey && appOverrides[appKey]) {
                    log.category = appOverrides[appKey];
                    updatedCount++;
                }
                // Check domain overrides for browser-tracked logs
                else if (log.is_browser_tracking && log.domain) {
                    const domainKey = log.domain.toLowerCase();
                    if (domainOverrides[domainKey]) {
                        log.category = domainOverrides[domainKey];
                        updatedCount++;
                    }
                }
                return log;
            });
            saveJsonLogs();
            console.log('[DeskFlow] Updated categories for', updatedCount, 'logs');
            return { success: true, updatedCount };
        }
        catch (err) {
            console.error('[DeskFlow] update-categories-from-overrides error:', err);
            return { success: false, updatedCount: 0, error: err.message };
        }
    }
    try {
        let updatedCount = 0;
        // Update app categories
        for (const [appName, category] of Object.entries(appOverrides)) {
            const stmt = db.prepare('UPDATE logs SET category = ? WHERE LOWER(app) = ?');
            const result = stmt.run(category, appName.toLowerCase());
            updatedCount += result.changes;
        }
        // Update domain categories for browser-tracked logs
        for (const [domain, category] of Object.entries(domainOverrides)) {
            const stmt = db.prepare('UPDATE logs SET category = ? WHERE LOWER(domain) = ? AND is_browser_tracking = 1');
            const result = stmt.run(category, domain.toLowerCase());
            updatedCount += result.changes;
        }
        console.log('[DeskFlow] Updated categories for', updatedCount, 'logs');
        return { success: true, updatedCount };
    }
    catch (err) {
        console.error('[DeskFlow] update-categories-from-overrides error:', err);
        return { success: false, updatedCount: 0, error: err.message };
    }
});

electron_1.ipcMain.handle('get-stats', () => {
    try {
        return getStats();
    }
    catch (err) {
        console.error('[DeskFlow] get-stats error:', err);
        return [];
    }
});
electron_1.ipcMain.handle('toggle-tracking', () => {
    isTracking = !isTracking;
    console.log('[DeskFlow] Tracking:', isTracking ? 'ON' : 'OFF');
    return isTracking;
});
electron_1.ipcMain.handle('clear-data', () => {
    try {
        if (useJson) {
            jsonLogs = [];
            saveJsonLogs();
        }
        else {
            db.exec('DELETE FROM logs');
        }
        console.log('[DeskFlow] Data cleared');
        return true;
    }
    catch (err) {
        console.error('[DeskFlow] clear-data error:', err);
        return false;
    }
});
// Clear only today's logs (preserve historical data)
electron_1.ipcMain.handle('clear-today', () => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        if (useJson) {
            jsonLogs = jsonLogs.filter(l => !l.timestamp.startsWith(todayStr));
            saveJsonLogs();
        }
        else {
            db.prepare(`DELETE FROM logs WHERE timestamp >= ?`).run(`${todayStr}T00:00:00`);
        }
        console.log('[DeskFlow] Today\'s data cleared');
        return true;
    }
    catch (err) {
        console.error('[DeskFlow] clear-today error:', err);
        return false;
    }
});
electron_1.ipcMain.handle('get-db-path', () => dbPath);
// Storage health check
electron_1.ipcMain.handle('get-storage-status', () => {
    return {
        type: useJson ? 'json' : 'sqlite',
        working: db !== null || useJson,
        path: useJson ? jsonPath : dbPath,
        error: storageError,
        logCount: useJson ? jsonLogs.length : (db ? db.prepare('SELECT COUNT(*) as count FROM logs').get().count : 0)
    };
});
// Get/set user preferences (category overrides, custom colors)
interface UserPreferences {
    browserTrackingPort?: number;
    browserTrackingEnabled?: boolean;
    browserExcludedDomains?: string[];
    [key: string]: any;
}
let userPreferences: UserPreferences = {};
const prefsPath = path_1.default.join(userDataPath, 'deskflow-prefs.json');
function loadPreferences() {
    try {
        if (fs_1.default.existsSync(prefsPath)) {
            const data = fs_1.default.readFileSync(prefsPath, 'utf-8');
            userPreferences = JSON.parse(data);
            console.log('[DeskFlow] 📄 Loaded preferences');
        }
    }
    catch (err) {
        console.warn('[DeskFlow] Failed to load preferences:', err);
        userPreferences = {};
    }
}
function savePreferences() {
    try {
        fs_1.default.writeFileSync(prefsPath, JSON.stringify(userPreferences, null, 2));
    }
    catch (err) {
        console.error('[DeskFlow] Failed to save preferences:', err);
    }
}
// Load preferences on startup
loadPreferences();
electron_1.ipcMain.handle('get-preferences', () => {
    return userPreferences;
});
electron_1.ipcMain.handle('set-preference', (event, key, value) => {
    userPreferences[key] = value;
    savePreferences();
    return true;
});
// Category Configuration IPC Handlers
electron_1.ipcMain.handle('get-category-config', () => {
    return categoryConfig;
});
electron_1.ipcMain.handle('set-app-category', (event, appName, category) => {
    categoryConfig.appCategoryMap[appName] = category;
    saveCategoryConfig();
    return true;
});
electron_1.ipcMain.handle('set-domain-category', (event, domain, category) => {
    categoryConfig.domainCategoryMap[domain.toLowerCase()] = category;
    saveCategoryConfig();
    return true;
});
electron_1.ipcMain.handle('set-app-tier', (event, appName, tier) => {
    categoryConfig.appTierMap[appName] = tier;
    saveCategoryConfig();
    return true;
});
electron_1.ipcMain.handle('set-domain-tier', (event, domain, tier) => {
    categoryConfig.domainTierMap[domain.toLowerCase()] = tier;
    saveCategoryConfig();
    return true;
});
electron_1.ipcMain.handle('set-tier-assignments', (event, assignments) => {
    categoryConfig.tierAssignments = assignments;
    saveCategoryConfig();
    return true;
});

// Apply category changes to historical data
electron_1.ipcMain.handle('apply-category-to-historical', async (event, tierAssignments) => {
    if (useJson) {
        return { success: false, message: 'Not available in JSON mode' };
    }
    try {
        console.log('[DeskFlow] Applying category changes to historical data...');
        
        // For each category, find all logs that match and update their category
        // This is done by recalculating categories based on app/domain names
        let updatedCount = 0;
        
        // Get all logs
        const allLogs = db.prepare('SELECT * FROM logs').all();
        
        for (const log of allLogs) {
            const appName = log.app;
            const domain = log.domain;
            
            // Determine new category based on app/domain name
            let newCategory = categorizeApp(appName);
            
            // If browser tracking, check domain
            if (log.is_browser_tracking && domain) {
                newCategory = categorizeDomain(domain, log.title, log.url);
            }
            
            // Update if different
            if (log.category !== newCategory) {
                db.prepare('UPDATE logs SET category = ? WHERE id = ?').run(newCategory, log.id);
                updatedCount++;
            }
        }
        
        // Update aggregated tables
        updateAllAggregates();
        
        console.log(`[DeskFlow] Updated ${updatedCount} historical log categories`);
        return { success: true, updatedCount };
    } catch (err: any) {
        console.error('[DeskFlow] Error applying to historical:', err);
        return { success: false, message: err.message };
    }
});

// Helper function to update all aggregate tables
function updateAllAggregates() {
    try {
        // Clear and rebuild daily_stats
        db.exec('DELETE FROM daily_stats');
        
        const logs = db.prepare('SELECT * FROM logs ORDER BY timestamp').all();
        for (const log of logs) {
            const date = log.timestamp.split('T')[0];
            const duration_sec = Math.floor(log.duration_ms / 1000);
            const app = log.app;
            const category = log.category;
            
            const existing = db.prepare('SELECT id FROM daily_stats WHERE date = ? AND app = ?').get(date, app);
            if (existing) {
                db.prepare('UPDATE daily_stats SET total_sec = total_sec + ?, sessions = sessions + 1 WHERE date = ? AND app = ?')
                    .run(duration_sec, date, app);
            } else {
                db.prepare('INSERT INTO daily_stats (date, app, category, total_sec, sessions) VALUES (?, ?, ?, ?, 1)')
                    .run(date, app, category, duration_sec);
            }
        }
        
        // Clear and rebuild daily_aggregates
        db.exec('DELETE FROM daily_aggregates');
        
        for (const log of logs) {
            const date = log.timestamp.split('T')[0];
            const duration_sec = Math.floor(log.duration_ms / 1000);
            const app = log.app;
            const category = log.category;
            
            const existing = db.prepare('SELECT id FROM daily_aggregates WHERE date = ? AND app = ?').get(date, app);
            if (existing) {
                db.prepare('UPDATE daily_aggregates SET total_sec = total_sec + ?, session_count = session_count + 1 WHERE date = ? AND app = ?')
                    .run(duration_sec, date, app);
            } else {
                db.prepare('INSERT INTO daily_aggregates (date, app, category, total_sec, session_count) VALUES (?, ?, ?, ?, 1)')
                    .run(date, app, category, duration_sec);
            }
        }
        
        // Clear and rebuild browser_sessions
        db.exec('DELETE FROM browser_sessions');
        
        const browserLogs = logs.filter(l => l.is_browser_tracking && l.domain);
        for (const log of browserLogs) {
            const date = log.timestamp.split('T')[0];
            const duration_sec = Math.floor(log.duration_ms / 1000);
            const domain = log.domain;
            const category = log.category;
            
            const existing = db.prepare('SELECT id FROM browser_sessions WHERE date = ? AND domain = ?').get(date, domain);
            if (existing) {
                db.prepare('UPDATE browser_sessions SET total_sec = total_sec + ?, session_count = session_count + 1 WHERE date = ? AND domain = ?')
                    .run(duration_sec, date, domain);
            } else {
                db.prepare('INSERT INTO browser_sessions (date, domain, category, total_sec, session_count) VALUES (?, ?, ?, ?, 1)')
                    .run(date, domain, category, duration_sec);
            }
        }
        
        console.log('[DeskFlow] ✅ All aggregate tables rebuilt');
    } catch (err) {
        console.error('[DeskFlow] Error rebuilding aggregates:', err);
    }
}
electron_1.ipcMain.handle('get-default-categories', () => {
    return DEFAULT_CATEGORIES;
});
electron_1.ipcMain.handle('get-tier-assignments', () => {
    return categoryConfig.tierAssignments;
});
// Get logs filtered by period
electron_1.ipcMain.handle('get-logs-by-period', (event, period) => {
    try {
        if (useJson) {
            const now = new Date();
            let filtered = jsonLogs;
            if (period === 'today') {
                const todayStr = now.toISOString().split('T')[0];
                filtered = jsonLogs.filter(l => l.timestamp.startsWith(todayStr));
            }
            else if (period === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = jsonLogs.filter(l => new Date(l.timestamp) >= weekAgo);
            }
            else if (period === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = jsonLogs.filter(l => new Date(l.timestamp) >= monthAgo);
            }
            return filtered;
        }
        const now = new Date();
        if (period === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            const stmt = db.prepare(`SELECT * FROM logs WHERE timestamp >= ? ORDER BY id DESC`);
            return stmt.all(`${todayStr}T00:00:00`);
        }
        else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const stmt = db.prepare(`SELECT * FROM logs WHERE timestamp >= ? ORDER BY id DESC`);
            return stmt.all(weekAgo);
        }
        else if (period === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const stmt = db.prepare(`SELECT * FROM logs WHERE timestamp >= ? ORDER BY id DESC`);
            return stmt.all(monthAgo);
        }
        return getLogs();
    }
    catch (err) {
        console.error('[DeskFlow] get-logs-by-period error:', err);
        return [];
    }
});
// Get daily stats for a period
electron_1.ipcMain.handle('get-daily-stats', (event, period) => {
    try {
        const BROWSER_APPS = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge'];
        if (useJson) {
            // Compute from JSON logs
            const now = new Date();
            let filtered = jsonLogs.filter(l => !BROWSER_APPS.includes(l.app.toLowerCase())); // Exclude generic browser apps
            if (period === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(l => new Date(l.timestamp) >= weekAgo);
            }
            else if (period === 'month') {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filtered = filtered.filter(l => new Date(l.timestamp) >= monthAgo);
            }
            // FIX 3: Group by date + app (use domain for browser entries)
            const grouped = {};
            for (const log of filtered) {
                const date = log.timestamp.split('T')[0];
                const appName = log.is_browser_tracking && log.domain ? log.domain : log.app;
                if (!grouped[date])
                    grouped[date] = {};
                if (!grouped[date][appName])
                    grouped[date][appName] = { total_sec: 0, sessions: 0, app: appName, category: log.category };
                grouped[date][appName].total_sec += Math.floor(log.duration_ms / 1000);
                grouped[date][appName].sessions += 1;
            }
            return grouped;
        }
        const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        // FIX 3: Use domain as app name for browser entries, exclude generic browser apps
        const stmt = db.prepare(`
      SELECT
        date(timestamp) as day,
        CASE
          WHEN is_browser_tracking = 1 AND domain IS NOT NULL AND domain != '' THEN domain
          ELSE app
        END as app,
        category,
        SUM(duration_ms) / 1000 as total_sec,
        COUNT(*) as sessions,
        AVG(duration_ms) / 1000 as avg_session_sec
      FROM logs
      WHERE date(timestamp) >= ?
        AND LOWER(app) NOT IN ('chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge')
      GROUP BY day,
        CASE
          WHEN is_browser_tracking = 1 AND domain IS NOT NULL AND domain != '' THEN domain
          ELSE app
        END
      ORDER BY day DESC, total_sec DESC
    `);
        return stmt.all(cutoff);
    }
    catch (err) {
        console.error('[DeskFlow] get-daily-stats error:', err);
        return [];
    }
});
// Get per-app detailed stats - with optional period filtering
electron_1.ipcMain.handle('get-app-stats', (event, period?: 'today' | 'week' | 'month' | 'all') => {
    try {
        const BROWSER_APPS = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge'];
        
        // Calculate date range based on period
        let startDate: string | null = null;
        const now = new Date();
        
        if (period === 'today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        } else if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            startDate = weekAgo.toISOString();
        } else if (period === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            startDate = monthAgo.toISOString();
        }
        console.log('[DeskFlow] get-app-stats called with period:', period, 'startDate:', startDate);
        // 'all' or undefined = no filter
        
        if (useJson) {
            let filteredLogs = jsonLogs;
            if (startDate) {
                filteredLogs = jsonLogs.filter(l => l.timestamp >= startDate);
            }
            const stats = new Map();
            filteredLogs.forEach((log) => {
                // Skip generic browser entries (individual domains tracked separately)
                if (BROWSER_APPS.includes(log.app.toLowerCase()))
                    return;
                // Skip browser-tracked entries (websites) - only show desktop apps
                if (log.is_browser_tracking)
                    return;
                // Use actual app name (not domain)
                const appName = log.app;
                const existing = stats.get(appName) || { total_ms: 0, sessions: 0, first_seen: log.timestamp, last_seen: log.timestamp, category: log.category || 'Other' };
                existing.total_ms += log.duration_ms;
                existing.sessions += 1;
                if (log.timestamp < existing.first_seen)
                    existing.first_seen = log.timestamp;
                if (log.timestamp > existing.last_seen)
                    existing.last_seen = log.timestamp;
                stats.set(appName, existing);
            });
            return Array.from(stats.entries()).map(([app, data]) => ({
                app,
                ...data,
                avg_session_ms: data.sessions > 0 ? data.total_ms / data.sessions : 0
            })).sort((a, b) => b.total_ms - a.total_ms);
        }
        // SQLite query with optional date filtering
        let query = `
      SELECT
        app,
        category,
        SUM(duration_ms) as total_ms,
        COUNT(*) as sessions,
        AVG(duration_ms) as avg_session_ms,
        MIN(timestamp) as first_seen,
        MAX(timestamp) as last_seen
      FROM logs
      WHERE LOWER(app) NOT IN ('chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge')
        AND (is_browser_tracking IS NULL OR is_browser_tracking = 0)
    `;
        const params: string[] = [];
        if (startDate) {
            query += ` AND timestamp >= ?`;
            params.push(startDate);
        }
        query += ` GROUP BY app ORDER BY total_ms DESC`;
        
        const stmt = db.prepare(query);
        const result = stmt.all(...params);
        console.log('[DeskFlow] get-app-stats returning', result.length, 'apps, total ms:', result.reduce((sum, r) => sum + (r.total_ms || 0), 0));
        return result;
    }
    catch (err) {
        console.error('[DeskFlow] get-app-stats error:', err);
        return [];
    }
});
// Get daily productivity data
electron_1.ipcMain.handle('get-daily-productivity', (event, date) => {
    try {
        const BROWSER_APPS = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge'];
        const dayStart = `${date}T00:00:00`;
        const dayEnd = `${date}T23:59:59`;
        let dayLogs;
        if (useJson) {
            dayLogs = jsonLogs.filter(l => l.timestamp >= dayStart &&
                l.timestamp <= dayEnd &&
                !BROWSER_APPS.includes(l.app.toLowerCase()));
        }
        else {
            const stmt = db.prepare(`
        SELECT * FROM logs
        WHERE timestamp >= ? AND timestamp <= ?
          AND LOWER(app) NOT IN ('chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge')
        ORDER BY timestamp
      `);
            dayLogs = stmt.all(dayStart, dayEnd);
        }
        const productivity = calculateProductivityScore(dayLogs);
        // Calculate wall-clock time (first log to last log)
        let wallClockSec = 0;
        if (dayLogs.length > 0) {
            const timestamps = dayLogs.map(l => new Date(l.timestamp).getTime());
            const first = Math.min(...timestamps);
            const last = Math.max(...timestamps);
            wallClockSec = Math.floor(Math.max(0, (last - first) / 1000));
        }
        return {
            date,
            ...productivity,
            wall_clock_sec: wallClockSec,
            total_sessions: dayLogs.length,
            first_activity: dayLogs.length > 0 ? dayLogs[0].timestamp : null,
            last_activity: dayLogs.length > 0 ? dayLogs[dayLogs.length - 1].timestamp : null
        };
    }
    catch (err) {
        console.error('[DeskFlow] get-daily-productivity error:', err);
        return null;
    }
});
// Get productivity data for a date range
electron_1.ipcMain.handle('get-productivity-range', (event, startDate, endDate) => {
    try {
        const BROWSER_APPS = ['chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge'];
        let allLogs;
        if (useJson) {
            allLogs = jsonLogs.filter(l => l.timestamp >= `${startDate}T00:00:00` &&
                l.timestamp <= `${endDate}T23:59:59` &&
                !BROWSER_APPS.includes(l.app.toLowerCase()));
        }
        else {
            const stmt = db.prepare(`
        SELECT * FROM logs
        WHERE timestamp >= ? AND timestamp <= ?
          AND LOWER(app) NOT IN ('chrome', 'firefox', 'safari', 'edge', 'brave', 'opera', 'google chrome', 'microsoft edge')
        ORDER BY timestamp
      `);
            allLogs = stmt.all(`${startDate}T00:00:00`, `${endDate}T23:59:59`);
        }
        // Group by date
        const groupedByDate: Record<string, any[]> = {};
        for (const log of allLogs) {
            const date = log.timestamp.split('T')[0];
            if (!groupedByDate[date])
                groupedByDate[date] = [];
            groupedByDate[date].push(log);
        }
        // Calculate productivity for each date
        const results = Object.entries(groupedByDate).map(([date, logs]: [string, any[]]) => {
            const productivity = calculateProductivityScore(logs);
            let wallClockSec = 0;
            if (logs.length > 0) {
                const timestamps = logs.map(l => new Date(l.timestamp).getTime());
                const first = Math.min(...timestamps);
                const last = Math.max(...timestamps);
                wallClockSec = Math.floor(Math.max(0, (last - first) / 1000));
            }
            return {
                date,
                ...productivity,
                wall_clock_sec: wallClockSec,
                total_sessions: logs.length
            };
        });
        return results.sort((a, b) => a.date.localeCompare(b.date));
    }
    catch (err) {
        console.error('[DeskFlow] get-productivity-range error:', err);
        return [];
    }
});
// --- Browser Tracking IPC Handlers ---
// Get browser logs - with optional period filtering
electron_1.ipcMain.handle('get-browser-logs', (event, period?: 'today' | 'week' | 'month' | 'all') => {
    try {
        return getBrowserLogs(period);
    }
    catch (err) {
        console.error('[DeskFlow] get-browser-logs error:', err);
        return [];
    }
});
// Get browser stats grouped by domain - with optional period filtering
electron_1.ipcMain.handle('get-browser-domain-stats', (event, period?: 'today' | 'week' | 'month' | 'all') => {
    try {
        return getBrowserDomainStats(period);
    }
    catch (err) {
        console.error('[DeskFlow] get-browser-domain-stats error:', err);
        return [];
    }
});
electron_1.ipcMain.handle('get-browser-category-stats', (event, period?: 'today' | 'week' | 'month' | 'all') => {
    try {
        return getBrowserCategoryStats(period);
    }
    catch (err) {
        console.error('[DeskFlow] get-browser-category-stats error:', err);
        return [];
    }
});
electron_1.ipcMain.handle('get-browser-tracking', () => {
    return isBrowserTrackingEnabled;
});
electron_1.ipcMain.handle('set-browser-tracking', (event, enabled) => {
    isBrowserTrackingEnabled = enabled;
    userPreferences.browserTrackingEnabled = enabled;
    savePreferences();
    console.log(`[DeskFlow] Browser tracking: ${enabled ? 'ON' : 'OFF'}`);
    // Restart server if needed
    if (enabled && !browserServer) {
        startBrowserTrackingServer();
    }
    else if (!enabled && browserServer) {
        browserServer.close();
        browserServer = null;
        stopBrowserSessionFlushTimer(); // FIX 2: Stop the flush timer too
        console.log('[DeskFlow] 🚫 Browser tracking server stopped');
    }
    return enabled;
});
electron_1.ipcMain.handle('get-browser-tracking-status', () => {
    return {
        enabled: isBrowserTrackingEnabled,
        serverRunning: browserServer !== null,
        port: browserServerPort,
        excludedDomains: browserExcludedDomains
    };
});
electron_1.ipcMain.handle('set-browser-excluded-domains', (event, domains) => {
    browserExcludedDomains = domains;
    userPreferences.browserExcludedDomains = domains;
    savePreferences();
    return true;
});
// Clean corrupted data - improved detection for multiple error types
electron_1.ipcMain.handle('clean-corrupted-data', () => {
    try {
        let deletedCount = 0;
        const cutoffDuration = MAX_LOGGED_SESSION_MS; // 1 hour (3600000ms)
        const now = new Date().toISOString();
        if (useJson) {
            // For JSON: filter out corrupted entries with multiple criteria
            const beforeCount = jsonLogs.length;
            jsonLogs = jsonLogs.filter(log => {
                const durationSec = (log.duration_ms || 0) / 1000;
                const logTime = new Date(log.timestamp);
                const nowDate = new Date();
                // 1. Duration > 1 hour (corrupted)
                if (log.duration_ms > cutoffDuration)
                    return false;
                // 2. Impossible timestamps (start > end would mean negative duration, checked above)
                // 3. Future dates
                if (logTime > nowDate)
                    return false;
                // 4. Zero or negative duration
                if (durationSec <= 0)
                    return false;
                return true;
            });
            deletedCount = beforeCount - jsonLogs.length;
            saveJsonLogs();
            console.log(`[DeskFlow] 🧹 Cleaned ${deletedCount} corrupted entries from JSON`);
        }
        else {
            // For SQLite: delete entries with multiple criteria
            // 1. Duration > 1 hour
            const result1 = db.prepare(`DELETE FROM logs WHERE duration_ms > ?`).run(cutoffDuration);
            // 2. Future timestamps
            const result2 = db.prepare(`DELETE FROM logs WHERE timestamp > ?`).run(now);
            // 3. Zero or negative duration
            const result3 = db.prepare(`DELETE FROM logs WHERE duration_ms <= 0`).run();
            // 4. Null timestamps
            const result4 = db.prepare(`DELETE FROM logs WHERE timestamp IS NULL OR timestamp = ''`).run();
            deletedCount = result1.changes + result2.changes + result3.changes + result4.changes;
            // Also clean the new aggregate tables
            const aggResult = db.prepare(`DELETE FROM daily_aggregates WHERE total_sec > 86400`).run(); // > 24 hours
            const browserResult = db.prepare(`DELETE FROM browser_sessions WHERE total_sec > 86400`).run();
            console.log(`[DeskFlow] 🧹 Cleaned ${deletedCount} corrupted entries from SQLite`);
        }
        return { success: true, deletedCount };
    }
    catch (err) {
        console.error('[DeskFlow] clean-corrupted-data error:', err);
        return { success: false, deletedCount: 0, error: err.message };
    }
});
// Deep cleanup - removes all raw logs and rebuilds aggregates from scratch
electron_1.ipcMain.handle('deep-clean-and-rebuild', () => {
    try {
        if (useJson) {
            return { success: false, message: 'JSON mode - use clear-data instead' };
        }
        // Clear all raw logs
        const logsCleared = db.prepare(`DELETE FROM logs`).run();
        // Clear aggregate tables
        const aggCleared = db.prepare(`DELETE FROM daily_aggregates`).run();
        const browserCleared = db.prepare(`DELETE FROM browser_sessions`).run();
        const sessionsCleared = db.prepare(`DELETE FROM sessions`).run();
        // Reset auto-increment counters
        db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('logs', 'daily_aggregates', 'browser_sessions', 'sessions')`);
        console.log(`[DeskFlow] 🔥 Deep clean complete: ${logsCleared.changes} logs, ${aggCleared.changes} aggregates cleared`);
        return {
            success: true,
            logsCleared: logsCleared.changes,
            aggregatesCleared: aggCleared.changes
        };
    }
    catch (err) {
        console.error('[DeskFlow] deep-clean error:', err);
        return { success: false, message: err.message };
    }
});
// Save file handler for exports - opens file dialog to let user choose location
electron_1.ipcMain.handle('save-file', async (event, options) => {
    try {
        const { content, filename, fileType } = options;
        const downloadsPath = electron_1.app.getPath('downloads');
        
        // Show save dialog to let user choose where to save
        const result = await electron_1.dialog.showSaveDialog({
            title: 'Save Export File',
            defaultPath: path_1.default.join(downloadsPath, filename),
            filters: [
                { name: fileType === 'application/json' ? 'JSON' : 'CSV', extensions: [fileType === 'application/json' ? 'json' : 'csv'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (result.canceled || !result.filePath) {
            return { success: false, message: 'Save cancelled' };
        }
        
        fs_1.default.writeFileSync(result.filePath, content);
        console.log(`[DeskFlow] File saved: ${result.filePath}`);
        return { success: true, path: result.filePath };
    }
    catch (err) {
        console.error('[DeskFlow] Save file error:', err);
        return { success: false, message: err.message };
    }
});
// --- Browser Tracking HTTP Server ---
function startBrowserTrackingServer() {
    if (!isBrowserTrackingEnabled) {
        console.log('[DeskFlow] 🚫 Browser tracking disabled, server not started');
        return;
    }
    const server = http_1.default.createServer((req, res) => {
        // Only accept POST /browser-data
        if (req.method === 'POST' && req.url === '/browser-data') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    handleBrowserData(data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'ok' }));
                }
                catch (err) {
                    console.error('[DeskFlow] Invalid browser data:', err);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'Invalid JSON' }));
                }
            });
        }
        else if (req.method === 'GET' && req.url === '/health') {
            // Health check endpoint
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', tracking: isBrowserTrackingEnabled }));
        }
        else if (req.method === 'GET' && req.url === '/foreground-app') {
            // Return the current foreground app name so browser extension can check if browser is focused
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                app: currentApp,
                isTracking: isBrowserTrackingEnabled
            }));
        }
        else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'not found' }));
        }
    });
    server.listen(browserServerPort, () => {
        console.log(`[DeskFlow] 🌐 Browser tracking server started on port ${browserServerPort}`);
    });
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`[DeskFlow] ⚠️ Port ${browserServerPort} already in use, browser tracking unavailable`);
        }
        else {
            console.error('[DeskFlow] Browser server error:', err.message);
        }
    });
    browserServer = server;
    // FIX 2: Start the stale session flush timer
    startBrowserSessionFlushTimer();
}
// Handle incoming browser tracking data from extension
// FIX 1 + FIX 4: Use Map<string, LogEntry> keyed by domain, track time deltas properly
// FIX: Only track the MOST RECENTLY active tab, not all tabs
function handleBrowserData(data) {
    if (!isBrowserTrackingEnabled)
        return;
    if (!data.domain || !data.url)
        return;
    // Check if domain is excluded
    if (categorizeDomain(data.domain, data.title, data.url) === 'Excluded') {
        console.log('[DeskFlow] 🚫 Excluded domain skipped:', data.domain);
        return;
    }
    const sessionDuration = data.active_duration_ms || 0;
    const dataTimestamp = data.timestamp ? new Date(data.timestamp).getTime() : Date.now();
    // Only log if session is meaningful (> 2 seconds)
    if (sessionDuration < 2000)
        return;
    // STRICT MODE: Only track the MOST RECENTLY active tab
    // If this domain is NOT the most recent one, skip it
    if (lastActiveBrowserDomain && lastActiveBrowserDomain !== data.domain) {
        const timeSinceLastActive = dataTimestamp - lastActiveBrowserTimestamp;
        // If the last active was within last 30 seconds and this is a different domain, skip
        if (timeSinceLastActive < 30000) {
            console.log(`[DeskFlow] ⏭️ Skipped non-active browser tab: ${data.domain} (active: ${lastActiveBrowserDomain})`);
            return;
        }
    }
    // Update last active domain
    lastActiveBrowserDomain = data.domain;
    lastActiveBrowserTimestamp = dataTimestamp;
    const existingSession = activeBrowserSessions.get(data.domain);
    if (existingSession) {
        // FIX: Use explicit delta from extension if available (new behavior)
        // Otherwise calculate delta from last recorded duration (legacy behavior)
        let safeDelta;
        if (data.is_periodic && data.delta_ms) {
            // New behavior: extension sends explicit delta (time since last sync)
            safeDelta = Math.min(data.delta_ms, MAX_SESSION_MS);
            console.log(`[DeskFlow] 🔄 Periodic update for ${data.domain}: +${Math.floor(safeDelta / 1000)}s (delta)`);
        }
        else {
            // Legacy behavior: calculate delta from total duration
            const lastDuration = existingSession.duration_ms;
            const delta = sessionDuration - lastDuration;
            safeDelta = Math.min(Math.max(0, delta), MAX_SESSION_MS);
        }
        // Only update if there's actual new time (delta > 0 and reasonable)
        if (safeDelta > 1000) { // At least 1 second of new activity
            existingSession.duration_ms = existingSession.duration_ms + safeDelta;
            existingSession.title = data.title || existingSession.title;
            existingSession.timestamp = data.timestamp || new Date().toISOString();
            // Update in SQLite with the accumulated total
            if (!useJson) {
                try {
                    const updateStmt = db.prepare(`UPDATE logs SET duration_ms = ?, title = ?, url = ?, timestamp = ? WHERE id = ?`);
                    updateStmt.run(existingSession.duration_ms, data.title || existingSession.title, data.sanitized_url || data.url, existingSession.timestamp, existingSession.id);
                }
                catch (err) {
                    console.error('[DeskFlow] Browser session update failed:', err);
                }
            }
            else {
                // For JSON fallback: find and update the entry in jsonLogs
                const idx = jsonLogs.findIndex((l) => l.id === existingSession.id);
                if (idx !== -1) {
                    jsonLogs[idx].duration_ms = existingSession.duration_ms;
                    jsonLogs[idx].title = data.title || jsonLogs[idx].title;
                    jsonLogs[idx].url = data.sanitized_url || data.url;
                    jsonLogs[idx].timestamp = existingSession.timestamp;
                    saveJsonLogs();
                }
            }
            console.log(`[DeskFlow] 🔄 Updated browser session: ${data.domain} → ${Math.floor(existingSession.duration_ms / 1000)}s (+${Math.floor(safeDelta / 1000)}s)`);
            // Update browser_sessions aggregate table with the delta
            if (!useJson && safeDelta > 0) {
                updateAggregates(existingSession.timestamp, existingSession.app, existingSession.category, safeDelta, data.domain, true);
            }
        }
    }
    else {
        // No active session for this domain — create new one
        // CRITICAL FIX: Be more defensive with new session duration
        // If this is a tab switch (is_periodic = false), duration is total time on that tab - use it
        // If this is periodic sync and we somehow have no session, it's an error - skip
        let newSessionDuration;
        if (data.is_periodic) {
            // This shouldn't happen - periodic sync should always have existingSession
            // Skip to prevent duplicate entries
            console.warn(`[DeskFlow] ⚠️ Periodic sync without existing session for ${data.domain}, skipping`);
            return;
        }
        // Tab switch - duration is total time on previous tab, use it
        newSessionDuration = Math.min(sessionDuration, MAX_LOGGED_SESSION_MS);
        // Sanity check: if duration > 1 hour, it's likely corrupted
        if (sessionDuration > MAX_LOGGED_SESSION_MS) {
            console.warn(`[DeskFlow] ⚠️ Suspicious duration ${Math.floor(sessionDuration / 1000)}s for new session ${data.domain}, capping to 1 hour`);
        }
        const entry = {
            id: Date.now(),
            timestamp: data.timestamp || new Date().toISOString(),
            app: data.app || 'Browser',
            category: categorizeDomain(data.domain, data.title, data.url),
            duration_ms: newSessionDuration,
            title: data.title || data.domain,
            project: undefined,
            url: data.sanitized_url || data.url,
            domain: data.domain,
            tab_id: data.tab_id,
            is_browser_tracking: true
        };
        // Store in SQLite or JSON
        if (useJson) {
            jsonLogs.unshift(entry);
            if (jsonLogs.length > 50000)
                jsonLogs = jsonLogs.slice(0, 50000);
            saveJsonLogs();
        }
        else {
            try {
                const stmt = db.prepare(`
          INSERT INTO logs (timestamp, app, category, duration_ms, title, project, url, domain, tab_id, is_browser_tracking)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
                stmt.run(entry.timestamp, entry.app, entry.category, entry.duration_ms, entry.title, entry.project, entry.url, entry.domain, entry.tab_id, 1);
            }
            catch (err) {
                console.error('[DeskFlow] Browser data insert failed:', err);
            }
        }
        // Update browser_sessions aggregate table
        updateAggregates(entry.timestamp, entry.app, entry.category, entry.duration_ms, entry.domain, true);
        // FIX 1: Track this domain in the Map
        activeBrowserSessions.set(data.domain, entry);
        console.log(`[DeskFlow] ✅ Browser logged: ${data.domain} → ${Math.floor(sessionDuration / 1000)}s`);
    }
}
// FIX 2: Periodic flush of stale browser sessions (handles MV3 onSuspend unreliability)
// Called every 30 seconds to flush sessions that haven't been updated in 60+ seconds
let browserSessionFlushInterval = null;
function startBrowserSessionFlushTimer() {
    if (browserSessionFlushInterval)
        clearInterval(browserSessionFlushInterval);
    browserSessionFlushInterval = setInterval(() => {
        const now = Date.now();
        const STALE_THRESHOLD_MS = 60000; // 60 seconds
        for (const [domain, session] of activeBrowserSessions.entries()) {
            // Check if this session is stale by comparing its timestamp
            const sessionAge = now - new Date(session.timestamp).getTime();
            if (sessionAge > STALE_THRESHOLD_MS) {
                // Session is stale — remove from active map (it's already persisted in SQLite)
                activeBrowserSessions.delete(domain);
                console.log(`[DeskFlow] 🧹 Flushed stale browser session: ${domain} (${Math.floor(session.duration_ms / 1000)}s)`);
            }
        }
    }, 30000); // Check every 30 seconds
}
function stopBrowserSessionFlushTimer() {
    if (browserSessionFlushInterval) {
        clearInterval(browserSessionFlushInterval);
        browserSessionFlushInterval = null;
    }
}
// Get browser activity logs
function getBrowserLogs(period?: 'today' | 'week' | 'month' | 'all') {
    let startDate: string | null = null;
    const now = new Date();
    
    if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
    } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString();
    }

    if (useJson) {
        let logs = jsonLogs.filter((log) => log.is_browser_tracking);
        if (startDate) {
            logs = logs.filter(l => l.timestamp >= startDate);
        }
        return logs.slice(0, 200);
    }
    try {
        let query = `SELECT * FROM logs WHERE is_browser_tracking = 1`;
        const params: string[] = [];
        if (startDate) {
            query += ` AND timestamp >= ?`;
            params.push(startDate);
        }
        query += ` ORDER BY id DESC LIMIT 200`;
        const stmt = db.prepare(query);
        return stmt.all(...params);
    }
    catch (err) {
        console.error('[DeskFlow] get-browser-logs error:', err);
        return [];
    }
}
// Get browser stats grouped by domain
function getBrowserDomainStats(period?: 'today' | 'week' | 'month' | 'all') {
    let startDate: string | null = null;
    const now = new Date();
    
    if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
    } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString();
    }

    if (useJson) {
        let logs = jsonLogs.filter((log) => log.is_browser_tracking);
        if (startDate) {
            logs = logs.filter(l => l.timestamp >= startDate);
        }
        const stats = new Map();
        logs.forEach((log) => {
            const key = log.domain || 'unknown';
            const existing = stats.get(key) || { total_ms: 0, sessions: 0, domain: key, category: log.category || 'Other', title: log.title || key };
            existing.total_ms += log.duration_ms;
            existing.sessions += 1;
            stats.set(key, existing);
        });
        return Array.from(stats.values()).sort((a, b) => b.total_ms - a.total_ms);
    }
    try {
        let query = `
      SELECT domain, category, SUM(duration_ms) as total_ms, COUNT(*) as sessions, MAX(title) as title
      FROM logs 
      WHERE is_browser_tracking = 1 AND domain IS NOT NULL
    `;
        const params: string[] = [];
        if (startDate) {
            query += ` AND timestamp >= ?`;
            params.push(startDate);
        }
        query += ` GROUP BY domain ORDER BY total_ms DESC`;
        const stmt = db.prepare(query);
        return stmt.all(...params);
    }
    catch (err) {
        console.error('[DeskFlow] get-browser-domain-stats error:', err);
        return [];
    }
}
// Get browser stats grouped by category
function getBrowserCategoryStats(period?: 'today' | 'week' | 'month' | 'all') {
    let startDate: string | null = null;
    const now = new Date();
    
    if (period === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = weekAgo.toISOString();
    } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = monthAgo.toISOString();
    }

    if (useJson) {
        let logs = jsonLogs.filter((log) => log.is_browser_tracking);
        if (startDate) {
            logs = logs.filter(l => l.timestamp >= startDate);
        }
        const stats = new Map();
        logs.forEach((log) => {
            const key = log.category || 'Other';
            const existing = stats.get(key) || { total_ms: 0, sessions: 0, category: key };
            existing.total_ms += log.duration_ms;
            existing.sessions += 1;
            stats.set(key, existing);
        });
        return Array.from(stats.values()).sort((a, b) => b.total_ms - a.total_ms);
    }
    try {
        let query = `
      SELECT category, SUM(duration_ms) as total_ms, COUNT(*) as sessions
      FROM logs 
      WHERE is_browser_tracking = 1 AND category IS NOT NULL
    `;
        const params: string[] = [];
        if (startDate) {
            query += ` AND timestamp >= ?`;
            params.push(startDate);
        }
        query += ` GROUP BY category ORDER BY total_ms DESC`;
        const stmt = db.prepare(query);
        return stmt.all(...params);
    }
    catch (err) {
        console.error('[DeskFlow] get-browser-category-stats error:', err);
        return [];
    }
}
electron_1.app.whenReady().then(() => {
    initializeStorage();
    loadCategoryConfig();
    // Check if started with --minimized flag (background mode)
    startMinimized = process.argv.includes('--minimized') || process.argv.includes('-m');
    
    // Always create tray first (works in background)
    createTray();
    
    // Only create window if NOT starting minimized (background mode)
    if (!startMinimized) {
        createWindow();
    } else {
        // In background mode, just start tracking - no window needed yet
        console.log('[DeskFlow] 🔄 Running in background (minimized)');
    }
    
    startBrowserTrackingServer();
    
    // Set auto-start only once (not every run) - but only if explicitly enabled by user
    // Removed: electron_1.app.setLoginItemSettings auto-set on every run
    
    // Load browser tracking preferences
    if (userPreferences.browserTrackingPort) {
        browserServerPort = userPreferences.browserTrackingPort;
    }
    if (userPreferences.browserTrackingEnabled !== undefined) {
        isBrowserTrackingEnabled = userPreferences.browserTrackingEnabled;
    }
    if (userPreferences.browserExcludedDomains) {
        browserExcludedDomains = userPreferences.browserExcludedDomains;
    }
    console.log('[DeskFlow] ✅ Real window tracking started with active-win');
    console.log(`[DeskFlow] ✅ Browser tracking: ${isBrowserTrackingEnabled ? 'ON' : 'OFF'}`);
    console.log(`[DeskFlow] ✅ Auto-start: ${electron_1.app.getLoginItemSettings().openAtLogin ? 'enabled' : 'disabled'}`);
});
electron_1.app.on('window-all-closed', () => {
    // Keep app running in background (tray mode)
});
electron_1.app.on('before-quit', () => {
    electron_1.app.isQuitting = true;
    if (trackingInterval)
        clearInterval(trackingInterval);
    // Log current session before quit
    if (currentApp && Date.now() - sessionStart > 5000) {
        const duration = Date.now() - sessionStart;
        const category = categorizeApp(currentApp);
        addLog(new Date(sessionStart).toISOString(), currentApp, category, duration, `${currentApp} Window`, null);
        console.log('[DeskFlow] ✅ Logged final session before quit:', currentApp);
    }
    // Ensure JSON data is flushed
    if (useJson) {
        saveJsonLogs();
        console.log('[DeskFlow] ✅ JSON data flushed to disk');
    }
    // Close browser tracking server
    if (browserServer) {
        browserServer.close();
        console.log('[DeskFlow] ✅ Browser tracking server closed');
    }
    // Unregister global shortcuts
    globalShortcut.unregisterAll();
    console.log('[DeskFlow] ✅ Global shortcuts unregistered');
    // Close SQLite connection
    if (db) {
        db.close();
        console.log('[DeskFlow] ✅ SQLite database closed');
    }
    console.log('[DeskFlow] 👋 App quit gracefully');
});
