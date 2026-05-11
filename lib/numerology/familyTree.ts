import type { CoreProfile } from './types';

export interface FamilyTreeMatches {
  /** Reduced numbers that appear in BOTH the user's and the parent's core
   *  positions (Life Path, Expression, Soul Urge, Personality, Birthday).
   *  Surfaced as "patterns you both carry." */
  shared: number[];
  /** Numbers from the parent's core that fall on the user's karmic lessons
   *  (digits absent from the user's name). Decoz's Family Tree framing: the
   *  parent carries strength the child has yet to develop. */
  inheritedLessons: number[];
}

function coreReducedSet(core: CoreProfile): Set<number> {
  return new Set([
    core.lifePath.reduced,
    core.expression.reduced,
    core.soulUrge.reduced,
    core.personality.reduced,
    core.birthday.reduced,
  ]);
}

export function compareToParent(self: CoreProfile, parent: CoreProfile): FamilyTreeMatches {
  const selfNums = coreReducedSet(self);
  const parentNums = coreReducedSet(parent);
  const selfLessons = new Set(self.karmicLessons);

  const shared = [...parentNums].filter((n) => selfNums.has(n)).sort((a, b) => a - b);
  const inheritedLessons = [...parentNums]
    .filter((n) => selfLessons.has(n))
    .sort((a, b) => a - b);

  return { shared, inheritedLessons };
}
