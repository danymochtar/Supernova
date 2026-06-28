'use client';

import type { Locale } from '@/lib/i18n/config';
import type { HDCenter } from '@/lib/humanDesign/types';
import { hdCenterContent } from '@/lib/humanDesign/content';
import { Modal } from '@/components/layout/Modal';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface Props {
  open: boolean;
  onClose: () => void;
  center: HDCenter;
  defined: boolean;
  /** User's active gates within this center. */
  activeGates: number[];
  locale: Locale;
}

/**
 * Modal showing what a center means for the user, with separate copy
 * for defined vs undefined states. Lists the user's active gates within
 * the center so they can drill down further into a gate from here.
 */
export function CenterDetailModal({
  open,
  onClose,
  center,
  defined,
  activeGates,
  locale,
}: Props) {
  const content = hdCenterContent(center, defined, locale);
  if (!content) {
    return (
      <Modal open={open} onClose={onClose} title={center}>
        <p className="text-muted-foreground text-sm">No content yet.</p>
      </Modal>
    );
  }
  return (
    <Modal open={open} onClose={onClose} title={content.name}>
      <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
        <p className="text-muted-foreground italic">
          {defined ? 'Defined' : 'Undefined'} — {content.headline}
        </p>
        <p>{renderInlineMd(content.body)}</p>
        {!defined && content.gift ? (
          <div className="space-y-1">
            <p className="text-foreground text-[11px] font-semibold uppercase tracking-[0.16em]">
              Gift
            </p>
            <p>{renderInlineMd(content.gift)}</p>
          </div>
        ) : null}
        {!defined && content.shadow ? (
          <div className="border-border/60 border-l-2 pl-3 text-[13px] italic text-muted-foreground">
            {content.shadow}
          </div>
        ) : null}
        {activeGates.length > 0 ? (
          <div className="border-border/60 border-t pt-3">
            <p className="text-foreground text-[11px] font-semibold uppercase tracking-[0.16em]">
              Gate aktif kamu di pusat ini
            </p>
            <p className="mt-1.5 flex flex-wrap gap-1.5">
              {activeGates.map((g) => (
                <span
                  key={g}
                  className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-full bg-neutral-900 px-2 text-[11px] font-semibold text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  {g}
                </span>
              ))}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
