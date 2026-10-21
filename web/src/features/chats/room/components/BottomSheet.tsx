import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}

export function BottomSheet({ title, children, onClose, busy = false }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); closeRef.current?.(); }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previousFocus.current?.focus();
    };
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-[#1a1930]/50" onMouseDown={(e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget && !busy) onClose();
    }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="flex max-h-[85%] w-full flex-col rounded-t-[28px] bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-16px_45px_rgba(29,21,44,0.18)] outline-none">
        <span aria-hidden="true" className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#e6dfeb]" />
        <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 id={titleId} className="text-[17px] font-bold text-[#14203d]">{title}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close sheet"
            className="grid size-9 place-items-center rounded-full bg-[#f7f4fa] text-[#62708a] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#ff7139]">
            <X size={19} />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-1">{children}</div>
      </section>
    </div>
  );
}
