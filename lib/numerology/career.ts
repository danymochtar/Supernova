import type { CareerEntry } from '@prisma/client';
import { listCareerEntries } from '@/lib/db/repositories/career';
import {
  scoreCareerMatch,
  vocationContributingGroups,
  type TalentGroupId,
  type TalentGroupResult,
  type TalentVocationResult,
} from './talents';

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

export function classifyContributingGroups(
  vocationId: string,
  groupResults: TalentGroupResult[],
): { strong: TalentGroupId[]; improve: TalentGroupId[] } {
  const byId = new Map(groupResults.map((r) => [r.id, r]));
  const strong: TalentGroupId[] = [];
  const improve: TalentGroupId[] = [];
  for (const g of vocationContributingGroups(vocationId)) {
    const r = byId.get(g);
    if (!r) continue;
    if (r.rating === 'low') improve.push(g);
    else strong.push(g);
  }
  return { strong, improve };
}
