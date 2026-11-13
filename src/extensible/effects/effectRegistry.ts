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
  forest_dewdrop: {
    id: 'forest_dewdrop',
    name: '森露の護符',
    trigger: 'battle_start',
    handler: () => ({
      applyStatusToPlayer: {
        statusId: 'def_buff',
        value: 25,
        duration: 3,
      },
      logMessage: `[レリック:森露の護符] 戦闘開始時に3ターンの防御強化(+25%)！`,
    }),
  },
  briar_thorn: {
    id: 'briar_thorn',
    name: '茨棘の腕輪',
    trigger: 'on_attack',
    handler: (ctx) => {
      const bonus = Math.max(2, Math.floor(ctx.playerAtk * 0.12));
      return {
        bonusDamage: bonus,
        logMessage: `[レリック:茨棘の腕輪] 茨の棘が弾け、追加ダメージ +${bonus}！`,
      };
    },
  },
  mist_veil_bell: {
    id: 'mist_veil_bell',
    name: '霧隠れの鈴',
    trigger: 'battle_start',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'atk_debuff',
        value: 15,
        duration: 3,
      },
      logMessage: `[レリック:霧隠れの鈴] 霧の鈴音が響き、敵の攻撃力を15%低下(3T)させた！`,
    }),
  },
  elder_sap_seal: {
    id: 'elder_sap_seal',
    name: '古樹液の印章',
    trigger: 'on_skill_use',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'def_debuff',
        value: 15,
        duration: 2,
      },
      logMessage: `[レリック:古樹液の印章] スキル発動に呼応し敵の防御力を15%低下(2T)させた！`,
    }),
  },
  mirror_talisman: {
    id: 'mirror_talisman',
    name: '水鏡の呪符',
    trigger: 'battle_start',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'def_debuff',
        value: 15,
        duration: 3,
      },
      logMessage: `[レリック:水鏡の呪符] 水鏡の呪文が敵を映し、防御力を3ターンの間15%低下させた！`,
    }),
  },
  reed_whistle: {
    id: 'reed_whistle',
    name: '葦笛の護符',
    trigger: 'on_skill_use',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'atk_debuff',
        value: 15,
        duration: 2,
      },
      logMessage: `[レリック:葦笛の護符] スキル発動に呼応し葦笛が響き、敵の攻撃力を2ターンの間15%低下させた！`,
    }),
  },
  rootstone_ember_seal: {
    id: 'rootstone_ember_seal',
    name: '苔火の石印',
    trigger: 'battle_start',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'burn',
        value: 8,
        duration: 3,
      },
      logMessage: `[レリック:苔火の石印] 古樹の燐火が灯り、敵に火傷(最大HP8%/3T)を付与した！`,
    }),
  },
  ancient_amber: {
    id: 'ancient_amber',
    name: '古樹琥珀の貨印',
    trigger: 'battle_victory',
    handler: () => ({
      grantGold: 20,
      logMessage: `[レリック:古樹琥珀の貨印] 勝利時に追加で 20 Gold を発見！`,
    }),
  },
  worldtree_seed_heart: {
    id: 'worldtree_seed_heart',
    name: '世界樹種子の核',
    trigger: 'on_skill_use',
    handler: (ctx) => {
      const heal = Math.max(4, Math.floor(ctx.playerMaxHp * 0.05));
      return {
        healPlayer: heal,
        logMessage: `[レリック:世界樹種子の核] 樹液の脈動が響き、HPを ${heal} 回復した！`,
      };
    },
  },
  canopy_crown: {
    id: 'canopy_crown',
    name: '樹冠の聖環',
    trigger: 'on_skill_use',
    handler: (ctx) => {
      const shieldVal = Math.max(10, Math.floor(ctx.playerMaxHp * 0.12));
      return {
        applyStatusToPlayer: {
          statusId: 'shield',
          value: shieldVal,
          duration: 2,
        },
        logMessage: `[レリック:樹冠の聖環] 聖なる枝葉が身を覆い、障壁(${shieldVal})を展開した！`,
      };
    },
  },
  forge_cinder_talisman: {
    id: 'forge_cinder_talisman',
    name: '炉火の護符',
    trigger: 'on_skill_use',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'burn',
        value: 10,
        duration: 3,
      },
      logMessage: `[レリック:炉火の護符] スキル発動に呼応し、炉の火の粉が敵に火傷(最大HP10%/3T)を付与した！`,
    }),
  },
  ember_leech_stone: {
    id: 'ember_leech_stone',
    name: '熾火の吸魂石',
    trigger: 'on_attack',
    handler: (ctx) => {
      const heal = Math.max(3, Math.floor(ctx.playerMaxHp * 0.05));
      return {
        healPlayer: heal,
        logMessage: `[レリック:熾火の吸魂石] 赤熱石が脈動し、攻撃時にHPを ${heal} 回復した！`,
      };
    },
  },
  steam_pressure_valve: {
    id: 'steam_pressure_valve',
    name: '蒸気圧の安全弁',
    trigger: 'battle_start',
    handler: () => ({
      applyStatusToPlayer: {
        statusId: 'flat_atk_up',
        value: 8,
        duration: 3,
      },
      logMessage: `[レリック:蒸気圧の安全弁] 高圧蒸気が脈動し、3ターンの間攻撃力が +8 上昇した！`,
    }),
  },
  molten_slag_seal: {
    id: 'molten_slag_seal',
    name: '溶滓の刻印',
    trigger: 'battle_start',
    handler: () => ({
      applyStatusToEnemy: {
        statusId: 'poison',
        value: 10,
        duration: 3,
      },
      logMessage: `[レリック:溶滓の刻印] 溶滓の毒気が立ち昇り、敵に3ターンの間猛毒(10)を付与した！`,
    }),
  },
  obsidian_ember_lens: {
    id: 'obsidian_ember_lens',
    name: '黒曜の熾火鏡',
    trigger: 'on_skill_use',
    handler: () => ({
      applyStatusToPlayer: {
        statusId: 'atk_buff',
        value: 25,
        duration: 2,
      },
      logMessage: `[レリック:黒曜の熾火鏡] スキル発動に呼応して残り火が輝き、2ターンの間攻撃力+25%を得た！`,
    }),
  },
  ashen_shard_talon: {
    id: 'ashen_shard_talon',
    name: '灰燼黒曜の爪',
    trigger: 'on_attack',
    handler: (ctx) => {
      const bonus = Math.max(4, Math.floor(ctx.playerAtk * 0.15));
      return {
        bonusDamage: bonus,
        logMessage: `[レリック:灰燼黒曜の爪] 黒曜の刃先が閃き、追加ダメージ +${bonus}！`,
      };
    },
  },
  steam_cog_regulator: {
    id: 'steam_cog_regulator',
    name: '蒸気歯車の調律器',
    trigger: 'on_skill_use',
    handler: () => ({
      applyStatusToPlayer: {
        statusId: 'def_buff',
        value: 25,
        duration: 2,
      },
      logMessage: `[レリック:蒸気歯車の調律器] 歯車が噛み合い、2ターンの間防御力+25%を得た！`,
    }),
  },
  boiler_shell_plating: {
    id: 'boiler_shell_plating',
    name: '圧力外殻の装甲板',
    trigger: 'on_attack',
    handler: (ctx) => {
      const shieldVal = Math.max(10, Math.floor(ctx.playerMaxHp * 0.1));
      return {
        applyStatusToPlayer: {
          statusId: 'shield',
          value: shieldVal,
          duration: 2,
        },
        logMessage: `[レリック:圧力外殻の装甲板] 外殻蒸気が噴き上がり、障壁(${shieldVal}/2T)を展開した！`,
      };
    },
  },
};




