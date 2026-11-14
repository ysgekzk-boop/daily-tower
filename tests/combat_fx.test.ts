import { describe, expect, it } from 'vitest';
import { CombatEngine, PlayerCommand, PlayerLoadout } from '../src/core/CombatEngine';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import {
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';
import { mulberry32 } from '../src/sim/runSimulation';
import { applyHitFxEventToSession, extractTurnHitFx } from '../src/utils/combatFx';

const makeLoadout = (over: Partial<PlayerLoadout> = {}): PlayerLoadout => ({
  weapon: WEAPON_CATALOG.rusty_shortsword,
  armor: ARMOR_CATALOG.leather_tunic,
  skills: [SKILL_CATALOG.power_slash, null, null],
  consumable: CONSUMABLE_CATALOG.forest_potion ?? null,
  relic: null,
  ...over,
});

describe('extractTurnHitFx (explicit per-source damage presentation)', () => {
  it('separates weapon attack, relic bonus damage, and enemy attack with explicit source labels', () => {
    const lo = makeLoadout({ relic: RELIC_CATALOG.briar_thorn_relic });
    const prev = CombatEngine.createBattleSession(120, 120, 2, lo, ENEMY_REGISTRY.moss_slime);
    const cmd: PlayerCommand = { type: 'attack', targetIndex: 0 };
    const next = CombatEngine.executeTurn(prev, cmd, lo, undefined, mulberry32(7));

    const fx = extractTurnHitFx(prev, next, lo, cmd);

    const weaponFx = fx.find((e) => e.side === 'enemy' && e.sourceType === 'weapon');
    const relicFx = fx.find((e) => e.side === 'enemy' && e.sourceType === 'relic');
    const enemyAtkFx = fx.find((e) => e.side === 'player' && e.sourceType === 'enemy_attack');

    expect(weaponFx).toBeDefined();
    expect(weaponFx?.sourceLabel).toContain(lo.weapon.name);
    expect(weaponFx?.delayMs).toBe(0);

    expect(relicFx).toBeDefined();
    expect(relicFx?.sourceLabel).toContain(RELIC_CATALOG.briar_thorn_relic.name);
    expect(relicFx?.delayMs).toBeGreaterThan(0);

    expect(enemyAtkFx).toBeDefined();
    expect(enemyAtkFx?.sourceLabel).toContain(ENEMY_REGISTRY.moss_slime.name);
    expect(enemyAtkFx?.sourceLabel).toMatch(/「.+」/);
    expect(enemyAtkFx?.delayMs).toBeGreaterThanOrEqual(700);

    // Total enemy damage matches actual HP delta
    const totalEnemyDmg = fx
      .filter((e) => e.side === 'enemy' && e.kind !== 'heal' && e.kind !== 'shield')
      .reduce((s, e) => s + e.amount, 0);
    expect(totalEnemyDmg).toBe(prev.enemies[0].currentHp - next.enemies[0].currentHp);
  });

  it('separates player burn and poison turn-start DoT from enemy retaliation', () => {
    const lo = makeLoadout();
    const prev = CombatEngine.createBattleSession(120, 120, 2, lo, ENEMY_REGISTRY.moss_slime);
    prev.player.statuses = [
      { statusId: 'burn', value: 10, duration: 2 },
      { statusId: 'poison', value: 7, duration: 2 },
    ];
    const cmd: PlayerCommand = { type: 'attack', targetIndex: 0 };
    const next = CombatEngine.executeTurn(prev, cmd, lo, undefined, mulberry32(3));

    const fx = extractTurnHitFx(prev, next, lo, cmd);

    const burnFx = fx.find((e) => e.side === 'player' && e.sourceType === 'burn');
    const poisonFx = fx.find((e) => e.side === 'player' && e.sourceType === 'poison');
    const enemyAtkFx = fx.find((e) => e.side === 'player' && e.sourceType === 'enemy_attack');

    expect(burnFx).toBeDefined();
    expect(burnFx?.sourceLabel).toBe('🔥 火傷');
    expect(burnFx?.amount).toBe(12); // 10% of 120
    expect(burnFx?.delayMs).toBe(0);

    expect(poisonFx).toBeDefined();
    expect(poisonFx?.sourceLabel).toBe('☠️ 猛毒');
    expect(poisonFx?.amount).toBe(7);
    expect(poisonFx?.delayMs).toBeGreaterThan(0);
    expect(poisonFx!.delayMs).toBeLessThan(enemyAtkFx!.delayMs);

    expect(enemyAtkFx).toBeDefined();
    const totalPlayerDmg = fx
      .filter((e) => e.side === 'player' && e.kind !== 'heal' && e.kind !== 'shield')
      .reduce((s, e) => s + e.amount, 0);
    expect(totalPlayerDmg).toBe(prev.player.currentHp - next.player.currentHp);
  });

  it('separates enemy burn/poison DoT from player attack damage', () => {
    const lo = makeLoadout();
    const prev = CombatEngine.createBattleSession(120, 120, 2, lo, ENEMY_REGISTRY.moss_slime);
    prev.enemies[0].statuses = [
      { statusId: 'burn', value: 10, duration: 2 },
      { statusId: 'poison', value: 5, duration: 2 },
    ];
    const cmd: PlayerCommand = { type: 'attack', targetIndex: 0 };
    const next = CombatEngine.executeTurn(prev, cmd, lo, undefined, mulberry32(5));

    const fx = extractTurnHitFx(prev, next, lo, cmd);

    const weaponFx = fx.find((e) => e.side === 'enemy' && e.sourceType === 'weapon');
    const burnFx = fx.find((e) => e.side === 'enemy' && e.sourceType === 'burn');
    const poisonFx = fx.find((e) => e.side === 'enemy' && e.sourceType === 'poison');

    expect(weaponFx).toBeDefined();
    expect(burnFx).toBeDefined();
    expect(burnFx?.sourceLabel).toBe('🔥 火傷');
    expect(burnFx?.delayMs).toBeGreaterThan(0);

    expect(poisonFx).toBeDefined();
    expect(poisonFx?.sourceLabel).toBe('☠️ 猛毒');
    expect(poisonFx?.amount).toBe(5);
    expect(poisonFx?.delayMs).toBeGreaterThan(burnFx!.delayMs);

    const totalEnemyDmg = fx
      .filter((e) => e.side === 'enemy' && e.kind !== 'heal' && e.kind !== 'shield')
      .reduce((s, e) => s + e.amount, 0);
    expect(totalEnemyDmg).toBe(prev.enemies[0].currentHp - next.enemies[0].currentHp);
  });

  it('attributes AoE skill hits and multiple enemy attacks with staggered delays', () => {
    const aoeSkill = Object.values(SKILL_CATALOG).find((s) => s.targetScope === 'all_enemies');
    expect(aoeSkill).toBeDefined();

    const lo = makeLoadout({ skills: [aoeSkill!, null, null] });
    const prev = CombatEngine.createBattleSession(200, 200, 2, lo, [
      ENEMY_REGISTRY.moss_slime,
      ENEMY_REGISTRY.thorn_goblin,
    ]);
    const cmd: PlayerCommand = { type: 'skill', slotIndex: 0, targetIndex: 0 };
    const next = CombatEngine.executeTurn(prev, cmd, lo, undefined, mulberry32(11));

    const fx = extractTurnHitFx(prev, next, lo, cmd);

    const skillHits = fx.filter((e) => e.side === 'enemy' && e.sourceType === 'skill');
    expect(skillHits).toHaveLength(2);
    expect(skillHits[0].index).toBe(0);
    expect(skillHits[1].index).toBe(1);
    expect(skillHits[0].sourceLabel).toContain(aoeSkill!.name);

    const enemyAtks = fx.filter((e) => e.side === 'player' && e.sourceType === 'enemy_attack');
    expect(enemyAtks.length).toBe(2);
    expect(enemyAtks[0].sourceLabel).toContain(ENEMY_REGISTRY.moss_slime.name);
    expect(enemyAtks[1].sourceLabel).toContain(ENEMY_REGISTRY.thorn_goblin.name);
    expect(enemyAtks[1].delayMs).toBeGreaterThan(enemyAtks[0].delayMs);
  });

  it('shows enemy attack source even when 100% absorbed by player shield', () => {
    const lo = makeLoadout();
    const prev = CombatEngine.createBattleSession(120, 120, 2, lo, ENEMY_REGISTRY.moss_slime);
    prev.player.statuses = [{ statusId: 'shield', value: 150, duration: 2 }];
    const cmd: PlayerCommand = { type: 'attack', targetIndex: 0 };
    const next = CombatEngine.executeTurn(prev, cmd, lo, undefined, mulberry32(2));

    const fx = extractTurnHitFx(prev, next, lo, cmd);
    const shieldFx = fx.find((e) => e.side === 'player' && e.kind === 'shield');

    expect(shieldFx).toBeDefined();
    expect(shieldFx?.sourceLabel).toContain(ENEMY_REGISTRY.moss_slime.name);
    expect(shieldFx?.sourceLabel).toContain('障壁吸収');
    expect(shieldFx?.amount).toBeGreaterThan(0);
  });

  it('steps HP and shield values one event at a time via applyHitFxEventToSession', () => {
    const lo = makeLoadout({ relic: RELIC_CATALOG.briar_thorn_relic });
    const prev = CombatEngine.createBattleSession(120, 120, 2, lo, ENEMY_REGISTRY.moss_slime);
    prev.player.statuses = [{ statusId: 'shield', value: 5, duration: 2 }];
    const cmd: PlayerCommand = { type: 'attack', targetIndex: 0 };
    const next = CombatEngine.executeTurn(prev, cmd, lo, undefined, mulberry32(7));
    const events = extractTurnHitFx(prev, next, lo, cmd);

    let stepped = prev;
    const weaponEv = events.find((e) => e.side === 'enemy' && e.sourceType === 'weapon')!;
    const relicEv = events.find((e) => e.side === 'enemy' && e.sourceType === 'relic')!;
    const enemyEv = events.find((e) => e.side === 'player')!;

    stepped = applyHitFxEventToSession(stepped, weaponEv);
    expect(stepped.enemies[0].currentHp).toBe(prev.enemies[0].currentHp - weaponEv.amount);
    expect(stepped.player.currentHp).toBe(prev.player.currentHp);

    stepped = applyHitFxEventToSession(stepped, relicEv);
    expect(stepped.enemies[0].currentHp).toBe(
      prev.enemies[0].currentHp - weaponEv.amount - relicEv.amount
    );

    stepped = applyHitFxEventToSession(stepped, enemyEv);
    expect(stepped.player.currentHp).toBe(next.player.currentHp);
    expect(stepped.player.statuses.find((s) => s.statusId === 'shield')).toBeUndefined();
  });
});
