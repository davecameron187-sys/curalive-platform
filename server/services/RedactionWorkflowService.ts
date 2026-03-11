// @ts-nocheck
import { getDb } from "../db";
import { transcriptEdits } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

export interface RedactionRequest {
  originalText: string;
  redactionType: "financial" | "personal" | "confidential" | "legal" | "medical" | "custom";
  reason?: string;
  customPattern?: string;
}

export interface RedactionResult {
  originalText: string;
  redactedText: string;
  redactionType: string;
  confidence: number;
  redactedSegments: Array<{
    original: string;
    redacted: string;
    start: number;
    end: number;
  }>;
}

export class RedactionWorkflowService {
  /**
   * Detect sensitive content in text
   */
  static async detectSensitiveContent(text: string): Promise<{
    hasSensitive: boolean;
    types: string[];
    segments: Array<{ text: string; type: string; confidence: number }>;
  }> {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a content moderation expert. Analyze text for sensitive information including:
- Financial data (prices, revenue, margins, projections)
- Personal information (names, emails, phone numbers, addresses)
- Confidential business information (strategies, partnerships, unreleased products)
- Legal information (litigation, settlements, regulatory issues)
- Medical information (health conditions, treatments, diagnoses)

Return a JSON object with:
{
  "hasSensitive": boolean,
  "types": ["type1", "type2"],
  "segments": [
    {"text": "sensitive text", "type": "category", "confidence": 0.95}
  ]
}`,
        },
        {
          role: "user",
          content: `Analyze this text for sensitive content:\n\n${text}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sensitive_content_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              hasSensitive: { type: "boolean" },
              types: { type: "array", items: { type: "string" } },
              segments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    type: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["text", "type", "confidence"],
                },
              },
            },
            required: ["hasSensitive", "types", "segments"],
          },
        },
      },
    });

    try {
      const content = response.choices[0].message.content;
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      // Normalize types to lowercase so tests can reliably match 'financial', 'personal', etc.
      if (parsed.types && Array.isArray(parsed.types)) {
        parsed.types = parsed.types.map((t: string) =>
          t.toLowerCase().replace(/\s+/g, "_")
        );
      }
      return parsed;
    } catch (error) {
      return {
        hasSensitive: false,
        types: [],
        segments: [],
      };
    }
  }

  /**
   * Apply redaction to text
   */
  static async applyRedaction(request: RedactionRequest): Promise<RedactionResult> {
    const redactionPatterns: Record<string, RegExp> = {
      financial: /\$[\d,]+(?:\.\d{2})?|[\d,]+%|revenue|profit|margin|EBITDA|earnings/gi,
      personal: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b\d{3}-\d{3}-\d{4}\b/g,
      confidential: /confidential|proprietary|trade secret|NDA|under wraps/gi,
      legal: /lawsuit|litigation|settlement|regulatory|compliance|violation/gi,
      medical: /disease|treatment|medication|diagnosis|patient|health condition/gi,
    };

    let redactedText = request.originalText;
    const redactedSegments: RedactionResult["redactedSegments"] = [];

    // Get pattern to use
    let pattern = redactionPatterns[request.redactionType];
    if (request.redactionType === "custom" && request.customPattern) {
      pattern = new RegExp(request.customPattern, "gi");
    }

    if (pattern) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(request.originalText)) !== null) {
        const original = match[0];
        const redacted = `[${request.redactionType.toUpperCase()}]`;

        redactedSegments.push({
          original,
          redacted,
          start: match.index,
          end: match.index + original.length,
        });

        redactedText = redactedText.replace(original, redacted);
      }
    }

    // Use LLM for additional context-aware redaction
    const sensitiveContent = await this.detectSensitiveContent(request.originalText);

    sensitiveContent.segments.forEach((segment) => {
      if (!redactedText.includes(`[${request.redactionType.toUpperCase()}]`)) {
        const redacted = `[${request.redactionType.toUpperCase()}]`;
        redactedText = redactedText.replace(segment.text, redacted);

        redactedSegments.push({
          original: segment.text,
          redacted,
          start: request.originalText.indexOf(segment.text),
          end: request.originalText.indexOf(segment.text) + segment.text.length,
        });
      }
    });

    return {
      originalText: request.originalText,
      redactedText,
      redactionType: request.redactionType,
      confidence: sensitiveContent.segments.length > 0 ? 0.95 : 0.5,
      redactedSegments,
    };
  }

  /**
   * Create redaction edit from original text
   */
  static async createRedactionEdit(
    conferenceId: number,
    transcriptionSegmentId: number,
    originalText: string,
    redactionType: string,
    operatorId: number,
    operatorName: string,
    reason?: string
  ) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const redactionRequest: RedactionRequest = {
      originalText,
      redactionType: redactionType as any,
      reason,
    };

    const result = await this.applyRedaction(redactionRequest);

    // Create edit in database
    const edit = await db.insert(transcriptEdits).values({
      transcriptionSegmentId: transcriptionSegmentId as any,
      conferenceId: conferenceId as any,
      originalText,
      correctedText: result.redactedText,
      editType: "redaction" as any,
      reason: reason || `Redacted ${redactionType} content`,
      confidence: Math.round(result.confidence * 100),
      approved: false,
      operatorId: operatorId as any,
      operatorName,
    } as any);

    return {
      editId: (edit as any).insertId,
      redactionResult: result,
    };
  }

  /**
   * Batch redact multiple segments
   */
  static async batchRedact(
    segments: Array<{
      id: number;
      text: string;
      type: string;
    }>
  ): Promise<
    Array<{
      segmentId: number;
      redactedText: string;
      redactionCount: number;
    }>
  > {
    const results: Array<{
      segmentId: number;
      redactedText: string;
      redactionCount: number;
    }> = [];

    for (const segment of segments) {
      const result = await this.applyRedaction({
        originalText: segment.text,
        redactionType: segment.type as any,
      });

      results.push({
        segmentId: segment.id,
        redactedText: result.redactedText,
        redactionCount: result.redactedSegments.length,
      });
    }

    return results;
  }

  /**
   * Get redaction statistics
   */
  static async getRedactionStats(conferenceId: number) {
    const db = await getDb();
    if (!db) {
      return {
        totalRedactions: 0,
        redactionsByType: {},
        approvedRedactions: 0,
        pendingRedactions: 0,
      };
    }

    const redactions = await db
      .select()
      .from(transcriptEdits)
      .where(
        and(
          eq(transcriptEdits.conferenceId, conferenceId),
          eq(transcriptEdits.editType, "redaction" as any)
        )
      );

    const stats = {
      totalRedactions: redactions.length,
      redactionsByType: {} as Record<string, number>,
      approvedRedactions: redactions.filter((r) => r.approved).length,
      pendingRedactions: redactions.filter((r) => !r.approved).length,
    };

    redactions.forEach((r) => {
      const reason = r.reason || "unknown";
      stats.redactionsByType[reason] = (stats.redactionsByType[reason] || 0) + 1;
    });

    return stats;
  }

  /**
   * Export redaction audit trail
   */
  static async exportRedactionAudit(conferenceId: number) {
    const db = await getDb();
    if (!db) return [];

    const redactions = await db
      .select()
      .from(transcriptEdits)
      .where(
        and(
          eq(transcriptEdits.conferenceId, conferenceId),
          eq(transcriptEdits.editType, "redaction" as any)
        )
      );

    return redactions.map((r) => ({
      id: r.id,
      originalText: r.originalText,
      redactedText: r.correctedText,
      reason: r.reason,
      approved: r.approved,
      createdAt: r.createdAt,
    }));
  }

  /**
   * Validate redaction completeness
   */
  static validateRedaction(originalText: string, redactedText: string): {
    isValid: boolean;
    issues: string[];
    redactionPercentage: number;
  } {
    const issues: string[] = [];
    const originalLength = originalText.length;
    const redactedLength = redactedText.length;
    const redactionPercentage = originalLength > 0 ? ((originalLength - redactedLength) / originalLength) * 100 : 0;

    // Check if sensitive patterns still exist
    const sensitivePatterns = [
      { pattern: /\$[\d,]+/, name: "financial amounts" },
      { pattern: /\b\d{3}-\d{3}-\d{4}\b/, name: "phone numbers" },
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, name: "email addresses" },
    ];

    sensitivePatterns.forEach(({ pattern, name }) => {
      if (pattern.test(redactedText)) {
        issues.push(`Still contains ${name}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
      redactionPercentage: Math.round(redactionPercentage * 100) / 100,
    };
  }

  /**
   * Generate redaction report
   */
  static async generateRedactionReport(conferenceId: number) {
    const stats = await this.getRedactionStats(conferenceId);
    const audit = await this.exportRedactionAudit(conferenceId);

    return {
      conferenceId,
      generatedAt: new Date().toISOString(),
      summary: {
        totalRedactions: stats.totalRedactions,
        approvedRedactions: stats.approvedRedactions,
        pendingRedactions: stats.pendingRedactions,
        approvalRate: stats.totalRedactions > 0 ? (stats.approvedRedactions / stats.totalRedactions) * 100 : 0,
      },
      redactionsByType: stats.redactionsByType,
      auditTrail: audit,
    };
  }
}
