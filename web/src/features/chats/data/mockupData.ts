import type { ChatPreview } from "../schemas/chats.schemas";

export const mockChats: ChatPreview[] = [
  {
    connectionId: "mock-anjali",
    name: "Anjali",
    photoUrl: "https://i.pravatar.cc/160?img=47",
    activeThought:
      "What is one small thing that can instantly make a difficult day feel better?",
    unreadCount: 5,
  },
  {
    connectionId: "mock-rahul",
    name: "Rahul",
    photoUrl: "https://i.pravatar.cc/160?img=12",
    activeThought: "What's your dream trip?",
    unreadCount: 2,
  },
  {
    connectionId: "mock-priya",
    name: "Priya",
    photoUrl: "https://i.pravatar.cc/160?img=44",
    activeThought: "Let's get to know each other",
    unreadCount: 0,
  },
  {
    connectionId: "mock-sneha",
    name: "Sneha",
    photoUrl: "https://i.pravatar.cc/160?img=49",
    activeThought:
      "Do you believe friendship is the foundation of love?",
    unreadCount: 1,
  },
];