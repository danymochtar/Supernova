export default function PeopleLoading() {
  return (
    <main className="container max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="space-y-2 pt-2">
        <div className="bg-muted h-7 w-32 animate-pulse rounded" />
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
        <div className="bg-muted mt-3 h-9 w-32 animate-pulse rounded-full" />
      </div>
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="border-border h-16 animate-pulse rounded-xl border bg-white/40 dark:bg-neutral-900/40" />
        ))}
      </div>
    </main>
  );
}
