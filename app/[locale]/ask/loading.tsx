export default function AskLoading() {
  return (
    <main className="container max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 space-y-2 pt-2">
        <div className="bg-muted h-7 w-1/2 animate-pulse rounded" />
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
      </div>
      <div className="space-y-3 pt-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-start">
            <div className="border-border h-12 w-3/4 animate-pulse rounded-2xl rounded-tl-md border bg-surface-1" />
          </div>
        ))}
      </div>
    </main>
  );
}
