/**
 * Single source of truth for selectable relationship types — shared by the
 * People form (client) and the save action's zod validation (server) so the
 * two never drift apart (out-of-sync copies caused "error on save" before).
 *
 * Order here is the order shown in the picker. Must stay a subset of the
 * Prisma `Relationship` enum.
 */
export const RELATIONSHIPS = [
  'PARTNER',
  'PARENT',
  'CHILD',
  'SIBLING',
  'FAMILY',
  'BEST_FRIEND',
  'FRIEND',
  'BUSINESS_PARTNER',
  'COLLEAGUE',
  'ACQUAINTANCE',
  'OTHER',
] as const;

export type RelationshipValue = (typeof RELATIONSHIPS)[number];
