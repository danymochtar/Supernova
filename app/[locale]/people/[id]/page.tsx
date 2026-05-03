import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getSession } from '@/lib/auth/requireSession';
import { getPerson } from '@/lib/db/repositories/person';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  activeSlots,
  ageAt,
  buildCoreProfile,
  challengeAt,
  contextFromInstant,
  cycleAt,
  personalCycles,
  pinnacleAt,
} from '@/lib/numerology';
import { NumberCard } from '@/components/numerology/NumberCard';
import { CompoundReduced } from '@/components/numerology/CompoundReduced';
import { KarmicLessonsList } from '@/components/numerology/KarmicLessonsList';
import { TopBar } from '@/components/layout/TopBar';
import { meaningFor } from '@/lib/numerology/meanings';
import { deletePersonAction } from '../actions';

export default async function PersonDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'personDetail' });
  const tDash = await getTranslations({ locale, namespace: 'dashboard' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const userProfile = await getProfileByUserId(session.user.id);
  if (!userProfile) redirect(`/${locale}/welcome`);

  const person = await getPerson(session.user.id, params.id);
  if (!person) notFound();

  const core = buildCoreProfile(person.fullName, person.dob);
  const ctx = contextFromInstant(new Date(), userProfile.timezone);
  const cycles = personalCycles(person.dob, ctx);
  const age = ageAt(person.dob, ctx);
  const slots = activeSlots(person.dob, age);


  const initials = `${person.firstName.charAt(0)}${person.lastName.charAt(0)}`.toUpperCase();

  return (
    <main className="container max-w-3xl px-4 sm:px-6">
      <TopBar title={person.fullName} backHref={`/${locale}/people`} />
      <div className="space-y-8 pb-6 sm:pb-10">
        <section className="border-border flex flex-col items-center gap-3 rounded-2xl border bg-white/40 p-6 text-center dark:bg-neutral-900/40">
          <div
            className="from-primary/30 to-accent/30 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br font-serif text-3xl font-semibold tracking-tight"
            aria-hidden
          >
            {initials}
          </div>
          <div className="space-y-0.5">
            <p className="text-lg font-semibold">{person.fullName}</p>
            <p className="text-muted-foreground text-sm">
              {t(`relationship.${person.relationship}`)} · {t('age', { age })}
              {' · '}
              <span className="tabular-nums">
                {person.dob.year}-{String(person.dob.month).padStart(2, '0')}-
                {String(person.dob.day).padStart(2, '0')}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Link
              href={`/${locale}/people/${person.id}/compatibility`}
              className="bg-primary text-primary-foreground press rounded-full px-4 py-2 text-sm font-medium"
            >
              {t('compatibilityCta')}
            </Link>
            <Link
              href={`/${locale}/people/${person.id}/edit`}
              className="border-border press rounded-full border px-4 py-2 text-sm font-medium"
            >
              {t('edit')}
            </Link>
          </div>
          <form action={deletePersonAction} className="pt-1">
            <input type="hidden" name="id" value={person.id} />
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="text-muted-foreground hover:text-red-700 text-xs underline-offset-4 hover:underline"
            >
              {t('delete')}
            </button>
          </form>
        </section>

      {person.notes ? (
        <section className="border-border rounded-xl border bg-amber-50/50 p-4 text-sm dark:bg-amber-950/20">
          <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
            {t('notes')}
          </p>
          <p className="whitespace-pre-wrap">{person.notes}</p>
        </section>
      ) : null}

      {/* Today */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tDash('todayTitle')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberCard
            label={tDash('personalDay')}
            result={cycles.personalDay}
            locale={locale}
            type="personalDay"
            meaning={meaningFor('personalDay', cycles.personalDay, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={tDash('personalMonth')}
            result={cycles.personalMonth}
            locale={locale}
            type="personalMonth"
            meaning={meaningFor('personalMonth', cycles.personalMonth, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={tDash('personalYear')}
            result={cycles.personalYear}
            locale={locale}
            type="personalYear"
            meaning={meaningFor('personalYear', cycles.personalYear, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
        </div>
      </section>

      {/* Core */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tDash('coreTitle')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NumberCard
            label={tDash('lifePath')}
            hint={tDash('lifePathHint')}
            result={core.lifePath}
            locale={locale}
            type="lifePath"
            meaning={meaningFor('lifePath', core.lifePath, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={tDash('expression')}
            hint={tDash('expressionHint')}
            result={core.expression}
            locale={locale}
            type="expression"
            meaning={meaningFor('expression', core.expression, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={tDash('soulUrge')}
            hint={tDash('soulUrgeHint')}
            result={core.soulUrge}
            locale={locale}
            type="soulUrge"
            meaning={meaningFor('soulUrge', core.soulUrge, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={tDash('personality')}
            hint={tDash('personalityHint')}
            result={core.personality}
            locale={locale}
            type="personality"
            meaning={meaningFor('personality', core.personality, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={tDash('birthday')}
            hint={tDash('birthdayHint')}
            result={core.birthday}
            locale={locale}
            type="birthday"
            meaning={meaningFor('birthday', core.birthday, locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
        </div>
      </section>

      {/* Active chapter */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{tDash('currentChapterTitle')}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <NumberCard
            label={`${tDash('pinnacle')} ${slots.pinnacle}`}
            result={pinnacleAt(core.pinnacles, slots.pinnacle)}
            locale={locale}
            type="pinnacle"
            meaning={meaningFor('pinnacle', pinnacleAt(core.pinnacles, slots.pinnacle), locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={`${tDash('challenge')} ${slots.challenge}`}
            result={challengeAt(core.challenges, slots.challenge)}
            locale={locale}
            type="challenge"
            meaning={meaningFor('challenge', challengeAt(core.challenges, slots.challenge), locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
          <NumberCard
            label={`${tDash('cycle')} ${slots.cycle}`}
            result={cycleAt(core.periodCycles, slots.cycle)}
            locale={locale}
            type="cycle"
            meaning={meaningFor('cycle', cycleAt(core.periodCycles, slots.cycle), locale)}
            comingSoonLabel={tDash('meaningComingSoon')}
          />
        </div>
      </section>

      {/* Karmic */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{tDash('karmicLessonsTitle')}</h2>
        <p className="text-muted-foreground text-sm">{tDash('karmicLessonsHint')}</p>
        <KarmicLessonsList
          lessons={core.karmicLessons.map((n) => ({
            number: n,
            meaning: meaningFor('karmicLesson', { compound: n, reduced: n, isMaster: false }, locale),
          }))}
          emptyLabel={tDash('karmicLessonsNone')}
          comingSoonLabel={tDash('meaningComingSoon')}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t('quickGlance')}</h2>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span>
            <strong className="text-foreground">{tDash('lifePath')}:</strong>{' '}
            <CompoundReduced result={core.lifePath} locale={locale} size="sm" />
          </span>
          <span>
            <strong className="text-foreground">{tDash('expression')}:</strong>{' '}
            <CompoundReduced result={core.expression} locale={locale} size="sm" />
          </span>
          <span>
            <strong className="text-foreground">{tDash('soulUrge')}:</strong>{' '}
            <CompoundReduced result={core.soulUrge} locale={locale} size="sm" />
          </span>
        </div>
      </section>
      </div>
    </main>
  );
}
