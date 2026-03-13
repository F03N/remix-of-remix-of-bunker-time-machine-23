import { useState } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { getTransitionSpeedRule } from '@/lib/mode2-api';
import { WorkshopCard } from '@/components/WorkshopCard';
import { Film, Play, ChevronLeft, ChevronRight } from 'lucide-react';

export function Mode2VideoPreview() {
  const { scenes, transitions } = useMode2Store();
  const [activeIndex, setActiveIndex] = useState(0);
  
  const readyTransitions = transitions.filter(t => t.generatedVideoUrl);
  if (readyTransitions.length === 0) return null;

  const tr = transitions[activeIndex];
  const startScene = scenes[tr.startSceneIndex];
  const endScene = scenes[tr.endSceneIndex];
  const speedRule = getTransitionSpeedRule(activeIndex);

  return (
    <WorkshopCard>
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Video Preview
      </label>

      {/* Navigation tabs */}
      <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
        {transitions.map((t, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            disabled={!t.generatedVideoUrl}
            className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              activeIndex === i
                ? 'bg-primary text-primary-foreground'
                : t.generatedVideoUrl
                  ? 'bg-secondary text-foreground hover:bg-secondary/80'
                  : 'bg-secondary/30 text-muted-foreground/40 cursor-not-allowed'
            }`}
          >
            <Film className="w-2.5 h-2.5" />
            {i + 1}
          </button>
        ))}
      </div>

      {/* Start / Video / End */}
      <div className="flex flex-col gap-2">
        {/* Start + End frame thumbnails */}
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 flex flex-col">
            <span className="text-[8px] font-bold text-muted-foreground uppercase mb-1 text-center">Start Frame</span>
            <div className="aspect-[9/16] rounded-lg overflow-hidden bg-secondary/50 border border-border/50">
              {startScene.generatedImageUrl ? (
                <img
                  src={startScene.generatedImageUrl}
                  alt={`Scene ${tr.startSceneIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">Scene {tr.startSceneIndex + 1}</span>
                </div>
              )}
            </div>
            <span className="text-[9px] font-medium text-center mt-1 truncate">{startScene.title}</span>
          </div>

          <div className="flex-1 flex flex-col">
            <span className="text-[8px] font-bold text-muted-foreground uppercase mb-1 text-center">End Frame</span>
            <div className="aspect-[9/16] rounded-lg overflow-hidden bg-secondary/50 border border-border/50">
              {endScene.generatedImageUrl ? (
                <img
                  src={endScene.generatedImageUrl}
                  alt={`Scene ${tr.endSceneIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">Scene {tr.endSceneIndex + 1}</span>
                </div>
              )}
            </div>
            <span className="text-[9px] font-medium text-center mt-1 truncate">{endScene.title}</span>
          </div>
        </div>

        {/* Speed label */}
        <div className="flex items-center justify-center gap-2">
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
            speedRule === 'realtime'
              ? 'bg-accent text-accent-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}>
            {speedRule === 'realtime' ? '1× Real-Time Speed' : '⏩ Timelapse'}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">8s duration</span>
        </div>

        {/* Video player */}
        {tr.generatedVideoUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-black">
            <video
              key={tr.generatedVideoUrl}
              src={tr.generatedVideoUrl}
              controls
              playsInline
              className="w-full aspect-[9/16]"
              poster={startScene.generatedImageUrl}
            />
          </div>
        ) : (
          <div className="w-full aspect-[9/16] rounded-xl bg-secondary/30 border border-border/50 flex flex-col items-center justify-center gap-2">
            <Play className="w-8 h-8 text-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/50">Not yet generated</span>
          </div>
        )}

        {/* Transition info */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-muted-foreground">
            Transition {activeIndex + 1} of 7
          </span>
          <span className="text-[10px] text-muted-foreground">
            Scene {tr.startSceneIndex + 1} → Scene {tr.endSceneIndex + 1}
          </span>
        </div>

        {/* Prev / Next */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>
          <button
            onClick={() => setActiveIndex(Math.min(6, activeIndex + 1))}
            disabled={activeIndex === 6}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </WorkshopCard>
  );
}
