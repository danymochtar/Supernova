/**
 * Reference numerology profiles — ground truth for the engine.
 * Hand-computed against the Pythagorean / Hans Decoz convention.
 *
 * NOTE: These fixtures are populated incrementally as the M1 engine lands.
 * For M0 we ship the profiles + the expected core numbers; pinnacle / cycle
 * expectations are filled in as those functions are implemented.
 */

import type { BirthDate } from '@/lib/numerology/types';

export interface ReferenceProfile {
  label: string;
  fullName: string;
  dob: BirthDate;
  expected: {
    lifePath: { compound: number; reduced: number; isMaster?: boolean };
    expression?: { compound: number; reduced: number; isMaster?: boolean };
    soulUrge?: { compound: number; reduced: number; isMaster?: boolean };
    personality?: { compound: number; reduced: number; isMaster?: boolean };
    birthday?: { compound: number; reduced: number; isMaster?: boolean };
  };
}

export const referenceProfiles: ReferenceProfile[] = [
  {
    label: 'John Lennon (master Life Path)',
    fullName: 'John Winston Lennon',
    dob: { year: 1940, month: 10, day: 9 },
    // m=10→1, d=9→9, y=1940→1+9+4+0=14→5; sum 1+9+5=15→6
    expected: {
      lifePath: { compound: 15, reduced: 6 },
      birthday: { compound: 9, reduced: 9 },
    },
  },
  {
    label: 'Master Life Path 11 (Barack Obama)',
    fullName: 'Barack Hussein Obama',
    dob: { year: 1961, month: 8, day: 4 },
    // m=8, d=4, y=1961→1+9+6+1=17→8; sum 8+4+8=20→2
    expected: {
      lifePath: { compound: 20, reduced: 2 },
      birthday: { compound: 4, reduced: 4 },
    },
  },
  {
    label: 'Karmic debt 19/1 (sample)',
    fullName: 'Mary Smith',
    dob: { year: 1990, month: 7, day: 28 },
    // m=7, d=28→10→1, y=1990→1+9+9+0=19→1; sum 7+1+1=9
    expected: {
      lifePath: { compound: 9, reduced: 9 },
      birthday: { compound: 28, reduced: 1 },
    },
  },
  {
    label: 'Master Birthday 11',
    fullName: 'Yvonne Tan',
    dob: { year: 1985, month: 3, day: 11 },
    // m=3, d=11 (master, preserved at the day step), y=1985→1+9+8+5=23→5; sum 3+11+5=19→1
    expected: {
      lifePath: { compound: 19, reduced: 1 },
      birthday: { compound: 11, reduced: 11, isMaster: true },
    },
  },
  {
    label: 'Leap-year DOB',
    fullName: 'Bryan Lee',
    dob: { year: 2000, month: 2, day: 29 },
    // m=2, d=29→11 (master, preserved), y=2000→2; sum 2+11+2=15→6
    expected: {
      lifePath: { compound: 15, reduced: 6 },
      birthday: { compound: 29, reduced: 11, isMaster: true },
    },
  },
];
