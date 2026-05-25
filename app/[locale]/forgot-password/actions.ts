'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import type { Relationship } from '@prisma/client';
import { checkAndIncrement } from '@/lib/db/repositories/rateLimit';
import {
  buildChallenge,
  findUserIdByEmail,
  readChallenge,
  setUserPassword,
  verifyAnswers,
  MAX_ATTEMPTS,
} from '@/lib/auth/recovery';

export type StartResult =
  | { ok: true; available: true; token: string; slots: Relationship[] }
  | { ok: true; available: false }
  | { ok: false; error: 'rate' | 'generic' };

const startSchema = z.object({ email: z.string().email().max(320) });

/**
 * Best-effort in-memory IP throttle for the lookup step. The real
 * brute-force gate is the DB-backed per-user limit on the verify step; this
 * just slows a single instance from being hammered for account enumeration.
 * On serverless it's per-instance and resets on cold start — intentionally a
 * soft guard, not the primary control.
 */
const ipHits = new Map<string, { count: number; resetAt: number }>();
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX = 20;

function ipThrottled(): boolean {
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const cur = ipHits.get(ip);
  if (!cur || now > cur.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return false;
  }
  cur.count += 1;
  return cur.count > IP_MAX;
}

export async function startRecovery(input: { email: string }): Promise<StartResult> {
  const parsed = startSchema.safeParse(input);
  // Uniform "unavailable" for bad input, unknown account, and sparse data so
  // callers can't distinguish the cases (anti-enumeration).
  if (!parsed.success) return { ok: true, available: false };
  if (ipThrottled()) return { ok: false, error: 'rate' };

  try {
    const userId = await findUserIdByEmail(parsed.data.email);
    if (!userId) return { ok: true, available: false };

    const challenge = await buildChallenge(userId);
    if (!challenge) return { ok: true, available: false };

    return { ok: true, available: true, token: challenge.token, slots: challenge.slots };
  } catch (err) {
    console.error('[forgot-password] startRecovery failed', err);
    return { ok: false, error: 'generic' };
  }
}

export type ResetResult =
  | { ok: true }
  | { ok: false; error: 'expired' | 'wrong' | 'locked' | 'weak' | 'generic' };

const resetSchema = z.object({
  token: z.string().min(1),
  answers: z.array(z.string().max(120)).min(1).max(8),
  newPassword: z.string().min(8).max(128),
});

export async function submitReset(input: {
  token: string;
  answers: string[];
  newPassword: string;
}): Promise<ResetResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    const len = typeof input?.newPassword === 'string' ? input.newPassword.length : 0;
    return { ok: false, error: len < 8 || len > 128 ? 'weak' : 'generic' };
  }

  const payload = readChallenge(parsed.data.token);
  if (!payload) return { ok: false, error: 'expired' };

  try {
    // Strong brute-force gate keyed to the resolved user. Counts every attempt
    // (right or wrong) so guessing is bounded; locks out for the rest of the day.
    const gate = await checkAndIncrement({
      userId: payload.userId,
      bucket: 'pwreset',
      limit: MAX_ATTEMPTS,
    });
    if (!gate.allowed) return { ok: false, error: 'locked' };

    const verified = await verifyAnswers(payload.userId, payload.slots, parsed.data.answers);
    if (!verified) return { ok: false, error: 'wrong' };

    await setUserPassword(payload.userId, parsed.data.newPassword);
    return { ok: true };
  } catch (err) {
    console.error('[forgot-password] submitReset failed', err);
    return { ok: false, error: 'generic' };
  }
}
