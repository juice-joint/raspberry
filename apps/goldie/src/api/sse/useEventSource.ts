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

  const query = useQuery({
    gcTime: 0,
    staleTime: Infinity,
    queryKey: ["sse", SSE_URL],
    queryFn: () => {
      return new Promise((resolve) => {
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
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["sse", SSE_URL] });
            }, 1000);
            eventSource?.close();
          };

          // resolve once connection is open
          eventSource.onopen = () => resolve(null);
        } else {
          resolve(null);
        }
      });
    },
    retry: true,
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
