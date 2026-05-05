'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/requireSession';
import { isLocale, type Locale } from '@/lib/i18n/config';

/**
 * Strip a `/id` or `/en` prefix from a pathname so we can re-add the new
 * locale. Returns the suffix beginning with `/` (or `/dashboard` if the
 * input is empty / root).
 */
function stripLocalePrefix(pathname: string | null | undefined): string {
  if (!pathname) return '/dashboard';
  const m = pathname.match(/^\/(?:id|en)(\/.*)?$/);
  const tail = m ? (m[1] ?? '') : pathname;
  return tail.length > 0 ? tail : '/dashboard';
}

/**
 * Switch the user's locale and reset what depended on the old one.
 * Wipes NumerologyCache so the AI-synthesized About Me regenerates. Daily
 * readings auto-regenerate when their stored locale doesn't match the
 * profile's on next read. Chat history stays — the assistant mirrors the
 * user's writing language regardless.
 *
 * Redirects back to the page the user was on, in the new locale, so the
 * toggle feels like an in-place switch rather than a forced jump to /dashboard.
 */
export async function setLocale(next: string, currentPath?: string): Promise<void> {
  if (!isLocale(next)) return;
  const session = await getSession();
  const tail = stripLocalePrefix(currentPath);
  if (!session) {
    redirect(`/${next as Locale}/login`);
  }

  await prisma.profile.update({
    where: { userId: session.user.id },
    data: { locale: next },
  });
  await prisma.numerologyCache.deleteMany({ where: { userId: session.user.id } });

  revalidatePath('/', 'layout');
  redirect(`/${next as Locale}${tail}`);
}
