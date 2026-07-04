/**
 * Types shared by the Soul Connection (Karmic / Soulmate / Twin Flame)
 * pair analysis. See `soulconnectionfeatureplan.md` for the source spec.
 *
 * The engine layer is pure math; UI types (labels, i18n strings) live
 * separately in the components layer.
 */

/** The four primary connection classifications, resolved by priority
 *  order in `analyzePair`. NEUTRAL is not a rejection — the copy
 *  presents it as "a connection still forming". */
export type ConnectionType = 'TWIN_FLAME' | 'KARMIC' | 'SOULMATE' | 'NEUTRAL';

/** Karmic debt numbers per Decoz — birth day (calendar) or the
 *  pre-reduction Life Path sum in this set flags the person. */
export type KarmicDebtNumber = 13 | 14 | 16 | 19;

/** Which side of the person's chart carries a karmic debt. */
export type KarmicDebtSource = 'birthDay' | 'preReductionSum';

export interface PersonKarmicDebt {
  number: KarmicDebtNumber;
  source: KarmicDebtSource;
}

/** Per-person numeric fingerprint feeding pair analysis. */
export interface PersonNumbers {
  /** Life Path value. Masters (11, 22, 33) preserved. */
  lifePath: number;
  /** Day component of Life Path (calendar day reduced, masters preserved). */
  dayComponent: number;
  /** Month component. */
  monthComponent: number;
  /** Year component. */
  yearComponent: number;
  /** dayComponent + monthComponent + yearComponent BEFORE the final
   *  reduction. Used for karmic debt detection. */
  preReductionSum: number;
  /** Calendar day (unreduced) — the raw dob.day. Used for karmic debt
   *  and mirror-date checks. */
  birthDay: number;
  /** Calendar month (unreduced) — the raw dob.month. */
  birthMonth: number;
  /** Karmic debt (13/14/16/19) if the person carries one, else null.
   *  Priority: birth-day match wins over preReductionSum match when
   *  both apply. */
  karmicDebt: PersonKarmicDebt | null;
  /** True when the calendar birth day is a master number (11/22). */
  isMasterDay: boolean;
  /** Soul Urge value (masters preserved). null when name is missing —
   *  UI treats this as "soul-urge signals unavailable". */
  soulUrge: number | null;
  /** True when soulUrge is a master (11/22/33). */
  isSoulUrgeMaster: boolean;
}

/** Machine-readable signal keys used in ConnectionReading.signals. UI
 *  looks these up in the i18n signal-label map. */
export type SignalKey =
  | 'sameGroup'
  | 'soulUrgeMatch'
  | 'soulUrgeHarmonic'
  | 'pairKarmicDebt'
  | 'eitherPersonKarmicDebt'
  | 'sameLifePath'
  | 'combinedIsEleven'
  | 'mirrorDate'
  | 'amplified';

export interface Signal {
  key: SignalKey;
  hit: boolean;
  /** Points contributed to the strength score when hit. Documented in
   *  the plan; kept on the signal for UI tooltips. */
  weight: number;
}

/** Undertone flags — independent of the primary classification. */
export type Undertone = 'karmicUndertone' | 'amplified';

export interface ConnectionReading {
  primary: ConnectionType;
  undertones: Undertone[];
  /** 0-100 strength meter. */
  strength: number;
  /** reduceKeepMasters(lpA + lpB). */
  relationshipNumber: number;
  /** lpA + lpB before reduction. Used for karmic-debt pair check. */
  pairSumRaw: number;
  /** All signals in stable order (hit + miss) so the UI can render only
   *  the hits and reason about strength when needed. */
  signals: Signal[];
  a: PersonNumbers;
  b: PersonNumbers;
}
