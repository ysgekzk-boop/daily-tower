import { CombatEngine, PlayerLoadout } from '../core/CombatEngine';
import { FloorRunner } from '../core/FloorRunner';
import { BASE_PLAYER_MAX_HP } from '../core/StorageValidator';
import {
  ARMOR_CATALOG,
  ArmorItem,
  CONSUMABLE_CATALOG,
  RELIC_CATALOG,
  RelicItem,
  SKILL_CATALOG,
  SkillItem,
  WEAPON_CATALOG,
  WeaponItem,
} from '../extensible/items/itemCatalog';
import { ALL_FLOORS, REALM_METADATA } from '../extensible/realms/realmIndex';
import { PlaytestBot } from './playtestBot';
import { mulberry32 } from './runSimulation';

export type BenchmarkCategory = 'weapon' | 'armor' | 'relic' | 'skill';

export interface BenchmarkOptions {
  floor: number;
  category: BenchmarkCategory;
  runs?: number;
  reachableOnly?: boolean;
  baselineOverride?: Partial<PlayerLoadout>;
  baseSeed?: number;
}

export interface BenchmarkItemResult {
  id: string;
  name: string;
  statSummary: string;
  winRate: number; // 0..1
  avgEndHpPct: number; // 0..100 (0 on defeat)
  avgWinHpPct: number | null; // 0..100 among victories only
  avgTotalTurns: number;
  powerScore: number;
  isBaseline?: boolean;
}

export interface BenchmarkResult {
  floor: number;
  floorTitle: string;
  realmName: string;
  category: BenchmarkCategory;
  runs: number;
  reachableOnly: boolean;
  combatCount: number;
  enemyNames: string[];
  baseline: PlayerLoadout;
  items: BenchmarkItemResult[];
}

const MAX_TURNS_PER_BATTLE = 200;

/** Collects item IDs that appear in rewardPools up to `maxFloor` (plus starter gear). */
export function getReachableItemIds(maxFloor: number): {
  weapons: Set<string>;
  armors: Set<string>;
  skills: Set<string>;
  relics: Set<string>;
} {
  const weapons = new Set<string>(['rusty_shortsword']);
  const armors = new Set<string>(['leather_tunic']);
  const skills = new Set<string>(['power_slash', 'aegis_stance', 'purifying_light']);
  const relics = new Set<string>(['guardian_crest_relic']);

  for (const [fNumStr, fDef] of Object.entries(ALL_FLOORS)) {
    const fNum = Number(fNumStr);
    if (fNum > maxFloor) continue;
    for (const id of fDef.rewardPool.equipmentIds) {
      if (WEAPON_CATALOG[id]) weapons.add(id);
      if (ARMOR_CATALOG[id]) armors.add(id);
    }
    for (const id of fDef.rewardPool.skillIds) {
      if (SKILL_CATALOG[id]) skills.add(id);
    }
    for (const id of fDef.rewardPool.utilityIds) {
      if (RELIC_CATALOG[id]) relics.add(id);
    }
  }

  return { weapons, armors, skills, relics };
}

/** Selects a representative mid-upper baseline loadout for the target floor. */
export function selectBaselineLoadout(floor: number): PlayerLoadout {
  const reachable = getReachableItemIds(floor);

  const weaponPool = Array.from(reachable.weapons)
    .map((id) => WEAPON_CATALOG[id])
    .filter(Boolean)
    .sort((a, b) => a.atk - b.atk);
  const armorPool = Array.from(reachable.armors)
    .map((id) => ARMOR_CATALOG[id])
    .filter(Boolean)
    .sort((a, b) => a.def * 4 + a.maxHpBonus - (b.def * 4 + b.maxHpBonus));

  const wIdx = Math.min(weaponPool.length - 1, Math.floor(weaponPool.length * 0.65));
  const aIdx = Math.min(armorPool.length - 1, Math.floor(armorPool.length * 0.65));

  return {
    weapon: weaponPool[wIdx] ?? WEAPON_CATALOG.rusty_shortsword,
    armor: armorPool[aIdx] ?? ARMOR_CATALOG.leather_tunic,
    skills: [
      SKILL_CATALOG.power_slash,
      SKILL_CATALOG.aegis_stance,
      SKILL_CATALOG.purifying_light,
    ],
    consumable: CONSUMABLE_CATALOG.crimson_vial,
    relic: RELIC_CATALOG.guardian_crest_relic,
  };
}

/** Runs all combat encounters on `floor` across `seeds` for a fixed loadout. */
export function evaluateLoadoutOnFloor(
  floor: number,
  loadout: PlayerLoadout,
  seeds: number[]
): {
  winRate: number;
  avgEndHpPct: number;
  avgWinHpPct: number | null;
  avgTotalTurns: number;
  combatCount: number;
  enemyNames: string[];
} {
  const floorDef = FloorRunner.getFloor(floor);
  const realmMeta = REALM_METADATA[floorDef.realm] ?? REALM_METADATA[1];
  const maxHp = BASE_PLAYER_MAX_HP + loadout.armor.maxHpBonus;
  const startCharges = loadout.consumable?.maxCharges ?? 2;

  const combatEncounters = floorDef.encounters
    .map((_, idx) => FloorRunner.resolveEncounter(floorDef, idx))
    .filter((enc): enc is Extract<typeof enc, { kind: 'combat' }> => enc.kind === 'combat');

  const enemyNames = combatEncounters.map((enc) =>
    enc.enemyDefs.map((e) => e.name).join(' & ')
  );

  let wins = 0;
  let totalEndHpPct = 0;
  let totalWinHpPct = 0;
  let totalTurnsAll = 0;

  for (const seed of seeds) {
    const rng = mulberry32(seed);
    let currentHp = maxHp;
    let consumableCharges = startCharges;
    let floorSurvived = true;
    let runTurns = 0;

    for (const enc of combatEncounters) {
      let session = CombatEngine.createBattleSession(
        currentHp,
        maxHp,
        consumableCharges,
        loadout,
        enc.enemyDefs,
        enc.statScale
      );

      let turns = 0;
      while (session.status === 'ongoing' && turns < MAX_TURNS_PER_BATTLE) {
        const cmd = PlaytestBot.chooseCombatCommand(session, loadout);
        session = CombatEngine.executeTurn(
          session,
          cmd,
          loadout,
          realmMeta.environmentalStatus,
          rng
        );
        turns += 1;
      }
      runTurns += turns;

      if (session.status === 'victory') {
        currentHp = session.player.currentHp;
        consumableCharges = session.consumableCharges;
      } else {
        floorSurvived = false;
        break;
      }
    }

    totalTurnsAll += runTurns;
    if (floorSurvived) {
      wins += 1;
      const hpPct = (currentHp / maxHp) * 100;
      totalEndHpPct += hpPct;
      totalWinHpPct += hpPct;
    }
  }

  const n = Math.max(1, seeds.length);
  return {
    winRate: wins / n,
    avgEndHpPct: totalEndHpPct / n,
    avgWinHpPct: wins > 0 ? totalWinHpPct / wins : null,
    avgTotalTurns: totalTurnsAll / n,
    combatCount: combatEncounters.length,
    enemyNames,
  };
}

function computePowerScore(winRate: number, avgEndHpPct: number, avgTotalTurns: number): number {
  // Primary: winRate (0..1000), Secondary: avgEndHpPct (0..100), Tie-breaker: faster turns
  return Number((winRate * 1000 + avgEndHpPct - avgTotalTurns * 0.5).toFixed(1));
}

function summarizeWeapon(w: WeaponItem): string {
  return `ATK ${w.atk} / ${w.element}`;
}

function summarizeArmor(a: ArmorItem): string {
  return `DEF ${a.def} / HP+${a.maxHpBonus}`;
}

function summarizeSkill(s: SkillItem): string {
  const parts: string[] = [s.category];
  if (s.damageMultiplier) parts.push(`x${s.damageMultiplier}`);
  if (s.targetScope === 'all_enemies') parts.push('全体');
  if (s.healPercent) parts.push(`回復${s.healPercent}%`);
  if (s.applyStatus) parts.push(`${s.applyStatus.statusId}`);
  parts.push(`${s.maxChargesPerBattle}回`);
  return parts.join(' ');
}

function summarizeRelic(r: RelicItem | null): string {
  return r ? r.effectId : '効果なし';
}

export function runItemBenchmark(options: BenchmarkOptions): BenchmarkResult {
  const floor = Math.max(1, Math.floor(options.floor));
  const runs = Math.max(1, Math.floor(options.runs ?? 25));
  const reachableOnly = options.reachableOnly ?? false;
  const baseSeed = options.baseSeed ?? 1000;
  const seeds = Array.from({ length: runs }, (_, i) => baseSeed + i * 7919);

  const floorDef = FloorRunner.getFloor(floor);
  const realmMeta = REALM_METADATA[floorDef.realm] ?? REALM_METADATA[1];
  const autoBaseline = selectBaselineLoadout(floor);
  const baseline: PlayerLoadout = {
    ...autoBaseline,
    ...options.baselineOverride,
  };

  const reachable = getReachableItemIds(floor);
  const results: BenchmarkItemResult[] = [];
  let combatCount = 0;
  let enemyNames: string[] = [];

  if (options.category === 'weapon') {
    const list = Object.values(WEAPON_CATALOG).filter(
      (w) => !reachableOnly || reachable.weapons.has(w.id)
    );
    for (const weapon of list) {
      const stats = evaluateLoadoutOnFloor(floor, { ...baseline, weapon }, seeds);
      combatCount = stats.combatCount;
      enemyNames = stats.enemyNames;
      results.push({
        id: weapon.id,
        name: weapon.name,
        statSummary: summarizeWeapon(weapon),
        winRate: stats.winRate,
        avgEndHpPct: stats.avgEndHpPct,
        avgWinHpPct: stats.avgWinHpPct,
        avgTotalTurns: stats.avgTotalTurns,
        powerScore: computePowerScore(stats.winRate, stats.avgEndHpPct, stats.avgTotalTurns),
        isBaseline: weapon.id === baseline.weapon.id,
      });
    }
  } else if (options.category === 'armor') {
    const list = Object.values(ARMOR_CATALOG).filter(
      (a) => !reachableOnly || reachable.armors.has(a.id)
    );
    for (const armor of list) {
      const stats = evaluateLoadoutOnFloor(floor, { ...baseline, armor }, seeds);
      combatCount = stats.combatCount;
      enemyNames = stats.enemyNames;
      results.push({
        id: armor.id,
        name: armor.name,
        statSummary: summarizeArmor(armor),
        winRate: stats.winRate,
        avgEndHpPct: stats.avgEndHpPct,
        avgWinHpPct: stats.avgWinHpPct,
        avgTotalTurns: stats.avgTotalTurns,
        powerScore: computePowerScore(stats.winRate, stats.avgEndHpPct, stats.avgTotalTurns),
        isBaseline: armor.id === baseline.armor.id,
      });
    }
  } else if (options.category === 'relic') {
    const candidates: Array<RelicItem | null> = [
      null,
      ...Object.values(RELIC_CATALOG).filter(
        (r) => !reachableOnly || reachable.relics.has(r.id)
      ),
    ];
    for (const relic of candidates) {
      const stats = evaluateLoadoutOnFloor(floor, { ...baseline, relic }, seeds);
      combatCount = stats.combatCount;
      enemyNames = stats.enemyNames;
      results.push({
        id: relic ? relic.id : 'none',
        name: relic ? relic.name : '（レリックなし）',
        statSummary: summarizeRelic(relic),
        winRate: stats.winRate,
        avgEndHpPct: stats.avgEndHpPct,
        avgWinHpPct: stats.avgWinHpPct,
        avgTotalTurns: stats.avgTotalTurns,
        powerScore: computePowerScore(stats.winRate, stats.avgEndHpPct, stats.avgTotalTurns),
        isBaseline: relic === null,
      });
    }
  } else {
    // Skill benchmark: keep 2 neutral support skills fixed, evaluate candidate in slot 2
    const list = Object.values(SKILL_CATALOG).filter(
      (s) => !reachableOnly || reachable.skills.has(s.id)
    );
    for (const skill of list) {
      const slot0 =
        skill.id === 'power_slash' ? SKILL_CATALOG.flame_wave : SKILL_CATALOG.power_slash;
      const slot1 =
        skill.id === 'aegis_stance' ? SKILL_CATALOG.purifying_light : SKILL_CATALOG.aegis_stance;
      const loadout: PlayerLoadout = {
        ...baseline,
        skills: [slot0, slot1, skill],
      };
      const stats = evaluateLoadoutOnFloor(floor, loadout, seeds);
      combatCount = stats.combatCount;
      enemyNames = stats.enemyNames;
      results.push({
        id: skill.id,
        name: skill.name,
        statSummary: summarizeSkill(skill),
        winRate: stats.winRate,
        avgEndHpPct: stats.avgEndHpPct,
        avgWinHpPct: stats.avgWinHpPct,
        avgTotalTurns: stats.avgTotalTurns,
        powerScore: computePowerScore(stats.winRate, stats.avgEndHpPct, stats.avgTotalTurns),
      });
    }
  }

  results.sort((a, b) => b.powerScore - a.powerScore);

  return {
    floor,
    floorTitle: floorDef.title,
    realmName: realmMeta.name,
    category: options.category,
    runs,
    reachableOnly,
    combatCount,
    enemyNames,
    baseline,
    items: results,
  };
}

export function formatBenchmarkReport(result: BenchmarkResult, topN?: number): string {
  const categoryLabel: Record<BenchmarkCategory, string> = {
    weapon: '武器 (Weapon)',
    armor: '防具 (Armor)',
    relic: 'レリック (Relic)',
    skill: 'スキル (Skill)',
  };

  const lines: string[] = [];
  lines.push(`=== Item Power Benchmark: ${categoryLabel[result.category]} @ ${result.floor}F ===`);
  lines.push(`フロア: ${result.floorTitle} (${result.realmName}) / 戦闘数: ${result.combatCount} / 試行回数: ${result.runs}`);
  lines.push(`出現敵: ${result.enemyNames.join(' -> ')}`);
  lines.push(
    `基準装備: 武器=${result.baseline.weapon.name} / 防具=${result.baseline.armor.name} / レリック=${result.baseline.relic?.name ?? 'なし'}`
  );
  lines.push('');

  const rows = topN ? result.items.slice(0, topN) : result.items;
  lines.push('順位 | アイテム名 (ID) | 性能 | 勝率 | 平均残HP% | 平均ターン | スコア');
  lines.push('--- | --- | --- | ---: | ---: | ---: | ---:');
  rows.forEach((item, idx) => {
    const mark = item.isBaseline ? ' [基準]' : '';
    const winPct = `${Math.round(item.winRate * 100)}%`;
    const hpPct = `${item.avgEndHpPct.toFixed(1)}%`;
    const turns = item.avgTotalTurns.toFixed(1);
    lines.push(
      `${idx + 1} | ${item.name} (${item.id})${mark} | ${item.statSummary} | ${winPct} | ${hpPct} | ${turns} | ${item.powerScore.toFixed(1)}`
    );
  });

  return lines.join('\n');
}
