/**
 * useAblySessions Hook — Real-Time Session Updates via Ably
 * 
 * Replaces polling with true live updates for:
 * - Q&A questions
 * - Transcript entries
 * - Provider state changes
 * - Participant join/leave events
 */

import { useEffect, useState, useCallback } from "react";
import * as Ably from "ably";

export interface AblyMessage {
  type: "qa" | "transcript" | "provider" | "participant";
  action: "new" | "updated" | "deleted";
  data: Record<string, unknown>;
  timestamp: number;
}

export const useAblySessions = (sessionId: string) => {
  const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [qaUpdates, setQaUpdates] = useState<AblyMessage[]>([]);
  const [transcriptUpdates, setTranscriptUpdates] = useState<AblyMessage[]>([]);
  const [providerUpdates, setProviderUpdates] = useState<AblyMessage[]>([]);
  const [participantUpdates, setParticipantUpdates] = useState<AblyMessage[]>([]);

  // Initialize Ably client
  useEffect(() => {
    const initializeAbly = async () => {
      try {
        // Get auth token from backend
        const tokenResponse = await fetch("/api/ably/token");
        const { token } = await tokenResponse.json();

        const client = new Ably.Realtime({
          token,
          autoConnect: true,
        });

        client.connection.on("connected", () => {
          setIsConnected(true);
          console.log("[Ably] Connected");
        });

        client.connection.on("disconnected", () => {
          setIsConnected(false);
          console.log("[Ably] Disconnected");
        });

        setAblyClient(client);
      } catch (error) {
        console.error("[Ably] Failed to initialize:", error);
      }
    };

    initializeAbly();

    return () => {
      ablyClient?.close();
    };
  }, []);

  // Subscribe to Q&A channel
  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const qaChannel = ablyClient.channels.get(`session:${sessionId}:qa`);

    qaChannel.subscribe("qa-update", (message: Ably.Types.Message) => {
      const update: AblyMessage = {
        type: "qa",
        action: message.data.action || "new",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setQaUpdates((prev) => [update, ...prev.slice(0, 99)]); // Keep last 100
      console.log("[Ably] Q&A Update:", update);
    });

    return () => {
      qaChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  // Subscribe to Transcript channel
  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const transcriptChannel = ablyClient.channels.get(`session:${sessionId}:transcript`);

    transcriptChannel.subscribe("transcript-update", (message: Ably.Types.Message) => {
      const update: AblyMessage = {
        type: "transcript",
        action: message.data.action || "new",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setTranscriptUpdates((prev) => [update, ...prev.slice(0, 999)]); // Keep last 1000
      console.log("[Ably] Transcript Update:", update);
    });

    return () => {
      transcriptChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  // Subscribe to Provider channel
  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const providerChannel = ablyClient.channels.get(`session:${sessionId}:provider`);

    providerChannel.subscribe("provider-update", (message: Ably.Types.Message) => {
      const update: AblyMessage = {
        type: "provider",
        action: message.data.action || "updated",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setProviderUpdates((prev) => [update, ...prev.slice(0, 49)]); // Keep last 50
      console.log("[Ably] Provider Update:", update);
    });

    return () => {
      providerChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  // Subscribe to Participant channel
  useEffect(() => {
    if (!ablyClient || !isConnected) return;

    const participantChannel = ablyClient.channels.get(`session:${sessionId}:participants`);

    participantChannel.subscribe("participant-update", (message: Ably.Types.Message) => {
      const update: AblyMessage = {
        type: "participant",
        action: message.data.action || "updated",
        data: message.data,
        timestamp: message.timestamp || Date.now(),
      };
      setParticipantUpdates((prev) => [update, ...prev.slice(0, 99)]); // Keep last 100
      console.log("[Ably] Participant Update:", update);
    });

    return () => {
      participantChannel.unsubscribe();
    };
  }, [ablyClient, isConnected, sessionId]);

  // Publish function for operators to send messages
  const publishUpdate = useCallback(
    async (channel: "qa" | "transcript" | "provider" | "participants", data: Record<string, unknown>) => {
      if (!ablyClient || !isConnected) {
        console.error("[Ably] Not connected");
        return;
      }

      try {
        const channelName = `session:${sessionId}:${channel}`;
        const ablyChannel = ablyClient.channels.get(channelName);
        await ablyChannel.publish(`${channel}-update`, data);
        console.log(`[Ably] Published to ${channelName}:`, data);
      } catch (error) {
        console.error("[Ably] Publish failed:", error);
      }
    },
    [ablyClient, isConnected, sessionId]
  );

  return {
    isConnected,
    qaUpdates,
    transcriptUpdates,
    providerUpdates,
    participantUpdates,
    publishUpdate,
  };
};
