// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

export class InvestorIntentionDecoderService {
  static async decodeIntent(input: {
    questionText: string;
    investorName?: string;
    investorType?: string;
    historicalQuestions?: string[];
    eventContext?: string;
    companyTicker?: string;
  }) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert in investor psychology and activist behavior patterns. You analyze investor questions during live earnings calls to decode hidden intent and predict follow-up behavior.

Investor archetypes to detect:
- ACTIVIST_PRESSURE: Questions probing governance, board composition, capital allocation to build activist case
- SHORT_SELLER_SIGNAL: Questions designed to surface negative information or contradictions
- RETAIL_CONFUSION: Genuine but uninformed questions from retail investors
- ANALYST_FISHING: Sophisticated probing for unreleased data points
- SUPPORTIVE_SHAREHOLDER: Friendly questions designed to help management tell their story
- COMPETITOR_INTELLIGENCE: Questions from disguised competitors seeking strategic information
- REGULATORY_PROBE: Questions testing compliance boundaries
- LITIGATION_SETUP: Questions building documentary evidence for future legal action

Return JSON with:
- primaryIntent: string (archetype from above)
- confidence: 0.000-1.000
- secondaryIntents: { intent: string, probability: number }[]
- aggressionScore: 0-100 (predicted follow-up aggression)
- hiddenAgenda: string (what the investor really wants to know)
- suggestedResponse: string (how management should handle this)
- followUpPrediction: string (what question likely comes next)
- riskLevel: "critical" | "high" | "medium" | "low"
- linguisticPatterns: string[] (specific patterns detected)
- intentBadge: string (short 2-3 word badge for Q&A queue)
- explanation: string`
          },
          {
            role: "user",
            content: `Decode the intent behind this investor question:

QUESTION: "${input.questionText}"
INVESTOR: ${input.investorName || "Unknown"}
INVESTOR TYPE: ${input.investorType || "Unknown"}
COMPANY: ${input.companyTicker || "Unknown"}
EVENT CONTEXT: ${input.eventContext || "Earnings call"}
${input.historicalQuestions?.length ? `PRIOR QUESTIONS FROM THIS INVESTOR:\n${input.historicalQuestions.join("\n")}` : ""}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "investor_intent",
            strict: true,
            schema: {
              type: "object",
              properties: {
                primaryIntent: { type: "string" },
                confidence: { type: "number" },
                secondaryIntents: { type: "array", items: { type: "object", properties: { intent: { type: "string" }, probability: { type: "number" } }, required: ["intent", "probability"], additionalProperties: false } },
                aggressionScore: { type: "number" },
                hiddenAgenda: { type: "string" },
                suggestedResponse: { type: "string" },
                followUpPrediction: { type: "string" },
                riskLevel: { type: "string" },
                linguisticPatterns: { type: "array", items: { type: "string" } },
                intentBadge: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["primaryIntent", "confidence", "secondaryIntents", "aggressionScore", "hiddenAgenda", "suggestedResponse", "followUpPrediction", "riskLevel", "linguisticPatterns", "intentBadge", "explanation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No LLM response");
      return JSON.parse(content);
    } catch (err) {
      console.error("[IntentDecoder] LLM error:", err);
      return {
        primaryIntent: "UNKNOWN",
        confidence: 0.3,
        secondaryIntents: [],
        aggressionScore: 30,
        hiddenAgenda: "Unable to determine — manual assessment recommended",
        suggestedResponse: "Provide a measured, factual response",
        followUpPrediction: "Standard follow-up expected",
        riskLevel: "medium",
        linguisticPatterns: [],
        intentBadge: "Review Needed",
        explanation: "Analysis could not be completed."
      };
    }
  }

  static async logIntent(eventId: number, sessionId: number, questionText: string, investorName: string, result: any) {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(
        `INSERT INTO investor_intent_logs (event_id, session_id, question_text, investor_name, primary_intent, confidence, aggression_score, risk_level, intent_badge, hidden_agenda) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, sessionId, questionText, investorName, result.primaryIntent, result.confidence, result.aggressionScore, result.riskLevel, result.intentBadge, result.hiddenAgenda]
      );
    } catch (e) {
      console.error("[IntentDecoder] Log error:", e);
    }
  }
}
