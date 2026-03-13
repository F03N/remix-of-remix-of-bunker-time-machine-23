import { useState, useCallback } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { WorkshopCard } from '@/components/WorkshopCard';
import { generateMode2Image, imageUrlToBase64 } from '@/lib/mode2-api';
import { DriftComparison } from '@/components/mode2/DriftComparison';
import { toast } from 'sonner';
import { ImageIcon, Loader2, Check, RefreshCw, Play, AlertTriangle, ShieldAlert, Eye } from 'lucide-react';

// Step isolation labels for validation
const STEP_LABELS: Record<number, { changes: string; preserved: string }> = {
  0: { changes: 'Original abandoned state', preserved: 'N/A' },
  1: { changes: 'Cleaning only (debris, dirt, bushes)', preserved: 'Walls, ceiling, floor (incl. holes), windows, doors' },
  2: { changes: 'Wall plaster/paint only', preserved: 'Ceiling, floor (incl. holes), windows, doors' },
  3: { changes: 'Ceiling repair only', preserved: 'Walls, floor (incl. holes), windows, doors' },
  4: { changes: 'Windows & doors only', preserved: 'Walls, ceiling, floor (incl. holes)' },
  5: { changes: 'Flooring only (first floor repair allowed)', preserved: 'Walls, ceiling, windows, doors' },
  6: { changes: 'Furniture & finishing only', preserved: 'All structure (walls, ceiling, floor, windows, doors)' },
  7: { changes: 'Final polish only', preserved: 'Everything — same room, same layout' },
};

export function Mode2Images() {
  const store = useMode2Store();
  const { scenes, updateScene, referenceImageBase64, referenceImageUrl, name, goToNextStep, goToPrevStep } = store;
  const [generatingAll, setGeneratingAll] = useState(false);
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  const [compareScene, setCompareScene] = useState<number | null>(null);

  const generatedCount = scenes.filter(s => s.generatedImageUrl).length;
  const refUrl = referenceImageUrl || (referenceImageBase64 ? `data:image/png;base64,${referenceImageBase64}` : '');

  const generateSingleImage = useCallback(async (index: number, retries = 2): Promise<boolean> => {
    const currentScenes = useMode2Store.getState().scenes;
    const scene = currentScenes[index];
    if (!scene.imagePrompt) {
      toast.error(`No prompt for scene ${index + 1}. Generate plan first.`);
      return false;
    }

    updateScene(index, { generating: true });

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        let previousBase64: string | undefined;

        if (index > 0) {
          const latestScenes = useMode2Store.getState().scenes;
          const prevScene = latestScenes[index - 1];
          if (prevScene.imageBase64) {
            previousBase64 = prevScene.imageBase64;
          } else if (prevScene.generatedImageUrl) {
            previousBase64 = await imageUrlToBase64(prevScene.generatedImageUrl);
          }
        }

        const currentRef = useMode2Store.getState().referenceImageBase64;
        const result = await generateMode2Image(
          scene.imagePrompt,
          index,
          name || 'mode2-project',
          index > 0 ? currentRef : undefined,
          previousBase64,
        );

        updateScene(index, {
          generatedImageUrl: result.imageUrl,
          imageBase64: result.imageBase64,
          generating: false,
          approved: true,
        });

        toast.success(`Scene ${index + 1} generated!`);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Image generation failed';
        const isRetryable = msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('network');
        
        if (attempt < retries && isRetryable) {
          console.warn(`Scene ${index + 1} attempt ${attempt + 1} failed, retrying in 3s...`, msg);
          toast.info(`Scene ${index + 1}: retrying... (${attempt + 1}/${retries})`);
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }
        
        updateScene(index, { generating: false });
        toast.error(`Scene ${index + 1}: ${msg}`);
        return false;
      }
    }
    return false;
  }, [updateScene, name]);

  const generateAllImages = async () => {
    setGeneratingAll(true);
    for (let i = 0; i < 8; i++) {
      const latestScenes = useMode2Store.getState().scenes;
      if (latestScenes[i].generatedImageUrl && latestScenes[i].approved) continue;
      const success = await generateSingleImage(i);
      if (!success) {
        toast.error(`Stopped at scene ${i + 1}. Fix it then resume.`);
        setGeneratingAll(false);
        return;
      }
      if (i < 7) await new Promise(r => setTimeout(r, 3000));
    }
    setGeneratingAll(false);
    toast.success('All images generated!');
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="px-1">
        <h1 className="text-xl font-bold mb-1">Scene Images</h1>
        <p className="text-sm text-muted-foreground">
          Generate 8 renovation images sequentially. Each image uses the previous as reference.
        </p>
      </div>

      {/* Continuity & Step Isolation Notice */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-300 leading-relaxed">
          <strong>Step isolation enforced:</strong> Each step modifies ONLY its assigned element. Floor openings persist until Step 6. Camera and room identity are locked. Tap an image to review continuity.
        </p>
      </div>

      {/* Generate All button */}
      <WorkshopCard>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold">{generatedCount} / 8 Generated</span>
            <div className="w-32 h-1.5 bg-secondary rounded-full mt-1">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(generatedCount / 8) * 100}%` }}
              />
            </div>
          </div>
          <button
            onClick={generateAllImages}
            disabled={generatingAll || scenes.some(s => s.generating)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {generatingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {generatingAll ? 'Generating…' : 'Generate All'}
          </button>
        </div>
      </WorkshopCard>

      {/* Scene Grid */}
      <div className="grid grid-cols-2 gap-3">
        {scenes.map((scene, i) => (
          <WorkshopCard key={i}>
            <div className="relative">
              {scene.generatedImageUrl ? (
                <div className="relative">
                  <img
                    src={scene.generatedImageUrl}
                    alt={scene.title}
                    className="w-full aspect-[9/16] rounded-lg object-cover cursor-pointer"
                    onClick={() => setSelectedScene(selectedScene === i ? null : i)}
                  />
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3 text-green-500" />
                    <span className="text-[9px] font-bold">{i + 1}</span>
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    {referenceImageUrl && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCompareScene(compareScene === i ? null : i); setSelectedScene(null); }}
                        className="w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                        title="Compare with reference"
                      >
                        <Eye className="w-3 h-3 text-primary" />
                      </button>
                    )}
                    <button
                      onClick={() => generateSingleImage(i)}
                      disabled={scene.generating}
                      className="w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                    >
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[9/16] rounded-lg bg-secondary/50 border border-border/50 flex flex-col items-center justify-center gap-2">
                  {scene.generating ? (
                    <>
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-[9px] text-primary font-medium">Generating…</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                      <span className="text-[9px] text-muted-foreground/60">{i + 1}</span>
                      <button
                        onClick={() => generateSingleImage(i)}
                        disabled={i > 0 && !scenes[i - 1].generatedImageUrl}
                        className="text-[9px] font-semibold text-primary hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Generate
                      </button>
                    </>
                  )}
                </div>
              )}
              <p className="text-[10px] font-semibold mt-1.5 text-center truncate">{scene.title}</p>
            </div>
          </WorkshopCard>
        ))}
      </div>

      {/* Drift Comparison Panel */}
      {compareScene !== null && scenes[compareScene].generatedImageUrl && referenceImageUrl && (
        <WorkshopCard className="border-primary/30">
          <DriftComparison
            referenceImageUrl={referenceImageUrl}
            sceneImageUrl={scenes[compareScene].generatedImageUrl!}
            sceneIndex={compareScene}
            sceneTitle={scenes[compareScene].title}
            onClose={() => setCompareScene(null)}
          />
        </WorkshopCard>
      )}

      {/* Continuity Validation Panel — shown when a scene is selected */}
      {selectedScene !== null && scenes[selectedScene].generatedImageUrl && (
        <WorkshopCard className="border-primary/30 bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold">Continuity Check — Scene {selectedScene + 1}</h3>
            </div>
            <button onClick={() => setSelectedScene(null)} className="text-[10px] text-muted-foreground hover:text-foreground">Close</button>
          </div>
          <div className="space-y-2 text-[10px]">
            <div>
              <span className="font-semibold text-green-400">✓ Changes allowed:</span>
              <span className="ml-1 text-foreground">{STEP_LABELS[selectedScene]?.changes}</span>
            </div>
            <div>
              <span className="font-semibold text-amber-400">⚠ Must be preserved:</span>
              <span className="ml-1 text-foreground">{STEP_LABELS[selectedScene]?.preserved}</span>
            </div>
            {selectedScene >= 1 && selectedScene <= 4 && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-300">Floor openings/holes must remain in exact original position. If missing, regenerate this scene.</span>
              </div>
            )}
            {selectedScene === 3 && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-blue-500/10 border border-blue-500/20">
                <AlertTriangle className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-blue-300">Ceiling repair must be gradual. If it jumped from destroyed to pristine, regenerate.</span>
              </div>
            )}
            <div className="flex items-start gap-1.5 p-2 rounded bg-destructive/10 border border-destructive/20">
              <ShieldAlert className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
              <span className="text-destructive/80">If room dimensions, proportions, or camera angle drifted from the reference, regenerate this scene.</span>
            </div>
          </div>
        </WorkshopCard>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <button onClick={goToPrevStep} className="flex-1 py-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Back
        </button>
        <button
          onClick={goToNextStep}
          disabled={generatedCount < 8}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Videos
        </button>
      </div>
    </div>
  );
}