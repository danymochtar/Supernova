/**
 * Goodwin's four-name cap. From Matthew Oliver Goodwin, *Numerology: The
 * Complete Guide* (1981, Vol. 1, p. 15): a birth name with more than four
 * parts gives a diffuse, low-signal reading; use only the first and last
 * parts. This applies to long Arab patronymic names, classical Spanish
 * compound names, etc. Pure helper so the cap is auditable independently
 * of where it's wired in.
 */
export function applyGoodwinCap(parts: string[]): string[] {
  if (parts.length <= 4) return parts;
  return [parts[0]!, parts[parts.length - 1]!];
}
