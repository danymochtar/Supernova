import type { Locale } from '@/lib/i18n/config';
import type { NumerologyResult, Bridges, CoreProfile } from '@/lib/numerology';
import type { AspectId } from '@/lib/ai/prompts/aspect';
import { meaningFor, type MeaningType } from '@/lib/numerology/meanings';
import { NumberCard } from '@/components/numerology/NumberCard';

interface Cell {
  key: string;
  label: string;
  /** Aspect-framed one-liner shown as the card hint (e.g., "Hasrat hati"). */
  hint: string;
  result: NumerologyResult;
  /** MeaningType for the modal popup body. */
  type: MeaningType;
}

interface Props {
  locale: Locale;
  aspectId: AspectId;
  core: Pick<CoreProfile, 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'birthday'>;
  personalYear: NumerologyResult;
  bridge: Bridges;
  labels: {
    sectionTitle: string;
    sectionHint: string;
    comingSoon: string;
    /** Aspect-framed label + hint per card key. The recap re-uses the
     *  generic per-digit meanings from content/meanings but frames the
     *  label/hint for the love or money lens. */
    lifePath: { label: string; hint: string };
    expression: { label: string; hint: string };
    soulUrge: { label: string; hint: string };
    personality: { label: string; hint: string };
    personalYear: { label: string; hint: string };
    bridge: { label: string; hint: string };
  };
}

/**
 * Compact recap of the deterministic numbers a love / finance aspect
 * reading is grounded in. Mirrors the About tab's core grid:
 * label + number on the face; tap opens a modal with the per-number
 * meaning (re-using the existing content/meanings packs). Renders above
 * the AI-prose reading so the user can see "which numbers built this"
 * before diving into the narrative.
 */
export function AspectComputationsRecap({ locale, aspectId, core, personalYear, bridge, labels }: Props) {
  // Order is tuned per aspect — love leads with Soul Urge, money leads
  // with Life Path. The rest follow the loveProfile/financeProfile
  // structure in aspect.ts so the recap matches what the AI consumed.
  const cellsLove: Cell[] = [
    { key: 'soulUrge', label: labels.soulUrge.label, hint: labels.soulUrge.hint, result: core.soulUrge, type: 'soulUrge' },
    { key: 'expression', label: labels.expression.label, hint: labels.expression.hint, result: core.expression, type: 'expression' },
    { key: 'personality', label: labels.personality.label, hint: labels.personality.hint, result: core.personality, type: 'personality' },
    { key: 'lifePath', label: labels.lifePath.label, hint: labels.lifePath.hint, result: core.lifePath, type: 'lifePath' },
    { key: 'personalYear', label: labels.personalYear.label, hint: labels.personalYear.hint, result: personalYear, type: 'personalYear' },
    { key: 'bridge', label: labels.bridge.label, hint: labels.bridge.hint, result: bridge.soulUrgePersonality, type: 'bridge' },
  ];

  const cellsMoney: Cell[] = [
    { key: 'lifePath', label: labels.lifePath.label, hint: labels.lifePath.hint, result: core.lifePath, type: 'lifePath' },
    { key: 'expression', label: labels.expression.label, hint: labels.expression.hint, result: core.expression, type: 'expression' },
    { key: 'personality', label: labels.personality.label, hint: labels.personality.hint, result: core.personality, type: 'personality' },
    { key: 'soulUrge', label: labels.soulUrge.label, hint: labels.soulUrge.hint, result: core.soulUrge, type: 'soulUrge' },
    { key: 'personalYear', label: labels.personalYear.label, hint: labels.personalYear.hint, result: personalYear, type: 'personalYear' },
    { key: 'bridge', label: labels.bridge.label, hint: labels.bridge.hint, result: bridge.lifePathExpression, type: 'bridge' },
  ];

  const cells = aspectId === 'love' ? cellsLove : cellsMoney;

  return (
    <section className="space-y-2">
      <div className="space-y-1 px-1">
        <h2 className="text-base font-semibold">{labels.sectionTitle}</h2>
        <p className="text-muted-foreground text-xs">{labels.sectionHint}</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cells.map((c) => (
          <NumberCard
            key={c.key}
            label={c.label}
            hint={c.hint}
            result={c.result}
            locale={locale}
            type={c.type}
            meaning={meaningFor(c.type, c.result, locale, { aspect: aspectId })}
            comingSoonLabel={labels.comingSoon}
            compact
          />
        ))}
      </div>
    </section>
  );
}
