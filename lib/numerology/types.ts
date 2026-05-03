/**
 * Result of any numerology computation. We always preserve the compound form
 * (pre-reduction) alongside the reduced single digit (or master number) so the
 * UI can render both — e.g. "19/10/1" for a karmic-debt-flagged Life Path 1.
 */
export interface NumerologyResult {
  compound: number;
  reduced: number;
  isMaster: boolean;
  karmicDebt?: 13 | 14 | 16 | 19;
}

export type DigitOrMaster = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 22 | 33;

export interface BirthDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface PinnacleSet {
  first: NumerologyResult;
  second: NumerologyResult;
  third: NumerologyResult;
  fourth: NumerologyResult;
  /** Age boundaries: [end of 1st, end of 2nd, end of 3rd]. 4th runs to end of life. */
  ageBoundaries: [number, number, number];
}

export interface ChallengeSet {
  first: NumerologyResult;
  second: NumerologyResult;
  third: NumerologyResult;
  fourth: NumerologyResult;
}

export interface PeriodCycleSet {
  first: NumerologyResult;
  second: NumerologyResult;
  third: NumerologyResult;
  /** Age boundaries: [end of 1st, end of 2nd]. 3rd runs to end of life. */
  ageBoundaries: [number, number];
}

export interface CoreProfile {
  lifePath: NumerologyResult;
  expression: NumerologyResult;
  soulUrge: NumerologyResult;
  personality: NumerologyResult;
  birthday: NumerologyResult;
  karmicLessons: number[];
  pinnacles: PinnacleSet;
  challenges: ChallengeSet;
  periodCycles: PeriodCycleSet;
}

export interface PersonalCycles {
  personalYear: NumerologyResult;
  personalMonth: NumerologyResult;
  personalDay: NumerologyResult;
}
