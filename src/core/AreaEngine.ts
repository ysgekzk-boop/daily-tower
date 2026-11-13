import {
  ARMOR_CATALOG,
  ArmorItem,
  SkillItem,
  WEAPON_CATALOG,
  WeaponItem,
} from '../extensible/items/itemCatalog';
import { REALM_METADATA } from '../extensible/realms/realmIndex';

export interface RunArchiveRecord {
  id: string;
  realm: number;
  realmName: string;
  clearedFloor: number;
  timestamp: string;
  weaponName: string;
  armorName: string;
  skillNames: string[];
  relicName: string;
  goldEarned: number;
  gemsAwarded: number;
}

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'skin' | 'theme' | 'title';
  costGems: number;
  spriteId?: string;
  paletteId?: string;
  themeClass?: string;
  titleText?: string;
  description: string;
}

export const COSMETIC_SHOP_CATALOG: CosmeticItem[] = [
  {
    id: 'skin_crimson_knight',
    name: '紅蓮の覇者スキン',
    category: 'skin',
    costGems: 10,
    spriteId: 'hero_knight',
    paletteId: 'crimson_knight',
    description: '深紅と黄金の鎧を纏った騎士のドット絵スキン。',
  },
  {
    id: 'skin_astral_mage',
    name: '星詠みの魔導士スキン',
    category: 'skin',
    costGems: 15,
    spriteId: 'hero_mage',
    paletteId: 'astral_mage',
    description: '星光のローブを纏う魔導士のドット絵スキン。',
  },
  {
    id: 'skin_neon_cyber',
    name: 'ネオン・サイバースキン',
    category: 'skin',
    costGems: 20,
    spriteId: 'hero_cyber',
    paletteId: 'neon_cyber',
    description: '次元を超越したサイバーパンク仕様の特装スキン。',
  },
  {
    id: 'title_verdant_conqueror',
    name: '称号：樹海を征す者',
    category: 'title',
    costGems: 10,
    titleText: '【樹海を征す者】',
    description: 'プレイヤー名の横に誇り高き称号を表示する。',
  },
  {
    id: 'title_dimension_walker',
    name: '称号：次元跳躍の観測者',
    category: 'title',
    costGems: 20,
    titleText: '【次元跳躍の観測者】',
    description: '幾度もの領域リセットを乗り越えた証の称号。',
  },
];

export class AreaEngine {
  /**
   * Dynamic Checkpoint & Death Penalty Formula (Spec §6.3):
   * RespawnFloor = max(RealmStartFloor, N - min(30, floor(N * 0.3)))
   */
  static calculateRespawnFloor(currentFloor: number): number {
    const realmIndex = Math.floor((Math.max(1, currentFloor) - 1) / 50);
    const realmStartFloor = realmIndex * 50 + 1;
    const penalty = Math.min(30, Math.floor(currentFloor * 0.3));
    return Math.max(realmStartFloor, currentFloor - penalty);
  }

  /**
   * Executes the 50-Floor Dimensional Leap:
   * - Creates a permanent RunArchiveRecord
   * - Awards Cosmetic Gems (15 gems per 50F clear)
   * - Resets equipment to the new Realm's normalized baseline gear
   */
  static executeDimensionalLeap(params: {
    clearedFloor: number;
    weapon: WeaponItem;
    armor: ArmorItem;
    skills: [SkillItem | null, SkillItem | null, SkillItem | null];
    relicName: string;
    gold: number;
  }): {
    nextFloor: number;
    nextRealm: number;
    normalizedWeapon: WeaponItem;
    normalizedArmor: ArmorItem;
    normalizedSkills: [SkillItem | null, SkillItem | null, SkillItem | null];
    gemsAwarded: number;
    archiveRecord: RunArchiveRecord;
  } {
    const clearedRealm = Math.floor((params.clearedFloor - 1) / 50) + 1;
    const nextFloor = params.clearedFloor + 1;
    const nextRealm = clearedRealm + 1;
    const meta = REALM_METADATA[clearedRealm] ?? REALM_METADATA[1];
    const gemsAwarded = 15;

    const archiveRecord: RunArchiveRecord = {
      id: `archive_${Date.now()}_f${params.clearedFloor}`,
      realm: clearedRealm,
      realmName: meta.name,
      clearedFloor: params.clearedFloor,
      timestamp: new Date().toISOString(),
      weaponName: params.weapon.name,
      armorName: params.armor.name,
      skillNames: params.skills.filter(Boolean).map((s) => s!.name),
      relicName: params.relicName,
      goldEarned: params.gold,
      gemsAwarded,
    };

    // Normalized baseline gear for the new Realm to prevent exponential stat overflow
    const normalizedWeapon =
      nextRealm >= 2 ? WEAPON_CATALOG.verdant_blade : WEAPON_CATALOG.rusty_shortsword;
    const normalizedArmor =
      nextRealm >= 2 ? ARMOR_CATALOG.bark_cuirass : ARMOR_CATALOG.leather_tunic;
    // Carry over exactly one skill into the new realm (design:
    // 2026-11-14): the first non-null skill in slot order, placed in
    // slot 0; the other two slots start empty so the new realm's skill
    // cards rebuild the kit. Previously this granted power_slash plus
    // the slot-0 skill, which duplicated power_slash whenever it was
    // already in slot 0.
    const carriedSkill =
      params.skills[0] ?? params.skills[1] ?? params.skills[2] ?? null;
    const normalizedSkills: [SkillItem | null, SkillItem | null, SkillItem | null] = [
      carriedSkill,
      null,
      null,
    ];

    return {
      nextFloor,
      nextRealm,
      normalizedWeapon,
      normalizedArmor,
      normalizedSkills,
      gemsAwarded,
      archiveRecord,
    };
  }

  static formatShareText(record: RunArchiveRecord): string {
    const skills = record.skillNames.length > 0 ? record.skillNames.join(' / ') : 'なし';
    return [
      `🏰 【Daily Tower 登頂記録】`,
      `領域: Realm ${record.realm} 「${record.realmName}」 (${record.clearedFloor}F 踏破!)`,
      `⚔️ 武器: ${record.weaponName} | 🛡️ 防具: ${record.armorName}`,
      `✨ スキル: ${skills}`,
      `🔮 レリック: ${record.relicName}`,
      `💎 獲得ジェム: +${record.gemsAwarded} | 💰 所持金: ${record.goldEarned}G`,
      `#DailyTower`,
    ].join('\n');
  }
}
