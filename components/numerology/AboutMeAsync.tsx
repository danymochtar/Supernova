import type { Locale } from '@/lib/i18n/config';
import type { NumerologyResult, MinorNumbers, Bridges } from '@/lib/numerology';
import type { AboutMeInput } from '@/lib/ai/prompts/aboutMe';
import { getOrGenerateAboutMe } from '@/lib/ai/aboutMe';
import { AboutMe } from '@/components/numerology/AboutMe';
import { TextSkeleton, Skeleton } from '@/components/layout/Skeleton';

type CardKey =
  | 'lifePath'
  | 'expression'
  | 'soulUrge'
  | 'personality'
  | 'birthday'
  | 'karmicLessons';

interface Props {
  userId: string;
  input: AboutMeInput;
  title: string;
  subtitle: string;
  fallback: string;
  cardLabels: Record<CardKey, string>;
  numbers: {
    lifePath: NumerologyResult;
    expression: NumerologyResult;
    soulUrge: NumerologyResult;
    personality: NumerologyResult;
    birthday: NumerologyResult;
    karmicLessons: number[];
  };
  locale: Locale;
  explainer: { title: string; body: string };
  minor: MinorNumbers | null;
  minorLabels: {
    expression: string;
    soulUrge: string;
    personality: string;
  };
  minorExplainer: { title: string; body: string };
  minorTitle?: string;
  minorHint?: string;
  bridge: Bridges | null;
  bridgeLabels: {
    lifePathExpression: string;
    lifePathExpressionHint: string;
    soulUrgePersonality: string;
    soulUrgePersonalityHint: string;
  };
  bridgeExplainer: { title: string; body: string };
  bridgeTitle?: string;
  bridgeHint?: string;
  comingSoonLabel: string;
}

/**
 * Async server wrapper around <AboutMe>. Suspense-friendly: the parent
 * dashboard renders <Suspense fallback={<AboutMeSkeleton/>}> around it
 * so daily reading + numbers can paint before the AI prose lands.
 * Cache hits resolve synchronously and skip the fallback entirely.
 */
export async function AboutMeAsync({ userId, input, ...rest }: Props) {
  const data = await getOrGenerateAboutMe(userId, input);
  return <AboutMe data={data} {...rest} />;
}

export function AboutMeSkeleton({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        {title ? <h2 className="font-serif text-xl font-semibold tracking-tight">{title}</h2> : null}
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      <div className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5">
        <TextSkeleton lines={5} />
      </div>
      <div className="flex gap-3 overflow-hidden pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-[78%] shrink-0 rounded-2xl sm:w-[44%] md:w-[32%]" />
        ))}
      </div>
    </section>
  );
}
