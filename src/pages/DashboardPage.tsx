import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Dumbbell, Activity, Moon,
  Utensils, Coffee, Bus, Book, Timer, Zap,
  Sun, Zap as ZapIcon, Focus, Clock, X,
  Edit3, Check, Plus, Minus, TrendingUp,
  Target, ZapCircle, RefreshCw, Clock3,
  ChevronLeft, ChevronRight, Maximize2, Minimize2
} from 'lucide-react';

const OrbitSystem = lazy(() => import('../components/OrbitSystem').then(module => ({ default: module.default })));

interface HeatmapCell {
  hour: number;
  day: number;
  value: number;
  productivity: number;
}

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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  startTime: number; // When this session started tracking
  type: 'app' | 'browser';
  name: string;
  category: string;
  tier: 'productive' | 'neutral' | 'distracting';
  isActive?: boolean; // Currently active session
  duration?: number; // Time spent in SECONDS (for completed sessions)
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
  trackerAppMode?: 'show-other' | 'pause' | 'track';
  tierAssignments?: {
    productive: string[];
    neutral: string[];
    distracting: string[];
  };
  // Timer state from parent (persisted at App level)
  timerState?: {
    productiveMs: number;
    startTime: number;
    paused: boolean;
    lastTier: string | null;
    externalRunning: boolean;
    externalStart: number | null;
    externalElapsed: number;
};
  onTimerStateChange?: (state: any) => void;
  // Activity feed from parent (use different name to avoid conflict)
  activityFeed?: any[];
  onActivityFeedChange?: (items: any[]) => void;
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
  timerBehavior = { neutralAction: 'ignore', distractingAction: 'ignore' },
  selectedPeriod = 'week',
  trackingBrowser = '',
  trackerAppMode = 'track',
  tierAssignments = { productive: ['IDE', 'AI Tools', 'Education', 'Productivity', 'Tools'], neutral: ['Browser', 'Communication', 'Design', 'News', 'Uncategorized', 'Other'], distracting: ['Entertainment', 'Social Media', 'Shopping'] },
  timerState = null,
  onTimerStateChange,
  activityFeed: feedFromParent = [],
  onActivityFeedChange
}: DashboardPageProps) {
  const getPersistedTimerState = () => {
    // Try parent state first - only if it has meaningful data
    if (timerState && typeof timerState === 'object' && (timerState as any).externalRunning === true) {
      return timerState;
    }
    // Fallback to localStorage - check for meaningful data
    if (typeof window === 'undefined') return { productiveMs: 0, startTime: 0, paused: false, lastTier: null, externalRunning: false, externalStart: null, externalElapsed: 0, selectedExternalActivity: null };
    try {
      const saved = localStorage.getItem('deskflow-timer-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only use localStorage if there's meaningful data
        if (parsed.externalRunning || parsed.externalElapsed > 0 || parsed.selectedExternalActivity) {
          return parsed;
        }
      }
    } catch (e) {}
    return { productiveMs: 0, startTime: 0, paused: false, lastTier: null, externalRunning: false, externalStart: null, externalElapsed: 0, selectedExternalActivity: null };
  };
  const persistedTimer = getPersistedTimerState();

  const [selectedExternalActivity, setSelectedExternalActivity] = useState<ExternalActivity | null>(() => {
    // Restore from persisted state if external session was running
    const saved = persistedTimer.selectedExternalActivity as { id: number; name: string } | null;
    if (persistedTimer.externalRunning && saved) {
      return { id: saved.id, name: saved.name, category: 'External' };
    }
    return null;
  });

  const [currentProductiveMs, setCurrentProductiveMs] = useState(persistedTimer.productiveMs);
  const [sessionStartTime, setSessionStartTime] = useState<number>(persistedTimer.startTime);
  const [isPaused, setIsPaused] = useState(persistedTimer.paused);
  const [lastTier, setLastTier] = useState<'productive' | 'neutral' | 'distracting' | null>(persistedTimer.lastTier);
  
// Persist external stopwatch too
  const [externalSessionRunning, setExternalSessionRunning] = useState(persistedTimer.externalRunning);
  const [externalSessionStart, setExternalSessionStart] = useState<Date | null>(persistedTimer.externalStart ? new Date(persistedTimer.externalStart) : null);
  const [externalElapsedMs, setExternalElapsedMs] = useState(persistedTimer.externalElapsed);
  const [externalTrackingMode, setExternalTrackingMode] = useState<'immediate' | 'interaction'>('immediate');
const [pinnedActivitiesEditMode, setPinnedActivitiesEditMode] = useState(false);
  const [pinnedActivities, setPinnedActivities] = useState<ExternalActivity[]>([]);
  const [pinnedActivitiesExpanded, setPinnedActivitiesExpanded] = useState(true);
  const [pausedByTrackerApp, setPausedByTrackerApp] = useState(false);
  // Load persisted activity feed from localStorage
const getPersistedActivityFeed = (): ActivityFeedItem[] => {
    // Try parent activityFeed first
if (feedFromParent && feedFromParent.length > 0) {
      return feedFromParent.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    }
    // Fallback to localStorage
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('deskflow-activity-feed');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (e) {}
    return [];
};
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>(getPersistedActivityFeed());
  const activityFeedRef = useRef<ActivityFeedItem[]>(getPersistedActivityFeed());
  
  // Reset pausedByTrackerApp when mode changes from 'pause' to something else
  useEffect(() => {
    if (trackerAppMode !== 'pause' && pausedByTrackerApp) {
      setPausedByTrackerApp(false);
    }
  }, [trackerAppMode, pausedByTrackerApp]);
  
  // Initialize activity feed from allLogs if localStorage is empty
  useEffect(() => {
    if (activityFeed.length === 0 && allLogs && allLogs.length > 0) {
      // Convert recent logs to activity feed items (most recent first, limit to 20)
      // Include both app logs and browser logs for complete history
      const recentLogs = [...allLogs]
        .slice(0, 20)
        .reverse();
      
      const feedItems: ActivityFeedItem[] = recentLogs.map((log: any, idx) => {
        const timestamp = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
        const tsMs = timestamp.getTime();
        const isBrowserType = log.is_browser_tracking || log.domain; // browser logs have domain or flag
        
        // Handle both duration (seconds) and duration_ms (milliseconds)
        let durationSec = 0;
        if (log.duration_ms) {
          durationSec = Math.floor(log.duration_ms / 1000);
        } else if (log.duration) {
          durationSec = log.duration; // already in seconds
        }
        
        return {
          id: `init-${idx}-${Date.now()}`,
          timestamp,
          startTime: tsMs,
          type: isBrowserType ? 'browser' as const : 'app' as const,
          name: log.app || log.title || log.domain || 'Unknown',
          category: log.category || 'Unknown',
          tier: getTierFromCategory(log.category),
          isActive: idx === recentLogs.length - 1, // Only most recent is active
          duration: durationSec // Use duration from log if available
        };
      });
      
      if (feedItems.length > 0) {
        activityFeedRef.current = feedItems;
        setActivityFeed(feedItems);
      }
    }
  }, [allLogs, activityFeed.length]);
  
  // Persist activity feed to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('deskflow-activity-feed', JSON.stringify(activityFeed));
  }, [activityFeed]);
  
  // Persist timer state to parent and localStorage
  useEffect(() => {
    const newState = {
      productiveMs: currentProductiveMs,
      startTime: sessionStartTime,
      paused: isPaused,
      lastTier: lastTier,
      externalRunning: externalSessionRunning,
      externalStart: externalSessionStart?.getTime() || null,
      externalElapsed: externalElapsedMs,
      selectedExternalActivity: selectedExternalActivity ? { id: selectedExternalActivity.id, name: selectedExternalActivity.name } : null
    };
    // Update parent state
    if (onTimerStateChange) {
      onTimerStateChange(newState);
    }
    // Also persist to localStorage as backup
    if (typeof window === 'undefined') return;
    localStorage.setItem('deskflow-timer-state', JSON.stringify(newState));
  }, [currentProductiveMs, sessionStartTime, isPaused, lastTier, externalSessionRunning, externalSessionStart, externalElapsedMs, selectedExternalActivity, onTimerStateChange]);
  
  const [resetCount, setResetCount] = useState(0);
  const [currentApp, setCurrentApp] = useState<ForegroundData | null>(null);
  const [isInBrowser, setIsInBrowser] = useState(false); // Track if currently in tracking browser
  const [lastNonBrowserApp, setLastNonBrowserApp] = useState<ForegroundData | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number; value: number; productivity: number } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedModal, setExpandedModal] = useState<'heatmap' | 'solar' | null>(null);
  const [solarFullscreen, setSolarFullscreen] = useState(false);
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
    if (!window.deskflowAPI?.onForegroundChange) {
      console.log('[Dashboard] No onForegroundChange API');
      return;
    }

    console.log('[Dashboard] Listening for foreground changes, trackingBrowser:', trackingBrowser);
    
window.deskflowAPI.onForegroundChange((data: ForegroundData) => {
      console.log('[Dashboard] Foreground change:', data.app, 'category:', data.category);
      
      // Check if this is EXACTLY the tracking browser
      const isTrackingBrowser = trackingBrowser && data.app && 
        data.app.toLowerCase() === trackingBrowser.toLowerCase();
      
      console.log('[Dashboard] isTrackingBrowser:', isTrackingBrowser, 'trackingBrowser:', trackingBrowser);
      
      // Check if this is Tracker app (DeskFlow/Electron)
      const isTrackerApp = data.app && (
        data.app.toLowerCase().includes('deskflow') ||
        data.app.toLowerCase().includes('electron')
      );
      
      // If tracking browser - set isInBrowser, DON'T track app
      if (isTrackingBrowser) {
        console.log('[Dashboard] In tracking browser - waiting for website events');
        setIsInBrowser(true);
        return;
      }
      
      // NOT in tracking browser
      console.log('[Dashboard] Not in tracking browser - tracking app:', data.app);
      setIsInBrowser(false);
      setCurrentWebsite(null); // Clear website immediately
      
      // Handle DeskFlow app based on trackerAppMode
      if (isTrackerApp) {
        if (trackerAppMode === 'show-other') {
          if (lastNonBrowserApp) setCurrentApp(lastNonBrowserApp);
          return;
        } else if (trackerAppMode === 'pause') {
          setCurrentApp(lastNonBrowserApp || null);
          setIsPaused(true);
          setPausedByTrackerApp(true);
          return;
        }
        // 'track' mode falls through
      }
      
      // Track regular apps - update currentApp
      setLastNonBrowserApp(data);
      setCurrentApp(data);
      
      // Track in activity feed
      const lastItem = activityFeedRef.current[activityFeedRef.current.length - 1];
      const newAppName = data.app || data.title || 'Unknown';
      
      if (lastItem && lastItem.type === 'app' && lastItem.name === newAppName) {
        return;
      }

      const tier = getTierFromCategory(data.category);
      const now = Date.now();
      const newItem: ActivityFeedItem = {
        id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(now),
        startTime: now,
        type: 'app',
        name: newAppName,
        category: data.category || 'Unknown',
        tier,
        isActive: true
      };
      activityFeedRef.current = activityFeedRef.current.map((item) => {
        if (item.isActive) {
          const durationMs = now - item.startTime;
          return { ...item, isActive: false, duration: Math.floor(durationMs / 1000) };
        }
        return item;
      });
      activityFeedRef.current = [...activityFeedRef.current.slice(-9), newItem];
      setActivityFeed([...activityFeedRef.current]);
    });
  }, [trackingBrowser, trackerAppMode, lastNonBrowserApp]);

  // Listen for browser tracking events (website changes)
  useEffect(() => {
    if (!window.deskflowAPI?.onBrowserTrackingEvent) {
      console.log('[Dashboard] No onBrowserTrackingEvent API');
      return;
    }

    console.log('[Dashboard] Listening for browser events, isInBrowser:', isInBrowser, 'trackingBrowser:', trackingBrowser);
    
window.deskflowAPI.onBrowserTrackingEvent((data: any) => {
      console.log('[Dashboard] Browser event:', data.type, 'domain:', data.domain, 'isInBrowser:', isInBrowser);
      
      if (data.type === 'browser-data' || data.type === 'live-log') {
        // Only track if we're in the tracking browser
        if (!isInBrowser || !trackingBrowser) {
          console.log('[Dashboard] Skipping - not in browser');
          return;
        }
        
        console.log('[Dashboard] Processing website:', data.domain);
        
        const websiteTier = getTierFromCategory(data.category || 'Uncategorized');
        
        setCurrentWebsite({
          title: data.title,
          url: data.url,
          category: data.category
        });

        const lastItem = activityFeedRef.current[activityFeedRef.current.length - 1];
        const newDomain = data.domain || data.title || 'Unknown';
        
        if (lastItem && lastItem.type === 'browser' && lastItem.name === newDomain) {
          return;
        }

        const now = Date.now();
        const newItem: ActivityFeedItem = {
          id: `${now}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(now),
          startTime: now,
          type: 'browser',
          name: newDomain,
          category: data.category || 'Uncategorized',
          tier: websiteTier,
          isActive: true
        };
        activityFeedRef.current = activityFeedRef.current.map((item) => {
          if (item.isActive) {
            const durationMs = now - item.startTime;
            return { ...item, isActive: false, duration: Math.floor(durationMs / 1000) };
          }
          return item;
        });
        activityFeedRef.current = [...activityFeedRef.current.slice(-9), newItem];
        setActivityFeed([...activityFeedRef.current]);
      }
    });
  }, [isInBrowser, trackingBrowser]);

  // Auto-counting timer logic for app/browser productivity
  useEffect(() => {
    // Get current category to check tier
    const currentCategory = isInBrowser 
      ? (currentWebsite?.category || lastNonBrowserApp?.category) 
      : currentApp?.category;
    const currentTier = getTierFromCategory(currentCategory);
    
    // Resume timer from persisted state if it was running
    // ONLY count if we have a start time, not paused, AND in productive tier
    if (sessionStartTime > 0 && !isPaused && currentTier === 'productive') {
      console.log('[Dashboard] Timer running (productive):', sessionStartTime, 'isPaused:', isPaused, 'tier:', currentTier);
      const interval = setInterval(() => {
        setCurrentProductiveMs(prev => prev + 1000);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      console.log('[Dashboard] Timer NOT running - tier:', currentTier, 'start:', sessionStartTime, 'paused:', isPaused);
    }
    
    // Only handle tier transitions if we have an app/website (no point otherwise)
    if (!currentApp && !currentWebsite && !lastNonBrowserApp) {
      console.log('[Dashboard] No active app/website');
      return;
    }
    
    // Handle distracting tier IMMEDIATELY - even without transition
    console.log('[Dashboard] currentTier:', currentTier, 'lastTier:', lastTier, 'category:', currentCategory);
    
    // Handle distracting tier IMMEDIATELY - even without transition
    // If current app is distracting and timerBehavior says reset, do it now
    if (currentTier === 'distracting' && timerBehavior?.distractingAction === 'reset') {
      console.log('[Dashboard] RESETTING - distracting app detected immediately');
      setCurrentProductiveMs(0);
      setSessionStartTime(0);
      setIsPaused(true); // PAUSE the timer, don't unpause it
      setLastTier(currentTier);
      return;
    }
    
    // Also handle if pausing
    if (currentTier === 'distracting' && timerBehavior?.distractingAction === 'pause') {
      console.log('[Dashboard] PAUSING - distracting app detected immediately');
      setIsPaused(true);
      setLastTier(currentTier);
      return;
    }
    
    // Handle tier transitions (from one tier to another)
    const tierTransition = lastTier && lastTier !== currentTier;
    
    console.log('[Dashboard] Tier check - lastTier:', lastTier, 'currentTier:', currentTier, 'tierTransition:', tierTransition);
    
    if (tierTransition) {
        // Determining action based on which tier we came FROM and where we're going
        let action: 'reset' | 'pause' | null = null;
        
        if (lastTier === 'productive') {
          // Transitioning FROM productive to something else - check action for the target tier
          if (currentTier === 'neutral' && timerBehavior?.neutralAction) {
            action = timerBehavior.neutralAction;
          } else if (currentTier === 'distracting' && timerBehavior?.distractingAction) {
            action = timerBehavior.distractingAction;
          }
        } else if (lastTier === 'neutral' && currentTier === 'distracting') {
          // Transitioning neutral -> distracting, always apply distracting action
          action = timerBehavior?.distractingAction || null;
        }
        
        console.log('[Dashboard] Tier transition detected, action:', action);
        
// Apply the action
        if (action === 'reset') {
          console.log('[Dashboard] RESETTING timer - distracting app detected');
          setCurrentProductiveMs(0);
          setSessionStartTime(0);
          setIsPaused(true); // Keep paused until productive again
        } else if (action === 'pause') {
          console.log('[Dashboard] PAUSING timer - distracting app detected');
          setIsPaused(true);
        }
      } else {
        console.log('[Dashboard] No tier transition - lastTier:', lastTier, 'currentTier:', currentTier);
      }

    // Handle returning to productive (always resume, unless paused by tracker app)
    if (currentTier === 'productive') {
      if (isPaused && !pausedByTrackerApp) {
        setIsPaused(false);
      }
      if (sessionStartTime === 0 && !pausedByTrackerApp) {
        setSessionStartTime(Date.now());
      }
      setLastTier(currentTier);
    } else if (currentTier === 'neutral' || currentTier === 'distracting') {
      // Stop counting if not productive - set tier for transition tracking
      setLastTier(currentTier);
    }
  }, [currentApp, currentWebsite, isInBrowser, lastTier, sessionStartTime, isPaused, timerBehavior, pausedByTrackerApp]);

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

  // Interaction detection for external activity
  useEffect(() => {
    if (!externalSessionRunning || externalTrackingMode !== 'interaction') return;
    
    let lastInteraction = Date.now();
    const checkIdle = setInterval(() => {
      const idleTime = Date.now() - lastInteraction;
      // If idle for more than 2 minutes, pause the timer
      if (idleTime > 120000) {
        setExternalSessionRunning(false);
      }
    }, 5000);
    
    const handleInteraction = () => {
      lastInteraction = Date.now();
      // Resume if was paused due to idle
      if (!externalSessionRunning && selectedExternalActivity) {
        setExternalSessionRunning(true);
      }
    };
    
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);
    
    return () => {
      clearInterval(checkIdle);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [externalSessionRunning, externalTrackingMode, selectedExternalActivity]);

  const handleStartExternalSession = useCallback(async () => {
    if (!selectedExternalActivity) return;
    
    // Save to database via IPC
    if (window.deskflowAPI?.startExternalSession) {
      try {
        const sessionId = await window.deskflowAPI.startExternalSession(selectedExternalActivity.id);
        console.log('[Dashboard] Started external session:', selectedExternalActivity.name, 'ID:', sessionId);
      } catch (err) {
        console.error('[Dashboard] Failed to start external session:', err);
      }
    }
    
    setExternalSessionStart(new Date());
    setExternalSessionRunning(true);
    setExternalElapsedMs(0);
  }, [selectedExternalActivity]);

  const handleStopExternalSession = useCallback(async () => {
    // Save to database via IPC
    if (window.deskflowAPI?.stopExternalSession && selectedExternalActivity) {
      try {
        // Get the active session first to get its ID
        const activeSession = await window.deskflowAPI.getActiveExternalSession();
        if (activeSession?.id) {
          await window.deskflowAPI.stopExternalSession(activeSession.id, new Date().toISOString());
          console.log('[Dashboard] Stopped external session:', selectedExternalActivity.name);
        }
      } catch (err) {
        console.error('[Dashboard] Failed to stop external session:', err);
      }
    }
    
    setExternalSessionRunning(false);
    setExternalSessionStart(null);
    setExternalElapsedMs(0);
  }, [selectedExternalActivity]);

  // Keyboard shortcuts - ALWAYS ACTIVE
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter to SELECT external activity (same as clicking on it)
      if (e.key === 'Enter') {
        console.log('[Dashboard] Enter key pressed!');
        
        // Prevent default and stop propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Find first available activity and select it
        if (activities.length > 0 && !selectedExternalActivity) {
          const firstActivity = activities[0];
          setSelectedExternalActivity(firstActivity);
          console.log('[Dashboard] Enter: Selected activity:', firstActivity.name);
        }
      }
      
      // Escape to deselect
      if (e.key === 'Escape') {
        if (selectedExternalActivity) {
          setSelectedExternalActivity(null);
          setExternalSessionRunning(false);
          console.log('[Dashboard] Escape: Deselected activity');
        }
      }
    };
    
    // Add to document with capture to ensure we get it
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [activities, selectedExternalActivity]);

  // Compute real heatmap data from allLogs (last 7 days)
  const computedHeatmap = useMemo(() => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Initialize last 7 days ending with today
    const todayDayName = dayNames[today.getDay()];
    const days: Record<string, { hours: number; productiveHours: number }> = {};
    
    // First, set today
    days[todayDayName] = { hours: 0, productiveHours: 0 };
    
    // Then go back 6 more days
    for (let i = 1; i <= 6; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = dayNames[date.getDay()];
      if (!days[dayName]) {
        days[dayName] = { hours: 0, productiveHours: 0 };
      }
    }
    
    // Sum time for each day, ONLY last 7 days
    const filteredLogs = allLogs.filter((log: any) => {
      if (!log.timestamp) return false;
      const logDate = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      return logDate >= sevenDaysAgo;
    });
    
    filteredLogs.forEach((log: any) => {
      const logDate = log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp);
      const dayName = dayNames[logDate.getDay()];
      // Handle both duration (seconds) and duration_ms (milliseconds)
      const durationSec = log.duration_ms ? log.duration_ms / 1000 : (log.duration || 0);
      const hours = durationSec / 3600;
      
      if (!days[dayName]) {
        days[dayName] = { hours: 0, productiveHours: 0 };
      }
      days[dayName].hours += hours;
      
      // Check if productive category
      const isProductive = tierAssignments?.productive?.includes(log.category);
      if (isProductive) {
        days[dayName].productiveHours += hours;
      }
    });
    
    // Return in order starting from Sun
    const orderedDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return orderedDays.map(day => {
      const dayData = days[day] || { hours: 0, productiveHours: 0 };
      return { 
        day, 
        hours: dayData.hours,
        productivity: dayData.hours > 0 ? (dayData.productiveHours / dayData.hours) : 0
      };
    });
  }, [allLogs, tierAssignments]);

  // Function to get color based on productivity and hours
  const getHeatmapColor = (hours: number, productivity: number) => {
    // No data
    if (hours === 0) return { bg: '#374151', glow: 'none' };
    
    // Productivity: 0 = red, 0.5 = yellow, 1 = green
    // Hours: more hours = brighter
    const prod = Math.max(0, Math.min(1, productivity));
    
    // Interpolate between red (#ef4444) -> yellow (#eab308) -> green (#22c55e)
    let r, g, b;
    if (prod < 0.5) {
      // Red to Yellow: mix red and yellow
      const t = prod * 2; // 0-0.5 -> 0-1
      r = Math.round(239 * (1 - t) + 234 * t);
      g = Math.round(68 * (1 - t) + 216 * t);
      b = Math.round(68 * (1 - t) + 8 * t);
    } else {
      // Yellow to Green: mix yellow and green
      const t = (prod - 0.5) * 2; // 0.5-1 -> 0-1
      r = Math.round(234 * (1 - t) + 34 * t);
      g = Math.round(216 * (1 - t) + 197 * t);
      b = Math.round(8 * (1 - t) + 94 * t);
    }
    
    // Adjust brightness based on hours (more hours = more saturated)
    const hourFactor = Math.min(1, hours / 8);
    const saturation = 0.3 + (hourFactor * 0.7);
    
    // Apply glow effect
    const glow = hours > 0 ? `0 0 ${Math.round(8 + hourFactor * 12)}px rgba(${r}, ${g}, ${b}, 0.4)` : 'none';
    
    return { bg: `rgb(${r}, ${g}, ${b})`, glow };
  };

  const defaultHeatmap = useMemo(() => [
    { day: 'Mon', hours: 2.5, productivity: 0.8 },
    { day: 'Tue', hours: 4.2, productivity: 0.9 },
    { day: 'Wed', hours: 3.8, productivity: 0.85 },
    { day: 'Thu', hours: 5.1, productivity: 0.7 },
    { day: 'Fri', hours: 2.0, productivity: 0.6 },
    { day: 'Sat', hours: 1.5, productivity: 0.5 },
    { day: 'Sun', hours: 3.2, productivity: 0.75 },
  ], []);

  // Compute hourly heatmap from allLogs (24h × 7 days grid) - MUST be defined before reference
  const hourlyHeatmapData = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    const targetWeekStart = new Date(currentWeekStart.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000));
    const targetWeekEnd = new Date(targetWeekStart.getTime() + (7 * 24 * 60 * 60 * 1000));

    const cellMap = new Map<string, { totalSeconds: number; productiveSeconds: number }>();
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(targetWeekStart);
      date.setDate(date.getDate() + dayOffset);
      const day = date.getDay();
      for (let hour = 0; hour < 24; hour++) {
        cellMap.set(`${day}-${hour}`, { totalSeconds: 0, productiveSeconds: 0 });
      }
    }

    const addSession = (startMs: number, durationSec: number, category: string) => {
      const endMs = startMs + durationSec * 1000;
      if (startMs >= targetWeekEnd || endMs < targetWeekStart) return;
      let currentMs = startMs;
      while (currentMs < endMs) {
        const currentDate = new Date(currentMs);
        const currentDay = currentDate.getDay();
        const currentHour = currentDate.getHours();
        const hourStart = currentDate.getTime();
        const hourEnd = hourStart + 3600000;
        if (currentDate >= targetWeekStart && currentDate < targetWeekEnd) {
          const segmentStart = Math.max(currentMs, hourStart);
          const segmentEnd = Math.min(endMs, hourEnd);
          const segmentSeconds = Math.max(0, (segmentEnd - segmentStart) / 1000);
          if (segmentSeconds > 0) {
            const key = `${currentDay}-${currentHour}`;
            const current = cellMap.get(key) || { totalSeconds: 0, productiveSeconds: 0 };
            const isProductive = tierAssignments?.productive?.includes(category);
            cellMap.set(key, {
              totalSeconds: Math.min(current.totalSeconds + segmentSeconds, 3600),
              productiveSeconds: isProductive ? Math.min(current.productiveSeconds + segmentSeconds, 3600) : current.productiveSeconds
            });
          }
        }
        currentMs = hourEnd;
      }
    };

    for (const log of allLogs) {
      const sessionStartMs = new Date(log.timestamp).getTime();
      // Handle both duration (seconds) and duration_ms (milliseconds)
      const durationSec = log.duration_ms ? log.duration_ms / 1000 : (log.duration || 0);
      addSession(sessionStartMs, durationSec, log.category);
    }

    const result: HeatmapCell[] = [];
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const date = new Date(targetWeekStart);
      date.setDate(date.getDate() + dayOffset);
      const day = date.getDay();
      for (let hour = 0; hour < 24; hour++) {
        const cell = cellMap.get(`${day}-${hour}`) || { totalSeconds: 0, productiveSeconds: 0 };
        const productivity = cell.totalSeconds > 0 ? cell.productiveSeconds / cell.totalSeconds : 0;
        result.push({ day, hour, value: cell.totalSeconds, productivity });
      }
    }
    return result;
  }, [allLogs, weekOffset, tierAssignments]);

  // Use hourlyHeatmapData - prioritize real data over props
  const heatmapData = allLogs.length > 0 ? hourlyHeatmapData : (hourlyHeatmap.length > 0 ? hourlyHeatmap : []);

  const heatmapWeekLabel = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    const targetWeekStart = new Date(currentWeekStart.getTime() + (weekOffset * 7 * 24 * 60 * 60 * 1000));
    const targetWeekEnd = new Date(targetWeekStart.getTime() + (6 * 24 * 60 * 60 * 1000));
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${formatDate(targetWeekStart)} - ${formatDate(targetWeekEnd)}`;
  }, [weekOffset]);

  const renderHeatmap = () => {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    const getHeatColor = (val: number, productivity: number) => {
      if (val === 0) return 'rgba(55, 65, 81, 1)'; // #374151 visible gray
      
      const prod = Math.max(0, Math.min(1, productivity));
      
      // Opacity based on duration: 1 hour = full opacity, more = saturated, less = transparent
      const opacity = Math.min(1, 0.3 + (val / 3600) * 0.7);
      
      // Red (#ef4444) -> Yellow (#eab308) -> Green (#22c55e)
      let r, g, b;
      if (prod < 0.5) {
        const t = prod * 2;
        r = Math.round(239 * (1 - t) + 234 * t);
        g = Math.round(68 * (1 - t) + 216 * t);
        b = Math.round(68 * (1 - t) + 8 * t);
      } else {
        const t = (prod - 0.5) * 2;
        r = Math.round(234 * (1 - t) + 34 * t);
        g = Math.round(216 * (1 - t) + 197 * t);
        b = Math.round(8 * (1 - t) + 94 * t);
      }
      
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return (
      <div className="relative w-full">
        <div className="overflow-x-auto">
          <div className="w-full bg-zinc-950 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center mb-3">
              <div className="w-14 flex-shrink-0"></div>
              {DAYS.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`flex-1 text-center text-sm font-semibold mx-px ${dayIdx === currentDay ? 'text-emerald-400' : 'text-zinc-400'}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {Array.from({ length: 24 }, (_, hourIdx) => (
              <div key={hourIdx} className="flex items-center py-[1px]">
                <div className={`w-14 flex-shrink-0 pr-3 text-xs font-mono text-right ${hourIdx === currentHour ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                  {hourIdx.toString().padStart(2, '0')}:00
                </div>
                {DAYS.map((_, dayIdx) => {
                  const cell = hourlyHeatmapData.find(c => c.day === dayIdx && c.hour === hourIdx);
                  const val = cell?.value || 0;
                  const productivity = cell?.productivity || 0;
                  const isToday = dayIdx === currentDay;
                  const isCurrentHour = hourIdx === currentHour;
                  const bgColor = getHeatColor(val, productivity);
                  const prodPercent = Math.round(productivity * 100);
                  const timeDisplay = val >= 3600 ? '1h' : val >= 60 ? `${Math.floor(val / 60)}m` : `${val}s`;
                  
                  // Parse the RGBA values for glow
                  const rgbaMatch = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                  const glowRgb = rgbaMatch ? `${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}` : '34, 197, 94';

                  return (
                    <motion.div
                      key={dayIdx}
                      className="flex-1 h-6 mx-px rounded-md cursor-pointer relative min-w-[28px]"
                      style={{
                        backgroundColor: bgColor,
                        boxShadow: val > 70 ? `0 0 12px rgba(${glowRgb}, 0.5)` : 'inset 0 0 2px rgba(255,255,255,0.08)'
                      }}
                      onMouseEnter={() => setHoveredCell({ day: dayIdx, hour: hourIdx, value: val, productivity })}
                      onMouseLeave={() => setHoveredCell(null)}
                      whileHover={{ scale: 1.08, zIndex: 20 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {isCurrentHour && isToday && (
                        <div className="absolute inset-0 rounded-md ring-2 ring-emerald-400 ring-offset-2 ring-offset-zinc-950" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-5">
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-400">
            <span>Distracting</span>
            <div className="flex items-center gap-1.5">
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                const r = p === 0 ? '#374151' : p < 0.5 ? Math.round(239 * (1 - p*2) + 234 * p*2) : Math.round(234 * (1 - (p-0.5)*2) + 34 * (p-0.5)*2);
                const g = p === 0 ? '#374151' : p < 0.5 ? Math.round(68 * (1 - p*2) + 216 * p*2) : Math.round(216 * (1 - (p-0.5)*2) + 197 * (p-0.5)*2);
                const b = p === 0 ? '#374151' : p < 0.5 ? Math.round(68 * (1 - p*2) + 8 * p*2) : Math.round(8 * (1 - (p-0.5)*2) + 94 * (p-0.5)*2);
                return (
                  <div
                    key={i}
                    className="w-7 h-4 rounded relative"
                    style={{ backgroundColor: `rgb(${r}, ${g}, ${b})`, border: '1px solid #27272a' }}
                    title={`${Math.round(p * 100)}% productive`}
                  />
                );
              })}
            </div>
            <span>Productive</span>
          </div>
          <div className="flex justify-center gap-1 text-xs text-zinc-600 -mt-1">
            <span className="w-7 text-center">0%</span>
            <span className="w-7 text-center">25%</span>
            <span className="w-7 text-center">50%</span>
            <span className="w-7 text-center">75%</span>
            <span className="w-7 text-center">100%</span>
          </div>
          <div className="text-center text-xs text-zinc-500">
            Colors show <span className="text-zinc-300 font-medium">productivity percentage</span> — red = distracting, green = productive.
          </div>
        </div>

        <AnimatePresence>
          {hoveredCell && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute glass px-4 py-2.5 rounded-xl border border-zinc-700 shadow-xl z-50 pointer-events-none"
              style={{
                minWidth: '200px',
                left: '50%',
                transform: 'translateX(-50%)',
                top: `${(hoveredCell.hour * 26) + 50}px`
              }}
            >
              <div className="font-semibold text-white text-xs mb-1.5">
                {DAYS[hoveredCell.day]} at {hoveredCell.hour.toString().padStart(2, '0')}:00 – {(hoveredCell.hour + 1).toString().padStart(2, '0')}:00
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-zinc-400 text-xs">Time:</span>
                <span className="font-mono text-lg text-emerald-400 tabular-nums">
                  {formatDuration(Math.floor(hoveredCell.value) * 1000)}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-zinc-400 text-xs">Productivity:</span>
                <span className={`font-mono text-sm tabular-nums ${hoveredCell.productivity >= 0.5 ? 'text-emerald-400' : hoveredCell.productivity > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {Math.round(hoveredCell.productivity * 100)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Compute real solar system data from allLogs (filtered by selectedPeriod)
  const computedSolarData = useMemo(() => {
    const appUsage: Record<string, number> = {};
    const selectedBrowser = trackingBrowser?.toLowerCase() || '';
    
    // Filter logs by selectedPeriod first
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
    
    filteredLogs.forEach((log: any) => {
      if (!log.app) return;
      const appLower = (log.app || '').toLowerCase();
      if (selectedBrowser && appLower.includes(selectedBrowser)) return;
      const durationMs = log.duration_ms || ((log.duration || 0) * 1000);
      if (!appUsage[log.app]) {
        appUsage[log.app] = 0;
      }
      appUsage[log.app] += durationMs;
    });
    
    return Object.entries(appUsage)
      .map(([name, usage_ms]) => ({ name, usage_ms, category: 'Tool' }))
      .sort((a, b) => b.usage_ms - a.usage_ms)
      .slice(0, 5);
  }, [allLogs, trackingBrowser, selectedPeriod]);
  
  // Compute website solar data
  const computedWebsiteData = useMemo(() => {
    const websiteUsage: Record<string, number> = {};
    const now = new Date();
    let filteredLogs = allLogs.filter((log: any) => log.is_browser_tracking || log.domain);
    
    if (selectedPeriod === 'today') {
      filteredLogs = filteredLogs.filter(log =>
        log.timestamp.getDate() === now.getDate() &&
        log.timestamp.getMonth() === now.getMonth() &&
        log.timestamp.getFullYear() === now.getFullYear()
      );
    } else if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= weekAgo);
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = filteredLogs.filter(log => log.timestamp >= monthAgo);
    }
    
    filteredLogs.forEach((log: any) => {
      const domain = log.domain || log.app;
      if (!domain) return;
      const durationMs = log.duration_ms || ((log.duration || 0) * 1000);
      if (!websiteUsage[domain]) {
        websiteUsage[domain] = 0;
      }
      websiteUsage[domain] += durationMs;
    });
    
    return Object.entries(websiteUsage)
      .map(([name, usage_ms]) => ({ name, usage_ms, category: 'Website' }))
      .sort((a, b) => b.usage_ms - a.usage_ms)
      .slice(0, 5);
  }, [allLogs, selectedPeriod]);

  // Toggle for App/Website view in solar system
  const [solarMode, setSolarMode] = useState<'apps' | 'websites'>('apps');
  
  const solarData = solarMode === 'websites' ? computedWebsiteData : computedSolarData;

  const defaultSolarData: SolarSystemData[] = [
    { name: 'VS Code', usage_ms: 7200000, category: 'Tools' },
    { name: 'Chrome', usage_ms: 3600000, category: 'Browser' },
    { name: 'Antigravity', usage_ms: 1800000, category: 'IDE' },
  ];
  const solar = solarMode === 'websites' 
    ? (allLogs.length > 0 ? computedWebsiteData : defaultSolarData)
    : (solarSystemData.length > 0 ? solarSystemData : (allLogs.length > 0 ? computedSolarData : defaultSolarData));
  const maxUsage = Math.max(...solar.map(d => d.usage_ms), 1);

  const isCurrentlyProductive = lastTier === 'productive' && !isPaused;
  const isDistracting = lastTier === 'distracting' && !isPaused;
  
  // Border colors for different states
  const borderColor = externalSessionRunning 
    ? 'rgba(139, 92, 246, 0.3)'  // Purple for external
    : isDistracting 
      ? 'rgba(239, 68, 68, 0.3)'  // Red for distracting
      : isCurrentlyProductive 
        ? 'rgba(16, 185, 129, 0.3)'  // Green for productive
        : 'rgba(107, 114, 128, 0.3)';  // Gray for idle

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

    // Total time - handle both duration (seconds) and duration_ms (milliseconds)
    const totalTimeMs = filteredLogs.reduce((acc, log) => {
      const durationMs = log.duration_ms || ((log.duration || 0) * 1000);
      return acc + durationMs;
    }, 0);

    // Productive time
    const productiveTimeMs = filteredLogs
      .filter(log => DEFAULT_TIER_ASSIGNMENTS.productive.includes(log.category))
      .reduce((acc, log) => {
        const durationMs = log.duration_ms || ((log.duration || 0) * 1000);
        return acc + durationMs;
      }, 0);

    // Percentage
    const productivePercent = totalTimeMs > 0 ? Math.round((productiveTimeMs / totalTimeMs) * 100) : 0;

    // Longest focus session
    let longestFocusMs = 0;
    let currentFocusMs = 0;
    let inProductive = false;
    const sortedLogs = [...filteredLogs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (const log of sortedLogs) {
      const durationMs = log.duration_ms || ((log.duration || 0) * 1000);
      if (DEFAULT_TIER_ASSIGNMENTS.productive.includes(log.category)) {
        currentFocusMs += durationMs;
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

  // Need state for live tick
  const [tick, setTick] = useState(0);
  
  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Calculate active session elapsed time with live updates
  const getElapsedDuration = (item: ActivityFeedItem): string => {
    if (!item.isActive || !item.startTime) return '';
    const elapsed = tick * 1000; // approximate - real calculation below
    const elapsedMs = Date.now() - item.startTime;
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const elapsedMin = Math.floor(elapsedSec / 60);
    const elapsedHr = Math.floor(elapsedMin / 60);
    
    if (elapsedHr > 0) return `${elapsedHr}:${(elapsedMin % 60).toString().padStart(2, '0')}:${(elapsedSec % 60).toString().padStart(2, '0')}`;
    return `${elapsedMin}:${(elapsedSec % 60).toString().padStart(2, '0')}`;
  };

  // Static elapsed times (for completed sessions - DURATION spent, not time ago)
  // Only re-calculate when activityFeed CHANGES, NOT on every tick
  const activityFeedWithElapsed = useMemo(() => {
    return activityFeed.slice(0, 10).map((item, index) => {
      // For completed sessions, use the DURATION from the log (seconds)
      // For active sessions (no duration yet), calculate elapsed time
      let durationSec: number;
      
      if (item.isActive) {
        // Active session - calculate time elapsed since start
        durationSec = Math.floor((Date.now() - item.startTime) / 1000);
      } else if (item.duration && item.duration > 0) {
        // Completed session with stored duration
        durationSec = item.duration;
      } else {
        // Fallback: calculate time from timestamp to next item (if exists)
        const nextItem = activityFeed[index + 1];
        if (nextItem) {
          const currentTime = new Date(item.timestamp).getTime();
          const nextTime = new Date(nextItem.timestamp).getTime();
          durationSec = Math.floor((nextTime - currentTime) / 1000);
        } else {
          durationSec = 0;
        }
      }
      
      const elapsedMin = Math.floor(durationSec / 60);
      const elapsedHr = Math.floor(elapsedMin / 60);
      
      let durationStr = '';
      if (elapsedHr > 0) durationStr = `${elapsedHr}h ${elapsedMin % 60}m`;
      else if (elapsedMin > 0) durationStr = `${elapsedMin}m`;
      else if (durationSec > 0) durationStr = `${durationSec}s`;
      else durationStr = '';
      
      const result = { ...item };
      result.elapsedStr = durationStr;
      result.isTop = index === 0;
      return result;
    });
  }, [activityFeed]);

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
              className="rounded-2xl p-8 sm:p-12 border backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(10, 10, 10, 0.8)',
                borderColor,
                boxShadow: isCurrentlyProductive || externalSessionRunning ? `0 0 20px ${externalSessionRunning ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.1)'}` : 'none'
              }}
            >
              <div className="text-center space-y-6">
                {/* Status indicator */}
<motion.div
                  animate={{ opacity: (isCurrentlyProductive || externalSessionRunning || isDistracting) ? [1, 0.7, 1] : 1 }}
                  transition={{ duration: 2, repeat: (isCurrentlyProductive || externalSessionRunning || isDistracting) ? Infinity : 0 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: externalSessionRunning 
                        ? '#8b5cf6'  // Purple for external
                        : isDistracting 
                          ? '#ef4444'  // Red for distracting
                          : isCurrentlyProductive 
                            ? '#10b981'  // Green for productive
                            : '#6b7280'  // Gray for idle
                    }}
                  />
                   <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      {isPaused 
                        ? '⏸ Paused' 
                        : externalSessionRunning 
                          ? `External: ${selectedExternalActivity?.name}`
                          : isDistracting 
                            ? '⛔ Distracting'
                            : isCurrentlyProductive 
                              ? '🔒 Locked In' 
                              : '⏸ Idle'}
                   </span>
                </motion.div>

                {/* Giant Timer */}
                <motion.div
                  key={externalSessionRunning ? externalElapsedMs : currentProductiveMs}
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-mono font-bold"
                  style={{
                    fontSize: externalSessionRunning ? '80px' : '120px',
                    lineHeight: '1',
                    color: externalSessionRunning 
                      ? '#8b5cf6'  // Purple for external
                      : isDistracting 
                        ? '#ef4444'  // Red for distracting
                        : isCurrentlyProductive 
                          ? '#10b981'  // Green for productive
                          : '#9ca3af',  // Gray for idle
textShadow: !isPaused && (isCurrentlyProductive || externalSessionRunning || isDistracting) 
                      ? (externalSessionRunning 
                          ? '0 0 30px rgba(139, 92, 246, 0.3)' 
                          : isDistracting 
                            ? '0 0 30px rgba(239, 68, 68, 0.3)'
                            : '0 0 30px rgba(16, 185, 129, 0.3)') 
: 'none',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {externalSessionRunning ? formatDuration(externalElapsedMs) : formatDuration(currentProductiveMs)}
                </motion.div>
                
                {/* Show external activity name when running */}
                {externalSessionRunning && selectedExternalActivity && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-3"
                  >
                    <div className="text-zinc-400 text-sm uppercase tracking-wider">External Activity</div>
                    <div className="flex items-center justify-center gap-2">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-mono font-semibold"
                        style={{
                          backgroundColor: 'rgba(139, 92, 246, 0.2)',  // Purple
                          color: '#a78bfa'
                        }}
                      >
                        {selectedExternalActivity.name}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Current activity - show external OR regular, not both when external is running */}
                {!externalSessionRunning && (currentApp || currentWebsite || isInBrowser) && (
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
                          backgroundColor: isDistracting 
                            ? 'rgba(239, 68, 68, 0.2)'  // Red for distracting
                            : isCurrentlyProductive 
                              ? 'rgba(16, 185, 129, 0.2)'  // Green for productive
                              : 'rgba(107, 114, 128, 0.2)',  // Gray for idle
                          color: isDistracting 
                            ? '#f87171'  // Red
                            : isCurrentlyProductive 
                              ? '#34d399'  // Green
                              : '#d1d5db'  // Gray
                        }}
                      >
                        {currentWebsite ? currentWebsite.category : (currentApp?.category || (isInBrowser ? 'Browser' : 'Unknown'))}
                      </span>
                    </div>
                    <div className="text-lg font-medium text-white">
                      {currentApp ? (currentApp.app || currentApp.title) : (currentWebsite?.title || (isInBrowser ? 'Browsing...' : 'Unknown'))}
                    </div>
                  </motion.div>
                )}

                {/* Helpful message */}
                <div className="text-xs text-zinc-600 pt-4 border-t border-zinc-800">
                  {externalSessionRunning 
                    ? `External activity: ${selectedExternalActivity?.name}. Timer running.`
                    : (isCurrentlyProductive 
                      ? 'Productive work detected. Timer running.'
                      : 'No productive activity detected. Open an IDE, editor, or learning tool to start.')}
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
                <button
                  onClick={() => setPinnedActivitiesExpanded(!pinnedActivitiesExpanded)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${pinnedActivitiesExpanded ? 'rotate-90' : ''}`} />
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Pinned Activities</h2>
                    <p className="text-xs text-zinc-600 mt-1">Quick manual tracking</p>
                  </div>
                </button>
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

              {pinnedActivitiesExpanded && (
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
                
                {/* External Activity Controls */}
                {selectedExternalActivity && !pinnedActivitiesEditMode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border max-w-md mx-auto"
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
                    <p className="text-xs text-zinc-600 mt-1">Days × Hours (click to expand)</p>
                  </div>
                  {/* Same grid as App.tsx: 7 days x top 9 hours */}
                  <div className="flex items-end justify-between gap-1 h-40">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, dayIdx) => {
                      const dayData = heatmapData.filter(c => c.day === dayIdx);
                      const totalSeconds = dayData.reduce((sum, c) => sum + (c.value || 0), 0);
                      const hours = totalSeconds / 3600;
                      const height = Math.min(100, (hours / 8) * 100);
                      const todayIdx = new Date().getDay();
                      const isToday = dayIdx === todayIdx;
                      
                      const bg = hours < 0.1 ? '#18181b' : hours >= 2 ? '#22c55e' : hours >= 1 ? '#16a34a' : '#15803d';
                      const glow = hours < 0.1 ? 'none' : '0 0 8px rgba(34, 197, 94, 0.4)';
                      
                      return (
                        <div key={dayName} className="flex-1 flex flex-col items-center gap-1 group cursor-pointer min-w-12">
                          <div className="flex-1 w-full flex items-end justify-center h-36">
                            <motion.div
                              initial={{ height: '2px' }}
                              animate={{ height: `${Math.max(height, 2)}%` }}
                              transition={{ delay: dayIdx * 0.05, duration: 0.4 }}
                              className="w-3/4 rounded-t-md"
                              style={{ 
                                backgroundColor: bg,
                                minHeight: '2px',
                                boxShadow: glow,
                              }}
                            />
                          </div>
                          <div className={`text-xs font-mono font-semibold ${isToday ? 'text-emerald-400' : 'text-zinc-600'}`}>
                            {dayName}
                          </div>
                          <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors leading-tight text-center">
                            {hours < 0.1 ? (
                              <span className="text-zinc-700">--</span>
                            ) : (
                              <span>{hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(hours * 60)}m`}</span>
                            )}
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">App Ecosystem</h2>
                      <p className="text-xs text-zinc-600 mt-1">Your top tools in orbit (click to expand)</p>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSolarMode('apps'); }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${solarMode === 'apps' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        Apps
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSolarMode('websites'); }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${solarMode === 'websites' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        Websites
                      </button>
                    </div>
                  </div>
                   <div className="relative h-48 flex items-center justify-center">
                    <div className="absolute w-12 h-12 rounded-full border border-zinc-700 flex items-center justify-center">
                      <Sun className="w-6 h-6 text-zinc-600" />
                    </div>
                    
                    {solarData.slice(0, 5).map((app, i) => {
                     const size = Math.max(48, 28 + (app.usage_ms / maxUsage) * 56);
                     const angle = (i * 360) / Math.min(solar.length, 5);
                     const radius = 60 + (i % 2) * 30;
                     const rad = (angle * Math.PI) / 180;
                     const x = Math.cos(rad) * radius;
                     const y = Math.sin(rad) * radius;
                     
                     return (
                       <motion.div
                         key={app.name}
                         initial={{ scale: 0, x: 0, y: 0 }}
                         animate={{ scale: 1, x, y }}
                         transition={{ delay: 0.3 + i * 0.1 }}
                         className="absolute rounded-full border border-zinc-700 flex flex-col items-center justify-center text-xs font-semibold text-zinc-300 hover:border-zinc-500 transition-colors p-2"
                         style={{ 
                           width: size, 
                           height: size,
                           backgroundColor: 'rgba(24, 24, 27, 0.9)',
                           cursor: 'pointer'
                         }}
                         title={`${app.name}: ${Math.round((app.usage_ms / 1000 / 3600) * 10) / 10}h`}
                       >
                         <div className="text-center truncate">{app.name.length > 8 ? app.name.substring(0, 8) + '...' : app.name}</div>
                         <div className="text-xs text-zinc-500 mt-0.5">{Math.round((app.usage_ms / 1000 / 3600) * 10) / 10}h</div>
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
                    className="rounded-2xl p-8 border max-w-4xl w-full max-h-[90vh] overflow-auto"
                    style={{
                      backgroundColor: 'rgba(10, 10, 10, 0.95)',
                      borderColor: 'rgba(107, 114, 128, 0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-200">Activity Heatmap</h2>
                        <p className="text-xs text-zinc-600 mt-1">{heatmapWeekLabel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setWeekOffset(w => w - 1)}
                          className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
                          title="Previous week"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setWeekOffset(0)}
                          className="px-2 py-1 text-xs text-zinc-400 hover:text-white transition"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
                          disabled={weekOffset >= 0}
                          className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700 text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Next week"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedModal(null)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors ml-2"
                        >
                          <X className="w-5 h-5 text-zinc-400" />
                        </button>
                      </div>
                    </div>
                    
                    {renderHeatmap()}
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
                  className="fixed inset-0 z-50"
                  onClick={() => setExpandedModal(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className={solarFullscreen ? "fixed inset-0 z-50 bg-black flex flex-col" : "rounded-2xl p-8 border max-w-4xl w-full max-h-[90vh] overflow-hidden"}
                    style={{
                      borderColor: solarFullscreen ? 'transparent' : 'rgba(107, 114, 128, 0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with timeline selector */}
                    <div className={`flex items-center justify-between px-4 pt-4 ${solarFullscreen ? '' : 'mb-4'}`}>
                      <div>
                        <h2 className="text-lg font-semibold uppercase tracking-wider text-zinc-200">App Ecosystem</h2>
                        <p className="text-xs text-zinc-600 mt-1">Your top tools in orbit</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Timeline selector */}
                        <div className="flex bg-zinc-800 rounded-lg p-1">
                          {(['today', 'week', 'month', 'all'] as const).map((period) => (
                            <button
                              key={period}
                              onClick={() => setSelectedPeriod(period)}
                              className={`px-3 py-1.5 text-xs rounded-md transition ${
                                selectedPeriod === period 
                                  ? 'bg-zinc-700 text-white' 
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              {period === 'today' ? 'Day' : period.charAt(0).toUpperCase() + period.slice(1)}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setSolarFullscreen(!solarFullscreen)}
                          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                          title={solarFullscreen ? "Exit fullscreen" : "Fullscreen"}
                        >
                          {solarFullscreen ? <Minimize2 className="w-5 h-5 text-zinc-400" /> : <Maximize2 className="w-5 h-5 text-zinc-400" />}
                        </button>
                        <button
                          onClick={() => { setExpandedModal(null); setSolarFullscreen(false); }}
                          className="p-2 hover:bg-red-900/50 rounded-lg transition-colors"
                          title="Close"
                        >
                          <X className="w-5 h-5 text-zinc-400" />
                        </button>
                      </div>
                    </div>
                    
                    {/* OrbitSystem container */}
                    <Suspense fallback={<div className="h-[400px] flex items-center justify-center"><div className="text-zinc-400">Loading 3D visualization...</div></div>}>
                      <div className={solarFullscreen ? 'w-full h-screen' : 'h-[500px]'}>
                        <OrbitSystem 
                          logs={allLogs} 
                          websiteLogs={browserLogs}
                          appColors={appColors}
                          categoryOverrides={categoryOverrides}
                        />
                      </div>
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
            className="glass rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Recent Sessions</h2>
            </div>
            
<div className="space-y-2">
              {activityFeedWithElapsed.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No sessions tracked yet. Start using your apps and websites to build a history.
                </div>
              ) : (
                [...activityFeedWithElapsed].reverse().map((item) => {
                  const tierColor = item.tier === 'productive' ? 'text-emerald-400' : 
                                   item.tier === 'distracting' ? 'text-red-400' : 'text-blue-400';
                  const bgColor = item.tier === 'productive' ? 'bg-emerald-500/10' : 
                                   item.tier === 'distracting' ? 'bg-red-500/10' : 'bg-blue-500/10';
                  const isActive = item.isActive;
                  const durationStr = isActive ? getElapsedDuration(item) : item.elapsedStr;
                  // For past items: show TIME SPENT, not "ago"
                  const statusLabel = isActive ? 'Active' : (item.elapsedStr ? item.elapsedStr : '');
                  
                  return (
                    <div key={item.id} className={`p-3 rounded-lg ${bgColor} border ${
                      item.tier === 'productive' ? 'border-emerald-500/20' : 
                      item.tier === 'distracting' ? 'border-red-500/20' : 'border-blue-500/20'
                    } flex items-center justify-between`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {isActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                          <span className="text-sm font-medium text-white">{item.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{item.category}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${tierColor}`}>
                            {item.tier.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {item.timestamp.toLocaleTimeString()} • {item.type === 'app' ? 'App' : 'Website'}{statusLabel ? ` • ${statusLabel}` : ''}
                          {isActive && durationStr && <span className="ml-2 font-mono text-emerald-400">{durationStr}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
