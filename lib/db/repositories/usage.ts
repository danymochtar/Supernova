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
