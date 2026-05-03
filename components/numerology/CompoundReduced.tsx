import type { NumerologyResult } from '@/lib/numerology';
import { formatNumerology } from '@/lib/numerology';

const KARMIC_LABELS: Record<13 | 14 | 16 | 19, { id: string; en: string }> = {
  13: { id: 'Karmic 13: kerja keras membangun fondasi', en: 'Karmic 13: hard work to build foundation' },
  14: { id: 'Karmic 14: kebebasan dengan disiplin', en: 'Karmic 14: freedom through discipline' },
  16: { id: 'Karmic 16: ego runtuh untuk lahir kembali', en: 'Karmic 16: ego collapse and rebirth' },
  19: { id: 'Karmic 19: belajar mandiri sejati', en: 'Karmic 19: learn true independence' },
};

export function CompoundReduced({
  result,
  locale = 'id',
  size = 'md',
}: {
  result: NumerologyResult;
  locale?: 'id' | 'en';
  size?: 'sm' | 'md' | 'lg';
}) {
  const text = formatNumerology(result);
  const sizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const tooltip = result.karmicDebt ? KARMIC_LABELS[result.karmicDebt][locale] : null;

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
          master
        </span>
      ) : null}
      {result.karmicDebt ? (
        <span
          className="karmic-badge rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800"
          title={tooltip ?? undefined}
        >
          karmic
        </span>
      ) : null}
    </span>
  );
}
