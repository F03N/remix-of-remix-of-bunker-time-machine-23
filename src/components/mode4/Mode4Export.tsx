import { useState } from 'react';
import { Download, Loader2, Package, Image, Film, FileText, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMode4Store } from '@/store/useMode4Store';
import { toast } from 'sonner';
import JSZip from 'jszip';

async function fetchAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.blob();
}

function base64ToBlob(base64: string, mime = 'image/png'): Blob {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  return new Blob([ab], { type: mime });
}

export function Mode4Export() {
  const { name, referenceImageBase64, referenceImageUrl, imageSlots, videoSlots } = useMode4Store();
  const [exporting, setExporting] = useState(false);

  const imagesReady = imageSlots.filter((s) => s.generatedImageUrl).length;
  const videosReady = videoSlots.filter((s) => s.generatedVideoUrl).length;
  const hasAnything = imagesReady > 0 || videosReady > 0;

  const handleExport = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      const safeName = (name || 'mode4-project').replace(/[^a-zA-Z0-9_-]/g, '_');

      // /reference
      if (referenceImageBase64) {
        zip.file('reference/reference-image.png', base64ToBlob(referenceImageBase64));
      } else if (referenceImageUrl) {
        try {
          const blob = await fetchAsBlob(referenceImageUrl);
          zip.file('reference/reference-image.png', blob);
        } catch { /* skip if unavailable */ }
      }

      // /images
      for (const slot of imageSlots) {
        if (slot.imageBase64) {
          zip.file(`images/image_${slot.index + 1}_${slot.title.replace(/\s+/g, '_')}.png`, base64ToBlob(slot.imageBase64));
        } else if (slot.generatedImageUrl) {
          try {
            const blob = await fetchAsBlob(slot.generatedImageUrl);
            zip.file(`images/image_${slot.index + 1}_${slot.title.replace(/\s+/g, '_')}.png`, blob);
          } catch { /* skip */ }
        }
      }

      // /videos
      for (const slot of videoSlots) {
        if (slot.generatedVideoUrl) {
          try {
            const blob = await fetchAsBlob(slot.generatedVideoUrl);
            zip.file(`videos/video_${slot.index + 1}_${slot.title.replace(/\s+/g, '_')}.mp4`, blob);
          } catch { /* skip */ }
        }
      }

      // /prompts
      const imagePromptsText = imageSlots
        .map((s) => `## IMAGE ${s.index + 1} — ${s.title}\n\n${s.prompt || '(no prompt)'}`)
        .join('\n\n---\n\n');
      zip.file('prompts/image_prompts.md', imagePromptsText);

      const videoPromptsText = videoSlots
        .map((s) => `## VIDEO ${s.index + 1} — ${s.title}\n\n${s.prompt || '(no prompt)'}`)
        .join('\n\n---\n\n');
      zip.file('prompts/video_prompts.md', videoPromptsText);

      // /metadata
      const metadata = {
        projectName: name,
        exportDate: new Date().toISOString(),
        mode: 'Mode 4 — Cinematic Reverse-Restoration',
        images: imageSlots.map((s) => ({ index: s.index, title: s.title, hasImage: !!s.generatedImageUrl })),
        videos: videoSlots.map((s) => ({ index: s.index, title: s.title, hasVideo: !!s.generatedVideoUrl })),
        hasReferenceImage: !!(referenceImageBase64 || referenceImageUrl),
      };
      zip.file('metadata/project.json', JSON.stringify(metadata, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}_export.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Export</h2>
        <p className="text-xs text-muted-foreground">Download all generated assets as a single ZIP package.</p>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5"><FolderOpen className="w-4 h-4" /> Package Contents</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Image className="w-3.5 h-3.5" /> Reference image
            <span className={referenceImageBase64 || referenceImageUrl ? 'text-green-500' : 'text-destructive'}>
              {referenceImageBase64 || referenceImageUrl ? '✓' : '—'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Image className="w-3.5 h-3.5" /> Images
            <span className={imagesReady === 4 ? 'text-green-500' : 'text-amber-500'}>{imagesReady}/4</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Film className="w-3.5 h-3.5" /> Videos
            <span className={videosReady === 4 ? 'text-green-500' : 'text-amber-500'}>{videosReady}/4</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FileText className="w-3.5 h-3.5" /> Prompts + Metadata
            <span className="text-green-500">✓</span>
          </div>
        </div>
      </div>

      {/* ZIP structure preview */}
      <div className="rounded-lg border border-border bg-muted/10 p-4">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Package className="w-4 h-4" /> ZIP Structure</h3>
        <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed">
{`📁 ${name || 'project'}_export.zip
├── 📁 reference/
│   └── reference-image.png
├── 📁 images/
│   ├── image_1_*.png
│   ├── image_2_*.png
│   ├── image_3_*.png
│   └── image_4_*.png
├── 📁 videos/
│   ├── video_1_*.mp4
│   ├── video_2_*.mp4
│   ├── video_3_*.mp4
│   └── video_4_*.mp4
├── 📁 prompts/
│   ├── image_prompts.md
│   └── video_prompts.md
└── 📁 metadata/
    └── project.json`}
        </pre>
      </div>

      <Button className="w-full" onClick={handleExport} disabled={exporting || !hasAnything}>
        {exporting
          ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Exporting…</>
          : <><Download className="w-4 h-4 mr-1" /> Download ZIP Package</>}
      </Button>
    </div>
  );
}
