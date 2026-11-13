import { useState } from 'react';
import { openXShare } from '../utils/share';
import { playSfx } from '../utils/sound';

interface XShareButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function XShareButton({
  text,
  label = '𝕏 で共有',
  className,
}: XShareButtonProps) {
  const [feedback, setFeedback] = useState<{
    status: 'opened' | 'copied_fallback' | 'failed';
    message: string;
  } | null>(null);

  const handleClick = async () => {
    playSfx('click');
    const result = await openXShare(text);
    setFeedback(result);
    window.setTimeout(() => {
      setFeedback((cur) => (cur === result ? null : cur));
    }, 5000);
  };

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        className={
          className ??
          'inline-flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-sky-200 transition hover:bg-slate-800 cursor-pointer'
        }
      >
        <span>{label}</span>
      </button>
      {feedback && feedback.status !== 'opened' && (
        <p
          role="status"
          className={`max-w-xs text-center text-[11px] leading-snug ${
            feedback.status === 'copied_fallback' ? 'text-amber-300' : 'text-rose-300'
          }`}
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
