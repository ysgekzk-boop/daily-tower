export interface EventCost {
  gold?: number;
  hpPercent?: number; // Trade-off cost in % of Max HP (never kills player; leaves at least 1 HP)
}

export interface EventOutcome {
  healHpPercent?: number;
  refillConsumable?: number;
  grantGold?: number;
  grantItemType?: 'weapon' | 'armor' | 'skill' | 'relic';
  specificItemId?: string;
  cleanseDebuffs?: boolean;
  logMessage: string;
}

export interface EventOption {
  id: string;
  label: string;
  description: string;
  cost?: EventCost;
  outcome: EventOutcome;
}

export interface GameEventDefinition {
  id: string;
  title: string;
  category: 'rest' | 'shrine' | 'merchant' | 'lore' | 'forge';
  isRestEvent?: boolean; // Marks guaranteed rest nodes per Spec §3.1 & §5.2
  description: string;
  speakerSpriteId?: string;
  palette?: string;
  options: EventOption[];
}
