import type { Locale } from '@/lib/i18n/config';
import { pickLocalized } from '@/lib/i18n/locales';

export type TimeOfDay = 'morning' | 'midday' | 'afternoon' | 'evening' | 'night';

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

// Greeting copy is curated per-locale where we have it; locales without
// an entry fall back to ID via pickLocalized. The translation script
// will fill these in for non-ID locales after generation.
const COPY: Partial<Record<Locale, Record<TimeOfDay, { word: string; greeting: string }>>> = {
  id: {
    morning: { word: 'Pagi', greeting: 'Selamat pagi' },
    midday: { word: 'Siang', greeting: 'Selamat siang' },
    afternoon: { word: 'Sore', greeting: 'Selamat sore' },
    evening: { word: 'Petang', greeting: 'Selamat petang' },
    night: { word: 'Malam', greeting: 'Selamat malam' },
  },
  en: {
    morning: { word: 'Morning', greeting: 'Good morning' },
    midday: { word: 'Midday', greeting: 'Good day' },
    afternoon: { word: 'Afternoon', greeting: 'Good afternoon' },
    evening: { word: 'Evening', greeting: 'Good evening' },
    night: { word: 'Night', greeting: 'Good night' },
  },
};

export function greetingFor(hour: number, locale: Locale): { word: string; greeting: string } {
  return pickLocalized(COPY, locale)[timeOfDay(hour)];
}
