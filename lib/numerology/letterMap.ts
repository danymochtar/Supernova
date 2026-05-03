/**
 * Pythagorean letter map. Locked.
 * A=1 B=2 C=3 D=4 E=5 F=6 G=7 H=8 I=9
 * J=1 K=2 L=3 M=4 N=5 O=6 P=7 Q=8 R=9
 * S=1 T=2 U=3 V=4 W=5 X=6 Y=7 Z=8
 */
export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

export const PURE_VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
export const CONSONANTS_EXCLUDING_Y = new Set([
  'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Z',
]);

export function letterValue(letter: string): number {
  const v = LETTER_VALUES[letter.toUpperCase()];
  return v ?? 0;
}
