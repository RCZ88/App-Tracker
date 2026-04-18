import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { 
  Settings, Database, Clock, Download, Trash2, RefreshCw, 
  ChevronRight, X, Plus, GripVertical, Palette, Check, ChevronDown, Globe,
  ChevronLeft, Search, AlertTriangle
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SettingsPageProps {
  logs: any[];
  appStats: any[];
  storageStatus: {
    type: string;
    working: boolean;
    path: string;
    error?: string;
    logCount: number;
  };
  idleThreshold: number;
  setIdleThreshold: (val: number) => void;
  autoExport: boolean;
  setAutoExport: (val: boolean) => void;
  onClearData: () => void;
  onExportData: (format: 'csv' | 'json') => void;
  onViewDatabase: () => void;
  onRegisterSave: (fn: () => void) => void;
  onRequestNavigate: (path: string, hasUnsaved: boolean) => void;
  onHasChangesChange: (hasChanges: boolean) => void;
  onReloadData: () => void;
  onCategoryOverridesChange?: (overrides: Record<string, string>) => void;
  appColors?: Record<string, string>;
  setAppColors?: (colors: Record<string, string>) => void;
  categoryOrder?: string[];
  setCategoryOrder?: (order: string[]) => void;
  autoStartEnabled?: boolean;
  setAutoStartEnabled?: (enabled: boolean) => void;
}

type AnimationSpeed = 'slow' | 'normal' | 'instant';

const DEFAULT_CATEGORIES = [
  'IDE', 'AI Tools', 'Browser', 'Entertainment', 'Communication',
  'Design', 'Productivity', 'Tools', 'Education', 'Developer Tools',
  'Search Engine', 'News', 'Shopping', 'Social Media', 'Uncategorized', 'Other'
];

const DEFAULT_TIER_ASSIGNMENTS = {
  productive: ['IDE', 'AI Tools', 'Developer Tools', 'Education', 'Productivity', 'Tools'],
  neutral: ['Communication', 'Design', 'Search Engine', 'News', 'Uncategorized', 'Other'],
  distracting: ['Entertainment', 'Social Media', 'Shopping']
};

const CATEGORY_COLORS: Record<string, string> = {
  'IDE': '#6366f1',
  'AI Tools': '#8b5cf6',
  'Browser': '#3b82f6',
  'Entertainment': '#ec4899',
  'Communication': '#14b8a6',
  'Design': '#a855f7',
  'Productivity': '#10b981',
  'Tools': '#f59e0b',
  'Other': '#64748b',
};

const ANIMATION_DURATIONS: Record<AnimationSpeed, number> = {
  slow: 2500,
  normal: 1200,
  instant: 0,
};

// Preset colors for quick selection
const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#64748b', '#78716c',
];

// Custom color picker component with preset swatches - simplified circle design
function ColorPicker({ value, onChange, size = 'md' }: { value: string; onChange: (color: string) => void; size?: 'sm' | 'md' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-color-picker-overlay]')) return;
      if (ref.current && !ref.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const sizeClass = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${sizeClass} rounded-full cursor-pointer border-2 border-zinc-600 hover:border-zinc-400 transition-all hover:scale-110 shadow-md`}
          style={{ backgroundColor: value }}
          title="Click to change color"
        />
      </div>
      {isOpen && createPortal(
        <div
          data-color-picker-overlay
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            className="p-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-52"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-zinc-300">Pick a color</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.slice(0, 15).map((color) => (
                <button
                  key={color}
                  onClick={() => { onChange(color); setIsOpen(false); }}
                  className={`w-7 h-7 rounded-full hover:scale-110 transition-transform ${value === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-zinc-700">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs text-zinc-400 font-mono">{value}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Sortable category chip using dnd-kit
function SortableChip({ 
  id, 
  color,
  onRemove,
}: { 
  id: string; 
  color: string;
  onRemove?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: `${color}15`, borderColor: `${color}50`, color: color }}
      {...attributes}
      {...listeners}
      className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border cursor-grab active:cursor-grabbing hover:scale-105 transition-transform select-none"
    >
      <GripVertical className="w-3 h-3 opacity-50" />
      <span>{id}</span>
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-1 hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Tier container with droppable zone
import { useDroppable } from '@dnd-kit/core';

function TierContainer({ 
  tier, 
  color, 
  label,
  description,
  creditLabel,
  children
}: { 
  tier: 'productive' | 'neutral' | 'distracting';
  color: string;
  label: string;
  description: string;
  creditLabel: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: tier });
  const tierColor = tier === 'productive' ? '#22c55e' : tier === 'neutral' ? '#3b82f6' : '#ef4444';
  
  return (
    <div 
      ref={setNodeRef}
      className={`p-4 rounded-2xl border transition-all ${
        isOver ? 'border-2 border-solid' : ''
      } ${
        tier === 'productive' 
          ? 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20'
          : tier === 'neutral'
            ? 'bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20'
            : 'bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20'
      }`}
      style={isOver ? { borderColor: tierColor, borderWidth: 2 } : undefined}
    >
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-4 h-4 rounded-full shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}88 100%)`,
            boxShadow: `0 0 10px ${tierColor}50`
          }}
        />
        <div>
          <h3 className="font-semibold" style={{ color: tierColor }}>{label}</h3>
          <span className="text-xs text-zinc-500">{creditLabel}</span>
        </div>
      </div>
      <p className="text-xs text-zinc-500 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2 min-h-[48px]">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage({
  logs = [],
  appStats = [],
  storageStatus = { type: 'none', working: false, path: '', logCount: 0 },
  idleThreshold = 5,
  setIdleThreshold = () => {},
  autoExport = false,
  setAutoExport = () => {},
  onClearData,
  onExportData,
  onViewDatabase,
  onRegisterSave,
  onRequestNavigate,
  onHasChangesChange,
  onReloadData,
  appColors = {},
  setAppColors,
  categoryOrder = DEFAULT_CATEGORIES.slice(0, 9),
  setCategoryOrder,
  autoStartEnabled: autoStartEnabledProp = false,
  setAutoStartEnabled: setAutoStartEnabledProp = () => {},
}: Partial<SettingsPageProps> & { onRegisterSave: (fn: () => void) => void; onReloadData?: () => void }) {
  const [activeTab, setActiveTab] = useState<'category' | 'colors' | 'general'>('category');
  const [tierAssignments, setTierAssignments] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deskflow-tier-assignments');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { /* ignore */ }
      }
    }
    return DEFAULT_TIER_ASSIGNMENTS;
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [localAppColors, setLocalAppColors] = useState<Record<string, string>>(() => {
    // Load from localStorage first (in case Settings saved colors while app was closed)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('deskflow-planet-colors');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { /* ignore */ }
      }
    }
    // Fallback to prop
    return appColors;
  });
  const [localCategoryOrder, setLocalCategoryOrder] = useState<string[]>(categoryOrder);
  const [autoStartEnabled, setAutoStartEnabled] = useState(autoStartEnabledProp);
  
  // Drag-and-drop state for dnd-kit
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find which tier a category belongs to
  const findTier = (id: string): 'productive' | 'neutral' | 'distracting' | null => {
    if (tierAssignments.productive.includes(id)) return 'productive';
    if (tierAssignments.neutral.includes(id)) return 'neutral';
    if (tierAssignments.distracting.includes(id)) return 'distracting';
    return null;
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine source and destination tiers
    const sourceTier = findTier(activeId);
    
    // Check if overId is a tier name or a category
    let destTier: 'productive' | 'neutral' | 'distracting' | null = null;
    
    if (overId === 'productive' || overId === 'neutral' || overId === 'distracting') {
      destTier = overId;
    } else {
      destTier = findTier(overId);
    }

    if (!sourceTier || !destTier || sourceTier === destTier) return;

    // Move category from source to destination
    setTierAssignments(prev => {
      const newTiers = { ...prev };
      // Remove from source
      newTiers[sourceTier] = newTiers[sourceTier].filter(c => c !== activeId);
      // Add to destination
      newTiers[destTier] = [...newTiers[destTier], activeId];
      return newTiers;
    });
    setHasChanges(true);
    onHasChangesChange(true);
  };

const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('deskflow-animation-speed') as AnimationSpeed) || 'normal';
    }
    return 'normal';
  });
  const [appCategoryOverrides, setAppCategoryOverrides] = useState<Record<string, string>>({});
  const [domainCategoryOverrides, setDomainCategoryOverrides] = useState<Record<string, string>>({});

  // Load overrides from BOTH localStorage AND categoryConfig on mount
  useEffect(() => {
    const loadOverrides = async () => {
      const overrides: Record<string, string> = {};
      const domainOverrides: Record<string, string> = {};
      
      // First load from localStorage
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('deskflow-app-category-overrides');
          if (saved) Object.assign(overrides, JSON.parse(saved));
        } catch { /* ignore */ }
        try {
          const saved = localStorage.getItem('deskflow-domain-category-overrides');
          if (saved) Object.assign(domainOverrides, JSON.parse(saved));
        } catch { /* ignore */ }
      }
      
      // Also load from categoryConfig (for persistence across app restarts)
      if (window.deskflowAPI?.getCategoryConfig) {
        try {
          const config = await window.deskflowAPI.getCategoryConfig();
          // Merge appCategoryMap into overrides
          if (config?.appCategoryMap) {
            Object.assign(overrides, config.appCategoryMap);
          }
          if (config?.domainCategoryMap) {
            Object.assign(domainOverrides, config.domainCategoryMap);
          }
          // Load keyword rules
          if (config?.domainKeywordRules) {
            setDomainKeywords(config.domainKeywordRules);
          }
          if (config?.domainDefaultCategories) {
            setDomainDefaultCategories(config.domainDefaultCategories);
          }
        } catch { /* ignore */ }
      }
      
      // Load keyword-enabled domains
      if (window.deskflowAPI?.getKeywordEnabledDomains) {
        try {
          const domains = await window.deskflowAPI.getKeywordEnabledDomains();
          setKeywordEnabledDomains(domains);
        } catch { /* ignore */ }
      }
      
      setAppCategoryOverrides(overrides);
      setDomainCategoryOverrides(domainOverrides);
    };
    loadOverrides();
  }, []);
  const [dataSyncMode, setDataSyncMode] = useState<'forward' | 'refactor'>('forward');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const performRefactor = async () => {
    if (!window.deskflowAPI?.updateCategoriesFromOverrides) {
      setSyncStatus('error');
      setSyncMessage('Database sync not available');
      return;
    }
    setSyncStatus('syncing');
    setSyncMessage('Syncing categories to database...');
    try {
      const appOverrides: Record<string, string> = {};
      const domainOverrides: Record<string, string> = {};
      
      for (const [app, category] of Object.entries(appCategoryOverrides)) {
        appOverrides[app.toLowerCase()] = category;
      }
      for (const [domain, category] of Object.entries(domainCategoryOverrides)) {
        domainOverrides[domain.toLowerCase()] = category;
      }
      
      const result = await window.deskflowAPI.updateCategoriesFromOverrides(appOverrides, domainOverrides);
      if (result.success) {
        setSyncStatus('success');
        setSyncMessage(`Updated ${result.updatedCount} rows`);
        if (onReloadData) {
          setTimeout(() => onReloadData(), 500);
        }
        setTimeout(() => {
          setSyncStatus('idle');
          setSyncMessage('');
        }, 3000);
      } else {
        setSyncStatus('error');
        setSyncMessage(result.error || 'Sync failed');
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage('Sync error: ' + (err as Error).message);
    }
  };

  useEffect(() => {
    if (dataSyncMode === 'refactor' && syncStatus === 'idle') {
      performRefactor();
    }
  }, [dataSyncMode]);

  const getAssignedCategories = () => {
    return new Set([
      ...tierAssignments.productive,
      ...tierAssignments.neutral,
      ...tierAssignments.distracting
    ]);
  };

  const removeCategoryFromTier = (tier: 'productive' | 'neutral' | 'distracting', category: string) => {
    setTierAssignments(prev => ({
      ...prev,
      [tier]: prev[tier].filter(c => c !== category)
    }));
    setHasChanges(true);
    onHasChangesChange(true);
  };

  const getUnassignedCategories = () => {
    const assigned = getAssignedCategories();
    return DEFAULT_CATEGORIES.filter(cat => !assigned.has(cat));
  };

  const saveChanges = async () => {
    if (window.deskflowAPI?.setTierAssignments) {
      await window.deskflowAPI.setTierAssignments(tierAssignments);
      console.log('[Settings] Saved tier assignments:', tierAssignments);
    }
    localStorage.setItem('deskflow-tier-assignments', JSON.stringify(tierAssignments));
    if (setAppColors) {
      setAppColors(localAppColors);
      localStorage.setItem('deskflow-planet-colors', JSON.stringify(localAppColors));
    }
    if (setCategoryOrder) {
      setCategoryOrder(localCategoryOrder);
      localStorage.setItem('deskflow-category-order', JSON.stringify(localCategoryOrder));
    }
    localStorage.setItem('deskflow-app-category-overrides', JSON.stringify(appCategoryOverrides));
    localStorage.setItem('deskflow-domain-category-overrides', JSON.stringify(domainCategoryOverrides));
    localStorage.setItem('deskflow-animation-speed', animationSpeed);
    
    // Save keyword-based productivity rules
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (window.deskflowAPI?.setDomainKeywordRules) {
        await window.deskflowAPI.setDomainKeywordRules(domain, keywords);
      }
    }
    for (const [domain, category] of Object.entries(domainDefaultCategories)) {
      if (window.deskflowAPI?.setDomainDefaultCategory) {
        await window.deskflowAPI.setDomainDefaultCategory(domain, category);
      }
    }
    
    // Update database based on sync mode (wrapped in try-catch)
    try {
      if (dataSyncMode === 'refactor') {
        // REFACTOR: Update ALL existing logs in database
        console.log('[Settings] Refactoring all data to match new categories...');
        setSyncStatus('syncing');
        setSyncMessage('Updating all historical data...');
        
        const appOverridesNormalized: Record<string, string> = {};
        const domainOverridesNormalized: Record<string, string> = {};
        
        for (const [app, category] of Object.entries(appCategoryOverrides)) {
          appOverridesNormalized[app.toLowerCase()] = category;
        }
        for (const [domain, category] of Object.entries(domainCategoryOverrides)) {
          domainOverridesNormalized[domain.toLowerCase()] = category;
        }
        
        const result = await window.deskflowAPI?.updateCategoriesFromOverrides(appOverridesNormalized, domainOverridesNormalized);
        if (result?.success) {
          setSyncStatus('success');
          setSyncMessage(`Updated ${result.updatedCount} rows in database`);
          console.log('[Settings] Refactor complete:', result.updatedCount, 'rows updated');
        } else {
          setSyncStatus('error');
          setSyncMessage(result?.error || 'Database update failed');
        }
      } else {
        // FORWARD: Save overrides to category config so NEW logs get correct category
        console.log('[Settings] Forward mode: saving category overrides for new logs...');
        setSyncStatus('success');
        setSyncMessage('Settings saved');
      }
    } catch (err) {
      console.error('[Settings] Save error:', err);
      setSyncStatus('error');
      setSyncMessage('Save failed: ' + (err as Error).message);
    }
    
    // Notify parent component immediately
    try {
      if (typeof onCategoryOverridesChange === 'function') {
        onCategoryOverridesChange(appCategoryOverrides);
      }
    } catch (e) {
      console.error('[Settings] Error notifying parent:', e);
    }
    
    // Also trigger data reload via onReloadData
    try {
      if (typeof onReloadData === 'function') {
        onReloadData();
      }
    } catch (e) {
      console.error('[Settings] Error reloading data:', e);
    }
    
    setHasChanges(false);
    onHasChangesChange(false);
  };

  const handleAppColorChange = (app: string, color: string) => {
    const updated = { ...localAppColors, [app]: color };
    setLocalAppColors(updated);
    setHasChanges(true);
    onHasChangesChange(true);
  };

  const handleCategoryColorChange = (category: string, color: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`deskflow-category-color-${category}`, color);
      setHasChanges(true);
      onHasChangesChange(true);
    }
  };

  const getCategoryColor = (category: string): string => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`deskflow-category-color-${category}`);
      if (saved) return saved;
    }
    return CATEGORY_COLORS[category] || '#64748b';
  };

  const getAppColor = (app: string): string => {
    return localAppColors[app] || appColors[app] || '#888888';
  };

  const changeAppCategory = (app: string, newCategory: string) => {
    const updated = { ...appCategoryOverrides, [app]: newCategory };
    setAppCategoryOverrides(updated);
    if (setAppColors) {
      const colorKey = `__category__${newCategory}`;
      const newColors = { ...localAppColors };
      newColors[app] = newColors[app] || appColors[app] || CATEGORY_COLORS[newCategory] || '#888888';
      setAppColors(newColors);
    }
    setEditingAppCategory(null);
    setHasChanges(true);
    onHasChangesChange(true);
  };

  const getAppDisplayCategory = (app: any): string => {
    return appCategoryOverrides[app.app] || app.category || 'Other';
  };

  useEffect(() => {
    if (onRegisterSave) {
      onRegisterSave(saveChanges);
    }
  }, [tierAssignments, localAppColors, localCategoryOrder, animationSpeed, appCategoryOverrides, domainCategoryOverrides, onRegisterSave, saveChanges]);

  const tabs = [
    { id: 'category', label: 'Category' },
    { id: 'colors', label: 'Colors' },
    { id: 'general', label: 'General' }
  ];

  const [domainStats, setDomainStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchDomainStats = async () => {
      if (window.deskflowAPI?.getBrowserDomainStats) {
        const stats = await window.deskflowAPI.getBrowserDomainStats('all');
        setDomainStats(stats || []);
      }
    };
    if (activeTab === 'category') {
      fetchDomainStats();
    }
  }, [activeTab]);

  const [editingAppCategory, setEditingAppCategory] = useState<string | null>(null);
  const [editingDomainCategory, setEditingDomainCategory] = useState<string | null>(null);
  const [appCarouselIndex, setAppCarouselIndex] = useState(0);
  const [domainCarouselIndex, setDomainCarouselIndex] = useState(0);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [domainSearchQuery, setDomainSearchQuery] = useState('');
  const [appSearchFilter, setAppSearchFilter] = useState('');
  const [domainSearchFilter, setDomainSearchFilter] = useState('');
  
  // Keyword-based productivity categorization state
  const [keywordEnabledDomains, setKeywordEnabledDomains] = useState<string[]>([]);
  const [editingKeywordDomain, setEditingKeywordDomain] = useState<string | null>(null);
  const [domainKeywords, setDomainKeywords] = useState<Record<string, string[]>>({});
  const [domainDefaultCategories, setDomainDefaultCategories] = useState<Record<string, string>>({});
  const [newKeywordDomain, setNewKeywordDomain] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [editingKeywords, setEditingKeywords] = useState<string[]>([]);
  const [tempKeywordInput, setTempKeywordInput] = useState('');

  const ITEMS_PER_PAGE = 5;

  const filteredAppStats = appSearchFilter 
    ? appStats.filter((a: any) => a.app.toLowerCase().includes(appSearchFilter.toLowerCase()))
    : appStats;
    
  const filteredDomainStats = domainSearchFilter 
    ? domainStats.filter((s: any) => s.domain.toLowerCase().includes(domainSearchFilter.toLowerCase()))
    : domainStats;

  const maxAppPage = Math.max(0, Math.ceil(filteredAppStats.length / ITEMS_PER_PAGE) - 1);
  const maxDomainPage = Math.max(0, Math.ceil(filteredDomainStats.length / ITEMS_PER_PAGE) - 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-zinc-400" />
            Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Track and customize your app usage</p>
        </div>
        <AnimatePresence>
          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={saveChanges}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center gap-2 text-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'category' && (
        <div className="space-y-4">
          {/* Productivity Tiers */}
          <div className="glass rounded-3xl p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Productivity</h2>
              <p className="text-xs text-zinc-500">Drag categories between tiers</p>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <TierContainer
                  tier="productive"
                  color="#22c55e"
                  label="Productive"
                  description="Full productivity credit."
                  creditLabel="100%"
                >
                  <SortableContext items={tierAssignments.productive} strategy={verticalListSortingStrategy}>
                    {tierAssignments.productive.map(id => (
                      <SortableChip
                        key={id}
                        id={id}
                        color="#22c55e"
                        onRemove={() => removeCategoryFromTier('productive', id)}
                      />
                    ))}
                  </SortableContext>
                  {tierAssignments.productive.length === 0 && (
                    <div className="w-full py-3 border-2 border-dashed border-emerald-500/30 rounded-lg text-center text-xs text-emerald-400/50">
                      Drop here
                    </div>
                  )}
                </TierContainer>

                <TierContainer
                  tier="neutral"
                  color="#3b82f6"
                  label="Neutral"
                  description="Partial credit."
                  creditLabel="50%"
                >
                  <SortableContext items={tierAssignments.neutral} strategy={verticalListSortingStrategy}>
                    {tierAssignments.neutral.map(id => (
                      <SortableChip
                        key={id}
                        id={id}
                        color="#3b82f6"
                        onRemove={() => removeCategoryFromTier('neutral', id)}
                      />
                    ))}
                  </SortableContext>
                  {tierAssignments.neutral.length === 0 && (
                    <div className="w-full py-3 border-2 border-dashed border-blue-500/30 rounded-lg text-center text-xs text-blue-400/50">
                      Drop here
                    </div>
                  )}
                </TierContainer>

                <TierContainer
                  tier="distracting"
                  color="#ef4444"
                  label="Distracting"
                  description="No credit."
                  creditLabel="0%"
                >
                  <SortableContext items={tierAssignments.distracting} strategy={verticalListSortingStrategy}>
                    {tierAssignments.distracting.map(id => (
                      <SortableChip
                        key={id}
                        id={id}
                        color="#ef4444"
                        onRemove={() => removeCategoryFromTier('distracting', id)}
                      />
                    ))}
                  </SortableContext>
                  {tierAssignments.distracting.length === 0 && (
                    <div className="w-full py-3 border-2 border-dashed border-red-500/30 rounded-lg text-center text-xs text-red-400/50">
                      Drop here
                    </div>
                  )}
                </TierContainer>
              </div>

              <DragOverlay>
                {activeId ? (
                  (() => {
                    const tier = findTier(activeId);
                    const chipColor = tier === 'productive' ? '#22c55e' : tier === 'neutral' ? '#3b82f6' : '#ef4444';
                    return (
                      <div className="fixed px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border cursor-grabbing shadow-xl z-[9999] pointer-events-none"
                        style={{ 
                          borderColor: `${chipColor}50`,
                          color: chipColor,
                          backgroundColor: `${chipColor}15`,
                          transform: 'translate(-50%, -50%)',
                          left: '50%',
                          top: '50%'
                        }}
                      >
                        <GripVertical className="w-3 h-3 opacity-50" />
                        <span>{activeId}</span>
                      </div>
                    );
                  })()
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* Applications Section - Carousel with Arrow Buttons */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Applications</h2>
                  <p className="text-xs text-zinc-500">Click app to change category</p>
                </div>
                {appStats.length > 0 && (
                  <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">{filteredAppStats.length} apps</span>
                )}
              </div>
              {appStats.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search apps..."
                    value={appSearchFilter}
                    onChange={(e) => { setAppSearchFilter(e.target.value); setAppCarouselIndex(0); }}
                    className="pl-8 pr-3 py-1.5 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-36"
                  />
                </div>
              )}
            </div>
            
            {filteredAppStats.length > 0 ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { const current = appCarouselIndex; if (current > 0) setAppCarouselIndex(current - 1); }}
                  disabled={appCarouselIndex === 0}
                  className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex-1 flex gap-2 overflow-hidden justify-center">
                  {filteredAppStats.slice(appCarouselIndex * ITEMS_PER_PAGE, appCarouselIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE).map((app: any) => {
                    const displayCategory = getAppDisplayCategory(app);
                    const categoryColor = getCategoryColor(displayCategory);
                    const isEditing = editingAppCategory === app.app;
                    
                    return (
                      <div key={app.app} className="relative flex-1 min-w-[120px]">
                        {isEditing && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-emerald-400" />
                        )}
                        <button
                          onClick={() => setEditingAppCategory(isEditing ? null : app.app)}
                          className={`w-full flex flex-col items-center p-3 rounded-xl border transition-all group ${
                            isEditing 
                              ? 'bg-zinc-700/60 border-2 border-emerald-500/60' 
                              : 'bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/30 hover:border-zinc-500'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor }} />
                            <span className="text-xs text-zinc-200 group-hover:text-white truncate flex-1">{app.app}</span>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded mt-1.5" style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}>
                            {displayCategory}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => { if (appCarouselIndex < maxAppPage) setAppCarouselIndex(appCarouselIndex + 1); }}
                  disabled={appCarouselIndex >= maxAppPage}
                  className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{appSearchFilter ? 'No matching apps' : 'No apps tracked yet'}</p>
              </div>
            )}
            
            {/* Full Category Selection Panel */}
            {editingAppCategory && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-zinc-900/80 rounded-xl border border-zinc-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {DEFAULT_CATEGORIES.filter(cat => cat.toLowerCase().includes(appSearchQuery.toLowerCase())).map((cat) => {
                    const catColor = getCategoryColor(cat);
                    const appData = appStats.find((a: any) => a.app === editingAppCategory);
                    const displayCategory = getAppDisplayCategory(appData);
                    const isSelected = displayCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => changeAppCategory(editingAppCategory, cat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          isSelected ? 'ring-2 ring-white/30' : 'hover:bg-zinc-800'
                        }`}
                        style={{ backgroundColor: `${catColor}15`, borderColor: isSelected ? catColor : 'transparent', color: catColor }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                        <span>{cat}</span>
                        {isSelected && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setEditingAppCategory(null)}
                  className="w-full mt-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 transition-all"
                >
                  Done
                </button>
              </motion.div>
            )}
          </div>

          {/* Websites Section - Carousel with Arrow Buttons */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Websites</h2>
                  <p className="text-xs text-zinc-500">Click site to change category</p>
                </div>
                {domainStats.length > 0 && (
                  <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">{filteredDomainStats.length} sites</span>
                )}
              </div>
              {domainStats.length > 0 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search sites..."
                    value={domainSearchFilter}
                    onChange={(e) => { setDomainSearchFilter(e.target.value); setDomainCarouselIndex(0); }}
                    className="pl-8 pr-3 py-1.5 text-sm bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 w-36"
                  />
                </div>
              )}
            </div>
            
            {filteredDomainStats.length > 0 ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { const current = domainCarouselIndex; if (current > 0) setDomainCarouselIndex(current - 1); }}
                  disabled={domainCarouselIndex === 0}
                  className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex-1 flex gap-2 overflow-hidden justify-center">
                  {filteredDomainStats.slice(domainCarouselIndex * ITEMS_PER_PAGE, domainCarouselIndex * ITEMS_PER_PAGE + ITEMS_PER_PAGE).map((site: any) => {
                    const displayCategory = domainCategoryOverrides[site.domain] || site.category || 'Other';
                    const categoryColor = getCategoryColor(displayCategory);
                    const isEditing = editingDomainCategory === site.domain;
                    
                    return (
                      <div key={site.domain} className="relative flex-1 min-w-[120px]">
                        {isEditing && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-emerald-400" />
                        )}
                        <button
                          onClick={() => setEditingDomainCategory(isEditing ? null : site.domain)}
                          className={`w-full flex flex-col items-center p-3 rounded-xl border transition-all group ${
                            isEditing 
                              ? 'bg-zinc-700/60 border-2 border-emerald-500/60' 
                              : 'bg-zinc-800/40 hover:bg-zinc-800/70 border border-zinc-700/30 hover:border-zinc-500'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <Globe className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                            <span className="text-xs text-zinc-200 group-hover:text-white truncate flex-1">{site.domain}</span>
                          </div>
                          <span className="text-xs px-1.5 py-0.5 rounded mt-1.5" style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}>
                            {displayCategory}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => { if (domainCarouselIndex < maxDomainPage) setDomainCarouselIndex(domainCarouselIndex + 1); }}
                  disabled={domainCarouselIndex >= maxDomainPage}
                  className="flex-shrink-0 p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500">
                <Globe className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{domainSearchFilter ? 'No matching sites' : 'No websites tracked yet'}</p>
              </div>
            )}
            
            {/* Full Category Selection Panel */}
            {editingDomainCategory && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-zinc-900/80 rounded-xl border border-zinc-700/50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={domainSearchQuery}
                    onChange={(e) => setDomainSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {DEFAULT_CATEGORIES.filter(cat => cat.toLowerCase().includes(domainSearchQuery.toLowerCase())).map((cat) => {
                    const catColor = getCategoryColor(cat);
                    const siteData = domainStats.find((s: any) => s.domain === editingDomainCategory);
                    const displayCategory = domainCategoryOverrides[editingDomainCategory] || siteData?.category || 'Other';
                    const isSelected = displayCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={async () => {
                          const updated = { ...domainCategoryOverrides, [editingDomainCategory]: cat };
                          setDomainCategoryOverrides(updated);
                          if (window.deskflowAPI?.setDomainCategory) {
                            await window.deskflowAPI.setDomainCategory(editingDomainCategory, cat);
                          }
                          setEditingDomainCategory(null);
                          setHasChanges(true);
                          onHasChangesChange(true);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          isSelected ? 'ring-2 ring-white/30' : 'hover:bg-zinc-800'
                        }`}
                        style={{ backgroundColor: `${catColor}15`, borderColor: isSelected ? catColor : 'transparent', color: catColor }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                        <span>{cat}</span>
                        {isSelected && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setEditingDomainCategory(null)}
                  className="w-full mt-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-400 transition-all"
                >
                  Done
                </button>
              </motion.div>
            )}
          </div>

          {/* Smart Website Categorization Section */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Smart Website Categorization</h2>
                <p className="text-xs text-zinc-500">Configure keyword-based productivity detection for websites</p>
              </div>
              <button
                onClick={() => setEditingKeywordDomain(editingKeywordDomain ? null : 'new')}
                className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Domain
              </button>
            </div>

            {/* List of domains with keyword rules */}
            <div className="space-y-2 mb-4">
              {keywordEnabledDomains.length > 0 ? (
                keywordEnabledDomains.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/30"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Globe className="w-4 h-4 text-zinc-500" />
                      <div>
                        <div className="text-sm font-medium text-zinc-200">{domain}</div>
                        <div className="text-xs text-zinc-500">
                          {domainKeywords[domain]?.length || 0} keywords - Default: {domainDefaultCategories[domain] || 'Entertainment'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingKeywordDomain(domain);
                          setEditingKeywords(domainKeywords[domain] || []);
                          setTempKeywordInput('');
                        }}
                        className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 rounded-md transition-all"
                      >
                        Configure
                      </button>
                      <button
                        onClick={async () => {
                          if (window.deskflowAPI?.removeKeywordDomain) {
                            await window.deskflowAPI.removeKeywordDomain(domain);
                            setKeywordEnabledDomains(prev => prev.filter(d => d !== domain));
                            setHasChanges(true);
                            onHasChangesChange(true);
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-zinc-500">
                  <Globe className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No domains with keyword rules yet</p>
                  <p className="text-xs mt-1">Add a domain to enable smart categorization</p>
                </div>
              )}
            </div>

            {/* Configuration panel */}
            {editingKeywordDomain && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-zinc-900/80 rounded-xl border border-zinc-700/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">
                    {editingKeywordDomain === 'new' ? 'Add New Domain' : `Configure: ${editingKeywordDomain}`}
                  </h3>
                  <button
                    onClick={() => {
                      setEditingKeywordDomain(null);
                      setEditingKeywords([]);
                      setTempKeywordInput('');
                    }}
                    className="p-1 text-zinc-500 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Domain Dropdown for new */}
                {editingKeywordDomain === 'new' && (
                  <div className="mb-4">
                    <label className="text-xs text-zinc-400 mb-1.5 block">Select Website</label>
                    <select
                      value={newKeywordDomain}
                      onChange={(e) => setNewKeywordDomain(e.target.value)}
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Choose a website...</option>
                      {domainStats
                        .filter((s: any) => !keywordEnabledDomains.includes(s.domain))
                        .map((site: any) => (
                          <option key={site.domain} value={site.domain}>
                            {site.domain} ({site.category || 'Uncategorized'})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Keyword Tags Input */}
                <div className="mb-4">
                  <label className="text-xs text-zinc-400 mb-1.5 block">Productivity Keywords</label>
                  <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                    {(editingKeywordDomain === 'new' ? editingKeywords : (domainKeywords[editingKeywordDomain] || []))
                      .map((keyword, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium"
                      >
                        {keyword}
                        <button
                          onClick={() => {
                            if (editingKeywordDomain === 'new') {
                              setEditingKeywords(prev => prev.filter((_, i) => i !== idx));
                            } else {
                              const updated = (domainKeywords[editingKeywordDomain] || []).filter((_, i) => i !== idx);
                              setDomainKeywords(prev => ({ ...prev, [editingKeywordDomain]: updated }));
                              setEditingKeywords(updated);
                            }
                          }}
                          className="hover:text-emerald-300 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {(editingKeywordDomain === 'new' ? editingKeywords.length === 0 : !(domainKeywords[editingKeywordDomain]?.length > 0)) && (
                      <span className="text-xs text-zinc-500 italic">No keywords added yet</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempKeywordInput}
                      onChange={(e) => setTempKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tempKeywordInput.trim()) {
                          e.preventDefault();
                          const newKeyword = tempKeywordInput.trim().toLowerCase();
                          if (!editingKeywords.includes(newKeyword)) {
                            setEditingKeywords(prev => [...prev, newKeyword]);
                            if (editingKeywordDomain !== 'new') {
                              setDomainKeywords(prev => ({
                                ...prev,
                                [editingKeywordDomain]: [...(prev[editingKeywordDomain] || []), newKeyword]
                              }));
                            }
                          }
                          setTempKeywordInput('');
                        }
                      }}
                      placeholder="Type a keyword and press Enter"
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => {
                        if (tempKeywordInput.trim()) {
                          const newKeyword = tempKeywordInput.trim().toLowerCase();
                          if (!editingKeywords.includes(newKeyword)) {
                            setEditingKeywords(prev => [...prev, newKeyword]);
                            if (editingKeywordDomain !== 'new') {
                              setDomainKeywords(prev => ({
                                ...prev,
                                [editingKeywordDomain]: [...(prev[editingKeywordDomain] || []), newKeyword]
                              }));
                            }
                          }
                          setTempKeywordInput('');
                        }
                      }}
                      className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-all"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Default Category */}
                <div className="mb-4">
                  <label className="text-xs text-zinc-400 mb-1.5 block">Default Category</label>
                  <select
                    value={editingKeywordDomain === 'new' ? 'Entertainment' : (domainDefaultCategories[editingKeywordDomain] || 'Entertainment')}
                    onChange={(e) => {
                      if (editingKeywordDomain !== 'new') {
                        setDomainDefaultCategories(prev => ({
                          ...prev,
                          [editingKeywordDomain]: e.target.value
                        }));
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Save Button */}
                <button
                  onClick={async () => {
                    const domain = editingKeywordDomain === 'new' ? newKeywordDomain.toLowerCase() : editingKeywordDomain;
                    const keywords = editingKeywords;
                    const defaultCat = editingKeywordDomain === 'new' ? 'Entertainment' : (domainDefaultCategories[editingKeywordDomain] || 'Entertainment');

                    if (!domain) {
                      alert('Please select a website');
                      return;
                    }

                    if (window.deskflowAPI?.addKeywordDomain) {
                      await window.deskflowAPI.addKeywordDomain(domain, keywords, defaultCat);
                      setDomainKeywords(prev => ({ ...prev, [domain]: keywords }));
                      setDomainDefaultCategories(prev => ({ ...prev, [domain]: defaultCat }));
                      
                      if (editingKeywordDomain === 'new') {
                        setKeywordEnabledDomains(prev => [...prev, domain]);
                      }
                      
                      setEditingKeywordDomain(null);
                      setEditingKeywords([]);
                      setTempKeywordInput('');
                      setNewKeywordDomain('');
                      setHasChanges(true);
                      onHasChangesChange(true);
                    }
                  }}
                  disabled={editingKeywordDomain === 'new' && !newKeywordDomain}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all"
                >
                  {editingKeywordDomain === 'new' ? 'Add Domain' : 'Save Changes'}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="glass rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-3">Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">Idle Threshold</label>
                  <div className="flex gap-2">
                    {[3, 5, 10].map(m => (
                      <button
                        key={m}
                        onClick={() => setIdleThreshold(m)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          idleThreshold === m
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {m} min
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">Auto-Export</div>
                    <div className="text-xs text-zinc-500">Export data periodically</div>
                  </div>
                  <button
                    onClick={() => setAutoExport(!autoExport)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      autoExport ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      autoExport ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">Auto-Start</div>
                    <div className="text-xs text-zinc-500">Launch on system startup</div>
                  </div>
                  <button
                    onClick={async () => {
                      const newValue = !autoStartEnabled;
                      setAutoStartEnabled(newValue);
                      setAutoStartEnabledProp?.(newValue);
                      if (window.deskflowAPI?.setAutoStart) {
                        await window.deskflowAPI.setAutoStart(newValue);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      autoStartEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      autoStartEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-400 mb-2 block">Animation Speed</label>
                  <div className="flex gap-1.5">
                    {(['slow', 'normal', 'instant'] as const).map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setAnimationSpeed(speed);
                          setHasChanges(true);
                          onHasChangesChange(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          animationSpeed === speed
                            ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40'
                            : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {speed === 'slow' ? 'Slow' : speed === 'normal' ? 'Normal' : 'Off'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-800/40 rounded-xl p-3 border border-zinc-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-sm font-medium">Storage</span>
                </div>
                <div className="space-y-1 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Type:</span>
                    <span>{storageStatus.type === 'sqlite' ? 'SQLite' : storageStatus.type === 'json' ? 'JSON' : 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Records:</span>
                    <span>{storageStatus.logCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/40 rounded-xl p-3 border border-zinc-700/30">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-sm font-medium">Export</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onExportData('csv')}
                    className="flex-1 px-2 py-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded-md text-xs font-medium transition"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => onExportData('json')}
                    className="flex-1 px-2 py-1.5 bg-zinc-700/50 hover:bg-zinc-700 rounded-md text-xs font-medium transition"
                  >
                    JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'category' && (
        <div className="space-y-4">
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Data Sync Mode</h2>
                <p className="text-xs text-zinc-500">Choose how categories are applied to your data</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDataSyncMode('forward')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  dataSyncMode === 'forward'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="font-medium">Forward Only</div>
                <div className="text-xs mt-1 opacity-70">New data uses updated categories</div>
              </button>
              <button
                onClick={() => setDataSyncMode('refactor')}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  dataSyncMode === 'refactor'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <div className="font-medium">Refactor All Data</div>
                <div className="text-xs mt-1 opacity-70">Update existing data to match categories</div>
              </button>
            </div>
            {dataSyncMode === 'refactor' && (
              <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-200">This will update all existing data to match your category settings. This action cannot be undone.</p>
              </div>
            )}
            {syncStatus !== 'idle' && (
              <div className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                syncStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                syncStatus === 'error' ? 'bg-red-500/10 text-red-400' :
                'bg-zinc-800/50 text-zinc-400'
              }`}>
                {syncMessage}
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Category Assignments</h2>
                <p className="text-xs text-zinc-500">Click an app to reassign its category</p>
              </div>
              {appStats.length > 0 && (
                <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md">{appStats.slice(0, 30).length} apps</span>
              )}
            </div>
            <div className="space-y-1 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
              {appStats.length > 0 ? (
                appStats.slice(0, 30).map((app: any) => {
                  const displayCategory = getAppDisplayCategory(app);
                  const categoryColor = getCategoryColor(displayCategory);
                  const isEditing = editingAppCategory === app.app;
                  
                  return (
                    <div key={app.app} className="relative">
                      <button
                        onClick={() => setEditingAppCategory(isEditing ? null : app.app)}
                        className="w-full flex items-center justify-between py-2 px-3 bg-zinc-800/30 hover:bg-zinc-800/60 rounded-lg transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span className="text-sm text-zinc-200 group-hover:text-white truncate max-w-[180px]">{app.app}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-xs px-2 py-0.5 rounded-md"
                            style={{ 
                              backgroundColor: `${categoryColor}20`,
                              color: categoryColor 
                            }}
                          >
                            {displayCategory}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isEditing && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 pb-1 px-1 grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                              {DEFAULT_CATEGORIES.map((cat) => {
                                const catColor = getCategoryColor(cat);
                                const isSelected = displayCategory === cat;
                                return (
                                  <button
                                    key={cat}
                                    onClick={() => changeAppCategory(app.app, cat)}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-all ${
                                      isSelected 
                                        ? 'ring-2 ring-white/20' 
                                        : 'hover:bg-zinc-700/50'
                                    }`}
                                    style={{ 
                                      backgroundColor: `${catColor}15`,
                                      border: `1px solid ${isSelected ? catColor : 'transparent'}`,
                                      color: catColor 
                                    }}
                                  >
                                    <div 
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: catColor }}
                                    />
                                    <span className="truncate">{cat}</span>
                                    {isSelected && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-zinc-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No apps tracked yet</p>
                  <p className="text-xs mt-1">Start using apps to see them here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'colors' && (
        <div className="space-y-4">
          {/* Category Colors Section */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/80 to-purple-600/80 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Category Colors</h2>
                  <p className="text-xs text-zinc-500">Solar system colors</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {Object.keys(CATEGORY_COLORS).map((category) => (
                <div key={category} className="flex items-center gap-2 p-2.5 bg-zinc-800/40 hover:bg-zinc-800/70 rounded-lg border border-zinc-700/30 hover:border-zinc-600 transition-all group">
                  <ColorPicker 
                    value={getCategoryColor(category)} 
                    onChange={(color) => handleCategoryColorChange(category, color)}
                    size="sm"
                  />
                  <span className="text-sm text-zinc-300 group-hover:text-white font-medium truncate">{category}</span>
                </div>
              ))}
            </div>
          </div>

          {/* App Colors Section */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/80 to-teal-600/80 flex items-center justify-center">
                  <Palette className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Application Colors</h2>
                  <p className="text-xs text-zinc-500">Planet colors</p>
                </div>
              </div>
              {appStats.length > 0 && (
                <span className="text-xs text-zinc-500">{appStats.slice(0, 30).length} apps</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
              {appStats.length > 0 ? (
                appStats.slice(0, 30).map((app: any) => (
                  <div key={app.app} className="flex items-center gap-2 p-2.5 bg-zinc-800/40 hover:bg-zinc-800/70 rounded-lg border border-zinc-700/30 hover:border-zinc-600 transition-all group">
                    <ColorPicker 
                      value={getAppColor(app.app)} 
                      onChange={(color) => handleAppColorChange(app.app, color)}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-zinc-300 group-hover:text-white font-medium truncate">{app.app}</div>
                      <div className="text-xs text-zinc-500 truncate">{app.category}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-10 text-zinc-500">
                  <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No apps tracked yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}