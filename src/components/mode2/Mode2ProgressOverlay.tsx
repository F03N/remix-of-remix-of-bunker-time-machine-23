import { useMode2Store } from '@/store/useMode2Store';
import { getTransitionSpeedRule } from '@/lib/mode2-api';
import {
  Check, Loader2, ImageIcon, Film, ClipboardList,
  ScanSearch, FileArchive,
} from 'lucide-react';

type StageStatus = 'pending' | 'active' | 'done';

interface StageItem {
  label: string;
  status: StageStatus;
  detail?: string;
  icon: React.ReactNode;
}

export function Mode2ProgressOverlay() {
  const {
    classification, classifying,
    planSummary, planGenerating,
    scenes, transitions,
  } = useMode2Store();

  const imagesGenerated = scenes.filter(s => s.generatedImageUrl).length;
  const imagesGenerating = scenes.some(s => s.generating);
  const videosGenerated = transitions.filter(t => t.generatedVideoUrl).length;
  const videosGenerating = transitions.some(t => t.generating);

  const getStatus = (done: boolean, active: boolean): StageStatus =>
    done ? 'done' : active ? 'active' : 'pending';

  const stages: StageItem[] = [
    {
      label: 'Classification',
      status: getStatus(!!classification, classifying),
      detail: classification ? classification.toUpperCase() : classifying ? 'Analyzing…' : undefined,
      icon: <ScanSearch className="w-3.5 h-3.5" />,
    },
    {
      label: 'Plan Generation',
      status: getStatus(!!planSummary, planGenerating),
      detail: planGenerating ? 'Generating plan…' : planSummary ? '8 images + 7 videos planned' : undefined,
      icon: <ClipboardList className="w-3.5 h-3.5" />,
    },
    {
      label: 'Image Generation',
      status: getStatus(imagesGenerated === 8, imagesGenerating),
      detail: `${imagesGenerated}/8 scenes`,
      icon: <ImageIcon className="w-3.5 h-3.5" />,
    },
    // Individual scene progress
    ...scenes.map((s, i) => ({
      label: `  Scene ${i + 1}: ${s.title}`,
      status: getStatus(!!s.generatedImageUrl, s.generating) as StageStatus,
      detail: s.generating ? 'Generating…' : s.generatedImageUrl ? '✓' : undefined,
      icon: <span className="text-[9px] font-bold w-3.5 text-center">{i + 1}</span>,
    })),
    {
      label: 'Video Generation',
      status: getStatus(videosGenerated === 7, videosGenerating),
      detail: `${videosGenerated}/7 transitions`,
      icon: <Film className="w-3.5 h-3.5" />,
    },
    // Individual transition progress
    ...transitions.map((t, i) => ({
      label: `  Transition ${i + 1} (${getTransitionSpeedRule(i) === 'realtime' ? '1× Real' : 'TL'})`,
      status: getStatus(!!t.generatedVideoUrl, t.generating) as StageStatus,
      detail: t.generating ? 'Generating…' : t.generatedVideoUrl ? '✓' : undefined,
      icon: <span className="text-[9px] font-bold w-3.5 text-center">V{i + 1}</span>,
    })),
    {
      label: 'Export Ready',
      status: getStatus(imagesGenerated === 8 && videosGenerated === 7, false),
      detail: imagesGenerated === 8 && videosGenerated === 7 ? 'All assets ready' : undefined,
      icon: <FileArchive className="w-3.5 h-3.5" />,
    },
  ];

  // Calculate overall progress
  const totalSteps = 2 + 8 + 7; // classification + plan + 8 images + 7 videos
  const completedSteps =
    (classification ? 1 : 0) +
    (planSummary ? 1 : 0) +
    imagesGenerated +
    videosGenerated;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="flex flex-col gap-2">
      {/* Overall progress bar */}
      <div className="flex items-center gap-3 px-1 mb-1">
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-muted-foreground w-10 text-right">{progressPercent}%</span>
      </div>

      {/* Stage list */}
      <div className="flex flex-col gap-0.5 max-h-[320px] overflow-y-auto pr-1">
        {stages.map((stage, i) => {
          const isSubItem = stage.label.startsWith('  ');
          return (
            <div
              key={i}
              className={`flex items-center gap-2 py-1 ${isSubItem ? 'pl-4' : 'pl-0'} ${
                stage.status === 'active' ? 'text-primary' : stage.status === 'done' ? 'text-foreground' : 'text-muted-foreground/50'
              }`}
            >
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {stage.status === 'done' ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : stage.status === 'active' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span className={`text-[10px] font-medium flex-1 truncate ${isSubItem ? '' : 'font-semibold'}`}>
                {stage.label.trim()}
              </span>
              {stage.detail && stage.detail !== '✓' && (
                <span className="text-[9px] text-muted-foreground shrink-0">{stage.detail}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
