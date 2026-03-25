import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak,
} from "docx";
import { writeFileSync, readFileSync } from "fs";

const NAVY = "1B2A4A";
const DARK_BLUE = "2C3E6B";
const ACCENT = "3B82F6";
const LIGHT_BG = "F0F4FF";
const WHITE = "FFFFFF";
const BLACK = "000000";
const GREY = "666666";
const DIAGRAM_BG = "F8FAFF";
const DIAGRAM_BORDER = "B0C4DE";

function title(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 52, color: NAVY, font: "Calibri" })],
    spacing: { after: 100 },
    alignment: AlignmentType.CENTER,
  });
}

function subtitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 24, color: GREY, font: "Calibri", italics: true })],
    spacing: { after: 60 },
    alignment: AlignmentType.CENTER,
  });
}

function metaLine(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20, color: NAVY, font: "Calibri" }),
      new TextRun({ text: value, size: 20, color: BLACK, font: "Calibri" }),
    ],
    spacing: { after: 40 },
    alignment: AlignmentType.CENTER,
  });
}

function sectionHeading(number, text) {
  return new Paragraph({
    children: [new TextRun({ text: `${number}. ${text}`, bold: true, size: 28, color: NAVY, font: "Calibri" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: ACCENT } },
  });
}

function subHeading(number, text) {
  return new Paragraph({
    children: [new TextRun({ text: `${number} ${text}`, bold: true, size: 24, color: DARK_BLUE, font: "Calibri" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function subSubHeading(number, text) {
  return new Paragraph({
    children: [new TextRun({ text: `${number} ${text}`, bold: true, size: 22, color: DARK_BLUE, font: "Calibri" })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });
}

function bodyText(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, color: BLACK, font: "Calibri" })],
    spacing: { after: 120 },
  });
}

function boldLabel(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label} `, bold: true, size: 21, color: NAVY, font: "Calibri" }),
      new TextRun({ text: value, size: 20, color: GREY, font: "Calibri", italics: true }),
    ],
    spacing: { after: 80 },
  });
}

function bulletPoint(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 21, color: BLACK, font: "Calibri" })],
    bullet: { level },
    spacing: { after: 60 },
    indent: { left: 360 + level * 360 },
  });
}

function numberedItem(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 21, color: ACCENT, font: "Calibri" }),
      new TextRun({ text, size: 21, color: BLACK, font: "Calibri" }),
    ],
    spacing: { after: 80 },
    indent: { left: 360 },
  });
}

function claimBullet(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: "- ", bold: true, size: 21, color: ACCENT, font: "Calibri" }),
      new TextRun({ text, size: 21, color: BLACK, font: "Calibri" }),
    ],
    spacing: { after: 60 },
    indent: { left: 360 },
    shading: { type: ShadingType.SOLID, color: LIGHT_BG },
  });
}

function divider() {
  return new Paragraph({
    children: [new TextRun({ text: "" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
    spacing: { before: 200, after: 200 },
  });
}

function makeTableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({
          text,
          bold: isHeader,
          size: isHeader ? 20 : 19,
          color: isHeader ? WHITE : BLACK,
          font: "Calibri",
        })],
        spacing: { after: 40 },
      })],
      shading: isHeader ? { type: ShadingType.SOLID, color: NAVY } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
    })),
  });
}

function makeTable(headers, rows) {
  return new Table({
    rows: [
      makeTableRow(headers, true),
      ...rows.map(r => makeTableRow(r)),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function diagramTitle(figNum, title) {
  return new Paragraph({
    children: [
      new TextRun({ text: `Figure ${figNum}: `, bold: true, size: 22, color: ACCENT, font: "Calibri" }),
      new TextRun({ text: title, bold: true, size: 22, color: NAVY, font: "Calibri" }),
    ],
    spacing: { before: 300, after: 120 },
    alignment: AlignmentType.CENTER,
  });
}

function diagramLine(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: "Courier New", color: DARK_BLUE })],
    spacing: { after: 0 },
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: DIAGRAM_BG },
  });
}

function diagramBlock(lines) {
  return lines.map(l => diagramLine(l));
}

function claimParagraph(claimId, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: `${claimId}: `, bold: true, size: 21, color: NAVY, font: "Calibri" }),
      new TextRun({ text, size: 21, color: BLACK, font: "Calibri" }),
    ],
    spacing: { after: 160 },
    shading: { type: ShadingType.SOLID, color: LIGHT_BG },
    border: { left: { style: BorderStyle.SINGLE, size: 4, color: ACCENT } },
    indent: { left: 200 },
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 21 } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1200, bottom: 1000, left: 1200, right: 1200 },
      },
    },
    children: [
      // ── COVER PAGE ──
      new Paragraph({ spacing: { before: 2000 } }),
      title("CuraLive Platform"),
      new Paragraph({
        children: [new TextRun({ text: "Patent Submission Brief", size: 36, color: ACCENT, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Continuation-in-Part (CIP) — Modules 1–18", size: 28, color: DARK_BLUE, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "────────────────────────────────────", size: 20, color: "CCCCCC" })],
        alignment: AlignmentType.CENTER, spacing: { after: 400 },
      }),
      metaLine("Document Classification", "Confidential — Patent Filing Support Material"),
      metaLine("Prepared", "18 March 2026"),
      metaLine("Applicant", "CuraLive (Pty) Ltd"),
      metaLine("Inventors", "David Cameron et al."),
      metaLine("Filing Jurisdiction", "South Africa (CIPC), with PCT international phase intended"),
      metaLine("Production URL", "https://curalive-platform.replit.app"),
      metaLine("GitHub Repository", "github.com/davecameron187-sys/curalive-platform"),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        children: [new TextRun({
          text: "\"Integrated Real-Time Investor Event Intelligence Platform with Autonomous AI Moderation, Self-Evolving Machine Learning, Multi-Modal Compliance Monitoring, and Cryptographic Event Certification\"",
          italics: true, size: 22, color: DARK_BLUE, font: "Calibri",
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({ spacing: { before: 200 } }),
      bodyText("Cross-Reference to Related Applications:"),
      makeTable(["Application ID", "Filing Date", "Status", "Scope"], [
        ["1773575338868", "Mar 12, 2026", "Filed", "Live Event Intelligence Platform"],
        ["1773632651890", "Mar 14, 2026", "Filed", "AI Self-Evolution Engine (Module M)"],
        ["1773675815272", "Mar 16, 2026", "Filed", "Specialized Event Analysis"],
        ["1773777427429", "Mar 18, 2026", "Filed", "CIP (Modules 1-6)"],
      ]),

      pageBreak(),

      // ── 1. TITLE ──
      sectionHeading("1", "TITLE OF INVENTION"),
      bodyText("\"Integrated Real-Time Investor Event Intelligence Platform with Autonomous AI Moderation, Self-Evolving Machine Learning, Multi-Modal Compliance Monitoring, and Cryptographic Event Certification\""),

      // ── 2. FIELD ──
      sectionHeading("2", "FIELD OF THE INVENTION"),
      bodyText("The present invention relates to financial technology and investor relations platforms. More particularly, the invention relates to an integrated system and method for conducting, monitoring, analysing, and generating intelligence from live investor events — including earnings calls, Annual General Meetings (AGMs), capital markets days, and webcasts — using real-time artificial intelligence, autonomous moderation, multi-carrier telephony, self-evolving machine learning algorithms, and cryptographic event certification."),

      // ── 3. BACKGROUND ──
      sectionHeading("3", "BACKGROUND AND PROBLEM STATEMENT"),
      bodyText("Existing investor relations platforms provide basic webcasting and audio conferencing. They lack:"),
      numberedItem("1", "Real-time AI intelligence — No existing platform fuses live transcription, sentiment analysis, evasiveness detection, market impact forecasting, and compliance monitoring into a single unified pipeline."),
      numberedItem("2", "Autonomous moderation for regulated events — Current systems require manual human moderation with no autonomous, regulation-aware intervention."),
      numberedItem("3", "Self-improving AI without human labelling — No investor event platform implements autonomous quality scoring, evidence decay, and self-proposal of new AI capabilities."),
      numberedItem("4", "Shadow intelligence from third-party platforms — No system deploys silent AI agents into Zoom, Teams, or Webex to extract intelligence without integration."),
      numberedItem("5", "Multi-modal compliance fusion — No platform combines text, tone, and behavioural pattern detection into a single compliance risk score."),
      numberedItem("6", "Real-time materiality detection — No tool performs live MNPI scoring with auto-drafted regulatory filings during the call."),
      numberedItem("7", "Investor intent decoding — No live system decodes investor psychology with persistent memory graph during calls."),
      numberedItem("8", "Cross-event consistency tracking — No tool maintains cross-event messaging memory at scale with pre-emptive correction."),
      numberedItem("9", "Live volatility simulation — No system simulates forward market outcomes using partial live transcript data."),
      numberedItem("10", "Cryptographic event certification — No live event platform issues immutable, regulatory-grade integrity certificates."),

      // ── 4. SUMMARY ──
      sectionHeading("4", "SUMMARY OF THE INVENTION"),
      bodyText("CuraLive is a comprehensive real-time investor event intelligence platform comprising 18 novel interconnected subsystems:"),
      new Paragraph({ spacing: { after: 100 } }),
      makeTable(
        ["#", "Subsystem", "Novel Capability"],
        [
          ["1", "Shadow Bridge & Silent Intelligence", "Passive AI agent injection into third-party meetings"],
          ["2", "AI Automated Moderator (aiAm)", "Autonomous regulation-aware event moderation with kill-switch"],
          ["3", "Module M — Self-Evolution Engine", "Zero-human-input AI self-improvement with evidence decay"],
          ["4", "Intelligence Suite — 11 AI Algorithms", "Evasiveness, market impact, compliance, sentiment, briefings + 6 CIP modules"],
          ["5", "Operator Control Console (OCC)", "Real-time multi-participant conference management"],
          ["6", "Webcasting Engine", "End-to-end event lifecycle with RTMP/HLS/WebRTC"],
          ["7", "Multi-Carrier Telephony", "Dual-carrier (Twilio/Telnyx) with autonomous failover"],
          ["8", "Adaptive Intelligence Thresholds", "Operator-to-AI feedback loop with dynamic calibration"],
          ["9", "Autonomous Intervention Engine", "Real-time signal monitoring with automated corrective actions"],
          ["10", "Health Guardian", "AI-powered infrastructure monitoring with root cause attribution"],
          ["11", "EventEchoPipeline", "Compliance-aware automated content transformation"],
          ["12", "Enterprise Security Architecture", "Zero Trust, RBAC, immutable audit chain, threat hunting"],
          ["13", "Materiality Risk Oracle (CIP)", "MNPI detection + auto-drafted SENS/8-K filings + OCC approval"],
          ["14", "Investor Intention Decoder (CIP)", "Hidden agenda detection via investor graph + multi-agent LLM"],
          ["15", "Cross-Event Consistency Guardian (CIP)", "Vector store of statements + live contradiction scoring"],
          ["16", "Predictive Volatility Simulator (CIP)", "Monte-Carlo simulations refreshed every 30s"],
          ["17", "Regulatory Intervention Engine (CIP)", "RL from regulatory outcomes for self-evolving compliance"],
          ["18", "Event Integrity Digital Twin (CIP)", "SHA-256 hash chain + Clean Disclosure Certificate"],
        ]
      ),

      pageBreak(),

      // ── 5. DETAILED DESCRIPTIONS ──
      sectionHeading("5", "DETAILED DESCRIPTION OF IMPLEMENTED SUBSYSTEMS"),

      // 5.1 Shadow Bridge
      subHeading("5.1", "Shadow Bridge — Silent Intelligence Deployment"),
      boldLabel("Implementation:", "server/routers/shadowModeRouter.ts, server/webhooks/recallWebhook.ts"),
      numberedItem("1", "Operator provides a meeting URL (Zoom, Teams, Google Meet, Webex) or a PSTN conference bridge number."),
      numberedItem("2", "The system deploys a named AI agent (via Recall.ai API) that joins as a silent participant."),
      numberedItem("3", "Real-time audio is captured and streamed through the transcription pipeline."),
      numberedItem("4", "The Shadow Session mirrors the live event, enabling parallel AI analysis without disrupting the original meeting."),
      numberedItem("5", "All intelligence is extracted passively — the third-party platform requires no integration or awareness."),
      claimBullet("Method for deploying a silent AI participant into third-party video conferencing for real-time intelligence extraction."),
      claimBullet("System for creating a parallel Shadow Session that mirrors a live event for secondary AI analysis."),
      claimBullet("PSTN Shadow Bridge enabling intelligence extraction from legacy audio-only conference calls."),
      divider(),

      // 5.2 aiAm
      subHeading("5.2", "AI Automated Moderator (aiAm)"),
      boldLabel("Implementation:", "server/_core/aiAmAutoMuting.ts, server/routers/aiAm.ts, server/_core/aiAmAuditTrail.ts"),
      numberedItem("1", "Real-time transcription segments are analysed by a multi-agent AI pipeline (Compliance, IR, Toxicity agents)."),
      numberedItem("2", "Agents fire in deterministic sequence — Compliance first, then IR, then Toxicity."),
      numberedItem("3", "The system can autonomously mute speakers, redact content, and dispatch alerts."),
      numberedItem("4", "Every action generates a cryptographically chained audit trail entry (SHA-256 hash linking)."),
      claimBullet("Multi-agent AI moderation with deterministic sequential firing for regulated financial events."),
      claimBullet("Autonomous speaker muting triggered by real-time compliance violation detection."),
      claimBullet("Immutable, cryptographically chained audit trail for AI-driven moderation actions."),
      divider(),

      // 5.3 Module M
      subHeading("5.3", "Module M — Self-Evolution Engine"),
      boldLabel("Implementation:", "server/services/AiEvolutionService.ts"),
      numberedItem("1", "Continuously scores its own AI outputs across: Depth, Breadth, and Specificity."),
      numberedItem("2", "Exponential time-decay function (14-day half-life) prioritises current, recurring gaps."),
      numberedItem("3", "Autonomously proposes new capabilities through 5-stage lifecycle: Emerging → Proposed → Approved → Building → Live."),
      numberedItem("4", "Writes its own prompts and tool definitions for newly proposed capabilities."),
      claimBullet("Zero-human-input AI self-improvement pipeline for investor event intelligence."),
      claimBullet("Evidence decay function with configurable half-life for prioritising current AI weaknesses."),
      claimBullet("Autonomous capability proposal pipeline with confidence-gated stage transitions."),
      divider(),

      pageBreak(),

      // 5.4 Intelligence Suite (original 5)
      subHeading("5.4", "Intelligence Suite — Original Five AI Algorithms"),
      bodyText("The Intelligence Suite comprises 11 total AI algorithms: the original 5 detailed below (5.4.1–5.4.5), plus 6 CIP modules detailed in Sections 5.13–5.18. All share a unified frontend and common tRPC/database architecture."),
      boldLabel("Implementation:", "11 service modules + 11 tRPC routers + 11 database tables + unified frontend"),

      subSubHeading("5.4.1", "Evasive Answer Detection"),
      boldLabel("Files:", "server/services/EvasiveAnswerDetectionService.ts, server/routers/evasiveAnswerRouter.ts"),
      numberedItem("1", "Accepts Q&A exchange pair (analyst question + executive response) with speaker role context."),
      numberedItem("2", "Analyses across: hedging language, topic shift, temporal deflection, authority deflection, jargon flooding, non-answer patterns."),
      numberedItem("3", "Produces Directness Index (0-100) and Evasiveness Score (0.000-1.000). Supports batch analysis."),
      claimBullet("NLP-based evasiveness scoring calibrated for executive responses during regulated investor events."),

      subSubHeading("5.4.2", "Predictive Market Impact Forecasting"),
      boldLabel("Files:", "server/services/MarketImpactPredictorService.ts, server/routers/marketImpactPredictorRouter.ts"),
      numberedItem("1", "Ingests sentiment scores, topic keywords, evasiveness data, and transcript excerpts."),
      numberedItem("2", "Predicts: Volatility (0-10), Direction, Confidence, Time Horizon, Risk Factors, Catalysts."),
      claimBullet("Real-time market impact prediction from live investor event signals using LLM reasoning."),

      subSubHeading("5.4.3", "Multi-Modal Compliance Risk Scoring"),
      boldLabel("Files:", "server/services/MultiModalComplianceService.ts, server/routers/multiModalComplianceRouter.ts"),
      numberedItem("1", "Fuses three modalities: Text Risk, Tone Risk, Behavioural Risk into composite score."),
      numberedItem("2", "Detects selective disclosure, insider trading indicators, forward-looking statement violations."),
      numberedItem("3", "Multi-jurisdictional: JSE (SA), SEC (US), FCA (UK)."),
      claimBullet("Multi-modal compliance risk scoring fusing text, tone, and behavioural signals."),

      subSubHeading("5.4.4", "Real-Time External Sentiment Aggregation"),
      boldLabel("Files:", "server/services/ExternalSentimentService.ts, server/routers/externalSentimentRouter.ts"),
      numberedItem("1", "Synthesises external market signals: Social Mention Count, Crowd Reaction, Divergence from Call, Early Warnings."),
      claimBullet("Divergence computation between internal event sentiment and external market/social sentiment."),

      subSubHeading("5.4.5", "Personalised IR Briefing Generation (RAG Pipeline)"),
      boldLabel("Files:", "server/services/PersonalizedBriefingService.ts, server/routers/personalizedBriefingRouter.ts"),
      numberedItem("1", "Accepts stakeholder type (CEO, CFO, IR Head, Board, Analyst, Compliance, Investor)."),
      numberedItem("2", "Generates role-specific briefings with: Executive Summary, Key Findings, Risk Alerts, Action Items."),
      claimBullet("RAG-based personalised briefing generation producing role-specific intelligence reports."),

      divider(),
      pageBreak(),

      // ── 5.13-5.18: SIX CIP MODULES ──
      new Paragraph({
        children: [new TextRun({ text: "CIP MODULES 13–18", bold: true, size: 32, color: ACCENT, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Continuation-in-Part additions to CIPC filings of March 12–18, 2026", size: 22, color: GREY, font: "Calibri", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),

      // 5.13 Materiality Risk Oracle
      subHeading("5.13", "Real-Time Materiality Risk Oracle (CIP Module 1)"),
      boldLabel("Implementation:", "server/services/MaterialityRiskOracleService.ts, server/routers/materialityRiskRouter.ts"),
      boldLabel("DB Table:", "materiality_risk_logs"),
      bodyText("Purpose: Detect material non-public information (MNPI) disclosure in real-time during live earnings calls."),
      numberedItem("1", "Continuously ingests audio transcription and scores every executive statement for MNPI risk."),
      numberedItem("2", "Parallel NLP pipeline: evasion model + materiality classifier trained on historical SEC enforcement actions, JSE queries, FCA outcomes."),
      numberedItem("3", "When materiality score exceeds threshold, auto-generates draft SENS/8-K/RNS regulatory filing using RAG over issuer's prior filings."),
      numberedItem("4", "Draft filing, risk score, MNPI indicators, and suggested corrective language published via Ably pub/sub to OCC with one-click approval."),
      numberedItem("5", "Multi-jurisdictional: SEC Reg FD, JSE Listings Requirements 3.4, FCA MAR, EU MAR."),
      numberedItem("6", "All flagged statements logged to materiality_risk_logs with full audit trail."),
      bodyText("Novel Elements:"),
      claimBullet("No existing tool performs real-time materiality scoring + auto-drafting + live operator intervention during the call."),
      claimBullet("Parallel evasion NLP + materiality classifier + RAG over issuer filings + Ably pub/sub alert to OCC."),
      claimBullet("Auto-generation of jurisdiction-specific regulatory filings (SENS/8-K/RNS) in real-time."),
      divider(),

      // 5.14 Investor Intention Decoder
      subHeading("5.14", "Investor Intention Decoder (CIP Module 2)"),
      boldLabel("Implementation:", "server/services/InvestorIntentionDecoderService.ts, server/routers/investorIntentRouter.ts"),
      boldLabel("DB Table:", "investor_intent_logs"),
      bodyText("Purpose: Analyse investor questions for underlying intent using linguistic patterns and historical behaviour graph."),
      numberedItem("1", "Multi-agent LLM ensemble classifies each question against 8 investor archetypes: ACTIVIST_PRESSURE, SHORT_SELLER_SIGNAL, RETAIL_CONFUSION, ANALYST_FISHING, SUPPORTIVE_SHAREHOLDER, COMPETITOR_INTELLIGENCE, REGULATORY_PROBE, LITIGATION_SETUP."),
      numberedItem("2", "Dynamic graph database stores vector embeddings of historical questions per investor for longitudinal analysis."),
      numberedItem("3", "Displays Intent Profile badges in Q&A queue with aggression scores (0-100)."),
      numberedItem("4", "Predicts follow-up questions and recommends response strategies for management."),
      numberedItem("5", "Detects linguistic patterns: loaded questions, false premises, fishing for unreleased data, building legal documentary evidence."),
      bodyText("Novel Elements:"),
      claimBullet("No live system decodes investor psychology/intent with persistent memory graph during calls."),
      claimBullet("Dynamic graph database of investor-question vectors + multi-agent LLM ensemble per archetype."),
      claimBullet("Real-time intent badge + aggression score delivery via pub/sub to operator Q&A queue."),
      divider(),

      // 5.15 Cross-Event Consistency Guardian
      subHeading("5.15", "Cross-Event Consistency Guardian (CIP Module 3)"),
      boldLabel("Implementation:", "server/services/CrossEventConsistencyService.ts, server/routers/crossEventConsistencyRouter.ts"),
      boldLabel("DB Table:", "consistency_check_logs"),
      bodyText("Purpose: Track every executive statement across all prior events in real-time and flag contradictions."),
      numberedItem("1", "Maintains persistent vector store of every executive statement across prior events (current call + prior quarters + peer companies)."),
      numberedItem("2", "Real-time similarity/contradiction scoring on each new utterance against historical corpus."),
      numberedItem("3", "Contradictions flagged with severity levels (critical/high/medium/low) and confidence scores."),
      numberedItem("4", "RAG-powered corrective language generated and surfaced to OCC console before executive completes response."),
      numberedItem("5", "Cross-references against: SEC Rule 10b5-1, Regulation FD, JSE Listing Requirements, GDPR."),
      numberedItem("6", "Messaging drift analysis tracks evolution of executive messaging over time."),
      bodyText("Novel Elements:"),
      claimBullet("No live tool maintains cross-event messaging memory at scale with pre-emptive correction."),
      claimBullet("Proactive correction surfaced before response completion — not post-event analysis."),
      claimBullet("Investigation risk scoring for potential regulatory inquiry triggers."),
      divider(),

      pageBreak(),

      // 5.16 Predictive Volatility Simulator
      subHeading("5.16", "Predictive Volatility Simulator (CIP Module 4)"),
      boldLabel("Implementation:", "server/services/VolatilitySimulatorService.ts, server/routers/volatilitySimulatorRouter.ts"),
      boldLabel("DB Table:", "volatility_simulations"),
      bodyText("Purpose: Run real-time Monte-Carlo simulations predicting short-term stock price impact during live calls."),
      numberedItem("1", "While the call is live, runs 100+ micro-simulations using Monte-Carlo methods based on partial transcript data, sentiment vectors, and guidance tone."),
      numberedItem("2", "Continuously updated LSTM/transformer time-series model produces probability distributions of price impact."),
      numberedItem("3", "Three forecast scenarios: Base Case, Bull Case, Bear Case — each with price move %, probability, and drivers."),
      numberedItem("4", "Produces 95% confidence interval for expected price movement and trading desk recommendation."),
      numberedItem("5", "Simulations refresh every 30 seconds as new transcript data arrives."),
      numberedItem("6", "Alternative phrasing engine suggests lower-volatility wording while maintaining semantic equivalence."),
      bodyText("Novel Elements:"),
      claimBullet("No system simulates forward market outcomes in real time using partial live transcript data."),
      claimBullet("Monte-Carlo simulations refreshed every 30 seconds using live-updated time-series model."),
      claimBullet("Alternative phrasing engine for volatility reduction with semantic equivalence."),
      divider(),

      // 5.17 Autonomous Regulatory Intervention Engine
      subHeading("5.17", "Autonomous Regulatory Intervention Engine (CIP Module 5)"),
      boldLabel("Implementation:", "server/services/RegulatoryInterventionService.ts, server/routers/regulatoryInterventionRouter.ts"),
      boldLabel("DB Table:", "regulatory_evolution_logs"),
      bodyText("Purpose: Self-evolving compliance engine using reinforcement learning from regulatory outcomes."),
      numberedItem("1", "Closed-loop reinforcement learning pipeline ingests post-event regulatory outcomes: SEC comment letters, JSE queries, enforcement actions."),
      numberedItem("2", "Autonomously adjusts detection thresholds, classifier parameters, and response templates based on historical outcomes."),
      numberedItem("3", "Proposes classifier updates with expected improvement metrics and deployment recommendations."),
      numberedItem("4", "Operates through 5 evolution stages: Observing → Learning → Adapting → Calibrated → Autonomous."),
      numberedItem("5", "Generates jurisdiction-specific response templates as regulatory landscape evolves."),
      numberedItem("6", "Deploys updated models before next issuer event — no human retraining required."),
      numberedItem("7", "Tracks false positive reduction metrics across evolution cycles."),
      bodyText("Novel Elements:"),
      claimBullet("Self-evolving agents exist in research; none applied to live investor comms with regulatory feedback loops."),
      claimBullet("Closed-loop reinforcement learning with regulatory outcomes as training signals."),
      claimBullet("Autonomous deployment of updated models before next event with confidence-gated stages."),
      divider(),

      // 5.18 Event Integrity Digital Twin
      subHeading("5.18", "Event Integrity Digital Twin & Certificate (CIP Module 6)"),
      boldLabel("Implementation:", "server/services/EventIntegrityTwinService.ts, server/routers/eventIntegrityRouter.ts"),
      boldLabel("DB Table:", "event_integrity_twins"),
      bodyText("Purpose: Create immutable digital twin with blockchain-verified Clean Disclosure Certificate."),
      numberedItem("1", "Creates a live digital twin of the entire event: transcript segments, sentiment scores, compliance scores, operator actions."),
      numberedItem("2", "Each segment cryptographically linked using SHA-256 hash chaining — each hash includes the prior segment's hash, creating immutable chain of custody."),
      numberedItem("3", "At event conclusion, generates comprehensive integrity assessment:"),
      bulletPoint("Integrity Score (0-1.000)"),
      bulletPoint("Certificate Grade: AAA | AA | A | BBB | BB | B | CCC | NR"),
      bulletPoint("Disclosure Completeness percentage"),
      bulletPoint("Regulatory Compliance rating"),
      bulletPoint("Consistency Rating across all segments"),
      numberedItem("4", "Formal \"Clean Disclosure Certificate\" generated — suitable for publication to investors, exchanges, and regulatory bodies."),
      numberedItem("5", "Certificate includes twin hash, genesis hash, final hash, and chain length for independent verification."),
      numberedItem("6", "All certificates logged to event_integrity_twins with full cryptographic proof."),
      bodyText("Novel Elements:"),
      claimBullet("No live event platform issues real-time, immutable regulatory-grade integrity certificates."),
      claimBullet("Cryptographic hash chain of every segment + final certificate publication."),
      claimBullet("Certificate grades (AAA-NR) based on disclosure completeness, regulatory compliance, and messaging consistency."),

      divider(),
      pageBreak(),

      // ── 5.5-5.12 (Remaining original subsystems — abbreviated) ──
      subHeading("5.5", "Operator Control Console (OCC)"),
      boldLabel("Implementation:", "client/src/pages/OCC.tsx, server/db.occ.ts, server/routers/occ.ts"),
      numberedItem("1", "Real-time management of multi-participant conference calls with sub-second Ably pub/sub updates."),
      numberedItem("2", "Manages Q&A queues with operator-controlled participant promotion/demotion."),
      numberedItem("3", "Integrates with AI Automated Moderator and all CIP module alerts."),
      numberedItem("4", "Participant Lounge system for managing waiting callers."),
      claimBullet("Integrated operator console combining conferencing management with AI-powered moderation for regulated investor events."),
      divider(),

      subHeading("5.6", "Webcasting Engine"),
      boldLabel("Implementation:", "server/routers/webcastRouter.ts, server/routers/muxRouter.ts"),
      numberedItem("1", "6-step creation wizard: Event Type → Details → Branding → Agenda → Registration → AI Applications."),
      numberedItem("2", "RTMP ingest via Mux with HLS playback. Multi-language real-time translation (9+ languages)."),
      numberedItem("3", "Post-event: on-demand playback with chapters, searchable transcripts, CME/CPD certificates."),
      claimBullet("End-to-end investor event lifecycle engine with integrated AI intelligence at every stage."),
      divider(),

      subHeading("5.7", "Multi-Carrier Telephony with Autonomous Failover"),
      boldLabel("Implementation:", "server/webphone/carrierManager.ts, server/services/ConferenceDialoutService.ts"),
      numberedItem("1", "Dual-carrier architecture: Twilio (primary) + Telnyx (secondary) with health-based switching."),
      numberedItem("2", "Conference Dial-Out supports up to 200 participants per session."),
      claimBullet("Autonomous multi-carrier telephony failover for investor event conferencing."),
      divider(),

      subHeading("5.8", "Adaptive Intelligence Thresholds"),
      numberedItem("1", "Operator corrections captured as weighted training signals; system calculates Learned Value blending defaults with feedback."),
      numberedItem("2", "Maturity stages: Learning → Adapting → Calibrated → Self-Evolving with automatic progression."),
      claimBullet("Operator-to-AI feedback loop with dynamic threshold recalibration and maturity stage progression."),
      divider(),

      subHeading("5.9", "Autonomous Intervention Engine"),
      bodyText("Monitors 6+ real-time signal categories: Sentiment Drop, Q&A Overload, Compliance Breach, Speaker Pace Anomaly, Engagement Collapse, Technical Quality Degradation. Autonomously executes corrective actions with FINRA/JSE-compliant audit logging."),
      claimBullet("Autonomous real-time intervention monitoring multi-dimensional signals with corrective action."),
      divider(),

      subHeading("5.10", "Health Guardian — AI Infrastructure Monitor"),
      bodyText("Monitors 6+ services: Database, AI Engine, Telephony, Webcasting, Real-time Messaging, Transcription. AI-powered root cause analysis with platform-vs-participant attribution intelligence."),
      claimBullet("AI infrastructure monitoring with attribution intelligence for SLA dispute resolution."),
      divider(),

      subHeading("5.11", "EventEchoPipeline — Compliance-Aware Content Transformation"),
      bodyText("Captures live event signals and transforms into platform-optimised content (LinkedIn, Twitter/X, press releases). Regulatory Speech Guarding ensures no forward-looking statements, MNPI, or selective disclosure violations."),
      claimBullet("Compliance-aware social content generation enforcing regulatory speech guardrails."),
      divider(),

      subHeading("5.12", "Enterprise Security Architecture"),
      bodyText("Zero Trust Architecture — Device posture monitoring, microsegmentation, continuous authentication with MFA."),
      bodyText("RBAC — Admin → Operator → User hierarchy with granular router-level permissions."),
      bodyText("Immutable Audit Chain — SHA-256 hash-based integrity verification with chain of custody linking."),
      bodyText("SOC 2 Type II + ISO 27001 control monitoring with AI-generated remediation roadmaps."),

      pageBreak(),

      // ── 6. PARTNER INTEGRATIONS ──
      sectionHeading("6", "PARTNER INTEGRATION ARCHITECTURE"),

      subHeading("6.1", "Bastion Capital Partners Integration"),
      boldLabel("Implementation:", "server/services/BastionBookingService.ts, server/services/BastionInvestorAiService.ts"),
      bulletPoint("AI-Powered Investor Match Engine — Multi-dimensional scoring across sector alignment, investment style, cheque size, and strategic fit."),
      bulletPoint("Roadshow Optimizer — Generates optimal multi-city schedules maximising high-probability investor meetings."),
      bulletPoint("Full booking lifecycle: create, approve, execute, cancel."),
      divider(),

      subHeading("6.2", "Lumi Global Integration"),
      boldLabel("Implementation:", "server/services/LumiBookingService.ts"),
      bulletPoint("AGM-specific governance: proxy voting, director elections, resolution management with quorum tracking."),
      bulletPoint("Digital voting with real-time results and audit trail."),
      bulletPoint("Regulatory compliance for Companies Act 71 of 2008 (South Africa) and JSE Listings Requirements."),

      pageBreak(),

      // ── 7. BILLING ──
      sectionHeading("7", "ENTERPRISE BILLING ENGINE"),
      bodyText("Usage-based pricing engine with 4 tiers: Starter (R4,999/mo), Professional (R14,999/mo), Enterprise (R29,999/mo), Ultimate (R49,999/mo). Real-time usage tracking across 10 dimensions: events, attendees, transcription minutes, AI analyses, shadow sessions, recordings, compliance reports, operator seats, API calls, storage."),

      pageBreak(),

      // ═══ FIGURES AND DIAGRAMS ═══
      sectionHeading("8", "FIGURES AND DIAGRAMS"),

      // Figure 1: Overall System Architecture
      diagramTitle(1, "Overall System Architecture — Data Flow Through Core Intelligence Pipeline"),
      ...diagramBlock([
        "┌─────────────────────────────────────────────────────────────┐",
        "│              Live Audio Stream                              │",
        "│     Zoom / Teams / Webex / RTMP / PSTN                     │",
        "└────────────────────────┬────────────────────────────────────┘",
        "                         │",
        "                         ▼",
        "┌─────────────────────────────────────────────────────────────┐",
        "│          Recall.ai Transcription Engine (<1s latency)       │",
        "└────────────────────────┬────────────────────────────────────┘",
        "                         │",
        "                         ▼",
        "┌─────────────────────────────────────────────────────────────┐",
        "│       Parallel Processing Layer (Ably Pub/Sub)              │",
        "│       Real-Time Message Distribution                        │",
        "└───┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬──────┘",
        "    │    │    │    │    │    │    │    │    │    │    │",
        "    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼",
        " ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐",
        " │Evas││Mkt ││Comp││Sent││Brief││Mat'l││Intent││Cons││Vol ││Reg ││Twin│",
        " │Dtct││Impt││Risk││Aggt││Gen  ││Risk ││Decdr ││Grd ││Sim ││Eng ││Cert│",
        " └──┬─┘└──┬─┘└──┬─┘└──┬─┘└──┬─┘└──┬─┘└──┬──┘└──┬┘└──┬┘└──┬┘└──┬┘",
        "    │     │     │     │     │     │     │      │    │    │    │",
        "    └─────┴─────┴─────┴─────┴─────┼─────┴──────┴────┴────┘    │",
        "                                  │                           │",
        "                                  ▼                           ▼",
        "                    ┌──────────────────────┐   ┌──────────────────┐",
        "                    │  OCC Operator Console │   │  Blockchain      │",
        "                    │  One-Click Actions    │   │  Certificate     │",
        "                    │  Real-Time Alerts     │   │  (Ethereum)      │",
        "                    └──────────┬───────────┘   └──────────────────┘",
        "                               │",
        "                               ▼",
        "                    ┌──────────────────────┐",
        "                    │  Audit Trail DB      │",
        "                    │  (MySQL + SHA-256)    │",
        "                    └──────────────────────┘",
      ]),

      pageBreak(),

      // Figure 2: Shadow Bridge
      diagramTitle(2, "Shadow Bridge — Silent Intelligence Deployment"),
      ...diagramBlock([
        "┌──────────────────┐     ┌──────────────────┐",
        "│  Operator enters │     │  Third-Party      │",
        "│  meeting URL or  │────▶│  Meeting          │",
        "│  PSTN number     │     │  (Zoom/Teams)     │",
        "└────────┬─────────┘     └────────┬──────────┘",
        "         │                         │",
        "         ▼                         ▼",
        "┌──────────────────┐     ┌──────────────────┐",
        "│  Deploy Silent   │     │  Silent Agent     │",
        "│  AI Agent via    │────▶│  Joins Meeting    │",
        "│  Recall.ai API   │     │  (no disruption)  │",
        "└────────┬─────────┘     └────────┬──────────┘",
        "         │                         │",
        "         └────────────┬────────────┘",
        "                      ▼",
        "         ┌──────────────────────┐",
        "         │  Audio Stream        │",
        "         │  → Transcription     │",
        "         │  → Intelligence      │",
        "         │  → Shadow Session    │",
        "         └──────────────────────┘",
      ]),
      divider(),

      // Figure 3: Module M
      diagramTitle(3, "Module M — Self-Evolution Lifecycle"),
      ...diagramBlock([
        "┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐",
        "│ EMERGING  │───▶│ PROPOSED  │───▶│ APPROVED  │───▶│ BUILDING  │───▶│   LIVE    │",
        "│           │    │           │    │           │    │           │    │           │",
        "│ Evidence  │    │ Confidence│    │ Auto-     │    │ Self-     │    │ Active in │",
        "│ accumul-  │    │ threshold │    │ promoted  │    │ writes    │    │ production│",
        "│ ation     │    │ met       │    │ if met    │    │ prompts   │    │ pipeline  │",
        "└───────────┘    └───────────┘    └───────────┘    └───────────┘    └───────────┘",
        "",
        "         ▲ Evidence Decay Function: w(t) = e^(-λ·t),  λ = ln(2)/14 days",
        "         │",
        "┌────────┴────────────────────────────────────────────────────┐",
        "│  Quality Scoring: Depth × Breadth × Specificity            │",
        "│  Continuous self-assessment of all AI outputs               │",
        "└────────────────────────────────────────────────────────────┘",
      ]),
      divider(),

      // Figure 4: Intelligence Suite Pipeline
      diagramTitle(4, "Intelligence Suite — 11-Algorithm Pipeline"),
      ...diagramBlock([
        "                    Live Transcript Stream",
        "                           │",
        "              ┌────────────┼────────────┐",
        "              ▼            ▼            ▼",
        "    ┌──────────────┐ ┌──────────┐ ┌──────────────┐",
        "    │ Original 5   │ │ CIP 6    │ │ Cross-Input  │",
        "    │ Algorithms   │ │ Modules  │ │ Fusion Layer │",
        "    ├──────────────┤ ├──────────┤ ├──────────────┤",
        "    │ 1. Evasive   │ │ 6. MNPI  │ │ Combines all │",
        "    │ 2. Mkt Impct │ │ 7. Intent│ │ signals for  │",
        "    │ 3. Complianc │ │ 8. Consis│ │ RAG briefing │",
        "    │ 4. Ext Sent  │ │ 9. Vol   │ │ generation   │",
        "    │ 5. Briefings │ │10. Reg   │ │              │",
        "    │              │ │11. Twin  │ │              │",
        "    └──────┬───────┘ └────┬─────┘ └──────┬───────┘",
        "           └──────────────┼──────────────┘",
        "                          ▼",
        "              ┌──────────────────────┐",
        "              │  OCC Dashboard       │",
        "              │  Unified Intelligence │",
        "              └──────────────────────┘",
      ]),

      pageBreak(),

      // Figure 5: Multi-Modal Compliance Fusion
      diagramTitle(5, "Multi-Modal Compliance Risk Scoring"),
      ...diagramBlock([
        "┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐",
        "│   TEXT RISK      │  │   TONE RISK      │  │ BEHAVIOURAL     │",
        "│                  │  │                  │  │   RISK           │",
        "│ • Keyword scan   │  │ • Vocal stress   │  │ • Topic avoidnce│",
        "│ • FLS detection  │  │ • Pace anomaly   │  │ • Authority defl│",
        "│ • MNPI triggers  │  │ • Confidence     │  │ • Jargon flood  │",
        "│ Score: 0-100     │  │ Score: 0-100     │  │ Score: 0-100    │",
        "└────────┬────────┘  └────────┬────────┘  └────────┬────────┘",
        "         │                    │                     │",
        "         └────────────────────┼─────────────────────┘",
        "                              ▼",
        "                ┌──────────────────────┐",
        "                │  COMPOSITE RISK      │",
        "                │  SCORE (0.000-1.000) │",
        "                │                      │",
        "                │  Jurisdictions:       │",
        "                │  JSE | SEC | FCA     │",
        "                └──────────────────────┘",
      ]),
      divider(),

      // Figure 6: Autonomous Intervention Decision Tree
      diagramTitle(6, "Autonomous Intervention Decision Tree"),
      ...diagramBlock([
        "        Signal Monitoring (6+ categories)",
        "                     │",
        "                     ▼",
        "         ┌───────────────────────┐",
        "         │  Threshold Breach?    │",
        "         └───────┬───────┬───────┘",
        "            YES  │       │  NO",
        "                 ▼       └──▶ Continue monitoring",
        "    ┌──────────────────────┐",
        "    │  Select Action:      │",
        "    │  • Pause event       │",
        "    │  • Mute speaker      │",
        "    │  • Alert operator    │",
        "    │  • Suggest correction│",
        "    └──────────┬───────────┘",
        "               ▼",
        "    ┌──────────────────────┐",
        "    │  Execute + Log       │",
        "    │  FINRA/JSE-compliant │",
        "    │  audit trail entry   │",
        "    └──────────────────────┘",
      ]),
      divider(),

      // Figure 7: Adaptive Intelligence Feedback Loop
      diagramTitle(7, "Adaptive Intelligence Feedback Loop"),
      ...diagramBlock([
        "┌──────────────┐    ┌──────────────┐    ┌──────────────┐",
        "│  AI Output   │───▶│  Operator    │───▶│  Correction  │",
        "│  (threshold) │    │  Reviews     │    │  Captured    │",
        "└──────────────┘    └──────────────┘    └──────┬───────┘",
        "       ▲                                       │",
        "       │                                       ▼",
        "┌──────┴───────┐                    ┌──────────────────┐",
        "│  Updated     │◀───────────────────│  Weighted Avg    │",
        "│  Threshold   │    Recalculation   │  Blending:       │",
        "│  Applied     │                    │  Default + Corr  │",
        "└──────────────┘                    └──────────────────┘",
        "",
        "  Maturity: Learning → Adapting → Calibrated → Self-Evolving",
      ]),

      pageBreak(),

      // Figure 8: Multi-Carrier Failover
      diagramTitle(8, "Multi-Carrier Telephony Failover Architecture"),
      ...diagramBlock([
        "┌──────────────────────────────────────────────┐",
        "│              Carrier Manager                  │",
        "│         Continuous Health Monitoring           │",
        "└──────────┬───────────────────────┬────────────┘",
        "           │                       │",
        "           ▼                       ▼",
        "┌──────────────────┐   ┌──────────────────┐",
        "│  TWILIO (Primary) │   │  TELNYX (Secondary│",
        "│  Health: ██████░░ │   │  Health: ████████ │",
        "│  Status: Active   │   │  Status: Standby  │",
        "└──────────────────┘   └──────────────────┘",
        "",
        "  If Twilio health < threshold:",
        "    → Automatic failover to Telnyx",
        "    → Zero-downtime switch",
        "    → Audit trail logged",
      ]),
      divider(),

      // Figure 9: Immutable Audit Chain
      diagramTitle(9, "Immutable Audit Chain Structure (SHA-256)"),
      ...diagramBlock([
        "┌─────────────┐    ┌─────────────┐    ┌─────────────┐",
        "│  Entry #1   │    │  Entry #2   │    │  Entry #3   │",
        "│             │    │             │    │             │",
        "│ Action: Mute│    │ Action: Flag│    │ Action: Mute│",
        "│ Hash: a3f2..│───▶│ Hash: 7b1c..│───▶│ Hash: e9d4..│",
        "│ PrevHash: 0 │    │ PrevHash:   │    │ PrevHash:   │",
        "│             │    │   a3f2..    │    │   7b1c..    │",
        "│ Timestamp   │    │ Timestamp   │    │ Timestamp   │",
        "└─────────────┘    └─────────────┘    └─────────────┘",
        "",
        "  Each entry's hash = SHA-256(content + previousHash)",
        "  Chain is immutable — any alteration breaks all subsequent hashes",
      ]),
      divider(),

      // Figure 10: Webcast Lifecycle
      diagramTitle(10, "Webcast Event Lifecycle"),
      ...diagramBlock([
        "CREATE ──▶ CONFIGURE ──▶ REGISTER ──▶ LIVE ──▶ ON-DEMAND ──▶ REPORT",
        "  │           │            │          │          │             │",
        "  ▼           ▼            ▼          ▼          ▼             ▼",
        "6-step     Branding    Attendee    RTMP/HLS   Video         Analytics",
        "wizard     + Agenda    passes +   + AI       chapters +    + AI",
        "           + AI Apps   calendar   pipeline   transcripts   summaries",
      ]),

      pageBreak(),

      // Figure 11: Materiality Risk Oracle Pipeline
      diagramTitle(11, "Materiality Risk Oracle Pipeline (CIP Module 1)"),
      ...diagramBlock([
        "              Live Transcription Stream",
        "                        │",
        "                        ▼",
        "         ┌──────────────────────────────┐",
        "         │  NLP Keyword Extraction       │",
        "         │  • Revenue, guidance, M&A     │",
        "         │  • Regulatory triggers         │",
        "         └──────────────┬────────────────┘",
        "                        │",
        "          ┌─────────────┼─────────────┐",
        "          ▼                           ▼",
        "┌──────────────────┐      ┌──────────────────┐",
        "│  Evasion NLP     │      │  Materiality     │",
        "│  Model           │      │  Classifier      │",
        "│  (hedging,       │      │  (trained on SEC │",
        "│   deflection)    │      │   enforcement)   │",
        "└────────┬─────────┘      └────────┬─────────┘",
        "         └────────────┬────────────┘",
        "                      ▼",
        "         ┌──────────────────────────────┐",
        "         │  Materiality Risk Score       │",
        "         │  0-25: Low (Green)            │",
        "         │  26-50: Medium (Yellow)       │",
        "         │  51-75: High (Orange)         │",
        "         │  76-100: Critical (Red)       │",
        "         └──────────────┬────────────────┘",
        "                        │",
        "              ┌─────────┼─────────┐",
        "              ▼                   ▼",
        "   ┌──────────────────┐ ┌──────────────────┐",
        "   │  Auto-Draft      │ │  OCC Alert       │",
        "   │  SENS/8-K/RNS    │ │  One-Click       │",
        "   │  via RAG         │ │  Approval        │",
        "   └──────────────────┘ └──────────────────┘",
      ]),
      divider(),

      // Figure 12: Investor Intention Decoder
      diagramTitle(12, "Investor Intention Decoder Architecture (CIP Module 2)"),
      ...diagramBlock([
        "              Investor Question",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  Dynamic Graph Database       │",
        "      │  (Vector embeddings of prior  │",
        "      │   questions per investor)      │",
        "      └──────────────┬────────────────┘",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  Multi-Agent LLM Ensemble     │",
        "      ├──────────────────────────────┤",
        "      │ Agent 1: Activist Detector    │",
        "      │ Agent 2: Short-Seller Spotter │",
        "      │ Agent 3: Retail Classifier    │",
        "      │ Agent 4: Analyst Profiler     │",
        "      │ Agent 5: Litigation Detector  │",
        "      │ Agent 6: Competitor Intel     │",
        "      │ Agent 7: Regulatory Probe     │",
        "      │ Agent 8: Supportive Shareholder│",
        "      └──────────────┬────────────────┘",
        "                     │",
        "          ┌──────────┼──────────┐",
        "          ▼          ▼          ▼",
        "   ┌───────────┐┌────────┐┌──────────┐",
        "   │ Intent    ││Aggress-││ Response  │",
        "   │ Badge     ││ion     ││ Strategy  │",
        "   │ (Q&A      ││Score   ││ Recommend-│",
        "   │  queue)   ││(0-100) ││ ation     │",
        "   └───────────┘└────────┘└──────────┘",
      ]),

      pageBreak(),

      // Figure 13: Cross-Event Consistency Guardian
      diagramTitle(13, "Cross-Event Consistency Guardian (CIP Module 3)"),
      ...diagramBlock([
        "         Current Executive Statement",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  Persistent Vector Store      │",
        "      │                               │",
        "      │  • This call's statements     │",
        "      │  • Prior quarter statements   │",
        "      │  • Prior year statements      │",
        "      │  • Peer company statements    │",
        "      │  • Regulatory filings         │",
        "      └──────────────┬────────────────┘",
        "                     │",
        "          ┌──────────┼──────────┐",
        "          ▼                     ▼",
        "┌──────────────────┐ ┌──────────────────┐",
        "│ Similarity       │ │ Contradiction    │",
        "│ Scoring          │ │ Detection        │",
        "│ (cosine + word   │ │ (semantic        │",
        "│  embeddings)     │ │  opposition)     │",
        "└────────┬─────────┘ └────────┬─────────┘",
        "         └────────────┬───────┘",
        "                      ▼",
        "      ┌──────────────────────────────┐",
        "      │  Consistency Score (0-1.000)  │",
        "      │  + Contradiction Alerts       │",
        "      │  + Messaging Drift Analysis   │",
        "      └──────────────┬────────────────┘",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  RAG Corrective Language      │",
        "      │  → OCC Console               │",
        "      │  (before response completes)  │",
        "      └──────────────────────────────┘",
      ]),
      divider(),

      // Figure 14: Predictive Volatility Simulator
      diagramTitle(14, "Predictive Volatility Simulator (CIP Module 4)"),
      ...diagramBlock([
        "      Partial Transcript + Sentiment Vectors",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  LSTM/Transformer Time-Series │",
        "      │  Model (continuously updated) │",
        "      └──────────────┬────────────────┘",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  Monte-Carlo Simulation       │",
        "      │  100+ parallel scenarios      │",
        "      │  Refreshed every 30 seconds   │",
        "      └──────────────┬────────────────┘",
        "                     │",
        "          ┌──────────┼──────────┐",
        "          ▼          ▼          ▼",
        "   ┌───────────┐┌────────┐┌──────────┐",
        "   │ BEAR CASE ││ BASE   ││ BULL CASE│",
        "   │ -8% to    ││ CASE   ││ +3% to   │",
        "   │ -12%      ││ -5%    ││ +5%      │",
        "   │ P: 20%    ││ P: 55% ││ P: 25%   │",
        "   └───────────┘└────────┘└──────────┘",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  95% Confidence Interval      │",
        "      │  + Trading Recommendation     │",
        "      │  + Alternative Phrasing       │",
        "      │  → OCC + Teleprompter         │",
        "      └──────────────────────────────┘",
      ]),

      pageBreak(),

      // Figure 15: Autonomous Regulatory Intervention Engine
      diagramTitle(15, "Autonomous Regulatory Intervention Engine (CIP Module 5)"),
      ...diagramBlock([
        "      ┌──────────────────────────────┐",
        "      │  Post-Event Regulatory        │",
        "      │  Feedback Ingestion           │",
        "      │  • SEC comment letters        │",
        "      │  • JSE queries                │",
        "      │  • Enforcement actions         │",
        "      └──────────────┬────────────────┘",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  Reinforcement Learning Loop  │",
        "      │  Regulatory outcomes →         │",
        "      │  training signals              │",
        "      └──────────────┬────────────────┘",
        "                     │",
        "          ┌──────────┼──────────┐",
        "          ▼          ▼          ▼",
        "┌──────────────┐┌────────────┐┌────────────────┐",
        "│ Threshold    ││ Classifier ││ Response       │",
        "│ Adjustment   ││ Updates    ││ Templates      │",
        "│ (auto-tuned) ││ (+% imprvt)││ (per jurisdcn) │",
        "└──────────────┘└────────────┘└────────────────┘",
        "                     │",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  Evolution Stage Progression  │",
        "      │  OBSERVING → LEARNING →       │",
        "      │  ADAPTING → CALIBRATED →       │",
        "      │  AUTONOMOUS                    │",
        "      └──────────────┬────────────────┘",
        "                     ▼",
        "      ┌──────────────────────────────┐",
        "      │  Deploy Updated Models        │",
        "      │  Before Next Event            │",
        "      │  (no human retraining)        │",
        "      └──────────────────────────────┘",
      ]),
      divider(),

      // Figure 16: Event Integrity Digital Twin
      diagramTitle(16, "Event Integrity Digital Twin & Certificate (CIP Module 6)"),
      ...diagramBlock([
        "         Live Event Transcript",
        "                │",
        "                ▼",
        " ┌──────────────────────────────────┐",
        " │  Segment-by-Segment Processing   │",
        " │                                  │",
        " │  Seg 1 → Hash(content + GENESIS) │",
        " │  Seg 2 → Hash(content + Hash_1)  │",
        " │  Seg 3 → Hash(content + Hash_2)  │",
        " │  ...                              │",
        " │  Seg N → Hash(content + Hash_N-1)│",
        " └──────────────┬───────────────────┘",
        "                │",
        "                ▼",
        " ┌──────────────────────────────────┐",
        " │  Integrity Assessment            │",
        " │                                  │",
        " │  • Integrity Score: 0.000-1.000  │",
        " │  • Disclosure Completeness: 0-100│",
        " │  • Regulatory Compliance: 0-100  │",
        " │  • Consistency Rating: 0-100     │",
        " └──────────────┬───────────────────┘",
        " ┌──────────────┴───────────────────┐",
        " │  Certificate Grade Assignment    │",
        " │                                  │",
        " │  AAA │ AA │ A │ BBB │ BB │ B │ NR│",
        " └──────────────┬───────────────────┘",
        "                │",
        "                ▼",
        " ┌──────────────────────────────────┐",
        " │  Clean Disclosure Certificate    │",
        " │                                  │",
        " │  Twin Hash: SHA-256(full chain)  │",
        " │  Genesis Hash: first segment     │",
        " │  Final Hash: last segment        │",
        " │  Chain Length: N segments         │",
        " │                                  │",
        " │  → Published to exchange/investors│",
        " │  → Blockchain verification       │",
        " └──────────────────────────────────┘",
      ]),

      pageBreak(),

      // ── CLAIMS ──
      sectionHeading("9", "INDEPENDENT CLAIMS"),

      claimParagraph("Claim 1", "A computer-implemented method for providing real-time intelligence during investor events, comprising: deploying a silent AI agent into a third-party conferencing session; extracting audio and generating real-time transcription; simultaneously executing sentiment analysis, evasiveness detection, compliance risk scoring, market impact prediction, and external sentiment aggregation on said transcription; and generating personalised stakeholder briefings from the fused intelligence signals."),

      claimParagraph("Claim 2", "A self-evolving AI system for investor event intelligence, comprising: autonomous quality scoring of AI outputs using depth, breadth, and specificity metrics; an evidence decay function for prioritising current AI weaknesses; and an autonomous capability proposal pipeline with confidence-gated stage transitions from Emerging through Live status without human intervention."),

      claimParagraph("Claim 3", "A multi-modal compliance monitoring system for regulated financial communications, comprising: simultaneous text analysis, vocal tone assessment, and behavioural pattern detection; production of a composite compliance risk score; detection of selective disclosure violations and insider trading indicators; and cross-jurisdictional regulatory analysis supporting multiple financial regulatory frameworks simultaneously."),

      claimParagraph("Claim 4", "An autonomous moderation system for regulated investor events, comprising: a multi-agent AI pipeline with deterministic sequential firing; autonomous speaker muting triggered by real-time compliance violation detection; and generation of cryptographically chained, immutable audit trail entries at the moment of each moderation action."),

      claimParagraph("Claim 5", "An adaptive AI calibration system for investor event intelligence, comprising: capturing operator corrections as weighted training signals; calculating learned threshold values by blending default settings with operator feedback; and automatic progression through maturity stages from Learning to Self-Evolving based on accumulated correction volume and consistency."),

      claimParagraph("Claim 6 (CIP)", "A computer-implemented method for real-time protection against selective disclosure during a live investor communication event, comprising: (a) continuous ingestion of an audio transcription stream; (b) simultaneous execution of an evasion NLP model and a materiality classifier trained on historical enforcement actions; (c) generation of a draft regulatory filing (SENS/8-K/RNS) using retrieval-augmented generation when the materiality risk score exceeds a configurable threshold; (d) publishing the risk score, MNPI indicators, and draft filing via pub/sub to an operator console with one-click approval; and (e) logging all flagged statements with full cryptographic audit trail."),

      claimParagraph("Claim 7 (CIP)", "A system for real-time investor intent classification during a live event, comprising: (a) a dynamic graph database storing vector embeddings of historical questions per investor; (b) a multi-agent LLM ensemble that classifies each question against eight investor archetypes including activist pressure, short-seller signal, and litigation setup; (c) calculation of an aggression score predicting follow-up hostility; (d) pub/sub delivery of an intent badge, aggression score, and response strategy to the operator Q&A queue; and (e) persistent longitudinal investor behaviour tracking across events."),

      claimParagraph("Claim 8 (CIP)", "A method of maintaining live semantic consistency of executive messaging during investor events, comprising: (a) maintaining a persistent vector store of historical executive statements across all prior events and peer companies; (b) real-time similarity and contradiction scoring on each new utterance; (c) generating corrective phrasing via retrieval-augmented generation; (d) surfacing contradiction alerts and suggested corrections to the OCC console before the executive completes their response; and (e) cross-referencing all statements against multi-jurisdictional regulatory requirements."),

      claimParagraph("Claim 9 (CIP)", "A real-time simulation engine for investor events, comprising: (a) continuous ingestion of partial transcript vectors and sentiment scores from a live event; (b) execution of 100+ parallel Monte-Carlo forecast simulations using a continuously updated LSTM/transformer time-series model; (c) generation of base case, bull case, and bear case scenarios with probability distributions; (d) production of a 95% confidence interval for predicted price movement; (e) refreshing all simulations every 30 seconds as new transcript data arrives; and (f) publishing probability distributions and trading recommendations to the OCC console."),

      claimParagraph("Claim 10 (CIP)", "A self-evolving compliance system for live investor communications, comprising: (a) a closed-loop reinforcement learning pipeline ingesting post-event regulatory feedback including SEC comment letters, JSE queries, and enforcement actions as training signals; (b) automatic adjustment of detection thresholds, classifier parameters, and response templates based on historical regulatory outcomes; (c) progression through five evolution stages from observing to autonomous with confidence-gated transitions; (d) generation of jurisdiction-specific response templates as the regulatory landscape evolves; and (e) autonomous deployment of updated models before the next issuer event without human retraining."),

      claimParagraph("Claim 11 (CIP)", "A method for certifying live event integrity, comprising: (a) maintaining a cryptographically linked digital twin of transcript segments, sentiment scores, compliance scores, and operator actions using SHA-256 hash chaining where each segment includes the prior segment's hash; (b) scoring overall event integrity across disclosure completeness, regulatory compliance, and messaging consistency dimensions; (c) assigning a certificate grade from AAA through NR based on the integrity assessment; (d) generating a formal Clean Disclosure Certificate suitable for publication to investors, exchanges, and regulatory bodies; and (e) providing the twin hash, genesis hash, final hash, and chain length for independent cryptographic verification."),

      pageBreak(),

      // ── PRIOR ART ──
      sectionHeading("10", "PRIOR ART DIFFERENTIATION"),
      makeTable(
        ["Existing Solution", "CuraLive Differentiation"],
        [
          ["Zoom/Teams/Webex", "No AI intelligence; CuraLive deploys into these platforms silently"],
          ["Bloomberg Terminal", "Financial data only; no live event intelligence or moderation"],
          ["Notivize/Lumi AGM", "Basic voting/registration; no AI analysis or autonomous moderation"],
          ["Otter.ai / Rev.com", "Transcription only; no multi-modal compliance or market impact"],
          ["Sentieo / AlphaSense", "Document analysis; not real-time event intelligence"],
          ["Traditional IR platforms", "Manual processes; no self-evolving AI or autonomous intervention"],
          ["Recall.ai", "Transcription infrastructure only; no investor analysis or compliance"],
          ["OpenAI Whisper", "Transcription model; no real-time regulatory analysis"],
          ["Ethereum/Polygon", "Blockchain infrastructure; no event certification application"],
        ]
      ),

      pageBreak(),

      // ── COMMERCIAL STATUS ──
      sectionHeading("11", "COMMERCIAL DEPLOYMENT STATUS"),
      makeTable(
        ["Item", "Detail"],
        [
          ["Production URL", "https://curalive-platform.replit.app"],
          ["GitHub Repository", "github.com/davecameron187-sys/curalive-platform"],
          ["Development Status", "Fully implemented and operational — 18 subsystems"],
          ["Intelligence Suite", "11 AI algorithms fully coded and operational"],
          ["Primary Market", "JSE-listed companies, South African investor relations"],
          ["Expansion Markets", "SEC-regulated (US), FCA-regulated (UK), multi-jurisdictional"],
          ["Partner Integrations", "Bastion Capital Partners, Lumi Global"],
          ["Patent Filings", "4 CIPC provisional applications filed (March 12-18, 2026)"],
        ]
      ),

      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        children: [new TextRun({
          text: "This brief has been prepared from the implemented production codebase as of 18 March 2026. All described features are fully coded, tested, and operational in the production environment.",
          italics: true, size: 20, color: GREY, font: "Calibri",
        })],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "END OF PATENT SUBMISSION BRIEF", bold: true, size: 24, color: NAVY, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("CuraLive_Patent_Submission_Brief_2026.docx", buffer);
const sizeMB = (buffer.length / 1024).toFixed(1);
console.log(`Word document generated: CuraLive_Patent_Submission_Brief_2026.docx`);
console.log(`File size: ${sizeMB} KB`);
