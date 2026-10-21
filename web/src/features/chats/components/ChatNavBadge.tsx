import { useUnreadChatsCount } from "../hooks/useUnreadChatsCount";

export function ChatsNavBadge() {
  const { count } = useUnreadChatsCount();

  if (count === 0) return null;

  return (
    <span
      aria-label={`${count} conversations with unread messages`}
      className="
        absolute -right-3 -top-2
        flex h-5 min-w-5
        items-center justify-center
        rounded-full bg-[#f27356]
        px-1 text-[10px]
        font-bold text-white
      "
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}