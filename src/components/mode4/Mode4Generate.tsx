import { useState, useRef, useCallback } from 'react';
import { useMode4Store } from '@/store/useMode4Store';
import { generateMode4Image, generateMode4Video, pollMode4Video } from '@/lib/mode4-api';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageIcon, Film, ArrowRight, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const POLL_INTERVAL = 10_000;
const POLL_MAX = 60;

export function Mode4Generate() {
  const {
    imageSlots, videoSlots, name, referenceImageBase64,
    updateImageSlot, updateVideoSlot, setCurrentStep,
  } = useMode4Store();

  const [generatingAllImages, setGeneratingAllImages] = useState(false);
  const [generatingAllVideos, setGeneratingAllVideos] = useState(false);
  const pollTimers = useRef<Record<number, ReturnType<typeof setInterval>>>({});

  const allImagesGenerated = imageSlots.every((s) => s.generatedImageUrl);
  const anyImageGenerating = imageSlots.some((s) => s.generating) || generatingAllImages;
  const allVideosGenerated = videoSlots.every((s) => s.generatedVideoUrl);
  const anyVideoGenerating = videoSlots.some((s) => s.generating) || generatingAllVideos;
  const anyGenerating = anyImageGenerating || anyVideoGenerating;

  /* ─── Image generation (unchanged logic) ─── */
  const generateSingleImage = async (index: number) => {
    const slot = imageSlots[index];
    if (!slot.prompt) { toast.error(`No prompt for Image ${index + 1}.`); return; }
    updateImageSlot(index, { generating: true });
    try {
      const ref = index === 3 ? referenceImageBase64 || undefined : undefined;
      const prev = index > 0 ? imageSlots[index - 1]?.imageBase64 || undefined : undefined;
      const result = await generateMode4Image(slot.prompt, index, name, ref, prev);
      updateImageSlot(index, { generatedImageUrl: result.imageUrl, imageBase64: result.imageBase64, generating: false });
      toast.success(`Image ${index + 1} generated`);
    } catch (err) {
      updateImageSlot(index, { generating: false });
      toast.error(err instanceof Error ? err.message : `Failed to generate Image ${index + 1}`);
    }
  };

  const generateAllImages = async () => {
    setGeneratingAllImages(true);
    try {
      for (let i = 0; i < 4; i++) {
        const slot = imageSlots[i];
        if (!slot.prompt) { toast.error(`No prompt for Image ${i + 1}.`); break; }
        updateImageSlot(i, { generating: true });
        try {
          const ref = i === 3 ? referenceImageBase64 || undefined : undefined;
          const currentSlots = useMode4Store.getState().imageSlots;
          const prev = i > 0 ? currentSlots[i - 1]?.imageBase64 || undefined : undefined;
          const result = await generateMode4Image(slot.prompt, i, name, ref, prev);
          updateImageSlot(i, { generatedImageUrl: result.imageUrl, imageBase64: result.imageBase64, generating: false });
        } catch (err) {
          updateImageSlot(i, { generating: false });
          toast.error(err instanceof Error ? err.message : `Failed Image ${i + 1}`);
          break;
        }
      }
      toast.success('All images generated');
    } finally { setGeneratingAllImages(false); }
  };

  /* ─── Video generation ─── */
  const startPolling = useCallback((videoIndex: number, operationName: string) => {
    let attempts = 0;
    const timer = setInterval(async () => {
      attempts++;
      if (attempts > POLL_MAX) {
        clearInterval(timer);
        delete pollTimers.current[videoIndex];
        updateVideoSlot(videoIndex, { generating: false });
        toast.error(`Video ${videoIndex + 1} timed out`);
        return;
      }
      try {
        const result = await pollMode4Video(operationName, name, videoIndex);
        if (result.status === 'complete' && result.videoUrl) {
          clearInterval(timer);
          delete pollTimers.current[videoIndex];
          updateVideoSlot(videoIndex, { generatedVideoUrl: result.videoUrl, generating: false });
          toast.success(`Video ${videoIndex + 1} complete`);
        }
      } catch (err) {
        clearInterval(timer);
        delete pollTimers.current[videoIndex];
        updateVideoSlot(videoIndex, { generating: false });
        toast.error(err instanceof Error ? err.message : `Video ${videoIndex + 1} poll failed`);
      }
    }, POLL_INTERVAL);
    pollTimers.current[videoIndex] = timer;
  }, [name, updateVideoSlot]);

  const getVideoFrames = (videoIndex: number) => {
    const slots = useMode4Store.getState().imageSlots;
    if (videoIndex < 3) {
      return { start: slots[videoIndex]?.imageBase64, end: slots[videoIndex + 1]?.imageBase64 };
    }
    // VIDEO 4: start from IMAGE 4, no end frame (hero reveal)
    return { start: slots[3]?.imageBase64, end: undefined };
  };

  const generateSingleVideo = async (index: number) => {
    const slot = videoSlots[index];
    if (!slot.prompt) { toast.error(`No prompt for Video ${index + 1}.`); return; }
    const { start, end } = getVideoFrames(index);
    if (!start) { toast.error(`Image ${index + 1} must be generated first.`); return; }

    updateVideoSlot(index, { generating: true, generatedVideoUrl: undefined });
    try {
      const result = await generateMode4Video(slot.prompt, index, name, start, end);
      if (result.status === 'started' && result.operationName) {
        toast.info(`Video ${index + 1} started — polling…`);
        startPolling(index, result.operationName);
      } else if (result.status === 'complete' && result.videoUrl) {
        updateVideoSlot(index, { generatedVideoUrl: result.videoUrl, generating: false });
        toast.success(`Video ${index + 1} complete`);
      }
    } catch (err) {
      updateVideoSlot(index, { generating: false });
      toast.error(err instanceof Error ? err.message : `Failed Video ${index + 1}`);
    }
  };

  const generateAllVideos = async () => {
    setGeneratingAllVideos(true);
    try {
      for (let i = 0; i < 4; i++) {
        const slot = videoSlots[i];
        if (!slot.prompt) { toast.error(`No prompt for Video ${i + 1}.`); break; }
        const { start, end } = getVideoFrames(i);
        if (!start) { toast.error(`Image ${i + 1} must be generated first.`); break; }

        updateVideoSlot(i, { generating: true, generatedVideoUrl: undefined });
        try {
          const result = await generateMode4Video(slot.prompt, i, name, start, end);
          if (result.status === 'started' && result.operationName) {
            startPolling(i, result.operationName);
          } else if (result.status === 'complete' && result.videoUrl) {
            updateVideoSlot(i, { generatedVideoUrl: result.videoUrl, generating: false });
          }
        } catch (err) {
          updateVideoSlot(i, { generating: false });
          toast.error(err instanceof Error ? err.message : `Failed Video ${i + 1}`);
          break;
        }
      }
      toast.info('All video generations initiated');
    } finally { setGeneratingAllVideos(false); }
  };

  /* ─── Render ─── */
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Generate</h2>
        <p className="text-xs text-muted-foreground">
          Generate 4 images then 4 videos. Images chain sequentially; videos use image pairs as start/end frames.
        </p>
      </div>

      {/* ── Generate All Images ── */}
      {!allImagesGenerated && (
        <Button className="w-full" onClick={generateAllImages} disabled={anyGenerating}>
          {generatingAllImages
            ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating All Images…</>
            : <><Sparkles className="w-4 h-4 mr-1" /> Generate All Images</>}
        </Button>
      )}

      {/* ── Image cards ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Images</h3>
        <div className="grid grid-cols-2 gap-3">
          {imageSlots.map((slot) => (
            <div key={slot.index} className="rounded-lg border border-border overflow-hidden bg-muted/10">
              <AspectRatio ratio={9 / 16}>
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
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => generateSingleImage(slot.index)} disabled={anyGenerating}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Redo
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => generateSingleImage(slot.index)} disabled={anyGenerating || !slot.prompt}>
                    Generate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Regenerate All Images ── */}
      {allImagesGenerated && (
        <Button variant="outline" className="w-full" onClick={generateAllImages} disabled={anyGenerating}>
          {generatingAllImages
            ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Regenerating…</>
            : <><RefreshCw className="w-4 h-4 mr-1" /> Regenerate All Images</>}
        </Button>
      )}

      {/* ── Generate All Videos ── */}
      {allImagesGenerated && !allVideosGenerated && (
        <Button className="w-full" onClick={generateAllVideos} disabled={anyGenerating}>
          {generatingAllVideos
            ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating All Videos…</>
            : <><Film className="w-4 h-4 mr-1" /> Generate All Videos</>}
        </Button>
      )}

      {/* ── Video cards ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Videos</h3>
        <p className="text-[10px] text-muted-foreground mb-1">
          V1: IMG1→IMG2 · V2: IMG2→IMG3 · V3: IMG3→IMG4 · V4: IMG4 hero reveal
        </p>
        <div className="grid grid-cols-2 gap-3">
          {videoSlots.map((slot) => (
            <div key={slot.index} className="rounded-lg border border-border overflow-hidden bg-muted/10">
              <AspectRatio ratio={9 / 16}>
                {slot.generating ? (
                  <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <span className="text-[10px] text-muted-foreground">Generating…</span>
                  </div>
                ) : slot.generatedVideoUrl ? (
                  <video src={slot.generatedVideoUrl} className="w-full h-full object-cover" controls muted playsInline />
                ) : (
                  <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-1">
                    <Film className="w-5 h-5 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/40">{slot.title}</span>
                  </div>
                )}
              </AspectRatio>
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs font-medium truncate">{slot.title}</span>
                {slot.generatedVideoUrl ? (
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => generateSingleVideo(slot.index)} disabled={anyGenerating}>
                    <RefreshCw className="w-3 h-3 mr-1" /> Redo
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={() => generateSingleVideo(slot.index)} disabled={anyGenerating || !allImagesGenerated || !slot.prompt}>
                    Generate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Regenerate All Videos + Continue ── */}
      {allVideosGenerated && (
        <>
          <Button variant="outline" className="w-full" onClick={generateAllVideos} disabled={anyGenerating}>
            {generatingAllVideos
              ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Regenerating…</>
              : <><RefreshCw className="w-4 h-4 mr-1" /> Regenerate All Videos</>}
          </Button>
          <Button className="w-full" onClick={() => setCurrentStep(4)}>
            Continue to Export <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </>
      )}
    </div>
  );
}
