import Link from 'next/link';
import { Settings2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

/**
 * Dashboard header — brand wordmark on the left, a single icon in the
 * top-right that opens the personalisation / settings page (/me).
 * Settings used to live in the bottom nav as the "Saya" tab; pulling it
 * up here frees the fifth nav slot for the new Jurnal tab while keeping
 * settings one tap away from the home screen.
 */
export function AppHeader({ locale, settingsLabel }: { locale: Locale; settingsLabel: string }) {
  return (
    <header className="flex items-center justify-between pt-2">
      <h1 className="font-serif text-2xl font-semibold tracking-tight">Supernova</h1>
      <Link
        href={`/${locale}/me`}
        aria-label={settingsLabel}
        title={settingsLabel}
        className="border-border press text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/40 transition-colors dark:bg-neutral-900/40"
      >
        <Settings2 className="h-4 w-4" aria-hidden />
      </Link>
    </header>
  );
}
