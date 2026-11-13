import { describe, expect, it } from 'vitest';
import { CombatEngine, PlayerLoadout } from '../src/core/CombatEngine';
import { DropPacingEngine } from '../src/core/DropPacingEngine';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import {
  ARMOR_CATALOG,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';
import { mulberry32 } from '../src/sim/runSimulation';

const loadout = (over: Partial<PlayerLoadout>): PlayerLoadout => ({
  weapon: WEAPON_CATALOG.rusty_shortsword,
  armor: ARMOR_CATALOG.leather_tunic,
  skills: [SKILL_CATALOG.power_slash, null, null],
  consumable: null,
  relic: null,
  ...over,
});

describe('equipment effects wiring (2026-11-14)', () => {
  it('weapon on_attack effect applies burn to the attacked enemy', () => {
    const lo = loadout({ weapon: WEAPON_CATALOG.emberbrand_shortsword });
    let s = CombatEngine.createBattleSession(
      200,
      200,
      2,
      lo,
      ENEMY_REGISTRY.moss_slime
    );
    s = CombatEngine.executeTurn(s, { type: 'attack' }, lo, undefined, mulberry32(1));
    expect(
      s.enemies[0].statuses.some((st) => st.statusId === 'burn')
    ).toBe(true);
  });

  it('armor atkDelta persistently lowers the session base attack', () => {
    const lo = loadout({ armor: ARMOR_CATALOG.oathbound_plate });
    const s = CombatEngine.createBattleSession(
      200,
      262,
      2,
      lo,
      ENEMY_REGISTRY.moss_slime
    );
    // rusty_shortsword ATK 12 + oathbound atkDelta -5 = 7, as a gear
    // property (no status instance involved).
    expect(s.player.baseAtk).toBe(7);
    expect(
      s.player.statuses.some((st) => st.statusId === 'atk_debuff')
    ).toBe(false);
    const plain = CombatEngine.createBattleSession(
      200,
      200,
      2,
      loadout({}),
      ENEMY_REGISTRY.moss_slime
    );
    expect(plain.player.baseAtk).toBe(12);
  });

  it('dewdrinker heals on attack only while below half HP', () => {
    const lo = loadout({ weapon: WEAPON_CATALOG.dewdrinker_rapier });
    let s = CombatEngine.createBattleSession(
      40,
      200,
      2,
      lo,
      ENEMY_REGISTRY.moss_slime
    );
    const hpBefore = s.player.currentHp;
    s = CombatEngine.executeTurn(s, { type: 'attack' }, lo, undefined, mulberry32(2));
    // Enemy may hit back; the heal is verified through the effect log.
    expect(
      s.logs.some((l) => l.includes('雫吸いの細剣'))
    ).toBe(true);
    expect(hpBefore).toBe(40);
  });

  it('relic bonusDamage on attack now lands (briar_thorn fix)', () => {
    const lo = loadout({ relic: RELIC_CATALOG.briar_thorn_relic });
    let s = CombatEngine.createBattleSession(
      500,
      500,
      2,
      lo,
      ENEMY_REGISTRY.moss_slime,
      10
    );
    s = CombatEngine.executeTurn(s, { type: 'attack' }, lo, undefined, mulberry32(7));
    const attackLog = s.logs.find((l) => l.includes('で攻撃！'));
    const mainDmg = Number(attackLog?.match(/(\d+) ダメージ/)?.[1]);
    expect(s.logs.some((l) => l.includes('茨棘の腕輪'))).toBe(true);
    // HP loss must equal the main hit plus the briar bonus
    // (max(2, floor(weaponAtk 12 * 0.12)) = 2). Before the fix the
    // bonus was logged but never subtracted from the enemy's HP.
    expect(s.enemies[0].maxHp - s.enemies[0].currentHp).toBe(mainDmg + 2);
  });

  it('relic applyStatusToPlayer on skill use now lands (steam_cog fix)', () => {
    const lo = loadout({ relic: RELIC_CATALOG.steam_cog_regulator_relic });
    let s = CombatEngine.createBattleSession(
      300,
      300,
      2,
      lo,
      ENEMY_REGISTRY.moss_slime
    );
    s = CombatEngine.executeTurn(
      s,
      { type: 'skill', slotIndex: 0 },
      lo,
      undefined,
      mulberry32(3)
    );
    expect(
      s.player.statuses.some((st) => st.statusId === 'def_buff')
    ).toBe(true);
  });

  it('effect-bearing gear is never dominated by raw stats', () => {
    expect(
      DropPacingEngine.isWeaponDominated(WEAPON_CATALOG.emberbrand_shortsword, {
        atk: 24,
        element: 'fire',
      })
    ).toBe(false);
    // The atkDelta armor is NOT dominance-protected: against strictly
    // better raw stats it is a genuine downgrade (its cost is priced by
    // the bot's reward scoring instead).
    expect(
      DropPacingEngine.isArmorDominated(ARMOR_CATALOG.oathbound_plate, {
        def: 9,
        maxHpBonus: 65,
      })
    ).toBe(true);
    // Plain gear keeps the old behavior.
    expect(
      DropPacingEngine.isWeaponDominated(WEAPON_CATALOG.mossfang_blade, {
        atk: 24,
        element: 'nature',
      })
    ).toBe(true);
  });
});
