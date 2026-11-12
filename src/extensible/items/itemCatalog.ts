export type ElementType = 'physical' | 'fire' | 'ice' | 'nature' | 'void';
export type SkillCategory = 'attack' | 'heal' | 'buff' | 'debuff';

export interface WeaponItem {
  id: string;
  name: string;
  kind: 'weapon';
  spriteId: string;
  atk: number;
  element: ElementType;
  salvageGold: number;
  description: string;
}

export interface ArmorItem {
  id: string;
  name: string;
  kind: 'armor';
  spriteId: string;
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
  spriteId: string;
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
  spriteId: string;
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
  spriteId: string;
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
    spriteId: 'item_rusty_shortsword',
    atk: 12,
    element: 'physical',
    salvageGold: 10,
    description: '塔の入口で支給される標準的な鉄の短剣。',
  },
  verdant_blade: {
    id: 'verdant_blade',
    name: '翠樹の長剣',
    kind: 'weapon',
    spriteId: 'item_verdant_blade',
    atk: 18,
    element: 'nature',
    salvageGold: 25,
    description: '樹海の魔力を宿した鋭利な長剣。',
  },
  thorn_halberd: {
    id: 'thorn_halberd',
    name: '茨のハルバード',
    kind: 'weapon',
    spriteId: 'item_thorn_halberd',
    atk: 25,
    element: 'nature',
    salvageGold: 40,
    description: '硬い樹皮をも貫く重厚な斧槍。',
  },
  ember_greatsword: {
    id: 'ember_greatsword',
    name: '熾火の大剣',
    kind: 'weapon',
    spriteId: 'item_ember_greatsword',
    atk: 34,
    element: 'fire',
    salvageGold: 60,
    description: '黄昏の製鉄所で鍛えられた灼熱の大剣。',
  },
  obsidian_reaver: {
    id: 'obsidian_reaver',
    name: '黒曜の断罪刃',
    kind: 'weapon',
    spriteId: 'item_obsidian_reaver',
    atk: 46,
    element: 'void',
    salvageGold: 90,
    description: 'あらゆる装甲を断ち切る黒曜石の刃。',
  },
  stargazer_silver_sword: {
    id: 'stargazer_silver_sword',
    name: '星見の銀剣',
    kind: 'weapon',
    spriteId: 'item_stargazer_silver_sword',
    atk: 14,
    element: 'void',
    salvageGold: 20,
    description: '虚空の図書館の銀細工で鍛えられた、静かな星光を宿す剣。',
  },
  ashwood_spear: {
    id: 'ashwood_spear',
    name: 'トネリコの槍',
    kind: 'weapon',
    spriteId: 'item_ashwood_spear',
    atk: 14,
    element: 'physical',
    salvageGold: 18,
    description: 'しなやかなトネリコの木柄を持つ、扱いやすい森の狩猟槍。',
  },
  mossfang_blade: {
    id: 'mossfang_blade',
    name: '苔牙の剣',
    kind: 'weapon',
    spriteId: 'item_mossfang_blade',
    atk: 16,
    element: 'nature',
    salvageGold: 22,
    description: '苔むした古樹の精気を帯びた、鋭利な自然属性の細剣。',
  },
  mistwood_glaive: {
    id: 'mistwood_glaive',
    name: '霧木の大薙刀',
    kind: 'weapon',
    spriteId: 'item_mistwood_glaive',
    atk: 17,
    element: 'physical',
    salvageGold: 26,
    description: '霧深い古樹林の硬木を削り出して作られた、リーチに優れる長柄の薙刀。',
  },
  elder_thorn_sword: {
    id: 'elder_thorn_sword',
    name: '古棘の妖剣',
    kind: 'weapon',
    spriteId: 'item_elder_thorn_sword',
    atk: 19,
    element: 'nature',
    salvageGold: 28,
    description: '千年の霧と樹液を吸い込んだ古木の棘から鍛えられた、自然属性の魔剣。',
  },
};

export const ARMOR_CATALOG: Record<string, ArmorItem> = {
  leather_tunic: {
    id: 'leather_tunic',
    name: '冒険者の革鎧',
    kind: 'armor',
    spriteId: 'item_leather_tunic',
    def: 4,
    maxHpBonus: 0,
    salvageGold: 10,
    description: '動きやすさを重視した基本的な革の胸当て。',
  },
  bark_cuirass: {
    id: 'bark_cuirass',
    name: '古樹の胸甲',
    kind: 'armor',
    spriteId: 'item_bark_cuirass',
    def: 7,
    maxHpBonus: 25,
    salvageGold: 25,
    description: '千年樹の樹皮を編み込んだ頑丈な防具。',
  },
  ironwood_plate: {
    id: 'ironwood_plate',
    name: '鉄木の重装鎧',
    kind: 'armor',
    spriteId: 'item_ironwood_plate',
    def: 11,
    maxHpBonus: 55,
    salvageGold: 45,
    description: '鋼鉄並みの硬度を持つ鉄木で作られた全身鎧。',
  },
  cinder_mail: {
    id: 'cinder_mail',
    name: '灰燼の鎖帷子',
    kind: 'armor',
    spriteId: 'item_cinder_mail',
    def: 16,
    maxHpBonus: 90,
    salvageGold: 65,
    description: '熱と衝撃を分散する特殊な合金メイル。',
  },
  librarian_robe: {
    id: 'librarian_robe',
    name: '司書の法衣',
    kind: 'armor',
    spriteId: 'item_librarian_robe',
    def: 5,
    maxHpBonus: 15,
    salvageGold: 20,
    description: '知識の守り手が纏う、防護術式が織り込まれた法衣。',
  },
  leafweave_vest: {
    id: 'leafweave_vest',
    name: '葉織りの胸当て',
    kind: 'armor',
    spriteId: 'item_leafweave_vest',
    def: 4,
    maxHpBonus: 24,
    salvageGold: 18,
    description: '強靭な蔓と葉を編み込んで作られた、軽快な森の防具。',
  },
  oakheart_brigandine: {
    id: 'oakheart_brigandine',
    name: '樫心の胴鎧',
    kind: 'armor',
    spriteId: 'item_oakheart_brigandine',
    def: 5,
    maxHpBonus: 30,
    salvageGold: 22,
    description: '硬質な樫の芯材を革で覆った、耐久性に優れる森の胴鎧。',
  },
  mistweave_cloak: {
    id: 'mistweave_cloak',
    name: '霧織りの外套',
    kind: 'armor',
    spriteId: 'item_mistweave_cloak',
    def: 5,
    maxHpBonus: 34,
    salvageGold: 26,
    description: '朝霧を閉じ込めた繊維と樹皮で編まれた、軽やかで強靭な森の外套。',
  },
  ancient_bark_mail: {
    id: 'ancient_bark_mail',
    name: '古樹皮の重鎧',
    kind: 'armor',
    spriteId: 'item_ancient_bark_mail',
    def: 6,
    maxHpBonus: 40,
    salvageGold: 28,
    description: '幾重にも重なった古木の厚い樹皮を継ぎ合わせた、重厚な自然の鎧。',
  },
};

export const SKILL_CATALOG: Record<string, SkillItem> = {
  power_slash: {
    id: 'power_slash',
    name: '渾身斬り',
    kind: 'skill',
    spriteId: 'item_power_slash',
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
    spriteId: 'item_flame_burst',
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
    spriteId: 'item_flame_wave',
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
    spriteId: 'item_frost_lance',
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
    spriteId: 'item_armor_crush',
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
    spriteId: 'item_venom_strike',
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
    spriteId: 'item_aegis_stance',
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
    spriteId: 'item_war_cry',
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
    spriteId: 'item_purifying_light',
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
    spriteId: 'item_chrono_flip',
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
  briar_lash: {
    id: 'briar_lash',
    name: '茨の鞭打ち',
    kind: 'skill',
    spriteId: 'item_briar_lash',
    category: 'attack',
    maxChargesPerBattle: 3,
    damageMultiplier: 1.1,
    applyStatus: {
      target: 'enemy',
      statusId: 'poison',
      value: 8,
      duration: 3,
    },
    salvageGold: 20,
    description: '棘のある蔦で打ち据え、1.1倍ダメージ＋敵に猛毒(8/3T)を付与（1戦3回）。',
  },
  oak_splitter: {
    id: 'oak_splitter',
    name: '樫割りの一閃',
    kind: 'skill',
    spriteId: 'item_oak_splitter',
    category: 'attack',
    maxChargesPerBattle: 1,
    damageMultiplier: 1.7,
    salvageGold: 20,
    description: '大木をも断つ渾身の一撃。1.7倍のダメージを与える（1戦1回）。',
  },
  vine_snare: {
    id: 'vine_snare',
    name: '絡み蔦の斬撃',
    kind: 'skill',
    spriteId: 'item_vine_snare',
    category: 'attack',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.2,
    applyStatus: {
      target: 'enemy',
      statusId: 'def_debuff',
      value: 25,
      duration: 2,
    },
    salvageGold: 20,
    description: '足元を蔦で絡め取り、1.2倍ダメージ＋敵の防御力を25%低下(2T)（1戦2回）。',
  },
  forest_dew: {
    id: 'forest_dew',
    name: '森露の癒やし',
    kind: 'skill',
    spriteId: 'item_forest_dew',
    category: 'heal',
    maxChargesPerBattle: 2,
    healPercent: 25,
    salvageGold: 20,
    description: '木漏れ日の露を纏い、最大HPの25%を回復する（1戦2回）。',
  },
  moss_ward: {
    id: 'moss_ward',
    name: '苔の守り',
    kind: 'skill',
    spriteId: 'item_moss_ward',
    category: 'buff',
    maxChargesPerBattle: 2,
    applyStatus: {
      target: 'self',
      statusId: 'def_buff',
      value: 30,
      duration: 3,
    },
    salvageGold: 20,
    description: '森の苔が身を包み、3ターンの間自身の防御力を30%上昇させる（1戦2回）。',
  },
  pollen_haze: {
    id: 'pollen_haze',
    name: '胞子の霞',
    kind: 'skill',
    spriteId: 'item_pollen_haze',
    category: 'debuff',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.05,
    applyStatus: {
      target: 'enemy',
      statusId: 'atk_debuff',
      value: 25,
      duration: 3,
    },
    salvageGold: 20,
    description: '痺れ胞子を散らし、1.05倍ダメージ＋敵の攻撃力を25%低下(3T)（1戦2回）。',
  },
  sap_guard: {
    id: 'sap_guard',
    name: '樹液の護り',
    kind: 'skill',
    spriteId: 'item_sap_guard',
    category: 'heal',
    maxChargesPerBattle: 2,
    healPercent: 18,
    applyStatus: {
      target: 'self',
      statusId: 'shield',
      value: 18,
      duration: 2,
    },
    salvageGold: 20,
    description: '最大HPの18%を回復し、自身に18ダメージを吸収する障壁(2T)を展開（1戦2回）。',
  },
  wisp_flame_strike: {
    id: 'wisp_flame_strike',
    name: '鬼火の斬撃',
    kind: 'skill',
    spriteId: 'item_wisp_flame_strike',
    category: 'attack',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.15,
    applyStatus: {
      target: 'enemy',
      statusId: 'burn',
      value: 8,
      duration: 2,
    },
    salvageGold: 22,
    description: '霧に揺らめく鬼火を刃に纏わせ、1.15倍ダメージ＋敵に火傷(最大HP8%/2T)を付与（1戦2回）。',
  },
  ancient_trunk_cleave: {
    id: 'ancient_trunk_cleave',
    name: '古樹断ちの一撃',
    kind: 'skill',
    spriteId: 'item_ancient_trunk_cleave',
    category: 'attack',
    maxChargesPerBattle: 1,
    damageMultiplier: 1.75,
    salvageGold: 24,
    description: '古樹の大幹をも両断する必殺の一閃。1.75倍のダメージを与える（1戦1回）。',
  },
  mist_step_strike: {
    id: 'mist_step_strike',
    name: '霧歩きの連撃',
    kind: 'skill',
    spriteId: 'item_mist_step_strike',
    category: 'attack',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.25,
    applyStatus: {
      target: 'self',
      statusId: 'atk_buff',
      value: 20,
      duration: 2,
    },
    salvageGold: 22,
    description: '霧に紛れて踏み込み、1.25倍ダメージ＋自身に攻撃強化(+20%/2T)を付与（1戦2回）。',
  },
  mist_spring_prayer: {
    id: 'mist_spring_prayer',
    name: '霧泉の癒やし',
    kind: 'skill',
    spriteId: 'item_mist_spring_prayer',
    category: 'heal',
    maxChargesPerBattle: 2,
    healPercent: 28,
    cleanse: true,
    salvageGold: 24,
    description: '霧の湧水で傷を洗い流し、最大HPの28%を回復＋すべてのデバフを解除（1戦2回）。',
  },
  ancient_roar: {
    id: 'ancient_roar',
    name: '古森の雄叫び',
    kind: 'skill',
    spriteId: 'item_ancient_roar',
    category: 'buff',
    maxChargesPerBattle: 2,
    applyStatus: {
      target: 'self',
      statusId: 'atk_buff',
      value: 30,
      duration: 3,
    },
    salvageGold: 22,
    description: '深森の精気を呼び覚まし、3ターンの間自身の攻撃力を30%上昇させる（1戦2回）。',
  },
  mist_rend: {
    id: 'mist_rend',
    name: '霧裂きの破甲',
    kind: 'skill',
    spriteId: 'item_mist_rend',
    category: 'debuff',
    maxChargesPerBattle: 2,
    damageMultiplier: 1.15,
    applyStatus: {
      target: 'enemy',
      statusId: 'def_debuff',
      value: 25,
      duration: 3,
    },
    salvageGold: 22,
    description: '霧を切り裂く一撃で1.15倍ダメージ＋敵の防御力を25%低下(3T)（1戦2回）。',
  },
  canopy_aegis: {
    id: 'canopy_aegis',
    name: '樹冠の霧障壁',
    kind: 'skill',
    spriteId: 'item_canopy_aegis',
    category: 'buff',
    maxChargesPerBattle: 2,
    applyStatus: {
      target: 'self',
      statusId: 'shield',
      value: 24,
      duration: 3,
    },
    salvageGold: 22,
    description: '深い霧と枝葉で身を覆い、自身に24ダメージを吸収する障壁(3T)を展開（1戦2回）。',
  },
};

export const CONSUMABLE_CATALOG: Record<string, ConsumableItem> = {
  crimson_vial: {
    id: 'crimson_vial',
    name: '紅玉の霊薬',
    kind: 'consumable',
    spriteId: 'item_crimson_vial',
    maxCharges: 2,
    healPercent: 50,
    cleanse: true,
    description: 'HPを50%回復し状態異常を浄化する貴重な秘薬（最大2チャージ・自動回復なし）。',
  },
  ambrosia_flask: {
    id: 'ambrosia_flask',
    name: '神樹の雫',
    kind: 'consumable',
    spriteId: 'item_ambrosia_flask',
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
  sylvan_tonic: {
    id: 'sylvan_tonic',
    name: '森精の秘薬',
    kind: 'consumable',
    spriteId: 'item_sylvan_tonic',
    maxCharges: 3,
    healPercent: 35,
    applyStatus: {
      target: 'self',
      statusId: 'atk_buff',
      value: 20,
      duration: 3,
    },
    description: 'HPを35%回復し、3ターンの間攻撃力+20%を得る秘薬（最大3チャージ）。',
  },
  moss_elixir: {
    id: 'moss_elixir',
    name: '苔露の霊薬',
    kind: 'consumable',
    spriteId: 'item_moss_elixir',
    maxCharges: 2,
    healPercent: 40,
    cleanse: true,
    applyStatus: {
      target: 'self',
      statusId: 'def_buff',
      value: 20,
      duration: 3,
    },
    description: 'HPを40%回復し状態異常を浄化、さらに防御力+20%(3T)を得る秘薬（最大2チャージ）。',
  },
  mist_herb_draught: {
    id: 'mist_herb_draught',
    name: '霧草の煎じ薬',
    kind: 'consumable',
    spriteId: 'item_mist_herb_draught',
    maxCharges: 3,
    healPercent: 30,
    cleanse: true,
    applyStatus: {
      target: 'self',
      statusId: 'shield',
      value: 25,
      duration: 3,
    },
    description: 'HPを30%回復し状態異常を浄化、さらに障壁(25/3T)を得る秘薬（最大3チャージ）。',
  },
  ancient_sap_vial: {
    id: 'ancient_sap_vial',
    name: '古樹液の小瓶',
    kind: 'consumable',
    spriteId: 'item_ancient_sap_vial',
    maxCharges: 2,
    healPercent: 55,
    applyStatus: {
      target: 'self',
      statusId: 'def_buff',
      value: 15,
      duration: 3,
    },
    description: '濃密な古樹の樹液。HPを55%回復し、3ターンの間防御力+15%を得る（最大2チャージ）。',
  },
};

export const RELIC_CATALOG: Record<string, RelicItem> = {
  vampiric_fang_relic: {
    id: 'vampiric_fang_relic',
    name: '吸血の牙',
    kind: 'relic',
    spriteId: 'item_vampiric_fang_relic',
    effectId: 'vampiric_fang',
    salvageGold: 40,
    description: '通常攻撃を行うたび、最大HPの4%を回復する。',
  },
  guardian_crest_relic: {
    id: 'guardian_crest_relic',
    name: '守護者の紋章',
    kind: 'relic',
    spriteId: 'item_guardian_crest_relic',
    effectId: 'guardian_crest',
    salvageGold: 40,
    description: '各バトルの開始時、最大HPの15%分の障壁を自動的に展開する。',
  },
  berserker_idol_relic: {
    id: 'berserker_idol_relic',
    name: '狂戦士の彫像',
    kind: 'relic',
    spriteId: 'item_berserker_idol_relic',
    effectId: 'berserker_idol',
    salvageGold: 45,
    description: '各バトルの開始時、3ターンの間攻撃力+25%を得る。',
  },
  venom_gland_relic: {
    id: 'venom_gland_relic',
    name: '猛毒腺の護符',
    kind: 'relic',
    spriteId: 'item_venom_gland_relic',
    effectId: 'venom_gland',
    salvageGold: 45,
    description: 'スキルを使用するたび、敵に猛毒(8)を追加付与する。',
  },
  golden_compass_relic: {
    id: 'golden_compass_relic',
    name: '黄金の羅針盤',
    kind: 'relic',
    spriteId: 'item_golden_compass_relic',
    effectId: 'golden_compass',
    salvageGold: 35,
    description: 'バトル勝利時に獲得するゴールドが +15 増加する。',
  },
  bookmark_charm_relic: {
    id: 'bookmark_charm_relic',
    name: '栞の護符',
    kind: 'relic',
    spriteId: 'item_bookmark_charm_relic',
    effectId: 'bookmark_charm',
    salvageGold: 40,
    description: '各バトルの1ターン目の攻撃時、+15%相当の追加ダメージを与える。',
  },
  forest_dewdrop_relic: {
    id: 'forest_dewdrop_relic',
    name: '森露の護符',
    kind: 'relic',
    spriteId: 'item_forest_dewdrop_relic',
    effectId: 'forest_dewdrop',
    salvageGold: 35,
    description: '各バトルの開始時、3ターンの間防御力+25%を得る。',
  },
  briar_thorn_relic: {
    id: 'briar_thorn_relic',
    name: '茨棘の腕輪',
    kind: 'relic',
    spriteId: 'item_briar_thorn_relic',
    effectId: 'briar_thorn',
    salvageGold: 35,
    description: '通常攻撃を行うたび、攻撃力の12%相当の追加ダメージを与える。',
  },
  mist_veil_bell_relic: {
    id: 'mist_veil_bell_relic',
    name: '霧隠れの鈴',
    kind: 'relic',
    spriteId: 'item_mist_veil_bell_relic',
    effectId: 'mist_veil_bell',
    salvageGold: 40,
    description: '各バトルの開始時、敵の攻撃力を3ターンの間15%低下させる。',
  },
  elder_sap_seal_relic: {
    id: 'elder_sap_seal_relic',
    name: '古樹液の印章',
    kind: 'relic',
    spriteId: 'item_elder_sap_seal_relic',
    effectId: 'elder_sap_seal',
    salvageGold: 40,
    description: 'スキルを使用するたび、敵の防御力を2ターンの間15%低下させる。',
  },
};


