import { useMode3Store } from '@/store/useMode3Store';
import { Download } from 'lucide-react';

export function Mode3Download() {
  const { setCurrentStep } = useMode3Store();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Download</h2>
        <p className="text-xs text-muted-foreground">Export your epoxy floor transformation assets.</p>
      </div>

      <div className="p-8 rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-3">
        <Download className="w-8 h-8 text-muted-foreground/40" />
        <span className="text-sm text-muted-foreground">Export functionality coming soon</span>
      </div>

      <button
        onClick={() => setCurrentStep(4)}
        className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        Back to Videos
      </button>
    </div>
  );
}
