/**
 * Strip recognized honorifics + post-nominals from a name part. Hans Decoz is
 * explicit that titles aren't part of the birth-certificate vibration ("Do not
 * enter initials, prefixes or suffixes, such as Jr., Dr., or III"); same
 * principle holds for Indonesian/Arab academic + religious titles. Patronymic
 * particles (bin, binti, von, van, de, ap, Mc, Mac, O') are NOT stripped —
 * they are integral name elements and contribute real letters.
 */

// Honorific tokens — case-insensitive, period-optional, word-boundary anchored.
// Listed without trailing periods; the regex below tolerates them.
const HONORIFICS = [
  // English titles
  'Dr',
  'Mr',
  'Mrs',
  'Ms',
  'Mx',
  'Prof',
  'Sir',
  'Dame',
  'Rev',
  'Fr',
  'Br',
  'Sr',
  'Jr',
  'II',
  'III',
  'IV',
  'Esq',
  'PhD',
  'MD',
  'BSc',
  'MA',
  'MSc',
  'MBA',
  // Indonesian academic + religious
  'Drs',
  'Dra',
  'Ir',
  'KH',
  'Tuan',
  'Nyonya',
  'Nona',
  // Single-letter Indonesian religious markers (Hajj/Hajjah) — only when
  // standalone, never as part of a real given name like "H. Sabri". The
  // regex \\b anchors handle this.
  'H',
  'Hj',
  'Hjh',
];

// Multi-letter Indonesian degree post-nominals with internal periods, e.g.
// "S.H." (Sarjana Hukum). Treated as one unit so we don't mistakenly leave
// a stray "H" behind.
const DOTTED_POSTNOMINALS = [
  'S.H',
  'S.E',
  'S.T',
  'S.Pd',
  'S.Kom',
  'S.Sos',
  'S.Psi',
  'S.Si',
  'S.Ag',
  'M.Si',
  'M.Pd',
  'M.Kom',
  'M.Sc',
  'M.B.A',
  'M.A',
];

// Escape regex metachars in the token list.
function esc(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// One alternation that matches any honorific OR dotted post-nominal, allowing
// a trailing period. Lookbehind/lookahead anchor each match to a word boundary
// that tolerates the period: must be preceded by start/space/comma and
// followed by space/comma/end. Prevents matching embedded "Dr" inside
// "Drsila" or "drama".
const STRIP_RE = new RegExp(
  `(?<=^|[\\s,])(?:${[...DOTTED_POSTNOMINALS, ...HONORIFICS].map(esc).join('|')})\\.?(?=[\\s,]|$)`,
  'gi',
);

export interface SanitizeResult {
  /** The name part with recognized honorifics removed and whitespace collapsed. */
  cleaned: string;
  /** Tokens that were stripped, in input order, so the UI can show a toast
   *  ("we dropped Dr., Hj. from the calculation"). */
  stripped: string[];
}

export function sanitizeNamePart(raw: string): SanitizeResult {
  const stripped: string[] = [];
  const cleaned = raw
    .replace(STRIP_RE, (match) => {
      stripped.push(match);
      return ' ';
    })
    .replace(/\s+/g, ' ')
    .trim();
  return { cleaned, stripped };
}
