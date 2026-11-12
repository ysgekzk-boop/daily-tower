import { MATRIX_REGISTRY, PixelGrid } from './matrixRegistry';

export interface PaletteConfig {
  id: string;
  name: string;
  colors: [string, string, string, string]; // 0 = transparent, 1 = primary/outline, 2 = fill, 3 = highlight/eyes
}

export const PALETTE_REGISTRY: Record<string, PaletteConfig> = {
  steel_knight: {
    id: 'steel_knight',
    name: '白銀の騎士',
    colors: ['transparent', '#475569', '#cbd5e1', '#f59e0b'],
  },
  crimson_knight: {
    id: 'crimson_knight',
    name: '紅蓮の覇者',
    colors: ['transparent', '#7f1d1d', '#ef4444', '#fde047'],
  },
  astral_mage: {
    id: 'astral_mage',
    name: '星詠みの魔導士',
    colors: ['transparent', '#312e81', '#818cf8', '#38bdf8'],
  },
  neon_cyber: {
    id: 'neon_cyber',
    name: 'ネオン・サイバー',
    colors: ['transparent', '#0f172a', '#22d3ee', '#f43f5e'],
  },
  emerald_slime: {
    id: 'emerald_slime',
    name: '翠緑',
    colors: ['transparent', '#065f46', '#10b981', '#fef08a'],
  },
  toxic_purple: {
    id: 'toxic_purple',
    name: '猛毒紫',
    colors: ['transparent', '#4c1d95', '#a855f7', '#4ade80'],
  },
  forest_goblin: {
    id: 'forest_goblin',
    name: '深森',
    colors: ['transparent', '#14532d', '#4ade80', '#ef4444'],
  },
  shadow_wolf: {
    id: 'shadow_wolf',
    name: '黒影',
    colors: ['transparent', '#1e293b', '#64748b', '#f43f5e'],
  },
  ancient_bark: {
    id: 'ancient_bark',
    name: '古樹',
    colors: ['transparent', '#451a03', '#15803d', '#fbbf24'],
  },
  molten_iron: {
    id: 'molten_iron',
    name: '熔鉄',
    colors: ['transparent', '#450a0a', '#ea580c', '#fef08a'],
  },
  frost_blue: {
    id: 'frost_blue',
    name: '氷晶',
    colors: ['transparent', '#1e3a8a', '#60a5fa', '#e0f2fe'],
  },
  golden_shrine: {
    id: 'golden_shrine',
    name: '黄金祭壇',
    colors: ['transparent', '#78350f', '#fbbf24', '#fef9c3'],
  },
  arcane_tome: {
    id: 'arcane_tome',
    name: '魔導書',
    colors: ['transparent', '#3b2a63', '#7a4fa3', '#e6d7a8'],
  },
  ink_phantom: {
    id: 'ink_phantom',
    name: '漆黒の亡霊',
    colors: ['transparent', '#14141f', '#3d3d5c', '#a8e6e0'],
  },
  brass_astrolabe: {
    id: 'brass_astrolabe',
    name: '真鍮天球',
    colors: ['transparent', '#4a3512', '#a87e2f', '#f2d98c'],
  },
  item_rusty_shortsword: {
    id: 'item_rusty_shortsword',
    name: '旅立ちの短剣',
    colors: ['transparent', '#3f3f46', '#a1a1aa', '#b45309'],
  },
  item_verdant_blade: {
    id: 'item_verdant_blade',
    name: '翠樹の長剣',
    colors: ['transparent', '#14532d', '#4ade80', '#fde047'],
  },
  item_thorn_halberd: {
    id: 'item_thorn_halberd',
    name: '茨のハルバード',
    colors: ['transparent', '#292524', '#d6d3d1', '#65a30d'],
  },
  item_ember_greatsword: {
    id: 'item_ember_greatsword',
    name: '熾火の大剣',
    colors: ['transparent', '#450a0a', '#ea580c', '#fef08a'],
  },
  item_obsidian_reaver: {
    id: 'item_obsidian_reaver',
    name: '黒曜の断罪刃',
    colors: ['transparent', '#020617', '#475569', '#a855f7'],
  },
  item_stargazer_silver_sword: {
    id: 'item_stargazer_silver_sword',
    name: '星見の銀剣',
    colors: ['transparent', '#334155', '#e2e8f0', '#f59e0b'],
  },
  item_leather_tunic: {
    id: 'item_leather_tunic',
    name: '冒険者の革鎧',
    colors: ['transparent', '#451a03', '#92400e', '#fbbf24'],
  },
  item_bark_cuirass: {
    id: 'item_bark_cuirass',
    name: '古樹の胸甲',
    colors: ['transparent', '#2a1a08', '#78350f', '#65a30d'],
  },
  item_ironwood_plate: {
    id: 'item_ironwood_plate',
    name: '鉄木の重装鎧',
    colors: ['transparent', '#1c1917', '#78716c', '#b45309'],
  },
  item_cinder_mail: {
    id: 'item_cinder_mail',
    name: '灰燼の鎖帷子',
    colors: ['transparent', '#1e293b', '#64748b', '#f97316'],
  },
  item_librarian_robe: {
    id: 'item_librarian_robe',
    name: '司書の法衣',
    colors: ['transparent', '#1e1b4b', '#5b21b6', '#f59e0b'],
  },
  item_power_slash: {
    id: 'item_power_slash',
    name: '渾身斬り',
    colors: ['transparent', '#334155', '#e2e8f0', '#f59e0b'],
  },
  item_flame_burst: {
    id: 'item_flame_burst',
    name: '紅蓮撃',
    colors: ['transparent', '#7f1d1d', '#ef4444', '#fde047'],
  },
  item_flame_wave: {
    id: 'item_flame_wave',
    name: '炎の波動',
    colors: ['transparent', '#7f1d1d', '#f97316', '#fef08a'],
  },
  item_frost_lance: {
    id: 'item_frost_lance',
    name: '氷結の槍',
    colors: ['transparent', '#1e3a8a', '#60a5fa', '#e0f2fe'],
  },
  item_armor_crush: {
    id: 'item_armor_crush',
    name: '破甲撃',
    colors: ['transparent', '#44403c', '#a8a29e', '#f59e0b'],
  },
  item_venom_strike: {
    id: 'item_venom_strike',
    name: '蛇毒の牙',
    colors: ['transparent', '#4c1d95', '#e7e5e4', '#4ade80'],
  },
  item_aegis_stance: {
    id: 'item_aegis_stance',
    name: 'イージス障壁',
    colors: ['transparent', '#1e3a8a', '#93c5fd', '#f8fafc'],
  },
  item_war_cry: {
    id: 'item_war_cry',
    name: '戦いの咆哮',
    colors: ['transparent', '#7f1d1d', '#f59e0b', '#fde047'],
  },
  item_purifying_light: {
    id: 'item_purifying_light',
    name: '浄化の祈り',
    colors: ['transparent', '#92400e', '#fbbf24', '#fef9c3'],
  },
  item_chrono_flip: {
    id: 'item_chrono_flip',
    name: 'ページめくり',
    colors: ['transparent', '#3b2a63', '#e6d7a8', '#7a4fa3'],
  },
  item_crimson_vial: {
    id: 'item_crimson_vial',
    name: '紅玉の霊薬',
    colors: ['transparent', '#450a0a', '#ef4444', '#fecdd3'],
  },
  item_ambrosia_flask: {
    id: 'item_ambrosia_flask',
    name: '神樹の雫',
    colors: ['transparent', '#14532d', '#4ade80', '#fef9c3'],
  },
  item_vampiric_fang_relic: {
    id: 'item_vampiric_fang_relic',
    name: '吸血の牙',
    colors: ['transparent', '#7f1d1d', '#f8fafc', '#ef4444'],
  },
  item_guardian_crest_relic: {
    id: 'item_guardian_crest_relic',
    name: '守護者の紋章',
    colors: ['transparent', '#1e3a8a', '#fbbf24', '#38bdf8'],
  },
  item_berserker_idol_relic: {
    id: 'item_berserker_idol_relic',
    name: '狂戦士の彫像',
    colors: ['transparent', '#450a0a', '#b91c1c', '#fde047'],
  },
  item_venom_gland_relic: {
    id: 'item_venom_gland_relic',
    name: '猛毒腺の護符',
    colors: ['transparent', '#3b0764', '#a855f7', '#4ade80'],
  },
  item_golden_compass_relic: {
    id: 'item_golden_compass_relic',
    name: '黄金の羅針盤',
    colors: ['transparent', '#78350f', '#fbbf24', '#ef4444'],
  },
  item_bookmark_charm_relic: {
    id: 'item_bookmark_charm_relic',
    name: '栞の護符',
    colors: ['transparent', '#312e81', '#818cf8', '#f59e0b'],
  },
  forest_bat: {
    id: 'forest_bat',
    name: 'フォレスト・バット',
    colors: ['transparent', '#1f2937', '#4b5563', '#f43f5e'],
  },
  spore_fungus: {
    id: 'spore_fungus',
    name: 'スポア・マッシュ',
    colors: ['transparent', '#2e1065', '#9333ea', '#a7f3d0'],
  },
  amber_beetle: {
    id: 'amber_beetle',
    name: 'アンバー・ビートル',
    colors: ['transparent', '#451a03', '#d97706', '#fef08a'],
  },
  woodland_viper: {
    id: 'woodland_viper',
    name: 'ウッド・バイパー',
    colors: ['transparent', '#064e3b', '#059669', '#fbbf24'],
  },
  forest_dryad: {
    id: 'forest_dryad',
    name: 'フォレスト・フェアリー',
    colors: ['transparent', '#14532d', '#22c55e', '#ecfdf5'],
  },
  bramble_boar: {
    id: 'bramble_boar',
    name: 'ブランブル・ボア',
    colors: ['transparent', '#3f2c1d', '#854d0e', '#fde047'],
  },
  thorn_queen_vespa: {
    id: 'thorn_queen_vespa',
    name: '棘森の女王・ウェスパ',
    colors: ['transparent', '#422006', '#ca8a04', '#ef4444'],
  },
  ancient_ursus: {
    id: 'ancient_ursus',
    name: '古森の巨熊・アーサ',
    colors: ['transparent', '#1c1917', '#78350f', '#f59e0b'],
  },
  moss_owl: {
    id: 'moss_owl',
    name: 'モス・オウル',
    colors: ['transparent', '#1c2826', '#4d7c0f', '#facc15'],
  },
  canopy_spider: {
    id: 'canopy_spider',
    name: 'キャノピー・スパイダー',
    colors: ['transparent', '#18181b', '#047857', '#ef4444'],
  },
  thorn_trapper: {
    id: 'thorn_trapper',
    name: 'ソーン・トラッパー',
    colors: ['transparent', '#14532d', '#15803d', '#f43f5e'],
  },
  moss_crab: {
    id: 'moss_crab',
    name: 'モス・クラブ',
    colors: ['transparent', '#1e293b', '#0f766e', '#38bdf8'],
  },
  ivy_creeper: {
    id: 'ivy_creeper',
    name: 'アイビー・クリーパー',
    colors: ['transparent', '#052e16', '#16a34a', '#86efac'],
  },
  glen_elk: {
    id: 'glen_elk',
    name: 'グレン・エルク',
    colors: ['transparent', '#271c19', '#7c2d12', '#fde047'],
  },
  bark_chameleon: {
    id: 'bark_chameleon',
    name: 'バーク・カメレオン',
    colors: ['transparent', '#1c1917', '#57534e', '#a8a29e'],
  },
  amber_wisp: {
    id: 'amber_wisp',
    name: 'アンバー・ウィスプ',
    colors: ['transparent', '#451a03', '#d97706', '#fbbf24'],
  },
  shadow_panther: {
    id: 'shadow_panther',
    name: '漆黒の森豹・パンテーラ',
    colors: ['transparent', '#0f172a', '#334155', '#fbbf24'],
  },
  ironwood_colossus: {
    id: 'ironwood_colossus',
    name: '鉄樹の守護巨兵・ロブール',
    colors: ['transparent', '#142017', '#2e4c34', '#4ade80'],
  },
  needle_porcupine: {
    id: 'needle_porcupine',
    name: 'トゲ・ポーキュパイン',
    colors: ['transparent', '#3f2b1d', '#926c48', '#f59e0b'],
  },
  mist_moth: {
    id: 'mist_moth',
    name: 'ミスト・モス',
    colors: ['transparent', '#1e1b4b', '#6366f1', '#a5f3fc'],
  },
  swamp_croc: {
    id: 'swamp_croc',
    name: 'スワンプ・クロック',
    colors: ['transparent', '#143823', '#2d6a4f', '#d8f3dc'],
  },
  thorn_mantis: {
    id: 'thorn_mantis',
    name: 'ソーン・マンティス',
    colors: ['transparent', '#14421b', '#38a169', '#fef08a'],
  },
  bloom_mandragora: {
    id: 'bloom_mandragora',
    name: 'ブルーム・マンドラゴラ',
    colors: ['transparent', '#3b0764', '#9333ea', '#f43f5e'],
  },
  moss_tortoise: {
    id: 'moss_tortoise',
    name: 'モス・トータス',
    colors: ['transparent', '#1b382b', '#407958', '#a7f3d0'],
  },
  verdant_falcon: {
    id: 'verdant_falcon',
    name: 'ヴァーダント・ファルコン',
    colors: ['transparent', '#064e3b', '#059669', '#fde047'],
  },
  spirit_fox: {
    id: 'spirit_fox',
    name: 'スピリット・フォックス',
    colors: ['transparent', '#1e293b', '#cbd5e1', '#38bdf8'],
  },
  verdant_gryphon: {
    id: 'verdant_gryphon',
    name: '翠翼の守護獣・グリフォン',
    colors: ['transparent', '#132e1b', '#256338', '#f59e0b'],
  },
  bog_toad: {
    id: 'bog_toad',
    name: 'ボグ・トード',
    colors: ['transparent', '#143823', '#2d6a4f', '#a7f3d0'],
  },
  fungal_strider: {
    id: 'fungal_strider',
    name: 'ファンガル・ストライダー',
    colors: ['transparent', '#3b1d11', '#854d0e', '#fde047'],
  },
  lichen_ape: {
    id: 'lichen_ape',
    name: 'ライケン・エイプ',
    colors: ['transparent', '#1f2937', '#4b5563', '#fbbf24'],
  },
  thorn_centipede: {
    id: 'thorn_centipede',
    name: 'ソーン・センティピード',
    colors: ['transparent', '#4a0404', '#991b1b', '#f59e0b'],
  },
  ancient_scarab: {
    id: 'ancient_scarab',
    name: 'エンシェント・スカラベ',
    colors: ['transparent', '#14532d', '#16a34a', '#facc15'],
  },
  dusk_crow: {
    id: 'dusk_crow',
    name: 'ダスク・クロウ',
    colors: ['transparent', '#18181b', '#3f3f46', '#c084fc'],
  },
  vine_stalker: {
    id: 'vine_stalker',
    name: 'ヴァイン・ストーカー',
    colors: ['transparent', '#052e16', '#15803d', '#86efac'],
  },
  moss_gargoyle: {
    id: 'moss_gargoyle',
    name: 'モス・ガーゴイル',
    colors: ['transparent', '#1c1917', '#57534e', '#4ade80'],
  },
  sylvan_hydra: {
    id: 'sylvan_hydra',
    name: 'シルヴァン・ヒドラ',
    colors: ['transparent', '#064e3b', '#047857', '#34d399'],
  },
  verdant_basilisk: {
    id: 'verdant_basilisk',
    name: 'ヴァーダント・バジリスク',
    colors: ['transparent', '#132a13', '#31572c', '#facc15'],
  },
};

export interface SpriteDefinition {
  id: string;
  matrixId: keyof typeof MATRIX_REGISTRY;
  defaultPalette: keyof typeof PALETTE_REGISTRY;
}

export const SPRITE_REGISTRY: Record<string, SpriteDefinition> = {
  hero_knight: { id: 'hero_knight', matrixId: 'hero_knight', defaultPalette: 'steel_knight' },
  hero_mage: { id: 'hero_mage', matrixId: 'hero_mage', defaultPalette: 'astral_mage' },
  hero_cyber: { id: 'hero_cyber', matrixId: 'hero_cyber', defaultPalette: 'neon_cyber' },
  slime: { id: 'slime', matrixId: 'slime', defaultPalette: 'emerald_slime' },
  goblin: { id: 'goblin', matrixId: 'goblin', defaultPalette: 'forest_goblin' },
  wolf: { id: 'wolf', matrixId: 'wolf', defaultPalette: 'shadow_wolf' },
  treant: { id: 'treant', matrixId: 'treant', defaultPalette: 'ancient_bark' },
  colossus: { id: 'colossus', matrixId: 'colossus', defaultPalette: 'molten_iron' },
  shrine: { id: 'shrine', matrixId: 'shrine', defaultPalette: 'golden_shrine' },
  tome: { id: 'tome', matrixId: 'tome', defaultPalette: 'arcane_tome' },
  phantom: { id: 'phantom', matrixId: 'phantom', defaultPalette: 'ink_phantom' },
  astrolabe: { id: 'astrolabe', matrixId: 'astrolabe', defaultPalette: 'brass_astrolabe' },
  item_rusty_shortsword: { id: 'item_rusty_shortsword', matrixId: 'item_rusty_shortsword', defaultPalette: 'item_rusty_shortsword' },
  item_verdant_blade: { id: 'item_verdant_blade', matrixId: 'item_verdant_blade', defaultPalette: 'item_verdant_blade' },
  item_thorn_halberd: { id: 'item_thorn_halberd', matrixId: 'item_thorn_halberd', defaultPalette: 'item_thorn_halberd' },
  item_ember_greatsword: { id: 'item_ember_greatsword', matrixId: 'item_ember_greatsword', defaultPalette: 'item_ember_greatsword' },
  item_obsidian_reaver: { id: 'item_obsidian_reaver', matrixId: 'item_obsidian_reaver', defaultPalette: 'item_obsidian_reaver' },
  item_stargazer_silver_sword: { id: 'item_stargazer_silver_sword', matrixId: 'item_stargazer_silver_sword', defaultPalette: 'item_stargazer_silver_sword' },
  item_leather_tunic: { id: 'item_leather_tunic', matrixId: 'item_leather_tunic', defaultPalette: 'item_leather_tunic' },
  item_bark_cuirass: { id: 'item_bark_cuirass', matrixId: 'item_bark_cuirass', defaultPalette: 'item_bark_cuirass' },
  item_ironwood_plate: { id: 'item_ironwood_plate', matrixId: 'item_ironwood_plate', defaultPalette: 'item_ironwood_plate' },
  item_cinder_mail: { id: 'item_cinder_mail', matrixId: 'item_cinder_mail', defaultPalette: 'item_cinder_mail' },
  item_librarian_robe: { id: 'item_librarian_robe', matrixId: 'item_librarian_robe', defaultPalette: 'item_librarian_robe' },
  item_power_slash: { id: 'item_power_slash', matrixId: 'item_power_slash', defaultPalette: 'item_power_slash' },
  item_flame_burst: { id: 'item_flame_burst', matrixId: 'item_flame_burst', defaultPalette: 'item_flame_burst' },
  item_flame_wave: { id: 'item_flame_wave', matrixId: 'item_flame_wave', defaultPalette: 'item_flame_wave' },
  item_frost_lance: { id: 'item_frost_lance', matrixId: 'item_frost_lance', defaultPalette: 'item_frost_lance' },
  item_armor_crush: { id: 'item_armor_crush', matrixId: 'item_armor_crush', defaultPalette: 'item_armor_crush' },
  item_venom_strike: { id: 'item_venom_strike', matrixId: 'item_venom_strike', defaultPalette: 'item_venom_strike' },
  item_aegis_stance: { id: 'item_aegis_stance', matrixId: 'item_aegis_stance', defaultPalette: 'item_aegis_stance' },
  item_war_cry: { id: 'item_war_cry', matrixId: 'item_war_cry', defaultPalette: 'item_war_cry' },
  item_purifying_light: { id: 'item_purifying_light', matrixId: 'item_purifying_light', defaultPalette: 'item_purifying_light' },
  item_chrono_flip: { id: 'item_chrono_flip', matrixId: 'item_chrono_flip', defaultPalette: 'item_chrono_flip' },
  item_crimson_vial: { id: 'item_crimson_vial', matrixId: 'item_crimson_vial', defaultPalette: 'item_crimson_vial' },
  item_ambrosia_flask: { id: 'item_ambrosia_flask', matrixId: 'item_ambrosia_flask', defaultPalette: 'item_ambrosia_flask' },
  item_vampiric_fang_relic: { id: 'item_vampiric_fang_relic', matrixId: 'item_vampiric_fang_relic', defaultPalette: 'item_vampiric_fang_relic' },
  item_guardian_crest_relic: { id: 'item_guardian_crest_relic', matrixId: 'item_guardian_crest_relic', defaultPalette: 'item_guardian_crest_relic' },
  item_berserker_idol_relic: { id: 'item_berserker_idol_relic', matrixId: 'item_berserker_idol_relic', defaultPalette: 'item_berserker_idol_relic' },
  item_venom_gland_relic: { id: 'item_venom_gland_relic', matrixId: 'item_venom_gland_relic', defaultPalette: 'item_venom_gland_relic' },
  item_golden_compass_relic: { id: 'item_golden_compass_relic', matrixId: 'item_golden_compass_relic', defaultPalette: 'item_golden_compass_relic' },
  item_bookmark_charm_relic: { id: 'item_bookmark_charm_relic', matrixId: 'item_bookmark_charm_relic', defaultPalette: 'item_bookmark_charm_relic' },
  forest_bat: { id: 'forest_bat', matrixId: 'forest_bat', defaultPalette: 'forest_bat' },
  spore_fungus: { id: 'spore_fungus', matrixId: 'spore_fungus', defaultPalette: 'spore_fungus' },
  amber_beetle: { id: 'amber_beetle', matrixId: 'amber_beetle', defaultPalette: 'amber_beetle' },
  woodland_viper: { id: 'woodland_viper', matrixId: 'woodland_viper', defaultPalette: 'woodland_viper' },
  forest_dryad: { id: 'forest_dryad', matrixId: 'forest_dryad', defaultPalette: 'forest_dryad' },
  bramble_boar: { id: 'bramble_boar', matrixId: 'bramble_boar', defaultPalette: 'bramble_boar' },
  thorn_queen_vespa: { id: 'thorn_queen_vespa', matrixId: 'thorn_queen_vespa', defaultPalette: 'thorn_queen_vespa' },
  ancient_ursus: { id: 'ancient_ursus', matrixId: 'ancient_ursus', defaultPalette: 'ancient_ursus' },
  moss_owl: { id: 'moss_owl', matrixId: 'moss_owl', defaultPalette: 'moss_owl' },
  canopy_spider: { id: 'canopy_spider', matrixId: 'canopy_spider', defaultPalette: 'canopy_spider' },
  thorn_trapper: { id: 'thorn_trapper', matrixId: 'thorn_trapper', defaultPalette: 'thorn_trapper' },
  moss_crab: { id: 'moss_crab', matrixId: 'moss_crab', defaultPalette: 'moss_crab' },
  ivy_creeper: { id: 'ivy_creeper', matrixId: 'ivy_creeper', defaultPalette: 'ivy_creeper' },
  glen_elk: { id: 'glen_elk', matrixId: 'glen_elk', defaultPalette: 'glen_elk' },
  bark_chameleon: { id: 'bark_chameleon', matrixId: 'bark_chameleon', defaultPalette: 'bark_chameleon' },
  amber_wisp: { id: 'amber_wisp', matrixId: 'amber_wisp', defaultPalette: 'amber_wisp' },
  shadow_panther: { id: 'shadow_panther', matrixId: 'shadow_panther', defaultPalette: 'shadow_panther' },
  ironwood_colossus: { id: 'ironwood_colossus', matrixId: 'ironwood_colossus', defaultPalette: 'ironwood_colossus' },
  needle_porcupine: { id: 'needle_porcupine', matrixId: 'needle_porcupine', defaultPalette: 'needle_porcupine' },
  mist_moth: { id: 'mist_moth', matrixId: 'mist_moth', defaultPalette: 'mist_moth' },
  swamp_croc: { id: 'swamp_croc', matrixId: 'swamp_croc', defaultPalette: 'swamp_croc' },
  thorn_mantis: { id: 'thorn_mantis', matrixId: 'thorn_mantis', defaultPalette: 'thorn_mantis' },
  bloom_mandragora: { id: 'bloom_mandragora', matrixId: 'bloom_mandragora', defaultPalette: 'bloom_mandragora' },
  moss_tortoise: { id: 'moss_tortoise', matrixId: 'moss_tortoise', defaultPalette: 'moss_tortoise' },
  verdant_falcon: { id: 'verdant_falcon', matrixId: 'verdant_falcon', defaultPalette: 'verdant_falcon' },
  spirit_fox: { id: 'spirit_fox', matrixId: 'spirit_fox', defaultPalette: 'spirit_fox' },
  verdant_gryphon: { id: 'verdant_gryphon', matrixId: 'verdant_gryphon', defaultPalette: 'verdant_gryphon' },
  bog_toad: { id: 'bog_toad', matrixId: 'bog_toad', defaultPalette: 'bog_toad' },
  fungal_strider: { id: 'fungal_strider', matrixId: 'fungal_strider', defaultPalette: 'fungal_strider' },
  lichen_ape: { id: 'lichen_ape', matrixId: 'lichen_ape', defaultPalette: 'lichen_ape' },
  thorn_centipede: { id: 'thorn_centipede', matrixId: 'thorn_centipede', defaultPalette: 'thorn_centipede' },
  ancient_scarab: { id: 'ancient_scarab', matrixId: 'ancient_scarab', defaultPalette: 'ancient_scarab' },
  dusk_crow: { id: 'dusk_crow', matrixId: 'dusk_crow', defaultPalette: 'dusk_crow' },
  vine_stalker: { id: 'vine_stalker', matrixId: 'vine_stalker', defaultPalette: 'vine_stalker' },
  moss_gargoyle: { id: 'moss_gargoyle', matrixId: 'moss_gargoyle', defaultPalette: 'moss_gargoyle' },
  sylvan_hydra: { id: 'sylvan_hydra', matrixId: 'sylvan_hydra', defaultPalette: 'sylvan_hydra' },
  verdant_basilisk: { id: 'verdant_basilisk', matrixId: 'verdant_basilisk', defaultPalette: 'verdant_basilisk' },
};

export function resolveSpriteData(spriteId: string, paletteOverride?: string): {
  grid: PixelGrid;
  palette: PaletteConfig;
} {
  const def = SPRITE_REGISTRY[spriteId] ?? SPRITE_REGISTRY.slime;
  const grid = MATRIX_REGISTRY[def.matrixId] ?? MATRIX_REGISTRY.slime;
  const paletteKey = paletteOverride && PALETTE_REGISTRY[paletteOverride] ? paletteOverride : def.defaultPalette;
  const palette = PALETTE_REGISTRY[paletteKey] ?? PALETTE_REGISTRY.emerald_slime;
  return { grid, palette };
}
