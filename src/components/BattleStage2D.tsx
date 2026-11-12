import { useEffect, useState } from 'react';
import { BattleSessionState } from '../core/CombatEngine';
import { GameEventDefinition } from '../extensible/events/types';
import { Encounter } from '../extensible/realms/realm_01_greenwood';
import { STATUS_REGISTRY } from '../extensible/statusEffects/statusRegistry';
import { ActiveStatusInstance } from '../extensible/statusEffects/types';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

export type CombatMotionState =
  | 'idle'
  | 'player_attack'
  | 'player_skill_attack'
  | 'player_skill_heal'
  | 'player_skill_buff'
  | 'player_skill_debuff'
  | 'enemy_attack'
  | 'enemy_hit'
  | 'player_hit';

interface BattleStage2DProps {
  realm: number;
  floor: number;
  floorTitle: string;
  encounters: Encounter[];
  currentEncounterIndex: number;
  playerSpriteId: string;
  playerPaletteId: string;
  playerTitle: string;
  playerCurrentHp: number;
  playerMaxHp: number;
  playerAtk: number;
  playerDef: number;
  battleSession: BattleSessionState | null;
  activeEvent: GameEventDefinition | null;
  motionState?: CombatMotionState;
  activeSkillName?: string | null;
  /** Index of the enemy the player is targeting (multi-enemy battles). */
  selectedTargetIndex?: number;
  onSelectTarget?: (index: number) => void;
}

function StatusRow({ statuses }: { statuses: ActiveStatusInstance[] }) {
  if (statuses.length === 0) return null;
  return (
    <ul className="flex flex-wrap items-center gap-1">
      {statuses.map((s) => {
        const def = STATUS_REGISTRY[s.statusId];
        if (!def) return null;
        const isBuff = def.category === 'buff';
        return (
          <li
            key={s.statusId}
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-bold shadow ${
              isBuff
                ? 'border-emerald-400/50 bg-emerald-950/90 text-emerald-200'
                : 'border-rose-400/50 bg-rose-950/90 text-rose-200'
            }`}
          >
            <span>{def.icon}</span>
            <span>{def.name}</span>
            <span className="opacity-80">{s.duration}T</span>
          </li>
        );
      })}
    </ul>
  );
}

export function BattleStage2D({
  realm,
  floor,
  floorTitle,
  encounters,
  currentEncounterIndex,
  playerSpriteId,
  playerPaletteId,
  playerTitle,
  playerCurrentHp,
  playerMaxHp,
  playerAtk,
  playerDef,
  battleSession,
  activeEvent,
  motionState = 'idle',
  activeSkillName = null,
  selectedTargetIndex = 0,
  onSelectTarget,
}: BattleStage2DProps) {
  const isVolcano = realm >= 2;

  const hpShown = battleSession ? battleSession.player.currentHp : playerCurrentHp;
  const maxHpShown = battleSession ? battleSession.player.maxHp : playerMaxHp;
  const playerStatuses = battleSession ? battleSession.player.statuses : [];

  // Enraged phase badge for one enemy, from its current HP threshold
  const phaseBadgeFor = (enemyIdx: number): string | undefined => {
    if (!battleSession) return undefined;
    const enemy = battleSession.enemies[enemyIdx];
    const def = battleSession.enemyDefs[enemyIdx];
    if (!enemy || !def || enemy.currentHp <= 0) return undefined;
    const hpPct = (enemy.currentHp / enemy.maxHp) * 100;
    const activePhase = [...def.phases]
      .filter((p) => hpPct <= p.hpThresholdPercent)
      .sort((a, b) => a.hpThresholdPercent - b.hpThresholdPercent)[0];
    return activePhase?.phaseName;
  };

  // Target shown as selected in the UI: the chosen enemy, or the first
  // living one when the chosen enemy has already fallen.
  const effectiveTargetIndex = battleSession
    ? battleSession.enemies[selectedTargetIndex]?.currentHp > 0
      ? selectedTargetIndex
      : Math.max(
          0,
          battleSession.enemies.findIndex((e) => e.currentHp > 0)
        )
    : 0;

  // Determine active motion CSS class for player
  let playerMotionClass = '';
  if (motionState === 'player_attack') playerMotionClass = 'motion-player-attack';
  else if (motionState === 'player_skill_attack') playerMotionClass = 'motion-skill-attack';
  else if (motionState === 'player_skill_heal') playerMotionClass = 'motion-skill-heal';
  else if (motionState === 'player_skill_buff') playerMotionClass = 'motion-skill-buff';
  else if (motionState === 'player_skill_debuff') playerMotionClass = 'motion-skill-debuff';
  else if (motionState === 'player_hit') playerMotionClass = 'motion-hit';

  // Determine active motion CSS class for enemy
  let enemyMotionClass = '';
  if (motionState === 'enemy_attack') enemyMotionClass = 'motion-enemy-attack';
  else if (motionState === 'enemy_hit') enemyMotionClass = 'motion-hit';

  // Boss intro banner: shown once when a miniboss / apex encounter begins
  const encounterType = encounters[currentEncounterIndex]?.type;
  const bossKind =
    encounterType === 'apex_boss' ? 'apex' : encounterType === 'miniboss' ? 'mini' : null;
  const encounterKey = `${floor}-${currentEncounterIndex}`;
  const [introKey, setIntroKey] = useState<string | null>(null);
  useEffect(() => {
    if (!bossKind || !battleSession) return;
    setIntroKey(encounterKey);
    const t = setTimeout(() => setIntroKey(null), 2350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [encounterKey, bossKind, battleSession === null]);
  const showBossIntro = introKey === encounterKey && battleSession?.status === 'ongoing';

  // Event category accent for the event actor chip
  const eventChipClass = activeEvent
    ? {
        rest: 'border-emerald-500/50 text-emerald-300',
        shrine: 'border-amber-500/50 text-amber-300',
        merchant: 'border-sky-500/50 text-sky-300',
        lore: 'border-indigo-500/50 text-indigo-300',
        forge: 'border-rose-500/50 text-rose-300',
      }[activeEvent.category]
    : '';

  return (
    <div
      className={`relative w-full h-72 sm:h-84 md:h-96 rounded-2xl border-2 overflow-clip select-none shadow-2xl ${
        isVolcano
          ? 'border-orange-900/70 bg-gradient-to-b from-stone-950 via-red-950/80 to-orange-950/90'
          : 'border-emerald-900/70 bg-gradient-to-b from-slate-950 via-teal-950/70 to-emerald-950/90'
      }`}
    >
      {/* Atmospheric 2D Background Scenery SVG */}
      <svg
        viewBox="0 0 800 360"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="block absolute inset-0 h-full w-full pointer-events-none"
      >
        {isVolcano ? (
          <>
            <circle cx="650" cy="80" r="45" fill="#ea580c" opacity="0.22" />
            <circle cx="650" cy="80" r="28" fill="#fde047" opacity="0.18" />
            <rect x="70" y="30" width="38" height="260" fill="#1c1917" opacity="0.7" />
            <rect x="240" y="50" width="32" height="240" fill="#1c1917" opacity="0.6" />
            <rect x="520" y="40" width="36" height="250" fill="#1c1917" opacity="0.65" />
            <rect x="690" y="25" width="42" height="265" fill="#1c1917" opacity="0.75" />
            <rect x="0" y="255" width="800" height="35" fill="#ea580c" opacity="0.25" />
            <circle cx="180" cy="140" r="3" fill="#fb923c" opacity="0.7" />
            <circle cx="390" cy="110" r="2.5" fill="#fde047" opacity="0.6" />
            <circle cx="460" cy="175" r="3.5" fill="#f97316" opacity="0.7" />
            <circle cx="610" cy="130" r="2.5" fill="#fde047" opacity="0.6" />
          </>
        ) : (
          <>
            <circle cx="640" cy="72" r="36" fill="#fef9c3" opacity="0.16" />
            <circle cx="640" cy="72" r="22" fill="#fef08a" opacity="0.24" />
            <polygon points="90,40 40,270 140,270" fill="#022c22" opacity="0.65" />
            <polygon points="210,70 165,270 255,270" fill="#064e3b" opacity="0.5" />
            <polygon points="580,55 530,270 630,270" fill="#064e3b" opacity="0.5" />
            <polygon points="710,30 655,270 765,270" fill="#022c22" opacity="0.7" />
            <rect x="365" y="45" width="70" height="225" fill="#0f172a" opacity="0.45" />
            <circle cx="150" cy="130" r="3" fill="#6ee7b7" opacity="0.55" />
            <circle cx="330" cy="95" r="2.5" fill="#fde047" opacity="0.5" />
            <circle cx="480" cy="150" r="3" fill="#6ee7b7" opacity="0.55" />
            <circle cx="620" cy="120" r="2" fill="#a7f3d0" opacity="0.6" />
          </>
        )}

        {/* 2D Stone Battle Floor Platform */}
        <rect
          x="0"
          y="270"
          width="800"
          height="90"
          fill={isVolcano ? '#1c1917' : '#0f172a'}
        />
        <line
          x1="0"
          y1="270"
          x2="800"
          y2="270"
          stroke={isVolcano ? '#9a3412' : '#047857'}
          strokeWidth="4"
        />
        <line x1="120" y1="270" x2="60" y2="360" stroke="#334155" strokeWidth="2" opacity="0.45" />
        <line x1="260" y1="270" x2="220" y2="360" stroke="#334155" strokeWidth="2" opacity="0.45" />
        <line x1="400" y1="270" x2="400" y2="360" stroke="#334155" strokeWidth="2" opacity="0.45" />
        <line x1="540" y1="270" x2="580" y2="360" stroke="#334155" strokeWidth="2" opacity="0.45" />
        <line x1="680" y1="270" x2="740" y2="360" stroke="#334155" strokeWidth="2" opacity="0.45" />
      </svg>

      {/* Top Overlay: Floor Title & Encounter Progress Steps */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-slate-950/65 px-4 py-2.5 backdrop-blur-xs border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-wide text-amber-300">
            {floorTitle}
          </span>
        </div>

        {/* Encounter Sequence Dots */}
        <ol className="flex items-center gap-1.5" aria-label="進行状況">
          {encounters.map((enc, idx) => {
            const isCurrent = idx === currentEncounterIndex;
            const isDone = idx < currentEncounterIndex;
            const icon =
              enc.type === 'event'
                ? '⛺'
                : enc.type === 'apex_boss'
                ? '👑'
                : enc.type === 'miniboss'
                ? '💀'
                : '⚔️';
            return (
              <li
                key={idx}
                className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition ${
                  isCurrent
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : isDone
                    ? 'bg-emerald-900/70 text-emerald-300'
                    : 'bg-slate-900/80 text-slate-500'
                }`}
              >
                <span>{isDone ? '✓' : icon}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Boss Intro Overlay */}
      {showBossIntro && battleSession && (
        <div
          className="anim-fade-in absolute inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-[1px]"
          onClick={() => setIntroKey(null)}
          role="presentation"
        >
          <div className="anim-boss-intro px-4 text-center">
            <p
              className={`text-[11px] font-black tracking-[0.4em] ${
                bossKind === 'apex' ? 'text-amber-300' : 'text-rose-300'
              }`}
            >
              {bossKind === 'apex' ? '👑 領域の主、降臨' : '💀 強敵 出現'}
            </p>
            <p className="mt-2 text-2xl font-black tracking-wider text-slate-50 sm:text-3xl">
              {battleSession.enemyDefs.map((d) => d.name).join(' と ')}
            </p>
            {battleSession.enemyDefs[0]?.title && (
              <p className="mt-1 text-xs font-bold text-slate-400">
                {battleSession.enemyDefs[0].title}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Victory Overlay */}
      {battleSession?.status === 'victory' && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <div className="anim-victory-banner rounded-2xl border border-emerald-400/50 bg-slate-950/85 px-6 py-3 text-center shadow-2xl backdrop-blur">
            <p className="text-xl font-black tracking-widest text-emerald-300">🏆 VICTORY</p>
            <p className="mt-0.5 text-[11px] font-bold text-amber-300">
              +{battleSession.totalGoldReward} G を手に入れた
            </p>
          </div>
        </div>
      )}

      {/* Action Overlay Banner for Skill Callout */}
      {activeSkillName && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex justify-center">
          <div className="animate-bounce rounded-full border border-amber-400/80 bg-slate-950/90 px-5 py-1.5 text-xs font-extrabold tracking-widest text-amber-300 shadow-2xl backdrop-blur">
            ✨ {activeSkillName}
          </div>
        </div>
      )}

      {/* Visual Effect Overlays during attacks / hits */}
      {motionState === 'enemy_hit' && (
        <div className="pointer-events-none absolute right-12 sm:right-28 bottom-28 z-20 flex items-center justify-center animate-ping">
          <span className="text-4xl">💥</span>
        </div>
      )}
      {motionState === 'player_hit' && (
        <div className="pointer-events-none absolute left-12 sm:left-24 bottom-28 z-20 flex items-center justify-center animate-ping">
          <span className="text-4xl">🩸</span>
        </div>
      )}
      {motionState === 'player_skill_heal' && (
        <div className="pointer-events-none absolute left-14 sm:left-28 bottom-32 z-20 flex items-center justify-center animate-pulse">
          <span className="text-3xl">✨💚✨</span>
        </div>
      )}
      {motionState === 'player_skill_buff' && (
        <div className="pointer-events-none absolute left-14 sm:left-28 bottom-32 z-20 flex items-center justify-center animate-pulse">
          <span className="text-3xl">🛡️⚡</span>
        </div>
      )}

      {/* 2D STAGE ACTORS: PLAYER (LEFT) FACING ENEMY/EVENT (RIGHT) */}
      <div className="relative z-10 flex h-[calc(100%-3rem)] items-end justify-between px-2 pb-6 sm:px-12 sm:pb-8">
        {/* LEFT ACTOR: PLAYER */}
        <div className="flex flex-col items-center">
          {/* Player Floating HUD */}
          <div className="mb-2 w-28 sm:w-48 md:w-52 rounded-xl border border-slate-700/90 bg-slate-950/85 p-2 sm:p-2.5 shadow-xl backdrop-blur-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="truncate text-[11px] sm:text-xs font-extrabold text-amber-300">
                {playerTitle}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400">
                ATK {playerAtk} / DEF {playerDef}
              </span>
            </div>

            <div className="mt-1">
              <div className="flex justify-between text-[10px] sm:text-[11px] font-bold">
                <span className="text-emerald-400">HP</span>
                <span className="font-mono text-slate-100">
                  {hpShown} / {maxHpShown}
                </span>
              </div>
              <progress
                aria-label="プレイヤーのHP"
                className="rpg-hp-bar mt-1 block h-2 sm:h-2.5 w-full"
                value={hpShown}
                max={maxHpShown}
                style={
                  {
                    '--progress-bar-fill':
                      hpShown / maxHpShown > 0.3 ? '#10b981' : '#f43f5e',
                    '--progress-bar-track': '#1e293b',
                  } as React.CSSProperties
                }
              />
            </div>

            {playerStatuses.length > 0 && (
              <div className="mt-1.5">
                <StatusRow statuses={playerStatuses} />
              </div>
            )}
          </div>

          {/* Player Character Sprite on Floor Platform */}
          <div className="relative flex flex-col items-center">
            <div className={`rpg-actor ${playerMotionClass}`}>
              <PixelSpriteCanvas
                spriteId={playerSpriteId}
                paletteId={playerPaletteId}
                scale={10}
              />
            </div>
            {/* Ground Shadow Oval */}
            <div className="-mt-1.5 h-3 w-20 sm:w-24 rounded-full bg-black/55 blur-[1px]" />
          </div>
        </div>

        {/* CENTER VS / ATMOSPHERE SPACE */}
        <div className="hidden sm:flex flex-col items-center justify-center self-center opacity-70">
          {battleSession && battleSession.status === 'ongoing' && (
            <span className="rounded-full border border-white/15 bg-slate-950/60 px-3 py-1 font-mono text-xs font-bold text-slate-300">
              TURN {battleSession.turn}
            </span>
          )}
        </div>

        {/* RIGHT ACTOR: ENEMY OR EVENT OBJECT */}
        {battleSession ? (
          <div className="flex items-end gap-2 sm:gap-4">
            {battleSession.enemies.map((enemy, idx) => {
              const def = battleSession.enemyDefs[idx];
              const isDead = enemy.currentHp <= 0;
              const isMulti = battleSession.enemies.length > 1;
              const isTarget =
                isMulti && !isDead && battleSession.status === 'ongoing' && idx === effectiveTargetIndex;
              const phaseBadge = phaseBadgeFor(idx);
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center ${isDead ? 'opacity-40 grayscale' : ''}`}
                  onClick={() => {
                    if (!isDead && battleSession.status === 'ongoing') onSelectTarget?.(idx);
                  }}
                >
                  {/* Enemy Floating HUD */}
                  <div
                    className={`mb-2 ${
                      isMulti ? 'w-24 sm:w-36' : 'w-40 sm:w-52 md:w-56'
                    } rounded-xl border ${
                      isTarget
                        ? 'border-amber-400 ring-2 ring-amber-400/60'
                        : 'border-rose-800/80'
                    } bg-slate-950/85 p-2 sm:p-2.5 shadow-xl backdrop-blur-xs ${
                      isMulti && !isDead ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="truncate text-[11px] sm:text-xs font-extrabold text-rose-300">
                        {isDead ? '💀 ' : ''}
                        {enemy.name}
                      </span>
                      {phaseBadge && (
                        <span className="rounded bg-rose-500/25 px-1 py-0.5 text-[9px] sm:text-[10px] font-bold text-rose-200 animate-pulse">
                          🔥 {phaseBadge}
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      <div className="flex justify-between text-[10px] sm:text-[11px] font-bold">
                        <span className="text-rose-400">HP</span>
                        <span className="font-mono text-slate-100">
                          {enemy.currentHp} / {enemy.maxHp}
                        </span>
                      </div>
                      <progress
                        aria-label={`${enemy.name}のHP`}
                        className="rpg-hp-bar mt-1 block h-2 sm:h-2.5 w-full"
                        value={enemy.currentHp}
                        max={enemy.maxHp}
                        style={
                          {
                            '--progress-bar-fill': '#f43f5e',
                            '--progress-bar-track': '#1e293b',
                          } as React.CSSProperties
                        }
                      />
                    </div>

                    {enemy.statuses.length > 0 && (
                      <div className="mt-1.5">
                        <StatusRow statuses={enemy.statuses} />
                      </div>
                    )}
                  </div>

                  {/* Enemy Sprite on Floor Platform (facing left towards player) */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`${
                        def.isBoss ? 'rpg-actor-boss' : 'rpg-actor'
                      } ${isDead ? 'motion-defeat' : enemyMotionClass}`}
                    >
                      <PixelSpriteCanvas
                        spriteId={def.spriteId}
                        paletteId={def.palette}
                        scale={def.isBoss ? 12 : isMulti ? 8 : 10}
                        flipHorizontal={def.spriteId === 'goblin'}
                      />
                    </div>
                    <div
                      className={`-mt-1.5 h-3 rounded-full bg-black/55 blur-[1px] ${
                        def.isBoss ? 'w-28 sm:w-32' : 'w-20 sm:w-24'
                      }`}
                    />
                  </div>
                  {isTarget && (
                    <span className="mt-1 text-[10px] font-extrabold text-amber-300">
                      ▼ ターゲット
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : activeEvent ? (
          <div key={activeEvent.id} className="anim-rise-in flex flex-col items-center">
            <div
              className={`mb-2 rounded-xl border bg-slate-950/85 px-3 py-1.5 text-center shadow-xl backdrop-blur-xs ${eventChipClass}`}
            >
              <span className="text-[11px] sm:text-xs font-extrabold">
                {activeEvent.title}
              </span>
            </div>
            <div className="relative flex flex-col items-center">
              <div className="rpg-actor">
                <PixelSpriteCanvas
                  spriteId={activeEvent.speakerSpriteId ?? 'shrine'}
                  paletteId={activeEvent.palette ?? 'golden_shrine'}
                  scale={11}
                  flipHorizontal={activeEvent.speakerSpriteId === 'hero_knight'}
                />
              </div>
              <div className="-mt-1.5 h-3 w-20 sm:w-24 rounded-full bg-amber-500/25 blur-[2px]" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
