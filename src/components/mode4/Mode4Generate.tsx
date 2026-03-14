import { useState } from 'react';
import { useMode4Store } from '@/store/useMode4Store';
import { generateMode4Image } from '@/lib/mode4-api';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageIcon, Film, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function Mode4Generate() {
  const { imageSlots, videoSlots, name, referenceImageBase64, updateImageSlot, setCurrentStep } = useMode4Store();
  const [generatingAll, setGeneratingAll] = useState(false);

  const hasAnyImage = imageSlots.some((s) => s.generatedImageUrl);
  const allImagesGenerated = imageSlots.every((s) => s.generatedImageUrl);
  const anyGenerating = imageSlots.some((s) => s.generating) || generatingAll;

  const generateSingleImage = async (index: number) => {
    const slot = imageSlots[index];
    if (!slot.prompt) {
      toast.error(`No prompt for Image ${index + 1}. Go back to Prompts step.`);
      return;
    }

    updateImageSlot(index, { generating: true });

    try {
      // For IMAGE 4 (index 3), pass reference image
      // For IMAGE 2+ , pass previous image for continuity chaining
      const ref = index === 3 ? referenceImageBase64 || undefined : undefined;
      const prev = index > 0 ? imageSlots[index - 1]?.imageBase64 || undefined : undefined;

      const result = await generateMode4Image(slot.prompt, index, name, ref, prev);

      updateImageSlot(index, {
        generatedImageUrl: result.imageUrl,
        imageBase64: result.imageBase64,
        generating: false,
      });

      toast.success(`Image ${index + 1} generated`);
    } catch (err) {
      updateImageSlot(index, { generating: false });
      toast.error(err instanceof Error ? err.message : `Failed to generate Image ${index + 1}`);
    }
  };

  const generateAllImages = async () => {
    setGeneratingAll(true);
    try {
      // Generate sequentially: IMAGE 1 → 2 → 3 → 4 for chaining
      for (let i = 0; i < 4; i++) {
        const slot = imageSlots[i];
        if (!slot.prompt) {
          toast.error(`No prompt for Image ${i + 1}. Go back to Prompts step.`);
          break;
        }

        updateImageSlot(i, { generating: true });

        try {
          const ref = i === 3 ? referenceImageBase64 || undefined : undefined;
          // Get the latest previous image from store
          const currentSlots = useMode4Store.getState().imageSlots;
          const prev = i > 0 ? currentSlots[i - 1]?.imageBase64 || undefined : undefined;

          const result = await generateMode4Image(slot.prompt, i, name, ref, prev);

          updateImageSlot(i, {
            generatedImageUrl: result.imageUrl,
            imageBase64: result.imageBase64,
            generating: false,
          });
        } catch (err) {
          updateImageSlot(i, { generating: false });
          toast.error(err instanceof Error ? err.message : `Failed to generate Image ${i + 1}`);
          break;
        }
      }
      toast.success('All images generated');
    } finally {
      setGeneratingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Generate</h2>
        <p className="text-xs text-muted-foreground">
          Generate 4 images from your prompts. Images are chained sequentially for continuity.
        </p>
      </div>

      {/* Generate All button */}
      {!allImagesGenerated && (
        <Button className="w-full" onClick={generateAllImages} disabled={anyGenerating}>
          {generatingAll ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating All Images…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-1" /> Generate All Images</>
          )}
        </Button>
      )}

      {/* Image cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Images</h3>
        <div className="grid grid-cols-2 gap-3">
          {imageSlots.map((slot) => (
            <div key={slot.index} className="rounded-lg border border-border overflow-hidden bg-muted/10">
              <AspectRatio ratio={16 / 9}>
                {slot.generating ? (
                  <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-[10px] text-muted-foreground">Generating…</span>
                  </div>
                ) : slot.generatedImageUrl ? (
                  <img src={slot.generatedImageUrl} alt={slot.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-1">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/40">{slot.title}</span>
                  </div>
                )}
              </AspectRatio>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs font-medium truncate">{slot.title}</span>
                {slot.generatedImageUrl ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => generateSingleImage(slot.index)}
                    disabled={anyGenerating}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Redo
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => generateSingleImage(slot.index)}
                    disabled={anyGenerating || !slot.prompt}
                  >
                    Generate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video placeholders — read-only for now */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Videos</h3>
        <div className="grid grid-cols-2 gap-2">
          {videoSlots.map((slot) => (
            <div key={slot.index} className="rounded-lg border border-border overflow-hidden">
              <AspectRatio ratio={16 / 9}>
                <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-1">
                  <Film className="w-5 h-5 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground/40">{slot.title}</span>
                </div>
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>

      {/* Regenerate All + Continue */}
      {allImagesGenerated && (
        <>
          <Button variant="outline" className="w-full" onClick={generateAllImages} disabled={anyGenerating}>
            {generatingAll ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Regenerating…</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-1" /> Regenerate All Images</>
            )}
          </Button>
          <Button className="w-full" onClick={() => setCurrentStep(4)}>
            Continue to Export <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </>
      )}
    </div>
  );
}
