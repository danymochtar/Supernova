import type { Relationship } from '@prisma/client';
import type { Locale } from '@/lib/i18n/config';
import type { CoreLite } from '@/lib/compatibility/score';
import { getOrGenerateRelationshipProfile } from '@/lib/ai/relationship';
import { renderInlineMd } from '@/components/qa/inlineMd';
import { ProseCardSkeleton } from '@/components/layout/Skeleton';

interface Props {
  userId: string;
  personId: string;
  preferredModel: string | null;
  locale: Locale;
  relationship: Relationship;
  meName: string;
  themName: string;
  me: CoreLite;
  them: CoreLite;
  labels: {
    profileSummary: string;
    profileTitle: string;
  };
}

/**
 * Async server component for the AI-generated relationship profile.
 *
 * Wrapped in <Suspense> on the parent page so the static hero + compat
 * score paint immediately while this call streams. Cache-first: when
 * the row already exists in NumerologyCache, this returns instantly.
 */
export async function RelationshipProfileSection({
  userId,
  personId,
  preferredModel,
  locale,
  relationship,
  meName,
  themName,
  me,
  them,
  labels,
}: Props) {
  const text = await getOrGenerateRelationshipProfile(
    userId,
    personId,
    preferredModel,
    { locale, relationship, meName, themName, me, them },
  );

  if (!text) return null;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const summary = paragraphs[0] ?? '';
  const rest = paragraphs.slice(1);

  return (
    <>
      {summary ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{labels.profileSummary}</h2>
          <div className="border-border rounded-2xl border bg-surface-1 p-5">
            <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {renderInlineMd(summary)}
            </p>
          </div>
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{labels.profileTitle}</h2>
          <div className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {rest.map((p, i) => (
              <p key={i}>{renderInlineMd(p)}</p>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function RelationshipProfileFallback({
  labels,
}: {
  labels: { profileSummary: string; profileTitle: string };
}) {
  return (
    <>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{labels.profileSummary}</h2>
        <ProseCardSkeleton lines={4} />
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{labels.profileTitle}</h2>
        <ProseCardSkeleton lines={8} />
      </section>
    </>
  );
}
