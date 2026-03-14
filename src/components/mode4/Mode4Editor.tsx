import { ArrowLeft, Zap, Save } from 'lucide-react';
import { useMode4Store } from '@/store/useMode4Store';
import { MODE4_STEP_LABELS } from '@/types/mode4';
import { Mode4StepProgress } from './Mode4StepProgress';
import { Mode4Setup } from './Mode4Setup';
import { Mode4Prompts } from './Mode4Prompts';
import { Mode4Generate } from './Mode4Generate';
import { Mode4Export } from './Mode4Export';

interface Mode4EditorProps {
  onBack: () => void;
}

const STEP_COMPONENTS = {
  1: Mode4Setup,
  2: Mode4Prompts,
  3: Mode4Generate,
  4: Mode4Export,
} as const;

export function Mode4Editor({ onBack }: Mode4EditorProps) {
  const { name, currentStep } = useMode4Store();
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
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            {name && <span className="text-xs text-muted-foreground truncate max-w-[120px] font-medium">/ {name}</span>}
          </div>
          <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary">
            {MODE4_STEP_LABELS[currentStep]}
          </span>
        </div>
        <Mode4StepProgress />
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto">
        <StepComponent />
      </main>
    </div>
  );
}
