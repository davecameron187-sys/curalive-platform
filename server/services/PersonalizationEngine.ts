// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { occTranscriptionSegments, sentimentSnapshots, webcastQa } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export interface PersonalizationSuggestion {
  id: string;
  priority: "critical" | "warning" | "info";
  category: "engagement" | "compliance" | "pace" | "content" | "qa";
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
}

export interface AdaptationResult {
  suggestions: PersonalizationSuggestion[];
  engagementScore: number;
  recommendedAction: string;
  analysedAt: string;
}

export class PersonalizationEngine {
  async analyzeAndSuggest(eventId: string): Promise<AdaptationResult> {
    const db = getDb();

    const [recentSegments, recentSentiment, pendingQa] = await Promise.all([
      db
        .select()
        .from(occTranscriptionSegments)
        .where(eq(occTranscriptionSegments.conferenceId, eventId))
        .orderBy(desc(occTranscriptionSegments.createdAt))
        .limit(20)
        .catch(() => []),
      db
        .select()
        .from(sentimentSnapshots)
        .where(eq(sentimentSnapshots.conferenceId, eventId))
        .orderBy(desc(sentimentSnapshots.createdAt))
        .limit(5)
        .catch(() => []),
      db
        .select()
        .from(webcastQa)
        .where(eq(webcastQa.eventId, eventId))
        .limit(10)
        .catch(() => []),
    ]);

    const transcriptText = recentSegments.map((s: any) => s.content).join(" ").slice(0, 3000);
    const avgSentiment = recentSentiment.length
      ? recentSentiment.reduce((sum: number, s: any) => sum + (s.overallScore ?? 50), 0) / recentSentiment.length
      : 50;
    const pendingCount = pendingQa.filter((q: any) => q.status === "pending").length;

    const prompt = `You are an Intelligent Broadcaster AI assistant for a live investor event.

Analyze this real-time event data and return JSON with smart operator suggestions:

Transcript (last 2 minutes): "${transcriptText}"
Sentiment score (0-100, higher=positive): ${avgSentiment.toFixed(0)}
Pending Q&A questions: ${pendingCount}

Return JSON:
{
  "suggestions": [
    {
      "id": "unique-id",
      "priority": "critical|warning|info",
      "category": "engagement|compliance|pace|content|qa",
      "title": "Short title",
      "message": "Detailed operator message",
      "action": "launch_poll|flag_qa|send_reminder|adjust_pace|none",
      "actionLabel": "Button label"
    }
  ],
  "engagementScore": 0-100,
  "recommendedAction": "Single most important thing operator should do right now"
}

Generate 2-4 relevant, actionable suggestions based on the actual data. Focus on what matters most.`;

    try {
      const raw = await invokeLLM({
        prompt,
        systemPrompt: "You are a real-time event intelligence system. Return only valid JSON.",
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(raw);
      return {
        suggestions: parsed.suggestions ?? [],
        engagementScore: parsed.engagementScore ?? Math.round(avgSentiment),
        recommendedAction: parsed.recommendedAction ?? "Monitor engagement levels",
        analysedAt: new Date().toISOString(),
      };
    } catch {
      return {
        suggestions: [
          {
            id: "default-1",
            priority: "info",
            category: "engagement",
            title: "Event Running Normally",
            message: "No immediate action required. Sentiment is stable.",
            action: "none",
            actionLabel: "Dismiss",
          },
        ],
        engagementScore: Math.round(avgSentiment),
        recommendedAction: "Continue monitoring",
        analysedAt: new Date().toISOString(),
      };
    }
  }
}

export const personalizationEngine = new PersonalizationEngine();
