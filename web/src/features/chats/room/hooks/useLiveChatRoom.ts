import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAuth } from 'firebase/auth';
import useSWR, { useSWRConfig } from 'swr';
import { io } from 'socket.io-client';
import { chatRoomApi, ChatApiError, SOCKET_ORIGIN } from '@/features/chats/room/services/chatRoomApi';
import {
  chatMessageSchema,
  type ChatMessage, type MessagesPage, type ThoughtDecision,
} from '@/features/chats/room/types/chatRoomApi.types';

type RealtimeState = 'connecting' | 'connected' | 'fallback';
type OlderPages = { roomId: string; pages: MessagesPage[]; nextCursor: string | null; hasMore: boolean };

type LiveEvent = { connectionId?: string; roomId?: string; message?: unknown; messageId?: string };

// IMPORTANT: If the existing Chats hooks use different SWR keys, adjust this one
// predicate. Do NOT rename or replace the existing Chats list / unread APIs.
function existingChatsKey(key: unknown, uid: string) {
  const parts = typeof key === 'string' ? [key] : Array.isArray(key) ? key : [];
  const tokens = parts.filter((v): v is string => typeof v === 'string');
  if (tokens.length === 0) return false;
  if (tokens.some(v => v !== uid && /chat-room|chat-rooms/.test(v))) return false;
  return tokens.some(v => /^\/?chats(?:\/unread-count|\?.*)?$/.test(v) ||
    v === 'chats/unread-count');
}

function mergeTimeline(pages: MessagesPage[]): ChatMessage[] {
  const deduped = new Map<string, ChatMessage>();
  // Oldest loaded page first. The current page is always pages[0].
  for (const page of [...pages].reverse()) {
    for (const message of page.messages) deduped.set(message.id, message);
  }
  return [...deduped.values()].sort((a, b) =>
    Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}

export function useLiveChatRoom(connectionId?: string, uid?: string) {
  const { mutate: mutateGlobal } = useSWRConfig();
  const [realtime, setRealtime] = useState<RealtimeState>('connecting');
  const [closed, setClosed] = useState(false);
  const [older, setOlder] = useState<OlderPages | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  // A routed ChatRoomPage can remain mounted while connectionId changes.
  useEffect(() => {
    setClosed(false);
    setOlder(null);
    setRealtime('connecting');
  }, [connectionId, uid]);
  const readInFlight = useRef(false);
  const actionInFlight = useRef(false);
  const roomKey = connectionId && uid && !closed ? ['chat-room', uid, connectionId] : null;

  const {
    data: room, error: roomError, isLoading: roomLoading, mutate: mutateRoom,
  } = useSWR(roomKey, () => chatRoomApi.getRoom(connectionId!), {
    refreshInterval: realtime === 'connected' ? 0 : 12000,
    revalidateOnFocus: true,
  });
  const currentRoomId = room?.roomId;
  const messageKey = connectionId && uid && currentRoomId && !closed
    ? ['chat-room-messages', uid, connectionId, currentRoomId] : null;

  const {
    data: latestPage, error: messagesError, isLoading: messagesLoading, mutate: mutateRecent,
  } = useSWR(messageKey, () => chatRoomApi.getMessages(connectionId!), {
    refreshInterval: realtime === 'connected' ? 0 : 12000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    // If a closed connection was missed over the socket, polling still revokes UI access.
    if (roomError instanceof ChatApiError && [401, 403, 404].includes(roomError.status)) {
      setClosed(true);
    }
  }, [roomError]);

  const activeOlder = older?.roomId === currentRoomId ? older : null;
  const currentLatestPage = latestPage?.roomId === currentRoomId ? latestPage : undefined;
  const messages = useMemo(() => mergeTimeline([
    ...(currentLatestPage ? [currentLatestPage] : []),
    ...(activeOlder?.pages ?? []),
  ]), [currentLatestPage, activeOlder]);

  const hasMore = activeOlder ? activeOlder.hasMore : !!currentLatestPage?.hasMore;

  const refreshList = useCallback(() => {
    if (uid) void mutateGlobal(key => existingChatsKey(key, uid), undefined, { revalidate: true });
  }, [mutateGlobal, uid]);

  const appendMessage = useCallback((message: ChatMessage) => {
    void mutateRecent(page => {
      if (!page || page.roomId !== currentRoomId) return page;
      if (page.messages.some(item => item.id === message.id)) return page;
      return { ...page, messages: [...page.messages, message] };
    }, { revalidate: false });
  }, [currentRoomId, mutateRecent]);

  const updateProposalStatus = useCallback((messageId: string) => {
    const reject = (m: ChatMessage): ChatMessage =>
      m.id === messageId && m.type === 'THOUGHT_PROPOSAL'
        ? { ...m, proposalStatus: 'REJECTED' } : m;
    void mutateRecent(page => page ? { ...page, messages: page.messages.map(reject) } : page,
      { revalidate: false });
    setOlder(prev => prev && prev.roomId === currentRoomId ? {
      ...prev, pages: prev.pages.map(page => ({ ...page, messages: page.messages.map(reject) })),
    } : prev);
  }, [currentRoomId, mutateRecent]);

  useEffect(() => {
    if (!connectionId || !uid || !currentRoomId || closed) return;
    let disposed = false;
    setRealtime('connecting');
    const socket = io(SOCKET_ORIGIN, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      auth: async (callback: (data: { token: string }) => void) => {
        try { callback({ token: (await getAuth().currentUser?.getIdToken()) || '' }); }
        catch { callback({ token: '' }); }
      },
    });
    const refreshAll = () => { void mutateRoom(); void mutateRecent(); refreshList(); };

    let joinRetry: ReturnType<typeof setTimeout> | undefined;
    const join = (attempt: number) => {
      if (disposed) return;
      socket.emit('chat:join', { connectionId, roomId: currentRoomId },
        (ack: { ok?: boolean } | undefined) => {
          if (disposed) return;
          if (!ack?.ok && attempt < 3) {
            // The server authenticates asynchronously during connect.
            joinRetry = setTimeout(() => join(attempt + 1), 300 * (attempt + 1));
          } else {
            setRealtime(ack?.ok ? 'connected' : 'fallback');
            if (ack?.ok) refreshAll();
          }
        });
    };
    socket.on('connect', () => join(0));
    socket.on('disconnect', () => { if (!disposed) setRealtime('fallback'); });
    socket.on('connect_error', () => { if (!disposed) setRealtime('fallback'); });
    socket.on('chat:message', (payload: LiveEvent) => {
      if (payload?.connectionId !== connectionId || payload.roomId !== currentRoomId) return;
      const parsed = chatMessageSchema.safeParse(payload.message);
      if (parsed.success) {
        appendMessage(parsed.data);
        if (parsed.data.senderId !== uid) {
          void mutateRoom(old => old?.roomId === currentRoomId
            ? { ...old, unreadCount: old.unreadCount + 1 } : old,
            { revalidate: false });
        }
      } else void mutateRecent();
      refreshList();
    });
    socket.on('chat:thought_rejected', (payload: LiveEvent) => {
      if (payload?.connectionId === connectionId && payload.roomId === currentRoomId &&
          typeof payload.messageId === 'string') updateProposalStatus(payload.messageId);
    });
    socket.on('chat:room_switched', (payload: LiveEvent) => {
      if (payload?.connectionId !== connectionId || payload.roomId !== currentRoomId) return;
      // SWR's room key is stable; after refresh the message key changes to NEW roomId.
      void mutateRoom();
      refreshList();
    });
    socket.on('chat:connection_closed', (payload: LiveEvent) => {
      if (payload?.connectionId !== connectionId || payload.roomId !== currentRoomId) return;
      setClosed(true);
      refreshList();
    });
    socket.connect();
    return () => { disposed = true; if (joinRetry) clearTimeout(joinRetry); socket.removeAllListeners(); socket.disconnect(); };
  }, [connectionId, uid, currentRoomId, closed, appendMessage,
      mutateRecent, mutateRoom, updateProposalStatus, refreshList]);

  const refresh = useCallback(async () => {
    await Promise.all([mutateRoom(), mutateRecent()]);
    refreshList();
  }, [mutateRoom, mutateRecent, refreshList]);

  const loadOlder = useCallback(async () => {
    if (!connectionId || !currentRoomId || !currentLatestPage || loadingOlder || !hasMore) return;
    const cursor = activeOlder?.nextCursor ?? currentLatestPage.nextCursor;
    if (!cursor) return;
    setLoadingOlder(true);
    try {
      const page = await chatRoomApi.getMessages(connectionId, cursor);
      if (page.roomId !== currentRoomId) return;
      setOlder(prev => {
        const pages = prev?.roomId === currentRoomId ? prev.pages : [];
        return { roomId: currentRoomId, pages: [...pages, page],
          nextCursor: page.nextCursor, hasMore: page.hasMore };
      });
    } finally { setLoadingOlder(false); }
  }, [connectionId, currentRoomId, currentLatestPage, loadingOlder, hasMore, activeOlder]);

  const withAction = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    if (actionInFlight.current) throw new Error('Please finish the current action first.');
    actionInFlight.current = true;
    setActionBusy(true);
    try { return await action(); }
    finally { actionInFlight.current = false; setActionBusy(false); }
  }, []);

  const send = useCallback(async (rawText: string, clientMessageId: string = crypto.randomUUID()) => withAction(async () => {
    if (!connectionId || !currentRoomId || closed) throw new Error('Chat unavailable');
    const text = rawText.trim();
    if (!text || text.length > 4000) throw new Error('Message must be 1–4000 characters');
    // UUIDv4 must be unchanged if you implement retry for a timed-out POST.
    const result = await chatRoomApi.sendMessage(connectionId, currentRoomId, text, clientMessageId);
    appendMessage(result.message);
    refreshList();
    return result;
  }), [withAction, connectionId, currentRoomId, closed, appendMessage, refreshList]);

  const propose = useCallback(async (rawText: string, clientMessageId: string = crypto.randomUUID()) => withAction(async () => {
    if (!connectionId || !currentRoomId || closed) throw new Error('Chat unavailable');
    const text = rawText.trim();
    if (!text || text.length > 280) throw new Error('Thought must be 1–280 characters');
    const result = await chatRoomApi.proposeThought(connectionId, currentRoomId, text, clientMessageId);
    appendMessage(result.message);
    refreshList();
    return result;
  }), [withAction, connectionId, currentRoomId, closed, appendMessage, refreshList]);

  const decide = useCallback(async (messageId: string, decision: ThoughtDecision) => withAction(async () => {
    if (!connectionId || !currentRoomId || closed) throw new Error('Chat unavailable');
    const response = await chatRoomApi.decideThought(connectionId, currentRoomId, messageId, decision);
    if (decision === 'REJECT') updateProposalStatus(messageId);
    else await mutateRoom();
    refreshList();
    return response;
  }), [withAction, connectionId, currentRoomId, closed, updateProposalStatus, mutateRoom, refreshList]);

  const markVisibleRead = useCallback(async () => {
    if (!connectionId || !uid || !currentRoomId || !room?.unreadCount ||
        document.hidden || !document.hasFocus() || readInFlight.current) return;
    const lastIncoming = [...messages].reverse().find(m => m.senderId &&
      m.senderId !== uid && m.type !== 'THOUGHT_START');
    if (!lastIncoming) return;
    readInFlight.current = true;
    try {
      const result = await chatRoomApi.markRead(connectionId, currentRoomId, lastIncoming.id);
      if (result.cleared) {
        void mutateRoom(old => old?.roomId === currentRoomId ? { ...old, unreadCount: 0 } : old,
          { revalidate: false });
        refreshList();
      } else void mutateRoom();
    } finally { readInFlight.current = false; }
  }, [connectionId, uid, currentRoomId, room?.unreadCount, messages, mutateRoom, refreshList]);

  const closeConnection = useCallback(async () => withAction(async () => {
    if (!connectionId || !currentRoomId || closed) throw new Error('Chat unavailable');
    await chatRoomApi.closeConnection(connectionId, currentRoomId);
    setClosed(true);
    refreshList();
  }), [withAction, connectionId, currentRoomId, closed, refreshList]);

  return {
    room, messages, roomError, messagesError,
    isLoading: roomLoading || messagesLoading,
    hasMore, loadingOlder, loadOlder, actionBusy,
    realtime, closed, send, propose, decide, markVisibleRead, closeConnection, refresh,
  };
}
