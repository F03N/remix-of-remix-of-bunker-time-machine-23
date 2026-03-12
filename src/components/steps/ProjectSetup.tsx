import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { WorkshopCard } from '@/components/WorkshopCard';
import { StickyAction } from '@/components/StickyAction';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  BUNKER_IDEAS, INTERIOR_STYLE_OPTIONS, VISUAL_MOOD_OPTIONS,
  CONSTRUCTION_INTENSITY_OPTIONS, getActiveModels,
} from '@/types/project';
import type { InteriorStyle, VisualMood, ConstructionIntensity, QualityMode } from '@/types/project';
import { ModelBadge } from '@/components/ModelBadge';
import { Check, Sparkles } from 'lucide-react';

const QUALITY_OPTIONS: { value: QualityMode; label: string; desc: string }[] = [
  { value: 'fast', label: 'Fast', desc: 'Draft quality, quick iterations' },
  { value: 'balanced', label: 'Balanced', desc: 'Production-ready output' },
  { value: 'quality', label: 'Quality', desc: 'Maximum fidelity, slower' },
];

export function ProjectSetup() {
  const store = useProjectStore();
  const {
    name, setName, selectedIdeaIndex, selectIdea,
    interiorStyle, setInteriorStyle,
    visualMood, setVisualMood,
    constructionIntensity, setConstructionIntensity,
    customNotes, setCustomNotes,
    qualityMode, setQualityMode,
    goToNextStep,
  } = store;

  const [section, setSection] = useState<'idea' | 'settings'>(
    selectedIdeaIndex !== null ? 'settings' : 'idea'
  );

  const models = getActiveModels(qualityMode);
  const selectedIdea = selectedIdeaIndex !== null ? BUNKER_IDEAS[selectedIdeaIndex] : null;

  const canProceed = selectedIdeaIndex !== null && name.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Section tabs */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setSection('idea')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            section === 'idea'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          {selectedIdea ? `${selectedIdea.emoji} ${selectedIdea.title}` : '① Select Idea'}
        </button>
        <button
          onClick={() => selectedIdeaIndex !== null && setSection('settings')}
          disabled={selectedIdeaIndex === null}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            section === 'settings'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed'
          }`}
        >
          ② Project Settings
        </button>
      </div>

      {section === 'idea' && (
        <>
          <div className="px-1">
            <h1 className="text-xl font-bold mb-1">Select Your Bunker</h1>
            <p className="text-sm text-muted-foreground">Choose one concept to build your transformation project around.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {BUNKER_IDEAS.map((idea, idx) => {
              const isSelected = selectedIdeaIndex === idx;
              return (
                <button
                  key={idea.id}
                  onClick={() => {
                    selectIdea(idx);
                    // Auto-set project name if empty
                    if (!name.trim()) setName(idea.title);
                    setSection('settings');
                  }}
                  className="text-left group"
                >
                  <div className={`
                    relative rounded-xl border-2 overflow-hidden transition-all
                    ${isSelected
                      ? 'border-primary ring-2 ring-primary/30 bg-primary/5'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-card/80'
                    }
                  `}>
                    {/* Emoji hero */}
                    <div className={`
                      h-24 flex items-center justify-center text-5xl
                      ${isSelected ? 'bg-primary/10' : 'bg-secondary/50'}
                      transition-colors
                    `}>
                      <span className="group-hover:scale-110 transition-transform">{idea.emoji}</span>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-xs leading-tight">{idea.title}</h3>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{idea.description}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-[9px] text-primary line-clamp-1">{idea.visualHook}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {section === 'settings' && (
        <>
          <div className="px-1">
            <h1 className="text-xl font-bold mb-1">Project Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your <span className="text-primary font-semibold">{selectedIdea?.title}</span> project.
            </p>
          </div>

          {/* Project Name */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Project Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={selectedIdea?.title || 'My Bunker Project'}
              className="bg-secondary border-border"
            />
          </WorkshopCard>

          {/* Interior Style */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Final Interior Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {INTERIOR_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setInteriorStyle(opt.value)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold text-left transition-all ${
                    interiorStyle === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </WorkshopCard>

          {/* Visual Mood */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Visual Mood</label>
            <div className="grid grid-cols-2 gap-1.5">
              {VISUAL_MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVisualMood(opt.value)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold text-left transition-all ${
                    visualMood === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </WorkshopCard>

          {/* Construction Intensity */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Construction Intensity</label>
            <div className="flex flex-col gap-1.5">
              {CONSTRUCTION_INTENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setConstructionIntensity(opt.value)}
                  className={`flex flex-col p-3 rounded-md border text-left transition-all ${
                    constructionIntensity === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="font-semibold text-xs">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </WorkshopCard>

          {/* Output Format */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Output Format</label>
            <div className="px-3 py-2 rounded-md bg-secondary text-xs font-semibold text-foreground">
              Vertical 9:16 (Fixed)
            </div>
          </WorkshopCard>

          {/* Quality Mode */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quality Mode</label>
            <div className="flex flex-col gap-1.5">
              {QUALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setQualityMode(opt.value)}
                  className={`flex flex-col p-3 rounded-md border text-left transition-all ${
                    qualityMode === opt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="font-semibold text-xs">{opt.label}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
          </WorkshopCard>

          {/* Custom Notes */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Custom Notes (Optional)</label>
            <Textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Any specific requirements, preferences, or details…"
              className="bg-secondary border-border min-h-[60px] text-xs"
            />
          </WorkshopCard>

          {/* Active Models */}
          <WorkshopCard>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Active Models</label>
            <div className="flex flex-wrap gap-2">
              <ModelBadge label="Planning" model={models.planning} />
              <ModelBadge label="Image" model={models.image} />
              <ModelBadge label="Video" model={models.video} />
              <ModelBadge label="TTS" model={models.tts} />
            </div>
          </WorkshopCard>
        </>
      )}

      <StickyAction
        label="Generate Project Plan"
        onClick={goToNextStep}
        disabled={!canProceed}
      />
    </div>
  );
}
