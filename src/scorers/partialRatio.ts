import { partialRatio as corePartialRatio } from '../core';
import { ProcessorFunction } from '../types';
import { defaultProcessor } from '../utils/processor';

export function partialRatio(s1: string, s2: string, processor?: ProcessorFunction): number {
  const proc = processor || defaultProcessor;
  return corePartialRatio(proc(s1), proc(s2));
}
