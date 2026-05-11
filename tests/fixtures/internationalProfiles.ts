/**
 * Cross-cultural numerology fixtures — hand-computed Pythagorean ground truth
 * for non-Western / patronymic / compound-surname names plus edge cases
 * (Goodwin's 4-name cap, honorific stripping).
 *
 * Each case asserts Expression / Soul Urge / Personality only — the DOB-derived
 * numbers are out of scope for this fixture set (covered by referenceProfiles).
 * A placeholder DOB is provided so the fixture shape is consistent.
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
   * Sabri Bin Basri — Malay/Indonesian patronymic ("bin" included as letters).
   *   Expression: SABRI(22) + BIN(16) + BASRI(22) = 60 → 6
   *   Soul Urge:  vowels A,I + I + A,I = 1+9+9+1+9 = 29 → 11 (master)
   *   Personality: 60 - 29 = 31 → 4
   */
  {
    label: 'Sabri Bin Basri — Malay patronymic',
    fullName: 'Sabri Bin Basri',
    expected: {
      expression: { compound: 60, reduced: 6 },
      soulUrge: { compound: 29, reduced: 11, isMaster: true },
      personality: { compound: 31, reduced: 4 },
    },
  },

  /*
   * Muhammad ibn Abdullah — Arab patronymic ("ibn" included).
   *   MUHAMMAD: 4+3+8+1+4+4+1+4 = 29
   *   IBN:      9+2+5           = 16
   *   ABDULLAH: 1+2+4+3+3+3+1+8 = 25
   *   Expression: 29+16+25 = 70 → 7
   *   Vowels U,A,A + I + A,U,A = 3+1+1 + 9 + 1+3+1 = 19 → karmic 19 → 1
   *   Personality: 70 - 19 = 51 → 6
   */
  {
    label: 'Muhammad ibn Abdullah — Arab patronymic',
    fullName: 'Muhammad ibn Abdullah',
    expected: {
      expression: { compound: 70, reduced: 7 },
      soulUrge: { compound: 19, reduced: 1, karmicDebt: 19 },
      personality: { compound: 51, reduced: 6 },
    },
  },

  /*
   * Bjork Gudmundsdottir — Icelandic patronymic, diacritics already stripped.
   *   BJORK: 2+1+6+9+2 = 20
   *   GUDMUNDSDOTTIR: 7+3+4+4+3+5+4+1+4+6+2+2+9+9 = 63
   *   Expression: 83 → 11 (master)
   *   Vowels O + U,U,O,I = 6 + 21 = 27 → 9
   *   Personality: 83 - 27 = 56 → 11 (master)
   */
  {
    label: 'Bjork Gudmundsdottir — Icelandic patronymic',
    fullName: 'Bjork Gudmundsdottir',
    expected: {
      expression: { compound: 83, reduced: 11, isMaster: true },
      soulUrge: { compound: 27, reduced: 9 },
      personality: { compound: 56, reduced: 11, isMaster: true },
    },
  },

  /*
   * Vladimir Vladimirovich Putin — Russian tripartite (given + patronymic + surname).
   *   VLADIMIR:       4+3+1+4+9+4+9+9                 = 43
   *   VLADIMIROVICH:  4+3+1+4+9+4+9+9+6+4+9+3+8       = 73
   *   PUTIN:          7+3+2+9+5                       = 26
   *   Expression: 43+73+26 = 142 → 7
   *   Vowels: (A,I,I) + (A,I,I,O,I) + (U,I) = 19 + 34 + 12 = 65 → 11 (master)
   *   Personality: 142 - 65 = 77 → 14 → 5 (compound 77 isn't 13/14/16/19, so no
   *     karmic-debt flag even though the intermediate reduction passes through 14)
   */
  {
    label: 'Vladimir Vladimirovich Putin — Russian patronymic',
    fullName: 'Vladimir Vladimirovich Putin',
    expected: {
      expression: { compound: 142, reduced: 7 },
      soulUrge: { compound: 65, reduced: 11, isMaster: true },
      personality: { compound: 77, reduced: 5 },
    },
  },

  /*
   * Gabriel Garcia Marquez — Spanish dual surname (paternal + maternal).
   *   GABRIEL:  7+1+2+9+9+5+3 = 36
   *   GARCIA:   7+1+9+3+9+1   = 30
   *   MARQUEZ:  4+1+9+8+3+5+8 = 38
   *   Expression: 104 → 5
   *   Vowels: A,I,E + A,I,A + A,U,E = 15 + 11 + 9 = 35 → 8
   *   Personality: 104 - 35 = 69 → 15 → 6
   */
  {
    label: 'Gabriel Garcia Marquez — Spanish dual surname',
    fullName: 'Gabriel Garcia Marquez',
    expected: {
      expression: { compound: 104, reduced: 5 },
      soulUrge: { compound: 35, reduced: 8 },
      personality: { compound: 69, reduced: 6 },
    },
  },

  /*
   * Xi Jinping — pinyin transliteration of Chinese name.
   *   XI: 6+9 = 15
   *   JINPING: 1+9+5+7+9+5+7 = 43
   *   Expression: 58 → karmic 13 → 4
   *   Vowels: I + I,I = 9 + 18 = 27 → 9
   *   Personality: 58 - 27 = 31 → 4
   */
  {
    label: 'Xi Jinping — Chinese pinyin',
    fullName: 'Xi Jinping',
    expected: {
      expression: { compound: 58, reduced: 4 },
      soulUrge: { compound: 27, reduced: 9 },
      personality: { compound: 31, reduced: 4 },
    },
  },

  /*
   * R Karthik — Tamil initialed form (father's initial expanded to letter).
   *   R:       9
   *   KARTHIK: 2+1+9+2+8+9+2 = 33
   *   Expression: 42 → 6
   *   Vowels: (none in R) + A,I = 0 + 10 = 10 → 1
   *   Personality: 42 - 10 = 32 → 5
   */
  {
    label: 'R Karthik — Tamil initial + given name',
    fullName: 'R Karthik',
    expected: {
      expression: { compound: 42, reduced: 6 },
      soulUrge: { compound: 10, reduced: 1 },
      personality: { compound: 32, reduced: 5 },
    },
  },

  /*
   * Sukarno — Indonesian mononym, single token.
   *   SUKARNO: 1+3+2+1+9+5+6 = 27 → 9
   *   Vowels U,A,O = 3+1+6 = 10 → 1
   *   Personality: 27 - 10 = 17 → 8
   */
  {
    label: 'Sukarno — Indonesian mononym',
    fullName: 'Sukarno',
    expected: {
      expression: { compound: 27, reduced: 9 },
      soulUrge: { compound: 10, reduced: 1 },
      personality: { compound: 17, reduced: 8 },
    },
  },

  /*
   * Goodwin 4-name cap — 8-part Spanish noble name should collapse to first + last.
   *   Pablo Diego Jose Francisco de Paula Juan Picasso → "Pablo Picasso"
   *   PABLO:   7+1+2+3+6   = 19
   *   PICASSO: 7+9+3+1+1+1+6 = 28
   *   Expression: 47 → 11 (master)
   *   Vowels: A,O + I,A,O = 7 + 16 = 23 → 5
   *   Personality: 47 - 23 = 24 → 6
   */
  {
    label: 'Pablo Picasso (full noble form) — Goodwin 4-name cap',
    fullName: 'Pablo Diego Jose Francisco de Paula Juan Picasso',
    equivalentFullName: 'Pablo Picasso',
    expected: {
      expression: { compound: 47, reduced: 11, isMaster: true },
      soulUrge: { compound: 23, reduced: 5 },
      personality: { compound: 24, reduced: 6 },
    },
  },
];
