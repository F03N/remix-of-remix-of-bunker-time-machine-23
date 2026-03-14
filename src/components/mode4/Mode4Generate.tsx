import { useMode4Store } from '@/store/useMode4Store';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageIcon, Film, ArrowRight } from 'lucide-react';

export function Mode4Generate() {
  const { imageSlots, videoSlots, setCurrentStep } = useMode4Store();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Generate</h2>
        <p className="text-xs text-muted-foreground">Images and videos will be generated here.</p>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Images</h3>
        <div className="grid grid-cols-2 gap-2">
          {imageSlots.map((slot) => (
            <div key={slot.index} className="rounded-lg border border-border overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                {slot.generatedImageUrl ? (
                  <img src={slot.generatedImageUrl} alt={slot.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-1">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/40">{slot.title}</span>
                  </div>
                )}
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Videos</h3>
        <div className="grid grid-cols-2 gap-2">
          {videoSlots.map((slot) => (
            <div key={slot.index} className="rounded-lg border border-border overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                {slot.generatedVideoUrl ? (
                  <video src={slot.generatedVideoUrl} className="w-full h-full object-cover" controls />
                ) : (
                  <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-1">
                    <Film className="w-5 h-5 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/40">{slot.title}</span>
                  </div>
                )}
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={() => setCurrentStep(4)}>
        Continue to Export <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
