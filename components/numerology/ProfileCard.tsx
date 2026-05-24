import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { getLocaleConfig } from '@/lib/i18n/locales';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { ageAt, contextFromInstant } from '@/lib/numerology';

/**
 * Compact identity card on Beranda. Single tappable row — vivid
 * initials avatar + full name + birth date + chevron — that opens the
 * full self-portrait under Kehidupan. No photo (no upload infra); a
 * saturated primary→accent gradient avatar carries the color. Kept
 * deliberately small (one row, no footer) so it reads as a header, not
 * a widget.
 */
export async function ProfileCard({
  profile,
  locale,
  ageLabel,
  readMoreLabel,
}: {
  profile: ProfileView;
  locale: Locale;
  /** Pre-localized "age" word, e.g. "Usia". */
  ageLabel: string;
  /** Pre-localized "read more" — used as the link's accessible label. */
  readMoreLabel: string;
}) {
  const name = profile.fullName;
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName?.charAt(0) ?? ''}`.toUpperCase() || '·';

  const ctx = contextFromInstant(new Date(), profile.timezone);
  const age = ageAt(profile.dob, ctx);

  const dobLabel = new Intl.DateTimeFormat(getLocaleConfig(locale).intlTag, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(profile.dob.year, profile.dob.month - 1, profile.dob.day)));

  return (
    <Link
      href={`/${locale}/kehidupan`}
      aria-label={readMoreLabel}
      className="press-soft border-border group flex items-center gap-3 rounded-2xl border bg-gradient-to-r from-primary/10 via-surface-1 to-accent/10 p-3 transition hover:border-primary/40 dark:from-primary/15 dark:via-surface-1 dark:to-accent/15"
    >
      {/* Vivid avatar — the card's pop of color. */}
      <div
        className="from-primary to-accent text-primary-foreground ring-primary/20 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-serif text-base font-semibold tracking-tight shadow-sm ring-2"
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif truncate text-base font-semibold leading-tight tracking-tight">
          {name}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {ageLabel} {age} · <span className="tabular-nums">{dobLabel}</span>
        </p>
      </div>
      <ChevronRight
        className="text-primary/70 h-4 w-4 shrink-0 transition group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}
