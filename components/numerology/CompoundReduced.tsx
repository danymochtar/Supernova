import type { NumerologyResult } from '@/lib/numerology';
import type { Locale } from '@/lib/i18n/config';
import { pickLocalized } from '@/lib/i18n/locales';
import { formatNumerology } from '@/lib/numerology';

// Tooltips + badges live in two languages — non-(id/en) locales fall back
// to ID via pickLocalized. The numerology jargon ("Karmic", "master")
// stays in English across every fallback per the global style rule.
const KARMIC_LABELS: Record<13 | 14 | 16 | 19, Partial<Record<Locale, string>>> = {
  13: { id: 'Karmic 13: kerja keras membangun fondasi', en: 'Karmic 13: hard work to build foundation' },
  14: { id: 'Karmic 14: kebebasan dengan disiplin', en: 'Karmic 14: freedom through discipline' },
  16: { id: 'Karmic 16: ego runtuh untuk lahir kembali', en: 'Karmic 16: ego collapse and rebirth' },
  19: { id: 'Karmic 19: belajar mandiri sejati', en: 'Karmic 19: learn true independence' },
};

const BADGE_LABELS: Record<'master' | 'karmic', Partial<Record<Locale, string>>> = {
  master: { id: 'master', en: 'master' },
  karmic: { id: 'karmic', en: 'karmic' },
};

export function CompoundReduced({
  result,
  locale = 'id',
  size = 'md',
}: {
  result: NumerologyResult;
  locale?: Locale;
  size?: 'sm' | 'md' | 'lg';
}) {
  const text = formatNumerology(result);
  const sizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const tooltip = result.karmicDebt ? pickLocalized(KARMIC_LABELS[result.karmicDebt], locale) : null;

  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        className={`font-mono font-semibold tabular-nums ${sizeClass} ${result.isMaster ? 'text-primary' : ''}`}
        title={tooltip ?? undefined}
      >
        {text}
      </span>
      {result.isMaster ? (
        <span className="text-[10px] font-medium uppercase tracking-wider text-primary">
          {pickLocalized(BADGE_LABELS.master, locale)}
        </span>
      ) : null}
      {result.karmicDebt ? (
        <span
          className="karmic-badge rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
          title={tooltip ?? undefined}
        >
          {pickLocalized(BADGE_LABELS.karmic, locale)}
        </span>
      ) : null}
    </span>
  );
}
