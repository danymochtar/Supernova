import Link from 'next/link';
import {
  GLYPH,
  sunSignFromDob,
  synastry,
  synastryBlurb,
  type PairCategory,
  type SynastryClassification,
  type ZodiacSign,
} from '@/lib/zodiac';
import type { Locale } from '@/lib/i18n/config';
import type { BirthDate } from '@/lib/numerology/types';

interface Labels {
  sectionTitle: string;
  /** Disclaimer line under the heading — calls out that this card is a
   *  display complement and does not affect the score above. */
  complementDisclaimer: string;
  /** "Tambahkan Moon & Rising untuk synastry lengkap" — only when partial. */
  partialHint: string;
  /** Anchor text for the partial-hint link. */
  partialHintLinkText: string;
  /** Pair category labels (e.g. "Sun ↔ Sun"). */
  category: Record<PairCategory, string>;
  /** Classification chip labels. */
  classification: Record<SynastryClassification, string>;
  signName: (sign: ZodiacSign) => string;
}

interface Props {
  user: {
    dob: BirthDate;
    moonSign: ZodiacSign | null;
    risingSign: ZodiacSign | null;
  };
  person: {
    id: string;
    dob: BirthDate;
    moonSign: ZodiacSign | null;
    risingSign: ZodiacSign | null;
  };
  locale: Locale;
  labels: Labels;
}

/**
 * Zodiac synastry — server component that classifies every available
 * (user, person) placement pair and renders a stack of one-line reads
 * with a classification chip + the static blurb from the synastry
 * content pack. Pure display, does NOT feed the numerology score above.
 *
 * Gracefully renders only the Sun-Sun pair when Moon/Rising are missing
 * on either side, with a link back to the edit page.
 */
export function ZodiacSynastryCard({ user, person, locale, labels }: Props) {
  const userPlacements = {
    sun: sunSignFromDob(user.dob),
    moon: user.moonSign,
    rising: user.risingSign,
  };
  const personPlacements = {
    sun: sunSignFromDob(person.dob),
    moon: person.moonSign,
    rising: person.risingSign,
  };
  const result = synastry(userPlacements, personPlacements);

  return (
    <section className="border-border space-y-3 rounded-2xl border bg-surface-1 p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{labels.sectionTitle}</h2>
        <p className="text-muted-foreground text-xs italic">
          {labels.complementDisclaimer}
        </p>
      </div>
      <ul className="space-y-2">
        {result.pairs.map((p, i) => (
          <li
            key={i}
            className="border-border/60 space-y-2 rounded-xl border bg-surface-2/40 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                {labels.category[p.category]}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${classificationBadge(p.classification)}`}
              >
                {labels.classification[p.classification]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-serif text-2xl">{GLYPH[p.userSign]}</span>
              <span className="text-muted-foreground text-xs">↔</span>
              <span className="font-serif text-2xl">{GLYPH[p.personSign]}</span>
              <div className="text-muted-foreground min-w-0 flex-1 text-[11px] capitalize">
                {labels.signName(p.userSign)} · {labels.signName(p.personSign)}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-foreground/85">
              {synastryBlurb(p.category, p.classification, locale)}
            </p>
          </li>
        ))}
      </ul>
      {result.partial ? (
        <p className="text-muted-foreground border-border/60 border-t pt-2 text-xs">
          {labels.partialHint}{' '}
          <Link
            href={`/${locale}/people/${person.id}/edit`}
            className="text-primary hover:underline"
          >
            {labels.partialHintLinkText}
          </Link>
        </p>
      ) : null}
    </section>
  );
}

/** Tailwind classes for the classification chip — matches the existing
 *  harmony / tension tone system in the patterns track. */
function classificationBadge(c: SynastryClassification): string {
  switch (c) {
    case 'harmony':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'magnetic':
      return 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300';
    case 'tension':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
    case 'neutral':
      return 'bg-muted/50 text-muted-foreground';
  }
}
