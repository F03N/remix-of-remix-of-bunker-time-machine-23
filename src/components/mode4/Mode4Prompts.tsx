import { useMode4Store } from '@/store/useMode4Store';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function Mode4Prompts() {
  const { imageSlots, videoSlots, setCurrentStep } = useMode4Store();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Prompts</h2>
        <p className="text-xs text-muted-foreground">Image and video prompts will be generated here.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Image Prompts</h3>
        {imageSlots.map((slot) => (
          <div key={slot.index} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">{slot.title}</p>
            <p className="text-xs text-muted-foreground/60 mt-1 italic">
              {slot.prompt || 'Prompt will be generated…'}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Video Prompts</h3>
        {videoSlots.map((slot) => (
          <div key={slot.index} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">{slot.title}</p>
            <p className="text-xs text-muted-foreground/60 mt-1 italic">
              {slot.prompt || 'Prompt will be generated…'}
            </p>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={() => setCurrentStep(3)}>
        Continue to Generate <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
