import type { DiscoveryProfile } from "@/features/discovery/schemas/discovery.schemas";

export const mockProfiles: DiscoveryProfile[] = [
  {
    id: "user-1",
    name: "Ananya",
    dob: "1999-05-12",
    state: "Karnataka",
    profilePic:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=85",
    interests: ["Photography", "Travel", "Music", "Art"],
  },
  {
    id: "user-2",
    name: "Meera",
    dob: "1998-08-21",
    state: "Kerala",
    profilePic:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=85",
    interests: ["Reading", "Cooking", "Travel", "Movies"],
  },
  {
    id: "user-3",
    name: "Arjun",
    dob: "1997-04-10",
    state: "Maharashtra",
    profilePic:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=85",
    interests: ["Fitness", "Technology", "Travel"],
  },
  {
    id: "user-4",
    name: "Diya",
    dob: "2000-01-15",
    state: "Tamil Nadu",
    profilePic:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1000&q=85",
    interests: ["Music", "Art", "Nature", "Photography"],
  },
  {
    id: "user-5",
    name: "Rahul",
    dob: "1996-09-18",
    state: "Telangana",
    profilePic:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=85",
    interests: ["Sports", "Gaming", "Travel"],
  },
];