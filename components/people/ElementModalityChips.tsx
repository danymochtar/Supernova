'use client';

import { useState } from 'react';
import { Modal } from '@/components/layout/Modal';
import type { ClassificationMeaning } from '@/lib/zodiac/content';

interface Props {
  /** Pre-resolved title + body for the element chip. */
  element: ClassificationMeaning;
  /** Pre-resolved title + body for the modality chip. */
  modality: ClassificationMeaning;
  /** Shared chip className from the hero's element-token palette. */
  chipClass: string;
}

/**
 * Two chips on the Person hero — element (Fire / Earth / Air / Water)
 * and modality (Cardinal / Fixed / Mutable). Tap either one to open a
 * modal with its meaning. Content is resolved on the server-side caller
 * and passed in as pre-resolved title+body so this client component is
 * just the interaction layer.
 */
export function ElementModalityChips({ element, modality, chipClass }: Props) {
  const [active, setActive] = useState<ClassificationMeaning | null>(null);
  return (
    <>
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setActive(element)}
          className={`press-soft rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-opacity hover:opacity-80 ${chipClass}`}
        >
          {element.title}
        </button>
        <button
          type="button"
          onClick={() => setActive(modality)}
          className={`press-soft rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-opacity hover:opacity-80 ${chipClass}`}
        >
          {modality.title}
        </button>
      </div>
      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={
          active ? (
            <h3 className="font-serif text-xl font-semibold tracking-tight">
              {active.title}
            </h3>
          ) : (
            ''
          )
        }
      >
        {active ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {active.body}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
