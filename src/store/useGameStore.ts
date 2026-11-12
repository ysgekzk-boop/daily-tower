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
  SAVE_STORAGE_KEY,
  SaveData,
  StorageValidator,
} from '../core/StorageValidator';
import { EFFECT_REGISTRY } from '../extensible/effects/effectRegistry';
import { EventOption } from '../extensible/events/types';
import { AnyCatalogItem, SkillItem } from '../extensible/items/itemCatalog';
import { REALM_METADATA } from '../extensible/realms/realmIndex';

export type GameStage =
  | 'combat'
  | 'event'
  | 'floor_reward'
  | 'skill_replace_prompt'
  | 'dimensional_leap'
  | 'defeat';

export function useGameStore() {
  const [saveData, setSaveData] = useState<SaveData>(() => {
    try {
      const rawStr = localStorage.getItem(SAVE_STORAGE_KEY);
      const parsed = rawStr ? JSON.parse(rawStr) : null;
      const { save } = StorageValidator.validateAndHeal(parsed);
      return save;
    } catch {
      return StorageValidator.createDefaultSave();
    }
  });

  const [stage, setStage] = useState<GameStage>('combat');
  const [battleSession, setBattleSession] = useState<BattleSessionState | null>(null);
  const [rewardCards, setRewardCards] = useState<[RewardCard, RewardCard, RewardCard] | null>(null);
  const [pendingSkillToEquip, setPendingSkillToEquip] = useState<SkillItem | null>(null);
  const [stageAfterSkillPrompt, setStageAfterSkillPrompt] = useState<'next_encounter' | 'next_floor'>('next_floor');
  const [systemBanner, setSystemBanner] = useState<string | null>(null);

  const playerMaxHp = BASE_PLAYER_MAX_HP + saveData.inventory.armor.maxHpBonus;
  const floorDef = FloorRunner.getFloor(saveData.midFloor.currentFloor);
  const currentRealmMeta = REALM_METADATA[floorDef.realm] ?? REALM_METADATA[1];
  const resolvedEncounter: ResolvedEncounter = FloorRunner.resolveEncounter(
    floorDef,
    saveData.midFloor.currentEncounterIndex
  );

  // Persist saveData whenever it changes (encounter start / reward completion)
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(saveData));
    } catch {
      // Ignore storage quota errors
    }
  }, [saveData]);

  // Initialize encounter session when floor or encounterIndex changes
  const initCurrentEncounter = useCallback(
    (currentSave: SaveData) => {
      const fDef = FloorRunner.getFloor(currentSave.midFloor.currentFloor);
      const enc = FloorRunner.resolveEncounter(fDef, currentSave.midFloor.currentEncounterIndex);
      const maxHp = BASE_PLAYER_MAX_HP + currentSave.inventory.armor.maxHpBonus;

      if (enc.kind === 'event') {
        setBattleSession(null);
        setStage('event');
      } else {
        const session = CombatEngine.createBattleSession(
          currentSave.midFloor.playerCurrentHp,
          maxHp,
          currentSave.midFloor.consumableCharges,
          currentSave.inventory,
          enc.enemyDef,
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
    cmd: { type: 'attack' } | { type: 'skill'; slotIndex: 0 | 1 | 2 } | { type: 'consumable' }
  ) => {
    if (!battleSession || battleSession.status !== 'ongoing') return;
    const nextSession = CombatEngine.executeTurn(
      battleSession,
      cmd,
      saveData.inventory,
      currentRealmMeta.environmentalStatus
    );
    setBattleSession(nextSession);

    if (nextSession.status === 'defeat') {
      setStage('defeat');
    }
  };

  const equipCatalogItem = (
    item: AnyCatalogItem,
    afterStage: 'next_encounter' | 'next_floor'
  ) => {
    if (item.kind === 'weapon') {
      const oldSalvage = saveData.inventory.weapon.salvageGold;
      const nextSave: SaveData = {
        ...saveData,
        gold: saveData.gold + oldSalvage,
        inventory: {
          ...saveData.inventory,
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
      const oldSalvage = saveData.inventory.armor.salvageGold;
      const hpDiff = Math.max(0, item.maxHpBonus - saveData.inventory.armor.maxHpBonus);
      const newMaxHp = BASE_PLAYER_MAX_HP + item.maxHpBonus;
      const nextSave: SaveData = {
        ...saveData,
        gold: saveData.gold + oldSalvage,
        midFloor: {
          ...saveData.midFloor,
          playerCurrentHp: Math.min(newMaxHp, saveData.midFloor.playerCurrentHp + hpDiff),
        },
        inventory: {
          ...saveData.inventory,
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
      const oldSalvage = saveData.inventory.relic?.salvageGold ?? 0;
      const nextSave: SaveData = {
        ...saveData,
        gold: saveData.gold + oldSalvage,
        inventory: {
          ...saveData.inventory,
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
      const emptyIdx = saveData.inventory.skills.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        const nextSkills = [...saveData.inventory.skills] as [
          SkillItem | null,
          SkillItem | null,
          SkillItem | null,
        ];
        nextSkills[emptyIdx] = item;
        const nextSave: SaveData = {
          ...saveData,
          inventory: {
            ...saveData.inventory,
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
      const cards = DropPacingEngine.generateFloorRewardCards(fDef);
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
    initCurrentEncounter(nextSave);
  };

  const proceedAfterCombatVictory = () => {
    if (!battleSession || battleSession.status !== 'victory') return;

    let bonusGold = battleSession.enemyDef.goldReward;
    if (saveData.inventory.relic) {
      const eff = EFFECT_REGISTRY[saveData.inventory.relic.effectId];
      if (eff && eff.trigger === 'battle_victory') {
        const res = eff.handler({
          playerCurrentHp: battleSession.player.currentHp,
          playerMaxHp: battleSession.player.maxHp,
          playerAtk: battleSession.player.baseAtk,
          playerDef: battleSession.player.baseDef,
          enemyCurrentHp: 0,
          enemyMaxHp: battleSession.enemy.maxHp,
          turnNumber: battleSession.turn,
        });
        if (res.grantGold) bonusGold += res.grantGold;
      }
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
      setSaveData(updatedSave);
      equipCatalogItem(res.grantedItem, 'next_encounter');
    } else {
      advanceToNextEncounterWithSave(updatedSave);
    }
  };

  const selectFloorRewardCard = (card: RewardCard, action: 'equip' | 'salvage') => {
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

  const completeDimensionalLeapModal = () => {
    initCurrentEncounter(saveData);
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

  return {
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
    cosmeticCatalog: COSMETIC_SHOP_CATALOG,
    performCombatCommand,
    proceedAfterCombatVictory,
    selectEventOption,
    selectFloorRewardCard,
    confirmSkillReplace,
    respawnFromCheckpoint,
    completeDimensionalLeapModal,
    unlockOrEquipCosmetic,
  };
}
