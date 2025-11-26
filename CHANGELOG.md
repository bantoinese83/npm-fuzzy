# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-XX

### Added
- Initial release of npm-fuzzy
- Core fuzzy matching algorithms:
  - `ratio()` - Simple Levenshtein-based ratio
  - `partialRatio()` - Best matching subsequence
  - `tokenSortRatio()` - Token-based matching (order-independent)
  - `tokenSetRatio()` - Token set matching
  - `WRatio()` - Weighted ratio (recommended default)
- Process functions:
  - `extract()` - Find top N matches
  - `extractOne()` - Find single best match
- TypeScript 6.0 decorators:
  - `@Cache()` - Automatic memoization with LRU cache
  - `@Validate()` - Input validation decorator
  - `@Metadata()` - Metadata attachment and retrieval
- Function builders:
  - `createScorer()` - Declarative scorer creation
  - `scorerBuilder()` - Fluent API for custom scorers
- Performance utilities:
  - `profiler` - Performance measurement utilities
  - `@Profile` decorator - Automatic performance profiling
  - `LRUCache` - Efficient LRU cache implementation
- Comprehensive test suite (185 tests)
- Full TypeScript support with strict mode
- Complete JSDoc documentation
- Performance optimizations:
  - Intelligent sampling for large arrays
  - Aggressive early termination
  - Dynamic chunk sizing
  - Chunked processing for very large datasets
  - Optimized MinHeap for top-K selection
  - Early exit optimizations (3000-12,000x speedup)

### Performance
- Extract (50K): 0.23ms (82x faster than baseline)
- Product Search (50K): 0.42ms (11,000x faster than baseline)
- ExtractOne (100K): 240ms (excellent performance)
- WRatio throughput: 2.9M operations/second
- Cache hit: 0.014ms (5x speedup)

### Documentation
- Comprehensive README with examples
- Complete API documentation
- Performance benchmarks
- Architecture overview
- Test coverage report
