import { Compass, RotateCcw } from "lucide-react";

interface Props {
  onRestart: () => void;
  hasProfiles: boolean;
}

export default function DiscoveryEmptyState({
  onRestart,
  hasProfiles,
}: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#fffaf7] to-[#ffe4d6] px-8 text-center">

      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
        <Compass
          size={38}
          strokeWidth={1.6}
          className="text-[#f27356]"
        />
      </div>

      {/* Message */}
      <h2 className="text-2xl font-bold text-[#29232d]">
        {hasProfiles
          ? "You've explored everyone!"
          : "No profiles available"}
      </h2>

      <p className="mt-3 max-w-xs text-sm leading-6 text-[#77717a]">
        {hasProfiles
          ? "Every connection begins with curiosity. Take another look — someone might catch your eye."
          : "There are no profiles to discover right now. Check back later."}
      </p>

      {/* Restart */}
      {hasProfiles && (
        <button
          type="button"
          onClick={onRestart}
          className="mt-8 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#f27356] px-7 font-semibold text-white shadow-lg shadow-[#f27356]/20 transition-transform active:scale-[0.97]"
        >
          <RotateCcw size={18} />

          Start Again
        </button>
      )}
    </div>
  );
}