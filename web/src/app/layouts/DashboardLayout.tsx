import { NavLink, Outlet } from "react-router";
import {
  Compass,
  Heart,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { useUnreadChatsCount } from "@/features/chats/hooks/useUnreadChatsCount";
import { useRequestsCount } from "@/features/requests/hooks/useRequests";

const navItems = [
  { label: "Discover", path: "/app/discover", icon: Compass },
  { label: "Requests", path: "/app/requests", icon: Heart },
  { label: "Chats", path: "/app/chats", icon: MessageCircle },
  { label: "Profile", path: "/app/profile", icon: UserRound },
];

export function DashboardLayout() {
  const { data: requestCount } = useRequestsCount();

  // Conversations containing unread messages
  const { count: unreadChatCount } = useUnreadChatsCount();

   const pendingRequests = requestCount?.count ?? 0;

  return (
    <div className="h-dvh bg-gray-100">
      <div className="mx-auto flex h-full w-full max-w-md flex-col bg-white">

        {/* Active page */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>

        {/* Bottom navigation */}
        <nav
          aria-label="Main navigation"
          className="shrink-0 border-t border-gray-100 bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        >
          <div className="flex justify-around">
            {navItems.map(({ label, path, icon: Icon }) => {
              // Dynamic badge based on tab
              const badge =
                path === "/app/requests"
                  ? pendingRequests
                  : path === "/app/chats"
                    ? unreadChatCount
                    : 0;
              return (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `flex flex-1 flex-col items-center gap-1 py-1 ${isActive
                      ? "text-[#f27356]"
                      : "text-gray-400"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative">
                        <Icon
                          size={24}
                          strokeWidth={isActive ? 2.5 : 1.8}
                        />

                        {/* Dynamic badge */}
                        {badge > 0 && (
                          <span className="absolute -right-3 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f27356] px-1 text-[10px] font-bold text-white">
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-medium">
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}