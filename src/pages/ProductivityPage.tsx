import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, TrendingUp, TrendingDown, Clock, Award, Zap,
  Monitor, Globe, BarChart3, Calendar, ChevronDown, Info,
  PieChart as PieChartIcon, ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { format, subDays, eachDayOfInterval, startOfDay, isToday } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

// Website category to app category mapping
const WEBSITE_CATEGORY_MAP: Record<string, string> = {
  'Developer Tools': 'Tools', // Map to Tools for productive tier
  'AI Tools': 'AI Tools',
  'Social Media': 'Social Media',
  'Entertainment': 'Entertainment',
  'News': 'News',
  'Shopping': 'Shopping',
  'Productivity': 'Productivity',
  'Design': 'Design',
  'Search Engine': 'Productivity', // Search engines can be productive
  'Communication': 'Communication',
  'Education': 'Education',
  'Uncategorized': 'Uncategorized',
  'Other': 'Other'
};

// Default tier assignments (must match actual app categories + website categories)
const DEFAULT_TIER_ASSIGNMENTS = {
  productive: ['IDE', 'AI Tools', 'Education', 'Productivity', 'Tools'],
  neutral: ['Browser', 'Communication', 'Design', 'News', 'Search Engine', 'Uncategorized', 'Other'],
  distracting: ['Entertainment', 'Social Media', 'Shopping']
};

// Tier weights for productivity calculation
const TIER_WEIGHTS = {
  productive: 1.0,
  neutral: 0.5,
  distracting: 0.0
};

interface AppStat {
  app: string;
  category: string;
  total_ms: number;
  sessions: number;
  avg_session_ms: number;
}

interface BrowserStat {
  domain: string;
  category: string;
  total_ms: number;
  sessions: number;
}

interface ProductivityPageProps {
  appStats?: AppStat[];
  browserStats?: BrowserStat[];
  logs?: unknown[];
  browserLogs?: unknown[];
  tierAssignments?: typeof DEFAULT_TIER_ASSIGNMENTS;
  selectedPeriod?: 'today' | 'week' | 'month' | 'all';
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatHours(seconds: number): string {
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = (seconds / 3600).toFixed(1);
  return `${h}h`;
}

export default function ProductivityPage({ 
  appStats = [], 
  logs = [],
  tierAssignments = DEFAULT_TIER_ASSIGNMENTS,
  selectedPeriod = 'week'
}: ProductivityPageProps) {
  const [productivityRange, setProductivityRange] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [browserStats, setBrowserStats] = useState<BrowserStat[]>([]);
  const [browserLogs, setBrowserLogs] = useState<any[]>([]);

  // Fetch browser data - syncs with selectedPeriod from top navigation
  useEffect(() => {
    const fetchBrowserData = async () => {
      if (!window.deskflowAPI) return;
      
      try {
        const [categoryStats, logsData] = await Promise.all([
          window.deskflowAPI.getBrowserCategoryStats(selectedPeriod),
          window.deskflowAPI.getBrowserLogs(selectedPeriod)
        ]);
        
        setBrowserStats(categoryStats || []);
        setBrowserLogs(logsData || []);
      } catch (err) {
        console.warn('[Productivity] Failed to fetch browser data:', err);
      }
    };
    
    fetchBrowserData();
  }, [selectedPeriod]);

  // Calculate combined productivity data
  const productivityData = useMemo(() => {
    // Normalize app durations (ms -> seconds)
    const appItems = appStats.map(a => ({
      name: a.app,
      category: a.category,
      type: 'app' as const,
      duration_sec: a.total_ms / 1000
    }));

    // Normalize browser durations (ms -> seconds) and map categories
    const browserItems = browserStats.map(b => ({
      name: b.domain,
      category: WEBSITE_CATEGORY_MAP[b.category] || 'Other',
      originalCategory: b.category,
      type: 'website' as const,
      duration_sec: b.total_ms / 1000
    }));

    // Combine all items
    const allItems = [...appItems, ...browserItems];

    // Calculate totals by tier
    const tierTotals = {
      productive: { seconds: 0, items: [] as typeof allItems },
      neutral: { seconds: 0, items: [] as typeof allItems },
      distracting: { seconds: 0, items: [] as typeof allItems }
    };

    for (const item of allItems) {
      let assignedTier: 'productive' | 'neutral' | 'distracting' | null = null;

      if (tierAssignments.productive.includes(item.category)) {
        assignedTier = 'productive';
      } else if (tierAssignments.neutral.includes(item.category)) {
        assignedTier = 'neutral';
      } else if (tierAssignments.distracting.includes(item.category)) {
        assignedTier = 'distracting';
      } else {
        // Default to neutral if category not found
        assignedTier = 'neutral';
      }

      tierTotals[assignedTier].seconds += item.duration_sec;
      tierTotals[assignedTier].items.push(item);
    }

    // Calculate weighted score
    const totalSeconds = tierTotals.productive.seconds + tierTotals.neutral.seconds + tierTotals.distracting.seconds;
    const weightedSeconds = 
      tierTotals.productive.seconds * TIER_WEIGHTS.productive +
      tierTotals.neutral.seconds * TIER_WEIGHTS.neutral +
      tierTotals.distracting.seconds * TIER_WEIGHTS.distracting;

    const productivityScore = totalSeconds > 0 ? (weightedSeconds / totalSeconds) * 100 : 0;

    // Calculate app vs website breakdown
    const appTotalSec = appItems.reduce((sum, a) => sum + a.duration_sec, 0);
    const websiteTotalSec = browserItems.reduce((sum, b) => sum + b.duration_sec, 0);

    // Top productive items (sorted by duration)
    const topProductive = [...tierTotals.productive.items]
      .sort((a, b) => b.duration_sec - a.duration_sec)
      .slice(0, 5);

    const topDistracting = [...tierTotals.distracting.items]
      .sort((a, b) => b.duration_sec - a.duration_sec)
      .slice(0, 5);

    return {
      score: productivityScore,
      totalSeconds,
      weightedSeconds,
      appSeconds: appTotalSec,
      websiteSeconds: websiteTotalSec,
      tiers: {
        productive: { seconds: tierTotals.productive.seconds, count: tierTotals.productive.items.length },
        neutral: { seconds: tierTotals.neutral.seconds, count: tierTotals.neutral.items.length },
        distracting: { seconds: tierTotals.distracting.seconds, count: tierTotals.distracting.items.length }
      },
      topProductive,
      topDistracting,
      items: allItems
    };
  }, [appStats, browserStats, logs, browserLogs, tierAssignments]);

  // Calculate daily trend data
  const dailyTrend = useMemo(() => {
    const now = new Date();
    
    // For 'today', show hourly breakdown with 24 separate hour columns
    if (selectedPeriod === 'today') {
      const hourBuckets = Array.from({ length: 24 }, (_, hour) => {
        const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour);
        const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
        
        const hourLogs = [...(logs as any[]), ...(browserLogs as any[])].filter(log => {
          const logTime = new Date(log.timestamp || log.start_time);
          return logTime >= hourStart && logTime < hourEnd;
        });
        
        let productive = 0, neutral = 0, distracting = 0;
        
        for (const log of hourLogs) {
          const sessionStart = new Date(log.timestamp || log.start_time).getTime();
          const sessionEnd = sessionStart + ((log.duration || 0) * 1000);
          
          let currentMs = sessionStart;
          while (currentMs < sessionEnd) {
            const currentHour = new Date(currentMs).getHours();
            const segmentHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour).getTime();
            const segmentHourEnd = segmentHourStart + 3600000;
            const segmentStart = Math.max(currentMs, segmentHourStart);
            const segmentEnd = Math.min(sessionEnd, segmentHourEnd);
            const segmentSeconds = Math.max(0, (segmentEnd - segmentStart) / 1000);
            
            if (segmentSeconds > 0 && currentHour === hour) {
              const category = log.category || WEBSITE_CATEGORY_MAP[log.category] || 'Other';
              if (tierAssignments.productive.includes(category)) {
                productive += segmentSeconds;
              } else if (tierAssignments.distracting.includes(category)) {
                distracting += segmentSeconds;
              } else {
                neutral += segmentSeconds;
              }
            }
            currentMs = Math.min(currentMs + 3600000, sessionEnd);
          }
        }
        
        const total = productive + neutral + distracting;
        const weighted = productive + (neutral * 0.5);
        const score = total > 0 ? (weighted / total) * 100 : 0;
        
        return {
          date: format(hourStart, 'yyyy-MM-dd-HH'),
          label: format(hourStart, 'HH:mm'),
          hour: hour,
          score: Math.round(score),
          productive: Math.round(productive),
          neutral: Math.round(neutral),
          distracting: Math.round(distracting),
          total: Math.round(total),
          isToday: true,
          isCurrentHour: hour === now.getHours()
        };
      });
      
      return hourBuckets;
    }
    
    // For week/month/all, show daily breakdown
    const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
    const startDate = subDays(now, days - 1);
    const daysInRange = eachDayOfInterval({ start: startDate, end: now });

    return daysInRange.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      // Filter logs for this day
      const dayLogs = [...(logs as any[]), ...(browserLogs as any[])].filter(log => {
        const logTime = new Date(log.timestamp || log.start_time);
        return logTime >= dayStart && logTime < dayEnd;
      });

      // Calculate productivity for this day
      let productive = 0, neutral = 0, distracting = 0;
      
      for (const log of dayLogs) {
        const duration_sec = (log.duration || 0) / 1000;
        const category = log.category || WEBSITE_CATEGORY_MAP[log.category] || 'Other';
        
        if (tierAssignments.productive.includes(category)) {
          productive += duration_sec;
        } else if (tierAssignments.distracting.includes(category)) {
          distracting += duration_sec;
        } else {
          neutral += duration_sec;
        }
      }

      const total = productive + neutral + distracting;
      const weighted = productive + (neutral * 0.5);
      const score = total > 0 ? (weighted / total) * 100 : 0;

      return {
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, selectedPeriod === 'week' ? 'EEE' : 'MMM d'),
        score: Math.round(score),
        productive: Math.round(productive),
        neutral: Math.round(neutral),
        distracting: Math.round(distracting),
        total: Math.round(total),
        isToday: isToday(day)
      };
    });
  }, [logs, browserLogs, selectedPeriod, tierAssignments]);

  // Calculate comparison with previous period
  const comparison = useMemo(() => {
    if (dailyTrend.length < 2) return null;
    
    const currentScore = productivityData.score;
    const previousTrend = dailyTrend.slice(0, -1);
    const previousAvg = previousTrend.length > 0 
      ? previousTrend.reduce((sum, d) => sum + d.score, 0) / previousTrend.length 
      : currentScore;
    
    const diff = currentScore - previousAvg;
    const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
    
    return {
      current: currentScore,
      previous: previousAvg,
      diff: Math.abs(diff),
      direction
    };
  }, [dailyTrend, productivityData.score]);

  // Chart data for daily trend
  const trendChartData = {
    labels: dailyTrend.map(d => d.label),
    datasets: [{
      label: 'Productivity Score',
      data: dailyTrend.map(d => d.score),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: dailyTrend.map(d => d.isCurrentHour ? '#22c55e' : (d.isToday ? '#22c55e' : '#22c55e88')),
      pointBorderColor: dailyTrend.map(d => d.isCurrentHour ? '#fff' : (d.isToday ? '#fff' : 'transparent')),
      pointBorderWidth: dailyTrend.map(d => d.isCurrentHour ? 2 : (d.isToday ? 2 : 0)),
      pointRadius: dailyTrend.map(d => d.isCurrentHour ? 8 : (d.isToday ? 6 : 3)),
      pointHoverRadius: 8
    }]
  };

  // Distribution chart (pie)
  const distributionData = {
    labels: ['Productive', 'Neutral', 'Distracting'],
    datasets: [{
      data: [
        productivityData.tiers.productive.seconds,
        productivityData.tiers.neutral.seconds,
        productivityData.tiers.distracting.seconds
      ],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['#22c55e', '#3b82f6', '#ef4444'],
      borderWidth: 2
    }]
  };

  // Time breakdown bar chart
  const timeBreakdownData = {
    labels: dailyTrend.map(d => d.label),
    datasets: [
      {
        label: 'Productive',
        data: dailyTrend.map(d => d.productive),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 4
      },
      {
        label: 'Neutral',
        data: dailyTrend.map(d => d.neutral),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4
      },
      {
        label: 'Distracting',
        data: dailyTrend.map(d => d.distracting),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 4
      }
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-3">
            <Target className="w-8 h-8 text-emerald-400" />
            Productivity
          </h1>
          <p className="text-zinc-500 mt-1">Combined analysis of apps and websites</p>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="glass rounded-3xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-3xl font-bold text-white">{Math.round(productivityData.score)}</span>
            </div>
            <div>
              <div className="text-2xl font-semibold">Productivity Score</div>
              <div className="text-sm text-zinc-500">
                Based on {formatDuration(productivityData.totalSeconds)} of tracked activity
              </div>
            </div>
          </div>
          
          {comparison && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              comparison.direction === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
              comparison.direction === 'down' ? 'bg-red-500/20 text-red-400' :
              'bg-zinc-800 text-zinc-400'
            }`}>
              {comparison.direction === 'up' && <ArrowUp className="w-5 h-5" />}
              {comparison.direction === 'down' && <ArrowDown className="w-5 h-5" />}
              {comparison.direction === 'neutral' && <Minus className="w-5 h-5" />}
              <span className="font-semibold">{comparison.diff.toFixed(1)}%</span>
              <span className="text-sm opacity-70">vs avg</span>
            </div>
          )}
        </div>

        {/* Time Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-zinc-400">Productive</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-400">{formatHours(productivityData.tiers.productive.seconds)}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {productivityData.totalSeconds > 0 
                ? Math.round((productivityData.tiers.productive.seconds / productivityData.totalSeconds) * 100)
                : 0}% of time
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-sm text-zinc-400">Neutral</span>
            </div>
            <div className="text-2xl font-semibold text-blue-400">{formatHours(productivityData.tiers.neutral.seconds)}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {productivityData.totalSeconds > 0 
                ? Math.round((productivityData.tiers.neutral.seconds / productivityData.totalSeconds) * 100)
                : 0}% of time
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-red-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-sm text-zinc-400">Distracting</span>
            </div>
            <div className="text-2xl font-semibold text-red-400">{formatHours(productivityData.tiers.distracting.seconds)}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {productivityData.totalSeconds > 0 
                ? Math.round((productivityData.tiers.distracting.seconds / productivityData.totalSeconds) * 100)
                : 0}% of time
            </div>
          </div>

          <div className="bg-zinc-900/50 rounded-2xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-sm text-zinc-400">Total Time</span>
            </div>
            <div className="text-2xl font-semibold text-purple-400">{formatDuration(productivityData.totalSeconds)}</div>
            <div className="text-xs text-zinc-500 mt-1">
              {productivityData.tiers.productive.count + productivityData.tiers.neutral.count + productivityData.tiers.distracting.count} items
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trend */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Productivity Trend
            </h2>
          </div>
          <div className="h-64">
            <Line 
              data={trendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#a1a1aa',
                    borderColor: '#3f3f46',
                    borderWidth: 1,
                    callbacks: {
                      label: (ctx) => ` Score: ${ctx.parsed.y}%`
                    }
                  }
                },
                scales: {
                  x: {
                    grid: { color: '#27272a' },
                    ticks: { color: '#71717a' }
                  },
                  y: {
                    min: 0,
                    max: 100,
                    grid: { color: '#27272a' },
                    ticks: { 
                      color: '#71717a',
                      callback: (v) => `${v}%`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Time Distribution */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-emerald-400" />
              Time Distribution
            </h2>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Pie 
              data={distributionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#a1a1aa', padding: 20 }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    callbacks: {
                      label: (ctx) => {
                        const seconds = ctx.raw as number;
                        return ` ${formatDuration(seconds)}`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Apps vs Websites Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apps Breakdown */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-indigo-400" />
              Desktop Apps
            </h2>
            <div className="text-sm text-zinc-500">
              {formatDuration(productivityData.appSeconds)} ({productivityData.totalSeconds > 0 
                ? Math.round((productivityData.appSeconds / productivityData.totalSeconds) * 100)
                : 0}%)
            </div>
          </div>
          
          <div className="space-y-3">
            {productivityData.topProductive.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium text-white">{item.name}</span>
                </div>
                <div className="text-sm text-zinc-400">{formatDuration(item.duration_sec)}</div>
              </div>
            ))}
            {productivityData.topProductive.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No app data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Websites Breakdown */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Websites
            </h2>
            <div className="text-sm text-zinc-500">
              {formatDuration(productivityData.websiteSeconds)} ({productivityData.totalSeconds > 0 
                ? Math.round((productivityData.websiteSeconds / productivityData.totalSeconds) * 100)
                : 0}%)
            </div>
          </div>
          
          <div className="space-y-3">
            {productivityData.topProductive
              .filter(i => i.type === 'website')
              .slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-sm font-medium text-white truncate max-w-[200px]">{item.name}</span>
                  </div>
                  <div className="text-sm text-zinc-400">{formatDuration(item.duration_sec)}</div>
                </div>
              ))}
            {productivityData.topProductive.filter(i => i.type === 'website').length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No website data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Stacked Bar Chart */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Daily Activity Breakdown
          </h2>
        </div>
        <div className="h-64">
          <Bar 
            data={timeBreakdownData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { color: '#a1a1aa', padding: 20 }
                },
                tooltip: {
                  backgroundColor: 'rgba(24, 24, 27, 0.95)',
                  callbacks: {
                    label: (ctx) => {
                      const label = ctx.dataset.label || '';
                      return ` ${label}: ${formatDuration(ctx.raw as number)}`;
                    }
                  }
                }
              },
              scales: {
                x: {
                  stacked: true,
                  grid: { display: false },
                  ticks: { color: '#71717a' }
                },
                y: {
                  stacked: true,
                  grid: { color: '#27272a' },
                  ticks: { 
                    color: '#71717a',
                    callback: (v) => formatHours(v as number)
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Top Distracting */}
      {productivityData.topDistracting.length > 0 && (
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Areas to Improve
            </h2>
            <div className="text-sm text-zinc-500">
              Distracting activities that reduced your score
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productivityData.topDistracting.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    {item.type === 'app' ? (
                      <Monitor className="w-4 h-4 text-red-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-red-400">{formatDuration(item.duration_sec)}</div>
                  <div className="text-xs text-zinc-500">
                    {productivityData.totalSeconds > 0 
                      ? Math.round((item.duration_sec / productivityData.totalSeconds) * 100)
                      : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Card */}
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            Insights
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-zinc-400">Focus Time</span>
            </div>
            <div className="text-2xl font-semibold text-white">
              {formatDuration(productivityData.tiers.productive.seconds)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Time spent on productive activities
            </div>
          </div>

          <div className="p-4 bg-zinc-900/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-zinc-400">Weighted Score</span>
            </div>
            <div className="text-2xl font-semibold text-white">
              {Math.round(productivityData.score)}%
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Productive + 50% Neutral
            </div>
          </div>

          <div className="p-4 bg-zinc-900/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-zinc-400">Total Tracked</span>
            </div>
            <div className="text-2xl font-semibold text-white">
              {formatDuration(productivityData.totalSeconds)}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Apps + Websites combined
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Explanation */}
      <details className="glass rounded-3xl p-6">
        <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white">
          How is productivity calculated?
        </summary>
        <div className="mt-4 p-4 bg-zinc-900/50 rounded-xl text-sm text-zinc-300 space-y-2">
          <p><strong>Formula:</strong></p>
          <code className="block bg-zinc-800 p-2 rounded text-emerald-400">
            Score = (Productive + Neutral × 0.5) / Total × 100
          </code>
          <p className="mt-4"><strong>Tier Weights:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><span className="text-emerald-400">Productive</span> = 100% credit (weight: 1.0)</li>
            <li><span className="text-blue-400">Neutral</span> = 50% credit (weight: 0.5)</li>
            <li><span className="text-red-400">Distracting</span> = 0% credit (weight: 0.0)</li>
          </ul>
          <p className="mt-4"><strong>Data Sources:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Desktop apps from activity tracking</li>
            <li>Websites from browser activity tracking</li>
            <li>Categories mapped using tier assignments from Settings</li>
          </ul>
        </div>
      </details>
    </motion.div>
  );
}
