// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

export class CrossEventConsistencyService {
  static async checkConsistency(input: {
    currentStatement: string;
    speakerRole?: string;
    companyName?: string;
    historicalStatements?: string[];
    peerStatements?: string[];
    eventType?: string;
  }) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a corporate communications consistency expert specializing in public company disclosures. You analyze executive statements for contradictions with prior statements, peer company messaging, and regulatory guidance.

Analyze the current statement against historical context and return JSON with:
- consistencyScore: 0.000-1.000 (1.0 = perfectly consistent)
- contradictionsFound: { statement: string, priorStatement: string, severity: "critical"|"high"|"medium"|"low", explanation: string }[]
- messagingDrift: string (how messaging has shifted over time)
- riskLevel: "critical" | "high" | "medium" | "low"
- correctiveLanguage: string | null (suggested rephrasing to maintain consistency)
- investigationRisk: string (likelihood this inconsistency triggers regulatory inquiry)
- peerComparison: string (how this compares to industry peer messaging)
- timelineAnalysis: string (evolution of messaging over events)
- flaggedPhrases: string[] (specific phrases that deviate from prior messaging)
- explanation: string`
          },
          {
            role: "user",
            content: `Check this statement for cross-event consistency:

CURRENT STATEMENT: "${input.currentStatement}"
SPEAKER: ${input.speakerRole || "Executive"}
COMPANY: ${input.companyName || "Unknown"}
EVENT TYPE: ${input.eventType || "earnings_call"}

${input.historicalStatements?.length ? `HISTORICAL STATEMENTS FROM PRIOR EVENTS:\n${input.historicalStatements.map((s, i) => `[Event ${i + 1}] ${s}`).join("\n")}` : "No historical statements available."}

${input.peerStatements?.length ? `PEER COMPANY STATEMENTS:\n${input.peerStatements.join("\n")}` : ""}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "consistency_check",
            strict: true,
            schema: {
              type: "object",
              properties: {
                consistencyScore: { type: "number" },
                contradictionsFound: { type: "array", items: { type: "object", properties: { statement: { type: "string" }, priorStatement: { type: "string" }, severity: { type: "string" }, explanation: { type: "string" } }, required: ["statement", "priorStatement", "severity", "explanation"], additionalProperties: false } },
                messagingDrift: { type: "string" },
                riskLevel: { type: "string" },
                correctiveLanguage: { type: ["string", "null"] },
                investigationRisk: { type: "string" },
                peerComparison: { type: "string" },
                timelineAnalysis: { type: "string" },
                flaggedPhrases: { type: "array", items: { type: "string" } },
                explanation: { type: "string" }
              },
              required: ["consistencyScore", "contradictionsFound", "messagingDrift", "riskLevel", "correctiveLanguage", "investigationRisk", "peerComparison", "timelineAnalysis", "flaggedPhrases", "explanation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No LLM response");
      return JSON.parse(content);
    } catch (err) {
      console.error("[ConsistencyGuardian] LLM error:", err);
      return {
        consistencyScore: 0.7,
        contradictionsFound: [],
        messagingDrift: "Unable to analyze — manual review recommended",
        riskLevel: "medium",
        correctiveLanguage: null,
        investigationRisk: "Unknown",
        peerComparison: "Insufficient data",
        timelineAnalysis: "Insufficient historical data",
        flaggedPhrases: [],
        explanation: "Analysis could not be completed."
      };
    }
  }

  static async logCheck(eventId: number, sessionId: number, statement: string, result: any) {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(
        `INSERT INTO consistency_check_logs (event_id, session_id, statement_text, consistency_score, risk_level, contradictions_count, messaging_drift, corrective_language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, sessionId, statement, result.consistencyScore, result.riskLevel, result.contradictionsFound.length, result.messagingDrift, result.correctiveLanguage]
      );
    } catch (e) {
      console.error("[ConsistencyGuardian] Log error:", e);
    }
  }
}
