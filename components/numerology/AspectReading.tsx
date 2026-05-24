import { Sparkles } from 'lucide-react';
import { getOrGenerateAspect } from '@/lib/ai/aspect';
import { ASPECTS, type AspectId, type AspectInput } from '@/lib/ai/prompts/aspect';
import { renderInlineMd } from '@/components/qa/inlineMd';
import { TextSkeleton } from '@/components/layout/Skeleton';

interface Labels {
  subtitle: string;
  fallback: string;
  /** Heading text per section headingKey (e.g. whatHeartWantsTitle → "..."). */
  headings: Record<string, string>;
}

interface Props {
  userId: string;
  aspectId: AspectId;
  year: number;
  input: AspectInput;
  labels: Labels;
}

/**
 * Async server render of a life-aspect reading (love / finance). Awaits
 * the cache-first generator, then renders a synthesis gradient card +
 * one titled prose block per section the aspect config declares +
 * an affirmation. Prose-only — no number cards.
 */
export async function AspectReadingAsync({ userId, aspectId, year, input, labels }: Props) {
  const data = await getOrGenerateAspect(userId, aspectId, year, input);
  const config = ASPECTS[aspectId];

  if (!data) {
    return <p className="text-muted-foreground text-sm italic">{labels.fallback}</p>;
  }

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">{labels.subtitle}</p>

      {/* Synthesis — gradient card, matches AboutMe's synthesis block. */}
      <div className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 dark:from-primary/15 dark:to-accent/15">
        <Sparkles className="text-accent mb-2 h-4 w-4" aria-hidden />
        <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
          {renderInlineMd(data.synthesis)}
        </p>
      </div>

      {/* One block per declared section, in config order. */}
      {config.sections.map(({ key, headingKey }) => {
        const body = data.sections[key];
        if (!body) return null;
        return (
          <section key={key} className="space-y-2">
            <h3 className="text-base font-semibold">{labels.headings[headingKey] ?? headingKey}</h3>
            <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {renderInlineMd(body)}
            </p>
          </section>
        );
      })}

      {data.affirmation ? (
        <div className="border-accent/60 border-l-[3px] bg-accent/5 px-4 py-3 dark:bg-accent/10">
          <p className="font-serif text-base italic leading-snug text-neutral-800 dark:text-neutral-100">
            {renderInlineMd(data.affirmation)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function AspectReadingSkeleton({ subtitle }: { subtitle: string }) {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">{subtitle}</p>
      <div className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 dark:from-primary/15 dark:to-accent/15">
        <TextSkeleton lines={4} />
      </div>
      {[0, 1, 2].map((i) => (
        <section key={i} className="space-y-2">
          <div className="bg-surface-2 h-4 w-40 rounded" />
          <TextSkeleton lines={3} />
        </section>
      ))}
    </div>
  );
}
