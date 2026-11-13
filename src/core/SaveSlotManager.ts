import { REALM_METADATA, isFloorAuthored } from '../extensible/realms/realmIndex';
import { FloorRunner } from './FloorRunner';
import { SAVE_STORAGE_KEY, SaveData, StorageValidator } from './StorageValidator';

export const SAVE_SLOT_IDS = [1, 2, 3] as const;
export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number];

export const ACTIVE_SLOT_STORAGE_KEY = 'DAILY_TOWER_ACTIVE_SLOT';

export interface SaveSlotSummary {
  slotId: SaveSlotId;
  exists: boolean;
  floor: number;
  realmName: string;
  gold: number;
  cosmeticGems: number;
  archiveCount: number;
  activeTitle: string;
  spriteId: string;
  paletteId: string;
  isFrontier: boolean;
}

export function getSlotStorageKey(slotId: SaveSlotId): string {
  return slotId === 1 ? SAVE_STORAGE_KEY : `${SAVE_STORAGE_KEY}_SLOT_${slotId}`;
}

export function getActiveSlotId(): SaveSlotId {
  try {
    const raw = localStorage.getItem(ACTIVE_SLOT_STORAGE_KEY);
    if (raw === '2') return 2;
    if (raw === '3') return 3;
  } catch {
    // Ignore storage read errors
  }
  return 1;
}

export function setActiveSlotId(slotId: SaveSlotId): void {
  try {
    localStorage.setItem(ACTIVE_SLOT_STORAGE_KEY, String(slotId));
  } catch {
    // Ignore storage write errors
  }
}

export function hasSlotData(slotId: SaveSlotId): boolean {
  try {
    return localStorage.getItem(getSlotStorageKey(slotId)) !== null;
  } catch {
    return false;
  }
}

export function loadSlotSave(slotId: SaveSlotId): SaveData {
  try {
    const rawStr = localStorage.getItem(getSlotStorageKey(slotId));
    if (!rawStr) {
      return StorageValidator.createDefaultSave();
    }
    const parsed = JSON.parse(rawStr);
    const { save } = StorageValidator.validateAndHeal(parsed);
    return save;
  } catch {
    return StorageValidator.createDefaultSave();
  }
}

export function saveSlotData(slotId: SaveSlotId, save: SaveData): void {
  localStorage.setItem(getSlotStorageKey(slotId), JSON.stringify(save));
}

export function deleteSlotData(slotId: SaveSlotId): void {
  try {
    localStorage.removeItem(getSlotStorageKey(slotId));
  } catch {
    // Ignore storage errors
  }
}

export function summarizeSaveData(slotId: SaveSlotId, save: SaveData, exists: boolean): SaveSlotSummary {
  const floor = save.midFloor.currentFloor;
  const floorDef = FloorRunner.getFloor(floor);
  const realmMeta = REALM_METADATA[floorDef.realm] ?? REALM_METADATA[1];
  return {
    slotId,
    exists,
    floor,
    realmName: realmMeta.name,
    gold: save.gold,
    cosmeticGems: save.cosmeticGems,
    archiveCount: save.archive.length,
    activeTitle: save.activeTitle,
    spriteId: save.activeSkinSpriteId,
    paletteId: save.activeSkinPaletteId,
    isFrontier: !isFloorAuthored(floor),
  };
}

export function listSlotSummaries(
  activeSlotId?: SaveSlotId,
  activeSaveOverride?: SaveData
): SaveSlotSummary[] {
  return SAVE_SLOT_IDS.map((slotId) => {
    if (activeSlotId === slotId && activeSaveOverride) {
      return summarizeSaveData(slotId, activeSaveOverride, hasSlotData(slotId) || true);
    }
    const exists = hasSlotData(slotId);
    const save = exists ? loadSlotSave(slotId) : StorageValidator.createDefaultSave();
    return summarizeSaveData(slotId, save, exists);
  });
}
