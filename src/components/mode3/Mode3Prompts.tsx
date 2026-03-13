import { useState } from 'react';
import { useMode3Store } from '@/store/useMode3Store';
import { generateMode3Prompts } from '@/lib/mode3-api';
import { ImageIcon, Video, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export function Mode3Prompts() {
  const {
    imageSlots, videoSlots, setImageSlots, setVideoSlots,
    setCurrentStep, selectedRoom,
    promptsGenerating, promptsGenerated,
    setPromptsGenerating, setPromptsGenerated,
  } = useMode3Store();

  const handleGenerate = async () => {
    if (!selectedRoom) {
      toast.error('Please select a room type first');
      return;
    }

    setPromptsGenerating(true);
    try {
      const result = await generateMode3Prompts(selectedRoom);

      const newImageSlots = imageSlots.map((slot, i) => ({
        ...slot,
        prompt: result.imagePrompts[i]?.prompt || '',
        stage: result.imagePrompts[i]?.stage || slot.stage,
      }));

      const newVideoSlots = videoSlots.map((slot, i) => ({
        ...slot,
        prompt: result.videoPrompts[i]?.prompt || '',
        stage: result.videoPrompts[i]?.stage || slot.stage,
      }));

      setImageSlots(newImageSlots);
      setVideoSlots(newVideoSlots);
      setPromptsGenerated(true);
      toast.success('Prompts generated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate prompts');
    } finally {
      setPromptsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Prompts</h2>
        <p className="text-xs text-muted-foreground">
          Generate AI prompts for your <span className="font-semibold text-foreground">{selectedRoom}</span> epoxy floor transformation.
        </p>
      </div>

      {!promptsGenerated && (
        <button
          onClick={handleGenerate}
          disabled={promptsGenerating}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity"
        >
          {promptsGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Prompts…
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Prompts
            </>
          )}
        </button>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-primary" />
          Image Prompts (4)
        </h3>
        <div className="space-y-2">
          {imageSlots.map((slot) => (
            <div key={slot.index} className="p-3 rounded-xl border border-border bg-card">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Image {slot.index + 1} — {slot.stage}
              </span>
              {slot.prompt ? (
                <p className="mt-1.5 text-xs text-foreground leading-relaxed">{slot.prompt}</p>
              ) : (
                <div className="mt-1 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {promptsGenerating ? 'Generating…' : 'Click "Generate Prompts" above'}
                  </span>
                </div>
              )}
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
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Video {slot.index + 1} — {slot.stage}
              </span>
              {slot.prompt ? (
                <p className="mt-1.5 text-xs text-foreground leading-relaxed">{slot.prompt}</p>
              ) : (
                <div className="mt-1 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {promptsGenerating ? 'Generating…' : 'Click "Generate Prompts" above'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {promptsGenerated && (
        <button
          onClick={handleGenerate}
          disabled={promptsGenerating}
          className="w-full py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
        >
          {promptsGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Regenerate Prompts
        </button>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!promptsGenerated}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 transition-opacity"
        >
          Continue to Images
        </button>
      </div>
    </div>
  );
}
