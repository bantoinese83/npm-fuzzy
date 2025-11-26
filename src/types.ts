/**
 * Core types used across all layers
 */

export type ProcessorFunction = (str: string) => string;

export type ScorerFunction = (s1: string, s2: string) => number;

export interface ExtractResult {
  choice: string;
  score: number;
}

export interface ExtractOneResult {
  choice: string;
  score: number;
}
