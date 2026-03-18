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
      new Paragraph({ spacing: { before: 600 } }),
      new Paragraph({
        children: [new TextRun({
          text: "\"Integrated Real-Time Investor Event Intelligence Platform with Autonomous AI Moderation, Self-Evolving Machine Learning, and Multi-Modal Compliance Monitoring\"",
          italics: true, size: 22, color: DARK_BLUE, font: "Calibri",
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),

      pageBreak(),

      // ── 1. TITLE OF INVENTION ──
      sectionHeading("1", "TITLE OF INVENTION"),
      bodyText("\"Integrated Real-Time Investor Event Intelligence Platform with Autonomous AI Moderation, Self-Evolving Machine Learning, and Multi-Modal Compliance Monitoring\""),

      // ── 2. FIELD OF INVENTION ──
      sectionHeading("2", "FIELD OF THE INVENTION"),
      bodyText("The present invention relates to financial technology and investor relations platforms. More particularly, the invention relates to an integrated system and method for conducting, monitoring, analysing, and generating intelligence from live investor events — including earnings calls, Annual General Meetings (AGMs), capital markets days, and webcasts — using real-time artificial intelligence, autonomous moderation, multi-carrier telephony, and self-evolving machine learning algorithms."),

      // ── 3. BACKGROUND ──
      sectionHeading("3", "BACKGROUND AND PROBLEM STATEMENT"),
      bodyText("Existing investor relations platforms provide basic webcasting and audio conferencing. They lack:"),
      numberedItem("1", "Real-time AI intelligence — No existing platform fuses live transcription, sentiment analysis, evasiveness detection, market impact forecasting, and compliance monitoring into a single unified pipeline operating in real-time during investor events."),
      numberedItem("2", "Autonomous moderation for regulated events — Current systems require manual human moderation. No system provides autonomous, regulation-aware intervention with legally defensible audit trails."),
      numberedItem("3", "Self-improving AI without human labelling — Existing ML systems require human-labelled training data. No investor event platform implements autonomous quality scoring, evidence decay, and self-proposal of new AI capabilities."),
      numberedItem("4", "Shadow intelligence from third-party platforms — No system deploys silent AI agents into third-party conferencing platforms (Zoom, Teams, Webex) to extract intelligence without requiring integration or cooperation from those platforms."),
      numberedItem("5", "Multi-modal compliance fusion — No platform combines text analysis, vocal tone assessment, behavioural pattern detection, and selective disclosure risk scoring into a single compliance risk score for regulated financial communications."),

      // ── 4. SUMMARY ──
      sectionHeading("4", "SUMMARY OF THE INVENTION"),
      bodyText("CuraLive is a comprehensive real-time investor event intelligence platform comprising 12 novel interconnected subsystems:"),
      new Paragraph({ spacing: { after: 100 } }),
      makeTable(
        ["#", "Subsystem", "Novel Capability"],
        [
          ["1", "Shadow Bridge & Silent Intelligence Deployment", "Passive AI agent injection into third-party meetings"],
          ["2", "AI Automated Moderator (aiAm)", "Autonomous regulation-aware event moderation with kill-switch"],
          ["3", "Module M — Self-Evolution Engine", "Zero-human-input AI self-improvement with evidence decay"],
          ["4", "Intelligence Suite — 5 Advanced AI Algorithms", "Evasiveness, market impact, compliance, sentiment fusion, RAG briefings"],
          ["5", "Operator Control Console (OCC)", "Real-time multi-participant conference management"],
          ["6", "Webcasting Engine", "End-to-end event lifecycle with RTMP/HLS/WebRTC"],
          ["7", "Multi-Carrier Telephony with Autonomous Failover", "Dual-carrier (Twilio/Telnyx) with health-based switching"],
          ["8", "Adaptive Intelligence Thresholds", "Operator-to-AI feedback loop with dynamic calibration"],
          ["9", "Autonomous Intervention Engine", "Real-time signal monitoring with automated corrective actions"],
          ["10", "Health Guardian", "AI-powered infrastructure monitoring with root cause attribution"],
          ["11", "EventEchoPipeline", "Compliance-aware automated content transformation"],
          ["12", "Enterprise Security Architecture", "Zero Trust, RBAC, immutable audit chain, threat hunting"],
        ]
      ),

      pageBreak(),

      // ── 5. DETAILED DESCRIPTIONS ──
      sectionHeading("5", "DETAILED DESCRIPTION OF IMPLEMENTED SUBSYSTEMS"),

      // 5.1 Shadow Bridge
      subHeading("5.1", "Shadow Bridge — Silent Intelligence Deployment"),
      boldLabel("Implementation:", "server/routers/shadowModeRouter.ts, server/webhooks/recallWebhook.ts, client/src/pages/ShadowMode.tsx"),
      bodyText("Method:"),
      numberedItem("1", "Operator provides a meeting URL (Zoom, Microsoft Teams, Google Meet, or Webex) or a PSTN conference bridge number."),
      numberedItem("2", "The system deploys a named AI agent (via Recall.ai API) that joins the meeting as a silent participant."),
      numberedItem("3", "Real-time audio is captured and streamed through the platform's transcription pipeline."),
      numberedItem("4", "The Shadow Session mirrors the live event state, enabling parallel analysis (sentiment, compliance, evasiveness) without disrupting the original meeting."),
      numberedItem("5", "All intelligence is extracted passively — the third-party platform requires no integration, API access, or awareness."),
      bodyText("Novel Claims:"),
      claimBullet("Method for deploying a silent AI participant into a third-party video conferencing session to extract real-time investor event intelligence without platform integration."),
      claimBullet("System for creating a parallel \"Shadow Session\" that mirrors a live event for secondary AI analysis."),
      claimBullet("Automatic Tagged Metrics generation from passive observation of third-party meetings."),
      bodyText("PSTN Shadow Bridge Extension:"),
      bulletPoint("When a PSTN conference bridge number is provided, the system places an outbound Twilio/Telnyx call to the bridge."),
      bulletPoint("The call audio is streamed via WebSocket to OpenAI Whisper for real-time speech-to-text."),
      bulletPoint("The resulting transcript feeds into the same intelligence pipeline as web-based Shadow Mode."),
      bulletPoint("This enables intelligence extraction from legacy audio-only conference calls that have no web component."),
      divider(),

      // 5.2 aiAm
      subHeading("5.2", "AI Automated Moderator (aiAm)"),
      boldLabel("Implementation:", "server/_core/aiAmAutoMuting.ts, server/routers/aiAm.ts, server/_core/aiAmAuditTrail.ts, server/_core/aiAmReportGenerator.ts"),
      bodyText("Method:"),
      numberedItem("1", "Real-time transcription segments are continuously analysed by a multi-agent AI pipeline."),
      numberedItem("2", "Each agent specialises in a specific domain: Compliance Agent (regulatory violations, forward-looking statements), IR Agent (sentiment management, messaging consistency), and Toxicity Agent (inappropriate content, personal attacks)."),
      numberedItem("3", "When a violation is detected, agents fire in a deterministic sequence — Compliance first (redaction/logging), then IR (sentiment management), then Toxicity (content filtering)."),
      numberedItem("4", "The system can autonomously mute speakers, redact content, and dispatch alerts without human intervention."),
      numberedItem("5", "Every action generates a cryptographically chained audit trail entry (SHA-256 hash with previous-entry linking) ensuring immutability and legal defensibility."),
      bodyText("Novel Claims:"),
      claimBullet("Multi-agent AI moderation system with deterministic sequential firing for regulated financial events."),
      claimBullet("Autonomous speaker muting triggered by real-time compliance violation detection during live investor events."),
      claimBullet("Immutable, cryptographically chained audit trail for AI-driven moderation actions, suitable for FINRA/SEC/JSE regulatory review."),
      claimBullet("Automated generation of compliance certificates and incident reports in PDF format."),
      divider(),

      // 5.3 Module M
      subHeading("5.3", "Module M — Self-Evolution Engine"),
      boldLabel("Implementation:", "server/services/AiEvolutionService.ts, docs/CIP-Module-M-AI-Self-Evolution-Engine.md"),
      bodyText("Method:"),
      numberedItem("1", "The system continuously scores its own AI outputs across three dimensions: Depth (volume and richness), Breadth (completeness of coverage), and Specificity (transcript-specific content versus generic LLM boilerplate)."),
      numberedItem("2", "An exponential time-decay function (default 14-day half-life) is applied to weakness observations, ensuring only current, recurring gaps are prioritised."),
      numberedItem("3", "When sufficient evidence accumulates, the system autonomously proposes new AI capabilities through a 5-stage lifecycle: Emerging → Proposed → Approved → Building → Live."),
      numberedItem("4", "Promotion through the first three stages occurs without human intervention when confidence and evidence thresholds are met."),
      numberedItem("5", "The system writes its own prompts and tool definitions for newly proposed capabilities."),
      bodyText("Novel Claims:"),
      claimBullet("Zero-human-input AI self-improvement pipeline for investor event intelligence platforms."),
      claimBullet("Algorithmic quality scoring method combining depth, breadth, and specificity metrics for AI output evaluation."),
      claimBullet("Evidence decay function with configurable half-life for prioritising current AI weaknesses over historical ones."),
      claimBullet("Autonomous AI capability proposal and promotion pipeline with confidence-gated stage transitions."),
      divider(),

      pageBreak(),

      // 5.4 Intelligence Suite
      subHeading("5.4", "Intelligence Suite — Five Advanced AI Algorithms"),
      boldLabel("Implementation:", "Five service modules + five tRPC routers + five database tables + unified frontend"),

      subSubHeading("5.4.1", "Evasive Answer Detection"),
      boldLabel("Files:", "server/services/EvasiveAnswerDetectionService.ts, server/routers/evasiveAnswerRouter.ts"),
      numberedItem("1", "Accepts a Q&A exchange pair (analyst question + executive response) along with speaker role context."),
      numberedItem("2", "Uses LLM with structured JSON output to analyse the response across multiple evasiveness indicators: hedging language, topic shift detection, temporal deflection, authority deflection, jargon flooding, and non-answer patterns."),
      numberedItem("3", "Produces a Directness Index (0-100) and Evasiveness Score (0.000-1.000)."),
      numberedItem("4", "Supports batch analysis of entire Q&A sessions."),
      numberedItem("5", "Results are persisted in evasiveness_logs table with event/session correlation."),
      bodyText("Novel Claims:"),
      claimBullet("NLP-based evasiveness scoring system specifically calibrated for executive responses during regulated investor events."),
      claimBullet("Directness Index metric combining hedging phrase detection, topic shift analysis, and authority deflection patterns."),
      claimBullet("Batch evasiveness analysis pipeline for complete earnings call Q&A sessions."),

      subSubHeading("5.4.2", "Predictive Market Impact Forecasting"),
      boldLabel("Files:", "server/services/MarketImpactPredictorService.ts, server/routers/marketImpactPredictorRouter.ts"),
      numberedItem("1", "Ingests sentiment scores, topic keywords, evasiveness data, company ticker, event type, and transcript excerpts."),
      numberedItem("2", "Uses LLM with structured output to predict: Predicted Volatility (0-10), Direction (positive/negative/neutral), Confidence (0.000-1.000), Time Horizon, Risk Factors, and Catalysts."),
      numberedItem("3", "Incorporates historical comparison reasoning."),
      numberedItem("4", "Results stored in market_impact_predictions table."),
      bodyText("Novel Claims:"),
      claimBullet("Real-time market impact prediction from live investor event signals using LLM reasoning."),
      claimBullet("Multi-factor volatility forecasting combining call tone, content analysis, and historical pattern matching."),

      subSubHeading("5.4.3", "Multi-Modal Compliance Risk Scoring"),
      boldLabel("Files:", "server/services/MultiModalComplianceService.ts, server/routers/multiModalComplianceRouter.ts"),
      numberedItem("1", "Fuses three independent signal modalities: Text Risk, Tone Risk, and Behavioural Risk."),
      numberedItem("2", "Produces a composite overall risk score plus individual modality scores."),
      numberedItem("3", "Detects specific violation types: selective disclosure, insider trading indicators, forward-looking statement violations."),
      numberedItem("4", "Supports multi-jurisdictional analysis: JSE (South Africa), SEC (United States), FCA (United Kingdom)."),
      numberedItem("5", "Generates structured recommendations and insider trading indicators."),
      bodyText("Novel Claims:"),
      claimBullet("Multi-modal compliance risk scoring system fusing text, tone, and behavioural signals for real-time regulatory violation detection."),
      claimBullet("Cross-jurisdictional compliance analysis engine supporting simultaneous JSE, SEC, and FCA regulatory frameworks."),
      claimBullet("Selective disclosure risk detection algorithm combining speaker behaviour patterns with content analysis."),

      subSubHeading("5.4.4", "Real-Time External Sentiment Aggregation"),
      boldLabel("Files:", "server/services/ExternalSentimentService.ts, server/routers/externalSentimentRouter.ts"),
      numberedItem("1", "Takes company information, event context, internal call sentiment, and key discussion topics."),
      numberedItem("2", "Uses LLM to synthesise external market signals and generate: Aggregated Sentiment, Social Mention Count, Crowd Reaction classification, Divergence from Call, Top Themes, Early Warnings, Influencer Sentiment, and Media Reactions."),
      numberedItem("3", "Results stored in external_sentiment_snapshots table."),
      bodyText("Novel Claims:"),
      claimBullet("System for computing divergence between internal investor event sentiment and external market/social sentiment in real-time."),
      claimBullet("Early warning generation for IR teams based on sentiment divergence analysis."),
      claimBullet("Crowd reaction classification algorithm for investor events."),

      subSubHeading("5.4.5", "Personalised IR Briefing Generation (RAG Pipeline)"),
      boldLabel("Files:", "server/services/PersonalizedBriefingService.ts, server/routers/personalizedBriefingRouter.ts"),
      numberedItem("1", "Accepts stakeholder type (CEO, CFO, IR Head, Board Member, Analyst, Compliance Officer, Investor), company/event context, transcript data, and optional cross-algorithm inputs."),
      numberedItem("2", "Constructs stakeholder-specific prompts: CEOs receive strategic messaging, CFOs receive financial metrics, IR Heads receive media strategy, Compliance Officers receive regulatory risk assessment."),
      numberedItem("3", "Generates structured briefings with: Executive Summary, Key Findings, Risk Alerts, Action Items, Stakeholder Impact, and Appendix with confidence level."),
      numberedItem("4", "Results stored in ir_briefings table."),
      bodyText("Novel Claims:"),
      claimBullet("RAG-based personalised briefing generation system producing role-specific intelligence reports from investor event data."),
      claimBullet("Cross-algorithm input fusion for briefing generation, combining evasiveness, sentiment, market impact, and compliance signals."),
      claimBullet("Stakeholder-type-specific prompt engineering for IR briefing personalisation."),

      divider(),
      pageBreak(),

      // 5.5 OCC
      subHeading("5.5", "Operator Control Console (OCC)"),
      boldLabel("Implementation:", "client/src/pages/OCC.tsx, server/db.occ.ts, server/routers/occ.ts"),
      numberedItem("1", "Provides real-time management of multi-participant conference calls with sub-second status updates via Ably pub/sub."),
      numberedItem("2", "Displays participant states: speaking, muted, waiting, in lounge, on hold."),
      numberedItem("3", "Manages Q&A queues with operator-controlled participant promotion and demotion."),
      numberedItem("4", "Supports pre-recorded audio file playback into live conference streams."),
      numberedItem("5", "Integrates with the AI Automated Moderator for automated intervention controls."),
      numberedItem("6", "Includes a participant \"Lounge\" system for managing waiting callers before they are brought live."),
      bodyText("Novel Claims:"),
      claimBullet("Integrated operator console combining real-time conferencing management with AI-powered moderation controls for regulated investor events."),
      claimBullet("Participant lounge system with queue management and operator-controlled promotion for investor event telephony."),
      divider(),

      // 5.6 Webcasting Engine
      subHeading("5.6", "Webcasting Engine"),
      boldLabel("Implementation:", "server/routers/webcastRouter.ts, server/routers/muxRouter.ts, client/src/pages/CreateEventWizard.tsx, WebcastStudio.tsx, AttendeeEventRoom.tsx, OnDemandWatch.tsx, WebcastReport.tsx"),
      numberedItem("1", "Creation — 6-step guided wizard: Event Type → Details → Branding → Agenda & Speakers → Registration Settings → AI Applications selection."),
      numberedItem("2", "Registration — Public landing pages with industry-specific templates. Generates unique attendee passes with personal join links and calendar invites (.ics)."),
      numberedItem("3", "Live Broadcast — RTMP ingest from OBS/vMix/hardware encoders via Mux. HLS playback with sub-100ms delivery. Multi-language real-time translation (9+ languages)."),
      numberedItem("4", "Attendee Experience — Interactive tabbed interface: Live Video, Transcript, Q&A, Polls, Event Info. Mobile-optimised with swipeable panels."),
      numberedItem("5", "Operator Studio — Q&A moderation, live polling, operator-to-attendee chat, AI-assisted broadcast quality controls."),
      numberedItem("6", "Post-Event — On-demand playback with video chapters, searchable transcripts, downloadable certificates (CME/CPD accreditation)."),
      numberedItem("7", "Reporting — Attendance analytics, engagement metrics, poll breakdowns, AI-generated executive summaries, automated content generation."),
      bodyText("Novel Claims:"),
      claimBullet("End-to-end investor event lifecycle engine with integrated AI intelligence at every stage."),
      claimBullet("Attendee pass generation system with personal join links for regulated investor events."),
      claimBullet("AI application selector during event creation that activates specific intelligence modules for the event."),
      divider(),

      // 5.7 Multi-Carrier Telephony
      subHeading("5.7", "Multi-Carrier Telephony with Autonomous Failover"),
      boldLabel("Implementation:", "server/webphone/carrierManager.ts, server/webphone/twilio.ts, server/webphone/telnyx.ts, server/services/ConferenceDialoutService.ts"),
      numberedItem("1", "Dual-carrier architecture using Twilio (primary) and Telnyx (secondary) for voice communications."),
      numberedItem("2", "Carrier Manager continuously monitors primary carrier health metrics."),
      numberedItem("3", "Upon detecting degradation, automatically fails over to the secondary carrier."),
      numberedItem("4", "WebRTC-based operator webphone supporting inbound/outbound calls with caller ID management and automatic recording."),
      numberedItem("5", "Conference Dial-Out supports up to 200 participants per session."),
      numberedItem("6", "Includes automated number purchasing and assignment via Telnyx API for failover numbers."),
      bodyText("Novel Claims:"),
      claimBullet("Autonomous multi-carrier telephony failover system for investor event conferencing with health-based switching."),
      claimBullet("Conference dial-out system supporting up to 200 participants with real-time status tracking."),
      divider(),

      // 5.8 Adaptive Intelligence
      subHeading("5.8", "Adaptive Intelligence Thresholds"),
      boldLabel("Implementation:", "server/routers/adaptiveIntelligenceRouter.ts"),
      numberedItem("1", "Every operator correction is captured as a weighted training signal."),
      numberedItem("2", "The system calculates a \"Learned Value\" by blending default AI thresholds with a weighted average of operator corrections."),
      numberedItem("3", "Calibration progresses through maturity stages: Learning → Adapting → Calibrated → Self-Evolving."),
      numberedItem("4", "Stage transitions are automatic based on accumulated correction volume and consistency."),
      numberedItem("5", "The AI adapts specifically to each company's or sector's communication style over time."),
      bodyText("Novel Claims:"),
      claimBullet("Operator-to-AI feedback loop that dynamically recalibrates AI intelligence thresholds based on domain expert corrections."),
      claimBullet("Maturity stage progression system for AI calibration with automatic stage transitions."),
      divider(),

      // 5.9 Autonomous Intervention
      subHeading("5.9", "Autonomous Intervention Engine"),
      boldLabel("Implementation:", "client/src/pages/AutonomousIntervention.tsx, server/routers/autonomousInterventionRouter.ts"),
      bodyText("Monitors 6+ real-time signal categories during live events:"),
      bulletPoint("Sentiment Drop Alert (sudden negative sentiment shift)"),
      bulletPoint("Q&A Overload (question queue exceeding capacity)"),
      bulletPoint("Compliance Breach Detection (real-time regulatory violation)"),
      bulletPoint("Speaker Pace Anomaly (unusual speaking rate indicating stress/discomfort)"),
      bulletPoint("Engagement Collapse (attendee drop-off or attention loss)"),
      bulletPoint("Technical Quality Degradation (audio/video quality issues)"),
      bodyText("When a threshold is breached, the engine autonomously executes corrective actions and generates a FINRA/JSE-compliant audit log entry at the moment of action."),
      bodyText("Novel Claims:"),
      claimBullet("Autonomous real-time intervention system for investor events that monitors multi-dimensional signals and takes corrective action without human initiation."),
      claimBullet("Automated creation of regulation-compliant audit log entries at the moment of autonomous AI intervention during live financial events."),
      divider(),

      // 5.10 Health Guardian
      subHeading("5.10", "Health Guardian — AI Infrastructure Monitor"),
      boldLabel("Implementation:", "client/src/pages/HealthGuardian.tsx, server/routers/healthGuardianRouter.ts"),
      numberedItem("1", "Continuously monitors 6+ infrastructure services: Database, AI Engine, Telephony, Webcasting, Real-time Messaging, and Transcription."),
      numberedItem("2", "Uses AI-powered root cause analysis to determine whether issues originate from platform-side or participant-side."),
      numberedItem("3", "Attribution Intelligence distinguishes between platform and participant responsibility — critical for SLA compliance."),
      numberedItem("4", "Automatically generates professional incident reports for clients."),
      bodyText("Novel Claims:"),
      claimBullet("AI-powered infrastructure health monitoring with attribution intelligence distinguishing platform-side vs participant-side failures."),
      claimBullet("Automated client-facing incident report generation with root cause attribution for SLA dispute resolution."),
      divider(),

      // 5.11 EventEchoPipeline
      subHeading("5.11", "EventEchoPipeline — Compliance-Aware Content Transformation"),
      boldLabel("Implementation:", "server/services/EventEchoPipeline.ts, server/routers/socialMedia.ts"),
      numberedItem("1", "Captures live event signals: sentiment peaks, key quotes, financial highlights, and engagement metrics."),
      numberedItem("2", "Transforms signals into platform-optimised content (LinkedIn, Twitter/X, press releases) using a Social Amplification engine."),
      numberedItem("3", "Regulatory Speech Guarding ensures generated content excludes forward-looking statements, MNPI, and selective disclosure violations."),
      numberedItem("4", "Supports Podcast Converter which transforms event transcripts into podcast-style scripts."),
      bodyText("Novel Claims:"),
      claimBullet("Compliance-aware social content generation pipeline enforcing regulatory speech guardrails."),
      claimBullet("Automated forward-looking statement filtering for social media content derived from regulated investor events."),
      divider(),

      // 5.12 Enterprise Security
      subHeading("5.12", "Enterprise Security Architecture"),
      bodyText("Zero Trust Architecture — Device posture monitoring, microsegmentation, continuous authentication with MFA and behavioural biometrics."),
      bodyText("Role-Based Access Control (RBAC) — Hierarchy: Admin → Operator → User. Granular permissions enforced at router level with protected procedures."),
      bodyText("Immutable Audit Chain — SHA-256 hash-based integrity verification with chain of custody linking. Captures all compliance actions with export for regulatory review."),
      bodyText("Advanced Threat Hunting — Hunting campaigns, IOC tracking, YARA rule deployment, ML anomaly detection."),
      bodyText("Compliance Frameworks — SOC 2 Type II control monitoring, ISO 27001 assessment with AI-generated remediation roadmaps, automated compliance certificate generation."),

      pageBreak(),

      // ── 6. PARTNER INTEGRATIONS ──
      sectionHeading("6", "PARTNER INTEGRATION ARCHITECTURE"),
      subHeading("6.1", "Bastion Capital Partners Integration"),
      boldLabel("Implementation:", "server/services/BastionBookingService.ts, server/services/BastionInvestorAiService.ts"),
      bulletPoint("Investor Intelligence booking system for earnings calls"),
      bulletPoint("Co-branded confirmation emails (Bastion x CuraLive)"),
      bulletPoint("Live Intelligence Dashboard accessible via secure dashboardToken (no-login access)"),
      bulletPoint("Five AI modules: Earnings Sentiment Decoder, Forward Guidance Tracker, Analyst Question Intelligence, Management Credibility Scorer, Market-Moving Statement Detector"),
      divider(),
      subHeading("6.2", "Lumi Global Integration (AGM Governance)"),
      boldLabel("Implementation:", "server/services/LumiBookingService.ts, server/routers/agmGovernanceRouter.ts"),
      bulletPoint("AGM Intelligence booking and management"),
      bulletPoint("Resolution tracking and outcome prediction"),
      bulletPoint("Jurisdiction-specific quorum monitoring (Companies Act 71, JSE Listings Requirements)"),
      bulletPoint("Real-time governance observation during shareholder meetings"),
      bulletPoint("Post-AGM Governance Report generation"),

      // ── 7. BILLING ENGINE ──
      sectionHeading("7", "ENTERPRISE BILLING ENGINE"),
      boldLabel("Implementation:", "server/routers/billing.ts, server/db.billing.ts, server/billingPdf.ts"),
      bulletPoint("Full billing lifecycle: Clients → Quotes (multi-version) → Invoices → Payments → Ageing Reports"),
      bulletPoint("Multi-currency support: ZAR, USD, EUR with FX rate tracking"),
      bulletPoint("Automated PDF generation for quotes and invoices"),
      bulletPoint("Payment method tracking: EFT/Bank transfers"),
      bulletPoint("Overdue invoice monitoring and ageing analysis"),

      // ── 8. SUSTAINABILITY ──
      sectionHeading("8", "SUSTAINABILITY INTELLIGENCE"),
      boldLabel("Implementation:", "server/services/SustainabilityOptimizer.ts"),
      bulletPoint("Calculates CO2 savings from virtual events versus physical travel"),
      bulletPoint("Generates Sustainability Scores (A+ to D)"),
      bulletPoint("Produces event-specific sustainability badges and certificates"),
      bulletPoint("ESG reporting integration for corporate sustainability disclosures"),

      // ── 9. BENCHMARKING ──
      sectionHeading("9", "BENCHMARKING ENGINE"),
      boldLabel("Implementation:", "client/src/pages/Benchmarks.tsx, BenchmarkingDashboard.tsx"),
      bulletPoint("Compares event performance against industry standards"),
      bulletPoint("Metrics: engagement rates, sentiment distribution, Q&A activity, attendance rates"),
      bulletPoint("Sector-specific benchmarking (Financial Services, Healthcare, Mining)"),
      bulletPoint("Historical trend analysis across events"),

      pageBreak(),

      // ── 10. TECHNOLOGY STACK ──
      sectionHeading("10", "TECHNOLOGY STACK"),
      makeTable(
        ["Layer", "Technology", "Purpose"],
        [
          ["Frontend", "React 19 + Vite + TailwindCSS 4", "Single-page application"],
          ["Backend", "Express + tRPC", "Type-safe API layer"],
          ["Database", "MySQL + Drizzle ORM", "Relational data persistence"],
          ["Real-time", "Ably", "Pub/sub messaging, presence"],
          ["Video", "Mux", "RTMP ingest, HLS delivery"],
          ["Telephony (Primary)", "Twilio", "WebRTC, PSTN, conference bridges"],
          ["Telephony (Secondary)", "Telnyx", "SIP failover, number provisioning"],
          ["AI/LLM", "OpenAI GPT-4o / Gemini 2.5 Flash", "Structured intelligence generation"],
          ["Transcription", "OpenAI Whisper", "Speech-to-text"],
          ["Meeting Bots", "Recall.ai", "Third-party meeting intelligence"],
          ["Authentication", "OAuth 2.0 / Clerk", "Identity management"],
        ]
      ),

      pageBreak(),

      // ── 11. DATABASE SCHEMA ──
      sectionHeading("11", "DATABASE SCHEMA (INTELLIGENCE SUITE TABLES)"),
      bodyText("Five purpose-built MySQL tables support the Intelligence Suite:"),
      new Paragraph({ spacing: { after: 100 } }),
      makeTable(
        ["Table", "Purpose", "Key Fields"],
        [
          ["evasiveness_logs", "Evasive answer detection results", "score, directness_index, flags (JSON), hedging_phrases (JSON), topic_shift_detected"],
          ["market_impact_predictions", "Market volatility forecasts", "predicted_volatility, direction, confidence, risk_factors (JSON), catalysts (JSON)"],
          ["compliance_risk_scores", "Multi-modal compliance assessments", "overall_risk, text_risk, tone_risk, behavioral_risk, selective_disclosure_risk, violations (JSON)"],
          ["external_sentiment_snapshots", "External sentiment aggregation", "aggregated_sentiment, social_mentions, crowd_reaction, divergence_from_call, early_warnings (JSON)"],
          ["ir_briefings", "Personalised stakeholder briefings", "stakeholder_type, executive_summary, briefing_data (JSON), confidence_level"],
        ]
      ),

      pageBreak(),

      // ── 12. CLAIMS SUMMARY ──
      sectionHeading("12", "CLAIMS SUMMARY"),
      subHeading("", "Independent Claims"),
      new Paragraph({
        children: [
          new TextRun({ text: "Claim 1: ", bold: true, size: 22, color: NAVY, font: "Calibri" }),
          new TextRun({ text: "A computer-implemented method for providing real-time intelligence during investor events, comprising: deploying a silent AI agent into a third-party conferencing session; extracting audio and generating real-time transcription; simultaneously executing sentiment analysis, evasiveness detection, compliance risk scoring, market impact prediction, and external sentiment aggregation on said transcription; and generating personalised stakeholder briefings from the fused intelligence signals.", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Claim 2: ", bold: true, size: 22, color: NAVY, font: "Calibri" }),
          new TextRun({ text: "A self-evolving AI system for investor event intelligence, comprising: autonomous quality scoring of AI outputs using depth, breadth, and specificity metrics; an evidence decay function for prioritising current AI weaknesses; and an autonomous capability proposal pipeline with confidence-gated stage transitions from Emerging through Live status without human intervention.", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Claim 3: ", bold: true, size: 22, color: NAVY, font: "Calibri" }),
          new TextRun({ text: "A multi-modal compliance monitoring system for regulated financial communications, comprising: simultaneous text analysis, vocal tone assessment, and behavioural pattern detection; production of a composite compliance risk score; detection of selective disclosure violations and insider trading indicators; and cross-jurisdictional regulatory analysis supporting multiple financial regulatory frameworks simultaneously.", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Claim 4: ", bold: true, size: 22, color: NAVY, font: "Calibri" }),
          new TextRun({ text: "An autonomous moderation system for regulated investor events, comprising: a multi-agent AI pipeline with deterministic sequential firing; autonomous speaker muting triggered by real-time compliance violation detection; and generation of cryptographically chained, immutable audit trail entries at the moment of each moderation action.", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Claim 5: ", bold: true, size: 22, color: NAVY, font: "Calibri" }),
          new TextRun({ text: "An adaptive AI calibration system for investor event intelligence, comprising: capturing operator corrections as weighted training signals; calculating learned threshold values by blending default settings with operator feedback; and automatic progression through maturity stages from Learning to Self-Evolving based on accumulated correction volume and consistency.", size: 21, font: "Calibri" }),
        ],
        spacing: { after: 200 },
      }),

      pageBreak(),

      // ── 13. FIGURES ──
      sectionHeading("13", "FIGURES AND DRAWINGS"),
      bodyText("The following diagrams should accompany the patent application:"),
      numberedItem("1", "System Architecture Diagram — Overall platform architecture showing all 12 subsystems and their interconnections."),
      numberedItem("2", "Shadow Bridge Data Flow — Sequence diagram showing silent agent deployment, audio capture, transcription, and intelligence pipeline."),
      numberedItem("3", "Module M Self-Evolution Lifecycle — State diagram showing the 5-stage capability lifecycle with evidence decay curves."),
      numberedItem("4", "Intelligence Suite Pipeline — Data flow diagram showing how the 5 AI algorithms receive inputs and produce outputs."),
      numberedItem("5", "Multi-Modal Compliance Fusion — Diagram showing text, tone, and behavioural signal fusion into composite risk score."),
      numberedItem("6", "Autonomous Intervention Decision Tree — Flow chart showing signal monitoring, threshold detection, and corrective action execution."),
      numberedItem("7", "Adaptive Intelligence Feedback Loop — Diagram showing operator correction capture, threshold recalculation, and maturity stage progression."),
      numberedItem("8", "Multi-Carrier Failover Architecture — Sequence diagram showing Twilio/Telnyx health monitoring and autonomous switching."),
      numberedItem("9", "Immutable Audit Chain Structure — Diagram showing SHA-256 hash linking between sequential audit entries."),
      numberedItem("10", "Webcast Lifecycle — End-to-end flow from event creation through live broadcast to post-event reporting."),

      // ── 14. PRIOR ART ──
      sectionHeading("14", "PRIOR ART DIFFERENTIATION"),
      makeTable(
        ["Existing Solution", "CuraLive Differentiation"],
        [
          ["Zoom / Teams / Webex", "No integrated AI intelligence; CuraLive deploys into these platforms silently"],
          ["Bloomberg Terminal", "Financial data only; no live event intelligence or moderation"],
          ["Notivize / Lumi AGM platforms", "Basic voting/registration; no AI analysis or autonomous moderation"],
          ["Otter.ai / Rev.com", "Transcription only; no multi-modal compliance or market impact prediction"],
          ["Sentieo / AlphaSense", "Document analysis; not real-time event intelligence"],
          ["Traditional IR platforms", "Manual processes; no self-evolving AI or autonomous intervention"],
        ]
      ),

      // ── 15. COMMERCIAL DEPLOYMENT ──
      sectionHeading("15", "COMMERCIAL DEPLOYMENT STATUS"),
      bulletPoint("Production URL: https://curalive-platform.replit.app"),
      bulletPoint("GitHub Repository: github.com/davecameron187-sys/curalive-platform"),
      bulletPoint("Development Status: Fully implemented and operational"),
      bulletPoint("Primary Market: JSE-listed companies, South African investor relations"),
      bulletPoint("Expansion Markets: SEC-regulated (US), FCA-regulated (UK), multi-jurisdictional"),
      bulletPoint("Partner Integrations: Bastion Capital Partners, Lumi Global"),

      new Paragraph({ spacing: { before: 600 } }),
      divider(),
      new Paragraph({
        children: [new TextRun({
          text: "This brief has been prepared from the implemented production codebase as of 18 March 2026. All described features are fully coded, tested, and operational in the production environment.",
          italics: true, size: 19, color: GREY, font: "Calibri",
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "END OF PATENT SUBMISSION BRIEF", bold: true, size: 22, color: NAVY, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("CuraLive_Patent_Submission_Brief_2026.docx", buffer);
console.log("Word document generated: CuraLive_Patent_Submission_Brief_2026.docx");
console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
