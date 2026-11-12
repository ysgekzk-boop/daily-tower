import { describe, expect, it } from 'vitest';
import { StorageValidator } from '../src/core/StorageValidator';
import {
  ACHIEVEMENTS,
  evaluateAchievements,
} from '../src/extensible/achievements/achievements';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';

describe('Achievements evaluation (evaluateAchievements)', () => {
  it('returns no achievements on fresh default save', () => {
    const save = StorageValidator.createDefaultSave();
    const unlocked = evaluateAchievements(save);
    expect(unlocked).toEqual([]);
  });

  it('evaluates first_victory correctly at boundary (0 vs 1)', () => {
    const save = StorageValidator.createDefaultSave();
    save.playStats = { maxFloorReached: 1, battlesWon: 0, enemiesDefeated: 0, leaps: 0 };
    expect(evaluateAchievements(save)).not.toContain('first_victory');

    save.playStats.battlesWon = 1;
    expect(evaluateAchievements(save)).toContain('first_victory');
  });

  it('evaluates floor progression achievements (floor_10, 25, 50, 100, 101) at boundaries', () => {
    const save = StorageValidator.createDefaultSave();
    save.playStats = { maxFloorReached: 9, battlesWon: 0, enemiesDefeated: 0, leaps: 0 };
    expect(evaluateAchievements(save)).not.toContain('floor_10');

    save.playStats.maxFloorReached = 10;
    let unlocked = evaluateAchievements(save);
    expect(unlocked).toContain('floor_10');
    expect(unlocked).not.toContain('floor_25');

    save.playStats.maxFloorReached = 24;
    expect(evaluateAchievements(save)).not.toContain('floor_25');

    save.playStats.maxFloorReached = 25;
    expect(evaluateAchievements(save)).toContain('floor_25');

    save.playStats.maxFloorReached = 49;
    expect(evaluateAchievements(save)).not.toContain('floor_50');

    save.playStats.maxFloorReached = 50;
    expect(evaluateAchievements(save)).toContain('floor_50');

    save.playStats.maxFloorReached = 99;
    expect(evaluateAchievements(save)).not.toContain('floor_100');

    save.playStats.maxFloorReached = 100;
    unlocked = evaluateAchievements(save);
    expect(unlocked).toContain('floor_100');
    expect(unlocked).not.toContain('floor_101');

    save.playStats.maxFloorReached = 101;
    expect(evaluateAchievements(save)).toContain('floor_101');
  });

  it('evaluates enemy hunter achievements (hunter_50, hunter_200) at boundaries', () => {
    const save = StorageValidator.createDefaultSave();
    save.playStats = { maxFloorReached: 1, battlesWon: 0, enemiesDefeated: 49, leaps: 0 };
    expect(evaluateAchievements(save)).not.toContain('hunter_50');

    save.playStats.enemiesDefeated = 50;
    expect(evaluateAchievements(save)).toContain('hunter_50');
    expect(evaluateAchievements(save)).not.toContain('hunter_200');

    save.playStats.enemiesDefeated = 199;
    expect(evaluateAchievements(save)).not.toContain('hunter_200');

    save.playStats.enemiesDefeated = 200;
    expect(evaluateAchievements(save)).toContain('hunter_200');
  });

  it('evaluates dimensional leaps achievement (first_leap) at boundary', () => {
    const save = StorageValidator.createDefaultSave();
    save.playStats = { maxFloorReached: 1, battlesWon: 0, enemiesDefeated: 0, leaps: 0 };
    expect(evaluateAchievements(save)).not.toContain('first_leap');

    save.playStats.leaps = 1;
    expect(evaluateAchievements(save)).toContain('first_leap');
  });

  it('evaluates bestiary percentage achievements (25%, 50%, 100%) correctly', () => {
    const save = StorageValidator.createDefaultSave();
    const enemyKeys = Object.keys(ENEMY_REGISTRY);
    const total = enemyKeys.length;
    expect(total).toBeGreaterThan(0);

    save.bestiary = {};

    // Seen only enemies should NOT count as defeated
    for (const key of enemyKeys) {
      save.bestiary[key] = { seen: 5, defeated: 0 };
    }
    expect(evaluateAchievements(save)).not.toContain('bestiary_25');
    expect(evaluateAchievements(save)).not.toContain('bestiary_50');
    expect(evaluateAchievements(save)).not.toContain('bestiary_100');

    // Defeat 24% of enemies -> no achievement
    const count24Pct = Math.floor(total * 0.24);
    for (let i = 0; i < count24Pct; i++) {
      save.bestiary[enemyKeys[i]] = { seen: 1, defeated: 1 };
    }
    expect(evaluateAchievements(save)).not.toContain('bestiary_25');

    // Defeat at least 25% of enemies -> bestiary_25 unlocked
    const count25Pct = Math.ceil(total * 0.25);
    for (let i = 0; i < count25Pct; i++) {
      save.bestiary[enemyKeys[i]] = { seen: 1, defeated: 1 };
    }
    let unlocked = evaluateAchievements(save);
    expect(unlocked).toContain('bestiary_25');
    expect(unlocked).not.toContain('bestiary_50');

    // Defeat at least 50% of enemies -> bestiary_50 unlocked
    const count50Pct = Math.ceil(total * 0.5);
    for (let i = 0; i < count50Pct; i++) {
      save.bestiary[enemyKeys[i]] = { seen: 1, defeated: 1 };
    }
    unlocked = evaluateAchievements(save);
    expect(unlocked).toContain('bestiary_25');
    expect(unlocked).toContain('bestiary_50');
    expect(unlocked).not.toContain('bestiary_100');

    // Defeat all enemies except 1 -> bestiary_100 not yet unlocked
    for (let i = 0; i < total - 1; i++) {
      save.bestiary[enemyKeys[i]] = { seen: 1, defeated: 1 };
    }
    expect(evaluateAchievements(save)).not.toContain('bestiary_100');

    // Defeat all enemies -> bestiary_100 unlocked
    save.bestiary[enemyKeys[total - 1]] = { seen: 1, defeated: 1 };
    unlocked = evaluateAchievements(save);
    expect(unlocked).toContain('bestiary_100');
  });

  it('all 12 achievements are defined with valid properties', () => {
    expect(ACHIEVEMENTS.length).toBe(12);
    for (const ach of ACHIEVEMENTS) {
      expect(ach.id).toBeTruthy();
      expect(ach.name).toBeTruthy();
      expect(ach.icon).toBeTruthy();
      expect(ach.description).toBeTruthy();
    }
  });
});

describe('StorageValidator backward compatibility & healing', () => {
  it('supplements missing bestiary, achievements, and playStats from legacy save', () => {
    const defaultSave = StorageValidator.createDefaultSave();
    // Simulate legacy save without bestiary, achievements, playStats
    const legacySave: Record<string, any> = {
      version: 4,
      midFloor: {
        currentFloor: 15,
        currentEncounterIndex: 0,
        playerCurrentHp: 100,
        consumableCharges: 2,
      },
      inventory: defaultSave.inventory,
      gold: 150,
      cosmeticGems: 20,
      unlockedCosmetics: [],
      activeSkinSpriteId: 'hero_knight',
      activeSkinPaletteId: 'steel_knight',
      activeTitle: '【塔の挑戦者】',
      archive: [],
    };

    const { save } = StorageValidator.validateAndHeal(legacySave);

    expect(save.version).toBe(4);
    expect(save.bestiary).toEqual({});
    expect(save.achievements).toEqual({});
    expect(save.playStats).toEqual({
      maxFloorReached: 15,
      battlesWon: 0,
      enemiesDefeated: 0,
      leaps: 0,
    });
    expect(save.gold).toBe(150);
  });

  it('sanitizes corrupted bestiary, achievements, and playStats values safely', () => {
    const defaultSave = StorageValidator.createDefaultSave();
    const corruptedSave: Record<string, any> = {
      ...defaultSave,
      bestiary: {
        moss_slime: { seen: 'invalid', defeated: -5 },
        bad_entry: 'corrupted',
      },
      achievements: {
        first_victory: true,
        bogus: 'not_boolean',
        fake_false: false,
      },
      playStats: {
        maxFloorReached: -10,
        battlesWon: 'many',
        enemiesDefeated: NaN,
        leaps: -3,
      },
    };

    const { save } = StorageValidator.validateAndHeal(corruptedSave);

    // bestiary should clamp negative/invalid numbers to 0 and skip invalid structures
    expect(save.bestiary?.moss_slime).toEqual({ seen: 0, defeated: 0 });
    expect(save.bestiary?.bad_entry).toBeUndefined();

    // achievements should only keep entries where value === true
    expect(save.achievements).toEqual({
      first_victory: true,
    });

    // playStats should fall back to valid safe values
    expect(save.playStats?.maxFloorReached).toBe(1);
    expect(save.playStats?.battlesWon).toBe(0);
    expect(save.playStats?.enemiesDefeated).toBe(0);
    expect(save.playStats?.leaps).toBe(0);
  });
});
