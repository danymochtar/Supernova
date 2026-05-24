import type { Relationship } from '@prisma/client';
import { encryptJson, decryptJson } from '@/lib/crypto/aes';
import { auth } from '@/lib/auth/server';
import { listPeople } from '@/lib/db/repositories/person';

/**
 * Knowledge-based account recovery (no email).
 *
 * The user proves identity by naming the people they've already saved
 * (partner, parent, …). Names of close relations are more private and harder
 * to guess than a name + date-of-birth (which aren't secrets), so this is the
 * gate that protects the confidential journal/curhat data behind the account.
 *
 * Hardening (product-approved tradeoffs):
 *  - MIN_QUESTIONS distinct relationship types must exist, else recovery is
 *    refused outright — there is deliberately no weak name+DOB fallback.
 *  - ALL questions must be answered correctly (no partial pass).
 *  - The verify step is rate-limited per user via the DB RateLimit bucket.
 *  - The challenge is carried in an AES-256-GCM envelope (authenticated
 *    encryption) so the client can neither read nor tamper with which
 *    questions it must answer.
 */

export const MIN_QUESTIONS = 3; // distinct relationship types required to qualify
export const MAX_QUESTIONS = 4; // cap so the form stays short
export const TOKEN_TTL_MS = 15 * 60 * 1000; // time allowed to answer
export const MAX_ATTEMPTS = 5; // verify attempts per UTC day before lockout

export interface RecoveryChallenge {
  token: string;
  slots: Relationship[];
}

interface TokenPayload {
  userId: string;
  slots: Relationship[];
  exp: number;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics so "José" === "Jose"
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Resolve a userId from an email without leaking existence to callers. */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const ctx = await auth.$context;
  const res = await ctx.internalAdapter.findUserByEmail(email);
  return res?.user?.id ?? null;
}

/**
 * Build a challenge from the user's saved people. Returns null when there
 * isn't enough distinct data to form a meaningful (MIN_QUESTIONS) challenge —
 * the caller surfaces this as a generic "can't recover this way" so the
 * outcome is indistinguishable from a non-existent account.
 */
export async function buildChallenge(userId: string): Promise<RecoveryChallenge | null> {
  const people = await listPeople(userId);
  const seen = new Set<Relationship>();
  const slots: Relationship[] = [];
  // listPeople is already sorted closest-relationship-first.
  for (const p of people) {
    if (!seen.has(p.relationship)) {
      seen.add(p.relationship);
      slots.push(p.relationship);
    }
  }
  if (slots.length < MIN_QUESTIONS) return null;

  const chosen = slots.slice(0, MAX_QUESTIONS);
  const payload: TokenPayload = { userId, slots: chosen, exp: Date.now() + TOKEN_TTL_MS };
  return { token: encryptJson(payload), slots: chosen };
}

/** Decrypt + validate a challenge token. Returns null if forged/expired. */
export function readChallenge(token: string): TokenPayload | null {
  try {
    const p = decryptJson<TokenPayload>(token);
    if (
      !p ||
      typeof p.userId !== 'string' ||
      !Array.isArray(p.slots) ||
      typeof p.exp !== 'number'
    ) {
      return null;
    }
    if (Date.now() > p.exp) return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * Verify the answers against the user's saved people. Each slot is a
 * relationship type; an answer is correct when it matches (case- and
 * diacritic-insensitive) the first name, nickname, last name, or full name of
 * ANY person the user saved under that relationship. Every slot must pass.
 */
export async function verifyAnswers(
  userId: string,
  slots: Relationship[],
  answers: string[],
): Promise<boolean> {
  if (answers.length !== slots.length) return false;

  const people = await listPeople(userId);
  const byRelationship = new Map<Relationship, Set<string>>();
  for (const p of people) {
    const names = [p.firstName, p.nickname, p.lastName, p.fullName]
      .filter((x): x is string => Boolean(x && x.trim()))
      .map(normalize);
    const set = byRelationship.get(p.relationship) ?? new Set<string>();
    for (const n of names) set.add(n);
    byRelationship.set(p.relationship, set);
  }

  for (let i = 0; i < slots.length; i++) {
    const answer = normalize(answers[i] ?? '');
    if (!answer) return false;
    const valid = byRelationship.get(slots[i] as Relationship);
    if (!valid || !valid.has(answer)) return false;
  }
  return true;
}

/**
 * Set a new password for the user using Better Auth's own hasher + adapter, so
 * the credential verifies on the normal sign-in path. Also revokes existing
 * sessions — a forgot-password reset should evict any lurking session.
 */
export async function setUserPassword(userId: string, newPassword: string): Promise<void> {
  const ctx = await auth.$context;
  const accounts = await ctx.internalAdapter.findAccounts(userId);
  const credential = accounts.find((a) => a.providerId === 'credential');
  const passwordHash = await ctx.password.hash(newPassword);

  if (credential) {
    await ctx.internalAdapter.updateAccount(credential.id, { password: passwordHash });
  } else {
    await ctx.internalAdapter.linkAccount({
      userId,
      providerId: 'credential',
      accountId: userId,
      password: passwordHash,
    });
  }

  await ctx.internalAdapter.deleteSessions(userId);
}
