import {
  AnyCatalogItem,
  ARMOR_CATALOG,
  ArmorItem,
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

export class DropPacingEngine {
  /**
   * Generates the 3 floor-clear reward cards per Spec §3.1 and §5.3:
   * - Card 1: Equipment (Weapon OR Armor)
   * - Card 2: Skill (Attack, Heal, Buff, or Debuff)
   * - Card 3: Utility (Relic OR rare ~15% consumable charge on Miniboss / guaranteed on Apex)
   * Standard non-boss floors NEVER offer consumable charges on reward cards.
   */
  static generateFloorRewardCards(
    floorDef: FloorDefinition,
    rng: () => number = Math.random
  ): [RewardCard, RewardCard, RewardCard] {
    const isApex = floorDef.floor % 50 === 0;
    const isMiniboss = !isApex && floorDef.floor % 5 === 0;

    // Card 1: Equipment
    const equipPool: (WeaponItem | ArmorItem)[] = floorDef.rewardPool.equipmentIds
      .map((id): WeaponItem | ArmorItem | undefined => WEAPON_CATALOG[id] ?? ARMOR_CATALOG[id])
      .filter((x): x is WeaponItem | ArmorItem => Boolean(x));
    const chosenEquip: WeaponItem | ArmorItem =
      equipPool[Math.floor(rng() * equipPool.length)] ?? WEAPON_CATALOG.verdant_blade;

    const card1: RewardCard = {
      slot: 1,
      title: chosenEquip.name,
      subtitle:
        chosenEquip.kind === 'weapon'
          ? `武器 (ATK +${chosenEquip.atk})`
          : `防具 (DEF +${chosenEquip.def} / HP +${chosenEquip.maxHpBonus})`,
      type: 'item',
      item: chosenEquip,
    };

    // Card 2: Skill
    const skillPool = floorDef.rewardPool.skillIds
      .map((id) => SKILL_CATALOG[id])
      .filter(Boolean);
    const chosenSkill =
      skillPool[Math.floor(rng() * skillPool.length)] ?? SKILL_CATALOG.power_slash;

    const categoryMap: Record<string, string> = {
      attack: '攻撃技',
      heal: '回復技',
      buff: '強化技',
      debuff: '弱体技',
    };

    const card2: RewardCard = {
      slot: 2,
      title: chosenSkill.name,
      subtitle: `${categoryMap[chosenSkill.category] ?? 'スキル'}（使用回数 ${chosenSkill.maxChargesPerBattle}）`,
      type: 'item',
      item: chosenSkill,
    };

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
