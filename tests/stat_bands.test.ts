import { describe, expect, it } from 'vitest';
import { ARMOR_CATALOG, WEAPON_CATALOG } from '../src/extensible/items/itemCatalog';
import { ALL_FLOORS } from '../src/extensible/realms/realmIndex';

/**
 * Per-realm 5-floor step stat band caps (AGENT_GUIDE §2.8).
 * step s = ceil(inRealmRelativeFloor / 5), s = 1..10.
 */
const WEAPON_ATK_CAPS_REALM_1 = [16, 16, 18, 19, 21, 22, 23, 24, 26, 27] as const;
const WEAPON_ATK_CAPS_REALM_2_PLUS = [19, 19, 19, 19, 21, 22, 23, 24, 26, 27] as const;

const ARMOR_DEF_CAPS_REALM_1 = [5, 6, 6, 6, 7, 7, 8, 8, 9, 9] as const;
const ARMOR_DEF_CAPS_REALM_2_PLUS = [7, 7, 7, 7, 7, 7, 8, 8, 9, 9] as const;

const ARMOR_HP_CAPS = [30, 30, 35, 40, 43, 48, 52, 58, 62, 68] as const;

const LEAP_ONLY_STARTER_IDS = new Set(['verdant_blade', 'bark_cuirass']);

function getStepCaps(floor: number) {
  const realm = Math.floor((floor - 1) / 50) + 1;
  const relFloor = ((floor - 1) % 50) + 1;
  const step = Math.ceil(relFloor / 5);
  const idx = step - 1;
  return {
    realm,
    step,
    maxAtk: (realm === 1 ? WEAPON_ATK_CAPS_REALM_1 : WEAPON_ATK_CAPS_REALM_2_PLUS)[idx],
    maxDef: (realm === 1 ? ARMOR_DEF_CAPS_REALM_1 : ARMOR_DEF_CAPS_REALM_2_PLUS)[idx],
    maxHp: ARMOR_HP_CAPS[idx],
  };
}

describe('Per-realm 5-floor equipment stat band audit', () => {
  const floors = Object.values(ALL_FLOORS).sort((a, b) => a.floor - b.floor);

  it('covers all authored floors from 1 to at least 103', () => {
    expect(floors[0]?.floor).toBe(1);
    expect(floors[floors.length - 1]?.floor).toBeGreaterThanOrEqual(103);
  });

  it('keeps every floor rewardPool equipment within its realm step caps', () => {
    const violations: string[] = [];
    for (const floorDef of floors) {
      const caps = getStepCaps(floorDef.floor);
      for (const id of floorDef.rewardPool.equipmentIds) {
        const weapon = WEAPON_CATALOG[id];
        if (weapon) {
          if (weapon.atk > caps.maxAtk) {
            violations.push(
              `F${floorDef.floor} (R${caps.realm} step ${caps.step}): weapon ${id} atk=${weapon.atk} > ${caps.maxAtk}`
            );
          }
          continue;
        }
        const armor = ARMOR_CATALOG[id];
        if (armor) {
          if (armor.def > caps.maxDef) {
            violations.push(
              `F${floorDef.floor} (R${caps.realm} step ${caps.step}): armor ${id} def=${armor.def} > ${caps.maxDef}`
            );
          }
          if (armor.maxHpBonus > caps.maxHp) {
            violations.push(
              `F${floorDef.floor} (R${caps.realm} step ${caps.step}): armor ${id} maxHpBonus=${armor.maxHpBonus} > ${caps.maxHp}`
            );
          }
          continue;
        }
        violations.push(`F${floorDef.floor}: unknown equipment id ${id}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('excludes dimensional-leap starter gear (verdant_blade / bark_cuirass) from all reward pools', () => {
    const found: string[] = [];
    for (const floorDef of floors) {
      for (const id of floorDef.rewardPool.equipmentIds) {
        if (LEAP_ONLY_STARTER_IDS.has(id)) {
          found.push(`F${floorDef.floor}: ${id}`);
        }
      }
    }
    expect(found).toEqual([]);
  });
});
