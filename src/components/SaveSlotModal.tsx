import { useId, useRef, useState } from 'react';
import type { SaveSlotId, SaveSlotSummary } from '../core/SaveSlotManager';
import { playSfx } from '../utils/sound';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface SaveSlotModalProps {
  activeSlotId: SaveSlotId;
  slotSummaries: SaveSlotSummary[];
  onSwitchSlot: (slotId: SaveSlotId) => void;
  onCreateNewSlot: (slotId: SaveSlotId) => void;
  onDeleteSlot: (slotId: SaveSlotId) => void;
  triggerLabel?: string;
  triggerClassName?: string;
}

export function SaveSlotModal({
  activeSlotId,
  slotSummaries,
  onSwitchSlot,
  onCreateNewSlot,
  onDeleteSlot,
  triggerLabel,
  triggerClassName,
}: SaveSlotModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [confirmDeleteId, setConfirmDeleteId] = useState<SaveSlotId | null>(null);

  const openModal = () => {
    playSfx('click');
    setConfirmDeleteId(null);
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          triggerClassName ??
          'inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/50 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-amber-900/60 cursor-pointer'
        }
      >
        <span>{triggerLabel ?? `📁 セーブ切替（スロット${activeSlotId}）`}</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as any)}
        className="m-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-amber-300">
              セーブデータ管理（最大3スロット）
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              空きスロットに新規セーブデータを作成して、別の冒険を並行して進められます。
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

        <div className="scrollable-log mt-4 max-h-[65vh] space-y-3 overflow-y-auto pr-1 text-left">
          {slotSummaries.map((slot) => {
            const isActive = slot.slotId === activeSlotId;
            return (
              <div
                key={slot.slotId}
                className={`rounded-xl border p-4 transition ${
                  isActive
                    ? 'border-amber-400/60 bg-amber-950/20'
                    : 'border-slate-800 bg-slate-950/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
                      {slot.exists ? (
                        <PixelSpriteCanvas
                          spriteId={slot.spriteId}
                          paletteId={slot.paletteId}
                          scale={3}
                        />
                      ) : (
                        <span className="text-lg text-slate-600">＋</span>
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-100">
                          スロット {slot.slotId}
                        </span>
                        {isActive && (
                          <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-200">
                            使用中
                          </span>
                        )}
                        {slot.exists && slot.isFrontier && (
                          <span className="rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            🏁 最前線
                          </span>
                        )}
                      </div>

                      {slot.exists ? (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs font-bold text-slate-200">
                            {slot.activeTitle} ・ {slot.realmName}（第{slot.floor}層）
                          </p>
                          <p className="text-[11px] text-slate-400">
                            💰 {slot.gold} G / 💎 {slot.cosmeticGems}
                            {slot.archiveCount > 0 ? ` / 🏛️ 制覇 ${slot.archiveCount}` : ''}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">
                          空きスロット（新規セーブデータを作成できます）
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!slot.exists ? (
                      <button
                        type="button"
                        onClick={() => {
                          playSfx('unlock');
                          onCreateNewSlot(slot.slotId);
                          closeModal();
                        }}
                        className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black text-slate-950 transition hover:bg-emerald-400 cursor-pointer"
                      >
                        ✨ 新規作成して始める
                      </button>
                    ) : isActive ? (
                      <span className="text-xs font-bold text-amber-300/80">
                        現在選択中
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            playSfx('click');
                            onSwitchSlot(slot.slotId);
                            closeModal();
                          }}
                          className="rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-400 cursor-pointer"
                        >
                          ▶ 切り替える
                        </button>
                        {confirmDeleteId === slot.slotId ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                playSfx('click');
                                onDeleteSlot(slot.slotId);
                                setConfirmDeleteId(null);
                              }}
                              className="rounded-xl bg-rose-600 px-2.5 py-2 text-xs font-extrabold text-white transition hover:bg-rose-500 cursor-pointer"
                            >
                              削除確定
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-700 cursor-pointer"
                            >
                              戻る
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              playSfx('click');
                              setConfirmDeleteId(slot.slotId);
                            }}
                            className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-900/50 cursor-pointer"
                          >
                            🗑️ 削除
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </dialog>
    </>
  );
}
