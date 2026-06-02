'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { Cornerstone } from '@/lib/numerology/cornerstone';
import type { NumerologyResult } from '@/lib/numerology';
import type { Planes } from '@/lib/numerology/planesOfExpression';
import { meaningFor, type MeaningType } from '@/lib/numerology/meanings';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { Modal } from '@/components/layout/Modal';

type ConceptKey =
  | 'maturity'
  | 'hiddenPassion'
  | 'balance'
  | 'cornerstone'
  | 'subconsciousSelf'
  | 'rationalThought'
  | 'physical'
  | 'mental'
  | 'emotional'
  | 'intuitive';

/** Mapping from a UI concept key to the MeaningType used for content lookup. */
const CONCEPT_TO_MEANING: Record<ConceptKey, MeaningType> = {
  maturity: 'maturity',
  hiddenPassion: 'hiddenPassion',
  balance: 'balance',
  cornerstone: 'cornerstone',
  subconsciousSelf: 'subconsciousSelf',
  rationalThought: 'rationalThought',
  physical: 'physicalPlane',
  mental: 'mentalPlane',
  emotional: 'emotionalPlane',
  intuitive: 'intuitivePlane',
};

interface Props {
  locale: Locale;
  labels: {
    title: string;
    hint: string;
    maturity: string;
    hiddenPassion: string;
    balance: string;
    cornerstone: string;
    subconsciousSelf: string;
    rationalThought: string;
    planes: string;
    physical: string;
    mental: string;
    emotional: string;
    intuitive: string;
    /** "What is this concept?" body per derivative — secondary info, behind a
     *  disclosure. The primary modal body is the per-number meaning. */
    explainers: Record<ConceptKey, string>;
    learnConcept: string;
    comingSoon: string;
  };
  derivatives: {
    maturity: NumerologyResult;
    hiddenPassion: number[];
    balance: NumerologyResult;
    cornerstone: Cornerstone | null;
    subconsciousSelf: number;
    rationalThought: NumerologyResult;
    planes: Planes;
  };
}

interface ModalState {
  concept: ConceptKey;
  /** Big value rendered at the top of the modal. */
  value: React.ReactNode;
  /** Digits to look up per-number meanings for. Hidden Passion can have
   *  multiple winners; everything else is a single digit. */
  digits: number[];
  /** Optional secondary subtitle below the value (e.g. letter for
   *  Cornerstone). */
  subtitle?: string;
}

/**
 * Decoz second-tier numerology surface. Tapping a row opens a modal:
 *   1. Big value (the user's number).
 *   2. Per-number meaning(s) — what this digit means for THEM in this concept.
 *   3. Optional "Pelajari konsepnya" disclosure with the concept-level body.
 */
export function MoreNumbersWidget({ locale, labels, derivatives: d }: Props) {
  const [open, setOpen] = useState<ModalState | null>(null);

  return (
    <section className="border-border space-y-4 rounded-2xl border bg-surface-1 p-5">
      <header className="space-y-1">
        <h2 className="text-base font-semibold">{labels.title}</h2>
        <p className="text-muted-foreground text-xs">{labels.hint}</p>
      </header>

      <ul className="divide-border/60 divide-y">
        <DetailRow
          label={labels.maturity}
          onClick={() =>
            setOpen({
              concept: 'maturity',
              value: <CompoundReduced result={d.maturity} locale={locale} size="lg" />,
              digits: [singleDigit(d.maturity.reduced)],
            })
          }
        >
          <CompoundReduced result={d.maturity} locale={locale} size="md" />
        </DetailRow>

        <DetailRow
          label={labels.hiddenPassion}
          onClick={() =>
            setOpen({
              concept: 'hiddenPassion',
              value: <HiddenPassionPills values={d.hiddenPassion} size="lg" />,
              digits: d.hiddenPassion,
            })
          }
        >
          <HiddenPassionPills values={d.hiddenPassion} size="md" />
        </DetailRow>

        <DetailRow
          label={labels.balance}
          onClick={() =>
            setOpen({
              concept: 'balance',
              value: <CompoundReduced result={d.balance} locale={locale} size="lg" />,
              digits: [singleDigit(d.balance.reduced)],
            })
          }
        >
          <CompoundReduced result={d.balance} locale={locale} size="md" />
        </DetailRow>

        <DetailRow
          label={labels.cornerstone}
          onClick={() =>
            setOpen({
              concept: 'cornerstone',
              value: <CornerstoneDisplay c={d.cornerstone} size="lg" />,
              digits: d.cornerstone ? [d.cornerstone.value] : [],
              subtitle: d.cornerstone ? `${labels.cornerstone} · ${d.cornerstone.letter}` : undefined,
            })
          }
        >
          <CornerstoneDisplay c={d.cornerstone} size="md" />
        </DetailRow>

        <DetailRow
          label={labels.subconsciousSelf}
          onClick={() =>
            setOpen({
              concept: 'subconsciousSelf',
              value: (
                <span className="font-mono text-3xl font-semibold tabular-nums">
                  {d.subconsciousSelf}
                  <span className="text-muted-foreground text-lg"> / 9</span>
                </span>
              ),
              digits: [d.subconsciousSelf],
            })
          }
        >
          <span className="font-mono text-sm font-semibold tabular-nums">
            {d.subconsciousSelf}
            <span className="text-muted-foreground"> / 9</span>
          </span>
        </DetailRow>

        <DetailRow
          label={labels.rationalThought}
          onClick={() =>
            setOpen({
              concept: 'rationalThought',
              value: <CompoundReduced result={d.rationalThought} locale={locale} size="lg" />,
              digits: [singleDigit(d.rationalThought.reduced)],
            })
          }
        >
          <CompoundReduced result={d.rationalThought} locale={locale} size="md" />
        </DetailRow>
      </ul>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {labels.planes}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PlaneCard
            label={labels.physical}
            value={d.planes.physical}
            locale={locale}
            onClick={() =>
              setOpen({
                concept: 'physical',
                value: <CompoundReduced result={d.planes.physical} locale={locale} size="lg" />,
                digits: [singleDigit(d.planes.physical.reduced)],
              })
            }
          />
          <PlaneCard
            label={labels.mental}
            value={d.planes.mental}
            locale={locale}
            onClick={() =>
              setOpen({
                concept: 'mental',
                value: <CompoundReduced result={d.planes.mental} locale={locale} size="lg" />,
                digits: [singleDigit(d.planes.mental.reduced)],
              })
            }
          />
          <PlaneCard
            label={labels.emotional}
            value={d.planes.emotional}
            locale={locale}
            onClick={() =>
              setOpen({
                concept: 'emotional',
                value: <CompoundReduced result={d.planes.emotional} locale={locale} size="lg" />,
                digits: [singleDigit(d.planes.emotional.reduced)],
              })
            }
          />
          <PlaneCard
            label={labels.intuitive}
            value={d.planes.intuitive}
            locale={locale}
            onClick={() =>
              setOpen({
                concept: 'intuitive',
                value: <CompoundReduced result={d.planes.intuitive} locale={locale} size="lg" />,
                digits: [singleDigit(d.planes.intuitive.reduced)],
              })
            }
          />
        </div>
      </div>

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={
          open ? (
            <h3 className="font-serif text-xl font-semibold tracking-tight">{labels[open.concept]}</h3>
          ) : null
        }
      >
        {open ? (
          <DetailBody
            value={open.value}
            digits={open.digits}
            meaningType={CONCEPT_TO_MEANING[open.concept]}
            locale={locale}
            conceptBody={labels.explainers[open.concept]}
            learnConceptLabel={labels.learnConcept}
            comingSoonLabel={labels.comingSoon}
            subtitle={open.subtitle}
          />
        ) : null}
      </Modal>
    </section>
  );
}

function DetailBody({
  value,
  digits,
  meaningType,
  locale,
  conceptBody,
  learnConceptLabel,
  comingSoonLabel,
  subtitle,
}: {
  value: React.ReactNode;
  digits: number[];
  meaningType: MeaningType;
  locale: Locale;
  conceptBody: string;
  learnConceptLabel: string;
  comingSoonLabel: string;
  subtitle?: string;
}) {
  // Pull per-digit meanings; if digits is empty (no value), nothing to show.
  const blurbs = digits
    .map((d) => ({
      digit: d,
      text: meaningFor(meaningType, { compound: d, reduced: d, isMaster: false }, locale),
    }))
    .filter((b) => b.text);

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div>{value}</div>
        {subtitle ? <p className="text-muted-foreground text-xs">{subtitle}</p> : null}
      </div>

      {blurbs.length > 0 ? (
        <ul className="space-y-3">
          {blurbs.map((b) => (
            <li
              key={b.digit}
              className={blurbs.length > 1 ? 'border-border/60 border-l-2 pl-3' : ''}
            >
              {blurbs.length > 1 ? (
                <p className="text-primary font-mono text-xs font-semibold tabular-nums">{b.digit}</p>
              ) : null}
              <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {b.text}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm italic">{comingSoonLabel}</p>
      )}

      <details className="group">
        <summary className="press-soft text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-2 text-xs font-medium [&::-webkit-details-marker]:hidden">
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform ios-ease group-open:rotate-180"
            aria-hidden
          />
          <span>{learnConceptLabel}</span>
        </summary>
        <p className="text-muted-foreground mt-2 whitespace-pre-line text-sm leading-relaxed">
          {conceptBody}
        </p>
      </details>
    </div>
  );
}

function DetailRow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="press-soft hover:bg-muted/30 flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors"
      >
        <span className="text-sm">{label}</span>
        <div className="shrink-0">{children}</div>
      </button>
    </li>
  );
}

function PlaneCard({
  label,
  value,
  locale,
  onClick,
}: {
  label: string;
  value: NumerologyResult;
  locale: Locale;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border/60 press-soft hover:bg-surface-2 rounded-xl border bg-surface-2/40 p-3 text-left transition-colors"
    >
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-1.5">
        <CompoundReduced result={value} locale={locale} size="md" />
      </div>
    </button>
  );
}

function HiddenPassionPills({ values, size }: { values: number[]; size: 'md' | 'lg' }) {
  if (values.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  const dim = size === 'lg' ? 'h-10 w-10 text-base' : 'h-7 w-7 text-sm';
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {values.map((n) => (
        <span
          key={n}
          className={`bg-primary/10 text-primary inline-flex items-center justify-center rounded-full font-mono font-semibold tabular-nums ${dim}`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function CornerstoneDisplay({ c, size }: { c: Cornerstone | null; size: 'md' | 'lg' }) {
  if (!c) return <span className="text-muted-foreground text-xs">—</span>;
  const letter = size === 'lg' ? 'text-4xl' : 'text-xl';
  const value = size === 'lg' ? 'text-base' : 'text-xs';
  return (
    <div className="flex items-center gap-2">
      <span className={`font-serif font-semibold tracking-tight ${letter}`}>{c.letter}</span>
      <span className={`text-muted-foreground font-mono tabular-nums ${value}`}>· {c.value}</span>
    </div>
  );
}

/** Reduce any compound-or-master to a single 1-9 digit. */
function singleDigit(n: number): number {
  let v = n;
  while (v >= 10) {
    let s = 0;
    let x = v;
    while (x > 0) {
      s += x % 10;
      x = Math.floor(x / 10);
    }
    v = s;
  }
  return v;
}
