import { Link } from "react-router";
import { MessageCircleHeart } from "lucide-react";

export function ChatsEmptyState() {
  return (
    <div
      className="
        flex min-h-[60dvh] flex-col
        items-center justify-center
        px-8 text-center
      "
    >
      {/* Icon */}
      <div
        className="
          mb-6 flex size-20 items-center
          justify-center rounded-full
          bg-[#fff0e8]
        "
      >
        <MessageCircleHeart
          className="size-9 text-[#f27356]"
          strokeWidth={1.6}
        />
      </div>

      {/* Heading */}
      <h2
        className="
          text-xl font-semibold
          text-[#24232d]
        "
      >
        No conversations yet
      </h2>

      {/* Description */}
      <p
        className="
          mt-3 max-w-[280px]
          text-sm leading-6
          text-[#807c80]
        "
      >
        Every connection starts with curiosity.
        Discover someone interesting and
        start sharing thoughts.
      </p>

      {/* Action */}
      <Link
        to="/app/discover"
        className="
          mt-7 inline-flex items-center
          justify-center rounded-full
          bg-[#f27356] px-7 py-3
          text-sm font-semibold text-white
          transition-colors
          hover:bg-[#e36549]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#f27356]
          focus-visible:ring-offset-2
        "
      >
        Discover People
      </Link>
    </div>
  );
}