import { useEffect, useId, useRef, useState } from 'react';
import { ACHIEVEMENTS } from '../extensible/achievements/achievements';
import { ENEMY_REGISTRY } from '../extensible/enemies/enemyRegistry';
import { ELEMENT_META } from '../utils/elements';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface BestiaryModalProps {
  bestiary?: Record<string, { seen: number; defeated: number }>;
  achievements?: Record<string, true>;
  variant?: 'header' | 'title';
}

export function BestiaryModal({ bestiary = {}, achievements = {}, variant = 'header' }: BestiaryModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [activeTab, setActiveTab] = useState<'bestiary' | 'achievements'>('bestiary');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;

    const outside = (e: PointerEvent, el: HTMLDialogElement) => {
      const r = el.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    let pressedOutside = false;
    const onDown = (e: PointerEvent) => {
      pressedOutside = outside(e, dialog);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && outside(e, dialog)) dialog.close();
    };
    dialog.addEventListener('pointerdown', onDown);
    dialog.addEventListener('pointerup', onUp);
    return () => {
      dialog.removeEventListener('pointerdown', onDown);
      dialog.removeEventListener('pointerup', onUp);
    };
  }, []);

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const enemyList = Object.values(ENEMY_REGISTRY);
  const totalEnemies = enemyList.length;
  const defeatedSpeciesCount = enemyList.filter(
    (e) => (bestiary[e.id]?.defeated ?? 0) > 0
  ).length;
  const seenSpeciesCount = enemyList.filter(
    (e) => (bestiary[e.id]?.seen ?? 0) > 0
  ).length;
  const bestiaryPercent =
    totalEnemies > 0 ? Math.floor((defeatedSpeciesCount / totalEnemies) * 100) : 0;

  const unlockedAchievementsCount = ACHIEVEMENTS.filter(
    (a) => achievements[a.id] === true
  ).length;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          variant === 'title'
            ? 'flex w-full items-center justify-center gap-1.5 rounded-2xl border border-amber-500/40 bg-amber-950/50 px-4 py-2.5 text-sm font-bold text-amber-200 transition hover:bg-amber-900/60 cursor-pointer'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/50 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-900/60 cursor-pointer'
        }
      >
        <span>📕 図鑑・実績</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as any)}
        className="m-auto w-full max-w-4xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            <h2 id={titleId} className="text-lg font-bold text-amber-300">
              図鑑と実績
            </h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('bestiary')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  activeTab === 'bestiary'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                📕 敵図鑑 ({defeatedSpeciesCount}/{totalEnemies})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('achievements')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                  activeTab === 'achievements'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🏆 実績 ({unlockedAchievementsCount}/{ACHIEVEMENTS.length})
              </button>
            </div>
          </div>

          <form method="dialog">
            <button
              type="submit"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
            >
              閉じる
            </button>
          </form>
        </div>

        <div className="scrollable-log mt-4 max-h-[70vh] overflow-y-auto pr-1">
          {activeTab === 'bestiary' ? (
            <div className="space-y-4">
              {/* Bestiary Progress Header */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-300">撃破達成率: </span>
                    <span className="font-extrabold text-amber-400">
                      {defeatedSpeciesCount} / {totalEnemies} 種 ({bestiaryPercent}%)
                    </span>
                    <span className="ml-3 text-slate-500">
                      (遭遇: {seenSpeciesCount} 種)
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                    style={{ width: `${bestiaryPercent}%` }}
                  />
                </div>
              </div>

              {/* Enemy Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {enemyList.map((enemy) => {
                  const entry = bestiary[enemy.id];
                  const seen = (entry?.seen ?? 0) > 0;
                  const defeated = (entry?.defeated ?? 0) > 0;

                  if (!seen) {
                    return (
                      <div
                        key={enemy.id}
                        className="flex flex-col items-center justify-center rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-center"
                      >
                        <div className="flex h-20 items-center justify-center">
                          <PixelSpriteCanvas
                            spriteId={enemy.spriteId}
                            paletteId={enemy.palette}
                            scale={4}
                            className="brightness-0 opacity-20"
                          />
                        </div>
                        <p className="mt-2 text-xs font-bold text-slate-500">？？？</p>
                        <span className="mt-1 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-600">
                          未遭遇
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={enemy.id}
                      className={`flex flex-col rounded-xl border p-3.5 transition ${
                        defeated
                          ? 'border-slate-800 bg-slate-950'
                          : 'border-slate-800/80 bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900/80 border border-slate-800 p-1">
                          <PixelSpriteCanvas
                            spriteId={enemy.spriteId}
                            paletteId={enemy.palette}
                            scale={4}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          {enemy.title && (
                            <p className="truncate text-[10px] font-bold text-amber-400">
                              {enemy.title}
                            </p>
                          )}
                          <p className="truncate text-xs font-extrabold text-slate-100">
                            {enemy.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] font-mono text-slate-300">
                            <span>HP: <strong className="text-emerald-400">{enemy.hp}</strong></span>
                            <span>ATK: <strong className="text-rose-400">{enemy.atk}</strong></span>
                            <span>DEF: <strong className="text-sky-400">{enemy.def}</strong></span>
                            <span>G: <strong className="text-amber-400">+{enemy.goldReward}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Weakness and Resistance */}
                      <div className="mt-2.5 border-t border-slate-900 pt-2 flex flex-wrap items-center gap-2 text-[10px]">
                        {enemy.weakness && (
                          <span className="rounded bg-rose-950/60 border border-rose-800/40 px-1.5 py-0.5 text-rose-300">
                            弱点: {ELEMENT_META[enemy.weakness]?.icon} {ELEMENT_META[enemy.weakness]?.name}
                          </span>
                        )}
                        {enemy.resistance && (
                          <span className="rounded bg-sky-950/60 border border-sky-800/40 px-1.5 py-0.5 text-sky-300">
                            耐性: {ELEMENT_META[enemy.resistance]?.icon} {ELEMENT_META[enemy.resistance]?.name}
                          </span>
                        )}
                        {!enemy.weakness && !enemy.resistance && (
                          <span className="text-slate-500">相性補正なし</span>
                        )}
                      </div>

                      {/* Defeated Details: Phase list & defeat count */}
                      {defeated ? (
                        <div className="mt-2 border-t border-slate-900 pt-2">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">行動フェーズ:</span>
                            <span className="font-bold text-amber-300">
                              撃破数: {entry?.defeated ?? 0}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {enemy.phases.map((p, idx) => {
                              const label =
                                p.phaseName ??
                                (idx === 0
                                  ? '通常'
                                  : `第${idx + 1}形態 (${p.hpThresholdPercent}%)`);
                              return (
                                <span
                                  key={idx}
                                  className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] text-slate-300"
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 border-t border-slate-900 pt-2 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500">遭遇済み（未撃破）</span>
                          <span className="text-slate-500">撃破数: 0</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Achievements Summary Header */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-300">達成状況: </span>
                    <span className="font-extrabold text-amber-400">
                      {unlockedAchievementsCount} / {ACHIEVEMENTS.length}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    条件を達成すると自動的に解除されます
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300"
                    style={{
                      width: `${(unlockedAchievementsCount / ACHIEVEMENTS.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Achievements List */}
              <div className="space-y-2.5">
                {ACHIEVEMENTS.map((ach) => {
                  const isUnlocked = achievements[ach.id] === true;
                  return (
                    <div
                      key={ach.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                        isUnlocked
                          ? 'border-amber-500/30 bg-slate-950 text-slate-100'
                          : 'border-slate-800/60 bg-slate-950/40 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden="true">
                          {ach.icon}
                        </span>
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isUnlocked ? 'text-amber-300' : 'text-slate-300'
                            }`}
                          >
                            {ach.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {ach.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isUnlocked ? (
                          <span className="rounded-full border border-amber-500/40 bg-amber-950/60 px-2.5 py-0.5 text-[10px] font-bold text-amber-300">
                            🏆 解除済み
                          </span>
                        ) : (
                          <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                            未解除
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
