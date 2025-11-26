import { levenshteinRatio } from './levenshtein';

export function partialRatio(s1: string, s2: string): number {
  const shorter = s1.length <= s2.length ? s1 : s2;
  const longer = s1.length > s2.length ? s1 : s2;

  if (shorter.length === 0) return 0;
  if (longer.length === 0) return 0;

  // Early exit optimizations
  if (longer.includes(shorter)) return 100;
  // If strings start or end the same, likely high match
  if (longer.startsWith(shorter) || longer.endsWith(shorter)) {
    return 100;
  }

  let bestRatio = 0;
  const windowSize = shorter.length;
  const maxPos = longer.length - windowSize;

  // Optimize: for very short strings, use substring. For longer, we could optimize further.
  for (let i = 0; i <= maxPos; i++) {
    const substring = longer.substring(i, i + windowSize);
    const ratio = levenshteinRatio(shorter, substring);
    bestRatio = Math.max(bestRatio, ratio);

    // Early exit: perfect match found
    if (bestRatio === 100) break;
  }

  return bestRatio;
}
