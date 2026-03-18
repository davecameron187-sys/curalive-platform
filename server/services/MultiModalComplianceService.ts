// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export interface ComplianceRiskScore {
  overallRisk: number;
  textRisk: number;
  toneRisk: number;
  behavioralRisk: number;
  regulatoryFlags: string[];
  violations: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    regulation: string;
    evidence: string;
  }>;
  recommendations: string[];
  selectiveDisclosureRisk: number;
  insiderTradingIndicators: string[];
}

export class MultiModalComplianceService {
  static async scoreComplianceRisk(params: {
    transcriptText: string;
    sentimentData?: {
      overallSentiment: string;
      confidence: number;
      emotionDistribution: Record<string, number>;
    };
    evasivenessScore?: number;
    speakerRole?: string;
    eventType?: string;
    companyTicker?: string;
    jurisdiction?: string;
  }): Promise<ComplianceRiskScore> {
    const jurisdiction = params.jurisdiction || "multi";
    const regulatoryFramework = jurisdiction === "za" ? "JSE Listing Requirements, Companies Act 71 of 2008, King IV" :
      jurisdiction === "us" ? "SEC Regulation FD, SOX, Exchange Act Rule 10b-5" :
      jurisdiction === "uk" ? "FCA MAR, UK Corporate Governance Code, Companies Act 2006" :
      "SEC Reg FD, JSE Listing Requirements, FCA MAR, EU MAR (cross-jurisdictional)";

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert securities compliance analyst with deep knowledge of ${regulatoryFramework}. You perform multi-modal analysis combining transcript text, sentiment signals, and behavioral indicators to detect compliance violations and selective disclosure risks in investor communications.`,
        },
        {
          role: "user",
          content: `Perform comprehensive multi-modal compliance risk analysis:

TRANSCRIPT EXCERPT:
${params.transcriptText.substring(0, 3000)}

SENTIMENT DATA: ${params.sentimentData ? JSON.stringify(params.sentimentData) : "Not available"}
EVASIVENESS SCORE: ${params.evasivenessScore !== undefined ? params.evasivenessScore : "Not measured"}
SPEAKER ROLE: ${params.speakerRole || "Executive"}
EVENT TYPE: ${params.eventType || "Earnings call"}
COMPANY: ${params.companyTicker || "Not specified"}
REGULATORY FRAMEWORK: ${regulatoryFramework}

Multi-modal analysis dimensions:
1. TEXT ANALYSIS: Forward-looking statements without safe harbor, material non-public information (MNPI), misleading guidance
2. TONE ANALYSIS: Mismatch between stated confidence and emotional signals, stress indicators during sensitive topics
3. BEHAVIORAL: Evasion patterns during material questions, selective information sharing with specific analysts
4. CROSS-MODAL: Text says "strong quarter" but tone indicates uncertainty → elevated risk

Score each dimension 0.0-1.0 (higher = more risky):

Output JSON only:
{
  "overallRisk": number (0.0-1.0),
  "textRisk": number (0.0-1.0),
  "toneRisk": number (0.0-1.0),
  "behavioralRisk": number (0.0-1.0),
  "regulatoryFlags": ["specific flags"],
  "violations": [
    {
      "type": "selective_disclosure" | "forward_looking_unqualified" | "misleading_statement" | "insider_trading_indicator" | "market_manipulation" | "governance_breach",
      "severity": "low" | "medium" | "high" | "critical",
      "description": "what was detected",
      "regulation": "specific regulation violated",
      "evidence": "quote or evidence from transcript"
    }
  ],
  "recommendations": ["actionable compliance recommendations"],
  "selectiveDisclosureRisk": number (0.0-1.0),
  "insiderTradingIndicators": ["specific behavioral patterns that warrant further investigation"]
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices?.[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        overallRisk: Math.min(1, Math.max(0, parsed.overallRisk ?? 0.3)),
        textRisk: Math.min(1, Math.max(0, parsed.textRisk ?? 0.3)),
        toneRisk: Math.min(1, Math.max(0, parsed.toneRisk ?? 0.3)),
        behavioralRisk: Math.min(1, Math.max(0, parsed.behavioralRisk ?? 0.3)),
        regulatoryFlags: Array.isArray(parsed.regulatoryFlags) ? parsed.regulatoryFlags : [],
        violations: Array.isArray(parsed.violations) ? parsed.violations : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        selectiveDisclosureRisk: Math.min(1, Math.max(0, parsed.selectiveDisclosureRisk ?? 0.2)),
        insiderTradingIndicators: Array.isArray(parsed.insiderTradingIndicators) ? parsed.insiderTradingIndicators : [],
      };
    } catch {
      return {
        overallRisk: 0.3,
        textRisk: 0.3,
        toneRisk: 0.3,
        behavioralRisk: 0.3,
        regulatoryFlags: [],
        violations: [],
        recommendations: ["Manual compliance review recommended — automated analysis unavailable"],
        selectiveDisclosureRisk: 0.2,
        insiderTradingIndicators: [],
      };
    }
  }

  static async logComplianceScore(
    eventId: number,
    sessionId: number,
    scoreData: ComplianceRiskScore
  ) {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      INSERT INTO compliance_risk_scores (event_id, session_id, overall_risk, text_risk, tone_risk, behavioral_risk, selective_disclosure_risk, regulatory_flags, violations, recommendations, insider_trading_indicators, created_at)
      VALUES (${eventId}, ${sessionId}, ${scoreData.overallRisk}, ${scoreData.textRisk}, ${scoreData.toneRisk}, ${scoreData.behavioralRisk}, ${scoreData.selectiveDisclosureRisk}, ${JSON.stringify(scoreData.regulatoryFlags)}, ${JSON.stringify(scoreData.violations)}, ${JSON.stringify(scoreData.recommendations)}, ${JSON.stringify(scoreData.insiderTradingIndicators)}, NOW())
    `);
  }

  static async getEventComplianceScores(eventId: number) {
    const db = await getDb();
    if (!db) return [];
    const [rows] = await db.execute(sql`
      SELECT * FROM compliance_risk_scores WHERE event_id = ${eventId} ORDER BY created_at DESC
    `);
    return rows;
  }
}
