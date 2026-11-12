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
      enemyDef: EnemyDefinition;
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

    const enemyDef =
      (enc.enemyId && ENEMY_REGISTRY[enc.enemyId]) || ENEMY_REGISTRY.moss_slime;

    return {
      kind: 'combat',
      encounterIndex: safeIndex,
      totalEncounters: floorDef.encounters.length,
      encounterType: enc.type,
      enemyDef,
      statScale: enc.enemyStatScale ?? 1.0,
    };
  }
}
