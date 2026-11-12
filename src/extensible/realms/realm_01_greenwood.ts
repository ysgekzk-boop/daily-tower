export type EncounterType = 'battle' | 'event' | 'miniboss' | 'apex_boss';

export interface Encounter {
  type: EncounterType;
  enemyId?: string;
  /**
   * Multi-enemy battle (1-3 enemies). When present, takes precedence over
   * enemyId: the player fights all listed enemies at once, selecting a
   * target for single-target attacks/skills. Boss encounters stay solo.
   */
  enemyIds?: string[];
  eventId?: string;
  enemyStatScale?: number; // Multiplier for enemy HP/ATK/DEF on higher floors within the realm
}

export interface FloorRewardPool {
  equipmentIds: string[];  // Card 1 candidates (Weapon / Armor)
  skillIds: string[];      // Card 2 candidates (Skill)
  utilityIds: string[];    // Card 3 candidates (Relic, or Consumable on Miniboss/Apex per §3.1)
  consumableIds?: string[]; // Optional Card 3 Consumable candidates
}

export interface FloorDefinition {
  floor: number;
  realm: number;
  title: string;
  subtitle: string;
  encounters: Encounter[];
  rewardPool: FloorRewardPool;
}

/**
 * Floors in this file are AUTHORED DATA.
 * Daily floors are added or changed by editing entries below — never by
 * procedural generation. Composition rules (Spec §5.2) are enforced by
 * tests/floor_structure.test.ts.
 */

export const REALM_01_FLOORS: FloorDefinition[] = [
  {
    floor: 1,
    realm: 1,
    title: '第1層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'moss_slime', enemyStatScale: 0.72 },
      { type: 'battle', enemyId: 'thorn_goblin', enemyStatScale: 0.72 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'venom_slime', enemyStatScale: 0.72 },
      { type: 'battle', enemyId: 'moss_slime', enemyStatScale: 0.72 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 2,
    realm: 1,
    title: '第2層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'thorn_goblin', enemyStatScale: 0.73 },
      { type: 'battle', enemyId: 'forest_bat', enemyStatScale: 0.73 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'venom_slime', enemyStatScale: 0.73 },
      { type: 'battle', enemyId: 'moss_slime', enemyStatScale: 0.73 },
      { type: 'battle', enemyId: 'forest_bat', enemyStatScale: 0.73 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 3,
    realm: 1,
    title: '第3層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'dire_wolf', enemyStatScale: 0.75 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'spore_fungus', enemyStatScale: 0.75 },
      { type: 'battle', enemyId: 'thorn_goblin', enemyStatScale: 0.75 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 4,
    realm: 1,
    title: '第4層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'amber_beetle', enemyStatScale: 0.76 },
      { type: 'battle', enemyId: 'venom_slime', enemyStatScale: 0.76 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'forest_bat', enemyStatScale: 0.76 },
      { type: 'battle', enemyId: 'dire_wolf', enemyStatScale: 0.76 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 5,
    realm: 1,
    title: '第5層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyId: 'spore_fungus', enemyStatScale: 0.78 },
      { type: 'battle', enemyId: 'amber_beetle', enemyStatScale: 0.78 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'thorn_queen_vespa', enemyStatScale: 0.78 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 6,
    realm: 1,
    title: '第6層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'woodland_viper', enemyStatScale: 0.79 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'dire_wolf', enemyStatScale: 0.79 },
      { type: 'battle', enemyId: 'moss_slime', enemyStatScale: 0.79 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 7,
    realm: 1,
    title: '第7層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'forest_dryad', enemyStatScale: 0.8 },
      { type: 'battle', enemyId: 'spore_fungus', enemyStatScale: 0.8 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'woodland_viper', enemyStatScale: 0.8 },
      { type: 'battle', enemyId: 'amber_beetle', enemyStatScale: 0.8 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 8,
    realm: 1,
    title: '第8層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'bramble_boar', enemyStatScale: 0.82 },
      { type: 'battle', enemyId: 'forest_dryad', enemyStatScale: 0.82 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyIds: ['forest_bat', 'thorn_goblin'], enemyStatScale: 0.82 },
      { type: 'battle', enemyId: 'venom_slime', enemyStatScale: 0.82 },
      { type: 'battle', enemyId: 'dire_wolf', enemyStatScale: 0.82 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 9,
    realm: 1,
    title: '第9層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'bramble_boar', enemyStatScale: 0.83 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'woodland_viper', enemyStatScale: 0.83 },
      { type: 'battle', enemyIds: ['moss_slime', 'spore_fungus'], enemyStatScale: 0.83 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 10,
    realm: 1,
    title: '第10層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyId: 'forest_dryad', enemyStatScale: 0.85 },
      { type: 'battle', enemyId: 'bramble_boar', enemyStatScale: 0.85 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'ancient_ursus', enemyStatScale: 0.85 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 11,
    realm: 1,
    title: '第11層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'moss_owl', enemyStatScale: 0.86 },
      { type: 'battle', enemyId: 'canopy_spider', enemyStatScale: 0.86 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'thorn_goblin', enemyStatScale: 0.86 },
      { type: 'battle', enemyId: 'amber_beetle', enemyStatScale: 0.86 },
      { type: 'battle', enemyId: 'dire_wolf', enemyStatScale: 0.86 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 12,
    realm: 1,
    title: '第12層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'thorn_trapper', enemyStatScale: 0.87 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'woodland_viper', enemyStatScale: 0.87 },
      { type: 'battle', enemyId: 'forest_bat', enemyStatScale: 0.87 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 13,
    realm: 1,
    title: '第13層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'moss_crab', enemyStatScale: 0.89 },
      { type: 'battle', enemyId: 'spore_fungus', enemyStatScale: 0.89 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'forest_dryad', enemyStatScale: 0.89 },
      { type: 'battle', enemyId: 'bramble_boar', enemyStatScale: 0.89 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 14,
    realm: 1,
    title: '第14層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'ivy_creeper', enemyStatScale: 0.9 },
      { type: 'battle', enemyId: 'moss_owl', enemyStatScale: 0.9 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'canopy_spider', enemyStatScale: 0.9 },
      { type: 'battle', enemyId: 'thorn_trapper', enemyStatScale: 0.9 },
      { type: 'battle', enemyId: 'moss_crab', enemyStatScale: 0.9 },
    ],
    rewardPool: {
      equipmentIds: ['verdant_blade', 'bark_cuirass'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 15,
    realm: 1,
    title: '第15層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyId: 'glen_elk', enemyStatScale: 0.92 },
      { type: 'battle', enemyId: 'ivy_creeper', enemyStatScale: 0.92 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'shadow_panther', enemyStatScale: 0.92 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 16,
    realm: 1,
    title: '第16層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'bark_chameleon', enemyStatScale: 0.93 },
      { type: 'battle', enemyId: 'moss_owl', enemyStatScale: 0.93 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'canopy_spider', enemyStatScale: 0.93 },
      { type: 'battle', enemyId: 'glen_elk', enemyStatScale: 0.93 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 17,
    realm: 1,
    title: '第17層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'amber_wisp', enemyStatScale: 0.94 },
      { type: 'battle', enemyId: 'bark_chameleon', enemyStatScale: 0.94 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'thorn_trapper', enemyStatScale: 0.94 },
      { type: 'battle', enemyId: 'ivy_creeper', enemyStatScale: 0.94 },
      { type: 'battle', enemyId: 'moss_crab', enemyStatScale: 0.94 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 18,
    realm: 1,
    title: '第18層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'glen_elk', enemyStatScale: 0.96 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'moss_owl', enemyStatScale: 0.96 },
      { type: 'battle', enemyId: 'amber_wisp', enemyStatScale: 0.96 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 19,
    realm: 1,
    title: '第19層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyIds: ['canopy_spider', 'bark_chameleon'], enemyStatScale: 0.97 },
      { type: 'battle', enemyId: 'ivy_creeper', enemyStatScale: 0.97 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'thorn_trapper', enemyStatScale: 0.97 },
      { type: 'battle', enemyId: 'glen_elk', enemyStatScale: 0.97 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 20,
    realm: 1,
    title: '第20層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyIds: ['moss_crab', 'amber_wisp'], enemyStatScale: 0.99 },
      { type: 'battle', enemyId: 'bark_chameleon', enemyStatScale: 0.99 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'ironwood_colossus', enemyStatScale: 0.99 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 21,
    realm: 1,
    title: '第21層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'glen_elk', enemyStatScale: 1 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'needle_porcupine', enemyStatScale: 1 },
      { type: 'battle', enemyId: 'bark_chameleon', enemyStatScale: 1 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 22,
    realm: 1,
    title: '第22層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'mist_moth', enemyStatScale: 1.01 },
      { type: 'battle', enemyId: 'canopy_spider', enemyStatScale: 1.01 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'swamp_croc', enemyStatScale: 1.01 },
      { type: 'battle', enemyId: 'amber_wisp', enemyStatScale: 1.01 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 23,
    realm: 1,
    title: '第23層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'moss_owl', enemyStatScale: 1.03 },
      { type: 'battle', enemyId: 'thorn_trapper', enemyStatScale: 1.03 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'ivy_creeper', enemyStatScale: 1.03 },
      { type: 'battle', enemyId: 'moss_crab', enemyStatScale: 1.03 },
      { type: 'battle', enemyId: 'amber_wisp', enemyStatScale: 1.03 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 24,
    realm: 1,
    title: '第24層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'needle_porcupine', enemyStatScale: 1.04 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'thorn_mantis', enemyStatScale: 1.04 },
      { type: 'battle', enemyId: 'bloom_mandragora', enemyStatScale: 1.04 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 25,
    realm: 1,
    title: '第25層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyId: 'swamp_croc', enemyStatScale: 1.06 },
      { type: 'battle', enemyId: 'mist_moth', enemyStatScale: 1.06 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'elder_oak_warden', enemyStatScale: 1.06 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 26,
    realm: 1,
    title: '第26層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'moss_tortoise', enemyStatScale: 1.07 },
      { type: 'battle', enemyId: 'thorn_mantis', enemyStatScale: 1.07 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'needle_porcupine', enemyStatScale: 1.07 },
      { type: 'battle', enemyId: 'bloom_mandragora', enemyStatScale: 1.07 },
      { type: 'battle', enemyIds: ['mist_moth', 'swamp_croc'], enemyStatScale: 1.07 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 27,
    realm: 1,
    title: '第27層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'verdant_falcon', enemyStatScale: 1.08 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'moss_tortoise', enemyStatScale: 1.08 },
      { type: 'battle', enemyId: 'thorn_mantis', enemyStatScale: 1.08 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 28,
    realm: 1,
    title: '第28層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'spirit_fox', enemyStatScale: 1.1 },
      { type: 'battle', enemyId: 'needle_porcupine', enemyStatScale: 1.1 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'bloom_mandragora', enemyStatScale: 1.1 },
      { type: 'battle', enemyIds: ['verdant_falcon', 'moss_tortoise'], enemyStatScale: 1.1 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 29,
    realm: 1,
    title: '第29層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'spirit_fox', enemyStatScale: 1.11 },
      { type: 'battle', enemyId: 'thorn_mantis', enemyStatScale: 1.11 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'swamp_croc', enemyStatScale: 1.11 },
      { type: 'battle', enemyId: 'verdant_falcon', enemyStatScale: 1.11 },
      { type: 'battle', enemyIds: ['spirit_fox', 'bloom_mandragora'], enemyStatScale: 1.11 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 30,
    realm: 1,
    title: '第30層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyIds: ['needle_porcupine', 'mist_moth'], enemyStatScale: 1.13 },
      { type: 'battle', enemyIds: ['moss_tortoise', 'verdant_falcon'], enemyStatScale: 1.13 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'verdant_gryphon', enemyStatScale: 1.13 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 31,
    realm: 1,
    title: '第31層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'bog_toad', enemyStatScale: 1.14 },
      { type: 'battle', enemyId: 'mist_moth', enemyStatScale: 1.14 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'fungal_strider', enemyStatScale: 1.14 },
      { type: 'battle', enemyIds: ['bog_toad', 'swamp_croc'], enemyStatScale: 1.14 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 32,
    realm: 1,
    title: '第32層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'lichen_ape', enemyStatScale: 1.15 },
      { type: 'battle', enemyId: 'thorn_centipede', enemyStatScale: 1.15 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'bloom_mandragora', enemyStatScale: 1.15 },
      { type: 'battle', enemyId: 'spirit_fox', enemyStatScale: 1.15 },
      { type: 'battle', enemyIds: ['thorn_centipede', 'thorn_mantis'], enemyStatScale: 1.15 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 33,
    realm: 1,
    title: '第33層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyIds: ['ancient_scarab', 'verdant_falcon'], enemyStatScale: 1.17 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'spirit_fox', enemyStatScale: 1.17 },
      { type: 'battle', enemyId: 'moss_tortoise', enemyStatScale: 1.17 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 34,
    realm: 1,
    title: '第34層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'dusk_crow', enemyStatScale: 1.18 },
      { type: 'battle', enemyId: 'ancient_scarab', enemyStatScale: 1.18 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'bog_toad', enemyStatScale: 1.18 },
      { type: 'battle', enemyIds: ['lichen_ape', 'fungal_strider'], enemyStatScale: 1.18 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 35,
    realm: 1,
    title: '第35層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyId: 'thorn_centipede', enemyStatScale: 1.2 },
      { type: 'battle', enemyIds: ['dusk_crow', 'bog_toad'], enemyStatScale: 1.2 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'sylvan_hydra', enemyStatScale: 1.2 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 36,
    realm: 1,
    title: '第36層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'vine_stalker', enemyStatScale: 1.21 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'ancient_scarab', enemyStatScale: 1.21 },
      { type: 'battle', enemyIds: ['dusk_crow', 'lichen_ape'], enemyStatScale: 1.21 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 37,
    realm: 1,
    title: '第37層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'moss_gargoyle', enemyStatScale: 1.22 },
      { type: 'battle', enemyId: 'vine_stalker', enemyStatScale: 1.22 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'fungal_strider', enemyStatScale: 1.22 },
      { type: 'battle', enemyId: 'thorn_centipede', enemyStatScale: 1.22 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 38,
    realm: 1,
    title: '第38層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'bog_toad', enemyStatScale: 1.24 },
      { type: 'battle', enemyId: 'dusk_crow', enemyStatScale: 1.24 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'ancient_scarab', enemyStatScale: 1.24 },
      { type: 'battle', enemyId: 'vine_stalker', enemyStatScale: 1.24 },
      { type: 'battle', enemyId: 'moss_gargoyle', enemyStatScale: 1.24 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 39,
    realm: 1,
    title: '第39層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'fungal_strider', enemyStatScale: 1.25 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'thorn_centipede', enemyStatScale: 1.25 },
      { type: 'battle', enemyId: 'moss_gargoyle', enemyStatScale: 1.25 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 40,
    realm: 1,
    title: '第40層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyId: 'moss_gargoyle', enemyStatScale: 1.27 },
      { type: 'battle', enemyId: 'vine_stalker', enemyStatScale: 1.27 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'verdant_basilisk', enemyStatScale: 1.27 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 41,
    realm: 1,
    title: '第41層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'chasm_moss_core', enemyStatScale: 1.28 },
      { type: 'battle', enemyId: 'ancient_mask_spirit', enemyStatScale: 1.28 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'abyssal_mycelium', enemyStatScale: 1.28 },
      { type: 'battle', enemyId: 'fungal_strider', enemyStatScale: 1.28 },
      { type: 'battle', enemyId: 'worldtree_sprout', enemyStatScale: 1.28 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 42,
    realm: 1,
    title: '第42層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'runic_hollow', enemyStatScale: 1.29 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'silicified_wraith', enemyStatScale: 1.29 },
      { type: 'battle', enemyId: 'vine_stalker', enemyStatScale: 1.29 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 43,
    realm: 1,
    title: '第43層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'amber_crystal_idol', enemyStatScale: 1.31 },
      { type: 'battle', enemyId: 'rootbound_armor', enemyStatScale: 1.31 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'moss_gargoyle', enemyStatScale: 1.31 },
      { type: 'battle', enemyIds: ['chasm_moss_core', 'worldtree_sprout'], enemyStatScale: 1.31 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 44,
    realm: 1,
    title: '第44層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'abyssal_mycelium', enemyStatScale: 1.32 },
      { type: 'battle', enemyId: 'ancient_mask_spirit', enemyStatScale: 1.32 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'runic_hollow', enemyStatScale: 1.32 },
      { type: 'battle', enemyId: 'amber_crystal_idol', enemyStatScale: 1.32 },
      { type: 'battle', enemyId: 'silicified_wraith', enemyStatScale: 1.32 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 45,
    realm: 1,
    title: '第45層：古樹の結界回廊',
    subtitle: 'フロア最奥に領域の守護ミニボスが立ち塞がる',
    encounters: [
      { type: 'battle', enemyId: 'worldtree_sprout', enemyStatScale: 1.34 },
      { type: 'battle', enemyId: 'rootbound_armor', enemyStatScale: 1.34 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'miniboss', enemyId: 'verdant_archon', enemyStatScale: 1.34 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 46,
    realm: 1,
    title: '第46層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'silicified_wraith', enemyStatScale: 1.35 },
      { type: 'battle', enemyId: 'abyssal_mycelium', enemyStatScale: 1.35 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'battle', enemyId: 'runic_hollow', enemyStatScale: 1.35 },
      { type: 'battle', enemyId: 'ancient_mask_spirit', enemyStatScale: 1.35 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 47,
    realm: 1,
    title: '第47層：樹海の迷宮回廊',
    subtitle: '5連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'worldtree_sprout', enemyStatScale: 1.36 },
      { type: 'battle', enemyId: 'rootbound_armor', enemyStatScale: 1.36 },
      { type: 'event', eventId: 'starlight_archive' },
      { type: 'battle', enemyId: 'amber_crystal_idol', enemyStatScale: 1.36 },
      { type: 'battle', enemyId: 'chasm_moss_core', enemyStatScale: 1.36 },
      { type: 'battle', enemyId: 'silicified_wraith', enemyStatScale: 1.36 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 48,
    realm: 1,
    title: '第48層：樹海の迷宮回廊',
    subtitle: '3連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'ancient_mask_spirit', enemyStatScale: 1.38 },
      { type: 'event', eventId: 'emerald_spring' },
      { type: 'battle', enemyId: 'chasm_moss_core', enemyStatScale: 1.38 },
      { type: 'battle', enemyId: 'runic_hollow', enemyStatScale: 1.38 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 49,
    realm: 1,
    title: '第49層：樹海の迷宮回廊',
    subtitle: '4連戦と1つの邂逅が待つ樹海エリア',
    encounters: [
      { type: 'battle', enemyId: 'abyssal_mycelium', enemyStatScale: 1.39 },
      { type: 'battle', enemyId: 'rootbound_armor', enemyStatScale: 1.39 },
      { type: 'event', eventId: 'crimson_pact_altar' },
      { type: 'battle', enemyId: 'amber_crystal_idol', enemyStatScale: 1.39 },
      { type: 'battle', enemyId: 'worldtree_sprout', enemyStatScale: 1.39 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
  {
    floor: 50,
    realm: 1,
    title: '第50層：世界樹の頂・神域',
    subtitle: '領域裁定者「始原の世界樹・ユグドラ」が待ち受ける最終試練',
    encounters: [
      { type: 'battle', enemyId: 'rootbound_armor', enemyStatScale: 1.41 },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'apex_boss', enemyId: 'primordial_treant', enemyStatScale: 0.8 },
    ],
    rewardPool: {
      equipmentIds: ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: ['power_slash', 'flame_burst', 'armor_crush', 'venom_strike', 'aegis_stance', 'war_cry', 'purifying_light', 'frost_lance'],
      utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic', 'berserker_idol_relic', 'venom_gland_relic', 'golden_compass_relic'],
    },
  },
];
