import { useMode3Store, MODE3_STEP_LABELS, type Mode3Step } from '@/store/useMode3Store';
import { Check } from 'lucide-react';

export function Mode3StepProgress() {
  const { currentStep, setCurrentStep } = useMode3Store();
  const steps = Object.entries(MODE3_STEP_LABELS) as [string, string][];

  return (
    <div className="flex items-center gap-1 px-4 py-2.5 overflow-x-auto scrollbar-thin">
      {steps.map(([stepNum, label]) => {
        const num = Number(stepNum) as Mode3Step;
        const isActive = num === currentStep;
        const isComplete = num < currentStep;
        const isPending = num > currentStep;

        return (
          <div key={num} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => isComplete ? setCurrentStep(num) : undefined}
              disabled={isPending}
              className={`
                flex items-center gap-1.5 shrink-0
                px-3 py-1.5 rounded-full text-xs font-semibold
                transition-all duration-200
                ${isActive ? 'bg-primary text-primary-foreground' : ''}
                ${isComplete ? 'bg-step-complete/20 text-step-complete cursor-pointer hover:bg-step-complete/30' : ''}
                ${isPending ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}
              `}
              title={label}
            >
              {isComplete ? <Check className="w-3 h-3" /> : <span className="w-4 text-center">{num}</span>}
              <span className="hidden sm:inline">{label}</span>
            </button>
            {num < 5 && (
              <div className={`w-4 h-px ${isComplete ? 'bg-step-complete/40' : 'bg-muted/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
