import { EventOption } from '../extensible/events/types';
import {
  AnyCatalogItem,
  ARMOR_CATALOG,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../extensible/items/itemCatalog';

export interface EventExecutionState {
  currentHp: number;
  maxHp: number;
  gold: number;
  consumableCharges: number;
  consumableMaxCharges: number;
}

export interface EventResolutionResult {
  success: boolean;
  reason?: string;
  nextState: EventExecutionState;
  grantedItem?: AnyCatalogItem;
  logMessage: string;
}

export class EventEngine {
  static canAffordOption(state: EventExecutionState, option: EventOption): boolean {
    if (!option.cost) return true;
    if (option.cost.gold && state.gold < option.cost.gold) {
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
      next.gold = Math.max(0, next.gold - option.cost.gold);
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
      grantedItem = EventEngine.pickRandomCatalogItem(outcome.grantItemType, rng);
    }

    return {
      success: true,
      nextState: next,
      grantedItem,
      logMessage: outcome.logMessage,
    };
  }

  static pickRandomCatalogItem(
    kind: 'weapon' | 'armor' | 'skill' | 'relic',
    rng: () => number = Math.random
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
    const idx = Math.floor(rng() * pool.length);
    return pool[idx] ?? pool[0];
  }
}
