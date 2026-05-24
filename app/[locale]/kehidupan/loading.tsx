export default function KehidupanLoading() {
  return (
    <main className="container max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <div className="space-y-3 pt-2">
        <div className="bg-muted h-7 w-1/3 animate-pulse rounded" />
        <div className="bg-muted h-9 w-56 animate-pulse rounded-full" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-border h-28 animate-pulse rounded-2xl border bg-surface-1" />
        ))}
      </div>
    </main>
  );
}
