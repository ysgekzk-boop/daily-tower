import { FloorDefinition, REALM_01_FLOORS } from './realm_01_greenwood';
import { REALM_02_FLOORS } from './realm_02_volcano';
import { REALM_03_FLOORS } from './realm_03_library';

export interface RealmMetadata {
  realm: number;
  name: string;
  englishName: string;
  startFloor: number;
  endFloor: number;
  bossName: string;
  environmentalRuleDescription: string;
  environmentalStatus?: {
    everyNTurns: number;
    statusId: string;
    value: number;
    duration: number;
  };
}

export const REALM_METADATA: Record<number, RealmMetadata> = {
  1: {
    realm: 1,
    name: '樹海の塔',
    englishName: 'The Verdant Spire',
    startFloor: 1,
    endFloor: 50,
    bossName: '始原の世界樹・ユグドラ (The Primordial Treant)',
    environmentalRuleDescription: '穏やかな樹海の魔力（特殊環境ダメージなし）',
  },
  2: {
    realm: 2,
    name: '黄昏の製鉄所',
    englishName: 'The Sunken Foundry',
    startFloor: 51,
    endFloor: 100,
    bossName: '灰燼の巨神・ヴルカン (The Ashen Colossus)',
    environmentalRuleDescription: '灼熱環境：3ターンごとに敵味方へ火傷(5%)が発生',
    environmentalStatus: {
      everyNTurns: 3,
      statusId: 'burn',
      value: 5,
      duration: 2,
    },
  },
  3: {
    realm: 3,
    name: '虚空の図書館',
    englishName: 'The Starless Library',
    startFloor: 101,
    endFloor: 150,
    bossName: '時詠みの司書 (The Chrono Archivist)',
    environmentalRuleDescription: '静寂の書架：3ターンごとに敵味方へシールド(8)が発生',
    environmentalStatus: {
      everyNTurns: 3,
      statusId: 'shield',
      value: 8,
      duration: 2,
    },
  },
};

export const ALL_FLOORS: Record<number, FloorDefinition> = {};
for (const f of [...REALM_01_FLOORS, ...REALM_02_FLOORS, ...REALM_03_FLOORS]) {
  ALL_FLOORS[f.floor] = f;
}

export function getFloorDefinition(floor: number): FloorDefinition {
  if (ALL_FLOORS[floor]) {
    return ALL_FLOORS[floor];
  }
  // Fallback for floors > 100: dynamically project from Realm 2 template
  const templateIndex = ((floor - 1) % 50) + 51;
  const base = ALL_FLOORS[templateIndex] ?? REALM_01_FLOORS[0];
  return {
    ...base,
    floor,
    realm: Math.floor((floor - 1) / 50) + 1,
    title: `第${floor}層：虚空の深淵回廊`,
  };
}
