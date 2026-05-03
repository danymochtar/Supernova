export default function DashboardLoading() {
  return (
    <main className="container max-w-3xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      {/* Greeting skeleton */}
      <div className="space-y-2 pt-2">
        <div className="bg-muted h-3 w-16 animate-pulse rounded" />
        <div className="bg-muted h-7 w-3/5 animate-pulse rounded" />
        <div className="bg-muted h-4 w-2/5 animate-pulse rounded" />
      </div>

      {/* Daily reading skeleton */}
      <div className="border-border space-y-3 rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-6 dark:from-primary/15 dark:to-accent/15">
        <div className="bg-muted/60 h-5 w-1/3 animate-pulse rounded" />
        <div className="bg-muted/60 h-4 w-full animate-pulse rounded" />
        <div className="bg-muted/60 h-4 w-5/6 animate-pulse rounded" />
        <div className="bg-muted/60 h-4 w-4/6 animate-pulse rounded" />
      </div>

      {/* About me skeleton */}
      <div className="border-border space-y-2 rounded-2xl border bg-white/30 p-6 dark:bg-neutral-900/30">
        <div className="bg-muted h-5 w-24 animate-pulse rounded" />
        <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
        <div className="space-y-2 pt-3">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-11/12 animate-pulse rounded" />
          <div className="bg-muted h-4 w-10/12 animate-pulse rounded" />
        </div>
      </div>

      {/* Today's cycles skeleton */}
      <div className="space-y-3">
        <div className="bg-muted h-5 w-20 animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-border h-24 animate-pulse rounded-xl border bg-white/40 dark:bg-neutral-900/40" />
          ))}
        </div>
      </div>

      {/* Core skeleton */}
      <div className="space-y-3">
        <div className="bg-muted h-5 w-24 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-border h-28 animate-pulse rounded-xl border bg-white/40 dark:bg-neutral-900/40" />
          ))}
        </div>
      </div>
    </main>
  );
}
