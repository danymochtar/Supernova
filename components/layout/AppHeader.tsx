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
    <header className="flex items-center justify-between pt-2">
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Supernova</h1>
      <div className="flex items-center gap-3">
        {leading}
        <Link
          href={`/${locale}/me`}
          aria-label={settingsLabel}
          title={settingsLabel}
          className="border-border press text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-surface-1 transition-colors"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
