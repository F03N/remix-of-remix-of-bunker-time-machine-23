import { useState, useRef } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { WorkshopCard } from '@/components/WorkshopCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Home, Mountain, ImageIcon, Upload, Check, Loader2, AlertCircle } from 'lucide-react';
import { MODE2_TEMPLATES } from '@/types/mode';
import type { Mode2Path, Mode2Source, Mode2Template } from '@/types/mode';
import { classifyImage, imageUrlToBase64 } from '@/lib/mode2-api';
import { toast } from 'sonner';

export function Mode2Setup() {
  const store = useMode2Store();
  const {
    name, setName, path, setPath, source, setSource,
    customNotes, setCustomNotes, goToNextStep,
    referenceImageBase64, referenceImageUrl, setReferenceImage,
    selectedTemplateId, setSelectedTemplate,
    classification, setClassification, classifying, setClassifying,
    setMaterialMapping, initScenesForClassification,
  } = store;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classificationError, setClassificationError] = useState<string | null>(null);

  const filteredTemplates = MODE2_TEMPLATES.filter(t =>
    !path || t.category === path
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      setReferenceImage(base64, dataUrl);
      await runClassification(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateSelect = async (template: Mode2Template) => {
    setSelectedTemplate(template.id);
    setPath(template.category);
    setReferenceImage('', template.imagePath);
    setClassifying(true);
    setClassificationError(null);

    try {
      // Convert template image to base64 for classification and later use
      const base64 = await imageUrlToBase64(template.imagePath);
      setReferenceImage(base64, template.imagePath);
      
      // Run real classification on template image
      const result = await classifyImage(base64);
      setClassification(result.classification);
      setMaterialMapping(result.materialMapping);
      initScenesForClassification(result.classification);
      toast.success(`Classified as: ${result.classification.toUpperCase()}`);
    } catch (err) {
      // Fallback to known category if classification fails
      setClassification(template.category);
      initScenesForClassification(template.category);
      const msg = err instanceof Error ? err.message : 'Classification failed';
      setClassificationError(msg);
      toast.info(`Using template category: ${template.category.toUpperCase()}`);
    } finally {
      setClassifying(false);
    }
  };

  const runClassification = async (base64: string) => {
    setClassifying(true);
    setClassificationError(null);
    try {
      const result = await classifyImage(base64);
      setClassification(result.classification);
      setMaterialMapping(result.materialMapping);
      initScenesForClassification(result.classification);
      setPath(result.classification);
      toast.success(`Classified as: ${result.classification.toUpperCase()}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Classification failed';
      setClassificationError(msg);
      toast.error(msg);
    } finally {
      setClassifying(false);
    }
  };

  const canProceed = name.trim().length > 0 && classification !== null && !classifying && (
    (source === 'upload' && referenceImageBase64) ||
    (source === 'template' && selectedTemplateId)
  );

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="px-1">
        <h1 className="text-xl font-bold mb-1">Renovation Setup</h1>
        <p className="text-sm text-muted-foreground">Upload a reference image or choose a template to start your renovation project.</p>
      </div>

      {/* Project Name */}
      <WorkshopCard>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Project Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Renovation Project"
          className="bg-secondary border-border"
        />
      </WorkshopCard>

      {/* Source Selection */}
      <WorkshopCard>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Source</label>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'template' as Mode2Source, label: 'Template Library', icon: ImageIcon, desc: 'Choose from curated scenes' },
            { value: 'upload' as Mode2Source, label: 'Upload Image', icon: Upload, desc: 'Use your own reference' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSource(opt.value);
                if (opt.value === 'upload') {
                  setSelectedTemplate(null);
                } else {
                  setReferenceImage('', '');
                  setClassification(null);
                }
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                source === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <opt.icon className={`w-6 h-6 ${source === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-xs font-bold">{opt.label}</span>
              <span className="text-[10px] text-muted-foreground text-center">{opt.desc}</span>
            </button>
          ))}
        </div>
      </WorkshopCard>

      {/* Upload Section */}
      {source === 'upload' && (
        <WorkshopCard>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Reference Image</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {referenceImageUrl ? (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-border">
                <img
                  src={referenceImageUrl}
                  alt="Reference"
                  className="w-full max-h-64 object-contain bg-secondary"
                />
                <button
                  onClick={() => {
                    setReferenceImage('', '');
                    setClassification(null);
                    setMaterialMapping(null);
                    setClassificationError(null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-xs hover:bg-background"
                >
                  ✕
                </button>
              </div>

              {classifying && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-primary font-medium">Analyzing image…</span>
                </div>
              )}

              {classificationError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-destructive">{classificationError}</span>
                  <button
                    onClick={() => runClassification(referenceImageBase64)}
                    className="ml-auto text-xs font-semibold text-destructive underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {classification && !classifying && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">
                    Classified as: <strong>{classification.toUpperCase()}</strong>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center gap-3 bg-secondary/30"
            >
              <Upload className="w-8 h-8 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">Click to upload your reference image</span>
              <span className="text-[10px] text-muted-foreground/60">JPG, PNG, WebP supported</span>
            </button>
          )}
        </WorkshopCard>
      )}

      {/* Template Library */}
      {source === 'template' && (
        <WorkshopCard>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Choose Template</label>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setPath(null)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                !path ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPath('interior')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                path === 'interior' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}
            >
              <Home className="w-3 h-3" /> Interior
            </button>
            <button
              onClick={() => setPath('exterior')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                path === 'exterior' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}
            >
              <Mountain className="w-3 h-3" /> Exterior
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredTemplates.map((t) => {
              const isSelected = selectedTemplateId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t)}
                  disabled={classifying}
                  className={`relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40'
                  } ${classifying ? 'opacity-60 cursor-wait' : ''}`}
                >
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={t.imagePath}
                      alt={t.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs font-bold text-center">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground text-center line-clamp-2">{t.description}</span>
                  <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                    t.category === 'interior' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {t.category}
                  </span>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Classification status for templates */}
          {classifying && selectedTemplateId && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 mt-3">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs text-primary font-medium">Analyzing template image…</span>
            </div>
          )}
        </WorkshopCard>
      )}

      {/* Custom Notes */}
      <WorkshopCard>
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes (Optional)</label>
        <Textarea
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          placeholder="Any specific requirements or preferences…"
          className="bg-secondary border-border min-h-[60px] text-xs"
        />
      </WorkshopCard>

      {/* Classification Result */}
      {classification && !classifying && (
        <WorkshopCard>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Classification</label>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              classification === 'interior' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
            }`}>
              {classification === 'interior'
                ? <Home className="w-5 h-5 text-blue-400" />
                : <Mountain className="w-5 h-5 text-emerald-400" />
              }
            </div>
            <div>
              <span className="text-sm font-bold">{classification.toUpperCase()}</span>
              <p className="text-[10px] text-muted-foreground">8-step renovation workflow will follow this classification</p>
            </div>
          </div>
        </WorkshopCard>
      )}

      {/* Continue Button */}
      <button
        onClick={goToNextStep}
        disabled={!canProceed}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Continue to Plan
      </button>
    </div>
  );
}
