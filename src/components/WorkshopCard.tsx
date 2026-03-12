import { forwardRef } from 'react';
import type { ReactNode } from 'react';

interface WorkshopCardProps {
  children: ReactNode;
  className?: string;
  generating?: boolean;
}

export const WorkshopCard = forwardRef<HTMLDivElement, WorkshopCardProps>(
  ({ children, className = '', generating }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5
          transition-all duration-200
          ${generating ? 'generation-pulse border-primary/40' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    );
  }
);

WorkshopCard.displayName = 'WorkshopCard';
