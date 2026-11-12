import { describe, expect, it } from 'vitest';
import { CombatEngine, PlayerLoadout } from '../src/core/CombatEngine';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import {
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';
import { PlaytestBot } from '../src/sim/playtestBot';
import { formatReport, simulateMany, simulateRun } from '../src/sim/runSimulation';

const loadout: PlayerLoadout = {
  weapon: WEAPON_CATALOG.rusty_shortsword,
  armor: ARMOR_CATALOG.leather_tunic,
  skills: [SKILL_CATALOG.power_slash, SKILL_CATALOG.aegis_stance, SKILL_CATALOG.purifying_light],
  consumable: CONSUMABLE_CATALOG.crimson_vial,
  relic: null,
};

describe('PlaytestBot policy', () => {
  it('targets the lowest-HP living enemy', () => {
    const noDamageSkillLoadout: PlayerLoadout = {
      ...loadout,
      skills: [null, null, SKILL_CATALOG.purifying_light],
    };
    let session = CombatEngine.createBattleSession(100, 100, 2, noDamageSkillLoadout, [
      ENEMY_REGISTRY.moss_slime,
      ENEMY_REGISTRY.venom_slime,
    ]);
    session = {
      ...session,
      turn: 2,
      enemies: session.enemies.map((e, i) => (i === 1 ? { ...e, currentHp: 5 } : e)),
    };
    const cmd = PlaytestBot.chooseCombatCommand(session, noDamageSkillLoadout);
    expect(cmd.type).toBe('attack');
    if (cmd.type === 'attack') expect(cmd.targetIndex).toBe(1);
  });

  it('prefers an AoE skill against multiple enemies', () => {
    const aoeLoadout: PlayerLoadout = {
      ...loadout,
      skills: [SKILL_CATALOG.flame_wave, null, null],
    };
    const session = CombatEngine.createBattleSession(100, 100, 2, aoeLoadout, [
      ENEMY_REGISTRY.moss_slime,
      ENEMY_REGISTRY.venom_slime,
    ]);
    const cmd = PlaytestBot.chooseCombatCommand(session, aoeLoadout);
    expect(cmd.type).toBe('skill');
    if (cmd.type === 'skill') expect(cmd.slotIndex).toBe(0);
  });

  it('uses the consumable at critical HP, then the heal skill when it is gone', () => {
    let session = CombatEngine.createBattleSession(100, 100, 2, loadout, ENEMY_REGISTRY.moss_slime);
    session = { ...session, player: { ...session.player, currentHp: 30 } };
    expect(PlaytestBot.chooseCombatCommand(session, loadout).type).toBe('consumable');

    session = { ...session, consumableCharges: 0, player: { ...session.player, currentHp: 40 } };
    const cmd = PlaytestBot.chooseCombatCommand(session, loadout);
    expect(cmd.type).toBe('skill');
    if (cmd.type === 'skill') expect(cmd.slotIndex).toBe(2); // purifying_light
  });
});

describe('Full-run playtest simulation (floors 1-100)', () => {
  it('terminates every run and makes real progress', () => {
    // Per-seed trajectories shift whenever the item catalog grows (event
    // random grants consume the run's RNG stream) and early-game outcomes
    // are bimodal, so progress is asserted as a share of seeds that get
    // past the opening floors, not on one seed's path or a median.
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let progressed = 0;
    for (const s of seeds) {
      const run = simulateRun(s, 100);
      expect(run.endReason).toBeDefined();
      expect(run.battles).toBeGreaterThan(10);
      if (run.floorsCleared >= 3) progressed++;
    }
    expect(progressed / seeds.length).toBeGreaterThanOrEqual(0.3);
  });

  it('aggregates clear rates and death hotspots across seeds', () => {
    const report = simulateMany([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 100);
    expect(report.runCount).toBe(10);
    expect(report.clearRateByFloor[1]).toBeGreaterThanOrEqual(0.3);
    expect(report.medianFloorsCleared).toBeGreaterThanOrEqual(3);
    expect(report.avgTurnsPerBattle).toBeGreaterThan(1.5);
    expect(report.avgTurnsPerBattle).toBeLessThan(15);
  });

  it('prints the 100-floor balance report', () => {
    const report = simulateMany([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 100);
    const text = formatReport(report);
    console.log('\n' + text);
    expect(text).toContain('Playtest Simulation Report');
    // Every run must terminate (no infinite loops)
    for (const run of report.runs) {
      expect(['cleared', 'death_cap', 'turn_cap']).toContain(run.endReason);
    }
  });
});
