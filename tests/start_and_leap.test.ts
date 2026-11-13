import { describe, expect, it } from 'vitest';
import { AreaEngine } from '../src/core/AreaEngine';
import { StorageValidator } from '../src/core/StorageValidator';
import {
  ARMOR_CATALOG,
  SKILL_CATALOG,
  SkillItem,
  STARTING_SKILL_POOL_IDS,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';
import { mulberry32 } from '../src/sim/runSimulation';

describe('createDefaultSave starting skills (2026-11-14 design)', () => {
  it('draws two distinct skills from the starting pool, third slot empty', () => {
    const save = StorageValidator.createDefaultSave(mulberry32(42));
    const [s1, s2, s3] = save.inventory.skills;
    expect(s1).not.toBeNull();
    expect(s2).not.toBeNull();
    expect(s3).toBeNull();
    expect(s1!.id).not.toBe(s2!.id);
    expect(STARTING_SKILL_POOL_IDS).toContain(s1!.id);
    expect(STARTING_SKILL_POOL_IDS).toContain(s2!.id);
  });

  it('is reproducible for a seeded rng and varies across seeds', () => {
    const draw = (seed: number) =>
      StorageValidator.createDefaultSave(mulberry32(seed)).inventory.skills
        .map((s) => s?.id ?? '-')
        .join(',');
    expect(draw(7)).toBe(draw(7));
    const distinct = new Set(
      Array.from({ length: 20 }, (_, i) => draw(i + 1))
    );
    expect(distinct.size).toBeGreaterThan(1);
  });

  it('keeps the rest of the starting kit unchanged', () => {
    const save = StorageValidator.createDefaultSave(mulberry32(1));
    expect(save.inventory.weapon.id).toBe('rusty_shortsword');
    expect(save.inventory.armor.id).toBe('leather_tunic');
    expect(save.inventory.consumable?.id).toBe('crimson_vial');
    expect(save.inventory.relic?.id).toBe('guardian_crest_relic');
  });
});

describe('executeDimensionalLeap skill carry-over (2026-11-14 design)', () => {
  const leapWith = (
    skills: [SkillItem | null, SkillItem | null, SkillItem | null]
  ) =>
    AreaEngine.executeDimensionalLeap({
      clearedFloor: 50,
      weapon: WEAPON_CATALOG.rusty_shortsword,
      armor: ARMOR_CATALOG.leather_tunic,
      skills,
      relicName: 'なし',
      gold: 0,
    });

  it('carries exactly one skill (slot 0) and empties the other slots', () => {
    const leap = leapWith([
      SKILL_CATALOG.power_slash,
      SKILL_CATALOG.aegis_stance,
      SKILL_CATALOG.purifying_light,
    ]);
    expect(leap.normalizedSkills).toEqual([
      SKILL_CATALOG.power_slash,
      null,
      null,
    ]);
    // Weapon/armor normalization is unchanged.
    expect(leap.normalizedWeapon.id).toBe('verdant_blade');
    expect(leap.normalizedArmor.id).toBe('bark_cuirass');
  });

  it('does not duplicate power_slash when it is in slot 0', () => {
    const leap = leapWith([
      SKILL_CATALOG.power_slash,
      SKILL_CATALOG.power_slash,
      null,
    ]);
    const ids = leap.normalizedSkills.filter(Boolean).map((s) => s!.id);
    expect(ids).toEqual(['power_slash']);
  });

  it('falls back to the first non-null skill when slot 0 is empty', () => {
    const leap = leapWith([null, SKILL_CATALOG.frost_lance, null]);
    expect(leap.normalizedSkills).toEqual([
      SKILL_CATALOG.frost_lance,
      null,
      null,
    ]);
  });

  it('carries nothing when all slots are empty', () => {
    const leap = leapWith([null, null, null]);
    expect(leap.normalizedSkills).toEqual([null, null, null]);
  });
});
