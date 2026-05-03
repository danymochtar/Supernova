import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, BarChart3, Pencil, LogOut, Globe, ShieldCheck, NotebookPen } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isAdminEmail } from '@/lib/auth/admin';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { PersonalNotesForm } from '@/components/auth/PersonalNotesForm';
import { savePersonalNotes } from './actions';

export default async function MePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'me' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const dobStr = `${profile.dob.year}-${String(profile.dob.month).padStart(2, '0')}-${String(profile.dob.day).padStart(2, '0')}`;
  const isAdmin = isAdminEmail(session.user.email);

  return (
    <main className="container max-w-xl space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-1 pt-2">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      {/* Profile summary */}
      <section className="border-border rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {t('profile')}
        </p>
        <p className="mt-1 text-lg font-semibold">{profile.fullName}</p>
        <p className="text-muted-foreground mt-0.5 text-sm tabular-nums">
          {dobStr} · {profile.timezone}
        </p>
        <Link
          href={`/${locale}/profile/edit`}
          className="bg-primary text-primary-foreground mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          {t('editProfile')}
        </Link>
      </section>

      {/* Personal notes — long-term context the chat assistant remembers */}
      <section className="border-border space-y-3 rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
        <div className="flex items-start gap-3">
          <NotebookPen className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t('notesTitle')}</p>
            <p className="text-muted-foreground text-xs">{t('notesHint')}</p>
          </div>
        </div>
        <PersonalNotesForm locale={locale} initial={profile.personalNotes} action={savePersonalNotes} />
      </section>

      {/* Settings list */}
      <section className="border-border overflow-hidden rounded-2xl border bg-white/40 dark:bg-neutral-900/40">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Globe className="text-muted-foreground h-5 w-5" aria-hidden />
            <div>
              <p className="text-sm font-medium">{t('language')}</p>
              <p className="text-muted-foreground text-xs">{t('languageHint')}</p>
            </div>
          </div>
          <LocaleSwitcher active={locale} />
        </div>

        <Link
          href={`/${locale}/patterns`}
          className="hover:bg-muted/30 flex items-center justify-between gap-3 px-5 py-4 transition"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="text-muted-foreground h-5 w-5" aria-hidden />
            <div>
              <p className="text-sm font-medium">{t('patterns')}</p>
              <p className="text-muted-foreground text-xs">{t('patternsHint')}</p>
            </div>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden />
        </Link>

        {isAdmin ? (
          <Link
            href={`/${locale}/admin/usage`}
            className="hover:bg-muted/30 flex items-center justify-between gap-3 border-t border-border px-5 py-4 transition"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-muted-foreground h-5 w-5" aria-hidden />
              <div>
                <p className="text-sm font-medium">Admin · Usage</p>
                <p className="text-muted-foreground text-xs">AI cost & token breakdown</p>
              </div>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </section>

      {/* Sign out */}
      <section className="border-border rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <LogOut className="text-muted-foreground h-5 w-5" aria-hidden />
            <div>
              <p className="text-sm font-medium">{t('signOut')}</p>
              <p className="text-muted-foreground text-xs">{session.user.email}</p>
            </div>
          </div>
          <SignOutButton label={t('signOutCta')} locale={locale} />
        </div>
      </section>

      <p className="text-muted-foreground py-4 text-center text-xs">{t('appVersion')}</p>
    </main>
  );
}
