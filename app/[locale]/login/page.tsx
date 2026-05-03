import { LoginForm } from '@/components/auth/LoginForm';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { notFound } from 'next/navigation';

export default function LoginPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return (
    <main className="container flex min-h-screen flex-col items-center justify-center">
      <LoginForm locale={params.locale as Locale} />
    </main>
  );
}
