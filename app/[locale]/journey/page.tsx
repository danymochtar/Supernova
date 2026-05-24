import { redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';

// The journey content merged into the "Kehidupan" tab (Perjalanan
// sub-view). Keep this stub so any lingering /journey link (warm tab,
// bookmark) lands on the new home instead of 404-ing.
export default function JourneyRedirect({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : 'id';
  redirect(`/${locale}/kehidupan?tab=perjalanan`);
}
