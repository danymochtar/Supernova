import { Sparkles } from 'lucide-react';
import type { ParsedAboutMe } from '@/lib/ai/prompts/aboutMe';
import type { MinorNumbers, NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import { meaningFor } from '@/lib/numerology/meanings';
import { Explainer } from '@/components/layout/Explainer';
import { CompoundReduced } from './CompoundReduced';
import { NumberCard } from './NumberCard';

type CardKey = 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'birthday' | 'karmicLessons';

interface Props {
  title: string;
  subtitle: string;
  data: ParsedAboutMe | null;
  fallback: string;
  /** Translated label per card key. Missing keys fall back to the key itself. */
  cardLabels: Record<CardKey, string>;
  /** Numbers to render on each card. karmicLessons is rendered separately as
   * a list of small chips since there's no single NumerologyResult to show. */
  numbers?: {
    lifePath: NumerologyResult;
    expression: NumerologyResult;
    soulUrge: NumerologyResult;
    personality: NumerologyResult;
    birthday: NumerologyResult;
    karmicLessons: number[];
  };
  locale?: Locale;
  /** Optional educational disclosure shown under the subtitle. */
  explainer?: { title: string; body: string };
  /** Minor Numbers from the user's nickname, when one is set. Surfaced as
   * three tap-to-reveal NumberCards beneath the synthesis card so the
   * user can see "the me people actually call" alongside the deep
   * birth-name self. */
  minor?: MinorNumbers | null;
  /** Translated labels for the minor block. */
  minorLabels?: {
    expression: string;
    soulUrge: string;
    personality: string;
  };
  /** Optional Explainer for the Minor concept. */
  minorExplainer?: { title: string; body: string };
  /** "Coming soon" string for unmapped meanings. */
  comingSoonLabel?: string;
}

const CARD_ORDER = [
  'lifePath',
  'expression',
  'soulUrge',
  'personality',
  'birthday',
  'karmicLessons',
] as const;

/**
 * Carousel-style About Me — one synthesis card on top, then a horizontal
 * scroll-snap row of per-component cards. Mirrors the WN "Decode your
 * life" layout: short cards the user can swipe through. Each card is
 * AI-generated prose without numbers, so the meaning carries the weight.
 */
export function AboutMe({
  title,
  subtitle,
  data,
  fallback,
  cardLabels,
  numbers,
  locale = 'id',
  explainer,
  minor,
  minorLabels,
  minorExplainer,
  comingSoonLabel,
}: Props) {
  if (!data) {
    return (
      <section className="border-border space-y-3 rounded-2xl border bg-white/30 p-6 dark:bg-neutral-900/30">
        <header className="space-y-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
          {explainer ? <Explainer title={explainer.title} body={explainer.body} /> : null}
        </header>
        <p className="text-muted-foreground text-sm italic">{fallback}</p>
      </section>
    );
  }

  const cards = CARD_ORDER.flatMap((key) => {
    const body = data.cards[key];
    if (!body) return [];
    return [{ key, label: cardLabels[key], body }];
  });

  return (
    <section className="space-y-4">
      <header className="space-y-2 px-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
        {explainer ? <Explainer title={explainer.title} body={explainer.body} /> : null}
      </header>

      {data.synthesis ? (
        <div className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 dark:from-primary/15 dark:to-accent/15">
          <Sparkles className="text-accent mb-2 h-4 w-4" aria-hidden />
          <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {data.synthesis}
          </p>
        </div>
      ) : null}

      {minor && minorLabels ? (
        <div className="space-y-3">
          {minorExplainer ? (
            <Explainer title={minorExplainer.title} body={minorExplainer.body} />
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberCard
              label={minorLabels.expression}
              result={minor.minorExpression}
              locale={locale}
              type="expression"
              meaning={meaningFor('expression', minor.minorExpression, locale)}
              comingSoonLabel={comingSoonLabel}
            />
            <NumberCard
              label={minorLabels.soulUrge}
              result={minor.minorSoulUrge}
              locale={locale}
              type="soulUrge"
              meaning={meaningFor('soulUrge', minor.minorSoulUrge, locale)}
              comingSoonLabel={comingSoonLabel}
            />
            <NumberCard
              label={minorLabels.personality}
              result={minor.minorPersonality}
              locale={locale}
              type="personality"
              meaning={meaningFor('personality', minor.minorPersonality, locale)}
              comingSoonLabel={comingSoonLabel}
            />
          </div>
        </div>
      ) : null}

      {cards.length > 0 ? (
        <div className="-mx-4 sm:-mx-6">
          <div className="scroll-px-4 sm:scroll-px-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 pt-1 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cards.map((card) => {
              const result =
                numbers && card.key !== 'karmicLessons' ? numbers[card.key] : null;
              const karmic =
                numbers && card.key === 'karmicLessons' ? numbers.karmicLessons : null;
              return (
                <article
                  key={card.key}
                  className="border-border bg-card text-card-foreground w-[78%] shrink-0 snap-start space-y-3 rounded-2xl border p-5 sm:w-[60%] md:w-[44%]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 font-serif text-xl font-semibold tracking-tight">
                      {card.label}
                    </h3>
                    {result ? (
                      <CompoundReduced result={result} locale={locale} size="lg" />
                    ) : karmic && karmic.length > 0 ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        {karmic.map((n) => (
                          <span
                            key={n}
                            className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded-full px-2 py-0.5 font-mono text-xs font-semibold tabular-nums"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {card.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

