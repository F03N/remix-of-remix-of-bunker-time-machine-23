import { useMode2Store } from '@/store/useMode2Store';
import { MODE2_STEP_LABELS } from '@/types/mode';
import { ArrowLeft, Layers } from 'lucide-react';

interface Mode2PlaceholderProps {
  onBack: () => void;
}

export function Mode2Placeholder({ onBack }: Mode2PlaceholderProps) {
  const store = useMode2Store();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
              <Layers className="w-3 h-3 text-muted-foreground" />
            </div>
            <span className="text-xs text-muted-foreground font-semibold">Mode 2</span>
          </div>
          <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary">
            {MODE2_STEP_LABELS[store.currentStep]}
          </span>
        </div>
      </header>

      <main className="px-4 py-12 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold mb-2">Mode 2</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This mode is under development. The workflow and generation logic will be added in future updates.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          {([1, 2, 3, 4, 5] as const).map((step) => (
            <span
              key={step}
              className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-secondary text-muted-foreground"
            >
              {MODE2_STEP_LABELS[step]}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
