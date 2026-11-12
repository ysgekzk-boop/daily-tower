import { StatusDefinition } from './types';

export const STATUS_REGISTRY: Record<string, StatusDefinition> = {
  burn: {
    id: 'burn',
    name: '火傷',
    icon: '🔥',
    category: 'debuff',
    stacking: 'refresh',
    maxDuration: 5,
    cleansable: true,
    hooks: {
      turn_start: (ctx) => {
        const pct = Math.max(1, ctx.value || 8);
        const dmg = Math.max(1, Math.floor((ctx.ownerMaxHp * pct) / 100));
        return {
          damageDealt: dmg,
          logMessage: `火傷により ${dmg} のダメージを受けた！`,
        };
      },
    },
  },

  poison: {
    id: 'poison',
    name: '猛毒',
    icon: '☠️',
    category: 'debuff',
    stacking: 'stack_value',
    maxValue: 50,
    maxDuration: 6,
    cleansable: true,
    hooks: {
      turn_start: (ctx) => {
        const dmg = Math.max(1, Math.floor(ctx.value));
        return {
          damageDealt: dmg,
          logMessage: `猛毒が蝕み ${dmg} のダメージ！`,
        };
      },
    },
  },

  freeze: {
    id: 'freeze',
    name: '凍結',
    icon: '❄️',
    category: 'debuff',
    stacking: 'none',
    maxDuration: 1,
    cleansable: true,
    blocksAction: true,
    hooks: {
      pre_action: () => ({
        skipAction: true,
        logMessage: '体が凍りついて動けない！',
      }),
    },
  },

  shield: {
    id: 'shield',
    name: '障壁',
    icon: '🛡️',
    category: 'buff',
    stacking: 'stack_value',
    maxValue: 200,
    maxDuration: 4,
    cleansable: false,
    absorbPool: true,
    hooks: {
      action_resolution: (ctx) => ({
        absorbAmount: Math.max(0, ctx.value),
        logMessage: `障壁が最大 ${ctx.value} ダメージを吸収する態勢！`,
      }),
    },
  },

  atk_buff: {
    id: 'atk_buff',
    name: '攻撃強化',
    icon: '⚔️⬆️',
    category: 'buff',
    counterpartId: 'atk_debuff',
    stacking: 'refresh',
    maxDuration: 5,
    cleansable: false,
    hooks: {
      action_resolution: (ctx) => {
        const rate = (ctx.value || 25) / 100;
        return {
          atkRateModifier: rate,
          outgoingDamageMultiplier: 1 + rate,
          logMessage: `攻撃力が ${Math.round(rate * 100)}% 上昇中！`,
        };
      },
    },
  },

  atk_debuff: {
    id: 'atk_debuff',
    name: '攻撃低下',
    icon: '⚔️⬇️',
    category: 'debuff',
    counterpartId: 'atk_buff',
    stacking: 'refresh',
    maxDuration: 5,
    cleansable: true,
    hooks: {
      action_resolution: (ctx) => {
        const rate = (ctx.value || 25) / 100;
        return {
          atkRateModifier: -rate,
          outgoingDamageMultiplier: Math.max(0.1, 1 - rate),
          logMessage: `攻撃力が ${Math.round(rate * 100)}% 低下中…`,
        };
      },
    },
  },

  def_buff: {
    id: 'def_buff',
    name: '防御強化',
    icon: '🛡️⬆️',
    category: 'buff',
    counterpartId: 'def_debuff',
    stacking: 'refresh',
    maxDuration: 5,
    cleansable: false,
    hooks: {
      action_resolution: (ctx) => {
        const rate = (ctx.value || 30) / 100;
        return {
          defRateModifier: rate,
          incomingDamageMultiplier: Math.max(0.2, 1 - rate * 0.5),
          logMessage: `防御力が ${Math.round(rate * 100)}% 上昇中！`,
        };
      },
    },
  },

  def_debuff: {
    id: 'def_debuff',
    name: '防御低下',
    icon: '🛡️⬇️',
    category: 'debuff',
    counterpartId: 'def_buff',
    stacking: 'refresh',
    maxDuration: 5,
    cleansable: true,
    hooks: {
      action_resolution: (ctx) => {
        const rate = (ctx.value || 30) / 100;
        return {
          defRateModifier: -rate,
          incomingDamageMultiplier: 1 + rate * 0.5,
          logMessage: `防御力が ${Math.round(rate * 100)}% 低下！`,
        };
      },
    },
  },

  flat_atk_up: {
    id: 'flat_atk_up',
    name: '闘気',
    icon: '💪⬆️',
    category: 'buff',
    counterpartId: 'flat_atk_down',
    stacking: 'stack_value',
    maxValue: 50,
    maxDuration: 4,
    cleansable: false,
    hooks: {
      action_resolution: (ctx) => ({
        flatAtkModifier: ctx.value,
        logMessage: `攻撃力が +${ctx.value} 増加中！`,
      }),
    },
  },

  flat_atk_down: {
    id: 'flat_atk_down',
    name: '脱力',
    icon: '💪⬇️',
    category: 'debuff',
    counterpartId: 'flat_atk_up',
    stacking: 'stack_value',
    maxValue: 50,
    maxDuration: 4,
    cleansable: true,
    hooks: {
      action_resolution: (ctx) => ({
        flatAtkModifier: -ctx.value,
        logMessage: `攻撃力が -${ctx.value} 低下中…`,
      }),
    },
  },
};
