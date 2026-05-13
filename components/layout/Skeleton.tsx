import { cn } from '@/lib/utils';

/**
 * Shimmer-animated placeholder. The keyframes live in app/globals.css
 * so the animation runs without JS. Use these inside <Suspense fallback>
 * on pages where an AI/DB call shouldn't block first paint.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'bg-surface-2 relative overflow-hidden rounded-md',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-surface-3/60 before:to-transparent',
        className,
      )}
    />
  );
}

export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === lines - 1 ? 'h-4 w-3/4' : 'h-4 w-full'}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({
  heightClass = 'h-32',
  className,
}: {
  heightClass?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface-1 rounded-2xl border p-5',
        className,
      )}
    >
      <Skeleton className={cn(heightClass, 'w-full')} />
    </div>
  );
}

export function ProseCardSkeleton({
  lines = 6,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface-1 rounded-2xl border p-5',
        className,
      )}
    >
      <TextSkeleton lines={lines} />
    </div>
  );
}
