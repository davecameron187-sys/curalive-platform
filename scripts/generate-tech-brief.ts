import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableRow, TableCell, Table, WidthType, BorderStyle, ShadingType,
  convertInchesToTwip, Tab, TabStopPosition, TabStopType,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const brandBlue = "1e40af";
const brandDark = "0f172a";
const lightGray = "f1f5f9";
const medGray = "64748b";

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 400 : 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: brandDark, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22 })],
  });
}

function para(text: string, opts?: { bold?: boolean; italic?: boolean; spacing?: number }) {
  return new Paragraph({
    spacing: { after: opts?.spacing ?? 120 },
    children: [new TextRun({ text, size: 22, color: "334155", bold: opts?.bold, italics: opts?.italic })],
  });
}

function bullet(text: string, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [new TextRun({ text, size: 22, color: "334155" })],
  });
}

function boldBullet(label: string, desc: string, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label + " — ", size: 22, color: "334155", bold: true }),
      new TextRun({ text: desc, size: 22, color: "334155" }),
    ],
  });
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { after: pts }, children: [] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" } },
    children: [],
  });
}

async function generateBrief() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "334155" } },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1.2) },
        },
      },
      children: [
        // ─── COVER ───
        spacer(600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "CURALIVE", size: 48, bold: true, color: brandBlue })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "REAL-TIME INVESTOR EVENT INTELLIGENCE", size: 20, color: medGray, characterSpacing: 200 })],
        }),
        spacer(300),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "Technical Product Brief", size: 36, bold: true, color: brandDark })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "Live Q&A Module + Strategic Platform Direction", size: 24, color: medGray })],
        }),
        spacer(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: `Prepared: March 2026  |  Classification: Internal — Tech Team`, size: 18, color: medGray, italics: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: `CIPC Patent Application: 1773575338868`, size: 18, color: medGray })],
        }),

        // ─── 1. EXECUTIVE SUMMARY ───
        divider(),
        heading("1. Executive Summary"),
        para("CuraLive's Shadow Mode is a platform-agnostic intelligence capture system that invisibly monitors investor events across Zoom, Teams, Google Meet, and Webex — with zero integration cost to any meeting platform. This positions Shadow Mode as a world-class, multi-platform solution."),
        para("This brief proposes a strategic product extension: a purpose-built Live Q&A module that runs inside the Shadow Mode environment. This module would replace the basic, one-dimensional Q&A features native to Zoom and Teams, and become a significant differentiator for CuraLive."),
        para("This document covers the strategic rationale, platform hosting strategy, Live Q&A architecture, and implementation roadmap for the tech team."),

        // ─── 2. STRATEGIC CONTEXT ───
        divider(),
        heading("2. Strategic Context: Platform Hosting Decision"),
        heading("2.1 Current Architecture", HeadingLevel.HEADING_3),
        para("Shadow Mode currently works by sending a Recall.ai bot to join any meeting via a standard meeting link. The bot acts as a silent participant — no API keys, marketplace listings, or platform subscriptions are required from Zoom, Microsoft, Google, or Cisco."),

        heading("2.2 Should CuraLive Host Calls on Its Own Account?", HeadingLevel.HEADING_3),
        para("Recommendation: No. Keep Shadow Mode platform-agnostic.", { bold: true }),
        spacer(40),
        para("Reasons:"),
        boldBullet("Cost avoidance", "No Zoom/Teams license fees. Customers already have their own accounts."),
        boldBullet("Compliance simplicity", "Call data residency, recording consent, and GDPR obligations stay with the customer's platform — not CuraLive's."),
        boldBullet("Scalability", "CuraLive works on any platform without onboarding friction. Adding a new customer doesn't require provisioning a meeting account."),
        boldBullet("Investor story", "CuraLive is an intelligence layer that sits on top of any platform — not a replacement for one. This is a much stronger acquisition narrative."),

        heading("2.3 When a CuraLive-Hosted Account Makes Sense", HeadingLevel.HEADING_3),
        para("Only if CuraLive offers a fully managed service where the client says 'run the entire event for us.' This is a future premium tier, not the core product. It adds operational overhead (scheduling, troubleshooting, account management) that should be avoided at this stage."),

        // ─── 3. LIVE Q&A MODULE ───
        divider(),
        heading("3. Live Q&A Module — Product Vision"),
        heading("3.1 The Problem", HeadingLevel.HEADING_3),
        para("Zoom and Teams Q&A features are basic — essentially a chat window with simple upvoting. They are one-dimensional:"),
        bullet("No intelligence about who is asking the question"),
        bullet("No compliance screening before questions reach the speaker"),
        bullet("No smart grouping or deduplication of similar questions"),
        bullet("No real-time sentiment tracking as questions come in"),
        bullet("No integration with post-event intelligence or AI analysis"),

        heading("3.2 The CuraLive Solution", HeadingLevel.HEADING_3),
        para("A standalone Live Q&A application that runs inside the Shadow Mode environment. Attendees access it via a separate CuraLive link — independent of the meeting platform. The operator manages everything from the existing Shadow Mode console."),
        spacer(40),
        para("This means the Q&A experience is identical whether the call runs on Zoom, Teams, Meet, or Webex — and it works for audio-only earnings calls where there is no native Q&A at all.", { italic: true }),

        heading("3.3 Core Features", HeadingLevel.HEADING_3),
        spacer(40),
        boldBullet("AI-Powered Question Triage", "Questions from attendees are automatically clustered by theme, deduplicated, ranked by relevance, and flagged for compliance sensitivity — before the operator sees them. The operator gets a clean, prioritised queue instead of a raw chat scroll."),
        boldBullet("Investor Identity Context", "Using the existing Bastion Investor AI, the system shows the operator who is asking each question — institutional vs retail, holding size, sentiment history from past events, engagement score. No other platform provides this level of context."),
        boldBullet("Real-Time Compliance Screening", "Before a question is forwarded to the speaker, CuraLive's compliance engine flags anything that could lead to selective disclosure (Reg FD in the US, MAR in Europe, JSE requirements in South Africa). This protects the company from regulatory risk in real time."),
        boldBullet("Smart Queue Management", "AI suggests the optimal order to take questions based on topic flow, ensuring the call covers the most material topics. The operator can accept, reorder, or override."),
        boldBullet("Live Sentiment Dashboard", "As questions come in, the operator sees real-time sentiment shifts — 'questions are turning negative on margins' or 'strong interest in capital allocation' — giving the IR team advance warning before the tone shifts."),
        boldBullet("Post-Event Intelligence Feed", "Every question submitted becomes part of the event's intelligence dataset. This enriches the 20-module AI report, crisis prediction analysis, and valuation impact simulation."),

        // ─── 4. ARCHITECTURE ───
        divider(),
        heading("4. Technical Architecture"),
        heading("4.1 How It Connects", HeadingLevel.HEADING_3),
        para("The Live Q&A module does NOT replace Zoom or Teams. It runs alongside the meeting:"),
        bullet("The investor event runs on the customer's preferred platform (Zoom, Teams, etc.)"),
        bullet("Shadow Mode's Recall.ai bot silently captures the audio/transcript as normal"),
        bullet("Attendees receive a separate CuraLive Q&A link (shareable in the meeting chat or pre-event email)"),
        bullet("The operator manages the Q&A queue from the Shadow Mode console — same interface they already use"),
        bullet("Questions approved by the operator are read out by the moderator on the call"),

        heading("4.2 Component Breakdown", HeadingLevel.HEADING_3),
        spacer(40),
        boldBullet("Attendee Q&A Interface", "Lightweight web app (React) — mobile-friendly, no login required. Attendees submit questions, see status (submitted / under review / answered), and can upvote other questions."),
        boldBullet("Operator Q&A Dashboard", "New tab inside Shadow Mode console. Shows the live question queue with AI triage, investor context cards, compliance flags, and sentiment indicators. Drag-and-drop reordering."),
        boldBullet("AI Triage Engine", "Backend service that processes incoming questions through: deduplication (semantic similarity), theme clustering, compliance check, investor profiling (via Bastion AI), and relevance scoring."),
        boldBullet("Real-Time Transport", "Ably channels (already integrated) for instant question delivery between attendees and operators. No additional infrastructure needed."),
        boldBullet("Data Layer", "New database tables for Q&A sessions, questions, votes, compliance flags, and operator actions. All linked to the existing shadow session for post-event reporting."),

        heading("4.3 Integration with Existing Systems", HeadingLevel.HEADING_3),
        bullet("Shadow Mode session — Q&A session auto-created when a shadow session starts"),
        bullet("Bastion Investor AI — investor profiling for question context"),
        bullet("Compliance Engine — real-time regulatory screening"),
        bullet("AI Report Pipeline — Q&A data feeds into the 20-module post-event analysis"),
        bullet("Crisis Prediction Engine — question sentiment contributes to crisis risk scoring"),
        bullet("Ably — real-time messaging (already in place, free tier sufficient)"),

        // ─── 5. WHAT NOT TO BUILD ───
        divider(),
        heading("5. Scope Boundaries — What NOT to Build"),
        bullet("Do NOT build a video/audio conferencing platform — that's what Zoom/Teams are for"),
        bullet("Do NOT build a replacement for the meeting itself — CuraLive is the intelligence layer"),
        bullet("Do NOT require attendees to create accounts — the Q&A link should work anonymously or with optional identification"),
        bullet("Do NOT build platform-specific integrations (Zoom apps, Teams bots) — keep the platform-agnostic advantage"),
        bullet("Audio-only events are the primary use case — webcasts and video events have their own platforms and Q&A solutions"),

        // ─── 6. OPERATOR CONSOLE ───
        divider(),
        heading("6. Operator Console Status"),
        para("The Operator Command Centre (OCC) has been built but is not production-tested. Current recommendation:"),
        bullet("Park OCC cleanup as a separate workstream"),
        bullet("Focus engineering effort on Shadow Mode + Live Q&A — this is the core product story"),
        bullet("OCC refinement should be driven by real customer feedback once Shadow Mode is in active use"),
        bullet("The Q&A operator dashboard will be a new tab inside the existing Shadow Mode interface — not inside the OCC"),

        // ─── 7. COST IMPLICATIONS ───
        divider(),
        heading("7. Cost Implications"),
        para("The Live Q&A module has minimal additional infrastructure cost:"),
        spacer(40),
        boldBullet("Ably messaging", "$0 — within free tier (6M messages/month handles thousands of Q&A sessions)"),
        boldBullet("AI triage per question", "~$0.01 — uses GPT-4o-mini for classification and deduplication"),
        boldBullet("Compliance screening per question", "~$0.01 — lightweight check against existing compliance engine"),
        boldBullet("Investor profiling per question", "~$0.005 — lookup against existing Bastion AI data"),
        boldBullet("Database storage", "Negligible — text-based Q&A records"),
        spacer(40),
        para("Estimated cost per Q&A session (50 questions): ~$0.50 — $1.00", { bold: true }),
        para("No additional platform fees from Zoom, Teams, Meet, or Webex.", { bold: true }),
        spacer(40),
        para("Meeting platform integration costs:"),
        boldBullet("Zoom", "$0 — no API subscription, no marketplace listing, no integration fee"),
        boldBullet("Microsoft Teams", "$0 — no Azure AD registration, no Teams Admin approval needed"),
        boldBullet("Google Meet", "$0 — no Google Workspace API setup needed"),
        boldBullet("Webex", "$0 — no Cisco integration required"),
        para("CuraLive connects to all platforms via Recall.ai's universal bot — the bot joins as a regular meeting participant via the meeting link. If Recall.ai adds support for a new platform in future, CuraLive automatically supports it with zero development work."),

        // ─── 8. IMPLEMENTATION ROADMAP ───
        divider(),
        heading("8. Suggested Implementation Roadmap"),
        spacer(40),
        para("Phase 1 — Foundation (2–3 weeks)", { bold: true }),
        bullet("Database schema: Q&A sessions, questions, votes, compliance flags"),
        bullet("Backend: tRPC router for Q&A CRUD operations"),
        bullet("Ably channels: real-time question submission and status updates"),
        bullet("Attendee interface: mobile-friendly question submission page"),
        bullet("Operator dashboard: basic question queue inside Shadow Mode"),
        spacer(80),
        para("Phase 2 — Intelligence Layer (2–3 weeks)", { bold: true }),
        bullet("AI triage engine: deduplication, theme clustering, relevance scoring"),
        bullet("Compliance screening integration"),
        bullet("Investor identity context cards (Bastion AI integration)"),
        bullet("Smart queue ordering suggestions"),
        spacer(80),
        para("Phase 3 — Advanced Features (2–3 weeks)", { bold: true }),
        bullet("Live sentiment dashboard for incoming questions"),
        bullet("Q&A data integration into AI report pipeline"),
        bullet("Q&A analytics and post-event question summary report"),
        bullet("Operator keyboard shortcuts and efficiency tools"),
        spacer(80),
        para("Phase 4 — Polish & Production (1–2 weeks)", { bold: true }),
        bullet("Load testing with 500+ concurrent attendees"),
        bullet("Accessibility compliance (WCAG)"),
        bullet("Branding customisation (client logos, colours)"),
        bullet("Documentation and operator training materials"),

        // ─── 9. COMPETITIVE ADVANTAGE ───
        divider(),
        heading("9. Why This Makes CuraLive Unique"),
        para("With this module, CuraLive becomes the only platform where an IR team can:"),
        spacer(40),
        bullet("Run an investor event on ANY meeting platform (Zoom, Teams, Meet, Webex)"),
        bullet("Capture full intelligence invisibly via Shadow Mode"),
        bullet("Offer a superior, AI-powered Q&A experience that no meeting platform provides natively"),
        bullet("Screen questions for compliance risk in real time"),
        bullet("Know exactly who is asking each question and why it matters"),
        bullet("Feed every question into post-event intelligence analysis"),
        spacer(80),
        para("All of this at zero platform integration cost — and it's protected under our CIPC patent portfolio (Application 1773575338868).", { bold: true }),

        // ─── FOOTER ───
        divider(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: "CuraLive — Confidential Technical Brief — March 2026", size: 18, color: medGray, italics: true })],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve("/home/runner/workspace/CuraLive_LiveQA_Technical_Brief.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("Word document written to:", outPath);
}

generateBrief().catch(console.error);
