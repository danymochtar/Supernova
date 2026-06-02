'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { Cornerstone } from '@/lib/numerology/cornerstone';
import type { NumerologyResult } from '@/lib/numerology';
import type { Planes } from '@/lib/numerology/planesOfExpression';
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
    /** "What is this?" body per concept, shown in the tap-to-detail modal. */
    explainers: Record<ConceptKey, string>;
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
  /** Pre-rendered value node shown at the top of the modal. */
  value: React.ReactNode;
}

/**
 * Decoz second-tier numerology surface — each row is tappable; the modal
 * explains what that concept means + shows the user's specific value
 * prominently so the dashboard stays scannable while still teaching.
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
              })
            }
          />
        </div>
      </div>

      <Modal
        open={open !== null}
        onClose={() => setOpen(null)}
        title={
          open ? <h3 className="font-serif text-xl font-semibold tracking-tight">{labels[open.concept]}</h3> : null
        }
      >
        {open ? (
          <div className="space-y-4">
            <div>{open.value}</div>
            <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
              {labels.explainers[open.concept]}
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
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
