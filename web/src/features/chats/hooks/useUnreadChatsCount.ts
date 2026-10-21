import useSWR from "swr";

import { useAuth } from "@/features/auth/context/AuthProvider";

import {
  chatsService,
  ChatsApiError,
} from "@/features/chats/services/chatService";

export function useUnreadChatsCount() {
  const { user } = useAuth();

  const uid = user?.auth_id;

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR(
    uid ? ["chats-unread-count", uid] : null,

    () => chatsService.getUnreadChatsCount(),

    {
      refreshInterval: 30_000,

      revalidateOnFocus: true,

      revalidateOnReconnect: true,

      dedupingInterval: 5_000,

      shouldRetryOnError: (error) =>
        !(error instanceof ChatsApiError && error.status === 401),
    }
  );

  return {
    count: data?.count ?? 0,

    isLoading,
    error,

    refresh: mutate,
  };
}