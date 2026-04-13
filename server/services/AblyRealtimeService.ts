import * as Ably from "ably";
import { ENV } from "../_core/env";

export interface AblyChannelMessage {
  type: "cursor_update" | "edit_created" | "edit_approved" | "version_published" | "user_joined" | "user_left" | "conflict_detected" | "redaction_applied";
  userId: number;
  userName: string;
  conferenceId: number;
  timestamp: Date;
  data?: Record<string, any>;
}

export interface CollaboratorPresence {
  userId: number;
  userName: string;
  cursorPosition?: { line: number; column: number };
  lastActive: Date;
  action: "enter" | "update" | "leave";
}

export class AblyRealtimeService {
  private static client: Ably.Realtime | null = null;
  private static channels = new Map<string, Ably.RealtimeChannel>();
  private static presenceSubscribers = new Map<string, Set<(presence: CollaboratorPresence[]) => void>>();

  /**
   * Initialize Ably client
   */
  static initialize(apiKey: string): void {
    if (!this.client) {
      this.client = new Ably.Realtime({
        key: apiKey,
        autoConnect: true,
        echoMessages: false,
      });

      this.client.connection.on("connected", () => {
        console.log("[Ably] Connected to realtime service");
      });

      this.client.connection.on("disconnected", () => {
        console.log("[Ably] Disconnected from realtime service");
      });

      this.client.connection.on("failed", (error) => {
        console.error("[Ably] Connection failed:", error);
      });
    }
  }

  /**
   * Get or create a channel for a conference
   */
  static getChannel(conferenceId: number): Ably.RealtimeChannel {
    const channelName = ENV.isStaging ? `staging_conference:${conferenceId}` : `conference:${conferenceId}`;

    if (!this.channels.has(channelName)) {
      if (!this.client) {
        throw new Error("Ably client not initialized");
      }

      const channel = this.client.channels.get(channelName);
      this.channels.set(channelName, channel);
    }

    return this.channels.get(channelName)!;
  }

  /**
   * Subscribe to messages on a conference channel
   */
  static subscribeToMessages(
    conferenceId: number,
    callback: (message: AblyChannelMessage) => void
  ): () => void {
    const channel = this.getChannel(conferenceId);

    const messageHandler = (message: Ably.Message) => {
      try {
        const data = typeof message.data === "string" ? JSON.parse(message.data) : message.data;
        callback(data as AblyChannelMessage);
      } catch (error) {
        console.error("[Ably] Error parsing message:", error);
      }
    };

    channel.subscribe(messageHandler);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe(messageHandler);
    };
  }

  /**
   * Broadcast a message to all collaborators
   */
  static async broadcastMessage(conferenceId: number, message: AblyChannelMessage): Promise<void> {
    const channel = this.getChannel(conferenceId);

    try {
      await channel.publish({
        name: message.type,
        data: JSON.stringify(message),
      });
    } catch (error) {
      console.error("[Ably] Failed to broadcast message:", error);
      throw error;
    }
  }

  /**
   * Publish a message to an event channel (used for live audience features)
   */
  static async publishToEvent(eventId: string, type: string, data: any): Promise<void> {
    if (!this.client) {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) {
        console.warn("[Ably] ABLY_API_KEY not set, skipping publishToEvent");
        return;
      }
      this.initialize(apiKey);
    }
    
    const channelName = ENV.isStaging ? `staging_curalive-event-${eventId}` : `curalive-event-${eventId}`;
    const channel = this.client!.channels.get(channelName);
    
    try {
      await channel.publish({
        name: "curalive",
        data: JSON.stringify({ type, data }),
      });
    } catch (error) {
      console.error("[Ably] Failed to publish to event:", error);
      throw error;
    }
  }

  /**
   * Enter presence for a user
   */
  static async enterPresence(
    conferenceId: number,
    userId: number,
    userName: string,
    data?: Record<string, any>
  ): Promise<void> {
    const channel = this.getChannel(conferenceId);

    try {
      await channel.presence.enter({
        userId,
        userName,
        ...data,
      });
    } catch (error) {
      console.error("[Ably] Failed to enter presence:", error);
      throw error;
    }
  }

  /**
   * Update presence data
   */
  static async updatePresence(
    conferenceId: number,
    data: Record<string, any>
  ): Promise<void> {
    const channel = this.getChannel(conferenceId);

    try {
      await channel.presence.update(data);
    } catch (error) {
      console.error("[Ably] Failed to update presence:", error);
      throw error;
    }
  }

  /**
   * Leave presence
   */
  static async leavePresence(conferenceId: number): Promise<void> {
    const channel = this.getChannel(conferenceId);

    try {
      await channel.presence.leave();
    } catch (error) {
      console.error("[Ably] Failed to leave presence:", error);
      throw error;
    }
  }

  /**
   * Subscribe to presence changes
   */
  static subscribeToPresence(
    conferenceId: number,
    callback: (presence: CollaboratorPresence[]) => void
  ): () => void {
    const channel = this.getChannel(conferenceId);

    const presenceHandler = () => {
      try {
        (channel.presence.get as any)((err: any, members?: any) => {
          if (err) {
            console.error("[Ably] Error getting presence:", err);
            return;
          }

          const presence: CollaboratorPresence[] = (members || []).map((member: any) => ({
            userId: member.clientData?.userId || 0,
            userName: member.clientData?.userName || "Unknown",
            cursorPosition: member.clientData?.cursorPosition,
            lastActive: new Date(),
            action: member.action as "enter" | "update" | "leave",
          }));

          callback(presence);
        });
      } catch (error) {
        console.error("[Ably] Error in presence handler:", error);
      }
    };

    channel.presence.subscribe("enter", presenceHandler);
    channel.presence.subscribe("update", presenceHandler);
    channel.presence.subscribe("leave", presenceHandler);

    // Get initial presence
    presenceHandler();

    // Return unsubscribe function
    return () => {
      channel.presence.unsubscribe("enter", presenceHandler);
      channel.presence.unsubscribe("update", presenceHandler);
      channel.presence.unsubscribe("leave", presenceHandler);
    };
  }

  /**
   * Broadcast cursor position
   */
  static async broadcastCursorPosition(
    conferenceId: number,
    userId: number,
    position: { line: number; column: number }
  ): Promise<void> {
    const channel = this.getChannel(conferenceId);

    try {
      await channel.presence.update({
        cursorPosition: position,
      });
    } catch (error) {
      console.error("[Ably] Failed to broadcast cursor position:", error);
      throw error;
    }
  }

  /**
   * Broadcast edit creation
   */
  static async broadcastEditCreated(
    conferenceId: number,
    userId: number,
    userName: string,
    editId: number,
    originalText: string,
    correctedText: string
  ): Promise<void> {
    const message: AblyChannelMessage = {
      type: "edit_created",
      userId,
      userName,
      conferenceId,
      timestamp: new Date(),
      data: {
        editId,
        originalText,
        correctedText,
      },
    };

    await this.broadcastMessage(conferenceId, message);
  }

  /**
   * Broadcast edit approval
   */
  static async broadcastEditApproved(
    conferenceId: number,
    userId: number,
    userName: string,
    editId: number,
    approved: boolean
  ): Promise<void> {
    const message: AblyChannelMessage = {
      type: "edit_approved",
      userId,
      userName,
      conferenceId,
      timestamp: new Date(),
      data: {
        editId,
        approved,
      },
    };

    await this.broadcastMessage(conferenceId, message);
  }

  /**
   * Broadcast version published
   */
  static async broadcastVersionPublished(
    conferenceId: number,
    userId: number,
    userName: string,
    versionId: number,
    description?: string
  ): Promise<void> {
    const message: AblyChannelMessage = {
      type: "version_published",
      userId,
      userName,
      conferenceId,
      timestamp: new Date(),
      data: {
        versionId,
        description,
      },
    };

    await this.broadcastMessage(conferenceId, message);
  }

  /**
   * Broadcast conflict detection
   */
  static async broadcastConflictDetected(
    conferenceId: number,
    userId: number,
    userName: string,
    conflictingEdits: number[]
  ): Promise<void> {
    const message: AblyChannelMessage = {
      type: "conflict_detected",
      userId,
      userName,
      conferenceId,
      timestamp: new Date(),
      data: {
        conflictingEdits,
      },
    };

    await this.broadcastMessage(conferenceId, message);
  }

  /**
   * Broadcast redaction applied
   */
  static async broadcastRedactionApplied(
    conferenceId: number,
    userId: number,
    userName: string,
    redactionType: string,
    segmentCount: number
  ): Promise<void> {
    const message: AblyChannelMessage = {
      type: "redaction_applied",
      userId,
      userName,
      conferenceId,
      timestamp: new Date(),
      data: {
        redactionType,
        segmentCount,
      },
    };

    await this.broadcastMessage(conferenceId, message);
  }

  /**
   * Get channel history
   */
  static async getChannelHistory(
    conferenceId: number,
    limit: number = 100
  ): Promise<Ably.Message[]> {
    const channel = this.getChannel(conferenceId);

    try {
      const result = await channel.history({ limit });
      return result.items;
    } catch (error) {
      console.error("[Ably] Failed to get channel history:", error);
      return [];
    }
  }

  /**
   * Close channel
   */
  static closeChannel(conferenceId: number): void {
    const channelName = ENV.isStaging ? `staging_conference:${conferenceId}` : `conference:${conferenceId}`;

    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName)!;
      channel.detach();
      this.channels.delete(channelName);
    }
  }

  /**
   * Close all channels
   */
  static closeAllChannels(): void {
    this.channels.forEach((channel) => {
      channel.detach();
    });
    this.channels.clear();
  }

  /**
   * Get connection state
   */
  static getConnectionState(): string {
    if (!this.client) {
      return "not_initialized";
    }

    return this.client.connection.state;
  }

  /**
   * Disconnect client
   */
  static disconnect(): void {
    if (this.client) {
      this.closeAllChannels();
      this.client.close();
      this.client = null;
    }
  }

  /**
   * Get statistics
   */
  static getStats() {
    return {
      isInitialized: !!this.client,
      connectionState: this.getConnectionState(),
      activeChannels: this.channels.size,
      channels: Array.from(this.channels.keys()),
    };
  }
}
