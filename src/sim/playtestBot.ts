import {
  BattleSessionState,
  CombatEngine,
  PlayerCommand,
  PlayerLoadout,
} from '../core/CombatEngine';
import { EventExecutionState } from '../core/EventEngine';
import { RewardCard } from '../core/DropPacingEngine';
import { EventOption, GameEventDefinition } from '../extensible/events/types';
import {
  ArmorItem,
  SkillItem,
  WeaponItem,
} from '../extensible/items/itemCatalog';

/**
 * Playtest bot policy: deterministic heuristics a competent player would use.
 * - Focus-fire the lowest-HP living enemy
 * - AoE skills when 2+ enemies stand, finisher skills when they can kill
 * - Opening debuff/buff, heal skill under 45% HP, consumable under 35% HP
 */
export class PlaytestBot {
  static chooseCombatCommand(
    session: BattleSessionState,
    loadout: PlayerLoadout
  ): PlayerCommand {
    const alive = session.enemies
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.currentHp > 0);
    if (alive.length === 0) return { type: 'attack', targetIndex: 0 };

    const hpPct = session.player.currentHp / session.player.maxHp;
    const target = alive.reduce((a, b) => (b.e.currentHp < a.e.currentHp ? b : a));

    // 1. Consumable heal at critical HP
    if (
      loadout.consumable?.healPercent &&
      session.consumableCharges > 0 &&
      hpPct <= 0.35
    ) {
      return { type: 'consumable' };
    }

    // 2. Heal skill when hurt
    const healSlot = PlaytestBot.findSkillSlot(session, loadout, (s) =>
      Boolean(s.healPercent || s.healFlat)
    );
    if (hpPct <= 0.45 && healSlot >= 0) {
      return { type: 'skill', slotIndex: healSlot as 0 | 1 | 2, targetIndex: target.i };
    }

    // 3. AoE skill against a group
    const aoeSlot = PlaytestBot.findSkillSlot(
      session,
      loadout,
      (s) => s.targetScope === 'all_enemies' && Boolean(s.damageMultiplier)
    );
    if (alive.length >= 2 && aoeSlot >= 0) {
      return { type: 'skill', slotIndex: aoeSlot as 0 | 1 | 2, targetIndex: target.i };
    }

    // 4. Cheapest damage skill that finishes the target
    let finisher: { slot: number; mult: number } | null = null;
    loadout.skills.forEach((skill, slot) => {
      if (!skill || session.skillCharges[slot] <= 0) return;
      if (!skill.damageMultiplier || skill.targetScope === 'all_enemies') return;
      const est = CombatEngine.calculateDamage(
        session.player,
        target.e,
        skill.damageMultiplier,
        session.turn
      ).finalHpDamage;
      if (est >= target.e.currentHp && (!finisher || skill.damageMultiplier < finisher.mult)) {
        finisher = { slot, mult: skill.damageMultiplier };
      }
    });
    if (finisher) {
      return {
        type: 'skill',
        slotIndex: (finisher as { slot: number }).slot as 0 | 1 | 2,
        targetIndex: target.i,
      };
    }

    // 5. Opening debuff against a healthy target (first 2 turns)
    const debuffSlot = PlaytestBot.findSkillSlot(
      session,
      loadout,
      (s) => s.applyStatus?.target === 'enemy' && !s.damageMultiplier
    );
    const pureDamageDebuffSlot = PlaytestBot.findSkillSlot(
      session,
      loadout,
      (s) => s.category === 'debuff' && Boolean(s.applyStatus)
    );
    if (
      session.turn <= 2 &&
      target.e.currentHp / target.e.maxHp > 0.7 &&
      (debuffSlot >= 0 || pureDamageDebuffSlot >= 0)
    ) {
      const slot = debuffSlot >= 0 ? debuffSlot : pureDamageDebuffSlot;
      return { type: 'skill', slotIndex: slot as 0 | 1 | 2, targetIndex: target.i };
    }

    // 6. Self-buff (e.g. shield stance) on turn 1 if not already active
    const buffSlot = PlaytestBot.findSkillSlot(
      session,
      loadout,
      (s) => s.applyStatus?.target === 'self'
    );
    if (buffSlot >= 0 && session.turn === 1) {
      const buffStatus = loadout.skills[buffSlot]?.applyStatus?.statusId;
      const alreadyActive = session.player.statuses.some((s) => s.statusId === buffStatus);
      if (!alreadyActive) {
        return { type: 'skill', slotIndex: buffSlot as 0 | 1 | 2, targetIndex: target.i };
      }
    }

    // 7. Strongest damage skill against a bulky target
    let bestDamage: { slot: number; mult: number } | null = null;
    loadout.skills.forEach((skill, slot) => {
      if (!skill || session.skillCharges[slot] <= 0) return;
      if (!skill.damageMultiplier || skill.targetScope === 'all_enemies') return;
      if (!bestDamage || skill.damageMultiplier > bestDamage.mult) {
        bestDamage = { slot, mult: skill.damageMultiplier };
      }
    });
    if (bestDamage && target.e.currentHp >= 60) {
      return {
        type: 'skill',
        slotIndex: (bestDamage as { slot: number }).slot as 0 | 1 | 2,
        targetIndex: target.i,
      };
    }

    // 8. Basic attack on the weakest enemy
    return { type: 'attack', targetIndex: target.i };
  }

  private static findSkillSlot(
    session: BattleSessionState,
    loadout: PlayerLoadout,
    pred: (s: SkillItem) => boolean
  ): number {
    for (let i = 0; i < 3; i++) {
      const s = loadout.skills[i];
      if (s && session.skillCharges[i] > 0 && pred(s)) return i;
    }
    return -1;
  }

  /** Rough power score for comparing skills when slots are full. */
  static skillPower(skill: SkillItem): number {
    return (
      (skill.damageMultiplier ?? 0) * 20 +
      (skill.healPercent ?? 0) * 0.5 +
      (skill.healFlat ?? 0) * 0.2 +
      (skill.applyStatus ? 8 : 0) +
      (skill.cleanse ? 5 : 0) +
      (skill.targetScope === 'all_enemies' ? 6 : 0)
    );
  }

  static chooseEventOption(
    eventDef: GameEventDefinition,
    state: EventExecutionState,
    canAfford: (option: EventOption) => boolean
  ): number {
    const hpPct = state.currentHp / state.maxHp;
    const affordable = eventDef.options
      .map((o, i) => ({ o, i }))
      .filter(({ o }) => canAfford(o));
    if (affordable.length === 0) return -1;

    if (eventDef.isRestEvent) {
      const heal = affordable.find(({ o }) => o.outcome.healHpPercent);
      const refill = affordable.find(({ o }) => o.outcome.refillConsumable);
      if (hpPct <= 0.65 && heal) return heal.i;
      if (state.consumableCharges < state.consumableMaxCharges && refill) return refill.i;
      return (heal ?? affordable[0]).i;
    }

    let best = affordable[0];
    let bestScore = -Infinity;
    for (const cand of affordable) {
      const { outcome, cost } = cand.o;
      let score = 0;
      if (outcome.specificItemId) score += 50;
      if (outcome.grantItemType) score += 30;
      if (outcome.grantGold) score += outcome.grantGold / 5;
      if (outcome.healHpPercent) score += outcome.healHpPercent * (1 - hpPct);
      if (outcome.refillConsumable) {
        score += 15 * (state.consumableMaxCharges - state.consumableCharges);
      }
      if (outcome.cleanseDebuffs) score += 5;
      if (cost?.hpPercent) score -= cost.hpPercent * 1.5;
      if (cost?.gold) score -= cost.gold / 5;
      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    }
    return best.i;
  }

  static chooseRewardCard(
    cards: [RewardCard, RewardCard, RewardCard],
    ctx: {
      weapon: WeaponItem;
      armor: ArmorItem;
      skills: [SkillItem | null, SkillItem | null, SkillItem | null];
      hasRelic: boolean;
      consumableCharges: number;
      consumableMaxCharges: number;
    }
  ): { index: number; action: 'equip' | 'salvage' | 'take' } {
    let bestIdx = 0;
    let bestScore = -Infinity;
    let bestAction: 'equip' | 'salvage' | 'take' = 'take';

    cards.forEach((card, idx) => {
      let score = 0;
      let action: 'equip' | 'salvage' | 'take' = 'salvage';
      if (card.type === 'potion_refill') {
        score = (ctx.consumableMaxCharges - ctx.consumableCharges) * 18;
        action = 'take';
      } else if (card.item?.kind === 'weapon') {
        score = (card.item.atk - ctx.weapon.atk) * 12;
        action = score > 0 ? 'equip' : 'salvage';
        if (action === 'salvage') score = card.item.salvageGold * 0.6;
      } else if (card.item?.kind === 'armor') {
        score =
          (card.item.def - ctx.armor.def) * 8 +
          (card.item.maxHpBonus - ctx.armor.maxHpBonus) * 0.25;
        action = score > 0 ? 'equip' : 'salvage';
        if (action === 'salvage') score = card.item.salvageGold * 0.6;
      } else if (card.item?.kind === 'skill') {
        const empty = ctx.skills.some((s) => s === null);
        if (empty) {
          score = 40;
          action = 'equip';
        } else {
          const weakest = Math.min(
            ...ctx.skills.map((s) => (s ? PlaytestBot.skillPower(s) : 0))
          );
          const delta = PlaytestBot.skillPower(card.item) - weakest;
          if (delta > 5) {
            score = delta;
            action = 'equip';
          } else {
            score = card.item.salvageGold * 0.6;
            action = 'salvage';
          }
        }
      } else if (card.item?.kind === 'relic') {
        if (!ctx.hasRelic) {
          score = 30;
          action = 'equip';
        } else {
          score = card.item.salvageGold * 0.6;
          action = 'salvage';
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
        bestAction = action;
      }
    });

    return { index: bestIdx, action: bestAction };
  }
}
