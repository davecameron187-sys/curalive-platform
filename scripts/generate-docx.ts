import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, ShadingType, PageBreak } from "docx";
import * as fs from "fs";

const DARK = "1a1a2e";
const BLUE = "3b82f6";
const SLATE = "64748b";
const WHITE = "FFFFFF";

function heading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, children: [new TextRun({ text, color: DARK, bold: true })] });
}

function para(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({
    alignment: opts.alignment,
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, size: opts.size || 21, color: opts.color })],
    spacing: { after: 120 },
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text, size: 21 })],
    spacing: { after: 60 },
  });
}

function numberedItem(num: number, text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `${num}. ${text}`, size: 21 })],
    spacing: { after: 60 },
    indent: { left: 360 },
  });
}

function makeTable(headers: string[], rows: string[][]) {
  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: "cccccc" };
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, color: WHITE })] })],
          shading: { type: ShadingType.SOLID, color: "334155" },
          borders,
        })
    ),
  });

  const dataRows = rows.map(
    (row, idx) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 18 })], spacing: { after: 40 } })],
              shading: idx % 2 === 1 ? { type: ShadingType.SOLID, color: "f8fafc" } : undefined,
              borders,
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows],
  });
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({ spacing: { before: 2400 } }),
        para("CuraLive", { bold: true, size: 72, color: DARK, alignment: AlignmentType.CENTER }),
        para("Module 31: Live Q&A Intelligence Engine", { bold: true, size: 44, color: BLUE, alignment: AlignmentType.CENTER }),
        para("Technical Build Brief \u2014 March 2026", { size: 28, color: SLATE, alignment: AlignmentType.CENTER }),
        new Paragraph({ spacing: { before: 400 } }),
        para("CIPC Patent App ID 1773575338868 | CIP5 Submission | Claims 46\u201355 | FIG 28\u201330", { italic: true, size: 20, alignment: AlignmentType.CENTER }),
        para("CONFIDENTIAL", { bold: true, size: 24, color: "ef4444", alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new PageBreak()] }),

        heading("1. Executive Summary"),
        para('Module 31 \u2014 the Autonomous Live Q&A Intelligence Engine \u2014 is fully built and integrated into Shadow Mode. It enables real-time attendee question submission during investor events, with AI-powered triage, multi-jurisdictional compliance screening, and operator management through a purpose-built console.'),
        para('The operator never leaves the existing Shadow Mode console. A "Live Q&A" tab gives full control over every question with one-click actions, AI-powered triage, compliance risk indicators, and auto-draft responses.'),
        para("Core stack: React 19 + tRPC + Ably real-time + GPT-4o-mini + MySQL/Drizzle", { bold: true }),
        para("Status: BUILT & DEPLOYED \u2014 1,421 lines across 5 core files", { bold: true }),
        para("Platform: company.curalive.app", { bold: true }),

        heading("2. Architecture Overview"),
        para("The system follows a three-tier architecture connecting attendees, the AI triage engine, and operators through real-time channels:"),
        new Paragraph({
          children: [
            new TextRun({
              text: "Attendee Device --> /qa/:accessCode --> submitQuestion --> LiveQaTriageService (GPT-4o-mini)\n      |\n      v\nlive_qa_questions + live_qa_compliance_flags --> AI triage + scoring\n      |\n      v\nAbly Channel (curalive-qa-{sessionId}) <--> Operator Console (Shadow Mode)\n      |\nqa.submitted / qa.statusChanged --> QuestionCard + PredictiveSidebar\n                                    Approve / Reject / Bot / Legal",
              font: "Courier New",
              size: 16,
            }),
          ],
          spacing: { before: 200, after: 200 },
        }),

        heading("3. Database Schema (4 Tables)"),
        para("Migration script: scripts/create-live-qa-tables.ts", { italic: true }),
        heading("live_qa_sessions", HeadingLevel.HEADING_2),
        makeTable(["Column", "Type", "Description"], [
          ["id", "INT AUTO_INCREMENT PK", "Session ID"],
          ["session_code", "VARCHAR(20) UNIQUE", "8-char access code (e.g., KV3N8P2Q)"],
          ["shadow_session_id", "INT", "Links to Shadow Mode session"],
          ["event_name", "VARCHAR(500)", "Event title"],
          ["client_name", "VARCHAR(255)", "Client/company name"],
          ["qa_session_status", "ENUM", "active / paused / closed"],
          ["total_questions", "INT", "Running count"],
          ["total_approved", "INT", "Running count"],
          ["total_rejected", "INT", "Running count"],
          ["created_at", "TIMESTAMP", "Session creation"],
          ["closed_at", "TIMESTAMP", "When closed"],
        ]),
        new Paragraph({ spacing: { after: 200 } }),

        heading("live_qa_questions", HeadingLevel.HEADING_2),
        makeTable(["Column", "Type", "Description"], [
          ["id", "INT AUTO_INCREMENT PK", "Question ID"],
          ["session_id", "INT", "FK to session"],
          ["question_text", "TEXT", "The question"],
          ["submitter_name", "VARCHAR(200)", "Optional (null if anonymous)"],
          ["submitter_email", "VARCHAR(255)", "Optional, for follow-up"],
          ["submitter_company", "VARCHAR(200)", "Optional (null if anonymous)"],
          ["question_category", "ENUM", "financial / operational / esg / governance / strategy / general"],
          ["question_status", "ENUM", "pending / triaged / approved / answered / rejected / flagged"],
          ["upvotes", "INT", "Attendee upvote count"],
          ["triage_score", "FLOAT", "AI urgency/relevance score (0\u2013100)"],
          ["triage_classification", "VARCHAR(32)", "high_priority / standard / low_priority / duplicate / hostile"],
          ["triage_reason", "TEXT", "AI explanation of classification"],
          ["compliance_risk_score", "FLOAT", "Regulatory risk (0\u2013100)"],
          ["priority_score", "FLOAT", "Combined queue priority (0\u2013100)"],
          ["is_anonymous", "BOOLEAN", "Submitter chose anonymous"],
          ["operator_notes", "TEXT", "Operator-written notes"],
          ["created_at", "BIGINT", "Unix ms timestamp"],
          ["updated_at", "BIGINT", "Unix ms timestamp"],
        ]),
        para("Indexes: session_id, question_status, priority_score", { italic: true }),
        new Paragraph({ spacing: { after: 200 } }),

        heading("live_qa_answers", HeadingLevel.HEADING_2),
        makeTable(["Column", "Type", "Description"], [
          ["id", "INT AUTO_INCREMENT PK", "Answer ID"],
          ["question_id", "INT", "FK to question"],
          ["answer_text", "TEXT", "Response content"],
          ["is_auto_draft", "BOOLEAN", "Generated by AI"],
          ["auto_draft_reasoning", "TEXT", "AI reasoning for the draft"],
          ["approved_by_operator", "BOOLEAN", "Operator approved this draft"],
          ["answered_at", "BIGINT", "Unix ms timestamp"],
        ]),
        new Paragraph({ spacing: { after: 200 } }),

        heading("live_qa_compliance_flags", HeadingLevel.HEADING_2),
        makeTable(["Column", "Type", "Description"], [
          ["id", "INT AUTO_INCREMENT PK", "Flag ID"],
          ["question_id", "INT", "FK to question"],
          ["jurisdiction", "VARCHAR(50)", "ZA_JSE / US_SEC / UK_FCA / EU_ESMA / global"],
          ["risk_score", "FLOAT", "0\u2013100"],
          ["risk_type", "VARCHAR(100)", "material_non_public / forward_looking / insider_trading / selective_disclosure / market_manipulation"],
          ["risk_description", "TEXT", "Explanation"],
          ["recommended_action", "ENUM", "forward / route_to_bot / legal_review / delay_24h"],
          ["auto_remediation_suggestion", "TEXT", "Safe alternative wording"],
          ["resolved", "BOOLEAN", "Operator resolved the flag"],
          ["created_at", "TIMESTAMP", "Flag creation"],
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        heading("4. Backend API \u2014 tRPC Router (liveQa.*)"),
        para("File: server/routers/liveQaRouter.ts (388 lines)", { bold: true }),
        para("Auth: All operator endpoints use operatorProcedure (requires operator or admin role). Public endpoints use publicProcedure.", { italic: true }),
        heading("Operator Endpoints (require login + operator role)", HeadingLevel.HEADING_2),
        makeTable(["Endpoint", "Type", "Description"], [
          ["liveQa.createSession", "Mutation", "Create Q&A session linked to Shadow Mode. Returns session with 8-char access code"],
          ["liveQa.getSession", "Query", "Get session by ID"],
          ["liveQa.getSessionByShadow", "Query", "Get Q&A session linked to a Shadow Mode session"],
          ["liveQa.updateSessionStatus", "Mutation", "Set session to active / paused / closed"],
          ["liveQa.listQuestions", "Query", "List questions with answer count + unresolved compliance flags. Filterable by status"],
          ["liveQa.updateQuestionStatus", "Mutation", "Set question status + optional operator notes. Publishes Ably event"],
          ["liveQa.generateDraft", "Mutation", "AI-generate a compliance-safe draft response (GPT-4o-mini)"],
          ["liveQa.submitAnswer", "Mutation", "Submit operator response, mark as answered. Publishes Ably event"],
          ["liveQa.getAnswers", "Query", "List all answers for a question"],
          ["liveQa.getComplianceFlags", "Query", "List compliance flags for a question"],
          ["liveQa.resolveComplianceFlag", "Mutation", "Mark a compliance flag as resolved"],
          ["liveQa.listSessions", "Query", "List all Q&A sessions"],
        ]),
        new Paragraph({ spacing: { after: 200 } }),

        heading("Public Endpoints (no auth \u2014 attendee-facing)", HeadingLevel.HEADING_2),
        makeTable(["Endpoint", "Type", "Description"], [
          ["liveQa.getSessionByCode", "Query", "Get session info by access code (limited fields)"],
          ["liveQa.submitQuestion", "Mutation", "Submit question with AI triage. Auto-flags if compliance risk > 70"],
          ["liveQa.listQuestionsPublic", "Query", "List approved/triaged/answered questions (hides pending/rejected)"],
          ["liveQa.upvoteQuestion", "Mutation", "Upvote with rate limiting (10s cooldown per fingerprint)"],
        ]),
        new Paragraph({ spacing: { after: 200 } }),

        heading("Real-Time Events (Ably)", HeadingLevel.HEADING_2),
        para("Channel: curalive-qa-{sessionId}", { bold: true }),
        makeTable(["Event", "Trigger", "Payload"], [
          ["qa.submitted", "New question submitted", "questionId, text, category, triageScore, complianceRiskScore, status"],
          ["qa.statusChanged", "Status updated (approve/reject/flag/answer)", "questionId, newStatus, operatorNotes, timestamp"],
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        heading("5. AI Triage Service"),
        para("File: server/services/LiveQaTriageService.ts (142 lines)", { bold: true }),
        para("Model: GPT-4o-mini via invokeLLM", { bold: true }),
        heading("triageQuestion()", HeadingLevel.HEADING_2),
        para("Analyses each submitted question and returns:"),
        bullet("category: financial / operational / esg / governance / strategy / general"),
        bullet("triageScore: 0\u2013100 (urgency/relevance)"),
        bullet("triageClassification: high_priority / standard / low_priority / duplicate / hostile"),
        bullet("triageReason: Natural language explanation"),
        bullet("complianceRiskScore: 0\u2013100 (regulatory risk)"),
        bullet("priorityScore: 0\u2013100 (combined queue ordering)"),
        bullet("complianceFlags[]: Per-jurisdiction flags with risk type, recommended action, and auto-remediation suggestion"),
        para("Jurisdictions screened: ZA_JSE, US_SEC, UK_FCA, EU_ESMA, global", { bold: true }),
        para("Risk types detected: material_non_public, forward_looking, insider_trading, selective_disclosure, market_manipulation", { bold: true }),
        heading("generateAutoDraft()", HeadingLevel.HEADING_2),
        para("Generates a compliance-safe draft response:"),
        bullet("Under 200 words"),
        bullet("Avoids forward-looking statements"),
        bullet("Includes appropriate disclaimers"),
        bullet("Flags if management/legal input needed"),
        bullet("Returns answerText + reasoning"),

        heading("6. Operator Console UI"),
        para("File: client/src/components/LiveQaDashboard.tsx (578 lines)", { bold: true }),
        para('Tab: "Live Q&A" in Shadow Mode (8th tab)', { bold: true }),
        heading("Top Bar", HeadingLevel.HEADING_2),
        bullet("Event title + session code"),
        bullet("Live question count"),
        bullet("Share Link button (copies /qa/{code} to clipboard)"),
        bullet("Pause Q&A / Resume Q&A toggle"),
        bullet("End Q&A button"),
        bullet("Show/Hide Insights toggle"),
        heading("Question Cards", HeadingLevel.HEADING_2),
        para("Each question renders as a QuestionCard with:"),
        bullet("Triage Score Badge: HIGH (red) / MED (amber) / LOW (green) with numeric priority"),
        bullet("Status Badge: Pending / Triaged / Approved / Answered / Rejected / Flagged"),
        bullet("Category Badge: financial / operational / esg / governance / strategy / general"),
        bullet("Compliance Risk Indicator: GREEN (clear) / AMBER (medium) / RED (high risk)"),
        bullet("Submitter Info: Name, company (hidden if anonymous)"),
        bullet("AI Triage Reason: Explanation from the triage engine"),
        bullet("Upvote Count and Unresolved Compliance Flags count"),
        heading("One-Click Actions", HeadingLevel.HEADING_2),
        makeTable(["Button", "Action", "Effect"], [
          ["Approve", "Sets status to approved", "Question visible to attendees, ready for speaker"],
          ["Route to Bot", "Generates AI draft + sets approved", "Opens answer panel with pre-filled AI response"],
          ["Legal Review", "Sets status to flagged", 'Adds operator note "Escalated for Legal Review"'],
          ["Reject", "Sets status to rejected", "Removes from attendee view"],
          ["Generate AI Draft", "Calls generateDraft", "Opens answer panel with AI-generated response"],
          ["Respond", "Expands answer panel", "Operator types/edits response, submits"],
        ]),
        heading("Predictive Sidebar", HeadingLevel.HEADING_2),
        makeTable(["Panel", "Content"], [
          ["Session Analytics", "Total questions, approved count, flagged count, average triage score"],
          ["Live Sentiment", "Real-time compliance risk level (Positive/Neutral/Cautious) with risk bar"],
          ["Materiality Heatmap", "Category distribution with proportional bars"],
          ["Anticipated Questions", "Top 5 predicted analyst questions with match detection"],
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        heading("7. Attendee Q&A Interface"),
        para("File: client/src/pages/AttendeeQA.tsx (224 lines)", { bold: true }),
        para("Route: /qa/:accessCode \u2014 public, no login required, mobile-friendly", { bold: true }),
        bullet("Live event header with session status indicator (pulsing green = live)"),
        bullet("Question submission form (textarea + optional name/company/email + anonymous toggle)"),
        bullet("Character limit: 5\u20132,000 characters"),
        bullet("Real-time question list (5s polling) showing approved/triaged/answered questions"),
        bullet("Upvote button per question (local dedup via votedIds state)"),
        bullet('Category badges and "Answered" status indicator'),
        bullet("Paused/Closed session messaging with appropriate UI states"),
        bullet('Footer: "Powered by CuraLive"'),

        heading("8. Security Model"),
        makeTable(["Layer", "Implementation"], [
          ["Operator auth", "All operator endpoints use operatorProcedure (requires operator or admin role)"],
          ["Public endpoints", "submitQuestion, listQuestionsPublic, getSessionByCode, upvoteQuestion only"],
          ["Upvote abuse prevention", "10-second cooldown per fingerprint, auto-purge of stale entries"],
          ["Insert ID safety", "Uses MySQL insertId from INSERT result (no race condition)"],
          ["SQL injection", "All dynamic queries use parameterized conn.execute(query, params)"],
          ["Data exposure", "Public list only shows triaged/approved/answered questions (hides pending/rejected/flagged)"],
          ["Anonymous submissions", "Name and company stripped at insert time when isAnonymous = true"],
        ]),

        heading("9. Connection Flow (15-Second Start)"),
        numberedItem(1, "Operator logs into company.curalive.app"),
        numberedItem(2, "Goes to Shadow Mode tab"),
        numberedItem(3, "Clicks Live Q&A tab"),
        numberedItem(4, "Clicks Launch Live Q&A Session (auto-links to active Shadow Mode session)"),
        numberedItem(5, "System generates 8-char session code and creates Q&A session"),
        numberedItem(6, "Operator clicks Share Link \u2014 copies company.curalive.app/qa/KV3N8P2Q to clipboard"),
        numberedItem(7, "Sends link to attendees via chat/email/meeting chat"),
        numberedItem(8, "Questions flow in with AI triage in real-time"),
        para("No extra logins. No separate apps. No platform dependencies.", { bold: true }),

        heading("10. File Inventory"),
        makeTable(["File", "Lines", "Purpose"], [
          ["server/routers/liveQaRouter.ts", "388", "tRPC router \u2014 16 endpoints"],
          ["server/services/LiveQaTriageService.ts", "142", "AI triage + auto-draft"],
          ["client/src/components/LiveQaDashboard.tsx", "578", "Operator management console"],
          ["client/src/pages/AttendeeQA.tsx", "224", "Public attendee Q&A page"],
          ["scripts/create-live-qa-tables.ts", "89", "Database migration"],
          ["drizzle/schema.ts", "+65 lines", "4 new table definitions"],
          ["server/routers.eager.ts", "+2 lines", "Router registration"],
          ["server/routers.ts", "+2 lines", "Router registration"],
          ["client/src/App.tsx", "+2 lines", "Route registration"],
          ["client/src/pages/ShadowMode.tsx", "+15 lines", "Tab + content integration"],
        ]),
        para("Total new code: ~1,421 lines", { bold: true }),

        heading("11. Environment & Dependencies"),
        bullet("Runtime: Node.js + tsx (dev), esbuild (prod)"),
        bullet("Database: MySQL via Drizzle ORM"),
        bullet("AI: OpenAI GPT-4o-mini via invokeLLM (existing integration)"),
        bullet("Real-time: Ably (existing integration, ABLY_API_KEY)"),
        bullet("Port: 5000 (dev) / 23636 (prod)"),
        bullet("No new npm packages required \u2014 uses existing stack"),

        heading("12. Potential Enhancements"),
        bullet("Ably client-side subscription in operator console (currently polling at 3s)"),
        bullet("Ably client-side subscription in attendee page (currently polling at 5s)"),
        bullet("Investor Context Cards from Bastion AI (holding size, past sentiment, engagement score)"),
        bullet("Drag-and-drop question reordering"),
        bullet("Blockchain Clean Disclosure Certificate per Q&A session"),
        bullet("Attendee blacklist capability"),
        bullet("Broadcast announcements to all attendees"),
        bullet("Private AI Bot preview pane (see what attendee would receive)"),
        bullet("GDPR/POPIA consent tracking on submission"),
        bullet("Load anticipated questions from Module 19 EventBriefGeneratorService"),

        new Paragraph({ spacing: { before: 600 } }),
        para("CuraLive Module 31 \u2014 Autonomous Live Q&A Intelligence Engine", { italic: true, size: 18, color: SLATE, alignment: AlignmentType.CENTER }),
        para("CIPC Patent App ID 1773575338868 | CIP5 | Claims 46\u201355", { italic: true, size: 18, color: SLATE, alignment: AlignmentType.CENTER }),
        para("Built March 2026", { italic: true, size: 18, color: SLATE, alignment: AlignmentType.CENTER }),
      ],
    },
  ],
});

async function main() {
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync("CuraLive_Module31_LiveQA_TechBrief_March2026.docx", buffer);
  console.log("Word document generated successfully");
  console.log("Size:", (buffer.length / 1024).toFixed(1), "KB");
}

main().catch(console.error);
