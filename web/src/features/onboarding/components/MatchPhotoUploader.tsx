import { useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";

import { MAX_PHOTO_SIZE } from "../services/imageProcessor";

type MatchPhotoUploaderProps = {
  value?: File;
  initialPhotoUrl?: string | null;
  onChange: (file: File) => void;
  error?: string;
  disabled?: boolean;
};


export function MatchPhotoUploader({
  value,
  initialPhotoUrl,
  onChange,
  error,
  disabled = false,
}: MatchPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string>();
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!value) {
      setPreview(undefined);
      return;
    }

    const url = URL.createObjectURL(value);

    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [value]);

  const displayedPhoto = value ? preview : initialPhotoUrl;

  function selectPhoto(file?: File) {
    if (!file || disabled) return;

    setLocalError("");

    const accepted = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!accepted.includes(file.type)) {
      setLocalError("Choose JPEG, PNG or WebP");
      return;
    }

    if (file.size === 0 || file.size > MAX_PHOTO_SIZE) {
      setLocalError("Photo must be under 5 MB");
      return;
    }

    onChange(file);
  }

  return (
    <section aria-label="Photo selection">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm text-[#24232d] font-semibold">
          Your match photo
        </h2>

        <span className="text-xs text-zinc-500">
          4:5 portrait
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Upload your match photo"
        disabled={disabled}
        onChange={(event) => {
          selectPhoto(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="mx-auto mt-3 w-[min(68%,245px)]">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label={displayedPhoto ? "Replace photo" : "Choose photo"}
          className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-[1.6rem] border-2 border-dashed border-[#e6c5b9] bg-[#fff1e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f27356] disabled:opacity-60"
        >
          {displayedPhoto ? (
            <img
              src={displayedPhoto}
              alt="Your match photo"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex flex-col items-center gap-2 text-[#a16f61]">
              <Camera size={36} strokeWidth={1.4} />

              <span className="text-sm font-medium">
                Choose Photo
              </span>
            </span>
          )}
        </button>
      </div>

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#e76d51] disabled:opacity-50"
        >
          <RotateCcw size={16} />

          {preview ? "Replace Photo" : "Upload Photo"}
        </button>
      </div>

      <p className="text-center text-xs text-zinc-500">
        JPEG, PNG or WebP • Maximum 5 MB
      </p>

      {(localError || error) && (
        <p
          role="alert"
          className="mt-2 text-center text-xs text-red-600"
        >
          {localError || error}
        </p>
      )}
    </section>
  );
}