import { RegisteredEffect } from './types';

export const EFFECT_REGISTRY: Record<string, RegisteredEffect> = {
  vampiric_fang: {
    id: 'vampiric_fang',
    name: '吸血の牙',
    trigger: 'on_attack',
    handler: (ctx) => {
      const heal = Math.max(2, Math.floor(ctx.playerMaxHp * 0.04));
      return {
        healPlayer: heal,
        logMessage: `[レリック:吸血の牙] 攻撃時にHPを ${heal} 吸収回復した！`,
      };
    },
  },
  guardian_crest: {
    id: 'guardian_crest',
    name: '守護者の紋章',
    trigger: 'battle_start',
    handler: (ctx) => {
      const shieldVal = Math.max(12, Math.floor(ctx.playerMaxHp * 0.15));
      return {
        applyStatusToPlayer: {
          statusId: 'shield',
          value: shieldVal,
          duration: 3,
        },
        logMessage: `[レリック:守護者の紋章] 戦闘開始時に障壁(${shieldVal})を展開！`,
      };
    },
  },
  berserker_idol: {
    id: 'berserker_idol',
    name: '狂戦士の彫像',
    trigger: 'battle_start',
    handler: () => ({
      applyStatusToPlayer: {
        statusId: 'atk_buff',
        value: 25,
        duration: 3,
      },
      logMessage: `[レリック:狂戦士の彫像] 戦闘開始時に3ターンの攻撃強化(+25%)！`,
    }),
  },
  venom_gland: {
    id: 'venom_gland',
    name: '猛毒腺の護符',
    trigger: 'on_skill_use',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'poison',
        value: 8,
        duration: 3,
      },
      logMessage: `[レリック:猛毒腺の護符] スキル発動に呼応し敵へ猛毒(8)を付与！`,
    }),
  },
  golden_compass: {
    id: 'golden_compass',
    name: '黄金の羅針盤',
    trigger: 'battle_victory',
    handler: () => ({
      grantGold: 15,
      logMessage: `[レリック:黄金の羅針盤] 勝利時に追加で 15 Gold を発見！`,
    }),
  },
  bookmark_charm: {
    id: 'bookmark_charm',
    name: '栞の護符',
    trigger: 'on_attack',
    handler: (ctx) => {
      if (ctx.turnNumber !== 1) {
        return {
          logMessage: '',
        };
      }
      const bonus = Math.max(1, Math.floor(ctx.playerAtk * 0.15));
      return {
        bonusDamage: bonus,
        logMessage: `[レリック:栞の護符] 初撃の栞が輝き、追加ダメージ +${bonus}！`,
      };
    },
  },
};

