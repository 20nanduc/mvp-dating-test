import { type ChangeEvent, type FormEvent } from 'react';
import { Lightbulb, LoaderCircle } from 'lucide-react';
import { BottomSheet } from '@/features/chats/room/components/BottomSheet';

interface Props {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onClose: () => void;
  busy: boolean;
}

export function ThoughtComposerSheet({ draft, onDraftChange, onSend, onClose, busy }: Props) {
  const valid = draft.trim().length > 0 && draft.trim().length <= 280;
  const submit = (event: FormEvent) => { event.preventDefault(); if (valid && !busy) void onSend(); };
  return (
    <BottomSheet title="A new thought" onClose={onClose} busy={busy}>
      <p className="mb-4 text-[14px] leading-6 text-[#72809a]">
        Invite them to explore a new topic. They can choose <strong>Explore</strong> or <strong>Reject</strong>.
      </p>
      <form onSubmit={submit}>
        <label htmlFor="chat-propose-thought" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#7c58ac]">
          <Lightbulb size={17} /> Your thought
        </label>
        <textarea id="chat-propose-thought" rows={5} maxLength={280} value={draft}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onDraftChange(e.target.value)} placeholder="What would you like to explore together?"
          className="w-full resize-none rounded-2xl border border-[#e9dff5] bg-[#fcf9ff] px-4 py-3 text-[15px] leading-6 text-[#14203d] outline-none placeholder:text-[#9b94ac] focus:border-[#a687ce] focus:ring-2 focus:ring-[#e6d6f6]" />
        <p className="mt-1 text-right text-xs tabular-nums text-[#98a1b0]">{draft.length}/280</p>
        <button disabled={!valid || busy} type="submit"
          className="mb-1 mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff7139] px-4 text-sm font-bold text-white disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7139]">
          {busy ? <LoaderCircle size={18} className="animate-spin" /> : <Lightbulb size={18} />}
          Send thought
        </button>
      </form>
    </BottomSheet>
  );
}
