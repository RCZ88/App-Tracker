import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Code2,
  Terminal,
  GitBranch,
  Package,
  Cpu,
  Database,
  Cloud,
  Plus,
  Trash2,
  RefreshCw,
  ChevronDown,
  Sparkles,
  GitCommit,
  Layers,
  Boxes,
  Zap,
  Users,
  Clock,
  Activity,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, subDays, eachDayOfInterval } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, ArcElement, Tooltip, Legend, Filler);

interface Overview {
  ides: any[];
  tools: any[];
  projects: any[];
  aiUsage: { totalTokens: number; totalCost: number; byTool: Record<string, any> };
  commits: { totalCommits: number; totalAdditions: number; totalDeletions: number };
}

interface AIAgent {
  id: string;
  name: string;
  icon: string;
  color: string;
  tokens: number;
  cost: number;
  sessions: number;
  status: 'active' | 'idle' | 'inactive' | 'error';
  lastUsed?: Date;
  models: string[];
}

const CATEGORY_ICONS: Record<string, any> = {
  versionControl: GitBranch,
  runtimes: Cpu,
  packageManagers: Package,
  containers: Boxes,
  buildTools: Layers,
  databases: Database,
  cloud: Cloud,
  'npm-package': Package,
  linter: Code2,
  formatter: Code2,
  'type-checker': Code2,
  'test-runner': Zap,
  bundler: Layers,
};

const CATEGORY_LABELS: Record<string, string> = {
  versionControl: 'Version Control',
  runtimes: 'Runtimes',
  packageManagers: 'Package Managers',
  containers: 'Containers',
  buildTools: 'Build Tools',
  databases: 'Databases',
  cloud: 'Cloud & IaC',
  'npm-package': 'NPM Packages',
  linter: 'Linters',
  formatter: 'Formatters',
  'type-checker': 'Type Checkers',
  'test-runner': 'Test Runners',
  bundler: 'Bundlers',
};

const AGENT_CONFIG: Record<string, { name: string; icon: string; color: string }> = {
  'claude-code': { name: 'Claude Code', icon: 'claude', color: '#f97316' },
  'cursor': { name: 'Cursor AI', icon: 'cursor', color: '#a855f7' },
  'opencode': { name: 'OpenCode', icon: 'opencode', color: '#3b82f6' },
  'gemini': { name: 'Gemini CLI', icon: 'gemini', color: '#22c55e' },
  'codex': { name: 'Codex CLI', icon: 'codex', color: '#10b981' },
  'aider': { name: 'Aider', icon: 'aider', color: '#f59e0b' },
  'copilot': { name: 'GitHub Copilot', icon: 'copilot', color: '#6366f1' },
};

export default function IDEProjectsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [syncingAI, setSyncingAI] = useState(false);
  const [aiSyncResult, setAiSyncResult] = useState<{ success: boolean; agents: Record<string, number> } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', path: '', repositoryUrl: '' });
  const [activeTab, setActiveTab] = useState<'overview' | 'ides' | 'tools' | 'projects' | 'ai' | 'git'>('overview');
  const [commitHistory, setCommitHistory] = useState<any[]>([]);
  const [contributorStats, setContributorStats] = useState<any>(null);
  const [doraMetrics, setDoraMetrics] = useState<any>(null);
  const [syncingGit, setSyncingGit] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'git' && overview?.projects && overview.projects.length > 0) {
      if (!selectedProject) {
        setSelectedProject(overview.projects[0].id);
      }
    }
  }, [activeTab, overview, selectedProject]);

  useEffect(() => {
    if (activeTab === 'git' && selectedProject) {
      loadGitData(selectedProject);
    }
  }, [selectedProject, activeTab]);

  const loadGitData = async (projectId: string) => {
    try {
      const [commits, contributors, dora] = await Promise.all([
        window.deskflowAPI!.getCommitHistory(projectId, 50),
        window.deskflowAPI!.getContributorStats(projectId),
        window.deskflowAPI!.getDORAMetrics(projectId, 'month'),
      ]);
      setCommitHistory(commits);
      setContributorStats(contributors);
      setDoraMetrics(dora);
    } catch (err) {
      console.error('Failed to load git data:', err);
    }
  };

  const handleSyncGit = async () => {
    if (!selectedProject) return;
    setSyncingGit(true);
    try {
      const project = overview?.projects?.find((p: any) => p.id === selectedProject);
      if (project?.repository_url) {
        const urlParts = project.repository_url.replace('https://', '').split('/');
        const token = localStorage.getItem('github_token');
        await window.deskflowAPI!.syncGitHubCommits(
          selectedProject,
          urlParts[1],
          urlParts[2],
          token || undefined
        );
      } else {
        await window.deskflowAPI!.syncCommits(selectedProject, project?.path);
      }
      await loadGitData(selectedProject);
      await loadOverview();
    } catch (err) {
      console.error('Git sync failed:', err);
    }
    setSyncingGit(false);
  };

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await window.deskflowAPI!.getIDEProjectsOverview();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load IDE projects overview:', err);
    }
    setLoading(false);
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      await window.deskflowAPI!.detectIDEs();
      await window.deskflowAPI!.scanTools();
      await loadOverview();
    } catch (err) {
      console.error('Scan failed:', err);
    }
    setScanning(false);
  };

  const handleSyncAI = async () => {
    setSyncingAI(true);
    setAiSyncResult(null);
    try {
      const result = await window.deskflowAPI!.syncAIUsage() as any;
      if (result.success) {
        const agents: Record<string, number> = {};
        for (const [key, value] of Object.entries(result)) {
          if (key !== 'success' && typeof value === 'number') {
            agents[key] = value;
          }
        }
        setAiSyncResult({ success: true, agents });
        await loadOverview();
      }
    } catch (err) {
      console.error('AI sync failed:', err);
    }
    setSyncingAI(false);
  };

  const handleAddProject = async () => {
    if (!newProject.name || !newProject.path) return;

    try {
      const result = await window.deskflowAPI!.addProject(newProject);
      if (result.success) {
        setShowAddProject(false);
        setNewProject({ name: '', path: '', repositoryUrl: '' });
        await loadOverview();
      }
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    try {
      await window.deskflowAPI!.removeProject(projectId);
      await loadOverview();
    } catch (err) {
      console.error('Failed to remove project:', err);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1) return `$${amount.toFixed(2)}`;
    return `$${amount.toFixed(4)}`;
  };

  const groupToolsByCategory = (): Record<string, any[]> => {
    if (!overview?.tools) return {};
    return overview.tools.reduce((acc: Record<string, any[]>, tool: any) => {
      const cat = tool.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(tool);
      return acc;
    }, {});
  };

  const aiAgents = useMemo((): AIAgent[] => {
    const agents: AIAgent[] = [];
    const byTool = overview?.aiUsage?.byTool || {};

    for (const [agentId, data] of Object.entries(byTool)) {
      const config = AGENT_CONFIG[agentId] || { name: agentId, icon: agentId, color: '#6366f1' };
      agents.push({
        id: agentId,
        name: config.name,
        icon: config.icon,
        color: config.color,
        tokens: (data as any).tokens || 0,
        cost: (data as any).cost || 0,
        sessions: (data as any).sessions || 0,
        status: (data as any).lastUsed ? 'active' : 'idle',
        lastUsed: (data as any).lastUsed ? new Date((data as any).lastUsed) : undefined,
        models: (data as any).models || [],
      });
    }

    for (const [agentId, config] of Object.entries(AGENT_CONFIG)) {
      if (!byTool[agentId]) {
        agents.push({
          id: agentId,
          name: config.name,
          icon: config.icon,
          color: config.color,
          tokens: 0,
          cost: 0,
          sessions: 0,
          status: 'inactive',
          models: [],
        });
      }
    }

    return agents;
  }, [overview?.aiUsage?.byTool]);

  const aiChartData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    const dailyData = last30Days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      let tokens = 0;
      for (const agent of aiAgents) {
        if (overview?.aiUsage?.byTool?.[agent.id]?.daily?.[dayStr]) {
          tokens += overview.aiUsage.byTool[agent.id].daily[dayStr].tokens || 0;
        }
      }
      return { date: dayStr, label: format(day, 'MMM dd'), tokens };
    });

    return {
      labels: dailyData.map(d => d.label),
      datasets: [{
        label: 'Token Usage',
        data: dailyData.map(d => d.tokens),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
      }]
    };
  }, [aiAgents, overview?.aiUsage?.byTool]);

  const agentDistributionData = useMemo(() => {
    const activeAgents = aiAgents.filter(a => a.status !== 'inactive' && a.tokens > 0);
    return {
      labels: activeAgents.map(a => a.name),
      datasets: [{
        data: activeAgents.map(a => a.tokens),
        backgroundColor: activeAgents.map(a => a.color + 'cc'),
        borderColor: '#0a0a0a',
        borderWidth: 2,
      }]
    };
  }, [aiAgents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            IDE Projects
          </h1>
          <p className="text-zinc-500 mt-1">Track your development environment, AI tools, and project metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-zinc-500 mb-1">Actions</div>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleSyncAI}
                disabled={syncingAI}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-violet-500/25"
                title="Import AI usage data from Claude Code, Cursor, OpenCode, and more"
              >
                <Sparkles className={`w-4 h-4 ${syncingAI ? 'animate-spin' : ''}`} />
                {syncingAI ? 'Syncing...' : 'Sync AI Usage'}
              </motion.button>
              <motion.button
                onClick={handleScan}
                disabled={scanning}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-xl transition-all border border-zinc-600 disabled:opacity-50"
                title="Detect installed IDEs and developer tools"
              >
                <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                {scanning ? 'Scanning...' : 'Scan Environment'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="flex items-center gap-6 text-sm text-zinc-500 px-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>Sync AI: Import data from AI coding assistants</span>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>Scan: Detect IDEs and tools</span>
        </div>
      </div>

      {/* AI Sync Result */}
      <AnimatePresence>
        {aiSyncResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass rounded-2xl p-4 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white font-medium">AI Usage Synced</div>
              <div className="text-xs text-zinc-400">
                {Object.entries(aiSyncResult.agents).map(([agent, count]) => (
                  `${agent}: ${count} records`
                )).join(' • ')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-2xl w-fit">
        {(['overview', 'ides', 'tools', 'projects', 'ai', 'git'] as const).map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-zinc-800 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab === 'ai' ? 'AI Tools' : tab === 'git' ? 'Git' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </motion.button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'IDEs Detected', value: overview?.ides?.length || 0, icon: Monitor, color: '#3b82f6', bg: 'bg-blue-500/10' },
              { label: 'Tools Found', value: overview?.tools?.length || 0, icon: Package, color: '#10b981', bg: 'bg-emerald-500/10' },
              { label: 'AI Tokens', value: formatTokens(overview?.aiUsage?.totalTokens || 0), subValue: formatCurrency(overview?.aiUsage?.totalCost || 0), icon: Sparkles, color: '#a855f7', bg: 'bg-violet-500/10' },
              { label: 'Commits', value: overview?.commits?.totalCommits || 0, subValue: `+${overview?.commits?.totalAdditions || 0} / -${overview?.commits?.totalDeletions || 0}`, icon: GitCommit, color: '#f59e0b', bg: 'bg-amber-500/10' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-3xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <div className="text-xs text-zinc-500 font-medium">LIVE</div>
                </div>
                <div className="text-3xl font-semibold tabular-nums tracking-tight" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-400 mt-1">{stat.label}</div>
                {stat.subValue && <div className="text-xs text-zinc-500 mt-1">{stat.subValue}</div>}
              </motion.div>
            ))}
          </div>

          {/* AI & Projects Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Usage Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <div>
                    <div className="text-xl font-semibold">AI Tool Usage</div>
                    <div className="text-sm text-zinc-500">Last 30 days</div>
                  </div>
                </div>
              </div>

              {aiAgents.filter(a => a.tokens > 0).length > 0 ? (
                <>
                  <div className="h-48 mb-6">
                    <Line
                      data={aiChartData}
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
                              label: (ctx) => ` ${formatTokens(ctx.parsed.y ?? 0)} tokens`
                            }
                          }
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: '#71717a', maxTicksLimit: 7 } },
                          y: {
                            grid: { color: '#27272a' },
                            ticks: { color: '#71717a', callback: (v) => formatTokens(v as number) },
                            beginAtZero: true,
                          }
                        },
                      }}
                    />
                  </div>

                  <div className="space-y-3">
                    {aiAgents.filter(a => a.tokens > 0).map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: agent.color + '22' }}>
                            <Code2 className="w-4 h-4" style={{ color: agent.color }} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{agent.name}</div>
                            <div className="text-xs text-zinc-500">{agent.sessions} sessions</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-violet-400">{formatTokens(agent.tokens)}</div>
                          <div className="text-xs text-zinc-500">{formatCurrency(agent.cost)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No AI usage data yet</p>
                  <p className="text-sm mt-2">Sync AI to start tracking</p>
                </div>
              )}
            </motion.div>

            {/* Recent Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xl font-semibold">Recent Projects</div>
                    <div className="text-sm text-zinc-500">{overview?.projects?.length || 0} projects tracked</div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('projects')}
                  className="text-xs text-violet-400 hover:text-violet-300"
                >
                  View all →
                </button>
              </div>

              {overview?.projects && overview.projects.length > 0 ? (
                <div className="space-y-3">
                  {overview.projects.slice(0, 5).map((project: any) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl hover:bg-zinc-900/70 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{project.name}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[200px]">{project.path}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.vcs_type && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-md flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {project.vcs_type}
                          </span>
                        )}
                        {project.primary_language && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-md">
                            {project.primary_language}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No projects tracked yet</p>
                  <p className="text-sm mt-2">Add a project to get started</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* IDEs Tab */}
      {activeTab === 'ides' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {overview?.ides && overview.ides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.ides.map((ide: any, idx: number) => (
                <motion.div
                  key={ide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-3xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Monitor className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{ide.name}</h3>
                        {ide.version && <p className="text-sm text-zinc-500">v{ide.version}</p>}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg font-medium">Active</span>
                  </div>
                  {ide.installPath && (
                    <p className="text-xs text-zinc-500 font-mono truncate">{ide.installPath}</p>
                  )}
                  {ide.extensionCount && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2">
                      <Package className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-400">{ide.extensionCount} extensions</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-3xl p-12 text-center"
            >
              <Monitor className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <p className="text-lg text-zinc-400">No IDEs detected</p>
              <p className="text-sm text-zinc-500 mt-2">Click "Scan" to detect your development environments</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tools Tab */}
      {activeTab === 'tools' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {Object.entries(groupToolsByCategory()).map(([category, tools], idx) => {
            const Icon = CATEGORY_ICONS[category] || Package;
            const label = CATEGORY_LABELS[category] || category;
            const isExpanded = expandedCategories.has(category);

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-5 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-zinc-400" />
                    </div>
                    <span className="text-white font-medium">{label}</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-lg">{(tools as any[]).length}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(tools as any[]).map((tool: any) => (
                          <div
                            key={tool.id}
                            className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-xl hover:bg-zinc-900/50 transition-colors"
                          >
                            <span className="text-sm text-zinc-300">{tool.name}</span>
                            {tool.version && (
                              <span className="text-xs text-zinc-500 font-mono">v{tool.version}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {(!overview?.tools || overview.tools.length === 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-3xl p-12 text-center"
            >
              <Package className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <p className="text-lg text-zinc-400">No tools detected</p>
              <p className="text-sm text-zinc-500 mt-2">Click "Scan" to detect your development environment</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <motion.button
            onClick={() => setShowAddProject(!showAddProject)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </motion.button>

          <AnimatePresence>
            {showAddProject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-3xl p-8"
              >
                <h3 className="text-lg font-semibold text-white mb-6">Add New Project</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Project Name</label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="My Project"
                      className="w-full px-4 py-3 bg-zinc-900 text-white rounded-xl border border-zinc-700 focus:border-violet-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Project Path</label>
                    <input
                      type="text"
                      value={newProject.path}
                      onChange={(e) => setNewProject({ ...newProject, path: e.target.value })}
                      placeholder="C:\Projects\my-project"
                      className="w-full px-4 py-3 bg-zinc-900 text-white rounded-xl border border-zinc-700 focus:border-violet-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-zinc-400 mb-2">Repository URL (optional)</label>
                    <input
                      type="text"
                      value={newProject.repositoryUrl}
                      onChange={(e) => setNewProject({ ...newProject, repositoryUrl: e.target.value })}
                      placeholder="https://github.com/user/repo"
                      className="w-full px-4 py-3 bg-zinc-900 text-white rounded-xl border border-zinc-700 focus:border-violet-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowAddProject(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProject}
                    disabled={!newProject.name || !newProject.path}
                    className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all disabled:opacity-50"
                  >
                    Add Project
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {overview?.projects && overview.projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.projects.map((project: any, idx: number) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass rounded-3xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate">{project.name}</h3>
                      <p className="text-sm text-zinc-500 font-mono truncate">{project.path}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveProject(project.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.vcs_type && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg flex items-center gap-1">
                        <GitBranch className="w-3 h-3" />
                        {project.vcs_type}
                      </span>
                    )}
                    {project.primary_language && (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg">
                        {project.primary_language}
                      </span>
                    )}
                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-zinc-500 hover:text-violet-400 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-3xl p-12 text-center"
            >
              <Terminal className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <p className="text-lg text-zinc-400">No projects tracked yet</p>
              <p className="text-sm text-zinc-500 mt-2">Add a project to start tracking its metrics</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* AI Tools Tab */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* Summary Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <div>
                <span className="text-white font-medium">AI Agents</span>
                <span className="text-zinc-500 ml-2">{aiAgents.filter(a => a.status !== 'inactive').length} active</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-zinc-500">Total Tokens: </span>
                <span className="text-violet-400 font-medium">{formatTokens(overview?.aiUsage?.totalTokens || 0)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Total Cost: </span>
                <span className="text-emerald-400 font-medium">{formatCurrency(overview?.aiUsage?.totalCost || 0)}</span>
              </div>
            </div>
          </motion.div>

          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiAgents.map((agent, idx) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                className={`glass rounded-3xl p-6 cursor-pointer transition-all hover:border-violet-500/50 ${
                  selectedAgent === agent.id ? 'border-violet-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: agent.color + '22' }}
                    >
                      <Code2 className="w-5 h-5" style={{ color: agent.color }} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{agent.name}</h3>
                      <p className="text-xs text-zinc-500">{agent.models[0] || 'No model detected'}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'active' ? 'bg-emerald-400' :
                    agent.status === 'idle' ? 'bg-amber-400' :
                    agent.status === 'error' ? 'bg-red-400' : 'bg-zinc-600'
                  }`} />
                </div>

                {agent.status !== 'inactive' ? (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white tabular-nums">{formatTokens(agent.tokens)}</div>
                        <div className="text-xs text-zinc-500">Tokens</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-emerald-400 tabular-nums">{formatCurrency(agent.cost)}</div>
                        <div className="text-xs text-zinc-500">Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-400 tabular-nums">{agent.sessions}</div>
                        <div className="text-xs text-zinc-500">Sessions</div>
                      </div>
                    </div>

                    {agent.lastUsed && (
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        Last used: {format(agent.lastUsed, 'MMM dd, HH:mm')}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <span className="text-sm text-zinc-500">Not detected</span>
                    <p className="text-xs text-zinc-600 mt-1">Install {agent.name} to start tracking</p>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Coming Soon Card for GitHub Copilot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: aiAgents.length * 0.05 }}
              className="glass rounded-3xl p-6 border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">GitHub Copilot</h3>
                    <p className="text-xs text-zinc-500">CLI Integration</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-lg font-medium">Coming Soon</span>
              </div>
              <p className="text-sm text-zinc-500">
                Connect your GitHub organization to track Copilot usage including code completions and chat interactions.
              </p>
            </motion.div>
          </div>

          {/* AI Charts Section */}
          {aiAgents.filter(a => a.tokens > 0).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Token Trend Chart */}
              <div className="glass rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-violet-400" />
                  <div>
                    <div className="text-lg font-semibold">Token Usage Trend</div>
                    <div className="text-sm text-zinc-500">Last 30 days</div>
                  </div>
                </div>
                <div className="h-64">
                  <Line
                    data={aiChartData}
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
                            label: (ctx) => ` ${formatTokens(ctx.parsed.y ?? 0)} tokens`
                          }
                        }
                      },
                      scales: {
                        x: { grid: { display: false }, ticks: { color: '#71717a', maxTicksLimit: 7 } },
                        y: {
                          grid: { color: '#27272a' },
                          ticks: { color: '#71717a', callback: (v) => formatTokens(v as number) },
                          beginAtZero: true,
                        }
                      },
                    }}
                  />
                </div>
              </div>

              {/* Agent Distribution */}
              <div className="glass rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-lg font-semibold">Usage Distribution</div>
                    <div className="text-sm text-zinc-500">By AI agent</div>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center">
                  {agentDistributionData.labels.length > 0 ? (
                    <Doughnut
                      data={agentDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: { color: '#a1a1aa', padding: 16, usePointStyle: true }
                          }
                        }
                      }}
                    />
                  ) : (
                    <p className="text-zinc-500">No data yet</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Sync Button */}
          <motion.button
            onClick={handleSyncAI}
            disabled={syncingAI}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Sparkles className={`w-5 h-5 ${syncingAI ? 'animate-spin' : ''}`} />
            {syncingAI ? 'Syncing AI Data...' : 'Sync All AI Agents'}
          </motion.button>
        </div>
      )}

      {/* Git Tab */}
      {activeTab === 'git' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Project Selector & Sync */}
          <div className="glass rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-4 py-2 bg-zinc-900 text-white rounded-xl border border-zinc-700 focus:border-violet-500 focus:outline-none"
              >
                {overview?.projects?.map((project: any) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <motion.button
              onClick={handleSyncGit}
              disabled={syncingGit || !selectedProject}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <GitCommit className={`w-4 h-4 ${syncingGit ? 'animate-spin' : ''}`} />
              {syncingGit ? 'Syncing...' : 'Sync Commits'}
            </motion.button>
          </div>

          {/* DORA Metrics */}
          {doraMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-xl font-semibold">DORA Metrics</div>
                  <div className="text-sm text-zinc-500">Monthly performance</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Deploy Frequency', value: doraMetrics.deploymentFrequency, sub: `${doraMetrics.deploymentsPerDay || 0}/day` },
                  { label: 'Lead Time', value: doraMetrics.leadTime, sub: doraMetrics.avgLeadTimeHours || 'N/A' },
                  { label: 'MTTR', value: doraMetrics.mttr, sub: '~1 day est.' },
                  { label: 'Change Failure', value: doraMetrics.changeFailureRate, sub: `${doraMetrics.failureRate || 0}%` },
                ].map((metric, idx) => (
                  <div key={idx} className="bg-zinc-900/50 rounded-2xl p-4 text-center">
                    <div className={`text-2xl font-bold mb-1 ${
                      metric.value === 'elite' ? 'text-emerald-400' :
                      metric.value === 'high' ? 'text-blue-400' :
                      metric.value === 'medium' ? 'text-amber-400' :
                      metric.value === 'low' ? 'text-red-400' : 'text-zinc-400'
                    }`}>
                      {metric.value || 'N/A'}
                    </div>
                    <div className="text-sm text-zinc-400 mb-1">{metric.label}</div>
                    <div className="text-xs text-zinc-500">{metric.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Commit Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Commits', value: overview?.commits?.totalCommits || 0, icon: GitCommit, color: '#f59e0b', bg: 'bg-amber-500/10' },
              { label: 'Lines Added', value: `+${overview?.commits?.totalAdditions || 0}`, icon: Plus, color: '#10b981', bg: 'bg-emerald-500/10' },
              { label: 'Lines Removed', value: `-${overview?.commits?.totalDeletions || 0}`, icon: Trash2, color: '#ef4444', bg: 'bg-red-500/10' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass rounded-3xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                </div>
                <div className="text-3xl font-semibold tabular-nums tracking-tight" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contributors */}
            {contributorStats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-3xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-lg font-semibold">Contributors</div>
                    <div className="text-sm text-zinc-500">{contributorStats.topContributors?.length || 0} contributors</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {contributorStats.topContributors?.map((contributor: any, index: number) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
                        {contributor.author?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{contributor.author || 'Unknown'}</div>
                        <div className="text-xs text-zinc-500">{contributor.commits} commits</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-emerald-400">+{contributor.additions}</div>
                        <div className="text-xs text-red-400">-{contributor.deletions}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Commit History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <GitBranch className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-lg font-semibold">Recent Commits</div>
                  <div className="text-sm text-zinc-500">{commitHistory.length} commits</div>
                </div>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {commitHistory.length > 0 ? (
                  commitHistory.map((commit: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-zinc-900/30 rounded-xl">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{commit.message || 'No message'}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-zinc-500 font-mono">{commit.sha?.substring(0, 7)}</span>
                          <span className="text-xs text-zinc-600">•</span>
                          <span className="text-xs text-zinc-500">{commit.author}</span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 flex-shrink-0">
                        {commit.date ? format(new Date(commit.date), 'MMM dd') : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-500">
                    <GitCommit className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No commits synced yet</p>
                    <p className="text-sm mt-2">Select a project and sync</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
