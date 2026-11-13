import { ENEMY_REGISTRY } from '../extensible/enemies/enemyRegistry';
import { EnemyDefinition } from '../extensible/enemies/types';
import { EVENT_REGISTRY } from '../extensible/events/eventRegistry';
import { GameEventDefinition } from '../extensible/events/types';
import { Encounter, FloorDefinition } from '../extensible/realms/realm_01_greenwood';
import {
  ALL_FLOORS,
  getFloorDefinition,
} from '../extensible/realms/realmIndex';

/**
 * Non-rest event pools by 10-floor block, derived from the authored
 * floor data (an event's "home" floors are where it is authored).
 * Built lazily on first use.
 */
let blockEventPoolsCache: Map<number, string[]> | null = null;

function nonRestEventPoolForFloor(floor: number): string[] {
  if (!blockEventPoolsCache) {
    const byBlock = new Map<number, Set<string>>();
    for (const def of Object.values(ALL_FLOORS)) {
      const block = Math.floor((def.floor - 1) / 10);
      for (const enc of def.encounters) {
        if (enc.type !== 'event' || !enc.eventId) continue;
        const ev = EVENT_REGISTRY[enc.eventId];
        if (!ev || ev.category === 'rest') continue;
        if (!byBlock.has(block)) byBlock.set(block, new Set());
        byBlock.get(block)!.add(enc.eventId);
      }
    }
    blockEventPoolsCache = new Map(
      [...byBlock.entries()].map(([b, s]) => [b, [...s].sort()])
    );
  }
  // Own block + previous block, mirroring the reward-pool design.
  const block = Math.floor((floor - 1) / 10);
  const ids = new Set<string>(blockEventPoolsCache.get(block) ?? []);
  if (block > 0) {
    for (const id of blockEventPoolsCache.get(block - 1) ?? []) ids.add(id);
  }
  return [...ids].sort();
}

/** Deterministic [0,1) roll for (worldSeed, floor, encounterIndex). */
function seededEventRoll(
  worldSeed: number,
  floor: number,
  encounterIndex: number
): number {
  let h =
    (worldSeed >>> 0) ^
    Math.imul(floor, 2654435761) ^
    Math.imul(encounterIndex + 1, 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export type ResolvedEncounter =
  | {
      kind: 'combat';
      encounterIndex: number;
      totalEncounters: number;
      encounterType: 'battle' | 'miniboss' | 'apex_boss';
      enemyDefs: EnemyDefinition[];
      statScale: number;
    }
  | {
      kind: 'event';
      encounterIndex: number;
      totalEncounters: number;
      eventDef: GameEventDefinition;
    };

export class FloorRunner {
  static getFloor(floorNumber: number): FloorDefinition {
    return getFloorDefinition(floorNumber);
  }

  static resolveEncounter(
    floorDef: FloorDefinition,
    index: number,
    worldSeed?: number
  ): ResolvedEncounter {
    const safeIndex = Math.max(0, Math.min(floorDef.encounters.length - 1, index));
    const enc: Encounter = floorDef.encounters[safeIndex];

    if (enc.type === 'event') {
      const authored =
        (enc.eventId && EVENT_REGISTRY[enc.eventId]) || EVENT_REGISTRY.sanctuary_campfire;
      let eventDef = authored;
      // Event draw (2026-11-14): with a world seed, a non-rest event
      // slot draws from its era pool (own 10-floor block + previous
      // block) instead of always showing the authored event. Rest
      // slots keep the authored event so the rest cadence that carries
      // the game's sustain rhythm is unchanged. The draw is a pure
      // function of (worldSeed, floor, encounterIndex), so it is
      // stable across renders and reloads but differs per save.
      if (worldSeed !== undefined && authored.category !== 'rest') {
        const pool = nonRestEventPoolForFloor(floorDef.floor);
        if (pool.length > 0) {
          const roll = seededEventRoll(worldSeed, floorDef.floor, safeIndex);
          const picked = EVENT_REGISTRY[pool[Math.floor(roll * pool.length)]];
          if (picked) eventDef = picked;
        }
      }
      return {
        kind: 'event',
        encounterIndex: safeIndex,
        totalEncounters: floorDef.encounters.length,
        eventDef,
      };
    }

    // Multi-enemy battles list enemyIds (max 3); solo battles use enemyId.
    const requestedIds =
      enc.enemyIds && enc.enemyIds.length > 0
        ? enc.enemyIds.slice(0, 3)
        : [enc.enemyId ?? 'moss_slime'];
    const enemyDefs = requestedIds
      .map((id) => ENEMY_REGISTRY[id])
      .filter((d): d is EnemyDefinition => Boolean(d));
    if (enemyDefs.length === 0) enemyDefs.push(ENEMY_REGISTRY.moss_slime);

    return {
      kind: 'combat',
      encounterIndex: safeIndex,
      totalEncounters: floorDef.encounters.length,
      encounterType: enc.type,
      enemyDefs,
      statScale: enc.enemyStatScale ?? 1.0,
    };
  }
}
