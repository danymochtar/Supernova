'use server';

import { z } from 'zod';
import { getSession } from '@/lib/auth/requireSession';
import { deleteTurn } from '@/lib/db/repositories/qa';

const schema = z.object({ id: z.string().min(1) });

export type DeleteTurnResult =
  | { ok: true }
  | { ok: false; error: 'unauth' | 'not_found' | 'invalid' };

export async function deleteTurnAction(input: { id: string }): Promise<DeleteTurnResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  const ok = await deleteTurn(session.user.id, parsed.data.id);
  return ok ? { ok: true } : { ok: false, error: 'not_found' };
}
