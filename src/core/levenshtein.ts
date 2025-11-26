/**
 * Core Levenshtein distance algorithm.
 * Pure function with no external dependencies.
 *
 * Implements space-optimized dynamic programming with O(min(m,n)) space complexity.
 * Uses early exits and optimized array operations for maximum performance.
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Levenshtein distance between the two strings
 * @throws {Error} If array bounds are exceeded (should never happen in practice)
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Early exit for identical strings
  if (s1 === s2) return 0;

  // Optimize: use shorter string as inner dimension
  if (len1 < len2) {
    return levenshteinDistance(s2, s1);
  }

  // Pre-allocate arrays for better performance
  const row1: number[] = new Array<number>(len2 + 1);
  const row2: number[] = new Array<number>(len2 + 1);

  // Initialize first row
  for (let j = 0; j <= len2; j++) {
    row1[j] = j;
  }

  // Compute distance with efficient row swapping
  let prevRow = row1;
  let currRow = row2;

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;

    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      const currJMinus1 = currRow[j - 1];
      const prevJ = prevRow[j];
      const prevJMinus1 = prevRow[j - 1];

      if (currJMinus1 === undefined || prevJ === undefined || prevJMinus1 === undefined) {
        throw new Error('Array index out of bounds');
      }

      currRow[j] = Math.min(currJMinus1 + 1, prevJ + 1, prevJMinus1 + cost);
    }

    // Swap row references (zero-copy, just pointer swap)
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  const result = prevRow[len2];
  if (result === undefined) {
    throw new Error('Array index out of bounds');
  }
  return result;
}

/**
 * Calculates similarity ratio between two strings using Levenshtein distance.
 * Returns a value between 0 and 100, where 100 indicates identical strings.
 *
 * @param s1 - First string
 * @param s2 - Second string
 * @returns Similarity ratio (0-100)
 */
export function levenshteinRatio(s1: string, s2: string): number {
  // Early exit optimizations
  if (s1 === s2) return 100;

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  if (maxLen === 0) return 100;

  // Avoid division when possible
  if (distance === 0) return 100;
  if (distance >= maxLen) return 0;

  return ((maxLen - distance) / maxLen) * 100;
}
