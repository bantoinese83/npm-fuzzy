/**
 * Cache decorator - memoizes function results based on arguments.
 * Uses LRU cache for efficient memory management and O(1) operations.
 */

import { LRUCache } from '../utils/lruCache';

type CacheKey = string;

// Optimized cache key generation - faster than JSON.stringify for primitives
function createCacheKey(args: unknown[]): CacheKey {
  const len = args.length;
  if (len === 0) return '';

  if (len === 1) {
    const arg = args[0];
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
      return String(arg);
    }
  }

  // Optimize common case: 2 string arguments (scorer functions)
  if (len === 2) {
    const arg1 = args[0];
    const arg2 = args[1];
    if (typeof arg1 === 'string' && typeof arg2 === 'string') {
      // Use separator that won't appear in strings to avoid collisions
      return `\x00${arg1}\x00${arg2}`;
    }
    if (
      (typeof arg1 === 'string' || typeof arg1 === 'number') &&
      (typeof arg2 === 'string' || typeof arg2 === 'number')
    ) {
      return `\x00${String(arg1)}\x00${String(arg2)}`;
    }
  }

  // Fallback to JSON for complex objects
  return JSON.stringify(args);
}

interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

// Shared cache cleanup interval
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function scheduleCleanup(caches: Set<LRUCache<CacheKey, unknown>>): void {
  if (cleanupInterval !== null) return;

  cleanupInterval = setInterval(() => {
    for (const cache of caches) {
      cache.cleanupExpired();
    }
  }, 60000); // Cleanup every minute
}

const allCaches = new Set<LRUCache<CacheKey, unknown>>();

export function Cache(
  options: CacheOptions = {}
): <T extends (...args: unknown[]) => unknown>(
  _target: unknown,
  _propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void {
  const { maxSize = 1000, ttl } = options;

  return function <T extends (...args: unknown[]) => unknown>(
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> | void {
    const originalMethod = descriptor.value;
    if (originalMethod === undefined) return;

    const cache = new LRUCache<CacheKey, unknown>(maxSize);
    allCaches.add(cache);
    scheduleCleanup(allCaches);

    descriptor.value = function (this: unknown, ...args: Parameters<T>) {
      const key = createCacheKey(args);
      const cached = cache.get(key);

      if (cached !== undefined) {
        return cached as ReturnType<T>;
      }

      const result = originalMethod.apply(this, args);

      // Only cache if result is not undefined (undefined might be a valid result)
      // For performance, we cache everything but this could be optimized further
      cache.set(key, result, ttl);

      return result;
    } as T;

    return descriptor;
  };
}
