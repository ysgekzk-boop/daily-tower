import { describe, expect, it } from 'vitest';
import { DropPacingEngine } from '../src/core/DropPacingEngine';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import { EVENT_REGISTRY } from '../src/extensible/events/eventRegistry';
import { REALM_01_FLOORS } from '../src/extensible/realms/realm_01_greenwood';
import { REALM_02_FLOORS } from '../src/extensible/realms/realm_02_volcano';

describe('Floor Structure & Pacing Quality Gate (Spec §3.1, §5.2)', () => {
  const allFloors = [...REALM_01_FLOORS, ...REALM_02_FLOORS];

  it('defines 100 floors across Realm 1 and Realm 2', () => {
    expect(allFloors.length).toBe(100);
  });

  it('validates encounter composition rules for every floor', () => {
    for (const f of allFloors) {
      const isApex = f.floor % 50 === 0;
      const isMiniboss = !isApex && f.floor % 5 === 0;
      const encs = f.encounters;

      // Every enemyId and eventId must exist in registries
      for (const e of encs) {
        if (e.type === 'event') {
          expect(e.eventId).toBeDefined();
          expect(EVENT_REGISTRY[e.eventId!]).toBeDefined();
        } else if (e.enemyIds && e.enemyIds.length > 0) {
          // Multi-enemy battle: 1-3 enemies, all must exist; bosses stay solo
          expect(e.enemyIds.length).toBeLessThanOrEqual(3);
          for (const id of e.enemyIds) {
            expect(ENEMY_REGISTRY[id]).toBeDefined();
          }
          if (e.type === 'miniboss' || e.type === 'apex_boss') {
            expect(e.enemyIds.length).toBe(1);
          }
        } else {
          expect(e.enemyId).toBeDefined();
          expect(ENEMY_REGISTRY[e.enemyId!]).toBeDefined();
        }
      }

      if (isApex) {
        expect(encs[encs.length - 1].type).toBe('apex_boss');
        const events = encs.filter((e) => e.type === 'event');
        expect(events.length).toBe(1);
      } else if (isMiniboss) {
        expect(encs[encs.length - 1].type).toBe('miniboss');
        const battles = encs.filter((e) => e.type === 'battle');
        expect(battles.length).toBeGreaterThanOrEqual(2);
        expect(battles.length).toBeLessThanOrEqual(3);
      } else {
        // Standard floor: 3-5 battles + 1 event, event never first or last
        const battles = encs.filter((e) => e.type === 'battle');
        const events = encs.filter((e) => e.type === 'event');
        expect(battles.length).toBeGreaterThanOrEqual(3);
        expect(battles.length).toBeLessThanOrEqual(5);
        expect(events.length).toBe(1);
        expect(encs[0].type).not.toBe('event');
        expect(encs[encs.length - 1].type).not.toBe('event');
      }
    }
  });

  it('guarantees at least one Rest Event within any 5 consecutive floors', () => {
    for (let i = 0; i <= allFloors.length - 5; i++) {
      const window = allFloors.slice(i, i + 5);
      const hasRestInWindow = window.some((f) =>
        f.encounters.some(
          (e) => e.type === 'event' && e.eventId && EVENT_REGISTRY[e.eventId]?.isRestEvent
        )
      );
      expect(hasRestInWindow).toBe(true);
    }
  });

  it('prohibits routine consumable drops on standard floors (Spec §3.1)', () => {
    const standardFloor = allFloors.find((f) => f.floor === 1)!;
    for (let i = 0; i < 20; i++) {
      const cards = DropPacingEngine.generateFloorRewardCards(standardFloor, () => 0.01);
      for (const c of cards) {
        expect(c.type).not.toBe('potion_refill');
      }
    }
  });
});
