import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Dumbbell, Activity, Moon,
  Utensils, Coffee, Bus, Book, Timer, Zap,
  Sun, Zap as ZapIcon, Focus, Clock, X,
  Edit3, Check, Plus, Minus, TrendingUp,
  Target, ZapCircle, RefreshCw, Clock3
} from 'lucide-react';

const OrbitSystem = lazy(() => import('../components/OrbitSystem').then(module => ({ default: module.default })));

interface ExternalActivity {
  id: number;
  name: string;
  type: 'stopwatch' | 'sleep' | 'checkin';
  color: string;
  icon: string;
  is_productive: boolean;
}

interface HourlyHeatmapData {
  day: string;
  hours: number;
}

interface SolarSystemData {
  name: string;
  usage_ms: number;
  category: string;
}

interface ForegroundData {
  app?: string;
  title?: string;
  category?: string;
  tier?: 'productive' | 'neutral' | 'distracting';
}

const ACTIVITY_ICONS: Record<string, any> = {
  BookOpen, Dumbbell, Activity, Moon, Utensils, Coffee, Bus, Book, Sun, Timer
};

// Tier assignments for categorizing productivity
const DEFAULT_TIER_ASSIGNMENTS = {
  productive: ['IDE', 'AI Tools', 'Developer Tools', 'Education', 'Productivity', 'Tools'],
  neutral: ['Communication', 'Design', 'Search Engine', 'News', 'Uncategorized', 'Other', 'Browser'],
  distracting: ['Entertainment', 'Social Media', 'Shopping']
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

interface ActivityLog {
  id: number;
  timestamp: Date;
  app: string;
  category: string;
  duration: number;
  title?: string;
  project?: string;
  is_browser_tracking?: boolean;
}

interface TimerBehavior {
  neutralAction: 'pause' | 'reset' | 'ignore';
  distractingAction: 'pause' | 'reset' | 'ignore';
}

interface ActivityFeedItem {
  id: string;
  timestamp: Date;
  type: 'app' | 'browser';
  name: string;
  category: string;
  tier: 'productive' | 'neutral' | 'distracting';
}

interface DashboardPageProps {
  externalActivities?: ExternalActivity[];
  hourlyHeatmap?: HourlyHeatmapData[];
  solarSystemData?: SolarSystemData[];
  productiveTimeMs?: number;
  logs?: ActivityLog[];
  allLogs?: ActivityLog[];
  browserLogs?: ActivityLog[];
  appColors?: Record<string, string>;
  categoryOverrides?: Record<string, string>;
  timerBehavior?: TimerBehavior;
  selectedPeriod?: 'today' | 'week' | 'month' | 'all';
  trackingBrowser?: string;
  tierAssignments?: {
    productive: string[];
    neutral: string[];
    distracting: string[];
  };
}

export default function DashboardPage({
  externalActivities = [],
  hourlyHeatmap = [],
  solarSystemData = [],
  productiveTimeMs = 0,
  logs = [],
  allLogs = [],
  browserLogs = [],
  appColors = {},
  categoryOverrides = {},
  timerBehavior = { neutralAction: 'pause', distractingAction: 'reset' },
  selectedPeriod = 'week',
  trackingBrowser = '',
  tierAssignments = { productive: ['IDE', 'AI Tools', 'Education', 'Productivity', 'Tools'], neutral: ['Browser', 'Communication', 'Design', 'News', 'Uncategorized', 'Other'], distracting: ['Entertainment', 'Social Media', 'Shopping'] }
}: DashboardPageProps) {
  const [selectedExternalActivity, setSelectedExternalActivity] = useState<ExternalActivity | null>(null);
  const [externalSessionRunning, setExternalSessionRunning] = useState(false);
  const [externalElapsedMs, setExternalElapsedMs] = useState(0);
  const [externalSessionStart, setExternalSessionStart] = useState<Date | null>(null);
  const [currentApp, setCurrentApp] = useState<ForegroundData | null>(null);
  const [currentProductiveMs, setCurrentProductiveMs] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [lastTier, setLastTier] = useState<'productive' | 'neutral' | 'distracting' | null>(null);
  const [resetTrigger, setResetTrigger] = useState<{ app: string; category: string; timestamp: Date } | null>(null);
  const [expandedModal, setExpandedModal] = useState<'heatmap' | 'solar' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pinnedActivitiesEditMode, setPinnedActivitiesEditMode] = useState(false);
  const [pinnedActivities, setPinnedActivities] = useState<ExternalActivity[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const activityFeedRef = useRef<ActivityFeedItem[]>([]);
  const [resetCount, setResetCount] = useState(0);
  const [lastNonBrowserApp, setLastNonBrowserApp] = useState<ForegroundData | null>(null);
  const [currentWebsite, setCurrentWebsite] = useState<{ title?: string; url?: string; category?: string } | null>(null);

  const DEFAULT_ACTIVITIES: ExternalActivity[] = [
    { id: 1, name: 'Study', type: 'stopwatch', color: '#10b981', icon: 'BookOpen', is_productive: true },
    { id: 2, name: 'Exercise', type: 'stopwatch', color: '#10b981', icon: 'Dumbbell', is_productive: true },
    { id: 3, name: 'Gym', type: 'stopwatch', color: '#10b981', icon: 'Activity', is_productive: true },
    { id: 4, name: 'Reading', type: 'stopwatch', color: '#10b981', icon: 'Book', is_productive: true },
    { id: 5, name: 'Sleep', type: 'sleep', color: '#6366f1', icon: 'Moon', is_productive: false },
    { id: 6, name: 'Eating', type: 'checkin', color: '#6366f1', icon: 'Utensils', is_productive: false },
  ];

  const activities = useMemo(() => externalActivities.length > 0 ? externalActivities : DEFAULT_ACTIVITIES, [externalActivities]);

  // Initialize pinned activities from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dashboard-pinned-activities');
        if (saved) {
          setPinnedActivities(JSON.parse(saved));
        } else {
          setPinnedActivities(DEFAULT_ACTIVITIES.slice(0, 5));
        }
      } catch { /* ignore */ }
    }
  }, []);

  // Save pinned activities to localStorage when changed
  useEffect(() => {
    if (pinnedActivities.length > 0) {
      localStorage.setItem('dashboard-pinned-activities', JSON.stringify(pinnedActivities));
    }
  }, [pinnedActivities]);

  // Count resets today
  useEffect(() => {
    const count = activityFeed.filter(item => 
      item.tier === 'distracting' && 
      new Date(item.timestamp).toDateString() === new Date().toDateString()
    ).length;
    setResetCount(count);
  }, [activityFeed]);

  // Determine tier from category
  const getTierFromCategory = (category?: string): 'productive' | 'neutral' | 'distracting' => {
    if (!category) return 'neutral';
    if (DEFAULT_TIER_ASSIGNMENTS.productive.includes(category)) return 'productive';
    if (DEFAULT_TIER_ASSIGNMENTS.distracting.includes(category)) return 'distracting';
    return 'neutral';
  };

  // Listen for foreground window changes
  useEffect(() => {
    if (!window.deskflowAPI?.onForegroundChange) return;

    window.deskflowAPI.onForegroundChange((data: ForegroundData) => {
      // Ignore Electron app itself - keep showing the previous app
      if (data.app && data.app.toLowerCase().includes('electron')) {
        return;
      }

      // Check if this is the tracking browser
      const isTrackingBrowser = trackingBrowser && data.app && 
        data.app.toLowerCase().includes(trackingBrowser.toLowerCase());

      // If it's the tracking browser, don't update current app - use browser logs for website
      if (isTrackingBrowser) {
        // Track the website instead (will be updated via browser tracking events)
        // Keep showing last non-browser app
        setCurrentApp(lastNonBrowserApp);
        return;
      }

      // Track non-browser apps
      setLastNonBrowserApp(data);

      // If we're currently tracking a browser, the category should be from the website
      const tier = getTierFromCategory(data.category);
      const newItem: ActivityFeedItem = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        type: 'app',
        name: data.app || data.title || 'Unknown',
        category: data.category || 'Unknown',
        tier
      };
      activityFeedRef.current = [...activityFeedRef.current.slice(-49), newItem];
      setActivityFeed([...activityFeedRef.current]);
      setCurrentApp(data);
    });
  }, [trackingBrowser, lastNonBrowserApp]);

  // Listen for browser tracking events (website changes)
  useEffect(() => {
    if (!window.deskflowAPI?.onBrowserTrackingEvent) return;

    window.deskflowAPI.onBrowserTrackingEvent((data: any) => {
      if (data.type === 'browser-data' || data.type === 'live-log') {
        setCurrentWebsite({
          title: data.title,
          url: data.url,
          category: data.category
        });

        // Only add to feed if we're on the tracking browser
        if (!trackingBrowser) return;

        const tier = getTierFromCategory(data.category || 'Uncategorized');
        const newItem: ActivityFeedItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          type: 'browser',
          name: data.domain || data.title || 'Unknown',
          category: data.category || 'Uncategorized',
          tier
        };
        activityFeedRef.current = [...activityFeedRef.current.slice(-49), newItem];
        setActivityFeed([...activityFeedRef.current]);
      }
    });
  }, [trackingBrowser]);

  // Auto-counting timer logic for app/browser productivity
  useEffect(() => {
    // If Electron app, don't track - keep last non-browser app state
    if (!currentApp || !currentApp.category) return;

    const currentTier = getTierFromCategory(currentApp.category);

    // Handle switching from productive to neutral
    if (lastTier === 'productive' && currentTier === 'neutral') {
      if (timerBehavior.neutralAction === 'reset') {
        setResetTrigger({
          app: currentApp.app || currentApp.title || 'Unknown',
          category: currentApp.category || 'Unknown',
          timestamp: new Date()
        });
        setCurrentProductiveMs(0);
        setSessionStartTime(0);
        setIsPaused(false);
      } else if (timerBehavior.neutralAction === 'pause') {
        setIsPaused(true);
      }
      // ignore: do nothing
    }

    // Handle switching from productive to distracting
    if (lastTier === 'productive' && currentTier === 'distracting') {
      if (timerBehavior.distractingAction === 'reset') {
        setResetTrigger({
          app: currentApp.app || currentApp.title || 'Unknown',
          category: currentApp.category || 'Unknown',
          timestamp: new Date()
        });
        setCurrentProductiveMs(0);
        setSessionStartTime(0);
        setIsPaused(false);
      } else if (timerBehavior.distractingAction === 'pause') {
        setIsPaused(true);
      }
      // ignore: do nothing
    }

    // Handle returning to productive (resume if was paused)
    if (currentTier === 'productive') {
      if (isPaused) {
        setIsPaused(false);
      }
      if (sessionStartTime === 0) {
        setSessionStartTime(Date.now());
      }

      const interval = setInterval(() => {
        setCurrentProductiveMs(prev => prev + 1000);
      }, 1000);

      setLastTier(currentTier);
      return () => clearInterval(interval);
    } else {
      // Stop counting if not productive (but don't reset - handled above)
      setLastTier(currentTier);
    }
  }, [currentApp, lastTier, sessionStartTime, isPaused, timerBehavior]);

  // External activity manual stopwatch
  useEffect(() => {
    if (!externalSessionRunning || !externalSessionStart) return;

    const interval = setInterval(() => {
      const now = new Date();
      setExternalElapsedMs(now.getTime() - externalSessionStart.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [externalSessionRunning, externalSessionStart]);

  const handleSelectExternalActivity = useCallback((activity: ExternalActivity) => {
    setSelectedExternalActivity(activity);
  }, []);

  const handleStartExternalSession = useCallback(() => {
    if (!selectedExternalActivity) return;
    setExternalSessionStart(new Date());
    setExternalSessionRunning(true);
    setExternalElapsedMs(0);
  }, [selectedExternalActivity]);

  const handleStopExternalSession = useCallback(() => {
    setExternalSessionRunning(false);
    setExternalSessionStart(null);
    setExternalElapsedMs(0);
  }, []);

  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return '#1f2937';
    if (hours < 1) return '#059669';
    if (hours < 2) return '#0d9488';
    if (hours < 4) return '#10b981';
    if (hours < 6) return '#10b981';
    return '#34d399';
  };

  // Compute real heatmap data from allLogs (last 7 days)
  const computedHeatmap = useMemo(() => {
    const today = new Date();
    const days: Record<string, number> = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      days[dayName] = 0;
    }
    
    // Sum productive time for each day
    allLogs.forEach(log => {
      if (!log.timestamp) return;
      const logDate = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      const dayName = dayNames[logDate.getDay()];
      
      // Only count productive categories
      const isProductive = DEFAULT_TIER_ASSIGNMENTS.productive.includes(log.category);
      if (isProductive) {
        days[dayName] += log.duration / (1000 * 60 * 60); // Convert ms to hours
      }
    });
    
    // Return as array in order
    return dayNames.map(day => ({ day, hours: days[day] || 0 }));
  }, [allLogs]);

  const defaultHeatmap = useMemo(() => [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 4.2 },
    { day: 'Wed', hours: 3.8 },
    { day: 'Thu', hours: 5.1 },
    { day: 'Fri', hours: 2.0 },
    { day: 'Sat', hours: 1.5 },
    { day: 'Sun', hours: 3.2 },
  ], []);

  const heatmapData = hourlyHeatmap.length > 0 ? hourlyHeatmap : (allLogs.length > 0 ? computedHeatmap : defaultHeatmap);
  const maxHours = Math.max(...heatmapData.map(d => d.hours), 8);

  // Compute real solar system data from allLogs (top apps by usage)
  const computedSolarData = useMemo(() => {
    const appUsage: Record<string, number> = {};
    
    allLogs.forEach(log => {
      if (!appUsage[log.app]) {
        appUsage[log.app] = 0;
      }
      appUsage[log.app] += log.duration || 0;
    });
    
    // Sort by usage and take top 5
    return Object.entries(appUsage)
      .map(([name, usage_ms]) => ({ name, usage_ms, category: 'Tool' }))
      .sort((a, b) => b.usage_ms - a.usage_ms)
      .slice(0, 5);
  }, [allLogs]);

  const defaultSolarData: SolarSystemData[] = [
    { name: 'VS Code', usage_ms: 7200000, category: 'Tools' },
    { name: 'Chrome', usage_ms: 3600000, category: 'Browser' },
    { name: 'Antigravity', usage_ms: 1800000, category: 'IDE' },
  ];
  const solar = solarSystemData.length > 0 ? solarSystemData : (allLogs.length > 0 ? computedSolarData : defaultSolarData);
  const maxUsage = Math.max(...solar.map(d => d.usage_ms), 1);

  const isCurrentlyProductive = lastTier === 'productive' && !isPaused;

  // Compute stats based on selected period
  const stats = useMemo(() => {
    const now = new Date();
    let filteredLogs = allLogs;

    if (selectedPeriod === 'today') {
      filteredLogs = allLogs.filter(log =>
        log.timestamp.getDate() === now.getDate() &&
        log.timestamp.getMonth() === now.getMonth() &&
        log.timestamp.getFullYear() === now.getFullYear()
      );
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = allLogs.filter(log => log.timestamp >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = allLogs.filter(log => log.timestamp >= monthAgo);
    }

    // Total time
    const totalTimeMs = filteredLogs.reduce((acc, log) => acc + (log.duration * 1000), 0);

    // Productive time
    const productiveTimeMs = filteredLogs
      .filter(log => DEFAULT_TIER_ASSIGNMENTS.productive.includes(log.category))
      .reduce((acc, log) => acc + (log.duration * 1000), 0);

    // Percentage
    const productivePercent = totalTimeMs > 0 ? Math.round((productiveTimeMs / totalTimeMs) * 100) : 0;

    // Longest focus session
    let longestFocusMs = 0;
    let currentFocusMs = 0;
    let inProductive = false;
    const sortedLogs = [...filteredLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (const log of sortedLogs) {
      if (DEFAULT_TIER_ASSIGNMENTS.productive.includes(log.category)) {
        currentFocusMs += log.duration * 1000;
        inProductive = true;
      } else {
        if (currentFocusMs > longestFocusMs) longestFocusMs = currentFocusMs;
        currentFocusMs = 0;
        inProductive = false;
      }
    }
    if (currentFocusMs > longestFocusMs) longestFocusMs = currentFocusMs;

    // Format helpers
    const formatHours = (ms: number) => {
      const hours = ms / (1000 * 60 * 60);
      return hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(ms / (1000 * 60))}m`;
    };

    return {
      totalTime: formatHours(totalTimeMs),
      totalTimeMs,
      productiveTime: formatHours(productiveTimeMs),
      productiveTimeMs,
      productivePercent,
      longestFocus: formatHours(longestFocusMs)
    };
  }, [allLogs, selectedPeriod]);

  return (
    <div className="min-h-screen bg-black text-white" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Background grid effect */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Focus className="w-8 h-8 text-emerald-400" />
                <h1 className="text-4xl font-bold tracking-tight">Lock-In</h1>
              </div>
              <div className="text-sm text-zinc-500">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </motion.div>

          {/* Main Timer Section - HERO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <div 
              className="rounded-2xl p-12 border backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(10, 10, 10, 0.8)',
                borderColor: isCurrentlyProductive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)',
                boxShadow: isCurrentlyProductive ? '0 0 20px rgba(16, 185, 129, 0.1)' : 'none'
              }}
            >
              <div className="text-center space-y-6">
                {/* Status indicator */}
                <motion.div
                  animate={{ opacity: isCurrentlyProductive ? [1, 0.7, 1] : 1 }}
                  transition={{ duration: 2, repeat: isCurrentlyProductive ? Infinity : 0 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: isCurrentlyProductive ? '#10b981' : '#6b7280' }}
                  />
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    {isPaused ? '⏸ Paused' : isCurrentlyProductive ? '🔒 Locked In' : '⏸ Idle'}
                  </span>
                </motion.div>

                {/* Giant Timer */}
                <motion.div
                  key={currentProductiveMs}
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-mono font-bold"
                  style={{
                    fontSize: '120px',
                    lineHeight: '1',
                    color: isCurrentlyProductive ? '#10b981' : '#9ca3af',
                    textShadow: isCurrentlyProductive ? '0 0 30px rgba(16, 185, 129, 0.3)' : 'none',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {formatDuration(currentProductiveMs)}
                </motion.div>

                {/* Current activity */}
                {currentApp && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                  >
                    <div className="text-zinc-400 text-sm uppercase tracking-wider">Currently tracking</div>
                    <div className="flex items-center justify-center gap-2">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-mono font-semibold"
                        style={{
                          backgroundColor: isCurrentlyProductive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                          color: isCurrentlyProductive ? '#34d399' : '#d1d5db'
                        }}
                      >
                        {currentApp.category || 'Unknown'}
                      </span>
                    </div>
                    <div className="text-lg font-medium text-white">
                      {currentApp.app || currentApp.title || 'Unknown'}
                    </div>
                  </motion.div>
                )}

                {/* Helpful message */}
                <div className="text-xs text-zinc-600 pt-4 border-t border-zinc-800">
                  {isCurrentlyProductive 
                    ? 'Productive work detected. Timer running.'
                    : 'No productive activity detected. Open an IDE, editor, or learning tool to start.'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
          >
            {/* Productive Time */}
            <div className="rounded-xl p-4 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Productive</div>
              <div className="text-2xl font-bold text-emerald-400">{stats.productiveTime}</div>
            </div>

            {/* Total Time */}
            <div className="rounded-xl p-4 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', borderColor: 'rgba(107, 114, 128, 0.2)' }}>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{stats.totalTime}</div>
            </div>

            {/* % Productive */}
            <div className="rounded-xl p-4 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', borderColor: 'rgba(107, 114, 128, 0.2)' }}>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">% Productive</div>
              <div className="text-2xl font-bold text-white">{stats.productivePercent}%</div>
            </div>

            {/* Longest Focus */}
            <div className="rounded-xl p-4 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', borderColor: 'rgba(107, 114, 128, 0.2)' }}>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Longest Focus</div>
              <div className="text-2xl font-bold text-white">{stats.longestFocus}</div>
            </div>

            {/* Reset Count */}
            <div className="rounded-xl p-4 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Resets Today</div>
              <div className="text-2xl font-bold text-red-400">{resetCount}</div>
            </div>

            {/* External Time */}
            <div className="rounded-xl p-4 border backdrop-blur-sm" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', borderColor: 'rgba(107, 114, 128, 0.2)' }}>
              <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">External</div>
              <div className="text-2xl font-bold text-white">
                {formatDuration(externalElapsedMs).substring(0, 5)}
              </div>
            </div>
          </motion.div>

          {/* Pinned Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-8 border backdrop-blur-sm mb-12"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              borderColor: 'rgba(107, 114, 128, 0.2)'
            }}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Pinned Activities</h2>
                  <p className="text-xs text-zinc-600 mt-1">Quick manual tracking</p>
                </div>
                <button
                  onClick={() => setPinnedActivitiesEditMode(!pinnedActivitiesEditMode)}
                  className="p-2 rounded-lg border transition-all"
                  style={{
                    backgroundColor: pinnedActivitiesEditMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(107, 114, 128, 0.1)',
                    borderColor: pinnedActivitiesEditMode ? 'rgba(16, 185, 129, 0.5)' : 'rgba(107, 114, 128, 0.2)'
                  }}
                >
                  {pinnedActivitiesEditMode ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Edit3 className="w-4 h-4 text-zinc-400" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {pinnedActivities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.icon] || Timer;
                  const isSelected = selectedExternalActivity?.id === activity.id;
                  
                  return (
                    <motion.div key={activity.id} className="relative">
                      <motion.button
                        onClick={() => {
                          if (pinnedActivitiesEditMode) {
                            setPinnedActivities(prev => prev.filter(a => a.id !== activity.id));
                          } else {
                            handleSelectExternalActivity(activity);
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full p-4 rounded-lg border transition-all text-center"
                        style={{
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.1)',
                          borderColor: isSelected ? 'rgba(16, 185, 129, 0.5)' : 'rgba(107, 114, 128, 0.2)'
                        }}
                      >
                        <Icon 
                          className="w-6 h-6 mx-auto mb-2" 
                          style={{ color: activity.is_productive ? '#10b981' : '#6366f1' }}
                        />
                        <div className="text-xs font-semibold text-white">{activity.name}</div>
                      </motion.button>
                      {pinnedActivitiesEditMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinnedActivities(prev => prev.filter(a => a.id !== activity.id));
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3 text-white" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
                
                {/* Add activity button in edit mode */}
                {pinnedActivitiesEditMode && pinnedActivities.length < 6 && (
                  <motion.div className="relative">
                    <motion.button
                      onClick={() => {
                        const availableActivities = activities.filter(a => !pinnedActivities.find(p => p.id === a.id));
                        if (availableActivities.length > 0) {
                          setPinnedActivities(prev => [...prev, availableActivities[0]]);
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full p-4 rounded-lg border border-dashed transition-all text-center"
                      style={{
                        backgroundColor: 'rgba(107, 114, 128, 0.05)',
                        borderColor: 'rgba(107, 114, 128, 0.3)'
                      }}
                    >
                      <Plus className="w-6 h-6 mx-auto mb-2 text-zinc-500" />
                      <div className="text-xs font-semibold text-zinc-500">Add</div>
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {/* External Activity Controls */}
              {selectedExternalActivity && !pinnedActivitiesEditMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-lg border"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderColor: 'rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{selectedExternalActivity.name}</div>
                      {externalSessionRunning && (
                        <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">
                          {formatDuration(externalElapsedMs)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleStartExternalSession}
                        disabled={externalSessionRunning}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: externalSessionRunning ? 'rgba(107, 114, 128, 0.2)' : 'rgba(16, 185, 129, 0.3)',
                          color: externalSessionRunning ? '#6b7280' : '#10b981',
                          border: `1px solid ${externalSessionRunning ? 'rgba(107, 114, 128, 0.2)' : 'rgba(16, 185, 129, 0.5)'}`
                        }}
                      >
                        {externalSessionRunning ? 'Running...' : 'Start'}
                      </button>
                      <button
                        onClick={handleStopExternalSession}
                        disabled={!externalSessionRunning}
                        className="flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
                        style={{
                          backgroundColor: externalSessionRunning ? 'rgba(239, 68, 68, 0.3)' : 'rgba(107, 114, 128, 0.2)',
                          color: externalSessionRunning ? '#ef4444' : '#6b7280',
                          border: `1px solid ${externalSessionRunning ? 'rgba(239, 68, 68, 0.5)' : 'rgba(107, 114, 128, 0.2)'}`
                        }}
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

           {/* Two-Column Stats Section */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
             {/* Weekly Heatmap */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               onClick={() => setExpandedModal('heatmap')}
               className="rounded-2xl p-8 border backdrop-blur-sm cursor-pointer hover:border-zinc-500 transition-colors"
               style={{
                 backgroundColor: 'rgba(10, 10, 10, 0.8)',
                 borderColor: 'rgba(107, 114, 128, 0.2)'
               }}
             >
               <div className="space-y-4">
                 <div>
                   <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Weekly Productivity</h2>
                   <p className="text-xs text-zinc-600 mt-1">Hours locked in, last 7 days (click to expand)</p>
                 </div>
                 <div className="flex items-end justify-between gap-1 h-40">
                  {heatmapData.map((day, i) => {
                    const height = (day.hours / maxHours) * 100;
                    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                    const isToday = day.day === todayName;
                    
                    return (
                      <div key={day.day} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="flex-1 w-full flex items-end">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(height, 8)}%` }}
                            transition={{ delay: i * 0.08, duration: 0.5 }}
                            className="w-full rounded-t-sm hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: getHeatmapColor(day.hours) }}
                          />
                        </div>
                        <div className={`text-xs font-mono font-semibold ${isToday ? 'text-emerald-400' : 'text-zinc-600'}`}>
                          {day.day}
                        </div>
                        <div className="text-xs text-zinc-700 group-hover:text-zinc-500 transition-colors">
                          {day.hours.toFixed(1)}h
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

             {/* App Usage Solar System */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               onClick={() => setExpandedModal('solar')}
               className="rounded-2xl p-8 border backdrop-blur-sm cursor-pointer hover:border-zinc-500 transition-colors"
               style={{
                 backgroundColor: 'rgba(10, 10, 10, 0.8)',
                 borderColor: 'rgba(107, 114, 128, 0.2)'
               }}
             >
               <div className="space-y-4">
                 <div>
                   <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">App Ecosystem</h2>
                   <p className="text-xs text-zinc-600 mt-1">Your top tools in orbit (click to expand)</p>
                 </div>
                 <div className="relative h-48 flex items-center justify-center">
                  <div className="absolute w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center">
                    <Sun className="w-6 h-6 text-zinc-600" />
                  </div>
                  
                  {solar.slice(0, 5).map((app, i) => {
                    const size = 28 + (app.usage_ms / maxUsage) * 48;
                    const angle = (i * 360) / Math.min(solar.length, 5);
                    const radius = 50 + (i % 2) * 25;
                    const rad = (angle * Math.PI) / 180;
                    const x = Math.cos(rad) * radius;
                    const y = Math.sin(rad) * radius;
                    
                    return (
                      <motion.div
                        key={app.name}
                        initial={{ scale: 0, x: 0, y: 0 }}
                        animate={{ scale: 1, x, y }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="absolute rounded-full border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 hover:border-zinc-600 transition-colors"
                        style={{ 
                          width: size, 
                          height: size,
                          backgroundColor: 'rgba(24, 24, 27, 0.8)',
                          cursor: 'pointer'
                        }}
                        title={`${app.name}: ${Math.round((app.usage_ms / 1000 / 3600) * 10) / 10}h`}
                      >
                        {app.name.substring(0, 2)}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>

{/* Expanded Heatmap Modal */}
           <AnimatePresence>
             {expandedModal === 'heatmap' && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 onClick={() => setExpandedModal(null)}
               >
                 <motion.div
                   initial={{ scale: 0.95, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.95, opacity: 0 }}
                   className="rounded-2xl p-8 border max-w-2xl w-full max-h-[80vh] overflow-auto"
                   style={{
                     backgroundColor: 'rgba(10, 10, 10, 0.95)',
                     borderColor: 'rgba(107, 114, 128, 0.2)'
                   }}
                   onClick={(e) => e.stopPropagation()}
                 >
<div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-200">Weekly Productivity</h2>
                        <p className="text-xs text-zinc-600 mt-1">Hours locked in, last 7 days</p>
                      </div>
                      <button
                        onClick={() => setExpandedModal(null)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-zinc-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-end justify-between gap-2 h-80">
                      {heatmapData.map((day, i) => {
                        const height = (day.hours / maxHours) * 100;
                        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                        const isToday = day.day === todayName;
                        
                        return (
                          <div key={day.day} className="flex-1 flex flex-col items-center gap-3 group">
                            <div className="flex-1 w-full flex items-end">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(height, 8)}%` }}
                                transition={{ delay: i * 0.08, duration: 0.5 }}
                                className="w-full rounded-t-sm hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: getHeatmapColor(day.hours) }}
                              />
                            </div>
                            <div className={`text-sm font-mono font-semibold ${isToday ? 'text-emerald-400' : 'text-zinc-600'}`}>
                              {day.day}
                            </div>
                            <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">
                              {day.hours.toFixed(1)}h
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </motion.div>
               </motion.div>
             )}
           </AnimatePresence>

{/* Expanded Solar System Modal */}
           <AnimatePresence>
             {expandedModal === 'solar' && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 onClick={() => setExpandedModal(null)}
               >
                 <motion.div
                   initial={{ scale: 0.95, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   exit={{ scale: 0.95, opacity: 0 }}
                   className="rounded-2xl p-8 border max-w-2xl w-full max-h-[80vh] overflow-auto"
                   style={{
                     backgroundColor: 'rgba(10, 10, 10, 0.95)',
                     borderColor: 'rgba(107, 114, 128, 0.2)'
                   }}
                   onClick={(e) => e.stopPropagation()}
                 >
                   <div className="flex items-center justify-between mb-6">
                     <div>
                       <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-200">App Ecosystem</h2>
                       <p className="text-xs text-zinc-600 mt-1">Your top tools in orbit</p>
                     </div>
                     <button
                       onClick={() => setExpandedModal(null)}
                       className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                     >
                       <X className="w-5 h-5 text-zinc-400" />
                     </button>
                   </div>
                   
{/* Replace simplified solar system with full OrbitSystem */}
                    <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><div className="text-zinc-400">Loading 3D visualization...</div></div>}>
                      <OrbitSystem 
                        logs={allLogs} 
                        websiteLogs={browserLogs}
                        appColors={appColors}
                        categoryOverrides={categoryOverrides}
                      />
</Suspense>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6 border backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              borderColor: 'rgba(107, 114, 128, 0.2)'
            }}
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Activity Feed</h2>
                <p className="text-xs text-zinc-600 mt-1">Recent activity changes</p>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activityFeed.length === 0 ? (
                  <div className="text-xs text-zinc-500 text-center py-4">
                    No activity recorded yet
                  </div>
                ) : (
                  [...activityFeed].reverse().slice(0, 15).map((item) => {
                    const tierColor = item.tier === 'productive' ? '#10b981' : item.tier === 'distracting' ? '#ef4444' : '#6b7280';
                    const tierIcon = item.tier === 'productive' ? '✓' : item.tier === 'distracting' ? '✗' : '○';
                    
                    return (
                      <div key={item.id} className="flex items-center gap-3 text-xs">
                        <div className="w-16 text-zinc-500 font-mono">
                          {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                          style={{ backgroundColor: tierColor }}
                        >
                          <span className="text-white">{tierIcon}</span>
                        </div>
                        <div className="flex-1 truncate text-zinc-300">
                          {item.name}
                        </div>
                        <div className="text-zinc-500">
                          {item.category}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-6 border backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              borderColor: 'rgba(107, 114, 128, 0.2)'
            }}
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Recent Sessions</h2>
                <p className="text-xs text-zinc-600 mt-1">Apps and websites</p>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(() => {
                  const WEBSITE_CATEGORY_MAP: Record<string, string> = {
                    'Developer Tools': 'Tools',
                    'AI Tools': 'AI Tools',
                    'Social Media': 'Social Media',
                    'Entertainment': 'Entertainment',
                    'News': 'News',
                    'Shopping': 'Shopping',
                    'Productivity': 'Productivity',
                    'Design': 'Design',
                    'Search Engine': 'Productivity',
                    'Communication': 'Communication',
                    'Education': 'Education',
                    'Uncategorized': 'Uncategorized',
                    'Other': 'Other'
                  };

                  const getTier = (category: string): 'productive' | 'neutral' | 'distracting' => {
                    if (tierAssignments.productive.includes(category)) return 'productive';
                    if (tierAssignments.distracting.includes(category)) return 'distracting';
                    return 'neutral';
                  };

                  const formatDur = (seconds: number): string => {
                    if (seconds < 60) return `${Math.round(seconds)}s`;
                    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
                    const h = Math.floor(seconds / 3600);
                    const m = Math.floor((seconds % 3600) / 60);
                    return m > 0 ? `${h}h ${m}m` : `${h}h`;
                  };

                  const appSessions = (logs as any[] || []).map(log => ({
                    type: 'app' as const,
                    name: log.app || 'Unknown',
                    category: log.category || 'Other',
                    duration: log.duration || 0,
                    timestamp: new Date(log.timestamp || Date.now()),
                    tier: getTier(log.category)
                  }));

                  const websiteSessions = (browserLogs as any[] || []).map(log => ({
                    type: 'website' as const,
                    name: log.domain || 'Unknown',
                    category: WEBSITE_CATEGORY_MAP[log.category] || 'Other',
                    duration: log.duration || 0,
                    timestamp: new Date(log.start_time || Date.now()),
                    tier: getTier(WEBSITE_CATEGORY_MAP[log.category] || log.category)
                  }));

                  return [...appSessions, ...websiteSessions]
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .slice(0, 15);
                })().length === 0 ? (
                  <div className="text-xs text-zinc-500 text-center py-4">
                    No sessions tracked yet
                  </div>
                ) : (
                  [...(() => {
                    const WEBSITE_CATEGORY_MAP: Record<string, string> = {
                      'Developer Tools': 'Tools', 'AI Tools': 'AI Tools',
                      'Social Media': 'Social Media', 'Entertainment': 'Entertainment',
                      'News': 'News', 'Shopping': 'Shopping', 'Productivity': 'Productivity',
                      'Design': 'Design', 'Search Engine': 'Productivity',
                      'Communication': 'Communication', 'Education': 'Education',
                      'Uncategorized': 'Uncategorized', 'Other': 'Other'
                    };
                    const getTier = (category: string) => {
                      if (tierAssignments.productive.includes(category)) return 'productive';
                      if (tierAssignments.distracting.includes(category)) return 'distracting';
                      return 'neutral';
                    };
                    const formatDur = (seconds: number): string => {
                      if (seconds < 60) return `${Math.round(seconds)}s`;
                      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
                      const h = Math.floor(seconds / 3600);
                      const m = Math.floor((seconds % 3600) / 60);
                      return m > 0 ? `${h}h ${m}m` : `${h}h`;
                    };
                    const appS = (logs as any[] || []).map(log => ({
                      type: 'app' as const, name: log.app || 'Unknown',
                      category: log.category || 'Other', duration: log.duration || 0,
                      timestamp: new Date(log.timestamp || Date.now()),
                      tier: getTier(log.category)
                    }));
                    const webS = (browserLogs as any[] || []).map(log => ({
                      type: 'website' as const, name: log.domain || 'Unknown',
                      category: WEBSITE_CATEGORY_MAP[log.category] || 'Other',
                      duration: log.duration || 0,
                      timestamp: new Date(log.start_time || Date.now()),
                      tier: getTier(WEBSITE_CATEGORY_MAP[log.category] || log.category)
                    }));
                    return [...appS, ...webS].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
                  })()].map((session, idx) => {
                    const tierColor = session.tier === 'productive' ? '#10b981' : 
                                     session.tier === 'distracting' ? '#ef4444' : '#6b7280';
                    const tierLabel = session.tier === 'productive' ? 'P' : 
                                    session.tier === 'distracting' ? 'D' : 'N';
                    const formatDur = (seconds: number): string => {
                      if (seconds < 60) return `${Math.round(seconds)}s`;
                      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
                      const h = Math.floor(seconds / 3600);
                      const m = Math.floor((seconds % 3600) / 60);
                      return m > 0 ? `${h}h ${m}m` : `${h}h`;
                    };
                    
                    return (
                      <div key={idx} className="flex items-center gap-3 text-xs py-1.5 border-b border-zinc-800 last:border-0">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: tierColor }}>
                          {tierLabel}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-zinc-300 truncate font-medium">{session.name}</div>
                          <div className="text-zinc-600 text-xs">{session.category}</div>
                        </div>
                        <div className="text-zinc-400 font-mono text-right">
                          {formatDur(session.duration)}
                        </div>
                        <div className="text-zinc-600 text-xs">
                          {session.type === 'app' ? 'App' : 'Web'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}