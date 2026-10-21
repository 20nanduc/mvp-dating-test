import { useCallback, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, LoaderCircle, MessageCircleOff, RefreshCcw } from 'lucide-react';
import { ChatRoomHeader } from './components/ChatRoomHeader';
import { MessageTimeline } from './components/MessageTimeline';
import { ChatComposer } from './components/ChatComposer';
import { CurrentThoughtSheet } from './components/CurrentThoughtSheet';
import { ThoughtComposerSheet } from './components/ThoughtComposerSheet';
import { CloseConnectionSheet } from './components/CloseConnectionSheet';
import { ChatApiError } from './services/chatRoomApi';
import { useLiveChatRoom } from './hooks/useLiveChatRoom';
import type { ThoughtDecision } from './types/chatRoomApi.types';

type Sheet = 'currentThought' | 'newThought' | 'closeConnection' | null;

interface Props {
  /** Keep your existing route usage; standalone should be true when outside DashboardLayout. */
  standalone?: boolean;
  onBack?: () => void;
}

/** Real Firebase UID is observed, not read once during a transient auth bootstrap. */
function useAuthUid() {
  const [auth, setAuth] = useState(() => ({ ready: Boolean(getAuth().currentUser), uid: getAuth().currentUser?.uid ?? null }));
  useEffect(() => onAuthStateChanged(getAuth(), user => setAuth({ ready: true, uid: user?.uid ?? null })), []);
  return auth;
}

function FullState({ title, detail, onBack, onRetry, retryLabel }: {
  title: string; detail: string; onBack: () => void; onRetry?: () => void; retryLabel?: string;
}) {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-white px-8 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-[#f4f0fc] text-[#6a54ac]"><MessageCircleOff size={30} /></span>
      <h2 className="text-lg font-semibold text-[#14203d]">{title}</h2>
      <p className="max-w-xs text-sm leading-6 text-[#70809a]">{detail}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-2 flex items-center gap-2 rounded-xl border border-[#e6dbea] bg-white px-5 py-3 text-sm font-semibold text-[#775da1]"><RefreshCcw size={16} /> {retryLabel ?? 'Try again'}</button>}
      <button type="button" onClick={onBack} className="mt-2 flex items-center gap-2 rounded-xl bg-[#ff7139] px-5 py-3 text-sm font-semibold text-white"><ArrowLeft size={17} /> Back to chats</button>
    </main>
  );
}

export function ChatRoomPage({ standalone = false, onBack }: Props) {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();
  const { uid, ready: authReady } = useAuthUid();
  const chat = useLiveChatRoom(connectionId, uid ?? undefined);
  const [messageDraft, setMessageDraft] = useState('');
  const [thoughtDraft, setThoughtDraft] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [error, setError] = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const [messageAttemptId, setMessageAttemptId] = useState<string | null>(null);
  const [thoughtAttemptId, setThoughtAttemptId] = useState<string | null>(null);

  const back = useCallback(() => {
    if (onBack) onBack();
    else navigate('/app/chats');
  }, [onBack, navigate]);
  const handleError = useCallback((cause: unknown) => {
    if (cause instanceof ChatApiError && cause.status === 409) {
      setError('The active thought changed. Refreshing your conversation…');
      void chat.refresh().catch(() => {});
      return;
    }
    setError(cause instanceof Error ? cause.message : 'Could not complete the action. Please retry.');
  }, [chat.refresh]);

  // A switched room must never show stale drafts or reuse idempotency keys.
  useEffect(() => {
    setMessageDraft(''); setThoughtDraft(''); setMessageAttemptId(null); setThoughtAttemptId(null);
    setSheet(null); setError(''); setAtBottom(true);
  }, [chat.room?.roomId]);

  useEffect(() => {
    const onVisible = () => {
      if (atBottom) void chat.markVisibleRead().catch(() => {});
    };
    onVisible();
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [atBottom, chat.markVisibleRead]);

  const sendMessage = async () => {
    if (!messageDraft.trim() || chat.actionBusy || chat.closed) return;
    const attempted = messageDraft;
    const attemptId = messageAttemptId ?? crypto.randomUUID();
    setError('');
    try {
      await chat.send(attempted, attemptId);
      setMessageDraft(''); setMessageAttemptId(null);
      setAtBottom(true);
    } catch (cause) {
      setMessageAttemptId(attemptId); handleError(cause);
    }
  };

  const sendThought = async () => {
    const trimmed = thoughtDraft.trim();
    if (!trimmed || trimmed.length > 280 || chat.actionBusy || chat.closed) return;
    const attemptId = thoughtAttemptId ?? crypto.randomUUID();
    setError('');
    try {
      await chat.propose(thoughtDraft, attemptId);
      setThoughtDraft(''); setThoughtAttemptId(null); setSheet(null); setAtBottom(true);
    } catch (cause) {
      setThoughtAttemptId(attemptId); handleError(cause);
    }
  };

  const decide = async (proposalId: string, decision: ThoughtDecision) => {
    setError('');
    try { await chat.decide(proposalId, decision); }
    catch (cause) { handleError(cause); }
  };

  const closeConnection = async () => {
    setError('');
    try { await chat.closeConnection(); setSheet(null); back(); }
    catch (cause) { handleError(cause); }
  };

  const room = chat.room;
  const unavailable = chat.closed || (chat.roomError instanceof ChatApiError && [403, 404].includes(chat.roomError.status));

  return (
    <div className={`relative mx-auto flex min-h-0 w-full max-w-md flex-col overflow-hidden bg-white text-[#14203d] ${standalone ? 'h-dvh' : 'h-[calc(100dvh-88px)]'}`}>
      {!connectionId ? (
        <FullState title="Chat not found" detail="Open a conversation from your Chats tab." onBack={back} />
      ) : !authReady ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-[#8992a5]"><LoaderCircle size={19} className="animate-spin" /> Signing in…</div>
      ) : !uid ? (
        <FullState title="Session expired" detail="Sign in again to open this conversation." onBack={back} />
      ) : unavailable ? (
        <FullState title="Connection closed" detail="This conversation is no longer available. You can return to your Chats tab." onBack={back} />
      ) : !room ? (
        chat.roomError ? (
          <FullState title="Could not load chat" detail={chat.roomError instanceof Error ? chat.roomError.message : 'Check your network connection and try again.'} onBack={back}
            onRetry={() => void chat.refresh().catch(handleError)} />
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 text-sm text-[#8992a5]"><LoaderCircle size={19} className="animate-spin" /> Loading conversation…</div>
        )
      ) : (
        <>
          <ChatRoomHeader peer={room.otherUser} activeThought={room.activeThought}
            realtime={chat.realtime} onBack={back}
            onReadThought={() => setSheet('currentThought')}
            onCloseConnection={() => setSheet('closeConnection')} />
          {chat.messagesError && <div role="alert" className="shrink-0 bg-[#fff4e9] px-4 py-2 text-xs text-[#9a5b35]">
            Some messages could not load. <button className="font-bold underline" onClick={() => void chat.refresh().catch(handleError)}>Retry</button>
          </div>}
          <MessageTimeline messages={chat.messages} uid={uid} peerName={room.otherUser.name} roomId={room.roomId}
            hasMore={chat.hasMore} loadingOlder={chat.loadingOlder} busy={chat.actionBusy}
            onLoadOlder={chat.loadOlder} onDecision={decide} onBottomChange={setAtBottom} onError={handleError} />
          {error && <div role="alert" className="flex shrink-0 items-center justify-between gap-2 bg-[#fff0e9] px-4 py-2 text-xs text-[#ae4834]">
            <span>{error}</span><button type="button" className="shrink-0 font-bold underline" onClick={() => setError('')}>Dismiss</button>
          </div>}
          <ChatComposer draft={messageDraft} onDraftChange={value => { setMessageDraft(value); setMessageAttemptId(null); }}
            onSendMessage={sendMessage} busy={chat.actionBusy} onOpenThoughtComposer={() => setSheet('newThought')} />
          {sheet === 'currentThought' && <CurrentThoughtSheet thought={room.activeThought} onClose={() => setSheet(null)} />}
          {sheet === 'newThought' && <ThoughtComposerSheet draft={thoughtDraft} onDraftChange={value => { setThoughtDraft(value); setThoughtAttemptId(null); }}
            onSend={sendThought} onClose={() => setSheet(null)} busy={chat.actionBusy} />}
          {sheet === 'closeConnection' && <CloseConnectionSheet peerName={room.otherUser.name} onConfirm={closeConnection} onClose={() => setSheet(null)} busy={chat.actionBusy} />}
        </>
      )}
    </div>
  );
}
