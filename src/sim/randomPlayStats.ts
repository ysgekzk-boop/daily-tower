/**
 * Random-play item statistics (dev-only measurement tool).
 *
 * Plays full runs like simulateRun, but reward-card choice is epsilon-greedy:
 * with probability epsilon a uniformly random card is taken (and equipped),
 * otherwise the PlaytestBot's choice stands. Pure random play proved too
 * weak to leave Realm 1 (loadouts random-walk downward and every run dies
 * at the death cap around floor 26), which starves all later items of
 * samples; epsilon-greedy keeps runs competent enough to reach the whole
 * tower while still randomizing which items each run ends up holding.
 *
 * Two statistics are collected per item:
 *  - Panel stat (primary): after each floor clear, the held set is
 *    snapshotted. For a snapshot at floor f, success = the run eventually
 *    clears floor min(f + 20, maxFloor) (a +10 horizon saturated in
 *    Realm 2+, where survivors almost always manage 10 more floors). An
 *    item's delta compares success
 *    rates of snapshots holding it vs snapshots at the SAME floor not
 *    holding it, which cancels survivorship and floor-difficulty bias and
 *    is immune to loadout churn (skills being swapped in and out).
 *  - Acquisition stat (secondary): clear rate of runs that ever held the
 *    item vs runs that reached its median acquisition floor without it.
 */
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
import { collectEquippedEffects } from '../extensible/effects/effectRegistry';
import { EVENT_REGISTRY } from '../extensible/events/eventRegistry';
import { AnyCatalogItem } from '../extensible/items/itemCatalog';
import { SKILL_CATALOG, SkillItem } from '../extensible/items/itemCatalog';
import { REALM_METADATA } from '../extensible/realms/realmIndex';
import { PlaytestBot } from './playtestBot';
import { mulberry32 } from './runSimulation';

/** The pre-2026-11-14 fixed starting trio, kept for A/B baselines. */
export const CLASSIC_START_SKILL_IDS = [
  'power_slash',
  'aegis_stance',
  'purifying_light',
] as const;

export interface Acquisition {
  itemId: string;
  floor: number;
  source: 'reward' | 'event' | 'leap';
}

export interface RandomRunResult {
  seed: number;
  cleared: boolean;
  floorsCleared: number;
  highestFloorReached: number;
  deaths: number;
  endReason: 'cleared' | 'death_cap' | 'turn_cap';
  acquired: Acquisition[];
  deathsByFloor: Record<number, number>;
  finalHeldIds: string[];
  /** Held item ids right after clearing each floor (post rewards/leap). */
  snapshots: Record<number, string[]>;
  /** Skill ids the run started with (after any random-start draw). */
  startSkillIds: string[];
}

const MAX_DEATHS_PER_RUN = 30;
const MAX_TURNS_PER_BATTLE = 300;

/** Same equip logic as runSimulation's applyEquip (store mirror). */
function applyEquip(save: SaveData, item: AnyCatalogItem): void {
  if (
    item.kind === 'weapon' &&
    DropPacingEngine.isWeaponDominated(item, {
      atk: save.inventory.weapon.atk,
      element: save.inventory.weapon.element,
    })
  ) {
    save.gold += item.salvageGold;
    return;
  }
  if (
    item.kind === 'armor' &&
    DropPacingEngine.isArmorDominated(item, {
      def: save.inventory.armor.def,
      maxHpBonus: save.inventory.armor.maxHpBonus,
    })
  ) {
    save.gold += item.salvageGold;
    return;
  }
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
  } else if (item.kind === 'relic') {
    save.gold += save.inventory.relic?.salvageGold ?? 0;
    save.inventory.relic = item;
  } else if (item.kind === 'skill') {
    const emptyIdx = save.inventory.skills.findIndex((s) => s === null);
    if (emptyIdx >= 0) {
      save.inventory.skills[emptyIdx] = item;
    } else {
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

function heldIds(save: SaveData): Set<string> {
  const ids = new Set<string>();
  ids.add(save.inventory.weapon.id);
  ids.add(save.inventory.armor.id);
  if (save.inventory.relic) ids.add(save.inventory.relic.id);
  if (save.inventory.consumable) ids.add(save.inventory.consumable.id);
  for (const s of save.inventory.skills) if (s) ids.add(s.id);
  return ids;
}

export type StartMode = 'drawn' | 'classic';

export function simulateMixedRun(
  seed: number,
  maxFloor = 103,
  epsilon = 0.3,
  startMode: StartMode = 'drawn'
): RandomRunResult {
  const rng = mulberry32(seed);
  const save = StorageValidator.createDefaultSave(rng);
  if (startMode === 'classic') {
    save.inventory.skills = [
      SKILL_CATALOG[CLASSIC_START_SKILL_IDS[0]],
      SKILL_CATALOG[CLASSIC_START_SKILL_IDS[1]],
      SKILL_CATALOG[CLASSIC_START_SKILL_IDS[2]],
    ];
  }
  const acquired: Acquisition[] = [];
  const acquiredIds = new Set<string>();
  let held = heldIds(save);
  const recordNew = (floor: number, source: Acquisition['source']) => {
    const now = heldIds(save);
    for (const id of now) {
      if (!held.has(id) && !acquiredIds.has(id)) {
        acquired.push({ itemId: id, floor, source });
        acquiredIds.add(id);
      }
    }
    held = now;
  };

  const result: RandomRunResult = {
    seed,
    cleared: false,
    floorsCleared: 0,
    highestFloorReached: 1,
    deaths: 0,
    endReason: 'cleared',
    acquired,
    deathsByFloor: {},
    finalHeldIds: [],
    snapshots: {},
    startSkillIds: save.inventory.skills
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .map((s) => s.id),
  };
  const finish = (): RandomRunResult => {
    result.cleared = result.floorsCleared >= maxFloor;
    result.finalHeldIds = [...heldIds(save)];
    return result;
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
          currentFloor: floor,
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
            if (res.grantedItem) {
              applyEquip(save, res.grantedItem);
              recordNew(floor, 'event');
            }
          }
        }
        continue;
      }

      let session = CombatEngine.createBattleSession(
        save.midFloor.playerCurrentHp,
        maxHp,
        save.midFloor.consumableCharges,
        save.inventory,
        enc.enemyDefs,
        enc.statScale
      );
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

      if (session.status === 'victory') {
        let gold = session.totalGoldReward;
        for (const eff of collectEquippedEffects(save.inventory)) {
          if (eff.trigger !== 'battle_victory') continue;
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
        save.gold += gold;
        save.midFloor.playerCurrentHp = session.player.currentHp;
        save.midFloor.consumableCharges = session.consumableCharges;
      } else {
        result.deaths += 1;
        result.deathsByFloor[floor] = (result.deathsByFloor[floor] ?? 0) + 1;
        if (result.deaths > MAX_DEATHS_PER_RUN) {
          result.endReason = 'death_cap';
          return finish();
        }
        if (turns >= MAX_TURNS_PER_BATTLE) {
          result.endReason = 'turn_cap';
          return finish();
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

    result.floorsCleared = Math.max(result.floorsCleared, floor);

    // Reward cards: epsilon-greedy (bot choice vs uniform random card).
    const cards = DropPacingEngine.generateFloorRewardCards(floorDef, rng, {
      skillIds: save.inventory.skills
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .map((s) => s.id),
      weaponId: save.inventory.weapon.id,
      armorId: save.inventory.armor.id,
      relicId: save.inventory.relic?.id ?? null,
      consumableId: save.inventory.consumable?.id ?? null,
      weaponAtk: save.inventory.weapon.atk,
      weaponElement: save.inventory.weapon.element,
      armorDef: save.inventory.armor.def,
      armorMaxHpBonus: save.inventory.armor.maxHpBonus,
    });
    if (cards.length > 0) {
      let card = cards[0];
      let equipIt = true;
      if (rng() < epsilon) {
        card = cards[Math.floor(rng() * cards.length)];
        equipIt = true;
        // Guided random: a random player still salvages a skill that is
        // strictly worse than every skill already held (the bot branch
        // makes the same call via chooseRewardCard's salvage action).
        if (card.item?.kind === 'skill') {
          const heldSkills = save.inventory.skills.filter(
            (s): s is NonNullable<typeof s> => s !== null
          );
          if (
            heldSkills.length >= 3 &&
            heldSkills.every(
              (s) =>
                PlaytestBot.skillPower(s) >
                PlaytestBot.skillPower(card.item as SkillItem)
            )
          ) {
            equipIt = false;
          }
        }
      } else {
        const choice = PlaytestBot.chooseRewardCard(cards, {
          weapon: save.inventory.weapon,
          armor: save.inventory.armor,
          skills: save.inventory.skills,
          hasRelic: Boolean(save.inventory.relic),
          consumableCharges: save.midFloor.consumableCharges,
          consumableMaxCharges: save.inventory.consumable?.maxCharges ?? 2,
        });
        card = cards[choice.index];
        equipIt = choice.action === 'equip';
      }
      if (card.type === 'potion_refill') {
        const maxCons = save.inventory.consumable?.maxCharges ?? 2;
        save.midFloor.consumableCharges = Math.min(
          maxCons,
          save.midFloor.consumableCharges + (card.potionRefillAmount ?? 1)
        );
      } else if (card.type === 'gold_bonus') {
        save.gold += card.goldBonusAmount ?? 0;
      } else if (card.item) {
        if (equipIt) {
          applyEquip(save, card.item);
          recordNew(floor, 'reward');
        } else {
          save.gold += 'salvageGold' in card.item ? card.item.salvageGold : 20;
        }
      }
    }

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
      recordNew(floor, 'leap');
      save.midFloor.playerCurrentHp = BASE_PLAYER_MAX_HP + leap.normalizedArmor.maxHpBonus;
      const maxCons = save.inventory.consumable?.maxCharges ?? 2;
      save.midFloor.consumableCharges = Math.min(
        maxCons,
        save.midFloor.consumableCharges + 1
      );
      result.snapshots[floor] = [...heldIds(save)];
      floor = leap.nextFloor;
    } else {
      result.snapshots[floor] = [...heldIds(save)];
      floor += 1;
    }
  }

  return finish();
}

/** Items a run can come to hold via reward pools or event specific grants. */
export function obtainableItemIds(maxFloor = 103): Set<string> {
  const ids = new Set<string>();
  for (let f = 1; f <= maxFloor; f++) {
    const pool = FloorRunner.getFloor(f).rewardPool;
    for (const id of pool.equipmentIds) ids.add(id);
    for (const id of pool.skillIds) ids.add(id);
    for (const id of pool.utilityIds) ids.add(id);
    for (const id of pool.consumableIds ?? []) ids.add(id);
  }
  for (const ev of Object.values(EVENT_REGISTRY)) {
    for (const opt of ev.options) {
      if (opt.outcome.specificItemId) ids.add(opt.outcome.specificItemId);
    }
  }
  return ids;
}

/** Online accumulator for the panel statistic. */
export class PanelAccumulator {
  private floorTotals = new Map<number, { n: number; succ: number }>();
  private heldStats = new Map<
    string,
    Map<number, { n: number; succ: number }>
  >();
  private maxFloor: number;

  constructor(maxFloor = 103) {
    this.maxFloor = maxFloor;
  }

  addRun(run: RandomRunResult): void {
    // Freshness window: a snapshot only counts for an item within
    // WINDOW floors after the run first acquired it, so a stale early
    // item still being carried does not act as a marker for a lagging
    // build. Items never "acquired" (starting gear) count as acquired
    // at floor 1.
    const acqFloor = new Map<string, number>();
    for (const a of run.acquired) acqFloor.set(a.itemId, a.floor);
    const WINDOW = 10;
    for (const [fStr, ids] of Object.entries(run.snapshots)) {
      const f = Number(fStr);
      const target = Math.min(f + 20, this.maxFloor);
      const succ = run.floorsCleared >= target ? 1 : 0;
      const freshIds = ids.filter((id) => f - (acqFloor.get(id) ?? 1) <= WINDOW);
      const ft = this.floorTotals.get(f) ?? { n: 0, succ: 0 };
      ft.n += 1;
      ft.succ += succ;
      this.floorTotals.set(f, ft);
      for (const id of freshIds) {
        let perFloor = this.heldStats.get(id);
        if (!perFloor) {
          perFloor = new Map();
          this.heldStats.set(id, perFloor);
        }
        const e = perFloor.get(f) ?? { n: 0, succ: 0 };
        e.n += 1;
        e.succ += succ;
        perFloor.set(f, e);
      }
    }
  }

  samplesOf(itemId: string): number {
    const perFloor = this.heldStats.get(itemId);
    if (!perFloor) return 0;
    let n = 0;
    for (const e of perFloor.values()) n += e.n;
    return n;
  }

  results(): Map<string, PanelItemStat> {
    const out = new Map<string, PanelItemStat>();
    for (const [itemId, perFloor] of this.heldStats) {
      let n = 0;
      let succ = 0;
      let baseN = 0;
      let baseSucc = 0;
      for (const [f, e] of perFloor) {
        n += e.n;
        succ += e.succ;
        const ft = this.floorTotals.get(f);
        if (ft) {
          baseN += ft.n - e.n;
          baseSucc += ft.succ - e.succ;
        }
      }
      const winRate = n > 0 ? succ / n : 0;
      const baselineWinRate = baseN > 0 ? baseSucc / baseN : null;
      out.set(itemId, {
        itemId,
        samples: n,
        winRate,
        baselineRuns: baseN,
        baselineWinRate,
        delta: baselineWinRate !== null ? winRate - baselineWinRate : null,
      });
    }
    return out;
  }
}

export interface PanelItemStat {
  itemId: string;
  samples: number;
  winRate: number;
  baselineRuns: number;
  baselineWinRate: number | null;
  delta: number | null;
}

export interface ItemStat {
  itemId: string;
  runs: number;
  wins: number;
  winRate: number;
  medianFloor: number;
  baselineRuns: number;
  baselineWinRate: number | null;
  delta: number | null;
}

/** Acquisition-based clear-rate statistic (secondary view). */
export function aggregateItemStats(runs: RandomRunResult[]): Map<string, ItemStat> {
  const byItem = new Map<string, { floors: number[]; wins: number }>();
  for (const r of runs) {
    for (const a of r.acquired) {
      const e = byItem.get(a.itemId) ?? { floors: [], wins: 0 };
      e.floors.push(a.floor);
      if (r.cleared) e.wins += 1;
      byItem.set(a.itemId, e);
    }
  }
  const holderSets = new Map<string, Set<RandomRunResult>>();
  for (const r of runs) {
    for (const a of r.acquired) {
      let s = holderSets.get(a.itemId);
      if (!s) {
        s = new Set();
        holderSets.set(a.itemId, s);
      }
      s.add(r);
    }
  }
  const stats = new Map<string, ItemStat>();
  for (const [itemId, e] of byItem) {
    const sorted = [...e.floors].sort((a, b) => a - b);
    const medianFloor = sorted[Math.floor(sorted.length / 2)];
    const holders = holderSets.get(itemId) ?? new Set();
    const baseline = runs.filter(
      (r) => !holders.has(r) && r.highestFloorReached >= medianFloor
    );
    const baselineWinRate =
      baseline.length > 0
        ? baseline.filter((r) => r.cleared).length / baseline.length
        : null;
    const winRate = e.wins / e.floors.length;
    stats.set(itemId, {
      itemId,
      runs: e.floors.length,
      wins: e.wins,
      winRate,
      medianFloor,
      baselineRuns: baseline.length,
      baselineWinRate,
      delta: baselineWinRate !== null ? winRate - baselineWinRate : null,
    });
  }
  return stats;
}
