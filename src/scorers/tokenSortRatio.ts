import { tokenSortRatio as coreTokenSortRatio } from '../core';
import { ProcessorFunction } from '../types';
import { defaultProcessor } from '../utils/processor';

export function tokenSortRatio(s1: string, s2: string, processor?: ProcessorFunction): number {
  const proc = processor || defaultProcessor;
  return coreTokenSortRatio(proc(s1), proc(s2));
}
