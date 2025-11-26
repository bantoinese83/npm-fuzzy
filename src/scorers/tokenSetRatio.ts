import { tokenSetRatio as coreTokenSetRatio } from '../core';
import { ProcessorFunction } from '../types';
import { defaultProcessor } from '../utils/processor';

export function tokenSetRatio(s1: string, s2: string, processor?: ProcessorFunction): number {
  const proc = processor || defaultProcessor;
  return coreTokenSetRatio(proc(s1), proc(s2));
}
