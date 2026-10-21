import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, MoreVertical, X } from 'lucide-react';
import type { ChatRoomData } from '../types/chatRoomApi.types';

interface Props {
  peer: ChatRoomData['otherUser'];
  activeThought: string;
  realtime: 'connecting' | 'connected' | 'fallback';
  onBack: () => void;
  onReadThought: () => void;
  onCloseConnection: () => void;
}

export function ChatRoomHeader({
  peer, activeThought, realtime, onBack, onReadThought, onCloseConnection,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeIfOutside = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', closeIfOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen]);

  return (
    <header className="relative z-20 shrink-0 border-b border-[#f0ecf4] bg-white px-3 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] shadow-[0_2px_12px_rgba(50,34,77,0.035)]">
      <div className="flex min-h-12 items-center gap-2">
        <button type="button" onClick={onBack} aria-label="Back to chats"
          className="grid size-10 shrink-0 place-items-center rounded-full text-[#14203d] transition-colors hover:bg-[#f7f4fb] focus-visible:outline-2 focus-visible:outline-[#ff7139]">
          <ArrowLeft size={21} />
        </button>
        {peer.photoUrl ? (
          <img src={peer.photoUrl} alt="" className="size-10 shrink-0 rounded-full border border-[#f1e7e2] object-cover" />
        ) : (
          <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f7d6c9] text-base font-bold text-[#a85643]">
            {peer.name.slice(0, 1).toUpperCase() || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold leading-5 text-[#14203d]">{peer.name}</h1>
          <p className="text-[11px] leading-4 text-[#8490a7]" aria-live="polite">
            {realtime === 'connected' ? 'Connected' : realtime === 'fallback' ? 'Syncing messages' : 'Connecting…'}
          </p>
        </div>
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen(v => !v)} aria-label="Chat options"
            aria-expanded={menuOpen} aria-haspopup="menu"
            className="grid size-10 place-items-center rounded-full text-[#40506c] hover:bg-[#f7f4fb] focus-visible:outline-2 focus-visible:outline-[#ff7139]">
            {menuOpen ? <X size={21} /> : <MoreVertical size={21} />}
          </button>
          {menuOpen && (
            <div role="menu" className="absolute right-0 top-11 z-50 w-48 rounded-2xl border border-[#eee7ef] bg-white p-1.5 shadow-[0_10px_35px_rgba(32,21,44,0.15)]">
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onCloseConnection(); }}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#be4d48] hover:bg-[#fff1ed] focus-visible:outline-2 focus-visible:outline-[#ff7139]">
                Close connection
              </button>
            </div>
          )}
        </div>
      </div>
      <button type="button" onClick={onReadThought}
        className="mt-1.5 flex min-h-9 w-full items-center gap-2 rounded-xl border border-[#eee9f7] bg-[#f8f5fc] px-3 py-2 text-left transition-colors hover:bg-[#f3edfb] focus-visible:outline-2 focus-visible:outline-[#ff7139]"
        aria-label="Read full active thought">
        <span className="min-w-0 flex-1 truncate text-xs leading-5 text-[#635779]">
          <span className="font-bold text-[#7352a7]">Exploring: </span>{activeThought}
        </span>
        <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-[#876bab]" />
      </button>
    </header>
  );
}
