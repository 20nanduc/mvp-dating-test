import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Lightbulb, LoaderCircle, Sparkles } from 'lucide-react';
import type { ChatMessage, ThoughtDecision } from '@/features/chats/room/types/chatRoomApi.types';

interface Props {
  messages: ChatMessage[];
  uid: string;
  peerName: string;
  roomId: string;
  hasMore: boolean;
  loadingOlder: boolean;
  busy: boolean;
  onLoadOlder: () => Promise<void>;
  onDecision: (messageId: string, decision: ThoughtDecision) => void | Promise<void>;
  onBottomChange: (atBottom: boolean) => void;
  onError: (error: unknown) => void;
}

function time(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function day(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toDateString();
}

function Entry({ message, uid, peerName, busy, onDecision }: {
  message: ChatMessage;
  uid: string;
  peerName: string;
  busy: boolean;
  onDecision: Props['onDecision'];
}) {
  const mine = message.senderId === uid;

  if (message.type === 'THOUGHT_START') return (
    <div className="mx-auto my-5 w-full max-w-[340px] rounded-[22px] border border-[#e9ddfa] bg-[linear-gradient(135deg,#f9f4ff,#f2eafb)] px-5 py-5 text-center shadow-[0_3px_16px_rgba(110,74,165,0.07)]">
      <div className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#956bc4]">
        <Sparkles size={14} /> Exploring together
      </div>
      <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-6 text-[#35264c]">{message.content}</p>
      {message.senderId && <p className="mt-2 text-[11px] text-[#84789b]">Suggested by {mine ? 'you' : peerName}</p>}
    </div>
  );

  if (message.type === 'THOUGHT_PROPOSAL') {
    const status = message.proposalStatus ?? 'PENDING';
    return (
      <div className={`my-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
        <article className={`w-[89%] max-w-[345px] rounded-[21px] border px-4 py-4 shadow-[0_2px_12px_rgba(51,30,70,0.05)] ${mine ? 'rounded-br-md border-[#e8dbf8] bg-[#f7f0ff]' : 'rounded-bl-md border-[#eee4f6] bg-white'}`}>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#9167c4]"><Lightbulb size={14} /> UNO · New thought</p>
          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-6 text-[#36284d]">{message.content}</p>
          {status === 'PENDING' && !mine && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" disabled={busy} onClick={() => void onDecision(message.id, 'REJECT')}
                className="min-h-10 rounded-xl border border-[#eae2ef] bg-white px-2 text-sm font-semibold text-[#706881] transition-colors hover:bg-[#f6f2f7] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#ff7139]">Reject</button>
              <button type="button" disabled={busy} onClick={() => void onDecision(message.id, 'EXPLORE')}
                className="min-h-10 rounded-xl bg-[#ff7139] px-2 text-sm font-bold text-white transition-transform active:scale-[.98] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#ff7139]">Explore</button>
            </div>
          )}
          {status === 'PENDING' && mine && <p className="mt-3 text-[12px] text-[#8c7a9d]">Waiting for their response</p>}
          {status === 'REJECTED' && <p className="mt-3 text-[12px] font-semibold text-[#8d849a]">Thought declined · Keep chatting</p>}
          {status === 'ACCEPTED' && <p className="mt-3 text-[12px] text-[#7d6699]">Exploring this thought</p>}
          <p className="mt-3 text-right text-[10px] tabular-nums text-[#9790a6]">{time(message.createdAt)}</p>
        </article>
      </div>
    );
  }

  return (
    <div className={`my-2 flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[82%] rounded-[19px] px-3.5 py-2.5 shadow-[0_1px_5px_rgba(25,26,47,0.035)] ${mine ? 'rounded-br-[5px] bg-[#ff7139] text-white' : 'rounded-bl-[5px] border border-[#f0eaf2] bg-white text-[#1b2945]'}`}>
        <p className="whitespace-pre-wrap break-words text-[14px] leading-[22px]">{message.content}</p>
        <p className={`mt-1 text-right text-[10px] tabular-nums ${mine ? 'text-white/75' : 'text-[#8c96a9]'}`}>{time(message.createdAt)}</p>
      </div>
    </div>
  );
}

export function MessageTimeline({
  messages, uid, peerName, roomId, hasMore, loadingOlder, busy,
  onLoadOlder, onDecision, onBottomChange, onError,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const previousRoom = useRef<string | null>(null);
  const shouldStick = useRef(true);
  const olderAnchor = useRef<{ height: number; top: number } | null>(null);
  const [newBelow, setNewBelow] = useState(false);

  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 110;
    shouldStick.current = atBottom;
    setNewBelow(!atBottom);
    onBottomChange(atBottom);
  }, [onBottomChange]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const isNewRoom = previousRoom.current !== roomId;
    if (isNewRoom) {
      previousRoom.current = roomId;
      olderAnchor.current = null;
      shouldStick.current = true;
    }
    const anchor = olderAnchor.current;
    if (anchor) {
      el.scrollTop = anchor.top + (el.scrollHeight - anchor.height);
      olderAnchor.current = null;
    } else if (shouldStick.current || isNewRoom) {
      el.scrollTop = el.scrollHeight;
    }
    handleScroll();
  }, [messages, roomId, handleScroll]);

  const loadOlder = async () => {
    const el = viewportRef.current;
    if (el) olderAnchor.current = { height: el.scrollHeight, top: el.scrollTop };
    try { await onLoadOlder(); }
    catch (error) { olderAnchor.current = null; onError(error); }
  };

  const scrollToBottom = () => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    shouldStick.current = true;
    onBottomChange(true);
    setNewBelow(false);
  };

  return (
    <div className="relative min-h-0 flex-1 bg-[linear-gradient(180deg,#fffafd,#fffaf7_34%,#fffdfb_100%)]">
      <div ref={viewportRef} onScroll={handleScroll} aria-label="Conversation messages"
        className="h-full overflow-y-auto overscroll-contain px-3.5 pb-5 pt-3 [scrollbar-gutter:stable]">
        {hasMore && (
          <button type="button" disabled={loadingOlder} onClick={() => void loadOlder()}
            className="mx-auto mb-4 flex min-h-9 items-center justify-center gap-2 rounded-full border border-[#eee4f3] bg-white px-4 text-xs font-semibold text-[#8566a1] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#ff7139]">
            {loadingOlder && <LoaderCircle size={14} className="animate-spin" />}
            {loadingOlder ? 'Loading earlier messages…' : 'Load earlier messages'}
          </button>
        )}
        {messages.length === 0 && <p className="mt-10 text-center text-sm text-[#9c95a7]">No messages yet. Start a conversation.</p>}
        {messages.map((message, index) => {
          const date = day(message.createdAt);
          const before = index === 0 ? null : day(messages[index - 1].createdAt);
          return (
            <div key={message.id}>
              {date !== before && date && (
                <p className="my-4 text-center text-[11px] font-semibold text-[#9aa0b3]">
                  <span className="rounded-full bg-[#f4f0f8] px-3 py-1.5">{date === new Date().toDateString() ? 'Today' : date}</span>
                </p>
              )}
              <Entry message={message} uid={uid} peerName={peerName} busy={busy} onDecision={onDecision} />
            </div>
          );
        })}
      </div>
      {newBelow && (
        <button type="button" onClick={scrollToBottom} aria-label="Jump to most recent message"
          className="absolute bottom-3 right-4 z-10 rounded-full border border-[#e7dce9] bg-white px-3 py-2 text-[11px] font-bold text-[#79618a] shadow-lg">
          Latest ↓
        </button>
      )}
    </div>
  );
}
