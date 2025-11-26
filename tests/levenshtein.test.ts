import { describe, it, expect } from 'vitest';
import { levenshteinDistance, levenshteinRatio } from '../src/core/levenshtein';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('should return length for completely different strings', () => {
    expect(levenshteinDistance('abc', 'def')).toBe(3);
  });

  it('should handle empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('', 'abc')).toBe(3);
  });

  it('should calculate correct distance for substitutions', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });

  it('should handle single character differences', () => {
    expect(levenshteinDistance('abc', 'ab')).toBe(1);
    expect(levenshteinDistance('abc', 'abcd')).toBe(1);
  });
});

describe('levenshteinRatio', () => {
  it('should return 100 for identical strings', () => {
    expect(levenshteinRatio('hello', 'hello')).toBe(100);
  });

  it('should return 0 for completely different strings of same length', () => {
    expect(levenshteinRatio('abc', 'def')).toBe(0);
  });

  it('should handle empty strings', () => {
    expect(levenshteinRatio('', '')).toBe(100);
    expect(levenshteinRatio('abc', '')).toBe(0);
  });

  it('should return reasonable ratios for similar strings', () => {
    const ratio = levenshteinRatio('kitten', 'sitting');
    expect(ratio).toBeGreaterThan(50);
    expect(ratio).toBeLessThan(100);
  });
});
