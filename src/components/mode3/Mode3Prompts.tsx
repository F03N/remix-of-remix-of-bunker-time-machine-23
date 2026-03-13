import { useMode3Store } from '@/store/useMode3Store';
import { ImageIcon, Video } from 'lucide-react';

export function Mode3Prompts() {
  const { imageSlots, videoSlots, setCurrentStep } = useMode3Store();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Prompts</h2>
        <p className="text-xs text-muted-foreground">Review and edit the AI-generated prompts for images and videos.</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-primary" />
          Image Prompts (4)
        </h3>
        <div className="space-y-2">
          {imageSlots.map((slot) => (
            <div key={slot.index} className="p-3 rounded-xl border border-border bg-card">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Image {slot.index + 1}</span>
              <div className="mt-1 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Prompt will be generated here</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Video className="w-4 h-4 text-primary" />
          Video Prompts (3)
        </h3>
        <div className="space-y-2">
          {videoSlots.map((slot) => (
            <div key={slot.index} className="p-3 rounded-xl border border-border bg-card">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Video {slot.index + 1}</span>
              <div className="mt-1 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Prompt will be generated here</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30"
        >
          Continue to Images
        </button>
      </div>
    </div>
  );
}
