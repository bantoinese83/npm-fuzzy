import { describe, it, expect } from 'vitest';
import { createScorer, scorerBuilder } from '../src/builders';

describe('createScorer', () => {
  it('should create a scorer with default config', () => {
    const scorer = createScorer();
    const score = scorer('hello', 'hello');
    expect(score).toBe(100);
  });

  it('should create a scorer with simple algorithm', () => {
    const scorer = createScorer({ algorithm: 'simple' });
    const score = scorer('kitten', 'sitting');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should create a scorer with partial algorithm', () => {
    const scorer = createScorer({ algorithm: 'partial' });
    const score = scorer('abc', 'abcdef');
    expect(score).toBe(100);
  });

  it('should create a scorer with tokenSort algorithm', () => {
    const scorer = createScorer({ algorithm: 'tokenSort' });
    const score = scorer('John Smith', 'Smith John');
    expect(score).toBe(100);
  });

  it('should create a scorer with tokenSet algorithm', () => {
    const scorer = createScorer({ algorithm: 'tokenSet' });
    const score = scorer('John Smith', 'John Smith Jr');
    expect(score).toBeGreaterThan(80);
  });

  it('should create a scorer with weighted algorithm', () => {
    const scorer = createScorer({ algorithm: 'weighted' });
    const score = scorer('hello world', 'hello wrld');
    expect(score).toBeGreaterThan(80);
  });

  it('should respect min score bound', () => {
    const scorer = createScorer({ minScore: 50 });
    const score = scorer('abc', 'def');
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('should respect max score bound', () => {
    const scorer = createScorer({ maxScore: 75 });
    const score = scorer('hello', 'hello');
    expect(score).toBeLessThanOrEqual(75);
  });

  it('should respect min and max score bounds', () => {
    const scorer = createScorer({ minScore: 50, maxScore: 75 });
    const score = scorer('abc', 'def');
    expect(score).toBeGreaterThanOrEqual(50);
    expect(score).toBeLessThanOrEqual(75);
  });

  it('should use custom processor', () => {
    const customProcessor = (str: string): string => str.toUpperCase().trim();
    const scorer = createScorer({ processor: customProcessor });
    const score = scorer('  hello  ', 'HELLO');
    expect(score).toBe(100);
  });

  it('should handle empty strings', () => {
    const scorer = createScorer();
    const score = scorer('', '');
    expect(score).toBe(100);
  });
});

describe('scorerBuilder', () => {
  it('should build scorer with method chaining', () => {
    const scorer = scorerBuilder()
      .withAlgorithm('simple')
      .withMinScore(10)
      .withMaxScore(90)
      .build();

    const score = scorer('test', 'test');
    expect(score).toBe(90); // Capped at maxScore
  });

  it('should allow partial configuration', () => {
    const scorer = scorerBuilder().withAlgorithm('partial').build();
    const score = scorer('abc', 'abcdef');
    expect(score).toBe(100);
  });

  it('should allow chaining all methods', () => {
    const customProcessor = (str: string): string => str.toLowerCase();
    const scorer = scorerBuilder()
      .withAlgorithm('weighted')
      .withProcessor(customProcessor)
      .withMinScore(0)
      .withMaxScore(100)
      .build();

    const score = scorer('HELLO', 'hello');
    expect(score).toBe(100);
  });

  it('should allow multiple builder instances', () => {
    const scorer1 = scorerBuilder().withAlgorithm('simple').build();
    const scorer2 = scorerBuilder().withAlgorithm('partial').build();

    expect(scorer1('test', 'test')).toBe(100);
    expect(scorer2('abc', 'abcdef')).toBe(100);
  });

  it('should handle builder reuse', () => {
    const builder = scorerBuilder().withAlgorithm('weighted');
    const scorer1 = builder.withMinScore(50).build();
    const scorer2 = builder.withMinScore(0).build();

    const score1 = scorer1('abc', 'def');
    const score2 = scorer2('abc', 'def');
    expect(score1).toBeGreaterThanOrEqual(50);
    expect(score2).toBeLessThan(50);
  });
});
