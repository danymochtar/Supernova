import type { YearOutlookInput } from '@/lib/ai/prompts/yearOutlook';
import { getOrGenerateYearOutlook } from '@/lib/ai/yearOutlook';
import { renderInlineMd } from '@/components/qa/inlineMd';
import { TextSkeleton } from '@/components/layout/Skeleton';

interface Labels {
  outlookTipsLabel: string;
  outlookAffirmationLabel: string;
}

interface Props {
  userId: string;
  input: YearOutlookInput;
  labels: Labels;
}

/**
 * Async server component for the year outlook body content. Lives
 * INSIDE the parent <details> in journey/page.tsx — Suspense-wrap on
 * the page so the deterministic summary rows (forecast, pinnacle,
 * cycle, essence) below this hero paint instantly while Anthropic
 * streams the outlook prose. Cache hits skip the await.
 */
export async function YearOutlookBody({ userId, input, labels }: Props) {
  const yearOutlook = await getOrGenerateYearOutlook(userId, input);
  if (!yearOutlook) return null;

  return (
    <div className="border-border/60 space-y-4 border-t px-6 py-5 bg-surface-1">
      {yearOutlook.tagline ? (
        <p className="font-serif text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          {yearOutlook.tagline}
        </p>
      ) : null}

      {yearOutlook.synthesis ? (
        <div className="space-y-2.5 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
          {yearOutlook.synthesis.split(/\n\s*\n/).map((p, i) => (
            <p key={i}>{renderInlineMd(p.trim())}</p>
          ))}
        </div>
      ) : null}

      {yearOutlook.tips.length > 0 ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            {labels.outlookTipsLabel}
          </p>
          <ul className="space-y-1.5 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            {yearOutlook.tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-0.5 shrink-0">·</span>
                <span>{renderInlineMd(tip)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {yearOutlook.affirmation ? (
        <div className="border-accent/60 border-l-[3px] bg-accent/5 px-4 py-3 dark:bg-accent/10">
          <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            {labels.outlookAffirmationLabel}
          </p>
          <p className="font-serif text-base italic leading-snug text-neutral-800 dark:text-neutral-100">
            {renderInlineMd(yearOutlook.affirmation)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function YearOutlookBodyFallback() {
  return (
    <div className="border-border/60 border-t bg-surface-1 px-6 py-5">
      <TextSkeleton lines={6} />
    </div>
  );
}
