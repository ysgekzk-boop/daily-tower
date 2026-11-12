import { useState, type ReactNode } from 'react';

/**
 * Small explanation popover: opens on hover (desktop) and on tap/click
 * (touch), closing on mouse-leave, blur, or a second tap. The popover opens
 * upward from the trigger, aligned to the given edge.
 */
export function InfoTip({
  title,
  body,
  align = 'left',
  children,
  triggerClassName,
}: {
  title: string;
  body: ReactNode;
  align?: 'left' | 'right';
  children: ReactNode;
  triggerClassName?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hovered || pinned;
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setPinned((v) => !v);
        }}
        onBlur={() => {
          setPinned(false);
          setHovered(false);
        }}
        className={triggerClassName}
      >
        {children}
      </button>
      {open && (
        <span
          role="note"
          className={`absolute bottom-full z-50 mb-1.5 block w-56 rounded-xl border border-slate-500/60 bg-slate-900 p-2.5 text-left shadow-2xl ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <span className="block text-[11px] font-extrabold text-amber-200">{title}</span>
          <span className="mt-1 block text-[11px] leading-relaxed font-medium text-slate-200">
            {body}
          </span>
        </span>
      )}
    </span>
  );
}
