import { z } from "zod";
import { router, operatorProcedure } from "../_core/trpc";
import {
  analyzeSentiment,
  analyzeSentimentBatch,
  analyzeConferenceSentiment,
  getSentimentTrend,
  getSpeakerSentimentProfile,
} from "../services/SentimentAnalysisService";

/**
 * Sentiment Analysis Router — tRPC procedures for emotion detection
 */
export const sentimentRouter = router({
  /**
   * Analyze sentiment for a single text segment
   */
  analyzeText: operatorProcedure
    .input(z.object({ text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        const sentiment = await analyzeSentiment(input.text);
        return sentiment;
      } catch (error) {
        console.error("[sentimentRouter] Error analyzing text:", error);
        throw error;
      }
    }),

  /**
   * Analyze sentiment for all segments in a conference
   */
  analyzeConference: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const result = await analyzeConferenceSentiment(input.conferenceId);
        return result;
      } catch (error) {
        console.error("[sentimentRouter] Error analyzing conference:", error);
        throw error;
      }
    }),

  /**
   * Get sentiment trend over time for a conference
   */
  getTrend: operatorProcedure
    .input(
      z.object({
        conferenceId: z.number(),
        windowSize: z.number().default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const trend = await getSentimentTrend(input.conferenceId, input.windowSize);
        return trend;
      } catch (error) {
        console.error("[sentimentRouter] Error getting sentiment trend:", error);
        throw error;
      }
    }),

  /**
   * Get sentiment profile for each speaker
   */
  getSpeakerProfile: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const profile = await getSpeakerSentimentProfile(input.conferenceId);
        return profile;
      } catch (error) {
        console.error("[sentimentRouter] Error getting speaker profile:", error);
        throw error;
      }
    }),

  /**
   * Get sentiment statistics for a conference
   */
  getStatistics: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      try {
        const { getDb } = await import("../db");
        const { occTranscriptionSegments } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const segments = await db
          .select()
          .from(occTranscriptionSegments)
          .where(eq(occTranscriptionSegments.conferenceId, input.conferenceId));

        const stats = {
          totalSegments: segments.length,
          sentimentCounts: {
            positive: 0,
            neutral: 0,
            negative: 0,
          },
          emotionCounts: {} as Record<string, number>,
          averageConfidence: 0,
          averageEmotionScore: 0,
          toneCounts: {} as Record<string, number>,
        };

        let totalConfidence = 0;
        let totalEmotionScore = 0;

        for (const segment of segments) {
          if (segment.sentiment) {
            stats.sentimentCounts[segment.sentiment as "positive" | "neutral" | "negative"]++;
            totalConfidence += segment.sentimentConfidence || 0;
          }
          if (segment.emotion) {
            stats.emotionCounts[segment.emotion] = (stats.emotionCounts[segment.emotion] || 0) + 1;
            totalEmotionScore += segment.emotionScore || 0;
          }
          if (segment.tone) {
            stats.toneCounts[segment.tone] = (stats.toneCounts[segment.tone] || 0) + 1;
          }
        }

        stats.averageConfidence = segments.length > 0 ? Math.round(totalConfidence / segments.length) : 0;
        stats.averageEmotionScore = segments.length > 0 ? Math.round(totalEmotionScore / segments.length) : 0;

        return stats;
      } catch (error) {
        console.error("[sentimentRouter] Error getting statistics:", error);
        throw error;
      }
    }),

  /**
   * Get emotion timeline for visualization
   */
  getEmotionTimeline: operatorProcedure
    .input(
      z.object({
        conferenceId: z.number(),
        bucketSize: z.number().default(10000), // milliseconds
      })
    )
    .query(async ({ input }) => {
      try {
        const { getDb } = await import("../db");
        const { occTranscriptionSegments } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const segments = await db
          .select()
          .from(occTranscriptionSegments)
          .where(eq(occTranscriptionSegments.conferenceId, input.conferenceId));

        const timeline: Array<{
          timestamp: number;
          emotions: Record<string, number>;
          dominantEmotion: string;
        }> = [];

        // Group segments by time bucket
        const buckets = new Map<number, typeof segments>();

        for (const segment of segments) {
          const bucket = Math.floor(segment.startTime / input.bucketSize) * input.bucketSize;
          if (!buckets.has(bucket)) {
            buckets.set(bucket, []);
          }
          buckets.get(bucket)!.push(segment);
        }

        // Process each bucket
        for (const [timestamp, bucketSegments] of Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])) {
          const emotions: Record<string, number> = {};
          for (const segment of bucketSegments) {
            if (segment.emotion) {
              emotions[segment.emotion] = (emotions[segment.emotion] || 0) + 1;
            }
          }

          const dominantEmotion = Object.entries(emotions).sort(([, a], [, b]) => b - a)[0]?.[0] || "neutral";

          timeline.push({
            timestamp,
            emotions,
            dominantEmotion,
          });
        }

        return timeline;
      } catch (error) {
        console.error("[sentimentRouter] Error getting emotion timeline:", error);
        throw error;
      }
    }),
});
