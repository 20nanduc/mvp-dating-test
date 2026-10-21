import useSWR from "swr";
import {
  requestService,
  REQUESTS_KEY,
  REQUESTS_COUNT_KEY,
} from "@/features/requests/services/requestService";

export function useRequests() {
  return useSWR(
    REQUESTS_KEY,
    requestService.getIncoming,
    {
      revalidateOnFocus: true,
    },
  );
}

export function useRequestsCount() {
  return useSWR(
    REQUESTS_COUNT_KEY,
    requestService.getCount,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000,
    },
  );
}