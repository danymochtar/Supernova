import { notFound, redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/TopBar';
import { getSession } from '@/lib/auth/requireSession';
import { isAdminEmail } from '@/lib/auth/admin';
import { getUsageBreakdown } from '@/lib/db/repositories/usage';
import { isLocale, type Locale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

const WINDOWS = [7, 30, 90] as const;

export default async function AdminUsagePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { days?: string };
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : 'id';

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  if (!isAdminEmail(session.user.email)) notFound();

  const requested = Number(searchParams.days);
  const days = WINDOWS.includes(requested as (typeof WINDOWS)[number])
    ? (requested as (typeof WINDOWS)[number])
    : 30;

  const breakdown = await getUsageBreakdown(days);

  const fmt = (n: number) => n.toLocaleString('en-US');
  const fmtUsd = (n: number) => `$${n.toFixed(4)}`;

  return (
    <main className="container max-w-4xl px-4 sm:px-6">
      <TopBar title="Admin · Usage" backHref={`/${locale}/me`} />
      <div className="space-y-8 pb-6 sm:pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-muted-foreground text-sm">
            AI usage in the last
          </p>
          {WINDOWS.map((w) => (
            <a
              key={w}
              href={`?days=${w}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                w === days
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              {w}d
            </a>
          ))}
        </div>

        {/* Totals */}
        <section className="border-border space-y-3 rounded-2xl border bg-white/40 p-6 dark:bg-neutral-900/40">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Totals
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Calls" value={fmt(breakdown.totals.count)} />
            <Stat label="Input tok" value={fmt(breakdown.totals.inputTokens)} />
            <Stat label="Output tok" value={fmt(breakdown.totals.outputTokens)} />
            <Stat label="Est. cost" value={fmtUsd(breakdown.totals.costUsd)} />
          </div>
        </section>

        {/* By feature */}
        <Table
          title="By feature"
          headers={['Feature', 'Calls', 'Input', 'Output', 'Cost']}
          rows={breakdown.byFeature.map((f) => [
            f.feature,
            fmt(f.count),
            fmt(f.inputTokens),
            fmt(f.outputTokens),
            fmtUsd(f.costUsd),
          ])}
        />

        {/* By model */}
        <Table
          title="By model"
          headers={['Model', 'Calls', 'Input', 'Output', 'Cost']}
          rows={breakdown.byModel.map((m) => [
            m.model,
            fmt(m.count),
            fmt(m.inputTokens),
            fmt(m.outputTokens),
            fmtUsd(m.costUsd),
          ])}
        />

        {/* By day */}
        <Table
          title="By day"
          headers={['Date', 'Calls', 'Input', 'Output', 'Cost']}
          rows={breakdown.byDay.map((d) => [
            d.date,
            fmt(d.count),
            fmt(d.inputTokens),
            fmt(d.outputTokens),
            fmtUsd(d.costUsd),
          ])}
        />

        {/* Top users */}
        <Table
          title="Top users (by cost)"
          headers={['Email', 'Calls', 'Input', 'Output', 'Cost']}
          rows={breakdown.recentUsers.map((u) => [
            u.email ?? u.userId.slice(0, 8) + '…',
            fmt(u.count),
            fmt(u.inputTokens),
            fmt(u.outputTokens),
            fmtUsd(u.costUsd),
          ])}
        />
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Table({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
      <div className="border-border overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2 ${i === 0 ? 'text-left font-medium' : 'text-right font-medium'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={`px-3 py-2 tabular-nums ${j === 0 ? 'font-medium' : 'text-right'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
