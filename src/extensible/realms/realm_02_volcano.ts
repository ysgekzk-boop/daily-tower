import { Encounter, FloorDefinition } from './realm_01_greenwood';

const REALM_2_ENEMIES = ['cinder_golem', 'dire_wolf', 'thorn_goblin', 'venom_slime'];
const REALM_2_EVENTS = [
  'crimson_pact_altar',
  'wandering_blacksmith',
  'starlight_archive',
  'emerald_spring',
];

function buildRealm2Floor(floor: number): FloorDefinition {
  const localFloor = floor - 50; // 1..50 within Realm 2
  const scale = Number((1 + (localFloor - 1) * 0.05).toFixed(2));
  const isApex = floor % 50 === 0;
  const isMiniboss = !isApex && floor % 5 === 0;

  const useRestEvent = localFloor % 4 === 2 || isMiniboss || isApex;
  const eventId = useRestEvent
    ? 'sanctuary_campfire'
    : REALM_2_EVENTS[localFloor % REALM_2_EVENTS.length];

  const pickEnemy = (offset: number) =>
    REALM_2_ENEMIES[(localFloor + offset) % REALM_2_ENEMIES.length];

  let encounters: Encounter[];
  let title: string;
  let subtitle: string;

  if (isApex) {
    title = `第${floor}層：黄昏の神炉・最深部`;
    subtitle = '領域裁定者「灰燼の巨神・ヴルカン」が君臨する灼熱の玉座';
    encounters = [
      { type: 'battle', enemyId: 'cinder_golem', enemyStatScale: scale },
      { type: 'event', eventId: 'sanctuary_campfire' },
      { type: 'apex_boss', enemyId: 'ashen_colossus', enemyStatScale: 1.0 },
    ];
  } else if (isMiniboss) {
    title = `第${floor}層：熔鉄の防衛隔壁`;
    subtitle = '強固な装甲を持つ守護者が行く手を阻む';
    encounters = [
      { type: 'battle', enemyId: pickEnemy(0), enemyStatScale: scale },
      { type: 'battle', enemyId: pickEnemy(1), enemyStatScale: scale },
      { type: 'event', eventId },
      { type: 'miniboss', enemyId: 'elder_oak_warden', enemyStatScale: scale * 1.25 },
    ];
  } else {
    const battleCount = 3 + (localFloor % 3);
    title = `第${floor}層：黄昏の製鉄坑道`;
    subtitle = `熱風と火花が舞う${battleCount}連戦エリア`;
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
    realm: 2,
    title,
    subtitle,
    encounters,
    rewardPool: {
      equipmentIds: ['ember_greatsword', 'obsidian_reaver', 'cinder_mail', 'ironwood_plate'],
      skillIds: [
        'flame_burst',
        'frost_lance',
        'armor_crush',
        'venom_strike',
        'aegis_stance',
        'war_cry',
        'purifying_light',
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

export const REALM_02_FLOORS: FloorDefinition[] = Array.from(
  { length: 50 },
  (_, idx) => buildRealm2Floor(51 + idx)
);
