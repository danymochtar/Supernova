import { Sparkles, Flame, Link2, HeartHandshake } from 'lucide-react';
import type {
  ConnectionReading,
  ConnectionType,
  SignalKey,
} from '@/lib/connection';
import { explainConnection } from '@/lib/connection/explain';

interface Props {
  reading: ConnectionReading;
  /** Person names for the "kalian" framing — used only for the two-column
   *  identity block; NOT interpolated into the explanation copy. */
  meName: string;
  themName: string;
}

/** Type-specific presentation. Twin Flame + Soulmate get warm accent
 *  cards (the "cantik" remarks the user asked for); Karmic gets an
 *  intense but not alarming amber card; Neutral stays quiet neutral. */
const TYPE_PRESENTATION: Record<
  ConnectionType,
  {
    icon: typeof Sparkles;
    label: string;
    tagline: string;
    /** Gradient background + border classes for the header card. */
    surface: string;
    /** Badge (chip) classes — matches the label chip inside the card. */
    badge: string;
  }
> = {
  TWIN_FLAME: {
    icon: Flame,
    label: 'Twin Flame',
    tagline: 'Cermin numerik — jarang, intens, sering menuntun pulang.',
    surface:
      'border-rose-300/60 bg-gradient-to-br from-rose-100/70 via-white to-orange-100/60 dark:border-rose-500/30 dark:from-rose-950/40 dark:via-neutral-950 dark:to-orange-950/30',
    badge:
      'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm',
  },
  SOULMATE: {
    icon: Sparkles,
    label: 'Soulmate',
    tagline: 'Nyambungnya natural — sudah familiar sejak awal.',
    surface:
      'border-violet-300/60 bg-gradient-to-br from-violet-100/70 via-white to-indigo-100/60 dark:border-violet-500/30 dark:from-violet-950/40 dark:via-neutral-950 dark:to-indigo-950/30',
    badge:
      'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm',
  },
  KARMIC: {
    icon: Link2,
    label: 'Karmic',
    tagline: 'Datang bawa pelajaran, bukan hukuman.',
    surface:
      'border-amber-300/60 bg-gradient-to-br from-amber-100/70 via-white to-yellow-100/50 dark:border-amber-500/30 dark:from-amber-950/40 dark:via-neutral-950 dark:to-yellow-950/25',
    badge: 'bg-amber-600 text-white shadow-sm',
  },
  NEUTRAL: {
    icon: HeartHandshake,
    label: 'Netral',
    tagline: 'Koneksi yang masih berkembang — kasih waktu.',
    surface:
      'border-border bg-white dark:bg-neutral-950',
    badge: 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900',
  },
};

/** Signal chip labels — plain Bahasa Indonesia per copy rules §7. */
const SIGNAL_LABEL: Record<SignalKey, string> = {
  sameGroup: 'Life path satu grup',
  soulUrgeMatch: 'Soul urge sama',
  soulUrgeHarmonic: 'Soul urge harmonis',
  pairKarmicDebt: 'Ada karmic debt',
  eitherPersonKarmicDebt: 'Karmic debt pribadi',
  sameLifePath: 'Life path sama',
  combinedIsEleven: 'Gabungan 11',
  mirrorDate: 'Tanggal lahir memantul',
  amplified: 'Ada master number',
};

/**
 * "Koneksi" section on the Person detail page — soul-connection
 * reading between the signed-in user and this person. Renders the
 * primary type badge (Twin Flame / Soulmate / Karmic / Neutral), a
 * strength meter, up to 4 signal chips of what fired, and a
 * template-generated explanation paragraph.
 */
export function KoneksiSection({ reading, meName, themName }: Props) {
  const t = TYPE_PRESENTATION[reading.primary];
  const Icon = t.icon;

  const hitSignals = reading.signals.filter((s) => s.hit).slice(0, 4);

  return (
    <section
      className={`space-y-4 rounded-3xl border p-5 shadow-sm ${t.surface}`}
    >
      {/* Header — type + tagline */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.18em]">
            Koneksi
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${t.badge}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </span>
            {reading.undertones.includes('amplified') ? (
              <span className="border-border/60 rounded-full border bg-white/50 px-2.5 py-1 text-[10px] font-medium text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                Amplified
              </span>
            ) : null}
            {reading.undertones.includes('karmicUndertone') ? (
              <span className="border-border/60 rounded-full border bg-white/50 px-2.5 py-1 text-[10px] font-medium text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
                Karmic undertone
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground text-[13px] italic leading-snug">
            {t.tagline}
          </p>
        </div>
      </div>

      {/* Identity columns — LP + SU per person */}
      <div className="grid grid-cols-2 gap-3">
        <IdentityColumn
          name={meName}
          lifePath={reading.a.lifePath}
          soulUrge={reading.a.soulUrge}
          isMasterDay={reading.a.isMasterDay}
        />
        <IdentityColumn
          name={themName}
          lifePath={reading.b.lifePath}
          soulUrge={reading.b.soulUrge}
          isMasterDay={reading.b.isMasterDay}
        />
      </div>

      {/* Signal chips */}
      {hitSignals.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {hitSignals.map((s) => (
            <span
              key={s.key}
              className="border-border/60 rounded-full border bg-white/70 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200"
            >
              {SIGNAL_LABEL[s.key]}
            </span>
          ))}
        </div>
      ) : null}

      {/* Explanation */}
      <p className="text-[13.5px] leading-relaxed text-neutral-800 dark:text-neutral-200">
        {explainConnection(reading)}
      </p>

      {/* Footer — reflective framing */}
      <p className="text-muted-foreground border-border/40 border-t pt-3 text-[11px] italic leading-relaxed">
        Angka menunjukkan pola. Kamu yang menentukan artinya.
      </p>
    </section>
  );
}

function IdentityColumn({
  name,
  lifePath,
  soulUrge,
  isMasterDay,
}: {
  name: string;
  lifePath: number;
  soulUrge: number | null;
  isMasterDay: boolean;
}) {
  return (
    <div className="border-border/40 space-y-2 rounded-2xl border bg-white/60 px-3 py-3 dark:bg-neutral-900/40">
      <p className="text-muted-foreground truncate text-[10px] font-semibold uppercase tracking-[0.16em]">
        {name}
      </p>
      <div className="flex items-baseline gap-3">
        <div className="flex flex-col">
          <span className="text-muted-foreground text-[9px] font-semibold uppercase tracking-wider">
            LP
          </span>
          <span className="font-serif text-2xl font-semibold tabular-nums leading-none">
            {lifePath}
          </span>
        </div>
        {soulUrge !== null ? (
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[9px] font-semibold uppercase tracking-wider">
              SU
            </span>
            <span className="font-serif text-2xl font-semibold tabular-nums leading-none">
              {soulUrge}
            </span>
          </div>
        ) : null}
        {isMasterDay ? (
          <span className="text-primary text-[10px] font-semibold uppercase tracking-wider">
            Master day
          </span>
        ) : null}
      </div>
    </div>
  );
}
