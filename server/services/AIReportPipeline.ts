import { rawSql } from "../db";
import { invokeLLM } from "../_core/llm";

const LOG = (msg: string) => console.log(`[AIReport] ${msg}`);
const ERR = (msg: string, e?: any) => console.error(`[AIReport] ${msg}`, e ?? "");

type ModuleName =
  | "executiveSummary" | "criticalActions" | "complianceFlags"
  | "financialMetrics" | "managementTone" | "qaQuality"
  | "boardActions" | "socialMediaPack" | "sensRnsDraft" | "boardIntelligence";

interface ReportContext {
  sessionId:    number;
  company:      string;
  eventName:    string;
  eventType:    string;
  jurisdiction: string;
  transcript:   string;
  flags:        any[];
  qa:           any[];
  tier:         string;
}

export async function generateAIReport(
  sessionId: number,
  session: any
): Promise<Record<string, string>> {
  const start = Date.now();
  LOG(`Starting report generation for session ${sessionId} — ${session.company ?? "Company"}`);

  const transcript = await loadTranscript(sessionId);
  const transcriptText = transcript
    .map((s: any) => `[${s.speaker_name ?? "Speaker"}]: ${s.text}`)
    .join("\n");

  if (!transcriptText || transcriptText.length < 100) {
    LOG("Transcript too short — generating minimal report");
  }

  const [flagRows] = await rawSql(
    `SELECT id, flag_type, severity, statement, rule_basis, speaker, segment_timestamp
     FROM regulatory_flags WHERE monitor_id = $1
     ORDER BY severity DESC`,
    [sessionId]
  );

  const [qaRows] = await rawSql(
    `SELECT question_text, asker_name, asker_firm, status, ai_suggested_answer
     FROM approved_questions_queue WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );

  const ctx: ReportContext = {
    sessionId,
    company:      session.company        ?? "Company",
    eventName:    session.event_name     ?? "Earnings Call",
    eventType:    session.event_type     ?? "earnings_call",
    jurisdiction: session.jurisdiction   ?? "JSE",
    transcript:   transcriptText,
    flags:        flagRows  as any[],
    qa:           qaRows    as any[],
    tier:         session.tier           ?? "intelligence",
  };

  const [
    executiveSummary,
    complianceFlags,
    managementTone,
  ] = await Promise.all([
    runModule("executiveSummary", ctx),
    runModule("complianceFlags", ctx),
    runModule("managementTone", ctx),
  ]);

  const [
    financialMetrics,
    qaQuality,
    boardActions,
    socialMediaPack,
    sensRnsDraft,
    boardIntelligence,
    criticalActions,
  ] = await Promise.all([
    runModule("financialMetrics", ctx),
    runModule("qaQuality", ctx),
    runModule("boardActions", ctx),
    runModule("socialMediaPack", ctx),
    runModule("sensRnsDraft", ctx),
    runModule("boardIntelligence", ctx),
    runModule("criticalActions", ctx),
  ]);

  const report = {
    executiveSummary,
    criticalActions,
    complianceFlags,
    financialMetrics,
    managementTone,
    qaQuality,
    boardActions,
    socialMediaPack,
    sensRnsDraft,
    boardIntelligence,
    generatedAt: new Date().toISOString(),
    sessionId,
    company:     ctx.company,
    eventName:   ctx.eventName,
    _transcriptText: ctx.transcript || undefined,
  };

  await saveReport(sessionId, session, report);
  delete (report as any)._transcriptText;

  LOG(`Report generated in ${Date.now() - start}ms`);

  return {
    module_08: typeof report.boardIntelligence === "string"
      ? report.boardIntelligence
      : JSON.stringify(report.boardIntelligence),
    module_07: typeof report.managementTone === "string"
      ? report.managementTone
      : JSON.stringify(report.managementTone),
    module_05: typeof report.complianceFlags === "string"
      ? report.complianceFlags
      : JSON.stringify(report.complianceFlags),
    module_19: typeof report.boardIntelligence === "string"
      ? report.boardIntelligence
      : JSON.stringify(report.boardIntelligence),
  };
}

async function runModule(module: ModuleName, ctx: ReportContext): Promise<any> {
  try {
    const prompt = buildPrompt(module, ctx);
    const result = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1200,
    });
    const rawText = result.choices?.[0]?.message?.content ?? "";
    const text    = typeof rawText === "string" ? rawText : JSON.stringify(rawText);
    const cleaned = text.replace(/```json|```/g, "").trim();

    const jsonModules: ModuleName[] = [
      "executiveSummary", "complianceFlags", "criticalActions", "boardIntelligence"
    ];
    if (jsonModules.includes(module)) {
      try { return JSON.parse(cleaned); }
      catch { return cleaned; }
    }

    return cleaned;
  } catch (e) {
    ERR(`Module ${module} failed`, e);
    return getModuleFallback(module);
  }
}

function buildPrompt(module: ModuleName, ctx: ReportContext): string {
  const base = `Company: ${ctx.company}
Event: ${ctx.eventName} (${ctx.eventType})
Jurisdiction: ${ctx.jurisdiction}
Compliance flags detected: ${ctx.flags.length}
Q&A questions reviewed: ${ctx.qa.length}`;

  const transcript = ctx.transcript.length > 6000
    ? ctx.transcript.slice(0, 6000) + "\n[transcript truncated]"
    : ctx.transcript;

  const flagSummary = ctx.flags.slice(0, 8).map(f =>
    `- [${f.severity?.toUpperCase()}] ${f.statement} (Rule: ${f.rule_basis ?? "JSE"})`
  ).join("\n");

  const qaSummary = ctx.qa.slice(0, 10).map(q =>
    `- [${q.asker_firm ?? "Analyst"}]: ${q.question_text}`
  ).join("\n");

  switch (module) {

    case "executiveSummary":
      return `${base}

TRANSCRIPT:
${transcript}

You are a senior investor relations analyst. Generate an executive summary of this event.

Return a JSON object with exactly this structure:
{
  "verdict": "A 3-5 sentence executive summary. Be specific to this company and event. Include overall tone assessment, key topics covered, compliance risk level, and one strategic observation.",
  "metrics": [
    { "value": "X%", "label": "Management confidence" },
    { "value": "X/10", "label": "Compliance risk" },
    { "value": "Xmin", "label": "Session duration" },
    { "value": "X", "label": "Flags raised" }
  ]
}

Base all values on the actual transcript. Do not fabricate specific financial figures not mentioned. Return ONLY the JSON object.`;

    case "criticalActions":
      return `${base}

COMPLIANCE FLAGS:
${flagSummary || "No flags detected"}

TRANSCRIPT EXCERPT:
${transcript.slice(0, 2000)}

You are a compliance officer. Identify the critical actions required after this event.

Return a JSON array of action items:
[
  {
    "title": "Short action title",
    "detail": "Specific detail about what must be done, who must do it, and by when",
    "priority": "urgent|high"
  }
]

Focus on: regulatory filing obligations, investor disclosure requirements, compliance remediation steps.
If no flags: return actions related to standard post-event obligations for ${ctx.jurisdiction}.
Return ONLY the JSON array. Maximum 5 items.`;

    case "complianceFlags":
      return `${base}

DETECTED FLAGS:
${flagSummary || "No compliance flags were detected during this session."}

TRANSCRIPT:
${transcript.slice(0, 3000)}

You are a regulatory compliance specialist for ${ctx.jurisdiction}-listed companies.

${ctx.flags.length > 0
  ? `For each detected flag, provide detailed compliance analysis.`
  : `The compliance engine detected no flags. Confirm this assessment and note any borderline statements.`}

Return a JSON array:
[
  {
    "title": "Flag title — specific regulatory issue",
    "description": "The exact phrase or statement that triggered this flag, and why it creates regulatory risk",
    "action": "The specific action required (e.g. 'File SENS cautionary announcement within 48 hours')",
    "severity": "critical|warning|info",
    "ruleRef": "Specific rule reference (e.g. 'JSE Listing Requirements § 3.4 — Selective Disclosure')",
    "deadline": "48 hours|72 hours|etc"
  }
]

Return ONLY the JSON array. If no flags: return an array with one info-level item confirming clean compliance.`;

    case "financialMetrics":
      return `${base}

TRANSCRIPT:
${transcript}

You are a financial analyst. Extract and analyse all financial metrics, guidance, and quantitative statements from this transcript.

Produce a structured analysis covering:
1. Revenue/earnings guidance or actuals mentioned (with exact figures quoted)
2. Margin commentary (gross, operating, EBITDA)
3. Capital allocation statements (dividends, buybacks, capex)
4. Guidance ranges provided and their implications
5. Financial risk factors mentioned
6. Forward-looking financial statements that require monitoring

Be specific. Quote exact figures where mentioned. Flag any forward-looking statements that create disclosure obligations.
If no financial metrics were mentioned: state this clearly and note what would typically be expected for this event type.

Format as clear, readable paragraphs. No bullet points. Write as a senior analyst briefing note.`;

    case "managementTone":
      return `${base}

TRANSCRIPT:
${transcript}

You are a behavioural analyst specialising in executive communication. Analyse management tone and communication patterns.

Produce a detailed tone analysis covering:
1. Overall confidence trajectory — did confidence increase or decrease across the session?
2. Hedging language — identify specific phrases where management hedged or qualified statements
3. Topics where deflection occurred — questions that were redirected or not directly answered
4. Sentiment by topic — which topics generated positive vs defensive responses
5. Specific phrases that signal risk or uncertainty (quote them)
6. Comparison to expected tone for this event type and company stage

Write as a professional briefing note for a board member. Be specific. Quote phrases from the transcript.
Format as paragraphs. No bullet points.`;

    case "qaQuality":
      return `${base}

Q&A SUBMISSIONS:
${qaSummary || "No Q&A questions were submitted during this session."}

TRANSCRIPT:
${transcript.slice(0, 3000)}

You are an investor relations analyst. Analyse the Q&A session.

Cover:
1. Analyst firm engagement — which firms were most active and what were their themes?
2. Question quality assessment — were questions probing, routine, or adversarial?
3. Topics that generated the most analyst interest
4. Questions that created compliance or disclosure risk
5. Management response quality — where did management answer well vs poorly?
6. Key intelligence signals — what does the Q&A pattern reveal about market sentiment?

If no Q&A: note this and comment on what it signals.
Write as a professional briefing. Be specific. Format as paragraphs.`;

    case "boardActions":
      return `${base}

COMPLIANCE FLAGS:
${flagSummary || "None"}

Q&A THEMES:
${qaSummary || "None"}

TRANSCRIPT EXCERPT:
${transcript.slice(0, 2000)}

You are a company secretary advising the board. Identify all board-level actions, commitments, and follow-up items arising from this event.

Cover:
1. Explicit commitments made by management (quote them — these become tracked commitments)
2. Board-level disclosures or decisions referenced
3. Regulatory filings triggered by statements made
4. Investor relations follow-up required
5. Items requiring board notification or ratification
6. Governance risk areas surfaced

Format as a clear action register that a company secretary would use. Be specific and actionable.`;

    case "socialMediaPack":
      return `${base}

TRANSCRIPT:
${transcript.slice(0, 2000)}

You are a corporate communications specialist. Create a social media and communications pack based on this event.

Produce:
1. LinkedIn post (150-200 words): Professional announcement of the event results/key messages. Appropriate for a listed company. No specific unverified financial figures.
2. JSE SENS social announcement (100 words): Brief public summary suitable for regulatory publication.
3. Internal stakeholder summary (200 words): For distribution to employees and internal stakeholders.
4. Key messages (5 bullet points): The core messages management wants investors and analysts to take away.

Separate each section with a clear heading. Keep tone professional and appropriate for a listed company.
Do not fabricate financial results not mentioned in the transcript.`;

    case "sensRnsDraft":
      return `${base}

TRANSCRIPT:
${transcript}

COMPLIANCE FLAGS:
${flagSummary || "None"}

You are a specialist in JSE SENS regulatory announcements. Draft a SENS announcement for this event.

The announcement must:
1. Use correct JSE SENS format with all required fields
2. Include: issuer name, announcement type, date, headline, body, contact details placeholder
3. Cover the key material information disclosed during this event
4. Flag any forward-looking statements appropriately (using standard safe harbour language)
5. Be ready for legal review and filing with minimal editing

SENS FORMAT:
---
CURALIVE INTELLIGENCE PLATFORM — [ANNOUNCEMENT TYPE]
[Company Name] (Incorporated in [jurisdiction])
Registration number: [XXXXXX]
JSE share code: [XXX]
ISIN: [XXXXXXXXXX]
("the Company" or "${ctx.company}")

HEADLINE: [Clear, specific headline]

[Body — factual summary of material information disclosed]

[Forward-looking statement disclaimer if applicable]

For further information contact:
[IR Contact Name]
[Title]
[Email]
[Phone]
---

Draft the full announcement. Mark any fields requiring company-specific information with [PLACEHOLDER].`;

    case "boardIntelligence":
      return `${base}

TRANSCRIPT:
${transcript}

You are a corporate governance specialist. Extract board intelligence from this event.

Return a JSON object:
{
  "governanceScore": 75,
  "scoreSummary": "One sentence explaining the score based on: commitment delivery, compliance record, communication quality",
  "commitments": [
    {
      "commitment": "Exact quote of the commitment or forward guidance statement",
      "committedBy": "Name/role of who made the commitment",
      "deadline": "Q3 2026|Year end|etc or null if no deadline stated",
      "type": "guidance|capital|governance|operational"
    }
  ],
  "riskAreas": ["Risk area 1", "Risk area 2"],
  "boardReadiness": "One sentence assessment of board governance communication quality"
}

Governance score guidance:
- 85-100: Excellent — clear commitments, no compliance risk, confident management
- 70-84: Good — minor issues, generally well-managed
- 55-69: Moderate — some compliance risk or communication concerns
- Below 55: Concerns — material compliance risk or poor governance communication

Be specific. Extract actual commitments quoted verbatim. Return ONLY the JSON object.`;

    default:
      return `Analyse this corporate event and provide a summary.\n\nCompany: ${ctx.company}\nEvent: ${ctx.eventName}`;
  }
}

async function saveReport(sessionId: number, session: any, report: any): Promise<void> {
  const reportJson = JSON.stringify(report);
  const eventId = `shadow-${sessionId}`;
  const clientName = session.company ?? session.client_name ?? "Company";
  const eventName = session.event_name ?? "Event";
  const eventType = session.event_type ?? "earnings_call";

  try {
    const transcriptText = report._transcriptText || "Transcript processed by AI Report Pipeline";
    const wordCount = transcriptText.split(/\s+/).filter(Boolean).length;
    await rawSql(
      `INSERT INTO archive_events (event_id, client_name, event_name, event_type, transcript_text, word_count, status, ai_report, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7, 'Generated by AI Report Pipeline')
       ON CONFLICT (event_id) DO UPDATE SET ai_report = $7, status = 'completed'`,
      [eventId, clientName, eventName, eventType, transcriptText, wordCount, reportJson]
    );
    LOG("Report saved to archive_events.ai_report");
  } catch (e) {
    ERR("Failed to save report to archive_events", e);
  }

  try {
    await rawSql(
      `UPDATE shadow_sessions SET status = 'completed' WHERE id = $1`,
      [sessionId]
    );
  } catch {}
}

async function loadTranscript(sessionId: number): Promise<any[]> {
  try {
    const [rows] = await rawSql(
      `SELECT speaker_name, speaker_role, text, start_time
       FROM occ_transcription_segments
       WHERE conference_id = $1
       ORDER BY start_time ASC`,
      [sessionId]
    );
    return rows as any[];
  } catch {
    try {
      const [rows] = await rawSql(
        `SELECT local_transcript_json FROM shadow_sessions WHERE id = $1`,
        [sessionId]
      );
      const raw = (rows as any[])[0]?.local_transcript_json;
      if (raw) {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch {}
    return [];
  }
}

function getModuleFallback(module: ModuleName): any {
  const fallbacks: Record<ModuleName, any> = {
    executiveSummary: {
      verdict: "Executive summary could not be generated for this session. The transcript may be unavailable or too short for analysis.",
      metrics: [
        { value: "—", label: "Confidence" },
        { value: "—", label: "Risk level" },
        { value: "—", label: "Duration" },
        { value: "0", label: "Flags" },
      ],
    },
    criticalActions: [],
    complianceFlags: [],
    financialMetrics: "Financial metrics analysis could not be completed for this session.",
    managementTone: "Management tone analysis could not be completed for this session.",
    qaQuality: "Q&A analysis could not be completed for this session.",
    boardActions: "Board action analysis could not be completed for this session.",
    socialMediaPack: "Social media pack could not be generated for this session.",
    sensRnsDraft: "SENS/RNS draft could not be generated. Please draft manually based on the session transcript.",
    boardIntelligence: {
      governanceScore: 0,
      scoreSummary: "Governance score could not be calculated — transcript unavailable.",
      commitments: [],
      riskAreas: [],
      boardReadiness: "Assessment unavailable.",
    },
  };
  return fallbacks[module];
}
