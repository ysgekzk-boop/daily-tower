import { useEffect, useState } from 'react';
import { AreaEngine } from './core/AreaEngine';
import { EventEngine } from './core/EventEngine';
import { BattleStage2D, CombatMotionState } from './components/BattleStage2D';
import { TitleScreen } from './components/TitleScreen';
import { WardrobeArchiveModal } from './components/WardrobeArchiveModal';
import { useGameStore } from './store/useGameStore';

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
  } = useGameStore();

  const [motionState, setMotionState] = useState<CombatMotionState>('idle');
  const [activeSkillCallout, setActiveSkillCallout] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [showTitle, setShowTitle] = useState<boolean>(true);

  const hasProgress =
    saveData.midFloor.currentFloor > 1 ||
    saveData.midFloor.currentEncounterIndex > 0 ||
    saveData.gold > 30 ||
    saveData.archive.length > 0;

  // Reset target selection whenever a new encounter begins
  useEffect(() => {
    setTargetIndex(0);
  }, [saveData.midFloor.currentFloor, saveData.midFloor.currentEncounterIndex]);

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
    } else if (cmd.type === 'skill') {
      const skill = saveData.inventory.skills[cmd.slotIndex];
      skillName = skill ? skill.name : null;
      if (skill?.category === 'heal') {
        playerMotion = 'player_skill_heal';
      } else if (skill?.category === 'buff') {
        playerMotion = 'player_skill_buff';
      } else if (skill?.category === 'debuff') {
        playerMotion = 'player_skill_debuff';
      } else {
        playerMotion = 'player_skill_attack';
      }
    } else if (cmd.type === 'consumable') {
      playerMotion = 'player_skill_heal';
      skillName = saveData.inventory.consumable?.name ?? '秘薬使用';
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
        onContinue={() => setShowTitle(false)}
        onReset={() => {
          resetSave();
          setShowTitle(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-slate-950 text-slate-100">
      {/* Compact RPG Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold tracking-wider text-amber-400">
              DAILY TOWER
            </h1>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-slate-200">
              {currentRealmMeta.name}（第{saveData.midFloor.currentFloor}層）
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-bold">
              <span className="text-amber-300">💰 {saveData.gold} G</span>
              <span className="text-slate-700">|</span>
              <span className="text-fuchsia-300">💎 {saveData.cosmeticGems}</span>
            </div>

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
      </header>

      {/* Main 2D RPG Screen */}
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
        {/* PC: stage column + console rail side by side; stacked on smaller screens */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[auto_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
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
          <div aria-label="コマンドとメッセージウィンドウ" className="flex flex-col rounded-2xl border-2 border-slate-700/90 bg-slate-900/95 p-4 shadow-xl lg:col-start-2 lg:row-start-1">
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
                      onClick={proceedAfterCombatVictory}
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

                    <div className="grid gap-2">
                      {/* Attack Button */}
                      <button
                        type="button"
                        disabled={isAnimating}
                        onClick={() => handleCombatAction({ type: 'attack' })}
                        className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-left transition hover:border-amber-400 hover:bg-slate-800/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <div>
                          <span className="font-extrabold text-sm text-amber-300">
                            🗡️ たたかう（{saveData.inventory.weapon.name}）
                          </span>
                          <p className="text-[11px] text-slate-400">
                            通常攻撃（ATK {saveData.inventory.weapon.atk}）
                          </p>
                        </div>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
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
                            className="flex flex-col justify-between rounded-xl border border-indigo-500/35 bg-indigo-950/35 px-3.5 py-2.5 text-left transition hover:border-indigo-400 hover:bg-indigo-900/45 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-100">
                                {skill ? `✨ ${skill.name}` : '―'}
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
                            <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
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
                        className="flex flex-col justify-between rounded-xl border border-emerald-500/35 bg-emerald-950/30 px-3.5 py-2.5 text-left transition hover:border-emerald-400 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-emerald-200">
                            🧪 {saveData.inventory.consumable?.name ?? '秘薬なし'}
                          </span>
                          <span className="shrink-0 rounded bg-emerald-500/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-200">
                            {battleSession.consumableCharges}/{maxConsCharges}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
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
              <div key={activeEvent.id} className="anim-rise-in flex flex-1 flex-col justify-between gap-3">
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
                        onClick={() => selectEventOption(opt)}
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
              <div className="flex flex-1 flex-col justify-between gap-3">
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
                        <h3 className="text-xs font-extrabold text-slate-100">
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
                          onClick={() => selectFloorRewardCard(card, 'equip')}
                          className="w-full rounded-lg bg-amber-500 py-1.5 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400 cursor-pointer"
                        >
                          {card.type === 'potion_refill' ? '補充する' : '手に入れる'}
                        </button>
                        {card.item && 'salvageGold' in card.item && (
                          <button
                            type="button"
                            onClick={() => selectFloorRewardCard(card, 'salvage')}
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
              <div className="flex flex-1 flex-col justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-indigo-300">
                    入れ替えるスキルを選択してください
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-300">
                    新スキル：<strong className="text-amber-300">{pendingSkillToEquip.name}</strong>（{pendingSkillToEquip.description}）
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  {([0, 1, 2] as const).map((idx) => {
                    const existing = saveData.inventory.skills[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => confirmSkillReplace(idx)}
                        className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-left transition hover:border-indigo-400 cursor-pointer"
                      >
                        <p className="font-bold text-xs text-slate-100">
                          {existing?.name ?? '空き'}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {existing?.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => confirmSkillReplace('salvage')}
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
                <button
                  type="button"
                  onClick={completeDimensionalLeapModal}
                  className="mt-4 rounded-xl bg-fuchsia-500 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-fuchsia-400 cursor-pointer"
                >
                  第{saveData.midFloor.currentFloor}層へ進む ➔
                </button>
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
                <button
                  type="button"
                  onClick={respawnFromCheckpoint}
                  className="mt-4 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-extrabold text-white transition hover:bg-rose-500 cursor-pointer"
                >
                  第{AreaEngine.calculateRespawnFloor(saveData.midFloor.currentFloor)}層から再挑戦する
                </button>
              </div>
            )}
          </div>

        {/* Message Log Panel (under the stage) */}
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-slate-700/90 bg-slate-900/95 p-4 shadow-xl lg:col-start-1 lg:row-start-2">
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
          <div className="flex flex-col rounded-2xl border-2 border-slate-700/90 bg-slate-900/95 p-4 shadow-xl lg:col-start-2 lg:row-start-2">
            {/* Compact Equipment Status Window */}
            <div>
              <span className="text-xs font-extrabold tracking-wider text-amber-300">
                現在の装備
              </span>
              <div className="mt-2 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <span className="block text-[10px] text-slate-400">武器</span>
                  <span className="min-w-0 flex-1 truncate font-bold text-slate-100">
                    🗡️ {saveData.inventory.weapon.name}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-amber-300">
                    ATK +{saveData.inventory.weapon.atk}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <span className="block text-[10px] text-slate-400">防具</span>
                  <span className="min-w-0 flex-1 truncate font-bold text-slate-100">
                    🛡️ {saveData.inventory.armor.name}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold text-sky-300">
                    DEF +{saveData.inventory.armor.def} / HP +{saveData.inventory.armor.maxHpBonus}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-2">
                  <span className="block text-[10px] text-slate-400">レリック</span>
                  <span className="min-w-0 flex-1 truncate font-bold text-slate-100">
                    🔮 {saveData.inventory.relic?.name ?? 'なし'}
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
    </div>
  );
}
