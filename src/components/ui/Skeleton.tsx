import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width class (e.g. "w-32", "w-full") */
  width?: string;
  /** Height class (e.g. "h-4", "h-10") */
  height?: string;
  /** Make it circular */
  circle?: boolean;
}

export function Skeleton({
  className,
  width,
  height = 'h-4',
  circle,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-[var(--background-tertiary)]',
        circle ? 'rounded-full' : 'rounded-md',
        width,
        height,
        className
      )}
      {...props}
    />
  );
}

// ─── Preset Skeletons ────────────────────────────────────────────

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-4"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] p-6 space-y-4', className)}>
      <div className="flex items-center gap-3">
        <Skeleton circle height="h-10" width="w-10" />
        <div className="space-y-2 flex-1">
          <Skeleton height="h-4" width="w-1/3" />
          <Skeleton height="h-3" width="w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] overflow-hidden', className)}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-[var(--divider-primary)] bg-[var(--background-secondary)]">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="h-4" className="flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 px-4 py-4 border-b border-[var(--divider-primary)] last:border-0">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} height="h-4" className={cn('flex-1', col === 0 && 'w-1/4')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4, className }: { count?: number; className?: string }) {
  const gridCols: Record<number, string> = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  };
  return (
    <div className={cn('grid gap-4 grid-cols-2', gridCols[count] || 'lg:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] p-4 space-y-2">
          <Skeleton height="h-3" width="w-20" />
          <Skeleton height="h-8" width="w-24" />
          <Skeleton height="h-3" width="w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 p-6', className)}>
      <SkeletonStats count={4} />
      <SkeletonTable rows={5} cols={4} />
    </div>
  );
}
