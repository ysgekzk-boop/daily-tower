export type EncounterType = 'battle' | 'event' | 'miniboss' | 'apex_boss';

export interface Encounter {
  type: EncounterType;
  enemyId?: string;
  eventId?: string;
  enemyStatScale?: number; // Multiplier for enemy HP/ATK/DEF on higher floors within the realm
}

export interface FloorRewardPool {
  equipmentIds: string[];  // Card 1 candidates (Weapon / Armor)
  skillIds: string[];      // Card 2 candidates (Skill)
  utilityIds: string[];    // Card 3 candidates (Relic, or Consumable on Miniboss/Apex per §3.1)
}

export interface FloorDefinition {
  floor: number;
  realm: number;
  title: string;
  subtitle: string;
  encounters: Encounter[];
  rewardPool: FloorRewardPool;
}

const REALM_1_ENEMIES = ['moss_slime', 'venom_slime', 'thorn_goblin', 'dire_wolf'];
const REALM_1_EVENTS = [
  'emerald_spring',
  'crimson_pact_altar',
  'wandering_blacksmith',
  'starlight_archive',
];

function buildRealm1Floor(floor: number): FloorDefinition {
  const scale = Number((1 + (floor - 1) * 0.045).toFixed(2));
  const isApex = floor % 50 === 0;
  const isMiniboss = !isApex && floor % 5 === 0;

  // Guarantee a rest event ('sanctuary_campfire') at least once every 4 floors (e.g. floors 2, 5, 8, 12...)
  const useRestEvent = floor % 4 === 2 || isMiniboss || isApex;
  const eventId = useRestEvent
    ? 'sanctuary_campfire'
    : REALM_1_EVENTS[floor % REALM_1_EVENTS.length];

  const pickEnemy = (offset: number) =>
    REALM_1_ENEMIES[(floor + offset) % REALM_1_ENEMIES.length];

  let encounters: Encounter[];
  let title: string;
  let subtitle: string;

  if (isApex) {
    title = `第${floor}層：世界樹の頂・神域`;
    subtitle = '領域裁定者「始原の世界樹・ユグドラ」が待ち受ける最終試練';
    encounters = [
      { type: 'battle', enemyId: 'dire_wolf', enemyStatScale: scale },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'apex_boss', enemyId: 'primordial_treant', enemyStatScale: 1.0 },
    ];
  } else if (isMiniboss) {
    title = `第${floor}層：古樹の結界回廊`;
    subtitle = 'フロア最奥に領域の守護ミニボスが立ち塞がる';
    encounters = [
      { type: 'battle', enemyId: pickEnemy(0), enemyStatScale: scale },
      { type: 'battle', enemyId: pickEnemy(1), enemyStatScale: scale },
      { type: 'event', eventId },
      { type: 'miniboss', enemyId: 'elder_oak_warden', enemyStatScale: scale },
    ];
  } else {
    // Standard floor: 3-5 battles + 1 event (event never first or last)
    const battleCount = 3 + (floor % 3); // 3, 4, or 5 battles
    title = `第${floor}層：樹海の迷宮回廊`;
    subtitle = `${battleCount}連戦と1つの邂逅が待つ樹海エリア`;
    encounters = [];
    const eventPosition = Math.max(1, Math.min(battleCount - 1, Math.floor(battleCount / 2)));

    for (let i = 0; i < battleCount; i++) {
      if (i === eventPosition) {
        encounters.push({ type: 'event', eventId });
      }
      encounters.push({
        type: 'battle',
        enemyId: pickEnemy(i),
        enemyStatScale: scale,
      });
    }
  }

  return {
    floor,
    realm: 1,
    title,
    subtitle,
    encounters,
    rewardPool: {
      equipmentIds:
        floor < 15
          ? ['verdant_blade', 'bark_cuirass']
          : ['thorn_halberd', 'ironwood_plate', 'verdant_blade'],
      skillIds: [
        'power_slash',
        'flame_burst',
        'armor_crush',
        'venom_strike',
        'aegis_stance',
        'war_cry',
        'purifying_light',
        'frost_lance',
      ],
      utilityIds: [
        'vampiric_fang_relic',
        'guardian_crest_relic',
        'berserker_idol_relic',
        'venom_gland_relic',
        'golden_compass_relic',
      ],
    },
  };
}

export const REALM_01_FLOORS: FloorDefinition[] = Array.from(
  { length: 50 },
  (_, idx) => buildRealm1Floor(idx + 1)
);
