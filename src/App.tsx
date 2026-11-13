import { useEffect, useRef, useState } from 'react';
import { AreaEngine } from './core/AreaEngine';
import { EventEngine } from './core/EventEngine';
import { BattleStage2D, CombatMotionState, HitFx } from './components/BattleStage2D';
import { BestiaryModal } from './components/BestiaryModal';
import { DataManagementModal } from './components/DataManagementModal';
import { HelpModal } from './components/HelpModal';
import { TitleScreen } from './components/TitleScreen';
import { UpdateLogModal } from './components/UpdateLogModal';
import { WardrobeArchiveModal } from './components/WardrobeArchiveModal';
import { XShareButton } from './components/XShareButton';
import { PixelSpriteCanvas } from './components/PixelSpriteCanvas';
import { ACHIEVEMENTS } from './extensible/achievements/achievements';
import { LATEST_AUTHORED_FLOOR, isFloorAuthored } from './extensible/realms/realmIndex';
import { useGameStore } from './store/useGameStore';
import {
  formatArchiveXShareText,
  formatDefeatXShareText,
  formatProgressXShareText,
} from './utils/share';
import { isSfxMuted, playSfx, setSfxMuted, SfxName, unlockAudio } from './utils/sound';

export function App() {
  const {
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
    cosmeticCatalog,
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
  } = useGameStore();

  const [motionState, setMotionState] = useState<CombatMotionState>('idle');
  const [activeSkillCallout, setActiveSkillCallout] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(() => isSfxMuted());

  // Achievement unlock toast queue
  const isFirstMountRef = useRef<boolean>(true);
  const prevAchievementsRef = useRef<Record<string, true>>(saveData.achievements ?? {});
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [currentToast, setCurrentToast] = useState<string | null>(null);

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevAchievementsRef.current = saveData.achievements ?? {};
      return;
    }

    const prev = prevAchievementsRef.current;
    const current = saveData.achievements ?? {};
    const newlyUnlockedIds = Object.keys(current).filter((id) => current[id] && !prev[id]);
    prevAchievementsRef.current = current;

    if (newlyUnlockedIds.length > 0) {
      const newNames = newlyUnlockedIds.map((id) => {
        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        return ach ? ach.name : id;
      });
      setToastQueue((q) => [...q, ...newNames]);
    }
  }, [saveData.achievements]);

  useEffect(() => {
    if (currentToast || toastQueue.length === 0) return;

    const [next, ...rest] = toastQueue;
    setCurrentToast(next);
    setToastQueue(rest);
    playSfx('unlock');

    const timer = setTimeout(() => {
      setCurrentToast(null);
    }, 3500);

    return () => clearTimeout(timer);
  }, [currentToast, toastQueue]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSfxMuted(next);
    if (!next) {
      playSfx('click');
    }
  };

  // Unlock Web Audio context on the first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Black fade flash whenever the floor changes (stairs, leaps, respawns)
  const [floorFade, setFloorFade] = useState(0);
  const prevFloorRef = useRef(saveData.midFloor.currentFloor);
  useEffect(() => {
    if (prevFloorRef.current !== saveData.midFloor.currentFloor) {
      prevFloorRef.current = saveData.midFloor.currentFloor;
      setFloorFade((n) => n + 1);
    }
  }, [saveData.midFloor.currentFloor]);

  const hasProgress =
    saveData.midFloor.currentFloor > 1 ||
    saveData.midFloor.currentEncounterIndex > 0 ||
    saveData.gold > 30 ||
    saveData.archive.length > 0;

  // Reset target selection whenever a new encounter begins
  useEffect(() => {
    setTargetIndex(0);
  }, [saveData.midFloor.currentFloor, saveData.midFloor.currentEncounterIndex]);

  // Battle victory sound effect
  const prevBattleStatusRef = useRef<string | undefined>(battleSession?.status);
  useEffect(() => {
    if (battleSession?.status === 'victory' && prevBattleStatusRef.current !== 'victory') {
      playSfx('victory');
    }
    prevBattleStatusRef.current = battleSession?.status;
  }, [battleSession?.status]);

  // Stage defeat sound effect
  const prevStageRef = useRef<string>(stage);
  useEffect(() => {
    if (stage === 'defeat' && prevStageRef.current !== 'defeat') {
      playSfx('defeat');
    }
    prevStageRef.current = stage;
  }, [stage]);

  // Boss encounter sound effect (once per miniboss / apex_boss encounter)
  const playedBossEncounterKeyRef = useRef<string>('');
  useEffect(() => {
    const encounterKey = `${saveData.midFloor.currentFloor}:${saveData.midFloor.currentEncounterIndex}`;
    if (
      stage === 'combat' &&
      resolvedEncounter.kind === 'combat' &&
      (resolvedEncounter.encounterType === 'miniboss' ||
        resolvedEncounter.encounterType === 'apex_boss')
    ) {
      if (playedBossEncounterKeyRef.current !== encounterKey) {
        playedBossEncounterKeyRef.current = encounterKey;
        playSfx('boss');
      }
    }
  }, [
    stage,
    resolvedEncounter,
    saveData.midFloor.currentFloor,
    saveData.midFloor.currentEncounterIndex,
  ]);

  // Floating combat numbers: diff the battle session before/after each resolved turn.
  // Enemy-side results appear with the player's action; player-side results are
  // delayed ~700ms so they land with the enemy's retaliation motion.
  const [hitFx, setHitFx] = useState<HitFx[]>([]);
  const prevSessionRef = useRef<typeof battleSession>(null);
  const prevBattleKeyRef = useRef<string>('');
  const fxKeyRef = useRef(0);

  const SFX_KNOWN_PRESETS = new Set<string>([
    'click',
    'attack',
    'hit',
    'critical',
    'weak',
    'shield',
    'heal',
    'buff',
    'debuff',
    'victory',
    'defeat',
    'reward',
    'event',
    'boss',
    'leap',
    'unlock',
  ]);

  const playHitFxSound = (fx: Omit<HitFx, 'key'>) => {
    const kindStr = fx.kind as string;
    // Prefer preset matching the kind name if available (e.g. 'critical' / 'weak')
    if (kindStr !== 'damage' && SFX_KNOWN_PRESETS.has(kindStr)) {
      playSfx(kindStr as SfxName);
      return;
    }
    if (fx.kind === 'damage' || fx.kind === 'resist') {
      if (fx.side === 'enemy') {
        playSfx('hit');
      }
    } else if (fx.kind === 'heal') {
      playSfx('heal');
    } else if (fx.kind === 'shield') {
      playSfx('shield');
    }
  };

  useEffect(() => {
    const battleKey = `${saveData.midFloor.currentFloor}:${saveData.midFloor.currentEncounterIndex}`;
    const prev = prevSessionRef.current;
    const next = battleSession;
    if (!next || !prev || prev === next || prevBattleKeyRef.current !== battleKey) {
      if (prevBattleKeyRef.current !== battleKey) setHitFx([]);
      prevSessionRef.current = next;
      prevBattleKeyRef.current = battleKey;
      return;
    }
    prevSessionRef.current = next;

    const spawn = (fx: Omit<HitFx, 'key'>, delayMs: number) => {
      const key = ++fxKeyRef.current;
      const entry: HitFx = { ...fx, key };
      window.setTimeout(() => {
        setHitFx((cur) => [...cur.slice(-11), entry]);
        playHitFxSound(fx);
        window.setTimeout(() => {
          setHitFx((cur) => cur.filter((f) => f.key !== key));
        }, 1000);
      }, delayMs);
    };
    const shieldOf = (c: { statuses: { statusId: string; value: number }[] }): number =>
      c.statuses.find((x) => x.statusId === 'shield')?.value ?? 0;

    next.enemies.forEach((enemy, i) => {
      const before = prev.enemies[i];
      if (!before) return;
      const dmg = before.currentHp - enemy.currentHp;
      if (dmg > 0) {
        let kind: HitFx['kind'] = 'damage';
        const fxMeta = next.lastActionFx;
        if (fxMeta?.critTargets.includes(i)) {
          kind = 'critical';
        } else if (fxMeta?.weakTargets.includes(i)) {
          kind = 'weak';
        } else if (fxMeta?.resistTargets.includes(i)) {
          kind = 'resist';
        }
        spawn({ side: 'enemy', index: i, amount: dmg, kind }, 0);
      }
      const absorbed = shieldOf(before) - shieldOf(enemy);
      if (absorbed > 0) spawn({ side: 'enemy', index: i, amount: absorbed, kind: 'shield' }, 0);
    });
    const pDmg = prev.player.currentHp - next.player.currentHp;
    if (pDmg > 0) {
      const kind: HitFx['kind'] = next.lastActionFx?.playerCrit ? 'critical' : 'damage';
      spawn({ side: 'player', index: 0, amount: pDmg, kind }, 700);
    }
    if (pDmg < 0) spawn({ side: 'player', index: 0, amount: -pDmg, kind: 'heal' }, 0);
    const pAbsorbed = shieldOf(prev.player) - shieldOf(next.player);
    if (pAbsorbed > 0) spawn({ side: 'player', index: 0, amount: pAbsorbed, kind: 'shield' }, 700);
  }, [battleSession, saveData.midFloor.currentFloor, saveData.midFloor.currentEncounterIndex]);

  const currentHp =
    stage === 'combat' && battleSession
      ? battleSession.player.currentHp
      : saveData.midFloor.playerCurrentHp;
  const maxConsCharges = saveData.inventory.consumable?.maxCharges ?? 2;

  const activeEvent =
    stage === 'event' && resolvedEncounter.kind === 'event'
      ? resolvedEncounter.eventDef
      : null;

  // Handle combat command with fluid sequential animations
  const handleCombatAction = (
    cmd:
      | { type: 'attack' }
      | { type: 'skill'; slotIndex: 0 | 1 | 2 }
      | { type: 'consumable' }
  ) => {    if (isAnimating || !battleSession || battleSession.status !== 'ongoing') return;

    setIsAnimating(true);

    let playerMotion: CombatMotionState = 'player_attack';
    let skillName: string | null = null;

    if (cmd.type === 'attack') {
      playerMotion = 'player_attack';
      playSfx('attack');
    } else if (cmd.type === 'skill') {
      const skill = saveData.inventory.skills[cmd.slotIndex];
      skillName = skill ? skill.name : null;
      if (skill?.category === 'heal') {
        playerMotion = 'player_skill_heal';
        playSfx('heal');
      } else if (skill?.category === 'buff') {
        playerMotion = 'player_skill_buff';
        playSfx('buff');
      } else if (skill?.category === 'debuff') {
        playerMotion = 'player_skill_debuff';
        playSfx('debuff');
      } else {
        playerMotion = 'player_skill_attack';
        playSfx('attack');
      }
    } else if (cmd.type === 'consumable') {
      playerMotion = 'player_skill_heal';
      skillName = saveData.inventory.consumable?.name ?? '秘薬使用';
      playSfx('heal');
    }

    // Step 1: Player Action Motion
    setMotionState(playerMotion);
    setActiveSkillCallout(skillName);

    setTimeout(() => {
      // Step 2: Enemy hit reaction if offensive action
      if (
        playerMotion === 'player_attack' ||
        playerMotion === 'player_skill_attack' ||
        playerMotion === 'player_skill_debuff'
      ) {
        setMotionState('enemy_hit');
      }

      // Execute actual combat calculations (with the selected target)
      performCombatCommand(
        cmd.type === 'consumable' ? cmd : { ...cmd, targetIndex }
      );

      setTimeout(() => {
        // Step 3: Enemy retaliate motion if combat is still ongoing
        setActiveSkillCallout(null);

        // Check if battle still ongoing for enemy attack motion
        setMotionState('enemy_attack');

        setTimeout(() => {
          setMotionState('player_hit');

          setTimeout(() => {
            setMotionState('idle');
            setIsAnimating(false);
          }, 350);
        }, 350);
      }, 350);
    }, 450);
  };

  if (showTitle) {
    return (
      <TitleScreen
        hasProgress={hasProgress}
        floor={saveData.midFloor.currentFloor}
        realmName={currentRealmMeta.name}
        gold={saveData.gold}
        gems={saveData.cosmeticGems}
        archiveCount={saveData.archive.length}
        playerSpriteId={saveData.activeSkinSpriteId}
        playerPaletteId={saveData.activeSkinPaletteId}
        onContinue={() => {
          playSfx('click');
          setShowTitle(false);
        }}
        onReset={() => {
          playSfx('click');
          resetSave();
          setShowTitle(false);
        }}
        metaMenu={
          <>
            <BestiaryModal
              variant="title"
              bestiary={saveData.bestiary}
              achievements={saveData.achievements}
            />
            <WardrobeArchiveModal
              variant="title"
              cosmeticGems={saveData.cosmeticGems}
              unlockedCosmetics={saveData.unlockedCosmetics}
              activeSkinSpriteId={saveData.activeSkinSpriteId}
              activeSkinPaletteId={saveData.activeSkinPaletteId}
              activeTitle={saveData.activeTitle}
              cosmeticCatalog={cosmeticCatalog}
              archive={saveData.archive}
              onSelectCosmetic={unlockOrEquipCosmetic}
            />
            <HelpModal variant="title" />
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? '効果音をONにする' : '効果音をミュートにする'}
              title={isMuted ? '効果音をONにする' : '効果音をミュートにする'}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-600/60 bg-slate-800/60 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-slate-700/70 cursor-pointer"
            >
              <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
              効果音{isMuted ? ' OFF' : ' ON'}
            </button>
          </>
        }
        footerMenu={
          <>
            <UpdateLogModal variant="title" />
            <DataManagementModal
              onExportSave={exportSaveJson}
              onImportSave={importSaveJson}
            />
            <XShareButton
              text={formatProgressXShareText({
                floor: saveData.midFloor.currentFloor,
                realmName: currentRealmMeta.name,
                weaponName: saveData.inventory.weapon.name,
                activeTitle: saveData.activeTitle,
                maxFloorReached: saveData.playStats?.maxFloorReached,
              })}
              label="𝕏 進捗をポスト"
            />
          </>
        }
      />
    );
  }

  const isCurrentFloorAuthored = isFloorAuthored(saveData.midFloor.currentFloor);

  return (
    <div className="anim-fade-in min-h-dvh flex flex-col bg-slate-950 text-slate-100">
      {/* Compact RPG Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1760px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base font-extrabold tracking-wider text-amber-400">
              DAILY TOWER
            </h1>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-slate-200">
              {currentRealmMeta.name}（第{saveData.midFloor.currentFloor}層）
            </span>
            {!isCurrentFloorAuthored && (
              <span
                title={`第${LATEST_AUTHORED_FLOOR}層まで固有フロアが実装されています。それ以降は先行プレイ用の仮設回廊です。`}
                className="rounded-full border border-amber-500/40 bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-200"
              >
                🚧 先行回廊
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-bold">
              <span className="text-amber-300">💰 {saveData.gold} G</span>
              <span className="text-slate-700">|</span>
              <span className="text-fuchsia-300">💎 {saveData.cosmeticGems}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  playSfx('click');
                  setShowTitle(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/70 cursor-pointer"
              >
                <span>🏠 タイトル</span>
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? '効果音をONにする' : '効果音をミュートにする'}
                title={isMuted ? '効果音をONにする' : '効果音をミュートにする'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/60 bg-slate-800/60 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/70 cursor-pointer"
              >
                <span aria-hidden="true">{isMuted ? '🔇' : '🔊'}</span>
              </button>
              <HelpModal />
              <BestiaryModal
                bestiary={saveData.bestiary}
                achievements={saveData.achievements}
              />
              <WardrobeArchiveModal
              cosmeticGems={saveData.cosmeticGems}
              unlockedCosmetics={saveData.unlockedCosmetics}
              activeSkinSpriteId={saveData.activeSkinSpriteId}
              activeSkinPaletteId={saveData.activeSkinPaletteId}
              activeTitle={saveData.activeTitle}
              cosmeticCatalog={cosmeticCatalog}
              archive={saveData.archive}
              onSelectCosmetic={unlockOrEquipCosmetic}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main 2D RPG Screen */}
      <main className="mx-auto flex w-full max-w-[1760px] flex-1 flex-col gap-3 px-3 py-3 sm:px-5">
        {storageError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/50 bg-rose-950/70 px-4 py-2.5 text-xs font-bold text-rose-100"
          >
            <span>⚠️ {storageError}</span>
            <button
              type="button"
              onClick={dismissStorageError}
              className="rounded-lg border border-rose-400/40 bg-rose-900/60 px-2.5 py-1 text-[11px] font-bold text-rose-100 transition hover:bg-rose-800/70 cursor-pointer"
            >
              閉じる
            </button>
          </div>
        )}
        {/* PC: stage column + console rail side by side; stacked on smaller screens */}
        <div className="flex flex-col gap-3">
        {/* 1. 2D RPG Stage Viewport (Background + Facing Characters + Motions) */}
        <div className="relative">
        <BattleStage2D
          realm={floorDef.realm}
          floor={floorDef.floor}
          floorTitle={floorDef.title}
          encounters={floorDef.encounters}
          currentEncounterIndex={saveData.midFloor.currentEncounterIndex}
          playerSpriteId={saveData.activeSkinSpriteId}
          playerPaletteId={saveData.activeSkinPaletteId}
          playerTitle={saveData.activeTitle}
          playerCurrentHp={currentHp}
          playerMaxHp={playerMaxHp}
          playerAtk={saveData.inventory.weapon.atk}
          playerDef={saveData.inventory.armor.def}
          battleSession={stage === 'combat' ? battleSession : null}
          hitFx={hitFx}
          activeEvent={activeEvent}
          motionState={motionState}
          activeSkillName={activeSkillCallout}
          selectedTargetIndex={targetIndex}
          onSelectTarget={setTargetIndex}
        />
        {stage === 'defeat' && (
          <div className="defeat-pulse pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-slate-950/60">
            <div className="anim-rise-in px-4 text-center">
              <p className="text-4xl" aria-hidden="true">💀</p>
              <p className="mt-1 text-2xl font-black tracking-widest text-rose-400">
                力尽きた…
              </p>
              <p className="mt-1 text-xs font-bold text-slate-300">
                {currentRealmMeta.name}（第{saveData.midFloor.currentFloor}層）で倒れた
              </p>
            </div>
          </div>
        )}
        </div>

        {/* Notification Toast Bar */}
        {systemBanner && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-amber-500/30 bg-amber-950/40 px-4 py-2 text-center text-xs font-bold text-amber-200"
          >
            {systemBanner}
          </div>
        )}

        </div>

        {/* 2. Consoles & Panels (grid-placed on PC, stacked on mobile) */}
          {/* COMMANDS CONSOLE: Commands / Event Choices / Rewards */}
          <div aria-label="コマンドとメッセージウィンドウ" className="flex flex-col rounded-2xl border-2 border-slate-700/90 bg-slate-900/95 px-4 py-3 shadow-xl">
            {/* COMBAT COMMANDS */}
            {stage === 'combat' && battleSession && (
              <>
                {battleSession.status === 'victory' ? (
                  <div className="anim-rise-in flex flex-1 flex-col items-center justify-center py-6 text-center">
                    <p className="text-base font-extrabold text-emerald-300">
                      🏆 {battleSession.enemyDefs.map((d) => d.name).join(' と ')} を倒した！
                    </p>
                    <p className="mt-1 text-xs text-amber-300">
                      +{battleSession.totalGoldReward} G を手に入れた
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        proceedAfterCombatVictory();
                      }}
                      className="mt-4 rounded-xl bg-emerald-500 px-8 py-2.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-emerald-400 cursor-pointer"
                    >
                      先へ進む ➔
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col justify-between gap-2.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-extrabold tracking-wider text-amber-300">
                        コマンド
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isAnimating ? '行動中…' : '行動を選択してください'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                      {/* Attack Button */}
                      <button
                        type="button"
                        disabled={isAnimating}
                        onClick={() => handleCombatAction({ type: 'attack' })}
                        className="col-span-2 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-left transition hover:border-amber-400 hover:bg-slate-800/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer sm:col-span-1"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <PixelSpriteCanvas
                            spriteId={saveData.inventory.weapon.spriteId}
                            scale={3}
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="block font-extrabold text-sm text-amber-300">
                              たたかう
                            </span>
                            <p className="truncate text-[11px] text-slate-400">
                              {saveData.inventory.weapon.name}（ATK {saveData.inventory.weapon.atk}）
                            </p>
                          </div>
                        </div>
                        <span className="ml-2 shrink-0 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                          回数無制限
                        </span>
                      </button>

                      {/* 3 Skill Buttons */}
                      {([0, 1, 2] as const).map((slotIdx) => {
                        const skill = saveData.inventory.skills[slotIdx];
                        const remaining = battleSession.skillCharges[slotIdx];
                        const disabled = isAnimating || !skill || remaining <= 0;

                        return (
                          <button
                            key={slotIdx}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              handleCombatAction({ type: 'skill', slotIndex: slotIdx })
                            }
                            className="flex flex-col justify-between rounded-xl border border-indigo-500/35 bg-indigo-950/35 px-3.5 py-2 text-left transition hover:border-indigo-400 hover:bg-indigo-900/45 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="flex min-w-0 items-center gap-1.5 font-bold text-xs text-slate-100">
                                {skill && (
                                  <PixelSpriteCanvas
                                    spriteId={skill.spriteId}
                                    scale={3}
                                    className="shrink-0"
                                  />
                                )}
                                <span className="truncate">{skill ? skill.name : '―'}</span>
                              </span>
                              {skill?.targetScope === 'all_enemies' && (
                                <span className="shrink-0 rounded bg-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold text-rose-200">
                                  全体
                                </span>
                              )}
                              {skill && (
                                <span
                                  className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                                    remaining > 0
                                      ? 'bg-indigo-500/30 text-indigo-200'
                                      : 'bg-rose-900/50 text-rose-300'
                                  }`}
                                >
                                  {remaining}/{skill.maxChargesPerBattle}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] leading-snug text-slate-400">
                              {skill ? skill.description : '空きスロット'}
                            </p>
                          </button>
                        );
                      })}

                      {/* Consumable Button */}
                      <button
                        type="button"
                        disabled={
                          isAnimating ||
                          !saveData.inventory.consumable ||
                          battleSession.consumableCharges <= 0
                        }
                        onClick={() => handleCombatAction({ type: 'consumable' })}
                        className="flex flex-col justify-between rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-3.5 py-2 text-left transition hover:border-emerald-400 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="flex min-w-0 items-center gap-1.5 font-bold text-xs text-emerald-200">
                            {saveData.inventory.consumable && (
                              <PixelSpriteCanvas
                                spriteId={saveData.inventory.consumable.spriteId}
                                scale={3}
                                className="shrink-0"
                              />
                            )}
                            <span className="truncate">
                              {saveData.inventory.consumable?.name ?? '秘薬なし'}
                            </span>
                          </span>
                          <span className="shrink-0 rounded bg-emerald-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                            {battleSession.consumableCharges}/{maxConsCharges}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-snug text-slate-400">
                          {saveData.inventory.consumable?.description ?? '―'}
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* EVENT DIALOGUE & CHOICES */}
            {stage === 'event' && activeEvent && (
              <div key={activeEvent.id} className="anim-rise-in mx-auto flex w-full max-w-4xl flex-1 flex-col justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-amber-300">
                    {activeEvent.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {activeEvent.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {activeEvent.options.map((opt) => {
                    const affordable = EventEngine.canAffordOption(
                      {
                        currentHp: saveData.midFloor.playerCurrentHp,
                        maxHp: playerMaxHp,
                        gold: saveData.gold,
                        consumableCharges: saveData.midFloor.consumableCharges,
                        consumableMaxCharges: maxConsCharges,
                      },
                      opt
                    );

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={!affordable}
                        onClick={() => {
                          playSfx('event');
                          selectEventOption(opt);
                        }}
                        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-left transition hover:border-amber-400 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <div>
                          <p className="font-bold text-xs text-amber-200">{opt.label}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {opt.description}
                          </p>
                        </div>
                        <span className="ml-3 shrink-0 text-xs font-bold text-amber-300">
                          {affordable ? '▶' : '不足'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FLOOR CLEAR REWARDS */}
            {stage === 'floor_reward' && rewardCards && (
              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-amber-300">
                    第{saveData.midFloor.currentFloor}層 踏破報酬（1つ選択）
                  </h2>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  {rewardCards.map((card) => (
                    <div
                      key={card.slot}
                      className="flex flex-col justify-between rounded-xl border border-slate-700 bg-slate-950 p-3"
                    >
                      <div>
                        {card.item && (
                          <div className="mb-2 flex justify-center">
                            <PixelSpriteCanvas spriteId={card.item.spriteId} scale={6} />
                          </div>
                        )}
                        <h3 className="text-center text-xs font-extrabold text-slate-100">
                          {card.title}
                        </h3>
                        <p className="mt-0.5 text-[11px] font-semibold text-indigo-300">
                          {card.subtitle}
                        </p>
                        {card.item && (
                          <p className="mt-1.5 text-[11px] text-slate-400">
                            {card.item.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-800 pt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            playSfx('reward');
                            selectFloorRewardCard(card, 'equip');
                          }}
                          className="w-full rounded-lg bg-amber-500 py-1.5 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400 cursor-pointer"
                        >
                          {card.type === 'potion_refill'
                            ? '補充する'
                            : card.type === 'gold_bonus'
                              ? '受け取る'
                              : '手に入れる'}
                        </button>
                        {card.item && 'salvageGold' in card.item && (
                          <button
                            type="button"
                            onClick={() => {
                              playSfx('reward');
                              selectFloorRewardCard(card, 'salvage');
                            }}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-800 cursor-pointer"
                          >
                            分解 (+{card.item.salvageGold} G)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SKILL REPLACE PROMPT */}
            {stage === 'skill_replace_prompt' && pendingSkillToEquip && (
              <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-indigo-300">
                    入れ替えるスキルを選択してください
                  </h2>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-300">
                    <PixelSpriteCanvas
                      spriteId={pendingSkillToEquip.spriteId}
                      scale={3}
                      className="shrink-0"
                    />
                    <span>
                      新スキル：<strong className="text-amber-300">{pendingSkillToEquip.name}</strong>（{pendingSkillToEquip.description}）
                    </span>
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {([0, 1, 2] as const).map((idx) => {
                    const existing = saveData.inventory.skills[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          playSfx('click');
                          confirmSkillReplace(idx);
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-left transition hover:border-indigo-400 cursor-pointer"
                      >
                        <div className="flex items-start gap-2">
                          {existing && (
                            <PixelSpriteCanvas
                              spriteId={existing.spriteId}
                              scale={3}
                              className="mt-0.5 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-100">
                              {existing?.name ?? '空き'}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {existing?.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playSfx('click');
                    confirmSkillReplace('salvage');
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 cursor-pointer"
                >
                  習得せず分解する (+{pendingSkillToEquip.salvageGold} G)
                </button>
              </div>
            )}

            {/* DIMENSIONAL LEAP */}
            {stage === 'dimensional_leap' && (
              <div className="anim-rise-in flex flex-1 flex-col items-center justify-center py-4 text-center">
                <h2 className="text-lg font-extrabold text-amber-300">
                  領域制覇！次なる領域への扉が開かれた
                </h2>
                <p className="mt-2 max-w-md text-xs leading-relaxed text-slate-300">
                  ここまでの戦いの記録が聖堂に刻まれ、報酬として{' '}
                  <strong className="text-fuchsia-300">💎 ジェム +15</strong> と{' '}
                  <strong className="text-emerald-300">🧪 秘薬 +1回分</strong> を獲得しました。
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('leap');
                      completeDimensionalLeapModal();
                    }}
                    className="rounded-xl bg-fuchsia-500 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-fuchsia-400 cursor-pointer"
                  >
                    第{saveData.midFloor.currentFloor}層へ進む ➔
                  </button>
                  {saveData.archive[0] && (
                    <XShareButton
                      text={formatArchiveXShareText(saveData.archive[0], saveData.activeTitle)}
                      label="𝕏 制覇記録をポスト"
                      className="rounded-xl border border-sky-500/40 bg-sky-950/60 px-4 py-2.5 text-sm font-bold text-sky-200 transition hover:bg-sky-900/70 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            )}

            {/* DEFEAT */}
            {stage === 'defeat' && (
              <div className="anim-rise-in flex flex-1 flex-col items-center justify-center py-4 text-center">
                <h2 className="text-lg font-extrabold text-rose-400">
                  💀 力尽きてしまった…
                </h2>
                <p className="mt-1.5 text-xs text-slate-300">
                  所持金や装備を保ったまま、第
                  {AreaEngine.calculateRespawnFloor(saveData.midFloor.currentFloor)}
                  層から再び挑むことができます。
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      respawnFromCheckpoint();
                    }}
                    className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-rose-500 cursor-pointer"
                  >
                    第{AreaEngine.calculateRespawnFloor(saveData.midFloor.currentFloor)}層から再挑戦する
                  </button>
                  <XShareButton
                    text={formatDefeatXShareText({
                      floor: saveData.midFloor.currentFloor,
                      realmName: currentRealmMeta.name,
                      activeTitle: saveData.activeTitle,
                      respawnFloor: AreaEngine.calculateRespawnFloor(saveData.midFloor.currentFloor),
                    })}
                    label="𝕏 敗北をポスト"
                    className="rounded-xl border border-sky-500/40 bg-sky-950/60 px-4 py-2.5 text-sm font-bold text-sky-200 transition hover:bg-sky-900/70 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

        {/* Bottom strip: message log (wide) + equipment (narrow) */}
        <div className="grid min-h-0 gap-3 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Message Log Panel */}
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-slate-700/90 bg-slate-900/95 px-4 py-3 shadow-xl">
        {/* Battle Message Window */}
        <div className="flex min-h-0 flex-1 flex-col">
          <span className="text-xs font-extrabold tracking-wider text-amber-300">
            メッセージ
          </span>
          <ul className="scrollable-log mt-2 min-h-32 flex-1 space-y-1 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-200">
            {battleSession ? (
              [...battleSession.logs].reverse().map((line, i) => (
                <li
                  key={i}
                  className={
                    line.startsWith('──')
                      ? 'text-amber-400 font-bold pt-1'
                      : line.includes('撃破') || line.includes('回復') || line.includes('倒した')
                      ? 'text-emerald-300'
                      : line.includes('🩸') || line.includes('💀')
                      ? 'text-rose-300'
                      : 'text-slate-200'
                  }
                >
                  {line}
                </li>
              ))
            ) : (
              <li className="text-slate-400">
                {activeEvent ? `${activeEvent.title}に到達した。` : '次の階層へ進む準備を整えている…'}
              </li>
            )}
          </ul>
        </div>
        </div>

          {/* Equipment Status (rail, under commands) */}
          <div className="flex flex-col rounded-2xl border-2 border-slate-700/90 bg-slate-900/95 px-4 py-3 shadow-xl">
            {/* Compact Equipment Status Window */}
            <div>
              <span className="text-xs font-extrabold tracking-wider text-amber-300">
                現在の装備
              </span>
              <div className="mt-2 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <span className="block text-[10px] text-slate-400">武器</span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 font-bold text-slate-100">
                    <PixelSpriteCanvas
                      spriteId={saveData.inventory.weapon.spriteId}
                      scale={3}
                      className="shrink-0"
                    />
                    <span className="truncate">{saveData.inventory.weapon.name}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-amber-300">
                    ATK +{saveData.inventory.weapon.atk}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <span className="block text-[10px] text-slate-400">防具</span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 font-bold text-slate-100">
                    <PixelSpriteCanvas
                      spriteId={saveData.inventory.armor.spriteId}
                      scale={3}
                      className="shrink-0"
                    />
                    <span className="truncate">{saveData.inventory.armor.name}</span>
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-sky-300">
                    DEF +{saveData.inventory.armor.def} / HP +{saveData.inventory.armor.maxHpBonus}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <span className="block text-[10px] text-slate-400">レリック</span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5 font-bold text-slate-100">
                    {saveData.inventory.relic && (
                      <PixelSpriteCanvas
                        spriteId={saveData.inventory.relic.spriteId}
                        scale={3}
                        className="shrink-0"
                      />
                    )}
                    <span className="truncate">{saveData.inventory.relic?.name ?? 'なし'}</span>
                  </span>
                  <span className="max-w-40 truncate text-[10px] font-bold text-fuchsia-300" title={saveData.inventory.relic?.description ?? undefined}>
                    {saveData.inventory.relic?.description ?? '―'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Achievement Unlock Toast */}
      {currentToast && (
        <div
          role="status"
          aria-live="polite"
          className="anim-rise-in fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl border border-amber-500/60 bg-slate-900/95 px-4 py-2.5 text-xs font-bold text-amber-300 shadow-2xl backdrop-blur"
        >
          <span className="text-base" aria-hidden="true">🏆</span>
          <span>実績解除「{currentToast}」</span>
        </div>
      )}

      {floorFade > 0 && (
        <div
          key={floorFade}
          className="anim-floor-fade pointer-events-none fixed inset-0 z-[80] bg-slate-950"
        />
      )}
    </div>
  );
}
