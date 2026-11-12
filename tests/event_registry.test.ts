import { describe, expect, it } from 'vitest';
import { EVENT_REGISTRY } from '../src/extensible/events/eventRegistry';

describe('Event Registry Quality Gate (Spec §5.3 — No Pure-Negative Events)', () => {
  const entries = Object.entries(EVENT_REGISTRY);

  it('contains registered events including rest events', () => {
    expect(entries.length).toBeGreaterThanOrEqual(4);
    const hasRest = entries.some(([, ev]) => ev.isRestEvent);
    expect(hasRest).toBe(true);
  });

  for (const [key, ev] of entries) {
    describe(`Event: ${key}`, () => {
      it('matches its key and has options', () => {
        expect(ev.id).toBe(key);
        expect(ev.options.length).toBeGreaterThanOrEqual(2);
      });

      it('contains at least one free/no-cost option so player is never trapped', () => {
        const hasFreeOption = ev.options.some(
          (opt) => !opt.cost || (!opt.cost.gold && !opt.cost.hpPercent)
        );
        expect(hasFreeOption).toBe(true);
      });

      it('prohibits pure-negative options (every option has a positive outcome)', () => {
        for (const opt of ev.options) {
          const out = opt.outcome;
          const hasPositiveOutcome = Boolean(
            (out.healHpPercent && out.healHpPercent > 0) ||
              (out.refillConsumable && out.refillConsumable > 0) ||
              (out.grantGold && out.grantGold > 0) ||
              out.grantItemType ||
              out.specificItemId ||
              out.cleanseDebuffs
          );
          expect(hasPositiveOutcome).toBe(true);
        }
      });
    });
  }
});
