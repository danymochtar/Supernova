import type { Locale } from '@/lib/i18n/config';
import type { Cornerstone } from '@/lib/numerology/cornerstone';
import type { NumerologyResult } from '@/lib/numerology';
import type { Planes } from '@/lib/numerology/planesOfExpression';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';

interface Props {
  locale: Locale;
  labels: {
    title: string;
    hint: string;
    maturity: string;
    hiddenPassion: string;
    balance: string;
    cornerstone: string;
    subconsciousSelf: string;
    rationalThought: string;
    planes: string;
    physical: string;
    mental: string;
    emotional: string;
    intuitive: string;
  };
  derivatives: {
    maturity: NumerologyResult;
    hiddenPassion: number[];
    balance: NumerologyResult;
    cornerstone: Cornerstone | null;
    subconsciousSelf: number;
    rationalThought: NumerologyResult;
    planes: Planes;
  };
}

/**
 * Decoz second-tier numerology surface — Maturity / Hidden Passion / Balance
 * / Cornerstone / Subconscious Self / Rational Thought / Planes of
 * Expression. Each row shows the value(s) only; the heavy interpretation
 * lives in the AboutMe AI synthesis (which now has these in context).
 * Mirrors the WN "Specifics about you" page layout.
 */
export function MoreNumbersWidget({ locale, labels, derivatives: d }: Props) {
  return (
    <section className="border-border space-y-4 rounded-2xl border bg-surface-1 p-5">
      <header className="space-y-1">
        <h2 className="text-base font-semibold">{labels.title}</h2>
        <p className="text-muted-foreground text-xs">{labels.hint}</p>
      </header>

      <ul className="divide-border/60 divide-y">
        <Row label={labels.maturity}>
          <CompoundReduced result={d.maturity} locale={locale} size="md" />
        </Row>

        <Row label={labels.hiddenPassion}>
          <div className="flex flex-wrap items-center justify-end gap-1">
            {d.hiddenPassion.length === 0 ? (
              <span className="text-muted-foreground text-xs">—</span>
            ) : (
              d.hiddenPassion.map((n) => (
                <span
                  key={n}
                  className="bg-primary/10 text-primary inline-flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-semibold tabular-nums"
                >
                  {n}
                </span>
              ))
            )}
          </div>
        </Row>

        <Row label={labels.balance}>
          <CompoundReduced result={d.balance} locale={locale} size="md" />
        </Row>

        <Row label={labels.cornerstone}>
          {d.cornerstone ? (
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-semibold tracking-tight">
                {d.cornerstone.letter}
              </span>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                · {d.cornerstone.value}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </Row>

        <Row label={labels.subconsciousSelf}>
          <span className="font-mono text-sm font-semibold tabular-nums">
            {d.subconsciousSelf}
            <span className="text-muted-foreground"> / 9</span>
          </span>
        </Row>

        <Row label={labels.rationalThought}>
          <CompoundReduced result={d.rationalThought} locale={locale} size="md" />
        </Row>
      </ul>

      {/* Planes of Expression — 2×2 grid below the row list. */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {labels.planes}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PlaneCard label={labels.physical} value={d.planes.physical} locale={locale} />
          <PlaneCard label={labels.mental} value={d.planes.mental} locale={locale} />
          <PlaneCard label={labels.emotional} value={d.planes.emotional} locale={locale} />
          <PlaneCard label={labels.intuitive} value={d.planes.intuitive} locale={locale} />
        </div>
      </div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm">{label}</span>
      <div className="shrink-0">{children}</div>
    </li>
  );
}

function PlaneCard({
  label,
  value,
  locale,
}: {
  label: string;
  value: NumerologyResult;
  locale: Locale;
}) {
  return (
    <div className="border-border/60 rounded-xl border bg-surface-2/40 p-3">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-1.5">
        <CompoundReduced result={value} locale={locale} size="md" />
      </div>
    </div>
  );
}
