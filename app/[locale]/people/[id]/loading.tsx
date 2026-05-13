import { Skeleton } from '@/components/layout/Skeleton';

export default function PersonDetailLoading() {
  return (
    <main className="container max-w-2xl px-4 sm:px-6">
      {/* TopBar placeholder */}
      <div className="border-border mb-4 flex h-14 items-center gap-2 border-b">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <span className="w-9" />
      </div>

      <div className="space-y-6 pb-6 sm:pb-10">
        {/* Identity hero placeholder */}
        <div className="border-primary/40 from-primary/10 ring-primary/20 flex items-center gap-4 overflow-hidden rounded-3xl border-2 bg-gradient-to-br to-accent/15 p-6 ring-1 dark:to-accent/15">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>

        {/* Compat card placeholder */}
        <div className="border-border flex items-center gap-4 rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        </div>

        {/* Profile cards placeholder */}
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="border-border rounded-2xl border bg-surface-1 p-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-48" />
          <div className="border-border rounded-2xl border bg-surface-1 p-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        </div>
      </div>
    </main>
  );
}
