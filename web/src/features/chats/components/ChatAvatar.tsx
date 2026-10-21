import { useEffect, useState } from "react";

type ChatAvatarProps = {
  name: string;
  photoUrl: string | null;
};

export function ChatAvatar({
  name,
  photoUrl,
}: ChatAvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className="
        relative flex size-14 shrink-0
        items-center justify-center
        overflow-hidden rounded-full
        bg-[#ffe9dd]
      "
    >
      {photoUrl && !imageError ? (
        <img
          src={photoUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-xl font-semibold text-[#f27356]">
          {initial}
        </span>
      )}
    </div>
  );
}