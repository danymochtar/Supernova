// Locale union + type aliases. Sourced from the registry in ./locales —
// adding a new language only requires editing that file. Middleware reads
// `locales` (the enabled tuple); pages and AI prompts read `Locale`.
import { DEFAULT_LOCALE, LOCALE_CODES, isLocaleCode } from './locales';

export const locales = LOCALE_CODES;
export type Locale = (typeof LOCALE_CODES)[number];
export const defaultLocale = DEFAULT_LOCALE;

export function isLocale(value: string): value is Locale {
  return isLocaleCode(value);
}
