export * from './types';
export { LETTER_VALUES, letterValue } from './letterMap';
export { reducePreservingMasters, makeResult } from './reduce';
export { yRole, isYVowel } from './yVowel';
export {
  lifePath,
  expression,
  soulUrge,
  personality,
  birthday,
} from './core';
export { karmicLessons } from './karmic';
export {
  pinnacles,
  challenges,
  periodCycles,
  activeSlots,
  pinnacleAt,
  challengeAt,
  cycleAt,
} from './cycles';
export {
  personalYear,
  personalYearBirthdayAnchored,
  personalMonth,
  personalDay,
  personalCycles,
  contextFromInstant,
  type PersonalContext,
} from './personal';
export { buildCoreProfile } from './profile';
export { minorNumbers, type MinorNumbers } from './minor';
export { bridges, type Bridges } from './bridge';
export { ageAt } from './age';
export {
  activeTransit,
  transitTimeline,
  essenceAt,
  essenceTimeline,
  nextEssenceShift,
  type TransitInfo,
  type EssenceFrame,
} from './essence';

/** Render a NumerologyResult as "compound/intermediate/reduced" or "compound/reduced". */
export function formatNumerology(r: { compound: number; reduced: number; isMaster: boolean }): string {
  if (r.compound === r.reduced) return String(r.compound);
  // For karmic-debt 19 → 10 → 1, render full chain
  if (r.compound === 19 && r.reduced === 1) return '19/10/1';
  if (r.compound === 16 && r.reduced === 7) return '16/7';
  if (r.compound === 14 && r.reduced === 5) return '14/5';
  if (r.compound === 13 && r.reduced === 4) return '13/4';
  return `${r.compound}/${r.reduced}`;
}
