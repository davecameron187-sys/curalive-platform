// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

export class MaterialityRiskOracleService {
  static async scoreStatement(input: {
    statementText: string;
    speakerRole?: string;
    companyTicker?: string;
    jurisdiction?: string;
    eventType?: string;
    priorFilings?: string;
  }) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a securities regulation expert specializing in Regulation FD (SEC), JSE Listings Requirements, and MAR (EU). You analyze executive statements during live investor events for material non-public information (MNPI) risk. You must determine if a statement constitutes selective disclosure requiring immediate regulatory filing (SENS/8-K/RNS).

Analyze the statement and return JSON with:
- materialityScore: 0.000-1.000 (probability this is MNPI)
- filingRequired: boolean (whether an immediate regulatory filing is recommended)
- filingType: string (e.g. "SENS", "8-K", "RNS", "none")
- riskLevel: "critical" | "high" | "medium" | "low"
- mnpiIndicators: string[] (specific indicators found)
- regulatoryBasis: string (which regulation/rule applies)
- draftFiling: { headline: string, body: string, urgency: string } | null (auto-drafted filing if required)
- suggestedCorrection: string | null (what the speaker should say to mitigate risk)
- historicalPrecedents: string[] (similar enforcement cases)
- explanation: string`
          },
          {
            role: "user",
            content: `Analyze this statement for MNPI/materiality risk:

STATEMENT: "${input.statementText}"
SPEAKER ROLE: ${input.speakerRole || "Executive"}
COMPANY: ${input.companyTicker || "Unknown"}
JURISDICTION: ${input.jurisdiction || "multi"}
EVENT TYPE: ${input.eventType || "earnings_call"}
${input.priorFilings ? `PRIOR FILINGS CONTEXT:\n${input.priorFilings}` : ""}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "materiality_risk",
            strict: true,
            schema: {
              type: "object",
              properties: {
                materialityScore: { type: "number" },
                filingRequired: { type: "boolean" },
                filingType: { type: "string" },
                riskLevel: { type: "string" },
                mnpiIndicators: { type: "array", items: { type: "string" } },
                regulatoryBasis: { type: "string" },
                draftFiling: {
                  type: ["object", "null"],
                  properties: {
                    headline: { type: "string" },
                    body: { type: "string" },
                    urgency: { type: "string" }
                  },
                  required: ["headline", "body", "urgency"],
                  additionalProperties: false
                },
                suggestedCorrection: { type: ["string", "null"] },
                historicalPrecedents: { type: "array", items: { type: "string" } },
                explanation: { type: "string" }
              },
              required: ["materialityScore", "filingRequired", "filingType", "riskLevel", "mnpiIndicators", "regulatoryBasis", "draftFiling", "suggestedCorrection", "historicalPrecedents", "explanation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No LLM response");
      return JSON.parse(content);
    } catch (err) {
      console.error("[MaterialityOracle] LLM error:", err);
      return {
        materialityScore: 0.35,
        filingRequired: false,
        filingType: "none",
        riskLevel: "medium",
        mnpiIndicators: ["Unable to fully analyze — manual review recommended"],
        regulatoryBasis: "Reg FD / JSE 3.4",
        draftFiling: null,
        suggestedCorrection: null,
        historicalPrecedents: [],
        explanation: "Analysis could not be completed. Manual compliance review recommended."
      };
    }
  }

  static async logRisk(eventId: number, sessionId: number, statementText: string, result: any) {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(
        `INSERT INTO materiality_risk_logs (event_id, session_id, statement_text, materiality_score, filing_required, filing_type, risk_level, mnpi_indicators, draft_filing, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, sessionId, statementText, result.materialityScore, result.filingRequired ? 1 : 0, result.filingType, result.riskLevel, JSON.stringify(result.mnpiIndicators), result.draftFiling ? JSON.stringify(result.draftFiling) : null, result.explanation]
      );
    } catch (e) {
      console.error("[MaterialityOracle] Log error:", e);
    }
  }
}
