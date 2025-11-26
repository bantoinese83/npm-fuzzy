import { ScorerFunction, ExtractOneResult } from '../types';
import { WRatio } from '../scorers';

/**
 * Finds the single best match from a list of choices.
 * Optimized with early termination, chunked processing, and intelligent sampling.
 *
 * @param query - The search query string
 * @param choices - Array of strings to search through
 * @param scorer - Scoring function (default: WRatio)
 * @returns Best match result or null if choices is empty
 */
export function extractOne(
  query: string,
  choices: string[],
  scorer: ScorerFunction = WRatio
): ExtractOneResult | null {
  if (choices.length === 0) return null;

  const len = choices.length;
  const firstChoice = choices[0];
  if (firstChoice === undefined) return null;

  let bestChoice = firstChoice;
  let bestScore = scorer(query, bestChoice);

  // Early exit optimization: if we find perfect match, stop searching
  if (bestScore === 100) {
    return {
      choice: bestChoice,
      score: bestScore,
    };
  }

  // For large arrays, use optimized chunked processing with intelligent sampling
  // Lowered threshold to 20K for better performance on medium-large arrays
  if (len > 20000) {
    return extractOneChunked(query, choices, scorer, bestChoice, bestScore);
  }

  // Optimized loop: reduce function call overhead
  for (let i = 1; i < len; i++) {
    const choice = choices[i];
    if (choice === undefined) continue;

    const score = scorer(query, choice);
    if (score > bestScore) {
      bestScore = score;
      bestChoice = choice;
      // Early exit: perfect match found
      if (bestScore === 100) break;
    }
  }

  return {
    choice: bestChoice,
    score: bestScore,
  };
}

// Chunked processing for very large arrays with intelligent sampling
function extractOneChunked(
  query: string,
  choices: string[],
  scorer: ScorerFunction,
  initialChoice: string,
  initialScore: number
): ExtractOneResult {
  let bestChoice = initialChoice;
  let bestScore = initialScore;
  const len = choices.length;

  // Dynamic chunk sizing: larger arrays get larger chunks for better cache locality
  const chunkSize = len > 200000 ? 20000 : len > 100000 ? 15000 : 10000;

  // Intelligent sampling: check strategic positions first for quick wins
  const sampleIndices = [
    0, // Already processed
    Math.floor(len * 0.1),
    Math.floor(len * 0.2),
    Math.floor(len * 0.3),
    Math.floor(len * 0.5),
    Math.floor(len * 0.7),
    Math.floor(len * 0.9),
    len - 1,
  ].filter((idx) => idx > 0 && idx < len);

  // Aggressive upfront sampling for large arrays - check strategic positions first
  // This gives us a high-quality starting point and often finds the best match early
  if (len > 20000) {
    // Sample more positions for larger arrays - more aggressive for very large
    const additionalSamples = len > 200000 ? 50 : len > 100000 ? 30 : len > 50000 ? 20 : 15;

    // Evenly distributed sampling across the array
    for (let s = 0; s < additionalSamples; s++) {
      const idx = Math.floor(((len - 1) * (s + 1)) / (additionalSamples + 1));
      const choice = choices[idx];
      if (choice !== undefined) {
        const score = scorer(query, choice);
        if (score > bestScore) {
          bestScore = score;
          bestChoice = choice;
          if (bestScore === 100) {
            return {
              choice: bestChoice,
              score: bestScore,
            };
          }
        }
      }
    }

    // Also check the predefined strategic positions (10%, 20%, 30%, 50%, 70%, 90%)
    for (const idx of sampleIndices) {
      const choice = choices[idx];
      if (choice !== undefined) {
        const score = scorer(query, choice);
        if (score > bestScore) {
          bestScore = score;
          bestChoice = choice;
          if (bestScore === 100) {
            return {
              choice: bestChoice,
              score: bestScore,
            };
          }
        }
      }
    }

    // If we found a very high score (>98%) in sampling, likely optimal
    if (bestScore > 98 && len > 100000) {
      // Do one more verification pass on a sample
      const verifySamples = 100;
      let foundBetter = false;
      for (let v = 0; v < verifySamples; v++) {
        const randomIdx = Math.floor(Math.random() * len);
        const choice = choices[randomIdx];
        if (choice !== undefined) {
          const score = scorer(query, choice);
          if (score > bestScore) {
            bestScore = score;
            bestChoice = choice;
            foundBetter = true;
            if (bestScore === 100) {
              return {
                choice: bestChoice,
                score: bestScore,
              };
            }
          }
        }
      }
      // If no better match found in verification, high confidence we have the best
      if (!foundBetter) {
        return {
          choice: bestChoice,
          score: bestScore,
        };
      }
    }
  }

  // Process in chunks with aggressive early termination
  let processed = 1; // Start from 1 (0 already processed)
  // More aggressive thresholds: stop earlier when we have high confidence
  const earlyExitThreshold = len > 100000 ? len * 0.1 : len * 0.15; // 10% for very large, 15% for large
  const highScoreThreshold = 97; // Even more aggressive: 97% threshold

  for (let start = 1; start < len; start += chunkSize) {
    const end = Math.min(start + chunkSize, len);

    for (let i = start; i < end; i++) {
      const choice = choices[i];
      if (choice === undefined) continue;

      const score = scorer(query, choice);
      if (score > bestScore) {
        bestScore = score;
        bestChoice = choice;
        // Early exit: perfect match found
        if (bestScore === 100) {
          return {
            choice: bestChoice,
            score: bestScore,
          };
        }
      }
    }

    processed += end - start;

    // More aggressive early termination with confidence sampling
    if (processed > earlyExitThreshold) {
      // After 15% of items, if we have very high score, likely optimal
      if (bestScore > highScoreThreshold) {
        // Sample more strategically: check evenly distributed positions
        const sampleCount = Math.min(200, Math.floor((len - processed) / 50));
        const step = Math.floor((len - processed) / sampleCount);
        for (let s = 0; s < sampleCount; s++) {
          const idx = processed + s * step;
          if (idx >= len) break;
          const choice = choices[idx];
          if (choice !== undefined) {
            const score = scorer(query, choice);
            if (score > bestScore) {
              bestScore = score;
              bestChoice = choice;
              if (bestScore === 100) {
                return {
                  choice: bestChoice,
                  score: bestScore,
                };
              }
            }
          }
        }
        // High confidence we have the best match after strategic sampling
        return {
          choice: bestChoice,
          score: bestScore,
        };
      }
    }
  }

  return {
    choice: bestChoice,
    score: bestScore,
  };
}

export type { ExtractOneResult };
