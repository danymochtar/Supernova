/**
 * One-shot backfill of birth-chart fields for legacy Person rows.
 *
 * A user's older People (added before the smart-defaults change) were
 * saved with null birthTime + null birthLat/Lon, which meant moon +
 * rising rendered as "Belum diisi" forever unless the user manually
 * edited each row. This helper applies the same server-side smart
 * defaults used at create-time (`smartDefaults.ts`) and computes moon +
 * rising for anyone whose birth chart is empty.
 *
 * Called from the People list page load — cheap enough to run every
 * visit (the map is skipped entirely when there's nothing to backfill).
 */

import type { PersonView } from '@/lib/db/repositories/person';
import { updatePerson } from '@/lib/db/repositories/person';
import { computeMoonAndRising } from '@/lib/zodiac/birthChart';
import {
  SUGGESTED_BIRTH_TIME,
  guessBirthCityFromName,
} from '@/lib/people/smartDefaults';

/**
 * A row is "empty" (backfillable) when the user never entered any
 * birth-chart data at all. If they cleared any field intentionally,
 * we leave the row alone — respecting the user's intent trumps
 * convenience.
 */
function isEmpty(p: PersonView): boolean {
  return (
    p.birthTime == null &&
    p.birthLat == null &&
    p.birthLon == null &&
    p.birthCity == null &&
    p.moonSign == null &&
    p.risingSign == null
  );
}

export async function backfillBirthCharts(
  userId: string,
  people: readonly PersonView[],
  activeLocale: string,
  userTimezone: string,
): Promise<PersonView[]> {
  const targets = people.filter(isEmpty);
  if (targets.length === 0) return [...people];

  const updated = new Map<string, PersonView>();

  await Promise.all(
    targets.map(async (p) => {
      const guess = guessBirthCityFromName(p.fullName, activeLocale);
      const birthTime = SUGGESTED_BIRTH_TIME;
      const birthTimezone = guess?.timezone ?? userTimezone;
      const birthCity = guess?.label ?? null;
      const birthLat = guess?.lat ?? null;
      const birthLon = guess?.lon ?? null;

      const { moon, rising } = computeMoonAndRising({
        year: p.dob.year,
        month: p.dob.month,
        day: p.dob.day,
        birthTime,
        timezone: birthTimezone,
        lat: birthLat ?? undefined,
        lon: birthLon ?? undefined,
      });

      const row = await updatePerson(userId, p.id, {
        firstName: p.firstName,
        middleName: p.middleName,
        lastName: p.lastName,
        nickname: p.nickname,
        dob: p.dob,
        relationship: p.relationship,
        notes: p.notes,
        birthTime,
        birthTimezone,
        birthCity,
        birthLat,
        birthLon,
        moonSign: moon,
        risingSign: rising,
      });
      if (row) updated.set(row.id, row);
    }),
  );

  return people.map((p) => updated.get(p.id) ?? p);
}
