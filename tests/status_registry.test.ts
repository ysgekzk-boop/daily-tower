import { describe, expect, it } from 'vitest';
import { STATUS_REGISTRY } from '../src/extensible/statusEffects/statusRegistry';
import { LifecyclePhase, StatusContext } from '../src/extensible/statusEffects/types';

const PHASES: LifecyclePhase[] = [
  'turn_start',
  'pre_action',
  'action_resolution',
  'post_action',
  'turn_end',
];

describe('Status Registry Quality Gate (Spec §4.4)', () => {
  const entries = Object.entries(STATUS_REGISTRY);

  it('has at least the core statuses registered', () => {
    expect(entries.length).toBeGreaterThanOrEqual(8);
  });

  for (const [key, def] of entries) {
    describe(`Status: ${key}`, () => {
      it('matches its registry key and has a non-empty name', () => {
        expect(def.id).toBe(key);
        expect(def.name.length).toBeGreaterThan(0);
      });

      it('declares maxValue when stacking is stack_value', () => {
        if (def.stacking === 'stack_value') {
          expect(typeof def.maxValue).toBe('number');
          expect(def.maxValue!).toBeGreaterThan(0);
        }
      });

      it('limits blocksAction duration to 1-2 turns to prevent permanent lock', () => {
        if (def.blocksAction) {
          expect(def.maxDuration).toBeDefined();
          expect(def.maxDuration!).toBeGreaterThanOrEqual(1);
          expect(def.maxDuration!).toBeLessThanOrEqual(2);
        }
      });

      it('has valid counterpartId if paired', () => {
        if (def.counterpartId) {
          const counterpart = STATUS_REGISTRY[def.counterpartId];
          expect(counterpart).toBeDefined();
          expect(counterpart.category).not.toBe(def.category);
        }
      });

      it('executes all registered hooks safely with dummy context', () => {
        const dummyCtx: StatusContext = {
          value: 20,
          duration: 2,
          ownerCurrentHp: 80,
          ownerMaxHp: 100,
          opponentCurrentHp: 80,
          opponentMaxHp: 100,
          turnNumber: 1,
        };

        let hookCount = 0;
        for (const phase of PHASES) {
          const hook = def.hooks[phase];
          if (hook) {
            hookCount++;
            const result = hook(dummyCtx);
            expect(result).toBeDefined();
            expect(typeof result.logMessage).toBe('string');
            expect(result.logMessage.length).toBeGreaterThan(0);
          }
        }
        expect(hookCount).toBeGreaterThanOrEqual(1);
      });
    });
  }
});
