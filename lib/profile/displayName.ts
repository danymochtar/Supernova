/**
 * The name to use when addressing or referring to a person in UI prose
 * + AI prompts. Falls back: nickname → firstName.
 *
 * Why a helper: every surface that shows the user a person's name has
 * to follow the same rule, otherwise prose feels inconsistent ("Sabri"
 * in one card, "Sabri Bin Basri" in another). Keep it in one place.
 *
 * NOT for numerology math — calculations always use the full legal
 * name (`fullName`) which is the basis of Pythagorean letter math.
 */
export function displayName(p: { nickname?: string | null; firstName: string }): string {
  const nick = p.nickname?.trim();
  return nick && nick.length > 0 ? nick : p.firstName;
}
