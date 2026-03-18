import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak,
} from "docx";
import { writeFileSync } from "fs";

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

function diagramTitle(figNum, titleText) {
  return new Paragraph({
    children: [
      new TextRun({ text: `Figure ${figNum}: `, bold: true, size: 22, color: ACCENT, font: "Calibri" }),
      new TextRun({ text: titleText, bold: true, size: 22, color: NAVY, font: "Calibri" }),
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
      // ══════════════════════════════════════════════════════════════
      // COVER PAGE
      // ══════════════════════════════════════════════════════════════
      new Paragraph({ spacing: { before: 2000 } }),
      title("CuraLive Platform"),
      new Paragraph({
        children: [new TextRun({ text: "CONTINUATION-IN-PART (CIP) SUPPLEMENTARY SPECIFICATION", size: 32, color: ACCENT, font: "Calibri", bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Second Submission to CIPC", size: 28, color: DARK_BLUE, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Autonomous Intelligence Modules 19\u201325", size: 28, color: DARK_BLUE, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", size: 20, color: "CCCCCC" })],
        alignment: AlignmentType.CENTER, spacing: { after: 400 },
      }),
      metaLine("Document Classification", "Confidential \u2014 Patent Filing Support Material"),
      metaLine("Document Type", "Continuation-in-Part (CIP) Supplementary Specification"),
      metaLine("Submission", "Second CIPC Filing"),
      metaLine("Prepared", "18 March 2026"),
      metaLine("Applicant", "David Cameron"),
      metaLine("Address", "41 Rooigras Avenue, 73 Tiffani Gardens, Bassonia, 2090, Johannesburg"),
      metaLine("Contact", "+27 84 444 6001"),
      metaLine("Jurisdiction", "Republic of South Africa"),
      metaLine("Filing Authority", "Companies and Intellectual Property Commission (CIPC)"),
      metaLine("Filing Jurisdiction", "South Africa (CIPC), with PCT international phase intended"),
      metaLine("Production URL", "https://curalive-platform.replit.app"),
      metaLine("GitHub Repository", "github.com/davecameron187-sys/curalive-platform"),
      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        children: [new TextRun({
          text: "\"System and Method for Autonomous Intelligence Orchestration, Self-Healing Regulatory Compliance, Multi-Event Integrity Certification, Agent Swarm Command, Real-Time Valuation Simulation, and Self-Auditing Investor Engagement ROI for Investor Communication Events\"",
          italics: true, size: 22, color: DARK_BLUE, font: "Calibri",
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({ spacing: { before: 200 } }),
      bodyText("Cross-Reference to Related Applications (Parent Filings):"),
      makeTable(["Application ID", "Filing Date", "Status", "Scope"], [
        ["1773575338868", "Mar 12, 2026", "Filed", "Live Event Intelligence Platform (Modules 1\u201313)"],
        ["1773632651890", "Mar 14, 2026", "Filed", "AI Self-Evolution Engine (Module M)"],
        ["1773675815272", "Mar 16, 2026", "Filed", "Specialized Event Analysis"],
        ["1773777427429", "Mar 18, 2026", "Filed", "CIP Submission 1 (Modules 1\u201318)"],
        ["TBD (This Filing)", "Mar 2026", "Pending", "CIP Submission 2 (Modules 19\u201325)"],
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 1. TITLE
      // ══════════════════════════════════════════════════════════════
      sectionHeading("1", "TITLE OF INVENTION"),
      bodyText("System and Method for Autonomous Intelligence Orchestration, Self-Healing Regulatory Compliance, Multi-Event Integrity Certification, Autonomous Agent Swarm Command, Real-Time Valuation Impact Simulation, and Self-Auditing Investor Engagement ROI for Investor Communication Events"),

      // ══════════════════════════════════════════════════════════════
      // 2. FIELD
      // ══════════════════════════════════════════════════════════════
      sectionHeading("2", "FIELD OF THE INVENTION"),
      bodyText("The present invention relates to financial technology and investor relations platforms. More particularly, this Continuation-in-Part (CIP) addendum extends the parent provisional patent to encompass autonomous, self-healing, and self-orchestrating intelligence capabilities that span entire investor communication campaigns without human planning or retraining."),
      bodyText("The invention further relates to methods for autonomous event campaign orchestration, self-healing regulatory compliance with predictive horizon scanning, multi-event blockchain integrity certification, autonomous AI agent swarm coordination across parallel global events, real-time valuation impact simulation during live investor events, and self-auditing investor engagement return-on-investment calculation with cryptographic proof of integrity."),

      // ══════════════════════════════════════════════════════════════
      // 3. BACKGROUND (UPDATED)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("3", "BACKGROUND OF THE INVENTION (UPDATED)"),
      bodyText("The original provisional specification (Submission 1) disclosed real-time monitoring, cross-platform capture via silent agents, AI analysis, OCC integration, and anonymised benchmarking. The CIP Submission 1 further added six advanced modules: Materiality Risk Oracle, Investor Intention Decoder, Cross-Event Consistency Guardian, Predictive Volatility Simulator, Autonomous Regulatory Intervention Engine, and Event Integrity Digital Twin."),
      bodyText("This CIP Submission 2 addresses the next critical gap: autonomous, self-healing, and self-orchestrating intelligence that spans entire investor communication campaigns without human planning or retraining. The following limitations remain unaddressed by prior art and by the parent filings:"),
      numberedItem("1", "No prior art system autonomously designs, schedules, and continuously re-optimises entire multi-event investor campaigns based on historical outcomes and market conditions."),
      numberedItem("2", "No prior art system autonomously adapts to regulatory changes before they take effect, with predictive horizon scanning of 6\u201318 months and zero-downtime model patching."),
      numberedItem("3", "No prior art system links multiple successive investor events into a single verifiable blockchain-certified communication history chain with zero-knowledge privacy proofs."),
      numberedItem("4", "No prior art system autonomously spawns, coordinates, and optimises swarms of AI agents across multiple simultaneous global events with reinforcement-learning resource allocation."),
      numberedItem("5", "No prior art system performs real-time share price valuation simulations during live events, updating intrinsic value estimates based on live sentiment and guidance tone."),
      numberedItem("6", "No prior art system autonomously tracks every investor touchpoint, calculates precise per-investor ROI, and generates self-audited quarterly reports with cryptographic proof of calculation integrity."),

      // ══════════════════════════════════════════════════════════════
      // 4. SUMMARY (UPDATED)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("4", "SUMMARY OF THE INVENTION (UPDATED)"),
      bodyText("The platform now comprises 25 interconnected subsystems (original Modules 1\u201318 from Submissions 1 and CIP 1, plus new autonomous Modules 19\u201325 in this CIP Submission 2). The new modules introduce true platform autonomy \u2014 the ability to orchestrate, heal, certify, and self-audit without human intervention."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("New Autonomous Modules (19\u201325):"),
      makeTable(
        ["Module #", "Subsystem Name", "Novel Capability"],
        [
          ["19", "Autonomous Event Campaign Orchestrator", "RL-based multi-event campaign design, scheduling, and continuous re-optimisation"],
          ["20", "Self-Healing Regulatory Oracle", "Predictive 6\u201318 month horizon scanning + zero-downtime model patching + jurisdiction-specific template generation"],
          ["21", "Autonomous Investor Relationship Graph Weaver", "Dynamic investor influence graph + proactive touchpoint scheduling for capital raise maximisation"],
          ["22", "Self-Certifying Multi-Event Integrity Chain", "Inter-event blockchain hash linking + zero-knowledge proofs + cumulative AAA\u2013NR History Certificate"],
          ["23", "Autonomous AI Agent Swarm Commander", "Dynamic spawning of parallel shadow agents across global events + RL resource allocation + cross-swarm fusion"],
          ["24", "Autonomous Valuation Impact Oracle", "Live Monte-Carlo intrinsic value simulation + fair-value-gap alerts in OCC and teleprompter"],
          ["25", "Self-Auditing Investor Engagement ROI Engine", "Per-investor ROI tracking + cryptographic proof of calculation integrity + self-audited quarterly reports"],
        ]
      ),

      new Paragraph({ spacing: { after: 100 } }),
      bodyText("Combined Platform Summary (All 25 Modules):"),
      makeTable(
        ["#", "Subsystem", "Filing"],
        [
          ["1", "Shadow Bridge & Silent Intelligence", "Submission 1"],
          ["2", "AI Automated Moderator (aiAm)", "Submission 1"],
          ["3", "Module M \u2014 Self-Evolution Engine", "Submission 1"],
          ["4", "Intelligence Suite \u2014 11 AI Algorithms", "Submission 1"],
          ["5", "Operator Control Console (OCC)", "Submission 1"],
          ["6", "Webcasting Engine", "Submission 1"],
          ["7", "Multi-Carrier Telephony", "Submission 1"],
          ["8", "Adaptive Intelligence Thresholds", "Submission 1"],
          ["9", "Autonomous Intervention Engine", "Submission 1"],
          ["10", "Health Guardian", "Submission 1"],
          ["11", "EventEchoPipeline", "Submission 1"],
          ["12", "Enterprise Security Architecture", "Submission 1"],
          ["13", "Materiality Risk Oracle", "CIP Submission 1"],
          ["14", "Investor Intention Decoder", "CIP Submission 1"],
          ["15", "Cross-Event Consistency Guardian", "CIP Submission 1"],
          ["16", "Predictive Volatility Simulator", "CIP Submission 1"],
          ["17", "Autonomous Regulatory Intervention Engine", "CIP Submission 1"],
          ["18", "Event Integrity Digital Twin", "CIP Submission 1"],
          ["19", "Autonomous Event Campaign Orchestrator", "CIP Submission 2 (this filing)"],
          ["20", "Self-Healing Regulatory Oracle", "CIP Submission 2 (this filing)"],
          ["21", "Autonomous Investor Relationship Graph Weaver", "CIP Submission 2 (this filing)"],
          ["22", "Self-Certifying Multi-Event Integrity Chain", "CIP Submission 2 (this filing)"],
          ["23", "Autonomous AI Agent Swarm Commander", "CIP Submission 2 (this filing)"],
          ["24", "Autonomous Valuation Impact Oracle", "CIP Submission 2 (this filing)"],
          ["25", "Self-Auditing Investor Engagement ROI Engine", "CIP Submission 2 (this filing)"],
        ]
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 5. DETAILED DESCRIPTION OF NEW SUBSYSTEMS (MODULES 19-25)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("5", "DETAILED DESCRIPTION OF NEW SUBSYSTEMS (MODULES 19\u201325)"),
      new Paragraph({
        children: [new TextRun({ text: "CIP SUBMISSION 2 \u2014 AUTONOMOUS MODULES 19\u201325", bold: true, size: 32, color: ACCENT, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Continuation-in-Part additions to CIPC filings of March 12\u201318, 2026", size: 22, color: GREY, font: "Calibri", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),

      // ── 5.19 Autonomous Event Campaign Orchestrator ──
      subHeading("5.19", "Autonomous Event Campaign Orchestrator (CIP Module 7)"),
      boldLabel("Refer:", "FIG 17"),
      bodyText("Purpose: The AI autonomously designs, schedules, sequences, and continuously re-optimises entire multi-event investor campaigns (earnings season, roadshow series, AGM cycle) based on historical outcomes, regulatory calendars, investor intent graphs, and market volatility forecasts \u2014 without human input after initial high-level goals."),
      numberedItem("1", "Ingests historical event outcomes including sentiment scores, investor attendance, capital raise conversion rates, and regulatory feedback from all prior campaigns."),
      numberedItem("2", "Uses reinforcement learning to optimise campaign sequence, timing, content strategy, and speaker allocation across multi-event series (e.g., Q1 earnings \u2192 roadshow \u2192 AGM \u2192 Q2 earnings)."),
      numberedItem("3", "Autonomously schedules shadow agents and OCC resources for each event in the campaign based on predicted complexity and risk profile."),
      numberedItem("4", "Dynamically re-plans remaining events in the campaign based on live regulatory signals, market volatility changes, and outcomes from completed events."),
      numberedItem("5", "Generates pre-event strategic briefings including predicted investor concerns, recommended messaging, and optimal presentation structures."),
      numberedItem("6", "Produces campaign performance dashboards with real-time ROI tracking, sentiment trajectory graphs, and investor engagement funnels."),
      numberedItem("7", "Supports multi-geography campaign planning with timezone optimisation, regulatory calendar awareness, and cross-jurisdiction compliance checks."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art system autonomously designs and continuously re-optimises multi-event investor campaigns using reinforcement learning."),
      claimBullet("Dynamic re-planning of remaining campaign events based on live outcomes from completed events."),
      claimBullet("Autonomous shadow agent and OCC resource scheduling based on predicted event risk profiles."),
      divider(),

      // ── 5.20 Self-Healing Regulatory Oracle ──
      subHeading("5.20", "Self-Healing Regulatory Oracle (CIP Module 8 \u2014 Expanded)"),
      boldLabel("Refer:", "FIG 18"),
      bodyText("Purpose: A meta-agent continuously monitors global regulatory changes (SEC, JSE, FCA, EU MAR) via legal feeds and case law. It pre-emptively updates all compliance classifiers, thresholds, and response templates across every module before new rules take effect."),
      numberedItem("1", "Continuous ingestion of global regulatory updates from SEC EDGAR, JSE SENS, FCA Register, EU MAR notifications, and legal commentary feeds."),
      numberedItem("2", "Predictive impact modelling with 6\u201318 month horizon scanning: analyses proposed regulations, consultation papers, and parliamentary bills to predict future compliance requirements before enactment."),
      numberedItem("3", "Autonomous generation and deployment of updated classifiers and templates with zero-downtime patching \u2014 new compliance models are hot-swapped without service interruption."),
      numberedItem("4", "Rollback safety gates: if updated classifiers produce anomalous results (false positive rate exceeds threshold), the system automatically rolls back to the prior version and flags for review."),
      numberedItem("5", "Jurisdiction-specific template generation: automatically creates jurisdiction-appropriate response templates, filing formats, and disclosure language (e.g., SENS for JSE, 8-K for SEC, RNS for FCA)."),
      numberedItem("6", "Blockchain-logged adaptation records: every classifier update, threshold change, and template revision is cryptographically logged for audit-proof compliance demonstration."),
      numberedItem("7", "Regulatory change impact scoring: each detected regulatory change is scored for impact severity, affected modules, and estimated compliance effort."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art system performs predictive regulatory horizon scanning with autonomous pre-emptive model updates."),
      claimBullet("Zero-downtime classifier patching with automatic rollback safety gates."),
      claimBullet("Blockchain-logged adaptation records for audit-proof regulatory compliance demonstration."),
      divider(),

      pageBreak(),

      // ── 5.21 Autonomous Investor Relationship Graph Weaver ──
      subHeading("5.21", "Autonomous Investor Relationship Graph Weaver (CIP Module 9)"),
      boldLabel("Refer:", "FIG 17 (Campaign context), FIG 20 (Swarm integration)"),
      bodyText("Purpose: The AI autonomously builds and evolves a global investor influence graph from every interaction across events, emails, and shadow sessions. It proactively suggests and schedules optimal next-touchpoints to maximise engagement and capital raise probability."),
      numberedItem("1", "Constructs a dynamic knowledge graph of investor relationships with nodes representing investors, companies, events, topics, and outcomes."),
      numberedItem("2", "Edge weights continuously updated based on: attendance frequency, question sentiment, engagement duration, follow-up meeting conversion, and capital allocation history."),
      numberedItem("3", "Graph embedding algorithms identify hidden influence clusters \u2014 groups of investors who co-attend events, ask similar questions, or share investment theses."),
      numberedItem("4", "Proactive touchpoint scheduling: based on graph analysis, the system autonomously recommends and schedules optimal next interactions (one-on-ones, roadshow meetings, targeted webcasts)."),
      numberedItem("5", "Capital raise probability scoring: for each investor node, the system calculates a dynamic probability of capital allocation based on engagement patterns, sentiment trajectory, and peer behaviour."),
      numberedItem("6", "Relationship health monitoring: alerts when key investor relationships show declining engagement, sentiment deterioration, or competitor-directed activity."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art system autonomously builds and evolves a global investor influence graph from multi-channel event interactions."),
      claimBullet("Proactive touchpoint scheduling based on graph-derived capital raise probability maximisation."),
      claimBullet("Hidden influence cluster detection using graph embedding algorithms on investor behaviour data."),
      divider(),

      // ── 5.22 Self-Certifying Multi-Event Integrity Chain ──
      subHeading("5.22", "Self-Certifying Multi-Event Integrity Chain (CIP Module 10 \u2014 Expanded)"),
      boldLabel("Refer:", "FIG 19"),
      bodyText("Purpose: Extends Module 18 (Event Integrity Digital Twin). The AI links multiple events (Q1 earnings \u2192 roadshow \u2192 AGM \u2192 Q2 earnings) into a single verifiable \"Investor Communication History Chain\" on blockchain."),
      numberedItem("1", "Inter-event hash linking: the final hash of each event's digital twin becomes the genesis hash of the subsequent event's chain, creating an unbroken cryptographic link across the entire investor communication history."),
      numberedItem("2", "Zero-knowledge proofs for privacy: enables regulators and auditors to verify the integrity and consistency of the communication chain without accessing the underlying transcript content."),
      numberedItem("3", "Cumulative \"Clean Disclosure History Certificate\" with AAA\u2013NR grading: a single certificate spanning the entire campaign or fiscal year, graded on cumulative disclosure quality, consistency, and regulatory compliance."),
      numberedItem("4", "Automatic anomaly detection for long-term messaging drift: the system detects when executive messaging gradually shifts over multiple events, even when individual events appear internally consistent."),
      numberedItem("5", "Cross-event contradiction scoring: identifies statements in the current event that contradict positions taken in any prior linked event."),
      numberedItem("6", "Regulatory submission package: automatically generates a complete, verifiable disclosure package suitable for submission to JSE, SEC, or FCA upon request."),
      numberedItem("7", "Independent verification portal: external parties (regulators, auditors, institutional investors) can verify certificate authenticity using only the public hash chain."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art creates a cryptographically linked multi-event investor communication history chain."),
      claimBullet("Zero-knowledge proofs enabling integrity verification without content disclosure."),
      claimBullet("Cumulative Clean Disclosure History Certificate spanning entire fiscal years with AAA\u2013NR grading."),
      divider(),

      pageBreak(),

      // ── 5.23 Autonomous AI Agent Swarm Commander ──
      subHeading("5.23", "Autonomous AI Agent Swarm Commander (CIP Module 11)"),
      boldLabel("Refer:", "FIG 20"),
      bodyText("Purpose: The system autonomously spawns, coordinates, and optimises swarms of shadow AI agents across multiple simultaneous global events. It dynamically allocates compute, re-prioritises high-risk events, and merges intelligence into a unified command view."),
      numberedItem("1", "Dynamic agent spawning: when multiple investor events occur simultaneously (e.g., multiple companies reporting earnings on the same day), the system autonomously spawns independent shadow agents for each event."),
      numberedItem("2", "Real-time resource allocation using reinforcement learning: compute resources (transcription, AI analysis, sentiment scoring) are dynamically allocated based on event priority, risk profile, and real-time complexity assessment."),
      numberedItem("3", "Cross-swarm intelligence fusion: insights from parallel events are correlated in real time \u2014 identifying sector-wide trends, peer company comparisons, and market-moving patterns that emerge only when viewing multiple events together."),
      numberedItem("4", "Unified command dashboard: the OCC displays a consolidated view of all active swarm agents with per-event status, risk indicators, and escalation flags."),
      numberedItem("5", "Autonomous escalation: if any agent detects a critical compliance breach, significant sentiment shift, or material disclosure, it autonomously escalates to the unified command view with priority override."),
      numberedItem("6", "Agent health monitoring: each swarm agent is continuously monitored for performance degradation, connectivity issues, or analysis accuracy drift. Unhealthy agents are automatically replaced with fresh instances."),
      numberedItem("7", "Post-session cross-event intelligence report: after all simultaneous events conclude, the system generates a unified cross-event intelligence report highlighting sector trends, relative company performance, and market implications."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art autonomously spawns and coordinates swarms of AI agents across parallel investor events."),
      claimBullet("Reinforcement learning-based dynamic compute resource allocation for parallel event monitoring."),
      claimBullet("Cross-swarm intelligence fusion for identifying sector-wide trends across simultaneous events."),
      divider(),

      // ── 5.24 Autonomous Valuation Impact Oracle ──
      subHeading("5.24", "Autonomous Valuation Impact Oracle (CIP Module 12)"),
      boldLabel("Refer:", "FIG 21"),
      bodyText("Purpose: The AI autonomously runs real-time share price valuation simulations during live events, updating intrinsic value estimates based on live sentiment, guidance tone, and market reaction forecasts. It displays live valuation cones and \"fair value gap\" alerts in the OCC and teleprompter."),
      numberedItem("1", "Continuous ingestion of live transcript vectors, sentiment scores, guidance language analysis, and market microstructure data during the event."),
      numberedItem("2", "Real-time Monte-Carlo valuation simulations: runs 1,000+ parallel scenarios computing intrinsic value estimates using discounted cash flow (DCF), comparable company analysis, and precedent transaction models."),
      numberedItem("3", "Live valuation cone display: shows the evolving probability distribution of fair value estimates as the event progresses, with the cone narrowing as more information is disclosed."),
      numberedItem("4", "Fair-value-gap alerts: when the current market price diverges significantly from the AI's evolving fair value estimate, alerts are generated in the OCC and optionally on the speaker's teleprompter."),
      numberedItem("5", "Guidance impact modelling: when executives provide forward guidance, the system instantly recalculates valuation implications and displays the impact delta."),
      numberedItem("6", "Peer comparison valuation: simultaneously monitors peer company valuations and relative value positioning during the event."),
      numberedItem("7", "Post-event valuation accuracy tracking: after market close, the system compares its live predictions against actual price movements to continuously improve model accuracy."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art performs real-time intrinsic valuation simulations during live investor events with live-updated fair value cones."),
      claimBullet("Fair-value-gap alerts delivered to operator console and teleprompter during live events."),
      claimBullet("Post-event valuation accuracy tracking for continuous model improvement."),
      divider(),

      pageBreak(),

      // ── 5.25 Self-Auditing Investor Engagement ROI Engine ──
      subHeading("5.25", "Self-Auditing Investor Engagement ROI Engine (CIP Module 13)"),
      boldLabel("Refer:", "FIG 22"),
      bodyText("Purpose: The AI autonomously tracks every investor touchpoint, calculates precise ROI per investor (capital raised, meeting conversion, sentiment shift), and generates self-audited quarterly reports with cryptographic proof of calculation integrity."),
      numberedItem("1", "Comprehensive touchpoint tracking: every interaction with every investor is logged across all channels \u2014 events attended, questions asked, shadow session observations, follow-up meetings, email exchanges, and capital allocation decisions."),
      numberedItem("2", "Per-investor ROI calculation: for each investor in the graph, the system calculates precise return on engagement investment including: cost of touchpoints (events, travel, time), capital raised or committed, sentiment trajectory, and meeting conversion rates."),
      numberedItem("3", "Campaign ROI attribution: allocates capital raise outcomes to specific events and touchpoints in the campaign, enabling precise understanding of which investor relations activities drive the most value."),
      numberedItem("4", "Self-audited quarterly reports: generates comprehensive quarterly investor engagement reports with full calculation methodology, data sources, and assumptions documented for audit review."),
      numberedItem("5", "Cryptographic proof of calculation integrity: every ROI calculation is cryptographically hashed with its input data, methodology, and parameters. Any subsequent query can verify that the reported figures were computed from the stated inputs using the stated methodology."),
      numberedItem("6", "Benchmark comparison: ROI metrics are compared against industry benchmarks from the anonymised aggregate dataset (Module 7/Submission 1), enabling relative performance assessment."),
      numberedItem("7", "Predictive ROI modelling: based on historical touchpoint-to-outcome patterns, the system predicts expected ROI for proposed future investor engagement activities, enabling data-driven IR budget allocation."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art system calculates per-investor ROI with cryptographic proof of calculation integrity."),
      claimBullet("Self-audited quarterly reports with verifiable methodology and data source documentation."),
      claimBullet("Predictive ROI modelling for data-driven investor relations budget allocation."),

      divider(),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 6. ALTERNATIVE IMPLEMENTATIONS
      // ══════════════════════════════════════════════════════════════
      sectionHeading("6", "ALTERNATIVE IMPLEMENTATIONS"),
      bodyText("The systems and methods described in this supplementary specification may be implemented using a variety of computational architectures and analytical techniques."),
      bodyText("The reinforcement learning systems described for campaign orchestration and swarm resource allocation may use any suitable RL algorithm including but not limited to: Q-learning, policy gradient methods, proximal policy optimisation (PPO), actor-critic methods, or multi-agent reinforcement learning (MARL) frameworks."),
      bodyText("The blockchain certification systems may utilise any distributed ledger technology including but not limited to: Ethereum, Hyperledger Fabric, Polygon, or private blockchain implementations. Zero-knowledge proof implementations may use zk-SNARKs, zk-STARKs, Bulletproofs, or equivalent cryptographic proof systems."),
      bodyText("The graph database systems for investor relationship management may utilise any graph database technology including but not limited to: Neo4j, Amazon Neptune, TigerGraph, or property graph models implemented on relational databases."),
      bodyText("The valuation models may use any financial modelling methodology including but not limited to: discounted cash flow (DCF), dividend discount models (DDM), comparable company analysis, precedent transaction analysis, or hybrid AI-enhanced valuation approaches."),
      bodyText("The specific examples described in this specification are provided for illustrative purposes and should not be interpreted as limiting the scope of the invention to any particular technology, platform, deployment model, or implementation approach."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 7. CLAIMS (26-31)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("7", "NEW INDEPENDENT CLAIMS (CIP ADDENDUM)"),
      bodyText("The following claims are additional to and supplement Claims 1\u201325 of the parent specifications."),
      new Paragraph({ spacing: { after: 200 } }),

      claimParagraph("Claim 26 (CIP)", "A computer-implemented method for autonomous orchestration of multi-event investor communication campaigns, comprising: (a) ingesting outcomes from prior events including sentiment scores, investor attendance, capital raise conversion rates, and regulatory feedback; (b) using reinforcement learning to optimise campaign sequence, timing, content strategy, and speaker allocation; (c) autonomously scheduling shadow agents and OCC resources for each event based on predicted complexity and risk profile; (d) dynamically re-planning remaining events in the campaign based on live regulatory signals, market volatility changes, and outcomes from completed events; and (e) generating campaign performance dashboards with real-time ROI tracking and investor engagement funnels."),

      claimParagraph("Claim 27 (CIP)", "A self-healing regulatory oracle comprising: (a) real-time ingestion of global regulatory updates from SEC, JSE, FCA, and EU MAR notification feeds; (b) predictive impact modelling with 6\u201318 month horizon scanning of proposed regulations, consultation papers, and parliamentary bills; (c) autonomous generation and deployment of updated compliance classifiers and response templates with zero-downtime patching; (d) rollback safety gates that automatically revert to prior classifier versions when anomalous results are detected; (e) jurisdiction-specific template generation for SENS, 8-K, RNS, and equivalent disclosure formats; and (f) blockchain-logged adaptation records for audit-proof regulatory compliance demonstration."),

      claimParagraph("Claim 28 (CIP)", "A method for creating a self-certifying multi-event integrity chain, comprising: (a) cryptographically linking digital twins of successive investor events into a single verifiable chain where the final hash of each event becomes the genesis hash of the subsequent event; (b) autonomous consistency scoring across the entire communication history; (c) detection of long-term messaging drift across multiple events even when individual events appear internally consistent; (d) zero-knowledge proof generation enabling regulators to verify chain integrity without accessing underlying transcript content; and (e) issuance of a cumulative Clean Disclosure History Certificate with AAA\u2013NR grading verifiable by regulators and investors through an independent verification portal."),

      claimParagraph("Claim 29 (CIP)", "An autonomous AI agent swarm commander for parallel investor events, comprising: (a) dynamic spawning of multiple silent shadow agents across simultaneous global investor meetings; (b) real-time compute resource allocation using reinforcement learning based on event priority, risk profile, and complexity assessment; (c) cross-swarm intelligence fusion for identifying sector-wide trends and peer company comparisons across parallel events; (d) unified command dashboard with per-event status, risk indicators, and autonomous escalation to the OCC for critical events; (e) agent health monitoring with automatic replacement of degraded agent instances; and (f) post-session cross-event intelligence report generation highlighting market implications."),

      claimParagraph("Claim 30 (CIP)", "An autonomous valuation impact oracle comprising: (a) continuous ingestion of live transcript vectors, sentiment scores, and market microstructure data during investor events; (b) real-time Monte-Carlo valuation simulations with 1,000+ parallel scenarios using DCF, comparable company, and precedent transaction models; (c) live valuation cone display showing evolving probability distribution of fair value estimates; (d) fair-value-gap alerts generated in the operator console and teleprompter when market price diverges from AI fair value estimates; (e) guidance impact modelling that instantly recalculates valuation implications when executives provide forward guidance; and (f) post-event valuation accuracy tracking for continuous model improvement."),

      claimParagraph("Claim 31 (CIP)", "A self-auditing investor engagement ROI engine comprising: (a) autonomous tracking of every investor touchpoint across all channels including events, shadow sessions, follow-up meetings, and capital allocation decisions; (b) per-investor ROI calculation including cost of touchpoints, capital raised, sentiment trajectory, and meeting conversion rates; (c) campaign ROI attribution allocating capital raise outcomes to specific events and touchpoints; (d) generation of self-audited quarterly reports with documented calculation methodology, data sources, and assumptions; (e) cryptographic proof of calculation integrity where every ROI figure is hashed with its inputs and methodology for independent verification; and (f) predictive ROI modelling for proposed future engagement activities enabling data-driven IR budget allocation."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 8. FIGURES AND DIAGRAMS (FIG 17-22)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("8", "UPDATED DRAWINGS (NEW FIGURES FOR CIP SUBMISSION 2)"),
      bodyText("The following figures (FIG 17\u201322) supplement Figures 1\u201316 of the parent specifications."),
      new Paragraph({ spacing: { after: 200 } }),

      // ── FIG 17: Autonomous Campaign Orchestrator Architecture ──
      diagramTitle(17, "Autonomous Campaign Orchestrator Architecture (Module 19)"),
      ...diagramBlock([
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  HIGH-LEVEL CAMPAIGN GOALS               \u2502",
        "          \u2502  (earnings season / roadshow / AGM cycle) \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                             \u2502",
        "                             \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  REINFORCEMENT LEARNING ENGINE             \u2502",
        "          \u2502  \u2022 Historical outcomes analysis            \u2502",
        "          \u2502  \u2022 Regulatory calendar awareness           \u2502",
        "          \u2502  \u2022 Market volatility forecasts             \u2502",
        "          \u2502  \u2022 Investor intent graph inputs            \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                             \u2502",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u25BC                       \u25BC",
        "  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "  \u2502  CAMPAIGN SCHEDULE  \u2502  \u2502  RESOURCE PLANNER  \u2502",
        "  \u2502  \u2022 Event sequence   \u2502  \u2502  \u2022 Shadow agents   \u2502",
        "  \u2502  \u2022 Timing optim.   \u2502  \u2502  \u2022 OCC allocation  \u2502",
        "  \u2502  \u2022 Speaker alloc.  \u2502  \u2502  \u2022 Compute reserve \u2502",
        "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "            \u2502                       \u2502",
        "            \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  LIVE EXECUTION & RE-PLANNING              \u2502",
        "          \u2502  \u2022 Monitor completed event outcomes        \u2502",
        "          \u2502  \u2022 Dynamic re-plan remaining events       \u2502",
        "          \u2502  \u2022 Campaign performance dashboard         \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      // ── FIG 18: Self-Healing Regulatory Oracle ──
      diagramTitle(18, "Self-Healing Regulatory Oracle \u2014 Horizon Scanning Pipeline (Module 20)"),
      ...diagramBlock([
        "  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "  \u2502 SEC EDGAR   \u2502  \u2502 JSE SENS    \u2502  \u2502 FCA Register\u2502  \u2502 EU MAR      \u2502",
        "  \u2502 Updates     \u2502  \u2502 Notices     \u2502  \u2502 Changes     \u2502  \u2502 Directives  \u2502",
        "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "         \u2502              \u2502              \u2502              \u2502",
        "         \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  PREDICTIVE HORIZON SCANNER               \u2502",
        "          \u2502  6\u201318 month forward analysis              \u2502",
        "          \u2502  \u2022 Proposed regulations                   \u2502",
        "          \u2502  \u2022 Consultation papers                    \u2502",
        "          \u2502  \u2022 Parliamentary bills                    \u2502",
        "          \u2502  \u2022 Regulatory impact scoring              \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                             \u2502",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u25BC                       \u25BC",
        "  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "  \u2502 CLASSIFIER UPDATER\u2502  \u2502 TEMPLATE GENERATOR\u2502",
        "  \u2502 \u2022 Zero-downtime   \u2502  \u2502 \u2022 SENS (JSE)      \u2502",
        "  \u2502   hot-swap        \u2502  \u2502 \u2022 8-K  (SEC)      \u2502",
        "  \u2502 \u2022 Rollback gates  \u2502  \u2502 \u2022 RNS  (FCA)      \u2502",
        "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "            \u2502                       \u2502",
        "            \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  BLOCKCHAIN ADAPTATION LOG               \u2502",
        "          \u2502  \u2022 Every update cryptographically logged  \u2502",
        "          \u2502  \u2022 Audit-proof compliance record          \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),

      pageBreak(),

      // ── FIG 19: Multi-Event Integrity Chain ──
      diagramTitle(19, "Multi-Event Integrity Chain \u2014 Blockchain Linking (Module 22)"),
      ...diagramBlock([
        "  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510     \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510     \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "  \u2502  Q1 EARNINGS    \u2502     \u2502   ROADSHOW      \u2502     \u2502     AGM         \u2502",
        "  \u2502  DIGITAL TWIN   \u2502     \u2502  DIGITAL TWIN   \u2502     \u2502  DIGITAL TWIN  \u2502",
        "  \u2502                 \u2502     \u2502                 \u2502     \u2502                \u2502",
        "  \u2502 Genesis: 0x00  \u2502     \u2502 Genesis:        \u2502     \u2502 Genesis:       \u2502",
        "  \u2502 Seg 1: a3f2.. \u2502     \u2502   = Q1 Final    \u2502     \u2502   = RS Final   \u2502",
        "  \u2502 Seg 2: 7b1c.. \u2502     \u2502 Seg 1: d4e5..  \u2502     \u2502 Seg 1: f6g7.. \u2502",
        "  \u2502 ...           \u2502     \u2502 Seg 2: h8i9..  \u2502     \u2502 Seg 2: j0k1.. \u2502",
        "  \u2502 Final: c9d8.. \u2502\u2500\u2500\u2500\u25B6\u2502 ...            \u2502     \u2502 ...           \u2502",
        "  \u2502               \u2502     \u2502 Final: m2n3.. \u2502\u2500\u2500\u2500\u25B6\u2502 Final: p4q5.. \u2502",
        "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518     \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518     \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                                                       \u2502",
        "                                                       \u25BC",
        "                              \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "                              \u2502  CUMULATIVE HISTORY CERTIFICATE    \u2502",
        "                              \u2502                                    \u2502",
        "                              \u2502  Chain: Q1 \u2192 RS \u2192 AGM              \u2502",
        "                              \u2502  Grade: AAA | AA | A | BBB | NR    \u2502",
        "                              \u2502  Consistency: Cross-event score    \u2502",
        "                              \u2502  Drift Detection: Long-term trend  \u2502",
        "                              \u2502                                    \u2502",
        "                              \u2502  Zero-Knowledge Proof:             \u2502",
        "                              \u2502  Verifiable without content access  \u2502",
        "                              \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 20: Autonomous Swarm Commander ──
      diagramTitle(20, "Autonomous Swarm Commander \u2014 Resource Allocation (Module 23)"),
      ...diagramBlock([
        "                  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "                  \u2502    SWARM COMMAND CONTROLLER         \u2502",
        "                  \u2502    Reinforcement Learning Engine    \u2502",
        "                  \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518",
        "                       \u2502        \u2502        \u2502        \u2502",
        "                  \u250C\u2500\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2510",
        "                  \u2502Agent #1 \u2502\u2502Agent #2 \u2502\u2502Agent #3 \u2502\u2502Agent #N \u2502",
        "                  \u2502         \u2502\u2502         \u2502\u2502         \u2502\u2502         \u2502",
        "                  \u2502Company A\u2502\u2502Company B\u2502\u2502Company C\u2502\u2502Company N\u2502",
        "                  \u2502Earnings \u2502\u2502Earnings \u2502\u2502AGM      \u2502\u2502Roadshow \u2502",
        "                  \u2502         \u2502\u2502         \u2502\u2502         \u2502\u2502         \u2502",
        "                  \u2502Risk: MED\u2502\u2502Risk: HI \u2502\u2502Risk: LOW\u2502\u2502Risk: HI \u2502",
        "                  \u2502CPU: 15% \u2502\u2502CPU: 35% \u2502\u2502CPU: 10% \u2502\u2502CPU: 40% \u2502",
        "                  \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518",
        "                       \u2502        \u2502        \u2502        \u2502",
        "                       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                                \u25BC",
        "                  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "                  \u2502  CROSS-SWARM INTELLIGENCE FUSION   \u2502",
        "                  \u2502  \u2022 Sector-wide trend detection      \u2502",
        "                  \u2502  \u2022 Peer company comparison          \u2502",
        "                  \u2502  \u2022 Market-moving pattern alerts     \u2502",
        "                  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                                 \u25BC",
        "                  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "                  \u2502  UNIFIED COMMAND DASHBOARD (OCC)   \u2502",
        "                  \u2502  \u2022 Per-event status + risk flags    \u2502",
        "                  \u2502  \u2022 Autonomous escalation            \u2502",
        "                  \u2502  \u2022 Agent health monitoring          \u2502",
        "                  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),

      pageBreak(),

      // ── FIG 21: Valuation Impact Oracle ──
      diagramTitle(21, "Valuation Impact Oracle \u2014 Live Simulation Flow (Module 24)"),
      ...diagramBlock([
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  LIVE EVENT DATA INGESTION               \u2502",
        "          \u2502  \u2022 Transcript vectors                    \u2502",
        "          \u2502  \u2022 Sentiment scores                      \u2502",
        "          \u2502  \u2022 Guidance language analysis             \u2502",
        "          \u2502  \u2022 Market microstructure data             \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                             \u2502",
        "                             \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  MONTE-CARLO VALUATION ENGINE            \u2502",
        "          \u2502  1,000+ parallel scenarios                \u2502",
        "          \u2502  \u2022 DCF model                              \u2502",
        "          \u2502  \u2022 Comparable company analysis            \u2502",
        "          \u2502  \u2022 Precedent transaction model            \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                             \u2502",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u25BC                       \u25BC",
        "  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "  \u2502 VALUATION CONE   \u2502  \u2502 FAIR VALUE GAP   \u2502",
        "  \u2502                  \u2502  \u2502    ALERTS         \u2502",
        "  \u2502 Probability      \u2502  \u2502                  \u2502",
        "  \u2502 distribution     \u2502  \u2502 Market: R42.50   \u2502",
        "  \u2502 narrows as       \u2502  \u2502 AI Fair: R48.20  \u2502",
        "  \u2502 event progresses \u2502  \u2502 Gap: +13.4%      \u2502",
        "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "            \u2502                       \u2502",
        "            \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  DELIVERED TO:                           \u2502",
        "          \u2502  \u2022 OCC Dashboard (operator)              \u2502",
        "          \u2502  \u2022 Teleprompter (speaker)                \u2502",
        "          \u2502  \u2022 Guidance impact delta display         \u2502",
        "          \u2502  \u2022 Post-event accuracy tracking          \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 22: Self-Auditing ROI Engine ──
      diagramTitle(22, "Self-Auditing ROI Engine \u2014 Cryptographic Proof Pipeline (Module 25)"),
      ...diagramBlock([
        "  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "  \u2502 EVENT           \u2502  \u2502 SHADOW          \u2502  \u2502 FOLLOW-UP       \u2502",
        "  \u2502 TOUCHPOINTS     \u2502  \u2502 SESSIONS        \u2502  \u2502 MEETINGS        \u2502",
        "  \u2502 \u2022 Attendance   \u2502  \u2502 \u2022 Observations  \u2502  \u2502 \u2022 Conversions   \u2502",
        "  \u2502 \u2022 Questions    \u2502  \u2502 \u2022 Sentiment     \u2502  \u2502 \u2022 Capital alloc \u2502",
        "  \u2502 \u2022 Engagement   \u2502  \u2502 \u2022 Intent data   \u2502  \u2502 \u2022 Email trails  \u2502",
        "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "           \u2502                \u2502                \u2502",
        "           \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                            \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  PER-INVESTOR ROI CALCULATOR              \u2502",
        "          \u2502  \u2022 Cost of touchpoints (time, travel)     \u2502",
        "          \u2502  \u2022 Capital raised/committed               \u2502",
        "          \u2502  \u2022 Sentiment trajectory                   \u2502",
        "          \u2502  \u2022 Meeting conversion rate                \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                             \u2502",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u25BC                       \u25BC",
        "  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "  \u2502 QUARTERLY REPORT \u2502  \u2502 CRYPTO PROOF     \u2502",
        "  \u2502                  \u2502  \u2502                  \u2502",
        "  \u2502 \u2022 Self-audited  \u2502  \u2502 Hash =           \u2502",
        "  \u2502 \u2022 Methodology   \u2502  \u2502 SHA-256(inputs + \u2502",
        "  \u2502   documented    \u2502  \u2502 methodology +    \u2502",
        "  \u2502 \u2022 Data sources  \u2502  \u2502 parameters)      \u2502",
        "  \u2502   listed        \u2502  \u2502                  \u2502",
        "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2502 Independent      \u2502",
        "            \u2502            \u2502 verification     \u2502",
        "            \u2502            \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "            \u2502                       \u2502",
        "            \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u25BC",
        "          \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502  PREDICTIVE ROI MODELLING                \u2502",
        "          \u2502  \u2022 Expected ROI for proposed activities   \u2502",
        "          \u2502  \u2022 Data-driven IR budget allocation      \u2502",
        "          \u2502  \u2022 Industry benchmark comparison         \u2502",
        "          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 9. CLAIMS SUMMARY TABLE
      // ══════════════════════════════════════════════════════════════
      sectionHeading("9", "COMPLETE CLAIMS SUMMARY"),
      bodyText("The following table summarises all 31 independent claims across both submissions:"),
      new Paragraph({ spacing: { after: 100 } }),
      makeTable(
        ["Claim #", "Type", "Subsystem", "Filing"],
        [
          ["1\u201315", "System", "Core platform (Modules 1\u201313)", "Submission 1"],
          ["16\u201320", "Method", "Cross-platform, benchmarking, collaborative, self-improving", "Submission 1"],
          ["21\u201325", "Autonomous", "Self-evolving platform intelligence", "CIP Submission 1"],
          ["26", "CIP Method", "Autonomous Campaign Orchestrator (Module 19)", "CIP Submission 2"],
          ["27", "CIP System", "Self-Healing Regulatory Oracle (Module 20)", "CIP Submission 2"],
          ["28", "CIP Method", "Multi-Event Integrity Chain (Module 22)", "CIP Submission 2"],
          ["29", "CIP System", "AI Agent Swarm Commander (Module 23)", "CIP Submission 2"],
          ["30", "CIP System", "Valuation Impact Oracle (Module 24)", "CIP Submission 2"],
          ["31", "CIP System", "Self-Auditing ROI Engine (Module 25)", "CIP Submission 2"],
        ]
      ),

      new Paragraph({ spacing: { before: 400 } }),
      bodyText("End of Continuation-in-Part Supplementary Specification"),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [new TextRun({ text: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", size: 20, color: "CCCCCC" })],
        alignment: AlignmentType.CENTER, spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "CuraLive \u2014 Confidential | CIP Supplementary Specification | Second CIPC Submission | March 2026",
          size: 18, color: GREY, font: "Calibri", italics: true,
        })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Applicant: David Cameron | 41 Rooigras Avenue, 73 Tiffani Gardens, Bassonia, 2090, Johannesburg | +27 84 444 6001",
          size: 18, color: GREY, font: "Calibri", italics: true,
        })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync("CuraLive_CIPC_CIP_Submission_2_Modules_19-25.docx", buf);
console.log(`Done  =>  CuraLive_CIPC_CIP_Submission_2_Modules_19-25.docx  (${(buf.length / 1024).toFixed(1)} KB)`);
