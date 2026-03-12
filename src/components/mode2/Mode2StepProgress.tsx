import { useMode2Store } from '@/store/useMode2Store';
import { MODE2_STEP_LABELS } from '@/types/mode';
import type { Mode2WorkflowStep } from '@/types/mode';
import { Check } from 'lucide-react';

export function Mode2StepProgress() {
  const { currentStep, setCurrentStep } = useMode2Store();
  const steps = [1, 2, 3, 4, 5] as Mode2WorkflowStep[];

  return (
    <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
      {steps.map((step, i) => {
        const isActive = currentStep === step;
        const isDone = currentStep > step;
        return (
          <div key={step} className="flex items-center gap-1">
            <button
              onClick={() => isDone && setCurrentStep(step)}
              disabled={!isDone && !isActive}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap
                ${isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                    : 'bg-secondary text-muted-foreground/50 cursor-not-allowed'
                }
              `}
            >
              {isDone && <Check className="w-3 h-3" />}
              {MODE2_STEP_LABELS[step]}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-4 h-px ${isDone ? 'bg-primary/40' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
