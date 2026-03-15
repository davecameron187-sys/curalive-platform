// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { eventBriefResults } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export interface KeyMessage {
  title: string;
  description: string;
  emphasis: "high" | "medium" | "low";
}

export interface TalkingPoint {
  topic: string;
  points: string[];
  speakerNotes?: string;
}

export interface AnticipatedQuestion {
  question: string;
  suggestedAnswer: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface FinancialHighlight {
  metric: string;
  value: string;
  context?: string;
}

export interface EventBriefOutput {
  briefTitle: string;
  briefSummary: string;
  keyMessages: KeyMessage[];
  talkingPoints: TalkingPoint[];
  anticipatedQuestions: AnticipatedQuestion[];
  financialHighlights: FinancialHighlight[];
  generationConfidence: number;
}

/**
 * Event Brief Generator Service
 * Converts press releases into structured event briefs with talking points
 * Used by operators to prepare for investor events and earnings calls
 */
export class EventBriefGeneratorService {
  /**
   * Generate an event brief from a press release
   * Returns structured brief with key messages, talking points, and Q&A prep
   */
  static async generateBriefFromPressRelease(
    pressRelease: string,
    pressReleaseTitle?: string,
    context?: {
      conferenceId?: number;
      eventId?: string;
      operatorId?: number;
    }
  ): Promise<EventBriefOutput> {
    try {
      const systemPrompt = `You are an expert investor relations professional and event strategist.
Your task is to convert a press release into a comprehensive event brief for an investor event or earnings call.

Generate a structured brief that includes:
1. A compelling brief title (5-10 words)
2. Executive summary (2-3 sentences)
3. 3-5 key messages with emphasis levels
4. 4-6 talking point sections with 3-4 points each
5. 5-8 anticipated tough questions with suggested answers
6. Financial highlights if applicable

The brief should be:
- Investor-focused and professional
- Emphasize positive narratives while addressing potential concerns
- Include specific metrics and data points
- Prepare speakers for challenging questions
- Structured for easy presenter delivery

Respond with a JSON object containing all required fields.`;

      const userPrompt = `Press Release${pressReleaseTitle ? ` (${pressReleaseTitle})` : ""}:\n\n${pressRelease}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "event_brief",
            strict: true,
            schema: {
              type: "object",
              properties: {
                briefTitle: { type: "string", description: "Compelling title for the event brief" },
                briefSummary: { type: "string", description: "2-3 sentence executive summary" },
                keyMessages: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      emphasis: { type: "string", enum: ["high", "medium", "low"] },
                    },
                    required: ["title", "description", "emphasis"],
                  },
                  minItems: 3,
                  maxItems: 5,
                },
                talkingPoints: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      topic: { type: "string" },
                      points: {
                        type: "array",
                        items: { type: "string" },
                        minItems: 3,
                        maxItems: 4,
                      },
                      speakerNotes: { type: "string" },
                    },
                    required: ["topic", "points"],
                  },
                  minItems: 4,
                  maxItems: 6,
                },
                anticipatedQuestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      suggestedAnswer: { type: "string" },
                      difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                    },
                    required: ["question", "suggestedAnswer", "difficulty"],
                  },
                  minItems: 5,
                  maxItems: 8,
                },
                financialHighlights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      metric: { type: "string" },
                      value: { type: "string" },
                      context: { type: "string" },
                    },
                    required: ["metric", "value"],
                  },
                },
                confidence: { type: "number", minimum: 0, maximum: 100 },
              },
              required: [
                "briefTitle",
                "briefSummary",
                "keyMessages",
                "talkingPoints",
                "anticipatedQuestions",
                "financialHighlights",
                "confidence",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const parsed = typeof content === "string" ? JSON.parse(content) : content;

      return {
        briefTitle: parsed.briefTitle,
        briefSummary: parsed.briefSummary,
        keyMessages: parsed.keyMessages || [],
        talkingPoints: parsed.talkingPoints || [],
        anticipatedQuestions: parsed.anticipatedQuestions || [],
        financialHighlights: parsed.financialHighlights || [],
        generationConfidence: parsed.confidence || 85,
      };
    } catch (error) {
      console.error("[EventBriefGenerator] Error generating brief:", error);
      // Fallback to safe default
      return {
        briefTitle: "Event Brief",
        briefSummary: "Unable to generate brief at this time. Please try again.",
        keyMessages: [],
        talkingPoints: [],
        anticipatedQuestions: [],
        financialHighlights: [],
        generationConfidence: 0,
      };
    }
  }

  /**
   * Generate and save an event brief
   */
  static async generateAndSaveBrief(
    pressRelease: string,
    pressReleaseTitle: string | undefined,
    conferenceId: number,
    eventId: string | undefined,
    operatorId: number | undefined
  ): Promise<{ id: number; brief: EventBriefOutput }> {
    try {
      // Generate the brief
      const brief = await this.generateBriefFromPressRelease(pressRelease, pressReleaseTitle, {
        conferenceId,
        eventId,
        operatorId,
      });

      // Save to database
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(eventBriefResults).values({
        conferenceId,
        eventId,
        operatorId,
        pressRelease,
        pressReleaseTitle,
        briefTitle: brief.briefTitle,
        briefSummary: brief.briefSummary,
        keyMessages: brief.keyMessages,
        talkingPoints: brief.talkingPoints,
        anticipatedQuestions: brief.anticipatedQuestions,
        financialHighlights: brief.financialHighlights,
        generationConfidence: brief.generationConfidence,
      });

      // Get the inserted ID
      const insertedId = result[0].insertId;

      return {
        id: insertedId,
        brief,
      };
    } catch (error) {
      console.error("[EventBriefGenerator] Error saving brief:", error);
      throw error;
    }
  }

  /**
   * Get a saved event brief
   */
  static async getBrief(briefId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(eventBriefResults)
        .where(eq(eventBriefResults.id, briefId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("[EventBriefGenerator] Error fetching brief:", error);
      return null;
    }
  }

  /**
   * Get all briefs for a conference
   */
  static async getConferenceBriefs(conferenceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(eventBriefResults)
        .where(eq(eventBriefResults.conferenceId, conferenceId));

      return results;
    } catch (error) {
      console.error("[EventBriefGenerator] Error fetching conference briefs:", error);
      return [];
    }
  }

  /**
   * Get approved briefs for a conference (used in event)
   */
  static async getApprovedBriefs(conferenceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(eventBriefResults)
        .where(and(eq(eventBriefResults.conferenceId, conferenceId), eq(eventBriefResults.operatorApproved, true)));

      return results;
    } catch (error) {
      console.error("[EventBriefGenerator] Error fetching approved briefs:", error);
      return [];
    }
  }

  /**
   * Approve a brief for use in event
   */
  static async approveBrief(briefId: number, notes?: string, operatorId?: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(eventBriefResults)
        .set({
          operatorApproved: true,
          operatorNotes: notes,
          approvedAt: new Date(),
        })
        .where(eq(eventBriefResults.id, briefId));

      return { success: true };
    } catch (error) {
      console.error("[EventBriefGenerator] Error approving brief:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Mark brief as used in event
   */
  static async markBriefAsUsed(briefId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(eventBriefResults)
        .set({
          usedInEvent: true,
          usedAt: new Date(),
        })
        .where(eq(eventBriefResults.id, briefId));

      return { success: true };
    } catch (error) {
      console.error("[EventBriefGenerator] Error marking brief as used:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update brief with operator feedback
   */
  static async updateBriefNotes(briefId: number, notes: string) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(eventBriefResults)
        .set({
          operatorNotes: notes,
          updatedAt: new Date(),
        })
        .where(eq(eventBriefResults.id, briefId));

      return { success: true };
    } catch (error) {
      console.error("[EventBriefGenerator] Error updating brief notes:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Delete a brief
   */
  static async deleteBrief(briefId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(eventBriefResults).where(eq(eventBriefResults.id, briefId));

      return { success: true };
    } catch (error) {
      console.error("[EventBriefGenerator] Error deleting brief:", error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get brief statistics for a conference
   */
  static async getConferenceBriefStats(conferenceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const briefs = await db
        .select()
        .from(eventBriefResults)
        .where(eq(eventBriefResults.conferenceId, conferenceId));

      const stats = {
        total: briefs.length,
        approved: briefs.filter((b: any) => b.operatorApproved).length,
        used: briefs.filter((b: any) => b.usedInEvent).length,
        averageConfidence:
          briefs.length > 0
            ? Math.round(briefs.reduce((sum: number, b: any) => sum + (b.generationConfidence || 0), 0) / briefs.length)
            : 0,
      };

      return stats;
    } catch (error) {
      console.error("[EventBriefGenerator] Error calculating stats:", error);
      return { total: 0, approved: 0, used: 0, averageConfidence: 0 };
    }
  }
}
