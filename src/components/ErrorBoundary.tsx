import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SAVE_STORAGE_KEY } from '../core/StorageValidator';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  confirmingReset: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
    confirmingReset: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error.message || String(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Daily Tower ErrorBoundary caught an error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleEmergencyExport = () => {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) {
        alert('保存されたセーブデータが見つかりませんでした。');
        return;
      }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-tower-emergency-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('セーブデータの書き出しに失敗しました。');
    }
  };

  private handleResetAndReload = () => {
    try {
      localStorage.removeItem(SAVE_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
        <div className="w-full max-w-lg rounded-2xl border border-rose-500/40 bg-slate-900 p-6 shadow-2xl">
          <p className="text-xs font-extrabold tracking-widest text-rose-400">SYSTEM ERROR</p>
          <h1 className="mt-1 text-xl font-black text-amber-300">
            予期せぬエラーが発生しました
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            進行状況の保護のため、ページを再読み込みするか、必要に応じてセーブデータをバックアップしてください。
          </p>

          <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
            <summary className="cursor-pointer font-bold text-slate-300">エラー詳細</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all font-mono text-[11px] text-rose-300">
              {this.state.errorMessage || 'Unknown error'}
            </pre>
          </details>

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 cursor-pointer"
            >
              🔄 ページを再読み込みする
            </button>
            <button
              type="button"
              onClick={this.handleEmergencyExport}
              className="w-full rounded-xl border border-sky-500/40 bg-sky-950/50 px-4 py-2.5 text-xs font-bold text-sky-200 transition hover:bg-sky-900/60 cursor-pointer"
            >
              💾 セーブデータを緊急バックアップ（JSON）
            </button>

            {this.state.confirmingReset ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={this.handleResetAndReload}
                  className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-rose-500 cursor-pointer"
                >
                  本当に初期化して再起動
                </button>
                <button
                  type="button"
                  onClick={() => this.setState({ confirmingReset: false })}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 cursor-pointer"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => this.setState({ confirmingReset: true })}
                className="w-full rounded-xl border border-rose-500/30 bg-rose-950/30 px-4 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-900/40 cursor-pointer"
              >
                ⚠️ セーブデータを初期化して再起動
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
