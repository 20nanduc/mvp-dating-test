import { useState } from "react";
import { Plus, X } from "lucide-react";

type InterestsInputProps = {
  value: string[];
  onChange: (interests: string[]) => void;
  error?: string;
  disabled?: boolean;
};

const SUGGESTIONS = [
  "Technology",
  "Travel",
  "Music",
  "Movies",
  "Reading",
  "Fitness",
  "Photography",
  "Cooking",
  "Nature",
  "Art",
  "Gaming",
  "Sports",
];

const MAX_INTERESTS = 10;

export function InterestsInput({
  value,
  onChange,
  error,
  disabled = false,
}: InterestsInputProps) {
  const [input, setInput] = useState("");

  function hasInterest(interest: string) {
    return value.some(
      (item) => item.toLowerCase() === interest.toLowerCase()
    );
  }

  function addInterest(raw: string) {
    const interest = raw.trim();

    if (
      !interest ||
      interest.length > 40 ||
      hasInterest(interest) ||
      value.length >= MAX_INTERESTS ||
      disabled
    ) {
      return;
    }

    onChange([...value, interest]);
    setInput("");
  }

  function removeInterest(interest: string) {
    if (disabled) return;

    onChange(
      value.filter(
        (item) => item.toLowerCase() !== interest.toLowerCase()
      )
    );
  }

  return (
    <section aria-label="Your interests">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">
          Your Interests
        </h2>

        <span className="text-xs text-zinc-500">
          {value.length}/{MAX_INTERESTS}
        </span>
      </div>

      <p className="mt-1 text-xs text-zinc-500">
        Choose what you enjoy or add your own.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((interest) => {
          const selected = hasInterest(interest);

          return (
            <button
              key={interest}
              type="button"
              disabled={
                disabled ||
                (!selected && value.length >= MAX_INTERESTS)
              }
              onClick={() =>
                selected
                  ? removeInterest(interest)
                  : addInterest(interest)
              }
              className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-50 ${
                selected
                  ? "border-[#f27356] bg-[#fff1e9] text-[#e36248]"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          maxLength={40}
          disabled={disabled || value.length >= MAX_INTERESTS}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addInterest(input);
            }
          }}
          placeholder="Add your interest"
          aria-label="Custom interest"
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-[#f27356]"
        />

        <button
          type="button"
          disabled={
            disabled ||
            !input.trim() ||
            value.length >= MAX_INTERESTS
          }
          onClick={() => addInterest(input)}
          className="flex items-center justify-center rounded-xl bg-[#f27356] px-4 text-white disabled:opacity-50"
          aria-label="Add interest"
        >
          <Plus size={18} />
        </button>
      </div>

      {value.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center gap-1 rounded-full bg-[#fff1e9] px-3 py-1.5 text-xs text-[#a16f61]"
            >
              {interest}

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeInterest(interest)}
                aria-label={`Remove ${interest}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}