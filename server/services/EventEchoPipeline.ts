// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { occTranscriptionSegments, sentimentSnapshots, webcastEvents } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { truncateForPlatform, type SocialPlatform, OAUTH_CONFIGS } from "../_core/socialOAuth";

export interface EchoSource {
  type: "transcript_highlight" | "sentiment_peak" | "qa_insight" | "event_summary" | "key_quote";
  label: string;
}

export interface GeneratedPost {
  platform: SocialPlatform;
  content: string;
  source: EchoSource;
  hashtags: string[];
  callToAction?: string;
  predictedEngagement?: number;
}

export interface EchoResult {
  posts: GeneratedPost[];
  eventTitle: string;
  sourceData: string;
  generatedAt: Date;
}

const ECHO_SYSTEM_PROMPT = `You are the CuraLive Event Echo AI — a specialist in transforming live investor event data into compelling social media content.
Your posts must be:
- Professional and compliant with financial communications standards
- Platform-optimized (tone, length, hashtags)
- Engaging without making unsubstantiated claims
- Free of forward-looking statements unless appropriately caveated
- Never reveal confidential PII or sensitive transcript segments

You generate posts that amplify event ROI and drive follow-on engagement.`;

export class EventEchoPipeline {
  async processEvent(eventId: number): Promise<EchoResult> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const events = await db
      .select()
      .from(webcastEvents)
      .where(eq(webcastEvents.id, eventId))
      .limit(1);

    const event = events[0];
    if (!event) throw new Error(`Event ${eventId} not found`);

    const segments = await db
      .select()
      .from(occTranscriptionSegments)
      .where(eq(occTranscriptionSegments.conferenceId, String(eventId)))
      .orderBy(desc(occTranscriptionSegments.id))
      .limit(30);

    const transcript = segments.map((s: any) => s.content ?? "").join(" ").trim();

    const sentimentRows = await db
      .select()
      .from(sentimentSnapshots)
      .where(eq(sentimentSnapshots.eventId, String(eventId)))
      .orderBy(desc(sentimentSnapshots.createdAt))
      .limit(1);

    const latestSentiment = sentimentRows[0];

    const sourceData = this.buildSourceSummary(event, transcript, latestSentiment);
    const posts = await this.generatePlatformPosts(event.title ?? "Event", sourceData);

    return {
      posts,
      eventTitle: event.title ?? "Event",
      sourceData,
      generatedAt: new Date(),
    };
  }

  async generateFromText(
    text: string,
    eventTitle: string,
    source: EchoSource,
    platforms: SocialPlatform[]
  ): Promise<GeneratedPost[]> {
    const prompt = buildMultiPlatformPrompt(text, eventTitle, source.label, platforms);

    const result = await invokeLLM({
      messages: [
        { role: "system", content: ECHO_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const text2 = result.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text2);
    const posts: GeneratedPost[] = [];

    for (const platform of platforms) {
      const raw = parsed[platform];
      if (!raw) continue;
      posts.push({
        platform,
        content: truncateForPlatform(raw.content ?? "", platform),
        source,
        hashtags: raw.hashtags ?? [],
        callToAction: raw.callToAction,
        predictedEngagement: raw.predictedEngagement,
      });
    }

    return posts;
  }

  async optimizeForPlatform(content: string, platform: SocialPlatform): Promise<string> {
    const config = OAUTH_CONFIGS[platform];
    const prompt = `Rewrite this content for ${config.displayName} (max ${config.charLimit} chars).
Keep it professional, add 2-3 relevant hashtags, and optimize for engagement on ${config.displayName}.
Return only the optimized post text.

Original: ${content}`;

    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });

    const optimized = result.choices?.[0]?.message?.content ?? content;
    return truncateForPlatform(optimized, platform);
  }

  async generateSentimentHighlight(
    sentimentScore: number,
    sentimentLabel: string,
    eventTitle: string
  ): Promise<string> {
    const prompt = `Generate a professional LinkedIn post about this investor event sentiment result:
Event: ${eventTitle}
Sentiment: ${sentimentLabel} (score: ${sentimentScore}/100)

Make it insightful, 2-3 sentences, professional tone for investor relations.`;

    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });

    return result.choices?.[0]?.message?.content ?? "";
  }

  private buildSourceSummary(event: any, transcript: string, sentiment: any): string {
    const parts: string[] = [];
    parts.push(`Event: ${event.title ?? "Investor Event"}`);
    if (transcript) parts.push(`Key transcript excerpt:\n${transcript.slice(0, 800)}`);
    if (sentiment) {
      const score = (sentiment as any).overallScore ?? 50;
      const label = score >= 70 ? "Positive" : score >= 40 ? "Neutral" : "Cautious";
      parts.push(`Audience sentiment: ${label} (${score}/100)`);
    }
    return parts.join("\n\n");
  }

  private async generatePlatformPosts(eventTitle: string, sourceData: string): Promise<GeneratedPost[]> {
    const platforms: SocialPlatform[] = ["linkedin", "twitter"];
    const source: EchoSource = { type: "event_summary", label: "Event Summary" };

    try {
      return await this.generateFromText(sourceData, eventTitle, source, platforms);
    } catch {
      return [];
    }
  }
}

function buildMultiPlatformPrompt(
  sourceData: string,
  eventTitle: string,
  sourceLabel: string,
  platforms: SocialPlatform[]
): string {
  const platformSpecs = platforms.map((p) => {
    const config = OAUTH_CONFIGS[p];
    return `- ${config.displayName}: max ${config.charLimit} chars, ${p === "twitter" ? "concise & punchy" : p === "linkedin" ? "professional & insightful" : p === "instagram" ? "visual-led, emotive" : "engaging"}`;
  }).join("\n");

  return `Generate social media posts for "${eventTitle}" from this event data:

SOURCE (${sourceLabel}):
${sourceData}

Create optimized posts for each platform:
${platformSpecs}

Return JSON with this structure:
{
  ${platforms.map(p => `"${p}": { "content": "post text", "hashtags": ["tag1", "tag2"], "callToAction": "optional CTA", "predictedEngagement": 0.0-1.0 }`).join(",\n  ")}
}`;
}

export const eventEchoPipeline = new EventEchoPipeline();
