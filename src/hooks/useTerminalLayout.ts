import { useState, useEffect, useCallback, useRef } from 'react';
import { PaneNode } from '../components/TerminalWindow';

const DEFAULT_LAYOUT_NAME = 'Default Layout';
const loggedProjects = new Set<string>();

export function useTerminalLayout(projectId: string | null = null, initialLayout: PaneNode | null = null) {
  const [layout, setLayoutState] = useState<PaneNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadLayout = useCallback(async () => {
    if (typeof window === 'undefined' || !window.deskflowAPI) {
      setIsLoading(false);
      return;
    }

    try {
      const layouts = await window.deskflowAPI.getTerminalLayouts(projectId || undefined);
      const activeLayout = layouts?.find((l: any) => l.is_active);
      const projectLayout = projectId ? layouts?.find((l: any) => l.project_id === projectId) : activeLayout;

      if (projectLayout?.layout_data) {
        try {
          const parsed = JSON.parse(projectLayout.layout_data);
          setLayoutState(parsed);
          setActiveLayoutId(projectLayout.id);
          if (projectId && !loggedProjects.has(projectId)) {
            console.log('[useTerminalLayout] Loaded layout for project:', projectId);
            loggedProjects.add(projectId);
          }
        } catch (e) {
          console.warn('[useTerminalLayout] Failed to parse layout data:', e);
          setLayoutState(initialLayout || { id: 'root', type: 'leaf', terminalId: 'term-initial', size: 50 });
        }
      } else {
        setLayoutState(initialLayout || { id: 'root', type: 'leaf', terminalId: 'term-initial', size: 50 });
      }
    } catch (e) {
      console.warn('[useTerminalLayout] Failed to load layout:', e);
      setLayoutState(initialLayout || { id: 'root', type: 'leaf', terminalId: 'term-initial', size: 50 });
    }
    setIsLoading(false);
  }, [projectId, initialLayout]);

  const saveLayout = useCallback(async (layoutData: PaneNode) => {
    if (typeof window === 'undefined' || !window.deskflowAPI) return;

    try {
      const layoutJson = JSON.stringify(layoutData);
      
      if (activeLayoutId) {
        await window.deskflowAPI.saveTerminalLayout({
          id: activeLayoutId,
          name: DEFAULT_LAYOUT_NAME,
          layoutData: layoutJson,
          projectId: projectId || undefined,
        });
      } else {
        const result = await window.deskflowAPI.saveTerminalLayout({
          name: DEFAULT_LAYOUT_NAME,
          layoutData: layoutJson,
          isActive: true,
          projectId: projectId || undefined,
        });
        if (result.success && result.id) {
          setActiveLayoutId(result.id);
        }
      }
    } catch (e) {
      console.warn('[useTerminalLayout] Failed to save layout:', e);
    }
  }, [activeLayoutId, projectId]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  const setLayout = useCallback((newLayout: PaneNode) => {
    setLayoutState(newLayout);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveLayout(newLayout);
    }, 1000);
  }, [saveLayout]);

  const resetLayout = useCallback(() => {
    const defaultLayout = initialLayout || { id: 'root', type: 'leaf', terminalId: 'term-initial', size: 50 };
    setLayoutState(defaultLayout);
    saveLayout(defaultLayout);
  }, [initialLayout, saveLayout]);

  return { layout, setLayout, isLoading, resetLayout };
}