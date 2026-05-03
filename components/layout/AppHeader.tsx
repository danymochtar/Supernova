interface Labels {
  /** Casual short greeting like "Halo" / "Hi". */
  greeting: string;
  /** Combined date + time-of-day cue, e.g. "PAGI · SEN, 4 MEI". */
  contextLine: string;
  /** First name only — feels more like a friend than a form. */
  firstName: string;
}

/**
 * Single greeting strip for the dashboard. One context line on top
 * (uppercase tracker — date + time-of-day) and a short personal
 * greeting using the user's first name. No date/timezone duplication
 * underneath; profile editing lives in the Me tab.
 */
export function AppHeader({ labels }: { labels: Labels }) {
  return (
    <header className="space-y-1 pt-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {labels.contextLine}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {labels.greeting},{' '}
        <span className="font-serif italic">{labels.firstName}</span>
      </h1>
    </header>
  );
}
