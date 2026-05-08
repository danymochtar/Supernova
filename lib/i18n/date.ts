import type { Locale } from './config';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonthShort(d: Date | null, locale: Locale): string {
  if (!d) return '';
  const months = locale === 'id' ? MONTHS_ID : MONTHS_EN;
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
