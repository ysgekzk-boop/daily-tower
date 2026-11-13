import { FloorDefinition } from './realm_01_greenwood';

/**
 * Floors in this file are AUTHORED DATA.
 * Daily floors are added or changed by editing entries below — never by
 * procedural generation. Composition rules (Spec §5.2) are enforced by
 * tests/floor_structure.test.ts.
 */

export const REALM_03_FLOORS: FloorDefinition[] = [
  {
    floor: 101,
    realm: 3,
    title: '第101層：星なき書架の序章',
    subtitle: '静寂に沈む禁書庫への入口',
    encounters: [
      { type: 'battle', enemyId: 'living_tome', enemyStatScale: 1 },
      { type: 'battle', enemyId: 'ink_phantom', enemyStatScale: 1 },
      { type: 'event', eventId: 'apprentice_desk' },
      { type: 'battle', enemyId: 'brass_astrolabe', enemyStatScale: 1 },
      { type: 'battle', enemyIds: ['living_tome', 'ink_phantom'], enemyStatScale: 1 },
    ],
    rewardPool: {
      equipmentIds: ['stargazer_silver_sword', 'librarian_robe'],
      skillIds: ['chrono_flip', 'flame_wave', 'frost_lance', 'aegis_stance'],
      utilityIds: [
        'bookmark_charm_relic',
        'vampiric_fang_relic',
        'guardian_crest_relic',
        'berserker_idol_relic',
        'venom_gland_relic',
        'golden_compass_relic',
      ],
    },
  },
  {
    floor: 102,
    realm: 3,
    title: '第102層：彷徨える目録の回廊',
    subtitle: '宙を漂う羊皮紙の群れと時を刻む天球儀が侵入者を拒む、虚空の図書回廊',
    encounters: [
      { type: 'battle', enemyId: 'living_tome', enemyStatScale: 1 },
      { type: 'battle', enemyId: 'chronos_moth', enemyStatScale: 1 },
      { type: 'event', eventId: 'catalog_pedestal' },
      { type: 'battle', enemyIds: ['living_tome', 'ink_phantom'], enemyStatScale: 1 },
      { type: 'battle', enemyIds: ['chronos_moth', 'brass_astrolabe'], enemyStatScale: 1 },
    ],
    rewardPool: {
      equipmentIds: ['astral_quill', 'stargazer_silver_sword', 'librarian_robe'],
      skillIds: ['ink_burst', 'chrono_flip', 'flame_wave', 'frost_lance', 'aegis_stance'],
      utilityIds: [
        'guardian_crest_relic',
        'bookmark_charm_relic',
        'vampiric_fang_relic',
        'berserker_idol_relic',
        'venom_gland_relic',
        'golden_compass_relic',
      ],
    },
  },
];
