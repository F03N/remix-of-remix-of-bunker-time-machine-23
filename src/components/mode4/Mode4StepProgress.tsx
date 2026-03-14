import { useMode4Store } from '@/store/useMode4Store';
import { MODE4_STEP_LABELS, type Mode4WorkflowStep } from '@/types/mode4';

const STEPS: Mode4WorkflowStep[] = [1, 2, 3, 4];

export function Mode4StepProgress() {
  const { currentStep, setCurrentStep } = useMode4Store();

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      {STEPS.map((step) => {
        const isActive = step === currentStep;
        const isDone = step < currentStep;
        return (
          <button
            key={step}
            onClick={() => step <= currentStep && setCurrentStep(step)}
            disabled={step > currentStep}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-md transition-colors text-[10px] font-medium ${
              isActive
                ? 'text-primary'
                : isDone
                  ? 'text-muted-foreground cursor-pointer hover:text-foreground'
                  : 'text-muted-foreground/40 cursor-not-allowed'
            }`}
          >
            <div
              className={`h-1 w-full rounded-full transition-colors ${
                isActive ? 'bg-primary' : isDone ? 'bg-primary/40' : 'bg-muted'
              }`}
            />
            {MODE4_STEP_LABELS[step]}
          </button>
        );
      })}
    </div>
  );
}
