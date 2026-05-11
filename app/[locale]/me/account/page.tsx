import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { TopBar } from '@/components/layout/TopBar';
import { ChangeEmailForm, ChangePasswordForm } from '@/components/auth/AccountForms';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'account' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const common = {
    save: t('save'),
    saving: t('saving'),
    saved: t('saved'),
    errors: {
      invalid: t('errorInvalid'),
      wrong_password: t('errorWrongPassword'),
      email_taken: t('errorEmailTaken'),
      same_email: t('errorSameEmail'),
      weak_password: t('errorWeakPassword'),
      generic: t('errorGeneric'),
    },
  };

  return (
    <main className="container max-w-xl px-4 sm:px-6">
      <TopBar title={t('title')} backHref={`/${locale}/me`} />
      <div className="space-y-6 pb-6">
        <header className="space-y-2">
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </header>

        <section className="border-border rounded-2xl border bg-surface-1 p-5">
          <ChangeEmailForm
            currentEmail={session.user.email}
            labels={{
              title: t('emailTitle'),
              hint: t('emailHint', { current: session.user.email }),
              field: t('emailField'),
              placeholder: t('emailPlaceholder'),
            }}
            common={common}
          />
        </section>

        <section className="border-border rounded-2xl border bg-surface-1 p-5">
          <ChangePasswordForm
            labels={{
              title: t('passwordTitle'),
              hint: t('passwordHint'),
              currentField: t('currentPasswordField'),
              newField: t('newPasswordField'),
              confirmField: t('confirmPasswordField'),
              mismatchError: t('passwordMismatch'),
            }}
            common={common}
          />
        </section>
      </div>
    </main>
  );
}
