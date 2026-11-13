import { describe, expect, it } from 'vitest';
import { DropPacingEngine } from '../src/core/DropPacingEngine';
import { FloorDefinition } from '../src/extensible/realms/realm_01_greenwood';

const makeFloor = (
  floor: number,
  overrides: Partial<FloorDefinition['rewardPool']> = {}
): FloorDefinition => ({
  floor,
  realm: 1,
  title: `第${floor}層`,
  subtitle: 'テスト階層',
  encounters: [{ type: 'battle', enemyId: 'moss_slime' }],
  rewardPool: {
    equipmentIds: ['verdant_blade', 'bark_cuirass'],
    skillIds: ['power_slash', 'flame_burst'],
    utilityIds: ['vampiric_fang_relic', 'guardian_crest_relic'],
    ...overrides,
  },
});

describe('DropPacingEngine owned-item duplicate avoidance', () => {
  it('excludes owned skills from Card 2 with fixed rng', () => {
    const floorDef = makeFloor(1);
    // rng() === 0 would pick index 0 ('power_slash') if not filtered
    const [, card2] = DropPacingEngine.generateFloorRewardCards(
      floorDef,
      () => 0,
      { skillIds: ['power_slash'] }
    );
    expect(card2.type).toBe('item');
    expect(card2.item?.id).toBe('flame_burst');
  });

  it('falls back to gold_bonus on Card 2 when all skills in pool are owned', () => {
    const floorDef = makeFloor(7);
    const [, card2] = DropPacingEngine.generateFloorRewardCards(
      floorDef,
      () => 0.5,
      { skillIds: ['power_slash', 'flame_burst'] }
    );
    expect(card2.type).toBe('gold_bonus');
    expect(card2.goldBonusAmount).toBe(47);
    expect(card2.title).toBe('黄金の欠片');
    expect(card2.subtitle).toBe('Gold +47');
    expect(card2.item).toBeUndefined();
  });

  it('excludes equipped weapon from Card 1 and falls back to gold_bonus when exhausted', () => {
    const floorDef = makeFloor(3);
    // rng() === 0 would pick index 0 ('verdant_blade') if not filtered
    const [card1] = DropPacingEngine.generateFloorRewardCards(
      floorDef,
      () => 0,
      { skillIds: [], weaponId: 'verdant_blade' }
    );
    expect(card1.type).toBe('item');
    expect(card1.item?.id).toBe('bark_cuirass');

    const [exhaustedCard1] = DropPacingEngine.generateFloorRewardCards(
      floorDef,
      () => 0,
      {
        skillIds: [],
        weaponId: 'verdant_blade',
        armorId: 'bark_cuirass',
      }
    );
    expect(exhaustedCard1.type).toBe('gold_bonus');
    expect(exhaustedCard1.goldBonusAmount).toBe(43);
  });

  it('excludes owned relic from Card 3 and falls back to unowned consumableIds when relic pool is exhausted', () => {
    const floorDef = makeFloor(4, {
      utilityIds: ['vampiric_fang_relic'],
      consumableIds: ['crimson_vial', 'ambrosia_flask'],
    });

    // Owned relic is excluded; only 'ambrosia_flask' is unowned in consumableIds
    const [, , card3] = DropPacingEngine.generateFloorRewardCards(
      floorDef,
      () => 0,
      {
        skillIds: [],
        relicId: 'vampiric_fang_relic',
        consumableId: 'crimson_vial',
      }
    );
    expect(card3.type).toBe('item');
    expect(card3.item?.kind).toBe('consumable');
    expect(card3.item?.id).toBe('ambrosia_flask');
    expect(card3.subtitle).toBe('消耗品（最大3チャージ）');

    // If both relic and all consumables are owned, falls back to gold_bonus
    const [, , goldCard3] = DropPacingEngine.generateFloorRewardCards(
      makeFloor(4, {
        utilityIds: ['vampiric_fang_relic'],
        consumableIds: ['crimson_vial'],
      }),
      () => 0,
      {
        skillIds: [],
        relicId: 'vampiric_fang_relic',
        consumableId: 'crimson_vial',
      }
    );
    expect(goldCard3.type).toBe('gold_bonus');
    expect(goldCard3.goldBonusAmount).toBe(44);
  });

  it('offers unowned consumable with 30% chance on miniboss floors when not potion_refill', () => {
    const floorDef = makeFloor(5, {
      utilityIds: ['vampiric_fang_relic'],
      consumableIds: ['ambrosia_flask'],
    });
    // First rng() for Card 1, second for Card 2, third for miniboss 15% potion_refill (>= 0.15),
    // fourth for miniboss 30% consumable (< 0.30), fifth for consumable pick (0)
    const seq = [0, 0, 0.2, 0.2, 0];
    let idx = 0;
    const rng = () => seq[idx++] ?? 0;

    const [, , card3] = DropPacingEngine.generateFloorRewardCards(
      floorDef,
      rng,
      { skillIds: [], consumableId: 'crimson_vial' }
    );
    expect(card3.type).toBe('item');
    expect(card3.item?.id).toBe('ambrosia_flask');
    expect(card3.subtitle).toBe('消耗品（最大3チャージ）');
  });

  it('preserves legacy behavior when owned is omitted', () => {
    const floorDef = makeFloor(1);
    const [card1, card2, card3] = DropPacingEngine.generateFloorRewardCards(
      floorDef,
      () => 0
    );
    expect(card1.type).toBe('item');
    expect(card1.item?.id).toBe('verdant_blade');
    expect(card2.type).toBe('item');
    expect(card2.item?.id).toBe('power_slash');
    expect(card3.type).toBe('item');
    expect(card3.item?.id).toBe('vampiric_fang_relic');
  });

  it('filters strictly-dominated weapons (same element, lower ATK) from Card 1', () => {
    const floorDef = makeFloor(5, {
      equipmentIds: ['rusty_shortsword', 'bark_cuirass'],
    });
    // rng 0 would pick rusty_shortsword (ATK 12 physical) if not filtered;
    // owned weapon is ATK 15 physical, so it is strictly dominated.
    const [card1] = DropPacingEngine.generateFloorRewardCards(floorDef, () => 0, {
      skillIds: [],
      weaponAtk: 15,
      weaponElement: 'physical',
    });
    expect(card1.item?.id).toBe('bark_cuirass');
  });

  it('keeps lower-ATK weapons of a different element as sidegrades', () => {
    const floorDef = makeFloor(5, { equipmentIds: ['verdant_blade'] });
    const [card1] = DropPacingEngine.generateFloorRewardCards(floorDef, () => 0, {
      skillIds: [],
      weaponAtk: 20,
      weaponElement: 'physical',
    });
    expect(card1.type).toBe('item');
    expect(card1.item?.id).toBe('verdant_blade');
  });

  it('filters Pareto-dominated armor from Card 1', () => {
    const floorDef = makeFloor(5, {
      equipmentIds: ['leather_tunic', 'verdant_blade'],
    });
    // leather_tunic (DEF 4 / HP 0) is dominated by owned DEF 7 / HP 25 armor.
    const [card1] = DropPacingEngine.generateFloorRewardCards(floorDef, () => 0, {
      skillIds: [],
      armorDef: 7,
      armorMaxHpBonus: 25,
    });
    expect(card1.item?.id).toBe('verdant_blade');
  });

  it('falls back to gold_bonus when every equipment offer is dominated', () => {
    const floorDef = makeFloor(5, {
      equipmentIds: ['rusty_shortsword', 'leather_tunic'],
    });
    const [card1] = DropPacingEngine.generateFloorRewardCards(floorDef, () => 0, {
      skillIds: [],
      weaponAtk: 15,
      weaponElement: 'physical',
      armorDef: 7,
      armorMaxHpBonus: 25,
    });
    expect(card1.type).toBe('gold_bonus');
  });
});
