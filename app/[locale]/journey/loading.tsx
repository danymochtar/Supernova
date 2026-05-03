export default function JourneyLoading() {
  return (
    <main className="container max-w-3xl space-y-10 px-4 py-6 sm:px-6 sm:py-10">
      <div className="space-y-2 pt-2">
        <div className="bg-muted h-7 w-1/3 animate-pulse rounded" />
        <div className="bg-muted h-4 w-1/4 animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        <div className="bg-muted h-5 w-40 animate-pulse rounded" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="border-border h-24 animate-pulse rounded-xl border bg-white/40 dark:bg-neutral-900/40" />
        ))}
      </div>
    </main>
  );
}
