import type { CareerEntry } from '@prisma/client';
import { listCareerEntries } from '@/lib/db/repositories/career';
import { scoreCareerMatch, type TalentVocationResult } from './talents';

export type ScoredCareerEntry = CareerEntry & { matchScore: number };

// matchScore is recomputed live so changes to the scoring rule take effect without forcing a re-upload.
export async function loadCareerEntriesScored(
  userId: string,
  vocationResults: TalentVocationResult[],
): Promise<{ entries: ScoredCareerEntry[]; avgScore: number }> {
  const raw = await listCareerEntries(userId);
  const entries = raw.map((e) => ({
    ...e,
    matchScore: scoreCareerMatch(e.vocationId, vocationResults).score,
  }));
  const avgScore =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.matchScore, 0) / entries.length)
      : 0;
  return { entries, avgScore };
}
