import { useState } from 'react';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface TitleScreenProps {
  hasProgress: boolean;
  floor: number;
  realmName: string;
  gold: number;
  gems: number;
  archiveCount: number;
  playerSpriteId: string;
  playerPaletteId: string;
  onContinue: () => void;
  onReset: () => void;
}

const HOW_TO_PLAY: { icon: string; text: string }[] = [
  { icon: '⚔️', text: '戦闘とイベントを進めながら、塔を登っていくローグライトRPG' },
  { icon: '🎁', text: 'フロア踏破の報酬で、武器・防具・スキル・レリックを強化' },
  { icon: '👑', text: '5層ごとに中ボス、50層ごとに領域の主が立ちはだかる' },
  { icon: '💀', text: '力尽きても装備と所持金はそのまま。チェックポイントから再挑戦' },
  { icon: '🌀', text: '領域を制覇すると次元跳躍。装備は新領域の基準に再編される' },
];

export function TitleScreen({
  hasProgress,
  floor,
  realmName,
  gold,
  gems,
  archiveCount,
  playerSpriteId,
  playerPaletteId,
  onContinue,
  onReset,
}: TitleScreenProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="anim-fade-in relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-slate-100">
      {/* Backdrop: night-sky gradient and floating motes */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/70 to-slate-950" />
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <span className="anim-float-slow absolute left-[12%] top-[18%] text-amber-200/70">✦</span>
        <span className="anim-float-slow absolute left-[82%] top-[24%] text-indigo-200/70" style={{ animationDelay: '-2s' }}>✦</span>
        <span className="anim-float-slow absolute left-[68%] top-[12%] text-slate-200/50" style={{ animationDelay: '-4s' }}>✧</span>
        <span className="anim-float-slow absolute left-[24%] top-[64%] text-emerald-200/50" style={{ animationDelay: '-1s' }}>✧</span>
        <span className="anim-float-slow absolute left-[88%] top-[70%] text-amber-200/50" style={{ animationDelay: '-3s' }}>✦</span>
      </div>

      {/* Tower silhouette */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 opacity-25" aria-hidden="true">
        <div className="mx-auto h-40 w-10 bg-slate-800" />
        <div className="mx-auto h-52 w-20 bg-slate-800/90" />
        <div className="mx-auto h-64 w-32 bg-slate-900" />
      </div>

      <div className="anim-rise-in relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <div className="rpg-actor mb-2">
          <PixelSpriteCanvas spriteId={playerSpriteId} paletteId={playerPaletteId} scale={9} />
        </div>

        <p className="text-[11px] font-bold tracking-[0.35em] text-indigo-300">
          DAILY ROGUELITE
        </p>
        <h1 className="anim-title-glow mt-1 text-5xl font-black tracking-widest text-amber-400 sm:text-6xl">
          DAILY TOWER
        </h1>
        <p className="mt-2 text-sm font-bold text-slate-300">
          毎日登る、終わりなき塔
        </p>

        {hasProgress && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
            <span className="rounded-full border border-amber-500/40 bg-amber-950/50 px-3 py-1 text-amber-200">
              {realmName}（第{floor}層）
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-amber-300">
              💰 {gold} G
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-fuchsia-300">
              💎 {gems}
            </span>
            {archiveCount > 0 && (
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-emerald-300">
                🏛️ 制覇記録 {archiveCount}
              </span>
            )}
          </div>
        )}

        <div className="mt-7 flex w-full max-w-sm flex-col gap-2.5">
          <button
            type="button"
            onClick={onContinue}
            className="w-full rounded-2xl bg-amber-500 px-6 py-3.5 text-base font-black tracking-wider text-slate-950 shadow-xl transition hover:bg-amber-400 cursor-pointer"
          >
            {hasProgress ? `▶ つづきから（第${floor}層）` : '▶ 冒険をはじめる'}
          </button>

          {hasProgress &&
            (confirmingReset ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  className="flex-1 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-rose-500 cursor-pointer"
                >
                  本当に最初から始める
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className="flex-1 rounded-2xl border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-slate-800 cursor-pointer"
                >
                  やめる
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800 cursor-pointer"
              >
                さいしょから始める
              </button>
            ))}
        </div>

        <div className="mt-8 w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-left backdrop-blur">
          <h2 className="text-xs font-extrabold tracking-wider text-amber-300">遊び方</h2>
          <ul className="mt-2 space-y-1.5">
            {HOW_TO_PLAY.map((row) => (
              <li key={row.text} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                <span aria-hidden="true">{row.icon}</span>
                <span>{row.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-[11px] text-slate-500">
          進行状況はこのブラウザに自動保存されます
        </p>
      </div>
    </div>
  );
}
