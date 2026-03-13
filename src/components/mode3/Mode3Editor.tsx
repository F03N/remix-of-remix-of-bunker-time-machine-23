import { ArrowLeft, Gem } from 'lucide-react';

interface Mode3EditorProps {
  onBack: () => void;
}

export function Mode3Editor({ onBack }: Mode3EditorProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="flex items-center gap-2 px-4 h-12">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-6 h-6 rounded-md bg-amber-600 flex items-center justify-center">
            <Gem className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-semibold">Mode 3 — Epoxy Floor</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-600/10 flex items-center justify-center mx-auto mb-4">
            <Gem className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-lg font-bold mb-2">Luxury Epoxy Floor</h1>
          <p className="text-sm text-muted-foreground">
            This workflow is under construction. Full implementation coming soon.
          </p>
        </div>
      </main>
    </div>
  );
}
