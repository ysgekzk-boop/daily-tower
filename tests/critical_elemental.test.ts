import { describe, expect, it } from 'vitest';
import { CombatEngine, CombatantState, PlayerLoadout } from '../src/core/CombatEngine';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import {
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';

describe('Critical Hits and Elemental Affinities (Spec 2/3)', () => {
  const baseAttacker: CombatantState = {
    name: 'テスト攻撃者',
    currentHp: 100,
    maxHp: 100,
    baseAtk: 20,
    baseDef: 5,
    statuses: [],
  };

  const baseDefender: CombatantState = {
    name: 'テスト防御者',
    currentHp: 100,
    maxHp: 100,
    baseAtk: 10,
    baseDef: 5,
    statuses: [],
  };

  it('keeps backward compatibility: calculateDamage without optional rng/options matches baseline', () => {
    // effAtk = 20, effDef = 5 -> baseMitigated = floor(20 - 3.25) = 16
    const result = CombatEngine.calculateDamage(baseAttacker, baseDefender, 1.0, 1);
    expect(result.finalHpDamage).toBe(16);
    expect(result.shieldAbsorbed).toBe(0);
    expect(result.isCrit).toBe(false);
    expect(result.isWeak).toBe(false);
    expect(result.isResist).toBe(false);
  });

  it('applies critical hit multiplier (x1.6) when rng rolls below critChance', () => {
    const alwaysCritRng = () => 0; // 0 < 0.10 -> crit
    const noCritRng = () => 0.99; // 0.99 >= 0.10 -> no crit

    const baseResult = CombatEngine.calculateDamage(baseAttacker, baseDefender, 1.0, 1);
    const baseDamage = baseResult.finalHpDamage;

    // Crit damage: round(baseDamage * 1.6)
    const critResult = CombatEngine.calculateDamage(
      baseAttacker,
      baseDefender,
      1.0,
      1,
      {
        rng: alwaysCritRng,
        critChance: 0.1,
      }
    );
    expect(critResult.isCrit).toBe(true);
    expect(critResult.finalHpDamage).toBe(Math.round(baseDamage * 1.6));

    const nonCritResult = CombatEngine.calculateDamage(
      baseAttacker,
      baseDefender,
      1.0,
      1,
      {
        rng: noCritRng,
        critChance: 0.1,
      }
    );
    expect(nonCritResult.isCrit).toBe(false);
    expect(nonCritResult.finalHpDamage).toBe(baseDamage);
  });

  it('applies elemental weakness multiplier (x1.3) and resistance multiplier (x0.7)', () => {
    const noCritRng = () => 0.99;
    const baseDamage = CombatEngine.calculateDamage(baseAttacker, baseDefender, 1.0, 1).finalHpDamage;

    // Weakness hit: round(baseDamage * 1.3)
    const weakResult = CombatEngine.calculateDamage(
      baseAttacker,
      baseDefender,
      1.0,
      1,
      {
        rng: noCritRng,
        attackElement: 'fire',
        weakness: 'fire',
        resistance: 'nature',
      }
    );
    expect(weakResult.isWeak).toBe(true);
    expect(weakResult.isResist).toBe(false);
    expect(weakResult.finalHpDamage).toBe(Math.round(baseDamage * 1.3));

    // Resistance hit: round(baseDamage * 0.7)
    const resistResult = CombatEngine.calculateDamage(
      baseAttacker,
      baseDefender,
      1.0,
      1,
      {
        rng: noCritRng,
        attackElement: 'nature',
        weakness: 'fire',
        resistance: 'nature',
      }
    );
    expect(resistResult.isWeak).toBe(false);
    expect(resistResult.isResist).toBe(true);
    expect(resistResult.finalHpDamage).toBe(Math.round(baseDamage * 0.7));

    // Neutral hit: x1.0
    const neutralResult = CombatEngine.calculateDamage(
      baseAttacker,
      baseDefender,
      1.0,
      1,
      {
        rng: noCritRng,
        attackElement: 'ice',
        weakness: 'fire',
        resistance: 'nature',
      }
    );
    expect(neutralResult.isWeak).toBe(false);
    expect(neutralResult.isResist).toBe(false);
    expect(neutralResult.finalHpDamage).toBe(baseDamage);
  });

  it('compounds critical hit and weakness (x1.6 * x1.3)', () => {
    const alwaysCritRng = () => 0;
    const baseDamage = CombatEngine.calculateDamage(baseAttacker, baseDefender, 1.0, 1).finalHpDamage;

    // baseDamage * 1.3 * 1.6
    const compoundResult = CombatEngine.calculateDamage(
      baseAttacker,
      baseDefender,
      1.0,
      1,
      {
        rng: alwaysCritRng,
        critChance: 0.1,
        attackElement: 'fire',
        weakness: 'fire',
      }
    );
    expect(compoundResult.isCrit).toBe(true);
    expect(compoundResult.isWeak).toBe(true);
    expect(compoundResult.finalHpDamage).toBe(Math.round(baseDamage * 1.3 * 1.6));
  });

  it('records lastActionFx and outputs descriptive logs in executeTurn', () => {
    // Fire weapon against moss_slime (weakness: fire, resistance: ice)
    const fireWeapon = {
      ...WEAPON_CATALOG.rusty_shortsword,
      atk: 20,
      element: 'fire' as const,
    };
    const loadout: PlayerLoadout = {
      weapon: fireWeapon,
      armor: ARMOR_CATALOG.leather_tunic,
      skills: [SKILL_CATALOG.power_slash, null, null],
      consumable: CONSUMABLE_CATALOG.crimson_vial,
      relic: null,
    };

    const enemy = ENEMY_REGISTRY.moss_slime;
    let session = CombatEngine.createBattleSession(100, 100, 2, loadout, enemy);

    // Turn 1: Always crit + hit weakness
    session = CombatEngine.executeTurn(
      session,
      { type: 'attack' },
      loadout,
      undefined,
      () => 0
    );

    expect(session.lastActionFx).toBeDefined();
    expect(session.lastActionFx?.critTargets).toContain(0);
    expect(session.lastActionFx?.weakTargets).toContain(0);
    expect(session.logs.some((l) => l.includes('会心の一撃！'))).toBe(true);
    expect(session.logs.some((l) => l.includes('弱点を突いた！'))).toBe(true);

    // Turn 2 with ice weapon against ice resistance
    const iceWeapon = {
      ...WEAPON_CATALOG.rusty_shortsword,
      atk: 10,
      element: 'ice' as const,
    };
    const iceLoadout = { ...loadout, weapon: iceWeapon };
    let session2 = CombatEngine.createBattleSession(100, 100, 2, iceLoadout, enemy);

    session2 = CombatEngine.executeTurn(
      session2,
      { type: 'attack' },
      iceLoadout,
      undefined,
      () => 0.99 // No crit
    );
    expect(session2.lastActionFx?.resistTargets).toContain(0);
    expect(session2.lastActionFx?.critTargets).not.toContain(0);
    expect(session2.logs.some((l) => l.includes('耐性により軽減'))).toBe(true);
  });

  it('tracks enemy critical attack on player in lastActionFx.playerCrit', () => {
    const loadout: PlayerLoadout = {
      weapon: WEAPON_CATALOG.rusty_shortsword,
      armor: ARMOR_CATALOG.leather_tunic,
      skills: [null, null, null],
      consumable: null,
      relic: null,
    };
    const enemy = ENEMY_REGISTRY.moss_slime;
    let session = CombatEngine.createBattleSession(100, 100, 0, loadout, enemy);

    // With rng = () => 0, enemy will roll attack action, and critChance: 0.05 will trigger (0 < 0.05)
    session = CombatEngine.executeTurn(
      session,
      { type: 'attack' },
      loadout,
      undefined,
      () => 0
    );
    expect(session.lastActionFx?.playerCrit).toBe(true);
    expect(session.logs.some((l) => l.includes('会心の一撃を受けた！'))).toBe(true);
  });

  it('verifies all registered enemies have both weakness and resistance defined', () => {
    const enemies = Object.values(ENEMY_REGISTRY);
    expect(enemies.length).toBeGreaterThan(0);
    for (const enemy of enemies) {
      expect(enemy.weakness).toBeDefined();
      expect(enemy.resistance).toBeDefined();
      expect(['physical', 'fire', 'ice', 'nature', 'void']).toContain(enemy.weakness);
      expect(['physical', 'fire', 'ice', 'nature', 'void']).toContain(enemy.resistance);
    }
  });
});
