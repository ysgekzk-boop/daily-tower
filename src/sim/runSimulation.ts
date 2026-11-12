import { AreaEngine } from '../core/AreaEngine';
import { CombatEngine } from '../core/CombatEngine';
import { DropPacingEngine } from '../core/DropPacingEngine';
import { EventEngine } from '../core/EventEngine';
import { FloorRunner } from '../core/FloorRunner';
import {
  BASE_PLAYER_MAX_HP,
  SaveData,
  StorageValidator,
} from '../core/StorageValidator';
import { EFFECT_REGISTRY } from '../extensible/effects/effectRegistry';
import { AnyCatalogItem } from '../extensible/items/itemCatalog';
import { REALM_METADATA } from '../extensible/realms/realmIndex';
import { PlaytestBot } from './playtestBot';

/** Deterministic PRNG so simulation runs are reproducible per seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RunResult {
  seed: number;
  floorsCleared: number;
  highestFloorReached: number;
  deaths: number;
  deathsByFloor: Record<number, number>;
  battles: number;
  totalTurns: number;
  goldEarned: number;
  endReason: 'cleared' | 'death_cap' | 'turn_cap';
  /** HP% right after clearing each floor (first clear only). */
  floorEndHpPct: Record<number, number>;
}

const MAX_DEATHS_PER_RUN = 30;
const MAX_TURNS_PER_BATTLE = 300;

/** Applies an obtained item the way the game store does (old gear salvages). */
function applyEquip(save: SaveData, item: AnyCatalogItem): void {
  const maxHpNow = BASE_PLAYER_MAX_HP + save.inventory.armor.maxHpBonus;
  if (item.kind === 'weapon') {
    save.gold += save.inventory.weapon.salvageGold;
    save.inventory.weapon = item;
  } else if (item.kind === 'armor') {
    save.gold += save.inventory.armor.salvageGold;
    const hpDiff = Math.max(0, item.maxHpBonus - save.inventory.armor.maxHpBonus);
    save.inventory.armor = item;
    const newMax = BASE_PLAYER_MAX_HP + item.maxHpBonus;
    save.midFloor.playerCurrentHp = Math.min(
      newMax,
      save.midFloor.playerCurrentHp + hpDiff
    );
    void maxHpNow;
  } else if (item.kind === 'relic') {
    save.gold += save.inventory.relic?.salvageGold ?? 0;
    save.inventory.relic = item;
  } else if (item.kind === 'skill') {
    const emptyIdx = save.inventory.skills.findIndex((s) => s === null);
    if (emptyIdx >= 0) {
      save.inventory.skills[emptyIdx] = item;
    } else {
      // Replace the weakest skill and salvage it
      let weakestIdx = 0;
      let weakestPower = Infinity;
      save.inventory.skills.forEach((s, i) => {
        if (s) {
          const p = PlaytestBot.skillPower(s);
          if (p < weakestPower) {
            weakestPower = p;
            weakestIdx = i;
          }
        }
      });
      save.gold += save.inventory.skills[weakestIdx]?.salvageGold ?? 0;
      save.inventory.skills[weakestIdx] = item;
    }
  } else if (item.kind === 'consumable') {
    save.inventory.consumable = item;
    save.midFloor.consumableCharges = item.maxCharges;
  }
}

/**
 * Plays a full run from floor 1 to `maxFloor` with the PlaytestBot,
 * mirroring the game store's flow (HP carry-over, events, reward cards,
 * checkpoint respawns, dimensional leaps). Deaths respawn the bot at the
 * checkpoint exactly like a player retrying.
 */
export function simulateRun(seed: number, maxFloor = 100): RunResult {
  const rng = mulberry32(seed);
  const save = StorageValidator.createDefaultSave();
  const result: RunResult = {
    seed,
    floorsCleared: 0,
    highestFloorReached: 1,
    deaths: 0,
    deathsByFloor: {},
    battles: 0,
    totalTurns: 0,
    goldEarned: 0,
    endReason: 'cleared',
    floorEndHpPct: {},
  };

  let floor = 1;
  while (floor <= maxFloor) {
    const floorDef = FloorRunner.getFloor(floor);
    const realmMeta = REALM_METADATA[floorDef.realm] ?? REALM_METADATA[1];
    result.highestFloorReached = Math.max(result.highestFloorReached, floor);
    let diedOnFloor = false;

    for (let encIdx = 0; encIdx < floorDef.encounters.length; encIdx++) {
      const enc = FloorRunner.resolveEncounter(floorDef, encIdx);
      const maxHp = BASE_PLAYER_MAX_HP + save.inventory.armor.maxHpBonus;

      if (enc.kind === 'event') {
        const state = {
          currentHp: save.midFloor.playerCurrentHp,
          maxHp,
          gold: save.gold,
          consumableCharges: save.midFloor.consumableCharges,
          consumableMaxCharges: save.inventory.consumable?.maxCharges ?? 2,
        };
        const optIdx = PlaytestBot.chooseEventOption(enc.eventDef, state, (o) =>
          EventEngine.canAffordOption(state, o)
        );
        if (optIdx >= 0) {
          const res = EventEngine.resolveOption(state, enc.eventDef.options[optIdx], rng);
          if (res.success) {
            save.gold = res.nextState.gold;
            save.midFloor.playerCurrentHp = res.nextState.currentHp;
            save.midFloor.consumableCharges = res.nextState.consumableCharges;
            if (res.grantedItem) applyEquip(save, res.grantedItem);
          }
        }
        continue;
      }

      // Combat encounter
      let session = CombatEngine.createBattleSession(
        save.midFloor.playerCurrentHp,
        maxHp,
        save.midFloor.consumableCharges,
        save.inventory,
        enc.enemyDefs,
        enc.statScale
      );
      result.battles += 1;
      let turns = 0;
      while (session.status === 'ongoing' && turns < MAX_TURNS_PER_BATTLE) {
        const cmd = PlaytestBot.chooseCombatCommand(session, save.inventory);
        session = CombatEngine.executeTurn(
          session,
          cmd,
          save.inventory,
          realmMeta.environmentalStatus,
          rng
        );
        turns += 1;
      }
      result.totalTurns += turns;

      if (session.status === 'victory') {
        let gold = session.totalGoldReward;
        if (save.inventory.relic) {
          const eff = EFFECT_REGISTRY[save.inventory.relic.effectId];
          if (eff && eff.trigger === 'battle_victory') {
            const res = eff.handler({
              playerCurrentHp: session.player.currentHp,
              playerMaxHp: session.player.maxHp,
              playerAtk: session.player.baseAtk,
              playerDef: session.player.baseDef,
              enemyCurrentHp: 0,
              enemyMaxHp: session.enemies[0]?.maxHp ?? 0,
              turnNumber: session.turn,
            });
            if (res.grantGold) gold += res.grantGold;
          }
        }
        save.gold += gold;
        result.goldEarned += gold;
        save.midFloor.playerCurrentHp = session.player.currentHp;
        save.midFloor.consumableCharges = session.consumableCharges;
      } else {
        // Defeat (or turn cap): checkpoint respawn, retry from that floor
        result.deaths += 1;
        result.deathsByFloor[floor] = (result.deathsByFloor[floor] ?? 0) + 1;
        if (result.deaths > MAX_DEATHS_PER_RUN) {
          result.endReason = 'death_cap';
          return result;
        }
        if (turns >= MAX_TURNS_PER_BATTLE) {
          result.endReason = 'turn_cap';
          return result;
        }
        const respawnFloor = AreaEngine.calculateRespawnFloor(floor);
        save.midFloor.playerCurrentHp =
          BASE_PLAYER_MAX_HP + save.inventory.armor.maxHpBonus;
        floor = respawnFloor;
        diedOnFloor = true;
        break;
      }
    }

    if (diedOnFloor) continue;

    // Floor cleared
    result.floorsCleared = Math.max(result.floorsCleared, floor);
    const maxHpAfter = BASE_PLAYER_MAX_HP + save.inventory.armor.maxHpBonus;
    if (result.floorEndHpPct[floor] === undefined) {
      result.floorEndHpPct[floor] = Math.round(
        (save.midFloor.playerCurrentHp / maxHpAfter) * 100
      );
    }

    // Reward cards
    const cards = DropPacingEngine.generateFloorRewardCards(floorDef, rng, {
      skillIds: save.inventory.skills
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map((s) => s.id),
      weaponId: save.inventory.weapon.id,
      armorId: save.inventory.armor.id,
      relicId: save.inventory.relic?.id ?? null,
      consumableId: save.inventory.consumable?.id ?? null,
    });
    const choice = PlaytestBot.chooseRewardCard(cards, {
      weapon: save.inventory.weapon,
      armor: save.inventory.armor,
      skills: save.inventory.skills,
      hasRelic: Boolean(save.inventory.relic),
      consumableCharges: save.midFloor.consumableCharges,
      consumableMaxCharges: save.inventory.consumable?.maxCharges ?? 2,
    });
    const card = cards[choice.index];
    if (card.type === 'potion_refill') {
      const maxCons = save.inventory.consumable?.maxCharges ?? 2;
      save.midFloor.consumableCharges = Math.min(
        maxCons,
        save.midFloor.consumableCharges + (card.potionRefillAmount ?? 1)
      );
    } else if (card.type === 'gold_bonus') {
      save.gold += card.goldBonusAmount ?? 0;
    } else if (card.item) {
      if (choice.action === 'equip') {
        applyEquip(save, card.item);
      } else {
        save.gold += 'salvageGold' in card.item ? card.item.salvageGold : 20;
      }
    }

    // Dimensional leap after Apex floors
    if (floor % 50 === 0) {
      const leap = AreaEngine.executeDimensionalLeap({
        clearedFloor: floor,
        weapon: save.inventory.weapon,
        armor: save.inventory.armor,
        skills: save.inventory.skills,
        relicName: save.inventory.relic?.name ?? 'なし',
        gold: save.gold,
      });
      save.inventory.weapon = leap.normalizedWeapon;
      save.inventory.armor = leap.normalizedArmor;
      save.inventory.skills = leap.normalizedSkills;
      save.midFloor.playerCurrentHp = BASE_PLAYER_MAX_HP + leap.normalizedArmor.maxHpBonus;
      const maxCons = save.inventory.consumable?.maxCharges ?? 2;
      save.midFloor.consumableCharges = Math.min(
        maxCons,
        save.midFloor.consumableCharges + 1
      );
      floor = leap.nextFloor;
    } else {
      floor += 1;
    }
  }

  return result;
}

export interface AggregateReport {
  runs: RunResult[];
  runCount: number;
  maxFloor: number;
  fullClearRuns: number;
  medianFloorsCleared: number;
  avgDeaths: number;
  avgTurnsPerBattle: number;
  /** Fraction of runs that cleared each floor (only floors with data). */
  clearRateByFloor: Record<number, number>;
  deathsByFloor: Record<number, number>;
  avgFloorEndHpPct: Record<number, number>;
}

export function simulateMany(seeds: number[], maxFloor = 100): AggregateReport {
  const runs = seeds.map((s) => simulateRun(s, maxFloor));
  const clearRateByFloor: Record<number, number> = {};
  const deathsByFloor: Record<number, number> = {};
  const hpSamples: Record<number, number[]> = {};

  for (let f = 1; f <= maxFloor; f++) {
    const cleared = runs.filter((r) => r.floorsCleared >= f).length;
    clearRateByFloor[f] = cleared / runs.length;
  }
  for (const r of runs) {
    for (const [f, n] of Object.entries(r.deathsByFloor)) {
      deathsByFloor[Number(f)] = (deathsByFloor[Number(f)] ?? 0) + n;
    }
    for (const [f, pct] of Object.entries(r.floorEndHpPct)) {
      (hpSamples[Number(f)] ??= []).push(pct);
    }
  }
  const avgFloorEndHpPct: Record<number, number> = {};
  for (const [f, arr] of Object.entries(hpSamples)) {
    avgFloorEndHpPct[Number(f)] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  const sorted = [...runs].sort((a, b) => a.floorsCleared - b.floorsCleared);
  const totalBattles = runs.reduce((a, r) => a + r.battles, 0);
  const totalTurns = runs.reduce((a, r) => a + r.totalTurns, 0);

  return {
    runs,
    runCount: runs.length,
    maxFloor,
    fullClearRuns: runs.filter((r) => r.floorsCleared >= maxFloor).length,
    medianFloorsCleared: sorted[Math.floor(sorted.length / 2)]?.floorsCleared ?? 0,
    avgDeaths: runs.reduce((a, r) => a + r.deaths, 0) / runs.length,
    avgTurnsPerBattle: totalBattles > 0 ? totalTurns / totalBattles : 0,
    clearRateByFloor,
    deathsByFloor,
    avgFloorEndHpPct,
  };
}

export function formatReport(report: AggregateReport): string {
  const lines: string[] = [];
  lines.push(
    `== Playtest Simulation Report (${report.runCount} runs, floors 1-${report.maxFloor}) ==`
  );
  lines.push(
    `Full clears: ${report.fullClearRuns}/${report.runCount} / Median floors cleared: ${report.medianFloorsCleared} / Avg deaths per run: ${report.avgDeaths.toFixed(1)} / Avg turns per battle: ${report.avgTurnsPerBattle.toFixed(1)}`
  );
  lines.push('');
  lines.push('Clear rate by 10-floor band (floor: rate / avg end HP%):');
  for (let start = 1; start <= report.maxFloor; start += 10) {
    const cells: string[] = [];
    for (let f = start; f < Math.min(start + 10, report.maxFloor + 1); f++) {
      const rate = Math.round((report.clearRateByFloor[f] ?? 0) * 100);
      const hp = report.avgFloorEndHpPct[f];
      cells.push(`${f}:${rate}%${hp !== undefined ? `/${hp}%` : ''}`);
    }
    lines.push('  ' + cells.join('  '));
  }
  lines.push('');
  const deathRanking = Object.entries(report.deathsByFloor)
    .map(([f, n]) => ({ floor: Number(f), deaths: n }))
    .sort((a, b) => b.deaths - a.deaths)
    .slice(0, 8);
  lines.push(
    'Deadliest floors: ' +
      (deathRanking.length
        ? deathRanking.map((d) => `${d.floor}F x${d.deaths}`).join(', ')
        : 'none')
  );
  return lines.join('\n');
}
