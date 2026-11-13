import { useId, useRef, useState, type ChangeEvent } from 'react';
import type { SaveSlotId } from '../core/SaveSlotManager';
import { playSfx } from '../utils/sound';

interface DataManagementModalProps {
  activeSlotId: SaveSlotId;
  onExportSave: () => string;
  onImportSave: (rawJson: string) => { ok: boolean; message: string };
}

export function DataManagementModal({
  activeSlotId,
  onExportSave,
  onImportSave,
}: DataManagementModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [pasteText, setPasteText] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const openModal = () => {
    playSfx('click');
    setFeedback(null);
    dialogRef.current?.showModal();
  };

  const handleDownload = () => {
    playSfx('click');
    const json = onExportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-tower-slot${activeSlotId}-save-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFeedback({ ok: true, text: `スロット ${activeSlotId} のセーブデータをJSONファイルとして保存しました。` });
  };

  const handleCopy = async () => {
    playSfx('click');
    try {
      await navigator.clipboard.writeText(onExportSave());
      setCopied(true);
      setFeedback({ ok: true, text: 'セーブデータをクリップボードにコピーしました。' });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setFeedback({ ok: false, text: 'クリップボードへのコピーに失敗しました。JSONダウンロードをご利用ください。' });
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const res = onImportSave(text);
      setFeedback({ ok: res.ok, text: res.message });
      if (res.ok) {
        playSfx('unlock');
      }
    } catch {
      setFeedback({ ok: false, text: 'ファイルの読み込みに失敗しました。' });
    }
  };

  const handleImportPaste = () => {
    playSfx('click');
    if (!pasteText.trim()) {
      setFeedback({ ok: false, text: '復元するJSONテキストを貼り付けてください。' });
      return;
    }
    const res = onImportSave(pasteText);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setPasteText('');
      playSfx('unlock');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
      >
        <span>💾 データ管理・公開情報</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as any)}
        className="m-auto w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 id={titleId} className="text-lg font-bold text-amber-300">
            データ管理・このゲームについて
          </h2>
          <form method="dialog">
            <button
              type="submit"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
            >
              閉じる
            </button>
          </form>
        </div>

        <div className="scrollable-log mt-4 max-h-[68vh] space-y-5 overflow-y-auto pr-1 text-left">
          {feedback && (
            <div
              className={`rounded-xl border px-3 py-2.5 text-xs font-bold ${
                feedback.ok
                  ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-950/60 text-rose-200'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Export */}
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-xs font-extrabold tracking-wider text-sky-300">
              1. バックアップ（エクスポート）
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              端末移行やブラウザのキャッシュ削除に備えて、現在の進行状況をJSONとして保存できます。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sky-500 cursor-pointer"
              >
                ⬇️ JSONファイルを保存
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
              >
                {copied ? '✅ コピーしました' : '📋 テキストをコピー'}
              </button>
            </div>
          </section>

          {/* Import */}
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-xs font-extrabold tracking-wider text-amber-300">
              2. 復元（インポート）
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              保存したJSONファイルを選択するか、テキストを貼り付けて復元します（現在のデータは上書きされます）。
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3.5 py-2 text-xs font-bold text-amber-200 transition hover:bg-amber-900/50 cursor-pointer"
            >
              📂 JSONファイルから読み込む
            </button>

            <div className="mt-3 space-y-2">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={3}
                placeholder='{"version": 4, ...} を貼り付け'
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 font-mono text-[11px] text-slate-200 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleImportPaste}
                className="rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-400 cursor-pointer"
              >
                📥 貼り付けたデータで復元する
              </button>
            </div>
          </section>

          {/* About / Privacy */}
          <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-200">
              このゲームについて・プライバシー
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-400">
              <li>• 本作はサーバー通信を行わないクライアント完結型のWebゲームです。</li>
              <li>• セーブデータはすべてお使いのブラウザの <code className="text-slate-200">localStorage</code> のみに保存され、外部へ送信されることはありません。</li>
              <li>• シークレットモードでのプレイやブラウザの履歴・サイトデータ削除を行うと進行状況が消去されます。</li>
              <li>
                • 不具合報告・ご意見：{' '}
                <a
                  href="https://github.com/ysgekzk-boop/daily-tower/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sky-300 underline hover:text-sky-200"
                >
                  GitHub Issues
                </a>
              </li>
              <li>• ライセンス: MIT License / Daily Tower v4.0.0</li>
            </ul>
          </section>
        </div>
      </dialog>
    </>
  );
}
