import type { Relationship } from '@prisma/client';
import type { CoreLite } from './score';

/**
 * One scoring lane between me and them. Pairs are reduced-number compares
 * (same as before) — what changes per relationship is *which* components we
 * compare, *what we cross*, and *how we weight* each lane.
 *
 * Cross pairs (e.g. my Expression vs their Soul Urge) capture asymmetric
 * dynamics: I give what they yearn for. The compatibility table doesn't
 * care which side is which — pairScore is symmetric on the digit pair —
 * but the narrative does.
 */
export type CoreKey = 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'birthday';

export interface Lane {
  /** Stable id used as React key + pattern key. */
  key: string;
  meKey: CoreKey;
  themKey: CoreKey;
  /** Weight in the final score; lane weights for a lens sum to 1.0. */
  weight: number;
  /** True when meKey !== themKey (giver↔receiver style pair). */
  cross: boolean;
}

export interface RelationshipLens {
  relationship: Relationship;
  lanes: Lane[];
  /** Pattern keys (from detectPatterns) that apply to this relationship. */
  enabledPatterns: ReadonlySet<string>;
  /** Modifier keys that apply to this relationship's overall score. */
  enabledModifiers: ReadonlySet<string>;
}

const ALL_PATTERNS = new Set([
  'sameLifePath',
  'sameSoulUrge',
  'sameExpression',
  'myLpTheirExpr',
  'theirLpMyExpr',
  'myLpTheirSu',
  'theirLpMySu',
  'myExprTheirSu',
  'theirExprMySu',
  'cycleBookends',
  'freedomVsRoot',
  'pairedReducedToNine',
  'bothMasters',
  'sharedKarmicDebt',
  'sharedKarmicLessons',
]);

/**
 * ONE relationship-independent compatibility lens. The "core" compatibility
 * of two people is the same regardless of how they're labeled — the
 * relationship type only flavors the written narrative/advice (handled in the
 * AI prompts), never the number. Previously each relationship had its own
 * lanes/modifiers, which made the same pair swing ~15-25 pts by label (family
 * structurally inflated, colleague penalized).
 *
 * Weighting follows numerology's "three pillars": Life Path (primary),
 * Expression, and Soul Urge carry the most weight, with Personality + Birthday
 * as supporting layers, plus light Expression↔Soul Urge cross-pairs for the
 * complementarity ("I give what you crave") read. Lane weights sum to 1.0.
 */
const CORE_LENS: RelationshipLens = {
  relationship: 'OTHER', // placeholder; lensFor() stamps the real label
  lanes: [
    { key: 'lp-lp',     meKey: 'lifePath',    themKey: 'lifePath',    weight: 0.28, cross: false },
    { key: 'expr-expr', meKey: 'expression',  themKey: 'expression',  weight: 0.22, cross: false },
    { key: 'su-su',     meKey: 'soulUrge',    themKey: 'soulUrge',    weight: 0.20, cross: false },
    { key: 'pers-pers', meKey: 'personality', themKey: 'personality', weight: 0.12, cross: false },
    { key: 'bd-bd',     meKey: 'birthday',    themKey: 'birthday',    weight: 0.08, cross: false },
    { key: 'expr-su',   meKey: 'expression',  themKey: 'soulUrge',    weight: 0.05, cross: true  },
    { key: 'su-expr',   meKey: 'soulUrge',    themKey: 'expression',  weight: 0.05, cross: true  },
  ],
  enabledPatterns: ALL_PATTERNS,
  enabledModifiers: new Set([
    'masters',
    'soulUrgeMatch',
    'lifePathMirror',
    'sharedKarmicDebt',
    'oldSoul',
    'complementaryKarmic',
    'bridgeFit',
    'zodiacSynastry',
  ]),
};

/**
 * Returns the core lens for every relationship — the score is
 * relationship-independent. The passed `relationship` is stamped onto the
 * lens only so consumers can still read the correct label.
 */
export function lensFor(relationship: Relationship): RelationshipLens {
  return { ...CORE_LENS, relationship };
}

/**
 * Sort priority for the People list — closest emotional ties on top, looser
 * acquaintances at the bottom. Used by the people repo to order rows.
 */
const RELATIONSHIP_PRIORITY: Record<Relationship, number> = {
  PARTNER: 0,
  PARENT: 1,
  CHILD: 2,
  SIBLING: 3,
  FAMILY: 4,
  BEST_FRIEND: 5,
  FRIEND: 6,
  BUSINESS_PARTNER: 7,
  COLLEAGUE: 8,
  ACQUAINTANCE: 9,
  OTHER: 10,
};

export function relationshipPriority(r: Relationship): number {
  return RELATIONSHIP_PRIORITY[r] ?? 99;
}

/** Pull the right NumerologyResult off a CoreLite for a given lane key. */
export function pickResult(core: CoreLite, key: CoreKey) {
  return core[key];
}
