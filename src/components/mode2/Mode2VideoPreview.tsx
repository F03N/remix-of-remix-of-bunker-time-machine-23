import { useState, useRef, useCallback } from 'react';
import { useMode2Store } from '@/store/useMode2Store';
import { getTransitionSpeedRule } from '@/lib/mode2-api';
import { WorkshopCard } from '@/components/WorkshopCard';
import { Film, Play, Pause, ChevronLeft, ChevronRight, ListVideo } from 'lucide-react';

type PreviewMode = 'single' | 'sequential';

export function Mode2VideoPreview() {
  const { scenes, transitions } = useMode2Store();
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<PreviewMode>('single');
  const [seqPlaying, setSeqPlaying] = useState(false);
  const [seqIndex, setSeqIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Build ordered list of playable indices for sequential mode
  const playableIndices = transitions
    .map((t, i) => (t.generatedVideoUrl ? i : -1))
    .filter(i => i >= 0);

  const readyTransitions = transitions.filter(t => t.generatedVideoUrl);

  // Sequential: when a video ends, advance to the next
  const handleVideoEnded = useCallback(() => {
    if (mode !== 'sequential' || !seqPlaying) return;
    const currentPlayablePos = playableIndices.indexOf(seqIndex);
    if (currentPlayablePos < playableIndices.length - 1) {
      setSeqIndex(playableIndices[currentPlayablePos + 1]);
    } else {
      setSeqPlaying(false);
    }
  }, [mode, seqPlaying, seqIndex, playableIndices]);

  const startSequentialPlay = useCallback(() => {
    setMode('sequential');
    setSeqIndex(playableIndices[0] ?? 0);
    setSeqPlaying(true);
  }, [playableIndices]);

  const stopSequentialPlay = useCallback(() => {
    setSeqPlaying(false);
    if (videoRef.current) videoRef.current.pause();
  }, []);

  const switchToSingle = useCallback((index: number) => {
    setMode('single');
    setSeqPlaying(false);
    setActiveIndex(index);
  }, []);

  if (readyTransitions.length === 0) return null;

  const currentIndex = mode === 'sequential' ? seqIndex : activeIndex;
  const tr = transitions[currentIndex];
  const startScene = scenes[tr.startSceneIndex];
  const endScene = scenes[tr.endSceneIndex];
  const speedRule = getTransitionSpeedRule(currentIndex);

  // Sequential: when a video ends, advance to the next
  const handleVideoEnded = useCallback(() => {
    if (mode !== 'sequential' || !seqPlaying) return;

    const currentPlayablePos = playableIndices.indexOf(seqIndex);
    if (currentPlayablePos < playableIndices.length - 1) {
      const nextIndex = playableIndices[currentPlayablePos + 1];
      setSeqIndex(nextIndex);
      // The video element will auto-play via the useEffect-like key change + autoPlay
    } else {
      // Reached the end
      setSeqPlaying(false);
    }
  }, [mode, seqPlaying, seqIndex, playableIndices]);

  const startSequentialPlay = () => {
    setMode('sequential');
    setSeqIndex(playableIndices[0] ?? 0);
    setSeqPlaying(true);
  };

  const stopSequentialPlay = () => {
    setSeqPlaying(false);
    if (videoRef.current) videoRef.current.pause();
  };

  const switchToSingle = (index: number) => {
    setMode('single');
    setSeqPlaying(false);
    setActiveIndex(index);
  };

  return (
    <WorkshopCard>
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Video Preview
        </label>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => { setMode('single'); setSeqPlaying(false); }}
            className={`px-2 py-1 rounded-md text-[9px] font-semibold transition-all ${
              mode === 'single' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setMode('sequential')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-semibold transition-all ${
              mode === 'sequential' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListVideo className="w-2.5 h-2.5" />
            All
          </button>
        </div>
      </div>

      {/* Navigation tabs (single mode) */}
      {mode === 'single' && (
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
      )}

      {/* Sequential timeline */}
      {mode === 'sequential' && (
        <div className="flex flex-col gap-2 mb-3">
          {/* Play All / Pause button */}
          <button
            onClick={seqPlaying ? stopSequentialPlay : startSequentialPlay}
            disabled={playableIndices.length === 0}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {seqPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {seqPlaying ? 'Pause' : `Play All (${playableIndices.length} videos)`}
          </button>

          {/* Mini timeline */}
          <div className="flex items-center gap-0.5">
            {transitions.map((t, i) => {
              const isReady = !!t.generatedVideoUrl;
              const isCurrent = seqIndex === i;
              const isPlayed = playableIndices.indexOf(i) < playableIndices.indexOf(seqIndex);
              return (
                <button
                  key={i}
                  onClick={() => { if (isReady) { setSeqIndex(i); setSeqPlaying(true); } }}
                  disabled={!isReady}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    isCurrent && seqPlaying
                      ? 'bg-primary animate-pulse'
                      : isCurrent
                        ? 'bg-primary'
                        : isPlayed
                          ? 'bg-primary/40'
                          : isReady
                            ? 'bg-secondary'
                            : 'bg-secondary/30'
                  }`}
                  title={`Transition ${i + 1}`}
                />
              );
            })}
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-[9px] text-muted-foreground">Transition {seqIndex + 1} / 7</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
              getTransitionSpeedRule(seqIndex) === 'realtime'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}>
              {getTransitionSpeedRule(seqIndex) === 'realtime' ? '1× Real' : 'Timelapse'}
            </span>
          </div>
        </div>
      )}

      {/* Start / Video / End */}
      <div className="flex flex-col gap-2">
        {/* Start + End frame thumbnails */}
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 flex flex-col">
            <span className="text-[8px] font-bold text-muted-foreground uppercase mb-1 text-center">Start Frame</span>
            <div className="aspect-[9/16] rounded-lg overflow-hidden bg-secondary/50 border border-border/50">
              {startScene.generatedImageUrl ? (
                <img src={startScene.generatedImageUrl} alt={`Scene ${tr.startSceneIndex + 1}`} className="w-full h-full object-cover" />
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
                <img src={endScene.generatedImageUrl} alt={`Scene ${tr.endSceneIndex + 1}`} className="w-full h-full object-cover" />
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
            speedRule === 'realtime' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
          }`}>
            {speedRule === 'realtime' ? '1× Real-Time Speed' : '⏩ Timelapse'}
          </span>
          <span className="text-[10px] text-muted-foreground font-medium">8s duration</span>
        </div>

        {/* Video player */}
        {tr.generatedVideoUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-black">
            <video
              ref={videoRef}
              key={`${mode}-${currentIndex}-${tr.generatedVideoUrl}`}
              src={tr.generatedVideoUrl}
              controls
              playsInline
              autoPlay={mode === 'sequential' && seqPlaying}
              onEnded={handleVideoEnded}
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
            Transition {currentIndex + 1} of 7
          </span>
          <span className="text-[10px] text-muted-foreground">
            Scene {tr.startSceneIndex + 1} → Scene {tr.endSceneIndex + 1}
          </span>
        </div>

        {/* Prev / Next (single mode) */}
        {mode === 'single' && (
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
        )}
      </div>
    </WorkshopCard>
  );
}
