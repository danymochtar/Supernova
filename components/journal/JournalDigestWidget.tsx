import { useTranslations } from 'next-intl';
import { BarChart3, Sparkles } from 'lucide-react';

export interface JournalDigestLite {
  totalEntries: number;
  topThemes: { name: string; count: number }[];
  topEmotions: { name: string; count: number }[];
  actionsDone: number;
  actionsOpen: number;
}

interface Props {
  digest: JournalDigestLite;
  days: number;
}

/**
 * Compact "this week in your journal" digest. Deterministic — no AI.
 * Renders three quick stats: top theme, top emotion, action completion.
 * Designed to be glanceable: user reads it once, no taps needed.
 *
 * Server-rendered (no client state, no animations) — keeps the dashboard
 * paint cheap even on cold cache.
 */
export function JournalDigestWidget({ digest, days }: Props) {
  const t = useTranslations('digest');

  const topTheme = digest.topThemes[0];
  const topEmotion = digest.topEmotions[0];
  const completionPct =
    digest.actionsDone + digest.actionsOpen > 0
      ? Math.round((digest.actionsDone / (digest.actionsDone + digest.actionsOpen)) * 100)
      : null;

  return (
    <section className="border-border space-y-3 rounded-2xl border bg-surface-1 p-5">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full">
          <BarChart3 className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">{t('title', { days })}</h2>
          <p className="text-muted-foreground text-xs">
            {t('subtitle', { count: digest.totalEntries })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {topTheme ? (
          <Stat
            label={t('topTheme')}
            value={topTheme.name}
            sub={t('xTimes', { count: topTheme.count })}
          />
        ) : null}
        {topEmotion ? (
          <Stat
            label={t('topEmotion')}
            value={topEmotion.name}
            sub={t('xTimes', { count: topEmotion.count })}
          />
        ) : null}
        {completionPct !== null ? (
          <Stat
            label={t('actionsLabel')}
            value={`${completionPct}%`}
            sub={t('actionsSub', {
              done: digest.actionsDone,
              total: digest.actionsDone + digest.actionsOpen,
            })}
          />
        ) : null}
      </div>

      {/* If the user has multiple themes / emotions worth surfacing, show a
        * 1-line "also: …" so they sense the broader spread without a heavy
        * breakdown UI. Caps at 2 extras to keep the widget compact. */}
      {digest.topThemes.length > 1 ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <Sparkles className="text-accent h-3 w-3 shrink-0" aria-hidden />
          <span>
            {t('alsoThemes')}{' '}
            {digest.topThemes
              .slice(1, 3)
              .map((th) => `${th.name} (${th.count})`)
              .join(', ')}
          </span>
        </p>
      ) : null}
    </section>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="border-border/60 bg-surface-2 space-y-0.5 rounded-xl border px-3 py-2">
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
        {label}
      </p>
      <p className="truncate text-sm font-semibold capitalize">{value}</p>
      <p className="text-muted-foreground truncate text-[11px]">{sub}</p>
    </div>
  );
}
