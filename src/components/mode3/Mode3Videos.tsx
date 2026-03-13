import { useMode3Store } from '@/store/useMode3Store';
import { Video } from 'lucide-react';

export function Mode3Videos() {
  const { videoSlots, setCurrentStep } = useMode3Store();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Videos</h2>
        <p className="text-xs text-muted-foreground">Generate the 3 transition videos between epoxy floor stages.</p>
      </div>

      <div className="space-y-3">
        {videoSlots.map((slot) => (
          <div key={slot.index} className="aspect-video rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2">
            <Video className="w-6 h-6 text-muted-foreground/40" />
            <span className="text-[10px] font-semibold text-muted-foreground">Video {slot.index + 1}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStep(3)}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(5)}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30"
        >
          Continue to Download
        </button>
      </div>
    </div>
  );
}
