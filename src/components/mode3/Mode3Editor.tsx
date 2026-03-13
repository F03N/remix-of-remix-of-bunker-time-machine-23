import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Gem, Save } from 'lucide-react';
import { useMode3Store, MODE3_STEP_LABELS } from '@/store/useMode3Store';
import { saveMode3Project } from '@/lib/mode3-persistence';
import { toast } from 'sonner';
import { Mode3StepProgress } from './Mode3StepProgress';
import { Mode3Setup } from './Mode3Setup';
import { Mode3Prompts } from './Mode3Prompts';
import { Mode3Images } from './Mode3Images';
import { Mode3Videos } from './Mode3Videos';
import { Mode3Download } from './Mode3Download';

const STEP_COMPONENTS = {
  1: Mode3Setup,
  2: Mode3Prompts,
  3: Mode3Images,
  4: Mode3Videos,
  5: Mode3Download,
} as const;

interface Mode3EditorProps {
  onBack: () => void;
}

export function Mode3Editor({ onBack }: Mode3EditorProps) {
  const store = useMode3Store();
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-save (debounced 2s)
  const autoSave = useCallback(async () => {
    if (!store.name.trim()) return;
    try {
      const id = await saveMode3Project(store.projectId, useMode3Store.getState());
      if (!store.projectId) store.setProjectId(id);
    } catch {
      // Silent fail for auto-save
    }
  }, [store.projectId, store.name]);

  useEffect(() => {
    if (!store.name.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(autoSave, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [store.currentStep, store.name, store.selectedRoom, store.promptsGenerated, store.imageSlots, store.videoSlots]);

  const handleManualSave = async () => {
    if (!store.name.trim()) {
      toast.error('Please enter a project name first');
      return;
    }
    setSaving(true);
    try {
      const id = await saveMode3Project(store.projectId, useMode3Store.getState());
      store.setProjectId(id);
      toast.success('Project saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (store.projectId && store.name.trim()) {
      try {
        await saveMode3Project(store.projectId, useMode3Store.getState());
      } catch { /* ignore */ }
    }
    onBack();
  };

  const StepComponent = STEP_COMPONENTS[store.currentStep];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-md bg-amber-600 flex items-center justify-center">
              <Gem className="w-3 h-3 text-primary-foreground" />
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
              {MODE3_STEP_LABELS[store.currentStep]}
            </span>
          </div>
        </div>
        <Mode3StepProgress />
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <StepComponent />
      </main>
    </div>
  );
}
