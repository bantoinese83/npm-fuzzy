/**
 * Function builders for creating custom scorers with configuration.
 * Enables declarative, composable scorer creation.
 */

import { ScorerFunction, ProcessorFunction } from '../types';
import {
  weightedRatio,
  levenshteinRatio,
  partialRatio,
  tokenSortRatio,
  tokenSetRatio,
} from '../core';
import { defaultProcessor } from '../utils/processor';

export interface ScorerConfig {
  algorithm?: 'weighted' | 'simple' | 'partial' | 'tokenSort' | 'tokenSet';
  processor?: ProcessorFunction;
  minScore?: number;
  maxScore?: number;
}

/**
 * Creates a custom scorer function with the specified configuration.
 * This is a function builder pattern that allows declarative scorer creation.
 */
export function createScorer(config: ScorerConfig = {}): ScorerFunction {
  const {
    algorithm = 'weighted',
    processor = defaultProcessor,
    minScore = 0,
    maxScore = 100,
  } = config;

  let coreScorer: (s1: string, s2: string) => number;

  switch (algorithm) {
    case 'simple':
      coreScorer = levenshteinRatio;
      break;
    case 'partial':
      coreScorer = partialRatio;
      break;
    case 'tokenSort':
      coreScorer = tokenSortRatio;
      break;
    case 'tokenSet':
      coreScorer = tokenSetRatio;
      break;
    case 'weighted':
    default:
      coreScorer = weightedRatio;
      break;
  }

  return (s1: string, s2: string): number => {
    const processed1 = processor(s1);
    const processed2 = processor(s2);
    const score = coreScorer(processed1, processed2);
    return Math.max(minScore, Math.min(maxScore, score));
  };
}

/**
 * Builder pattern for creating scorers with method chaining.
 */
export class ScorerBuilder {
  private algorithm: ScorerConfig['algorithm'] = 'weighted';
  private processor: ProcessorFunction | undefined = undefined;
  private minScore = 0;
  private maxScore = 100;

  withAlgorithm(algorithm: ScorerConfig['algorithm']): this {
    this.algorithm = algorithm;
    return this;
  }

  withProcessor(processor: ProcessorFunction): this {
    this.processor = processor;
    return this;
  }

  withMinScore(minScore: number): this {
    this.minScore = minScore;
    return this;
  }

  withMaxScore(maxScore: number): this {
    this.maxScore = maxScore;
    return this;
  }

  build(): ScorerFunction {
    return createScorer({
      algorithm: this.algorithm,
      processor: this.processor,
      minScore: this.minScore,
      maxScore: this.maxScore,
    });
  }
}

/**
 * Creates a new scorer builder instance.
 */
export function scorerBuilder(): ScorerBuilder {
  return new ScorerBuilder();
}
