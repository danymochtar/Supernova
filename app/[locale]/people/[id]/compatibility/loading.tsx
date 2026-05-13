import { Skeleton, TextSkeleton } from '@/components/layout/Skeleton';

export default function CompatibilityLoading() {
  return (
    <main className="container max-w-3xl px-4 sm:px-6">
      <div className="border-border mb-4 flex h-14 items-center gap-2 border-b">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <span className="w-9" />
      </div>

      <div className="space-y-8 pb-6 sm:pb-10">
        <Skeleton className="h-4 w-3/4" />

        {/* Lens card */}
        <div className="border-border rounded-2xl border bg-surface-1 p-5">
          <TextSkeleton lines={3} />
        </div>

        {/* Score card */}
        <div className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-4 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        </div>

        {/* Pairs section */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-border rounded-xl border p-5">
              <Skeleton className="mb-3 h-4 w-1/2" />
              <TextSkeleton lines={2} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
