import { LoaderCircle, MessageCircleOff } from 'lucide-react';
import { BottomSheet } from '@/features/chats/room/components/BottomSheet';

interface Props {
  peerName: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  busy: boolean;
}

export function CloseConnectionSheet({ peerName, onConfirm, onClose, busy }: Props) {
  return (
    <BottomSheet title="Close connection?" onClose={onClose} busy={busy}>
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-[#fff0ee] text-[#da6a60]">
        <MessageCircleOff size={27} />
      </div>
      <p className="text-[14px] leading-6 text-[#67758f]">
        Ending your connection with <strong className="text-[#14203d]">{peerName}</strong> closes this chat for both of you.
        Your current conversation will no longer be accessible.
      </p>
      <button type="button" onClick={() => void onConfirm()} disabled={busy}
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff7139] px-4 text-sm font-bold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7139]">
        {busy && <LoaderCircle size={18} className="animate-spin" />}
        Close connection
      </button>
      <button type="button" onClick={onClose} disabled={busy}
        className="mb-1 mt-2 min-h-11 w-full rounded-2xl border border-[#e9e4ee] text-sm font-bold text-[#61708c] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#ff7139]">
        Keep chatting
      </button>
    </BottomSheet>
  );
}
