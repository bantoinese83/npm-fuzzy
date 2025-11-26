import { describe, it, expect } from 'vitest';
import { ratio, partialRatio, tokenSortRatio, tokenSetRatio, WRatio } from '../src/scorers';
import { defaultProcessor } from '../src/utils/processor';

describe('Scorers with Processors', () => {
  describe('ratio with processor', () => {
    it('should use custom processor', () => {
      const processor = (str: string) => str.toLowerCase().trim();
      const score = ratio('  HELLO  ', 'hello', processor);
      expect(score).toBe(100);
    });

    it('should work without processor (default behavior)', () => {
      const score = ratio('hello', 'hello');
      expect(score).toBe(100);
    });

    it('should use defaultProcessor when provided', () => {
      const score = ratio('  Hello  ', 'hello', defaultProcessor);
      expect(score).toBe(100);
    });
  });

  describe('partialRatio with processor', () => {
    it('should use custom processor', () => {
      const processor = (str: string) => str.replace(/[^a-z]/gi, '');
      const score = partialRatio('hello!', 'hello world!', processor);
      expect(score).toBeGreaterThan(80);
    });

    it('should work without processor', () => {
      const score = partialRatio('abc', 'abcdef');
      expect(score).toBe(100);
    });
  });

  describe('tokenSortRatio with processor', () => {
    it('should use custom processor', () => {
      const processor = (str: string) => str.toLowerCase();
      const score = tokenSortRatio('HELLO WORLD', 'hello world', processor);
      expect(score).toBe(100);
    });

    it('should work without processor', () => {
      const score = tokenSortRatio('John Smith', 'Smith John');
      expect(score).toBe(100);
    });
  });

  describe('tokenSetRatio with processor', () => {
    it('should use custom processor', () => {
      const processor = (str: string) => str.trim().toLowerCase();
      const score = tokenSetRatio('  Hello World  ', 'hello world', processor);
      expect(score).toBe(100);
    });

    it('should work without processor', () => {
      const score = tokenSetRatio('John Smith', 'John Smith Jr');
      expect(score).toBeGreaterThan(80);
    });
  });

  describe('WRatio with processor', () => {
    it('should use custom processor', () => {
      const processor = (str: string) => str.toLowerCase().replace(/[^a-z]/g, '');
      const score = WRatio('Hello!', 'hello', processor);
      expect(score).toBe(100);
    });

    it('should work without processor', () => {
      const score = WRatio('hello world', 'hello world');
      expect(score).toBe(100);
    });
  });

  describe('defaultProcessor', () => {
    it('should trim and lowercase strings', () => {
      expect(defaultProcessor('  HELLO  ')).toBe('hello');
      expect(defaultProcessor('Test String')).toBe('test string');
    });

    it('should handle empty strings', () => {
      expect(defaultProcessor('')).toBe('');
      expect(defaultProcessor('   ')).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      expect(defaultProcessor('   \t\n   ')).toBe('');
    });
  });
});
