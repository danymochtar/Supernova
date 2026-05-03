interface Props {
  title: string;
  subtitle: string;
  text: string | null;
  fallback: string;
}

export function AboutMe({ title, subtitle, text, fallback }: Props) {
  return (
    <section className="border-border space-y-3 rounded-2xl border bg-white/30 p-6 dark:bg-neutral-900/30">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </header>
      {text ? (
        <div className="space-y-3 text-sm leading-relaxed text-neutral-800 dark:text-neutral-200">
          {text
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm italic">{fallback}</p>
      )}
    </section>
  );
}
