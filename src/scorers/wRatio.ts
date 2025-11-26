import { weightedRatio } from '../core';
import { ProcessorFunction } from '../types';
import { defaultProcessor } from '../utils/processor';

export function WRatio(s1: string, s2: string, processor?: ProcessorFunction): number {
  const proc = processor || defaultProcessor;
  return weightedRatio(proc(s1), proc(s2));
}
