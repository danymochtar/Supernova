'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { HDCenter, HumanDesignChart } from '@/lib/humanDesign/types';
import { ALL_CENTERS } from '@/lib/humanDesign/types';
import { CHANNELS } from '@/lib/humanDesign/channels';
import {
  BODYGRAPH_VIEWBOX,
  CENTER_LAYOUT,
  CHANNEL_LAYOUT,
  centerPath,
} from './bodygraphLayout';
import { CenterDetailModal } from './CenterDetailModal';
import { ChannelDetailModal } from './ChannelDetailModal';
import { GateDetailModal } from './GateDetailModal';

interface Props {
  chart: HumanDesignChart;
  locale: Locale;
}

type DetailState =
  | { kind: 'center'; center: HDCenter }
  | { kind: 'channel'; index: number }
  | { kind: 'gate'; gate: number }
  | null;

/**
 * The Jovian Archive-style 9-center bodygraph rendered as inline SVG.
 * Channels are drawn first (so center shapes overlay the line endpoints),
 * then centers as filled / outlined polygons, then gate dots on top of
 * everything else. Tap any layer → detail modal pulling from the
 * locale-keyed content packs.
 */
export function Bodygraph({ chart, locale }: Props) {
  const [detail, setDetail] = useState<DetailState>(null);

  // Pre-compute fast lookups so the SVG render stays O(layout size).
  const activeGates = useMemo(() => new Set(chart.activeGates), [chart.activeGates]);
  const definedChannels = useMemo(
    () => new Set(chart.definedChannels),
    [chart.definedChannels],
  );

  // For each active gate, find which planetary activations landed on it
  // (across P and D). Used for highlighting + the GateDetailModal.
  const gateActivations = useMemo(() => {
    const out = new Map<number, Array<{ side: 'personality' | 'design'; planet: string; line: number }>>();
    for (const [planet, gl] of Object.entries(chart.activations.personality)) {
      if (!out.has(gl.gate)) out.set(gl.gate, []);
      out.get(gl.gate)!.push({ side: 'personality', planet, line: gl.line });
    }
    for (const [planet, gl] of Object.entries(chart.activations.design)) {
      if (!out.has(gl.gate)) out.set(gl.gate, []);
      out.get(gl.gate)!.push({ side: 'design', planet, line: gl.line });
    }
    return out;
  }, [chart.activations]);

  return (
    <>
      <section className="border-border rounded-3xl border bg-white px-3 py-4 shadow-sm dark:bg-neutral-900">
        <svg
          viewBox={`0 0 ${BODYGRAPH_VIEWBOX.width} ${BODYGRAPH_VIEWBOX.height}`}
          className="mx-auto block h-auto w-full max-w-[320px]"
          role="img"
          aria-label="Human Design bodygraph"
        >
          {/* Channels — drawn first so center shapes overlay endpoints. */}
          {CHANNEL_LAYOUT.map((cl) => {
            const ch = CHANNELS[cl.channelIndex]!;
            const isDefined = definedChannels.has(cl.channelIndex);
            const oneSide =
              activeGates.has(ch.gates[0]) || activeGates.has(ch.gates[1]);
            const strokeColor = isDefined
              ? '#7c3aed' // violet-600 — defined channel
              : oneSide
                ? '#cbd5e1' // slate-300 — hanging gate, half-active
                : '#e5e7eb'; // neutral-200 — inactive
            return (
              <line
                key={cl.channelIndex}
                x1={cl.x1}
                y1={cl.y1}
                x2={cl.x2}
                y2={cl.y2}
                stroke={strokeColor}
                strokeWidth={isDefined ? 4 : 2}
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() => setDetail({ kind: 'channel', index: cl.channelIndex })}
              />
            );
          })}

          {/* Centers — outlined when undefined, filled when defined. */}
          {ALL_CENTERS.map((c) => {
            const layout = CENTER_LAYOUT[c];
            const isDefined = chart.centers[c].defined;
            return (
              <path
                key={c}
                d={centerPath(layout)}
                fill={isDefined ? layout.definedFill : 'transparent'}
                stroke={isDefined ? layout.definedFill : '#94a3b8'}
                strokeWidth={1.5}
                className="cursor-pointer transition-opacity hover:opacity-80"
                onClick={() => setDetail({ kind: 'center', center: c })}
              />
            );
          })}

          {/* Gate dots — only render the canonical 64 gates once each
            * (some appear in multiple center lists due to dual-anchor
            * gates). Active ones get a filled circle + a stroke; inactive
            * ones are a small outlined ring. */}
          {ALL_CENTERS.flatMap((c) => {
            const seen = new Set<number>();
            return CENTER_LAYOUT[c].gates
              .filter((g) => {
                if (seen.has(g.gate)) return false;
                seen.add(g.gate);
                return true;
              })
              .map((g) => {
                const isActive = activeGates.has(g.gate);
                return (
                  <g
                    key={`${c}-${g.gate}`}
                    className="cursor-pointer"
                    onClick={() => setDetail({ kind: 'gate', gate: g.gate })}
                  >
                    <circle
                      cx={g.x}
                      cy={g.y}
                      r={6}
                      fill={isActive ? '#1f2937' : '#f8fafc'}
                      stroke="#475569"
                      strokeWidth={0.8}
                    />
                    <text
                      x={g.x}
                      y={g.y + 2.2}
                      textAnchor="middle"
                      fontSize={6.5}
                      fontWeight={600}
                      fill={isActive ? '#f8fafc' : '#475569'}
                    >
                      {g.gate}
                    </text>
                  </g>
                );
              });
          })}
        </svg>

        <p className="text-muted-foreground mt-3 px-2 text-center text-[11px] italic">
          {/* Render a tiny legend so users know what colors / sizes mean. */}
          Tap pusat, channel, atau gate buat penjelasan.
        </p>
      </section>

      {detail?.kind === 'center' ? (
        <CenterDetailModal
          open
          onClose={() => setDetail(null)}
          center={detail.center}
          defined={chart.centers[detail.center].defined}
          activeGates={chart.centers[detail.center].gates}
          locale={locale}
        />
      ) : null}

      {detail?.kind === 'channel' ? (
        <ChannelDetailModal
          open
          onClose={() => setDetail(null)}
          channelIndex={detail.index}
          defined={definedChannels.has(detail.index)}
          locale={locale}
        />
      ) : null}

      {detail?.kind === 'gate' ? (
        <GateDetailModal
          open
          onClose={() => setDetail(null)}
          gate={detail.gate}
          activations={gateActivations.get(detail.gate) ?? []}
          locale={locale}
        />
      ) : null}
    </>
  );
}
