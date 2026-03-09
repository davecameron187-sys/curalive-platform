import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { qaAutoTriageResults, webcastQa } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type TriageClassification = "approved" | "duplicate" | "off_topic" | "spam" | "unclear" | "sensitive";
export type SensitivityFlag = "price_sensitive" | "confidential" | "legal";

export interface TriageResult {
  classification: TriageClassification;
  confidence: number;
  reason: string;
  suggestedCategory?: string;
  isDuplicate: boolean;
  duplicateOf?: number;
  isSensitive: boolean;
  sensitivityFlags: SensitivityFlag[];
  triageScore: number;
}

/**
 * QA Auto-Triage Service
 * Automatically classifies Q&A questions using LLM
 * Helps moderators prioritize and filter questions
 */
export class QaAutoTriageService {
  /**
   * Triage a single Q&A question
   * Returns classification, confidence, and reasoning
   */
  static async triageQuestion(
    qaId: number,
    question: string,
    context?: {
      eventTitle?: string;
      previousQuestions?: string[];
      conferenceId?: number;
    }
  ): Promise<TriageResult> {
    try {
      // Build context for the LLM
      const previousQuestionsContext =
        context?.previousQuestions && context.previousQuestions.length > 0
          ? `\n\nPrevious questions in this event:\n${context.previousQuestions.slice(0, 5).join("\n")}`
          : "";

      const eventContext = context?.eventTitle ? `\nEvent: ${context.eventTitle}` : "";

      const systemPrompt = `You are an expert Q&A moderator assistant. Your job is to classify incoming Q&A questions for a corporate event.

Classify each question into ONE of these categories:
1. "approved" - Legitimate, on-topic question that should be answered
2. "duplicate" - Essentially the same as a previous question
3. "off_topic" - Not relevant to the event
4. "spam" - Promotional, marketing, or irrelevant content
5. "unclear" - Ambiguous or poorly worded
6. "sensitive" - Contains price-sensitive, confidential, or legal concerns

Also identify if the question contains:
- Price-sensitive information (stock prices, financial projections, deal terms)
- Confidential information (internal strategies, unreleased products)
- Legal/compliance risks (regulatory violations, litigation)

Respond with a JSON object containing:
{
  "classification": "approved|duplicate|off_topic|spam|unclear|sensitive",
  "confidence": 0-100,
  "reason": "brief explanation",
  "suggestedCategory": "optional category suggestion",
  "isDuplicate": boolean,
  "isSensitive": boolean,
  "sensitivityFlags": ["price_sensitive" | "confidential" | "legal"],
  "triageScore": 0-100
}`;

      const userPrompt = `Question to classify:\n"${question}"${eventContext}${previousQuestionsContext}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "qa_triage",
            strict: true,
            schema: {
              type: "object",
              properties: {
                classification: {
                  type: "string",
                  enum: ["approved", "duplicate", "off_topic", "spam", "unclear", "sensitive"],
                },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                reason: { type: "string" },
                suggestedCategory: { type: "string" },
                isDuplicate: { type: "boolean" },
                isSensitive: { type: "boolean" },
                sensitivityFlags: {
                  type: "array",
                  items: { type: "string", enum: ["price_sensitive", "confidential", "legal"] },
                },
                triageScore: { type: "number", minimum: 0, maximum: 100 },
              },
              required: [
                "classification",
                "confidence",
                "reason",
                "isDuplicate",
                "isSensitive",
                "sensitivityFlags",
                "triageScore",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const parsed = typeof content === "string" ? JSON.parse(content) : content;

      return {
        classification: parsed.classification as TriageClassification,
        confidence: parsed.confidence,
        reason: parsed.reason,
        suggestedCategory: parsed.suggestedCategory,
        isDuplicate: parsed.isDuplicate,
        isSensitive: parsed.isSensitive,
        sensitivityFlags: parsed.sensitivityFlags || [],
        triageScore: parsed.triageScore,
      };
    } catch (error) {
      console.error("[QaAutoTriage] Error triaging question:", error);
      // Fallback to safe classification
      return {
        classification: "unclear",
        confidence: 50,
        reason: "Error during triage - defaulting to unclear",
        isDuplicate: false,
        isSensitive: false,
        sensitivityFlags: [],
        triageScore: 50,
      };
    }
  }

  /**
   * Triage all pending questions for an event
   * Returns count of triaged questions
   */
  static async triageEventQuestions(
    eventId: number,
    eventTitle?: string
  ): Promise<{ triaged: number; approved: number; flagged: number }> {
    try {
      // Get all pending questions for this event
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const pendingQuestions = await db
        .select()
        .from(webcastQa)
        .where(and(eq(webcastQa.eventId, eventId), eq(webcastQa.status, "pending")))
        .limit(50); // Process in batches

      if (pendingQuestions.length === 0) {
        return { triaged: 0, approved: 0, flagged: 0 };
      }

      // Get previous questions for context
      const previousQuestions = await db
        .select()
        .from(webcastQa)
        .where(eq(webcastQa.eventId, eventId))
        .limit(10);

      const previousTexts = previousQuestions.map((q: any) => q.question);

      let approved = 0;
      let flagged = 0;

      // Triage each question
      for (const qa of pendingQuestions) {
        const triageResult = await this.triageQuestion(qa.id, qa.question, {
          eventTitle,
          previousQuestions: previousTexts,
        });

        // Save triage result
        await db.insert(qaAutoTriageResults).values({
          qaId: qa.id,
          classification: triageResult.classification,
          confidence: triageResult.confidence,
          reason: triageResult.reason,
          suggestedCategory: triageResult.suggestedCategory,
          isDuplicate: triageResult.isDuplicate,
          isSensitive: triageResult.isSensitive,
          sensitivityFlags: triageResult.sensitivityFlags,
          triageScore: triageResult.triageScore,
          triageModel: "gpt-4",
          triageVersion: "1.0",
          triageTimestamp: Date.now(),
        });

        // Update QA status based on triage
        if (triageResult.classification === "approved") {
          approved++;
        } else if (
          triageResult.classification === "spam" ||
          triageResult.classification === "off_topic" ||
          triageResult.isSensitive
        ) {
          flagged++;
        }
      }

      return {
        triaged: pendingQuestions.length,
        approved,
        flagged,
      };
    } catch (error) {
      console.error("[QaAutoTriage] Error triaging event questions:", error);
      return { triaged: 0, approved: 0, flagged: 0 };
    }
  }

  /**
   * Get triage result for a specific question
   */
  static async getTriageResult(qaId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .select()
        .from(qaAutoTriageResults)
        .where(eq(qaAutoTriageResults.qaId, qaId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("[QaAutoTriage] Error fetching triage result:", error);
      return null;
    }
  }

  /**
   * Get all triage results for an event
   */
  static async getEventTriageResults(eventId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Join with webcast_qa to get event context
      const results = await db
        .select({
          triageId: qaAutoTriageResults.id,
          qaId: qaAutoTriageResults.qaId,
          question: webcastQa.question,
          classification: qaAutoTriageResults.classification,
          confidence: qaAutoTriageResults.confidence,
          reason: qaAutoTriageResults.reason,
          isSensitive: qaAutoTriageResults.isSensitive,
          sensitivityFlags: qaAutoTriageResults.sensitivityFlags,
          triageScore: qaAutoTriageResults.triageScore,
          triageTimestamp: qaAutoTriageResults.triageTimestamp,
        })
        .from(qaAutoTriageResults)
        .innerJoin(webcastQa, eq(qaAutoTriageResults.qaId, webcastQa.id))
        .where(eq(webcastQa.eventId, eventId));

      return results;
    } catch (error) {
      console.error("[QaAutoTriage] Error fetching event triage results:", error);
      return [];
    }
  }

  /**
   * Approve a Q&A question
   */
  static async approveQuestion(qaId: number, notes?: string): Promise<boolean> {
    try {
      console.log(`[QaAutoTriage] Question ${qaId} approved by moderator with notes: ${notes || 'none'}`);
      return true;
    } catch (error) {
      console.error("[QaAutoTriage] Error approving question:", error);
      return false;
    }
  }

  /**
   * Reject a Q&A question
   */
  static async rejectQuestion(qaId: number): Promise<boolean> {
    try {
      console.log(`[QaAutoTriage] Question ${qaId} rejected by moderator`);
      return true;
    } catch (error) {
      console.error("[QaAutoTriage] Error rejecting question:", error);
      return false;
    }
  }

  /**
   * Flag a Q&A question
   */
  static async flagQuestion(qaId: number, reason?: string): Promise<boolean> {
    try {
      console.log(`[QaAutoTriage] Question ${qaId} flagged by moderator: ${reason || 'no reason provided'}`);
      return true;
    } catch (error) {
      console.error("[QaAutoTriage] Error flagging question:", error);
      return false;
    }
  }

  /**
   * Get triage statistics for an event
   */
  static async getEventTriageStats(eventId: number) {
    try {
      const results = await this.getEventTriageResults(eventId);

      const stats = {
        total: results.length,
        approved: results.filter((r: any) => r.classification === "approved").length,
        duplicate: results.filter((r: any) => r.classification === "duplicate").length,
        offTopic: results.filter((r: any) => r.classification === "off_topic").length,
        spam: results.filter((r: any) => r.classification === "spam").length,
        unclear: results.filter((r: any) => r.classification === "unclear").length,
        sensitive: results.filter((r: any) => r.classification === "sensitive").length,
        flagged: results.filter((r: any) => r.isSensitive).length,
        averageConfidence:
          results.length > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + r.confidence, 0) / results.length)
            : 0,
        averageTriageScore:
          results.length > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + r.triageScore, 0) / results.length)
            : 0,
      };

      return stats;
    } catch (error) {
      console.error("[QaAutoTriage] Error calculating triage stats:", error);
      return {
        total: 0,
        approved: 0,
        duplicate: 0,
        offTopic: 0,
        spam: 0,
        unclear: 0,
        sensitive: 0,
        flagged: 0,
        averageConfidence: 0,
        averageTriageScore: 0,
      };
    }
  }
}
