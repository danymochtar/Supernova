'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, Languages } from 'lucide-react';
import { LOCALES, LOCALE_CODES, type LocaleCode } from '@/lib/i18n/locales';

/**
 * Floating language switcher used on the public homepage. Shows the current
 * locale's flag + native name; tapping opens a menu listing every supported
 * locale. Selecting one navigates to the same path with the locale prefix
 * swapped — non-logged-in visitors can try the marketing page in their own
 * language without needing an account.
 */
export function LocaleSwitcher({ currentLocale }: { currentLocale: LocaleCode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? `/${currentLocale}`;
  // Strip the leading `/{locale}` segment so we can stitch on a new one.
  const rest = pathname.replace(/^\/[^/]+/, '') || '/';
  const current = LOCALES[currentLocale]!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-30"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="relative z-40">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="border-border bg-surface-1/80 press-soft inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur"
        >
          <Languages className="text-muted-foreground h-3.5 w-3.5" aria-hidden />
          <span aria-hidden>{current.flag}</span>
          <span className="hidden sm:inline">{current.nativeName}</span>
          <span className="sm:hidden">{currentLocale.toUpperCase()}</span>
        </button>
        {open ? (
          <ul
            role="listbox"
            className="border-border bg-surface-1 absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border py-1 shadow-2xl"
          >
            {LOCALE_CODES.map((code) => {
              const c = LOCALES[code]!;
              const active = code === currentLocale;
              return (
                <li key={code} role="option" aria-selected={active}>
                  <Link
                    href={`/${code}${rest}`}
                    onClick={() => setOpen(false)}
                    className="hover:bg-muted/60 flex items-center gap-3 px-3 py-2 text-sm"
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {c.flag}
                    </span>
                    <span className="flex-1 truncate">{c.nativeName}</span>
                    {active ? (
                      <Check className="text-primary h-4 w-4 shrink-0" aria-hidden />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </>
  );
}
