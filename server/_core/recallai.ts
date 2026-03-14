/**
 * Recall.ai Integration Service
 * Handles bot creation, meeting joining, and transcription streaming
 */

import { EventEmitter } from "events";

export interface RecallBotConfig {
  meetingUrl: string;
  conferenceId: string;
  speakerId?: string;
  recordAudio?: boolean;
}

export interface TranscriptionSegment {
  id: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  timestamp: number;
}

export interface RecallBotStatus {
  botId: string;
  status: "connecting" | "connected" | "recording" | "stopped" | "error";
  participantCount: number;
  recordingDuration: number;
  transcriptionSegments: TranscriptionSegment[];
}

class RecallAiService extends EventEmitter {
  private apiKey: string;
  private baseUrl: string = "https://api.recall.ai/api/v1";
  private activeBots: Map<string, RecallBotStatus> = new Map();

  constructor() {
    super();
    this.apiKey = process.env.RECALL_AI_API_KEY || "";
    if (!this.apiKey) {
      console.warn("[RecallAI] No API key configured. Using mock mode.");
    }
  }

  /**
   * Create and join a bot to a meeting
   */
  async createBot(config: RecallBotConfig): Promise<RecallBotStatus> {
    try {
      const botId = `bot_${config.conferenceId}_${Date.now()}`;

      // Mock implementation - in production, call Recall.ai API
      const botStatus: RecallBotStatus = {
        botId,
        status: "connecting",
        participantCount: 0,
        recordingDuration: 0,
        transcriptionSegments: [],
      };

      this.activeBots.set(botId, botStatus);

      // Simulate bot joining
      setTimeout(() => {
        const bot = this.activeBots.get(botId);
        if (bot) {
          bot.status = "connected";
          this.emit("bot:connected", { botId, conferenceId: config.conferenceId });
        }
      }, 1000);

      // Simulate recording start
      setTimeout(() => {
        const bot = this.activeBots.get(botId);
        if (bot) {
          bot.status = "recording";
          this.emit("bot:recording", { botId, conferenceId: config.conferenceId });
        }
      }, 2000);

      return botStatus;
    } catch (error) {
      console.error("[RecallAI] Error creating bot:", error);
      throw error;
    }
  }

  /**
   * Stop bot and retrieve transcription
   */
  async stopBot(botId: string): Promise<TranscriptionSegment[]> {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot) {
        throw new Error(`Bot ${botId} not found`);
      }

      bot.status = "stopped";
      this.emit("bot:stopped", { botId });

      return bot.transcriptionSegments;
    } catch (error) {
      console.error("[RecallAI] Error stopping bot:", error);
      throw error;
    }
  }

  /**
   * Add transcription segment (called by real-time transcription stream)
   */
  addTranscriptionSegment(botId: string, segment: TranscriptionSegment): void {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.transcriptionSegments.push(segment);
      this.emit("transcription:segment", { botId, segment });
    }
  }

  /**
   * Update participant count
   */
  updateParticipantCount(botId: string, count: number): void {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.participantCount = count;
      this.emit("participants:updated", { botId, count });
    }
  }

  /**
   * Get bot status
   */
  getBotStatus(botId: string): RecallBotStatus | undefined {
    return this.activeBots.get(botId);
  }

  /**
   * Get all active bots
   */
  getActiveBots(): RecallBotStatus[] {
    return Array.from(this.activeBots.values());
  }

  /**
   * Clean up bot resources
   */
  cleanup(botId: string): void {
    this.activeBots.delete(botId);
  }
}

// Export singleton instance
export const recallAiService = new RecallAiService();
