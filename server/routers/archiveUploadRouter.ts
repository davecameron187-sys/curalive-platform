// @ts-nocheck
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { taggedMetrics } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { desc, sql } from "drizzle-orm";
import { writeAnonymizedRecord } from "../lib/aggregateIntelligence";

type AiReport = {
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

async function generateFullAiReport(
  transcriptText: string,
  clientName: string,
  eventName: string,
  eventType: string,
  sentimentAvg: number,
  complianceFlags: number
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

  const systemPrompt = `You are CuraLive's AI Intelligence Engine — an expert analyst for investor events.
Analyze the transcript and produce a comprehensive JSON report with ALL 20 analysis modules. Be specific and cite actual content from the transcript. Every module must be populated with real analysis — never return empty arrays if there is relevant content.
The event is: "${eventName}" by "${clientName}" (type: ${eventType}).
Pre-computed sentiment: ${sentimentAvg}/100, compliance flags: ${complianceFlags}.

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
    parsed.modulesGenerated = 20;
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
}): string {
  const sentimentColor = (opts.sentimentAvg ?? 50) >= 70 ? "#10b981" : (opts.sentimentAvg ?? 50) >= 50 ? "#f59e0b" : "#ef4444";
  const sentimentLabel = (opts.sentimentAvg ?? 50) >= 70 ? "Positive" : (opts.sentimentAvg ?? 50) >= 50 ? "Neutral" : "Negative";
  const complianceColor = opts.complianceFlags > 3 ? "#ef4444" : opts.complianceFlags > 1 ? "#f59e0b" : "#10b981";
  const complianceLabel = opts.complianceFlags > 3 ? "High Risk" : opts.complianceFlags > 1 ? "Moderate" : "Low Risk";
  const eventTypeLabels: Record<string, string> = {
    earnings_call: "Earnings Call", agm: "AGM", capital_markets_day: "Capital Markets Day",
    ceo_town_hall: "CEO Town Hall", board_meeting: "Board Meeting", webcast: "Webcast", other: "Other",
  };
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0d14;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0d14;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:12px;overflow:hidden;border:1px solid #1e293b;">
<tr><td style="background:linear-gradient(135deg,#1e3a5f,#0f172a);padding:32px 40px;">
<p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#a78bfa;">CuraLive Post-Event Intelligence Report</p>
<h1 style="margin:0;font-size:22px;font-weight:700;color:#f1f5f9;line-height:1.3;">${opts.eventName}</h1>
<p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">${opts.clientName} · ${eventTypeLabels[opts.eventType] ?? opts.eventType}${opts.eventDate ? ` · ${opts.eventDate}` : ""}</p>
</td></tr>
<tr><td style="padding:32px 40px;">
<p style="margin:0 0 20px;font-size:15px;color:#94a3b8;">Dear ${opts.recipientName},</p>
<p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">Please find below the AI-generated intelligence summary from your event.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
<tr>
<td width="50%" style="padding:8px;">
<table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Sentiment Score</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:800;color:${sentimentColor};">${opts.sentimentAvg ?? "N/A"}<span style="font-size:14px;color:#64748b;">/100</span></p>
<p style="margin:4px 0 0;font-size:12px;color:${sentimentColor};font-weight:600;">${sentimentLabel}</p>
</td></tr></table>
</td>
<td width="50%" style="padding:8px;">
<table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Compliance Risk</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:800;color:${complianceColor};">${opts.complianceFlags}</p>
<p style="margin:4px 0 0;font-size:12px;color:${complianceColor};font-weight:600;">${complianceLabel}</p>
</td></tr></table>
</td>
</tr>
<tr>
<td width="50%" style="padding:8px;">
<table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Words Analysed</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#60a5fa;">${opts.wordCount.toLocaleString()}</p>
</td></tr></table>
</td>
<td width="50%" style="padding:8px;">
<table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;"><tr><td style="padding:16px;text-align:center;">
<p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Segments Processed</p>
<p style="margin:6px 0 0;font-size:28px;font-weight:800;color:#60a5fa;">${opts.segmentCount}</p>
</td></tr></table>
</td>
</tr>
</table>
<table width="100%" style="background:#0f172a;border-radius:8px;border:1px solid #1e293b;margin:0 0 24px;"><tr><td style="padding:16px;">
<p style="margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Intelligence Records Generated</p>
<p style="margin:0;font-size:15px;color:#cbd5e1;line-height:1.6;">${opts.metricsGenerated} tagged intelligence records have been added to your CuraLive database, covering sentiment analysis, engagement metrics, compliance scanning, and session completion tracking.</p>
</td></tr></table>
${opts.notes ? `<table width="100%" style="background:#0f172a;border-left:3px solid #3b82f6;border-radius:4px;margin:0 0 24px;"><tr><td style="padding:16px 20px;">
<p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Operator Notes</p>
<p style="margin:0;font-size:14px;color:#cbd5e1;line-height:1.6;">${opts.notes}</p>
</td></tr></table>` : ""}
<p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">For the full transcript and detailed analytics, please contact your CuraLive account manager.</p>
</td></tr>
<tr><td style="background:#0f172a;padding:20px 40px;border-top:1px solid #1e293b;">
<p style="margin:0;font-size:12px;color:#475569;text-align:center;">CuraLive Intelligence Platform · Automated Post-Event Report</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

const BASTION_EVENT_TYPES = ["earnings_call", "interim_results", "capital_markets_day", "investor_day", "roadshow", "special_call"];
const AGM_EVENT_TYPES = ["agm", "board_meeting"];

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

  return { sessionType: "none", sessionId: 0, algorithmsRun: 0, results: {} };
}

export const archiveUploadRouter = router({

  processTranscript: publicProcedure
    .input(
      z.object({
        clientName: z.string().min(1).max(255),
        eventName: z.string().min(1).max(255),
        eventType: z.enum([
          "earnings_call", "interim_results", "agm", "capital_markets_day",
          "ceo_town_hall", "board_meeting", "webcast", "investor_day", "roadshow", "special_call", "other",
        ]),
        eventDate: z.string().optional(),
        platform: z.string().optional(),
        transcriptText: z.string().min(10).max(500000),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

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

      const conn = (db as any).session?.client ?? (db as any).$client;
      const [result] = await conn.execute(
        `INSERT INTO archive_events
          (client_name, event_name, event_type, event_date, platform, transcript_text,
           word_count, segment_count, sentiment_avg, compliance_flags, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?)`,
        [
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
        ]
      );

      const archiveId: number = (result as any).insertId;

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
          complianceFlags
        );
      } catch (err) {
        console.error("[ArchiveAI] Report generation failed, continuing without report:", err);
      }

      const { eventId, eventTitle, metricsCount } = await metricsPromise;

      await conn.execute(
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
          await conn.execute(
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

      const specialisedLabel = specialisedResult.algorithmsRun > 0
        ? ` + ${specialisedResult.algorithmsRun} specialised ${specialisedResult.sessionType === "bastion" ? "investor" : "governance"} algorithms`
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
      const [rows] = await conn.execute(
        `SELECT id, client_name, event_name, event_type, event_date, platform,
                word_count, segment_count, sentiment_avg, compliance_flags,
                tagged_metrics_generated, status, notes, created_at, ai_report,
                specialised_analysis, specialised_algorithms_run, specialised_session_id, specialised_session_type
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
      return { ...row, ai_report: parsedReport, specialised_analysis: parsedSpecialised } as {
        id: number; client_name: string; event_name: string; event_type: string;
        event_date: string | null; platform: string | null; word_count: number;
        segment_count: number; sentiment_avg: number | null; compliance_flags: number;
        tagged_metrics_generated: number; status: string; notes: string | null; created_at: string;
        ai_report: AiReport | null;
        specialised_analysis: any | null;
        specialised_algorithms_run: number;
        specialised_session_id: number | null;
        specialised_session_type: string | null;
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
      const [rows] = await conn.execute(
        `SELECT id, client_name, event_name, event_type, event_date,
                word_count, segment_count, sentiment_avg, compliance_flags,
                tagged_metrics_generated, notes
         FROM archive_events WHERE id = ? LIMIT 1`,
        [input.archiveId]
      );
      const row = (rows as any[])[0];
      if (!row) throw new Error("Archive not found");

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
    .input(z.object({ archiveId: z.number() }))
    .mutation(async ({ input }) => {
      const conn = await (async () => {
        const db = await getDb();
        return (db as any).session?.client ?? (db as any).$client;
      })();
      const [rows] = await conn.execute(
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
        row.compliance_flags ?? 0
      );

      await conn.execute(
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
      const [rows] = await conn.execute(
        `SELECT id, client_name, event_name, event_type, event_date, platform,
                word_count, segment_count, sentiment_avg, compliance_flags,
                tagged_metrics_generated, status, notes, created_at
         FROM archive_events ORDER BY created_at DESC LIMIT 50`
      );
      return rows as Array<{
        id: number;
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
