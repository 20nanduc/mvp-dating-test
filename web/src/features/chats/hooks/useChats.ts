import useSWR from "swr";

import { useAuth } from "@/features/auth/context/AuthProvider";

import {
  chatsService,
  ChatsApiError,
} from "@/features/chats/services/chatService";

export function useChats() {
  const { user } = useAuth();

  const uid = user?.auth_id;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    uid ? ["chats", uid] : null,

    () => chatsService.getChats(),

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
    chats: data?.chats ?? [],

    isLoading,
    isValidating,

    error,

    refresh: mutate,
  };
}