import Link from 'next/link';
import { Pencil } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

interface Labels {
  greeting: string;
  greetingTimeOfDay: string;
  fullName: string;
  editProfile: string;
}

/**
 * Compact mobile-app-style greeting header for the dashboard. Primary
 * navigation lives in the BottomNav now — this just sets the personal,
 * time-aware greeting that opens the user's day.
 */
export function AppHeader({
  locale,
  todayLabel,
  labels,
}: {
  locale: Locale;
  todayLabel?: string;
  labels: Labels;
}) {
  return (
    <header className="space-y-1 pt-2">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {labels.greetingTimeOfDay}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {labels.greeting}, <span className="font-serif italic">{labels.fullName}</span>
      </h1>
      {todayLabel ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>{todayLabel}</span>
          <Link
            href={`/${locale}/profile/edit`}
            aria-label={labels.editProfile}
            className="press hover:bg-muted/40 flex h-6 w-6 items-center justify-center rounded-full"
          >
            <Pencil className="h-3 w-3" aria-hidden />
          </Link>
        </p>
      ) : null}
    </header>
  );
}
