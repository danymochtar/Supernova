import { Sparkles } from 'lucide-react';
import type { ParsedAboutMe } from '@/lib/ai/prompts/aboutMe';
import type { Bridges, MinorNumbers, NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import { meaningFor } from '@/lib/numerology/meanings';
import { InfoPopover } from '@/components/layout/InfoPopover';
import { renderInlineMd } from '@/components/qa/inlineMd';
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
  /** Section heading + one-line hint above the Minor block, mirroring the
   * Karmic Lessons section so the user knows what this part is. */
  minorTitle?: string;
  minorHint?: string;
  /** Bridge Numbers — the gap between LP↔Expression and SU↔Personality.
   * Surfaced beneath the Minor block when present. */
  bridge?: Bridges | null;
  /** Translated labels for the bridge block. */
  bridgeLabels?: {
    lifePathExpression: string;
    lifePathExpressionHint: string;
    soulUrgePersonality: string;
    soulUrgePersonalityHint: string;
  };
  /** Optional Explainer for the Bridge concept. */
  bridgeExplainer?: { title: string; body: string };
  /** Section heading + one-line hint above the Bridge block. */
  bridgeTitle?: string;
  bridgeHint?: string;
  /** "Coming soon" string for unmapped meanings. */
  comingSoonLabel?: string;
}

const CORE_KEYS = [
  'lifePath',
  'expression',
  'soulUrge',
  'personality',
  'birthday',
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
  minorTitle,
  minorHint,
  bridge,
  bridgeLabels,
  bridgeExplainer,
  bridgeTitle,
  bridgeHint,
  comingSoonLabel,
}: Props) {
  if (!data) {
    return (
      <section className="border-border space-y-3 rounded-2xl border bg-surface-2 p-6">
        <header className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          </div>
          {explainer ? <InfoPopover title={explainer.title} body={explainer.body} /> : null}
        </header>
        <p className="text-muted-foreground text-sm italic">{fallback}</p>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {title ? <h2 className="px-1 text-lg font-semibold">{title}</h2> : null}

      {data.synthesis ? (
        <div className="border-border relative rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 dark:from-primary/15 dark:to-accent/15">
          {explainer ? (
            <InfoPopover
              title={explainer.title}
              body={explainer.body}
              className="absolute right-2.5 top-2.5"
            />
          ) : null}
          <Sparkles className="text-accent mb-2 h-4 w-4" aria-hidden />
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {renderInlineMd(data.synthesis)}
          </p>
        </div>
      ) : null}

      {numbers ? (
        <div className="space-y-2">
          {subtitle ? <p className="text-muted-foreground px-1 text-sm">{subtitle}</p> : null}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CORE_KEYS.map((key) => (
              <NumberCard
                key={key}
                label={cardLabels[key]}
                result={numbers[key]}
                locale={locale}
                type={key}
                aiBody={data.cards[key] ?? null}
                meaning={meaningFor(key, numbers[key], locale)}
                comingSoonLabel={comingSoonLabel}
                compact
              />
            ))}
          </div>
        </div>
      ) : null}

      {minor && minorLabels ? (
        <div className="space-y-3">
          {minorTitle ? (
            <header className="flex items-start justify-between gap-2 px-1">
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-semibold">{minorTitle}</h3>
                {minorHint ? <p className="text-muted-foreground text-xs">{minorHint}</p> : null}
              </div>
              {minorExplainer ? (
                <InfoPopover title={minorExplainer.title} body={minorExplainer.body} />
              ) : null}
            </header>
          ) : null}
          {/* AI narrative for THIS user's Minor numbers, in plain language,
            * so the meaning lands before they scan the digits. */}
          {data.minorNarrative ? (
            <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {renderInlineMd(data.minorNarrative)}
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <NumberCard
              label={minorLabels.expression}
              result={minor.minorExpression}
              locale={locale}
              type="expression"
              meaning={meaningFor('expression', minor.minorExpression, locale)}
              comingSoonLabel={comingSoonLabel}
              compact
            />
            <NumberCard
              label={minorLabels.soulUrge}
              result={minor.minorSoulUrge}
              locale={locale}
              type="soulUrge"
              meaning={meaningFor('soulUrge', minor.minorSoulUrge, locale)}
              comingSoonLabel={comingSoonLabel}
              compact
            />
            <NumberCard
              label={minorLabels.personality}
              result={minor.minorPersonality}
              locale={locale}
              type="personality"
              meaning={meaningFor('personality', minor.minorPersonality, locale)}
              comingSoonLabel={comingSoonLabel}
              compact
            />
          </div>
        </div>
      ) : null}

      {bridge && bridgeLabels ? (
        <div className="space-y-3">
          {bridgeTitle ? (
            <header className="flex items-start justify-between gap-2 px-1">
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-semibold">{bridgeTitle}</h3>
                {bridgeHint ? <p className="text-muted-foreground text-xs">{bridgeHint}</p> : null}
              </div>
              {bridgeExplainer ? (
                <InfoPopover title={bridgeExplainer.title} body={bridgeExplainer.body} />
              ) : null}
            </header>
          ) : null}
          {data.bridgeNarrative ? (
            <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
              {renderInlineMd(data.bridgeNarrative)}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <NumberCard
              label={bridgeLabels.lifePathExpression}
              hint={bridgeLabels.lifePathExpressionHint}
              result={bridge.lifePathExpression}
              locale={locale}
              type="bridge"
              meaning={meaningFor('bridge', bridge.lifePathExpression, locale)}
              comingSoonLabel={comingSoonLabel}
              compact
            />
            <NumberCard
              label={bridgeLabels.soulUrgePersonality}
              hint={bridgeLabels.soulUrgePersonalityHint}
              result={bridge.soulUrgePersonality}
              locale={locale}
              type="bridge"
              meaning={meaningFor('bridge', bridge.soulUrgePersonality, locale)}
              comingSoonLabel={comingSoonLabel}
              compact
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

