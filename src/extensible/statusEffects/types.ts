export type StatusCategory = 'buff' | 'debuff' | 'neutral';

export type StackingRule =
  | 'refresh'          // Reapplying resets duration (value replaced)
  | 'stack_value'      // Reapplying adds to value, up to maxValue
  | 'extend_duration'  // Reapplying adds duration, up to maxDuration
  | 'none';            // Cannot stack; reapply only if it would last longer

export type LifecyclePhase =
  | 'turn_start'
  | 'pre_action'
  | 'action_resolution'
  | 'post_action'
  | 'turn_end';

export interface StatusContext {
  value: number;            // Potency carried by the active instance
  duration: number;         // Remaining turns
  ownerCurrentHp: number;   // The combatant carrying the status
  ownerMaxHp: number;
  opponentCurrentHp: number;
  opponentMaxHp: number;
  turnNumber: number;
}

export interface StatusResult {
  damageDealt?: number;
  healAmount?: number;
  skipAction?: boolean;              // e.g. freeze
  flatAtkModifier?: number;          // Flat +/- to ATK before multipliers
  flatDefModifier?: number;          // Flat +/- to DEF before multipliers
  atkRateModifier?: number;          // Paired additive rate (e.g. +0.3 for +30% ATK, -0.25 for -25% ATK)
  defRateModifier?: number;          // Paired additive rate (e.g. +0.3 for +30% DEF, -0.25 for -25% DEF)
  outgoingDamageMultiplier?: number; // Multiplicative outgoing damage factor (e.g. 1.3)
  incomingDamageMultiplier?: number; // Multiplicative incoming damage factor (e.g. 1.25)
  absorbAmount?: number;             // e.g. shield absorb capacity
  logMessage: string;
}

export type StatusHandler = (ctx: StatusContext) => StatusResult;

export interface StatusDefinition {
  id: string;                       // Unique, stable, snake_case
  name: string;
  icon: string;                     // Display symbol / icon
  category: StatusCategory;
  counterpartId?: string;           // Paired buff/debuff counterpart ID
  stacking: StackingRule;
  maxValue?: number;                // Required when stacking = 'stack_value'
  maxDuration?: number;
  cleansable: boolean;              // Can cleanse/dispel remove it?
  blocksAction?: boolean;           // True for freeze-like statuses
  hooks: Partial<Record<LifecyclePhase, StatusHandler>>;
}

export interface ActiveStatusInstance {
  statusId: string;
  value: number;
  duration: number;
}
