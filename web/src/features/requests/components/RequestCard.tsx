import { Heart, X, MapPin } from "lucide-react";
import type { IncomingRequest } from "@/features/requests/services/requestService";

interface Props {
  request: IncomingRequest;
  disabled: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function getAge(dob: string) {
  const birth = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
}

function timeAgo(date: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 60000),
  );

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;

  return `${Math.floor(minutes / 1440)}d ago`;
}

export default function RequestCard({
  request,
  disabled,
  onAccept,
  onReject,
}: Props) {
  const { sender } = request;

  return (
    <article className="relative h-full overflow-hidden bg-[#24232d] shadow-xl">
      {sender.profilePic && (
        <img
          src={sender.profilePic}
          alt={sender.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5" />

      <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs backdrop-blur-md">
          <Heart size={13} fill="currentColor" />
          Curious {timeAgo(request.createdAt)}
        </div>

        <h2 className="text-3xl text-left font-bold">
          {sender.name}, {getAge(sender.dob)}
        </h2>

        <div className="mt-2 flex items-center gap-1 text-sm text-white/85">
          <MapPin size={15} />
          {sender.state}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {sender.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs backdrop-blur-sm"
            >
              {interest}
            </span>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onReject}
            disabled={disabled}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white/20 font-semibold backdrop-blur-md disabled:opacity-50"
          >
            <X size={21} />
            Reject
          </button>

          <button
            type="button"
            onClick={onAccept}
            disabled={disabled}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#f27356] font-semibold disabled:opacity-50"
          >
            <Heart size={20} />
            Accept
          </button>
        </div>
      </div>
    </article>
  );
}