import { useMode3Store } from '@/store/useMode3Store';
import { ImageIcon } from 'lucide-react';

export function Mode3Images() {
  const { imageSlots, setCurrentStep } = useMode3Store();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Images</h2>
        <p className="text-xs text-muted-foreground">Generate and review the 4 epoxy floor transformation images.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {imageSlots.map((slot) => (
          <div key={slot.index} className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2">
            <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
            <span className="text-[10px] font-semibold text-muted-foreground">Image {slot.index + 1}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(4)}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30"
        >
          Continue to Videos
        </button>
      </div>
    </div>
  );
}
