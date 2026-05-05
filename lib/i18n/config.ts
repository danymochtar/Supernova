// EN was removed for now — Indonesian-only. The Locale type stays as the
// union 'id' | 'en' so call sites that pass `locale: 'id' | 'en'` to AI
// prompts and helpers don't need code churn when EN is reintroduced.
// Middleware uses `locales` (id-only), so any `/en/*` URL will be rewritten
// to `/id/*` before reaching the page.
export const locales = ['id'] as const;
export type Locale = 'id' | 'en';
export const defaultLocale = 'id' as const;

export function isLocale(value: string): value is Locale {
  return value === 'id' || value === 'en';
}
