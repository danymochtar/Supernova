import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { buildCoreProfile } from '@/lib/numerology';
import { getOrGenerateRelationshipProfile } from '@/lib/ai/relationship';
import { TopBar } from '@/components/layout/TopBar';

export default async function RelationshipProfilePage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'relationshipProfile' });
  const tRel = await getTranslations({ locale, namespace: 'people.relationship' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) redirect(`/${locale}/welcome`);

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const me = buildCoreProfile(userProfile.fullName, userProfile.dob);
  const them = buildCoreProfile(person.fullName, person.dob);

  const text = await getOrGenerateRelationshipProfile(
    session.user.id,
    person.id,
    userProfile.preferredModel,
    {
      locale,
      relationship: person.relationship,
      meName: userProfile.fullName,
      themName: person.fullName,
      me,
      them,
    },
  );

  const paragraphs = (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="container max-w-2xl px-4 sm:px-6">
      <TopBar
        title={t('title', { name: person.fullName })}
        backHref={`/${locale}/people/${person.id}`}
      />
      <div className="space-y-6 pb-6 sm:pb-10">
        <section className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 dark:from-primary/15 dark:to-accent/15">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('lensTitle')}
          </p>
          <p className="mt-1 text-sm font-semibold">{tRel(person.relationship)}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
        </section>

        {text ? (
          <article className="space-y-4 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
        ) : (
          <section className="border-border flex flex-col items-center gap-3 rounded-2xl border bg-white/40 p-6 text-center dark:bg-neutral-900/40">
            <Sparkles className="text-primary h-6 w-6" aria-hidden />
            <p className="text-muted-foreground text-sm">{t('fallback')}</p>
          </section>
        )}

        <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
      </div>
    </main>
  );
}
