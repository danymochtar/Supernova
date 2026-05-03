import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { buildCoreProfile, type NumerologyResult } from '@/lib/numerology';
import { compatibilityNarrative } from '@/lib/compatibility/lookup';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';

interface Pairing {
  labelKey: 'lifePath' | 'expression' | 'soulUrge' | 'birthday';
  a: NumerologyResult;
  b: NumerologyResult;
}

export default async function CompatibilityPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'compatibility' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) redirect(`/${locale}/welcome`);

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const me = buildCoreProfile(userProfile.fullName, userProfile.dob);
  const them = buildCoreProfile(person.fullName, person.dob);

  const pairings: Pairing[] = [
    { labelKey: 'lifePath', a: me.lifePath, b: them.lifePath },
    { labelKey: 'expression', a: me.expression, b: them.expression },
    { labelKey: 'soulUrge', a: me.soulUrge, b: them.soulUrge },
    { labelKey: 'birthday', a: me.birthday, b: them.birthday },
  ];

  return (
    <main className="container max-w-3xl space-y-10 py-10">
      <header className="space-y-2">
        <Link
          href={`/${locale}/people/${person.id}`}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
        >
          ← {t('back')}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('title', { name: person.fullName })}
        </h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <section className="border-border rounded-2xl border bg-gradient-to-br from-purple-50 to-amber-50 p-6 dark:from-purple-950/30 dark:to-amber-950/30">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {t('you')}
            </p>
            <p className="mt-1 font-medium">{userProfile.fullName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
              {t('them')}
            </p>
            <p className="mt-1 font-medium">{person.fullName}</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {pairings.map((p) => {
          const narrative = compatibilityNarrative(p.a, p.b, locale);
          return (
            <article
              key={p.labelKey}
              className="border-border space-y-3 rounded-xl border p-5"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold">{tDash(p.labelKey)}</h2>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CompoundReduced result={p.a} locale={locale} size="sm" />
                  <span className="text-xs">×</span>
                  <CompoundReduced result={p.b} locale={locale} size="sm" />
                </div>
              </header>
              {narrative ? (
                <p className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
                  {narrative}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm italic">{t('noNarrative')}</p>
              )}
            </article>
          );
        })}
      </section>

      <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
    </main>
  );
}
