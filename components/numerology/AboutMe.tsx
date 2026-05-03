import type { Locale } from '@/lib/i18n/config';
import { meaningFor } from '@/lib/numerology/meanings';
import { formatNumerology, type NumerologyResult } from '@/lib/numerology';

interface Props {
  locale: Locale;
  fullName: string;
  core: {
    lifePath: NumerologyResult;
    expression: NumerologyResult;
    soulUrge: NumerologyResult;
    personality: NumerologyResult;
    birthday: NumerologyResult;
  };
  karmicLessons: number[];
  /** Translations object for labels. */
  t: {
    title: string;
    subtitle: string;
    lifePath: string;
    expression: string;
    soulUrge: string;
    personality: string;
    birthday: string;
    karmicLessons: string;
    karmicLessonsBody: (lessons: string) => string;
    karmicLessonsNone: string;
    nothingYet: string;
  };
}

export function AboutMe({ locale, fullName, core, karmicLessons, t }: Props) {
  const rows: Array<{ label: string; result: NumerologyResult; meaning: string | null; type: string }> = [
    { label: t.lifePath, result: core.lifePath, meaning: meaningFor('lifePath', core.lifePath, locale), type: 'lifePath' },
    { label: t.expression, result: core.expression, meaning: meaningFor('expression', core.expression, locale), type: 'expression' },
    { label: t.soulUrge, result: core.soulUrge, meaning: meaningFor('soulUrge', core.soulUrge, locale), type: 'soulUrge' },
    { label: t.personality, result: core.personality, meaning: meaningFor('personality', core.personality, locale), type: 'personality' },
    { label: t.birthday, result: core.birthday, meaning: meaningFor('birthday', core.birthday, locale), type: 'birthday' },
  ];

  return (
    <section className="border-border space-y-5 rounded-2xl border bg-white/30 p-6 dark:bg-neutral-900/30">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <p className="text-muted-foreground text-sm">{t.subtitle.replace('{name}', fullName)}</p>
      </header>

      <dl className="space-y-5">
        {rows.map((row) => (
          <div key={row.type} className="space-y-1.5">
            <dt className="flex items-baseline gap-2">
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                {row.label}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatNumerology(row.result)}
              </span>
              {row.result.isMaster ? (
                <span className="text-[10px] font-medium uppercase tracking-wider text-purple-700">
                  master
                </span>
              ) : null}
            </dt>
            <dd className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
              {row.meaning ?? <span className="text-muted-foreground italic">{t.nothingYet}</span>}
            </dd>
          </div>
        ))}

        <div className="space-y-1.5">
          <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t.karmicLessons}
          </dt>
          <dd className="text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
            {karmicLessons.length > 0
              ? t.karmicLessonsBody(karmicLessons.join(', '))
              : t.karmicLessonsNone}
          </dd>
        </div>
      </dl>
    </section>
  );
}
