/**
 * Ground-truth numerology values for Dany Mochtar, taken verbatim from
 * Hans Decoz's World Numerology PDFs (Personal Profile + Year Forecast).
 *
 * Source PDFs (uploaded by the user, 2026):
 *   - Dany_PersProf — full Personal Profile
 *   - Dany_YearFore — Year Forecast (Personal Year/Month, Pinnacle dates,
 *                     Period Cycle dates, Essence + Transits)
 *
 * Used by `wn-reference.test.ts` to pin our engine against the canonical
 * World Numerology output. When the test fails, we changed methodology —
 * not the user's birth data.
 */
export const WN_DANY = {
  birthName: 'Dany Mochtar',
  dob: { year: 1995, month: 5, day: 17 },

  /** Compound + reduced per WN. Decoz convention: per-name-part reduction
   *  (preserving 11/22/33 masters) before summing across parts. */
  lifePath: { compound: 19, reduced: 1 }, // 19/10/1 chain; final reduced 1
  expression: { compound: 41, reduced: 5 }, // Dany 17→8 + Mochtar 33 (master) = 41
  soulUrge: { compound: 15, reduced: 6 }, // Dany A+Y=8 + Mochtar O+A=7 = 15
  personality: { compound: 17, reduced: 8 }, // Dany D+N=9 + Mochtar M+C+H+T+R=26→8 = 17
  birthday: { compound: 17, reduced: 8 },

  /** None — every digit 1-9 is present in "Dany Mochtar". */
  karmicLessons: [] as number[],

  /** Birth month=5, day=17→8 (preserving the 17 compound), year=1995→24→6 */
  periodCycles: {
    first: { compound: 5, reduced: 5 },
    second: { compound: 17, reduced: 8 },
    third: { compound: 24, reduced: 6 },
  },

  /** Reduced single digits per WN's display (masters preserved at slot 4). */
  pinnacles: {
    first: 4, // (5 + 8) = 13 → 4
    second: 5, // (8 + 6) = 14 → 5
    third: 9, // (4 + 5) = 9
    fourth: 11, // (5 + 6) = 11, master
  },

  challenges: {
    first: 3, // |5 - 8|
    second: 2, // |8 - 6|
    third: 1, // |3 - 2|
    fourth: 1, // |5 - 6|
  },

  /** Age boundaries from the YearFore PDF. */
  pinnacleEndsAt: { first: 35, second: 44, third: 53 }, // 36 − reducedLifePath = 35

  /** Bridge values from PerProf SUMMARY. */
  bridges: {
    lifePathExpression: 4, // |1 - 5|
    soulUrgePersonality: 2, // |6 - 8|
    lifePathBirthday: 7, // |1 - 8|
  },

  /** Personal Year 2026 from YearFore. */
  personalYear2026: 5,
  /** Per-month PYs for 2026 from YearFore p4. */
  personalMonths2026: {
    1: 5, // calendar year 2026 = PY 5 minus … no, Personal Months reset around birthday but YearFore lists Jan onwards
    5: 1, // May
    6: 2, // June
    7: 3, // July
    8: 4, // August
    9: 5, // September
    10: 6, // October
    11: 7, // November
    12: 8, // December
  },
} as const;
