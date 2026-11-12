import { useId, useRef } from 'react';
import { STATUS_REGISTRY } from '../extensible/statusEffects/statusRegistry';

const BASICS: { title: string; body: string }[] = [
  {
    title: 'ダメージの決まり方',
    body: '攻撃力が高いほど大きなダメージになり、相手の防御力が高いほど軽減されます。スキルにはそれぞれ倍率があり、バフ・デバフでも変動します。',
  },
  {
    title: '障壁（シールド）',
    body: 'HPより先にダメージを引き受ける守りです。チップに表示された数字が、残りの吸収量です。',
  },
  {
    title: '状態異常の数字',
    body: 'チップの数字は効果の強さ（効果値）、「3T」のような表示は残りターン数です。火傷・猛毒はターン開始時にダメージを受けます。チップにカーソルを合わせると説明が出ます。',
  },
  {
    title: '敵のフェーズ',
    body: '敵の中には、HPが減ると行動パターンが変化するものがいます。変化すると敵の名札にフェーズ名が表示されます。',
  },
  {
    title: '複数の敵と全体攻撃',
    body: '敵をクリックすると狙う相手を切り替えられます。全体攻撃スキルは、すべての敵に同時にダメージを与えます。',
  },
  {
    title: '秘薬（消費アイテム）',
    body: '使用回数はフロアをまたいで持ち越されます。補充できるのは休憩イベントや一部の報酬だけなので、使いどころが大切です。',
  },
  {
    title: '会心の一撃（クリティカル）',
    body: 'プレイヤーの通常攻撃と攻撃スキルは10%の確率で会心となり、ダメージが1.6倍になります。敵の攻撃も5%の確率で会心（1.6倍）になります。状態異常による継続ダメージには会心は発生しません。',
  },
  {
    title: '属性相性（弱点と耐性）',
    body: '攻撃属性は装備中の武器に依存します。敵の弱点属性で攻撃するとダメージが1.3倍に増加し、耐性属性で攻撃すると0.7倍に軽減されます。敵からプレイヤーへの攻撃には属性相性は適用されません。',
  },
];

export function HelpModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const statuses = Object.values(STATUS_REGISTRY);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-950/50 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-900/60 cursor-pointer"
      >
        <span>📖 用語集</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        {...({ closedby: 'any' } as any)}
        className="m-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 id={titleId} className="text-lg font-bold text-sky-300">
            用語集・バトルの基本
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

        <div className="scrollable-log mt-4 max-h-[65vh] space-y-6 overflow-y-auto pr-1">
          <section>
            <h3 className="text-sm font-extrabold tracking-wider text-amber-300">バトルの基本</h3>
            <ul className="mt-2 space-y-2.5">
              {BASICS.map((b) => (
                <li key={b.title} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                  <p className="text-xs font-extrabold text-slate-100">{b.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{b.body}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-extrabold tracking-wider text-amber-300">
              状態異常・バフ・デバフ一覧
            </h3>
            <ul className="mt-2 space-y-2">
              {statuses.map((def) => (
                <li
                  key={def.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  <span className="text-xl leading-none">{def.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-slate-100">
                      {def.name}
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          def.category === 'buff'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {def.category === 'buff' ? 'バフ' : 'デバフ'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300">
                      {def.description ?? '特殊な効果を持つ状態です。'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </dialog>
    </>
  );
}
