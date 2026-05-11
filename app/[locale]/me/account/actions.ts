'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { APIError } from 'better-auth/api';
import { auth } from '@/lib/auth/server';

export type AccountActionResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | 'unauth'
        | 'invalid'
        | 'wrong_password'
        | 'email_taken'
        | 'same_email'
        | 'weak_password'
        | 'generic';
    };

const emailSchema = z.object({
  newEmail: z.string().trim().email().max(200),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: 'reuse',
    path: ['newPassword'],
  });

export async function changeEmailAction(input: {
  newEmail: string;
}): Promise<AccountActionResult> {
  const parsed = emailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  try {
    await auth.api.changeEmail({
      body: { newEmail: parsed.data.newEmail },
      headers: headers(),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof APIError) {
      const msg = err.message ?? '';
      if (/same/i.test(msg)) return { ok: false, error: 'same_email' };
      if (err.status === 'UNAUTHORIZED') return { ok: false, error: 'unauth' };
      if (err.status === 'BAD_REQUEST') return { ok: false, error: 'invalid' };
    }
    console.error('[account] changeEmail failed', err);
    return { ok: false, error: 'generic' };
  }
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<AccountActionResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path?.includes('newPassword')) {
      return { ok: false, error: 'weak_password' };
    }
    return { ok: false, error: 'invalid' };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: headers(),
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof APIError) {
      const msg = (err.message ?? '').toLowerCase();
      if (msg.includes('invalid') || msg.includes('incorrect')) {
        return { ok: false, error: 'wrong_password' };
      }
      if (err.status === 'UNAUTHORIZED') return { ok: false, error: 'unauth' };
    }
    console.error('[account] changePassword failed', err);
    return { ok: false, error: 'generic' };
  }
}
