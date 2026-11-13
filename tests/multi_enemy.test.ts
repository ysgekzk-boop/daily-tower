import { describe, expect, it } from 'vitest';
import { CombatEngine, PlayerLoadout } from '../src/core/CombatEngine';
import { FloorRunner } from '../src/core/FloorRunner';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import {
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';
import { FloorDefinition } from '../src/extensible/realms/realm_01_greenwood';

const strongLoadout: PlayerLoadout = {
  weapon: WEAPON_CATALOG.obsidian_reaver, // ATK 27
  armor: ARMOR_CATALOG.leather_tunic,
  skills: [SKILL_CATALOG.flame_wave, SKILL_CATALOG.armor_crush, null],
  consumable: CONSUMABLE_CATALOG.crimson_vial,
  relic: null,
};

const duo = [ENEMY_REGISTRY.moss_slime, ENEMY_REGISTRY.venom_slime];

describe('Multi-enemy battles (enemyIds / target selection / AoE skills)', () => {
  it('builds a session with every enemy and sums the gold reward', () => {
    const session = CombatEngine.createBattleSession(100, 100, 2, strongLoadout, duo);
    expect(session.enemies).toHaveLength(2);
    expect(session.enemies[0].name).toBe(ENEMY_REGISTRY.moss_slime.name);
    expect(session.enemies[1].name).toBe(ENEMY_REGISTRY.venom_slime.name);
    expect(session.totalGoldReward).toBe(
      ENEMY_REGISTRY.moss_slime.goldReward + ENEMY_REGISTRY.venom_slime.goldReward
    );
  });

  it('caps a battle at 3 enemies', () => {
    const session = CombatEngine.createBattleSession(100, 100, 2, strongLoadout, [
      ENEMY_REGISTRY.moss_slime,
      ENEMY_REGISTRY.venom_slime,
      ENEMY_REGISTRY.thorn_goblin,
      ENEMY_REGISTRY.dire_wolf,
    ]);
    expect(session.enemies).toHaveLength(3);
  });

  it('single-target attack damages only the selected enemy', () => {
    let session = CombatEngine.createBattleSession(100, 100, 2, strongLoadout, duo);
    session = CombatEngine.executeTurn(
      session,
      { type: 'attack', targetIndex: 1 },
      strongLoadout,
      undefined,
      () => 0
    );
    expect(session.enemies[0].currentHp).toBe(session.enemies[0].maxHp);
    expect(session.enemies[1].currentHp).toBeLessThan(session.enemies[1].maxHp);
  });

  it('AoE skill (targetScope: all_enemies) damages every living enemy', () => {
    const loadout: PlayerLoadout = {
      ...strongLoadout,
      weapon: WEAPON_CATALOG.rusty_shortsword, // ATK 12 -> 8 dmg each at 0.8x
    };
    let session = CombatEngine.createBattleSession(100, 100, 2, loadout, duo);
    session = CombatEngine.executeTurn(
      session,
      { type: 'skill', slotIndex: 0 },
      loadout,
      undefined,
      () => 0.5
    );
    expect(session.enemies[0].currentHp).toBe(session.enemies[0].maxHp - 8);
    expect(session.enemies[1].currentHp).toBe(session.enemies[1].maxHp - 8);
  });

  it('single-target skill status lands only on the selected enemy', () => {
    let session = CombatEngine.createBattleSession(100, 100, 2, strongLoadout, duo);
    session = CombatEngine.executeTurn(
      session,
      { type: 'skill', slotIndex: 1, targetIndex: 1 }, // armor_crush
      strongLoadout,
      undefined,
      () => 0.5
    );
    expect(
      session.enemies[1].statuses.some((s) => s.statusId === 'def_debuff')
    ).toBe(true);
    expect(
      session.enemies[0].statuses.some((s) => s.statusId === 'def_debuff')
    ).toBe(false);
  });

  it('victory requires every enemy to fall', () => {
    let session = CombatEngine.createBattleSession(100, 100, 0, strongLoadout, duo);
    const rng = () => 0.5;

    session = CombatEngine.executeTurn(session, { type: 'attack', targetIndex: 0 }, strongLoadout, undefined, rng);
    session = CombatEngine.executeTurn(session, { type: 'attack', targetIndex: 0 }, strongLoadout, undefined, rng);
    expect(session.enemies[0].currentHp).toBe(0);
    expect(session.status).toBe('ongoing'); // second enemy still stands

    session = CombatEngine.executeTurn(session, { type: 'attack', targetIndex: 1 }, strongLoadout, undefined, rng);
    expect(session.status).toBe('ongoing');
    session = CombatEngine.executeTurn(session, { type: 'attack', targetIndex: 1 }, strongLoadout, undefined, rng);
    expect(session.status).toBe('ongoing');
    session = CombatEngine.executeTurn(session, { type: 'attack', targetIndex: 1 }, strongLoadout, undefined, rng);
    expect(session.enemies[1].currentHp).toBe(0);
    expect(session.status).toBe('victory');
  });

  it('environmental status is applied to every enemy', () => {
    let session = CombatEngine.createBattleSession(100, 100, 2, strongLoadout, duo);
    session = CombatEngine.executeTurn(
      session,
      { type: 'consumable' },
      strongLoadout,
      { everyNTurns: 1, statusId: 'burn', value: 5, duration: 2 },
      () => 0.5
    );
    for (const enemy of session.enemies) {
      expect(enemy.statuses.some((s) => s.statusId === 'burn')).toBe(true);
    }
  });

  it('FloorRunner resolves enemyIds into multiple enemy definitions', () => {
    const floorDef: FloorDefinition = {
      floor: 999,
      realm: 1,
      title: 'テストフロア',
      subtitle: '複数体テスト',
      encounters: [
        { type: 'battle', enemyIds: ['moss_slime', 'venom_slime'], enemyStatScale: 1.0 },
      ],
      rewardPool: { equipmentIds: [], skillIds: [], utilityIds: [] },
    };
    const resolved = FloorRunner.resolveEncounter(floorDef, 0);
    expect(resolved.kind).toBe('combat');
    if (resolved.kind === 'combat') {
      expect(resolved.enemyDefs.map((d) => d.id)).toEqual(['moss_slime', 'venom_slime']);
    }
  });
});
