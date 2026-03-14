import { ArrowLeft, Zap } from 'lucide-react';
import { useMode4Store } from '@/store/useMode4Store';

interface Mode4EditorProps {
  onBack: () => void;
}

export function Mode4Editor({ onBack }: Mode4EditorProps) {
  const { name } = useMode4Store();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary-foreground" />
            </div>
            {name && <span className="text-xs text-muted-foreground truncate max-w-[120px] font-medium">/ {name}</span>}
          </div>
          <span className="text-xs text-muted-foreground font-semibold px-2 py-0.5 rounded-full bg-secondary">
            Mode 4 — Setup
          </span>
        </div>
      </header>

      <main className="px-4 py-12 max-w-lg mx-auto text-center">
        <p className="text-sm text-muted-foreground">Mode 4 editor — coming soon.</p>
      </main>
    </div>
  );
}
