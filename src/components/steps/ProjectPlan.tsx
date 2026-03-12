import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { WorkshopCard } from '@/components/WorkshopCard';
import { StickyAction } from '@/components/StickyAction';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { callGemini, getPlanningModel } from '@/lib/google-ai';
import { MASTER_SYSTEM_PROMPT, getProjectPlanPrompt } from '@/lib/prompts';
import { BUNKER_IDEAS, REPAIR_SCENES, ATMOSPHERE_ONLY_SCENES, SHOT_TYPE_LABELS, DEFAULT_SCENE_SHOT_TYPES } from '@/types/project';
import type { ShotType } from '@/types/project';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

export function ProjectPlan() {
  const store = useProjectStore();
  const {
    scenes, setScenes, updateScene,
    selectedIdeaIndex,
    interiorStyle, visualMood, constructionIntensity, customNotes,
    projectTitle, setProjectTitle, projectSummary, setProjectSummary,
    goToNextStep, goToPrevStep, qualityMode,
  } = store;

  const [generating, setGenerating] = useState(false);

  const selectedIdea = selectedIdeaIndex !== null ? BUNKER_IDEAS[selectedIdeaIndex] : null;
  const hasPrompts = scenes.some(s => s.imagePrompt.length > 0);

  const handleGenerate = async () => {
    if (!selectedIdea) return;
    setGenerating(true);
    try {
      const prompt = getProjectPlanPrompt({
        ideaTitle: selectedIdea.title,
        ideaDescription: selectedIdea.description,
        environmentType: selectedIdea.environmentType,
        interiorStyle,
        visualMood,
        constructionIntensity,
        customNotes,
      });

      const text = await callGemini({
        messages: [{ role: 'user', content: prompt }],
        model: getPlanningModel(qualityMode),
        systemPrompt: MASTER_SYSTEM_PROMPT,
      });

      let cleanText = text.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(cleanText);

      // Set project-level fields
      if (parsed.projectTitle) setProjectTitle(parsed.projectTitle);
      if (parsed.projectSummary) setProjectSummary(parsed.projectSummary);

      // Set scenes
      const scenesData = parsed.scenes || parsed;
      const sceneArray = Array.isArray(scenesData) ? scenesData : [];
      const updated = scenes.map((s, i) => ({
        ...s,
        title: sceneArray[i]?.title || s.title,
        imagePrompt: sceneArray[i]?.imagePrompt || '',
        motionPrompt: sceneArray[i]?.motionPrompt || '',
        narration: sceneArray[i]?.narration || '',
        notes: sceneArray[i]?.notes || '',
        shotType: s.shotType || DEFAULT_SCENE_SHOT_TYPES[i] || 'exterior',
      }));
      setScenes(updated);
      toast.success('Project plan generated — 9 scenes ready');
    } catch (err) {
      console.error('Plan generation failed:', err);
      toast.error(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const handlePromptEdit = (idx: number, field: 'imagePrompt' | 'motionPrompt' | 'narration', value: string) => {
    updateScene(idx, { [field]: value });
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="px-1">
        <h1 className="text-xl font-bold mb-1">Project Plan</h1>
        <p className="text-sm text-muted-foreground">
          AI-generated 9-scene plan for: <span className="text-primary font-semibold">{selectedIdea?.title}</span>
        </p>
      </div>

      {/* Config summary */}
      <WorkshopCard>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-muted-foreground">Interior Style</span>
            <p className="font-semibold text-foreground capitalize">{interiorStyle.replace(/-/g, ' ')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Visual Mood</span>
            <p className="font-semibold text-foreground capitalize">{visualMood.replace(/-/g, ' ')}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Construction</span>
            <p className="font-semibold text-foreground capitalize">{constructionIntensity}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Format</span>
            <p className="font-semibold text-foreground">Vertical 9:16</p>
          </div>
        </div>
      </WorkshopCard>

      {!hasPrompts ? (
        <WorkshopCard generating={generating}>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4 text-sm">
              {generating
                ? 'Generating project plan via Gemini — title, summary, 9 scene prompts, 9 animation prompts…'
                : 'Generate the complete project plan including title, summary, and all 9 scene prompts.'}
            </p>
            {!generating && (
              <button
                onClick={handleGenerate}
                className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-md touch-target"
              >
                Generate Project Plan
              </button>
            )}
          </div>
        </WorkshopCard>
      ) : (
        <>
          {/* Project title & summary */}
          {(projectTitle || projectSummary) && (
            <WorkshopCard>
              {projectTitle && (
                <div className="mb-2">
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">Project Title</label>
                  <p className="text-sm font-bold text-primary">{projectTitle}</p>
                </div>
              )}
              {projectSummary && (
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase">Summary</label>
                  <p className="text-xs text-foreground">{projectSummary}</p>
                </div>
              )}
            </WorkshopCard>
          )}

          {/* Regenerate button */}
          <div className="px-1">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} /> Regenerate Plan
            </button>
          </div>

          {/* Scenes accordion */}
          <Accordion type="single" collapsible className="flex flex-col gap-2">
            {scenes.map((scene, idx) => {
              const isRepair = REPAIR_SCENES.includes(idx);
              const isAtmosphere = ATMOSPHERE_ONLY_SCENES.includes(idx);
              return (
                <AccordionItem key={idx} value={`scene-${idx}`} className="border-0">
                  <WorkshopCard>
                    <AccordionTrigger className="hover:no-underline py-0">
                      <div className="flex items-center gap-3 text-left">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-semibold text-sm block">{scene.title}</span>
                          <span className={`text-[10px] ${isRepair ? 'text-primary' : 'text-muted-foreground'}`}>
                            {isAtmosphere ? '🌫️ Atmosphere only' : '🔧 Construction scene'}
                            {' · '}{SHOT_TYPE_LABELS[scene.shotType || 'exterior'].emoji} {SHOT_TYPE_LABELS[scene.shotType || 'exterior'].label}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3 space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Shot Type</label>
                        <div className="flex gap-1.5 mt-1">
                          {(['exterior', 'entrance-facing', 'interior', 'reveal'] as ShotType[]).map(st => (
                            <button
                              key={st}
                              onClick={() => updateScene(idx, { shotType: st })}
                              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                                (scene.shotType || 'exterior') === st
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-muted-foreground'
                              }`}
                            >
                              {SHOT_TYPE_LABELS[st].emoji} {SHOT_TYPE_LABELS[st].label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Image Prompt</label>
                        <Textarea
                          value={scene.imagePrompt}
                          onChange={(e) => handlePromptEdit(idx, 'imagePrompt', e.target.value)}
                          className="text-xs font-mono mt-1 min-h-[80px] bg-secondary border-border"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Animation Prompt</label>
                        <Textarea
                          value={scene.motionPrompt}
                          onChange={(e) => handlePromptEdit(idx, 'motionPrompt', e.target.value)}
                          className="text-xs font-mono mt-1 min-h-[40px] bg-secondary border-border"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Narration</label>
                        <Textarea
                          value={scene.narration}
                          onChange={(e) => handlePromptEdit(idx, 'narration', e.target.value)}
                          className="text-xs font-mono mt-1 min-h-[40px] bg-secondary border-border"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Continuity Notes</label>
                        <p className="text-xs text-muted-foreground mt-1">{scene.notes}</p>
                      </div>
                      {isRepair && scene.workerCues?.length > 0 && (
                        <div className="p-2 rounded bg-primary/10">
                          <p className="text-[10px] font-semibold text-primary mb-1">Required Construction Cues:</p>
                          {scene.workerCues.map((cue, i) => (
                            <p key={i} className="text-[10px] text-muted-foreground">• {cue}</p>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </WorkshopCard>
                </AccordionItem>
              );
            })}
          </Accordion>
        </>
      )}

      <StickyAction
        label="Begin Image Generation"
        onClick={goToNextStep}
        disabled={!hasPrompts}
        secondary={{ label: 'Back', onClick: goToPrevStep }}
      />
    </div>
  );
}
