import { useEffect, useState, useCallback, useRef } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Plus, X, Monitor, Play, Trash2, Clock, FolderOpen, Zap, Settings, PanelLeftClose, PanelLeft, GripVertical, Info, PieChart } from 'lucide-react';
import { TerminalLayout, PaneNode } from '../components/TerminalWindow';
import { useTerminalLayout } from '../hooks/useTerminalLayout';
import '@xterm/xterm/css/xterm.css';

function generateTerminalId(): string {
  return `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface Preset {
  id: string;
  name: string;
  command: string;
  category?: string;
}

interface Session {
  id: string;
  agent: string;
  topic: string;
  resume_id?: string;
  started_at: string;
  total_cost_usd?: number;
}

const loggedErrors = new Set<string>();

function logOnce(key: string, message: string, ...args: any[]) {
  if (!loggedErrors.has(key)) {
    loggedErrors.add(key);
    console.warn(message, ...args);
  }
}

export default function TerminalPage({ projectId: propProjectId }: { projectId?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'presets' | 'sessions' | 'map' | 'analytics'>(() => {
    const saved = localStorage.getItem('terminal-activeTab');
    return (saved as any) || 'presets';
  });
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPreset, setNewPreset] = useState({ name: '', command: '', category: '' });
  const [projects, setProjects] = useState<{ id: string; name: string; path: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(propProjectId || '');
  const [hoveredPane, setHoveredPane] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<{ totalTokens: number; totalCost: number; byTool: Record<string, any> | null } | null>(null);

  // Persistent layout for this project
  const effectiveProjectId = propProjectId || selectedProject;
  const { layout: terminalLayout, setLayout: setTerminalLayout, isLoading: layoutLoading, resetLayout } = useTerminalLayout(
    effectiveProjectId || null,
    { id: 'root', type: 'leaf', terminalId: 'term-initial', size: 50 }
  );

  const loadPresets = useCallback(async () => {
    if (!window.deskflowAPI) return;
    try {
      const data = await window.deskflowAPI.getTerminalPresets(selectedProject || undefined);
      setPresets(data || []);
    } catch (e) {
      logOnce('terminal-presets', '[TerminalPage] Failed to load presets:', e);
    }
  }, [selectedProject]);

  const loadSessions = useCallback(async () => {
    if (!window.deskflowAPI) return;
    try {
      const data = await window.deskflowAPI.getTerminalSessions(selectedProject || undefined, 20);
      setSessions(data || []);
    } catch (e) {
      logOnce('terminal-sessions', '[TerminalPage] Failed to load sessions:', e);
    }
  }, [selectedProject]);

  const loadProjects = useCallback(async () => {
    if (!window.deskflowAPI) return;
    try {
      const data = await window.deskflowAPI.getProjects();
      setProjects(data || []);
    } catch (e) {
      logOnce('terminal-projects', '[TerminalPage] Failed to load projects:', e);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    // Load project from localStorage if no propProjectId
    if (!propProjectId) {
      const stored = localStorage.getItem('terminal-project');
      if (stored) setSelectedProject(stored);
    }
  }, [loadProjects]);

  useEffect(() => {
    if (activeTab === 'presets') {
      loadPresets();
    } else if (activeTab === 'sessions') {
      loadSessions();
    } else if (activeTab === 'map' && window.deskflowAPI) {
      window.deskflowAPI.getAIUsageSummary('day').then(setAiSummary).catch(() => {});
    }
  }, [activeTab, selectedProject, loadPresets, loadSessions]);

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('terminal-activeTab', activeTab);
  }, [activeTab]);

  const spawnTerminal = useCallback(async (terminalId: string, cwd?: string) => {
    console.log('[TerminalPage] spawnTerminal called:', terminalId, cwd);
    if (!window.deskflowAPI) {
      console.log('[TerminalPage] No deskflowAPI!');
      return false;
    }
    try {
      const result = await window.deskflowAPI.spawnTerminal(terminalId, cwd || '');
      console.log('[TerminalPage] spawnTerminal result:', result);
      if (!result.success) {
        logOnce('terminal-spawn', '[TerminalPage] Failed to spawn shell:', result.error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[TerminalPage] spawnTerminal error:', e);
      logOnce('terminal-spawn', '[TerminalPage] Failed to spawn terminal:', e);
      return false;
    }
  }, []);

  const handleLayoutChange = useCallback((layout: PaneNode) => {
    setTerminalLayout(layout);
  }, []);

  const flattenPanes = useCallback((node: PaneNode): PaneNode[] => {
    if (node.type === 'leaf') {
      return [node];
    }
    if (node.children) {
      return node.children.flatMap(flattenPanes);
    }
    return [];
  }, []);

  const handleAddPreset = useCallback(async () => {
    if (!window.deskflowAPI || !newPreset.name || !newPreset.command) return;
    try {
      const result = await window.deskflowAPI.addTerminalPreset({
        projectId: selectedProject || undefined,
        name: newPreset.name,
        command: newPreset.command,
        category: newPreset.category || undefined,
      });
      if (result.success) {
        setNewPreset({ name: '', command: '', category: '' });
        setShowAddPreset(false);
        loadPresets();
      } else {
        logOnce('terminal-add-preset', '[TerminalPage] Failed to add preset:', result.error);
      }
    } catch (e) {
      logOnce('terminal-add-preset', '[TerminalPage] Failed to add preset:', e);
    }
  }, [newPreset, selectedProject, loadPresets]);

  const handleRemovePreset = useCallback(async (presetId: string) => {
    if (!window.deskflowAPI) return;
    try {
      await window.deskflowAPI.removeTerminalPreset(presetId);
      loadPresets();
    } catch (e) {
      console.warn('[TerminalPage] Failed to remove preset:', e);
    }
  }, [loadPresets]);

  const handleExecutePreset = useCallback(async (preset: Preset) => {
    if (!window.deskflowAPI) return;
    try {
      await window.deskflowAPI.executeTerminalPreset(preset.id);
    } catch (e) {
      console.warn('[TerminalPage] Failed to execute preset:', e);
    }
  }, []);

  const handleResumeSession = useCallback(async (session: Session) => {
    if (!window.deskflowAPI || !session.resume_id) return;
    try {
      const resumeId = await window.deskflowAPI.getTerminalSessionResumeId(session.id);
      if (resumeId) {
        const command = session.agent === 'claude' || session.agent === 'Claude Code'
          ? `claude resume ${resumeId}`
          : `opencode resume ${resumeId}`;
        window.deskflowAPI.writeTerminal('active', command + '\n');
      }
    } catch (e) {
      console.warn('[TerminalPage] Failed to resume session:', e);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex bg-black text-white">
      {/* Main Terminal Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">DeskFlow Terminal</span>
            {projects.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {selectedProject && projects.find(p => p.id === selectedProject) && (
                    <div className="text-xs text-zinc-500 mt-1 flex gap-2">
                      <span>{projects.find(p => p.id === selectedProject)?.primary_language}</span>
                      <span>{projects.find(p => p.id === selectedProject)?.vcs_type}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={async () => {
                    console.log('[TerminalPage] Open Terminal clicked, selectedProject:', selectedProject);
                    if (!selectedProject) {
                      alert('Please select a project first');
                      return;
                    }
                    const proj = projects.find(p => p.id === selectedProject);
                    console.log('[TerminalPage] Found project:', proj);
                    if (proj) {
                      // Add terminal to layout first
                      const termId = `term-${Date.now()}`;
                      const newPane = {
                        id: termId,
                        type: 'leaf' as const,
                        terminalId: termId,
                        size: 50
                      };
                      
                      // If layout is a single leaf, convert to split
                      if (terminalLayout && terminalLayout.type === 'leaf') {
                        const newLayout = {
                          id: 'root',
                          type: 'split' as const,
                          splitType: 'horizontal' as const,
                          direction: 'right' as const,
                          size: 100,
                          children: [terminalLayout, newPane]
                        };
                        setTerminalLayout(newLayout);
                      } else {
                        // Add to existing split layout
                        // For simplicity, just create a new split layout
                        const newLayout = {
                          id: 'root',
                          type: 'split' as const,
                          splitType: 'horizontal' as const,
                          direction: 'right' as const,
                          size: 100,
                          children: [terminalLayout || { id: 'root', type: 'leaf' as const, terminalId: 'term-initial', size: 50 }, newPane]
                        };
                        setTerminalLayout(newLayout);
                      }
                      
                      // Then spawn the terminal
                      console.log('[TerminalPage] Calling spawnTerminal with:', termId, proj.path);
                      await spawnTerminal(termId, proj.path);
                    }
                  }}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Open Terminal
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 relative">
          <TerminalLayout spawnTerminal={spawnTerminal} onLayoutChange={handleLayoutChange} />
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs p-2 rounded">
            Terminal Layout: {terminalLayout ? `${terminalLayout.type} (${terminalLayout.terminalId || 'split'})` : 'null'}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-72 bg-zinc-900 border-l border-zinc-800 flex flex-col">
          {/* Sidebar Header with Collapse Button */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-800">
            <span className="text-xs text-zinc-500 font-medium">Terminal</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Tab Headers */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === 'presets' ? 'text-green-400 border-b-2 border-green-500' : 'text-zinc-400'
              }`}
            >
              <Zap className="w-3 h-3 inline mr-1" />
              Presets
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === 'sessions' ? 'text-green-400 border-b-2 border-green-500' : 'text-zinc-400'
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              Sessions
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === 'map' ? 'text-green-400 border-b-2 border-green-500' : 'text-zinc-400'
              }`}
            >
              <Monitor className="w-3 h-3 inline mr-1" />
              Map
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-3 py-2 text-xs font-medium ${
                activeTab === 'analytics' ? 'text-green-400 border-b-2 border-green-500' : 'text-zinc-400'
              }`}
            >
              <PieChart className="w-3 h-3 inline mr-1" />
              Stats
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* Project Stats */}
            {selectedProject && projects.find(p => p.id === selectedProject) && (
              <div className="mb-4 p-2 bg-zinc-800/50 rounded-lg">
                <div className="text-xs text-zinc-400 mb-2">Project Stats</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Language:</span>
                    <span className="text-zinc-300">{projects.find(p => p.id === selectedProject)?.primary_language || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">VCS:</span>
                    <span className="text-zinc-300">{projects.find(p => p.id === selectedProject)?.vcs_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">IDE:</span>
                    <span className="text-zinc-300">{projects.find(p => p.id === selectedProject)?.default_ide || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'presets' && (
              <div>
                <button
                  onClick={() => setShowAddPreset(true)}
                  className="w-full mb-2 px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Preset
                </button>

                {showAddPreset && (
                  <div className="mb-2 p-2 bg-zinc-800 rounded">
                    <input
                      type="text"
                      placeholder="Name (e.g., 'Run Tests')"
                      value={newPreset.name}
                      onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                      className="w-full mb-2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Command (e.g., 'npm test')"
                      value={newPreset.command}
                      onChange={(e) => setNewPreset({ ...newPreset, command: e.target.value })}
                      className="w-full mb-2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Category (optional)"
                      value={newPreset.category}
                      onChange={(e) => setNewPreset({ ...newPreset, category: e.target.value })}
                      className="w-full mb-2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-xs"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleAddPreset}
                        className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setShowAddPreset(false); setNewPreset({ name: '', command: '', category: '' }); }}
                        className="flex-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {presets.length === 0 ? (
                  <p className="text-xs text-zinc-500">No presets yet. Add one to get started.</p>
                ) : (
                  presets.map((preset) => (
                    <div key={preset.id} className="mb-2 p-2 bg-zinc-800 rounded group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-200">{preset.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleExecutePreset(preset)}
                            className="p-1 hover:bg-zinc-700 rounded"
                            title="Run"
                          >
                            <Play className="w-3 h-3 text-green-400" />
                          </button>
                          <button
                            onClick={() => handleRemovePreset(preset.id)}
                            className="p-1 hover:bg-zinc-700 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 font-mono truncate">{preset.command}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div>
                {sessions.length === 0 ? (
                  <p className="text-xs text-zinc-500">No sessions yet.</p>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="mb-2 p-2 bg-zinc-800 rounded group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-200">{session.agent}</span>
                        {session.resume_id && (
                          <button
                            onClick={() => handleResumeSession(session)}
                            className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-green-200 text-xs rounded opacity-0 group-hover:opacity-100"
                          >
                            Resume
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500">{session.topic || 'No topic'}</div>
                      <div className="text-xs text-zinc-600 mt-1">
                        {formatDate(session.started_at)}
                        {session.total_cost_usd !== undefined && (
                          <span className="ml-2">${session.total_cost_usd.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'map' && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">Visual map of terminal panes</p>
                {!terminalLayout ? (
                  <p className="text-xs text-zinc-600">No terminals open</p>
                ) : (
                  <div className="relative w-full aspect-square bg-zinc-900 rounded border border-zinc-700">
                    <div className="absolute inset-2 grid grid-cols-2 gap-1">
                      {flattenPanes(terminalLayout).map((pane, idx) => (
                        <button
                          key={pane.id}
                          className={`relative bg-zinc-800 rounded border ${
                            hoveredPane === pane.id ? 'border-green-500' : 'border-zinc-700'
                          } hover:border-green-500 cursor-pointer transition-colors`}
                          onMouseEnter={() => setHoveredPane(pane.id)}
                          onMouseLeave={() => setHoveredPane(null)}
                          onClick={() => {
                            window.dispatchEvent(new CustomEvent('focus-terminal', { detail: { terminalId: pane.terminalId || pane.id } }));
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] text-zinc-500">T{idx + 1}</span>
                          </div>
                          {hoveredPane === pane.id && (
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-700 text-zinc-200 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                              <div className="font-medium">{pane.terminalId || pane.id}</div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <p className="text-xs text-zinc-500 mb-3">AI Usage Summary</p>
                
                {/* Today's Overview */}
                <div className="mb-4 p-3 bg-zinc-800 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-2">Today</div>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {aiSummary?.totalTokens?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-zinc-500">Tokens</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-400">
                        ${aiSummary?.totalCost?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-zinc-500">Cost</div>
                    </div>
                  </div>
                </div>

                {/* By Agent Breakdown */}
                <div className="p-3 bg-zinc-800 rounded-lg">
                  <div className="text-xs text-zinc-500 mb-2">By Agent</div>
                  {!aiSummary?.byTool || Object.keys(aiSummary.byTool).length === 0 ? (
                    <p className="text-xs text-zinc-600">No data</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(aiSummary.byTool).map(([agent, data]: [string, any]) => (
                        <div key={agent} className="flex items-center justify-between">
                          <span className="text-xs text-zinc-300 truncate">{agent}</span>
                          <span className="text-xs text-zinc-500">
                            {data.tokens?.toLocaleString() || 0} tokens
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse Button - shown when sidebar is closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-200 z-50 border-l border-zinc-700"
          style={{ transform: 'translateY(-50%)' }}
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}