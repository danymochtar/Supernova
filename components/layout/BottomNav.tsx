'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, MessageCircle, Sparkles, User } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';

interface Tab {
  key: 'home' | 'journey' | 'chat' | 'people' | 'me';
  href: (locale: Locale) => string;
  icon: typeof Sparkles;
  /** Path prefixes that count as "active" for this tab. */
  matches: string[];
}

const TABS: Tab[] = [
  { key: 'home', href: (l) => `/${l}/dashboard`, icon: Sparkles, matches: ['/dashboard'] },
  { key: 'journey', href: (l) => `/${l}/journey`, icon: Compass, matches: ['/journey'] },
  { key: 'chat', href: (l) => `/${l}/ask`, icon: MessageCircle, matches: ['/ask'] },
  { key: 'people', href: (l) => `/${l}/people`, icon: Heart, matches: ['/people'] },
  { key: 'me', href: (l) => `/${l}/me`, icon: User, matches: ['/me', '/profile', '/patterns'] },
];

const APP_ROUTES = ['/dashboard', '/journey', '/ask', '/people', '/patterns', '/me', '/profile'];

export function BottomNav({ locale, labels }: { locale: Locale; labels: Record<Tab['key'], string> }) {
  const pathname = usePathname();
  const stripped = pathname.replace(new RegExp(`^/(?:id|en)`), '') || '/';

  // Hide on auth/onboarding/landing pages.
  const isAppRoute = APP_ROUTES.some((r) => stripped === r || stripped.startsWith(r + '/'));
  if (!isAppRoute) return null;

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.matches.some((m) => stripped === m || stripped.startsWith(m + '/'));
          return (
            <li key={tab.key} className="flex">
              <Link
                href={tab.href(locale)}
                aria-current={active ? 'page' : undefined}
                className={`press flex w-full flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${active ? 'fill-primary/15 stroke-[2.25]' : ''}`}
                  aria-hidden
                />
                <span>{labels[tab.key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
