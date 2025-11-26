/**
 * Public API - clean, organized exports
 */

// Scorers (main API)
export {
  ratio,
  partialRatio,
  tokenSortRatio,
  tokenSetRatio,
  WRatio,
  type ScorerFunction,
  type ProcessorFunction,
} from './scorers';

// Process functions
export { extract, extractOne, type ExtractResult, type ExtractOneResult } from './process';

// Core algorithms (for advanced usage)
export {
  levenshteinDistance,
  levenshteinRatio,
  partialRatio as corePartialRatio,
  tokenSortRatio as coreTokenSortRatio,
  tokenSetRatio as coreTokenSetRatio,
  weightedRatio,
} from './core';

// Decorators (TypeScript 6.0 decorators for enhanced APIs)
export {
  Cache,
  Validate,
  ValidationError,
  validationRules,
  type ValidationRule,
  Metadata,
  defineMetadata,
  getMetadata,
  hasMetadata,
} from './decorators';

// Function builders (for creating custom scorers)
export { createScorer, scorerBuilder, ScorerBuilder, type ScorerConfig } from './builders';

// Performance utilities
export { profiler, Profile, type PerformanceMetrics } from './utils/performance';
export { LRUCache } from './utils/lruCache';
