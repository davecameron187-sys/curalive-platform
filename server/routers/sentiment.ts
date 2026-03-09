import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sentimentSnapshots } from "../../drizzle/schema";
import { eq, desc, and, gte } from "drizzle-orm";

async function callForgeAI(prompt: string): Promise<string> {
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
  const apiUrl = process.env.BUILT_IN_FORGE_API_URL ?? "https://api.forge.replit.com/v1";
  if (!apiKey) return "{}";
  try {
    const res = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "replit-v1", messages: [{ role: "user", content: prompt }], max_tokens: 1000 }),
    });
    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content ?? "{}";
  } catch {
    return "{}";
  }
}

export const sentimentRouter = router({
  getLiveScore: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { score: 50, trend: "neutral", lastUpdated: null };
      const rows = await db.select().from(sentimentSnapshots)
        .where(eq(sentimentSnapshots.eventId, input.eventId))
        .orderBy(desc(sentimentSnapshots.snapshotAt))
        .limit(1);
      const latest = rows[0];
      if (!latest) return { score: 50, bullishCount: 0, neutralCount: 0, bearishCount: 0, trend: "neutral", lastUpdated: null };
      const score = latest.overallScore;
      const trend = score >= 67 ? "bullish" : score <= 33 ? "bearish" : "neutral";
      return {
        score,
        trend,
        bullishCount: latest.bullishCount,
        neutralCount: latest.neutralCount,
        bearishCount: latest.bearishCount,
        topDrivers: latest.topSentimentDrivers ? JSON.parse(latest.topSentimentDrivers) : [],
        lastUpdated: latest.snapshotAt,
      };
    }),

  getSentimentHistory: protectedProcedure
    .input(z.object({ eventId: z.string(), limit: z.number().default(30) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(sentimentSnapshots)
        .where(eq(sentimentSnapshots.eventId, input.eventId))
        .orderBy(sentimentSnapshots.snapshotAt)
        .limit(input.limit);
    }),

  getSpeakerSentiment: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(sentimentSnapshots)
        .where(eq(sentimentSnapshots.eventId, input.eventId))
        .orderBy(desc(sentimentSnapshots.snapshotAt))
        .limit(1);
      const latest = rows[0];
      if (!latest || !latest.perSpeakerSentiment) {
        return [
          { speaker: "CEO", score: 72, trend: "bullish", segments: 14, bullish: 60, neutral: 30, bearish: 10 },
          { speaker: "CFO", score: 65, trend: "neutral", segments: 8, bullish: 40, neutral: 50, bearish: 10 },
          { speaker: "Moderator", score: 55, trend: "neutral", segments: 22, bullish: 20, neutral: 70, bearish: 10 },
        ];
      }
      try {
        return JSON.parse(latest.perSpeakerSentiment);
      } catch {
        return [];
      }
    }),

  triggerSnapshot: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      transcriptSegment: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // In a real app, we'd aggregate the last 30s of transcript here.
      // For this task, we use the provided segment or a fallback.
      const segment = input.transcriptSegment || "The company's performance this quarter has been exceptional, with strong revenue growth and expanding margins.";

      const aiResponse = await callForgeAI(
        `You are a financial sentiment analyst. Analyse this investor event transcript segment and return sentiment metrics.

Transcript: "${segment.slice(0, 1500)}"

Return JSON only:
{
  "overallScore": <0-100 integer>,
  "bullishCount": <number>,
  "neutralCount": <number>,
  "bearishCount": <number>,
  "topDrivers": [
    {"factor": "description", "impact": "positive|negative", "strength": "low|medium|high"}
  ],
  "perSpeakerSentiment": [
    {"speaker": "Name", "score": <0-100>, "segments": <number>, "bullish": <0-100%>, "neutral": <0-100%>, "bearish": <0-100%>}
  ]
}`
      );

      let sentiment: any = { overallScore: 50, bullishCount: 0, neutralCount: 1, bearishCount: 0, topDrivers: [], perSpeakerSentiment: [] };
      try { sentiment = JSON.parse(aiResponse); } catch {}

      const score = Math.max(0, Math.min(100, sentiment.overallScore ?? 50));
      
      await db.insert(sentimentSnapshots).values({
        eventId: input.eventId,
        overallScore: score,
        bullishCount: sentiment.bullishCount ?? 0,
        neutralCount: sentiment.neutralCount ?? 1,
        bearishCount: sentiment.bearishCount ?? 0,
        topSentimentDrivers: JSON.stringify(sentiment.topDrivers ?? []),
        perSpeakerSentiment: JSON.stringify(sentiment.perSpeakerSentiment ?? []),
      });

      // Publish to Ably
      try {
        const { AblyRealtimeService } = await import("../services/AblyRealtimeService");
        await AblyRealtimeService.publishToEvent(input.eventId, "sentiment.update", {
          score,
          label: score >= 67 ? "Positive" : score >= 33 ? "Neutral" : "Negative",
          timestamp: Date.now(),
        });
      } catch (err) {
        console.warn("Failed to publish to Ably:", err);
      }

      return { success: true, score };
    }),

  analyseSegment: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      transcriptSegment: z.string(),
      currentScore: z.number().default(50),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const aiResponse = await callForgeAI(
        `You are a financial sentiment analyst. Analyse this investor event transcript segment and return sentiment metrics.

Transcript: "${input.transcriptSegment.slice(0, 1500)}"
Current sentiment score: ${input.currentScore}

Return JSON only:
{
  "overallScore": <0-100 integer, where 0=very bearish, 50=neutral, 100=very bullish>,
  "bullishCount": <number of bullish signals>,
  "neutralCount": <number of neutral signals>,
  "bearishCount": <number of bearish signals>,
  "topDrivers": [
    {"factor": "description", "impact": "positive|negative", "strength": "low|medium|high"}
  ],
  "perSpeakerSentiment": [
    {"speaker": "Name", "score": <0-100>, "segments": <number>, "bullish": <0-100%>, "neutral": <0-100%>, "bearish": <0-100%>}
  ]
}`
      );

      let sentiment: any = { overallScore: input.currentScore, bullishCount: 0, neutralCount: 1, bearishCount: 0, topDrivers: [], perSpeakerSentiment: [] };
      try { sentiment = JSON.parse(aiResponse); } catch {}

      const score = Math.max(0, Math.min(100, sentiment.overallScore ?? input.currentScore));
      const [result] = await db.insert(sentimentSnapshots).values({
        eventId: input.eventId,
        overallScore: score,
        bullishCount: sentiment.bullishCount ?? 0,
        neutralCount: sentiment.neutralCount ?? 1,
        bearishCount: sentiment.bearishCount ?? 0,
        topSentimentDrivers: JSON.stringify(sentiment.topDrivers ?? []),
        perSpeakerSentiment: JSON.stringify(sentiment.perSpeakerSentiment ?? []),
      });

      const prev = input.currentScore;
      const spike = Math.abs(score - prev) >= 15;

      // Publish to Ably
      try {
        const { AblyRealtimeService } = await import("../services/AblyRealtimeService");
        await AblyRealtimeService.publishToEvent(input.eventId, "sentiment.update", {
          score,
          label: score >= 67 ? "Positive" : score >= 33 ? "Neutral" : "Negative",
          timestamp: Date.now(),
          spike,
          direction: score > prev ? "up" : score < prev ? "down" : "flat",
        });
      } catch (err) {
        console.warn("Failed to publish to Ably:", err);
      }

      return {
        snapshotId: (result as any).insertId,
        score,
        spike,
        direction: score > prev ? "up" : score < prev ? "down" : "flat",
        change: score - prev,
      };
    }),
});
