/**
 * Tokenization utilities for string processing.
 * Part of core layer as it's fundamental to token-based algorithms.
 */

/**
 * Tokenizes a string into an array of lowercase tokens.
 * Splits on whitespace, dashes, and underscores.
 * Optimized single-pass algorithm with O(n) complexity.
 *
 * @param str - String to tokenize
 * @returns Array of lowercase tokens
 */
export function tokenize(str: string): string[] {
  const tokens: string[] = [];
  const tokenChars: string[] = [];
  const len = str.length;

  for (let i = 0; i < len; i++) {
    const char = str[i];
    if (char === undefined) break;
    const code = char.charCodeAt(0);

    // Fast check for whitespace/delimiter: space(32), tab(9), newline(10), dash(45), underscore(95)
    if (code === 32 || code === 9 || code === 10 || code === 45 || code === 95) {
      if (tokenChars.length > 0) {
        tokens.push(tokenChars.join('').toLowerCase());
        tokenChars.length = 0; // Clear array efficiently
      }
    } else {
      tokenChars.push(char);
    }
  }

  if (tokenChars.length > 0) {
    tokens.push(tokenChars.join('').toLowerCase());
  }

  return tokens;
}

/**
 * Sorts tokens and joins them into a single string.
 * Optimized for small arrays with inline sorting.
 *
 * @param tokens - Array of tokens to sort
 * @returns Sorted tokens joined by spaces
 */
export function sortTokens(tokens: string[]): string {
  // For very small arrays, inline sort is faster
  if (tokens.length <= 1) return tokens.join(' ');
  if (tokens.length === 2) {
    const t0 = tokens[0];
    const t1 = tokens[1];
    if (t0 === undefined || t1 === undefined) return tokens.join(' ');
    return t0 < t1 ? `${t0} ${t1}` : `${t1} ${t0}`;
  }
  // For larger arrays, use native sort
  const sorted = tokens.slice().sort();
  return sorted.join(' ');
}

/**
 * Creates a Set from an array of tokens for efficient lookups.
 *
 * @param tokens - Array of tokens
 * @returns Set of tokens
 */
export function tokenSet(tokens: string[]): Set<string> {
  return new Set(tokens);
}
