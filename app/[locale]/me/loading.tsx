export default function MeLoading() {
  return (
    <main className="container max-w-xl space-y-6 px-4 py-6 sm:px-6">
      <div className="space-y-2 pt-2">
        <div className="bg-muted h-7 w-20 animate-pulse rounded" />
        <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
      </div>
      <div className="border-border h-32 animate-pulse rounded-2xl border bg-surface-1" />
      <div className="border-border h-40 animate-pulse rounded-2xl border bg-surface-1" />
      <div className="border-border h-20 animate-pulse rounded-2xl border bg-surface-1" />
    </main>
  );
}
