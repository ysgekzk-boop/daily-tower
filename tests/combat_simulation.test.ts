import { describe, expect, it } from 'vitest';
import { AreaEngine } from '../src/core/AreaEngine';
import { CombatEngine, PlayerLoadout } from '../src/core/CombatEngine';
import { StorageValidator } from '../src/core/StorageValidator';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import {
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';

describe('Combat Engine, Skill Charges & Balance Simulation (Spec §3.2, §4.3, §5.5)', () => {
  const baseLoadout: PlayerLoadout = {
    weapon: WEAPON_CATALOG.rusty_shortsword,
    armor: ARMOR_CATALOG.leather_tunic,
    skills: [
      SKILL_CATALOG.power_slash,
      SKILL_CATALOG.armor_crush,
      SKILL_CATALOG.purifying_light,
    ],
    consumable: CONSUMABLE_CATALOG.crimson_vial,
    relic: RELIC_CATALOG.guardian_crest_relic,
  };

  it('decrements skill battle charges on use and resets on new battle', () => {
    const enemy = ENEMY_REGISTRY.moss_slime;
    let session = CombatEngine.createBattleSession(100, 100, 2, baseLoadout, enemy);
    expect(session.skillCharges[0]).toBe(SKILL_CATALOG.power_slash.maxChargesPerBattle);

    session = CombatEngine.executeTurn(
      session,
      { type: 'skill', slotIndex: 0 },
      baseLoadout,
      undefined,
      () => 0.5
    );
    expect(session.skillCharges[0]).toBe(SKILL_CATALOG.power_slash.maxChargesPerBattle - 1);

    // Next battle session resets charges to max
    const nextBattle = CombatEngine.createBattleSession(
      session.player.currentHp,
      100,
      session.consumableCharges,
      baseLoadout,
      enemy
    );
    expect(nextBattle.skillCharges[0]).toBe(SKILL_CATALOG.power_slash.maxChargesPerBattle);
  });

  it('demonstrates tactical balance: strategic skill usage outperforms basic-attack only against Miniboss', () => {
    const boss = ENEMY_REGISTRY.elder_oak_warden;

    // 1. Basic Attack ONLY simulation (starts at 75 HP entering boss after prior floor battles)
    let basicOnlySession = CombatEngine.createBattleSession(75, 100, 0, baseLoadout, boss, 1.0);
    let safety = 0;
    while (basicOnlySession.status === 'ongoing' && safety < 30) {
      basicOnlySession = CombatEngine.executeTurn(
        basicOnlySession,
        { type: 'attack' },
        baseLoadout,
        undefined,
        () => 0.2
      );
      safety++;
    }

    // 2. Strategic Skill Usage simulation (uses Armor Crush, Power Slash, and Purifying Light)
    // Since the 2026-11-14 heal redesign, heal skills grant regeneration
    // over time instead of an instant burst, so the strategy casts
    // Purifying Light early and handles the pinch with a consumable --
    // burst recovery is the consumables' role now.
    const strategicLoadout = { ...baseLoadout, consumable: CONSUMABLE_CATALOG.crimson_vial };
    let skillSession = CombatEngine.createBattleSession(75, 100, 2, strategicLoadout, boss, 1.0);
    safety = 0;
    while (skillSession.status === 'ongoing' && safety < 30) {
      let cmd:
        | { type: 'attack' }
        | { type: 'consumable' }
        | { type: 'skill'; slotIndex: 0 | 1 | 2 } = { type: 'attack' };

      if (
        skillSession.player.currentHp < 40 &&
        skillSession.consumableCharges > 0
      ) {
        cmd = { type: 'consumable' }; // Burst heal in a pinch
      } else if (skillSession.turn === 1 && skillSession.skillCharges[2] > 0) {
        cmd = { type: 'skill', slotIndex: 2 }; // Regeneration, cast early
      } else if (skillSession.skillCharges[1] > 0 && skillSession.turn <= 3) {
        cmd = { type: 'skill', slotIndex: 1 }; // Armor Crush (DEF debuff)
      } else if (skillSession.skillCharges[0] > 0) {
        cmd = { type: 'skill', slotIndex: 0 }; // Power Slash (1.75x)
      }

      skillSession = CombatEngine.executeTurn(
        skillSession,
        cmd,
        strategicLoadout,
        undefined,
        () => 0.2
      );
      safety++;
    }

    // Basic-attack only fails, whereas strategic skill usage wins!
    expect(basicOnlySession.status).toBe('defeat');
    expect(skillSession.status).toBe('victory');
  });

  it('validates checkpoint formula and self-healing save protocol', () => {
    expect(AreaEngine.calculateRespawnFloor(10)).toBe(7);
    expect(AreaEngine.calculateRespawnFloor(52)).toBe(51); // Never drops below Realm 2 start (51F)

    const corruptedSave = {
      version: 4,
      gold: 500,
      cosmeticGems: 45,
      inventory: {
        weapon: { id: 'non_existent_weapon_999' },
        armor: { id: 'non_existent_armor_999' },
        skills: [{ id: 'broken_skill' }, null, null],
      },
      midFloor: {
        currentFloor: 5,
        currentEncounterIndex: 99, // Out of bounds
        playerCurrentHp: 80,
      },
      archive: [],
    };

    const { save, healed } = StorageValidator.validateAndHeal(corruptedSave);
    expect(healed).toBe(true);
    expect(save.gold).toBe(500);
    expect(save.cosmeticGems).toBe(45);
    expect(save.inventory.weapon.id).toBe('rusty_shortsword');
    expect(save.midFloor.currentEncounterIndex).toBe(0);
  });
});
