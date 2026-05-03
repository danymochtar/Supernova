import type { BirthDate, CoreProfile, NumerologyResult } from './types';

/**
 * STUB — implementations land in M1.
 * Type signatures are fixed here so downstream code (cache, AI prompts, dashboard)
 * can be wired in parallel.
 */

export function lifePath(_dob: BirthDate): NumerologyResult {
  throw new Error('not implemented (M1)');
}

export function expression(_fullName: string): NumerologyResult {
  throw new Error('not implemented (M1)');
}

export function soulUrge(_fullName: string): NumerologyResult {
  throw new Error('not implemented (M1)');
}

export function personality(_fullName: string): NumerologyResult {
  throw new Error('not implemented (M1)');
}

export function birthday(_dob: BirthDate): NumerologyResult {
  throw new Error('not implemented (M1)');
}

export function karmicLessons(_fullName: string): number[] {
  throw new Error('not implemented (M1)');
}

export function buildCoreProfile(_fullName: string, _dob: BirthDate): CoreProfile {
  throw new Error('not implemented (M1)');
}
