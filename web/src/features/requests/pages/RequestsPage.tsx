import { useState } from "react";
import { useSWRConfig } from "swr";

import RequestCard from "@/features/requests/components/RequestCard";
import { useRequests } from "@/features/requests/hooks/useRequests";
import {
  requestService,
  REQUESTS_COUNT_KEY,
} from "@/features/requests/services/requestService";

type Decision = "accept" | "reject";

export function RequestsPage() {
  const { data, isLoading, error, mutate } = useRequests();
  const { mutate: mutateGlobal } = useSWRConfig();

  const [busy, setBusy] = useState(false);
  const [exit, setExit] = useState<Decision | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const requests = data ?? [];
  const current = requests[0];
  const next = requests[1];

  async function handleDecision(action: Decision) {
    if (!current || busy) return;

    setBusy(true);
    setActionError(null);

    try {
      // Never animate/remove before backend success.
      await requestService.decide(current.id, action);

      setExit(action);

      await new Promise((resolve) => setTimeout(resolve, 280));

      // Remove the resolved request from SWR's local cache.
      await mutate(
        (previous) =>
          previous?.filter((item) => item.id !== current.id),
        { revalidate: false },
      );

      // Update the dashboard badge immediately.
      await mutateGlobal(
        REQUESTS_COUNT_KEY,
        (previous: { count: number } | undefined) =>
          previous
            ? { count: Math.max(0, previous.count - 1) }
            : previous,
        { revalidate: false },
      );

      // Reconcile both caches with the backend.
      void mutate();
      void mutateGlobal(REQUESTS_COUNT_KEY);
    } catch {
      setActionError("Couldn't update the request. Please try again.");
    } finally {
      setExit(null);
      setBusy(false);
    }
  }

  return (
    <main className="flex h-[calc(100dvh-88px)] flex-col">
      {isLoading && (
        <p className="mt-12 text-center text-neutral-500">
          Loading requests...
        </p>
      )}

      {error && (
        <div className="mt-12 text-center">
          <p className="text-red-600">Failed to load requests.</p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-3 font-semibold text-[#f27356]"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && !current && (
        <div className="flex flex-1 px-5 flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold">
            No requests yet
          </h2>
          <p className="mt-2 max-w-xs text-sm text-neutral-500">
            When someone is curious about you, their profile
            will appear here.
          </p>
        </div>
      )}

      {current && (
        <div className="relative min-h-0 flex-1">
          {next && (
            <div
              aria-hidden="true"
              className="absolute inset-x-3 bottom-0 top-3 overflow-hidden bg-neutral-300"
            >
              {next.sender.profilePic && (
                <img
                  src={next.sender.profilePic}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          )}

          <div
            key={current.id}
            className={`absolute inset-x-0 bottom-3 top-0 z-10 transition-all duration-300 ease-out ${
              exit === "accept"
                ? "translate-x-[120%] rotate-12 opacity-0"
                : exit === "reject"
                  ? "-translate-x-[120%] -rotate-12 opacity-0"
                  : ""
            }`}
          >
            <RequestCard
              request={current}
              disabled={busy}
              onAccept={() => void handleDecision("accept")}
              onReject={() => void handleDecision("reject")}
            />
          </div>
        </div>
      )}

      {actionError && (
        <p role="alert" className="mt-3 text-center text-sm text-red-600">
          {actionError}
        </p>
      )}
    </main>
  );
}