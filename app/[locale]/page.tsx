import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  ArrowRight,
  Briefcase,
  Compass,
  Heart,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';
import { Starfield } from '@/components/layout/Starfield';

// Supernova as a persona — six life aspects she helps with. Order is
// intentional: life (broad) → journey (time) → career (output) →
// personal (inward) → relationships (outward) → reflection (loop).
const ASPECTS = [
  { key: 'life', icon: Sun },
  { key: 'journey', icon: Compass },
  { key: 'career', icon: Briefcase },
  { key: 'personal', icon: User },
  { key: 'relationships', icon: Heart },
  { key: 'reflection', icon: Sparkles },
] as const;

export default function HomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = useTranslations('home');

  return (
    <main className="relative">
      {/* Hero — full-bleed starfield, brand mark, big tagline, primary CTA. */}
      <section
        className="relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-6 pb-12 sm:min-h-[82vh]"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4rem)' }}
      >
        <Starfield className="text-foreground/30" />
        <div className="relative flex flex-col items-center gap-7 text-center">
          <Image
            src="/icons/icon.svg"
            alt="Supernova"
            width={88}
            height={88}
            className="rounded-3xl shadow-xl shadow-primary/30"
            priority
          />
          <div className="space-y-3">
            <p className="text-primary text-[11px] font-semibold uppercase tracking-[0.22em]">
              {t('eyebrow')}
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mx-auto max-w-md text-base leading-relaxed">
              {t('subtitle')}
            </p>
          </div>
          <Link
            href={`/${locale}/login`}
            className="bg-primary text-primary-foreground press inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-medium shadow-lg shadow-primary/30"
          >
            {t('cta')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="text-muted-foreground text-xs">{t('ctaSub')}</p>
        </div>
      </section>

      {/* What you get — feature grid. */}
      <section className="container max-w-4xl px-6 py-16">
        <div className="mb-10 space-y-2 text-center">
          <p className="text-primary text-[11px] font-semibold uppercase tracking-[0.22em]">
            {t('featuresEyebrow')}
          </p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight">
            {t('featuresTitle')}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            {t('featuresSubtitle')}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {ASPECTS.map(({ key, icon: Icon }) => (
            <article
              key={key}
              className="border-border rounded-2xl border bg-surface-1 p-5"
            >
              <div className="bg-primary/10 text-primary mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mb-1 text-base font-semibold">
                {t(`aspect_${key}_title`)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(`aspect_${key}_body`)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* How it works — three numbered steps. */}
      <section className="container max-w-2xl px-6 py-12">
        <div className="mb-8 space-y-2 text-center">
          <p className="text-primary text-[11px] font-semibold uppercase tracking-[0.22em]">
            {t('howEyebrow')}
          </p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight">
            {t('howTitle')}
          </h2>
        </div>
        <ol className="space-y-3">
          {[1, 2, 3].map((n) => (
            <li
              key={n}
              className="border-border flex gap-4 rounded-2xl border bg-surface-1 p-5"
            >
              <div className="bg-primary/10 text-primary font-serif flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-semibold">
                {n}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">{t(`step_${n}_title`)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(`step_${n}_body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust / quality note — short, calming. */}
      <section className="container max-w-2xl px-6 py-8">
        <div className="border-border rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5 text-center dark:from-primary/15 dark:to-accent/15">
          <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
            {t('trustNote')}
          </p>
        </div>
      </section>

      {/* Bottom CTA — quiet repeat for users who scrolled. */}
      <section className="container max-w-2xl px-6 py-16 text-center">
        <h2 className="font-serif mb-2 text-2xl font-semibold tracking-tight">
          {t('bottomCtaTitle')}
        </h2>
        <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm leading-relaxed">
          {t('bottomCtaBody')}
        </p>
        <Link
          href={`/${locale}/login`}
          className="bg-primary text-primary-foreground press inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium shadow-lg shadow-primary/20"
        >
          {t('cta')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <footer
        className="text-muted-foreground px-6 pb-10 text-center text-xs"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2.5rem)' }}
      >
        {t('footer')}
      </footer>
    </main>
  );
}
