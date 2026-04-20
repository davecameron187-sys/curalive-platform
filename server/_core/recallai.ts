/**
 * Recall.ai Integration Service
 * Handles bot creation, meeting joining, and transcription streaming
 *
 * Shadow Mode Relaunch — real API implementation replacing OCC-era mock
 */
import { EventEmitter } from "events";

export interface RecallBotConfig {
  meetingUrl: string;
  conferenceId: string;
  webhookUrl: string;
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
  private baseUrl: string;
  private activeBots: Map<string, RecallBotStatus> = new Map();

  constructor() {
    super();
    this.apiKey = process.env.RECALL_AI_API_KEY || "";
    this.baseUrl = process.env.RECALL_AI_BASE_URL || "https://us-west-2.recall.ai/api/v1";

    if (!this.apiKey) {
      console.error("[RecallAI] CRITICAL: No API key configured. Bot deployment will fail.");
    } else {
      console.log(`[RecallAI] Initialised. Base URL: ${this.baseUrl}`);
    }
  }

  async createBot(config: RecallBotConfig): Promise<RecallBotStatus> {
    if (!this.apiKey) {
      throw new Error("[RecallAI] Cannot create bot — RECALL_AI_API_KEY is not set.");
    }

    if (!config.webhookUrl) {
      throw new Error("[RecallAI] Cannot create bot — webhookUrl is required.");
    }

    console.log(`[RecallAI] Deploying bot to meeting: ${config.meetingUrl}`);

    const response = await fetch(`${this.baseUrl}/bot`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        meeting_url: config.meetingUrl,
        bot_name: "CuraLive Intelligence",
        transcription_options: {
          provider: "assembly_ai",
        },
        real_time_transcription: {
          destination_url: config.webhookUrl,
          partial_results: false,
        },
        recording_mode: config.recordAudio !== false ? "audio_and_video" : "disabled",
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[RecallAI] Bot creation failed: ${response.status} ${errorBody}`);
      throw new Error(`Recall.ai API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const botId: string = data.id;

    console.log(`[RecallAI] Bot created successfully. Bot ID: ${botId}`);

    const botStatus: RecallBotStatus = {
      botId,
      status: "connecting",
      participantCount: 0,
      recordingDuration: 0,
      transcriptionSegments: [],
    };

    this.activeBots.set(botId, botStatus);
    return botStatus;
  }

  async stopBot(botId: string): Promise<TranscriptionSegment[]> {
    if (!this.apiKey) {
      throw new Error("[RecallAI] Cannot stop bot — RECALL_AI_API_KEY is not set.");
    }

    console.log(`[RecallAI] Stopping bot: ${botId}`);

    const response = await fetch(`${this.baseUrl}/bot/${botId}/leave_call`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[RecallAI] Stop bot failed: ${response.status} ${errorBody}`);
    }

    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.status = "stopped";
      this.emit("bot:stopped", { botId });
      return bot.transcriptionSegments;
    }

    return [];
  }

  async fetchTranscript(botId: string): Promise<TranscriptionSegment[]> {
    if (!this.apiKey) {
      throw new Error("[RecallAI] Cannot fetch transcript — RECALL_AI_API_KEY is not set.");
    }

    console.log(`[RecallAI] Fetching transcript for bot: ${botId}`);

    const response = await fetch(`${this.baseUrl}/bot/${botId}/transcript`, {
      headers: {
        "Authorization": `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Recall.ai transcript fetch failed ${response.status}: ${errorBody}`);
    }

    const data = await response.json();

    const segments: TranscriptionSegment[] = (data.results || []).map((item: any, index: number) => ({
      id: `${botId}_${index}`,
      speaker: item.speaker || "Unknown",
      text: item.words?.map((w: any) => w.text).join(" ") || item.transcript || "",
      startTime: item.start_time || 0,
      endTime: item.end_time || 0,
      confidence: item.confidence || 1,
      timestamp: Date.now(),
    }));

    console.log(`[RecallAI] Fetched ${segments.length} transcript segments for bot ${botId}`);
    return segments;
  }

  addTranscriptionSegment(botId: string, segment: TranscriptionSegment): void {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.transcriptionSegments.push(segment);
      this.emit("transcription:segment", { botId, segment });
    }
  }

  updateParticipantCount(botId: string, count: number): void {
    const bot = this.activeBots.get(botId);
    if (bot) {
      bot.participantCount = count;
      this.emit("participants:updated", { botId, count });
    }
  }

  getBotStatus(botId: string): RecallBotStatus | undefined {
    return this.activeBots.get(botId);
  }

  getActiveBots(): RecallBotStatus[] {
    return Array.from(this.activeBots.values());
  }

  cleanup(botId: string): void {
    this.activeBots.delete(botId);
  }
}

export const recallAiService = new RecallAiService();
