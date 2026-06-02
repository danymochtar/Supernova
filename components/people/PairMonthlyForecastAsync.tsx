import type { Relationship } from '@prisma/client';
import type { Locale } from '@/lib/i18n/config';
import { contextFromInstant, personalMonth, personalYear } from '@/lib/numerology';
import type { BirthDate } from '@/lib/numerology/types';
import { getOrGeneratePairMonthlyForecast } from '@/lib/ai/pairMonthlyForecast';

interface Props {
  userId: string;
  personId: string;
  locale: Locale;
  myDob: BirthDate;
  themDob: BirthDate;
  myName: string;
  themName: string;
  relationship: Relationship;
  preferredModel: string | null;
  /** Caller-supplied label strings (already translated). */
  labels: {
    sectionTitle: string;
    pendingNote: string;
  };
  /** User's timezone, so "current month" resolves correctly worldwide. */
  timezone: string;
}

interface MonthCell {
  year: number;
  month: number; // 1-12
  monthLabel: string;
  myPm: number;
  themPm: number;
}

/**
 * "Bulan ini" Pair Monthly Compatibility panel — mirrors World Numerology's
 * Relationship Monthly Forecast. Shows the current month + next month, with
 * both people's Personal Months and an AI narrative for that pair.
 */
export async function PairMonthlyForecastAsync({
  userId,
  personId,
  locale,
  myDob,
  themDob,
  myName,
  themName,
  relationship,
  preferredModel,
  labels,
  timezone,
}: Props) {
  const ctx = contextFromInstant(new Date(), timezone);
  const fmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const myPy = personalYear(myDob, ctx.year).reduced;
  const themPy = personalYear(themDob, ctx.year).reduced;

  const cells: MonthCell[] = [0, 1].map((offset) => {
    const year = ctx.year + Math.floor((ctx.month - 1 + offset) / 12);
    const month = ((ctx.month - 1 + offset) % 12) + 1;
    const monthLabel = fmt.format(new Date(Date.UTC(year, month - 1, 1)));
    return {
      year,
      month,
      monthLabel,
      myPm: personalMonth(myDob, { year, month, day: 1 }).reduced,
      themPm: personalMonth(themDob, { year, month, day: 1 }).reduced,
    };
  });

  // Cold-cache cost: up to 2 small AI calls. Subsequent renders hit cache.
  const narratives = await Promise.all(
    cells.map((c) =>
      getOrGeneratePairMonthlyForecast(userId, personId, preferredModel, {
        locale,
        relationship,
        myName,
        themName,
        year: c.year,
        month: c.month,
        myPm: c.myPm,
        themPm: c.themPm,
        myPy,
        themPy,
      }),
    ),
  );

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{labels.sectionTitle}</h2>
      <div className="space-y-3">
        {cells.map((cell, i) => (
          <article
            key={`${cell.year}-${cell.month}`}
            className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5"
          >
            <header className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
                {cell.monthLabel}
              </p>
              <div className="flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums">
                <span className="bg-primary/15 text-primary inline-flex h-7 w-7 items-center justify-center rounded-full">
                  {cell.myPm}
                </span>
                <span className="text-muted-foreground text-xs font-normal">+</span>
                <span className="bg-accent/20 text-accent-foreground inline-flex h-7 w-7 items-center justify-center rounded-full">
                  {cell.themPm}
                </span>
              </div>
            </header>
            {narratives[i] ? (
              <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {narratives[i]}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm italic">{labels.pendingNote}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
