import { useState } from 'react';
import { useMode3Store } from '@/store/useMode3Store';
import { Download, Loader2, ImageIcon, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function Mode3Download() {
  const { imageSlots, videoSlots, selectedRoom, name, setCurrentStep } = useMode3Store();
  const [downloading, setDownloading] = useState(false);

  const images = imageSlots.filter((s) => s.imageUrl);
  const videos = videoSlots.filter((s) => s.videoUrl);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      // Metadata
      const metadata = {
        projectName: name,
        roomType: selectedRoom,
        createdAt: new Date().toISOString(),
        images: imageSlots.map((s) => ({ index: s.index + 1, stage: s.stage, prompt: s.prompt })),
        videos: videoSlots.map((s) => ({ index: s.index + 1, stage: s.stage, prompt: s.prompt })),
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Prompts text file
      let promptsText = `Mode 3 — Luxury Epoxy Floor\nProject: ${name}\nRoom: ${selectedRoom}\n\n`;
      imageSlots.forEach((s) => {
        promptsText += `=== Image ${s.index + 1}: ${s.stage} ===\n${s.prompt}\n\n`;
      });
      videoSlots.forEach((s) => {
        promptsText += `=== Video ${s.index + 1}: ${s.stage} ===\n${s.prompt}\n\n`;
      });
      zip.file('prompts.txt', promptsText);

      // Images folder
      const imagesFolder = zip.folder('images');
      for (const slot of images) {
        try {
          const response = await fetch(slot.imageUrl!);
          const blob = await response.blob();
          imagesFolder?.file(`image_${slot.index + 1}_${slot.stage.replace(/\s+/g, '_')}.png`, blob);
        } catch {
          console.warn(`Failed to download image ${slot.index + 1}`);
        }
      }

      // Videos folder
      const videosFolder = zip.folder('videos');
      for (const slot of videos) {
        try {
          const response = await fetch(slot.videoUrl!);
          const blob = await response.blob();
          videosFolder?.file(`video_${slot.index + 1}_${slot.stage.replace(/\s+/g, '_')}.mp4`, blob);
        } catch {
          console.warn(`Failed to download video ${slot.index + 1}`);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(name || 'mode3').replace(/\s+/g, '_')}_epoxy_floor.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (err) {
      toast.error('Failed to create download package');
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Download</h2>
        <p className="text-xs text-muted-foreground">Export your epoxy floor transformation assets as a ZIP package.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <ImageIcon className="w-5 h-5 text-primary mx-auto mb-1" />
          <span className="text-lg font-bold block">{images.length}/4</span>
          <span className="text-[10px] text-muted-foreground">Images</span>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <Video className="w-5 h-5 text-primary mx-auto mb-1" />
          <span className="text-lg font-bold block">{videos.length}/3</span>
          <span className="text-[10px] text-muted-foreground">Videos</span>
        </div>
        <div className="p-3 rounded-xl border border-border bg-card text-center">
          <FileText className="w-5 h-5 text-primary mx-auto mb-1" />
          <span className="text-lg font-bold block">7</span>
          <span className="text-[10px] text-muted-foreground">Prompts</span>
        </div>
      </div>

      {/* Package contents */}
      <div className="p-3 rounded-xl border border-border bg-card space-y-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Package Contents</span>
        <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
          <li>📁 images/ — 4 transformation stage images (9:16)</li>
          <li>📁 videos/ — 3 transition videos (9:16)</li>
          <li>📄 prompts.txt — All image & video prompts</li>
          <li>📄 metadata.json — Project metadata</li>
        </ul>
      </div>

      <button
        onClick={handleDownloadAll}
        disabled={downloading || (images.length === 0 && videos.length === 0)}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-30 flex items-center justify-center gap-2 transition-opacity"
      >
        {downloading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Preparing ZIP…</>
        ) : (
          <><Download className="w-4 h-4" /> Download All Assets</>
        )}
      </button>

      <button
        onClick={() => setCurrentStep(4)}
        className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        Back to Videos
      </button>
    </div>
  );
}
