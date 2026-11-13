import { describe, expect, it } from 'vitest';
import { EventEngine } from '../src/core/EventEngine';
import { EventOption } from '../src/extensible/events/types';

const baseState = {
  currentHp: 100,
  maxHp: 100,
  gold: 100,
  consumableCharges: 2,
  consumableMaxCharges: 2,
};

const goldOption: EventOption = {
  id: 'buy_skill',
  label: '黄金を捧げる（スキル習得）',
  description: '黄金を奉納し、新たな秘伝スキルを得る。',
  cost: { gold: 40 },
  outcome: { grantItemType: 'skill', logMessage: 'スキルを得た！' },
};

describe('EventEngine scaled gold costs', () => {
  it('scales base prices by 10-floor blocks', () => {
    expect(EventEngine.scaledGoldCost(40, 1)).toBe(40);
    expect(EventEngine.scaledGoldCost(40, 10)).toBe(40);
    expect(EventEngine.scaledGoldCost(40, 11)).toBe(80);
    expect(EventEngine.scaledGoldCost(45, 51)).toBe(270);
    expect(EventEngine.scaledGoldCost(45, 101)).toBe(495);
  });

  it('affordability uses the scaled cost for the current floor', () => {
    expect(
      EventEngine.canAffordOption({ ...baseState, currentFloor: 1 }, goldOption)
    ).toBe(true);
    // Floor 31: 40 * 4 = 160 > 100 gold
    expect(
      EventEngine.canAffordOption({ ...baseState, currentFloor: 31 }, goldOption)
    ).toBe(false);
  });

  it('resolveOption charges the scaled cost', () => {
    const res = EventEngine.resolveOption(
      { ...baseState, gold: 500, currentFloor: 21 },
      goldOption,
      () => 0
    );
    expect(res.success).toBe(true);
    // Floor 21: 40 * 3 = 120
    expect(res.nextState.gold).toBe(380);
  });
});

describe('EventEngine era-locked grants', () => {
  it('era ids only include items from pools at or below the floor', () => {
    const era3 = EventEngine.eraItemIds(3);
    expect(era3.has('mossfang_blade')).toBe(true);
    expect(era3.has('verdant_blade')).toBe(false);
    expect(EventEngine.eraItemIds(103).has('verdant_blade')).toBe(false);
    // astral_quill debuts in the Floor 102 reward pool (Realm 3)
    expect(era3.has('astral_quill')).toBe(false);
    expect(EventEngine.eraItemIds(103).has('astral_quill')).toBe(true);
  });

  it('pickRandomCatalogItem never grants un-debuted items', () => {
    const era3 = EventEngine.eraItemIds(3);
    let seed = 42;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 200; i++) {
      const item = EventEngine.pickRandomCatalogItem('weapon', rng, 3);
      expect(era3.has(item.id)).toBe(true);
    }
  });

  it('resolveOption grants specificItemId outcomes', () => {
    const opt: EventOption = {
      id: 'gift',
      label: '受け取る',
      description: '特定のアイテムを受け取る。',
      outcome: { specificItemId: 'verdant_blade', logMessage: '武器を得た！' },
    };
    const res = EventEngine.resolveOption({ ...baseState, currentFloor: 5 }, opt, () => 0);
    expect(res.success).toBe(true);
    expect(res.grantedItem?.id).toBe('verdant_blade');
  });
});
