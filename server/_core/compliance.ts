import { invokeLLM } from "./llm";
import { db } from "../db";
import { complianceViolations, alertHistory } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type ViolationType = "abuse" | "forward_looking" | "price_sensitive" | "insider_info" | "policy_breach" | "profanity" | "harassment" | "misinformation";
export type Severity = "low" | "medium" | "high" | "critical";

export interface DetectionResult {
  detected: boolean;
  violationType: ViolationType;
  severity: Severity;
  confidenceScore: number;
  explanation: string;
}

/**
 * Detect compliance violations in a transcript segment using GPT-4.
 * Returns null if no violation detected, or violation details if detected.
 */
export async function detectViolation(
  transcriptExcerpt: string,
  speakerName?: string,
  speakerRole?: string
): Promise<DetectionResult | null> {
  try {
    const systemPrompt = `You are a compliance detection AI for enterprise events (earnings calls, investor relations, board meetings).
Your job is to detect policy violations in spoken content and classify them by severity.

Violation types:
- abuse: Profanity, harassment, personal attacks
- forward_looking: Forward-looking statements (earnings projections, guidance)
- price_sensitive: Information that could affect stock price
- insider_info: Non-public material information
- policy_breach: Violation of event policies or regulations
- profanity: Explicit language
- harassment: Hostile or discriminatory language
- misinformation: False or misleading statements

For each transcript segment, determine:
1. Is there a violation? (yes/no)
2. If yes, what type?
3. Severity (low/medium/high/critical)
4. Confidence score (0.0-1.0)
5. Brief explanation

Respond with JSON only:
{
  "detected": boolean,
  "violationType": "string or null",
  "severity": "low|medium|high|critical",
  "confidenceScore": number,
  "explanation": "string"
}`;

    const userPrompt = `Analyze this transcript excerpt for compliance violations:

Speaker: ${speakerName || "Unknown"}
Role: ${speakerRole || "Unknown"}
Content: "${transcriptExcerpt}"

Respond with JSON only.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    // Strip markdown code fences if the LLM wraps the JSON in ```json ... ```
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const result = JSON.parse(cleaned);

    if (!result.detected) return null;

    return {
      detected: true,
      violationType: result.violationType || "policy_breach",
      severity: result.severity || "medium",
      confidenceScore: Math.min(1, Math.max(0, result.confidenceScore || 0.5)),
      explanation: result.explanation || "Violation detected",
    };
  } catch (error) {
    console.error("[Compliance] Detection error:", error);
    return null;
  }
}

/**
 * Create a compliance violation alert in the database.
 */
export async function createViolationAlert(
  eventId: string,
  conferenceId: string | undefined,
  violation: DetectionResult,
  speakerName: string | undefined,
  speakerRole: string | undefined,
  transcriptExcerpt: string,
  startTimeMs?: number,
  endTimeMs?: number
) {
  try {
    const result = await db.insert(complianceViolations).values({
      eventId,
      conferenceId: conferenceId || null,
      violationType: violation.violationType,
      severity: violation.severity,
      confidenceScore: violation.confidenceScore,
      speakerName: speakerName || null,
      speakerRole: speakerRole || null,
      transcriptExcerpt,
      startTimeMs: startTimeMs || null,
      endTimeMs: endTimeMs || null,
      acknowledged: 0,
      actionTaken: "none",
    });

    // drizzle mysql2 returns [OkPacket, null] — insertId is in result[0]
    const insertedId = Number((result as any)[0]?.insertId ?? result.insertId ?? 0);
    // Log creation in alert history
    if (insertedId) {
      await db.insert(alertHistory).values({
        violationId: insertedId,
        action: "created",
        actorId: null,
        details: JSON.stringify({
          reason: "Automated detection",
          confidenceScore: violation.confidenceScore,
        }),
      });
    }

    return { id: insertedId };
  } catch (error) {
    console.error("[Compliance] Alert creation error:", error);
    throw error;
  }
}

/**
 * Acknowledge a violation alert (mark as reviewed by operator).
 */
export async function acknowledgeViolation(violationId: number, operatorId: number, notes?: string) {
  try {
    await db
      .update(complianceViolations)
      .set({
        acknowledged: true,
        acknowledgedBy: operatorId,
        acknowledgedAt: new Date(),
        notes: notes || null,
      })
      .where(eq(complianceViolations.id, violationId));

    // Log acknowledgment in alert history
    await db.insert(alertHistory).values({
      violationId,
      action: "acknowledged",
      actorId: operatorId,
      details: JSON.stringify({ notes }),
    });
  } catch (error) {
    console.error("[Compliance] Acknowledgment error:", error);
    throw error;
  }
}

/**
 * Get recent violations for an event.
 */
export async function getEventViolations(eventId: string, limit = 100) {
  try {
    return await db.query.complianceViolations.findMany({
      where: eq(complianceViolations.eventId, eventId),
      orderBy: (violations, { desc }) => [desc(violations.createdAt)],
      limit,
    });
  } catch (error) {
    console.error("[Compliance] Query error:", error);
    return [];
  }
}

/**
 * Get unacknowledged violations for an event.
 */
export async function getUnacknowledgedViolations(eventId: string) {
  try {
    return await db.query.complianceViolations.findMany({
      where: and(
        eq(complianceViolations.eventId, eventId),
        eq(complianceViolations.acknowledged, false)
      ),
      orderBy: (violations, { desc }) => [desc(violations.severity), desc(violations.createdAt)],
    });
  } catch (error) {
    console.error("[Compliance] Query error:", error);
    return [];
  }
}

/**
 * Compliance Rule Engine for Real-Time Detection
 */

export interface ComplianceRule {
  id: string;
  name: string;
  category: "financial" | "data_protection" | "content" | "accessibility";
  condition: (text: string, metadata: Record<string, unknown>) => boolean;
  severity: "warning" | "error";
  message: string;
}

export interface ComplianceViolationAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: "warning" | "error";
  message: string;
  detectedText: string;
  timestamp: number;
  speakerId?: string;
}

class ComplianceRuleEngine {
  private rules: Map<string, ComplianceRule> = new Map();
  private violations: Map<string, ComplianceViolationAlert[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Financial Compliance Rules
    this.addRule({
      id: "financial_forward_looking",
      name: "Forward-Looking Statements",
      category: "financial",
      condition: (text) => {
        const keywords = [
          "will",
          "expect",
          "anticipate",
          "believe",
          "estimate",
          "project",
          "forecast",
        ];
        return keywords.some((keyword) =>
          text.toLowerCase().includes(keyword)
        );
      },
      severity: "warning",
      message:
        "Forward-looking statement detected. Ensure proper disclaimers are included.",
    });

    // Data Protection Rules
    this.addRule({
      id: "data_pii_detection",
      name: "Personal Information Detection",
      category: "data_protection",
      condition: (text) => {
        const piiPatterns = [
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b\d{16}\b/, // Credit card
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
        ];
        return piiPatterns.some((pattern) => pattern.test(text));
      },
      severity: "error",
      message: "Potential personal information detected. Review before sharing.",
    });
  }

  addRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  evaluateText(
    conferenceId: string,
    text: string,
    metadata: Record<string, unknown> = {}
  ): ComplianceViolationAlert[] {
    const violations: ComplianceViolationAlert[] = [];

    this.rules.forEach((rule) => {
      try {
        if (rule.condition(text, metadata)) {
          const violation: ComplianceViolationAlert = {
            id: `violation_${Date.now()}_${Math.random()}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            message: rule.message,
            detectedText: text.substring(0, 100),
            timestamp: Date.now(),
            speakerId: (metadata.speakerId as string) || undefined,
          };

          violations.push(violation);

          const conferenceViolations = this.violations.get(conferenceId) || [];
          conferenceViolations.push(violation);
          this.violations.set(conferenceId, conferenceViolations);
        }
      } catch (error) {
        console.error(`[Compliance] Error evaluating rule ${rule.id}:`, error);
      }
    });

    return violations;
  }

  getViolations(conferenceId: string): ComplianceViolationAlert[] {
    return this.violations.get(conferenceId) || [];
  }

  generateReport(conferenceId: string): Record<string, unknown> {
    const violations = this.violations.get(conferenceId) || [];
    const errorCount = violations.filter((v) => v.severity === "error").length;
    const warningCount = violations.filter(
      (v) => v.severity === "warning"
    ).length;

    return {
      conferenceId,
      totalViolations: violations.length,
      errors: errorCount,
      warnings: warningCount,
      complianceScore: Math.max(
        0,
        100 - (errorCount * 10 + warningCount * 5)
      ),
      violations: violations.slice(-10),
      timestamp: Date.now(),
    };
  }

  clearViolations(conferenceId: string): void {
    this.violations.delete(conferenceId);
  }

  getRules(): ComplianceRule[] {
    return Array.from(this.rules.values());
  }
}

export const complianceRuleEngine = new ComplianceRuleEngine();
