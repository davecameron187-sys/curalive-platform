// @ts-nocheck
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export interface PersonalizedBriefing {
  title: string;
  executiveSummary: string;
  keyFindings: Array<{
    category: string;
    finding: string;
    importance: "critical" | "high" | "medium" | "low";
    actionRequired: boolean;
  }>;
  sentimentOverview: {
    overall: string;
    trendDirection: "improving" | "declining" | "stable";
    keyDrivers: string[];
  };
  riskAlerts: Array<{
    risk: string;
    severity: "critical" | "high" | "medium" | "low";
    mitigation: string;
  }>;
  competitiveInsights: string[];
  actionItems: Array<{
    action: string;
    owner: string;
    priority: "urgent" | "high" | "medium" | "low";
    deadline: string;
  }>;
  stakeholderImpact: string;
  regulatoryConsiderations: string[];
  appendix: {
    dataSourcesSummary: string;
    confidenceLevel: number;
    generatedAt: string;
  };
}

export class PersonalizedBriefingService {
  static async generateBriefing(params: {
    stakeholderType: "ceo" | "cfo" | "ir_head" | "board_member" | "analyst" | "compliance_officer" | "investor";
    companyName: string;
    eventName: string;
    eventType: string;
    transcriptExcerpt: string;
    sentimentScore?: number;
    evasivenessData?: { avgScore: number; highEvasionCount: number };
    marketImpactData?: { volatility: number; direction: string };
    complianceData?: { overallRisk: number; violationCount: number };
    previousBriefings?: string;
  }): Promise<PersonalizedBriefing> {
    const stakeholderFocus: Record<string, string> = {
      ceo: "Strategic implications, shareholder perception, competitive positioning, board-ready talking points",
      cfo: "Financial metrics accuracy, guidance adherence, analyst expectations vs delivery, risk exposure quantification",
      ir_head: "Investor sentiment shifts, analyst reactions, disclosure compliance, follow-up communication strategy",
      board_member: "Governance implications, fiduciary risk, management credibility assessment, strategic oversight items",
      analyst: "Financial model implications, guidance changes, competitive dynamics, sector-level insights",
      compliance_officer: "Regulatory violations, selective disclosure risks, record-keeping requirements, remediation priorities",
      investor: "Investment thesis validation, management quality signals, risk-adjusted return implications",
    };

    const focus = stakeholderFocus[params.stakeholderType] || stakeholderFocus.ir_head;

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a senior investor relations intelligence analyst producing hyper-personalized event briefings. Each briefing is tailored to the specific stakeholder's role, decision-making needs, and information priorities. Your output is board-room quality — precise, evidence-based, and actionable.`,
        },
        {
          role: "user",
          content: `Generate a personalized post-event intelligence briefing:

STAKEHOLDER TYPE: ${params.stakeholderType.replace("_", " ").toUpperCase()}
FOCUS AREAS: ${focus}
COMPANY: ${params.companyName}
EVENT: ${params.eventName} (${params.eventType})

EVENT DATA:
- Transcript excerpt: ${params.transcriptExcerpt.substring(0, 3000)}
- Overall sentiment: ${params.sentimentScore !== undefined ? params.sentimentScore : "Not measured"}
- Evasiveness: ${params.evasivenessData ? `Avg score: ${params.evasivenessData.avgScore}, High-evasion answers: ${params.evasivenessData.highEvasionCount}` : "Not measured"}
- Market impact prediction: ${params.marketImpactData ? `Volatility: ${params.marketImpactData.volatility}/10, Direction: ${params.marketImpactData.direction}` : "Not available"}
- Compliance risk: ${params.complianceData ? `Overall: ${params.complianceData.overallRisk}, Violations: ${params.complianceData.violationCount}` : "Not assessed"}

PREVIOUS BRIEFINGS CONTEXT: ${params.previousBriefings?.substring(0, 500) || "None — first briefing for this stakeholder"}

Generate a comprehensive, stakeholder-personalized briefing. Be specific to the data provided — do not produce generic templates.

Output JSON only:
{
  "title": "briefing title",
  "executiveSummary": "3-4 sentence executive summary tailored to stakeholder",
  "keyFindings": [{ "category": "string", "finding": "string", "importance": "critical|high|medium|low", "actionRequired": boolean }],
  "sentimentOverview": { "overall": "string", "trendDirection": "improving|declining|stable", "keyDrivers": ["string"] },
  "riskAlerts": [{ "risk": "string", "severity": "critical|high|medium|low", "mitigation": "string" }],
  "competitiveInsights": ["string"],
  "actionItems": [{ "action": "string", "owner": "string", "priority": "urgent|high|medium|low", "deadline": "string" }],
  "stakeholderImpact": "how this event specifically impacts this stakeholder's responsibilities",
  "regulatoryConsiderations": ["string"],
  "appendix": { "dataSourcesSummary": "string", "confidenceLevel": number (0-1), "generatedAt": "${new Date().toISOString()}" }
}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices?.[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `${params.eventName} — Intelligence Briefing`,
        executiveSummary: parsed.executiveSummary || "Briefing generation incomplete",
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        sentimentOverview: parsed.sentimentOverview || { overall: "Unavailable", trendDirection: "stable", keyDrivers: [] },
        riskAlerts: Array.isArray(parsed.riskAlerts) ? parsed.riskAlerts : [],
        competitiveInsights: Array.isArray(parsed.competitiveInsights) ? parsed.competitiveInsights : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        stakeholderImpact: parsed.stakeholderImpact || "Impact assessment unavailable",
        regulatoryConsiderations: Array.isArray(parsed.regulatoryConsiderations) ? parsed.regulatoryConsiderations : [],
        appendix: {
          dataSourcesSummary: parsed.appendix?.dataSourcesSummary || "CuraLive Intelligence Suite",
          confidenceLevel: parsed.appendix?.confidenceLevel ?? 0.7,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch {
      return {
        title: `${params.eventName} — Intelligence Briefing`,
        executiveSummary: "Automated briefing generation encountered an error. Manual review recommended.",
        keyFindings: [],
        sentimentOverview: { overall: "Unavailable", trendDirection: "stable", keyDrivers: [] },
        riskAlerts: [],
        competitiveInsights: [],
        actionItems: [{ action: "Review event transcript manually", owner: params.stakeholderType, priority: "high", deadline: "Today" }],
        stakeholderImpact: "Unable to assess — manual review required",
        regulatoryConsiderations: [],
        appendix: { dataSourcesSummary: "CuraLive", confidenceLevel: 0.1, generatedAt: new Date().toISOString() },
      };
    }
  }

  static async logBriefing(
    eventId: number,
    sessionId: number,
    stakeholderType: string,
    briefing: PersonalizedBriefing
  ) {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
      INSERT INTO ir_briefings (event_id, session_id, stakeholder_type, title, executive_summary, briefing_data, confidence_level, created_at)
      VALUES (${eventId}, ${sessionId}, ${stakeholderType}, ${briefing.title}, ${briefing.executiveSummary}, ${JSON.stringify(briefing)}, ${briefing.appendix.confidenceLevel}, NOW())
    `);
  }

  static async getEventBriefings(eventId: number, stakeholderType?: string) {
    const db = await getDb();
    if (!db) return [];
    if (stakeholderType) {
      const [rows] = await db.execute(sql`
        SELECT * FROM ir_briefings WHERE event_id = ${eventId} AND stakeholder_type = ${stakeholderType} ORDER BY created_at DESC
      `);
      return rows;
    }
    const [rows] = await db.execute(sql`
      SELECT * FROM ir_briefings WHERE event_id = ${eventId} ORDER BY created_at DESC
    `);
    return rows;
  }
}
