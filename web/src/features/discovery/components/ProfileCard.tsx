import { Heart, MapPin, X } from "lucide-react";

import type {
  DiscoveryProfile,
} from "../schemas/discovery.schemas";

type Props = {
  profile: DiscoveryProfile;

  preview?: boolean;
  curious?: boolean;

  onCurious?: () => void;
  onSkip?: () => void;

  skipDisabled?: boolean;
  curiousDisabled?: boolean;
  curiousLoading?: boolean;
};

function ageFromDob(dob: string): number | null {
  const date = new Date(dob);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() - date.getFullYear();

  const month =
    today.getMonth() - date.getMonth();

  if (
    month < 0 ||
    (month === 0 && today.getDate() < date.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function ProfileCard({
  profile,
  preview = false,
  curious = false,
  onCurious,
  onSkip,
  skipDisabled = false,
  curiousDisabled = false,
  curiousLoading = false,
}: Props) {
  const age = ageFromDob(profile.dob);

  return (
    <article
      className="
        relative h-full w-full
        overflow-hidden 
        bg-[#ecd2c3]
        shadow-[0_20px_50px_rgba(63,42,40,0.16)]
      "
    >
      {/* Profile photo */}
      {profile.profilePic ? (
        <img
          src={profile.profilePic}
          alt={`${profile.name}'s profile`}
          draggable={false}
          className="
            absolute inset-0
            h-full w-full
            select-none object-cover
          "
        />
      ) : (
        <div
          className="
            absolute inset-0
            bg-gradient-to-br
            from-rose-200 to-orange-200
          "
        />
      )}

      {/* Gradient overlay */}
      <div
        className="
          pointer-events-none absolute inset-0
          bg-gradient-to-b
          from-black/0 via-black/10 to-black/85
        "
          />
          

      {/* Profile details */}
      <div
        className="
          absolute inset-x-0 bottom-0 z-10
          px-5 pb-5 text-white
        "
      >
        <h2 className="text-xl flex justify-start font-bold tracking-tight">
          {profile.name}
          {age !== null ? `, ${age}` : ""}
        </h2>

        <p
          className="
            mt-1 flex items-center gap-1.5
            text-sm text-white/90
          "
        >
          <MapPin size={15} aria-hidden="true" />
          {profile.state}
        </p>

        {/* Interests */}
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="
                rounded-full
                border border-white/35
                bg-white/20
                px-3 py-1
                text-xs font-medium
                backdrop-blur-md
              "
            >
              {interest}
            </span>
          ))}
        </div>

        {/* Actions */}
        {!preview && (
          <div className="mt-5 flex gap-3">
            {/* Skip */}
            <button
              type="button"
              onClick={onSkip}
              disabled={
                skipDisabled || curiousDisabled
              }
              aria-label="Skip profile"
              className="
                flex h-12 w-12 shrink-0
                items-center justify-center
                rounded-full
                border border-white/70
                bg-white/20
                backdrop-blur-lg
                transition
                disabled:opacity-50
              "
            >
              <X size={22} aria-hidden="true" />
            </button>

            {/* I'm Curious */}
            <button
              type="button"
              onClick={onCurious}
              disabled={
                curiousDisabled ||
                skipDisabled ||
                curious
              }
              className="
                flex h-12 flex-1
                items-center justify-center
                gap-2 rounded-full
                bg-[#f27356]
                px-4
                text-[15px] font-semibold
                shadow-lg shadow-black/10
                transition
                active:scale-[0.98]
                disabled:opacity-60
              "
            >
              <Heart
                size={17}
                fill="currentColor"
                aria-hidden="true"
              />

              {curiousLoading
                ? "Sending..."
                : curious
                  ? "Curiosity sent"
                  : "I'm Curious"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}