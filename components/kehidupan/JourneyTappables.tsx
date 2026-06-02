'use client';

import { useState } from 'react';
import { Modal } from '@/components/layout/Modal';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  value: React.ReactNode;
  body: string | null;
}

function DetailModal({ open, onClose, title, value, body }: DetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={<h3 className="font-serif text-xl font-semibold tracking-tight">{title}</h3>}
    >
      <div className="space-y-4">
        <div>{value}</div>
        {body ? (
          <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">{body}</p>
        ) : (
          <p className="text-muted-foreground text-sm italic">—</p>
        )}
      </div>
    </Modal>
  );
}

/**
 * Duality badge — tap to open an explanation of what the Essence + Personal
 * Year pair represents this year.
 */
export function DualityCard({
  title,
  hint,
  essence,
  py,
  explainerTitle,
  explainerBody,
}: {
  title: string;
  hint: string;
  essence: number;
  py: number;
  explainerTitle: string;
  explainerBody: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border press-soft hover:bg-muted/30 block w-full rounded-xl border bg-surface-1 p-4 text-left transition-colors"
      >
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
          {title}
        </p>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
          {essence}
          <span className="text-muted-foreground mx-1.5 text-base font-normal">+</span>
          {py}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      </button>
      <DetailModal
        open={open}
        onClose={() => setOpen(false)}
        title={explainerTitle}
        value={
          <p className="font-mono text-3xl font-semibold tabular-nums">
            {essence}
            <span className="text-muted-foreground mx-2 text-xl font-normal">+</span>
            {py}
          </p>
        }
        body={explainerBody}
      />
    </>
  );
}

interface MonthCell {
  month: number;
  shortLabel: string;
  longLabel: string;
  pm: number;
  meaning: string | null;
}

/**
 * 12-month Personal Month strip — each cell taps to a modal with that
 * month's PM meaning (deterministic from the content/meanings packs).
 */
export function MonthlyPMStrip({
  title,
  cells,
  currentMonth,
  monthLabel,
}: {
  title: string;
  cells: MonthCell[];
  currentMonth: number;
  monthLabel: string; // e.g. "Personal Month" prefix in the modal title
}) {
  const [active, setActive] = useState<MonthCell | null>(null);
  return (
    <>
      <div className="border-border space-y-2 rounded-xl border bg-surface-1 p-4">
        <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
          {title}
        </p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
          {cells.map((cell) => {
            const isCurrent = cell.month === currentMonth;
            return (
              <button
                key={cell.month}
                type="button"
                onClick={() => setActive(cell)}
                className={`press-soft flex flex-col items-center rounded-lg px-1 py-2 text-center transition-colors ${isCurrent ? 'bg-primary/15 ring-primary ring-1' : 'bg-surface-2/60 hover:bg-surface-2'}`}
              >
                <span className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">
                  {cell.shortLabel}
                </span>
                <span className="mt-0.5 font-mono text-base font-semibold tabular-nums">
                  {cell.pm}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <DetailModal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active ? `${monthLabel} · ${active.longLabel}` : ''}
        value={
          active ? (
            <span className="font-mono text-4xl font-semibold tabular-nums">{active.pm}</span>
          ) : null
        }
        body={active?.meaning ?? null}
      />
    </>
  );
}

/**
 * Tappable Transit chip — replaces the static TransitChip in
 * PerjalananView when tap-to-detail is desired. Letter + value + age range
 * stay on the card; modal shows the letter's transit explainer.
 */
export function TappableTransitChip({
  label,
  hint,
  letter,
  value,
  rangeStart,
  rangeEnd,
  ageLabel,
  explainerTitle,
  explainerBody,
}: {
  label: string;
  hint: string;
  letter: string;
  value: number;
  rangeStart: number;
  rangeEnd: number;
  ageLabel: string;
  explainerTitle: string;
  explainerBody: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border press-soft hover:bg-muted/30 block w-full rounded-xl border bg-surface-1 p-4 text-left transition-colors"
      >
        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-serif text-3xl font-semibold tracking-tight">{letter}</span>
          <span className="text-muted-foreground font-mono text-sm tabular-nums">= {value}</span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs tabular-nums">
          {ageLabel} {rangeStart}–{rangeEnd}
        </p>
        <p className="text-muted-foreground mt-1 truncate text-[10px]">{hint}</p>
      </button>
      <DetailModal
        open={open}
        onClose={() => setOpen(false)}
        title={explainerTitle}
        value={
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-5xl font-semibold tracking-tight">{letter}</span>
            <span className="text-muted-foreground font-mono text-lg tabular-nums">= {value}</span>
          </div>
        }
        body={explainerBody}
      />
    </>
  );
}

interface CycleRow {
  slot: 1 | 2 | 3;
  range: string;
  reduced: number;
  compound: number;
  isMaster: boolean;
  meaning: string | null;
  isActive: boolean;
}

/**
 * Period Cycle table — three rows (childhood / middle / late). Each row
 * is tap-to-detail: modal shows the cycle slot + age range + reduced
 * number + its meaning from content/meanings.
 */
export function PeriodCycleTable({
  rows,
  labels,
}: {
  rows: CycleRow[];
  labels: {
    cycle: string;
    ageRange: string;
    number: string;
    now: string;
    modalTitlePrefix: string;
    comingSoon: string;
  };
}) {
  const [active, setActive] = useState<CycleRow | null>(null);
  return (
    <>
      <div className="border-border overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-2 text-left font-medium">{labels.cycle}</th>
              <th className="px-4 py-2 text-left font-medium">{labels.ageRange}</th>
              <th className="px-4 py-2 text-left font-medium">{labels.number}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.slot}
                onClick={() => setActive(row)}
                className={`press-soft hover:bg-muted/30 cursor-pointer border-t transition-colors ${row.isActive ? 'bg-primary/5' : ''}`}
              >
                <td className="px-4 py-3 font-medium">
                  {row.slot}
                  {row.isActive ? (
                    <span className="text-primary ml-2 text-[10px] uppercase tracking-wider">
                      {labels.now}
                    </span>
                  ) : null}
                </td>
                <td className="text-muted-foreground px-4 py-3 tabular-nums">{row.range}</td>
                <td className="px-4 py-3 font-mono text-base font-semibold tabular-nums">
                  {row.reduced}
                  {row.isMaster ? (
                    <span className="text-primary ml-1 text-[10px] font-semibold uppercase tracking-wider">
                      master
                    </span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DetailModal
        open={active !== null}
        onClose={() => setActive(null)}
        title={
          active
            ? `${labels.modalTitlePrefix} ${active.slot} · ${labels.ageRange.toLowerCase()} ${active.range}`
            : ''
        }
        value={
          active ? (
            <span className="font-mono text-4xl font-semibold tabular-nums">{active.reduced}</span>
          ) : null
        }
        body={active?.meaning ?? labels.comingSoon}
      />
    </>
  );
}
