import type { ChatPreview } from "@/features/chats/schemas/chats.schemas";
import { ChatListItem } from "@/features/chats/components/ChatListItem";

type ChatListProps = {
  chats: ChatPreview[];
};

export function ChatList({ chats }: ChatListProps) {
  return (
    <ul
      aria-label="Conversations"
      className="w-full"
    >
      {chats.map((chat) => (
        <ChatListItem
          key={chat.connectionId}
          chat={chat}
        />
      ))}
    </ul>
  );
}