import { tokenize, sortTokens } from './tokenizer';
import { levenshteinRatio } from './levenshtein';

export function tokenSortRatio(s1: string, s2: string): number {
  const tokens1 = tokenize(s1);
  const tokens2 = tokenize(s2);

  if (tokens1.length === 0 && tokens2.length === 0) return 100;
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  // Early exit: if token counts differ significantly, likely low match
  if (Math.abs(tokens1.length - tokens2.length) > Math.max(tokens1.length, tokens2.length) * 0.5) {
    // Still compute but we know it won't be perfect
  }

  const sorted1 = sortTokens(tokens1);
  const sorted2 = sortTokens(tokens2);

  // Early exit: if sorted tokens are identical, perfect match
  if (sorted1 === sorted2) return 100;

  return levenshteinRatio(sorted1, sorted2);
}
