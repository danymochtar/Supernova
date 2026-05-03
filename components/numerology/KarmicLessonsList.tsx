'use client';

import { useState } from 'react';

interface Props {
  lessons: { number: number; meaning: string | null }[];
  emptyLabel: string;
  comingSoonLabel: string;
}

/**
 * Interactive karmic-lesson chips. Tapping a number opens a panel below
 * with the curated explanation of why that energy is absent and how to
 * develop it.
 */
export function KarmicLessonsList({ lessons, emptyLabel, comingSoonLabel }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (lessons.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyLabel}</p>;
  }

  const open = openIdx !== null ? lessons[openIdx] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {lessons.map((l, i) => {
          const isOpen = openIdx === i;
          return (
            <button
              key={l.number}
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={`rounded-full border px-3 py-1 font-mono text-sm tabular-nums transition ${
                isOpen
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              {l.number}
            </button>
          );
        })}
      </div>
      {open ? (
        <div className="border-border rounded-xl border bg-amber-50/50 p-4 text-sm leading-relaxed text-neutral-800 dark:bg-amber-950/20 dark:text-neutral-200">
          {open.meaning ?? <span className="text-muted-foreground italic">{comingSoonLabel}</span>}
        </div>
      ) : null}
    </div>
  );
}
