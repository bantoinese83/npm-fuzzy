/**
 * Performance profiling utilities for monitoring and optimization.
 */

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryDelta?: number;
  callCount: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
}

interface PerformanceWithMemory {
  memory?: PerformanceMemory;
  now(): number;
}

function getPerformance(): PerformanceWithMemory | null {
  if (typeof globalThis !== 'undefined' && globalThis.performance) {
    return globalThis.performance as PerformanceWithMemory;
  }
  if (typeof performance !== 'undefined') {
    return performance as PerformanceWithMemory;
  }
  return null;
}

function getMemoryUsage(): number {
  const perf = getPerformance();
  return perf?.memory?.usedJSHeapSize ?? 0;
}

class PerformanceProfiler {
  private metrics = new Map<string, PerformanceMetrics>();

  start(): void {
    // Baseline tracking can be added if needed
  }

  measure<T>(operation: string, fn: () => T): T {
    const perf = getPerformance();
    const startTime = perf?.now() ?? Date.now();
    const startMemory = getMemoryUsage();

    const result = fn();

    const endTime = perf?.now() ?? Date.now();
    const endMemory = getMemoryUsage();

    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;

    const existing = this.metrics.get(operation);
    if (existing !== undefined) {
      existing.duration += duration;
      existing.callCount++;
      if (existing.memoryDelta !== undefined) {
        existing.memoryDelta = (existing.memoryDelta + memoryDelta) / 2;
      } else {
        existing.memoryDelta = memoryDelta;
      }
    } else {
      this.metrics.set(operation, {
        operation,
        duration,
        memoryDelta,
        callCount: 1,
      });
    }

    return result;
  }

  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  getMetric(operation: string): PerformanceMetrics | undefined {
    return this.metrics.get(operation);
  }

  reset(): void {
    this.metrics.clear();
  }

  report(): string {
    const metrics = this.getMetrics();
    if (metrics.length === 0) return 'No metrics collected';

    let report = 'Performance Report:\n';
    report += '='.repeat(50) + '\n';

    for (const metric of metrics) {
      const avgDuration = metric.duration / metric.callCount;
      report += `${metric.operation}:\n`;
      report += `  Calls: ${metric.callCount}\n`;
      report += `  Total: ${metric.duration.toFixed(2)}ms\n`;
      report += `  Average: ${avgDuration.toFixed(2)}ms\n`;
      if (metric.memoryDelta !== undefined) {
        report += `  Memory: ${(metric.memoryDelta / 1024).toFixed(2)}KB\n`;
      }
      report += '\n';
    }

    return report;
  }
}

export const profiler = new PerformanceProfiler();

/**
 * Decorator for automatic performance profiling
 * Note: PropertyDescriptor.value is typed as any, which is a limitation of the decorator API
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export function Profile(
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor | void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const originalMethod = descriptor.value;
  if (originalMethod === undefined || typeof originalMethod !== 'function') return;

  const className = target.constructor?.name ?? 'Unknown';

  // PropertyDescriptor.value is any - decorator API limitation
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  descriptor.value = function (this: unknown, ...args: unknown[]): unknown {
    return profiler.measure(`${className}.${propertyKey}`, () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return originalMethod.apply(this, args);
    }) as unknown;
  };

  return descriptor;
}
