import { Sparkles } from 'lucide-react';
import { parseReading } from '@/lib/ai/prompts/daily';

interface Props {
  body: string | null;
  /** Pre-localized "TUESDAY, MAY 4" style date label. */
  dateLabel: string;
  /** Pre-localized day theme name, e.g. "Change & Versatility". */
  dayTitle: string;
  /** Pre-localized "A 5 DAY" / "HARI 5" suffix. */
  daySuffix: string;
  /** UI strings (already translated). */
  labels: {
    todaysTheme: string;
    affirmation: string;
    fallback: string;
  };
}

/**
 * Hero card for today's reading. Auto-generated server-side — there is no
 * manual generate button. When the AI call fails we show a graceful fallback
 * so the page still renders.
 */
export function DailyReadingView({ body, dateLabel, dayTitle, daySuffix, labels }: Props) {
  if (!body) {
    return (
      <section className="border-border rounded-3xl border bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center dark:from-primary/20 dark:to-accent/20">
        <Sparkles className="text-primary mx-auto mb-3 h-6 w-6" aria-hidden />
        <p className="text-muted-foreground text-sm">{labels.fallback}</p>
      </section>
    );
  }

  const parsed = parseReading(body);
  const paragraphs = parsed.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="border-border overflow-hidden rounded-3xl border bg-white shadow-sm dark:bg-neutral-900">
      <div className="bg-gradient-to-r from-accent via-accent to-amber-300 px-5 py-3 text-amber-950">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {dateLabel}
        </p>
      </div>

      <div className="space-y-5 px-6 py-6 sm:px-7">
        {dayTitle ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.18em]">
              {labels.todaysTheme}
              {daySuffix ? <span className="text-accent ml-2">· {daySuffix}</span> : null}
            </p>
            <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {dayTitle}
            </h2>
          </div>
        ) : null}

        <div className="space-y-3 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
          {parsed.greeting ? (
            <p className="text-foreground font-medium">{parsed.greeting}</p>
          ) : null}
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {parsed.affirmation ? (
          <div className="border-accent/60 border-l-[3px] bg-accent/5 px-4 py-3 dark:bg-accent/10">
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              {labels.affirmation}
            </p>
            <p className="font-serif text-base italic leading-snug text-neutral-800 dark:text-neutral-100">
              {parsed.affirmation}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
