import { ChevronDown } from 'lucide-react';

/**
 * Collapsible dashboard section. Uses native <details>/<summary> so collapse
 * state survives without client JS. Defaults to open. Tap the header to
 * collapse/expand. Header always renders so the user can see what's there
 * before opening.
 */
export function Widget({
  title,
  hint,
  children,
  defaultOpen = true,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="border-border group rounded-2xl border bg-surface-2 [&[open]>summary]:border-b [&[open]>summary]:border-border"
    >
      <summary className="press flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {hint ? <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p> : null}
        </div>
        <ChevronDown className="text-muted-foreground h-5 w-5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-5 py-4">{children}</div>
    </details>
  );
}
