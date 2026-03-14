import { useEffect, useRef, useCallback } from "react";
import { Realtime, Types } from "ably";

let _ablyClient: Realtime | null = null;

/**
 * Get or create the Ably Realtime client for the frontend
 */
function getAblyClient(): Realtime {
  if (!_ablyClient) {
    const token = sessionStorage.getItem("ably_token");
    if (!token) {
      throw new Error("Ably token not found in session storage");
    }

    _ablyClient = new Realtime({
      authUrl: "/api/ably/auth",
      autoConnect: true,
    });
  }

  return _ablyClient;
}

/**
 * Hook to subscribe to an Ably channel and listen for events
 * @param channelName - Name of the Ably channel to subscribe to
 * @param eventName - Name of the event to listen for (optional, subscribes to all if not provided)
 * @param onMessage - Callback function when a message is received
 * @returns Cleanup function
 */
export function useAblyChannel(
  channelName: string,
  eventName: string | null,
  onMessage: (message: Types.Message) => void
): () => void {
  const channelRef = useRef<Types.RealtimeChannel | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      const client = getAblyClient();
      const channel = client.channels.get(channelName);
      channelRef.current = channel;

      if (eventName) {
        channel.subscribe(eventName, onMessage);
        unsubscribeRef.current = () => channel.unsubscribe(eventName);
      } else {
        channel.subscribe(onMessage);
        unsubscribeRef.current = () => channel.unsubscribe();
      }

      console.log(`[Ably] Subscribed to channel "${channelName}"${eventName ? ` for event "${eventName}"` : ""}`);

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          console.log(`[Ably] Unsubscribed from channel "${channelName}"`);
        }
      };
    } catch (error) {
      console.error(`[Ably] Failed to subscribe to channel "${channelName}":`, error);
      return () => {};
    }
  }, [channelName, eventName, onMessage]);

  return useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
  }, []);
}

/**
 * Hook to publish a message to an Ably channel
 * @param channelName - Name of the Ably channel
 * @returns Function to publish a message
 */
export function useAblyPublish(channelName: string) {
  const publishMessage = useCallback(
    async (eventName: string, data: any) => {
      try {
        const client = getAblyClient();
        const channel = client.channels.get(channelName);
        await channel.publish(eventName, data);
        console.log(`[Ably] Published event "${eventName}" to channel "${channelName}"`);
      } catch (error) {
        console.error(`[Ably] Failed to publish to channel "${channelName}":`, error);
        throw error;
      }
    },
    [channelName]
  );

  return publishMessage;
}

/**
 * Hook to get presence information for a channel
 * @param channelName - Name of the Ably channel
 * @returns Array of presence members
 */
export function useAblyPresence(channelName: string) {
  const [members, setMembers] = React.useState<Types.PresenceMessage[]>([]);

  useEffect(() => {
    try {
      const client = getAblyClient();
      const channel = client.channels.get(channelName);

      const updateMembers = async () => {
        const presenceMembers = await channel.presence.get();
        setMembers(presenceMembers);
      };

      channel.presence.subscribe("enter", updateMembers);
      channel.presence.subscribe("leave", updateMembers);
      channel.presence.subscribe("update", updateMembers);

      updateMembers();

      return () => {
        channel.presence.unsubscribe();
      };
    } catch (error) {
      console.error(`[Ably] Failed to get presence for channel "${channelName}":`, error);
      return () => {};
    }
  }, [channelName]);

  return members;
}
