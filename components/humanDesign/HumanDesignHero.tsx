'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { HumanDesignChart } from '@/lib/humanDesign/types';
import {
  hdAuthorityContent,
  hdDefinitionContent,
  hdProfileContent,
  hdStrategyContent,
  hdTypeContent,
} from '@/lib/humanDesign/content';
import { Modal } from '@/components/layout/Modal';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface Props {
  chart: HumanDesignChart;
  locale: Locale;
}

type DetailKind = 'type' | 'strategy' | 'authority' | 'profile' | 'definition' | null;

/**
 * Hero card for the user's Human Design chart. Big Type badge at the
 * top, with Strategy / Authority / Profile / Definition / Incarnation
 * Cross as tappable rows underneath. Each row opens a Modal carrying
 * the static content-pack prose for that dimension.
 *
 * Rendered as a Client Component because of the local `useState` for
 * the modal open/closed state — but it only takes static, pre-resolved
 * content as props, no functions crossing the boundary.
 */
export function HumanDesignHero({ chart, locale }: Props) {
  const [detail, setDetail] = useState<DetailKind>(null);

  const typeContent = hdTypeContent(chart.type, locale);
  const strategyContent = hdStrategyContent(chart.strategy, locale);
  const authorityContent = hdAuthorityContent(chart.authority, locale);
  const profileContent = hdProfileContent(
    chart.profile.conscious,
    chart.profile.unconscious,
    locale,
  );
  const definitionContent = hdDefinitionContent(chart.definition, locale);

  const profileLabel = `${chart.profile.conscious}/${chart.profile.unconscious}`;
  const crossLabel =
    chart.incarnationCross.name ??
    `${chart.incarnationCross.angle === 'RIGHT' ? '→' : chart.incarnationCross.angle === 'LEFT' ? '↺' : '◇'} ${chart.incarnationCross.gates.join(' · ')}`;

  return (
    <>
      <section className="border-border rounded-3xl border bg-white shadow-sm dark:bg-neutral-900">
        <div className="space-y-4 px-5 py-5">
          {/* Type badge + Strategy tagline */}
          <button
            type="button"
            onClick={() => setDetail('type')}
            className="press-soft block w-full rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-4 text-left transition-colors hover:from-amber-100 hover:to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30 dark:hover:from-amber-900/40 dark:hover:to-orange-900/40"
          >
            <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.18em]">
              {typeContent?.headline ?? ''}
            </p>
            <p className="font-serif mt-0.5 text-3xl font-semibold leading-tight tracking-tight">
              {typeContent?.name ?? chart.type}
            </p>
            {strategyContent ? (
              <p className="text-muted-foreground mt-2 text-sm">
                <span className="font-medium">{strategyContent.name}:</span>{' '}
                {strategyContent.headline}
              </p>
            ) : null}
          </button>

          {/* Inner grid: Authority / Profile / Definition / Cross */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <DetailRow
              label="Otoritas"
              value={authorityContent?.name ?? chart.authority}
              hint={authorityContent?.headline}
              onClick={() => setDetail('authority')}
            />
            <DetailRow
              label="Profil"
              value={profileContent?.name ?? profileLabel}
              hint={profileContent?.headline ?? profileLabel}
              onClick={() => setDetail('profile')}
            />
            <DetailRow
              label="Definisi"
              value={definitionContent?.name ?? chart.definition}
              hint={definitionContent?.headline}
              onClick={() => setDetail('definition')}
            />
            <DetailRow
              label="Inkarnasi Cross"
              value={crossLabel}
              hint={
                chart.incarnationCross.name
                  ? chart.incarnationCross.gates.join(' · ')
                  : undefined
              }
              onClick={null}
            />
          </div>

          {/* Stats summary */}
          <div className="border-border/60 flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs">
            <Stat label="Gate aktif" value={chart.activeGates.length} />
            <Stat label="Channel terdefinisi" value={chart.definedChannels.length} />
            <Stat
              label="Pusat terdefinisi"
              value={
                Object.values(chart.centers).filter((c) => c.defined).length
              }
            />
          </div>
        </div>
      </section>

      <Modal
        open={detail === 'type'}
        onClose={() => setDetail(null)}
        title={typeContent?.name ?? chart.type}
      >
        {typeContent ? (
          <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
            <p className="text-muted-foreground italic">{typeContent.headline}</p>
            <p>{renderInlineMd(typeContent.body)}</p>
            {typeContent.gifts.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-foreground text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Kekuatan
                </p>
                <ul className="space-y-1">
                  {typeContent.gifts.map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {typeContent.shadow ? (
              <div className="border-border/60 border-l-2 pl-3 text-[13px] italic text-muted-foreground">
                {typeContent.shadow}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={detail === 'strategy'}
        onClose={() => setDetail(null)}
        title={strategyContent?.name ?? chart.strategy}
      >
        {strategyContent ? (
          <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
            <p className="text-muted-foreground italic">{strategyContent.headline}</p>
            <p>{renderInlineMd(strategyContent.body)}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={detail === 'authority'}
        onClose={() => setDetail(null)}
        title={authorityContent?.name ?? chart.authority}
      >
        {authorityContent ? (
          <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
            <p className="text-muted-foreground italic">{authorityContent.headline}</p>
            <p>{renderInlineMd(authorityContent.body)}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={detail === 'profile'}
        onClose={() => setDetail(null)}
        title={profileContent?.name ?? profileLabel}
      >
        {profileContent ? (
          <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
            <p className="text-muted-foreground italic">{profileContent.headline}</p>
            <p>{renderInlineMd(profileContent.body)}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={detail === 'definition'}
        onClose={() => setDetail(null)}
        title={definitionContent?.name ?? chart.definition}
      >
        {definitionContent ? (
          <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
            <p className="text-muted-foreground italic">{definitionContent.headline}</p>
            <p>{renderInlineMd(definitionContent.body)}</p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function DetailRow({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  onClick: (() => void) | null;
}) {
  const inner = (
    <div className="flex flex-1 items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.16em]">
          {label}
        </p>
        <p className="text-foreground mt-0.5 truncate text-sm font-medium">{value}</p>
        {hint ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-[11px] italic">{hint}</p>
        ) : null}
      </div>
      {onClick ? <Info className="text-muted-foreground mt-1 h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
    </div>
  );
  if (!onClick) {
    return (
      <div className="border-border/60 flex items-start gap-2 rounded-xl border bg-surface-1/50 px-3 py-2.5">
        {inner}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="press-soft border-border/60 flex items-start gap-2 rounded-xl border bg-surface-1/50 px-3 py-2.5 text-left transition-colors hover:bg-surface-2"
    >
      {inner}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-foreground font-semibold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
