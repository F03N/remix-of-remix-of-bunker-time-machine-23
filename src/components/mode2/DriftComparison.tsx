import { useState, useRef, useCallback } from 'react';
import { Eye, ArrowLeftRight, X } from 'lucide-react';

interface DriftComparisonProps {
  referenceImageUrl: string;
  sceneImageUrl: string;
  sceneIndex: number;
  sceneTitle: string;
  onClose: () => void;
}

const DRIFT_CHECKLIST = [
  { label: 'Room proportions', detail: 'Width-to-height ratio matches reference' },
  { label: 'Window count & position', detail: 'Same number of windows in same locations' },
  { label: 'Door count & position', detail: 'Same number of doors in same locations' },
  { label: 'Floor opening', detail: 'Hole/gap in same position, shape, and scale' },
  { label: 'Ceiling height', detail: 'Ceiling line at same relative height in frame' },
  { label: 'Wall segments', detail: 'Proportions between openings unchanged' },
  { label: 'No luxury upgrade', detail: 'Materials match original quality level' },
];

export function DriftComparison({ referenceImageUrl, sceneImageUrl, sceneIndex, sceneTitle, onClose }: DriftComparisonProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [mode, setMode] = useState<'slider' | 'sideBySide'>('slider');
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !dragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handlePointerDown = useCallback(() => { dragging.current = true; }, []);
  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);
  const handlePointerMove = useCallback((e: React.PointerEvent) => handleMove(e.clientX), [handleMove]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold">Drift Comparison — Scene {sceneIndex + 1}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'slider' ? 'sideBySide' : 'slider')}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border"
          >
            <ArrowLeftRight className="w-3 h-3" />
            {mode === 'slider' ? 'Side-by-side' : 'Slider'}
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comparison view */}
      {mode === 'slider' ? (
        <div
          ref={containerRef}
          className="relative w-full aspect-[9/16] rounded-lg overflow-hidden cursor-col-resize select-none touch-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerMove={handlePointerMove}
        >
          {/* Scene image (full background) */}
          <img
            src={sceneImageUrl}
            alt={`Scene ${sceneIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Reference image (clipped by slider) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={referenceImageUrl}
              alt="Reference"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%', maxWidth: 'none' }}
            />
          </div>
          {/* Slider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary shadow-lg z-10"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
              <ArrowLeftRight className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
          {/* Labels */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-background/80 text-[9px] font-bold z-20">
            Reference
          </div>
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-background/80 text-[9px] font-bold z-20">
            Scene {sceneIndex + 1}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <img
              src={referenceImageUrl}
              alt="Reference"
              className="w-full aspect-[9/16] rounded-lg object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-background/80 text-[9px] font-bold">
              Reference
            </div>
          </div>
          <div className="relative">
            <img
              src={sceneImageUrl}
              alt={`Scene ${sceneIndex + 1}`}
              className="w-full aspect-[9/16] rounded-lg object-cover"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-background/80 text-[9px] font-bold">
              Scene {sceneIndex + 1}
            </div>
          </div>
        </div>
      )}

      {/* Drift checklist */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drift Checklist</p>
        {DRIFT_CHECKLIST.map((item, i) => {
          // Show floor opening only for scenes 1-5
          if (item.label === 'Floor opening' && sceneIndex > 5) return null;
          return (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <span className="text-muted-foreground shrink-0">▸</span>
              <div>
                <span className="font-semibold text-foreground">{item.label}:</span>
                <span className="ml-1 text-muted-foreground">{item.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}