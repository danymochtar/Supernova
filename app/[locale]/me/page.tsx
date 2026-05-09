import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  BarChart3,
  ChevronRight,
  LogOut,
  NotebookPen,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isAdminEmail } from '@/lib/auth/admin';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { ageAt, contextFromInstant } from '@/lib/numerology';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { PersonalNotesForm } from '@/components/auth/PersonalNotesForm';
import { SettingsGroup } from '@/components/auth/SettingsGroup';
import { TopBar } from '@/components/layout/TopBar';
import {
  DeleteRow,
  ExportRow,
  KarmicRow,
  ModelRow,
  ReminderRow,
  ThemeRow,
  ToneRow,
} from '@/components/auth/PreferencesPanel';
import { savePersonalNotes } from './actions';

function initialsFor(firstName: string, lastName: string | null, nickname: string | null): string {
  const first = firstName.trim()[0] ?? '';
  if (lastName?.trim()) return (first + lastName.trim()[0]).toUpperCase();
  if (nickname?.trim()) return (first + nickname.trim()[0]).toUpperCase();
  if (firstName.trim().length >= 2) return (first + firstName.trim()[1]).toUpperCase();
  return first.toUpperCase();
}

function NavRow({
  href,
  icon: Icon,
  title,
  hint,
}: {
  href: string;
  icon: typeof BarChart3;
  title: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      className="hover:bg-muted/30 flex items-center gap-3 px-5 py-4 transition"
    >
      <Icon className="text-muted-foreground h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </div>
      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
    </Link>
  );
}

export default async function MePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'me' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) redirect(`/${locale}/welcome`);

  const ctx = contextFromInstant(new Date(), profile.timezone);
  const age = ageAt(profile.dob, ctx);
  const initials = initialsFor(profile.firstName, profile.lastName, profile.nickname);
  const isAdmin = isAdminEmail(session.user.email);

  return (
    <main className="container max-w-xl px-4 sm:px-6">
      <TopBar title={t('topBarTitle')} backHref={`/${locale}/dashboard`} />
      <div className="space-y-6 pb-6">
      {/* Hero identity card — replaces the plain "Saya" title */}
      <section className="border-border from-primary/10 via-background to-accent/10 dark:from-primary/20 dark:to-accent/20 relative overflow-hidden rounded-3xl border bg-gradient-to-br p-6">
        <div className="flex items-start gap-4">
          <div className="from-primary/40 to-accent/40 text-foreground flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-serif text-2xl font-semibold tracking-tight">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight">
              {profile.fullName}
            </h1>
            {profile.nickname ? (
              <p className="text-muted-foreground font-serif text-sm italic">
                &ldquo;{profile.nickname}&rdquo;
              </p>
            ) : null}
            <p className="text-muted-foreground text-sm tabular-nums">
              {t('ageYears', { age })} · {profile.timezone}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/${locale}/profile/edit`}
            className="bg-primary text-primary-foreground press inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t('editProfile')}
          </Link>
        </div>
      </section>

      {/* Personal notes — long-term context the chat assistant remembers */}
      <SettingsGroup title={t('groupContext')}>
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-start gap-3">
            <NotebookPen className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-sm font-medium">{t('notesTitle')}</p>
              <p className="text-muted-foreground text-xs">{t('notesHint')}</p>
            </div>
          </div>
          <PersonalNotesForm
            locale={locale}
            initial={profile.personalNotes}
            action={savePersonalNotes}
          />
        </div>
      </SettingsGroup>

      {/* Appearance */}
      <SettingsGroup title={t('groupAppearance')}>
        <ThemeRow initial={profile.theme} />
      </SettingsGroup>

      {/* AI */}
      <SettingsGroup title={t('groupAi')}>
        <ToneRow initial={profile.tone} />
        <ModelRow initial={profile.preferredModel} />
        <KarmicRow initial={profile.showKarmicDebt} />
      </SettingsGroup>

      {/* Reminder */}
      <SettingsGroup title={t('groupReminder')}>
        <ReminderRow
          initial={{ enabled: profile.reminderEnabled, time: profile.reminderTime }}
        />
      </SettingsGroup>

      {/* Navigation */}
      <SettingsGroup title={t('groupNavigation')}>
        <NavRow
          href={`/${locale}/patterns`}
          icon={BarChart3}
          title={t('patterns')}
          hint={t('patternsHint')}
        />
        {isAdmin ? (
          <NavRow
            href={`/${locale}/admin/usage`}
            icon={ShieldCheck}
            title="Admin · Usage"
            hint="AI cost & token breakdown"
          />
        ) : null}
      </SettingsGroup>

      {/* Data */}
      <SettingsGroup title={t('groupData')}>
        <ExportRow />
        <DeleteRow locale={locale} />
      </SettingsGroup>

      {/* Account */}
      <SettingsGroup title={t('groupAccount')}>
        <div className="flex items-center gap-3 px-5 py-4">
          <LogOut className="text-muted-foreground h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t('signOut')}</p>
            <p className="text-muted-foreground truncate text-xs">{session.user.email}</p>
          </div>
          <SignOutButton label={t('signOutCta')} locale={locale} />
        </div>
      </SettingsGroup>

      <p className="text-muted-foreground py-4 text-center text-xs">{t('appVersion')}</p>
      </div>
    </main>
  );
}
