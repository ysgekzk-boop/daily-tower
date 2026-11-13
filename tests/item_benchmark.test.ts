import { describe, expect, it } from 'vitest';
import {
  formatBenchmarkReport,
  runItemBenchmark,
} from '../src/sim/itemBenchmark';

describe('itemBenchmark simulation', () => {
  it('ranks stronger weapons above starter rusty_shortsword at floor 30', () => {
    const res = runItemBenchmark({
      floor: 30,
      category: 'weapon',
      runs: 10,
      reachableOnly: true,
    });
    expect(res.items.length).toBeGreaterThan(3);
    const starter = res.items.find((i) => i.id === 'rusty_shortsword');
    expect(starter).toBeDefined();
    expect(res.items[0].powerScore).toBeGreaterThan(starter!.powerScore);
  });

  it('evaluates armor, relic, and skill categories and formats a readable report', () => {
    for (const category of ['armor', 'relic', 'skill'] as const) {
      const res = runItemBenchmark({
        floor: 20,
        category,
        runs: 6,
        reachableOnly: true,
      });
      expect(res.items.length).toBeGreaterThan(1);
      const report = formatBenchmarkReport(res, 5);
      expect(report).toContain('=== Item Power Benchmark:');
      expect(report).toContain('20F');
    }
  });
});
