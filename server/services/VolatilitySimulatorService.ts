// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";

export class VolatilitySimulatorService {
  static async runSimulation(input: {
    transcriptExcerpt: string;
    currentSentiment: number;
    guidanceTone?: string;
    companyTicker?: string;
    eventType?: string;
    sectorContext?: string;
    priorVolatility?: number;
  }) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a quantitative finance expert specializing in event-driven volatility modeling. You run Monte Carlo-style simulations based on partial live transcript data to predict short-term market impact.

Given the current call state, simulate multiple market outcome scenarios and return JSON with:
- baseCase: { priceMove: number (percent), probability: number, timeframe: string }
- bullCase: { priceMove: number, probability: number, drivers: string[] }
- bearCase: { priceMove: number, probability: number, drivers: string[] }
- expectedVolatility: number (0-10 scale, annualized implied vol proxy)
- confidenceInterval: { lower: number, upper: number } (95% CI for price move)
- simulations: { scenario: string, priceMove: number, probability: number }[] (top 5 scenarios)
- keyDrivers: string[] (what's driving the forecast)
- toneImpact: number (-1 to +1, how much tone alone is moving the needle)
- guidanceSignal: string ("raised" | "maintained" | "lowered" | "ambiguous" | "not_discussed")
- tradingRecommendation: string (what a quant desk would do)
- refreshTimestamp: string (ISO timestamp)
- explanation: string`
          },
          {
            role: "user",
            content: `Run volatility simulation for this live call state:

TRANSCRIPT EXCERPT: "${input.transcriptExcerpt}"
CURRENT SENTIMENT: ${input.currentSentiment} (-1 to +1)
GUIDANCE TONE: ${input.guidanceTone || "not yet discussed"}
COMPANY: ${input.companyTicker || "Unknown"}
EVENT TYPE: ${input.eventType || "earnings_call"}
SECTOR: ${input.sectorContext || "General"}
PRIOR 30-DAY REALIZED VOL: ${input.priorVolatility || "N/A"}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "volatility_simulation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                baseCase: { type: "object", properties: { priceMove: { type: "number" }, probability: { type: "number" }, timeframe: { type: "string" } }, required: ["priceMove", "probability", "timeframe"], additionalProperties: false },
                bullCase: { type: "object", properties: { priceMove: { type: "number" }, probability: { type: "number" }, drivers: { type: "array", items: { type: "string" } } }, required: ["priceMove", "probability", "drivers"], additionalProperties: false },
                bearCase: { type: "object", properties: { priceMove: { type: "number" }, probability: { type: "number" }, drivers: { type: "array", items: { type: "string" } } }, required: ["priceMove", "probability", "drivers"], additionalProperties: false },
                expectedVolatility: { type: "number" },
                confidenceInterval: { type: "object", properties: { lower: { type: "number" }, upper: { type: "number" } }, required: ["lower", "upper"], additionalProperties: false },
                simulations: { type: "array", items: { type: "object", properties: { scenario: { type: "string" }, priceMove: { type: "number" }, probability: { type: "number" } }, required: ["scenario", "priceMove", "probability"], additionalProperties: false } },
                keyDrivers: { type: "array", items: { type: "string" } },
                toneImpact: { type: "number" },
                guidanceSignal: { type: "string" },
                tradingRecommendation: { type: "string" },
                refreshTimestamp: { type: "string" },
                explanation: { type: "string" }
              },
              required: ["baseCase", "bullCase", "bearCase", "expectedVolatility", "confidenceInterval", "simulations", "keyDrivers", "toneImpact", "guidanceSignal", "tradingRecommendation", "refreshTimestamp", "explanation"],
              additionalProperties: false
            }
          }
        }
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error("No LLM response");
      return JSON.parse(content);
    } catch (err) {
      console.error("[VolatilitySimulator] LLM error:", err);
      return {
        baseCase: { priceMove: 0.5, probability: 0.55, timeframe: "5 trading days" },
        bullCase: { priceMove: 3.2, probability: 0.25, drivers: ["Positive sentiment"] },
        bearCase: { priceMove: -2.1, probability: 0.20, drivers: ["Market uncertainty"] },
        expectedVolatility: 4.5,
        confidenceInterval: { lower: -3.0, upper: 4.0 },
        simulations: [],
        keyDrivers: ["Insufficient data for full simulation"],
        toneImpact: 0.0,
        guidanceSignal: "ambiguous",
        tradingRecommendation: "Hold — insufficient signal",
        refreshTimestamp: new Date().toISOString(),
        explanation: "Simulation could not be completed fully."
      };
    }
  }

  static async logSimulation(eventId: number, sessionId: number, result: any) {
    try {
      const db = await getDb();
      if (!db) return;
      await db.execute(
        `INSERT INTO volatility_simulations (event_id, session_id, base_case_move, bull_case_move, bear_case_move, expected_volatility, guidance_signal, tone_impact, simulations_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [eventId, sessionId, result.baseCase.priceMove, result.bullCase.priceMove, result.bearCase.priceMove, result.expectedVolatility, result.guidanceSignal, result.toneImpact, JSON.stringify(result.simulations)]
      );
    } catch (e) {
      console.error("[VolatilitySimulator] Log error:", e);
    }
  }
}
