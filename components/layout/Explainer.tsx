import { ChevronDown } from 'lucide-react';

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
    <details className="border-border group rounded-lg border bg-surface-2 px-3 py-2 text-xs">
      <summary className="press-soft text-muted-foreground flex cursor-pointer list-none items-center justify-between gap-2 font-medium [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown className="text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform ios-ease group-open:rotate-180" aria-hidden />
      </summary>
      <p className="text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">{body}</p>
    </details>
  );
}
