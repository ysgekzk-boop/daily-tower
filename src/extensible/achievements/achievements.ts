import { SaveData } from '../../core/StorageValidator';
import { ENEMY_REGISTRY } from '../enemies/enemyRegistry';

export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_victory',
    name: '初勝利',
    icon: '⚔️',
    description: '初めて戦闘に勝利する',
  },
  {
    id: 'floor_10',
    name: '第10層到達',
    icon: '🏰',
    description: '塔の第10層に到達する',
  },
  {
    id: 'floor_25',
    name: '第25層到達',
    icon: '🛡️',
    description: '塔の第25層に到達する',
  },
  {
    id: 'floor_50',
    name: '領域踏破',
    icon: '👑',
    description: '第50層を踏破し深淵へ迫る',
  },
  {
    id: 'floor_100',
    name: '第100層到達',
    icon: '🌟',
    description: '第100層の頂に到達する',
  },
  {
    id: 'floor_101',
    name: '新領域へ',
    icon: '🌌',
    description: '第101層へ足を踏み入れる',
  },
  {
    id: 'hunter_50',
    name: '討伐者',
    icon: '🏹',
    description: '敵を累計50体討伐する',
  },
  {
    id: 'hunter_200',
    name: '猛狩人',
    icon: '☠️',
    description: '敵を累計200体討伐する',
  },
  {
    id: 'first_leap',
    name: '次元跳躍者',
    icon: '🌀',
    description: '初めて次元跳躍を果たす',
  },
  {
    id: 'bestiary_25',
    name: '図鑑コレクター見習い',
    icon: '📖',
    description: '全敵種の25%以上を撃破し図鑑に記録する',
  },
  {
    id: 'bestiary_50',
    name: '図鑑コレクター',
    icon: '📚',
    description: '全敵種の50%以上を撃破し図鑑に記録する',
  },
  {
    id: 'bestiary_100',
    name: '図鑑コンプリート',
    icon: '📕',
    description: 'すべての敵種を撃破し図鑑を完成させる',
  },
];

/**
 * Pure function that evaluates the current save data and returns the IDs of all
 * achievements whose requirements are met.
 */
export function evaluateAchievements(save: SaveData): string[] {
  const stats = save.playStats ?? {
    maxFloorReached: 1,
    battlesWon: 0,
    enemiesDefeated: 0,
    leaps: 0,
  };

  const enemyKeys = Object.keys(ENEMY_REGISTRY);
  const totalEnemies = enemyKeys.length;
  let defeatedSpeciesCount = 0;
  if (save.bestiary) {
    for (const enemyId of enemyKeys) {
      if ((save.bestiary[enemyId]?.defeated ?? 0) > 0) {
        defeatedSpeciesCount++;
      }
    }
  }

  const bestiaryRatio = totalEnemies > 0 ? defeatedSpeciesCount / totalEnemies : 0;

  const unlocked: string[] = [];

  for (const ach of ACHIEVEMENTS) {
    let met = false;
    switch (ach.id) {
      case 'first_victory':
        met = stats.battlesWon >= 1;
        break;
      case 'floor_10':
        met = stats.maxFloorReached >= 10;
        break;
      case 'floor_25':
        met = stats.maxFloorReached >= 25;
        break;
      case 'floor_50':
        met = stats.maxFloorReached >= 50;
        break;
      case 'floor_100':
        met = stats.maxFloorReached >= 100;
        break;
      case 'floor_101':
        met = stats.maxFloorReached >= 101;
        break;
      case 'hunter_50':
        met = stats.enemiesDefeated >= 50;
        break;
      case 'hunter_200':
        met = stats.enemiesDefeated >= 200;
        break;
      case 'first_leap':
        met = stats.leaps >= 1;
        break;
      case 'bestiary_25':
        met = totalEnemies > 0 && bestiaryRatio >= 0.25 - 1e-9;
        break;
      case 'bestiary_50':
        met = totalEnemies > 0 && bestiaryRatio >= 0.5 - 1e-9;
        break;
      case 'bestiary_100':
        met = totalEnemies > 0 && defeatedSpeciesCount >= totalEnemies;
        break;
    }

    if (met) {
      unlocked.push(ach.id);
    }
  }

  return unlocked;
}
