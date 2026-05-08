'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/requireSession';
import { getProfileByUserId } from '@/lib/db/repositories/profile';
import { buildCoreProfile } from '@/lib/numerology';
import { rateVocations, talentDistribution } from '@/lib/numerology/talents';
import { parseResumePdf } from '@/lib/ai/resumeParse';
import {
  deleteAllCareerEntries,
  replaceCareerEntries,
  type CareerInput,
} from '@/lib/db/repositories/career';

const MAX_PDF_BYTES = 8 * 1024 * 1024; // 8 MB raw — comfortable headroom under the 10mb action body cap

export type UploadResumeResult =
  | { ok: true; count: number }
  | { ok: false; error: 'unauth' | 'no_profile' | 'no_file' | 'wrong_type' | 'too_large' | 'parse_failed' | 'no_roles' | 'generic' };

export async function uploadResumeAction(formData: FormData): Promise<UploadResumeResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'unauth' };

  const profile = await getProfileByUserId(session.user.id);
  if (!profile) return { ok: false, error: 'no_profile' };

  const file = formData.get('resume');
  if (!(file instanceof File)) return { ok: false, error: 'no_file' };
  if (file.size === 0) return { ok: false, error: 'no_file' };
  if (file.size > MAX_PDF_BYTES) return { ok: false, error: 'too_large' };
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { ok: false, error: 'wrong_type' };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const base64 = buf.toString('base64');

  const parsed = await parseResumePdf(session.user.id, base64, profile.preferredModel);
  if (!parsed) return { ok: false, error: 'parse_failed' };
  if (parsed.roles.length === 0) return { ok: false, error: 'no_roles' };

  // Score each role against the user's vocation ratings.
  const core = buildCoreProfile(profile.fullName, profile.dob);
  const dist = talentDistribution(profile.fullName, core);
  const ratings = rateVocations(dist.slices);
  const scoreById = new Map(ratings.map((r) => [r.id, r.score]));

  const inputs: CareerInput[] = parsed.roles.map((r) => ({
    title: r.title,
    company: r.company,
    startDate: r.startDate ? new Date(r.startDate) : null,
    endDate: r.endDate ? new Date(r.endDate) : null,
    description: r.summary,
    vocationId: r.vocation,
    matchScore: scoreById.get(r.vocation) ?? 0,
  }));

  try {
    const count = await replaceCareerEntries(session.user.id, inputs);
    revalidatePath('/[locale]/talents/career', 'page');
    return { ok: true, count };
  } catch (err) {
    console.error('[career] persist failed', err);
    return { ok: false, error: 'generic' };
  }
}

export async function deleteAllCareerAction(): Promise<{ ok: boolean }> {
  const session = await getSession();
  if (!session) return { ok: false };
  await deleteAllCareerEntries(session.user.id);
  revalidatePath('/[locale]/talents/career', 'page');
  return { ok: true };
}
