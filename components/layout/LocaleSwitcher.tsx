'use client';

import { useTransition } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { setLocale } from '@/app/[locale]/profile/locale-actions';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'id', label: 'ID' },
  { code: 'en', label: 'EN' },
];

export function LocaleSwitcher({ active }: { active: Locale }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      role="group"
      aria-label="Language"
      className="border-border inline-flex items-center overflow-hidden rounded-full border text-xs"
    >
      {LOCALES.map((l) => {
        const isActive = l.code === active;
        return (
          <button
            key={l.code}
            type="button"
            disabled={pending || isActive}
            onClick={() =>
              startTransition(() => {
                setLocale(l.code);
              })
            }
            className={`px-3 py-1.5 font-medium transition ${
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/40'
            }`}
            aria-pressed={isActive}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
