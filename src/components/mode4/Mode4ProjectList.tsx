import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { loadMode4ProjectList, deleteMode4Project, type SavedMode4Project } from '@/lib/mode4-persistence';
import { toast } from 'sonner';

interface Mode4ProjectListProps {
  onNewProject: () => void;
  onBack: () => void;
  onOpenProject: (id: string) => void;
}

export function Mode4ProjectList({ onNewProject, onBack, onOpenProject }: Mode4ProjectListProps) {
  const [projects, setProjects] = useState<SavedMode4Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const list = await loadMode4ProjectList();
      setProjects(list);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteMode4Project(id);
      setProjects((p) => p.filter((x) => x.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

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
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/60 transition-colors text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenProject(p.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 transition-colors text-left group"
              >
                <div>
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    Step {p.current_step} · {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, p.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
