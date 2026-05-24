import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { getLocaleConfig } from '@/lib/i18n/locales';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { ageAt, contextFromInstant } from '@/lib/numerology';

/**
 * Compact identity card on Beranda. Replaces the heavy About You widget
 * that used to live here — taps through to the full self-portrait under
 * Kehidupan. No profile photo (no upload infra); a gradient + initials
 * avatar carries the "cakep" visual instead. Identity only — avatar +
 * full name + birth date + a "read more" CTA; the synthesis/detail all
 * lives behind the tap.
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
  /** Pre-localized "read more" CTA, e.g. "Baca profil lebih lanjut". */
  readMoreLabel: string;
}) {
  // The home identity card shows the FULL legal name (not the nickname /
  // displayName used elsewhere) — it's the user's own profile header, so
  // the complete name reads right here.
  const name = profile.fullName;
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName?.charAt(0) ?? ''}`.toUpperCase() || '·';

  const ctx = contextFromInstant(new Date(), profile.timezone);
  const age = ageAt(profile.dob, ctx);

  const dobLabel = new Intl.DateTimeFormat(getLocaleConfig(locale).intlTag, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(profile.dob.year, profile.dob.month - 1, profile.dob.day)));

  return (
    <Link
      href={`/${locale}/kehidupan`}
      className="press-soft border-primary/40 from-primary/10 ring-primary/20 group block overflow-hidden rounded-3xl border-2 bg-gradient-to-br to-accent/15 p-5 ring-1 transition dark:to-accent/15"
    >
      <div className="flex items-center gap-4">
        <div
          className="from-primary/40 to-accent/40 ring-primary/20 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-serif text-lg font-semibold tracking-tight ring-1"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-serif truncate text-lg font-semibold leading-tight tracking-tight">
            {name}
          </p>
          <p className="text-muted-foreground text-xs">
            {ageLabel} {age} · <span className="tabular-nums">{dobLabel}</span>
          </p>
        </div>
      </div>
      {/* Explicit "read more" affordance — clearer than a bare chevron that
        * the card opens the full profile detail under Kehidupan. */}
      <div className="border-primary/15 mt-3 flex items-center justify-end gap-1 border-t pt-3 text-xs font-medium text-primary">
        <span>{readMoreLabel}</span>
        <ChevronRight
          className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}
