/**
 * Curated timezone list for the onboarding picker. SEA-first, then a small
 * global selection. Users can paste an IANA tz name not in the list via the
 * "other" option later.
 */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'Asia/Jakarta', label: 'Jakarta / Bangkok (WIB, UTC+7)' },
  { value: 'Asia/Makassar', label: 'Makassar / Bali (WITA, UTC+8)' },
  { value: 'Asia/Jayapura', label: 'Jayapura (WIT, UTC+9)' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (UTC+8)' },
  { value: 'Asia/Manila', label: 'Manila (UTC+8)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh City (UTC+7)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { value: 'Europe/London', label: 'London (UTC+0/+1)' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)' },
  { value: 'America/New_York', label: 'New York (UTC-5/-4)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8/-7)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)' },
];

export function isValidTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
