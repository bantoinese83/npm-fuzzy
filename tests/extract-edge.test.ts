import { describe, it, expect } from 'vitest';
import { extract, extractOne } from '../src/process';
import { WRatio } from '../src/scorers';

describe('Extract Edge Cases', () => {
  describe('extract - Large arrays and optimizations', () => {
    it('should handle arrays just above chunked threshold (8K+)', () => {
      const choices = Array.from({ length: 9000 }, (_, i) => `item${i}`);
      const results = extract('item1', choices, WRatio, 5);
      expect(results.length).toBe(5);
      const first = results[0];
      if (first !== undefined) {
        expect(first.choice).toBe('item1');
        expect(first.score).toBe(100);
      }
    });

    it('should handle very large arrays (50K+) with chunked processing', () => {
      const choices = Array.from({ length: 60000 }, (_, i) => `item${i}`);
      const results = extract('item50000', choices, WRatio, 10);
      expect(results.length).toBe(10);
      const first = results[0];
      if (first !== undefined) {
        expect(first.score).toBe(100);
      }
    });

    it('should handle early termination with perfect matches', () => {
      const choices = ['perfect', ...Array.from({ length: 50000 }, (_, i) => `item${i}`)];
      const results = extract('perfect', choices, WRatio, 5);
      expect(results.length).toBe(5);
      const first = results[0];
      if (first !== undefined) {
        expect(first.choice).toBe('perfect');
        expect(first.score).toBe(100);
      }
    });

    it('should handle limit larger than array size', () => {
      const choices = ['apple', 'banana', 'orange'];
      const results = extract('a', choices, WRatio, 10);
      expect(results.length).toBe(3);
    });

    it('should handle limit of 0', () => {
      const choices = ['apple', 'banana'];
      const results = extract('a', choices, WRatio, 0);
      expect(results).toEqual([]);
    });

    it('should handle negative limit', () => {
      const choices = ['apple', 'banana'];
      const results = extract('a', choices, WRatio, -1);
      expect(results).toEqual([]);
    });

    it('should handle single choice', () => {
      const results = extract('app', ['apple'], WRatio, 5);
      expect(results.length).toBe(1);
      expect(results[0]?.choice).toBe('apple');
    });

    it('should handle choices with special characters', () => {
      const choices = ['hello-world', 'test_string', 'normal text'];
      const results = extract('hello', choices, WRatio, 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle unicode characters', () => {
      const choices = ['café', 'naïve', 'résumé'];
      const results = extract('cafe', choices, WRatio, 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle very long strings in choices', () => {
      const longString = 'a'.repeat(1000);
      const choices = [longString, 'short', 'medium length string'];
      const results = extract('a'.repeat(500), choices, WRatio, 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should maintain sort order for equal scores', () => {
      const choices = ['apple', 'apply', 'apples'];
      const results = extract('app', choices, WRatio, 5);
      // Should be sorted by score, then alphabetically
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];
        if (prev === undefined || curr === undefined) continue;
        if (Math.abs(prev.score - curr.score) < 0.001) {
          expect(prev.choice.localeCompare(curr.choice)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe('extractOne - Large arrays and optimizations', () => {
    it('should handle arrays just above chunked threshold (20K+)', () => {
      const choices = Array.from({ length: 25000 }, (_, i) => `item${i}`);
      const result = extractOne('item1', choices, WRatio);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.score).toBe(100);
      }
    });

    it('should handle very large arrays (100K+) with intelligent sampling', () => {
      const choices = Array.from({ length: 150000 }, (_, i) => `item${i}`);
      const result = extractOne('item75000', choices, WRatio);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.score).toBeGreaterThan(0);
      }
    });

    it('should handle early termination with perfect match in sampling', () => {
      const choices = ['perfect', ...Array.from({ length: 100000 }, (_, i) => `item${i}`)];
      const result = extractOne('perfect', choices, WRatio);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.choice).toBe('perfect');
        expect(result.score).toBe(100);
      }
    });

    it('should handle single choice', () => {
      const result = extractOne('app', ['apple'], WRatio);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.choice).toBe('apple');
      }
    });

    it('should handle choices with empty strings', () => {
      const choices = ['', 'apple', 'banana'];
      const result = extractOne('app', choices, WRatio);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.choice).not.toBe('');
      }
    });

    it('should handle query with empty string', () => {
      const choices = ['apple', 'banana', 'orange'];
      const result = extractOne('', choices, WRatio);
      expect(result).not.toBeNull();
    });

    it('should handle very long query string', () => {
      const longQuery = 'a'.repeat(500);
      const choices = ['short', 'medium', longQuery];
      const result = extractOne(longQuery, choices, WRatio);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.choice).toBe(longQuery);
        expect(result.score).toBe(100);
      }
    });
  });

  describe('extract - Edge cases with custom scorer', () => {
    it('should work with custom scorer that returns 0', () => {
      const zeroScorer = () => 0;
      const results = extract('test', ['apple', 'banana'], zeroScorer, 5);
      expect(results.length).toBe(2);
      expect(results[0]?.score).toBe(0);
    });

    it('should work with custom scorer that returns 100', () => {
      const perfectScorer = () => 100;
      const results = extract('test', ['apple', 'banana'], perfectScorer, 5);
      expect(results.length).toBe(2);
      expect(results[0]?.score).toBe(100);
    });

    it('should handle scorer that throws error', () => {
      const errorScorer = () => {
        throw new Error('Scorer error');
      };
      expect(() => extract('test', ['apple'], errorScorer, 5)).toThrow('Scorer error');
    });
  });

  describe('extractOne - Edge cases with custom scorer', () => {
    it('should work with custom scorer', () => {
      const customScorer = (s1: string, s2: string) => {
        return s1 === s2 ? 100 : 50;
      };
      const result = extractOne('apple', ['apple', 'banana'], customScorer);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.score).toBe(100);
      }
    });

    it('should handle scorer that returns negative values', () => {
      const negativeScorer = () => -10;
      const result = extractOne('test', ['apple'], negativeScorer);
      expect(result).not.toBeNull();
      if (result !== null) {
        expect(result.score).toBe(-10);
      }
    });
  });

  describe('Boundary conditions', () => {
    it('should handle limit exactly equal to array size', () => {
      const choices = ['a', 'b', 'c'];
      const results = extract('a', choices, WRatio, 3);
      expect(results.length).toBe(3);
    });

    it('should handle limit of 1', () => {
      const choices = ['apple', 'banana', 'orange'];
      const results = extract('app', choices, WRatio, 1);
      expect(results.length).toBe(1);
    });

    it('should handle very large limit', () => {
      const choices = ['apple', 'banana'];
      const results = extract('a', choices, WRatio, 1000);
      expect(results.length).toBe(2);
    });

    it('should handle arrays with all identical choices', () => {
      const choices = ['apple', 'apple', 'apple'];
      const results = extract('app', choices, WRatio, 5);
      expect(results.length).toBe(3);
      results.forEach((r) => {
        expect(r.choice).toBe('apple');
        expect(r.score).toBeGreaterThan(0);
      });
    });
  });
});
