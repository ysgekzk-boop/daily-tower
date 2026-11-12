import {
  ARMOR_CATALOG,
  ArmorItem,
  CONSUMABLE_CATALOG,
  ConsumableItem,
  RELIC_CATALOG,
  RelicItem,
  SKILL_CATALOG,
  SkillItem,
  WEAPON_CATALOG,
  WeaponItem,
} from '../extensible/items/itemCatalog';
import { AreaEngine, RunArchiveRecord } from './AreaEngine';
import { FloorRunner } from './FloorRunner';

export interface MidFloorState {
  currentFloor: number;
  currentEncounterIndex: number;
  playerCurrentHp: number;
  consumableCharges: number;
}

export interface SaveData {
  version: 4;
  midFloor: MidFloorState;
  inventory: {
    weapon: WeaponItem;
    armor: ArmorItem;
    skills: [SkillItem | null, SkillItem | null, SkillItem | null];
    consumable: ConsumableItem | null;
    relic: RelicItem | null;
  };
  gold: number;
  cosmeticGems: number;
  unlockedCosmetics: string[];
  activeSkinSpriteId: string;
  activeSkinPaletteId: string;
  activeTitle: string;
  archive: RunArchiveRecord[];
  bestiary?: Record<string, { seen: number; defeated: number }>;
  achievements?: Record<string, true>;
  playStats?: {
    maxFloorReached: number;
    battlesWon: number;
    enemiesDefeated: number;
    leaps: number;
  };
}

export const SAVE_STORAGE_KEY = 'DAILY_TOWER_SAVE';
export const BASE_PLAYER_MAX_HP = 100;

export class StorageValidator {
  static createDefaultSave(): SaveData {
    return {
      version: 4,
      midFloor: {
        currentFloor: 1,
        currentEncounterIndex: 0,
        playerCurrentHp: BASE_PLAYER_MAX_HP,
        consumableCharges: 2,
      },
      inventory: {
        weapon: WEAPON_CATALOG.rusty_shortsword,
        armor: ARMOR_CATALOG.leather_tunic,
        skills: [
          SKILL_CATALOG.power_slash,
          SKILL_CATALOG.aegis_stance,
          SKILL_CATALOG.purifying_light,
        ],
        consumable: CONSUMABLE_CATALOG.crimson_vial,
        relic: RELIC_CATALOG.guardian_crest_relic,
      },
      gold: 30,
      cosmeticGems: 10,
      unlockedCosmetics: [],
      activeSkinSpriteId: 'hero_knight',
      activeSkinPaletteId: 'steel_knight',
      activeTitle: '【塔の挑戦者】',
      archive: [],
      bestiary: {},
      achievements: {},
      playStats: {
        maxFloorReached: 1,
        battlesWon: 0,
        enemiesDefeated: 0,
        leaps: 0,
      },
    };
  }

  /**
   * Validates and self-heals a raw JSON string or object from localStorage.
   * Preserves gold, cosmeticGems, and archive even if an item ID or floor state is corrupted.
   */
  static validateAndHeal(rawInput: unknown): {
    save: SaveData;
    healed: boolean;
    healNotes: string[];
  } {
    const defaults = StorageValidator.createDefaultSave();
    const healNotes: string[] = [];

    if (!rawInput || typeof rawInput !== 'object') {
      return { save: defaults, healed: true, healNotes: ['新規セーブデータを生成しました。'] };
    }

    const raw = rawInput as Record<string, any>;
    let healed = false;

    // Preserve meta-currency and archive
    const safeGold =
      typeof raw.gold === 'number' && Number.isFinite(raw.gold) && raw.gold >= 0
        ? Math.floor(raw.gold)
        : defaults.gold;
    const safeGems =
      typeof raw.cosmeticGems === 'number' &&
      Number.isFinite(raw.cosmeticGems) &&
      raw.cosmeticGems >= 0
        ? Math.floor(raw.cosmeticGems)
        : defaults.cosmeticGems;
    const safeArchive: RunArchiveRecord[] = Array.isArray(raw.archive) ? raw.archive : [];
    const safeUnlocked: string[] = Array.isArray(raw.unlockedCosmetics)
      ? raw.unlockedCosmetics.filter((x: unknown) => typeof x === 'string')
      : [];

    // Validate inventory slots against registries
    const rawInv = raw.inventory && typeof raw.inventory === 'object' ? raw.inventory : {};

    let weapon = WEAPON_CATALOG[rawInv.weapon?.id];
    if (!weapon) {
      weapon = defaults.inventory.weapon;
      healed = true;
      healNotes.push('不明な武器IDを検出し、初期武器に修復しました。');
    }

    let armor = ARMOR_CATALOG[rawInv.armor?.id];
    if (!armor) {
      armor = defaults.inventory.armor;
      healed = true;
      healNotes.push('不明な防具IDを検出し、初期防具に修復しました。');
    }

    const rawSkills = Array.isArray(rawInv.skills) ? rawInv.skills : [];
    const skills: [SkillItem | null, SkillItem | null, SkillItem | null] = [null, null, null];
    for (let i = 0; i < 3; i++) {
      const s = rawSkills[i];
      if (s === null || s === undefined) {
        skills[i] = null;
      } else if (s && typeof s.id === 'string' && SKILL_CATALOG[s.id]) {
        skills[i] = SKILL_CATALOG[s.id];
      } else {
        skills[i] = defaults.inventory.skills[i];
        healed = true;
        healNotes.push(`スキルスロット${i + 1}の不整合を修復しました。`);
      }
    }

    let consumable: ConsumableItem | null = null;
    if (rawInv.consumable?.id && CONSUMABLE_CATALOG[rawInv.consumable.id]) {
      consumable = CONSUMABLE_CATALOG[rawInv.consumable.id];
    } else {
      consumable = defaults.inventory.consumable;
    }

    let relic: RelicItem | null = null;
    if (rawInv.relic === null) {
      relic = null;
    } else if (rawInv.relic?.id && RELIC_CATALOG[rawInv.relic.id]) {
      relic = RELIC_CATALOG[rawInv.relic.id];
    } else {
      relic = defaults.inventory.relic;
    }

    // Validate midFloor state
    const maxHp = BASE_PLAYER_MAX_HP + armor.maxHpBonus;
    const rawMid = raw.midFloor && typeof raw.midFloor === 'object' ? raw.midFloor : {};

    let currentFloor =
      typeof rawMid.currentFloor === 'number' &&
      Number.isFinite(rawMid.currentFloor) &&
      rawMid.currentFloor >= 1
        ? Math.floor(rawMid.currentFloor)
        : 1;

    let currentEncounterIndex =
      typeof rawMid.currentEncounterIndex === 'number' &&
      Number.isFinite(rawMid.currentEncounterIndex) &&
      rawMid.currentEncounterIndex >= 0
        ? Math.floor(rawMid.currentEncounterIndex)
        : 0;

    let playerCurrentHp =
      typeof rawMid.playerCurrentHp === 'number' &&
      Number.isFinite(rawMid.playerCurrentHp) &&
      rawMid.playerCurrentHp > 0
        ? Math.min(maxHp, Math.floor(rawMid.playerCurrentHp))
        : maxHp;

    const maxConsCharges = consumable?.maxCharges ?? 2;
    const consumableCharges =
      typeof rawMid.consumableCharges === 'number' &&
      Number.isFinite(rawMid.consumableCharges) &&
      rawMid.consumableCharges >= 0
        ? Math.min(maxConsCharges, Math.floor(rawMid.consumableCharges))
        : maxConsCharges;

    const floorDef = FloorRunner.getFloor(currentFloor);
    if (currentEncounterIndex >= floorDef.encounters.length) {
      currentFloor = AreaEngine.calculateRespawnFloor(currentFloor);
      currentEncounterIndex = 0;
      playerCurrentHp = maxHp;
      healed = true;
      healNotes.push('エンカウントインデックスの不整合を検出しチェックポイントへ復帰しました。');
    }

    // Validate bestiary
    const safeBestiary: Record<string, { seen: number; defeated: number }> = {};
    if (raw.bestiary && typeof raw.bestiary === 'object' && !Array.isArray(raw.bestiary)) {
      for (const [key, val] of Object.entries(raw.bestiary)) {
        if (typeof key === 'string' && val && typeof val === 'object') {
          const v = val as { seen?: unknown; defeated?: unknown };
          const seen =
            typeof v.seen === 'number' && Number.isFinite(v.seen) && v.seen >= 0
              ? Math.floor(v.seen)
              : 0;
          const defeated =
            typeof v.defeated === 'number' && Number.isFinite(v.defeated) && v.defeated >= 0
              ? Math.floor(v.defeated)
              : 0;
          safeBestiary[key] = { seen, defeated };
        }
      }
    }

    // Validate achievements
    const safeAchievements: Record<string, true> = {};
    if (
      raw.achievements &&
      typeof raw.achievements === 'object' &&
      !Array.isArray(raw.achievements)
    ) {
      for (const [key, val] of Object.entries(raw.achievements)) {
        if (typeof key === 'string' && val === true) {
          safeAchievements[key] = true;
        }
      }
    }

    // Validate playStats
    const rawStats =
      raw.playStats && typeof raw.playStats === 'object' && !Array.isArray(raw.playStats)
        ? raw.playStats
        : {};
    const safePlayStats = {
      maxFloorReached:
        typeof rawStats.maxFloorReached === 'number' &&
        Number.isFinite(rawStats.maxFloorReached) &&
        rawStats.maxFloorReached >= 1
          ? Math.floor(rawStats.maxFloorReached)
          : Math.max(1, currentFloor),
      battlesWon:
        typeof rawStats.battlesWon === 'number' &&
        Number.isFinite(rawStats.battlesWon) &&
        rawStats.battlesWon >= 0
          ? Math.floor(rawStats.battlesWon)
          : 0,
      enemiesDefeated:
        typeof rawStats.enemiesDefeated === 'number' &&
        Number.isFinite(rawStats.enemiesDefeated) &&
        rawStats.enemiesDefeated >= 0
          ? Math.floor(rawStats.enemiesDefeated)
          : 0,
      leaps:
        typeof rawStats.leaps === 'number' &&
        Number.isFinite(rawStats.leaps) &&
        rawStats.leaps >= 0
          ? Math.floor(rawStats.leaps)
          : 0,
    };

    return {
      save: {
        version: 4,
        midFloor: {
          currentFloor,
          currentEncounterIndex,
          playerCurrentHp,
          consumableCharges,
        },
        inventory: {
          weapon,
          armor,
          skills,
          consumable,
          relic,
        },
        gold: safeGold,
        cosmeticGems: safeGems,
        unlockedCosmetics: safeUnlocked,
        activeSkinSpriteId:
          typeof raw.activeSkinSpriteId === 'string'
            ? raw.activeSkinSpriteId
            : defaults.activeSkinSpriteId,
        activeSkinPaletteId:
          typeof raw.activeSkinPaletteId === 'string'
            ? raw.activeSkinPaletteId
            : defaults.activeSkinPaletteId,
        activeTitle:
          typeof raw.activeTitle === 'string' ? raw.activeTitle : defaults.activeTitle,
        archive: safeArchive,
        bestiary: safeBestiary,
        achievements: safeAchievements,
        playStats: safePlayStats,
      },
      healed,
      healNotes,
    };
  }
}
