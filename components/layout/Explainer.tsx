/**
 * Tiny disclosure for educational background — used at the top of any
 * section where the user might wonder "what is this thing actually?"
 *
 * Uses native <details> so it survives without client JS, defaults
 * closed to keep pages calm. The user taps to read the concept and
 * collapses again when done.
 */
export function Explainer({ title, body }: { title: string; body: string }) {
  return (
    <details className="border-border group rounded-lg border bg-white/30 px-3 py-2 text-xs dark:bg-neutral-900/30">
      <summary className="text-muted-foreground flex cursor-pointer list-none items-center gap-1.5 font-medium [&::-webkit-details-marker]:hidden">
        <span className="text-accent transition-transform group-open:rotate-90">▸</span>
        <span>{title}</span>
      </summary>
      <p className="text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">{body}</p>
    </details>
  );
}
