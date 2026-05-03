'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/requireSession';
import { isLocale, type Locale } from '@/lib/i18n/config';

/**
 * Switch the user's locale and reset everything that depended on the old one.
 * Wipes NumerologyCache so the AI-synthesized About Me regenerates in the
 * new language. Daily readings stay (they're date-keyed); chat history stays
 * (the chatbot mirrors the user's writing language regardless).
 */
export async function setLocale(next: string): Promise<void> {
  if (!isLocale(next)) return;
  const session = await getSession();
  if (!session) {
    redirect(`/${next as Locale}/login`);
  }

  await prisma.profile.update({
    where: { userId: session.user.id },
    data: { locale: next },
  });
  await prisma.numerologyCache.deleteMany({ where: { userId: session.user.id } });

  revalidatePath('/', 'layout');
  redirect(`/${next as Locale}/dashboard`);
}
