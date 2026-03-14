import { useState } from 'react';
import { useMode4Store } from '@/store/useMode4Store';
import { generateMode4Prompts } from '@/lib/mode4-api';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Mode4Prompts() {
  const { imageSlots, videoSlots, referenceImageBase64, setImageSlots, setVideoSlots, setCurrentStep } = useMode4Store();
  const [generating, setGenerating] = useState(false);

  const hasPrompts = imageSlots.some((s) => s.prompt.length > 0);

  const handleGenerate = async () => {
    if (!referenceImageBase64) {
      toast.error('No reference image found. Go back to Setup.');
      return;
    }
    setGenerating(true);
    try {
      const result = await generateMode4Prompts(referenceImageBase64);

      const updatedImages = imageSlots.map((slot) => {
        const found = result.imagePrompts.find((p) => p.index === slot.index);
        return found ? { ...slot, title: found.title, prompt: found.prompt } : slot;
      });

      const updatedVideos = videoSlots.map((slot) => {
        const found = result.videoPrompts.find((p) => p.index === slot.index);
        return found ? { ...slot, title: found.title, prompt: found.prompt } : slot;
      });

      setImageSlots(updatedImages);
      setVideoSlots(updatedVideos);
      toast.success('Prompts generated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate prompts');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Prompts</h2>
        <p className="text-xs text-muted-foreground">
          Generate 4 image prompts and 4 video prompts from your reference image.
        </p>
      </div>

      {!hasPrompts && (
        <Button className="w-full" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating Prompts…</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-1" /> Generate All Prompts</>
          )}
        </Button>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Image Prompts</h3>
        {imageSlots.map((slot) => (
          <div key={slot.index} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground">{slot.title}</p>
            <p className={`text-xs mt-1 whitespace-pre-wrap ${slot.prompt ? 'text-muted-foreground' : 'text-muted-foreground/40 italic'}`}>
              {slot.prompt || 'Prompt will be generated…'}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Video Prompts</h3>
        {videoSlots.map((slot) => (
          <div key={slot.index} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-foreground">{slot.title}</p>
            <p className={`text-xs mt-1 whitespace-pre-wrap ${slot.prompt ? 'text-muted-foreground' : 'text-muted-foreground/40 italic'}`}>
              {slot.prompt || 'Prompt will be generated…'}
            </p>
          </div>
        ))}
      </div>

      {hasPrompts && (
        <>
          <Button variant="outline" className="w-full" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Regenerating…</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-1" /> Regenerate All Prompts</>
            )}
          </Button>
          <Button className="w-full" onClick={() => setCurrentStep(3)}>
            Continue to Generate <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </>
      )}
    </div>
  );
}
