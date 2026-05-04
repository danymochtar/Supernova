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

const PARTNER_LENS: RelationshipLens = {
  relationship: 'PARTNER',
  // Soul Urge weighted heavily — partners actually access each other's
  // deepest yearnings. The cross pairs (Expression↔Soul Urge) are where
  // the "I give what you crave" dynamic shows up.
  lanes: [
    { key: 'lp-lp',     meKey: 'lifePath',    themKey: 'lifePath',    weight: 0.18, cross: false },
    { key: 'su-su',     meKey: 'soulUrge',    themKey: 'soulUrge',    weight: 0.18, cross: false },
    { key: 'expr-su',   meKey: 'expression',  themKey: 'soulUrge',    weight: 0.15, cross: true  },
    { key: 'su-expr',   meKey: 'soulUrge',    themKey: 'expression',  weight: 0.15, cross: true  },
    { key: 'pers-pers', meKey: 'personality', themKey: 'personality', weight: 0.10, cross: false },
    { key: 'expr-expr', meKey: 'expression',  themKey: 'expression',  weight: 0.12, cross: false },
    { key: 'bd-bd',     meKey: 'birthday',    themKey: 'birthday',    weight: 0.12, cross: false },
  ],
  enabledPatterns: ALL_PATTERNS,
  enabledModifiers: new Set(['masters', 'soulUrgeMatch', 'lifePathMirror', 'sharedKarmicDebt']),
};

const FAMILY_LENS: RelationshipLens = {
  relationship: 'FAMILY',
  // Family shares the deep stuff (LP, SU) but the persona/presentation
  // (Personality) matters less — they see beneath the mask. Cross pairs
  // are still meaningful: parents giving what kids yearn for, etc.
  lanes: [
    { key: 'lp-lp',     meKey: 'lifePath',    themKey: 'lifePath',    weight: 0.25, cross: false },
    { key: 'su-su',     meKey: 'soulUrge',    themKey: 'soulUrge',    weight: 0.20, cross: false },
    { key: 'expr-su',   meKey: 'expression',  themKey: 'soulUrge',    weight: 0.15, cross: true  },
    { key: 'su-expr',   meKey: 'soulUrge',    themKey: 'expression',  weight: 0.15, cross: true  },
    { key: 'lp-expr',   meKey: 'lifePath',    themKey: 'expression',  weight: 0.10, cross: true  },
    { key: 'expr-lp',   meKey: 'expression',  themKey: 'lifePath',    weight: 0.10, cross: true  },
    { key: 'bd-bd',     meKey: 'birthday',    themKey: 'birthday',    weight: 0.05, cross: false },
  ],
  enabledPatterns: ALL_PATTERNS,
  enabledModifiers: new Set(['masters', 'soulUrgeMatch', 'lifePathMirror', 'sharedKarmicDebt']),
};

const FRIEND_LENS: RelationshipLens = {
  relationship: 'FRIEND',
  // Friends meet on Expression (how we both show up) and Personality
  // (vibe). Soul Urge isn't really accessed in friendship — drop it.
  lanes: [
    { key: 'lp-lp',     meKey: 'lifePath',    themKey: 'lifePath',    weight: 0.20, cross: false },
    { key: 'expr-expr', meKey: 'expression',  themKey: 'expression',  weight: 0.30, cross: false },
    { key: 'pers-pers', meKey: 'personality', themKey: 'personality', weight: 0.20, cross: false },
    { key: 'lp-expr',   meKey: 'lifePath',    themKey: 'expression',  weight: 0.10, cross: true  },
    { key: 'expr-lp',   meKey: 'expression',  themKey: 'lifePath',    weight: 0.10, cross: true  },
    { key: 'bd-bd',     meKey: 'birthday',    themKey: 'birthday',    weight: 0.10, cross: false },
  ],
  // No Soul-Urge based patterns; freedom-vs-root applies but lighter.
  enabledPatterns: new Set([
    'sameLifePath',
    'sameExpression',
    'myLpTheirExpr',
    'theirLpMyExpr',
    'cycleBookends',
    'freedomVsRoot',
    'pairedReducedToNine',
    'bothMasters',
    'sharedKarmicLessons',
  ]),
  enabledModifiers: new Set(['masters', 'lifePathMirror']),
};

const COLLEAGUE_LENS: RelationshipLens = {
  relationship: 'COLLEAGUE',
  // At work it's about Expression (talents) and Personality (professional
  // vibe). Life Path matters mainly as it intersects with the other's
  // Expression — i.e. their work output supports my mission. No Soul Urge.
  lanes: [
    { key: 'expr-expr', meKey: 'expression',  themKey: 'expression',  weight: 0.30, cross: false },
    { key: 'pers-pers', meKey: 'personality', themKey: 'personality', weight: 0.25, cross: false },
    { key: 'lp-expr',   meKey: 'lifePath',    themKey: 'expression',  weight: 0.15, cross: true  },
    { key: 'expr-lp',   meKey: 'expression',  themKey: 'lifePath',    weight: 0.15, cross: true  },
    { key: 'bd-bd',     meKey: 'birthday',    themKey: 'birthday',    weight: 0.15, cross: false },
  ],
  enabledPatterns: new Set([
    'sameExpression',
    'myLpTheirExpr',
    'theirLpMyExpr',
    'pairedReducedToNine',
    'bothMasters',
  ]),
  enabledModifiers: new Set(['masters']),
};

const OTHER_LENS: RelationshipLens = {
  relationship: 'OTHER',
  lanes: [
    { key: 'lp-lp',     meKey: 'lifePath',    themKey: 'lifePath',    weight: 0.30, cross: false },
    { key: 'expr-expr', meKey: 'expression',  themKey: 'expression',  weight: 0.25, cross: false },
    { key: 'su-su',     meKey: 'soulUrge',    themKey: 'soulUrge',    weight: 0.20, cross: false },
    { key: 'pers-pers', meKey: 'personality', themKey: 'personality', weight: 0.15, cross: false },
    { key: 'bd-bd',     meKey: 'birthday',    themKey: 'birthday',    weight: 0.10, cross: false },
  ],
  enabledPatterns: ALL_PATTERNS,
  enabledModifiers: new Set(['masters', 'soulUrgeMatch', 'lifePathMirror']),
};

// PARENT, CHILD, SIBLING all share the FAMILY lens — the dynamics are
// deep, blood-tier, and access the same components (LP, Soul Urge,
// cross Expression↔Soul Urge). The differences are narrative, not
// numerical, and surface in the AI-generated relationship profile.
const LENSES: Record<Relationship, RelationshipLens> = {
  PARTNER: PARTNER_LENS,
  PARENT: { ...FAMILY_LENS, relationship: 'PARENT' },
  CHILD: { ...FAMILY_LENS, relationship: 'CHILD' },
  SIBLING: { ...FAMILY_LENS, relationship: 'SIBLING' },
  FAMILY: FAMILY_LENS,
  FRIEND: FRIEND_LENS,
  COLLEAGUE: COLLEAGUE_LENS,
  OTHER: OTHER_LENS,
};

export function lensFor(relationship: Relationship): RelationshipLens {
  return LENSES[relationship] ?? OTHER_LENS;
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
  FRIEND: 5,
  COLLEAGUE: 6,
  OTHER: 7,
};

export function relationshipPriority(r: Relationship): number {
  return RELATIONSHIP_PRIORITY[r] ?? 99;
}

/** Pull the right NumerologyResult off a CoreLite for a given lane key. */
export function pickResult(core: CoreLite, key: CoreKey) {
  return core[key];
}
