import { useState, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadMode2ProjectList, deleteMode2Project, type SavedMode2Project } from '@/lib/mode2-persistence';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ArrowLeft, Clock, Layers, FolderOpen, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { MODE2_STEP_LABELS, type Mode2WorkflowStep } from '@/types/mode';

interface Mode2ProjectListProps {
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
  onBack: () => void;
}

export const Mode2ProjectList = forwardRef<HTMLDivElement, Mode2ProjectListProps>(function Mode2ProjectList(
  { onNewProject, onLoadProject, onBack },
  ref,
) {
  const [projects, setProjects] = useState<SavedMode2Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
    new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('BACKEND_TIMEOUT')), ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });

  const fetchProjects = async () => {
    setLoading(true);
    setErrorMessage(null);

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const list = await withTimeout(loadMode2ProjectList(), 6000);
        setProjects(list);
        setLoading(false);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
    }

    const message = lastError instanceof Error && lastError.message === 'BACKEND_TIMEOUT'
      ? 'Backend is taking too long to respond. Please retry.'
      : 'Failed to load projects';
    setErrorMessage(message);
    toast.error(message);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project?')) return;
    try {
      await deleteMode2Project(id);
      setProjects(p => p.filter(proj => proj.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStepProgress = (step: number) => ((step - 1) / 4) * 100;

  const getClassLabel = (cls: string | null) => {
    if (cls === 'interior') return '🏠 Interior';
    if (cls === 'exterior') return '🏢 Exterior';
    return '';
  };

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-sm tracking-tight">RENOVATION AI</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Renovation Projects</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {projects.length > 0 ? `${projects.length} project${projects.length > 1 ? 's' : ''}` : 'Your renovation workspace'}
            </p>
          </div>
          <Button onClick={onNewProject} className="rounded-xl font-semibold gap-1.5 h-10">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground mt-4">Loading projects…</p>
          </div>
        ) : errorMessage ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card/30 py-12 px-6 text-center"
          >
            <h3 className="font-bold text-lg mb-1">Couldn’t load projects</h3>
            <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
            <Button onClick={fetchProjects} className="rounded-xl font-semibold gap-1.5">
              Retry
            </Button>
          </motion.div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-dashed border-border bg-card/30 py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-bold text-lg mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Create your first renovation project</p>
            <Button onClick={onNewProject} className="rounded-xl font-semibold gap-1.5">
              <Plus className="w-4 h-4" /> Create First Project
            </Button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {projects.map((proj, i) => (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onLoadProject(proj.id)}
                  className="text-left w-full group cursor-pointer"
                >
                  <div className="rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/20 p-4 transition-all duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm truncate">{proj.name}</h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                            {proj.quality_mode}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {MODE2_STEP_LABELS[proj.current_step as Mode2WorkflowStep] || `Step ${proj.current_step}`}
                          </span>
                          {proj.classification && (
                            <span className="text-xs text-muted-foreground">
                              {getClassLabel(proj.classification)}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${getStepProgress(proj.current_step)}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatDate(proj.updated_at)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
});

Mode2ProjectList.displayName = 'Mode2ProjectList';
