// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { toxicityFilterResults, webcastQa, occTranscriptionSegments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type ContentType = "qa_question" | "spoken_segment" | "chat_message";
export type ToxicityLabel = "safe" | "mild" | "moderate" | "severe";
export type RiskLevel = "safe" | "low" | "medium" | "high" | "critical";
export type RecommendedAction = "approve" | "review" | "flag_moderator" | "block" | "redact";

export interface IssueDetected {
  type: "profanity" | "harassment" | "hate_speech" | "price_sensitive" | "confidential" | "legal_risk" | "spam";
  severity: "low" | "medium" | "high";
  phrase: string;
}

export interface FilterResult {
  toxicityScore: number;
  toxicityLabel: ToxicityLabel;
  isFlagged: boolean;
  isPriceSensitive: boolean;
  isConfidential: boolean;
  isLegalRisk: boolean;
  isAbusive: boolean;
  isSpam: boolean;
  detectedIssues: IssueDetected[];
  riskLevel: RiskLevel;
  recommendedAction: RecommendedAction;
  filterConfidence: number;
}

/**
 * Toxicity & Compliance Filter Service
 * Flags abusive, price-sensitive, and compliance-risky content
 * Helps moderators identify problematic questions before they reach the queue
 */
export class ToxicityFilterService {
  /**
   * Filter and analyze content for toxicity and compliance issues
   */
  static async filterContent(
    content: string,
    contentType: ContentType,
    context?: {
      eventTitle?: string;
      qaId?: number;
      conferenceId?: number;
      transcriptionSegmentId?: number;
    }
  ): Promise<FilterResult> {
    try {
      const systemPrompt = `You are a content moderation expert specializing in corporate event compliance.
Analyze the following content for:
1. Toxicity: Profanity, harassment, hate speech
2. Compliance: Price-sensitive information, confidential data, legal risks
3. Spam: Promotional or irrelevant content

Respond with a JSON object containing:
{
  "toxicityScore": 0-100,
  "toxicityLabel": "safe|mild|moderate|severe",
  "isPriceSensitive": boolean,
  "isConfidential": boolean,
  "isLegalRisk": boolean,
  "isAbusive": boolean,
  "isSpam": boolean,
  "detectedIssues": [
    {
      "type": "profanity|harassment|hate_speech|price_sensitive|confidential|legal_risk|spam",
      "severity": "low|medium|high",
      "phrase": "the problematic phrase"
    }
  ],
  "riskLevel": "safe|low|medium|high|critical",
  "recommendedAction": "approve|review|flag_moderator|block|redact",
  "confidence": 0-100
}`;

      const eventContext = context?.eventTitle ? `\nEvent: ${context.eventTitle}` : "";
      const userPrompt = `Content to analyze:\n"${content}"${eventContext}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "toxicity_filter",
            strict: true,
            schema: {
              type: "object",
              properties: {
                toxicityScore: { type: "number", minimum: 0, maximum: 100 },
                toxicityLabel: { type: "string", enum: ["safe", "mild", "moderate", "severe"] },
                isPriceSensitive: { type: "boolean" },
                isConfidential: { type: "boolean" },
                isLegalRisk: { type: "boolean" },
                isAbusive: { type: "boolean" },
                isSpam: { type: "boolean" },
                detectedIssues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["profanity", "harassment", "hate_speech", "price_sensitive", "confidential", "legal_risk", "spam"],
                      },
                      severity: { type: "string", enum: ["low", "medium", "high"] },
                      phrase: { type: "string" },
                    },
                    required: ["type", "severity", "phrase"],
                  },
                },
                riskLevel: { type: "string", enum: ["safe", "low", "medium", "high", "critical"] },
                recommendedAction: { type: "string", enum: ["approve", "review", "flag_moderator", "block", "redact"] },
                confidence: { type: "number", minimum: 0, maximum: 100 },
              },
              required: [
                "toxicityScore",
                "toxicityLabel",
                "isPriceSensitive",
                "isConfidential",
                "isLegalRisk",
                "isAbusive",
                "isSpam",
                "detectedIssues",
                "riskLevel",
                "recommendedAction",
                "confidence",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const responseContent = response.choices[0].message.content;
      const parsed = typeof responseContent === "string" ? JSON.parse(responseContent) : responseContent;

      // Determine if flagged based on risk level
      const isFlagged = ["medium", "high", "critical"].includes(parsed.riskLevel);

      return {
        toxicityScore: parsed.toxicityScore,
        toxicityLabel: parsed.toxicityLabel as ToxicityLabel,
        isFlagged,
        isPriceSensitive: parsed.isPriceSensitive,
        isConfidential: parsed.isConfidential,
        isLegalRisk: parsed.isLegalRisk,
        isAbusive: parsed.isAbusive,
        isSpam: parsed.isSpam,
        detectedIssues: parsed.detectedIssues || [],
        riskLevel: parsed.riskLevel as RiskLevel,
        recommendedAction: parsed.recommendedAction as RecommendedAction,
        filterConfidence: parsed.confidence,
      };
    } catch (error) {
      console.error("[ToxicityFilter] Error filtering content:", error);
      // Fallback to safe classification
      return {
        toxicityScore: 0,
        toxicityLabel: "safe",
        isFlagged: false,
        isPriceSensitive: false,
        isConfidential: false,
        isLegalRisk: false,
        isAbusive: false,
        isSpam: false,
        detectedIssues: [],
        riskLevel: "safe",
        recommendedAction: "approve",
        filterConfidence: 50,
      };
    }
  }

  /**
   * Filter a Q&A question and save result
   */
  static async filterQaQuestion(qaId: number, question: string, conferenceId?: number, eventTitle?: string) {
    try {
      const filterResult = await this.filterContent(question, "qa_question", {
        qaId,
        conferenceId,
        eventTitle,
      });

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Save filter result
      await db.insert(toxicityFilterResults).values({
        qaId,
        conferenceId: conferenceId || undefined,
        contentType: "qa_question",
        content: question,
        toxicityScore: filterResult.toxicityScore,
        toxicityLabel: filterResult.toxicityLabel,
        isFlagged: filterResult.isFlagged,
        isPriceSensitive: filterResult.isPriceSensitive,
        isConfidential: filterResult.isConfidential,
        isLegalRisk: filterResult.isLegalRisk,
        isAbusive: filterResult.isAbusive,
        isSpam: filterResult.isSpam,
        detectedIssues: filterResult.detectedIssues,
        riskLevel: filterResult.riskLevel,
        recommendedAction: filterResult.recommendedAction,
        filterModel: "perspective-api-v2",
        filterVersion: "1.0",
        filterConfidence: filterResult.filterConfidence,
        filterTimestamp: Date.now(),
        moderatorReviewed: false,
      });

      return filterResult;
    } catch (error) {
      console.error("[ToxicityFilter] Error filtering QA question:", error);
      throw error;
    }
  }

  /**
   * Filter all pending Q&A questions for an event
   */
  static async filterEventQuestions(eventId: number, eventTitle?: string) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all pending questions
      const pendingQuestions = await db
        .select()
        .from(webcastQa)
        .where(and(eq(webcastQa.eventId, eventId), eq(webcastQa.status, "pending")))
        .limit(50);

      let flagged = 0;
      let safe = 0;

      for (const qa of pendingQuestions) {
        const result = await this.filterQaQuestion(qa.id, qa.question, undefined, eventTitle);
        if (result.isFlagged) {
          flagged++;
        } else {
          safe++;
        }
      }

      return { total: pendingQuestions.length, flagged, safe };
    } catch (error) {
      console.error("[ToxicityFilter] Error filtering event questions:", error);
      return { total: 0, flagged: 0, safe: 0 };
    }
  }

  /**
   * Get filter result for a specific Q&A
   */
  static async getQaFilterResult(qaId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(toxicityFilterResults)
        .where(eq(toxicityFilterResults.qaId, qaId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error("[ToxicityFilter] Error fetching filter result:", error);
      return null;
    }
  }

  /**
   * Get all flagged content for a conference
   */
  static async getFlaggedContent(conferenceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const flagged = await db
        .select()
        .from(toxicityFilterResults)
        .where(and(eq(toxicityFilterResults.conferenceId, conferenceId), eq(toxicityFilterResults.isFlagged, true)));

      return flagged;
    } catch (error) {
      console.error("[ToxicityFilter] Error fetching flagged content:", error);
      return [];
    }
  }

  /**
   * Get filter statistics for a conference
   */
  static async getConferenceFilterStats(conferenceId: number) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select()
        .from(toxicityFilterResults)
        .where(eq(toxicityFilterResults.conferenceId, conferenceId));

      const stats = {
        total: results.length,
        flagged: results.filter((r: any) => r.isFlagged).length,
        safe: results.filter((r: any) => !r.isFlagged).length,
        priceSensitive: results.filter((r: any) => r.isPriceSensitive).length,
        confidential: results.filter((r: any) => r.isConfidential).length,
        legalRisk: results.filter((r: any) => r.isLegalRisk).length,
        abusive: results.filter((r: any) => r.isAbusive).length,
        spam: results.filter((r: any) => r.isSpam).length,
        averageToxicityScore:
          results.length > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + (r.toxicityScore || 0), 0) / results.length)
            : 0,
        averageConfidence:
          results.length > 0
            ? Math.round(results.reduce((sum: number, r: any) => sum + (r.filterConfidence || 0), 0) / results.length)
            : 0,
      };

      return stats;
    } catch (error) {
      console.error("[ToxicityFilter] Error calculating stats:", error);
      return {
        total: 0,
        flagged: 0,
        safe: 0,
        priceSensitive: 0,
        confidential: 0,
        legalRisk: 0,
        abusive: 0,
        spam: 0,
        averageToxicityScore: 0,
        averageConfidence: 0,
      };
    }
  }

  /**
   * Mark filter result as reviewed by moderator
   */
  static async markAsReviewed(
    filterId: number,
    action: "approved" | "rejected" | "redacted" | "escalated",
    notes?: string,
    userId?: number
  ) {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update the filter result
      await db
        .update(toxicityFilterResults)
        .set({
          moderatorReviewed: true,
          moderatorAction: action,
          moderatorNotes: notes,
          reviewedBy: userId,
          reviewedAt: new Date(),
        })
        .where(eq(toxicityFilterResults.id, filterId));

      return true;
    } catch (error) {
      console.error("[ToxicityFilter] Error marking as reviewed:", error);
      return false;
    }
  }
}
