import type { AiFeature } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { estimateCostUsd } from '@/lib/ai/cost';

export async function logUsage(input: {
  userId: string;
  feature: AiFeature;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  await prisma.aiUsage.create({
    data: {
      userId: input.userId,
      feature: input.feature,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      costUsd: estimateCostUsd(input.model, input.inputTokens, input.outputTokens),
    },
  });
}

export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  count: number;
}

export interface UsageBreakdown {
  totals: UsageTotals;
  byFeature: Array<{ feature: string } & UsageTotals>;
  byModel: Array<{ model: string } & UsageTotals>;
  byDay: Array<{ date: string } & UsageTotals>;
  recentUsers: Array<{ userId: string; email: string | null } & UsageTotals>;
}

/** Aggregate AiUsage rows for the admin dashboard. */
export async function getUsageBreakdown(sinceDays: number = 30): Promise<UsageBreakdown> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - sinceDays);

  const rows = await prisma.aiUsage.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  const totals: UsageTotals = { inputTokens: 0, outputTokens: 0, costUsd: 0, count: 0 };
  const byFeature = new Map<string, UsageTotals>();
  const byModel = new Map<string, UsageTotals>();
  const byDay = new Map<string, UsageTotals>();
  const byUser = new Map<string, UsageTotals>();

  for (const r of rows) {
    const cost = Number(r.costUsd);
    totals.inputTokens += r.inputTokens;
    totals.outputTokens += r.outputTokens;
    totals.costUsd += cost;
    totals.count += 1;

    const acc = (m: Map<string, UsageTotals>, k: string) => {
      const cur = m.get(k) ?? { inputTokens: 0, outputTokens: 0, costUsd: 0, count: 0 };
      cur.inputTokens += r.inputTokens;
      cur.outputTokens += r.outputTokens;
      cur.costUsd += cost;
      cur.count += 1;
      m.set(k, cur);
    };
    acc(byFeature, r.feature);
    acc(byModel, r.model);
    acc(byDay, r.createdAt.toISOString().slice(0, 10));
    acc(byUser, r.userId);
  }

  // Resolve emails for top users.
  const topUserIds = [...byUser.entries()]
    .sort((a, b) => b[1].costUsd - a[1].costUsd)
    .slice(0, 10)
    .map(([id]) => id);
  const users = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((u) => [u.id, u.email]));

  return {
    totals,
    byFeature: [...byFeature.entries()]
      .map(([feature, t]) => ({ feature, ...t }))
      .sort((a, b) => b.costUsd - a.costUsd),
    byModel: [...byModel.entries()]
      .map(([model, t]) => ({ model, ...t }))
      .sort((a, b) => b.costUsd - a.costUsd),
    byDay: [...byDay.entries()]
      .map(([date, t]) => ({ date, ...t }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    recentUsers: topUserIds.map((id) => ({
      userId: id,
      email: emailById.get(id) ?? null,
      ...byUser.get(id)!,
    })),
  };
}
