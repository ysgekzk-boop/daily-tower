import { useCallback, useEffect, useState } from 'react';
import {
  AreaEngine,
  COSMETIC_SHOP_CATALOG,
  CosmeticItem,
} from '../core/AreaEngine';
import { BattleSessionState, CombatEngine } from '../core/CombatEngine';
import { DropPacingEngine, RewardCard } from '../core/DropPacingEngine';
import { EventEngine } from '../core/EventEngine';
import { FloorRunner, ResolvedEncounter } from '../core/FloorRunner';
import {
  BASE_PLAYER_MAX_HP,
  SaveData,
  StorageValidator,
} from '../core/StorageValidator';
import {
  SAVE_SLOT_IDS,
  SaveSlotId,
  SaveSlotSummary,
  deleteSlotData,
  getActiveSlotId,
  hasSlotData,
  listSlotSummaries,
  loadSlotSave,
  saveSlotData,
  setActiveSlotId,
} from '../core/SaveSlotManager';
import { collectEquippedEffects } from '../extensible/effects/effectRegistry';
import { EventOption } from '../extensible/events/types';
import { AnyCatalogItem, SkillItem } from '../extensible/items/itemCatalog';
import {
  LATEST_AUTHORED_FLOOR,
  REALM_METADATA,
  isFloorAuthored,
} from '../extensible/realms/realmIndex';
import { evaluateAchievements } from '../extensible/achievements/achievements';

export type GameStage =
  | 'combat'
  | 'event'
  | 'floor_reward'
  | 'skill_replace_prompt'
  | 'dimensional_leap'
  | 'frontier_reached'
  | 'defeat';

export function useGameStore() {
  const [activeSlotId, setActiveSlotIdState] = useState<SaveSlotId>(() => getActiveSlotId());
  const [saveData, setSaveData] = useState<SaveData>(() => loadSlotSave(getActiveSlotId()));

  const [stage, setStage] = useState<GameStage>('combat');
  const [battleSession, setBattleSession] = useState<BattleSessionState | null>(null);
  const [rewardCards, setRewardCards] = useState<[RewardCard, RewardCard, RewardCard] | null>(null);
  const [pendingSkillToEquip, setPendingSkillToEquip] = useState<SkillItem | null>(null);
  const [stageAfterSkillPrompt, setStageAfterSkillPrompt] = useState<'next_encounter' | 'next_floor'>('next_floor');
  const [systemBanner, setSystemBanner] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [slotRevision, setSlotRevision] = useState(0);

  const playerMaxHp = BASE_PLAYER_MAX_HP + saveData.inventory.armor.maxHpBonus;
  const floorDef = FloorRunner.getFloor(saveData.midFloor.currentFloor);
  const currentRealmMeta = REALM_METADATA[floorDef.realm] ?? REALM_METADATA[1];
  const resolvedEncounter: ResolvedEncounter = FloorRunner.resolveEncounter(
    floorDef,
    saveData.midFloor.currentEncounterIndex,
    saveData.worldSeed
  );

  // Persist saveData whenever it changes (encounter start / reward completion)
  useEffect(() => {
    try {
      saveSlotData(activeSlotId, saveData);
      setStorageError(null);
      setSlotRevision((r) => r + 1);
    } catch {
      setStorageError(
        'ブラウザの保存領域に書き込めませんでした（シークレットモードや容量上限の可能性があります）。必要に応じてデータをエクスポートしてください。'
      );
    }
  }, [activeSlotId, saveData]);

function syncAchievements(save: SaveData): SaveData {
  const unlockedIds = evaluateAchievements(save);
  const currentAchievements = save.achievements ?? {};
  let changed = false;
  const nextAchievements = { ...currentAchievements };
  for (const id of unlockedIds) {
    if (!nextAchievements[id]) {
      nextAchievements[id] = true;
      changed = true;
    }
  }
  if (!changed) return save;
  return {
    ...save,
    achievements: nextAchievements,
  };
}

  // Initialize encounter session when floor or encounterIndex changes
  const initCurrentEncounter = useCallback(
    (currentSave: SaveData) => {
      const currentFloor = currentSave.midFloor.currentFloor;
      if (!isFloorAuthored(currentFloor)) {
        setBattleSession(null);
        setStage('frontier_reached');
        return;
      }

      const fDef = FloorRunner.getFloor(currentFloor);
      const enc = FloorRunner.resolveEncounter(fDef, currentSave.midFloor.currentEncounterIndex, currentSave.worldSeed);
      const maxHp = BASE_PLAYER_MAX_HP + currentSave.inventory.armor.maxHpBonus;

      const prevStats = currentSave.playStats ?? {
        maxFloorReached: 1,
        battlesWon: 0,
        enemiesDefeated: 0,
        leaps: 0,
      };
      const nextMaxFloor = Math.max(prevStats.maxFloorReached, currentFloor);

      if (enc.kind === 'event') {
        setBattleSession(null);
        setStage('event');

        let updatedSave: SaveData = {
          ...currentSave,
          playStats: {
            ...prevStats,
            maxFloorReached: nextMaxFloor,
          },
        };
        updatedSave = syncAchievements(updatedSave);
        if (
          nextMaxFloor !== prevStats.maxFloorReached ||
          updatedSave.achievements !== currentSave.achievements
        ) {
          setSaveData(updatedSave);
        }
      } else {
        const nextBestiary = { ...(currentSave.bestiary ?? {}) };
        for (const def of enc.enemyDefs) {
          const prev = nextBestiary[def.id] ?? { seen: 0, defeated: 0 };
          nextBestiary[def.id] = { ...prev, seen: prev.seen + 1 };
        }

        let updatedSave: SaveData = {
          ...currentSave,
          bestiary: nextBestiary,
          playStats: {
            ...prevStats,
            maxFloorReached: nextMaxFloor,
          },
        };
        updatedSave = syncAchievements(updatedSave);
        setSaveData(updatedSave);

        const session = CombatEngine.createBattleSession(
          currentSave.midFloor.playerCurrentHp,
          maxHp,
          currentSave.midFloor.consumableCharges,
          currentSave.inventory,
          enc.enemyDefs,
          enc.statScale
        );
        setBattleSession(session);
        setStage('combat');
      }
    },
    []
  );

  useEffect(() => {
    initCurrentEncounter(saveData);
    // Only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performCombatCommand = (
    cmd:
      | { type: 'attack'; targetIndex?: number }
      | { type: 'skill'; slotIndex: 0 | 1 | 2; targetIndex?: number }
      | { type: 'consumable' }
  ) => {
    if (!battleSession || battleSession.status !== 'ongoing') return;
    const nextSession = CombatEngine.executeTurn(
      battleSession,
      cmd,
      saveData.inventory,
      currentRealmMeta.environmentalStatus
    );
    setBattleSession(nextSession);

    if (battleSession.status === 'ongoing' && nextSession.status === 'victory') {
      setSaveData((currentSave) => {
        const nextBestiary = { ...(currentSave.bestiary ?? {}) };
        for (const def of nextSession.enemyDefs) {
          const prev = nextBestiary[def.id] ?? { seen: 0, defeated: 0 };
          nextBestiary[def.id] = { ...prev, defeated: prev.defeated + 1 };
        }
        const prevStats = currentSave.playStats ?? {
          maxFloorReached: currentSave.midFloor.currentFloor,
          battlesWon: 0,
          enemiesDefeated: 0,
          leaps: 0,
        };
        const nextStats = {
          ...prevStats,
          battlesWon: prevStats.battlesWon + 1,
          enemiesDefeated: prevStats.enemiesDefeated + nextSession.enemyDefs.length,
        };
        const updated: SaveData = {
          ...currentSave,
          bestiary: nextBestiary,
          playStats: nextStats,
        };
        return syncAchievements(updated);
      });
    }

    if (nextSession.status === 'defeat') {
      setStage('defeat');
    }
  };

  const equipCatalogItem = (
    item: AnyCatalogItem,
    afterStage: 'next_encounter' | 'next_floor',
    baseSave: SaveData = saveData
  ) => {
    if (item.kind === 'weapon') {
      const oldSalvage = baseSave.inventory.weapon.salvageGold;
      const nextSave: SaveData = {
        ...baseSave,
        gold: baseSave.gold + oldSalvage,
        inventory: {
          ...baseSave.inventory,
          weapon: item,
        },
      };
      setSystemBanner(
        `⚔️ ${item.name} を装備！（旧武器を分解して +${oldSalvage}G 獲得）`
      );
      if (afterStage === 'next_floor') {
        advanceToNextFloorWithSave(nextSave);
      } else {
        advanceToNextEncounterWithSave(nextSave);
      }
    } else if (item.kind === 'armor') {
      const oldSalvage = baseSave.inventory.armor.salvageGold;
      const hpDiff = Math.max(0, item.maxHpBonus - baseSave.inventory.armor.maxHpBonus);
      const newMaxHp = BASE_PLAYER_MAX_HP + item.maxHpBonus;
      const nextSave: SaveData = {
        ...baseSave,
        gold: baseSave.gold + oldSalvage,
        midFloor: {
          ...baseSave.midFloor,
          playerCurrentHp: Math.min(newMaxHp, baseSave.midFloor.playerCurrentHp + hpDiff),
        },
        inventory: {
          ...baseSave.inventory,
          armor: item,
        },
      };
      setSystemBanner(
        `🛡️ ${item.name} を装備！（旧防具を分解して +${oldSalvage}G 獲得）`
      );
      if (afterStage === 'next_floor') {
        advanceToNextFloorWithSave(nextSave);
      } else {
        advanceToNextEncounterWithSave(nextSave);
      }
    } else if (item.kind === 'relic') {
      const oldSalvage = baseSave.inventory.relic?.salvageGold ?? 0;
      const nextSave: SaveData = {
        ...baseSave,
        gold: baseSave.gold + oldSalvage,
        inventory: {
          ...baseSave.inventory,
          relic: item,
        },
      };
      setSystemBanner(
        `🔮 レリック「${item.name}」を装着！${oldSalvage > 0 ? `（旧レリック分解 +${oldSalvage}G）` : ''}`
      );
      if (afterStage === 'next_floor') {
        advanceToNextFloorWithSave(nextSave);
      } else {
        advanceToNextEncounterWithSave(nextSave);
      }
    } else if (item.kind === 'skill') {
      const emptyIdx = baseSave.inventory.skills.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        const nextSkills = [...baseSave.inventory.skills] as [
          SkillItem | null,
          SkillItem | null,
          SkillItem | null,
        ];
        nextSkills[emptyIdx] = item;
        const nextSave: SaveData = {
          ...baseSave,
          inventory: {
            ...baseSave.inventory,
            skills: nextSkills,
          },
        };
        setSystemBanner(`✨ スキル「${item.name}」をスロット${emptyIdx + 1}に習得！`);
        if (afterStage === 'next_floor') {
          advanceToNextFloorWithSave(nextSave);
        } else {
          advanceToNextEncounterWithSave(nextSave);
        }
      } else {
        setPendingSkillToEquip(item);
        setStageAfterSkillPrompt(afterStage);
        setStage('skill_replace_prompt');
      }
    } else if (item.kind === 'consumable') {
      const nextSave: SaveData = {
        ...baseSave,
        midFloor: {
          ...baseSave.midFloor,
          consumableCharges: item.maxCharges,
        },
        inventory: {
          ...baseSave.inventory,
          consumable: item,
        },
      };
      setSystemBanner(
        `🧪 消耗品「${item.name}」を装備！（チャージ ${item.maxCharges}/${item.maxCharges}）`
      );
      if (afterStage === 'next_floor') {
        advanceToNextFloorWithSave(nextSave);
      } else {
        advanceToNextEncounterWithSave(nextSave);
      }
    }
  };

  const confirmSkillReplace = (slotIndex: 0 | 1 | 2 | 'salvage') => {
    if (!pendingSkillToEquip) return;
    let nextSave: SaveData;

    if (slotIndex === 'salvage') {
      nextSave = {
        ...saveData,
        gold: saveData.gold + pendingSkillToEquip.salvageGold,
      };
      setSystemBanner(
        `💰 「${pendingSkillToEquip.name}」を魔石分解し +${pendingSkillToEquip.salvageGold}G を獲得！`
      );
    } else {
      const oldSkill = saveData.inventory.skills[slotIndex];
      const salvage = oldSkill?.salvageGold ?? 0;
      const nextSkills = [...saveData.inventory.skills] as [
        SkillItem | null,
        SkillItem | null,
        SkillItem | null,
      ];
      nextSkills[slotIndex] = pendingSkillToEquip;
      nextSave = {
        ...saveData,
        gold: saveData.gold + salvage,
        inventory: {
          ...saveData.inventory,
          skills: nextSkills,
        },
      };
      setSystemBanner(
        `✨ スロット${slotIndex + 1}に「${pendingSkillToEquip.name}」を上書き習得！（+${salvage}G）`
      );
    }

    setPendingSkillToEquip(null);
    if (stageAfterSkillPrompt === 'next_floor') {
      advanceToNextFloorWithSave(nextSave);
    } else {
      advanceToNextEncounterWithSave(nextSave);
    }
  };

  const advanceToNextEncounterWithSave = (baseSave: SaveData) => {
    const fDef = FloorRunner.getFloor(baseSave.midFloor.currentFloor);
    const nextIdx = baseSave.midFloor.currentEncounterIndex + 1;

    if (nextIdx < fDef.encounters.length) {
      const nextSave: SaveData = {
        ...baseSave,
        midFloor: {
          ...baseSave.midFloor,
          currentEncounterIndex: nextIdx,
        },
      };
      setSaveData(nextSave);
      initCurrentEncounter(nextSave);
    } else {
      // Floor cleared! Offer 3 reward cards
      setSaveData(baseSave);
      const cards = DropPacingEngine.generateFloorRewardCards(fDef, Math.random, {
        skillIds: baseSave.inventory.skills
          .filter((s): s is SkillItem => s !== null)
          .map((s) => s.id),
        weaponId: baseSave.inventory.weapon.id,
        armorId: baseSave.inventory.armor.id,
        relicId: baseSave.inventory.relic?.id ?? null,
        consumableId: baseSave.inventory.consumable?.id ?? null,
        weaponAtk: baseSave.inventory.weapon.atk,
        weaponElement: baseSave.inventory.weapon.element,
        armorDef: baseSave.inventory.armor.def,
        armorMaxHpBonus: baseSave.inventory.armor.maxHpBonus,
      });
      setRewardCards(cards);
      setStage('floor_reward');
    }
  };

  const advanceToNextFloorWithSave = (baseSave: SaveData) => {
    const clearedFloor = baseSave.midFloor.currentFloor;
    const isApexClear = clearedFloor % 50 === 0;

    if (isApexClear) {
      // Trigger 50-Floor Dimensional Leap!
      const leap = AreaEngine.executeDimensionalLeap({
        clearedFloor,
        weapon: baseSave.inventory.weapon,
        armor: baseSave.inventory.armor,
        skills: baseSave.inventory.skills,
        relicName: baseSave.inventory.relic?.name ?? 'なし',
        gold: baseSave.gold,
      });

      const newMaxHp = BASE_PLAYER_MAX_HP + leap.normalizedArmor.maxHpBonus;
      const maxCons = baseSave.inventory.consumable?.maxCharges ?? 2;

      const nextSave: SaveData = {
        ...baseSave,
        midFloor: {
          currentFloor: leap.nextFloor,
          currentEncounterIndex: 0,
          playerCurrentHp: newMaxHp,
          consumableCharges: Math.min(maxCons, baseSave.midFloor.consumableCharges + 1),
        },
        inventory: {
          ...baseSave.inventory,
          weapon: leap.normalizedWeapon,
          armor: leap.normalizedArmor,
          skills: leap.normalizedSkills,
        },
        cosmeticGems: baseSave.cosmeticGems + leap.gemsAwarded,
        archive: [leap.archiveRecord, ...baseSave.archive],
      };

      setSaveData(nextSave);
      setStage('dimensional_leap');
      return;
    }

    const nextFloor = clearedFloor + 1;
    const nextSave: SaveData = {
      ...baseSave,
      midFloor: {
        ...baseSave.midFloor,
        currentFloor: nextFloor,
        currentEncounterIndex: 0,
      },
    };
    setSaveData(nextSave);

    if (clearedFloor === LATEST_AUTHORED_FLOOR && !isFloorAuthored(nextFloor)) {
      setBattleSession(null);
      setStage('frontier_reached');
      return;
    }

    initCurrentEncounter(nextSave);
  };

  const proceedAfterCombatVictory = () => {
    if (!battleSession || battleSession.status !== 'victory') return;

    let bonusGold = battleSession.totalGoldReward;
    for (const eff of collectEquippedEffects(saveData.inventory)) {
      if (eff.trigger !== 'battle_victory') continue;
      const res = eff.handler({
        playerCurrentHp: battleSession.player.currentHp,
        playerMaxHp: battleSession.player.maxHp,
        playerAtk: battleSession.player.baseAtk,
        playerDef: battleSession.player.baseDef,
        enemyCurrentHp: 0,
        enemyMaxHp: battleSession.enemies[0]?.maxHp ?? 0,
        turnNumber: battleSession.turn,
      });
      if (res.grantGold) bonusGold += res.grantGold;
    }

    const updatedSave: SaveData = {
      ...saveData,
      gold: saveData.gold + bonusGold,
      midFloor: {
        ...saveData.midFloor,
        playerCurrentHp: battleSession.player.currentHp,
        consumableCharges: battleSession.consumableCharges,
      },
    };

    setSystemBanner(`🪙 バトル勝利報酬：+${bonusGold} Gold を獲得！`);
    advanceToNextEncounterWithSave(updatedSave);
  };

  const selectEventOption = (option: EventOption) => {
    const maxCons = saveData.inventory.consumable?.maxCharges ?? 2;
    const res = EventEngine.resolveOption(
      {
        currentHp: saveData.midFloor.playerCurrentHp,
        maxHp: playerMaxHp,
        gold: saveData.gold,
        consumableCharges: saveData.midFloor.consumableCharges,
        consumableMaxCharges: maxCons,
        currentFloor: saveData.midFloor.currentFloor,
      },
      option
    );

    if (!res.success) {
      setSystemBanner(`⚠️ ${res.reason}`);
      return;
    }

    const updatedSave: SaveData = {
      ...saveData,
      gold: res.nextState.gold,
      midFloor: {
        ...saveData.midFloor,
        playerCurrentHp: res.nextState.currentHp,
        consumableCharges: res.nextState.consumableCharges,
      },
    };

    setSystemBanner(`📜 ${res.logMessage}`);

    if (res.grantedItem) {
      const granted = res.grantedItem;
      // A granted weapon/armor that is strictly worse than the current one
      // is salvaged for gold instead of silently downgrading the player.
      const dominated =
        (granted.kind === 'weapon' &&
          DropPacingEngine.isWeaponDominated(granted, {
            atk: updatedSave.inventory.weapon.atk,
            element: updatedSave.inventory.weapon.element,
          })) ||
        (granted.kind === 'armor' &&
          DropPacingEngine.isArmorDominated(granted, {
            def: updatedSave.inventory.armor.def,
            maxHpBonus: updatedSave.inventory.armor.maxHpBonus,
          }));
      if (dominated && 'salvageGold' in granted) {
        const salvagedSave: SaveData = {
          ...updatedSave,
          gold: updatedSave.gold + granted.salvageGold,
        };
        setSystemBanner(
          `📜 ${res.logMessage}（「${granted.name}」は今の装備より弱いため分解して +${granted.salvageGold}G）`
        );
        advanceToNextEncounterWithSave(salvagedSave);
      } else {
        setSaveData(updatedSave);
        equipCatalogItem(granted, 'next_encounter', updatedSave);
      }
    } else {
      advanceToNextEncounterWithSave(updatedSave);
    }
  };

  const selectFloorRewardCard = (card: RewardCard, action: 'equip' | 'salvage') => {
    if (card.type === 'gold_bonus') {
      const amount = card.goldBonusAmount ?? 0;
      const nextSave: SaveData = {
        ...saveData,
        gold: saveData.gold + amount,
      };
      setSystemBanner(`💰 黄金の欠片を換金して +${amount}G を獲得！`);
      advanceToNextFloorWithSave(nextSave);
      return;
    }

    if (card.type === 'potion_refill') {
      const maxCons = saveData.inventory.consumable?.maxCharges ?? 2;
      const nextSave: SaveData = {
        ...saveData,
        midFloor: {
          ...saveData.midFloor,
          consumableCharges: Math.min(
            maxCons,
            saveData.midFloor.consumableCharges + (card.potionRefillAmount ?? 1)
          ),
        },
      };
      setSystemBanner('🧪 消耗品チャージを +1 補充しました！');
      advanceToNextFloorWithSave(nextSave);
      return;
    }

    if (card.item) {
      if (action === 'salvage') {
        const salvageGold =
          'salvageGold' in card.item ? card.item.salvageGold : 20;
        const nextSave: SaveData = {
          ...saveData,
          gold: saveData.gold + salvageGold,
        };
        setSystemBanner(`💰 「${card.item.name}」を分解して +${salvageGold}G を獲得！`);
        advanceToNextFloorWithSave(nextSave);
      } else {
        equipCatalogItem(card.item, 'next_floor');
      }
    }
  };

  const respawnFromCheckpoint = () => {
    const respawnFloor = AreaEngine.calculateRespawnFloor(saveData.midFloor.currentFloor);
    const maxHp = BASE_PLAYER_MAX_HP + saveData.inventory.armor.maxHpBonus;
    const nextSave: SaveData = {
      ...saveData,
      midFloor: {
        ...saveData.midFloor,
        currentFloor: respawnFloor,
        currentEncounterIndex: 0,
        playerCurrentHp: maxHp,
      },
    };
    setSystemBanner(`🔄 第${respawnFloor}層のチェックポイントからHP全快で再出発しました。`);
    setSaveData(nextSave);
    initCurrentEncounter(nextSave);
  };

  const resetSave = () => {
    const fresh = StorageValidator.createDefaultSave();
    setRewardCards(null);
    setPendingSkillToEquip(null);
    setSystemBanner('🌅 新たな挑戦が始まった。');
    setSaveData(fresh);
    initCurrentEncounter(fresh);
  };

  const completeDimensionalLeapModal = () => {
    const prevStats = saveData.playStats ?? {
      maxFloorReached: saveData.midFloor.currentFloor,
      battlesWon: 0,
      enemiesDefeated: 0,
      leaps: 0,
    };
    let nextSave: SaveData = {
      ...saveData,
      playStats: {
        ...prevStats,
        leaps: prevStats.leaps + 1,
      },
    };
    nextSave = syncAchievements(nextSave);
    setSaveData(nextSave);
    initCurrentEncounter(nextSave);
  };

  const unlockOrEquipCosmetic = (item: CosmeticItem) => {
    const isUnlocked = saveData.unlockedCosmetics.includes(item.id);
    if (!isUnlocked && saveData.cosmeticGems < item.costGems) {
      setSystemBanner('⚠️ コスメティック・ジェムが不足しています。');
      return;
    }

    const nextUnlocked = isUnlocked
      ? saveData.unlockedCosmetics
      : [...saveData.unlockedCosmetics, item.id];
    const nextGems = isUnlocked ? saveData.cosmeticGems : saveData.cosmeticGems - item.costGems;

    const nextSave: SaveData = {
      ...saveData,
      cosmeticGems: nextGems,
      unlockedCosmetics: nextUnlocked,
      activeSkinSpriteId:
        item.category === 'skin' && item.spriteId
          ? item.spriteId
          : saveData.activeSkinSpriteId,
      activeSkinPaletteId:
        item.category === 'skin' && item.paletteId
          ? item.paletteId
          : saveData.activeSkinPaletteId,
      activeTitle:
        item.category === 'title' && item.titleText
          ? item.titleText
          : saveData.activeTitle,
    };

    setSaveData(nextSave);
    setSystemBanner(`💎 「${item.name}」を適用しました！`);
  };

  const exportSaveJson = (): string => {
    return JSON.stringify(saveData, null, 2);
  };

  const importSaveJson = (rawJson: string): { ok: boolean; message: string } => {
    const result = StorageValidator.parseAndHealSaveJson(rawJson);
    if (!result.ok) {
      return result;
    }
    setRewardCards(null);
    setPendingSkillToEquip(null);
    setSaveData(result.save);
    initCurrentEncounter(result.save);
    const noteSuffix =
      result.healed && result.healNotes.length > 0
        ? `（一部修復: ${result.healNotes.join(' / ')}）`
        : '';
    setSystemBanner(`📥 セーブデータを復元しました（第${result.save.midFloor.currentFloor}層）${noteSuffix}`);
    return {
      ok: true,
      message: `第${result.save.midFloor.currentFloor}層のデータを復元しました。${noteSuffix}`,
    };
  };

  const dismissStorageError = () => {
    setStorageError(null);
  };

  const switchSaveSlot = (slotId: SaveSlotId) => {
    const loaded = loadSlotSave(slotId);
    setActiveSlotId(slotId);
    setActiveSlotIdState(slotId);
    setRewardCards(null);
    setPendingSkillToEquip(null);
    setSaveData(loaded);
    initCurrentEncounter(loaded);
    setSystemBanner(`📁 スロット ${slotId}（第${loaded.midFloor.currentFloor}層）に切り替えました。`);
  };

  const createNewSaveInSlot = (slotId: SaveSlotId) => {
    const fresh = StorageValidator.createDefaultSave();
    setActiveSlotId(slotId);
    setActiveSlotIdState(slotId);
    setRewardCards(null);
    setPendingSkillToEquip(null);
    setSaveData(fresh);
    initCurrentEncounter(fresh);
    setSystemBanner(`✨ スロット ${slotId} に新しい冒険データを作成しました！`);
  };

  const deleteSaveSlot = (slotId: SaveSlotId) => {
    deleteSlotData(slotId);
    if (slotId === activeSlotId) {
      const fallbackSlot = SAVE_SLOT_IDS.find((id) => id !== slotId && hasSlotData(id));
      if (fallbackSlot) {
        const loaded = loadSlotSave(fallbackSlot);
        setActiveSlotId(fallbackSlot);
        setActiveSlotIdState(fallbackSlot);
        setRewardCards(null);
        setPendingSkillToEquip(null);
        setSaveData(loaded);
        initCurrentEncounter(loaded);
        setSystemBanner(`🗑️ スロット ${slotId} を削除し、スロット ${fallbackSlot} に切り替えました。`);
      } else {
        const fresh = StorageValidator.createDefaultSave();
        setRewardCards(null);
        setPendingSkillToEquip(null);
        setSaveData(fresh);
        initCurrentEncounter(fresh);
        setSystemBanner(`🗑️ スロット ${slotId} を初期化しました。`);
      }
    } else {
      setSlotRevision((r) => r + 1);
      setSystemBanner(`🗑️ スロット ${slotId} のデータを削除しました。`);
    }
  };

  const slotSummaries: SaveSlotSummary[] = (() => {
    void slotRevision;
    return listSlotSummaries(activeSlotId, saveData);
  })();

  return {
    activeSlotId,
    slotSummaries,
    saveData,
    playerMaxHp,
    floorDef,
    currentRealmMeta,
    resolvedEncounter,
    stage,
    battleSession,
    rewardCards,
    pendingSkillToEquip,
    systemBanner,
    storageError,
    dismissStorageError,
    cosmeticCatalog: COSMETIC_SHOP_CATALOG,
    performCombatCommand,
    proceedAfterCombatVictory,
    selectEventOption,
    selectFloorRewardCard,
    confirmSkillReplace,
    respawnFromCheckpoint,
    resetSave,
    completeDimensionalLeapModal,
    unlockOrEquipCosmetic,
    exportSaveJson,
    importSaveJson,
    switchSaveSlot,
    createNewSaveInSlot,
    deleteSaveSlot,
  };
}
