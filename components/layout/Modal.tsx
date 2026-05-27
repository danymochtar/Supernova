'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Lightweight modal: a bottom sheet on mobile, a centered card on larger
 * screens. Closes on backdrop click or Escape, locks body scroll while
 * open, and portals to <body> so it escapes any clipped/scrolled ancestor.
 *
 * Deliberately dependency-free (no focus-trap library) — fine for the
 * short, informational dialogs we use it for. Renders nothing when closed.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  closeLabel = 'Close',
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  closeLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-in fade-in absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="border-border bg-surface-1 animate-in slide-in-from-bottom-4 sm:zoom-in-95 relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border p-5 shadow-xl sm:max-w-lg sm:rounded-3xl">
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="press-soft text-muted-foreground hover:bg-muted/60 -mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
