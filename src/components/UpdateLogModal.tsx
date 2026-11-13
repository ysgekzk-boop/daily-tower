import { useId, useRef } from 'react';
import {
  LATEST_AUTHORED_FLOOR,
  getRealmProgressSummary,
  getRecentAuthoredFloors,
} from '../extensible/realms/realmIndex';
import { playSfx } from '../utils/sound';

export function UpdateLogModal({ variant = 'title' }: { variant?: 'title' | 'header' }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const openModal = () => {
    playSfx('click');
    dialogRef.current?.showModal();
  };

  const realmSummary = getRealmProgressSummary();
  const recentFloors = getRecentAuthoredFloors(6);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          variant === 'title'
            ? 'inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-3 py-1.5 text-xs font-bold text-emerald-200 transition hover:bg-emerald-900/60 cursor-pointer'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-900/60 cursor-pointer'
        }
      >
        <span>🆕 更新状況（第{LATEST_AUTHORED_FLOOR}層まで実装）</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as any)}
        className="m-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-emerald-300">
              塔の開拓状況・最新追加フロア
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              現在 第{LATEST_AUTHORED_FLOOR}層 まで固有フロアが実装されています
            </p>
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

        <div className="scrollable-log mt-4 max-h-[65vh] space-y-6 overflow-y-auto pr-1 text-left">
          {/* Realm Progress */}
          <section>
            <h3 className="text-xs font-extrabold tracking-wider text-amber-300">
              領域ごとの開拓状況
            </h3>
            <div className="mt-2 space-y-2.5">
              {realmSummary.map(({ meta, authoredCount, totalCount }) => {
                const pct = Math.min(100, Math.round((authoredCount / totalCount) * 100));
                const isComplete = authoredCount >= totalCount;
                return (
                  <div
                    key={meta.realm}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-extrabold text-slate-100">
                        第{meta.realm}領域：{meta.name}（{meta.startFloor}〜{meta.endFloor}層）
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isComplete
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isComplete ? '✅ 踏破可能' : `🚧 ${authoredCount} / ${totalCount}層`}
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full transition-all ${
                          isComplete ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      領域ルール: {meta.environmentalRuleDescription}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recently Added Floors */}
          <section>
            <h3 className="text-xs font-extrabold tracking-wider text-amber-300">
              最近追加されたフロア
            </h3>
            <ul className="mt-2 space-y-2">
              {recentFloors.map((floor, idx) => (
                <li
                  key={floor.floor}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <div className="flex items-center gap-2">
                    {idx === 0 && (
                      <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/40">
                        LATEST
                      </span>
                    )}
                    <p className="text-xs font-extrabold text-slate-100">{floor.title}</p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {floor.subtitle}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Unauthored floor notice */}
          <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs leading-relaxed text-slate-300">
            <p className="font-bold text-sky-300">未実装階層（第{LATEST_AUTHORED_FLOOR + 1}層以降）について</p>
            <p className="mt-1 text-slate-400">
              最新実装フロアより先に進んだ場合、ゲームを止めずに先行プレイ用の回廊（既存エリアをベースにした仮設フロア）として挑戦を続けられます。今後のアップデートで順次、固有の敵・イベント・装備に置き換わります。
            </p>
          </section>
        </div>
      </dialog>
    </>
  );
}
