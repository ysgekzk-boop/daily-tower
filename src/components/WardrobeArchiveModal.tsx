import { useEffect, useId, useRef, useState } from 'react';
import { AreaEngine, CosmeticItem, RunArchiveRecord } from '../core/AreaEngine';
import { PixelSpriteCanvas } from './PixelSpriteCanvas';

interface WardrobeArchiveModalProps {
  cosmeticGems: number;
  unlockedCosmetics: string[];
  activeSkinSpriteId: string;
  activeSkinPaletteId: string;
  activeTitle: string;
  cosmeticCatalog: CosmeticItem[];
  archive: RunArchiveRecord[];
  onSelectCosmetic: (item: CosmeticItem) => void;
}

export function WardrobeArchiveModal({
  cosmeticGems,
  unlockedCosmetics,
  activeSkinSpriteId,
  activeSkinPaletteId,
  activeTitle,
  cosmeticCatalog,
  archive,
  onSelectCosmetic,
}: WardrobeArchiveModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'archive'>('wardrobe');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyShare = async (record: RunArchiveRecord) => {
    const text = AreaEngine.formatShareText(record);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback if clipboard blocked
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/50 px-3 py-1.5 text-xs font-semibold text-fuchsia-200 transition hover:bg-fuchsia-900/60 cursor-pointer"
      >
        <span>💎 聖堂・記録</span>
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
              聖堂（外見変更・登頂記録）
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-fuchsia-500/40 bg-fuchsia-950/60 px-3 py-1 text-xs font-bold text-fuchsia-300">
              💎 {cosmeticGems}
            </span>
            <form method="dialog">
              <button
                type="submit"
                value="close"
                autoFocus
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
              >
                閉じる
              </button>
            </form>
          </div>
        </div>

        <div className="mt-4 flex gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('wardrobe')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'wardrobe'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🎨 外見・称号
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archive')}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            📜 登頂記録 ({archive.length})
          </button>
        </div>

        {activeTab === 'wardrobe' ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {cosmeticCatalog.map((item) => {
              const isUnlocked = unlockedCosmetics.includes(item.id);
              const isEquipped =
                (item.category === 'skin' &&
                  item.spriteId === activeSkinSpriteId &&
                  item.paletteId === activeSkinPaletteId) ||
                (item.category === 'title' && item.titleText === activeTitle);

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <div className="flex items-start gap-3">
                    {item.category === 'skin' && item.spriteId && (
                      <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                        <PixelSpriteCanvas
                          spriteId={item.spriteId}
                          paletteId={item.paletteId}
                          scale={5}
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{item.name}</span>
                        {isEquipped && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            装着中
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <span className="text-xs font-semibold text-fuchsia-300">
                      {isUnlocked ? '解放済み' : `💎 ${item.costGems}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectCosmetic(item)}
                      disabled={isEquipped || (!isUnlocked && cosmeticGems < item.costGems)}
                      className="rounded-lg bg-fuchsia-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    >
                      {isEquipped ? '適用中' : isUnlocked ? '装着する' : '交換する'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto pr-1">
            {archive.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center text-sm text-slate-400">
                まだ登頂記録がありません。第50層の領域の主を討伐するとここに記録されます。
              </div>
            ) : (
              archive.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-xl border border-amber-500/30 bg-slate-950/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-amber-400">
                        {rec.realmName}（第{rec.clearedFloor}層 踏破）
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {new Date(rec.timestamp).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyShare(rec)}
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                    >
                      {copiedId === rec.id ? '✅ コピー完了' : '📋 記録をコピー'}
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-4">
                    <div className="rounded bg-slate-900 p-2">
                      <span className="block text-[10px] text-slate-500">武器</span>
                      {rec.weaponName}
                    </div>
                    <div className="rounded bg-slate-900 p-2">
                      <span className="block text-[10px] text-slate-500">防具</span>
                      {rec.armorName}
                    </div>
                    <div className="rounded bg-slate-900 p-2">
                      <span className="block text-[10px] text-slate-500">スキル</span>
                      {rec.skillNames.join(' / ') || 'なし'}
                    </div>
                    <div className="rounded bg-slate-900 p-2">
                      <span className="block text-[10px] text-slate-500">レリック</span>
                      {rec.relicName}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
