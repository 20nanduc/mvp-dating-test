import { useEffect, useRef, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { Lightbulb, LoaderCircle, Send } from 'lucide-react';

interface Props {
  draft: string;
  onDraftChange: (draft: string) => void;
  onSendMessage: () => void | Promise<void>;
  onOpenThoughtComposer: () => void;
  busy: boolean;
}

export function ChatComposer({ draft, onDraftChange, onSendMessage, onOpenThoughtComposer, busy }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 108)}px`;
  }, [draft]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !draft.trim()) return;
    void onSendMessage();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      // Preserve the mobile keyboard's Enter/newline behavior.
      if (window.matchMedia?.('(pointer: fine)').matches) {
        event.preventDefault();
        if (!busy && draft.trim()) void onSendMessage();
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative z-10 flex shrink-0 items-end gap-2 border-t border-[#eee9ef] bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
      <button type="button" onClick={onOpenThoughtComposer} disabled={busy}
        aria-label="Propose a new thought with UNO"
        className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#efc9b8] bg-[#fff6f1] px-3 text-xs font-extrabold tracking-wide text-[#ee754b] transition-colors hover:bg-[#ffeddf] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#ff7139]">
        <Lightbulb size={17} strokeWidth={2.3} /> UNO
      </button>
      <label htmlFor="chat-message-composer" className="sr-only">Message</label>
      <textarea id="chat-message-composer" ref={inputRef} rows={1} value={draft}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onDraftChange(e.target.value)} onKeyDown={handleKeyDown}
        maxLength={4000} placeholder="Type a message..." aria-label="Write a message"
        className="max-h-[108px] min-h-11 min-w-0 flex-1 resize-none overflow-y-auto rounded-[22px] border border-[#f0edf2] bg-[#f8f7fa] px-4 py-[12px] text-[14px] leading-5 text-[#14203d] outline-none placeholder:text-[#94a0ae] focus:border-[#ffb89c] focus:ring-1 focus:ring-[#ffb89c]" />
      <button type="submit" disabled={busy || !draft.trim()} aria-label="Send message"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-[#ff7139] text-white shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7139]">
        {busy ? <LoaderCircle size={19} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
      </button>
    </form>
  );
}
