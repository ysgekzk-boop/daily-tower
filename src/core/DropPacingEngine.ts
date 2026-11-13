import {
  AnyCatalogItem,
  ARMOR_CATALOG,
  ArmorItem,
  CONSUMABLE_CATALOG,
  ConsumableItem,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
  WeaponItem,
} from '../extensible/items/itemCatalog';
import { FloorDefinition } from '../extensible/realms/realm_01_greenwood';

export interface RewardCard {
  slot: 1 | 2 | 3;
  title: string;
  subtitle: string;
  type: 'item' | 'potion_refill' | 'gold_bonus';
  item?: AnyCatalogItem;
  potionRefillAmount?: number;
  goldBonusAmount?: number;
}

export interface OwnedRewardInfo {
  skillIds: string[];
  weaponId?: string;
  armorId?: string;
  relicId?: string | null;
  consumableId?: string | null;
  /** Current equipment stats, used to filter strictly-dominated offers. */
  weaponAtk?: number;
  weaponElement?: string;
  armorDef?: number;
  armorMaxHpBonus?: number;
}

export class DropPacingEngine {
  /**
   * A weapon offer is strictly dominated when it is weaker than the current
   * weapon AND shares its element (a different element can still be a
   * useful sidegrade against enemy weaknesses, so those stay offerable).
   */
  static isWeaponDominated(
    candidate: WeaponItem,
    current: { atk: number; element: string }
  ): boolean {
    return candidate.atk < current.atk && candidate.element === current.element;
  }

  /** An armor offer is strictly dominated when both stats are no better and at least one is worse. */
  static isArmorDominated(
    candidate: ArmorItem,
    current: { def: number; maxHpBonus: number }
  ): boolean {
    return (
      candidate.def <= current.def &&
      candidate.maxHpBonus <= current.maxHpBonus &&
      (candidate.def < current.def || candidate.maxHpBonus < current.maxHpBonus)
    );
  }

  /**
   * Generates the 3 floor-clear reward cards per Spec §3.1 and §5.3:
   * - Card 1: Equipment (Weapon OR Armor)
   * - Card 2: Skill (Attack, Heal, Buff, or Debuff)
   * - Card 3: Utility (Relic OR rare ~15% consumable charge on Miniboss / guaranteed on Apex)
   * Standard non-boss floors NEVER offer consumable charges on reward cards.
   */
  static generateFloorRewardCards(
    floorDef: FloorDefinition,
    rng: () => number = Math.random,
    owned?: OwnedRewardInfo
  ): [RewardCard, RewardCard, RewardCard] {
    const isApex = floorDef.floor % 50 === 0;
    const isMiniboss = !isApex && floorDef.floor % 5 === 0;
    const goldBonusAmount = 40 + floorDef.floor;

    const makeGoldCard = (slot: 1 | 2 | 3): RewardCard => ({
      slot,
      title: '黄金の欠片',
      subtitle: `Gold +${goldBonusAmount}`,
      type: 'gold_bonus',
      goldBonusAmount,
    });

    const makeConsumableCard = (consumable: ConsumableItem): RewardCard => ({
      slot: 3,
      title: consumable.name,
      subtitle: `消耗品（最大${consumable.maxCharges}チャージ）`,
      type: 'item',
      item: consumable,
    });

    // Card 1: Equipment
    const rawEquipPool: (WeaponItem | ArmorItem)[] = floorDef.rewardPool.equipmentIds
      .map((id): WeaponItem | ArmorItem | undefined => WEAPON_CATALOG[id] ?? ARMOR_CATALOG[id])
      .filter((x): x is WeaponItem | ArmorItem => Boolean(x));

    let card1: RewardCard;
    if (owned) {
      const filteredEquipPool = rawEquipPool.filter((item) => {
        if (item.id === owned.weaponId || item.id === owned.armorId) return false;
        // Never offer strictly-dominated equipment (feels like a downgrade).
        if (
          item.kind === 'weapon' &&
          owned.weaponAtk !== undefined &&
          owned.weaponElement !== undefined &&
          DropPacingEngine.isWeaponDominated(item, {
            atk: owned.weaponAtk,
            element: owned.weaponElement,
          })
        ) {
          return false;
        }
        if (
          item.kind === 'armor' &&
          owned.armorDef !== undefined &&
          owned.armorMaxHpBonus !== undefined &&
          DropPacingEngine.isArmorDominated(item, {
            def: owned.armorDef,
            maxHpBonus: owned.armorMaxHpBonus,
          })
        ) {
          return false;
        }
        return true;
      });
      if (filteredEquipPool.length === 0) {
        card1 = makeGoldCard(1);
      } else {
        const chosenEquip =
          filteredEquipPool[Math.floor(rng() * filteredEquipPool.length)];
        card1 = {
          slot: 1,
          title: chosenEquip.name,
          subtitle:
            chosenEquip.kind === 'weapon'
              ? `武器 (ATK +${chosenEquip.atk})`
              : `防具 (DEF +${chosenEquip.def} / HP +${chosenEquip.maxHpBonus})`,
          type: 'item',
          item: chosenEquip,
        };
      }
    } else {
      const chosenEquip: WeaponItem | ArmorItem =
        rawEquipPool[Math.floor(rng() * rawEquipPool.length)] ??
        WEAPON_CATALOG.verdant_blade;
      card1 = {
        slot: 1,
        title: chosenEquip.name,
        subtitle:
          chosenEquip.kind === 'weapon'
            ? `武器 (ATK +${chosenEquip.atk})`
            : `防具 (DEF +${chosenEquip.def} / HP +${chosenEquip.maxHpBonus})`,
        type: 'item',
        item: chosenEquip,
      };
    }

    // Card 2: Skill
    const rawSkillPool = floorDef.rewardPool.skillIds
      .map((id) => SKILL_CATALOG[id])
      .filter(Boolean);

    const categoryMap: Record<string, string> = {
      attack: '攻撃技',
      heal: '回復技',
      buff: '強化技',
      debuff: '弱体技',
    };

    let card2: RewardCard;
    if (owned) {
      const ownedSkillSet = new Set(owned.skillIds);
      const filteredSkillPool = rawSkillPool.filter(
        (skill) => !ownedSkillSet.has(skill.id)
      );
      if (filteredSkillPool.length === 0) {
        card2 = makeGoldCard(2);
      } else {
        const chosenSkill =
          filteredSkillPool[Math.floor(rng() * filteredSkillPool.length)];
        card2 = {
          slot: 2,
          title: chosenSkill.name,
          subtitle: `${categoryMap[chosenSkill.category] ?? 'スキル'}（使用回数 ${chosenSkill.maxChargesPerBattle}）`,
          type: 'item',
          item: chosenSkill,
        };
      }
    } else {
      const chosenSkill =
        rawSkillPool[Math.floor(rng() * rawSkillPool.length)] ??
        SKILL_CATALOG.power_slash;
      card2 = {
        slot: 2,
        title: chosenSkill.name,
        subtitle: `${categoryMap[chosenSkill.category] ?? 'スキル'}（使用回数 ${chosenSkill.maxChargesPerBattle}）`,
        type: 'item',
        item: chosenSkill,
      };
    }

    // Card 3: Utility (Strictly enforce consumable scarcity per Spec §3.1)
    let card3: RewardCard;
    if (isApex) {
      card3 = {
        slot: 3,
        title: '領域突破の霊薬充填',
        subtitle: '秘薬 +1回分 補充',
        type: 'potion_refill',
        potionRefillAmount: 1,
      };
    } else if (isMiniboss && rng() < 0.15) {
      card3 = {
        slot: 3,
        title: '希少な秘薬の雫',
        subtitle: '秘薬 +1回分 補充',
        type: 'potion_refill',
        potionRefillAmount: 1,
      };
    } else if (owned) {
      const filteredRelicPool = floorDef.rewardPool.utilityIds
        .map((id) => RELIC_CATALOG[id])
        .filter((r) => Boolean(r) && r.id !== owned.relicId);
      const filteredConsumablePool = (floorDef.rewardPool.consumableIds ?? [])
        .map((id) => CONSUMABLE_CATALOG[id])
        .filter((c) => Boolean(c) && c.id !== owned.consumableId);

      if (isMiniboss && filteredConsumablePool.length > 0 && rng() < 0.3) {
        const chosenConsumable =
          filteredConsumablePool[
            Math.floor(rng() * filteredConsumablePool.length)
          ];
        card3 = makeConsumableCard(chosenConsumable);
      } else if (filteredRelicPool.length > 0) {
        const chosenRelic =
          filteredRelicPool[Math.floor(rng() * filteredRelicPool.length)];
        card3 = {
          slot: 3,
          title: chosenRelic.name,
          subtitle: 'レリック',
          type: 'item',
          item: chosenRelic,
        };
      } else if (filteredConsumablePool.length > 0) {
        const chosenConsumable =
          filteredConsumablePool[
            Math.floor(rng() * filteredConsumablePool.length)
          ];
        card3 = makeConsumableCard(chosenConsumable);
      } else {
        card3 = makeGoldCard(3);
      }
    } else {
      const relicPool = floorDef.rewardPool.utilityIds
        .map((id) => RELIC_CATALOG[id])
        .filter(Boolean);
      const chosenRelic =
        relicPool[Math.floor(rng() * relicPool.length)] ?? RELIC_CATALOG.vampiric_fang_relic;

      card3 = {
        slot: 3,
        title: chosenRelic.name,
        subtitle: 'レリック',
        type: 'item',
        item: chosenRelic,
      };
    }

    return [card1, card2, card3];
  }
}
