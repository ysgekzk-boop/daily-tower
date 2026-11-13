/**
 * CLI for the random-play item statistics tool (dev-only).
 *
 * Usage:
 *   npx tsx src/sim/runRandomPlayStats.ts [--target=100] [--batch=200]
 *     [--max-runs=20000] [--max-floor=103] [--epsilon=0.3]
 *     [--seed-start=1] [--start-mode=drawn|classic] [--json]
 *
 * Runs epsilon-greedy full runs until every reward-pool/event item has
 * at least --target panel samples, then prints a per-item report sorted
 * by panel delta. With --json, prints only a JSON document (stats plus
 * slim per-run records) suitable for redirection into a file.
 */
import {
  PanelAccumulator,
  StartMode,
  aggregateItemStats,
  obtainableItemIds,
  simulateMixedRun,
  RandomRunResult,
} from './randomPlayStats';
import {
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../extensible/items/itemCatalog';

function main(): void {
  const argv =
    (globalThis as { process?: { argv: string[] } }).process?.argv ?? [];
  const args = new Map<string, string>();
  let jsonOnly = false;
  for (const a of argv.slice(2)) {
    if (a === '--json') {
      jsonOnly = true;
      continue;
    }
    const m = a.match(/^--([a-z-]+)=(.+)$/);
    if (m) args.set(m[1], m[2]);
  }
  const target = Number(args.get('target') ?? 100);
  const batch = Number(args.get('batch') ?? 200);
  const maxRuns = Number(args.get('max-runs') ?? 20000);
  const maxFloor = Number(args.get('max-floor') ?? 103);
  const epsilon = Number(args.get('epsilon') ?? 0.3);
  const seedStart = Number(args.get('seed-start') ?? 1);
  const startMode: StartMode =
    args.get('start-mode') === 'classic' ? 'classic' : 'drawn';

  const nameOf = (id: string): string =>
    WEAPON_CATALOG[id]?.name ??
    ARMOR_CATALOG[id]?.name ??
    SKILL_CATALOG[id]?.name ??
    RELIC_CATALOG[id]?.name ??
    CONSUMABLE_CATALOG[id]?.name ??
    id;
  const kindOf = (id: string): string =>
    WEAPON_CATALOG[id]
      ? 'weapon'
      : ARMOR_CATALOG[id]
        ? 'armor'
        : SKILL_CATALOG[id]
          ? 'skill'
          : RELIC_CATALOG[id]
            ? 'relic'
            : CONSUMABLE_CATALOG[id]
              ? 'consumable'
              : '?';

  const targets = obtainableItemIds(maxFloor);
  const log = (s: string): void => {
    if (!jsonOnly) console.log(s);
  };
  log(
    `target items: ${targets.size} / goal: panel samples >= ${target} each / epsilon=${epsilon} / start=${startMode}`
  );

  const runs: RandomRunResult[] = [];
  const panel = new PanelAccumulator(maxFloor);
  const t0 = Date.now();
  let seed = seedStart;
  let done = false;
  while (!done && runs.length < maxRuns) {
    for (let i = 0; i < batch && runs.length < maxRuns; i++) {
      const r = simulateMixedRun(seed++, maxFloor, epsilon, startMode);
      runs.push(r);
      panel.addRun(r);
    }
    let min = Infinity;
    let below = 0;
    for (const id of targets) {
      const c = panel.samplesOf(id);
      if (c < min) min = c;
      if (c < target) below += 1;
    }
    const clears = runs.filter((r) => r.cleared).length;
    log(
      `runs=${runs.length} clears=${clears} (${((clears / runs.length) * 100).toFixed(1)}%) minPanelN=${min} itemsBelowTarget=${below} elapsed=${((Date.now() - t0) / 1000).toFixed(0)}s`
    );
    if (below === 0) done = true;
  }
  log(done ? 'STOP: all items reached target' : 'STOP: max-runs reached');

  const panelStats = panel.results();
  const acqStats = aggregateItemStats(runs);
  const rows = [...panelStats.values()]
    .map((p) => {
      const a = acqStats.get(p.itemId);
      return {
        ...p,
        kind: kindOf(p.itemId),
        name: nameOf(p.itemId),
        acqRuns: a?.runs ?? 0,
        acqWinRate: a?.winRate ?? null,
        acqDelta: a?.delta ?? null,
        acqMedianFloor: a?.medianFloor ?? null,
      };
    })
    .sort((x, y) => (y.delta ?? -9) - (x.delta ?? -9));

  if (jsonOnly) {
    const slimRuns = runs.map((r) => ({
      seed: r.seed,
      cleared: r.cleared,
      floorsCleared: r.floorsCleared,
      highestFloorReached: r.highestFloorReached,
      deaths: r.deaths,
      startSkillIds: r.startSkillIds,
      acquired: r.acquired,
      finalHeldIds: r.finalHeldIds,
    }));
    console.log(
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        epsilon,
        target,
        startMode,
        runCount: runs.length,
        clearRate: runs.filter((r) => r.cleared).length / runs.length,
        stats: rows,
        runs: slimRuns,
      })
    );
    return;
  }

  const fmt = (v: number | null, digits = 1): string =>
    v === null ? 'n/a' : (v * 100).toFixed(digits);
  const line = (s: (typeof rows)[number]): string =>
    `${s.itemId} | ${s.kind} | ${s.name} | samples=${s.samples} | fwdRate=${fmt(s.winRate)}% | base=${fmt(s.baselineWinRate)}% | delta=${s.delta !== null ? (s.delta * 100).toFixed(1) + 'pt' : 'n/a'} | acqN=${s.acqRuns} acqDelta=${s.acqDelta !== null ? (s.acqDelta * 100).toFixed(1) + 'pt' : 'n/a'}`;
  console.log('\n=== PANEL TOP 20 (delta pt) ===');
  for (const s of rows.slice(0, 20)) console.log(line(s));
  console.log('\n=== PANEL BOTTOM 20 ===');
  for (const s of rows.slice(-20)) console.log(line(s));
}

main();
