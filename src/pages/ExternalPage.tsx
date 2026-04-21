import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Play, Pause, Square, Moon, Sun, BookOpen, Dumbbell, Activity,
  Bus, Book, Utensils, Coffee, Plus, ArrowLeft, X, ChevronDown,
  AlertTriangle, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

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

export default function ExternalPage() {
  const [activities, setActivities] = useState<ExternalActivity[]>([]);
  const [stats, setStats] = useState<ExternalStats>({ byActivity: {}, total_seconds: 0, sleep_deficit_seconds: 0, average_sleep_hours: 0 });
  const [activeSession, setActiveSession] = useState<{ sessionId: string; activityId: string; activity: ExternalActivity; startTime: Date } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [wakeTime, setWakeTime] = useState({ hours: 7, minutes: 0 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Load activities on mount
  useEffect(() => {
    if (window.deskflowAPI?.getExternalActivities) {
      window.deskflowAPI.getExternalActivities().then((data) => {
        setActivities(data);
      });
    }
  }, []);

  // Load stats
  useEffect(() => {
    if (window.deskflowAPI?.getExternalStats) {
      window.deskflowAPI.getExternalStats(selectedPeriod).then(setStats);
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
    if (activity.type === 'sleep') {
      // For sleep, start a sleep session
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
      // For stopwatch, just start the timer
      setActiveSession({
        sessionId: 'temp-' + Date.now(),
        activityId: activity.id.toString(),
        activity,
        startTime: new Date(),
      });
    } else if (activity.type === 'checkin') {
      // For check-in, record immediately with default duration
      if (window.deskflowAPI?.startExternalSession && window.deskflowAPI?.stopExternalSession) {
        const startResult = await window.deskflowAPI.startExternalSession(activity.id.toString());
        if (startResult.success) {
          await window.deskflowAPI.stopExternalSession(startResult.sessionId);
          // Refresh stats
          if (window.deskflowAPI?.getExternalStats) {
            window.deskflowAPI.getExternalStats(selectedPeriod).then(setStats);
          }
        }
      }
    }
  }, [selectedPeriod]);

  // Stop activity
  const stopActivity = useCallback(async () => {
    if (!activeSession) return;

    if (activeSession.activity.type === 'sleep') {
      setShowSleepModal(true);
    } else {
      // Just clear the timer for stopwatch
      setActiveSession(null);
      setElapsedSeconds(0);
      // Refresh stats
      if (window.deskflowAPI?.getExternalStats) {
        window.deskflowAPI.getExternalStats(selectedPeriod).then(setStats);
      }
    }
  }, [activeSession, selectedPeriod]);

  // Confirm wake up
  const confirmWakeUp = useCallback(async () => {
    if (!activeSession || activeSession.activity.type !== 'sleep') return;

    const now = new Date();
    const wakeDate = new Date();
    wakeDate.setHours(wakeTime.hours, wakeTime.minutes, 0, 0);

    // If wake time is earlier than current hour, assume it's for yesterday
    if (wakeDate > now) {
      wakeDate.setDate(wakeDate.getDate() - 1);
    }

    if (window.deskflowAPI?.stopExternalSession) {
      await window.deskflowAPI.stopExternalSession(activeSession.sessionId, wakeDate.toISOString());
    }

    setShowSleepModal(false);
    setActiveSession(null);
    setElapsedSeconds(0);

    // Refresh stats
    if (window.deskflowAPI?.getExternalStats) {
      window.deskflowAPI.getExternalStats(selectedPeriod).then(setStats);
    }
  }, [activeSession, wakeTime, selectedPeriod]);

  // Cancel sleep
  const cancelSleep = useCallback(async () => {
    if (!activeSession) return;
    setActiveSession(null);
    setElapsedSeconds(0);
    setShowSleepModal(false);
  }, [activeSession]);

  // Get today's total external time
  const todayTotal = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (window.deskflowAPI?.getExternalSessions) {
      window.deskflowAPI.getExternalSessions('today').then((sessions: ExternalSession[]) => {
        const todaySessions = sessions.filter(s => s.started_at.startsWith(today));
        const total = todaySessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        return total;
      });
    }
    return stats.total_seconds;
  }, [stats]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-zinc-100">External Tracker</h1>
        </div>
        <div className="flex items-center gap-2">
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
                  <div className="text-sm text-zinc-400 mb-1">
                    {activeSession.activity.type === 'sleep' ? 'Sleeping since' : 'Tracking'}
                  </div>
                  <div className="text-5xl font-mono font-bold text-zinc-100">
                    {formatDuration(elapsedSeconds)}
                  </div>
                  <div className="text-lg text-zinc-300 mt-2">{activeSession.activity.name}</div>
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
            <div className="text-sm text-zinc-400 mb-1">This Week</div>
            <div className="text-2xl font-bold text-zinc-100">
              {formatHours(stats.total_seconds)}
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

              <p className="text-zinc-400 text-center py-8">
                Custom activity creation coming soon...
              </p>

              <button
                onClick={() => setShowAddModal(false)}
                className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}