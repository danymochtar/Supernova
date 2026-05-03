import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import type { Locale } from '@/lib/i18n/config';

interface NavLabels {
  greeting: string;
  greetingTimeOfDay: string;
  fullName: string;
  editProfile: string;
  journey: string;
  patterns: string;
  people: string;
  chat: string;
  signOut: string;
}

/**
 * Shared dashboard-like top header. Greeting on the left wraps to the
 * date/edit profile link; nav buttons collapse to a horizontally
 * scrollable row on small screens.
 */
export function AppHeader({
  locale,
  active,
  todayLabel,
  labels,
}: {
  locale: Locale;
  active?: 'dashboard' | 'journey' | 'patterns' | 'people' | 'chat';
  todayLabel?: string;
  labels: NavLabels;
}) {
  const navItems = [
    { key: 'journey' as const, href: `/${locale}/journey`, label: labels.journey },
    { key: 'patterns' as const, href: `/${locale}/patterns`, label: labels.patterns },
    { key: 'people' as const, href: `/${locale}/people`, label: labels.people },
    { key: 'chat' as const, href: `/${locale}/ask`, label: labels.chat },
  ];

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {labels.greetingTimeOfDay}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {labels.greeting}, <span className="font-serif italic">{labels.fullName}</span>
          </h1>
          {todayLabel ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {todayLabel}
              {' · '}
              <Link
                href={`/${locale}/profile/edit`}
                className="underline-offset-4 hover:underline"
              >
                {labels.editProfile}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <LocaleSwitcher active={locale} />
          <SignOutButton label={labels.signOut} locale={locale} />
        </div>
      </div>

      <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 sm:flex-wrap">
          {navItems.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="ml-auto flex items-center gap-3 sm:hidden">
            <LocaleSwitcher active={locale} />
            <SignOutButton label={labels.signOut} locale={locale} />
          </span>
        </div>
      </nav>
    </header>
  );
}
