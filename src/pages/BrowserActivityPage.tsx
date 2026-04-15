import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, BarChart3, Clock, TrendingUp, AlertCircle, RefreshCw, X, ChevronRight, Activity } from 'lucide-react';
import { Pie, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Category colors matching the app's planet color system
const CATEGORY_COLORS: Record<string, string> = {
  'Developer Tools': '#10b981',
  'AI Tools': '#8b5cf6',
  'Social Media': '#f97316',
  'Entertainment': '#ef4444',
  'News': '#eab308',
  'Shopping': '#ec4899',
  'Productivity': '#3b82f6',
  'Design': '#a855f7',
  'Search Engine': '#64748b',
  'Communication': '#14b8a6',
  'Education': '#06b6d4',
  'Uncategorized': '#78716c',
  'Other': '#78716c'
};

const CATEGORIES = ['Developer Tools', 'AI Tools', 'Social Media', 'Entertainment', 'News', 'Shopping', 'Productivity', 'Design', 'Search Engine', 'Communication', 'Education', 'Uncategorized', 'Other'];

function formatDuration(ms: number): string {
  if (ms < 60000) {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  }
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}h ${mins}m`;
}

interface BrowserActivityPageProps {
  selectedPeriod?: 'today' | 'week' | 'month' | 'all';
}

export default function BrowserActivityPage({ selectedPeriod = 'week' }: BrowserActivityPageProps) {
  const [domainStats, setDomainStats] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [browserLogs, setBrowserLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDomainDetail, setSelectedDomainDetail] = useState<any>(null);
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());

  const toggleExpanded = (domain: string) => {
    setExpandedDomains(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domain)) {
        newSet.delete(domain);
      } else {
        newSet.add(domain);
      }
      return newSet;
    });
  };

  // Aggregate browser logs by domain
  const aggregatedLogs = useMemo(() => {
    const grouped: Record<string, { sessions: any[]; totalDuration: number }> = {};
    
    browserLogs.forEach(log => {
      const domain = log.domain;
      if (!grouped[domain]) {
        grouped[domain] = { sessions: [], totalDuration: 0 };
      }
      grouped[domain].sessions.push(log);
      grouped[domain].totalDuration += log.duration_ms || 0;
    });
    
    return Object.entries(grouped)
      .map(([domain, data]) => ({
        domain,
        sessions: data.sessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        totalDuration: data.totalDuration,
        category: data.sessions[0]?.category || 'Other'
      }))
      .sort((a, b) => b.totalDuration - a.totalDuration);
  }, [browserLogs]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.deskflowAPI) {
        setError('DeskFlow API not available');
        setLoading(false);
        return;
      }

      const [domains, categories, logs] = await Promise.all([
        window.deskflowAPI!.getBrowserDomainStats(selectedPeriod),
        window.deskflowAPI!.getBrowserCategoryStats(selectedPeriod),
        window.deskflowAPI!.getBrowserLogs(selectedPeriod)
      ]);

      setDomainStats(domains || []);
      setCategoryStats(categories || []);
      setBrowserLogs(logs || []);
    } catch (err: any) {
      console.error('[BrowserActivity] Error fetching data:', err);
      setError(err.message || 'Failed to load browser data');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Fetch data on mount and when period changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCategoryChange = async (domain: string, category: string) => {
    try {
      if (window.deskflowAPI?.setDomainCategory) {
        await window.deskflowAPI.setDomainCategory(domain, category);
        console.log(`[BrowserActivity] Updated ${domain} to ${category}`);
        // Refresh data to see changes
        fetchData();
      }
    } catch (err) {
      console.error('[BrowserActivity] Failed to update category:', err);
    }
    setEditingDomain(null);
    setSelectedCategory('');
  };

  const startEditCategory = (domain: string, currentCategory: string) => {
    setEditingDomain(domain);
    setSelectedCategory(currentCategory);
  };

  // Domain breakdown chart data
  const domainChartData = useMemo(() => {
    const top10 = domainStats.slice(0, 10);
    return {
      labels: top10.map(d => d.domain),
      datasets: [{
        label: 'Time Spent',
        data: top10.map(d => Math.round(d.total_ms / 60000)), // Convert to minutes
        backgroundColor: top10.map(d => CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other']),
        borderColor: top10.map(d => CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other']),
        borderWidth: 1,
        borderRadius: 6
      }]
    };
  }, [domainStats]);

  // Category pie chart data
  const categoryChartData = useMemo(() => {
    return {
      labels: categoryStats.map(c => c.category),
      datasets: [{
        data: categoryStats.map(c => Math.round(c.total_ms / 60000)),
        backgroundColor: categoryStats.map(c => CATEGORY_COLORS[c.category] || CATEGORY_COLORS['Other']),
        borderColor: '#18181b',
        borderWidth: 2
      }]
    };
  }, [categoryStats]);

  const domainBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${formatDuration(ctx.raw * 60000)}`,
          title: (items: any) => items[0]?.label || ''
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#71717a',
          callback: (value: any) => `${value}m`
        },
        grid: { color: '#27272a' }
      },
      x: {
        ticks: { color: '#a1a1aa', maxRotation: 45 },
        grid: { display: false }
      }
    }
  };

  const categoryPieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: '#d4d4d8', padding: 15, font: { size: 12 } }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${formatDuration(ctx.raw * 60000)}`
        }
      }
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-96"
      >
        <div className="text-center">
          <RefreshCw className="mx-auto w-12 h-12 mb-4 text-zinc-500 animate-spin" />
          <div className="text-zinc-400">Loading browser activity...</div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-96"
      >
        <div className="text-center">
          <AlertCircle className="mx-auto w-12 h-12 mb-4 text-red-500" />
          <div className="text-red-400 font-medium">Error loading browser data</div>
          <div className="text-sm text-zinc-500 mt-2">{error}</div>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-sm transition"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  // Total browser time
  const totalBrowserTime = domainStats.reduce((sum, d) => sum + d.total_ms, 0);
  const totalSessions = domainStats.reduce((sum, d) => sum + d.sessions, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Globe className="text-blue-500" />
            Browser Activity
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Track your browsing habits by domain and category</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 text-sm flex items-center gap-2 transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="text-blue-500" size={20} />
            <span className="text-sm text-zinc-400">Total Browsing Time</span>
          </div>
          <div className="text-3xl font-bold font-mono">{formatDuration(totalBrowserTime)}</div>
          <div className="text-xs text-zinc-500 mt-1">Across all sessions</div>
        </div>

        <div className="glass rounded-3xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="text-emerald-500" size={20} />
            <span className="text-sm text-zinc-400">Unique Domains</span>
          </div>
          <div className="text-3xl font-bold font-mono">{domainStats.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Different websites visited</div>
        </div>

        <div className="glass rounded-3xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-purple-500" size={20} />
            <span className="text-sm text-zinc-400">Browsing Sessions</span>
          </div>
          <div className="text-3xl font-bold font-mono">{totalSessions}</div>
          <div className="text-xs text-zinc-500 mt-1">Total tab switches</div>
        </div>
      </div>

      {/* Charts Row */}
      {categoryStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown Pie */}
          <div className="glass rounded-3xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-zinc-400" />
              Time by Category
            </h2>
            <div className="h-72">
              <Pie data={categoryChartData} options={categoryPieOptions} />
            </div>
          </div>

          {/* Top Domains Bar Chart */}
          <div className="glass rounded-3xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-zinc-400" />
              Top Domains
            </h2>
            <div className="h-72">
              <Bar data={domainChartData} options={domainBarOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity - Aggregated by domain with dropdown */}
      <div className="glass rounded-3xl p-6 border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          {aggregatedLogs.length > 0 && (
            <span className="text-xs text-zinc-500">{aggregatedLogs.length} sites</span>
          )}
        </div>
        {aggregatedLogs.length === 0 ? (
          <div className="text-center py-4 text-zinc-500">
            No recent browsing activity
          </div>
        ) : (
          <div className="space-y-2">
            {aggregatedLogs.slice(0, 6).map((item, idx) => {
              const isExpanded = expandedDomains.has(item.domain);
              return (
                <motion.div
                  key={item.domain}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="bg-zinc-900/50 rounded-xl hover:bg-zinc-800/50 transition"
                >
                  <div 
                    className="flex items-center justify-between py-2 px-4 cursor-pointer"
                    onClick={() => toggleExpanded(item.domain)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Other'] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{item.domain}</div>
                        {item.sessions.length > 1 && (
                          <div className="text-xs text-zinc-500">{item.sessions.length} sessions</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4 flex items-center gap-3">
                      <div>
                        <div className="text-sm font-mono text-white">{formatDuration(item.totalDuration)}</div>
                        <div className="text-xs text-zinc-500">
                          {format(new Date(item.sessions[0]?.timestamp || Date.now()), 'HH:mm')}
                        </div>
                      </div>
                      <ChevronRight 
                        className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                      />
                    </div>
                  </div>
                  {isExpanded && item.sessions.length > 1 && (
                    <div className="px-4 pb-3 border-t border-zinc-800/50">
                      <div className="pt-2 space-y-1">
                        {item.sessions.slice(0, 5).map((session, sidx) => (
                          <div key={sidx} className="flex items-center justify-between text-xs">
                            <div className="text-zinc-400 truncate max-w-[200px]">
                              {session.title || session.url || session.domain}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-zinc-300">{formatDuration(session.duration_ms)}</span>
                              <span className="text-zinc-600">
                                {format(new Date(session.timestamp), 'HH:mm')}
                              </span>
                            </div>
                          </div>
                        ))}
                        {item.sessions.length > 5 && (
                          <div className="text-xs text-zinc-500 pt-1">
                            +{item.sessions.length - 5} more sessions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Domain Breakdown - Grid Layout */}
      <div className="glass rounded-3xl p-6 border border-zinc-800">
        <h2 className="text-lg font-semibold mb-4">Domain Breakdown</h2>
        {domainStats.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Globe className="mx-auto w-12 h-12 mb-3 text-zinc-700" />
            <div>No browsing data yet</div>
            <div className="text-xs mt-1">Install the browser extension and start browsing to see data here</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainStats.map((d, i) => (
              <motion.div
                key={d.domain}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 hover:border-zinc-700 cursor-pointer transition"
                onClick={() => setSelectedDomainDetail(d)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other'] }}
                    />
                    <div className="font-medium text-white truncate">{d.domain}</div>
                  </div>
                  <div
                    className="px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other']}20`,
                      color: CATEGORY_COLORS[d.category] || CATEGORY_COLORS['Other']
                    }}
                  >
                    {d.category}
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Time</span>
                    <span className="font-mono text-white">{formatDuration(d.total_ms)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sessions</span>
                    <span className="font-mono text-emerald-400">{d.sessions}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Domain Detail Modal */}
      <AnimatePresence>
        {selectedDomainDetail && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 p-8"
            onClick={() => setSelectedDomainDetail(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-3xl p-8 w-full max-w-3xl max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: (CATEGORY_COLORS[selectedDomainDetail.category] || CATEGORY_COLORS['Other']) + '22' }}
                  >
                    <Globe
                      className="w-7 h-7"
                      style={{ color: CATEGORY_COLORS[selectedDomainDetail.category] || CATEGORY_COLORS['Other'] }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedDomainDetail.domain}</h2>
                    <div className="text-sm" style={{ color: CATEGORY_COLORS[selectedDomainDetail.category] || CATEGORY_COLORS['Other'] }}>
                      {selectedDomainDetail.category}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedDomainDetail(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Time', value: formatDuration(selectedDomainDetail.total_ms), icon: Clock, color: 'text-emerald-400' },
                  { label: 'Sessions', value: selectedDomainDetail.sessions, icon: Activity, color: 'text-indigo-400' },
                  { label: 'Avg Session', value: formatDuration(selectedDomainDetail.total_ms / selectedDomainDetail.sessions), icon: TrendingUp, color: 'text-amber-400' },
                  { label: 'First Seen', value: selectedDomainDetail.first_seen ? format(new Date(selectedDomainDetail.first_seen), 'MMM dd') : 'N/A', icon: BarChart3, color: 'text-violet-400' },
                ].map((metric, idx) => (
                  <div key={idx} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
                    <metric.icon className={`w-5 h-5 ${metric.color} mb-2`} />
                    <div className={`text-xl font-semibold tabular-nums ${metric.color}`}>{metric.value}</div>
                    <div className="text-xs text-zinc-500 mt-1">{metric.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
