import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProjectStore } from '@/store/useProjectStore';
import { useMode2Store } from '@/store/useMode2Store';
import { StepProgress } from '@/components/StepProgress';
import { STEP_LABELS } from '@/types/project';
import { ProjectSetup } from '@/components/steps/ProjectSetup';
import { ProjectPlan } from '@/components/steps/ProjectPlan';
import { SceneImageChain } from '@/components/steps/SceneImageChain';
import { PairTransitionStudio } from '@/components/steps/PairTransitionStudio';
import { ExportCenter } from '@/components/steps/ExportCenter';
import { AuthPage } from '@/components/AuthPage';
import { ProjectList } from '@/components/ProjectList';
import { LandingPage } from '@/pages/LandingPage';
import { ModeSelector } from '@/components/ModeSelector';
import { Mode2Editor } from '@/components/mode2/Mode2Editor';
import { Mode2ProjectList } from '@/components/mode2/Mode2ProjectList';
import { Mode3Editor } from '@/components/mode3/Mode3Editor';
import { Mode3ProjectList } from '@/components/mode3/Mode3ProjectList';
import { Mode4Editor } from '@/components/mode4/Mode4Editor';
import { Mode4ProjectList } from '@/components/mode4/Mode4ProjectList';
import { useMode3Store } from '@/store/useMode3Store';
import { useMode4Store } from '@/store/useMode4Store';
import { loadProject, saveProject } from '@/lib/persistence';
import { loadMode2Project } from '@/lib/mode2-persistence';
import { loadMode3Project } from '@/lib/mode3-persistence';
import { toast } from 'sonner';
import { ArrowLeft, Save, Zap } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import type { AppMode } from '@/types/mode';

const STEP_COMPONENTS = {
  1: ProjectSetup,
  2: ProjectPlan,
  3: SceneImageChain,
  4: PairTransitionStudio,
  5: ExportCenter,
} as const;

type AppView = 'landing' | 'auth' | 'mode-select' | 'list' | 'editor' | 'mode2-list' | 'mode2-editor' | 'mode3-list' | 'mode3-editor';

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<AppView>('landing');
  const [selectedMode, setSelectedMode] = useState<AppMode | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authInitError, setAuthInitError] = useState<string | null>(null);
  const store = useProjectStore();
  const mode2Store = useMode2Store();
  const mode3Store = useMode3Store();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Suppress auth lock errors globally
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason);
      if (msg.includes('Lock') || msg.includes('navigator.locks') || msg.includes('broken')) {
        e.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  // Auth listener
  useEffect(() => {
    let isActive = true;

    const initAuth = async () => {
      try {
        const authResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('AUTH_INIT_TIMEOUT')), 8000)),
        ]);

        if (!isActive) return;

        const session = authResult.data.session;
        setSession(session);
        setView(session ? 'mode-select' : 'landing');
        setAuthInitError(null);
      } catch (error) {
        if (!isActive) return;
        setSession(null);
        setView('landing');
        setAuthInitError('الاتصال غير مستقر — يمكنك المتابعة من الصفحة الرئيسية');
      } finally {
        if (isActive) setCheckingAuth(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setSession(session);
      if (!session) setView('landing');
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  // Auto-save on state changes (debounced 3s) - Mode 1
  const autoSave = useCallback(async () => {
    if (!store.projectId || !store.name.trim()) return;
    try {
      await saveProject(store.projectId, store.getState());
    } catch {
      // Silent fail for auto-save
    }
  }, [store.projectId, store]);

  useEffect(() => {
    if (view !== 'editor' || !store.projectId) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(autoSave, 3000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [store.currentStep, store.name, store.scenes, store.transitions, store.selectedIdeaIndex, store.audio, store.qualityMode]);

  const handleManualSave = async () => {
    setSaving(true);
    try {
      const id = await saveProject(store.projectId, store.getState());
      store.setProjectId(id);
      toast.success('Project saved');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Mode 1 handlers
  const handleNewProject = () => {
    store.resetProject();
    setView('editor');
  };

  const handleLoadProject = async (id: string) => {
    try {
      const state = await loadProject(id);
      store.loadState(state);
      store.setProjectId(id);
      setView('editor');
    } catch (err) {
      toast.error('Failed to load project');
    }
  };

  const handleBackToList = async () => {
    if (store.projectId && store.name.trim()) {
      try {
        await saveProject(store.projectId, store.getState());
      } catch { /* ignore */ }
    }
    setView('list');
  };

  // Mode 2 handlers
  const handleNewMode2Project = () => {
    mode2Store.resetProject();
    setView('mode2-editor');
  };

  const handleLoadMode2Project = async (id: string) => {
    try {
      const state = await loadMode2Project(id);
      mode2Store.resetProject();
      mode2Store.setProjectId(id);
      mode2Store.setName(state.name);
      mode2Store.setQualityMode(state.qualityMode);
      mode2Store.setCurrentStep(state.currentStep);
      mode2Store.setCustomNotes(state.customNotes);
      if (state.path) mode2Store.setPath(state.path);
      if (state.source) mode2Store.setSource(state.source);
      mode2Store.setReferenceImage('', state.referenceImageUrl);
      mode2Store.setSelectedTemplate(state.selectedTemplateId);
      mode2Store.setClassification(state.classification);
      mode2Store.setMaterialMapping(state.materialMapping);
      mode2Store.setPlanSummary(state.planSummary);
      mode2Store.setScenes(state.scenes);
      mode2Store.setTransitions(state.transitions);
      setView('mode2-editor');
    } catch (err) {
      toast.error('Failed to load project');
    }
  };

  // Mode 3 handlers
  const handleNewMode3Project = () => {
    mode3Store.resetProject();
    setView('mode3-editor');
  };

  const handleLoadMode3Project = async (id: string) => {
    try {
      const state = await loadMode3Project(id);
      mode3Store.resetProject();
      mode3Store.setProjectId(id);
      mode3Store.setName(state.name);
      mode3Store.setCurrentStep(state.currentStep);
      if (state.selectedRoom) mode3Store.setSelectedRoom(state.selectedRoom);
      mode3Store.setPromptsGenerated(state.promptsGenerated);
      if (state.imageSlots.length > 0) mode3Store.setImageSlots(state.imageSlots);
      if (state.videoSlots.length > 0) mode3Store.setVideoSlots(state.videoSlots);
      setView('mode3-editor');
    } catch (err) {
      toast.error('Failed to load project');
    }
  };

  // General handlers
  const handleLogout = async () => {
    await supabase.auth.signOut();
    store.resetProject();
    mode2Store.resetProject();
    mode3Store.resetProject();
    setSelectedMode(null);
    setView('landing');
  };

  const handleModeSelect = (mode: AppMode) => {
    setSelectedMode(mode);
    if (mode === 'mode1') {
      setView('list');
    } else if (mode === 'mode2') {
      setView('mode2-list');
    } else {
      setView('mode3-list');
    }
  };

  const handleBackToModeSelect = () => {
    setSelectedMode(null);
    setView('mode-select');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-3 animate-pulse">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Loading…</p>
          {authInitError && (
            <p className="text-xs text-destructive mt-2">{authInitError}</p>
          )}
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return <LandingPage onGetStarted={() => setView('auth')} />;
  }

  if (view === 'auth') {
    return <AuthPage onAuth={() => setView('mode-select')} onBack={() => setView('landing')} />;
  }

  if (view === 'mode-select') {
    return <ModeSelector onSelect={handleModeSelect} onBack={handleLogout} />;
  }

  if (view === 'mode2-list') {
    return <Mode2ProjectList onNewProject={handleNewMode2Project} onLoadProject={handleLoadMode2Project} onBack={handleBackToModeSelect} />;
  }

  if (view === 'mode2-editor') {
    return <Mode2Editor onBack={() => setView('mode2-list')} />;
  }

  if (view === 'mode3-list') {
    return <Mode3ProjectList onNewProject={handleNewMode3Project} onLoadProject={handleLoadMode3Project} onBack={handleBackToModeSelect} />;
  }

  if (view === 'mode3-editor') {
    return <Mode3Editor onBack={() => setView('mode3-list')} />;
  }

  if (view === 'list') {
    return <ProjectList onNewProject={handleNewProject} onLoadProject={handleLoadProject} onLogout={handleBackToModeSelect} />;
  }

  const StepComponent = STEP_COMPONENTS[store.currentStep];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <button onClick={handleBackToList} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            {store.name && <span className="text-xs text-muted-foreground truncate max-w-[120px] font-medium">/ {store.name}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSave}
              disabled={saving || !store.name.trim()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Saving…' : 'Save'}
            </button>
            <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary">
              {STEP_LABELS[store.currentStep]}
            </span>
          </div>
        </div>
        <StepProgress />
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <StepComponent />
      </main>
    </div>
  );
};

export default Index;
