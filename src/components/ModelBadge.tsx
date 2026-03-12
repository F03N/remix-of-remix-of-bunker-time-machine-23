interface ModelBadgeProps {
  model: string;
  label?: string;
}

export function ModelBadge({ model, label }: ModelBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/80 border border-border text-xs font-mono">
      {label && <span className="text-muted-foreground">{label}:</span>}
      <span className="text-foreground">{model}</span>
    </div>
  );
}
