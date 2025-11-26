import { describe, it, expect } from 'vitest';
import { ratio, partialRatio, tokenSortRatio, tokenSetRatio, WRatio } from '../src/scorers';

describe('ratio', () => {
  it('should return 100 for identical strings', () => {
    expect(ratio('hello', 'hello')).toBe(100);
  });

  it('should be case insensitive', () => {
    expect(ratio('Hello', 'HELLO')).toBe(100);
  });

  it('should handle whitespace', () => {
    expect(ratio('hello world', 'hello  world')).toBeGreaterThan(90);
  });
});

describe('partialRatio', () => {
  it('should find substring matches', () => {
    const score = partialRatio('hello', 'hello world');
    expect(score).toBe(100);
  });

  it('should handle partial matches', () => {
    const score = partialRatio('abc', 'abcdef');
    expect(score).toBe(100);
  });
});

describe('tokenSortRatio', () => {
  it('should match regardless of word order', () => {
    const score = tokenSortRatio('John Smith', 'Smith John');
    expect(score).toBe(100);
  });

  it('should handle extra words', () => {
    const score = tokenSortRatio('John Smith', 'John A Smith');
    expect(score).toBeGreaterThan(80);
  });
});

describe('tokenSetRatio', () => {
  it('should handle duplicate words', () => {
    const score = tokenSetRatio('hello hello world', 'hello world');
    expect(score).toBeGreaterThan(90);
  });

  it('should match when one has extra words', () => {
    const score = tokenSetRatio('John Smith', 'John Smith Jr');
    expect(score).toBeGreaterThan(80);
  });
});

describe('WRatio', () => {
  it('should return high score for similar strings', () => {
    const score = WRatio('hello world', 'hello world');
    expect(score).toBe(100);
  });

  it('should handle various edge cases', () => {
    expect(WRatio('John Smith', 'Smith John')).toBe(100);
    expect(WRatio('abc', 'abcdef')).toBeGreaterThan(50);
  });
});
