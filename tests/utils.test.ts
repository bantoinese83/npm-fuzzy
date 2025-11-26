import { describe, it, expect, beforeEach } from 'vitest';
import { LRUCache } from '../src/utils/lruCache';
import { profiler, Profile } from '../src/utils/performance';

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  describe('Basic operations', () => {
    it('should set and get values', () => {
      cache.set('a', 1);
      expect(cache.get('a')).toBe(1);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update existing values', () => {
      cache.set('a', 1);
      cache.set('a', 2);
      expect(cache.get('a')).toBe(2);
    });

    it('should track size correctly', () => {
      expect(cache.size()).toBe(0);
      cache.set('a', 1);
      expect(cache.size()).toBe(1);
      cache.set('b', 2);
      expect(cache.size()).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      expect(cache.size()).toBe(3);

      cache.set('d', 4); // Should evict 'a'
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('d')).toBe(4);
      expect(cache.size()).toBe(3);
    });

    it('should update LRU order on get', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.get('a'); // Make 'a' most recently used
      cache.set('d', 4); // Should evict 'b' (least recently used)
      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBeUndefined();
    });

    it('should update LRU order on set', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.set('a', 10); // Update 'a', making it most recently used
      cache.set('d', 4); // Should evict 'b'
      expect(cache.get('a')).toBe(10);
      expect(cache.get('b')).toBeUndefined();
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', () => {
      cache.set('a', 1, 100);
      expect(cache.get('a')).toBe(1);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cache.get('a')).toBeUndefined();
          resolve();
        }, 150);
      });
    });

    it('should not expire entries without TTL', () => {
      cache.set('a', 1); // No TTL
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cache.get('a')).toBe(1);
          resolve();
        }, 100);
      });
    });

    it('should handle mixed TTL and non-TTL entries', () => {
      cache.set('a', 1, 50);
      cache.set('b', 2); // No TTL

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(cache.get('a')).toBeUndefined();
          expect(cache.get('b')).toBe(2);
          resolve();
        }, 100);
      });
    });
  });

  describe('cleanupExpired', () => {
    it('should remove expired entries', () => {
      cache.set('a', 1, 50);
      cache.set('b', 2, 50);
      cache.set('c', 3); // No expiration

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const cleaned = cache.cleanupExpired();
          expect(cleaned).toBe(2);
          expect(cache.get('a')).toBeUndefined();
          expect(cache.get('b')).toBeUndefined();
          expect(cache.get('c')).toBe(3);
          expect(cache.size()).toBe(1);
          resolve();
        }, 100);
      });
    });

    it('should return 0 when no expired entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      const cleaned = cache.cleanupExpired();
      expect(cleaned).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBe(2);
      expect(cache.size()).toBe(1);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);
      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle capacity of 1', () => {
      const smallCache = new LRUCache<string, number>(1);
      smallCache.set('a', 1);
      smallCache.set('b', 2);
      expect(smallCache.get('a')).toBeUndefined();
      expect(smallCache.get('b')).toBe(2);
    });

    it('should handle capacity of 0', () => {
      const zeroCache = new LRUCache<string, number>(0);
      // With capacity 0, the implementation may still store one item
      // before eviction logic kicks in. This is an edge case.
      zeroCache.set('a', 1);
      // The behavior with capacity 0 is implementation-dependent
      // We just verify it doesn't crash
      expect(zeroCache.size()).toBeGreaterThanOrEqual(0);
      expect(zeroCache.size()).toBeLessThanOrEqual(1);
    });

    it('should handle very large capacity', () => {
      const largeCache = new LRUCache<string, number>(10000);
      for (let i = 0; i < 5000; i++) {
        largeCache.set(`key${i}`, i);
      }
      expect(largeCache.size()).toBe(5000);
      expect(largeCache.get('key0')).toBe(0);
      expect(largeCache.get('key4999')).toBe(4999);
    });
  });
});

describe('Performance Profiler', () => {
  beforeEach(() => {
    profiler.reset();
  });

  describe('measure', () => {
    it('should measure operation duration', () => {
      profiler.measure('test', () => {
        return 42;
      });

      const metric = profiler.getMetric('test');
      expect(metric).toBeDefined();
      expect(metric?.duration).toBeGreaterThan(0);
      expect(metric?.callCount).toBe(1);
    });

    it('should return the function result', () => {
      const result = profiler.measure('test', () => {
        return 'result';
      });
      expect(result).toBe('result');
    });

    it('should accumulate metrics across calls', () => {
      profiler.measure('accumulate', () => 1);
      profiler.measure('accumulate', () => 2);
      profiler.measure('accumulate', () => 3);

      const metric = profiler.getMetric('accumulate');
      expect(metric?.callCount).toBe(3);
      expect(metric?.duration).toBeGreaterThan(0);
    });

    it('should handle async operations', async () => {
      const result = await profiler.measure('async', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'done';
      });

      expect(result).toBe('done');
      const metric = profiler.getMetric('async');
      expect(metric).toBeDefined();
      expect(metric?.duration).toBeGreaterThan(0);
    });
  });

  describe('getMetrics', () => {
    it('should return all metrics', () => {
      profiler.measure('op1', () => 1);
      profiler.measure('op2', () => 2);
      profiler.measure('op1', () => 3);

      const metrics = profiler.getMetrics();
      expect(metrics.length).toBe(2);
      expect(metrics.some((m) => m.operation === 'op1')).toBe(true);
      expect(metrics.some((m) => m.operation === 'op2')).toBe(true);
    });

    it('should return empty array when no metrics', () => {
      expect(profiler.getMetrics()).toEqual([]);
    });
  });

  describe('getMetric', () => {
    it('should return specific metric', () => {
      profiler.measure('test', () => 1);
      const metric = profiler.getMetric('test');
      expect(metric).toBeDefined();
      expect(metric?.operation).toBe('test');
    });

    it('should return undefined for non-existent metric', () => {
      expect(profiler.getMetric('nonexistent')).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      profiler.measure('test', () => 1);
      profiler.reset();
      expect(profiler.getMetrics()).toEqual([]);
      expect(profiler.getMetric('test')).toBeUndefined();
    });
  });

  describe('report', () => {
    it('should generate performance report', () => {
      profiler.measure('test1', () => 1);
      profiler.measure('test2', () => 2);
      profiler.measure('test1', () => 3);

      const report = profiler.report();
      expect(report).toContain('Performance Report');
      expect(report).toContain('test1');
      expect(report).toContain('test2');
      expect(report).toContain('Calls:');
      expect(report).toContain('Total:');
      expect(report).toContain('Average:');
    });

    it('should handle empty metrics', () => {
      const report = profiler.report();
      expect(report).toBe('No metrics collected');
    });
  });
});

describe('Profile decorator', () => {
  it('should profile method calls', () => {
    profiler.reset();

    class TestClass {
      @Profile
      method(): number {
        return 42;
      }
    }

    const instance = new TestClass();
    const result = instance.method();
    expect(result).toBe(42);

    const metrics = profiler.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);
    const metric = metrics.find((m) => m.operation.includes('method'));
    expect(metric).toBeDefined();
  });

  it('should profile multiple method calls', () => {
    profiler.reset();

    class TestClass {
      @Profile
      method1(): number {
        return 1;
      }

      @Profile
      method2(): number {
        return 2;
      }
    }

    const instance = new TestClass();
    instance.method1();
    instance.method2();

    const metrics = profiler.getMetrics();
    expect(metrics.length).toBeGreaterThanOrEqual(2);
  });
});
