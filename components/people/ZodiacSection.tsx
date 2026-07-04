'use client';

import { useState } from 'react';
import { ChevronDown, Moon as MoonIcon } from 'lucide-react';
import { Modal } from '@/components/layout/Modal';
import {
  ELEMENT,
  ELEMENT_TOKENS,
  GLYPH,
  MODALITY,
  RULER,
  sunSignFromDob,
  planetSignMeaning,
  rulerMeaning,
  shadowMeaning,
  transitMoonBlurb,
  zodiacMeaning,
  type Element,
  type Modality,
  type Planet,
  type ZodiacSign,
} from '@/lib/zodiac';
import type { ChartBalance } from '@/lib/zodiac/chartBalance';
import type { Locale } from '@/lib/i18n/config';
import type { BirthDate } from '@/lib/numerology/types';

type PlacementKey = 'sun' | 'moon' | 'rising' | 'venus' | 'mars';

interface Labels {
  /** Section heading (e.g. "Zodiak Sabri"). */
  sectionTitle: string;
  /** Row labels — the "SUN" / "MOON" / "RISING" / "VENUS" / "MARS" chips. */
  sun: string;
  moon: string;
  rising: string;
  venus: string;
  mars: string;
  /** Role headings — "what this placement means about you". */
  sunRole: string;
  moonRole: string;
  risingRole: string;
  venusRole: string;
  marsRole: string;
  /** Modal section headings. */
  inLove: string;
  classification: string;
  /** Hint shown when moon or rising hasn't been entered. */
  missingHint: string;
  /** Hint shown for venus/mars when birth data is incomplete. */
  missingPlanetHint: string;
  /** Shadow toggle labels. */
  shadowToggleOpen: string;
  shadowToggleClose: string;
  /** Balance section. */
  balanceSectionTitle: string;
  /** ICU-formatted with {count}. */
  balanceTotal: string;
  /** ICU-formatted with {element}. */
  balanceDominantElement: string;
  /** ICU-formatted with {modality}. */
  balanceDominantModality: string;
  /** ICU-formatted with {list}. */
  balanceMissingElements: string;
  /** Chart ruler card. */
  chartRulerTitle: string;
  chartRulerHint: string;
  /** ICU-formatted with {planet} + {sign}. */
  chartRulerPlacement: string;
  /** Transit moon card. */
  transitMoonTitle: string;
  transitMoonSubtitle: string;
  /** Localized name per sign id — pre-computed on the server. */
  signNames: Record<ZodiacSign, string>;
  /** Localized element / modality display names. */
  elementNames: Record<Element, string>;
  modalityNames: Record<Modality, string>;
}

interface Props {
  dob: BirthDate;
  moonSign: ZodiacSign | null;
  risingSign: ZodiacSign | null;
  venusSign: ZodiacSign | null;
  marsSign: ZodiacSign | null;
  /** Pre-computed chart balance (server-side). */
  balance: ChartBalance;
  /** Today's transit moon sign (server-side). Null when the ephemeris
   *  fails or when we deliberately hide the card. */
  transitMoon: ZodiacSign | null;
  locale: Locale;
  labels: Labels;
}

/**
 * Per-placement decorative token — emoji + label tint colour. Modeled on
 * Tinder Astrology's About You card. Sun / Moon / Rising get warm-cool-
 * pastel; Venus + Mars each get their own accent.
 */
const PLACEMENT_TOKENS: Record<
  PlacementKey,
  { emoji: string; tint: string }
> = {
  sun: { emoji: '☀️', tint: 'text-amber-600 dark:text-amber-300' },
  moon: { emoji: '🌙', tint: 'text-indigo-600 dark:text-indigo-300' },
  rising: { emoji: '✨', tint: 'text-rose-600 dark:text-rose-300' },
  venus: { emoji: '💗', tint: 'text-pink-600 dark:text-pink-300' },
  mars: { emoji: '🔥', tint: 'text-red-600 dark:text-red-300' },
};

/** Bar segment colour per element — matches the People infographic. */
const ELEMENT_BAR: Record<Element, { from: string; to: string }> = {
  fire: { from: 'from-rose-400', to: 'to-orange-400' },
  earth: { from: 'from-emerald-400', to: 'to-emerald-500' },
  air: { from: 'from-sky-400', to: 'to-sky-500' },
  water: { from: 'from-indigo-400', to: 'to-indigo-500' },
};

const ELEMENT_EMOJI: Record<Element, string> = {
  fire: '🔥',
  earth: '🌱',
  air: '🌬️',
  water: '🌊',
};

/**
 * Editorial-style zodiac card. Sun / Moon / Rising rows show the
 * classic "Tinder Astrology" placement layout — decorative emoji, small
 * colored label with the sign name + glyph, bold serif heading + body.
 * Venus + Mars rows extend the pattern once birth time is available.
 * Under the placements: chart-balance mini bar, chart ruler card, and
 * transit-moon-today card. Each placement row is tap-to-expand for the
 * full essence + in-love / drive riff + shadow side.
 */
export function ZodiacSection({
  dob,
  moonSign,
  risingSign,
  venusSign,
  marsSign,
  balance,
  transitMoon,
  locale,
  labels,
}: Props) {
  const [active, setActive] = useState<{
    label: string;
    sign: ZodiacSign;
    kind: PlacementKey;
  } | null>(null);

  const sun = sunSignFromDob(dob);

  const rows: Array<{
    key: PlacementKey;
    label: string;
    role: string;
    sign: ZodiacSign | null;
    needsBirthTime: boolean;
  }> = [
    { key: 'sun', label: labels.sun, role: labels.sunRole, sign: sun, needsBirthTime: false },
    { key: 'moon', label: labels.moon, role: labels.moonRole, sign: moonSign, needsBirthTime: true },
    {
      key: 'rising',
      label: labels.rising,
      role: labels.risingRole,
      sign: risingSign,
      needsBirthTime: true,
    },
    { key: 'venus', label: labels.venus, role: labels.venusRole, sign: venusSign, needsBirthTime: true },
    { key: 'mars', label: labels.mars, role: labels.marsRole, sign: marsSign, needsBirthTime: true },
  ];

  // Chart ruler = ruler-planet of Rising sign. The placement text
  // (`{planet} di {sign}`) is pre-formatted server-side via next-intl
  // and arrives as `labels.chartRulerPlacement`; we only need the
  // planet's life-theme copy for the card body here.
  const rulerPlanet: Planet | null = risingSign ? RULER[risingSign] : null;
  const rulerCopy = rulerPlanet ? rulerMeaning(rulerPlanet, locale) : null;

  return (
    <>
      <section className="border-border rounded-3xl border bg-gradient-to-br from-white via-white to-amber-50/40 px-5 py-6 shadow-sm dark:from-neutral-950 dark:via-neutral-950 dark:to-indigo-950/30">
        <h2 className="font-serif text-2xl font-semibold tracking-tight">
          {labels.sectionTitle}
        </h2>

        <div className="mt-5 space-y-6">
          {rows.map((row) => {
            const tokens = PLACEMENT_TOKENS[row.key];
            if (!row.sign) {
              return (
                <EmptyPlacement
                  key={row.key}
                  emoji={tokens.emoji}
                  label={row.label}
                  role={row.role}
                  missingHint={row.needsBirthTime ? labels.missingPlanetHint : labels.missingHint}
                />
              );
            }
            return (
              <FilledPlacement
                key={row.key}
                emoji={tokens.emoji}
                label={row.label}
                labelTint={tokens.tint}
                signName={labels.signNames[row.sign]}
                glyph={GLYPH[row.sign]}
                heading={row.role}
                body={placementBody(row.key, row.sign, locale)}
                shadow={shadowMeaning(row.sign, locale)}
                shadowOpenLabel={labels.shadowToggleOpen}
                shadowCloseLabel={labels.shadowToggleClose}
                onOpen={() => setActive({ label: row.label, sign: row.sign!, kind: row.key })}
              />
            );
          })}
        </div>

        {/* Chart balance — Element + Modality mini bars */}
        {balance.total > 0 ? (
          <ChartBalanceCard
            balance={balance}
            labels={labels}
          />
        ) : null}

        {/* Chart ruler card */}
        {rulerCopy && labels.chartRulerPlacement ? (
          <ChartRulerCard
            placement={labels.chartRulerPlacement}
            theme={rulerCopy.theme}
            labels={labels}
          />
        ) : null}

        {/* Transit moon today */}
        {transitMoon ? (
          <TransitMoonCard
            sign={transitMoon}
            signName={labels.signNames[transitMoon]}
            blurb={transitMoonBlurb(transitMoon, locale)}
            labels={labels}
          />
        ) : null}
      </section>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={
          active ? (
            <h3 className="font-serif text-xl font-semibold tracking-tight capitalize">
              {labels.signNames[active.sign]}
            </h3>
          ) : (
            ''
          )
        }
      >
        {active ? (
          <PlacementDetail
            sign={active.sign}
            kind={active.kind}
            locale={locale}
            labels={labels}
          />
        ) : null}
      </Modal>
    </>
  );
}

/** Per-placement body copy. Sun / Moon / Rising reuse the sign essence;
 *  Venus + Mars pull from the planets pack. */
function placementBody(
  kind: PlacementKey,
  sign: ZodiacSign,
  locale: Locale,
): { keyword: string; essence: string } {
  if (kind === 'venus' || kind === 'mars') {
    const m = planetSignMeaning(kind, sign, locale);
    return { keyword: m.keyword, essence: m.essence };
  }
  const m = zodiacMeaning(sign, locale);
  return { keyword: m.keyword, essence: m.essence };
}

function FilledPlacement({
  emoji,
  label,
  labelTint,
  signName,
  glyph,
  heading,
  body,
  shadow,
  shadowOpenLabel,
  shadowCloseLabel,
  onOpen,
}: {
  emoji: string;
  label: string;
  labelTint: string;
  signName: string;
  glyph: string;
  heading: string;
  body: { keyword: string; essence: string };
  shadow: string;
  shadowOpenLabel: string;
  shadowCloseLabel: string;
  onOpen: () => void;
}) {
  const [showShadow, setShowShadow] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onOpen}
        className="press-soft group flex w-full items-start gap-4 text-left transition-opacity hover:opacity-90"
      >
        <span className="text-[40px] leading-none select-none" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p
            className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${labelTint}`}
          >
            <span>{label}</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="capitalize">{signName}</span>
            <span className="font-serif text-[13px] leading-none">{glyph}</span>
          </p>
          <h3 className="font-serif text-[19px] font-semibold leading-snug tracking-tight">
            {heading}
          </h3>
          <p className="text-muted-foreground text-[13px] leading-relaxed">
            <span className="text-foreground font-medium">{body.keyword}.</span>{' '}
            {body.essence}
          </p>
        </div>
      </button>
      <div className="pl-[56px]">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowShadow((v) => !v);
          }}
          className="press-soft text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] font-medium transition-colors"
        >
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showShadow ? 'rotate-180' : ''}`}
            aria-hidden
          />
          {showShadow ? shadowCloseLabel : shadowOpenLabel}
        </button>
        {showShadow ? (
          <p className="text-muted-foreground mt-1.5 rounded-lg border border-dashed border-amber-300/60 bg-amber-50/60 px-3 py-2 text-[12.5px] leading-relaxed dark:border-amber-700/40 dark:bg-amber-950/20">
            {shadow}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyPlacement({
  emoji,
  label,
  role,
  missingHint,
}: {
  emoji: string;
  label: string;
  role: string;
  missingHint: string;
}) {
  return (
    <div className="flex w-full items-start gap-4 opacity-55">
      <span
        className="text-[40px] leading-none select-none grayscale"
        aria-hidden
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
          {label}
        </p>
        <h3 className="text-muted-foreground font-serif text-[19px] font-semibold leading-snug tracking-tight">
          {role}
        </h3>
        <p className="text-muted-foreground text-[13px] italic leading-relaxed">
          {missingHint}
        </p>
      </div>
    </div>
  );
}

function ChartBalanceCard({
  balance,
  labels,
}: {
  balance: ChartBalance;
  labels: Labels;
}) {
  const total = balance.total;
  const elementOrder: readonly Element[] = ['fire', 'earth', 'air', 'water'];
  const modalityOrder: readonly Modality[] = ['cardinal', 'fixed', 'mutable'];
  return (
    <div className="border-border/60 mt-6 space-y-4 rounded-2xl border bg-surface-1/50 px-4 py-4">
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {labels.balanceSectionTitle}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {labels.balanceTotal}
        </p>
      </div>

      {/* Element bar */}
      <div className="space-y-1.5">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/30">
          {elementOrder.map((el) => {
            if (balance.elements[el] === 0) return null;
            const pct = (balance.elements[el] / total) * 100;
            const bar = ELEMENT_BAR[el];
            return (
              <div
                key={el}
                className={`h-full bg-gradient-to-r ${bar.from} ${bar.to}`}
                style={{ width: `${pct}%` }}
                aria-label={`${labels.elementNames[el]}: ${balance.elements[el]}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {elementOrder.map((el) => (
            <span
              key={el}
              className={`inline-flex items-center gap-1 ${
                balance.elements[el] === 0 ? 'text-muted-foreground/50' : 'text-muted-foreground'
              }`}
            >
              <span aria-hidden>{ELEMENT_EMOJI[el]}</span>
              <span>
                <span
                  className={`tabular-nums font-semibold ${
                    balance.elements[el] === 0 ? 'text-muted-foreground/60' : 'text-foreground'
                  }`}
                >
                  {balance.elements[el]}
                </span>{' '}
                {labels.elementNames[el]}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Modality chips */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {modalityOrder.map((mod) => (
          <span
            key={mod}
            className={`border-border/60 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
              balance.dominantModality === mod
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'bg-white/60 text-muted-foreground dark:bg-neutral-900/40'
            }`}
          >
            <span className="tabular-nums font-semibold">
              {balance.modalities[mod]}
            </span>
            <span>{labels.modalityNames[mod]}</span>
          </span>
        ))}
      </div>

      {/* Insight lines */}
      {labels.balanceDominantElement ? (
        <p className="text-[12px] leading-relaxed text-foreground">
          {labels.balanceDominantElement}
          {labels.balanceDominantModality ? ` · ${labels.balanceDominantModality}` : ''}
        </p>
      ) : null}
      {labels.balanceMissingElements && balance.missingElements.length < 4 ? (
        <p className="text-[12px] italic leading-relaxed text-muted-foreground">
          {labels.balanceMissingElements}
        </p>
      ) : null}
    </div>
  );
}

function ChartRulerCard({
  placement,
  theme,
  labels,
}: {
  /** Server-formatted "{planet} di {sign}" string, or just the planet
   *  name when the ruler's sign isn't known in this chart. */
  placement: string;
  /** Ruler-planet's life-theme copy — client-fetched because the theme
   *  is planet-only, no ICU placeholders. */
  theme: string;
  labels: Labels;
}) {
  return (
    <div className="border-border/60 mt-4 space-y-2 rounded-2xl border bg-gradient-to-br from-violet-50/60 to-white px-4 py-4 dark:from-violet-950/25 dark:to-neutral-950">
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
          {labels.chartRulerTitle}
        </p>
        <p className="text-[11px] text-muted-foreground">{labels.chartRulerHint}</p>
      </div>
      <p className="font-serif text-lg font-semibold leading-tight">{placement}</p>
      <p className="text-muted-foreground text-[13px] leading-relaxed">{theme}</p>
    </div>
  );
}

function TransitMoonCard({
  sign,
  signName,
  blurb,
  labels,
}: {
  sign: ZodiacSign;
  signName: string;
  blurb: string;
  labels: Labels;
}) {
  const tokens = ELEMENT_TOKENS[ELEMENT[sign]];
  return (
    <div
      className={`border-border/60 mt-4 space-y-2 rounded-2xl border bg-gradient-to-br px-4 py-4 ${tokens.gradient}`}
    >
      <div className="flex items-start gap-2">
        <MoonIcon className="text-foreground/80 mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div className="space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/80">
            {labels.transitMoonTitle}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {labels.transitMoonSubtitle}
          </p>
        </div>
      </div>
      <p className="font-serif text-lg font-semibold capitalize leading-tight">
        <span className={tokens.glyph}>{GLYPH[sign]}</span>{' '}
        <span>{signName}</span>
      </p>
      <p className="text-[13px] leading-relaxed text-foreground/85">{blurb}</p>
    </div>
  );
}

function PlacementDetail({
  sign,
  kind,
  locale,
  labels,
}: {
  sign: ZodiacSign;
  kind: PlacementKey;
  locale: Locale;
  labels: Labels;
}) {
  const body = placementBody(kind, sign, locale);
  const meaning = zodiacMeaning(sign, locale);
  const shadow = shadowMeaning(sign, locale);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-serif text-4xl">{GLYPH[sign]}</span>
        <div>
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
            {labels.classification}
          </p>
          <p className="text-sm">
            {labels.elementNames[ELEMENT[sign]]} · {labels.modalityNames[MODALITY[sign]]}
          </p>
        </div>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        <span className="font-semibold">{body.keyword}.</span> {body.essence}
      </p>
      {kind !== 'venus' && kind !== 'mars' ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
            {labels.inLove}
          </p>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">
            {meaning.inLove}
          </p>
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          {labels.shadowToggleOpen}
        </p>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">
          {shadow}
        </p>
      </div>
    </div>
  );
}
