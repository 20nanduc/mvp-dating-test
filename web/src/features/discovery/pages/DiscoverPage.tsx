import { useState } from "react";

import {
  Outlet,
  useNavigate,
} from "react-router";

import { DiscoveryDeck } from "../components/DiscoveryDeck";

import { useDiscovery } from "../hooks/useDiscovery";

import { useSendConnection } from "../hooks/useRequestConnection";

import type {
  DiscoveryProfile,
} from "../schemas/discovery.schemas";

export function DiscoverPage() {
  const navigate = useNavigate();

  const [requestError, setRequestError] =
    useState<string | null>(null);

  const discovery = useDiscovery();

  const {
    sendConnection,
    isSending,
  } = useSendConnection();

  const handleCurious = async (
    profile: DiscoveryProfile,
  ) => {
    if (isSending) {
      return;
    }

    setRequestError(null);

    try {
      // Step 1: Create request in Firestore
      await sendConnection({
        receiverId: profile.id,
      });

      // Step 2: Remove requested profile
      // from the SWR Discovery cache.
      await discovery.removeRequestedProfile(
        profile.id,
      );

      // Step 3: Show success confirmation
      navigate("/app/discover/sent", {
        state: {
          receiverName: profile.name,
          receiverPhoto: profile.profilePic,
        },
      });
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Unable to send curiosity.",
      );
    }
  };

  return (
    <main
      className="
        mx-auto flex
        h-[calc(100dvh-80px)]
        w-full max-w-md
        flex-col
        bg-[#fffaf7]
       
      "
    >
      {/* Discovery cards */}
      <div className="min-h-0 flex-1">
        {discovery.isLoading &&
        !discovery.currentProfile ? (
          <div
            className="
              flex h-full items-center justify-center
              text-sm text-zinc-500
            "
          >
            Finding profiles...
          </div>
        ) : discovery.error &&
          !discovery.currentProfile ? (
          <div
            className="
              flex h-full flex-col
              items-center justify-center
              gap-3 text-sm text-red-700
            "
          >
            <p>
              Couldn't load profiles. Please try again.
            </p>

            <button
              type="button"
              className="
                rounded-full bg-[#f27356]
                px-5 py-2
                font-semibold text-white
              "
              onClick={() => {
                void discovery.revalidate();
              }}
            >
              Retry
            </button>
          </div>
        ) : (
          <DiscoveryDeck
            currentProfile={discovery.currentProfile}
            nextProfile={discovery.nextProfile}

            onNext={discovery.onNext}
            onRestart={discovery.onRestart}

            onCurious={(profile) => {
              void handleCurious(profile);
            }}

            isSending={isSending}
            requestError={requestError}

            loadingMore={
              discovery.isValidating &&
              discovery.hasMore
            }
          />
        )}
      </div>

      {/* Nested success screen */}
      <Outlet />
    </main>
  );
}