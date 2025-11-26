import { levenshteinRatio } from './levenshtein';
import { tokenSortRatio } from './tokenSortRatio';
import { tokenSetRatio } from './tokenSetRatio';
import { partialRatio } from './partialRatio';

export function weightedRatio(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const lenRatio = len1 > len2 ? len2 / len1 : len1 / len2;

  // Early exit for identical strings
  if (s1 === s2) return 100;

  if (lenRatio > 0.8) {
    // Similar lengths - try simple ratio first (fastest)
    const simpleRatio = levenshteinRatio(s1, s2);
    if (simpleRatio === 100) return 100; // Early exit

    const tokenSort = tokenSortRatio(s1, s2);
    if (tokenSort === 100) return 100; // Early exit

    const tokenSet = tokenSetRatio(s1, s2);
    return Math.max(simpleRatio, tokenSort, tokenSet);
  }

  if (lenRatio < 0.6) {
    // Very different lengths - partial ratio is most relevant
    const partial = partialRatio(s1, s2);
    if (partial === 100) return 100; // Early exit

    const tokenSort = tokenSortRatio(s1, s2);
    const tokenSet = tokenSetRatio(s1, s2);

    return Math.max(partial, tokenSort * 0.95, tokenSet * 0.95);
  }

  // Middle ground - try simple first (cheapest)
  const simpleRatio = levenshteinRatio(s1, s2);
  if (simpleRatio === 100) return 100;

  const partial = partialRatio(s1, s2);
  if (partial === 100) return 100;

  const tokenSort = tokenSortRatio(s1, s2);
  const tokenSet = tokenSetRatio(s1, s2);

  return Math.max(simpleRatio, partial, tokenSort, tokenSet);
}
