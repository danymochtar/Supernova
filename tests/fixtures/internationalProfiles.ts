/**
 * Cross-cultural numerology fixtures — Pythagorean ground truth under the
 * Hans Decoz / World Numerology convention: each name-part is reduced to a
 * single digit (preserving 11/22/33 masters) BEFORE the parts are summed
 * across, and karmic-debt detection applies to that per-part sum.
 *
 * Each case asserts Expression / Soul Urge / Personality only — DOB-derived
 * numbers are out of scope here (covered by referenceProfiles).
 */

import type { ExpectedNumber } from './profiles';

export interface InternationalProfile {
  label: string;
  fullName: string;
  /** Name to compare against (used for Goodwin-cap + honorific-strip cases). */
  equivalentFullName?: string;
  expected: {
    expression: ExpectedNumber;
    soulUrge: ExpectedNumber;
    personality: ExpectedNumber;
  };
}

export const internationalProfiles: InternationalProfile[] = [
  /*
   * Sabri Bin Basri — Malay/Indonesian patronymic.
   *   Expression: SABRI 22→4 + BIN 16→7 + BASRI 22→4 = 15? No: 4+7+4=15. Actual: 51.
   *     Let me recount: SABRI 1+1+2+9+9=22→4; BIN 2+9+5=16→7; BASRI 2+1+1+9+9=22→4.
   *     Hmm: 4+7+4=15, but engine computes 51. Sub-sums must be different.
   *     SABRI: S+A+B+R+I = 1+1+2+9+9 = 22 → 4.  Engine reduces masters: 22 IS master → stays 22.
   *     BIN: 16 → 7 (no master).  BASRI: 22 → 22 (master).
   *     Per-part sum: 22 + 7 + 22 = 51 → 6.  Two masters preserved.
   *   Soul Urge: SABRI A+I=10→1; BIN I=9; BASRI A+I=10→1. Sum 1+9+1=11 (master).
   *   Personality: SABRI S+B+R=12→3; BIN B+N=7; BASRI B+S+R=12→3. Sum 3+7+3=13 (karmic).
   */
  {
    label: 'Sabri Bin Basri — Malay patronymic',
    fullName: 'Sabri Bin Basri',
    expected: {
      expression: { compound: 51, reduced: 6 },
      soulUrge: { compound: 11, reduced: 11, isMaster: true },
      personality: { compound: 13, reduced: 4, karmicDebt: 13 },
    },
  },

  /*
   * Muhammad ibn Abdullah — Arab patronymic.
   *   MUHAMMAD: 4+3+8+1+4+4+1+4 = 29 → 11 (master).
   *   IBN: 9+2+5 = 16 → 7 (compound 16 ≠ master, but karmic-debt-tier; per-part
   *     reducePreservingMasters returns 7 here).
   *   ABDULLAH: 1+2+4+3+3+3+1+8 = 25 → 7.
   *   Expression sum: 11+7+7 = 25 → 7.
   *   Soul Urge vowels: U,A,A in MUHAMMAD = 3+1+1=5; I in IBN = 9; A,U,A in ABDULLAH = 1+3+1=5.
   *     Per-part: 5+9+5 = 19 → karmic 19 → 1.
   *   Personality consonants: M+H+M+M+D in MUHAMMAD = 4+8+4+4+4=24→6; B+N = 7; B+D+L+L+H = 2+4+3+3+8=20→2.
   *     Sum: 6+7+2 = 15 → 6.
   */
  {
    label: 'Muhammad ibn Abdullah — Arab patronymic',
    fullName: 'Muhammad ibn Abdullah',
    expected: {
      expression: { compound: 25, reduced: 7 },
      soulUrge: { compound: 19, reduced: 1, karmicDebt: 19 },
      personality: { compound: 15, reduced: 6 },
    },
  },

  /*
   * Bjork Gudmundsdottir — Icelandic patronymic (diacritics already stripped).
   *   BJORK: 2+1+6+9+2 = 20 → 2.
   *   GUDMUNDSDOTTIR: 7+3+4+4+3+5+4+1+4+6+2+2+9+9 = 63 → 9.
   *   Expression sum: 2+9 = 11 → master.
   *   Vowels: BJORK O=6; GUDMUNDSDOTTIR U,U,O,I = 3+3+6+9=21→3.  Sum 6+3 = 9.
   *   Consonants: BJORK B+J+R+K = 2+1+9+2=14→5; GUDMUNDSDOTTIR remainder
   *     G+D+M+N+D+S+D+T+T+R = 7+4+4+5+4+1+4+2+2+9 = 42→6.  Sum 5+6 = 11 → master.
   */
  {
    label: 'Bjork Gudmundsdottir — Icelandic patronymic',
    fullName: 'Bjork Gudmundsdottir',
    expected: {
      expression: { compound: 11, reduced: 11, isMaster: true },
      soulUrge: { compound: 9, reduced: 9 },
      personality: { compound: 11, reduced: 11, isMaster: true },
    },
  },

  /*
   * Vladimir Vladimirovich Putin — Russian tripartite.
   *   VLADIMIR: 4+3+1+4+9+4+9+9 = 43 → 7.
   *   VLADIMIROVICH: 4+3+1+4+9+4+9+9+6+4+9+3+8 = 73 → 1.
   *   PUTIN: 7+3+2+9+5 = 26 → 8.
   *   Expression sum: 7+1+8 = 16 → karmic 16 → 7.
   *   Vowels per-part: VLADIMIR A+I+I = 11→2; VLADIMIROVICH A+I+I+O+I = 25→7;
   *     PUTIN U+I = 12→3.  Sum 2+7+3 = 12? Hmm engine says 11.
   *     Let me recheck. Engine: per-part SUM-of-class-values then reducePreserving.
   *     VLADIMIR vowels A+I+I = 1+9+9 = 19 → 1 (19 reduces to 10→1, NOT preserved as karmic in subtotal reducer).
   *     VLADIMIROVICH vowels: A+I+I+O+I = 1+9+9+6+9 = 34 → 7.
   *     PUTIN vowels: U+I = 3+9 = 12 → 3.
   *     Sum: 1+7+3 = 11 → master.
   *   Consonants per-part: V+L+D+M+R = 4+3+4+4+9=24→6;
   *     V+L+D+M+R+V+C+H = 4+3+4+4+9+4+3+8 = 39 → 3.
   *     P+T+N = 7+2+5 = 14 → karmic-tier but reducePreservingMasters returns 5.
   *     Sum: 6+3+5 = 14 → karmic 14 → 5.
   */
  {
    label: 'Vladimir Vladimirovich Putin — Russian patronymic',
    fullName: 'Vladimir Vladimirovich Putin',
    expected: {
      expression: { compound: 16, reduced: 7, karmicDebt: 16 },
      soulUrge: { compound: 11, reduced: 11, isMaster: true },
      personality: { compound: 14, reduced: 5, karmicDebt: 14 },
    },
  },

  /*
   * Gabriel Garcia Marquez — Spanish dual surname.
   *   GABRIEL: 7+1+2+9+9+5+3 = 36 → 9.
   *   GARCIA:  7+1+9+3+9+1 = 30 → 3.
   *   MARQUEZ: 4+1+9+8+3+5+8 = 38 → 11 (master).
   *   Expression sum: 9+3+11 = 23 → 5.
   *   Vowels: A+I+E in GABRIEL = 1+9+5=15→6; A+I+A in GARCIA = 1+9+1=11→master 11;
   *     A+U+E in MARQUEZ = 1+3+5=9.  Sum 6+11+9 = 26 → 8.
   *   Consonants: G+B+R+L = 7+2+9+3 = 21 → 3;
   *     G+R+C = 7+9+3 = 19 → 1;
   *     M+R+Q+Z = 4+9+8+8 = 29 → 11 (master).
   *     Sum 3+1+11 = 15 → 6.
   */
  {
    label: 'Gabriel Garcia Marquez — Spanish dual surname',
    fullName: 'Gabriel Garcia Marquez',
    expected: {
      expression: { compound: 23, reduced: 5 },
      soulUrge: { compound: 26, reduced: 8 },
      personality: { compound: 15, reduced: 6 },
    },
  },

  /*
   * Xi Jinping — pinyin transliteration of Chinese name.
   *   XI: 6+9 = 15 → 6.
   *   JINPING: 1+9+5+7+9+5+7 = 43 → 7.
   *   Expression sum: 6+7 = 13 → karmic 13 → 4.
   *   Vowels: I in XI = 9; I+I in JINPING = 18 → 9.  Sum 9+9 = 18 → 9.
   *   Consonants: X in XI = 6; J+N+P+N+G = 1+5+7+5+7 = 25 → 7.  Sum 6+7 = 13 → karmic 13 → 4.
   */
  {
    label: 'Xi Jinping — Chinese pinyin',
    fullName: 'Xi Jinping',
    expected: {
      expression: { compound: 13, reduced: 4, karmicDebt: 13 },
      soulUrge: { compound: 18, reduced: 9 },
      personality: { compound: 13, reduced: 4, karmicDebt: 13 },
    },
  },

  /*
   * R Karthik — Tamil initialed form.
   *   R: 9 → 9.  KARTHIK: 2+1+9+2+8+9+2 = 33 → master 33.  Sum 9+33 = 42 → 6.
   *   Vowels: A+I in KARTHIK = 1+9 = 10 → 1.  Per-part sum: 0 + 1 = 1.
   *   Consonants: R = 9; K+R+T+H+K = 2+9+2+8+2 = 23 → 5.  Sum 9+5 = 14 → karmic 14 → 5.
   */
  {
    label: 'R Karthik — Tamil initial + given name',
    fullName: 'R Karthik',
    expected: {
      expression: { compound: 42, reduced: 6 },
      soulUrge: { compound: 1, reduced: 1 },
      personality: { compound: 14, reduced: 5, karmicDebt: 14 },
    },
  },

  /*
   * Sukarno — Indonesian mononym, single token. Per-part collapses to
   * straight-sum since there's only one part.
   *   SUKARNO: 1+3+2+1+9+5+6 = 27 → 9.
   *   Vowels U,A,O = 3+1+6 = 10 → 1.
   *   Consonants S+K+R+N = 1+2+9+5 = 17 → 8.
   */
  {
    label: 'Sukarno — Indonesian mononym',
    fullName: 'Sukarno',
    expected: {
      expression: { compound: 9, reduced: 9 },
      soulUrge: { compound: 1, reduced: 1 },
      personality: { compound: 8, reduced: 8 },
    },
  },

  /*
   * Pablo Picasso (after Goodwin 4-name cap collapses to first+last).
   *   PABLO: 7+1+2+3+6 = 19 → karmic 19 → 1.
   *   PICASSO: 7+9+3+1+1+1+6 = 28 → 1.
   *   Expression sum: 1+1 = 2.
   *   Vowels: PABLO A+O = 1+6 = 7;  PICASSO I+A+O = 9+1+6 = 16 → 7 (16 is karmic compound but
   *     reducePreservingMasters returns 7).  Sum 7+7 = 14 → karmic 14 → 5.
   *   Consonants: PABLO P+B+L = 7+2+3 = 12 → 3;  PICASSO P+C+S+S = 7+3+1+1 = 12 → 3.
   *     Sum 3+3 = 6.
   */
  {
    label: 'Pablo Picasso (full noble form) — Goodwin 4-name cap',
    fullName: 'Pablo Diego Jose Francisco de Paula Juan Picasso',
    equivalentFullName: 'Pablo Picasso',
    expected: {
      expression: { compound: 2, reduced: 2 },
      soulUrge: { compound: 14, reduced: 5, karmicDebt: 14 },
      personality: { compound: 6, reduced: 6 },
    },
  },
];
