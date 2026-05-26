import { describe, expect, it } from 'vitest';
import {
  categoryForKehidupanTab,
  deriveCategory,
  isCategory,
} from '../categories';

describe('isCategory', () => {
  it('accepts known categories, rejects others', () => {
    expect(isCategory('percintaan')).toBe(true);
    expect(isCategory('relationship')).toBe(true);
    expect(isCategory('karier')).toBe(true);
    expect(isCategory('tentang')).toBe(false);
    expect(isCategory(null)).toBe(false);
    expect(isCategory(42)).toBe(false);
  });
});

describe('categoryForKehidupanTab', () => {
  it('maps tentang to pribadi and the rest by name', () => {
    expect(categoryForKehidupanTab('tentang')).toBe('pribadi');
    expect(categoryForKehidupanTab('perjalanan')).toBe('perjalanan');
    expect(categoryForKehidupanTab('percintaan')).toBe('percintaan');
    expect(categoryForKehidupanTab('keuangan')).toBe('keuangan');
  });
});

describe('deriveCategory', () => {
  it('returns null when no topic is a known category', () => {
    expect(deriveCategory([])).toBeNull();
    expect(deriveCategory([null, undefined, 'nonsense'])).toBeNull();
  });

  it('picks the most frequent category', () => {
    expect(deriveCategory(['karier', 'karier', 'pribadi'])).toBe('karier');
  });

  it('breaks ties by CATEGORY_ORDER (earlier wins)', () => {
    // percintaan (idx 2) beats keuangan (idx 3) on a 1-1 tie
    expect(deriveCategory(['keuangan', 'percintaan'])).toBe('percintaan');
  });

  it('ignores non-category noise mixed in', () => {
    expect(deriveCategory([null, 'relationship', 'foo', 'relationship'])).toBe('relationship');
  });
});
