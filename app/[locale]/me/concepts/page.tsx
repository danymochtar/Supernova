import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { getSession } from '@/lib/auth/requireSession';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { renderInlineMd } from '@/components/qa/inlineMd';
import idConcepts from '@/content/concepts/id.json';
import enConcepts from '@/content/concepts/en.json';

interface ConceptSection {
  id: string;
  title: string;
  tagline: string;
  body: string;
}

interface ConceptsContent {
  intro: string;
  sections: ConceptSection[];
}

export default async function ConceptsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';
  const t = await getTranslations({ locale, namespace: 'concepts' });

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const content = (locale === 'id' ? idConcepts : enConcepts) as ConceptsContent;

  return (
    <main className="container max-w-2xl px-4 sm:px-6">
      <TopBar title={t('title')} backHref={`/${locale}/me`} />
      <div className="space-y-8 pb-10 sm:pb-12">
        <header className="space-y-2 pt-2">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </header>

        <section className="border-primary/40 from-primary/10 ring-primary/20 flex items-start gap-4 overflow-hidden rounded-3xl border-2 bg-gradient-to-br to-accent/15 p-5 ring-1 dark:to-accent/15">
          <div className="bg-primary/15 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <p className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
            {content.intro}
          </p>
        </section>

        {/* Jump-nav strip — sticky-ish anchor list so users can hop to a
         * specific concept without scrolling through the wall. */}
        <nav className="-mx-1 flex flex-wrap gap-1.5 px-1">
          {content.sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="border-border bg-surface-2 hover:bg-muted/50 inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="space-y-10">
          {content.sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              className="space-y-3 scroll-mt-24"
            >
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-semibold tracking-tight">
                  {s.title}
                </h2>
                <p className="text-primary text-[13px] font-medium">{s.tagline}</p>
              </div>
              <div className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {s.body.split(/\n\n+/).map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {renderInlineMd(paragraph)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="text-muted-foreground pt-4 text-center text-xs italic">
          {t('footer')}
        </p>
      </div>
    </main>
  );
}
