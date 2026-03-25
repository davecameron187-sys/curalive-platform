// @ts-nocheck
import { z } from "zod";
import { createHash } from "crypto";
import { router, publicProcedure } from "../_core/trpc";
import {getDb, rawSql } from "../db";
import { taggedMetrics } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { desc, sql } from "drizzle-orm";
import { writeAnonymizedRecord } from "../lib/aggregateIntelligence";

function computeTranscriptFingerprint(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

export type AiReport = {
  executiveSummary: string;
  sentimentAnalysis: { score: number; narrative: string; keyDrivers: string[] };
  complianceReview: { riskLevel: string; flaggedPhrases: string[]; recommendations: string[] };
  keyTopics: { topic: string; sentiment: string; detail: string }[];
  speakerAnalysis: { speaker: string; role: string; keyPoints: string[] }[];
  questionsAsked: { question: string; askedBy: string; quality: string }[];
  actionItems: { item: string; owner: string; deadline: string }[];
  investorSignals: { signal: string; interpretation: string; severity: string }[];
  communicationScore: { score: number; clarity: number; transparency: number; narrative: string };
  riskFactors: { factor: string; impact: string; likelihood: string }[];
  competitiveIntelligence: { mention: string; context: string }[];
  recommendations: string[];
  speakingPaceAnalysis: { overallWpm: number; paceLabel: string; fillerWords: { word: string; count: number }[]; deliveryScore: number; coachingTips: string[] };
  toxicityScreen: { overallRisk: string; flaggedContent: { phrase: string; issue: string; severity: string }[]; priceSensitive: boolean; legalRisk: boolean };
  sentimentArc: { opening: number; midpoint: number; closing: number; trend: string; narrative: string };
  financialHighlights: { metric: string; value: string; context: string; yoyChange: string }[];
  esgMentions: { topic: string; commitment: string; sentiment: string }[];
  pressReleaseDraft: string;
  socialMediaContent: { platform: string; content: string }[];
  boardReadySummary: { verdict: string; keyRisks: string[]; keyOpportunities: string[]; recommendedActions: string[] };
  modulesGenerated: number;
};

export async function generateFullAiReport(
  transcriptText: string,
  clientName: string,
  eventName: string,
  eventType: string,
  sentimentAvg: number,
  complianceFlags: number,
  selectedModules?: string[]
): Promise<AiReport> {
  const CHUNK_SIZE = 12000;
  const needsChunking = transcriptText.length > CHUNK_SIZE * 1.3;

  const reportSchema = `{
  "executiveSummary": "3-5 sentence executive summary of the event",
  "sentimentAnalysis": { "score": <0-100>, "narrative": "detailed sentiment narrative", "keyDrivers": ["driver1", "driver2"] },
  "complianceReview": { "riskLevel": "Low|Moderate|High|Critical", "flaggedPhrases": ["phrase1"], "recommendations": ["rec1"] },
  "keyTopics": [{ "topic": "name", "sentiment": "Positive|Neutral|Negative", "detail": "explanation" }],
  "speakerAnalysis": [{ "speaker": "Name", "role": "CEO/CFO/Analyst/etc", "keyPoints": ["point1"] }],
  "questionsAsked": [{ "question": "the question", "askedBy": "who asked", "quality": "Insightful|Routine|Challenging" }],
  "actionItems": [{ "item": "what needs to happen", "owner": "who", "deadline": "when if mentioned" }],
  "investorSignals": [{ "signal": "what was signaled", "interpretation": "what it means", "severity": "Positive|Neutral|Concerning|Critical" }],
  "communicationScore": { "score": <0-100>, "clarity": <0-100>, "transparency": <0-100>, "narrative": "assessment of communication quality" },
  "riskFactors": [{ "factor": "risk name", "impact": "High|Medium|Low", "likelihood": "High|Medium|Low" }],
  "competitiveIntelligence": [{ "mention": "competitor or market ref", "context": "how it was discussed" }],
  "recommendations": ["actionable recommendation 1", "recommendation 2"],
  "speakingPaceAnalysis": { "overallWpm": <number>, "paceLabel": "Slow|Normal|Fast|Rushed", "fillerWords": [{ "word": "um", "count": <n> }], "deliveryScore": <0-100>, "coachingTips": ["tip1"] },
  "toxicityScreen": { "overallRisk": "Clean|Low|Moderate|High", "flaggedContent": [{ "phrase": "exact phrase", "issue": "why flagged", "severity": "Low|Medium|High" }], "priceSensitive": <bool>, "legalRisk": <bool> },
  "sentimentArc": { "opening": <0-100>, "midpoint": <0-100>, "closing": <0-100>, "trend": "Improving|Stable|Declining|Volatile", "narrative": "how sentiment evolved" },
  "financialHighlights": [{ "metric": "Revenue/EBITDA/EPS/etc", "value": "R2.3bn", "context": "explanation", "yoyChange": "+12% YoY" }],
  "esgMentions": [{ "topic": "carbon/diversity/governance/etc", "commitment": "what was committed", "sentiment": "Positive|Neutral|Negative" }],
  "pressReleaseDraft": "A 2-3 paragraph SENS/RNS-style press release summarising the key outcomes",
  "socialMediaContent": [{ "platform": "LinkedIn|Twitter|General", "content": "ready-to-post content" }],
  "boardReadySummary": { "verdict": "Strong|Satisfactory|Concerning|Critical", "keyRisks": ["risk1"], "keyOpportunities": ["opp1"], "recommendedActions": ["action1"] }
}`;

  let analysisInput: string;

  if (needsChunking) {
    const chunks: string[] = [];
    for (let i = 0; i < transcriptText.length; i += CHUNK_SIZE) {
      chunks.push(transcriptText.slice(i, i + CHUNK_SIZE));
    }

    console.log(`[ArchiveAI] Long transcript (${transcriptText.length} chars) — summarizing ${chunks.length} chunks`);

    const chunkSummaries = await Promise.all(
      chunks.map(async (chunk, idx) => {
        try {
          const resp = await invokeLLM({
            messages: [
              { role: "system", content: "You are a transcript analyst. Produce a dense, factual summary of this transcript section. Include all speaker names, financial figures, key statements, compliance-relevant phrases, questions asked, and sentiment indicators. Do not omit details — be comprehensive." },
              { role: "user", content: `Summarize section ${idx + 1} of ${chunks.length}:\n\n${chunk}` },
            ],
            model: "gpt-4o-mini",
          });
          return resp.choices?.[0]?.message?.content?.trim() ?? "";
        } catch (err) {
          console.error(`[ArchiveAI] Chunk ${idx + 1} summary failed:`, err);
          return chunk.slice(0, 2000);
        }
      })
    );

    analysisInput = `[Combined analysis from ${chunks.length} transcript sections — total ${transcriptText.length} characters]\n\n` +
      chunkSummaries.map((s, i) => `=== Section ${i + 1} ===\n${s}`).join("\n\n");
  } else {
    analysisInput = transcriptText;
  }

  const ALL_MODULE_KEYS = [
    "executiveSummary", "sentimentAnalysis", "complianceReview", "keyTopics",
    "speakerAnalysis", "questionsAsked", "actionItems", "investorSignals",
    "communicationScore", "riskFactors", "competitiveIntelligence", "recommendations",
    "speakingPaceAnalysis", "toxicityScreen", "sentimentArc", "financialHighlights",
    "esgMentions", "pressReleaseDraft", "socialMediaContent", "boardReadySummary",
  ];

  const activeModules = selectedModules && selectedModules.length > 0
    ? ALL_MODULE_KEYS.filter(k => selectedModules.includes(k))
    : ALL_MODULE_KEYS;

  const moduleSelectionNote = selectedModules && selectedModules.length > 0 && selectedModules.length < ALL_MODULE_KEYS.length
    ? `\nIMPORTANT: The user has selected only these modules: ${activeModules.join(", ")}. For modules NOT in this list, return minimal placeholder values (empty strings, empty arrays, or 0). Focus your analysis depth on the selected modules.`
    : "";

  const systemPrompt = `You are CuraLive's AI Intelligence Engine — an expert analyst for investor events.
Analyze the transcript and produce a comprehensive JSON report with ALL 20 analysis modules. Be specific and cite actual content from the transcript. Every module must be populated with real analysis — never return empty arrays if there is relevant content.
The event is: "${eventName}" by "${clientName}" (type: ${eventType}).
Pre-computed sentiment: ${sentimentAvg}/100, compliance flags: ${complianceFlags}.${moduleSelectionNote}

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
${reportSchema}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this transcript:\n\n${analysisInput}` },
      ],
      model: "gpt-4o",
    });

    const raw = (response.choices?.[0]?.message?.content ?? "").trim();
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned) as AiReport;
    parsed.modulesGenerated = activeModules.length;
    return parsed;
  } catch (err) {
    console.error("[ArchiveAI] Report generation failed:", err);
    throw new Error(`AI report generation failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

const COMPLIANCE_KEYWORDS = [
  "forward-looking", "guidance", "forecast", "predict", "expect",
  "material", "non-public", "insider", "merger", "acquisition",
];

async function scoreSentimentFromText(text: string): Promise<number> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a financial sentiment analyst. Score investor sentiment from 0 to 100 where 0 is very negative, 50 is neutral, and 100 is very positive. Respond with a single integer only.",
        },
        {
          role: "user",
          content: `Score the investor sentiment in this transcript excerpt (0-100):\n\n${text.slice(0, 3000)}`,
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content as string | undefined;
    const score = parseInt(content?.trim() ?? "50", 10);
    return isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
  } catch {
    return 50;
  }
}

async function generateMetricsFromArchive(
  archiveId: number,
  clientName: string,
  eventName: string,
  eventType: string,
  segments: string[],
  sentimentAvg: number,
  complianceFlags: number
) {
  const db = await getDb();

  const eventId = `archive-${archiveId}`;
  const eventTitle = `${clientName} — ${eventName}`;
  const bundle =
    eventType === "earnings_call" || eventType === "capital_markets_day"
      ? "Investor Relations"
      : eventType === "agm" || eventType === "board_meeting"
      ? "Compliance & Risk"
      : "Webcasting";

  const metricsToInsert = [];

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "sentiment" as const,
    metricValue: sentimentAvg,
    label:
      sentimentAvg >= 70
        ? "Positive Sentiment Session"
        : sentimentAvg >= 50
        ? "Neutral Sentiment Session"
        : "Low Sentiment Session",
    detail: `AI-scored sentiment from archived transcript: ${segments.length} segments analysed.`,
    bundle,
    severity:
      sentimentAvg >= 70
        ? ("positive" as const)
        : sentimentAvg >= 50
        ? ("neutral" as const)
        : ("negative" as const),
    source: "archive-upload",
  });

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "engagement" as const,
    metricValue: segments.length,
    label: `${segments.length} Archive Segments Processed`,
    detail: `${segments.length} transcript segments extracted and analysed from uploaded archive. Historical intelligence added to database.`,
    bundle,
    severity:
      segments.length > 20
        ? ("positive" as const)
        : segments.length > 5
        ? ("neutral" as const)
        : ("negative" as const),
    source: "archive-upload",
  });

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "compliance" as const,
    metricValue: parseFloat(
      (complianceFlags / COMPLIANCE_KEYWORDS.length).toFixed(2)
    ),
    label:
      complianceFlags > 2
        ? "Compliance Flags Detected"
        : "Low Compliance Risk",
    detail: `Automated scan found ${complianceFlags} compliance keyword(s) across archived transcript. Keywords: ${COMPLIANCE_KEYWORDS.join(", ")}.`,
    bundle,
    severity:
      complianceFlags > 3
        ? ("critical" as const)
        : complianceFlags > 1
        ? ("negative" as const)
        : ("positive" as const),
    source: "archive-upload",
  });

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "intervention" as const,
    metricValue: 0,
    label: "Archive Upload Processed",
    detail: `Historical event intelligence successfully added. ${metricsToInsert.length + 1} tagged records created from archive data.`,
    bundle,
    severity: "positive" as const,
    source: "archive-upload",
  });

  await db.insert(taggedMetrics).values(metricsToInsert);
  return { eventId, eventTitle, metricsCount: metricsToInsert.length };
}

function buildArchiveReportEmail(opts: {
  recipientName: string;
  clientName: string;
  eventName: string;
  eventType: string;
  eventDate: string | null;
  wordCount: number;
  segmentCount: number;
  sentimentAvg: number | null;
  complianceFlags: number;
  metricsGenerated: number;
  notes: string | null;
  aiReport: AiReport | null;
}): string {
  const sentimentColor = (opts.sentimentAvg ?? 50) >= 70 ? "#10b981" : (opts.sentimentAvg ?? 50) >= 50 ? "#f59e0b" : "#ef4444";
  const sentimentLabel = (opts.sentimentAvg ?? 50) >= 70 ? "Positive" : (opts.sentimentAvg ?? 50) >= 50 ? "Neutral" : "Negative";
  const complianceColor = opts.complianceFlags > 3 ? "#ef4444" : opts.complianceFlags > 1 ? "#f59e0b" : "#10b981";
  const complianceLabel = opts.complianceFlags > 3 ? "High Risk" : opts.complianceFlags > 1 ? "Moderate" : "Low Risk";
  const eventTypeLabels: Record<string, string> = {
    earnings_call: "Earnings Call", agm: "AGM", capital_markets_day: "Capital Markets Day",
    ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast", other: "Other",
  };
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sevColor = (s: string) => s === "Low" || s === "Positive" ? "#10b981" : s === "High" || s === "Critical" || s === "Negative" ? "#ef4444" : "#f59e0b";

  const sectionHeader = (title: string, color: string) =>
    `<tr><td style="padding:28px 40px 12px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="border-bottom:2px solid ${color};padding-bottom:8px;">
          <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${color};">${title}</p>
        </td>
      </tr></table>
    </td></tr>`;

  const textBlock = (content: string) =>
    `<tr><td style="padding:4px 40px 16px;"><p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.7;">${esc(content)}</p></td></tr>`;

  const bulletList = (items: string[]) => items.length === 0 ? "" :
    `<tr><td style="padding:4px 40px 16px;"><table cellpadding="0" cellspacing="0" width="100%">${
      items.map(item => `<tr><td style="padding:3px 0;font-size:14px;color:#cbd5e1;line-height:1.6;vertical-align:top;">
        <span style="color:#60a5fa;margin-right:8px;">&#8226;</span>${esc(item)}</td></tr>`).join("")
    }</table></td></tr>`;

  const r = opts.aiReport;

  let reportSections = "";

  if (r) {
    if (r.executiveSummary) {
      reportSections += sectionHeader("Executive Summary", "#a78bfa");
      reportSections += textBlock(r.executiveSummary);
    }

    if (r.sentimentAnalysis) {
      reportSections += sectionHeader("Sentiment Analysis", "#10b981");
      reportSections += `<tr><td style="padding:4px 40px 8px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:#0f172a;border-radius:6px;padding:8px 16px;border:1px solid #1e293b;">
            <span style="font-size:24px;font-weight:800;color:${sentimentColor};">${r.sentimentAnalysis.score}</span>
            <span style="font-size:13px;color:#64748b;">/100 · ${sentimentLabel}</span>
          </td>
        </tr></table>
      </td></tr>`;
      reportSections += textBlock(r.sentimentAnalysis.narrative);
      if (r.sentimentAnalysis.keyDrivers?.length > 0) {
        reportSections += `<tr><td style="padding:0 40px 4px;"><p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Key Drivers</p></td></tr>`;
        reportSections += bulletList(r.sentimentAnalysis.keyDrivers);
      }
    }

    if (r.complianceReview) {
      reportSections += sectionHeader("Compliance Review", "#f59e0b");
      reportSections += `<tr><td style="padding:4px 40px 12px;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:${sevColor(r.complianceReview.riskLevel)}15;border-radius:6px;padding:6px 14px;border:1px solid ${sevColor(r.complianceReview.riskLevel)}40;">
            <span style="font-size:13px;font-weight:700;color:${sevColor(r.complianceReview.riskLevel)};">Risk Level: ${esc(r.complianceReview.riskLevel)}</span>
          </td>
        </tr></table>
      </td></tr>`;
      if (r.complianceReview.flaggedPhrases?.length > 0) {
        reportSections += `<tr><td style="padding:0 40px 4px;"><p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Flagged Phrases (${r.complianceReview.flaggedPhrases.length})</p></td></tr>`;
        reportSections += bulletList(r.complianceReview.flaggedPhrases);
      }
      if (r.complianceReview.recommendations?.length > 0) {
        reportSections += `<tr><td style="padding:0 40px 4px;"><p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Recommendations</p></td></tr>`;
        reportSections += bulletList(r.complianceReview.recommendations);
      }
    }

    if (r.keyTopics?.length > 0) {
      reportSections += sectionHeader("Key Topics", "#60a5fa");
      reportSections += `<tr><td style="padding:4px 40px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
        <tr style="background:#0f172a;"><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Topic</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Sentiment</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Detail</td></tr>
        ${r.keyTopics.map(t => `<tr><td style="padding:10px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid #1e293b15;font-weight:600;">${esc(t.topic)}</td><td style="padding:10px 14px;font-size:13px;color:${sevColor(t.sentiment)};">${esc(t.sentiment)}</td><td style="padding:10px 14px;font-size:13px;color:#94a3b8;line-height:1.5;">${esc(t.detail)}</td></tr>`).join("")}
      </table></td></tr>`;
    }

    if (r.speakerAnalysis?.length > 0) {
      reportSections += sectionHeader("Speaker Analysis", "#8b5cf6");
      for (const s of r.speakerAnalysis) {
        reportSections += `<tr><td style="padding:4px 40px 4px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#e2e8f0;">${esc(s.speaker)} <span style="font-weight:400;color:#64748b;font-size:12px;">· ${esc(s.role)}</span></p>
        </td></tr>`;
        reportSections += bulletList(s.keyPoints);
      }
    }

    if (r.investorSignals?.length > 0) {
      reportSections += sectionHeader("Investor Signals", "#f97316");
      reportSections += `<tr><td style="padding:4px 40px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
        <tr style="background:#0f172a;"><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Signal</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Interpretation</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Severity</td></tr>
        ${r.investorSignals.map(s => `<tr><td style="padding:10px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid #1e293b15;font-weight:600;">${esc(s.signal)}</td><td style="padding:10px 14px;font-size:13px;color:#94a3b8;line-height:1.5;">${esc(s.interpretation)}</td><td style="padding:10px 14px;font-size:13px;color:${sevColor(s.severity)};font-weight:600;">${esc(s.severity)}</td></tr>`).join("")}
      </table></td></tr>`;
    }

    if (r.questionsAsked?.length > 0) {
      reportSections += sectionHeader("Q&A Breakdown", "#06b6d4");
      for (const q of r.questionsAsked) {
        reportSections += `<tr><td style="padding:4px 40px 8px;">
          <table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:14px;color:#e2e8f0;font-weight:600;">${esc(q.question)}</p>
            <p style="margin:0;font-size:12px;color:#64748b;">Asked by: ${esc(q.askedBy)} · Quality: <span style="color:${sevColor(q.quality)};font-weight:600;">${esc(q.quality)}</span></p>
          </td></tr></table>
        </td></tr>`;
      }
    }

    if (r.actionItems?.length > 0) {
      reportSections += sectionHeader("Action Items", "#ec4899");
      reportSections += `<tr><td style="padding:4px 40px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
        <tr style="background:#0f172a;"><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Action Item</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Owner</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Deadline</td></tr>
        ${r.actionItems.map(a => `<tr><td style="padding:10px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid #1e293b15;">${esc(a.item)}</td><td style="padding:10px 14px;font-size:13px;color:#94a3b8;">${esc(a.owner)}</td><td style="padding:10px 14px;font-size:13px;color:#94a3b8;">${esc(a.deadline)}</td></tr>`).join("")}
      </table></td></tr>`;
    }

    if (r.communicationScore) {
      reportSections += sectionHeader("Communication Score", "#14b8a6");
      const cs = r.communicationScore;
      const csColor = cs.score >= 70 ? "#10b981" : cs.score >= 50 ? "#f59e0b" : "#ef4444";
      reportSections += `<tr><td style="padding:4px 40px 8px;">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="33%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;">Overall</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:${csColor};">${cs.score}<span style="font-size:12px;color:#64748b;">/100</span></p>
          </td></tr></table></td>
          <td width="33%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;">Clarity</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#60a5fa;">${cs.clarity}<span style="font-size:12px;color:#64748b;">/100</span></p>
          </td></tr></table></td>
          <td width="33%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;">Transparency</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#60a5fa;">${cs.transparency}<span style="font-size:12px;color:#64748b;">/100</span></p>
          </td></tr></table></td>
        </tr></table>
      </td></tr>`;
      reportSections += textBlock(cs.narrative);
    }

    if (r.riskFactors?.length > 0) {
      reportSections += sectionHeader("Risk Factors", "#ef4444");
      reportSections += `<tr><td style="padding:4px 40px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
        <tr style="background:#0f172a;"><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Factor</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Impact</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Likelihood</td></tr>
        ${r.riskFactors.map(f => `<tr><td style="padding:10px 14px;font-size:13px;color:#e2e8f0;border-bottom:1px solid #1e293b15;">${esc(f.factor)}</td><td style="padding:10px 14px;font-size:13px;color:${sevColor(f.impact)};font-weight:600;">${esc(f.impact)}</td><td style="padding:10px 14px;font-size:13px;color:#94a3b8;">${esc(f.likelihood)}</td></tr>`).join("")}
      </table></td></tr>`;
    }

    if (r.financialHighlights?.length > 0) {
      reportSections += sectionHeader("Financial Highlights", "#eab308");
      reportSections += `<tr><td style="padding:4px 40px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
        <tr style="background:#0f172a;"><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Metric</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Value</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">YoY Change</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Context</td></tr>
        ${r.financialHighlights.map(f => `<tr><td style="padding:10px 14px;font-size:13px;color:#e2e8f0;font-weight:600;border-bottom:1px solid #1e293b15;">${esc(f.metric)}</td><td style="padding:10px 14px;font-size:13px;color:#e2e8f0;">${esc(f.value)}</td><td style="padding:10px 14px;font-size:13px;color:#60a5fa;font-weight:600;">${esc(f.yoyChange)}</td><td style="padding:10px 14px;font-size:13px;color:#94a3b8;">${esc(f.context)}</td></tr>`).join("")}
      </table></td></tr>`;
    }

    if (r.sentimentArc) {
      reportSections += sectionHeader("Sentiment Arc", "#22d3ee");
      const arc = r.sentimentArc;
      reportSections += `<tr><td style="padding:4px 40px 8px;">
        <table cellpadding="0" cellspacing="0" width="100%"><tr>
          <td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;">Opening</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#22d3ee;">${arc.opening}</p>
          </td></tr></table></td>
          <td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;">Midpoint</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#22d3ee;">${arc.midpoint}</p>
          </td></tr></table></td>
          <td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;">Closing</p>
            <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#22d3ee;">${arc.closing}</p>
          </td></tr></table></td>
          <td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:12px;text-align:center;">
            <p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;">Trend</p>
            <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#22d3ee;">${esc(arc.trend)}</p>
          </td></tr></table></td>
        </tr></table>
      </td></tr>`;
      reportSections += textBlock(arc.narrative);
    }

    if (r.esgMentions?.length > 0) {
      reportSections += sectionHeader("ESG & Sustainability", "#22c55e");
      reportSections += `<tr><td style="padding:4px 40px 16px;"><table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
        <tr style="background:#0f172a;"><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Topic</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Commitment</td><td style="padding:10px 14px;font-size:12px;font-weight:700;color:#94a3b8;border-bottom:1px solid #1e293b;">Sentiment</td></tr>
        ${r.esgMentions.map(e => `<tr><td style="padding:10px 14px;font-size:13px;color:#e2e8f0;font-weight:600;border-bottom:1px solid #1e293b15;">${esc(e.topic)}</td><td style="padding:10px 14px;font-size:13px;color:#94a3b8;">${esc(e.commitment)}</td><td style="padding:10px 14px;font-size:13px;color:${sevColor(e.sentiment)};">${esc(e.sentiment)}</td></tr>`).join("")}
      </table></td></tr>`;
    }

    if (r.competitiveIntelligence?.length > 0) {
      reportSections += sectionHeader("Competitive Intelligence", "#a855f7");
      for (const c of r.competitiveIntelligence) {
        reportSections += `<tr><td style="padding:4px 40px 8px;">
          <table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:14px 16px;">
            <p style="margin:0 0 4px;font-size:14px;color:#e2e8f0;font-weight:600;">${esc(c.mention)}</p>
            <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">${esc(c.context)}</p>
          </td></tr></table>
        </td></tr>`;
      }
    }

    if (r.boardReadySummary) {
      reportSections += sectionHeader("Board-Ready Summary", "#a78bfa");
      reportSections += `<tr><td style="padding:4px 40px 12px;">
        <table width="100%" style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:8px;border:1px solid #3730a3;"><tr><td style="padding:20px;">
          <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Verdict</p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#e2e8f0;line-height:1.5;">${esc(r.boardReadySummary.verdict)}</p>
        </td></tr></table>
      </td></tr>`;
      if (r.boardReadySummary.keyRisks?.length > 0) {
        reportSections += `<tr><td style="padding:0 40px 4px;"><p style="margin:0;font-size:11px;color:#ef4444;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Key Risks</p></td></tr>`;
        reportSections += bulletList(r.boardReadySummary.keyRisks);
      }
      if (r.boardReadySummary.keyOpportunities?.length > 0) {
        reportSections += `<tr><td style="padding:0 40px 4px;"><p style="margin:0;font-size:11px;color:#10b981;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Key Opportunities</p></td></tr>`;
        reportSections += bulletList(r.boardReadySummary.keyOpportunities);
      }
      if (r.boardReadySummary.recommendedActions?.length > 0) {
        reportSections += `<tr><td style="padding:0 40px 4px;"><p style="margin:0;font-size:11px;color:#60a5fa;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Recommended Actions</p></td></tr>`;
        reportSections += bulletList(r.boardReadySummary.recommendedActions);
      }
    }

    if (r.recommendations?.length > 0) {
      reportSections += sectionHeader("Strategic Recommendations", "#06b6d4");
      reportSections += bulletList(r.recommendations);
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0d14;padding:40px 20px;"><tr><td align="center">
<table width="640" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
<tr><td style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:32px 40px;">
<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#a78bfa;">CuraLive Post-Event Intelligence Report</p>
<h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">${esc(opts.eventName)}</h1>
<p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">${esc(opts.clientName)} · ${eventTypeLabels[opts.eventType] ?? opts.eventType}${opts.eventDate ? ` · ${opts.eventDate}` : ""}</p>
</td></tr>
<tr><td style="padding:24px 40px 8px;">
<p style="margin:0 0 16px;font-size:15px;color:#94a3b8;">Dear ${esc(opts.recipientName)},</p>
<p style="margin:0 0 20px;font-size:15px;color:#94a3b8;line-height:1.6;">Please find below the full AI-generated intelligence report from your event, covering ${r?.modulesGenerated ?? 0} analysis modules.</p>
</td></tr>
<tr><td style="padding:0 40px 20px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:14px;text-align:center;">
<p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Sentiment</p>
<p style="margin:4px 0 0;font-size:22px;font-weight:800;color:${sentimentColor};">${opts.sentimentAvg ?? "N/A"}<span style="font-size:11px;color:#64748b;">/100</span></p>
<p style="margin:2px 0 0;font-size:11px;color:${sentimentColor};font-weight:600;">${sentimentLabel}</p>
</td></tr></table></td>
<td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:14px;text-align:center;">
<p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Compliance</p>
<p style="margin:4px 0 0;font-size:22px;font-weight:800;color:${complianceColor};">${opts.complianceFlags}</p>
<p style="margin:2px 0 0;font-size:11px;color:${complianceColor};font-weight:600;">${complianceLabel}</p>
</td></tr></table></td>
<td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:14px;text-align:center;">
<p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Words</p>
<p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#60a5fa;">${opts.wordCount.toLocaleString()}</p>
</td></tr></table></td>
<td width="25%" style="padding:4px;"><table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:14px;text-align:center;">
<p style="margin:0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Segments</p>
<p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#60a5fa;">${opts.segmentCount}</p>
</td></tr></table></td>
</tr>
</table>
</td></tr>
${reportSections}
${!r ? `<tr><td style="padding:16px 40px;"><table width="100%" style="background:#0f172a;border-left:3px solid #f59e0b;border-radius:4px;"><tr><td style="padding:16px 20px;">
<p style="margin:0;font-size:14px;color:#f59e0b;font-weight:600;">AI Report Not Yet Generated</p>
<p style="margin:6px 0 0;font-size:13px;color:#94a3b8;line-height:1.5;">The full AI intelligence report has not been generated for this event yet. Generate the report in CuraLive and resend this email to include the complete analysis.</p>
</td></tr></table></td></tr>` : ""}
${opts.notes ? `<tr><td style="padding:12px 40px 20px;"><table width="100%" style="background:#0f172a;border-left:3px solid #3b82f6;border-radius:4px;"><tr><td style="padding:16px 20px;">
<p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Operator Notes</p>
<p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.6;">${esc(opts.notes)}</p>
</td></tr></table></td></tr>` : ""}
<tr><td style="background:#0f172a;padding:24px 40px;border-top:1px solid #1e293b;">
<p style="margin:0 0 4px;font-size:12px;color:#475569;text-align:center;">CuraLive Intelligence Platform · Automated Post-Event Report</p>
<p style="margin:0;font-size:11px;color:#334155;text-align:center;">This report was generated by AI and should be reviewed alongside primary source materials.</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

const BASTION_EVENT_TYPES = ["earnings_call", "interim_results", "annual_results", "results_call", "media_call", "analyst_call", "capital_markets_day", "investor_day", "roadshow", "special_call"];
const AGM_EVENT_TYPES = ["agm", "board_meeting"];
const WEBCAST_EVENT_TYPES = ["webcast", "partner_webcast", "product_launch_webcast", "thought_leadership_webcast", "results_webcast", "hybrid_webcast"];
const IPO_EVENT_TYPES = ["ipo_roadshow", "ipo_listing", "pre_ipo"];
const MANDA_EVENT_TYPES = ["manda_call", "takeover_announcement", "merger_announcement", "scheme_of_arrangement"];
const CREDIT_EVENT_TYPES = ["credit_rating_call", "bondholder_meeting", "debt_restructuring"];
const PROXY_EVENT_TYPES = ["proxy_contest", "activist_meeting", "extraordinary_general_meeting"];

function parseTranscriptToSegments(rawText: string): Array<{ speaker: string; text: string; timestamp: number }> {
  const lines = rawText.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  const segments: Array<{ speaker: string; text: string; timestamp: number }> = [];
  const speakerPattern = /^([A-Z][A-Za-z\s.'-]{1,50})\s*[:–—]\s*(.+)/;
  let currentSpeaker = "Unknown";
  let currentText = "";
  let segIndex = 0;

  for (const line of lines) {
    const match = line.match(speakerPattern);
    if (match) {
      if (currentText.length > 10) {
        segments.push({ speaker: currentSpeaker, text: currentText.trim(), timestamp: segIndex++ });
      }
      currentSpeaker = match[1].trim();
      currentText = match[2];
    } else {
      currentText += " " + line;
    }
  }
  if (currentText.length > 10) {
    segments.push({ speaker: currentSpeaker, text: currentText.trim(), timestamp: segIndex });
  }

  if (segments.length === 0) {
    const chunks = rawText.match(/[\s\S]{1,1500}/g) ?? [rawText];
    for (let i = 0; i < chunks.length; i++) {
      segments.push({ speaker: "Transcript", text: chunks[i].trim(), timestamp: i });
    }
  }

  return segments;
}

async function runSpecialisedAlgorithms(
  archiveId: number,
  clientName: string,
  eventName: string,
  eventType: string,
  eventDate: string | undefined,
  transcriptText: string,
): Promise<{ sessionType: string; sessionId: number; algorithmsRun: number; results: Record<string, any> }> {
  const segments = parseTranscriptToSegments(transcriptText);
  const results: Record<string, any> = {};
  let algorithmsRun = 0;
  const SYSTEM_USER_ID = 0;

  if (BASTION_EVENT_TYPES.includes(eventType)) {
    const bastion = await import("../services/BastionInvestorAiService");
    const { sessionId } = await bastion.createBastionSession(SYSTEM_USER_ID, {
      clientName,
      eventTitle: eventName,
      eventType,
      eventDate,
      sector: undefined,
      ticker: undefined,
    });

    console.log(`[ArchiveAI] Running Bastion investor algorithms for archive ${archiveId}, session ${sessionId}`);

    try {
      results.earningsSentiment = await bastion.analyzeEarningsSentiment(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Earnings Sentiment Decoder complete`);
    } catch (e) { console.error(`[ArchiveAI] Earnings sentiment failed:`, e); }

    try {
      results.forwardGuidance = await bastion.trackForwardGuidance(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Forward Guidance Tracker complete`);
    } catch (e) { console.error(`[ArchiveAI] Forward guidance failed:`, e); }

    try {
      results.analystQuestions = await bastion.analyzeAnalystQuestions(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Analyst Question Intelligence complete`);
    } catch (e) { console.error(`[ArchiveAI] Analyst questions failed:`, e); }

    try {
      results.credibility = await bastion.scoreManagementCredibility(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Management Credibility Scorer complete`);
    } catch (e) { console.error(`[ArchiveAI] Credibility scoring failed:`, e); }

    try {
      results.marketMoving = await bastion.detectMarketMovingStatements(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Market-Moving Statement Detector complete`);
    } catch (e) { console.error(`[ArchiveAI] Market-moving detection failed:`, e); }

    try {
      results.investmentBrief = await bastion.generateInvestmentBrief(SYSTEM_USER_ID, sessionId);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Investment Brief Generator complete`);
    } catch (e) { console.error(`[ArchiveAI] Investment brief failed:`, e); }

    return { sessionType: "bastion", sessionId, algorithmsRun, results };
  }

  if (AGM_EVENT_TYPES.includes(eventType)) {
    const agm = await import("../services/AgmGovernanceAiService");
    const { sessionId } = await agm.createAgmSession(SYSTEM_USER_ID, {
      clientName,
      agmTitle: eventName,
      agmDate: eventDate,
      jurisdiction: "south_africa",
    });

    console.log(`[ArchiveAI] Running AGM governance algorithms for archive ${archiveId}, session ${sessionId}`);

    const questions = segments
      .filter(s => s.text.includes("?"))
      .map(s => ({ speaker: s.speaker, question: s.text, timestamp: s.timestamp }));

    try {
      results.dissentPatterns = await agm.analyzeDissentPatterns(SYSTEM_USER_ID, sessionId);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Dissent Pattern Engine complete`);
    } catch (e) { console.error(`[ArchiveAI] Dissent patterns failed:`, e); }

    if (questions.length > 0) {
      try {
        results.governanceQuestions = await agm.triageGovernanceQuestions(SYSTEM_USER_ID, sessionId, questions);
        algorithmsRun++;
        console.log(`[ArchiveAI] ✓ Q&A Governance Triage complete`);
      } catch (e) { console.error(`[ArchiveAI] Governance triage failed:`, e); }
    }

    try {
      results.regulatoryCompliance = await agm.scanRegulatoryCompliance(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Regulatory Speech Guardian complete`);
    } catch (e) { console.error(`[ArchiveAI] Regulatory compliance failed:`, e); }

    try {
      results.governanceReport = await agm.generateGovernanceReport(SYSTEM_USER_ID, sessionId);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Governance Report Generator complete`);
    } catch (e) { console.error(`[ArchiveAI] Governance report failed:`, e); }

    return { sessionType: "agm", sessionId, algorithmsRun, results };
  }

  if (WEBCAST_EVENT_TYPES.includes(eventType)) {
    const webcast = await import("../services/WebcastArchiveAiService");
    const { sessionId } = await webcast.createWebcastSession(SYSTEM_USER_ID, {
      clientName,
      eventTitle: eventName,
      eventType,
      eventDate,
    });

    console.log(`[ArchiveAI] Running webcast intelligence algorithms for archive ${archiveId}, session ${sessionId}`);

    try {
      results.presentationEffectiveness = await webcast.analyzePresentationEffectiveness(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Presentation Effectiveness Analysis complete`);
    } catch (e) { console.error(`[ArchiveAI] Presentation effectiveness failed:`, e); }

    try {
      results.keyMessages = await webcast.extractKeyMessages(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Key Message Extraction complete`);
    } catch (e) { console.error(`[ArchiveAI] Key messages failed:`, e); }

    try {
      results.speakerPerformance = await webcast.analyzeSpeakerPerformance(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Speaker Performance Analysis complete`);
    } catch (e) { console.error(`[ArchiveAI] Speaker performance failed:`, e); }

    try {
      results.contentPack = await webcast.generateWebcastContentPack(SYSTEM_USER_ID, sessionId, segments, clientName, eventName);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Content Pack Generation complete`);
    } catch (e) { console.error(`[ArchiveAI] Content pack failed:`, e); }

    try {
      results.audienceEngagement = await webcast.analyzeAudienceEngagement(SYSTEM_USER_ID, sessionId, segments);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Audience Engagement Analysis complete`);
    } catch (e) { console.error(`[ArchiveAI] Audience engagement failed:`, e); }

    try {
      results.executiveReport = await webcast.generateWebcastReport(SYSTEM_USER_ID, sessionId);
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Executive Webcast Report complete`);
    } catch (e) { console.error(`[ArchiveAI] Executive report failed:`, e); }

    return { sessionType: "webcast", sessionId, algorithmsRun, results };
  }

  if (IPO_EVENT_TYPES.includes(eventType)) {
    const { IpoIntelligenceService } = await import("../services/IpoMandAIntelligenceService");
    const transcript = segments.map(s => `${s.speaker}: ${s.text}`).join("\n");

    console.log(`[ArchiveAI] Running IPO intelligence algorithms for archive ${archiveId}`);

    try {
      results.pricingSensitivity = await IpoIntelligenceService.analyzePricingSensitivity({
        transcript, companyName: clientName, sector: "general",
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ IPO Pricing Sensitivity Analyzer complete`);
    } catch (e) { console.error(`[ArchiveAI] IPO pricing sensitivity failed:`, e); }

    try {
      results.bookBuilding = await IpoIntelligenceService.detectBookBuildingSignals({
        transcript, companyName: clientName, targetRaise: "undisclosed",
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Book-Building Signal Detector complete`);
    } catch (e) { console.error(`[ArchiveAI] Book-building signals failed:`, e); }

    try {
      results.ipoRegulatory = await IpoIntelligenceService.scanRegulatoryRedFlags({
        transcript, jurisdiction: "JSE", isQuietPeriod: false,
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ IPO Regulatory Red Flag Scanner complete`);
    } catch (e) { console.error(`[ArchiveAI] IPO regulatory scan failed:`, e); }

    try {
      results.ipoReadiness = await IpoIntelligenceService.assessIPOReadiness({
        companyName: clientName, sector: "general",
        financialSummary: transcript.slice(0, 3000),
        governanceNotes: "Extracted from transcript",
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ IPO Readiness Scorecard complete`);
    } catch (e) { console.error(`[ArchiveAI] IPO readiness failed:`, e); }

    return { sessionType: "ipo", sessionId: 0, algorithmsRun, results };
  }

  if (MANDA_EVENT_TYPES.includes(eventType)) {
    const { MandAIntelligenceService } = await import("../services/IpoMandAIntelligenceService");
    const transcript = segments.map(s => `${s.speaker}: ${s.text}`).join("\n");

    console.log(`[ArchiveAI] Running M&A intelligence algorithms for archive ${archiveId}`);

    try {
      results.offerCompliance = await MandAIntelligenceService.monitorOfferPeriodCompliance({
        transcript, dealType: "friendly", jurisdiction: "JSE",
        targetCompany: eventName, acquirerCompany: clientName,
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Offer Period Compliance Monitor complete`);
    } catch (e) { console.error(`[ArchiveAI] Offer compliance failed:`, e); }

    try {
      results.leakDetection = await MandAIntelligenceService.detectInformationLeaks({
        transcript, isPreAnnouncement: false, knownInsiders: [],
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Leak Detection Engine complete`);
    } catch (e) { console.error(`[ArchiveAI] Leak detection failed:`, e); }

    try {
      results.synergyValidation = await MandAIntelligenceService.analyzeSynergyValidation({
        transcript, acquirerCompany: clientName, targetCompany: eventName, sector: "general",
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Synergy Validation Analyzer complete`);
    } catch (e) { console.error(`[ArchiveAI] Synergy validation failed:`, e); }

    try {
      results.stakeholderImpact = await MandAIntelligenceService.mapStakeholderImpact({
        transcript, acquirerCompany: clientName, targetCompany: eventName,
        dealSize: "undisclosed", sector: "general",
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Stakeholder Impact Mapper complete`);
    } catch (e) { console.error(`[ArchiveAI] Stakeholder impact failed:`, e); }

    try {
      results.dealCertainty = await MandAIntelligenceService.predictDealCertainty({
        transcript, acquirerCompany: clientName, targetCompany: eventName,
        dealType: "friendly", jurisdiction: "JSE",
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Deal Certainty Predictor complete`);
    } catch (e) { console.error(`[ArchiveAI] Deal certainty prediction failed:`, e); }

    return { sessionType: "manda", sessionId: 0, algorithmsRun, results };
  }

  if (CREDIT_EVENT_TYPES.includes(eventType)) {
    const { CreditBondholderIntelligenceService } = await import("../services/IpoMandAIntelligenceService");
    const transcript = segments.map(s => `${s.speaker}: ${s.text}`).join("\n");

    console.log(`[ArchiveAI] Running credit & bondholder algorithms for archive ${archiveId}`);

    try {
      results.creditSpreadImpact = await CreditBondholderIntelligenceService.analyzeCreditSpreadImpact({
        transcript, companyName: clientName, currentRating: "unrated", sector: "general",
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Credit Spread Impact Analyzer complete`);
    } catch (e) { console.error(`[ArchiveAI] Credit spread impact failed:`, e); }

    try {
      results.covenantCompliance = await CreditBondholderIntelligenceService.scanCovenantCompliance({
        transcript, companyName: clientName,
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Covenant Compliance Scanner complete`);
    } catch (e) { console.error(`[ArchiveAI] Covenant compliance failed:`, e); }

    return { sessionType: "credit", sessionId: 0, algorithmsRun, results };
  }

  if (PROXY_EVENT_TYPES.includes(eventType)) {
    const { ActivistProxyIntelligenceService } = await import("../services/IpoMandAIntelligenceService");
    const transcript = segments.map(s => `${s.speaker}: ${s.text}`).join("\n");

    console.log(`[ArchiveAI] Running activist & proxy algorithms for archive ${archiveId}`);

    try {
      results.activistCampaign = await ActivistProxyIntelligenceService.detectActivistCampaign({
        transcript, companyName: clientName,
      });
      algorithmsRun++;
      console.log(`[ArchiveAI] ✓ Activist Campaign Detector complete`);
    } catch (e) { console.error(`[ArchiveAI] Activist detection failed:`, e); }

    return { sessionType: "activist", sessionId: 0, algorithmsRun, results };
  }

  return { sessionType: "none", sessionId: 0, algorithmsRun: 0, results: {} };
}

export const archiveUploadRouter = router({

  processTranscript: publicProcedure
    .input(
      z.object({
        clientName: z.string().min(1).max(255),
        eventName: z.string().min(1).max(255),
        eventType: z.enum([
          "earnings_call", "interim_results", "annual_results", "results_call", "media_call", "analyst_call", "agm", "capital_markets_day",
          "ceo_town_hall", "board_meeting", "webcast", "partner_webcast",
          "product_launch_webcast", "thought_leadership_webcast", "results_webcast",
          "hybrid_webcast", "investor_day", "roadshow", "special_call",
          "ipo_roadshow", "ipo_listing", "pre_ipo",
          "manda_call", "takeover_announcement", "merger_announcement", "scheme_of_arrangement",
          "credit_rating_call", "bondholder_meeting", "debt_restructuring",
          "proxy_contest", "activist_meeting", "extraordinary_general_meeting",
          "other",
        ]),
        eventDate: z.string().optional(),
        platform: z.string().optional(),
        transcriptText: z.string().min(10).max(500000),
        notes: z.string().optional(),
        selectedModules: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
    const fingerprint = computeTranscriptFingerprint(input.transcriptText);

      const [existingRows] = await rawSql(
        `SELECT id, event_id, client_name, event_name, event_type, created_at
         FROM archive_events
         WHERE client_name = ? AND event_name = ? AND event_type = ?
         LIMIT 1`,
        [input.clientName, input.eventName, input.eventType]
      );

      if ((existingRows as any[])?.length > 0) {
        const existing = (existingRows as any[])[0];
        const existingDate = existing.created_at
          ? new Date(existing.created_at).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })
          : "unknown date";
        throw new Error(
          `Duplicate upload detected: "${input.eventName}" for ${input.clientName} (${input.eventType.replace(/_/g, " ")}) was already uploaded on ${existingDate}. Archive ID: ${existing.event_id || existing.id}. If this is a different version of the same event, please rename the event to distinguish it.`
        );
      }

      const [fingerprintRows] = await rawSql(
        `SELECT id, event_id, client_name, event_name FROM archive_events
         WHERE transcript_fingerprint = ?
         LIMIT 1`,
        [fingerprint]
      );
      if ((fingerprintRows as any[])?.length > 0) {
        const match = (fingerprintRows as any[])[0];
        throw new Error(
          `Duplicate content detected: This transcript has already been uploaded as "${match.event_name}" for ${match.client_name} (Archive ID: ${match.event_id || match.id}). The content matches an existing archive even though the event details differ.`
        );
      }

      const rawSegments = input.transcriptText
        .split(/\n{2,}|\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);

      const wordCount = input.transcriptText
        .split(/\s+/)
        .filter(Boolean).length;

      const complianceFlags = COMPLIANCE_KEYWORDS.filter((k) =>
        input.transcriptText.toLowerCase().includes(k)
      ).length;

      const sentimentAvg = await scoreSentimentFromText(input.transcriptText);

      const [result] = await rawSql(
        `INSERT INTO archive_events
          (event_id, client_name, event_name, event_type, event_date, platform, transcript_text,
           word_count, segment_count, sentiment_avg, compliance_flags, status, notes, transcript_fingerprint)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?, ?)
         RETURNING id`,
        [
          null,
          input.clientName,
          input.eventName,
          input.eventType,
          input.eventDate ?? null,
          input.platform ?? null,
          input.transcriptText,
          wordCount,
          rawSegments.length,
          sentimentAvg,
          complianceFlags,
          input.notes ?? null,
          fingerprint,
        ]
      );

      const archiveId: number = Array.isArray(result) ? (result[0]?.id ?? 0) : ((result as any).insertId ?? 0);
      await rawSql(`UPDATE archive_events SET event_id = ? WHERE id = ?`, [`archive-${archiveId}`, archiveId]);

      const metricsPromise = generateMetricsFromArchive(
        archiveId,
        input.clientName,
        input.eventName,
        input.eventType,
        rawSegments,
        sentimentAvg,
        complianceFlags
      );

      let aiReport: AiReport | null = null;
      try {
        aiReport = await generateFullAiReport(
          input.transcriptText,
          input.clientName,
          input.eventName,
          input.eventType,
          sentimentAvg,
          complianceFlags,
          input.selectedModules
        );
      } catch (err) {
        console.error("[ArchiveAI] Report generation failed, continuing without report:", err);
      }

      const { eventId, eventTitle, metricsCount } = await metricsPromise;

      await rawSql(
        `UPDATE archive_events SET status = 'completed', tagged_metrics_generated = ?, ai_report = ? WHERE id = ?`,
        [metricsCount, aiReport ? JSON.stringify(aiReport) : null, archiveId]
      );

      await writeAnonymizedRecord({
        eventType: input.eventType,
        sentimentScore: sentimentAvg,
        segmentCount: rawSegments.length,
        complianceFlags,
        wordCount,
        eventDate: input.eventDate ?? null,
        sourceType: "archive_upload",
      });

      if (aiReport) {
        try {
          const { runMetaObserver, runAccumulationEngine } = await import("../services/AiEvolutionService");
          await runMetaObserver(
            aiReport,
            "archive_upload",
            archiveId,
            input.eventType,
            input.clientName,
            input.transcriptText.length
          );
          runAccumulationEngine().catch(err =>
            console.error("[AiEvolution] Background accumulation failed:", err)
          );
        } catch (err) {
          console.error("[AiEvolution] Meta-observer hook failed:", err);
        }

        try {
          const { analyzeCrisisRisk } = await import("./crisisPredictionRouter");
          const words = input.transcriptText.split(/\s+/).filter(Boolean);
          const sentimentTrajectory = words.filter((_, i) => i % Math.max(1, Math.floor(words.length / 20)) === 0)
            .map((_, i) => (sentimentAvg ?? 50) + (Math.random() * 10 - 5) * (i / 20));
          await analyzeCrisisRisk(input.transcriptText, input.clientName, input.eventName, input.eventType, sentimentTrajectory, undefined, eventId);
          console.log(`[ArchiveAI] ✓ Crisis prediction completed for archive ${archiveId}`);
        } catch (err) {
          console.error("[ArchiveAI] Crisis prediction failed (non-fatal):", err);
        }

        try {
          const { generateDisclosureCertificate } = await import("./disclosureCertificateRouter");
          await generateDisclosureCertificate({
            eventId,
            clientName: input.clientName,
            eventName: input.eventName,
            eventType: input.eventType,
            transcriptText: input.transcriptText,
            aiReportJson: JSON.stringify(aiReport),
            complianceFlags: complianceFlags,
            jurisdictions: ["JSE"],
          });
          console.log(`[ArchiveAI] ✓ Disclosure certificate generated for archive ${archiveId}`);
        } catch (err) {
          console.error("[ArchiveAI] Disclosure certificate failed (non-fatal):", err);
        }

        try {
          const { analyzeValuationImpact } = await import("./valuationImpactRouter");
          await analyzeValuationImpact(input.transcriptText, input.clientName, input.eventName, input.eventType, sentimentAvg ?? 50, eventId);
          console.log(`[ArchiveAI] ✓ Valuation impact analysis completed for archive ${archiveId}`);
        } catch (err) {
          console.error("[ArchiveAI] Valuation impact analysis failed (non-fatal):", err);
        }
      }

      let specialisedResult = { sessionType: "none", sessionId: 0, algorithmsRun: 0, results: {} as Record<string, any> };
      try {
        specialisedResult = await runSpecialisedAlgorithms(
          archiveId,
          input.clientName,
          input.eventName,
          input.eventType,
          input.eventDate,
          input.transcriptText,
        );
        if (specialisedResult.algorithmsRun > 0) {
          await rawSql(
            `UPDATE archive_events SET specialised_analysis = ?, specialised_algorithms_run = ?, specialised_session_id = ?, specialised_session_type = ? WHERE id = ?`,
            [
              JSON.stringify(specialisedResult.results),
              specialisedResult.algorithmsRun,
              specialisedResult.sessionId || null,
              specialisedResult.sessionType !== "none" ? specialisedResult.sessionType : null,
              archiveId,
            ]
          );
          console.log(`[ArchiveAI] ✓ Specialised analysis complete: ${specialisedResult.algorithmsRun} ${specialisedResult.sessionType} algorithms run for archive ${archiveId}`);
        }
      } catch (err) {
        console.error("[ArchiveAI] Specialised algorithm pipeline failed (non-fatal):", err);
      }

      const sessionTypeLabel = specialisedResult.sessionType === "bastion" ? "investor"
        : specialisedResult.sessionType === "agm" ? "governance"
        : specialisedResult.sessionType === "webcast" ? "webcast intelligence"
        : specialisedResult.sessionType === "ipo" ? "IPO intelligence"
        : specialisedResult.sessionType === "manda" ? "M&A intelligence"
        : specialisedResult.sessionType === "credit" ? "credit & bondholder"
        : specialisedResult.sessionType === "activist" ? "activist & proxy"
        : "specialised";
      const specialisedLabel = specialisedResult.algorithmsRun > 0
        ? ` + ${specialisedResult.algorithmsRun} ${sessionTypeLabel} algorithms`
        : "";

      return {
        success: true,
        archiveId,
        eventId,
        eventTitle,
        wordCount,
        segmentCount: rawSegments.length,
        sentimentAvg,
        complianceFlags,
        metricsGenerated: metricsCount,
        specialisedAlgorithmsRun: specialisedResult.algorithmsRun,
        specialisedSessionType: specialisedResult.sessionType,
        specialisedSessionId: specialisedResult.sessionId,
        message: `Archive processed. ${metricsCount} intelligence records${specialisedLabel} added to your database.`,
      };
    }),

  getArchiveDetail: publicProcedure
    .input(z.object({ archiveId: z.number() }))
    .query(async ({ input }) => {
      const conn = await (async () => {
        const db = await getDb();
        return (db as any).session?.client ?? (db as any).$client;
      })();
      const [rows] = await rawSql(
        `SELECT id, client_name, event_name, event_type, event_date, platform,
                word_count, segment_count, sentiment_avg, compliance_flags,
                tagged_metrics_generated, status, notes, created_at, ai_report,
                specialised_analysis, specialised_algorithms_run, specialised_session_id, specialised_session_type,
                transcript_text, recording_path
         FROM archive_events WHERE id = ? LIMIT 1`,
        [input.archiveId]
      );
      const row = (rows as any[])[0];
      if (!row) throw new Error("Archive not found");
      let parsedReport = null;
      try {
        parsedReport = typeof row.ai_report === "string" ? JSON.parse(row.ai_report) : row.ai_report;
      } catch {}
      let parsedSpecialised = null;
      try {
        parsedSpecialised = typeof row.specialised_analysis === "string" ? JSON.parse(row.specialised_analysis) : row.specialised_analysis;
      } catch {}
      return {
        ...row,
        ai_report: parsedReport,
        specialised_analysis: parsedSpecialised,
        has_transcript: !!(row.transcript_text && row.transcript_text.trim().length > 0),
        has_recording: !!(row.recording_path && row.recording_path.trim().length > 0),
        transcript_text: undefined,
        recording_path: undefined,
      } as {
        id: number; client_name: string; event_name: string; event_type: string;
        event_date: string | null; platform: string | null; word_count: number;
        segment_count: number; sentiment_avg: number | null; compliance_flags: number;
        tagged_metrics_generated: number; status: string; notes: string | null; created_at: string;
        ai_report: AiReport | null;
        specialised_analysis: any | null;
        specialised_algorithms_run: number;
        specialised_session_id: number | null;
        specialised_session_type: string | null;
        has_transcript: boolean;
        has_recording: boolean;
      };
    }),

  emailArchiveReport: publicProcedure
    .input(z.object({
      archiveId: z.number(),
      recipientEmail: z.string().email(),
      recipientName: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const conn = await (async () => {
        const db = await getDb();
        return (db as any).session?.client ?? (db as any).$client;
      })();
      const [rows] = await rawSql(
        `SELECT id, client_name, event_name, event_type, event_date,
                word_count, segment_count, sentiment_avg, compliance_flags,
                tagged_metrics_generated, notes, ai_report
         FROM archive_events WHERE id = ? LIMIT 1`,
        [input.archiveId]
      );
      const row = (rows as any[])[0];
      if (!row) throw new Error("Archive not found");

      let parsedReport: AiReport | null = null;
      try {
        parsedReport = typeof row.ai_report === "string" ? JSON.parse(row.ai_report) : row.ai_report;
      } catch {}

      const { sendEmail } = await import("../_core/email");
      const html = buildArchiveReportEmail({
        recipientName: input.recipientName,
        clientName: row.client_name,
        eventName: row.event_name,
        eventType: row.event_type,
        eventDate: row.event_date,
        wordCount: row.word_count,
        segmentCount: row.segment_count,
        sentimentAvg: row.sentiment_avg,
        complianceFlags: row.compliance_flags,
        metricsGenerated: row.tagged_metrics_generated,
        notes: row.notes,
        aiReport: parsedReport,
      });

      const result = await sendEmail({
        to: input.recipientEmail,
        subject: `CuraLive Intelligence Report — ${row.event_name} (${row.client_name})`,
        html,
      });

      return {
        success: result.success,
        message: result.success
          ? `Report emailed to ${input.recipientEmail}`
          : `Email failed: ${result.error}`,
      };
    }),

  generateReport: publicProcedure
    .input(z.object({ archiveId: z.number(), selectedModules: z.array(z.string()).optional() }))
    .mutation(async ({ input }) => {
      const conn = await (async () => {
        const db = await getDb();
        return (db as any).session?.client ?? (db as any).$client;
      })();
      const [rows] = await rawSql(
        `SELECT id, client_name, event_name, event_type, transcript_text, sentiment_avg, compliance_flags
         FROM archive_events WHERE id = ? LIMIT 1`,
        [input.archiveId]
      );
      const row = (rows as any[])[0];
      if (!row) throw new Error("Archive not found");

      const aiReport = await generateFullAiReport(
        row.transcript_text,
        row.client_name,
        row.event_name,
        row.event_type,
        row.sentiment_avg ?? 50,
        row.compliance_flags ?? 0,
        input.selectedModules
      );

      await rawSql(
        `UPDATE archive_events SET ai_report = ? WHERE id = ?`,
        [JSON.stringify(aiReport), input.archiveId]
      );

      try {
        const { runMetaObserver, runAccumulationEngine } = await import("../services/AiEvolutionService");
        await runMetaObserver(
          aiReport,
          "archive_upload",
          input.archiveId,
          row.event_type ?? "unknown",
          row.client_name ?? "Unknown",
          (row.transcript_text ?? "").length
        );
        runAccumulationEngine().catch(err =>
          console.error("[AiEvolution] Background accumulation failed:", err)
        );
      } catch (err) {
        console.error("[AiEvolution] Meta-observer hook failed:", err);
      }

      return { success: true, message: "AI report generated successfully" };
    }),

  listArchives: publicProcedure.query(async () => {
    try {
      const conn = await (async () => {
        const db = await getDb();
        return (db as any).session?.client ?? (db as any).$client;
      })();
      const [rows] = await rawSql(
        `SELECT id, event_id, client_name, event_name, event_type, event_date, platform,
                word_count, segment_count, sentiment_avg, compliance_flags,
                tagged_metrics_generated, status, notes, created_at
         FROM archive_events ORDER BY created_at DESC LIMIT 50`
      );
      return rows as Array<{
        id: number;
        event_id: string;
        client_name: string;
        event_name: string;
        event_type: string;
        event_date: string | null;
        platform: string | null;
        word_count: number;
        segment_count: number;
        sentiment_avg: number | null;
        compliance_flags: number;
        tagged_metrics_generated: number;
        status: string;
        notes: string | null;
        created_at: string;
      }>;
    } catch {
      return [];
    }
  }),
});
