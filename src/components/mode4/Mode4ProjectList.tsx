import { ArrowLeft, Plus } from 'lucide-react';

interface Mode4ProjectListProps {
  onNewProject: () => void;
  onBack: () => void;
}

export function Mode4ProjectList({ onNewProject, onBack }: Mode4ProjectListProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground mb-8 transition-colors">
          ← Back
        </button>

        <h1 className="text-2xl font-bold mb-2">Mode 4 Projects</h1>
        <p className="text-sm text-muted-foreground mb-8">Reverse-restoration cinematic workflow.</p>

        <button
          onClick={onNewProject}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>
    </div>
  );
}
