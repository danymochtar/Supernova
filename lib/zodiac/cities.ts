/**
 * City search + resolution for the birth-place picker. Backed by the
 * `city-timezones` dataset (~14K world cities with name, country,
 * lat/lon, and IANA timezone).
 *
 * Server-only — the dataset is ~2 MB and would bloat any client bundle
 * that imports it. The search endpoint at `/api/zodiac/cities/search`
 * lives behind this module, and the form component talks to that
 * endpoint instead of importing here directly.
 */

import cityTimezones from 'city-timezones';

export interface CityRecord {
  /** Canonical name as it appears in the dataset (e.g. "Surabaya"). */
  name: string;
  /** Country name. */
  country: string;
  /** Province / state, if known. */
  province: string | null;
  lat: number;
  lon: number;
  /** IANA timezone (e.g. "Asia/Jakarta"). */
  timezone: string;
  /** Display label for the picker: "Surabaya, Jawa Timur, Indonesia". */
  label: string;
  /** Population (used for ranking — bigger cities first). */
  population: number;
}

// city-timezones types: { city, city_ascii, lat, lng, pop, country, iso2,
// iso3, province, timezone }
interface RawCity {
  city: string;
  city_ascii: string;
  lat: number;
  lng: number;
  pop: number;
  country: string;
  iso2: string;
  iso3: string;
  province: string;
  timezone: string;
}

function toRecord(c: RawCity): CityRecord {
  const province = c.province && c.province !== c.city ? c.province : null;
  const label = [c.city, province, c.country].filter(Boolean).join(', ');
  return {
    name: c.city,
    country: c.country,
    province: province || null,
    lat: c.lat,
    lon: c.lng,
    timezone: c.timezone,
    label,
    population: c.pop || 0,
  };
}

const ALL_CITIES = (cityTimezones.cityMapping as RawCity[] | undefined) ?? [];

/**
 * Search cities by free-text query. Matches a case-insensitive
 * substring against the city name or the "city, province, country"
 * label. Ranks by population (bigger cities first) and caps to
 * `limit` results so the autocomplete dropdown stays scannable.
 *
 * Empty / whitespace-only query returns an empty list — the picker
 * shouldn't preload anything before the user types.
 */
export function searchCities(query: string, limit = 10): CityRecord[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const matches: CityRecord[] = [];
  // Linear scan over ~14K entries — well under 10ms in practice. A
  // prefix index would be faster but the savings aren't worth the
  // complexity here (the endpoint is debounced + capped to 10).
  for (const raw of ALL_CITIES) {
    if (!raw || !raw.city || !raw.timezone) continue;
    const cityLower = raw.city.toLowerCase();
    const provinceLower = (raw.province || '').toLowerCase();
    const countryLower = (raw.country || '').toLowerCase();
    if (
      cityLower.includes(q) ||
      provinceLower.includes(q) ||
      countryLower.includes(q)
    ) {
      matches.push(toRecord(raw));
    }
  }
  // Sort by population descending, then alphabetically as a tiebreak.
  matches.sort((a, b) => b.population - a.population || a.name.localeCompare(b.name));
  return matches.slice(0, limit);
}

/**
 * Look up the city record by exact label (the form passes the user's
 * selected `label` back so we can re-resolve lat/lon/timezone server-
 * side without trusting client-submitted coords). Returns `null` if
 * the label doesn't match — caller falls back to "no city" semantics.
 */
export function resolveCityByLabel(label: string): CityRecord | null {
  const target = label.trim();
  if (!target) return null;
  for (const raw of ALL_CITIES) {
    if (!raw || !raw.city) continue;
    const r = toRecord(raw);
    if (r.label === target) return r;
  }
  return null;
}
