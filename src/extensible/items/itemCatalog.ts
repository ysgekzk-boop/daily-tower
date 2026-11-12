export type ElementType = 'physical' | 'fire' | 'ice' | 'nature' | 'void';
export type SkillCategory = 'attack' | 'heal' | 'buff' | 'debuff';

export interface WeaponItem {
  id: string;
  name: string;
  kind: 'weapon';
  atk: number;
  element: ElementType;
  salvageGold: number;
  description: string;
}

export interface ArmorItem {
  id: string;
  name: string;
  kind: 'armor';
  def: number;
  maxHpBonus: number;
  salvageGold: number;
  description: string;
}

export interface SkillStatusPayload {
  target: 'self' | 'enemy';
  statusId: string;
  value: number;
  duration: number;
}

export interface SkillItem {
  id: string;
  name: string;
  kind: 'skill';
  category: SkillCategory;
  maxChargesPerBattle: number; // 1 to 3 uses per battle
  /**
   * 'single' (default): damage / enemy status hits the selected target only.
   * 'all_enemies': damage / enemy status hits every living enemy.
   */
  targetScope?: 'single' | 'all_enemies';
  damageMultiplier?: number;
  healPercent?: number;
  healFlat?: number;
  cleanse?: boolean;
  applyStatus?: SkillStatusPayload;
  salvageGold: number;
  description: string;
}

export interface ConsumableItem {
  id: string;
  name: string;
  kind: 'consumable';
  maxCharges: number; // 2 to 3 scarce charges
  healPercent?: number;
  cleanse?: boolean;
  applyStatus?: SkillStatusPayload;
  description: string;
}

export interface RelicItem {
  id: string;
  name: string;
  kind: 'relic';
  effectId: string;
  salvageGold: number;
  description: string;
}

export type AnyCatalogItem =
  | WeaponItem
  | ArmorItem
  | SkillItem
  | ConsumableItem
  | RelicItem;

export const WEAPON_CATALOG: Record<string, WeaponItem> = {
  rusty_shortsword: {
    id: 'rusty_shortsword',
    name: '旅立ちの短剣',
    kind: 'weapon',
    atk: 12,
    element: 'physical',
    salvageGold: 10,
    description: '塔の入口で支給される標準的な鉄の短剣。',
  },
  verdant_blade: {
    id: 'verdant_blade',
    name: '翠樹の長剣',
    kind: 'weapon',
    atk: 18,
    element: 'nature',
    salvageGold: 25,
    description: '樹海の魔力を宿した鋭利な長剣。',
  },
  thorn_halberd: {
    id: 'thorn_halberd',
    name: '茨のハルバード',
    kind: 'weapon',
    atk: 25,
    element: 'nature',
    salvageGold: 40,
    description: '硬い樹皮をも貫く重厚な斧槍。',
  },
  ember_greatsword: {
    id: 'ember_greatsword',
    name: '熾火の大剣',
    kind: 'weapon',
    atk: 34,
    element: 'fire',
    salvageGold: 60,
    description: '黄昏の製鉄所で鍛えられた灼熱の大剣。',
  },
  obsidian_reaver: {
    id: 'obsidian_reaver',
    name: '黒曜の断罪刃',
    kind: 'weapon',
    atk: 46,
    element: 'void',
    salvageGold: 90,
    description: 'あらゆる装甲を断ち切る黒曜石の刃。',
  },
  stargazer_silver_sword: {
    id: 'stargazer_silver_sword',
    name: '星見の銀剣',
    kind: 'weapon',
    atk: 14,
    element: 'void',
    salvageGold: 20,
    description: '虚空の図書館の銀細工で鍛えられた、静かな星光を宿す剣。',
  },
};

export const ARMOR_CATALOG: Record<string, ArmorItem> = {
  leather_tunic: {
    id: 'leather_tunic',
    name: '冒険者の革鎧',
    kind: 'armor',
    def: 4,
    maxHpBonus: 0,
    salvageGold: 10,
    description: '動きやすさを重視した基本的な革の胸当て。',
  },
  bark_cuirass: {
    id: 'bark_cuirass',
    name: '古樹の胸甲',
    kind: 'armor',
    def: 7,
    maxHpBonus: 25,
    salvageGold: 25,
    description: '千年樹の樹皮を編み込んだ頑丈な防具。',
  },
  ironwood_plate: {
    id: 'ironwood_plate',
    name: '鉄木の重装鎧',
    kind: 'armor',
    def: 11,
    maxHpBonus: 55,
    salvageGold: 45,
    description: '鋼鉄並みの硬度を持つ鉄木で作られた全身鎧。',
  },
  cinder_mail: {
    id: 'cinder_mail',
    name: '灰燼の鎖帷子',
    kind: 'armor',
    def: 16,
    maxHpBonus: 90,
    salvageGold: 65,
    description: '熱と衝撃を分散する特殊な合金メイル。',
  },
  librarian_robe: {
    id: 'librarian_robe',
    name: '司書の法衣',
    kind: 'armor',
    def: 5,
    maxHpBonus: 15,
    salvageGold: 20,
    description: '知識の守り手が纏う、防護術式が織り込まれた法衣。',
  },
};

export const SKILL_CATALOG: Record<string, SkillItem> = {
  power_slash: {
    id: 'power_slash',
    name: '渾身斬り',
    kind: 'skill',
    category: 'attack',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.75,
    salvageGold: 15,
    description: '全体重を乗せた一撃。1.75倍のダメージを与える（1戦2回まで）。',
  },
  flame_burst: {
    id: 'flame_burst',
    name: '紅蓮撃',
    kind: 'skill',
    category: 'attack',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.4,
    applyStatus: {
      target: 'enemy',
      statusId: 'burn',
      value: 10,
      duration: 3,
    },
    salvageGold: 25,
    description: '1.4倍ダメージ＋敵に火傷(最大HP10%/3T)を付与（1戦2回）。',
  },
  flame_wave: {
    id: 'flame_wave',
    name: '炎の波動',
    kind: 'skill',
    category: 'attack',
    maxChargesPerBattle: 2,
    targetScope: 'all_enemies',
    damageMultiplier: 0.8,
    salvageGold: 30,
    description: '敵全体に0.8倍ダメージを与える全体攻撃（1戦2回）。',
  },
  frost_lance: {
    id: 'frost_lance',
    name: '氷結の槍',
    kind: 'skill',
    category: 'debuff',
    maxChargesPerBattle: 1,
    damageMultiplier: 1.2,
    applyStatus: {
      target: 'enemy',
      statusId: 'freeze',
      value: 1,
      duration: 1,
    },
    salvageGold: 35,
    description: '1.2倍ダメージ＋敵を1ターン凍結(行動不能)にする切り札（1戦1回）。',
  },
  armor_crush: {
    id: 'armor_crush',
    name: '破甲撃',
    kind: 'skill',
    category: 'debuff',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.25,
    applyStatus: {
      target: 'enemy',
      statusId: 'def_debuff',
      value: 35,
      duration: 3,
    },
    salvageGold: 25,
    description: '1.25倍ダメージ＋敵の防御力を35%低下(3T)（1戦2回）。',
  },
  venom_strike: {
    id: 'venom_strike',
    name: '蛇毒の牙',
    kind: 'skill',
    category: 'debuff',
    maxChargesPerBattle: 3,
    damageMultiplier: 1.1,
    applyStatus: {
      target: 'enemy',
      statusId: 'poison',
      value: 12,
      duration: 4,
    },
    salvageGold: 25,
    description: '1.1倍ダメージ＋蓄積する猛毒(12ダメージ/4T)を付与（1戦3回）。',
  },
  aegis_stance: {
    id: 'aegis_stance',
    name: 'イージス障壁',
    kind: 'skill',
    category: 'buff',
    maxChargesPerBattle: 2,
    applyStatus: {
      target: 'self',
      statusId: 'shield',
      value: 35,
      duration: 3,
    },
    salvageGold: 20,
    description: '自身に35ダメージを吸収する障壁(3T)を展開（1戦2回）。',
  },
  war_cry: {
    id: 'war_cry',
    name: '戦いの咆哮',
    kind: 'skill',
    category: 'buff',
    maxChargesPerBattle: 2,
    applyStatus: {
      target: 'self',
      statusId: 'atk_buff',
      value: 35,
      duration: 3,
    },
    salvageGold: 25,
    description: '自身の攻撃力を35%上昇(3T)させる（1戦2回）。',
  },
  purifying_light: {
    id: 'purifying_light',
    name: '浄化の祈り',
    kind: 'skill',
    category: 'heal',
    maxChargesPerBattle: 1,
    healPercent: 32,
    cleanse: true,
    salvageGold: 30,
    description: '最大HPの32%を回復し、すべてのデバフを解除する（1戦1回）。',
  },
  chrono_flip: {
    id: 'chrono_flip',
    name: 'ページめくり',
    kind: 'skill',
    category: 'debuff',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.5,
    applyStatus: {
      target: 'enemy',
      statusId: 'def_debuff',
      value: 35,
      duration: 3,
    },
    salvageGold: 30,
    description: '時の頁を鋭くめくる一撃。1.5倍ダメージ＋敵の防御力を35%低下(3T)（1戦2回）。',
  },
};

export const CONSUMABLE_CATALOG: Record<string, ConsumableItem> = {
  crimson_vial: {
    id: 'crimson_vial',
    name: '紅玉の霊薬',
    kind: 'consumable',
    maxCharges: 2,
    healPercent: 50,
    cleanse: true,
    description: 'HPを50%回復し状態異常を浄化する貴重な秘薬（最大2チャージ・自動回復なし）。',
  },
  ambrosia_flask: {
    id: 'ambrosia_flask',
    name: '神樹の雫',
    kind: 'consumable',
    maxCharges: 3,
    healPercent: 45,
    applyStatus: {
      target: 'self',
      statusId: 'shield',
      value: 30,
      duration: 3,
    },
    description: 'HP45%回復＋障壁(30)を付与する秘薬（最大3チャージ）。',
  },
};

export const RELIC_CATALOG: Record<string, RelicItem> = {
  vampiric_fang_relic: {
    id: 'vampiric_fang_relic',
    name: '吸血の牙',
    kind: 'relic',
    effectId: 'vampiric_fang',
    salvageGold: 40,
    description: '通常攻撃を行うたび、最大HPの4%を回復する。',
  },
  guardian_crest_relic: {
    id: 'guardian_crest_relic',
    name: '守護者の紋章',
    kind: 'relic',
    effectId: 'guardian_crest',
    salvageGold: 40,
    description: '各バトルの開始時、最大HPの15%分の障壁を自動的に展開する。',
  },
  berserker_idol_relic: {
    id: 'berserker_idol_relic',
    name: '狂戦士の彫像',
    kind: 'relic',
    effectId: 'berserker_idol',
    salvageGold: 45,
    description: '各バトルの開始時、3ターンの間攻撃力+25%を得る。',
  },
  venom_gland_relic: {
    id: 'venom_gland_relic',
    name: '猛毒腺の護符',
    kind: 'relic',
    effectId: 'venom_gland',
    salvageGold: 45,
    description: 'スキルを使用するたび、敵に猛毒(8)を追加付与する。',
  },
  golden_compass_relic: {
    id: 'golden_compass_relic',
    name: '黄金の羅針盤',
    kind: 'relic',
    effectId: 'golden_compass',
    salvageGold: 35,
    description: 'バトル勝利時に獲得するゴールドが +15 増加する。',
  },
  bookmark_charm_relic: {
    id: 'bookmark_charm_relic',
    name: '栞の護符',
    kind: 'relic',
    effectId: 'bookmark_charm',
    salvageGold: 40,
    description: '各バトルの1ターン目の攻撃時、+15%相当の追加ダメージを与える。',
  },
};

