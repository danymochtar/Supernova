'use client';

import type { Locale } from '@/lib/i18n/config';
import { CHANNELS } from '@/lib/humanDesign/channels';
import { hdChannelContent } from '@/lib/humanDesign/content';
import { Modal } from '@/components/layout/Modal';
import { renderInlineMd } from '@/components/qa/inlineMd';

interface Props {
  open: boolean;
  onClose: () => void;
  channelIndex: number;
  defined: boolean;
  locale: Locale;
}

const CIRCUIT_LABELS: Record<string, string> = {
  INDIVIDUAL_KNOWING: 'Individu — Knowing',
  INDIVIDUAL_CENTERING: 'Individu — Centering',
  TRIBAL_ETHIC: 'Tribal — Ethic',
  TRIBAL_DEFENSE: 'Tribal — Defense',
  COLLECTIVE_LOGIC: 'Collective — Logic',
  COLLECTIVE_SENSING: 'Collective — Sensing',
  INTEGRATION: 'Integration',
};

export function ChannelDetailModal({ open, onClose, channelIndex, defined, locale }: Props) {
  const channel = CHANNELS[channelIndex];
  const content = hdChannelContent(channelIndex, locale);
  if (!channel) return null;
  const title = content?.name ?? channel.name;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3 text-[14px] leading-relaxed text-neutral-700 dark:text-neutral-200">
        <p className="text-muted-foreground text-xs">
          Channel {channel.gates[0]} ↔ {channel.gates[1]} · {CIRCUIT_LABELS[channel.circuit] ?? channel.circuit}
        </p>
        <p className="text-muted-foreground text-xs italic">
          {defined ? 'Terdefinisi di chart kamu' : 'Belum terdefinisi'}
        </p>
        {content?.body ? <p>{renderInlineMd(content.body)}</p> : null}
        <p className="border-border/60 border-t pt-3 text-xs">
          Menyambungkan: <span className="font-semibold">{channel.centers[0]}</span> ↔{' '}
          <span className="font-semibold">{channel.centers[1]}</span>
        </p>
      </div>
    </Modal>
  );
}
