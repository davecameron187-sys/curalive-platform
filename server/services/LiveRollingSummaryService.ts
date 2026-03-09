import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { occLiveRollingSummaries, occTranscriptionSegments } from "../../drizzle/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

export interface GeneratedSummary {
  id?: number;
  conferenceId: number;
  summary: string;
  windowStartTime: number;
  windowEndTime: number;
  segmentCount: number;
  generatedAt: Date;
}

/**
 * LiveRollingSummaryService — Generates 2-3 sentence summaries every 60 seconds
 * Uses a rolling window of recent transcription segments
 */
export class LiveRollingSummaryService {
  private summaryIntervals: Map<number, ReturnType<typeof setInterval>> = new Map();
  private windowSize = 60000; // 60 seconds in milliseconds

  /**
   * Start live rolling summary generation for a conference
   */
  async startLiveRollingSummary(conferenceId: number): Promise<void> {
    // Clear any existing interval
    if (this.summaryIntervals.has(conferenceId)) {
      const interval = this.summaryIntervals.get(conferenceId);
      if (interval) clearInterval(interval);
    }

    // Generate initial summary
    await this.generateRollingSummary(conferenceId);

    // Set up 60-second interval
    const interval = setInterval(async () => {
      try {
        await this.generateRollingSummary(conferenceId);
      } catch (error) {
        console.error(`[LiveRollingSummary] Error generating summary for conference ${conferenceId}:`, error);
      }
    }, this.windowSize);

    this.summaryIntervals.set(conferenceId, interval);
    console.log(`[LiveRollingSummary] Started for conference ${conferenceId}`);
  }

  /**
   * Stop live rolling summary generation
   */
  stopLiveRollingSummary(conferenceId: number): void {
    const interval = this.summaryIntervals.get(conferenceId);
    if (interval) {
      clearInterval(interval);
      this.summaryIntervals.delete(conferenceId);
      console.log(`[LiveRollingSummary] Stopped for conference ${conferenceId}`);
    }
  }

  /**
   * Generate a single rolling summary from recent transcription segments
   */
  async generateRollingSummary(conferenceId: number): Promise<GeneratedSummary | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      // Get recent transcription segments (last 60 seconds)
      const now = Date.now();
      const windowStart = now - this.windowSize;

      // Query for recent segments
      const recentSegments = await db
        .select()
        .from(occTranscriptionSegments)
        .where(
          and(
            eq(occTranscriptionSegments.conferenceId, conferenceId),
            gte(occTranscriptionSegments.createdAt, new Date(windowStart)),
            lte(occTranscriptionSegments.createdAt, new Date(now))
          )
        )
        .orderBy(asc(occTranscriptionSegments.startTime));

      if (recentSegments.length === 0) {
        console.log(`[LiveRollingSummary] No segments found for conference ${conferenceId}`);
        return null;
      }

      // Combine segment texts for summarization
      const combinedText = recentSegments
        .map((seg: any) => `${seg.speakerName}: ${seg.text}`)
        .join(" ");

      // Generate summary using LLM
      const summaryPrompt = `You are a professional meeting summarizer. Summarize the following meeting transcript in 2-3 concise sentences that capture the key points and decisions. Focus on what was discussed, any decisions made, and action items if mentioned.

Transcript:
${combinedText}

Provide only the 2-3 sentence summary, nothing else.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a professional meeting summarizer. Generate concise, accurate summaries of meeting discussions.",
          },
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
      });

      const summaryText =
        typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : "";

      // Store summary in database
      const db2 = await getDb();
      if (!db2) return null;

      const result = await db2.insert(occLiveRollingSummaries).values({
        conferenceId,
        summary: summaryText,
        windowStartTime: windowStart,
        windowEndTime: now,
        segmentCount: recentSegments.length,
        generatedAt: new Date(),
        createdAt: new Date(),
      });

      const summaryResult: GeneratedSummary = {
        conferenceId,
        summary: summaryText,
        windowStartTime: windowStart,
        windowEndTime: now,
        segmentCount: recentSegments.length,
        generatedAt: new Date(),
      };

      console.log(`[LiveRollingSummary] Generated summary for conference ${conferenceId}: ${summaryText.substring(0, 100)}...`);
      return summaryResult;
    } catch (error) {
      console.error(`[LiveRollingSummary] Error generating summary for conference ${conferenceId}:`, error);
      return null;
    }
  }

  /**
   * Get the latest rolling summary for a conference
   */
  async getLatestRollingSummary(conferenceId: number): Promise<GeneratedSummary | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      const [latest] = await db
        .select()
        .from(occLiveRollingSummaries)
        .where(eq(occLiveRollingSummaries.conferenceId, conferenceId))
        .orderBy(desc(occLiveRollingSummaries.generatedAt))
        .limit(1);

      if (!latest) return null;

      return {
        id: latest.id,
        conferenceId: latest.conferenceId,
        summary: latest.summary,
        windowStartTime: latest.windowStartTime,
        windowEndTime: latest.windowEndTime,
        segmentCount: latest.segmentCount,
        generatedAt: latest.generatedAt,
      };
    } catch (error) {
      console.error(`[LiveRollingSummary] Error fetching latest summary for conference ${conferenceId}:`, error);
      return null;
    }
  }

  /**
   * Get all rolling summaries for a conference
   */
  async getRollingSummaryHistory(conferenceId: number, limit: number = 50): Promise<GeneratedSummary[]> {
    try {
      const db = await getDb();
      if (!db) return [];

      const summaries = await db
        .select()
        .from(occLiveRollingSummaries)
        .where(eq(occLiveRollingSummaries.conferenceId, conferenceId))
        .orderBy(desc(occLiveRollingSummaries.generatedAt))
        .limit(limit);

      return summaries.map((s: any) => ({
        id: s.id,
        conferenceId: s.conferenceId,
        summary: s.summary,
        windowStartTime: s.windowStartTime,
        windowEndTime: s.windowEndTime,
        segmentCount: s.segmentCount,
        generatedAt: s.generatedAt,
      }));
    } catch (error) {
      console.error(`[LiveRollingSummary] Error fetching summary history for conference ${conferenceId}:`, error);
      return [];
    }
  }

  /**
   * Regenerate summary for a specific time window
   */
  async regenerateSummary(conferenceId: number, windowStartTime: number, windowEndTime: number): Promise<GeneratedSummary | null> {
    try {
      const db = await getDb();
      if (!db) return null;

      // Get segments in the specified window
      const segments = await db
        .select()
        .from(occTranscriptionSegments)
        .where(
          and(
            eq(occTranscriptionSegments.conferenceId, conferenceId),
            gte(occTranscriptionSegments.startTime, windowStartTime),
            lte(occTranscriptionSegments.startTime, windowEndTime)
          )
        )
        .orderBy(asc(occTranscriptionSegments.startTime));

      if (segments.length === 0) {
        return null;
      }

      // Combine segment texts
      const combinedText = segments
        .map((seg: any) => `${seg.speakerName}: ${seg.text}`)
        .join(" ");

      // Generate summary
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a professional meeting summarizer. Generate concise, accurate summaries of meeting discussions.",
          },
          {
            role: "user",
            content: `Summarize the following meeting transcript in 2-3 concise sentences:\n\n${combinedText}`,
          },
        ],
      });

      const summaryText =
        typeof response.choices[0].message.content === "string"
          ? response.choices[0].message.content
          : "";

      // Store regenerated summary
      const db2 = await getDb();
      if (!db2) return null;

      await db2.insert(occLiveRollingSummaries).values({
        conferenceId,
        summary: summaryText,
        windowStartTime,
        windowEndTime,
        segmentCount: segments.length,
        generatedAt: new Date(),
        createdAt: new Date(),
      });

      return {
        conferenceId,
        summary: summaryText,
        windowStartTime,
        windowEndTime,
        segmentCount: segments.length,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error(`[LiveRollingSummary] Error regenerating summary:`, error);
      return null;
    }
  }

  /**
   * Clean up all active intervals (for shutdown)
   */
  stopAll(): void {
    for (const [conferenceId, interval] of Array.from(this.summaryIntervals.entries())) {
      clearInterval(interval);
      console.log(`[LiveRollingSummary] Stopped for conference ${conferenceId}`);
    }
    this.summaryIntervals.clear();
  }
}

// Export singleton instance
export const liveRollingSummaryService = new LiveRollingSummaryService();
