import { useState } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { WorkshopCard } from '@/components/WorkshopCard';
import { Textarea } from '@/components/ui/textarea';
import { generateMode2Plan } from '@/lib/mode2-api';
import { toast } from 'sonner';
import { ClipboardList, Loader2, Check, RefreshCw, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

export function Mode2Plan() {
  const store = useMode2Store();
  const {
    classification, materialMapping, customNotes, referenceImageBase64,
    planSummary, setPlanSummary, planGenerating, setPlanGenerating,
    scenes, transitions, updateScene, updateTransition,
    goToNextStep, goToPrevStep,
  } = store;

  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<number | null>(null);

  const hasPlan = scenes.some(s => s.imagePrompt.length > 0);

  const handleGeneratePlan = async () => {
    if (!classification) {
      toast.error('No classification found. Go back to Setup.');
      return;
    }

    setPlanGenerating(true);
    try {
      const result = await generateMode2Plan(
        referenceImageBase64,
        classification,
        materialMapping,
        customNotes,
      );

      setPlanSummary(result.summary);

      result.imagePrompts.forEach((prompt, i) => {
        updateScene(i, { imagePrompt: prompt });
      });

      result.videoPrompts.forEach((prompt, i) => {
        updateTransition(i, { motionPrompt: prompt });
      });

      toast.success('Plan generated successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Plan generation failed';
      toast.error(msg);
    } finally {
      setPlanGenerating(false);
    }
  };

  const handleImagePromptEdit = (index: number, value: string) => {
    updateScene(index, { imagePrompt: value });
  };

  const handleVideoPromptEdit = (index: number, value: string) => {
    updateTransition(index, { motionPrompt: value });
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="px-1">
        <h1 className="text-xl font-bold mb-1">Renovation Plan</h1>
        <p className="text-sm text-muted-foreground">
          Generate an 8-step {classification?.toUpperCase() || ''} renovation plan with image & video prompts.
        </p>
      </div>

      {/* Generate / Regenerate button */}
      {!hasPlan && !planGenerating && (
        <WorkshopCard>
          <div className="flex flex-col items-center gap-3 py-4">
            <ClipboardList className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground text-center">
              Click below to generate the complete renovation plan based on your reference image and classification.
            </p>
            <button
              onClick={handleGeneratePlan}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              Generate Plan
            </button>
          </div>
        </WorkshopCard>
      )}

      {planGenerating && (
        <WorkshopCard>
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-primary font-medium">Generating renovation plan…</p>
            <p className="text-[10px] text-muted-foreground">This may take 15–30 seconds</p>
          </div>
        </WorkshopCard>
      )}

      {/* Plan Summary */}
      {planSummary && (
        <WorkshopCard>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Summary</label>
          <p className="text-xs text-foreground leading-relaxed">{planSummary}</p>
        </WorkshopCard>
      )}

      {/* Material Mapping */}
      {materialMapping && (
        <WorkshopCard>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Material Mapping</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(materialMapping).map(([key, value]) => (
              <div key={key} className="p-2 rounded-lg bg-secondary/50">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{key}</span>
                <p className="text-[10px] text-foreground mt-0.5 line-clamp-2">{value}</p>
              </div>
            ))}
          </div>
        </WorkshopCard>
      )}

      {/* 8 Image Prompts */}
      {hasPlan && (
        <>
          <div className="px-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Image Prompts (8)</label>
            <button
              onClick={handleGeneratePlan}
              disabled={planGenerating}
              className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:underline disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>

          {scenes.map((scene, i) => (
            <WorkshopCard key={i}>
              <button
                onClick={() => {
                  if (editingPrompt === i) return;
                  setExpandedPrompt(expandedPrompt === i ? null : i);
                }}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <span className="text-xs font-semibold">{scene.title}</span>
                  {scene.imagePrompt && <Check className="w-3 h-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-1">
                  {scene.imagePrompt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingPrompt === i) {
                          setEditingPrompt(null);
                        } else {
                          setExpandedPrompt(i);
                          setEditingPrompt(i);
                        }
                      }}
                      className="w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center"
                      title="Edit prompt"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                  {expandedPrompt === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedPrompt === i && scene.imagePrompt && (
                editingPrompt === i ? (
                  <div className="mt-3">
                    <Textarea
                      value={scene.imagePrompt}
                      onChange={(e) => handleImagePromptEdit(i, e.target.value)}
                      className="text-[10px] leading-relaxed min-h-[120px] bg-secondary/30"
                    />
                    <button
                      onClick={() => setEditingPrompt(null)}
                      className="mt-2 text-[10px] font-semibold text-primary hover:underline"
                    >
                      Done Editing
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
                    {scene.imagePrompt}
                  </p>
                )
              )}
            </WorkshopCard>
          ))}

          {/* 7 Video Prompts */}
          <div className="px-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Video Prompts (7)</label>
          </div>

          {transitions.map((tr, i) => (
            <WorkshopCard key={`v-${i}`}>
              <button
                onClick={() => {
                  if (editingPrompt === 100 + i) return;
                  setExpandedPrompt(expandedPrompt === 100 + i ? null : 100 + i);
                }}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center">
                    <span className="text-[10px] font-bold text-muted-foreground">V{i + 1}</span>
                  </div>
                  <span className="text-xs font-semibold">Scene {tr.startSceneIndex + 1} → {tr.endSceneIndex + 1}</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                    {i === 3 ? 'REAL-TIME' : 'TIMELAPSE'}
                  </span>
                  {tr.motionPrompt && <Check className="w-3 h-3 text-green-500" />}
                </div>
                <div className="flex items-center gap-1">
                  {tr.motionPrompt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (editingPrompt === 100 + i) {
                          setEditingPrompt(null);
                        } else {
                          setExpandedPrompt(100 + i);
                          setEditingPrompt(100 + i);
                        }
                      }}
                      className="w-6 h-6 rounded-md hover:bg-secondary flex items-center justify-center"
                      title="Edit prompt"
                    >
                      <Pencil className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                  {expandedPrompt === 100 + i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
              {expandedPrompt === 100 + i && tr.motionPrompt && (
                editingPrompt === 100 + i ? (
                  <div className="mt-3">
                    <Textarea
                      value={tr.motionPrompt}
                      onChange={(e) => handleVideoPromptEdit(i, e.target.value)}
                      className="text-[10px] leading-relaxed min-h-[120px] bg-secondary/30"
                    />
                    <button
                      onClick={() => setEditingPrompt(null)}
                      className="mt-2 text-[10px] font-semibold text-primary hover:underline"
                    >
                      Done Editing
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed whitespace-pre-wrap">
                    {tr.motionPrompt}
                  </p>
                )
              )}
            </WorkshopCard>
          ))}
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        <button onClick={goToPrevStep} className="flex-1 py-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          Back
        </button>
        <button
          onClick={goToNextStep}
          disabled={!hasPlan}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue to Images
        </button>
      </div>
    </div>
  );
}
