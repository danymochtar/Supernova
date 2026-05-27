'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

/**
 * A small "?" icon that opens its explanatory copy in a Modal, replacing
 * the old full-width inline disclosure. Keeps pages clean: the concept is
 * one tap away in the corner instead of a bar that fills the layout.
 */
export function InfoPopover({
  title,
  body,
  className,
  label,
}: {
  title: string;
  body: string;
  /** Extra positioning classes from the parent (e.g. absolute top-right). */
  className?: string;
  /** Accessible label for the trigger; defaults to the title. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label ?? title}
        className={`press-soft text-muted-foreground hover:text-foreground hover:bg-muted/60 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${className ?? ''}`}
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={<h3 className="text-base font-semibold">{title}</h3>}
      >
        <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
          {body}
        </p>
      </Modal>
    </>
  );
}
