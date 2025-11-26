import { describe, it, expect } from 'vitest';
import { profiler } from '../src/utils/performance';
import { LRUCache } from '../src/utils/lruCache';
import { levenshteinDistance } from '../src/core/levenshtein';
import { tokenize } from '../src/core/tokenizer';
import { extract } from '../src/process';

describe('Performance optimizations', () => {
  describe('LRUCache', () => {
    it('should efficiently manage memory with LRU eviction', () => {
      const cache = new LRUCache<string, number>(3);

      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      expect(cache.size()).toBe(3);

      cache.set('d', 4); // Should evict 'a'
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('d')).toBe(4);
      expect(cache.size()).toBe(3);
    });

    it('should handle TTL expiration', () => {
      const cache = new LRUCache<string, number>(10);
      cache.set('a', 1, 100);
      expect(cache.get('a')).toBe(1);

      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cache.get('a')).toBeUndefined();
          resolve();
        }, 150);
      });
    });

    it('should cleanup expired entries', () => {
      const cache = new LRUCache<string, number>(10);
      cache.set('a', 1, 50);
      cache.set('b', 2); // No expiration

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const cleaned = cache.cleanupExpired();
          expect(cleaned).toBe(1);
          expect(cache.get('a')).toBeUndefined();
          expect(cache.get('b')).toBe(2);
          resolve();
        }, 100);
      });
    });
  });

  describe('Optimized algorithms', () => {
    it('should handle identical strings efficiently', () => {
      const longString = 'a'.repeat(1000);
      const distance = levenshteinDistance(longString, longString);
      expect(distance).toBe(0);
    });

    it('should tokenize efficiently', () => {
      const text = 'hello world test string';
      const tokens = tokenize(text);
      expect(tokens).toEqual(['hello', 'world', 'test', 'string']);
    });

    it('should handle large extract operations efficiently', () => {
      const choices = Array.from({ length: 1000 }, (_, i) => `item${i}`);
      const results = extract('item1', choices, undefined, 5);
      expect(results.length).toBe(5);
      expect(results[0]?.choice).toBe('item1');
    });
  });

  describe('Profiler', () => {
    it('should measure operation performance', () => {
      profiler.reset();
      profiler.start();

      profiler.measure('test', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      const metric = profiler.getMetric('test');
      expect(metric).toBeDefined();
      expect(metric?.callCount).toBe(1);
      expect(metric?.duration).toBeGreaterThan(0);
    });

    it('should accumulate metrics across multiple calls', () => {
      profiler.reset();

      for (let i = 0; i < 5; i++) {
        profiler.measure('accumulate', () => {
          return i * 2;
        });
      }

      const metric = profiler.getMetric('accumulate');
      expect(metric?.callCount).toBe(5);
    });
  });
});
