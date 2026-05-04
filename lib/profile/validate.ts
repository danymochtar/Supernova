import { z } from 'zod';

const NAME_PART_REGEX = /^[\p{L}\p{M}'\-.\s]+$/u;

export const profileFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'name_required')
    .max(60, 'name_too_long')
    .regex(NAME_PART_REGEX, 'name_invalid_chars'),
  middleName: z
    .string()
    .trim()
    .max(60, 'name_too_long')
    .regex(NAME_PART_REGEX, 'name_invalid_chars')
    .optional()
    .or(z.literal('')),
  lastName: z
    .string()
    .trim()
    .max(60, 'name_too_long')
    .regex(NAME_PART_REGEX, 'name_invalid_chars')
    .optional()
    .or(z.literal('')),
  /** Optional nickname / call-by name. Letters + spaces + a few punctuation,
   * up to 40 chars. Used for Minor numbers calculation. */
  nickname: z
    .string()
    .trim()
    .max(40, 'name_too_long')
    .regex(NAME_PART_REGEX, 'name_invalid_chars')
    .optional()
    .or(z.literal('')),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dob_format'),
  timezone: z.string().min(1),
  locale: z.string().min(2),
});

export type ProfileFormError =
  | 'invalid_name'
  | 'invalid_dob'
  | 'future_dob'
  | 'invalid_timezone'
  | 'generic';

export interface ParsedProfileForm {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  nickname: string | null;
  dob: { year: number; month: number; day: number };
  timezone: string;
  locale: string;
}

/** Validate raw form fields and return either parsed data or a stable error code. */
export function parseProfileForm(input: {
  firstName: unknown;
  middleName: unknown;
  lastName: unknown;
  nickname?: unknown;
  dob: unknown;
  timezone: unknown;
  locale: unknown;
}): { ok: true; data: ParsedProfileForm } | { ok: false; error: ProfileFormError } {
  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (
      path === 'firstName' ||
      path === 'lastName' ||
      path === 'middleName' ||
      path === 'nickname'
    ) {
      return { ok: false, error: 'invalid_name' };
    }
    if (path === 'dob') return { ok: false, error: 'invalid_dob' };
    return { ok: false, error: 'generic' };
  }

  const { firstName, middleName, lastName, nickname, dob, timezone, locale } = parsed.data;
  const [yStr, mStr, dStr] = dob.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return { ok: false, error: 'invalid_dob' };
  }
  const validate = new Date(Date.UTC(year, month - 1, day));
  if (
    validate.getUTCFullYear() !== year ||
    validate.getUTCMonth() !== month - 1 ||
    validate.getUTCDate() !== day
  ) {
    return { ok: false, error: 'invalid_dob' };
  }
  if (validate.getTime() > Date.now()) return { ok: false, error: 'future_dob' };

  return {
    ok: true,
    data: {
      firstName,
      middleName: middleName && middleName.length > 0 ? middleName : null,
      lastName: lastName && lastName.length > 0 ? lastName : null,
      nickname: nickname && nickname.length > 0 ? nickname : null,
      dob: { year, month, day },
      timezone,
      locale,
    },
  };
}
