import { Link } from "react-router";
import type { ChatPreview } from "../schemas/chats.schemas";
import { ChatAvatar } from "./ChatAvatar";

type Props = {
  chat: ChatPreview;
};

export function ChatListItem({ chat }: Props) {
  const thought =
    chat.activeThought.trim() ||
    "Let's get to know each other";

  const badge =
    chat.unreadCount > 99
      ? "99+"
      : String(chat.unreadCount);

  return (
    <li>
      <Link
        to={`/app/chats/${encodeURIComponent(chat.connectionId)}`}
        className="
          flex w-full min-w-0 items-center
          gap-3.5 border-b border-[#f3eeea]
          px-5 py-3.5
          transition-colors
          hover:bg-[#fff7f2]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#f27356]
        "
      >
        <ChatAvatar
          name={chat.name}
          photoUrl={chat.photoUrl}
        />

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] text-left font-semibold text-[#24232d]">
              {chat.name}
            </p>

            <p
              title={thought}
              className="
                mt-1 text-left block w-full truncate
                text-[13px] leading-5
                text-[#807c80]
              "
            >
              {thought}
            </p>
          </div>

          {chat.unreadCount > 0 && (
            <span
              className="
                flex min-h-6 min-w-6 shrink-0
                items-center justify-center
                rounded-full bg-[#f27356]
                px-1.5 text-[11px]
                font-bold text-white
              "
            >
              {badge}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}