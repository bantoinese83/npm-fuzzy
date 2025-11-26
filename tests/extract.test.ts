import { describe, it, expect } from 'vitest';
import { extract, extractOne } from '../src/process';
import { ratio } from '../src/scorers';

describe('extract', () => {
  const choices = ['apple', 'banana', 'orange', 'grape', 'pineapple'];

  it('should return top matches', () => {
    const results = extract('app', choices);
    expect(results.length).toBeGreaterThan(0);
    const first = results[0];
    if (first === undefined) return;
    expect(first.choice).toBe('apple');
  });

  it('should respect limit', () => {
    const results = extract('a', choices, undefined, 2);
    expect(results.length).toBe(2);
  });

  it('should return empty array for empty choices', () => {
    expect(extract('test', [])).toEqual([]);
  });

  it('should use custom scorer', () => {
    const results = extract('app', choices, ratio);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should sort by score descending', () => {
    const results = extract('apple', choices);
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      if (prev === undefined || curr === undefined) continue;
      expect(prev.score).toBeGreaterThanOrEqual(curr.score);
    }
  });
});

describe('extractOne', () => {
  const choices = ['apple', 'banana', 'orange', 'grape'];

  it('should return best match', () => {
    const result = extractOne('app', choices);
    expect(result).not.toBeNull();
    if (result === null) return;
    expect(result.choice).toBe('apple');
    expect(result.score).toBeGreaterThan(0);
  });

  it('should return null for empty choices', () => {
    expect(extractOne('test', [])).toBeNull();
  });

  it('should use custom scorer', () => {
    const result = extractOne('app', choices, ratio);
    expect(result).not.toBeNull();
  });
});
