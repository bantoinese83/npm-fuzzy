import { describe, it, expect } from 'vitest';
import {
  partialRatio,
  tokenSortRatio,
  tokenSetRatio,
  weightedRatio,
  tokenize,
  sortTokens,
  tokenSet,
} from '../src/core';

describe('Core Algorithms', () => {
  describe('partialRatio', () => {
    it('should find perfect substring matches', () => {
      expect(partialRatio('hello', 'hello world')).toBe(100);
      expect(partialRatio('abc', 'abcdef')).toBe(100);
    });

    it('should handle start/end matches', () => {
      expect(partialRatio('hello', 'hello there')).toBe(100);
      expect(partialRatio('world', 'hello world')).toBe(100);
    });

    it('should return 0 for empty strings', () => {
      expect(partialRatio('', 'test')).toBe(0);
      expect(partialRatio('test', '')).toBe(0);
    });

    it('should find best partial match', () => {
      const score = partialRatio('abc', 'xabcyz');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle very long strings', () => {
      const long = 'a'.repeat(1000);
      const longer = 'b' + long + 'c';
      const score = partialRatio(long, longer);
      expect(score).toBe(100);
    });
  });

  describe('tokenSortRatio', () => {
    it('should match regardless of word order', () => {
      expect(tokenSortRatio('John Smith', 'Smith John')).toBe(100);
      expect(tokenSortRatio('hello world', 'world hello')).toBe(100);
    });

    it('should handle empty token arrays', () => {
      expect(tokenSortRatio('', '')).toBe(100);
      expect(tokenSortRatio('hello', '')).toBe(0);
      expect(tokenSortRatio('', 'hello')).toBe(0);
    });

    it('should handle extra words', () => {
      const score = tokenSortRatio('John Smith', 'John A Smith');
      expect(score).toBeGreaterThan(80);
    });

    it('should handle case differences', () => {
      const score = tokenSortRatio('Hello World', 'hello world');
      expect(score).toBe(100);
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

    it('should handle empty sets', () => {
      expect(tokenSetRatio('', '')).toBe(100);
      expect(tokenSetRatio('hello', '')).toBe(0);
      expect(tokenSetRatio('', 'hello')).toBe(0);
    });

    it('should handle completely different tokens', () => {
      const score = tokenSetRatio('apple banana', 'orange grape');
      expect(score).toBe(0);
    });
  });

  describe('weightedRatio', () => {
    it('should return 100 for identical strings', () => {
      expect(weightedRatio('hello', 'hello')).toBe(100);
    });

    it('should handle similar length strings', () => {
      const score = weightedRatio('hello world', 'hello wrld');
      expect(score).toBeGreaterThan(80);
    });

    it('should handle very different length strings', () => {
      const score = weightedRatio('abc', 'abcdefghijklmnop');
      expect(score).toBeGreaterThan(0);
    });

    it('should use appropriate algorithm based on length ratio', () => {
      // Similar lengths (>0.8 ratio) - should use simple, tokenSort, tokenSet
      const similar = weightedRatio('hello', 'hello!');
      expect(similar).toBeGreaterThan(80);

      // Very different lengths (<0.6 ratio) - should use partial
      const different = weightedRatio('abc', 'abcdefghijklmnopqrstuvwxyz');
      expect(different).toBeGreaterThan(0);
    });
  });
});

describe('Tokenizer Utilities', () => {
  describe('tokenize', () => {
    it('should split on whitespace', () => {
      expect(tokenize('hello world')).toEqual(['hello', 'world']);
      expect(tokenize('hello  world')).toEqual(['hello', 'world']);
    });

    it('should split on dashes and underscores', () => {
      expect(tokenize('hello-world')).toEqual(['hello', 'world']);
      expect(tokenize('hello_world')).toEqual(['hello', 'world']);
      expect(tokenize('hello-world_test')).toEqual(['hello', 'world', 'test']);
    });

    it('should convert to lowercase', () => {
      expect(tokenize('Hello World')).toEqual(['hello', 'world']);
      expect(tokenize('HELLO WORLD')).toEqual(['hello', 'world']);
    });

    it('should handle empty string', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('should handle only delimiters', () => {
      expect(tokenize('   ')).toEqual([]);
      expect(tokenize('---')).toEqual([]);
    });

    it('should handle mixed delimiters', () => {
      expect(tokenize('hello-world_test string')).toEqual(['hello', 'world', 'test', 'string']);
    });

    it('should handle tabs and newlines', () => {
      expect(tokenize('hello\tworld\ntest')).toEqual(['hello', 'world', 'test']);
    });
  });

  describe('sortTokens', () => {
    it('should sort tokens alphabetically', () => {
      expect(sortTokens(['world', 'hello'])).toBe('hello world');
      expect(sortTokens(['zebra', 'apple', 'banana'])).toBe('apple banana zebra');
    });

    it('should handle empty array', () => {
      expect(sortTokens([])).toBe('');
    });

    it('should handle single token', () => {
      expect(sortTokens(['hello'])).toBe('hello');
    });

    it('should handle two tokens', () => {
      expect(sortTokens(['world', 'hello'])).toBe('hello world');
      expect(sortTokens(['hello', 'world'])).toBe('hello world');
    });

    it('should handle duplicate tokens', () => {
      expect(sortTokens(['hello', 'world', 'hello'])).toBe('hello hello world');
    });
  });

  describe('tokenSet', () => {
    it('should create a Set from tokens', () => {
      const set = tokenSet(['hello', 'world', 'hello']);
      expect(set.size).toBe(2);
      expect(set.has('hello')).toBe(true);
      expect(set.has('world')).toBe(true);
    });

    it('should handle empty array', () => {
      const set = tokenSet([]);
      expect(set.size).toBe(0);
    });

    it('should remove duplicates', () => {
      const set = tokenSet(['a', 'b', 'a', 'c', 'b']);
      expect(set.size).toBe(3);
    });
  });
});
