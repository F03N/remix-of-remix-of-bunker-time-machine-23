import { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { WorkshopCard } from '@/components/WorkshopCard';
import { ModelBadge } from '@/components/ModelBadge';
import { StickyAction } from '@/components/StickyAction';
import { getActiveModels, SCENE_WORKER_PRESENCE, BUNKER_IDEAS } from '@/types/project';
import { Download, FolderOpen, Info, Loader2, Check, FileText, Film, Image, Music, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

export function ExportCenter() {
  const store = useProjectStore();
  const {
    name, qualityMode, scenes, transitions,
    selectedIdeaIndex, audio, continuityFlags, goToPrevStep,
    projectTitle, projectSummary,
    interiorStyle, visualMood, constructionIntensity,
  } = store;

  const [exporting, setExporting] = useState(false);
  const models = getActiveModels(qualityMode);
  const selectedIdea = selectedIdeaIndex !== null ? BUNKER_IDEAS[selectedIdeaIndex] : null;

  const sceneImages = scenes.filter(s => s.generatedImageUrl).length;
  const transitionClips = transitions.filter(t => t.generatedVideoUrl).length;
  const hasAudioFiles = (audio.generatedAudioUrls || []).filter(Boolean).length > 0;
  const hasScript = audio.fullScript.length > 0;

  const buildManifest = () => ({
    project: name,
    projectTitle,
    projectSummary,
    exportedAt: new Date().toISOString(),
    idea: selectedIdea ? {
      title: selectedIdea.title,
      environmentType: selectedIdea.environmentType,
      description: selectedIdea.description,
      visualHook: selectedIdea.visualHook,
    } : null,
    configuration: {
      interiorStyle,
      visualMood,
      constructionIntensity,
      qualityMode,
    },
    activeModels: {
      planning: models.planning,
      image: models.image,
      video: models.video,
      tts: models.tts,
    },
    scenes: scenes.map((s, i) => ({
      index: i + 1,
      title: s.title,
      workerPresence: SCENE_WORKER_PRESENCE[i]?.level || 'unknown',
      imagePrompt: s.imagePrompt,
      motionPrompt: s.motionPrompt,
      narration: s.narration,
      notes: s.notes,
      hasImage: !!s.generatedImageUrl,
      assetFile: s.generatedImageUrl ? `scenes/scene_${String(i + 1).padStart(2, '0')}.png` : null,
    })),
    transitions: transitions.map((t) => ({
      pair: `${t.startSceneIndex + 1}→${t.endSceneIndex + 1}`,
      motionPrompt: t.motionPrompt,
      speed: `x${t.speedMultiplier}`,
      hasVideo: !!t.generatedVideoUrl,
      settings: t.motionSettings,
      assetFile: t.generatedVideoUrl ? `transitions/transition_${String(t.startSceneIndex + 1).padStart(2, '0')}_to_${String(t.endSceneIndex + 1).padStart(2, '0')}.mp4` : null,
    })),
  });

  const buildCapCutGuide = () => `AI BUNKER TRANSFORMATION — CapCut Assembly Guide
=============================================
Project: ${name}
Title: ${projectTitle || 'N/A'}
Concept: ${selectedIdea?.title || 'N/A'}
Environment: ${selectedIdea?.environmentType || 'N/A'}
Interior Style: ${interiorStyle.replace(/-/g, ' ')}
Visual Mood: ${visualMood.replace(/-/g, ' ')}
Construction: ${constructionIntensity}
Quality Mode: ${qualityMode}

TIMELINE ORDER
==============
Place assets on the CapCut timeline in this EXACT order:

  1. scene_01.png
  2. transition_01_to_02.mp4
  3. scene_02.png
  4. transition_02_to_03.mp4
  5. scene_03.png
  6. transition_03_to_04.mp4
  7. scene_04.png
  8. transition_04_to_05.mp4
  9. scene_05.png
  10. transition_05_to_06.mp4
  11. scene_06.png
  12. transition_06_to_07.mp4
  13. scene_07.png
  14. transition_07_to_08.mp4
  15. scene_08.png
  16. transition_08_to_09.mp4
  17. scene_09.png

SCENE DURATIONS (suggested)
============================
- Scene images: 0.5-1.0 seconds each (hold frames)
- Transition clips: 5 seconds each
- Total estimated: ~50-55 seconds before trimming

PROJECT SETTINGS
=================
- Aspect Ratio: 9:16 (vertical)
- Resolution: 1080×1920
- Frame Rate: 30fps
- Format: MP4 (H.264)

EXPORT FOR
===========
- YouTube Shorts (max 60s)
- TikTok (max 60s preferred)
- Instagram Reels (max 90s)
`;

  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const manifest = buildManifest();

      zip.file('metadata/manifest.json', JSON.stringify(manifest, null, 2));
      zip.file('metadata/capcut_assembly_guide.txt', buildCapCutGuide());

      // /prompts
      scenes.forEach((s, i) => {
        const num = String(i + 1).padStart(2, '0');
        zip.file(`prompts/scene_${num}_image_prompt.txt`, s.imagePrompt);
        zip.file(`prompts/scene_${num}_motion_prompt.txt`, s.motionPrompt);
        zip.file(`prompts/scene_${num}_narration.txt`, s.narration);
      });

      transitions.forEach((t) => {
        const label = `${String(t.startSceneIndex + 1).padStart(2, '0')}_to_${String(t.endSceneIndex + 1).padStart(2, '0')}`;
        zip.file(`prompts/transition_${label}_motion.txt`, t.motionPrompt);
      });

      // /audio
      if (hasScript) {
        zip.file('audio/narration_script.txt', audio.fullScript);
        zip.file('audio/scene_narrations.json', JSON.stringify(audio.sceneNarrations, null, 2));
      }

      const audioPromises = (audio.generatedAudioUrls || []).map(async (url, i) => {
        if (!url) return;
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          const ext = blob.type.includes('mp3') ? 'mp3' : 'wav';
          zip.file(`audio/scene_${String(i + 1).padStart(2, '0')}_narration.${ext}`, blob);
        } catch (err) {
          zip.file(`audio/scene_${String(i + 1).padStart(2, '0')}_url.txt`, url);
        }
      });

      // /scenes
      const imagePromises = scenes.map(async (s, i) => {
        if (!s.generatedImageUrl) return;
        try {
          const resp = await fetch(s.generatedImageUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          zip.file(`scenes/scene_${String(i + 1).padStart(2, '0')}.png`, blob);
        } catch (err) {
          zip.file(`scenes/scene_${String(i + 1).padStart(2, '0')}_url.txt`, s.generatedImageUrl!);
        }
      });

      // /transitions
      const videoPromises = transitions.map(async (t) => {
        if (!t.generatedVideoUrl) return;
        try {
          const resp = await fetch(t.generatedVideoUrl);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const blob = await resp.blob();
          zip.file(`transitions/transition_${String(t.startSceneIndex + 1).padStart(2, '0')}_to_${String(t.endSceneIndex + 1).padStart(2, '0')}.mp4`, blob);
        } catch (err) {
          zip.file(`transitions/transition_${String(t.startSceneIndex + 1).padStart(2, '0')}_to_${String(t.endSceneIndex + 1).padStart(2, '0')}_url.txt`, t.generatedVideoUrl!);
        }
      });

      toast.info('Downloading assets into ZIP…');
      await Promise.all([...imagePromises, ...videoPromises, ...audioPromises]);

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}_bunker_export.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('ZIP bundle exported');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="px-1">
        <h1 className="text-xl font-bold mb-1">Download Assets</h1>
        <p className="text-sm text-muted-foreground">Export as a ZIP bundle ready for CapCut, Premiere Pro, or After Effects.</p>
      </div>

      {/* Readiness checklist */}
      <WorkshopCard>
        <h2 className="font-bold text-sm mb-3">Export Readiness</h2>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            {sceneImages === 9 ? <Check className="w-4 h-4 text-step-complete" /> : <Image className="w-4 h-4 text-muted-foreground" />}
            <span className={sceneImages === 9 ? 'text-step-complete font-semibold' : 'text-muted-foreground'}>Scene Images: {sceneImages}/9</span>
          </div>
          <div className="flex items-center gap-2">
            {transitionClips === 8 ? <Check className="w-4 h-4 text-step-complete" /> : <Film className="w-4 h-4 text-muted-foreground" />}
            <span className={transitionClips === 8 ? 'text-step-complete font-semibold' : 'text-muted-foreground'}>Transition Clips: {transitionClips}/8</span>
          </div>
          <div className="flex items-center gap-2">
            {hasScript ? <Check className="w-4 h-4 text-step-complete" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
            <span className={hasScript ? 'text-step-complete font-semibold' : 'text-muted-foreground'}>Narration: {hasScript ? 'Ready' : 'Optional'}</span>
          </div>
        </div>
      </WorkshopCard>

      {/* Project info */}
      <WorkshopCard>
        <h2 className="font-bold text-sm mb-3">Project Details</h2>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Project</span><span className="font-semibold">{name}</span></div>
          {projectTitle && <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="font-semibold text-primary text-right max-w-[60%] truncate">{projectTitle}</span></div>}
          <div className="flex justify-between"><span className="text-muted-foreground">Concept</span><span className="font-semibold text-right max-w-[60%] truncate">{selectedIdea?.title}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Interior</span><span className="font-semibold capitalize">{interiorStyle.replace(/-/g, ' ')}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Mood</span><span className="font-semibold capitalize">{visualMood.replace(/-/g, ' ')}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Quality</span><span className="font-semibold capitalize">{qualityMode}</span></div>
        </div>
      </WorkshopCard>

      {/* ZIP structure */}
      <WorkshopCard>
        <h2 className="font-bold text-sm mb-3">ZIP Bundle Structure</h2>
        <div className="space-y-1.5 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2"><FolderOpen className="w-3 h-3 text-primary" /> /scenes — scene_01.png → scene_09.png</div>
          <div className="flex items-center gap-2"><FolderOpen className="w-3 h-3 text-primary" /> /transitions — transition_01_to_02.mp4 → …_08_to_09.mp4</div>
          <div className="flex items-center gap-2"><FolderOpen className="w-3 h-3 text-primary" /> /prompts — image + motion prompts per scene</div>
          <div className="flex items-center gap-2"><FolderOpen className="w-3 h-3 text-primary" /> /metadata — manifest.json + capcut_assembly_guide.txt</div>
        </div>
      </WorkshopCard>

      {/* Models */}
      <WorkshopCard>
        <h2 className="font-bold text-sm mb-3">Google Models</h2>
        <div className="flex flex-wrap gap-2">
          <ModelBadge label="Plan" model={models.planning} />
          <ModelBadge label="Image" model={models.image} />
          <ModelBadge label="Video" model={models.video} />
          <ModelBadge label="TTS" model={models.tts} />
        </div>
      </WorkshopCard>

      <StickyAction
        label={exporting ? 'Exporting…' : 'Export ZIP Bundle'}
        onClick={handleExport}
        disabled={exporting}
        secondary={{ label: 'Back', onClick: goToPrevStep }}
      />
    </div>
  );
}
