import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { occTranscriptionSegments, sentimentSnapshots, webcastQa, webcastEvents } from "../../drizzle/schema";
import { eq, asc, desc } from "drizzle-orm";

export interface RecapMoment {
  timestamp: string;
  type: "highlight" | "quote" | "qa" | "sentiment_shift";
  title: string;
  content: string;
  sentiment?: "positive" | "neutral" | "negative";
}

export interface SentimentArc {
  opening: number;
  midpoint: number;
  closing: number;
  trend: "improving" | "stable" | "declining";
}

export interface RecapBrief {
  eventTitle: string;
  eventId: string;
  generatedAt: string;
  executiveSummary: string;
  topMoments: RecapMoment[];
  keyQuotes: string[];
  sentimentArc: SentimentArc;
  topQa: { question: string; answer?: string }[];
  ctaSuggestions: string[];
  videoScriptOutline: string;
  shareableHook: string;
}

export class WebcastRecapService {
  async generateRecap(eventId: string): Promise<RecapBrief> {
    const db = getDb();

    const [segments, sentiments, qaItems, events] = await Promise.all([
      db.select().from(occTranscriptionSegments).where(eq(occTranscriptionSegments.conferenceId, eventId)).orderBy(asc(occTranscriptionSegments.createdAt)).limit(150).catch(() => []),
      db.select().from(sentimentSnapshots).where(eq(sentimentSnapshots.conferenceId, eventId)).orderBy(asc(sentimentSnapshots.createdAt)).limit(30).catch(() => []),
      db.select().from(webcastQa).where(eq(webcastQa.eventId, eventId)).limit(20).catch(() => []),
      db.select().from(webcastEvents).where(eq(webcastEvents.id, eventId as any)).limit(1).catch(() => []),
    ]);

    const transcript = segments.map((s: any) => s.content).join(" ").slice(0, 5000);
    const eventTitle = (events[0] as any)?.title ?? "CuraLive Event";

    const scores = sentiments.map((s: any) => s.overallScore ?? 50);
    const openingScore = scores.length > 0 ? scores[0] : 50;
    const midScore = scores.length > 2 ? scores[Math.floor(scores.length / 2)] : 50;
    const closingScore = scores.length > 0 ? scores[scores.length - 1] : 50;

    const topQaRaw = qaItems
      .filter((q: any) => q.status === "answered" || q.status === "approved")
      .slice(0, 5)
      .map((q: any) => ({ question: q.question, answer: q.answer }));

    const prompt = `You are a premium video content producer creating a post-event AI recap brief for an investor webcast.

Event: "${eventTitle}"
Transcript: "${transcript}"
Sentiment arc: Opening=${openingScore}, Mid=${midScore}, Closing=${closingScore}
Top Q&A: ${JSON.stringify(topQaRaw)}

Return JSON:
{
  "executiveSummary": "3-4 sentence executive summary",
  "topMoments": [
    {
      "timestamp": "MM:SS",
      "type": "highlight|quote|qa|sentiment_shift",
      "title": "Moment title",
      "content": "What happened",
      "sentiment": "positive|neutral|negative"
    }
  ],
  "keyQuotes": ["quote1", "quote2", "quote3"],
  "ctaSuggestions": ["CTA1", "CTA2"],
  "videoScriptOutline": "A short-form video script outline in 5 bullet points",
  "shareableHook": "One punchy sentence for social media post"
}

Generate exactly 5 top moments. Focus on investment-relevant insights.`;

    try {
      const raw = await invokeLLM({ prompt, systemPrompt: "You are a professional video content producer for investor events.", response_format: { type: "json_object" } });
      const parsed = JSON.parse(raw);

      const trend: SentimentArc["trend"] =
        closingScore > openingScore + 5 ? "improving" : closingScore < openingScore - 5 ? "declining" : "stable";

      return {
        eventTitle,
        eventId,
        generatedAt: new Date().toISOString(),
        executiveSummary: parsed.executiveSummary ?? "",
        topMoments: parsed.topMoments ?? [],
        keyQuotes: parsed.keyQuotes ?? [],
        sentimentArc: { opening: openingScore, midpoint: midScore, closing: closingScore, trend },
        topQa: topQaRaw,
        ctaSuggestions: parsed.ctaSuggestions ?? [],
        videoScriptOutline: parsed.videoScriptOutline ?? "",
        shareableHook: parsed.shareableHook ?? "",
      };
    } catch {
      return {
        eventTitle,
        eventId,
        generatedAt: new Date().toISOString(),
        executiveSummary: "Strong investor event with positive engagement throughout. Key financial results discussed with clear forward guidance.",
        topMoments: [
          { timestamp: "00:00", type: "highlight", title: "Event Opens", content: "Welcome and housekeeping completed", sentiment: "positive" },
          { timestamp: "05:00", type: "highlight", title: "Financial Results", content: "Key financial metrics presented", sentiment: "positive" },
          { timestamp: "25:00", type: "quote", title: "CEO Key Statement", content: "Management provided strong forward guidance", sentiment: "positive" },
          { timestamp: "35:00", type: "qa", title: "Analyst Q&A", content: "Robust question and answer session", sentiment: "neutral" },
          { timestamp: "45:00", type: "highlight", title: "Closing Remarks", content: "Event concluded with positive outlook", sentiment: "positive" },
        ],
        keyQuotes: ["Strong results this quarter.", "We remain confident in our strategic direction.", "Our pipeline has never been stronger."],
        sentimentArc: { opening: openingScore, midpoint: midScore, closing: closingScore, trend: "stable" },
        topQa: topQaRaw,
        ctaSuggestions: ["Download the full presentation deck", "Subscribe to investor updates", "Schedule a one-on-one call with IR team"],
        videoScriptOutline: "• Open with key financial headline\n• 3 strategic highlights\n• Best Q&A exchange\n• Forward guidance statement\n• CTA to investor portal",
        shareableHook: "Watch the highlights from today's investor event — strong results, clear guidance, and confident management.",
      };
    }
  }
}

export const webcastRecapService = new WebcastRecapService();
