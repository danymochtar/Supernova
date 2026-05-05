/**
 * Card-with-rows wrapper used by the /me page. A small uppercase tracker
 * label sits above a single rounded card; children render inside with
 * subtle dividers between rows. Replaces the old per-row bordered-card
 * stack which made the settings page feel like a checklist.
 */
export function SettingsGroup({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      {title ? (
        <div className="px-1">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            {title}
          </p>
          {hint ? <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p> : null}
        </div>
      ) : null}
      <div className="border-border divide-border/60 overflow-hidden rounded-2xl border bg-white/40 dark:bg-neutral-900/40 divide-y">
        {children}
      </div>
    </section>
  );
}
