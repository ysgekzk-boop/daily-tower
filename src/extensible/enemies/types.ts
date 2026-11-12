import { ElementType } from '../items/itemCatalog';

export type EnemyActionType = 'attack' | 'buff' | 'debuff';

export interface EnemyAction {
  name: string;
  type: EnemyActionType;
  weight: number;                // Positive probability weight
  damageMultiplier?: number;     // Used for 'attack' or damaging 'debuff'
  statusId?: string;             // Must exist in STATUS_REGISTRY
  statusValue?: number;
  statusDuration?: number;
  logMessage: string;
}

export interface EnemyPhase {
  hpThresholdPercent: number;    // Active when (currentHp / maxHp) * 100 <= hpThresholdPercent
  phaseName?: string;            // Optional label e.g. "狂乱状態"
  actions: EnemyAction[];
}

export interface EnemyDefinition {
  id: string;
  name: string;
  title?: string;
  spriteId: string;
  palette: string;
  hp: number;
  atk: number;
  def: number;
  goldReward: number;
  isBoss?: boolean;
  weakness?: ElementType;
  resistance?: ElementType;
  phases: EnemyPhase[];          // Sorted descending by hpThresholdPercent (e.g. 100 -> 50 -> 25)
}

