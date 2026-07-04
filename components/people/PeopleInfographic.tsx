import { Flame, HeartHandshake, Link2, Sparkles, Users } from 'lucide-react';
import type { CircleStats } from '@/lib/people/circleStats';
import type { ConnectionType } from '@/lib/connection';

interface Props {
  stats: CircleStats;
  labels: {
    /** Small eyebrow above the headline count (e.g. "orang di lingkaran kamu"). */
    eyebrow: string;
    /** Tagline under the headline. */
    tagline: string;
    connection: {
      TWIN_FLAME: string;
      SOULMATE: string;
      KARMIC: string;
      NEUTRAL: string;
    };
    /** "Berdasarkan vibe & pola" — connection section header. */
    connectionSectionTitle: string;
    /** "Elemen" — element section header. */
    elementSectionTitle: string;
    element: {
      fire: string;
      earth: string;
      air: string;
      water: string;
    };
    /** "Life Path paling umum" — top LP label. */
    topLifePathLabel: string;
    /** "x orang share LP {n}" — top LP subline (interpolated). */
    topLifePathHint: string;
  };
}

const CONNECTION_TOKENS: Record<
  ConnectionType,
  { icon: typeof Flame; className: string }
> = {
  TWIN_FLAME: {
    icon: Flame,
    className:
      'from-rose-500 to-orange-500 text-white shadow-sm',
  },
  SOULMATE: {
    icon: Sparkles,
    className:
      'from-violet-500 to-indigo-500 text-white shadow-sm',
  },
  KARMIC: {
    icon: Link2,
    className: 'from-amber-500 to-amber-600 text-white shadow-sm',
  },
  NEUTRAL: {
    icon: HeartHandshake,
    className:
      'from-neutral-500 to-neutral-600 text-white shadow-sm',
  },
};

const ELEMENT_TOKENS: Record<
  'fire' | 'earth' | 'air' | 'water',
  { emoji: string; bg: string; label: string }
> = {
  fire: {
    emoji: '🔥',
    bg: 'bg-rose-100/70 dark:bg-rose-950/25',
    label: 'text-rose-700 dark:text-rose-300',
  },
  earth: {
    emoji: '🌱',
    bg: 'bg-emerald-100/70 dark:bg-emerald-950/25',
    label: 'text-emerald-700 dark:text-emerald-300',
  },
  air: {
    emoji: '🌬️',
    bg: 'bg-sky-100/70 dark:bg-sky-950/25',
    label: 'text-sky-700 dark:text-sky-300',
  },
  water: {
    emoji: '🌊',
    bg: 'bg-indigo-100/70 dark:bg-indigo-950/25',
    label: 'text-indigo-700 dark:text-indigo-300',
  },
};

/**
 * Editorial-style summary of the user's saved People circle. Replaces
 * the plain "26 orang di lingkaran kamu" hero with a scannable
 * infographic: headline count + tagline, connection-type breakdown as
 * pretty chips (Twin Flame / Soulmate / Karmic / Netral), element
 * distribution as a mini stacked bar, and the most common Life Path.
 *
 * Every value beyond `total` is optional — the chip sections hide
 * gracefully when their count is zero.
 */
export function PeopleInfographic({ stats, labels }: Props) {
  const { total, connections, elements, topLifePath } = stats;
  const hasAnyConnection =
    connections.TWIN_FLAME + connections.SOULMATE + connections.KARMIC > 0;
  const elementTotal =
    elements.fire + elements.earth + elements.air + elements.water;

  return (
    <section className="border-primary/30 from-primary/8 relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br to-accent/10 p-5 shadow-sm ring-1 ring-primary/10 dark:from-primary/20 dark:to-accent/15">
      {/* Decorative faint circle in the corner */}
      <div
        aria-hidden
        className="from-primary/25 pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-radial to-transparent blur-2xl"
      />

      <div className="relative space-y-5">
        {/* Headline */}
        <div className="flex items-start gap-3">
          <div className="bg-primary/15 text-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
            <Users className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-primary text-[11px] font-semibold uppercase tracking-[0.18em]">
              {labels.eyebrow}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold tabular-nums leading-none">
                {total}
              </span>
              <span className="text-muted-foreground text-[11px]">
                {labels.tagline}
              </span>
            </div>
          </div>
        </div>

        {/* Connection type chips — only when we have any non-neutral hits */}
        {hasAnyConnection ? (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.16em]">
              {labels.connectionSectionTitle}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(['TWIN_FLAME', 'SOULMATE', 'KARMIC', 'NEUTRAL'] as ConnectionType[])
                .filter((k) => connections[k] > 0)
                .map((k) => {
                  const tok = CONNECTION_TOKENS[k];
                  const Icon = tok.icon;
                  return (
                    <span
                      key={k}
                      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-1 text-[11px] font-semibold ${tok.className}`}
                    >
                      <Icon className="h-3 w-3" aria-hidden />
                      {connections[k]} {labels.connection[k]}
                    </span>
                  );
                })}
            </div>
          </div>
        ) : null}

        {/* Element bar — mini stacked bar with counts underneath */}
        {elementTotal > 0 ? (
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.16em]">
              {labels.elementSectionTitle}
            </p>
            <div className="flex h-2 w-full overflow-hidden rounded-full">
              {(['fire', 'earth', 'air', 'water'] as const).map((el) => {
                const pct = (elements[el] / elementTotal) * 100;
                if (pct === 0) return null;
                const tok = ELEMENT_TOKENS[el];
                const [from, to] =
                  el === 'fire'
                    ? ['from-rose-400', 'to-orange-400']
                    : el === 'earth'
                      ? ['from-emerald-400', 'to-emerald-500']
                      : el === 'air'
                        ? ['from-sky-400', 'to-sky-500']
                        : ['from-indigo-400', 'to-indigo-500'];
                return (
                  <div
                    key={el}
                    className={`h-full bg-gradient-to-r ${from} ${to}`}
                    style={{ width: `${pct}%` }}
                    title={`${tok.emoji} ${elements[el]}`}
                    aria-label={`${labels.element[el]}: ${elements[el]}`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px]">
              {(['fire', 'earth', 'air', 'water'] as const)
                .filter((el) => elements[el] > 0)
                .map((el) => {
                  const tok = ELEMENT_TOKENS[el];
                  return (
                    <span
                      key={el}
                      className="text-muted-foreground inline-flex items-center gap-1"
                    >
                      <span aria-hidden>{tok.emoji}</span>
                      <span>
                        <span className="text-foreground tabular-nums font-semibold">
                          {elements[el]}
                        </span>{' '}
                        {labels.element[el]}
                      </span>
                    </span>
                  );
                })}
            </div>
          </div>
        ) : null}

        {/* Top Life Path — quiet footer row */}
        {topLifePath && topLifePath.count > 1 ? (
          <div className="border-border/40 flex items-center gap-2 border-t pt-3">
            <span className="bg-primary/15 text-primary font-mono inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
              {topLifePath.value}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {labels.topLifePathLabel}
              </p>
              <p className="text-foreground text-[12px]">
                {labels.topLifePathHint
                  .replace('{count}', String(topLifePath.count))
                  .replace('{lp}', String(topLifePath.value))}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
