import { useState, useEffect, useCallback, useRef } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { MODE2_STEP_LABELS } from '@/types/mode';
import { Mode2StepProgress } from '@/components/mode2/Mode2StepProgress';
import { Mode2Setup } from '@/components/mode2/Mode2Setup';
import { Mode2Plan } from '@/components/mode2/Mode2Plan';
import { Mode2Images } from '@/components/mode2/Mode2Images';
import { Mode2Videos } from '@/components/mode2/Mode2Videos';
import { Mode2Download } from '@/components/mode2/Mode2Download';
import { saveMode2Project } from '@/lib/mode2-persistence';
import { toast } from 'sonner';
import { ArrowLeft, Layers, Save } from 'lucide-react';

const MODE2_STEP_COMPONENTS = {
  1: Mode2Setup,
  2: Mode2Plan,
  3: Mode2Images,
  4: Mode2Videos,
  5: Mode2Download,
} as const;

interface Mode2EditorProps {
  onBack: () => void;
}

export function Mode2Editor({ onBack }: Mode2EditorProps) {
  const store = useMode2Store();
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // Auto-save (debounced 2s) — also creates new projects automatically
  const autoSave = useCallback(async () => {
    if (!store.name.trim()) return;
    try {
      const id = await saveMode2Project(store.projectId, store.getState());
      if (!store.projectId) store.setProjectId(id);
    } catch {
      // Silent fail for auto-save
    }
  }, [store.projectId, store]);

  useEffect(() => {
    if (!store.name.trim()) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(autoSave, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [store.currentStep, store.name, store.scenes, store.transitions, store.planSummary, store.classification, store.qualityMode, store.path, store.source, store.referenceImageUrl, store.selectedTemplateId, store.materialMapping, store.customNotes]);

  const handleManualSave = async () => {
    if (!store.name.trim()) {
      toast.error('Please enter a project name first');
      return;
    }
    setSaving(true);
    try {
      const id = await saveMode2Project(store.projectId, store.getState());
      store.setProjectId(id);
      toast.success('Project saved');
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (store.projectId && store.name.trim()) {
      try {
        await saveMode2Project(store.projectId, store.getState());
      } catch { /* ignore */ }
    }
    onBack();
  };

  const StepComponent = MODE2_STEP_COMPONENTS[store.currentStep];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary-foreground" />
            </div>
            {store.name && (
              <span className="text-xs text-muted-foreground truncate max-w-[120px] font-medium">/ {store.name}</span>
            )}
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
              {MODE2_STEP_LABELS[store.currentStep]}
            </span>
          </div>
        </div>
        <Mode2StepProgress />
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <StepComponent />
      </main>
    </div>
  );
}
