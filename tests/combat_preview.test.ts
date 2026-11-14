import { describe, expect, it } from 'vitest';
import { CombatEngine, PlayerLoadout } from '../src/core/CombatEngine';
import { ENEMY_REGISTRY } from '../src/extensible/enemies/enemyRegistry';
import {
  ARMOR_CATALOG,
  CONSUMABLE_CATALOG,
  RELIC_CATALOG,
  SKILL_CATALOG,
  WEAPON_CATALOG,
} from '../src/extensible/items/itemCatalog';
import { computeActionPreview } from '../src/utils/combatPreview';

const makeLoadout = (over: Partial<PlayerLoadout> = {}): PlayerLoadout => ({
  weapon: WEAPON_CATALOG.rusty_shortsword,
  armor: ARMOR_CATALOG.leather_tunic,
  skills: [SKILL_CATALOG.power_slash, null, null],
  consumable: CONSUMABLE_CATALOG.forest_potion ?? null,
  relic: null,
  ...over,
});

describe('computeActionPreview', () => {
  it('previews single-target skill damage, weakness, and lethal status', () => {
    const fireWeapon = Object.values(WEAPON_CATALOG).find((w) => w.element === 'fire')!;
    const lo = makeLoadout({ weapon: fireWeapon });
    // moss_slime has weakness: 'fire'
    const session = CombatEngine.createBattleSession(120, 120, 2, lo, ENEMY_REGISTRY.moss_slime);
    session.enemies[0].currentHp = 10; // low enough to be lethal

    const preview = computeActionPreview(
      session,
      { type: 'skill', slotIndex: 0, targetIndex: 0 },
      lo
    );

    expect(preview).not.toBeNull();
    expect(preview!.enemies).toHaveLength(1);
    expect(preview!.enemies[0].isWeak).toBe(true);
    expect(preview!.enemies[0].isLethal).toBe(true);
    expect(preview!.enemies[0].afterHp).toBe(0);
    expect(preview!.summaryText).toContain('撃破圏内');
  });

  it('previews all_enemies AoE skill across every living enemy', () => {
    const aoeSkill = Object.values(SKILL_CATALOG).find((s) => s.targetScope === 'all_enemies')!;
    const lo = makeLoadout({ skills: [aoeSkill, null, null] });
    const session = CombatEngine.createBattleSession(120, 120, 2, lo, [
      ENEMY_REGISTRY.moss_slime,
      ENEMY_REGISTRY.thorn_goblin,
    ]);

    const preview = computeActionPreview(
      session,
      { type: 'skill', slotIndex: 0, targetIndex: 0 },
      lo
    );

    expect(preview).not.toBeNull();
    expect(preview!.enemies).toHaveLength(2);
    expect(preview!.enemies[0].hpDamage).toBeGreaterThan(0);
    expect(preview!.enemies[1].hpDamage).toBeGreaterThan(0);
  });

  it('previews heal, cleanse, self-buff, and on_skill_use relic effects', () => {
    const healSkill = Object.values(SKILL_CATALOG).find((s) => (s.healPercent ?? 0) > 0)!;
    const venomRelic = RELIC_CATALOG.venom_gland_relic;
    const lo = makeLoadout({
      skills: [healSkill, null, null],
      relic: venomRelic ?? null,
    });
    const session = CombatEngine.createBattleSession(60, 120, 2, lo, ENEMY_REGISTRY.moss_slime);
    session.player.statuses = [{ statusId: 'poison', value: 5, duration: 2 }];

    const preview = computeActionPreview(
      session,
      { type: 'skill', slotIndex: 0, targetIndex: 0 },
      lo
    );

    expect(preview).not.toBeNull();
    expect(preview!.player.healAmount).toBeGreaterThan(0);
    expect(preview!.player.afterHp).toBeGreaterThan(60);
    if (healSkill.cleanse) {
      expect(preview!.player.cleansedCount).toBe(1);
    }
    if (venomRelic) {
      expect(preview!.enemies[0].appliedStatuses.some((s) => s.statusId === 'poison')).toBe(true);
    }
  });
});
