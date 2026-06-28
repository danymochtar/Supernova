'use client';

import type { Locale } from '@/lib/i18n/config';
import type { HDLine } from '@/lib/humanDesign/types';
import { hdGateContent, hdLineContent } from '@/lib/humanDesign/content';
import { Modal } from '@/components/layout/Modal';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface Activation {
  side: 'personality' | 'design';
  planet: string;
  line: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  gate: number;
  /** Which planetary activations landed on this gate (may be empty if
   *  the gate isn't active in the user's chart). */
  activations: Activation[];
  locale: Locale;
}

const PLANET_LABELS: Record<string, string> = {
  sun: 'Sun',
  earth: 'Earth',
  moon: 'Moon',
  northNode: 'North Node',
  southNode: 'South Node',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
};

export function GateDetailModal({ open, onClose, gate, activations, locale }: Props) {
  const content = hdGateContent(gate, locale);
  const userLines = new Set(activations.map((a) => a.line as HDLine));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        content?.name
          ? `Gate ${gate} · ${content.name}`
          : `Gate ${gate}`
      }
    >
      <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
        {content?.keynote ? (
          <p className="text-muted-foreground italic">{content.keynote}</p>
        ) : null}
        {content?.body ? <p>{renderInlineMd(content.body)}</p> : null}

        {activations.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-foreground text-[11px] font-semibold uppercase tracking-[0.16em]">
              Aktivasi kamu di gate ini
            </p>
            <ul className="space-y-0.5 text-[12px]">
              {activations.map((a, i) => (
                <li key={i} className="text-muted-foreground">
                  <span
                    className={
                      a.side === 'personality'
                        ? 'font-medium text-neutral-700 dark:text-neutral-200'
                        : 'font-medium text-rose-600 dark:text-rose-400'
                    }
                  >
                    {a.side === 'personality' ? 'P' : 'D'}
                  </span>{' '}
                  {PLANET_LABELS[a.planet] ?? a.planet} — line {a.line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* 6 line archetypes — highlight the ones active for this user. */}
        <div className="border-border/60 border-t pt-3">
          <p className="text-foreground text-[11px] font-semibold uppercase tracking-[0.16em]">
            Garis (lines)
          </p>
          <ul className="mt-1.5 space-y-1">
            {([1, 2, 3, 4, 5, 6] as const).map((n) => {
              const lc = hdLineContent(n, locale);
              const isUserLine = userLines.has(n);
              return (
                <li
                  key={n}
                  className={`flex gap-2 text-[12px] ${
                    isUserLine
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                      isUserLine
                        ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {n}
                  </span>
                  <span>
                    <span className="font-medium">{lc?.name ?? `Line ${n}`}.</span>{' '}
                    {lc?.body ?? ''}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
