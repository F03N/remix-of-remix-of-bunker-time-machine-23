import { useRef } from 'react';
import { useMode3Store } from '@/store/useMode3Store';
import { generateMode3Video, pollMode3Video } from '@/lib/mode3-api';
import { Video, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const POLL_INTERVAL = 10000;
const MAX_POLLS = 60;

export function Mode3Videos() {
  const { videoSlots, imageSlots, updateVideoSlot, setCurrentStep, name } = useMode3Store();
  const pollTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const allGenerated = videoSlots.every((s) => s.videoUrl);
  const anyGenerating = videoSlots.some((s) => s.generating);

  const startPolling = (index: number, opName: string) => {
    let pollCount = 0;

    const poll = async () => {
      try {
        pollCount++;
        const result = await pollMode3Video(opName, name || 'mode3', index);

        if (result.done) {
          if (result.videoUrl) {
            updateVideoSlot(index, { videoUrl: result.videoUrl, generating: false, operationName: null });
            toast.success(`Video ${index + 1} generated`);
          } else {
            updateVideoSlot(index, { generating: false, operationName: null });
            toast.error(result.error || `Video ${index + 1} generation failed`);
          }
          return;
        }

        if (pollCount >= MAX_POLLS) {
          updateVideoSlot(index, { generating: false, operationName: null });
          toast.error(`Video ${index + 1} timed out`);
          return;
        }

        pollTimers.current[index] = setTimeout(poll, POLL_INTERVAL);
      } catch (err) {
        updateVideoSlot(index, { generating: false, operationName: null });
        toast.error(err instanceof Error ? err.message : 'Polling failed');
      }
    };

    pollTimers.current[index] = setTimeout(poll, POLL_INTERVAL);
  };

  const handleGenerate = async (index: number) => {
    const slot = videoSlots[index];
    if (!slot.prompt) {
      toast.error('No video prompt available.');
      return;
    }

    // Start frame = image at index, End frame = image at index+1
    const startImage = imageSlots[index];
    const endImage = imageSlots[index + 1];

    if (!startImage?.imageBase64) {
      toast.error(`Image ${index + 1} (start frame) is required. Generate images first.`);
      return;
    }
    if (!endImage?.imageBase64) {
      toast.error(`Image ${index + 2} (end frame) is required. Generate images first.`);
      return;
    }

    updateVideoSlot(index, { generating: true, videoUrl: null });

    try {
      const result = await generateMode3Video(
        slot.prompt,
        index,
        name || 'mode3',
        startImage.imageBase64,
        endImage.imageBase64,
      );

      // Check for immediate completion
      if (result.operationName.startsWith('__COMPLETE__:')) {
        const videoUrl = result.operationName.replace('__COMPLETE__:', '');
        updateVideoSlot(index, { videoUrl, generating: false });
        toast.success(`Video ${index + 1} generated`);
        return;
      }

      updateVideoSlot(index, { operationName: result.operationName });
      startPolling(index, result.operationName);
    } catch (err) {
      updateVideoSlot(index, { generating: false });
      toast.error(err instanceof Error ? err.message : 'Failed to start video generation');
    }
  };

  const handleGenerateAll = async () => {
    for (let i = 0; i < 3; i++) {
      if (videoSlots[i].videoUrl) continue;
      await handleGenerate(i);
      if (i < 2) await new Promise((r) => setTimeout(r, 2000));
    }
  };

  const missingImages = imageSlots.some((s) => !s.imageBase64);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Videos</h2>
        <p className="text-xs text-muted-foreground">Generate the 3 transition videos between epoxy floor stages.</p>
      </div>

      {missingImages && (
        <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">All 4 images must be generated before creating videos. Go back to the Images step.</p>
        </div>
      )}

      {!allGenerated && !missingImages && (
        <button
          onClick={handleGenerateAll}
          disabled={anyGenerating}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {anyGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          ) : (
            'Generate All Videos'
          )}
        </button>
      )}

      <div className="space-y-3">
        {videoSlots.map((slot) => {
          const startImg = imageSlots[slot.index];
          const endImg = imageSlots[slot.index + 1];

          return (
            <div key={slot.index} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                <div>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Video {slot.index + 1} — {slot.stage}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Image {slot.index + 1} → Image {slot.index + 2}
                  </span>
                </div>
                <button
                  onClick={() => handleGenerate(slot.index)}
                  disabled={slot.generating || !slot.prompt || missingImages}
                  className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30 flex items-center gap-1"
                >
                  {slot.generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {slot.videoUrl ? 'Regenerate' : 'Generate'}
                </button>
              </div>

              {/* Frame thumbnails */}
              <div className="flex gap-1 px-3 py-2 bg-muted/10">
                <div className="flex-1">
                  <span className="text-[8px] text-muted-foreground block mb-0.5">Start</span>
                  {startImg?.imageUrl ? (
                    <img src={startImg.imageUrl} alt="Start" className="w-full aspect-[9/16] max-h-[80px] object-cover rounded" />
                  ) : (
                    <div className="w-full aspect-[9/16] max-h-[80px] bg-muted/30 rounded" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-[8px] text-muted-foreground block mb-0.5">End</span>
                  {endImg?.imageUrl ? (
                    <img src={endImg.imageUrl} alt="End" className="w-full aspect-[9/16] max-h-[80px] object-cover rounded" />
                  ) : (
                    <div className="w-full aspect-[9/16] max-h-[80px] bg-muted/30 rounded" />
                  )}
                </div>
              </div>

              {slot.videoUrl ? (
                <div className="aspect-[9/16] max-h-[400px] bg-black">
                  <video src={slot.videoUrl} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="aspect-[9/16] max-h-[200px] bg-muted/20 flex flex-col items-center justify-center gap-2">
                  {slot.generating ? (
                    <>
                      <Loader2 className="w-6 h-6 text-muted-foreground/40 animate-spin" />
                      <span className="text-[10px] text-muted-foreground">Generating video… this may take a few minutes</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-6 h-6 text-muted-foreground/40" />
                      <span className="text-[10px] text-muted-foreground">Not generated yet</span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
          disabled={!allGenerated}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 transition-opacity"
        >
          Continue to Download
        </button>
      </div>
    </div>
  );
}
