import { ActiveStatusInstance } from '../statusEffects/types';

export type RelicTriggerPhase =
  | 'battle_start'
  | 'turn_start'
  | 'on_attack'
  | 'on_skill_use'
  | 'battle_victory';

export interface EffectContext {
  playerCurrentHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  enemyCurrentHp: number;
  enemyMaxHp: number;
  turnNumber: number;
}

export interface EffectResolution {
  bonusDamage?: number;
  healPlayer?: number;
  grantGold?: number;
  applyStatusToPlayer?: ActiveStatusInstance;
  applyStatusToEnemy?: ActiveStatusInstance;
  logMessage: string;
}

export type CustomEffectHandler = (ctx: EffectContext) => EffectResolution;

export interface RegisteredEffect {
  id: string;
  name: string;
  trigger: RelicTriggerPhase;
  handler: CustomEffectHandler;
}
