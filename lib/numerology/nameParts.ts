/**
 * Goodwin's four-name cap. From Matthew Oliver Goodwin, *Numerology: The
 * Complete Guide* (1981, Vol. 1, p. 15): a birth name with more than four
 * parts gives a diffuse, low-signal reading; use only the first and last
 * parts. Applies to long Arab patronymic names, classical Spanish compound
 * names, etc.
 */
export function applyGoodwinCap(parts: string[]): string[] {
  if (parts.length <= 4) return parts;
  return [parts[0]!, parts[parts.length - 1]!];
}

/**
 * Canonical name tokenization for every letter-iterating calculation in the
 * engine: strip diacritics via NFD, split on whitespace, then apply
 * Goodwin's 4-name cap. Used by Expression / Soul Urge / Personality
 * (via core.ts), Karmic Lessons, and Talent Distribution so every
 * downstream calculation reads the same set of letters for a given user.
 */
export function nameTokens(fullName: string): string[] {
  const parts = fullName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  return applyGoodwinCap(parts);
}
