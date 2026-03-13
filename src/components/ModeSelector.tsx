import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, Layers, Gem } from 'lucide-react';
import type { AppMode } from '@/types/mode';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
  onBack: () => void;
}

export const ModeSelector = forwardRef<HTMLDivElement, ModeSelectorProps>(function ModeSelector(
  { onSelect, onBack },
  ref,
) {
  return (
    <div ref={ref} className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={onBack}
          className="text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-2">Select Mode</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose your workflow mode to get started.</p>

        <div className="flex flex-col gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('mode1')}
            className="relative flex items-start gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/60 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Mode 1</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bunker transformation workflow — 9-scene cinematic pipeline with AI-powered image generation, video transitions, and audio narration.
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('mode2')}
            className="relative flex items-start gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/60 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 group-hover:bg-secondary/80 transition-colors">
              <Layers className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Mode 2</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Single-reference renovation — Upload one image and generate an 8-step cinematic renovation sequence with AI-powered images and transition videos.
              </p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});

ModeSelector.displayName = 'ModeSelector';
