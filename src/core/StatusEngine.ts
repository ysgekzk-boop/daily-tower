import { STATUS_REGISTRY } from '../extensible/statusEffects/statusRegistry';
import {
  ActiveStatusInstance,
  LifecyclePhase,
  StatusContext,
  StatusResult,
} from '../extensible/statusEffects/types';

export interface PhaseExecutionSummary {
  totalDamage: number;
  totalHeal: number;
  skipAction: boolean;
  flatAtkBonus: number;
  flatDefBonus: number;
  atkRateBonus: number;
  defRateBonus: number;
  outgoingMultiplier: number;
  incomingMultiplier: number;
  totalShieldAbsorb: number;
  logs: string[];
}

export class StatusEngine {
  /**
   * Apply a status instance according to its registered stacking rule.
   * Unknown status IDs are ignored safely.
   */
  static applyStatus(
    currentList: ActiveStatusInstance[],
    incoming: ActiveStatusInstance
  ): { nextList: ActiveStatusInstance[]; log?: string } {
    const def = STATUS_REGISTRY[incoming.statusId];
    if (!def) {
      return { nextList: currentList };
    }

    const list = currentList.map((s) => ({ ...s }));
    const existingIdx = list.findIndex((s) => s.statusId === incoming.statusId);

    const clampDuration = (d: number) =>
      def.maxDuration ? Math.min(def.maxDuration, Math.max(1, d)) : Math.max(1, d);
    const clampValue = (v: number) =>
      def.maxValue ? Math.min(def.maxValue, Math.max(0, v)) : Math.max(0, v);

    if (existingIdx === -1) {
      list.push({
        statusId: incoming.statusId,
        value: clampValue(incoming.value),
        duration: clampDuration(incoming.duration),
      });
      return {
        nextList: list,
        log: `${def.icon} ${def.name} が付与された (${clampDuration(incoming.duration)}T)`,
      };
    }

    const existing = list[existingIdx];
    switch (def.stacking) {
      case 'refresh':
        existing.value = clampValue(incoming.value);
        existing.duration = clampDuration(incoming.duration);
        break;
      case 'stack_value':
        existing.value = clampValue(existing.value + incoming.value);
        existing.duration = Math.max(existing.duration, clampDuration(incoming.duration));
        break;
      case 'extend_duration':
        existing.value = Math.max(existing.value, clampValue(incoming.value));
        existing.duration = clampDuration(existing.duration + incoming.duration);
        break;
      case 'none':
        if (incoming.duration > existing.duration) {
          existing.duration = clampDuration(incoming.duration);
        }
        break;
    }

    return {
      nextList: list,
      log: `${def.icon} ${def.name} が更新された (効果値:${existing.value}, 残り${existing.duration}T)`,
    };
  }

  /**
   * Remove all cleansable debuffs.
   */
  static cleanseDebuffs(currentList: ActiveStatusInstance[]): {
    nextList: ActiveStatusInstance[];
    removedCount: number;
  } {
    let removedCount = 0;
    const nextList = currentList.filter((s) => {
      const def = STATUS_REGISTRY[s.statusId];
      if (!def) return false;
      if (def.category === 'debuff' && def.cleansable) {
        removedCount++;
        return false;
      }
      return true;
    });
    return { nextList, removedCount };
  }

  /**
   * Run hooks for a given lifecycle phase across all active statuses.
   */
  static runPhase(
    phase: LifecyclePhase,
    statuses: ActiveStatusInstance[],
    ctxBase: Omit<StatusContext, 'value' | 'duration'>
  ): PhaseExecutionSummary {
    const summary: PhaseExecutionSummary = {
      totalDamage: 0,
      totalHeal: 0,
      skipAction: false,
      flatAtkBonus: 0,
      flatDefBonus: 0,
      atkRateBonus: 0,
      defRateBonus: 0,
      outgoingMultiplier: 1.0,
      incomingMultiplier: 1.0,
      totalShieldAbsorb: 0,
      logs: [],
    };

    for (const instance of statuses) {
      const def = STATUS_REGISTRY[instance.statusId];
      if (!def) continue;

      if (phase === 'pre_action' && def.blocksAction) {
        summary.skipAction = true;
      }

      const hook = def.hooks[phase];
      if (!hook) continue;

      const res: StatusResult = hook({
        ...ctxBase,
        value: instance.value,
        duration: instance.duration,
      });

      if (res.damageDealt && res.damageDealt > 0) {
        summary.totalDamage += res.damageDealt;
      }
      if (res.healAmount && res.healAmount > 0) {
        summary.totalHeal += res.healAmount;
      }
      if (res.skipAction) {
        summary.skipAction = true;
      }
      if (typeof res.flatAtkModifier === 'number') {
        summary.flatAtkBonus += res.flatAtkModifier;
      }
      if (typeof res.flatDefModifier === 'number') {
        summary.flatDefBonus += res.flatDefModifier;
      }
      if (typeof res.atkRateModifier === 'number') {
        summary.atkRateBonus += res.atkRateModifier;
      }
      if (typeof res.defRateModifier === 'number') {
        summary.defRateBonus += res.defRateModifier;
      }
      if (typeof res.outgoingDamageMultiplier === 'number') {
        summary.outgoingMultiplier *= res.outgoingDamageMultiplier;
      }
      if (typeof res.incomingDamageMultiplier === 'number') {
        summary.incomingMultiplier *= res.incomingDamageMultiplier;
      }
      if (typeof res.absorbAmount === 'number' && res.absorbAmount > 0) {
        summary.totalShieldAbsorb += res.absorbAmount;
      }
      if (res.logMessage && (phase === 'turn_start' || phase === 'pre_action')) {
        summary.logs.push(`${def.icon} ${res.logMessage}`);
      }
    }

    return summary;
  }

  /**
   * Consume absorption-pool status points (definitions flagged absorbPool,
   * e.g. shield) when absorbing damage. Core never names a status ID.
   */
  static consumeShield(
    statuses: ActiveStatusInstance[],
    incomingDamage: number
  ): {
    remainingDamage: number;
    absorbed: number;
    nextStatuses: ActiveStatusInstance[];
  } {
    let remaining = incomingDamage;
    let absorbed = 0;
    const nextStatuses: ActiveStatusInstance[] = [];

    for (const s of statuses) {
      const def = STATUS_REGISTRY[s.statusId];
      if (def?.absorbPool && remaining > 0) {
        const take = Math.min(s.value, remaining);
        remaining -= take;
        absorbed += take;
        const left = s.value - take;
        if (left > 0) {
          nextStatuses.push({ ...s, value: left });
        }
      } else {
        nextStatuses.push({ ...s });
      }
    }

    return { remainingDamage: remaining, absorbed, nextStatuses };
  }

  /**
   * Decay status durations at turn_end and remove expired instances.
   */
  static tickTurnEnd(statuses: ActiveStatusInstance[]): {
    nextStatuses: ActiveStatusInstance[];
    expiredLogs: string[];
  } {
    const nextStatuses: ActiveStatusInstance[] = [];
    const expiredLogs: string[] = [];

    for (const s of statuses) {
      const def = STATUS_REGISTRY[s.statusId];
      if (!def) continue;

      const nextDuration = s.duration - 1;
      if (nextDuration <= 0) {
        expiredLogs.push(`${def.icon} ${def.name} の効果が切れた。`);
      } else {
        nextStatuses.push({ ...s, duration: nextDuration });
      }
    }

    return { nextStatuses, expiredLogs };
  }
}
