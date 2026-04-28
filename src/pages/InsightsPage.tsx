import { useState, useEffect, useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { BarChart3, Clock, Target, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';

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

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const CHART_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
];

export default function InsightsPage() {
  const [stats, setStats] = useState<ExternalStats>({ byActivity: {}, total_seconds: 0, sleep_deficit_seconds: 0, average_sleep_hours: 0 });
  const [consistency, setConsistency] = useState<ConsistencyData & { this_week: number; last_week: number; trend: string; streak: number }>({ score: 0, weekly_comparison: [], this_week: 0, last_week: 0, trend: 'stable', streak: 0 });
  const [sleepTrends, setSleepTrends] = useState<SleepTrend>({ daily: [], average_bedtime: '', average_wake_time: '' });
  const [bestDays, setBestDays] = useState<{ bestDay: string; worstDay: string; averages: Record<string, number> }>({ bestDay: 'Mon', worstDay: 'Sun', averages: {} });
  const [typicalDay, setTypicalDay] = useState<Array<{ hour: number; primaryActivity: string; totalSeconds: number }>>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (window.deskflowAPI?.getExternalStats) {
      window.deskflowAPI.getExternalStats(selectedPeriod === 'week' ? 'week' : 'month').then(setStats);
    }
    if (window.deskflowAPI?.getConsistencyScore) {
      window.deskflowAPI.getConsistencyScore(selectedPeriod).then(setConsistency);
    }
    if (window.deskflowAPI?.getSleepTrends) {
      window.deskflowAPI.getSleepTrends(selectedPeriod).then(setSleepTrends);
    }
    if (window.deskflowAPI?.getBestDays) {
      window.deskflowAPI.getBestDays().then(setBestDays);
    }
    if (window.deskflowAPI?.getTypicalDay) {
      window.deskflowAPI.getTypicalDay(30).then(setTypicalDay);
    }
  }, [selectedPeriod]);

  const breakdownData = useMemo(() => {
    const labels = Object.keys(stats.byActivity);
    const data = labels.map(name => (stats.byActivity[name]?.total_seconds || 0) / 3600);
    return { labels, data };
  }, [stats]);

  const sleepTrendData = useMemo(() => {
    const days = selectedPeriod === 'week' ? 7 : 30;
    const labels = [];
    const sleepData = [];
    const deficitData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      labels.push(format(date, 'MMM d'));
      const dayStr = format(date, 'yyyy-MM-dd');
      const dayData = sleepTrends.daily.find(d => d.date === dayStr);
      sleepData.push((dayData?.sleep_seconds || 0) / 3600);
      deficitData.push((dayData?.deficit_seconds || 0) / 3600);
    }
    
    return { labels, sleepData, deficitData };
  }, [sleepTrends, selectedPeriod]);

  const weeklyData = useMemo(() => {
    const labels = consistency.weekly_comparison.map(w => w.week.slice(5));
    const data = consistency.weekly_comparison.map(w => w.total_seconds / 3600);
    return { labels, data };
  }, [consistency]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-semibold text-zinc-100">Insights</h1>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Total Time</span>
            </div>
            <div className="text-2xl font-bold text-zinc-100">{formatHours(stats.total_seconds)}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-sm">Consistency</span>
            </div>
            <div className={`text-2xl font-bold ${
              consistency.score >= 70 ? 'text-emerald-400' : 
              consistency.score >= 40 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {consistency.score}%
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <span className="text-sm">Streak</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">🔥 {consistency.streak}w</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <span className="text-sm">Best Day</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{bestDays.bestDay}</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Moon className="w-4 h-4" />
              <span className="text-sm">Sleep Deficit</span>
            </div>
            <div className={`text-2xl font-bold ${
              stats.sleep_deficit_seconds < 0 ? 'text-red-400' : 
              stats.sleep_deficit_seconds > 0 ? 'text-emerald-400' : 'text-zinc-100'
            }`}>
              {stats.sleep_deficit_seconds < 0 ? '+' : '-'}{formatHours(Math.abs(stats.sleep_deficit_seconds))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-800/50 rounded-xl p-4"
          >
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Weekly Consistency</h3>
            {weeklyData.labels.length > 0 ? (
              <div className="h-56">
                <Line
                  data={{
                    labels: weeklyData.labels,
                    datasets: [
                      {
                        label: 'Hours',
                        data: weeklyData.data,
                        borderColor: '#22c55e',
                        backgroundColor: '#22c55e20',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#22c55e',
                      },
                      {
                        label: 'Target',
                        data: weeklyData.data.map(() => 30),
                        borderColor: '#6366f1',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, labels: { color: '#a1a1aa' } } },
                    scales: {
                      x: { grid: { color: '#3f3f46' }, ticks: { color: '#a1a1aa' } },
                      y: { 
                        grid: { color: '#3f3f46' }, 
                        ticks: { color: '#a1a1aa' },
                        suggestedMax: 40,
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-zinc-500">
                No data yet
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-800/50 rounded-xl p-4"
          >
            <h3 className="text-sm font-medium text-zinc-300 mb-4">Typical Day (Hourly)</h3>
            {typicalDay.length > 0 ? (
              <div className="grid grid-cols-12 gap-1">
                {typicalDay.map((slot, i) => (
                  <div key={i} className="text-center p-2 rounded bg-zinc-700/50">
                    <div className="text-xs text-zinc-500">{i}</div>
                    <div className="text-sm font-medium text-zinc-200 truncate" title={slot.primaryActivity}>
                      {slot.primaryActivity === 'none' ? '-' : slot.primaryActivity.slice(0, 4)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-zinc-500">
                No typical day data yet
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}