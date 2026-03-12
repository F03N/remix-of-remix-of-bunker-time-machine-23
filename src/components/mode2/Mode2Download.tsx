import { useState } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { WorkshopCard } from '@/components/WorkshopCard';
import { toast } from 'sonner';
import { Download, FileArchive, ImageIcon, Film, FileText, Loader2, Check } from 'lucide-react';
import JSZip from 'jszip';

export function Mode2Download() {
  const store = useMode2Store();
  const { goToPrevStep, scenes, transitions, planSummary, materialMapping, classification, name } = store;
  const [exporting, setExporting] = useState(false);

  const imagesReady = scenes.filter(s => s.generatedImageUrl).length;
  const videosReady = transitions.filter(t => t.generatedVideoUrl).length;
  const dualVideosCount = transitions.filter(t => t.generatedVideoUrl2).length;
  const midpointsReady = transitions.filter(t => t.midpointImageUrl).length;
  const canExport = imagesReady > 0 || videosReady > 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const projectFolder = zip.folder('mode2-project') as JSZip;

      // Metadata
      const metadata = {
        projectName: name,
        classification,
        generatedAt: new Date().toISOString(),
        imagesCount: imagesReady,
        videosCount: videosReady,
        materialMapping,
      };
      projectFolder.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Plan summary
      if (planSummary) {
        projectFolder.file('plan-summary.txt', planSummary);
      }

      // Image prompts
      const imagePromptsFolder = projectFolder.folder('prompts') as JSZip;
      scenes.forEach((scene, i) => {
        if (scene.imagePrompt) {
          imagePromptsFolder.file(`image_${i + 1}_${scene.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`, scene.imagePrompt);
        }
      });

      // Video prompts
      transitions.forEach((tr, i) => {
        if (tr.motionPrompt) {
          imagePromptsFolder.file(`video_${i + 1}_transition.txt`, tr.motionPrompt);
        }
      });

      // Download and add images
      const imagesFolder = projectFolder.folder('images') as JSZip;
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (scene.generatedImageUrl) {
          try {
            const response = await fetch(scene.generatedImageUrl);
            if (response.ok) {
              const blob = await response.blob();
              imagesFolder.file(`scene_${i + 1}_${scene.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`, blob);
            }
          } catch {
            console.warn(`Failed to fetch image ${i + 1}`);
          }
        }
      }

      // Download and add midpoint images
      const midpointsFolder = projectFolder.folder('midpoints') as JSZip;
      for (let i = 0; i < transitions.length; i++) {
        const tr = transitions[i];
        if (tr.midpointImageUrl) {
          try {
            const response = await fetch(tr.midpointImageUrl);
            if (response.ok) {
              const blob = await response.blob();
              midpointsFolder.file(`midpoint_${i + 1}.png`, blob);
            }
          } catch {
            console.warn(`Failed to fetch midpoint image ${i + 1}`);
          }
        }
      }

      // Download and add videos
      const videosFolder = projectFolder.folder('videos') as JSZip;
      for (let i = 0; i < transitions.length; i++) {
        const tr = transitions[i];
        if (tr.generatedVideoUrl) {
          try {
            const response = await fetch(tr.generatedVideoUrl);
            if (response.ok) {
              const blob = await response.blob();
              videosFolder.file(`transition_${i + 1}a_scene${tr.startSceneIndex + 1}_to_mid.mp4`, blob);
            }
          } catch {
            console.warn(`Failed to fetch video ${i + 1}a`);
          }
        }
        if (tr.generatedVideoUrl2) {
          try {
            const response = await fetch(tr.generatedVideoUrl2);
            if (response.ok) {
              const blob = await response.blob();
              videosFolder.file(`transition_${i + 1}b_mid_to_scene${tr.endSceneIndex + 1}.mp4`, blob);
            }
          } catch {
            console.warn(`Failed to fetch video ${i + 1}b`);
          }
        }
      }

      // Material mapping
      if (materialMapping) {
        const mappingText = Object.entries(materialMapping)
          .map(([key, val]) => `${key.toUpperCase()}: ${val}`)
          .join('\n\n');
        projectFolder.file('material-mapping.txt', mappingText);
      }

      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(name || 'mode2-project').replace(/[^a-zA-Z0-9]/g, '_')}_export.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Export downloaded!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="px-1">
        <h1 className="text-xl font-bold mb-1">Export & Download</h1>
        <p className="text-sm text-muted-foreground">Download your Mode 2 renovation assets as a ZIP package.</p>
      </div>

      {/* Status summary */}
      <WorkshopCard>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Asset Status</label>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">Images</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-secondary rounded-full">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(imagesReady / 8) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-muted-foreground">{imagesReady}/8</span>
              {imagesReady === 8 && <Check className="w-3 h-3 text-green-500" />}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">Videos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-secondary rounded-full">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(videosReady / 7) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-muted-foreground">{videosReady}/7</span>
              {videosReady === 7 && <Check className="w-3 h-3 text-green-500" />}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs">Prompts & Mapping</span>
            </div>
            <Check className="w-3 h-3 text-green-500" />
          </div>
        </div>
      </WorkshopCard>

      {/* ZIP Contents Preview */}
      <WorkshopCard>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">ZIP Contents</label>
        <div className="text-[10px] text-muted-foreground font-mono space-y-0.5 bg-secondary/50 p-3 rounded-lg">
          <p>📁 mode2-project/</p>
          <p className="pl-4">📄 metadata.json</p>
          <p className="pl-4">📄 plan-summary.txt</p>
          <p className="pl-4">📄 material-mapping.txt</p>
          <p className="pl-4">📁 images/ ({imagesReady} files)</p>
          <p className="pl-4">📁 midpoints/ ({midpointsReady} files)</p>
          <p className="pl-4">📁 videos/ ({videosReady + dualVideosCount} files)</p>
          <p className="pl-4">📁 prompts/ ({imagesReady + videosReady} files)</p>
        </div>
      </WorkshopCard>

      {/* Download button */}
      <WorkshopCard>
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <FileArchive className="w-7 h-7 text-primary" />
          </div>
          <button
            onClick={handleExport}
            disabled={!canExport || exporting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Exporting…' : 'Download ZIP'}
          </button>
          {!canExport && (
            <p className="text-[10px] text-muted-foreground">Generate at least one image or video to export.</p>
          )}
        </div>
      </WorkshopCard>

      <button onClick={goToPrevStep} className="w-full py-3 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
        Back to Videos
      </button>
    </div>
  );
}
