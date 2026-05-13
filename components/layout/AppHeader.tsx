import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/config';

export function AppHeader({
  locale,
  settingsLabel,
  leading,
}: {
  locale: Locale;
  settingsLabel: string;
  leading?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 pt-2">
      {/* `leading` (DateBrowser) sits on the LEFT, opposite Settings on
       * the right. iOS implicit hit-area around <input type="date"> can
       * extend past its rendered box; putting the two icon clusters at
       * opposite edges makes overlap geometrically impossible. */}
      <div className="flex shrink-0 items-center">{leading}</div>
      <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">Supernova</h1>
      <Link
        href={`/${locale}/me`}
        aria-label={settingsLabel}
        title={settingsLabel}
        className="border-border press text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-surface-1 transition-colors"
      >
        <Settings2 className="h-4 w-4" aria-hidden />
      </Link>
    </header>
  );
}
