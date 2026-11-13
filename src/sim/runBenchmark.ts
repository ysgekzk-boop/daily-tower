import {
  BenchmarkCategory,
  formatBenchmarkReport,
  runItemBenchmark,
} from './itemBenchmark';

export function main(argv: string[] = []): void {
  let floor = 50;
  let category: BenchmarkCategory | 'all' = 'all';
  let runs = 25;
  let reachableOnly = false;
  let topN: number | undefined;

  for (const arg of argv) {
    if (arg.startsWith('--floor=')) {
      const n = Number(arg.slice('--floor='.length));
      if (Number.isFinite(n) && n >= 1) floor = Math.floor(n);
    } else if (arg.startsWith('--category=')) {
      const c = arg.slice('--category='.length);
      if (c === 'all' || c === 'weapon' || c === 'armor' || c === 'relic' || c === 'skill') {
        category = c;
      }
    } else if (arg.startsWith('--runs=')) {
      const n = Number(arg.slice('--runs='.length));
      if (Number.isFinite(n) && n >= 1) runs = Math.floor(n);
    } else if (arg === '--reachable') {
      reachableOnly = true;
    } else if (arg.startsWith('--top=')) {
      const n = Number(arg.slice('--top='.length));
      if (Number.isFinite(n) && n >= 1) topN = Math.floor(n);
    }
  }

  const categories: BenchmarkCategory[] =
    category === 'all' ? ['weapon', 'armor', 'relic', 'skill'] : [category];

  for (const cat of categories) {
    const result = runItemBenchmark({
      floor,
      category: cat,
      runs,
      reachableOnly,
    });
    console.log(formatBenchmarkReport(result, topN));
    console.log('');
  }
}
