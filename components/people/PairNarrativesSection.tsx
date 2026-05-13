import type { Relationship } from '@prisma/client';
import type { LaneScore } from '@/lib/compatibility/score';
import { getOrGeneratePairNarratives } from '@/lib/ai/relationship';
import { renderInlineMd } from '@/components/qa/inlineMd';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { TextSkeleton } from '@/components/layout/Skeleton';

interface Labels {
  title: string;
  subtitle: string;
  narrativePending: string;
  laneLabel: (lane: LaneScore) => string;
}

interface Props {
  userId: string;
  personId: string;
  preferredModel: string | null;
  locale: 'id' | 'en';
  relationship: Relationship;
  meName: string;
  themName: string;
  lanes: LaneScore[];
  patternTitles: string[];
  labels: Labels;
}

/**
 * Async server component for per-pair narratives.
 *
 * Wrapped in <Suspense> on the parent page so deterministic lane scores
 * + patterns render immediately while Anthropic streams the per-lane
 * prose. Cache hits skip the await.
 */
export async function PairNarrativesSection({
  userId,
  personId,
  preferredModel,
  locale,
  relationship,
  meName,
  themName,
  lanes,
  patternTitles,
  labels,
}: Props) {
  const narratives = await getOrGeneratePairNarratives(
    userId,
    personId,
    preferredModel,
    { locale, relationship, meName, themName, lanes, patternTitles },
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{labels.title}</h2>
        <p className="text-muted-foreground text-sm">{labels.subtitle}</p>
      </div>
      <div className="space-y-3">
        {lanes.map((lane) => {
          const narrative = narratives[lane.key];
          return (
            <article
              key={lane.key}
              className="border-border space-y-2 rounded-xl border p-5"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold">{labels.laneLabel(lane)}</h3>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CompoundReduced result={lane.meResult} locale={locale} size="sm" />
                  <span className="text-xs">×</span>
                  <CompoundReduced result={lane.themResult} locale={locale} size="sm" />
                  <span className="ml-2 font-mono text-xs tabular-nums">{lane.score}/100</span>
                </div>
              </header>
              {narrative ? (
                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {renderInlineMd(narrative)}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">{labels.narrativePending}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PairNarrativesFallback({
  lanes,
  locale,
  labels,
}: {
  lanes: LaneScore[];
  locale: 'id' | 'en';
  labels: Pick<Labels, 'title' | 'subtitle' | 'laneLabel'>;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{labels.title}</h2>
        <p className="text-muted-foreground text-sm">{labels.subtitle}</p>
      </div>
      <div className="space-y-3">
        {lanes.map((lane) => (
          <article
            key={lane.key}
            className="border-border space-y-2 rounded-xl border p-5"
          >
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold">{labels.laneLabel(lane)}</h3>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <CompoundReduced result={lane.meResult} locale={locale} size="sm" />
                <span className="text-xs">×</span>
                <CompoundReduced result={lane.themResult} locale={locale} size="sm" />
                <span className="ml-2 font-mono text-xs tabular-nums">{lane.score}/100</span>
              </div>
            </header>
            <TextSkeleton lines={3} />
          </article>
        ))}
      </div>
    </section>
  );
}
