import { ChatList } from "@/features/chats/components/ChatList";
import { ChatsEmptyState } from "@/features/chats/components/ChatEmptyState";
import { useChats } from "@/features/chats/hooks/useChats";

export function ChatsPage() {
  const { chats, isLoading, error, refresh } = useChats();

  return (
    <section className="min-h-full w-full bg-[#fffdfb]">
      <header className="px-5 pb-3 pt-6">
        <h1 className="text-2xl font-bold text-foreground">
          Chats
        </h1>
      </header>

      {isLoading && chats.length === 0 ? (
        <div
          role="status"
          className="px-5 py-8 text-sm text-gray-500"
        >
          Loading conversations...
        </div>
      ) : error && chats.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-gray-500">
            Could not load conversations.
          </p>

          <button
            type="button"
            onClick={() => void refresh()}
            className="
              mt-4 rounded-full bg-[#f27356]
              px-6 py-3 text-white
            "
          >
            Try again
          </button>
        </div>
      ) : chats.length === 0 ? (
        <ChatsEmptyState />
      ) : (
        <ChatList chats={chats} />
      )}
    </section>
  );
}