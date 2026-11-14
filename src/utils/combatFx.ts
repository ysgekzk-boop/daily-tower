import { BattleSessionState, PlayerCommand, PlayerLoadout } from '../core/CombatEngine';
import { STATUS_REGISTRY } from '../extensible/statusEffects/statusRegistry';
import { ELEMENT_META } from './elements';

export type HitFxKind = 'damage' | 'heal' | 'shield' | 'critical' | 'weak' | 'resist';

export type HitFxSourceType =
  | 'weapon'
  | 'skill'
  | 'relic'
  | 'burn'
  | 'poison'
  | 'status'
  | 'enemy_attack'
  | 'event'
  | 'heal'
  | 'shield';

export interface HitFxEvent {
  side: 'player' | 'enemy';
  index: number; // enemy index (0 for player)
  amount: number;
  kind: HitFxKind;
  sourceType: HitFxSourceType;
  sourceLabel: string;
  shieldAbsorbed?: number;
  delayMs: number;
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

function findEnemyActionName(
  session: BattleSessionState,
  startIdx: number,
  actionLogMessage: string
): { enemyIndex: number; actionName: string } | null {
  for (let i = startIdx; i < session.enemyDefs.length; i++) {
    const def = session.enemyDefs[i];
    if (!def) continue;
    for (const phase of def.phases) {
      const found = phase.actions.find((a) => a.logMessage === actionLogMessage);
      if (found) {
        return { enemyIndex: i, actionName: found.name };
      }
    }
  }
  // Fallback: search from 0 in case indices shifted
  for (let i = 0; i < session.enemyDefs.length; i++) {
    const def = session.enemyDefs[i];
    if (!def) continue;
    for (const phase of def.phases) {
      const found = phase.actions.find((a) => a.logMessage === actionLogMessage);
      if (found) {
        return { enemyIndex: i, actionName: found.name };
      }
    }
  }
  return null;
}

function parseStatusDotLine(
  line: string
): { sourceType: 'burn' | 'poison' | 'status'; sourceLabel: string; amount: number } | null {
  const burnMatch = line.match(/🔥\s*火傷により\s*(\d+)\s*のダメージを受けた！/);
  if (burnMatch) {
    return {
      sourceType: 'burn',
      sourceLabel: '🔥 火傷',
      amount: Number(burnMatch[1]),
    };
  }
  const poisonMatch = line.match(/☠️\s*猛毒が蝕み\s*(\d+)\s*のダメージ！/);
  if (poisonMatch) {
    return {
      sourceType: 'poison',
      sourceLabel: '☠️ 猛毒',
      amount: Number(poisonMatch[1]),
    };
  }
  for (const def of Object.values(STATUS_REGISTRY)) {
    if (line.includes(def.icon) || line.includes(def.name)) {
      const dmgMatch = line.match(/(\d+)\s*の?ダメージ/);
      if (dmgMatch) {
        return {
          sourceType: 'status',
          sourceLabel: `${def.icon} ${def.name}`,
          amount: Number(dmgMatch[1]),
        };
      }
    }
  }
  return null;
}

/**
 * Extracts explicit per-source HitFx events for a single resolved combat turn
 * by parsing the turn's CombatEngine logs and reconciling against HP deltas.
 */
export function extractTurnHitFx(
  prev: BattleSessionState,
  next: BattleSessionState,
  loadout: PlayerLoadout,
  command?: PlayerCommand
): HitFxEvent[] {
  const events: HitFxEvent[] = [];
  const turnLogs = next.logs.slice(prev.logs.length);

  type Section = 'player_turn_start' | 'player_action' | 'enemy_phase';
  let section: Section = 'player_turn_start';

  let playerDotCount = 0;
  let enemyDotCount = 0;
  let enemyAttackCount = 0;

  let lastPrimaryTargetIdx = resolveTargetIndex(
    prev,
    command && command.type !== 'consumable' ? command.targetIndex : undefined
  );

  // Queue of enemy indices for skill hits (supports both single and all_enemies)
  const skillTargetQueue: number[] = [];
  let activeSkillName = 'スキル';
  if (command?.type === 'skill') {
    const skill = loadout.skills[command.slotIndex];
    if (skill) {
      activeSkillName = skill.name;
      if (skill.targetScope === 'all_enemies') {
        prev.enemies.forEach((e, i) => {
          if (e.currentHp > 0) skillTargetQueue.push(i);
        });
      } else {
        skillTargetQueue.push(lastPrimaryTargetIdx);
      }
    }
  }

  let currentEnemyIdx = 0;
  let currentEnemyActionName: string | undefined;

  const findNextEnemyByName = (name: string, fromIdx: number): number => {
    for (let i = fromIdx; i < next.enemies.length; i++) {
      if (next.enemies[i].name === name && prev.enemies[i]?.currentHp > 0) {
        return i;
      }
    }
    for (let i = 0; i < next.enemies.length; i++) {
      if (next.enemies[i].name === name) return i;
    }
    return fromIdx < next.enemies.length ? fromIdx : 0;
  };

  for (let li = 0; li < turnLogs.length; li++) {
    const line = turnLogs[li];

    // Skip turn header & environmental notice
    if (line.startsWith('──') || line.startsWith('🌋')) {
      continue;
    }

    // Detect section transitions
    if (
      line.startsWith('🗡️') ||
      line.startsWith('✨ スキル発動') ||
      line.startsWith('🧪 消耗品を使用') ||
      line === '❄️ 体が凍りついて動けない！'
    ) {
      section = 'player_action';
    } else if (line.startsWith('👾 ') || line.startsWith('🩸 ')) {
      section = 'enemy_phase';
    } else {
      const bracketMatch = line.match(/^\[(.+?)\]\s+(.+)$/);
      if (bracketMatch && !line.startsWith('[レリック:') && !line.startsWith('[装備:') && bracketMatch[1] !== 'プレイヤー') {
        section = 'enemy_phase';
      }
    }

    if (section === 'player_turn_start') {
      const dot = parseStatusDotLine(line);
      if (dot && dot.amount > 0) {
        events.push({
          side: 'player',
          index: 0,
          amount: dot.amount,
          kind: 'damage',
          sourceType: dot.sourceType,
          sourceLabel: dot.sourceLabel,
          delayMs: playerDotCount * 220,
        });
        playerDotCount++;
      }
      continue;
    }

    if (section === 'player_action') {
      // 1. Weapon normal attack
      const atkMatch = line.match(
        /^🗡️\s+(.+?)で攻撃！\s+(.+?)に\s+(\d+)\s+ダメージ！( \(障壁が(\d+)吸収\))?$/
      );
      if (atkMatch) {
        const weaponName = atkMatch[1];
        const targetName = atkMatch[2];
        const dmg = Number(atkMatch[3]);
        const absorbed = atkMatch[5] ? Number(atkMatch[5]) : 0;
        const ti =
          command?.type === 'attack'
            ? resolveTargetIndex(prev, command.targetIndex)
            : findNextEnemyByName(targetName, 0);
        lastPrimaryTargetIdx = ti;

        let isWeak = false;
        let isResist = false;
        let isCrit = false;
        for (let j = li + 1; j < Math.min(turnLogs.length, li + 4); j++) {
          if (turnLogs[j] === '🎯 弱点を突いた！') isWeak = true;
          else if (turnLogs[j] === '🛡️ 敵の耐性により軽減された！') isResist = true;
          else if (turnLogs[j] === '⚡ 会心の一撃！') isCrit = true;
          else break;
        }

        const elemIcon = ELEMENT_META[loadout.weapon.element]?.icon ?? '🗡️';
        if (dmg === 0 && absorbed > 0) {
          events.push({
            side: 'enemy',
            index: ti,
            amount: absorbed,
            kind: 'shield',
            sourceType: 'shield',
            sourceLabel: `${elemIcon} ${weaponName}（障壁吸収）`,
            delayMs: 0,
          });
        } else if (dmg > 0) {
          const kind: HitFxKind = isCrit
            ? 'critical'
            : isWeak
            ? 'weak'
            : isResist
            ? 'resist'
            : 'damage';
          events.push({
            side: 'enemy',
            index: ti,
            amount: dmg,
            kind,
            sourceType: 'weapon',
            sourceLabel: `${elemIcon} ${weaponName}`,
            shieldAbsorbed: absorbed > 0 ? absorbed : undefined,
            delayMs: 0,
          });
        }
        continue;
      }

      // 2. Skill damage
      const skillDmgMatch = line.match(
        /^💥\s+(.+?)に\s+(\d+)\s+ダメージ！( \(障壁が(\d+)吸収\))?$/
      );
      if (skillDmgMatch) {
        const targetName = skillDmgMatch[1];
        const dmg = Number(skillDmgMatch[2]);
        const absorbed = skillDmgMatch[4] ? Number(skillDmgMatch[4]) : 0;
        const ti =
          skillTargetQueue.length > 0
            ? (skillTargetQueue.shift() as number)
            : findNextEnemyByName(targetName, 0);

        let isWeak = false;
        let isResist = false;
        let isCrit = false;
        for (let j = li + 1; j < Math.min(turnLogs.length, li + 4); j++) {
          if (turnLogs[j] === '🎯 弱点を突いた！') isWeak = true;
          else if (turnLogs[j] === '🛡️ 敵の耐性により軽減された！') isResist = true;
          else if (turnLogs[j] === '⚡ 会心の一撃！') isCrit = true;
          else break;
        }

        if (dmg === 0 && absorbed > 0) {
          events.push({
            side: 'enemy',
            index: ti,
            amount: absorbed,
            kind: 'shield',
            sourceType: 'shield',
            sourceLabel: `✨ ${activeSkillName}（障壁吸収）`,
            delayMs: 0,
          });
        } else if (dmg > 0) {
          const kind: HitFxKind = isCrit
            ? 'critical'
            : isWeak
            ? 'weak'
            : isResist
            ? 'resist'
            : 'damage';
          events.push({
            side: 'enemy',
            index: ti,
            amount: dmg,
            kind,
            sourceType: 'skill',
            sourceLabel: `✨ ${activeSkillName}`,
            shieldAbsorbed: absorbed > 0 ? absorbed : undefined,
            delayMs: 0,
          });
        }
        continue;
      }

      // 3. Skill / Consumable heal
      const skillHealMatch = line.match(/^💚\s+HPを\s+(\d+)\s+回復した！$/);
      if (skillHealMatch) {
        events.push({
          side: 'player',
          index: 0,
          amount: Number(skillHealMatch[1]),
          kind: 'heal',
          sourceType: 'heal',
          sourceLabel: `✨ ${activeSkillName}`,
          delayMs: 0,
        });
        continue;
      }
      const consHealMatch = line.match(/^💚\s+HPが\s+(\d+)\s+回復した！$/);
      if (consHealMatch) {
        const consName = loadout.consumable?.name ?? '秘薬';
        events.push({
          side: 'player',
          index: 0,
          amount: Number(consHealMatch[1]),
          kind: 'heal',
          sourceType: 'heal',
          sourceLabel: `🧪 ${consName}`,
          delayMs: 0,
        });
        continue;
      }

      // 4. Relic / Equipment bonus damage & heal
      const effDmgMatch = line.match(/^\[(レリック|装備):([^\]]+)\].*?追加ダメージ\s+\+(\d+)！$/);
      if (effDmgMatch) {
        const icon = effDmgMatch[1] === 'レリック' ? '📿' : '⚔️';
        events.push({
          side: 'enemy',
          index: lastPrimaryTargetIdx,
          amount: Number(effDmgMatch[3]),
          kind: 'damage',
          sourceType: 'relic',
          sourceLabel: `${icon} ${effDmgMatch[2]}`,
          delayMs: 220,
        });
        continue;
      }
      const effHealMatch = line.match(/^\[(レリック|装備):([^\]]+)\].*?HPを\s+(\d+)\s+(?:吸収)?回復した！$/);
      if (effHealMatch) {
        const icon = effHealMatch[1] === 'レリック' ? '📿' : '⚔️';
        events.push({
          side: 'player',
          index: 0,
          amount: Number(effHealMatch[3]),
          kind: 'heal',
          sourceType: 'heal',
          sourceLabel: `${icon} ${effHealMatch[2]}`,
          delayMs: 220,
        });
        continue;
      }
      continue;
    }

    if (section === 'enemy_phase') {
      // Enemy turn_start status damage: `[EnemyName] 🔥 火傷により X のダメージを受けた！`
      const bracketMatch = line.match(/^\[(.+?)\]\s+(.+)$/);
      if (bracketMatch && bracketMatch[1] !== 'プレイヤー') {
        const enemyName = bracketMatch[1];
        const inner = bracketMatch[2];
        currentEnemyIdx = findNextEnemyByName(enemyName, currentEnemyIdx);
        const dot = parseStatusDotLine(inner);
        if (dot && dot.amount > 0) {
          events.push({
            side: 'enemy',
            index: currentEnemyIdx,
            amount: dot.amount,
            kind: 'damage',
            sourceType: dot.sourceType,
            sourceLabel: dot.sourceLabel,
            delayMs: 520 + enemyDotCount * 160,
          });
          enemyDotCount++;
        }
        continue;
      }

      // Enemy action banner: `👾 <action.logMessage>`
      const actionMatch = line.match(/^👾\s+(.+)$/);
      if (actionMatch) {
        const resolved = findEnemyActionName(next, currentEnemyIdx, actionMatch[1]);
        if (resolved) {
          currentEnemyIdx = resolved.enemyIndex;
          currentEnemyActionName = resolved.actionName;
        } else {
          currentEnemyActionName = undefined;
        }
        continue;
      }

      // Enemy attack damage on player
      const enemyAtkMatch = line.match(
        /^🩸\s+(.+?)の攻撃！\s+プレイヤーに\s+(\d+)\s+ダメージ！( \(障壁が(\d+)吸収\))?$/
      );
      if (enemyAtkMatch) {
        const enemyName = enemyAtkMatch[1];
        const dmg = Number(enemyAtkMatch[2]);
        const absorbed = enemyAtkMatch[4] ? Number(enemyAtkMatch[4]) : 0;
        const isCrit = turnLogs[li + 1] === '⚡ 会心の一撃を受けた！';
        const label = currentEnemyActionName
          ? `👾 ${enemyName}「${currentEnemyActionName}」`
          : `👾 ${enemyName}の攻撃`;
        const delayMs = 700 + enemyAttackCount * 280;
        enemyAttackCount++;

        if (dmg === 0 && absorbed > 0) {
          events.push({
            side: 'player',
            index: 0,
            amount: absorbed,
            kind: 'shield',
            sourceType: 'shield',
            sourceLabel: `${label}（障壁吸収）`,
            delayMs,
          });
        } else if (dmg > 0) {
          events.push({
            side: 'player',
            index: 0,
            amount: dmg,
            kind: isCrit ? 'critical' : 'damage',
            sourceType: 'enemy_attack',
            sourceLabel: label,
            shieldAbsorbed: absorbed > 0 ? absorbed : undefined,
            delayMs,
          });
        }
        currentEnemyActionName = undefined;
        currentEnemyIdx = Math.min(next.enemies.length - 1, currentEnemyIdx + 1);
        continue;
      }
    }
  }

  // Reconciliation fallback: ensure no HP delta goes unrepresented
  next.enemies.forEach((enemy, i) => {
    const before = prev.enemies[i];
    if (!before) return;
    const actualDmg = before.currentHp - enemy.currentHp;
    const accountedDmg = events
      .filter((e) => e.side === 'enemy' && e.index === i && e.kind !== 'heal' && e.kind !== 'shield')
      .reduce((sum, e) => sum + e.amount, 0);
    if (actualDmg > accountedDmg) {
      events.push({
        side: 'enemy',
        index: i,
        amount: actualDmg - accountedDmg,
        kind: 'damage',
        sourceType: 'status',
        sourceLabel: '💥 追加ダメージ',
        delayMs: 0,
      });
    }
  });

  const actualPlayerDelta = prev.player.currentHp - next.player.currentHp;
  if (actualPlayerDelta > 0) {
    const accountedPlayerDmg = events
      .filter((e) => e.side === 'player' && e.kind !== 'heal' && e.kind !== 'shield')
      .reduce((sum, e) => sum + e.amount, 0);
    const accountedPlayerHeal = events
      .filter((e) => e.side === 'player' && e.kind === 'heal')
      .reduce((sum, e) => sum + e.amount, 0);
    const netAccounted = accountedPlayerDmg - accountedPlayerHeal;
    if (actualPlayerDelta > netAccounted && accountedPlayerDmg === 0) {
      events.push({
        side: 'player',
        index: 0,
        amount: actualPlayerDelta - Math.max(0, netAccounted),
        kind: next.lastActionFx?.playerCrit ? 'critical' : 'damage',
        sourceType: 'enemy_attack',
        sourceLabel: '🩸 敵の攻撃',
        delayMs: 700,
      });
    }
  } else if (actualPlayerDelta < 0) {
    const hasHeal = events.some((e) => e.side === 'player' && e.kind === 'heal');
    if (!hasHeal) {
      events.push({
        side: 'player',
        index: 0,
        amount: -actualPlayerDelta,
        kind: 'heal',
        sourceType: 'heal',
        sourceLabel: '💚 回復',
        delayMs: 0,
      });
    }
  }

  return events;
}

function reduceShieldStatus(
  statuses: BattleSessionState['player']['statuses'],
  absorbed: number
): BattleSessionState['player']['statuses'] {
  if (absorbed <= 0) return statuses;
  let remaining = absorbed;
  const next: BattleSessionState['player']['statuses'] = [];
  for (const s of statuses) {
    if (s.statusId === 'shield' && remaining > 0) {
      const take = Math.min(s.value, remaining);
      remaining -= take;
      const left = s.value - take;
      if (left > 0) {
        next.push({ ...s, value: left });
      }
    } else {
      next.push({ ...s });
    }
  }
  return next;
}

/**
 * Applies a single HitFxEvent's HP/shield delta to a displayed BattleSessionState
 * so HP bars, numbers, and shield badges update step-by-step with the FX animation.
 */
export function applyHitFxEventToSession(
  session: BattleSessionState,
  ev: HitFxEvent
): BattleSessionState {
  if (ev.side === 'enemy') {
    const target = session.enemies[ev.index];
    if (!target) return session;
    const nextEnemy = {
      ...target,
      statuses: [...target.statuses],
    };
    if (ev.kind === 'shield') {
      nextEnemy.statuses = reduceShieldStatus(nextEnemy.statuses, ev.amount);
    } else if (ev.kind !== 'heal') {
      nextEnemy.currentHp = Math.max(0, nextEnemy.currentHp - ev.amount);
      if (ev.shieldAbsorbed) {
        nextEnemy.statuses = reduceShieldStatus(nextEnemy.statuses, ev.shieldAbsorbed);
      }
    }
    const nextEnemies = session.enemies.map((e, i) => (i === ev.index ? nextEnemy : e));
    return {
      ...session,
      enemies: nextEnemies,
    };
  }

  const nextPlayer = {
    ...session.player,
    statuses: [...session.player.statuses],
  };
  if (ev.kind === 'heal') {
    nextPlayer.currentHp = Math.min(nextPlayer.maxHp, nextPlayer.currentHp + ev.amount);
  } else if (ev.kind === 'shield') {
    nextPlayer.statuses = reduceShieldStatus(nextPlayer.statuses, ev.amount);
  } else {
    nextPlayer.currentHp = Math.max(0, nextPlayer.currentHp - ev.amount);
    if (ev.shieldAbsorbed) {
      nextPlayer.statuses = reduceShieldStatus(nextPlayer.statuses, ev.shieldAbsorbed);
    }
  }
  return {
    ...session,
    player: nextPlayer,
  };
}

