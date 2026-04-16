import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('deskflowAPI', {
  // Listen for foreground window changes
  onForegroundChange: (callback: (data: any) => void) => {
    ipcRenderer.on('foreground-changed', (_event, data) => callback(data));
  },

  // Listen for tracking heartbeat
  onTrackingHeartbeat: (callback: (data: any) => void) => {
    ipcRenderer.on('tracking-heartbeat', (_event, data) => callback(data));
  },

  // Get recent activity logs
  getLogs: () => ipcRenderer.invoke('get-logs'),

  // Get logs filtered by period
  getLogsByPeriod: (period: 'today' | 'week' | 'month' | 'all') => ipcRenderer.invoke('get-logs-by-period', period),

  // Get aggregated stats
  getStats: () => ipcRenderer.invoke('get-stats'),

  // Get per-app detailed stats (optional period filter: 'today', 'week', 'month', 'all')
  getAppStats: (period?: 'today' | 'week' | 'month' | 'all') => ipcRenderer.invoke('get-app-stats', period),

  // Get daily stats
  getDailyStats: (period: 'week' | 'month' | 'all') => ipcRenderer.invoke('get-daily-stats', period),

  // Toggle tracking on/off
  toggleTracking: () => ipcRenderer.invoke('toggle-tracking'),

  // Clear all stored data
  clearData: () => ipcRenderer.invoke('clear-data'),

  // Clear only today's data (preserve history)
  clearToday: () => ipcRenderer.invoke('clear-today'),

  // Get database file path
  getDbPath: () => ipcRenderer.invoke('get-db-path'),

  // Get storage status and health
  getStorageStatus: () => ipcRenderer.invoke('get-storage-status'),

  // Get user preferences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),

  // Set user preference
  setPreference: (key: string, value: any) => ipcRenderer.invoke('set-preference', key, value),

  // Browser tracking methods (optional period: 'today', 'week', 'month', 'all')
  getBrowserLogs: (period?: 'today' | 'week' | 'month' | 'all') => ipcRenderer.invoke('get-browser-logs', period),
  getBrowserDomainStats: (period?: 'today' | 'week' | 'month' | 'all') => ipcRenderer.invoke('get-browser-domain-stats', period),
  getBrowserCategoryStats: (period?: 'today' | 'week' | 'month' | 'all') => ipcRenderer.invoke('get-browser-category-stats', period),
  setBrowserTracking: (enabled: boolean) => ipcRenderer.invoke('set-browser-tracking', enabled),
  getBrowserTrackingStatus: () => ipcRenderer.invoke('get-browser-tracking-status'),
  setBrowserExcludedDomains: (domains: string[]) => ipcRenderer.invoke('set-browser-excluded-domains', domains),

  // Productivity tracking
  getDailyProductivity: (date: string) => ipcRenderer.invoke('get-daily-productivity', date),
  getProductivityRange: (startDate: string, endDate: string) => ipcRenderer.invoke('get-productivity-range', startDate, endDate),

  // Clean corrupted data
  cleanCorruptedData: () => ipcRenderer.invoke('clean-corrupted-data'),

  // Deep cleanup and rebuild
  deepCleanAndRebuild: () => ipcRenderer.invoke('deep-clean-and-rebuild'),

  // Database schema and table management
  migrateToAggregates: () => ipcRenderer.invoke('migrate-to-aggregates'),
  getDailyAggregates: () => ipcRenderer.invoke('get-daily-aggregates'),
  getBrowserSessions: () => ipcRenderer.invoke('get-browser-sessions'),
  getSessions: () => ipcRenderer.invoke('get-sessions'),
  getTableSchema: (tableName: string) => ipcRenderer.invoke('get-table-schema', tableName),
  getDatabaseTables: () => ipcRenderer.invoke('get-database-tables'),
  getTableData: (tableName: string, limit?: number) => ipcRenderer.invoke('get-table-data', tableName, limit),
  updateCategoriesFromOverrides: (appOverrides: Record<string, string>, domainOverrides: Record<string, string>) => 
    ipcRenderer.invoke('update-categories-from-overrides', appOverrides, domainOverrides),

  // App control
  quitApp: () => ipcRenderer.invoke('quit-app'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  getAutoStartStatus: () => ipcRenderer.invoke('get-auto-start-status'),
  setAutoStart: (enabled: boolean) => ipcRenderer.invoke('set-auto-start', enabled),

  // Category Configuration
  getCategoryConfig: () => ipcRenderer.invoke('get-category-config'),
  setAppCategory: (appName: string, category: string) => ipcRenderer.invoke('set-app-category', appName, category),
  setDomainCategory: (domain: string, category: string) => ipcRenderer.invoke('set-domain-category', domain, category),
  setAppTier: (appName: string, tier: string) => ipcRenderer.invoke('set-app-tier', appName, tier),
  setDomainTier: (domain: string, tier: string) => ipcRenderer.invoke('set-domain-tier', domain, tier),
  setTierAssignments: (assignments: { productive: string[]; neutral: string[]; distracting: string[] }) => ipcRenderer.invoke('set-tier-assignments', assignments),
  applyCategoryToHistorical: (tierAssignments: any) => ipcRenderer.invoke('apply-category-to-historical', tierAssignments),
  getTierAssignments: () => ipcRenderer.invoke('get-tier-assignments'),
  getDefaultCategories: () => ipcRenderer.invoke('get-default-categories'),

  // File operations
  saveFile: (options: { content: string; filename: string; fileType: string }) => ipcRenderer.invoke('save-file', options),

  // ========== IDE Projects ==========
  // IDE Detection
  detectIDEs: () => ipcRenderer.invoke('detect-ides'),
  getIDEs: () => ipcRenderer.invoke('get-ides'),
  getExtensions: (ideId?: string) => ipcRenderer.invoke('get-extensions', ideId),

  // Tool Detection
  scanTools: () => ipcRenderer.invoke('scan-tools'),
  getTools: (category?: string) => ipcRenderer.invoke('get-tools', category),
  getToolCategories: () => ipcRenderer.invoke('get-tool-categories'),

  // Project Management
  addProject: (projectData: { name: string; path: string; repositoryUrl?: string; vcsType?: string; primaryLanguage?: string }) =>
    ipcRenderer.invoke('add-project', projectData),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getProjectTools: (projectId: string) => ipcRenderer.invoke('get-project-tools', projectId),
  removeProject: (projectId: string) => ipcRenderer.invoke('remove-project', projectId),

  // AI & Git Metrics
  getAIUsageSummary: (period?: 'week' | 'month') => ipcRenderer.invoke('get-ai-usage-summary', period),
  getCommitStats: (projectId?: string, period?: 'week' | 'month') => ipcRenderer.invoke('get-commit-stats', projectId, period),

  // Dashboard Overview
  getIDEProjectsOverview: () => ipcRenderer.invoke('get-ide-projects-overview'),

  // AI Usage Sync
  syncAIUsage: () => ipcRenderer.invoke('sync-ai-usage'),
  debugAIAgents: () => ipcRenderer.invoke('debug-ai-agents'),

  // Git & DORA Metrics
  syncCommits: (projectId: string, repoPath?: string) => ipcRenderer.invoke('sync-commits', projectId, repoPath),
  syncGitHubCommits: (projectId: string, owner: string, repo: string, token?: string) => 
    ipcRenderer.invoke('sync-github-commits', projectId, owner, repo, token),
  getDORAMetrics: (projectId: string, period?: 'week' | 'month') => ipcRenderer.invoke('get-dora-metrics', projectId, period),
  getCommitHistory: (projectId: string, limit?: number) => ipcRenderer.invoke('get-commit-history', projectId, limit),
  getContributorStats: (projectId: string) => ipcRenderer.invoke('get-contributor-stats', projectId),
});
