import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './server';
import type { Locale } from '@/lib/i18n/config';

/**
 * Server-side session lookup. Throws by redirect if no session.
 *
 * Use inside route handlers, server actions, and server components that
 * require an authenticated user.
 */
export async function requireSession(locale: Locale = 'id') {
  const session = await auth.api.getSession({ headers: headers() });
  if (!session) {
    redirect(`/${locale}/login`);
  }
  return session;
}

/** Same as `requireSession` but returns null instead of redirecting. */
export async function getSession() {
  return auth.api.getSession({ headers: headers() });
}
