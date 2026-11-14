import { BattleSessionState, CombatEngine, PlayerCommand, PlayerLoadout } from '../core/CombatEngine';
import { collectEquippedEffects } from '../extensible/effects/effectRegistry';
import { STATUS_REGISTRY } from '../extensible/statusEffects/statusRegistry';

export interface PreviewStatusBadge {
  statusId: string;
  icon: string;
  name: string;
  value: number;
  duration: number;
}

export interface EnemyActionPreview {
  enemyIndex: number;
  currentHp: number;
  afterHp: number;
  hpDamage: number;
  shieldAbsorbed: number;
  isWeak: boolean;
  isResist: boolean;
  isLethal: boolean;
  appliedStatuses: PreviewStatusBadge[];
}

export interface PlayerActionPreview {
  currentHp: number;
  afterHp: number;
  healAmount: number;
  cleansedCount: number;
  appliedStatuses: PreviewStatusBadge[];
}

export interface CombatActionPreview {
  label: string;
  summaryText: string;
  player: PlayerActionPreview;
  enemies: EnemyActionPreview[];
}

function resolveTargetIndex(session: BattleSessionState, targetIndex?: number): number {
  if (
    targetIndex !== undefined &&
    session.enemies[targetIndex] &&
    session.enemies[targetIndex].currentHp > 0
  ) {
    return targetIndex;
  }
  const idx = session.enemies.findIndex((e) => e.currentHp > 0);
  return idx >= 0 ? idx : 0;
}

function toBadge(statusId: string, value: number, duration: number): PreviewStatusBadge | null {
  const def = STATUS_REGISTRY[statusId];
  if (!def) return null;
  return {
    statusId,
    icon: def.icon,
    name: def.name,
    value,
    duration,
  };
}

/**
 * Computes a deterministic preview of HP, shield, and status changes
 * after executing a skill (or attack/consumable) command.
 */
export function computeActionPreview(
  session: BattleSessionState,
  command: PlayerCommand,
  loadout: PlayerLoadout
): CombatActionPreview | null {
  if (session.status !== 'ongoing') return null;

  const primaryIdx = resolveTargetIndex(
    session,
    command.type === 'consumable' ? undefined : command.targetIndex
  );

  const enemyMap = new Map<number, EnemyActionPreview>();
  const getEnemyPreview = (idx: number): EnemyActionPreview => {
    let entry = enemyMap.get(idx);
    if (!entry) {
      const e = session.enemies[idx];
      entry = {
        enemyIndex: idx,
        currentHp: e.currentHp,
        afterHp: e.currentHp,
        hpDamage: 0,
        shieldAbsorbed: 0,
        isWeak: false,
        isResist: false,
        isLethal: false,
        appliedStatuses: [],
      };
      enemyMap.set(idx, entry);
    }
    return entry;
  };

  const playerPreview: PlayerActionPreview = {
    currentHp: session.player.currentHp,
    afterHp: session.player.currentHp,
    healAmount: 0,
    cleansedCount: 0,
    appliedStatuses: [],
  };

  let label = '';

  if (command.type === 'skill') {
    const skill = loadout.skills[command.slotIndex];
    if (!skill || session.skillCharges[command.slotIndex] <= 0) return null;
    label = `✨ ${skill.name}`;

    const hitsAll = skill.targetScope === 'all_enemies';
    const targetIndices = hitsAll
      ? session.enemies.map((e, i) => (e.currentHp > 0 ? i : -1)).filter((i) => i >= 0)
      : [primaryIdx];

    if (skill.damageMultiplier && skill.damageMultiplier > 0) {
      for (const ti of targetIndices) {
        const target = session.enemies[ti];
        const targetDef = session.enemyDefs[ti];
        if (!target || target.currentHp <= 0) continue;
        const dmgRes = CombatEngine.calculateDamage(
          session.player,
          target,
          skill.damageMultiplier,
          session.turn,
          {
            rng: () => 0.99,
            critChance: 0,
            attackElement: loadout.weapon.element,
            weakness: targetDef?.weakness,
            resistance: targetDef?.resistance,
          }
        );
        const ep = getEnemyPreview(ti);
        ep.hpDamage += dmgRes.finalHpDamage;
        ep.shieldAbsorbed += dmgRes.shieldAbsorbed;
        ep.isWeak = dmgRes.isWeak;
        ep.isResist = dmgRes.isResist;
        ep.afterHp = Math.max(0, ep.currentHp - ep.hpDamage);
        ep.isLethal = ep.afterHp <= 0;
      }
    }

    if (skill.healPercent || skill.healFlat) {
      const rawHeal =
        (skill.healFlat ?? 0) +
        Math.floor((session.player.maxHp * (skill.healPercent ?? 0)) / 100);
      const nextHp = Math.min(session.player.maxHp, playerPreview.afterHp + rawHeal);
      playerPreview.healAmount += nextHp - playerPreview.afterHp;
      playerPreview.afterHp = nextHp;
    }

    if (skill.cleanse) {
      playerPreview.cleansedCount = session.player.statuses.filter((s) => {
        const def = STATUS_REGISTRY[s.statusId];
        return def?.category === 'debuff' && def.cleansable;
      }).length;
    }

    if (skill.applyStatus) {
      const badge = toBadge(
        skill.applyStatus.statusId,
        skill.applyStatus.value,
        skill.applyStatus.duration
      );
      if (badge) {
        if (skill.applyStatus.target === 'self') {
          playerPreview.appliedStatuses.push(badge);
        } else {
          for (const ti of targetIndices) {
            if (session.enemies[ti]?.currentHp > 0) {
              getEnemyPreview(ti).appliedStatuses.push(badge);
            }
          }
        }
      }
    }

    // Include on_skill_use relic/equipment effects
    const primaryTarget = session.enemies[primaryIdx];
    if (primaryTarget && primaryTarget.currentHp > 0) {
      for (const eff of collectEquippedEffects(loadout)) {
        if (eff.trigger !== 'on_skill_use') continue;
        const rRes = eff.handler({
          playerCurrentHp: playerPreview.afterHp,
          playerMaxHp: session.player.maxHp,
          playerAtk: session.player.baseAtk,
          playerDef: session.player.baseDef,
          enemyCurrentHp: primaryTarget.currentHp,
          enemyMaxHp: primaryTarget.maxHp,
          turnNumber: session.turn,
        });
        if (rRes.bonusDamage) {
          const ep = getEnemyPreview(primaryIdx);
          ep.hpDamage += rRes.bonusDamage;
          ep.afterHp = Math.max(0, ep.currentHp - ep.hpDamage);
          ep.isLethal = ep.afterHp <= 0;
        }
        if (rRes.healPlayer) {
          const nextHp = Math.min(session.player.maxHp, playerPreview.afterHp + rRes.healPlayer);
          playerPreview.healAmount += nextHp - playerPreview.afterHp;
          playerPreview.afterHp = nextHp;
        }
        if (rRes.applyStatusToPlayer) {
          const b = toBadge(
            rRes.applyStatusToPlayer.statusId,
            rRes.applyStatusToPlayer.value,
            rRes.applyStatusToPlayer.duration
          );
          if (b) playerPreview.appliedStatuses.push(b);
        }
        if (rRes.applyStatusToEnemy) {
          const b = toBadge(
            rRes.applyStatusToEnemy.statusId,
            rRes.applyStatusToEnemy.value,
            rRes.applyStatusToEnemy.duration
          );
          if (b) getEnemyPreview(primaryIdx).appliedStatuses.push(b);
        }
      }
    }
  } else if (command.type === 'attack') {
    const target = session.enemies[primaryIdx];
    const targetDef = session.enemyDefs[primaryIdx];
    if (!target || target.currentHp <= 0) return null;
    label = `🗡️ ${loadout.weapon.name}`;

    const dmgRes = CombatEngine.calculateDamage(session.player, target, 1.0, session.turn, {
      rng: () => 0.99,
      critChance: 0,
      attackElement: loadout.weapon.element,
      weakness: targetDef?.weakness,
      resistance: targetDef?.resistance,
    });
    const ep = getEnemyPreview(primaryIdx);
    ep.hpDamage = dmgRes.finalHpDamage;
    ep.shieldAbsorbed = dmgRes.shieldAbsorbed;
    ep.isWeak = dmgRes.isWeak;
    ep.isResist = dmgRes.isResist;
    ep.afterHp = Math.max(0, ep.currentHp - ep.hpDamage);
    ep.isLethal = ep.afterHp <= 0;

    for (const eff of collectEquippedEffects(loadout)) {
      if (eff.trigger !== 'on_attack') continue;
      const rRes = eff.handler({
        playerCurrentHp: playerPreview.afterHp,
        playerMaxHp: session.player.maxHp,
        playerAtk: session.player.baseAtk,
        playerDef: session.player.baseDef,
        enemyCurrentHp: ep.afterHp,
        enemyMaxHp: target.maxHp,
        turnNumber: session.turn,
      });
      if (rRes.bonusDamage) {
        ep.hpDamage += rRes.bonusDamage;
        ep.afterHp = Math.max(0, ep.currentHp - ep.hpDamage);
        ep.isLethal = ep.afterHp <= 0;
      }
      if (rRes.healPlayer) {
        const nextHp = Math.min(session.player.maxHp, playerPreview.afterHp + rRes.healPlayer);
        playerPreview.healAmount += nextHp - playerPreview.afterHp;
        playerPreview.afterHp = nextHp;
      }
      if (rRes.applyStatusToPlayer) {
        const b = toBadge(
          rRes.applyStatusToPlayer.statusId,
          rRes.applyStatusToPlayer.value,
          rRes.applyStatusToPlayer.duration
        );
        if (b) playerPreview.appliedStatuses.push(b);
      }
      if (rRes.applyStatusToEnemy) {
        const b = toBadge(
          rRes.applyStatusToEnemy.statusId,
          rRes.applyStatusToEnemy.value,
          rRes.applyStatusToEnemy.duration
        );
        if (b) ep.appliedStatuses.push(b);
      }
    }
  } else if (command.type === 'consumable') {
    const cons = loadout.consumable;
    if (!cons || session.consumableCharges <= 0) return null;
    label = `🧪 ${cons.name}`;
    if (cons.healPercent) {
      const rawHeal = Math.floor((session.player.maxHp * cons.healPercent) / 100);
      const nextHp = Math.min(session.player.maxHp, playerPreview.afterHp + rawHeal);
      playerPreview.healAmount += nextHp - playerPreview.afterHp;
      playerPreview.afterHp = nextHp;
    }
    if (cons.cleanse) {
      playerPreview.cleansedCount = session.player.statuses.filter((s) => {
        const def = STATUS_REGISTRY[s.statusId];
        return def?.category === 'debuff' && def.cleansable;
      }).length;
    }
    if (cons.applyStatus) {
      const b = toBadge(
        cons.applyStatus.statusId,
        cons.applyStatus.value,
        cons.applyStatus.duration
      );
      if (b) playerPreview.appliedStatuses.push(b);
    }
  }

  const enemies = Array.from(enemyMap.values()).sort((a, b) => a.enemyIndex - b.enemyIndex);
  const parts: string[] = [];

  for (const ep of enemies) {
    const name = session.enemies[ep.enemyIndex]?.name ?? '敵';
    const tags: string[] = [];
    if (ep.isWeak) tags.push('弱点');
    if (ep.isResist) tags.push('耐性');
    if (ep.isLethal) tags.push('撃破圏内');
    const tagStr = tags.length > 0 ? `(${tags.join('・')})` : '';
    if (ep.hpDamage > 0 || ep.shieldAbsorbed > 0) {
      parts.push(
        `${enemies.length > 1 ? `${name}: ` : ''}-${ep.hpDamage}HP${
          ep.shieldAbsorbed > 0 ? `(🛡️${ep.shieldAbsorbed}吸収)` : ''
        }${tagStr}`
      );
    }
    for (const st of ep.appliedStatuses) {
      parts.push(`${enemies.length > 1 ? `${name}: ` : ''}+${st.icon}${st.name}(${st.duration}T)`);
    }
  }

  if (playerPreview.healAmount > 0) {
    parts.push(`自分: +${playerPreview.healAmount}HP`);
  }
  if (playerPreview.cleansedCount > 0) {
    parts.push(`デバフ${playerPreview.cleansedCount}個浄化`);
  }
  for (const st of playerPreview.appliedStatuses) {
    parts.push(`自分: +${st.icon}${st.name}(${st.duration}T)`);
  }

  return {
    label,
    summaryText: parts.join(' ／ ') || '効果発動',
    player: playerPreview,
    enemies,
  };
}
