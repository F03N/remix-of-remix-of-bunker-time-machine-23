import { useRef } from 'react';
import { useMode4Store } from '@/store/useMode4Store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Upload, ImageIcon, ArrowRight } from 'lucide-react';

export function Mode4Setup() {
  const { name, setName, referenceImageUrl, referenceImageBase64, setReferenceImage, setCurrentStep } = useMode4Store();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const url = URL.createObjectURL(file);
      setReferenceImage(base64, url);
    };
    reader.readAsDataURL(file);
  };

  const canProceed = name.trim().length > 0 && (referenceImageBase64 || referenceImageUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Project Setup</h2>
        <p className="text-xs text-muted-foreground">Name your project and upload the final reference image (treated as Image 4).</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mode4-name">Project Name</Label>
        <Input
          id="mode4-name"
          placeholder="e.g. Villa Restoration"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
        />
      </div>

      <div className="space-y-2">
        <Label>Reference Image (Final Result)</Label>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {referenceImageUrl ? (
          <div className="space-y-2">
            <div className="rounded-lg overflow-hidden border border-border">
              <AspectRatio ratio={16 / 9}>
                <img src={referenceImageUrl} alt="Reference" className="w-full h-full object-cover" />
              </AspectRatio>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5 mr-1" /> Replace Image
            </Button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
          >
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs font-medium">Upload final reference image</span>
          </button>
        )}
      </div>

      <Button className="w-full" disabled={!canProceed} onClick={() => setCurrentStep(2)}>
        Continue to Prompts <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
