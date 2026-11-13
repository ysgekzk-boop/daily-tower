import { EventOption } from '../extensible/events/types';
import {
  AnyCatalogItem,
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../extensible/items/itemCatalog';
import { ALL_FLOORS } from '../extensible/realms/realmIndex';

export interface EventExecutionState {
  currentHp: number;
  maxHp: number;
  gold: number;
  consumableCharges: number;
  consumableMaxCharges: number;
  /**
   * Floor the event occurs on. Drives era-locked item grants and
   * progression-scaled gold costs. Defaults to 1 (base prices, no era lock
   * beyond floor 1 pools) when omitted.
   */
  currentFloor?: number;
}

export interface EventResolutionResult {
  success: boolean;
  reason?: string;
  nextState: EventExecutionState;
  grantedItem?: AnyCatalogItem;
  logMessage: string;
}

export class EventEngine {
  /**
   * Gold costs of event options scale with progression: the authored base
   * price is multiplied by (1 + block index), where blocks are 10 floors.
   * Events are shared across all floors, so a flat early-game price would
   * become meaningless later; labels therefore never carry a price and the
   * UI shows this scaled cost.
   */
  static scaledGoldCost(baseGold: number, floor: number): number {
    const blockIndex = Math.max(0, Math.floor((Math.max(1, floor) - 1) / 10));
    return baseGold * (1 + blockIndex);
  }

  static canAffordOption(state: EventExecutionState, option: EventOption): boolean {
    if (!option.cost) return true;
    if (
      option.cost.gold &&
      state.gold < EventEngine.scaledGoldCost(option.cost.gold, state.currentFloor ?? 1)
    ) {
      return false;
    }
    if (option.cost.hpPercent) {
      const hpCost = Math.floor((state.maxHp * option.cost.hpPercent) / 100);
      if (state.currentHp <= hpCost) {
        return false;
      }
    }
    return true;
  }

  static resolveOption(
    state: EventExecutionState,
    option: EventOption,
    rng: () => number = Math.random
  ): EventResolutionResult {
    if (!EventEngine.canAffordOption(state, option)) {
      return {
        success: false,
        reason: 'コスト（HPまたはゴールド）が不足しています。',
        nextState: state,
        logMessage: '条件を満たしていないため選択できません。',
      };
    }

    const next: EventExecutionState = { ...state };

    if (option.cost?.gold) {
      next.gold = Math.max(
        0,
        next.gold - EventEngine.scaledGoldCost(option.cost.gold, state.currentFloor ?? 1)
      );
    }
    if (option.cost?.hpPercent) {
      const hpCost = Math.floor((next.maxHp * option.cost.hpPercent) / 100);
      next.currentHp = Math.max(1, next.currentHp - hpCost);
    }

    const outcome = option.outcome;
    if (outcome.healHpPercent) {
      const heal = Math.floor((next.maxHp * outcome.healHpPercent) / 100);
      next.currentHp = Math.min(next.maxHp, next.currentHp + heal);
    }
    if (outcome.refillConsumable) {
      next.consumableCharges = Math.min(
        next.consumableMaxCharges,
        next.consumableCharges + outcome.refillConsumable
      );
    }
    if (outcome.grantGold) {
      next.gold += outcome.grantGold;
    }

    let grantedItem: AnyCatalogItem | undefined;
    if (outcome.grantItemType) {
      grantedItem = EventEngine.pickRandomCatalogItem(
        outcome.grantItemType,
        rng,
        state.currentFloor
      );
    } else if (outcome.specificItemId) {
      grantedItem =
        WEAPON_CATALOG[outcome.specificItemId] ??
        ARMOR_CATALOG[outcome.specificItemId] ??
        SKILL_CATALOG[outcome.specificItemId] ??
        RELIC_CATALOG[outcome.specificItemId] ??
        CONSUMABLE_CATALOG[outcome.specificItemId];
    }

    return {
      success: true,
      nextState: next,
      grantedItem,
      logMessage: outcome.logMessage,
    };
  }

  /** Item ids that appear in the reward pool of at least one floor <= maxFloor. */
  static eraItemIds(maxFloor: number): Set<string> {
    const ids = new Set<string>();
    for (const [num, def] of Object.entries(ALL_FLOORS)) {
      if (Number(num) > maxFloor) continue;
      const pool = def.rewardPool;
      for (const id of pool.equipmentIds) ids.add(id);
      for (const id of pool.skillIds) ids.add(id);
      for (const id of pool.utilityIds) ids.add(id);
      for (const id of pool.consumableIds ?? []) ids.add(id);
    }
    return ids;
  }

  static pickRandomCatalogItem(
    kind: 'weapon' | 'armor' | 'skill' | 'relic',
    rng: () => number = Math.random,
    maxFloor?: number
  ): AnyCatalogItem {
    let pool: AnyCatalogItem[] = [];
    switch (kind) {
      case 'weapon':
        pool = Object.values(WEAPON_CATALOG);
        break;
      case 'armor':
        pool = Object.values(ARMOR_CATALOG);
        break;
      case 'skill':
        pool = Object.values(SKILL_CATALOG);
        break;
      case 'relic':
        pool = Object.values(RELIC_CATALOG);
        break;
    }
    // Era lock: never grant an item that has not debuted yet at this floor
    // (an event on floor 3 must not hand out an endgame weapon). Falls back
    // to the full kind pool if the era pool is somehow empty.
    if (maxFloor !== undefined) {
      const era = EventEngine.eraItemIds(maxFloor);
      const filtered = pool.filter((item) => era.has(item.id));
      if (filtered.length > 0) pool = filtered;
    }
    const idx = Math.floor(rng() * pool.length);
    return pool[idx] ?? pool[0];
  }
}
