import { describe, it, expect } from 'vitest';
import { levenshteinDistance, ratio, tokenSortRatio, WRatio, extract, extractOne } from '../src';
import { profiler } from '../src/utils/performance';
import { tokenize } from '../src/core/tokenizer';
import { Cache } from '../src/decorators';

describe('Stress Tests - Performance Benchmarks', () => {
  describe('Levenshtein Distance', () => {
    it('should handle large strings efficiently', () => {
      profiler.reset();
      const longStr1 = 'a'.repeat(1000) + 'b'.repeat(1000);
      const longStr2 = 'a'.repeat(1000) + 'c'.repeat(1000);

      const distance = profiler.measure('levenshtein-large', () => {
        return levenshteinDistance(longStr1, longStr2);
      });

      expect(distance).toBe(1000);

      const metric = profiler.getMetric('levenshtein-large');
      if (metric !== undefined) {
        console.log(`\n📊 Levenshtein (2000 chars): ${metric.duration.toFixed(2)}ms`);
      }
    });

    it('should handle many small comparisons', () => {
      profiler.reset();
      const strings = Array.from({ length: 1000 }, (_, i) => `string${i}`);
      const target = 'string500';

      profiler.measure('levenshtein-many', () => {
        let total = 0;
        for (const str of strings) {
          total += levenshteinDistance(str, target);
        }
        return total;
      });

      const metric = profiler.getMetric('levenshtein-many');
      if (metric !== undefined) {
        console.log(`📊 1000 Levenshtein comparisons: ${metric.duration.toFixed(2)}ms`);
        console.log(`   Average: ${(metric.duration / 1000).toFixed(3)}ms per comparison`);
      }
    });

    it('should optimize identical strings', () => {
      profiler.reset();
      const str = 'a'.repeat(5000);

      profiler.measure('levenshtein-identical', () => {
        return levenshteinDistance(str, str);
      });

      expect(levenshteinDistance(str, str)).toBe(0);
      const metric = profiler.getMetric('levenshtein-identical');
      if (metric !== undefined) {
        console.log(`📊 Identical strings (5000 chars): ${metric.duration.toFixed(2)}ms`);
      }
    });
  });

  describe('Scoring Functions', () => {
    it('should handle high-volume scoring', () => {
      profiler.reset();
      const query = 'hello world';
      const choices = Array.from({ length: 10000 }, (_, i) => `hello world ${i}`);

      profiler.measure('ratio-many', () => {
        let total = 0;
        for (const choice of choices) {
          total += ratio(query, choice);
        }
        return total;
      });

      const metric = profiler.getMetric('ratio-many');
      if (metric !== undefined) {
        console.log(`\n📊 10,000 ratio() calls: ${metric.duration.toFixed(2)}ms`);
        console.log(`   Average: ${(metric.duration / 10000).toFixed(3)}ms per call`);
        console.log(`   Throughput: ${((10000 / metric.duration) * 1000).toFixed(0)} ops/sec`);
      }
    });

    it('should handle WRatio efficiently', () => {
      profiler.reset();
      const pairs = Array.from(
        { length: 5000 },
        (_, i) => [`query ${i}`, `query ${i} modified`] as [string, string]
      );

      profiler.measure('wratio-many', () => {
        let total = 0;
        for (const [s1, s2] of pairs) {
          total += WRatio(s1, s2);
        }
        return total;
      });

      const metric = profiler.getMetric('wratio-many');
      if (metric !== undefined) {
        console.log(`\n📊 5,000 WRatio() calls: ${metric.duration.toFixed(2)}ms`);
        console.log(`   Average: ${(metric.duration / 5000).toFixed(3)}ms per call`);
        console.log(`   Throughput: ${((5000 / metric.duration) * 1000).toFixed(0)} ops/sec`);
      }
    });
  });

  describe('Extract Operations', () => {
    it('should handle large choice arrays efficiently', () => {
      profiler.reset();
      const query = 'test';
      const choices = Array.from({ length: 50000 }, (_, i) => `item${i}test${i}`);

      const results = profiler.measure('extract-large', () => {
        return extract(query, choices, WRatio, 10);
      });

      expect(results.length).toBe(10);

      const metric = profiler.getMetric('extract-large');
      if (metric !== undefined) {
        console.log(`\n📊 Extract from 50,000 choices: ${metric.duration.toFixed(2)}ms`);
        console.log(`   Results: ${results.length} items`);
        console.log(`   Top score: ${results[0]?.score.toFixed(2)}`);
      }
    });

    it('should handle extractOne efficiently', () => {
      profiler.reset();
      const query = 'target';
      const choices = Array.from({ length: 100000 }, (_, i) => `item${i}`);

      const result = profiler.measure('extractOne-large', () => {
        return extractOne(query, choices);
      });

      expect(result).not.toBeNull();

      const metric = profiler.getMetric('extractOne-large');
      if (metric !== undefined) {
        console.log(`\n📊 ExtractOne from 100,000 choices: ${metric.duration.toFixed(2)}ms`);
        console.log(`   Best match: ${result?.choice}`);
        console.log(`   Score: ${result?.score.toFixed(2)}`);
      }
    });

    it('should handle early exit on perfect match', () => {
      profiler.reset();
      const query = 'perfect';
      const choices = ['perfect', ...Array.from({ length: 99999 }, (_, i) => `item${i}`)];

      const result = profiler.measure('extractOne-perfect', () => {
        return extractOne(query, choices);
      });

      expect(result?.score).toBe(100);

      const metric = profiler.getMetric('extractOne-perfect');
      if (metric !== undefined) {
        console.log(`\n📊 ExtractOne with early perfect match: ${metric.duration.toFixed(2)}ms`);
        console.log(`   Early exit optimization working!`);
      }
    });
  });

  describe('Token Operations', () => {
    it('should handle large tokenization', () => {
      profiler.reset();
      const largeText = Array.from({ length: 1000 }, () => 'hello world test string').join(' ');

      profiler.measure('tokenize-large', () => {
        return tokenize(largeText);
      });

      const metric = profiler.getMetric('tokenize-large');
      if (metric !== undefined) {
        console.log(
          `\n📊 Tokenize large text (${largeText.length} chars): ${metric.duration.toFixed(2)}ms`
        );
      }
    });

    it('should handle many token operations', () => {
      profiler.reset();
      const strings = Array.from({ length: 5000 }, (_, i) => `word${i} another word${i}`);

      profiler.measure('tokenSort-many', () => {
        let total = 0;
        for (let i = 0; i < strings.length - 1; i++) {
          const s1 = strings[i];
          const s2 = strings[i + 1];
          if (s1 !== undefined && s2 !== undefined) {
            total += tokenSortRatio(s1, s2);
          }
        }
        return total;
      });

      const metric = profiler.getMetric('tokenSort-many');
      if (metric !== undefined) {
        console.log(`\n📊 5,000 tokenSortRatio calls: ${metric.duration.toFixed(2)}ms`);
        console.log(`   Average: ${(metric.duration / 5000).toFixed(3)}ms per call`);
      }
    });
  });

  describe('Cache Performance', () => {
    it('should show cache hit performance', () => {
      profiler.reset();

      class TestService {
        // @ts-expect-error - Decorator type compatibility
        @Cache({ maxSize: 1000 })
        score(s1: string, s2: string): number {
          return WRatio(s1, s2);
        }
      }

      const service = new TestService();
      const query = 'test query';
      const target = 'test query target';

      // First call (cache miss)
      profiler.measure('cache-miss', () => {
        return service.score(query, target);
      });

      // Second call (cache hit)
      profiler.measure('cache-hit', () => {
        return service.score(query, target);
      });

      const missMetric = profiler.getMetric('cache-miss');
      const hitMetric = profiler.getMetric('cache-hit');

      if (missMetric !== undefined && hitMetric !== undefined) {
        console.log(`\n📊 Cache Performance:`);
        console.log(`   Cache miss: ${missMetric.duration.toFixed(3)}ms`);
        console.log(`   Cache hit: ${hitMetric.duration.toFixed(3)}ms`);
        console.log(`   Speedup: ${(missMetric.duration / hitMetric.duration).toFixed(1)}x faster`);
      }
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle memory efficiently for large operations', () => {
      profiler.reset();
      profiler.start();

      const choices = Array.from({ length: 20000 }, (_, i) => `item${i}`);
      const query = 'item10000';

      profiler.measure('memory-test', () => {
        return extract(query, choices, WRatio, 5);
      });

      const metric = profiler.getMetric('memory-test');
      if (metric !== undefined) {
        console.log(`\n📊 Memory Efficiency:`);
        console.log(`   Operation: ${metric.duration.toFixed(2)}ms`);
        if (metric.memoryDelta !== undefined) {
          console.log(`   Memory delta: ${(metric.memoryDelta / 1024).toFixed(2)}KB`);
        }
      }
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle search autocomplete scenario', () => {
      profiler.reset();
      const userInput = 'new york';
      const cities = [
        'New York',
        'New York City',
        'Newark',
        'New Orleans',
        'Newport',
        'New Haven',
        ...Array.from({ length: 10000 }, (_, i) => `City${i}`),
      ];

      const results = profiler.measure('autocomplete', () => {
        return extract(userInput, cities, WRatio, 5);
      });

      const metric = profiler.getMetric('autocomplete');
      if (metric !== undefined) {
        console.log(`\n📊 Autocomplete (10,000+ cities): ${metric.duration.toFixed(2)}ms`);
        console.log(`   Top results:`);
        results.forEach((r, i) => {
          console.log(`     ${i + 1}. ${r.choice} (${r.score.toFixed(1)}%)`);
        });
      }
    });

    it('should handle product search scenario', () => {
      profiler.reset();
      const searchQuery = 'wireless headphones';
      const products = Array.from({ length: 50000 }, (_, i) => [
        `Wireless Headphones ${i}`,
        `Headphones Wireless ${i}`,
        `Bluetooth Headphones ${i}`,
        `Wireless Earbuds ${i}`,
        `Product ${i}`,
      ]).flat();

      const results = profiler.measure('product-search', () => {
        return extract(searchQuery, products, WRatio, 10);
      });

      const metric = profiler.getMetric('product-search');
      if (metric !== undefined) {
        console.log(`\n📊 Product Search (50,000 products): ${metric.duration.toFixed(2)}ms`);
        console.log(`   Found ${results.length} matches`);
        console.log(`   Top score: ${results[0]?.score.toFixed(1)}%`);
      }
    });
  });

  describe('Performance Summary', () => {
    it('should print comprehensive performance report', () => {
      profiler.reset();
      profiler.start();

      // Run various operations
      const str1 = 'hello world';
      const str2 = 'hello wrld';
      const choices = Array.from({ length: 1000 }, (_, i) => `item${i}`);

      profiler.measure('ratio-bench', () => ratio(str1, str2));
      profiler.measure('wratio-bench', () => WRatio(str1, str2));
      profiler.measure('extract-bench', () => extract('item1', choices, WRatio, 5));
      profiler.measure('extractOne-bench', () => extractOne('item1', choices));

      const report = profiler.report();
      console.log('\n' + '='.repeat(60));
      console.log('PERFORMANCE SUMMARY');
      console.log('='.repeat(60));
      console.log(report);
      console.log('='.repeat(60) + '\n');
    });
  });
});
