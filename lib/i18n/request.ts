import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { isLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  if (!isLocale(locale)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
