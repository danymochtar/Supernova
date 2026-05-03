import type { NumerologyResult } from '@/lib/numerology';
import { CompoundReduced } from './CompoundReduced';

export function NumberCard({
  label,
  hint,
  result,
  locale = 'id',
}: {
  label: string;
  hint?: string;
  result: NumerologyResult;
  locale?: 'id' | 'en';
}) {
  return (
    <div className="border-border rounded-xl border bg-white/50 p-4 dark:bg-neutral-900/50">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{label}</p>
      <div className="mt-2">
        <CompoundReduced result={result} locale={locale} size="lg" />
      </div>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}
