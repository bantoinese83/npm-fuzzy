/**
 * String processing utilities.
 * Layer above core - provides default processors for scorers.
 */

export function defaultProcessor(str: string): string {
  return str.toLowerCase().trim();
}
