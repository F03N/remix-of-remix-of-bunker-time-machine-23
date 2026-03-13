import { useState, useCallback } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { WorkshopCard } from '@/components/WorkshopCard';
import { generateMode2Video, imageUrlToBase64 } from '@/lib/mode2-api';
import { toast } from 'sonner';
import { Film, Loader2, Check, Play, AlertTriangle, ImageIcon } from 'lucide-react';

export function Mode2Videos() {
  const store = useMode2Store();
  const { scenes, transitions, updateTransition, name, goToNextStep, goToPrevStep } = store;
  const [generatingAll, setGeneratingAll] = useState(false);

  const generatedCount = transitions.filter(t => t.generatedVideoUrl).length;

  const generateSingleVideo = useCallback(async (index: number) => {
    const state = useMode2Store.getState();
    const tr = state.transitions[index];
    if (!tr.motionPrompt) {
      toast.error(`No prompt for transition ${index + 1}. Generate plan first.`);
      return;
    }

    const startScene = state.scenes[tr.startSceneIndex];
    const endScene = state.scenes[tr.endSceneIndex];

    if (!startScene.generatedImageUrl || !endScene.generatedImageUrl) {
      toast.error(`Scene images ${tr.startSceneIndex + 1} and ${tr.endSceneIndex + 1} must be generated first.`);
      return;
    }

    updateTransition(index, { generating: true });

    try {
      const startBase64 = startScene.imageBase64 || await imageUrlToBase64(startScene.generatedImageUrl);
      const endBase64 = endScene.imageBase64 || await imageUrlToBase64(endScene.generatedImageUrl);

      const result = await generateMode2Video(
        tr.motionPrompt,
        index,
        name || 'mode2-project',
        startBase64,
        endBase64,
      );

      updateTransition(index, {
        generatedVideoUrl: result.videoUrl,
        generationMode: result.generationMode,
        generating: false,
        approved: true,
      });

      toast.success(`Transition ${index + 1} generated!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Video generation failed';
      updateTransition(index, { generating: false });
      toast.error(`Transition ${index + 1}: ${msg}`);
    }
  }, [updateTransition, name]);

  const generateAllVideos = async () => {
    setGeneratingAll(true);
    for (let i = 0; i < 7; i++) {
      const latest = useMode2Store.getState().transitions;
      if (latest[i].generatedVideoUrl && latest[i].approved) continue;
      await generateSingleVideo(i);
      if (i < 6) await new Promise(r => setTimeout(r, 3000));
    }
    setGeneratingAll(false);
    toast.success('All transitions generated!');
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="px-1">
        <h1 className="text-xl font-bold mb-1">Transition Videos</h1>
        <p className="text-sm text-muted-foreground">
          Generate 7 transition videos (8s each) connecting the 8 scene images.
        </p>
      </div>

      {/* Generate All */}
      <WorkshopCard>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold">{generatedCount} / 7 Generated</span>
            <div className="w-32 h-1.5 bg-secondary rounded-full mt-1">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(generatedCount / 7) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={generateAllVideos}
            disabled={generatingAll || transitions.some(t => t.generating) || scenes.filter(s => s.generatedImageUrl).length < 8}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {generatingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {generatingAll ? 'Generating…' : 'Generate All'}
          </button>
        </div>
      </WorkshopCard>

      {/* Transition List */}
      <div className="flex flex-col gap-3">
        {transitions.map((tr, i) => {
          const startScene = scenes[tr.startSceneIndex];
          const endScene = scenes[tr.endSceneIndex];

          return (
            <WorkshopCard key={i}>
              <div className="flex gap-3">
                {/* Start / Mid / End thumbnails */}
                <div className="flex gap-1 shrink-0 items-center">
                  <div className="w-10 aspect-[9/16] rounded-md overflow-hidden bg-secondary/50 border border-border/50">
                    {startScene.generatedImageUrl ? (
                      <img src={startScene.generatedImageUrl} alt={`Scene ${tr.startSceneIndex + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[8px] text-muted-foreground">{tr.startSceneIndex + 1}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground">→</span>
                  <div className="w-10 aspect-[9/16] rounded-md overflow-hidden bg-secondary/50 border border-primary/30">
                    {tr.midpointImageUrl ? (
                      <img src={tr.midpointImageUrl} alt={`Midpoint ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-2.5 h-2.5 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground">→</span>
                  <div className="w-10 aspect-[9/16] rounded-md overflow-hidden bg-secondary/50 border border-border/50">
                    {endScene.generatedImageUrl ? (
                      <img src={endScene.generatedImageUrl} alt={`Scene ${tr.endSceneIndex + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-[8px] text-muted-foreground">{tr.endSceneIndex + 1}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Film className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-xs font-semibold">
                      Transition {i + 1}
                    </span>
                    {tr.generatedVideoUrl && <Check className="w-3 h-3 text-green-500" />}
                    {tr.generatedVideoUrl2 && <span className="text-[8px] text-green-400 font-medium">×2</span>}
                  </div>

                  {tr.generatedVideoUrl ? (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <div>
                        <span className="text-[8px] text-muted-foreground font-medium">Part A (start → mid)</span>
                        <video
                          src={tr.generatedVideoUrl}
                          controls
                          className="w-full rounded-md mt-0.5"
                          style={{ maxHeight: '100px' }}
                        />
                      </div>
                      {tr.generatedVideoUrl2 && (
                        <div>
                          <span className="text-[8px] text-muted-foreground font-medium">Part B (mid → end)</span>
                          <video
                            src={tr.generatedVideoUrl2}
                            controls
                            className="w-full rounded-md mt-0.5"
                            style={{ maxHeight: '100px' }}
                          />
                        </div>
                      )}
                    </div>
                  ) : tr.generating ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      <span className="text-[10px] text-primary font-medium">Generating midpoint + 2 videos…</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{tr.motionPrompt || 'No prompt'}</p>
                  )}

                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      onClick={() => generateSingleVideo(i)}
                      disabled={tr.generating || !startScene.generatedImageUrl || !endScene.generatedImageUrl}
                      className="text-[9px] font-semibold text-primary hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {tr.generatedVideoUrl ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>
            </WorkshopCard>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex gap-2">
        <button onClick={goToPrevStep} className="flex-1 py-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Back
        </button>
        <button
          onClick={goToNextStep}
          disabled={generatedCount < 7}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Download
        </button>
      </div>
    </div>
  );
}
