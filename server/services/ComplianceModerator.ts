// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { socialAuditLog } from "../../drizzle/schema";

export interface ModerationResult {
  approved: boolean;
  confidence: number;
  flags: ComplianceFlag[];
  suggestedEdit?: string;
  reasoning: string;
}

export interface ComplianceFlag {
  type: "financial_forward_looking" | "pii_exposure" | "price_sensitive" | "defamatory" | "regulatory_violation" | "sensitive_transcript_data";
  severity: "low" | "medium" | "high" | "critical";
  excerpt: string;
  explanation: string;
}

const MODERATION_SYSTEM_PROMPT = `You are a compliance moderator for CuraLive, a professional investor-events platform.
Analyze social media post content for compliance violations before publishing.
Check for:
1. Forward-looking financial statements that require disclaimers (SEC/IFRS rules)
2. Price-sensitive information that could constitute market manipulation
3. PII exposure (personal names, emails, private details from event transcripts)
4. Defamatory or legally risky claims
5. Sensitive transcript data that operators requested redacted
6. Regulatory violations (GDPR, SOX, JSE Listings Requirements)

Respond ONLY with valid JSON matching the schema provided.`;

export class ComplianceModerator {
  async moderate(content: string, eventContext?: string): Promise<ModerationResult> {
    const prompt = `Analyze this social media post for compliance issues:

POST CONTENT:
${content}

${eventContext ? `EVENT CONTEXT:\n${eventContext}\n` : ""}

Return JSON with this exact structure:
{
  "approved": boolean,
  "confidence": number (0-1),
  "flags": [
    {
      "type": "financial_forward_looking|pii_exposure|price_sensitive|defamatory|regulatory_violation|sensitive_transcript_data",
      "severity": "low|medium|high|critical",
      "excerpt": "the flagged text snippet",
      "explanation": "why this is flagged"
    }
  ],
  "suggestedEdit": "rewritten version if not approved, or null",
  "reasoning": "brief summary of decision"
}`;

    try {
      const result = await invokeLLM({
        messages: [
          { role: "system", content: MODERATION_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const text = result.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text);
      return {
        approved: parsed.approved ?? false,
        confidence: parsed.confidence ?? 0.5,
        flags: parsed.flags ?? [],
        suggestedEdit: parsed.suggestedEdit ?? undefined,
        reasoning: parsed.reasoning ?? "Moderation check completed",
      };
    } catch {
      return {
        approved: false,
        confidence: 0,
        flags: [],
        reasoning: "Moderation service unavailable — manual review required",
      };
    }
  }

  async logAction(
    userId: number,
    action: string,
    options: { postId?: number; platform?: string; details?: string; ipAddress?: string } = {}
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;
    try {
      await db.insert(socialAuditLog).values({
        userId,
        postId: options.postId ?? null,
        action,
        platform: options.platform ?? null,
        details: options.details ?? null,
        ipAddress: options.ipAddress ?? null,
      });
    } catch {
    }
  }
}

export const complianceModerator = new ComplianceModerator();
