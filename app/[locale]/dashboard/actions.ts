'use server';

import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { getOrGenerateDailyReading } from '@/lib/ai/dailyReading';

export type GenerateResult =
  | { ok: true; body: string; cached: boolean }
  | { ok: false; error: 'unauth' | 'no_profile' | 'ai_failed' };

export async function generateDailyReading(): Promise<GenerateResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return { ok: false, error: 'no_profile' };

  const body = await getOrGenerateDailyReading(session.user.id, profile);
  if (!body) return { ok: false, error: 'ai_failed' };
  return { ok: true, body, cached: false };
}
