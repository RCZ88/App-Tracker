# Browser Extension Technical Questions for Perplexity/Comet

---

## Context

I am building a **browser tracking extension** for the Comet browser (by Perplexity). The extension is a **Manifest V3 Chrome extension** that:
1. Tracks only the **actively viewed tab** (not background tabs)
2. Extracts the URL, domain, and page title
3. Strips query parameters from URLs for privacy
4. Sends this data every ~5 seconds via HTTP POST to `http://localhost:54321/browser-data`
5. An Electron desktop app receives the data, categorizes the domain, and stores it in SQLite

**Goal:** Understand Comet browser's extension compatibility, limitations, and quirks to ensure this integration works properly.

---

## Questions

### 1. Extension Compatibility

- Does **Comet browser** support **Chrome Manifest V3 extensions** natively?
- Are there any Comet-specific deviations from the standard Chrome extension APIs?
- Is there a `comet://extensions` page equivalent to `chrome://extensions`?
- Does Comet require any special flags or settings to enable developer-mode extension loading?

### 2. Active Tab Tracking APIs

I'm using these APIs in my extension's service worker (`background.js`):

```javascript
chrome.tabs.onActivated.addListener(...)       // User switched tabs
chrome.tabs.onUpdated.addListener(...)          // URL or title changed
chrome.webNavigation.onCompleted.addListener(...) // Page finished loading
chrome.windows.onFocusChanged.addListener(...)   // Browser lost/regained focus
```

- Are all four of these events available and functional in Comet?
- Does `chrome.tabs.onUpdated` fire reliably when navigating between pages?
- Does `chrome.webNavigation.onCompleted` require any additional permissions beyond `"webNavigation"`?
- Is there any known issue with `chrome.tabs.get()` in Manifest V3 service workers (since they go idle)?

### 3. Service Worker Lifecycle (Manifest V3)

- How long does Comet keep a Manifest V3 service worker alive when idle?
- Is there a way to prevent the service worker from being killed while tracking?
- Does `chrome.alarms` API work in Comet? (I might need it for reliable periodic sync)
- Are there Comet-specific quirks with `setInterval` in service workers?

### 4. HTTP Requests from Extensions

My extension sends data like this:

```javascript
fetch('http://localhost:54321/browser-data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
  signal: AbortSignal.timeout(2000)
})
```

- Does Comet allow extensions to make `fetch()` requests to `localhost`?
- Is the `host_permissions` field (`"http://localhost:54321/*"`) respected properly?
- Are there any CORS issues when posting to a local HTTP server from an extension?
- Does Comet have any Content Security Policy (CSP) that blocks localhost fetches?

### 5. Tab URL Access

- When calling `chrome.tabs.get(tabId)`, does the `tab.url` field always contain the full current URL?
- Are there any pages where Comet blocks URL access (e.g., new tab page, settings pages, Perplexity pages)?
- Does `tab.url` include hash fragments (`#section`) and query parameters (`?search=foo`)?
- Are there Comet-specific internal URLs I should filter out (beyond `chrome://`, `edge://`, `about:blank`)?

### 6. Permissions

I'm requesting these permissions:
```json
"permissions": ["tabs", "webNavigation", "activeTab"]
```

- Are these the minimal permissions needed for active tab tracking?
- Does Comet show a scary permissions warning for `"tabs"` that would deter users?
- Is `"activeTab"` sufficient to avoid needing `"tabs"` (broader access)?
- Does Comet require host permissions like `"<all_urls>` for `webNavigation` to work?

### 7. Focus Detection

My goal is to **only track tabs the user is actually looking at**, not background tabs. My current approach:
- `chrome.tabs.onActivated` → user clicked a different tab
- `chrome.windows.onFocusChanged` → user switched to/from the browser window
- Only sync data when the tab is in the focused window

- Is this the correct approach for accurate "actively viewed" detection?
- Is there a better Comet-specific API for detecting which tab the user is looking at?
- Does `chrome.windows.onFocusChanged` fire reliably when Alt+Tab switching in Windows?

### 8. Comet-Specific Features

- Does Comet have any unique APIs or events that would improve tab/activity tracking?
- Is there a way to detect if the user is interacting with Perplexity's AI panel vs. a regular webpage?
- Does Comet have a sidebar or panel system that might affect which tab is "active"?

### 9. Known Issues / Edge Cases

- What happens when the user has multiple Comet windows open?
- Does `chrome.tabs.onActivated` fire when switching between windows?
- What happens during drag-and-drop tab reordering?
- What happens when a tab crashes or is forcefully terminated?
- Are there any Comet updates that might break extension functionality silently?

### 10. Debugging

- How do I view the service worker console logs in Comet?
- Is there a `comet://inspect` page like `chrome://inspect`?
- Can I use `console.log` in the background service worker and see output reliably?
- What's the best way to debug why an extension isn't sending data to localhost?

---

## What I Need to Know Most

If you can only answer a subset, prioritize:

1. **Does Comet support Manifest V3 extensions fully?** (showstopper if not)
2. **Do the four Chrome APIs I'm using work in Comet?** (`tabs.onActivated`, `tabs.onUpdated`, `webNavigation.onCompleted`, `windows.onFocusChanged`)
3. **Can extensions POST to localhost via fetch?** (critical for data pipeline)
4. **How to debug extension service worker logs in Comet?**
5. **Any Comet-specific quirks I should code around?**

---

## My Extension Code

For reference, here is my current `background.js`:

```javascript
// DeskFlow Browser Extension - Background Service Worker
const DESKFLOW_SERVER = 'http://localhost:54321';
const SYNC_INTERVAL_MS = 5000;
const MIN_SESSION_MS = 3000;

let activeTabId = null;
let activeTabUrl = '';
let activeTabTitle = '';
let activeTabDomain = '';
let sessionStart = Date.now();
let isTrackingEnabled = true;

function extractDomain(url) {
  if (!url) return 'unknown';
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.split('/')[2] || 'unknown';
  }
}

function sanitizeUrl(url) {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname.replace(/\/$/, '')}`;
  } catch {
    return url.split('?')[0].split('#')[0];
  }
}

function isDomainExcluded(domain) {
  const excludedDomains = [
    'localhost', '127.0.0.1', 'chrome://', 'chrome-extension://',
    'edge://', 'about:blank', 'newtab'
  ];
  return excludedDomains.some(excluded => domain.includes(excluded));
}

async function sendToDeskFlow(data) {
  if (!isTrackingEnabled) return;
  try {
    const response = await fetch(`${DESKFLOW_SERVER}/browser-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      console.log('[DeskFlow] ✅ Synced:', data.domain);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.debug('[DeskFlow] ⚠️ Server unreachable:', err.message);
    }
  }
}

async function updateActiveTab(tabId) {
  if (!tabId) return;
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) return;
    if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) return;
    const domain = extractDomain(tab.url);
    if (isDomainExcluded(domain)) return;
    if (activeTabId !== null && activeTabId !== tabId) {
      await logPreviousSession();
    }
    activeTabId = tabId;
    activeTabUrl = sanitizeUrl(tab.url);
    activeTabTitle = tab.title || domain;
    activeTabDomain = domain;
    sessionStart = Date.now();
  } catch (err) {
    console.debug('[DeskFlow] Tab update failed:', err.message);
  }
}

async function logPreviousSession() {
  if (!activeTabId || !activeTabUrl) return;
  const duration = Date.now() - sessionStart;
  if (duration < MIN_SESSION_MS) return;
  const data = {
    url: activeTabUrl,
    domain: activeTabDomain,
    title: activeTabTitle,
    tab_id: activeTabId,
    timestamp: new Date(sessionStart).toISOString(),
    active_duration_ms: duration,
    sanitized_url: sanitizeUrl(activeTabUrl)
  };
  await sendToDeskFlow(data);
}

async function periodicSync() {
  if (!activeTabId || !isTrackingEnabled) return;
  const duration = Date.now() - sessionStart;
  if (duration < MIN_SESSION_MS) return;
  const data = {
    url: activeTabUrl,
    domain: activeTabDomain,
    title: activeTabTitle,
    tab_id: activeTabId,
    timestamp: new Date(sessionStart).toISOString(),
    active_duration_ms: duration,
    sanitized_url: sanitizeUrl(activeTabUrl),
    is_periodic: true
  };
  await sendToDeskFlow(data);
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await updateActiveTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tabId !== activeTabId) return;
  if (changeInfo.url || changeInfo.title) {
    const domain = extractDomain(tab.url || activeTabUrl);
    if (isDomainExcluded(domain)) return;
    if (activeTabUrl && activeTabUrl !== sanitizeUrl(tab.url || '')) {
      await logPreviousSession();
    }
    activeTabUrl = sanitizeUrl(tab.url || activeTabUrl);
    activeTabTitle = tab.title || activeTabTitle;
    activeTabDomain = domain;
    sessionStart = Date.now();
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (details.tabId !== activeTabId) return;
  const tab = await chrome.tabs.get(details.tabId).catch(() => null);
  if (!tab || !tab.url) return;
  if (!tab.url.startsWith('http://') && !tab.url.startsWith('https://')) return;
  const domain = extractDomain(tab.url);
  if (isDomainExcluded(domain)) return;
  await logPreviousSession();
  activeTabId = details.tabId;
  activeTabUrl = sanitizeUrl(tab.url);
  activeTabTitle = tab.title || domain;
  activeTabDomain = domain;
  sessionStart = Date.now();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await logPreviousSession();
  } else {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      await updateActiveTab(tabs[0].id);
    }
  }
});

setInterval(periodicSync, SYNC_INTERVAL_MS);

chrome.runtime.onSuspend.addListener(async () => {
  await logPreviousSession();
});

console.log('[DeskFlow] 🔍 Browser tracker extension started');
```

---

## Expected Response Format

Please answer each question with:
- ✅ Yes / ❌ No / ⚠️ Partially
- Brief explanation
- Any workarounds or Comet-specific alternatives if applicable
