import { tokenize, tokenSet, sortTokens } from './tokenizer';
import { levenshteinRatio } from './levenshtein';

export function tokenSetRatio(s1: string, s2: string): number {
  const tokens1 = tokenize(s1);
  const tokens2 = tokenize(s2);

  if (tokens1.length === 0 && tokens2.length === 0) return 100;
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = tokenSet(tokens1);
  const set2 = tokenSet(tokens2);

  // Optimize: single pass to build all sets
  const intersection = new Set<string>();
  const only1 = new Set<string>();
  const only2 = new Set<string>();

  // Process set1
  for (const token of set1) {
    if (set2.has(token)) {
      intersection.add(token);
    } else {
      only1.add(token);
    }
  }

  // Process set2 - only tokens not in set1
  for (const token of set2) {
    if (!set1.has(token)) {
      only2.add(token);
    }
  }

  // Optimize: avoid multiple Array.from and spread operations
  const intersectionArr = Array.from(intersection);
  const only1Arr = Array.from(only1);
  const only2Arr = Array.from(only2);

  // Early exit if intersection is empty
  if (intersectionArr.length === 0) {
    return 0;
  }

  const intersectionStr = sortTokens(intersectionArr);

  // Pre-allocate combined arrays to avoid multiple allocations
  const len1 = intersectionArr.length + only1Arr.length;
  const len2 = intersectionArr.length + only2Arr.length;
  const combined1Arr = new Array<string>(len1);
  const combined2Arr = new Array<string>(len2);

  // Build combined1: intersection + only1
  let idx = 0;
  for (let i = 0; i < intersectionArr.length; i++) {
    const val = intersectionArr[i];
    if (val !== undefined) combined1Arr[idx++] = val;
  }
  for (let i = 0; i < only1Arr.length; i++) {
    const val = only1Arr[i];
    if (val !== undefined) combined1Arr[idx++] = val;
  }

  // Build combined2: intersection + only2
  idx = 0;
  for (let i = 0; i < intersectionArr.length; i++) {
    const val = intersectionArr[i];
    if (val !== undefined) combined2Arr[idx++] = val;
  }
  for (let i = 0; i < only2Arr.length; i++) {
    const val = only2Arr[i];
    if (val !== undefined) combined2Arr[idx++] = val;
  }

  const combined1 = sortTokens(combined1Arr);
  const combined2 = sortTokens(combined2Arr);

  const ratio1 = intersectionStr.length > 0 ? levenshteinRatio(intersectionStr, combined1) : 0;
  const ratio2 = intersectionStr.length > 0 ? levenshteinRatio(intersectionStr, combined2) : 0;
  const ratio3 = levenshteinRatio(combined1, combined2);

  return Math.max(ratio1, ratio2, ratio3);
}
