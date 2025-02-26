import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatSong } from "../../utils/format";
import { Song } from "../api-types";
import { useQueue } from "../queries/useQueue";
import { QUERY_KEYS } from "../queryKeys";
import { SSE_URL } from "./eventSource";
import { EventType, type SSEEvent } from "./types";

let eventSource: EventSource | null = null;

export const useEventSource = () => {
  const queryClient = useQueryClient();
  const getQueue = useQueue();

  // set up query defaults
  queryClient.setQueryDefaults(["sse", SSE_URL], {
    gcTime: 0,
    staleTime: Infinity,
    retry: 10,
    queryFn: () => {
      return new Promise((resolve, reject) => {
        if (!eventSource) {
          eventSource = new EventSource(new URL(SSE_URL));

          getQueue.refetch();

          eventSource.onmessage = (event) => {
            console.log(event);
            try {
              const data = JSON.parse(event.data) as SSEEvent;
              switch (data.type) {
                case EventType.QueueChangeEvent:
                  queryClient.setQueryData<Song[]>(
                    QUERY_KEYS.queue,
                    data.queue.map(formatSong)
                  );
                  break;
                case EventType.KeyChange:
                  queryClient.setQueryData<number>(
                    QUERY_KEYS.key,
                    data.current_key
                  );
                  break;
                case EventType.TogglePlayback: {
                  const oldQueryData = queryClient.getQueryData<boolean>(
                    QUERY_KEYS.playback
                  );
                  queryClient.setQueryData(QUERY_KEYS.playback, !oldQueryData);
                  break;
                }
                case EventType.RestartSong: {
                  const oldQueryData = queryClient.getQueryData<boolean>(
                    QUERY_KEYS.restart
                  );
                  queryClient.setQueryData(QUERY_KEYS.restart, !oldQueryData);
                  break;
                }
                default:
                  console.warn("invalid event type", data);
                  return;
              }
            } catch (e) {
              console.error("failed to parse sse data bestie:", e);
            }
          };

          eventSource.onerror = () => {
            console.error("error");
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["sse", SSE_URL] });
            }, 1000);
            eventSource?.close();
            eventSource = null;
            console.log("rejecting");
            reject();
          };

          eventSource.onopen = () => {
            getQueue.refetch();
            console.log("its open");
            queryClient.invalidateQueries({ queryKey: ["sse", SSE_URL] });
            resolve(null);
          };
        } else {
          resolve(null);
        }

        // add cleanup function
        return () => {
          console.log("cleaning up sse connection");
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        };
      });
    },
  });

  const query = useQuery({
    queryKey: ["sse", SSE_URL],
    enabled: true,
  });

  if (eventSource?.readyState === EventSource.CLOSED) {
    eventSource = null;
    queryClient.invalidateQueries({ queryKey: ["sse", SSE_URL] });
  }

  return {
    ...query,
    isConnected: !query.isLoading,
  };
};
