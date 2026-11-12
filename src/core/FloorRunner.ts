import { ENEMY_REGISTRY } from '../extensible/enemies/enemyRegistry';
import { EnemyDefinition } from '../extensible/enemies/types';
import { EVENT_REGISTRY } from '../extensible/events/eventRegistry';
import { GameEventDefinition } from '../extensible/events/types';
import { Encounter, FloorDefinition } from '../extensible/realms/realm_01_greenwood';
import { getFloorDefinition } from '../extensible/realms/realmIndex';

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

  static resolveEncounter(floorDef: FloorDefinition, index: number): ResolvedEncounter {
    const safeIndex = Math.max(0, Math.min(floorDef.encounters.length - 1, index));
    const enc: Encounter = floorDef.encounters[safeIndex];

    if (enc.type === 'event') {
      const eventDef =
        (enc.eventId && EVENT_REGISTRY[enc.eventId]) || EVENT_REGISTRY.sanctuary_campfire;
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
