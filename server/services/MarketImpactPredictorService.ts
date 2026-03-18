// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export interface MarketImpactPrediction {
  predictedVolatility: number;
  direction: "positive" | "negative" | "neutral";
  confidence: number;
  reasoning: string;
  riskFactors: string[];
  catalysts: string[];
  timeHorizon: string;
  historicalComparison: string;
}

export class MarketImpactPredictorService {
  static async predictImpact(params: {
    sentimentScore: number;
    topicKeywords: string[];
    evasivenessScore?: number;
    companyTicker?: string;
    eventType?: string;
    transcriptExcerpt?: string;
    historicalContext?: string;
  }): Promise<MarketImpactPrediction> {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a quantitative financial analyst specializing in earnings call sentiment impact analysis and event-driven market prediction. You combine NLP insights with market microstructure knowledge. Your predictions must be grounded in linguistic evidence and historical patterns.`,
        },
        {
          role: "user",
          content: `Analyze the following investor event data and predict short-term market impact:

SENTIMENT SCORE: ${params.sentimentScore} (range: -1.0 bearish to +1.0 bullish)
KEY TOPICS: ${params.topicKeywords.join(", ")}
EVASIVENESS SCORE: ${params.evasivenessScore !== undefined ? params.evasivenessScore : "Not available"}
COMPANY: ${params.companyTicker || "Not specified"}
EVENT TYPE: ${params.eventType || "Earnings call"}
TRANSCRIPT EXCERPT: ${params.transcriptExcerpt ? params.transcriptExcerpt.substring(0, 2000) : "Not provided"}
HISTORICAL CONTEXT: ${params.historicalContext || "None available"}

Predict the short-term (1-5 trading day) stock price impact and volatility.

Key analysis dimensions:
1. TONE vs SUBSTANCE gap (positive tone but weak fundamentals = bearish signal)
2. GUIDANCE LANGUAGE (raised/maintained/lowered/withdrawn)
3. MANAGEMENT CREDIBILITY signals (hedging, confidence, precision)
4. MARKET EXPECTATION alignment (beating/meeting/missing consensus)
5. SECTOR-SPECIFIC patterns and seasonal effects

Output JSON only:
{
  "predictedVolatility": number (0-10 scale, 0=flat, 10=extreme move),
  "direction": "positive" | "negative" | "neutral",
  "confidence": number (0.0-1.0),
  "reasoning": "evidence-based explanation",
  "riskFactors": ["specific risk factors identified"],
  "catalysts": ["specific positive/negative catalysts"],
  "timeHorizon": "1-day" | "2-3 days" | "5 days",
  "historicalComparison": "comparison to similar past events"
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices?.[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        predictedVolatility: Math.min(10, Math.max(0, parsed.predictedVolatility ?? 3)),
        direction: ["positive", "negative", "neutral"].includes(parsed.direction) ? parsed.direction : "neutral",
        confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
        reasoning: parsed.reasoning || "Analysis unavailable",
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
        catalysts: Array.isArray(parsed.catalysts) ? parsed.catalysts : [],
        timeHorizon: parsed.timeHorizon || "2-3 days",
        historicalComparison: parsed.historicalComparison || "No historical data available",
      };
    } catch {
      return {
        predictedVolatility: 3,
        direction: "neutral",
        confidence: 0.3,
        reasoning: "Prediction parsing failed — manual review recommended",
        riskFactors: [],
        catalysts: [],
        timeHorizon: "2-3 days",
        historicalComparison: "Unavailable",
      };
    }
  }

  static async logPrediction(
    eventId: number,
    sessionId: number,
    prediction: MarketImpactPrediction,
    inputSentiment: number,
    inputTopics: string[]
  ) {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      INSERT INTO market_impact_predictions (event_id, session_id, predicted_volatility, direction, confidence, reasoning, risk_factors, catalysts, time_horizon, historical_comparison, input_sentiment, input_topics, created_at)
      VALUES (${eventId}, ${sessionId}, ${prediction.predictedVolatility}, ${prediction.direction}, ${prediction.confidence}, ${prediction.reasoning}, ${JSON.stringify(prediction.riskFactors)}, ${JSON.stringify(prediction.catalysts)}, ${prediction.timeHorizon}, ${prediction.historicalComparison}, ${inputSentiment}, ${JSON.stringify(inputTopics)}, NOW())
    `);
  }

  static async getEventPredictions(eventId: number) {
    const db = await getDb();
    if (!db) return [];
    const [rows] = await db.execute(sql`
      SELECT * FROM market_impact_predictions WHERE event_id = ${eventId} ORDER BY created_at DESC
    `);
    return rows;
  }

  static async getLatestPrediction(eventId: number) {
    const db = await getDb();
    if (!db) return null;
    const [rows] = await db.execute(sql`
      SELECT * FROM market_impact_predictions WHERE event_id = ${eventId} ORDER BY created_at DESC LIMIT 1
    `);
    return (rows as any)?.[0] || null;
  }
}
