import { describe, expect, it } from 'vitest';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import { PALETTE_REGISTRY, SPRITE_REGISTRY } from '../src/extensible/sprites/spriteRegistry';
import { STATUS_REGISTRY } from '../src/extensible/statusEffects/statusRegistry';

describe('Enemy AI & Phased Behavior Quality Gate (Spec §4.4)', () => {
  const entries = Object.entries(ENEMY_REGISTRY);

  for (const [key, enemy] of entries) {
    describe(`Enemy: ${key}`, () => {
      it('has positive stats and valid sprite/palette references', () => {
        expect(enemy.id).toBe(key);
        expect(enemy.hp).toBeGreaterThan(0);
        expect(enemy.atk).toBeGreaterThan(0);
        expect(enemy.def).toBeGreaterThanOrEqual(0);
        expect(SPRITE_REGISTRY[enemy.spriteId]).toBeDefined();
        expect(PALETTE_REGISTRY[enemy.palette]).toBeDefined();
      });

      it('orders phases descending by hpThresholdPercent starting at 100%', () => {
        expect(enemy.phases.length).toBeGreaterThanOrEqual(2);
        expect(enemy.phases[0].hpThresholdPercent).toBe(100);

        for (let i = 1; i < enemy.phases.length; i++) {
          expect(enemy.phases[i].hpThresholdPercent).toBeLessThan(
            enemy.phases[i - 1].hpThresholdPercent
          );
          expect(enemy.phases[i].hpThresholdPercent).toBeGreaterThan(0);
        }
      });

      it('only uses attack, buff, or debuff (never heals) and references valid statuses', () => {
        for (const phase of enemy.phases) {
          expect(phase.actions.length).toBeGreaterThanOrEqual(1);
          for (const action of phase.actions) {
            expect(['attack', 'buff', 'debuff']).toContain(action.type);
            expect(action.weight).toBeGreaterThan(0);
            if (action.statusId) {
              expect(STATUS_REGISTRY[action.statusId]).toBeDefined();
            }
          }
        }
      });
    });
  }
});
