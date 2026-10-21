import useSWRMutation from "swr/mutation";

import {
  sendConnectionRequest,
  type sendConnectionResponse,
} from "@/features/discovery/services/connectionService";

type Argument = {
  receiverId: string;
};

export function useSendConnection() {
  const {
    trigger,
    isMutating,
    error,
    reset,
  } = useSWRMutation<
    sendConnectionResponse,
    Error,
    string,
    Argument
  >(
    "connections/send-connection",
    (_key, { arg }) => sendConnectionRequest(arg.receiverId),
  );

  return {
    sendConnection: trigger,
    isSending: isMutating,
    error,
    reset,
  };
}