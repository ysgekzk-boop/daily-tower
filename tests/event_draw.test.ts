import { describe, expect, it } from 'vitest';
import { FloorRunner } from '../src/core/FloorRunner';
import { StorageValidator } from '../src/core/StorageValidator';
import { EVENT_REGISTRY } from '../src/extensible/events/eventRegistry';
import { ALL_FLOORS } from '../src/extensible/realms/realmIndex';

function eventIndexOf(floor: number): number {
  const def = ALL_FLOORS[floor];
  return def.encounters.findIndex((e) => e.type === 'event');
}

function drawnEventId(floor: number, seed: number): string {
  const def = ALL_FLOORS[floor];
  const res = FloorRunner.resolveEncounter(def, eventIndexOf(floor), seed);
  if (res.kind !== 'event') throw new Error('not an event encounter');
  return res.eventDef.id;
}

describe('per-floor event draw (2026-11-14)', () => {
  it('without a world seed, returns the authored event', () => {
    const def = ALL_FLOORS[31];
    const res = FloorRunner.resolveEncounter(def, eventIndexOf(31));
    if (res.kind !== 'event') throw new Error('not an event encounter');
    expect(res.eventDef.id).toBe('mossy_ruin_tablet');
  });

  it('rest slots always keep the authored rest event', () => {
    // Find a floor whose authored event is the campfire.
    const restFloor = Object.values(ALL_FLOORS).find((def) =>
      def.encounters.some(
        (e) => e.type === 'event' && e.eventId === 'sanctuary_campfire'
      )
    )!;
    for (let seed = 1; seed <= 50; seed++) {
      expect(drawnEventId(restFloor.floor, seed)).toBe('sanctuary_campfire');
    }
  });

  it('is stable for the same seed and varies across seeds', () => {
    expect(drawnEventId(31, 42)).toBe(drawnEventId(31, 42));
    const seen = new Set(
      Array.from({ length: 200 }, (_, i) => drawnEventId(31, i + 1))
    );
    expect(seen.size).toBeGreaterThanOrEqual(3);
    // Every draw must be a non-rest event from blocks 21-30 or 31-40.
    for (const id of seen) {
      expect(EVENT_REGISTRY[id].category).not.toBe('rest');
    }
  });

  it('block-1 floors draw only from block-1 events', () => {
    const block1Events = new Set<string>();
    for (const def of Object.values(ALL_FLOORS)) {
      if (def.floor > 10) continue;
      for (const e of def.encounters) {
        if (e.type === 'event' && e.eventId) block1Events.add(e.eventId);
      }
    }
    // Use the first non-rest event floor in block 1.
    const floor = Object.values(ALL_FLOORS).find(
      (def) =>
        def.floor <= 10 &&
        def.encounters.some(
          (e) =>
            e.type === 'event' &&
            e.eventId &&
            EVENT_REGISTRY[e.eventId].category !== 'rest'
        )
    )!;
    for (let seed = 1; seed <= 100; seed++) {
      expect(block1Events.has(drawnEventId(floor.floor, seed))).toBe(true);
    }
  });

  it('healing backfills a world seed for pre-seed saves', () => {
    const fresh = StorageValidator.createDefaultSave(() => 0.5);
    const legacy = { ...fresh } as Record<string, unknown>;
    delete legacy.worldSeed;
    const { save } = StorageValidator.validateAndHeal(
      JSON.parse(JSON.stringify(legacy))
    );
    expect(typeof save.worldSeed).toBe('number');
    expect(save.worldSeed!).toBeGreaterThanOrEqual(0);
    // And an existing seed is preserved.
    const withSeed = { ...fresh, worldSeed: 123456 };
    const healed = StorageValidator.validateAndHeal(
      JSON.parse(JSON.stringify(withSeed))
    );
    expect(healed.save.worldSeed).toBe(123456);
  });
});
