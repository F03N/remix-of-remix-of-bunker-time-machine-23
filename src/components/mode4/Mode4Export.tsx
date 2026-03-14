import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Mode4Export() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold mb-1">Export</h2>
        <p className="text-xs text-muted-foreground">Download your generated images and videos.</p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center space-y-3">
        <Download className="w-8 h-8 mx-auto text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">Export functionality will be available here.</p>
        <Button disabled className="w-full">
          Download All
        </Button>
      </div>
    </div>
  );
}
