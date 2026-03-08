import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { aiGeneratedContent, webcastEvents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface ContentGenerationContext {
  eventId: number;
  eventTitle: string;
  transcript: string;
  sentimentData?: {
    overallSentiment: string;
    averageScore: number;
    keyMoments: string[];
  };
  attendeeCount?: number;
  duration?: number; // in minutes
  qaHighlights?: string[];
}

export class ContentGenerationTriggerService {
  /**
   * Automatically generate all content types for a completed event
   */
  static async generateAllContent(
    context: ContentGenerationContext,
    generatedBy: number
  ): Promise<{ contentIds: number[]; errors: string[] }> {
    const contentIds: number[] = [];
    const errors: string[] = [];

    const contentTypes: Array<
      | "event_summary"
      | "press_release"
      | "follow_up_email"
      | "talking_points"
      | "qa_analysis"
      | "sentiment_report"
    > = [
      "event_summary",
      "press_release",
      "follow_up_email",
      "talking_points",
      "qa_analysis",
      "sentiment_report",
    ];

    for (const contentType of contentTypes) {
      try {
        const contentId = await this.generateContent(
          context,
          contentType,
          generatedBy
        );
        contentIds.push(contentId);
      } catch (error) {
        errors.push(
          `Failed to generate ${contentType}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return { contentIds, errors };
  }

  /**
   * Generate a single content type
   */
  static async generateContent(
    context: ContentGenerationContext,
    contentType:
      | "event_summary"
      | "press_release"
      | "follow_up_email"
      | "talking_points"
      | "qa_analysis"
      | "sentiment_report",
    generatedBy: number
  ): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Build the prompt based on content type
    const prompt = this.buildPrompt(contentType, context);

    // Call LLM to generate content
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert at generating professional business content for investor relations and corporate communications. Be concise, impactful, and data-driven.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const generatedContent =
      typeof response.choices[0].message.content === "string"
        ? response.choices[0].message.content
        : "";

    if (!generatedContent) {
      throw new Error("LLM returned empty content");
    }

    // Store in database
    const result = await db.insert(aiGeneratedContent).values({
      eventId: context.eventId,
      contentType,
      title: this.getTitleForContentType(contentType),
      content: generatedContent,
      status: "generated",
      generatedAt: new Date(),
      generatedBy,
    });

    return (result as any).insertId || result[0];
  }

  /**
   * Build LLM prompt based on content type
   */
  private static buildPrompt(
    contentType: string,
    context: ContentGenerationContext
  ): string {
    const baseContext = `
Event: ${context.eventTitle}
Duration: ${context.duration || "Unknown"} minutes
Attendees: ${context.attendeeCount || "Unknown"}
Sentiment: ${context.sentimentData?.overallSentiment || "Not analyzed"}

Transcript Summary:
${context.transcript.substring(0, 3000)}...

${context.qaHighlights ? `Key Q&A Points:\n${context.qaHighlights.join("\n")}` : ""}
`;

    const prompts: Record<string, string> = {
      event_summary: `Generate a concise 2-3 paragraph executive summary of this investor event. Include:
- Key announcements and strategic updates
- Financial highlights and guidance
- Notable Q&A responses
- Overall sentiment and investor reception

Keep it professional, factual, and suitable for distribution to investors.

${baseContext}`,

      press_release: `Generate a professional press release (250-350 words) for this investor event. Include:
- Compelling headline
- Key announcements
- Direct quotes from management (if available)
- Financial highlights
- Boilerplate about the company

Format as a standard press release with headline, dateline, and body.

${baseContext}`,

      follow_up_email: `Generate a personalized follow-up email template for IR contacts after this event. Include:
- Warm greeting
- Event highlights
- Key takeaways
- Invitation for follow-up calls
- Clear call-to-action

Keep it professional but personable, 150-200 words.

${baseContext}`,

      talking_points: `Generate 5-7 concise talking points for investor relations follow-up calls. Each point should:
- Be one sentence
- Highlight a key message or achievement
- Be suitable for verbal discussion

Format as a numbered list.

${baseContext}`,

      qa_analysis: `Analyze the Q&A session from this event. Provide:
- Top 3 most important questions asked
- Sentiment of questions (positive/neutral/negative)
- Key gaps in investor coverage
- Recommended follow-up topics for next call

Be analytical and data-driven.

${baseContext}`,

      sentiment_report: `Generate a brief sentiment analysis report (150-200 words) including:
- Overall sentiment score and interpretation
- Key emotional moments during the event
- Audience engagement assessment
- Investor confidence indicators
- Recommendations for future events

${baseContext}`,
    };

    return (
      prompts[contentType] ||
      `Generate professional business content based on:\n${baseContext}`
    );
  }

  /**
   * Get title for content type
   */
  private static getTitleForContentType(contentType: string): string {
    const titles: Record<string, string> = {
      event_summary: "Event Summary",
      press_release: "Press Release",
      follow_up_email: "Follow-Up Email Template",
      talking_points: "Talking Points",
      qa_analysis: "Q&A Analysis",
      sentiment_report: "Sentiment Report",
    };

    return titles[contentType] || "AI Generated Content";
  }

  /**
   * Get IR contacts for an event to populate recipients
   */
  static async getIRContactsForEvent(eventId: number): Promise<string[]> {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get event details
    const [event] = await db
      .select()
      .from(webcastEvents)
      .where(eq(webcastEvents.id, eventId))
      .limit(1);

    if (!event) {
      return [];
    }

    // In a real implementation, this would query an ir_contacts table
    // For now, return empty array - to be implemented based on your data model
    return [];
  }

  /**
   * Trigger content generation for an event (called when event completes)
   */
  static async triggerForEventCompletion(
    eventId: number,
    transcript: string,
    sentimentData?: any,
    generatedBy?: number
  ): Promise<{ success: boolean; contentIds: number[]; errors: string[] }> {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get event details
      const [event] = await db
        .select()
        .from(webcastEvents)
        .where(eq(webcastEvents.id, eventId))
        .limit(1);

      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      const context: ContentGenerationContext = {
        eventId,
        eventTitle: event.title || "Untitled Event",
        transcript,
        sentimentData,
        attendeeCount: event.peakAttendees || undefined,
        duration: event.startTime && event.endTime
          ? Math.round(
              (new Date(event.endTime).getTime() -
                new Date(event.startTime).getTime()) /
                (1000 * 60)
            )
          : undefined,
      };

      const result = await this.generateAllContent(
        context,
        generatedBy || 0
      );

      return {
        success: result.errors.length === 0,
        contentIds: result.contentIds,
        errors: result.errors,
      };
    } catch (error) {
      return {
        success: false,
        contentIds: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
