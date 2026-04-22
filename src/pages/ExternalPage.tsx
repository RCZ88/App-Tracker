import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Play, Pause, Square, Moon, Sun, BookOpen, Dumbbell, Activity,
  Bus, Book, Utensils, Coffee, Plus, X, AlertTriangle,
  TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

interface ExternalActivity {
  id: number;
  name: string;
  type: 'stopwatch' | 'sleep' | 'checkin';
  color: string;
  icon: string;
  default_duration: number;
  is_default: number;
  is_visible: number;
  sort_order: number;
}

interface ExternalSession {
  id: number;
  activity_id: number;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  activity_name: string;
  type: string;
  color: string;
}

interface ExternalStats {
  byActivity: Record<string, { total_seconds: number; session_count: number }>;
  total_seconds: number;
  sleep_deficit_seconds: number;
  average_sleep_hours: number;
}

interface ConsistencyData {
  score: number;
  weekly_comparison: Array<{ week: string; total_seconds: number }>;
}

interface SleepTrend {
  daily: Array<{ date: string; sleep_seconds: number; deficit_seconds: number }>;
  average_bedtime: string;
  average_wake_time: string;
}

interface ActivityStats {
  today_seconds: number;
  week_seconds: number;
  month_seconds: number;
  session_count: number;
}

const ICON_MAP: Record<string, any> = {
  Clock,
  Moon,
  Sun,
  BookOpen,
  Dumbbell,
  Activity,
  Bus,
  Book,
  Utensils,
  Coffee,
};

const AVAILABLE_ICONS = [
  { name: 'Clock', icon: Clock },
  { name: 'Moon', icon: Moon },
  { name: 'Sun', icon: Sun },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Activity', icon: Activity },
  { name: 'Bus', icon: Bus },
  { name: 'Book', icon: Book },
  { name: 'Utensils', icon: Utensils },
  { name: 'Coffee', icon: Coffee },
];

const ACTIVITY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Clock;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function calculateSleepDuration(start: Date, end: Date): number {
  let endMs = end.getTime();
  const startMs = start.getTime();
  if (endMs < startMs) {
    endMs += 24 * 60 * 60 * 1000;
  }
  return Math.min(endMs - startMs, 24 * 60 * 60 * 1000);
}

function formatBedtime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ExternalPage() {
  const [activities, setActivities] = useState<ExternalActivity[]>([]);
  const [stats, setStats] = useState<ExternalStats>({ byActivity: {}, total_seconds: 0, sleep_deficit_seconds: 0, average_sleep_hours: 0 });
  const [consistency, setConsistency] = useState<ConsistencyData>({ score: 0, weekly_comparison: [] });
  const [sleepTrends, setSleepTrends] = useState<SleepTrend>({ daily: [], average_bedtime: '', average_wake_time: '' });
  const [activeSession, setActiveSession] = useState<{ sessionId: string; activityId: string; activity: ExternalActivity; startTime: Date } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [wakeTime, setWakeTime] = useState({ hours: 7, minutes: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [newActivity, setNewActivity] = useState({ name: '', type: 'stopwatch' as const, color: '#6366f1', icon: 'Clock', default_duration: 30 });
  const [showCharts, setShowCharts] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoverySession, setRecoverySession] = useState<{ sessionId: string; activityId: string; activity: ExternalActivity; startTime: Date } | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);

  // Load activities on mount
  useEffect(() => {
    if (window.deskflowAPI?.getExternalActivities) {
      window.deskflowAPI.getExternalActivities().then((data) => {
        setActivities(data);
      });
    }
    if (window.deskflowAPI?.getActiveExternalSession) {
      window.deskflowAPI.getActiveExternalSession().then((session) => {
        if (session) {
          const startTime = new Date(session.started_at);
          const now = new Date();
          const durationHours = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          const startHour = startTime.getHours();
          
          const isNightSleep = startHour >= 22 || startHour <= 4;
          const isLongSession = durationHours >= 3;
          
          if (isLongSession || isNightSleep) {
            const activity = activities.find(a => a.id === session.activity_id) || {
              id: session.activity_id,
              name: session.name,
              type: session.type,
              color: session.color,
              icon: session.icon,
            };
            setRecoverySession({
              sessionId: session.id.toString(),
              activityId: session.activity_id.toString(),
              activity: activity as ExternalActivity,
              startTime,
            });
            setShowRecoveryModal(true);
          } else {
            if (window.deskflowAPI?.stopExternalSession) {
              window.deskflowAPI.stopExternalSession(session.id.toString());
            }
          }
        }
      });
    }
  }, []);

  // Load stats
  useEffect(() => {
    if (window.deskflowAPI?.getExternalStats) {
      window.deskflowAPI.getExternalStats(selectedPeriod).then(setStats);
    }
    if (window.deskflowAPI?.getConsistencyScore) {
      window.deskflowAPI.getConsistencyScore(selectedPeriod === 'week' ? 'week' : 'month').then(setConsistency);
    }
    if (window.deskflowAPI?.getSleepTrends) {
      window.deskflowAPI.getSleepTrends(selectedPeriod === 'week' ? 'week' : 'month').then(setSleepTrends);
    }
  }, [selectedPeriod]);

  // Timer interval
  useEffect(() => {
    if (!activeSession) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - activeSession.startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Start activity
  const startActivity = useCallback(async (activity: ExternalActivity) => {
    if (window.deskflowAPI?.getActivityStats) {
      window.deskflowAPI.getActivityStats(activity.id.toString()).then(setActivityStats);
    }
    if (activity.type === 'sleep') {
      if (window.deskflowAPI?.startExternalSession) {
        const result = await window.deskflowAPI.startExternalSession(activity.id.toString());
        if (result.success) {
          setActiveSession({
            sessionId: result.sessionId,
            activityId: activity.id.toString(),
            activity,
            startTime: new Date(),
          });
        }
      }
    } else if (activity.type === 'stopwatch') {
      setActiveSession({
        sessionId: 'temp-' + Date.now(),
        activityId: activity.id.toString(),
        activity,
        startTime: new Date(),
      });
    } else if (activity.type === 'checkin') {
      if (window.deskflowAPI?.startExternalSession && window.deskflowAPI?.stopExternalSession) {
        const startResult = await window.deskflowAPI.startExternalSession(activity.id.toString());
        if (startResult.success) {
          await window.deskflowAPI.stopExternalSession(startResult.sessionId);
          refreshStats();
        }
      }
    }
  }, []);

  const refreshStats = useCallback(() => {
    if (window.deskflowAPI?.getExternalStats) {
      window.deskflowAPI.getExternalStats(selectedPeriod).then(setStats);
    }
    if (window.deskflowAPI?.getConsistencyScore) {
      window.deskflowAPI.getConsistencyScore(selectedPeriod === 'week' ? 'week' : 'month').then(setConsistency);
    }
    if (window.deskflowAPI?.getSleepTrends) {
      window.deskflowAPI.getSleepTrends(selectedPeriod === 'week' ? 'week' : 'month').then(setSleepTrends);
    }
  }, [selectedPeriod]);

  // Stop activity
  const stopActivity = useCallback(async () => {
    if (!activeSession) return;

    if (activeSession.activity.type === 'sleep') {
      setShowSleepModal(true);
    } else {
      // Save stopwatch session
      if (activeSession.activity.type === 'stopwatch' && window.deskflowAPI?.startExternalSession && window.deskflowAPI?.stopExternalSession) {
        const result = await window.deskflowAPI.startExternalSession(activeSession.activityId);
        if (result.success) {
          await window.deskflowAPI.stopExternalSession(result.sessionId);
        }
      }
      setActiveSession(null);
      setElapsedSeconds(0);
      refreshStats();
    }
  }, [activeSession, refreshStats]);

  // Confirm wake up
  const confirmWakeUp = useCallback(async () => {
    if (!activeSession || activeSession.activity.type !== 'sleep') return;

    const now = new Date();
    const wakeDate = new Date();
    wakeDate.setHours(wakeTime.hours, wakeTime.minutes, 0, 0);

    const startDate = activeSession.startTime;
    const startMs = startDate.getTime();
    const wakeMs = wakeDate.getTime();

    if (wakeMs < startMs) {
      wakeDate.setDate(wakeDate.getDate() + 1);
    }

    if (window.deskflowAPI?.stopExternalSession) {
      await window.deskflowAPI.stopExternalSession(activeSession.sessionId, wakeDate.toISOString());
    }

    setShowSleepModal(false);
    setActiveSession(null);
    setElapsedSeconds(0);
    refreshStats();
  }, [activeSession, wakeTime, refreshStats]);

  // Cancel sleep
  const cancelSleep = useCallback(async () => {
    if (!activeSession) return;
    setActiveSession(null);
    setElapsedSeconds(0);
    setShowSleepModal(false);
  }, [activeSession]);

  // Save custom activity
  const saveCustomActivity = useCallback(async () => {
    if (!newActivity.name.trim()) return;

    if (window.deskflowAPI?.addExternalActivity) {
      await window.deskflowAPI.addExternalActivity({
        name: newActivity.name,
        type: newActivity.type,
        color: newActivity.color,
        icon: newActivity.icon,
        default_duration: newActivity.default_duration,
      });
      
      // Reload activities
      if (window.deskflowAPI?.getExternalActivities) {
        window.deskflowAPI.getExternalActivities().then(setActivities);
      }
    }

    setShowAddModal(false);
    setNewActivity({ name: '', type: 'stopwatch', color: '#6366f1', icon: 'Clock', default_duration: 30 });
  }, [newActivity]);

  // Activity breakdown chart data
  const breakdownData = useMemo(() => {
    const labels = Object.keys(stats.byActivity);
    const data = labels.map(name => (stats.byActivity[name]?.total_seconds || 0) / 3600);
    const colors = labels.map(name => {
      const activity = activities.find(a => a.name === name);
      return activity?.color || '#6366f1';
    });

    return { labels, data, colors };
  }, [stats, activities]);

  // Consistency chart data
  const consistencyChartData = useMemo(() => {
    return {
      labels: consistency.weekly_comparison.map(w => w.week.slice(5)),
      data: consistency.weekly_comparison.map(w => w.total_seconds / 3600),
    };
  }, [consistency]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-100">External Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className={`px-3 py-1.5 rounded-lg text-sm transition ${
              showCharts ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Charts
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Active Timer View */}
        <AnimatePresence>
          {activeSession && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8"
            >
              <div
                className="rounded-2xl p-8 flex flex-col items-center justify-center"
                style={{ backgroundColor: activeSession.activity.color + '20', border: `2px solid ${activeSession.activity.color}` }}
              >
                <div className="text-center mb-6">
                  {activeSession.activity.type === 'sleep' ? (
                    <>
                      <div className="text-6xl mb-4">😴</div>
                      <div className="text-2xl font-bold text-zinc-100 mb-2">Sleeping</div>
                      <div className="text-xl text-zinc-300">Since {formatBedtime(activeSession.startTime)}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-zinc-400 mb-1">Tracking</div>
                      <div className="text-5xl font-mono font-bold text-zinc-100">
                        {formatDuration(elapsedSeconds)}
                      </div>
                      <div className="text-lg text-zinc-300 mt-2">{activeSession.activity.name}</div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={activeSession.activity.type === 'sleep' ? cancelSleep : stopActivity}
                    className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                    {activeSession.activity.type === 'sleep' ? 'Cancel' : 'Stop'}
                  </button>
                  {activeSession.activity.type === 'sleep' && (
                    <button
                      onClick={() => setShowSleepModal(true)}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Sun className="w-5 h-5" />
                      Wake Up
                    </button>
                  )}
                </div>
                {activityStats && (
                  <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-md">
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-zinc-400">Today</div>
                      <div className="text-lg font-bold text-zinc-100">{formatHours(activityStats.today_seconds)}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-zinc-400">This Week</div>
                      <div className="text-lg font-bold text-zinc-100">{formatHours(activityStats.week_seconds)}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-zinc-400">This Month</div>
                      <div className="text-lg font-bold text-zinc-100">{formatHours(activityStats.month_seconds)}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Today</div>
            <div className="text-2xl font-bold text-zinc-100">
              {formatHours(stats.total_seconds)}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Consistency</div>
            <div className={`text-2xl font-bold ${
              consistency.score >= 70 ? 'text-emerald-400' : 
              consistency.score >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {consistency.score}%
              {consistency.score >= 70 ? <TrendingUp className="w-5 h-5 inline ml-1" /> : 
               consistency.score >= 40 ? <Minus className="w-5 h-5 inline ml-1" /> : 
               <TrendingDown className="w-5 h-5 inline ml-1" />}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Sleep Deficit</div>
            <div className={`text-2xl font-bold ${stats.sleep_deficit_seconds < 0 ? 'text-red-400' : stats.sleep_deficit_seconds > 0 ? 'text-emerald-400' : 'text-zinc-100'}`}>
              {stats.sleep_deficit_seconds < 0 ? '-' : '+'}{formatHours(Math.abs(stats.sleep_deficit_seconds))}
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-1">Avg Sleep</div>
            <div className="text-2xl font-bold text-zinc-100">
              {stats.average_sleep_hours.toFixed(1)}h
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {showCharts && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Activity Breakdown Bar Chart */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Activity Breakdown</h3>
              {breakdownData.labels.length > 0 ? (
                <div className="h-48">
                  <Bar
                    data={{
                      labels: breakdownData.labels,
                      datasets: [{
                        label: 'Hours',
                        data: breakdownData.data,
                        backgroundColor: breakdownData.colors,
                        borderRadius: 4,
                      }]
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { color: '#3f3f46' }, ticks: { color: '#a1a1aa' } },
                        y: { grid: { display: false }, ticks: { color: '#d4d4d8' } }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-500">
                  No data yet
                </div>
              )}
            </div>

            {/* Consistency Line Chart */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Weekly Comparison</h3>
              {consistencyChartData.labels.length > 0 ? (
                <div className="h-48">
                  <Line
                    data={{
                      labels: consistencyChartData.labels,
                      datasets: [{
                        label: 'Hours',
                        data: consistencyChartData.data,
                        borderColor: '#22c55e',
                        backgroundColor: '#22c55e20',
                        fill: true,
                        tension: 0.3,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { color: '#3f3f46' }, ticks: { color: '#a1a1aa' } },
                        y: { grid: { color: '#3f3f46' }, ticks: { color: '#a1a1aa' } }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-500">
                  No data yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Grid */}
        {!activeSession && (
          <div className="grid grid-cols-4 gap-4">
            {activities.map((activity) => {
              const Icon = getIcon(activity.icon);
              const activityStats = stats.byActivity[activity.name];
              const totalSeconds = activityStats?.total_seconds || 0;

              return (
                <motion.button
                  key={activity.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startActivity(activity)}
                  className="rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:ring-2"
                  style={{ backgroundColor: activity.color + '20', border: `1px solid ${activity.color}40` }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = activity.color)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = activity.color + '40')}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: activity.color }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-zinc-100">{activity.name}</div>
                    {totalSeconds > 0 && (
                      <div className="text-sm text-zinc-400 mt-1">
                        {formatHours(totalSeconds)}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}

            {/* Add Custom Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="rounded-xl p-6 flex flex-col items-center justify-center gap-3 bg-zinc-800/50 border border-dashed border-zinc-700 hover:border-zinc-500 transition-colors"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-700">
                <Plus className="w-7 h-7 text-zinc-400" />
              </div>
              <div className="text-center">
                <div className="font-medium text-zinc-400">Add Custom</div>
              </div>
            </motion.button>
          </div>
        )}
      </div>

      {/* Recovery Modal */}
      <AnimatePresence>
        {showRecoveryModal && recoverySession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="text-center mb-6">
                {recoverySession.activity.type === 'sleep' ? (
                  <>
                    <div className="text-6xl mb-4">😴</div>
                    <h2 className="text-xl font-semibold text-zinc-100">You were sleeping!</h2>
                    <p className="text-zinc-400 mt-2">Sleeping since {formatBedtime(recoverySession.startTime)}</p>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">⏱️</div>
                    <h2 className="text-xl font-semibold text-zinc-100">Active Session Found</h2>
                    <p className="text-zinc-400 mt-2">{recoverySession.activity.name} started at {formatBedtime(recoverySession.startTime)}</p>
                  </>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (window.deskflowAPI?.stopExternalSession) {
                      await window.deskflowAPI.stopExternalSession(recoverySession.sessionId);
                      refreshStats();
                    }
                    setShowRecoveryModal(false);
                    setRecoverySession(null);
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={() => {
                    setActiveSession(recoverySession);
                    setShowRecoveryModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors"
                >
                  Resume
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sleep Wake Up Modal */}
      <AnimatePresence>
        {showSleepModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowSleepModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <Moon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-zinc-100">Wake Up</h2>
                <p className="text-zinc-400 mt-2">When did you wake up?</p>
              </div>

              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <label className="text-sm text-zinc-400 mb-2">Hour</label>
                  <select
                    value={wakeTime.hours}
                    onChange={(e) => setWakeTime({ ...wakeTime, hours: parseInt(e.target.value) })}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-2xl text-zinc-100"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-2xl text-zinc-400 pt-6">:</span>
                <div className="flex flex-col items-center">
                  <label className="text-sm text-zinc-400 mb-2">Minute</label>
                  <select
                    value={wakeTime.minutes}
                    onChange={(e) => setWakeTime({ ...wakeTime, minutes: parseInt(e.target.value) })}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-2xl text-zinc-100"
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        {m.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSleepModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmWakeUp}
                  className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors"
                >
                  Confirm Wake Up
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Custom Activity Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 rounded-2xl p-8 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-zinc-100">Add Custom Activity</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Activity Name */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Name</label>
                <input
                  type="text"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                  placeholder="e.g., Yoga, Meditation"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                />
              </div>

              {/* Activity Type */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Type</label>
                <select
                  value={newActivity.type}
                  onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as any })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                >
                  <option value="stopwatch">Stopwatch (timed)</option>
                  <option value="sleep">Sleep</option>
                  <option value="checkin">Check-in (quick)</option>
                </select>
              </div>

              {/* Icon Selection */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setNewActivity({ ...newActivity, icon: name })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition ${
                        newActivity.icon === name 
                          ? 'bg-emerald-500/20 ring-2 ring-emerald-500' 
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-zinc-300" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewActivity({ ...newActivity, color })}
                      className={`w-8 h-8 rounded-full transition ${
                        newActivity.color === color ? 'ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Default Duration (for check-in) */}
              {newActivity.type === 'checkin' && (
                <div className="mb-4">
                  <label className="block text-sm text-zinc-400 mb-2">Default Duration (minutes)</label>
                  <select
                    value={newActivity.default_duration}
                    onChange={(e) => setNewActivity({ ...newActivity, default_duration: parseInt(e.target.value) })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCustomActivity}
                  disabled={!newActivity.name.trim()}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Activity
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}