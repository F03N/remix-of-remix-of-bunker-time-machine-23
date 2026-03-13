import { ArrowLeft, Gem, Save } from 'lucide-react';
import { useMode3Store, MODE3_STEP_LABELS } from '@/store/useMode3Store';
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
  const { currentStep, name } = useMode3Store();
  const StepComponent = STEP_COMPONENTS[currentStep];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Gem className="w-3 h-3 text-primary-foreground" />
            </div>
            {name && <span className="text-xs text-muted-foreground truncate max-w-[120px] font-medium">/ {name}</span>}
          </div>
          <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary">
            {MODE3_STEP_LABELS[currentStep]}
          </span>
        </div>
        <Mode3StepProgress />
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <StepComponent />
      </main>
    </div>
  );
}
