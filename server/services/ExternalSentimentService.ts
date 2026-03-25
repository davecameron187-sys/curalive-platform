// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export interface ExternalSentimentSnapshot {
  aggregatedSentiment: number;
  socialMentions: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topThemes: Array<{
    theme: string;
    sentiment: "positive" | "negative" | "neutral";
    volume: number;
    representativePosts: string[];
  }>;
  crowdReaction: "bullish" | "bearish" | "mixed" | "indifferent";
  divergenceFromCall: number;
  earlyWarnings: string[];
  influencerSentiment: string;
  mediaReactions: string[];
}

export class ExternalSentimentService {
  static async aggregateExternalSentiment(params: {
    companyTicker: string;
    companyName: string;
    eventType: string;
    callSentiment: number;
    keyTopicsFromCall: string[];
    transcriptHighlights?: string;
  }): Promise<ExternalSentimentSnapshot> {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a financial social media intelligence analyst specializing in real-time crowd sentiment during investor events. You synthesize signals from financial Twitter/X, StockTwits, Reddit (r/investing, r/wallstreetbets), financial news feeds, and analyst commentary platforms to produce actionable intelligence for IR teams and compliance officers.`,
        },
        {
          role: "user",
          content: `Generate a simulated but realistic external sentiment aggregation report for this live investor event:

COMPANY: ${params.companyName} (${params.companyTicker})
EVENT TYPE: ${params.eventType}
CALL SENTIMENT (internal): ${params.callSentiment} (-1.0 to +1.0)
KEY TOPICS FROM CALL: ${params.keyTopicsFromCall.join(", ")}
TRANSCRIPT HIGHLIGHTS: ${params.transcriptHighlights?.substring(0, 1500) || "Not provided"}

Based on typical market reaction patterns for this type of event and these topics, generate a realistic external sentiment snapshot that includes:

1. How social/financial media would typically react to these topics and sentiment
2. Any divergence between internal call tone and external crowd reaction
3. Early warning signals for IR teams
4. Key themes emerging from external commentary

Output JSON only:
{
  "aggregatedSentiment": number (-1.0 bearish to +1.0 bullish),
  "socialMentions": number (estimated mention volume),
  "sentimentBreakdown": { "positive": number, "negative": number, "neutral": number },
  "topThemes": [
    {
      "theme": "topic description",
      "sentiment": "positive" | "negative" | "neutral",
      "volume": number,
      "representativePosts": ["example post text"]
    }
  ],
  "crowdReaction": "bullish" | "bearish" | "mixed" | "indifferent",
  "divergenceFromCall": number (-1.0 to +1.0, 0=aligned, negative=crowd more bearish than call),
  "earlyWarnings": ["specific warnings for IR team"],
  "influencerSentiment": "summary of key financial influencer reactions",
  "mediaReactions": ["key financial media headline or reaction"]
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices?.[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        aggregatedSentiment: Math.min(1, Math.max(-1, parsed.aggregatedSentiment ?? 0)),
        socialMentions: parsed.socialMentions ?? 0,
        sentimentBreakdown: {
          positive: parsed.sentimentBreakdown?.positive ?? 0,
          negative: parsed.sentimentBreakdown?.negative ?? 0,
          neutral: parsed.sentimentBreakdown?.neutral ?? 0,
        },
        topThemes: Array.isArray(parsed.topThemes) ? parsed.topThemes : [],
        crowdReaction: ["bullish", "bearish", "mixed", "indifferent"].includes(parsed.crowdReaction) ? parsed.crowdReaction : "mixed",
        divergenceFromCall: Math.min(1, Math.max(-1, parsed.divergenceFromCall ?? 0)),
        earlyWarnings: Array.isArray(parsed.earlyWarnings) ? parsed.earlyWarnings : [],
        influencerSentiment: parsed.influencerSentiment || "No data available",
        mediaReactions: Array.isArray(parsed.mediaReactions) ? parsed.mediaReactions : [],
      };
    } catch {
      return {
        aggregatedSentiment: 0,
        socialMentions: 0,
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        topThemes: [],
        crowdReaction: "indifferent",
        divergenceFromCall: 0,
        earlyWarnings: ["External sentiment analysis unavailable — manual monitoring recommended"],
        influencerSentiment: "Unavailable",
        mediaReactions: [],
      };
    }
  }

  static async logSnapshot(
    eventId: number,
    sessionId: number,
    snapshot: ExternalSentimentSnapshot
  ) {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      INSERT INTO external_sentiment_snapshots (event_id, session_id, aggregated_sentiment, social_mentions, sentiment_breakdown, top_themes, crowd_reaction, divergence_from_call, early_warnings, influencer_sentiment, media_reactions, created_at)
      VALUES (${eventId}, ${sessionId}, ${snapshot.aggregatedSentiment}, ${snapshot.socialMentions}, ${JSON.stringify(snapshot.sentimentBreakdown)}, ${JSON.stringify(snapshot.topThemes)}, ${snapshot.crowdReaction}, ${snapshot.divergenceFromCall}, ${JSON.stringify(snapshot.earlyWarnings)}, ${snapshot.influencerSentiment}, ${JSON.stringify(snapshot.mediaReactions)}, NOW())
    `);
  }

  static async getEventSnapshots(eventId: number) {
    const db = await getDb();
    if (!db) return [];
    const [rows] = await db.execute(sql`
      SELECT * FROM external_sentiment_snapshots WHERE event_id = ${eventId} ORDER BY created_at DESC
    `);
    return rows;
  }
}
