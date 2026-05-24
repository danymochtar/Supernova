import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { getLocaleConfig } from '@/lib/i18n/locales';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { ageAt, contextFromInstant } from '@/lib/numerology';
import { getCachedAboutMe } from '@/lib/ai/aboutMe';

/** First sentence of the synthesis, trimmed for a one-line teaser. */
function teaserOf(synthesis: string, max = 120): string {
  const firstStop = synthesis.search(/[.!?](\s|$)/);
  const lead = firstStop > 0 ? synthesis.slice(0, firstStop + 1) : synthesis;
  const t = lead.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trim()}…`;
}

/**
 * Compact identity card on Beranda. Replaces the heavy About You widget
 * that used to live here — taps through to the full self-portrait under
 * Kehidupan. No profile photo (no upload infra); a gradient + initials
 * avatar carries the "cakep" visual instead.
 *
 * The synthesis teaser is READ-ONLY from cache (getCachedAboutMe) so the
 * dashboard never fires an AI call just to fill this line — if About You
 * hasn't been generated yet (user never opened Kehidupan), the teaser is
 * simply omitted and the card still shows avatar + name + DOB.
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

  const cached = await getCachedAboutMe(profile.userId);
  const teaser = cached?.synthesis ? teaserOf(cached.synthesis) : null;

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
          {teaser ? (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-[13px] leading-snug">
              {teaser}
            </p>
          ) : null}
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
