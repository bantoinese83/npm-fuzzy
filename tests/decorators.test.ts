import { describe, it, expect } from 'vitest';
import {
  Cache,
  Validate,
  ValidationError,
  validationRules,
  Metadata,
  getMetadata,
  hasMetadata,
} from '../src/decorators';
import { WRatio } from '../src/scorers';

describe('Cache decorator', () => {
  it('should cache function results', () => {
    let callCount = 0;

    class TestClass {
      @Cache()
      expensiveOperation(...args: unknown[]): number {
        callCount++;
        const value = args[0] as string;
        return value.length * 2;
      }
    }

    const instance = new TestClass();
    const result1 = instance.expensiveOperation('test');
    const result2 = instance.expensiveOperation('test');

    expect(result1).toBe(8);
    expect(result2).toBe(8);
    expect(callCount).toBe(1);
  });

  it('should cache different arguments separately', () => {
    let callCount = 0;

    class TestClass {
      @Cache()
      operation(...args: unknown[]): number {
        callCount++;
        const value = args[0] as string;
        return value.length;
      }
    }

    const instance = new TestClass();
    instance.operation('a');
    instance.operation('b');
    instance.operation('a'); // Should use cache

    expect(callCount).toBe(2);
  });

  it('should respect cache size limit', () => {
    let callCount = 0;

    class TestClass {
      @Cache({ maxSize: 2 })
      cached(...args: unknown[]): string {
        callCount++;
        const value = args[0] as string;
        return value.toUpperCase();
      }
    }

    const instance = new TestClass();
    instance.cached('a');
    instance.cached('b');
    instance.cached('c'); // Should evict 'a'
    instance.cached('a'); // Should call again

    expect(callCount).toBe(4);
  });

  it('should respect TTL expiration', async () => {
    let callCount = 0;

    class TestClass {
      @Cache({ ttl: 100 })
      cached(..._args: unknown[]): number {
        callCount++;
        return Date.now();
      }
    }

    const instance = new TestClass();
    instance.cached('test');
    instance.cached('test'); // Should use cache
    await new Promise((resolve) => setTimeout(resolve, 150));
    instance.cached('test'); // Should call again after TTL

    expect(callCount).toBe(2);
  });

  it('should work with scoring functions', () => {
    let callCount = 0;

    class SearchService {
      @Cache()
      score(...args: unknown[]): number {
        callCount++;
        const s1 = args[0] as string;
        const s2 = args[1] as string;
        return WRatio(s1, s2);
      }
    }

    const service = new SearchService();
    const score1 = service.score('hello', 'world');
    const score2 = service.score('hello', 'world');

    expect(score1).toBe(score2);
    expect(callCount).toBe(1);
  });
});

describe('Validate decorator', () => {
  it('should validate arguments before execution', () => {
    class TestClass {
      @Validate(validationRules.nonEmptyString)
      process(...args: unknown[]): string {
        const value = args[0] as string;
        return value.toUpperCase();
      }
    }

    const instance = new TestClass();
    expect(instance.process('hello')).toBe('HELLO');
  });

  it('should throw ValidationError on invalid input', () => {
    class TestClass {
      @Validate(validationRules.nonEmptyString)
      process(...args: unknown[]): string {
        const value = args[0] as string;
        return value.toUpperCase();
      }
    }

    const instance = new TestClass();
    expect(() => instance.process('')).toThrow(ValidationError);
    expect(() => instance.process('')).toThrow('String cannot be empty');
  });

  it('should throw ValidationError for non-string input', () => {
    class TestClass {
      @Validate(validationRules.nonEmptyString)
      process(...args: unknown[]): string {
        const value = args[0] as string;
        return value.toUpperCase();
      }
    }

    const instance = new TestClass();
    expect(() => instance.process(123)).toThrow(ValidationError);
    expect(() => instance.process(null)).toThrow(ValidationError);
  });

  it('should work with multiple validation rules', () => {
    class TestClass {
      @Validate(validationRules.nonEmptyString, validationRules.maxLength(10))
      process(...args: unknown[]): string {
        const value = args[0] as string;
        return value.toUpperCase();
      }
    }

    const instance = new TestClass();
    expect(instance.process('hello')).toBe('HELLO');
    expect(() => instance.process('a'.repeat(11))).toThrow(ValidationError);
  });

  it('should validate before expensive operations', () => {
    let operationCalled = false;

    class TestClass {
      @Validate(validationRules.nonEmptyString)
      expensiveOperation(..._args: unknown[]): void {
        operationCalled = true;
      }
    }

    const instance = new TestClass();
    expect(() => instance.expensiveOperation('')).toThrow(ValidationError);
    expect(operationCalled).toBe(false);
  });
});

describe('Metadata decorator', () => {
  it('should attach metadata to methods', () => {
    class TestClass {
      @Metadata('route', '/users')
      @Metadata('method', 'GET')
      handler(): void {
        // Handler logic
      }
    }

    expect(hasMetadata('route', TestClass.prototype)).toBe(true);
    expect(hasMetadata('method', TestClass.prototype)).toBe(true);
    expect(getMetadata<string>('route', TestClass.prototype)).toBe('/users');
    expect(getMetadata<string>('method', TestClass.prototype)).toBe('GET');
  });

  it('should return undefined for non-existent metadata', () => {
    class TestClass {
      handler(): void {
        // Handler logic
      }
    }

    expect(hasMetadata('nonexistent', TestClass.prototype)).toBe(false);
    expect(getMetadata('nonexistent', TestClass.prototype)).toBeUndefined();
  });

  it('should support different metadata types', () => {
    class TestClass {
      @Metadata('count', 42)
      @Metadata('enabled', true)
      @Metadata('tags', ['user', 'admin'])
      handler(): void {
        // Handler logic
      }
    }

    expect(getMetadata<number>('count', TestClass.prototype)).toBe(42);
    expect(getMetadata<boolean>('enabled', TestClass.prototype)).toBe(true);
    expect(getMetadata<string[]>('tags', TestClass.prototype)).toEqual(['user', 'admin']);
  });
});

describe('Decorator composition', () => {
  it('should combine Cache and Validate decorators', () => {
    let callCount = 0;

    class SearchService {
      @Cache({ maxSize: 10 })
      @Validate(validationRules.nonEmptyString)
      search(...args: unknown[]): number {
        callCount++;
        const query = args[0] as string;
        return query.length;
      }
    }

    const service = new SearchService();
    expect(service.search('test')).toBe(4);
    expect(service.search('test')).toBe(4); // Cached
    expect(callCount).toBe(1);
    expect(() => service.search('')).toThrow(ValidationError);
  });
});
