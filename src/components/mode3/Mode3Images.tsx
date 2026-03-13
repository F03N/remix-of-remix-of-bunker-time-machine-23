import { useMode3Store } from '@/store/useMode3Store';
import { generateMode3Image } from '@/lib/mode3-api';
import { ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function Mode3Images() {
  const { imageSlots, updateImageSlot, setCurrentStep, name } = useMode3Store();

  const allGenerated = imageSlots.every((s) => s.imageUrl);
  const anyGenerating = imageSlots.some((s) => s.generating);

  const handleGenerate = async (index: number) => {
    // Read fresh state from store to avoid stale closures
    const freshSlots = useMode3Store.getState().imageSlots;
    const slot = freshSlots[index];
    if (!slot.prompt) {
      toast.error('No prompt available. Go back and generate prompts first.');
      return;
    }

    updateImageSlot(index, { generating: true });

    try {
      // Read previous image base64 from fresh state
      const prevBase64 = index > 0 ? useMode3Store.getState().imageSlots[index - 1]?.imageBase64 : null;

      const result = await generateMode3Image(
        slot.prompt,
        index,
        name || 'mode3',
        prevBase64,
      );

      updateImageSlot(index, {
        imageUrl: result.imageUrl,
        imageBase64: result.imageBase64,
        generating: false,
      });

      toast.success(`Image ${index + 1} generated`);
    } catch (err) {
      updateImageSlot(index, { generating: false });
      toast.error(err instanceof Error ? err.message : 'Failed to generate image');
    }
  };

  const handleGenerateAll = async () => {
    for (let i = 0; i < 4; i++) {
      // Re-read fresh state each iteration
      const freshSlots = useMode3Store.getState().imageSlots;
      if (freshSlots[i].imageUrl) continue;
      await handleGenerate(i);
      if (i < 3) await new Promise((r) => setTimeout(r, 1500));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Images</h2>
        <p className="text-xs text-muted-foreground">Generate the 4 epoxy floor transformation images sequentially.</p>
      </div>

      {!allGenerated && (
        <button
          onClick={handleGenerateAll}
          disabled={anyGenerating}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {anyGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          ) : (
            'Generate All Images'
          )}
        </button>
      )}

      <div className="space-y-3">
        {imageSlots.map((slot) => (
          <div key={slot.index} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Image {slot.index + 1} — {slot.stage}
              </span>
              <button
                onClick={() => handleGenerate(slot.index)}
                disabled={slot.generating || !slot.prompt}
                className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1"
              >
                {slot.generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {slot.imageUrl ? 'Regenerate' : 'Generate'}
              </button>
            </div>

            {slot.imageUrl ? (
              <div className="aspect-[9/16] max-h-[400px] bg-black flex items-center justify-center">
                <img src={slot.imageUrl} alt={`Image ${slot.index + 1}`} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="aspect-[9/16] max-h-[300px] bg-muted/20 flex flex-col items-center justify-center gap-2">
                {slot.generating ? (
                  <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted-foreground/40" />
                )}
                <span className="text-[10px] text-muted-foreground">
                  {slot.generating ? 'Generating…' : 'Not generated yet'}
                </span>
              </div>
            )}
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
          disabled={!allGenerated}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 transition-opacity"
        >
          Continue to Videos
        </button>
      </div>
    </div>
  );
}
