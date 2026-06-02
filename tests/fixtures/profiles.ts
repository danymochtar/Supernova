/**
 * Reference numerology profiles — hand-computed ground truth for the engine.
 * Pythagorean / Hans Decoz convention.
 *
 * Letter map: A=1 B=2 C=3 D=4 E=5 F=6 G=7 H=8 I=9
 *             J=1 K=2 L=3 M=4 N=5 O=6 P=7 Q=8 R=9
 *             S=1 T=2 U=3 V=4 W=5 X=6 Y=7 Z=8
 */

import type { BirthDate } from '@/lib/numerology/types';

export interface ExpectedNumber {
  compound: number;
  reduced: number;
  isMaster?: boolean;
  karmicDebt?: 13 | 14 | 16 | 19;
}

export interface ReferenceProfile {
  label: string;
  fullName: string;
  dob: BirthDate;
  expected: {
    lifePath: ExpectedNumber;
    expression: ExpectedNumber;
    soulUrge: ExpectedNumber;
    personality: ExpectedNumber;
    birthday: ExpectedNumber;
    karmicLessons: number[];
    pinnacles: { first: ExpectedNumber; second: ExpectedNumber; third: ExpectedNumber; fourth: ExpectedNumber; ageBoundaries: [number, number, number] };
    challenges: { first: ExpectedNumber; second: ExpectedNumber; third: ExpectedNumber; fourth: ExpectedNumber };
  };
}

/*
 * Computation notes for "Mary Smith" (1990-07-28):
 *  Life Path: m=7, d=28→10→1, y=1990→19→1; sum=7+1+1=9 → 9
 *  Birthday: 28 → 10 → 1
 *  WN/Decoz convention: per-name-part reduction (preserving 11/22/33) THEN sum.
 *  Expression: MARY 4+1+9+7=21→3; SMITH 1+4+9+2+8=24→6. Per-part sum: 3+6=9.
 *  Soul Urge (vowels): MARY A+Y=8 (single); SMITH I=9. Per-part sum: 8+9=17 → 8.
 *  Personality (consonants): MARY M+R=13→4; SMITH S+M+T+H=15→6. Per-part sum: 4+6=10 → 1.
 *  Karmic lessons: digits present = {4(M),1(A,J,S),9(R,I),7(Y),2(B,T),8(H,Z)} = {1,2,4,7,8,9}; missing = {3,5,6}
 *  Pinnacles (Decoz; m=7, d=1, y=1):
 *    1st = 7+1=8; 2nd = 1+1=2; 3rd = 8+2=10→1; 4th = 7+1=8
 *    LP=9, single=9; firstEnd = max(27, 36-9) = 27
 *    boundaries = [27, 36, 45]
 *  Challenges (single-digit m=7, d=1, y=1):
 *    1st=|7-1|=6; 2nd=|1-1|=0; 3rd=|6-0|=6; 4th=|7-1|=6
 */

export const referenceProfiles: ReferenceProfile[] = [
  {
    label: 'Mary Smith — karmic debt 19/1 path, master birthday absent',
    fullName: 'Mary Smith',
    dob: { year: 1990, month: 7, day: 28 },
    expected: {
      lifePath: { compound: 9, reduced: 9 },
      expression: { compound: 9, reduced: 9 },
      soulUrge: { compound: 17, reduced: 8 },
      personality: { compound: 10, reduced: 1 },
      birthday: { compound: 28, reduced: 1 },
      karmicLessons: [3, 5, 6],
      pinnacles: {
        first: { compound: 8, reduced: 8 },
        second: { compound: 2, reduced: 2 },
        third: { compound: 10, reduced: 1 },
        fourth: { compound: 8, reduced: 8 },
        ageBoundaries: [27, 36, 45],
      },
      challenges: {
        first: { compound: 6, reduced: 6 },
        second: { compound: 0, reduced: 0 },
        third: { compound: 6, reduced: 6 },
        fourth: { compound: 6, reduced: 6 },
      },
    },
  },
  /*
   * John Lennon (John Winston Lennon, 1940-10-09)
   *  m=10→1, d=9, y=1940→14→5; sum=1+9+5=15→6
   *  Birthday: 9
   *  Expression: JOHN(1+6+8+5=20) + WINSTON(5+9+5+1+2+6+5=33 — master at this token sum, but Expression sums whole name then reduces)
   *    Total letters: 1+6+8+5 + 5+9+5+1+2+6+5 + 3+5+5+5+6+5 = 20 + 33 + 29 = 82 → 10 → 1
   *    Wait LENNON: L=3,E=5,N=5,N=5,O=6,N=5 = 29
   *    Total = 20+33+29 = 82 → 10 → 1
   *  Soul Urge (vowels): JOHN: O=6. WINSTON: I=9, O=6 → 15. LENNON: E=5, O=6 → 11.
   *    Sum = 6 + 15 + 11 = 32 → 5
   *  Personality (consonants): JOHN: J+H+N=1+8+5=14. WINSTON: W+N+S+T+N=5+5+1+2+5=18. LENNON: L+N+N+N=3+5+5+5=18.
   *    Sum = 14+18+18 = 50 → 5
   *  Karmic lessons: digits present in John Winston Lennon:
   *    J=1, O=6, H=8, N=5, W=5, I=9, N=5, S=1, T=2, O=6, N=5, L=3, E=5, N=5, N=5, O=6, N=5
   *    = {1,2,3,5,6,8,9}; missing = {4,7}
   *  Pinnacles (m=1, d=9, y=5; LP=6 single=6):
   *    1st=1+9=10→1; 2nd=9+5=14→5 (karmic debt 14!); 3rd=1+5=6; 4th=1+5=6
   *    boundaries: firstEnd = max(27, 36-6) = 30; [30, 39, 48]
   *  Challenges (single m=1, d=9, y=5):
   *    1st=|1-9|=8; 2nd=|9-5|=4; 3rd=|8-4|=4; 4th=|1-5|=4
   */
  {
    label: 'John Winston Lennon — karmic debt at 2nd pinnacle',
    fullName: 'John Winston Lennon',
    dob: { year: 1940, month: 10, day: 9 },
    expected: {
      lifePath: { compound: 15, reduced: 6 },
      // WN per-part: JOHN 20→2; WINSTON 33→33 (master); LENNON 29→11 (master). 2+33+11=46.
      expression: { compound: 46, reduced: 1 },
      // Vowels: JOHN O=6; WINSTON I+O=15→6; LENNON E+O=11(master). 6+6+11=23.
      soulUrge: { compound: 23, reduced: 5 },
      // Consonants: JOHN J+H+N=14→5; WINSTON W+N+S+T+N=18→9; LENNON L+N+N+N=18→9. 5+9+9=23.
      personality: { compound: 23, reduced: 5 },
      birthday: { compound: 9, reduced: 9 },
      karmicLessons: [4, 7],
      pinnacles: {
        first: { compound: 10, reduced: 1 },
        second: { compound: 14, reduced: 5, karmicDebt: 14 },
        third: { compound: 6, reduced: 6 },
        fourth: { compound: 6, reduced: 6 },
        ageBoundaries: [30, 39, 48],
      },
      challenges: {
        first: { compound: 8, reduced: 8 },
        second: { compound: 4, reduced: 4 },
        third: { compound: 4, reduced: 4 },
        fourth: { compound: 4, reduced: 4 },
      },
    },
  },
  /*
   * Yvonne Tan (1985-03-11)
   *  m=3, d=11(master), y=1985→23→5; sum=3+11+5=19→1 (karmic debt 19!)
   *  Birthday: 11 (master)
   *  Expression: YVONNE: Y(7)+V(4)+O(6)+N(5)+N(5)+E(5)=32. TAN: T(2)+A(1)+N(5)=8.
   *    Total = 32+8 = 40 → 4
   *  Soul Urge (vowels): YVONNE: Y=7 (vowel via override), O=6, E=5 → 18. TAN: A=1.
   *    Sum = 18+1 = 19 → 1 (karmic debt 19!)
   *  Personality (consonants): YVONNE: V+N+N=4+5+5=14. TAN: T+N=2+5=7.
   *    Sum = 14+7 = 21 → 3
   *  Karmic lessons: present {7,4,6,5,2,1}; missing = {3,8,9}
   *  Pinnacles (m=3, d=11, y=5; LP=1 single=1):
   *    1st=3+11=14→5 (kd14!); 2nd=11+5=16→7 (kd16!); 3rd=5+7=12→3; 4th=3+5=8
   *    firstEnd=max(27, 36-1)=35; boundaries=[35,44,53]
   *  Challenges (single m=3, d=2 since 11→2, y=5):
   *    1st=|3-2|=1; 2nd=|2-5|=3; 3rd=|1-3|=2; 4th=|3-5|=2
   */
  {
    label: 'Yvonne Tan — Y as vowel, master birthday, karmic debt 19 life path',
    fullName: 'Yvonne Tan',
    dob: { year: 1985, month: 3, day: 11 },
    expected: {
      lifePath: { compound: 19, reduced: 1, karmicDebt: 19 },
      // WN per-part: YVONNE 32→5; TAN 8. Sum 5+8=13 (karmic 13!).
      expression: { compound: 13, reduced: 4, karmicDebt: 13 },
      // Vowels: YVONNE Y+O+E=18→9; TAN A=1. Sum 9+1=10. (Old straight-sum
      // would give 19/karmic; per WN's per-part method, no karmic here.)
      soulUrge: { compound: 10, reduced: 1 },
      // Consonants: YVONNE V+N+N=14→5; TAN T+N=7. Sum 5+7=12.
      personality: { compound: 12, reduced: 3 },
      birthday: { compound: 11, reduced: 11, isMaster: true },
      karmicLessons: [3, 8, 9],
      pinnacles: {
        first: { compound: 14, reduced: 5, karmicDebt: 14 },
        second: { compound: 16, reduced: 7, karmicDebt: 16 },
        third: { compound: 12, reduced: 3 },
        fourth: { compound: 8, reduced: 8 },
        ageBoundaries: [35, 44, 53],
      },
      challenges: {
        first: { compound: 1, reduced: 1 },
        second: { compound: 3, reduced: 3 },
        third: { compound: 2, reduced: 2 },
        fourth: { compound: 2, reduced: 2 },
      },
    },
  },
  /*
   * Bryan Lee (2000-02-29) — leap-year, Y as vowel in middle position
   *  m=2, d=29→11(master), y=2000→2; sum=2+11+2=15→6
   *  Birthday: 29 → 11 (master)
   *  Expression: BRYAN: B(2)+R(9)+Y(7)+A(1)+N(5)=24. LEE: L(3)+E(5)+E(5)=13.
   *    Total = 24+13 = 37 → 10 → 1
   *  Soul Urge (vowels): BRYAN: Y=7 (vowel via override), A=1 → 8. LEE: E+E=5+5=10.
   *    Sum = 8+10 = 18 → 9
   *  Personality (consonants): BRYAN: B+R+N=2+9+5=16. LEE: L=3.
   *    Sum = 16+3 = 19 → 1 (karmic debt 19!)
   *  Karmic lessons: present {2,9,7,1,5,3}; missing = {4,6,8}
   *  Pinnacles (m=2, d=11, y=2; LP=6 single=6):
   *    1st=2+11=13→4 (kd13!); 2nd=11+2=13→4 (kd13!); 3rd=4+4=8; 4th=2+2=4
   *    firstEnd=max(27, 36-6)=30; [30,39,48]
   *  Challenges (single m=2, d=2 since 29→11→2, y=2):
   *    1st=|2-2|=0; 2nd=|2-2|=0; 3rd=|0-0|=0; 4th=|2-2|=0  (very rare — all-zero challenges)
   */
  {
    label: 'Bryan Lee — leap-year birthday master, double karmic debt pinnacles',
    fullName: 'Bryan Lee',
    dob: { year: 2000, month: 2, day: 29 },
    expected: {
      lifePath: { compound: 15, reduced: 6 },
      // WN per-part: BRYAN 24→6; LEE 13→4. Sum 6+4=10.
      expression: { compound: 10, reduced: 1 },
      // Vowels: BRYAN Y+A=8; LEE E+E=10→1. Sum 8+1=9.
      soulUrge: { compound: 9, reduced: 9 },
      // Consonants: BRYAN B+R+N=16→7; LEE L=3. Sum 7+3=10. (Old straight-sum
      // gave 19/karmic; per WN's per-part method, no karmic.)
      personality: { compound: 10, reduced: 1 },
      birthday: { compound: 29, reduced: 11, isMaster: true },
      karmicLessons: [4, 6, 8],
      pinnacles: {
        first: { compound: 13, reduced: 4, karmicDebt: 13 },
        second: { compound: 13, reduced: 4, karmicDebt: 13 },
        third: { compound: 8, reduced: 8 },
        fourth: { compound: 4, reduced: 4 },
        ageBoundaries: [30, 39, 48],
      },
      challenges: {
        first: { compound: 0, reduced: 0 },
        second: { compound: 0, reduced: 0 },
        third: { compound: 0, reduced: 0 },
        fourth: { compound: 0, reduced: 0 },
      },
    },
  },
  /*
   * Dany Pratama (1992-11-22) — name "Dany" should resolve Y as vowel
   *  m=11(master), d=22(master), y=1992→21→3; sum=11+22+3=36→9
   *  Birthday: 22 (master)
   *  Expression: DANY: D(4)+A(1)+N(5)+Y(7)=17. PRATAMA (P-R-A-T-A-M-A, 7 letters): P(7)+R(9)+A(1)+T(2)+A(1)+M(4)+A(1)=25.
   *    Total = 17+25 = 42 → 6
   *  Soul Urge (vowels): DANY: A=1, Y=7 (vowel via override) → 8. PRATAMA: A+A+A=3.
   *    Sum = 8+3 = 11 → 2 (master)
   *  Personality (consonants): DANY: D+N=4+5=9. PRATAMA: P+R+T+M=7+9+2+4=22.
   *    Sum = 9+22 = 31 → 4
   *  Karmic lessons: present {4,1,5,7,9,2}; missing = {3,6,8}
   *  Pinnacles (m=11, d=22, y=3; LP=9 single=9):
   *    1st=11+22=33→33 (master!); 2nd=22+3=25→7; 3rd=33+7=40→4; 4th=11+3=14→5 (kd14!)
   *    firstEnd=max(27, 36-9)=27; [27,36,45]
   *  Challenges (single m=2 since 11→2, d=4 since 22→4, y=3):
   *    1st=|2-4|=2; 2nd=|4-3|=1; 3rd=|2-1|=1; 4th=|2-3|=1
   */
  {
    label: 'Dany Pratama — double-master DOB, Y-as-vowel in Dany',
    fullName: 'Dany Pratama',
    dob: { year: 1992, month: 11, day: 22 },
    expected: {
      lifePath: { compound: 36, reduced: 9 },
      // WN per-part: DANY 17→8; PRATAMA 25→7. Sum 8+7=15.
      expression: { compound: 15, reduced: 6 },
      // Vowels: DANY A+Y=8; PRATAMA A+A+A=3. Sum 11 (master).
      soulUrge: { compound: 11, reduced: 11, isMaster: true },
      // Consonants: DANY D+N=9; PRATAMA P+R+T+M=22 (master). Sum 9+22=31.
      personality: { compound: 31, reduced: 4 },
      birthday: { compound: 22, reduced: 22, isMaster: true },
      karmicLessons: [3, 6, 8],
      pinnacles: {
        first: { compound: 33, reduced: 33, isMaster: true },
        second: { compound: 25, reduced: 7 },
        third: { compound: 40, reduced: 4 },
        fourth: { compound: 14, reduced: 5, karmicDebt: 14 },
        ageBoundaries: [27, 36, 45],
      },
      challenges: {
        first: { compound: 2, reduced: 2 },
        second: { compound: 1, reduced: 1 },
        third: { compound: 1, reduced: 1 },
        fourth: { compound: 1, reduced: 1 },
      },
    },
  },
];
