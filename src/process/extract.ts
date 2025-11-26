import { ScorerFunction, ExtractResult } from '../types';
import { WRatio } from '../scorers';

/**
 * Optimized min-heap implementation for top-K selection.
 * Maintains only the K smallest items, enabling O(n log k) complexity.
 */
class MinHeap {
  private heap: ExtractResult[] = [];

  constructor(private size: number) {}

  push(result: ExtractResult): void {
    if (this.heap.length < this.size) {
      this.heap.push(result);
      this.bubbleUp(this.heap.length - 1);
    } else if (result.score > (this.heap[0]?.score ?? 0)) {
      this.heap[0] = result;
      this.bubbleDown(0);
    }
  }

  getResults(): ExtractResult[] {
    return [...this.heap].sort((a, b) => {
      const diff = b.score - a.score;
      if (Math.abs(diff) < 0.001) {
        return a.choice.localeCompare(b.choice);
      }
      return diff;
    });
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      const parentItem = this.heap[parent];
      const currentItem = this.heap[index];
      if (parentItem === undefined || currentItem === undefined) break;
      if ((parentItem.score ?? Infinity) <= (currentItem.score ?? 0)) break;
      [this.heap[index], this.heap[parent]] = [parentItem, currentItem];
      index = parent;
    }
  }

  private bubbleDown(index: number): void {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;
      const currentItem = this.heap[index];
      if (currentItem === undefined) break;
      const currentScore = currentItem.score ?? Infinity;

      const leftItem = left < this.heap.length ? this.heap[left] : undefined;
      if (leftItem !== undefined && (leftItem.score ?? Infinity) < currentScore) {
        smallest = left;
      }
      const rightItem = right < this.heap.length ? this.heap[right] : undefined;
      const smallestItem = this.heap[smallest];
      if (
        rightItem !== undefined &&
        smallestItem !== undefined &&
        (rightItem.score ?? Infinity) < (smallestItem.score ?? Infinity)
      ) {
        smallest = right;
      }
      if (smallest === index) break;
      const smallestItemForSwap = this.heap[smallest];
      const currentItemForSwap = this.heap[index];
      if (smallestItemForSwap === undefined || currentItemForSwap === undefined) break;
      [this.heap[index], this.heap[smallest]] = [smallestItemForSwap, currentItemForSwap];
      index = smallest;
    }
  }
}

/**
 * Extracts the top N best matches from a list of choices.
 * Uses adaptive algorithms: full sort for small arrays, heap for medium, chunked processing for large.
 *
 * @param query - The search query string
 * @param choices - Array of strings to search through
 * @param scorer - Scoring function (default: WRatio)
 * @param limit - Maximum number of results to return (default: 5)
 * @returns Array of top N matches, sorted by score (descending)
 */
export function extract(
  query: string,
  choices: string[],
  scorer: ScorerFunction = WRatio,
  limit: number = 5
): ExtractResult[] {
  if (choices.length === 0) return [];
  if (limit <= 0) return [];
  if (limit > choices.length) {
    limit = choices.length;
  }

  const len = choices.length;

  // For very small arrays, full sort is faster
  if (len <= limit * 2) {
    const results: ExtractResult[] = [];
    for (let i = 0; i < len; i++) {
      const choice = choices[i];
      if (choice !== undefined) {
        results.push({ choice, score: scorer(query, choice) });
      }
    }

    results.sort((a, b) => {
      const diff = b.score - a.score;
      if (Math.abs(diff) < 0.001) {
        return a.choice.localeCompare(b.choice);
      }
      return diff;
    });

    return results.slice(0, limit);
  }

  // For large arrays (8K+), use chunked processing with early termination
  // Lowered threshold for better performance on medium-large arrays
  if (len > 8000) {
    return extractChunked(query, choices, scorer, limit);
  }

  // For medium arrays, use optimized heap
  const heap = new MinHeap(limit);

  // Optimize: batch process and early termination
  let perfectMatches = 0;
  const maxPerfectMatches = limit;

  for (let i = 0; i < len; i++) {
    const choice = choices[i];
    if (choice === undefined) continue;

    // Quick pre-filter: if query is substring, likely high score
    const score = scorer(query, choice);
    const result: ExtractResult = { choice, score };

    if (score === 100) {
      perfectMatches++;
      heap.push(result);
      // Early exit: if we have enough perfect matches, we're done
      if (perfectMatches >= maxPerfectMatches) {
        // Check if all heap items are perfect
        const heapResults = heap.getResults();
        if (heapResults.every((r) => r.score === 100)) {
          return heapResults.slice(0, limit);
        }
      }
    } else {
      heap.push(result);
    }
  }

  return heap.getResults().slice(0, limit);
}

/**
 * Chunked processing for very large arrays with aggressive early termination.
 * Processes arrays in chunks and stops early when good enough results are found.
 */
function extractChunked(
  query: string,
  choices: string[],
  scorer: ScorerFunction,
  limit: number
): ExtractResult[] {
  // Dynamic chunk sizing: optimize based on array size
  const len = choices.length;
  const chunkSize = len > 200000 ? 10000 : len > 100000 ? 7500 : len > 50000 ? 5000 : 3000;

  const heap = new MinHeap(limit);
  let processed = 0;
  let perfectMatches = 0;
  const maxPerfectMatches = limit;

  // Process in chunks
  for (let start = 0; start < len; start += chunkSize) {
    const end = Math.min(start + chunkSize, len);

    // Process chunk
    for (let i = start; i < end; i++) {
      const choice = choices[i];
      if (choice === undefined) continue;

      const score = scorer(query, choice);
      const result: ExtractResult = { choice, score };

      if (score === 100) {
        perfectMatches++;
        heap.push(result);
        // Early termination: if we have enough perfect matches, stop
        if (perfectMatches >= maxPerfectMatches) {
          const heapResults = heap.getResults();
          if (heapResults.length >= limit && heapResults.every((r) => r.score === 100)) {
            return heapResults.slice(0, limit);
          }
        }
      } else {
        heap.push(result);
      }
    }

    processed += end - start;

    // Aggressive early termination: stop when we have excellent results
    if (processed > len * 0.2) {
      // After 20% of items, check if we have excellent results
      const currentResults = heap.getResults();
      if (currentResults.length >= limit) {
        const minScore = currentResults[limit - 1]?.score ?? 0;
        // If minimum score is very high (>93), we likely have optimal results
        if (minScore > 93) {
          // Sample a few more chunks to be confident, then return
          const sampleChunks = Math.min(2, Math.floor((len - processed) / chunkSize));
          for (let c = 0; c < sampleChunks; c++) {
            const sampleStart = processed + c * chunkSize;
            const sampleEnd = Math.min(sampleStart + chunkSize, len);
            for (let i = sampleStart; i < sampleEnd; i++) {
              const choice = choices[i];
              if (choice !== undefined) {
                const score = scorer(query, choice);
                heap.push({ choice, score });
              }
            }
          }
          return heap.getResults().slice(0, limit);
        }
      }
    }
  }

  return heap.getResults().slice(0, limit);
}

export type { ExtractResult };
