import { useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import {
  Heart,
  RefreshCcw,
} from "lucide-react";

import { ProfileCard } from "./ProfileCard";

import type {
  DiscoveryProfile,
} from "../schemas/discovery.schemas";

type Props = {
  currentProfile: DiscoveryProfile | null;
  nextProfile: DiscoveryProfile | null;

  onNext: () => void;
  onRestart: () => void;

  onCurious: (profile: DiscoveryProfile) => void;

  isSending?: boolean;
  requestError?: string | null;
  loadingMore?: boolean;
};

export function DiscoveryDeck({
  currentProfile,
  nextProfile,
  onNext,
  onRestart,
  onCurious,
  isSending = false,
  requestError,
  loadingMore = false,
}: Props) {
  const [isTransitioning, setIsTransitioning] =
    useState(false);

  const handleNext = () => {
    if (
      !currentProfile ||
      isSending ||
      isTransitioning
    ) {
      return;
    }

    setIsTransitioning(true);

    onNext();
  };

  // More profiles are loading.
  if (!currentProfile && loadingMore) {
    return (
      <div
        className="
          flex h-full items-center justify-center
           bg-white
          text-sm text-zinc-500
        "
      >
        Finding more people...
      </div>
    );
  }

  // No profiles available.
  if (!currentProfile && !isTransitioning) {
    return (
      <div
        className="
          flex h-full flex-col
          items-center justify-center
           bg-white
          px-6 text-center shadow-sm
        "
      >
        <Heart
          className="mb-4 text-[#f27356]"
          size={36}
        />

        <h2 className="text-xl font-semibold text-zinc-900">
          You're all caught up
        </h2>

        <p className="mt-2 text-sm text-zinc-500">
          New people will appear here when available.
        </p>

        <button
          type="button"
          onClick={onRestart}
          className="
            mt-6 inline-flex items-center gap-2
            rounded-full bg-[#f27356]
             font-semibold text-white
          "
        >
          <RefreshCcw size={16} />
          Start again
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Next profile preview */}
      {nextProfile && (
        <div
          className="
            absolute inset-x-3 inset-y-3
            scale-[0.975]
            overflow-hidden rounded-[30px]
            opacity-60
          "
        >
          <ProfileCard
            profile={nextProfile}
            preview
          />
        </div>
      )}

      {/* Current profile */}
      <AnimatePresence
        initial={false}
        mode="popLayout"
        onExitComplete={() => {
          setIsTransitioning(false);
        }}
      >
        {currentProfile && (
          <motion.div
            key={currentProfile.id}
            className="absolute inset-0 touch-pan-y"

            initial={{
              x: 45,
              opacity: 0,
              scale: 0.98,
            }}

            animate={{
              x: 0,
              opacity: 1,
              scale: 1,
            }}

            exit={{
              x: -330,
              opacity: 0,
              rotate: -8,
            }}

            transition={{
              duration: 0.26,
              ease: "easeOut",
            }}

            drag={isSending ? false : "x"}

            dragConstraints={{
              left: 0,
              right: 0,
            }}

            dragElastic={{
              left: 0.8,
              right: 0.12,
            }}

            onDragEnd={(_event, info) => {
              if (
                info.offset.x < -110 ||
                info.velocity.x < -700
              ) {
                handleNext();
              }
            }}
          >
            <ProfileCard
              profile={currentProfile}

              onCurious={() => {
                onCurious(currentProfile);
              }}

              curiousDisabled={
                isSending || isTransitioning
              }

              curiousLoading={isSending}

              onSkip={handleNext}

              skipDisabled={
                isTransitioning || isSending
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request error */}
      {requestError && (
        <div
          role="alert"
          className="
            absolute inset-x-2 top-3 z-30
            rounded-xl border border-red-200
            bg-white px-3 py-2
            text-center text-sm font-medium
            text-red-700 shadow-lg
          "
        >
          {requestError}
        </div>
      )}
    </div>
  );
}