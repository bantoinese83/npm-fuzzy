import { levenshteinRatio } from '../core';
import { ProcessorFunction } from '../types';
import { defaultProcessor } from '../utils/processor';

export function ratio(s1: string, s2: string, processor?: ProcessorFunction): number {
  const proc = processor || defaultProcessor;
  return levenshteinRatio(proc(s1), proc(s2));
}
