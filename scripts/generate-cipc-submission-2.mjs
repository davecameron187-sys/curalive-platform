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

function title(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 52, color: NAVY, font: "Calibri" })],
    spacing: { after: 100 },
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
      new Paragraph({ spacing: { before: 1800 } }),
      new Paragraph({
        children: [new TextRun({ text: "CONTINUATION-IN-PART (CIP)", size: 28, color: ACCENT, font: "Calibri", bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "SUPPLEMENTARY PATENT SPECIFICATION", size: 28, color: ACCENT, font: "Calibri", bold: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      title("CuraLive Platform"),
      new Paragraph({
        children: [new TextRun({ text: "Second Submission to CIPC", size: 28, color: DARK_BLUE, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Autonomous Intelligence Modules 19\u201327", size: 28, color: DARK_BLUE, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "(Extending Modules 1\u201318 and Claims 1\u201325 of the Parent Provisional)", size: 22, color: GREY, font: "Calibri", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", size: 20, color: "CCCCCC" })],
        alignment: AlignmentType.CENTER, spacing: { after: 400 },
      }),
      metaLine("Document Classification", "Confidential \u2014 Patent Filing Support Material"),
      metaLine("Document Type", "Continuation-in-Part (CIP) Supplementary Specification"),
      metaLine("Submission Number", "Second CIPC Filing"),
      metaLine("Prepared", "18 March 2026"),
      new Paragraph({ spacing: { after: 200 } }),

      new Paragraph({
        children: [new TextRun({ text: "Applicant", bold: true, size: 24, color: NAVY, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 80 },
      }),
      metaLine("Name", "David Cameron"),
      metaLine("Address", "41 Rooigras Avenue, 73 Tiffani Gardens, Bassonia, 2090, Johannesburg"),
      metaLine("Contact", "+27 84 444 6001"),
      metaLine("Country", "Republic of South Africa"),
      new Paragraph({ spacing: { after: 200 } }),

      metaLine("Filing Authority", "Companies and Intellectual Property Commission (CIPC)"),
      metaLine("Filing Jurisdiction", "South Africa (CIPC), with PCT international phase intended"),

      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        children: [new TextRun({
          text: "\"System and Method for Autonomous Intelligence Orchestration, Self-Healing Regulatory Compliance, Multi-Event Integrity Certification, Autonomous Agent Swarm Command, Real-Time Valuation Simulation, and Self-Auditing Investor Engagement ROI for Investor Communication Events\"",
          italics: true, size: 22, color: DARK_BLUE, font: "Calibri",
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),

      // ── Cross-reference to Related Applications ──
      new Paragraph({
        children: [new TextRun({ text: "Cross-Reference to Related Applications:", bold: true, size: 22, color: NAVY, font: "Calibri" })],
        spacing: { before: 200, after: 100 },
      }),
      makeTable(["Application ID", "Filing Date", "Status", "Scope"], [
        ["1773575338868", "12 March 2026", "Filed (only submission to date)", "Live Event Intelligence Platform (Modules 1\u201313 + 25 claims + 12 figures)"],
        ["This Filing (TBD)", "March 2026", "Pending", "CIP Submission 2 (Modules 19\u201327, Claims 26\u201334, Figures 13\u201321)"],
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 1. TITLE
      // ══════════════════════════════════════════════════════════════
      sectionHeading("1", "TITLE OF INVENTION"),
      bodyText("System and Method for Autonomous Intelligence Orchestration, Self-Healing Regulatory Compliance, Multi-Event Integrity Certification, Autonomous Agent Swarm Command, Real-Time Valuation Impact Simulation, and Self-Auditing Investor Engagement ROI for Investor Communication Events"),

      // ══════════════════════════════════════════════════════════════
      // 2. ABSTRACT
      // ══════════════════════════════════════════════════════════════
      sectionHeading("2", "ABSTRACT"),
      bodyText("This Continuation-in-Part (CIP) addendum extends the parent provisional (Application ID 1773575338868, filed 12 March 2026 \u2014 the only submission to date) with nine new autonomous AI subsystems (Modules 19\u201327). These modules introduce full platform autonomy: reinforcement-learning campaign orchestration across entire investor cycles, predictive self-healing regulatory adaptation (6\u201318 month horizon scanning with zero-downtime patching), dynamic investor relationship graph weaving with proactive touchpoint scheduling, quantum-resistant blockchain integrity certification across multi-event communication histories, autonomous AI agent swarm coordination across parallel global events, real-time Monte-Carlo valuation impact simulation during live events, self-auditing investor engagement ROI with cryptographic proof of calculation integrity, dual-purpose compliance and capital-raising advisory, and a self-optimising federated global event intelligence network."),
      bodyText("Collectively, these nine modules elevate the platform from reactive event analysis to fully autonomous investor communication intelligence that orchestrates, heals, certifies, values, and self-audits without human intervention across entire campaign lifecycles."),

      // ══════════════════════════════════════════════════════════════
      // 3. FIELD
      // ══════════════════════════════════════════════════════════════
      sectionHeading("3", "FIELD OF THE INVENTION"),
      bodyText("The present invention relates to financial technology and investor relations platforms. More particularly, this Continuation-in-Part (CIP) supplementary specification extends the parent provisional patent specification (Application ID 1773575338868) to encompass autonomous, self-healing, and self-orchestrating intelligence capabilities that span entire investor communication campaigns without human planning or retraining."),
      bodyText("The invention further relates to methods for autonomous event campaign orchestration, self-healing regulatory compliance with predictive horizon scanning, dynamic investor relationship graph construction and proactive touchpoint scheduling, multi-event blockchain integrity certification with quantum-resistant cryptography, autonomous AI agent swarm coordination across parallel global events, real-time valuation impact simulation during live investor events, self-auditing investor engagement return-on-investment calculation with cryptographic proof of integrity, dual-purpose compliance and capital-raising advisory, and federated self-optimising global event intelligence networks."),

      // ══════════════════════════════════════════════════════════════
      // 4. RELATIONSHIP TO PARENT SPECIFICATION
      // ══════════════════════════════════════════════════════════════
      sectionHeading("4", "RELATIONSHIP TO PARENT SPECIFICATION"),
      bodyText("The parent provisional specification (Application ID 1773575338868, filed 12 March 2026 \u2014 the only submission to date) disclosed the following 13 subsystems with 25 independent claims and 12 figures:"),
      makeTable(
        ["Section", "Subsystem", "Key Capability"],
        [
          ["1", "Event Monitoring System", "Real-time capture of communication signals from live events"],
          ["2", "Communication Signal Processing", "Speech-to-text, speaker ID, question extraction, topic classification"],
          ["3", "AI Communication Analysis", "Sentiment detection, topic classification, risk indicators"],
          ["4", "Agentic Event Intelligence System", "Multi-agent AI orchestration (sentiment, compliance, Q&A, engagement)"],
          ["5", "Cross-Platform Communication Signal Capture", "Autonomous bridge connection via DTMF + silent AI agents"],
          ["6", "Embedded Real-Time Intelligence Operator Interface", "Live AI analysis within operator control console (OCC)"],
          ["7", "Anonymised Communication Intelligence Benchmarking", "Industry-wide anonymised benchmarks from aggregate data"],
          ["8", "Autonomous Compliance Intervention", "Real-time compliance-sensitive language detection + automated response"],
          ["9", "Self-Improving Communication Intelligence Models", "Operator corrections as training signals for model refinement"],
          ["10", "Predictive Communication Intelligence", "Predicted investor concerns + market reactions from historical data"],
          ["11", "Communication Intelligence Indexes", "Transparency Index, Health Score, Concern Index"],
          ["12", "Autonomous Event Intervention", "Moderator alerts, automated moderation, question prioritisation"],
          ["13", "Autonomous Self-Evolving Platform Intelligence", "Three-layer autonomy: real-time, inter-event learning, platform evolution"],
        ]
      ),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("The parent specification also disclosed 25 independent claims (System Claims 1\u201315, Method Claims 16\u201320, and Autonomous Self-Evolving Platform Claims 21\u201325) and 12 figures (FIG 1\u201312)."),
      bodyText("The platform subsequently expanded to include additional operational subsystems (Modules 14\u201318) covering conference telephony, enhanced OCC capabilities, partner integrations, and the Intelligence Suite. These modules are part of the built platform but are not separately claimed in either the parent or this CIP filing."),
      bodyText("This CIP supplementary specification adds 9 entirely new autonomous modules (numbered 19\u201327), 9 new independent claims (Claims 26\u201334), and 9 new figures (FIG 13\u201321). All new modules build upon and extend the capabilities disclosed in the parent specification."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 5. BACKGROUND (UPDATED)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("5", "BACKGROUND OF THE INVENTION (UPDATED)"),
      bodyText("The parent provisional specification (the only filing to date) disclosed real-time monitoring, cross-platform capture via silent agents, AI analysis, OCC integration, anonymised benchmarking, and autonomous self-evolving platform intelligence. This CIP supplementary specification addresses the remaining critical gaps: true autonomy across entire campaign lifecycles, predictive regulatory self-healing, multi-event blockchain certification, swarm-scale parallelism, real-time valuation simulation, cryptographically auditable ROI tracking, dual-purpose compliance-and-capital advisory, and federated global intelligence networking."),
      bodyText("The following limitations remain unaddressed by prior art and by the parent specification:"),
      numberedItem("1", "No prior art system autonomously designs, schedules, and continuously re-optimises entire multi-event investor campaigns (earnings season, roadshow series, AGM cycle) based on historical outcomes and market conditions."),
      numberedItem("2", "No prior art system autonomously adapts to regulatory changes before they take effect, with predictive horizon scanning of 6\u201318 months and zero-downtime model patching across all compliance modules."),
      numberedItem("3", "No prior art system autonomously builds and evolves a global investor influence graph from multi-channel event interactions, proactively scheduling optimal touchpoints to maximise capital raise probability."),
      numberedItem("4", "No prior art system links multiple successive investor events into a single verifiable blockchain-certified communication history chain with quantum-resistant zero-knowledge privacy proofs and cumulative disclosure grading."),
      numberedItem("5", "No prior art system autonomously spawns, coordinates, and optimises swarms of AI agents across multiple simultaneous global events with reinforcement-learning resource allocation."),
      numberedItem("6", "No prior art system performs real-time share price valuation simulations during live events, updating intrinsic value estimates based on live sentiment and guidance tone, with fair-value-gap alerts delivered to the operator console and teleprompter."),
      numberedItem("7", "No prior art system autonomously tracks every investor touchpoint, calculates precise per-investor ROI, and generates self-audited quarterly reports with cryptographic proof of calculation integrity."),
      numberedItem("8", "No prior art system simultaneously optimises for regulatory compliance and capital-raising effectiveness during live investor events, generating dual parallel outputs from the same event data."),
      numberedItem("9", "No prior art system creates a federated, self-optimising intelligence network across independent global issuers while preserving confidentiality through anonymised sharing."),

      // ══════════════════════════════════════════════════════════════
      // 6. SUMMARY (UPDATED)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("6", "SUMMARY OF THE INVENTION (UPDATED)"),
      bodyText("With this CIP filing, the platform now comprises 27 interconnected subsystems: the original 13 from the parent specification (Modules 1\u201313), the operational expansion modules (14\u201318), plus 9 new autonomous modules (19\u201327) disclosed herein. The new modules introduce complete platform autonomy \u2014 the ability to orchestrate, heal, certify, value, and self-audit without human intervention across entire campaign lifecycles."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("New Autonomous Modules (19\u201327) added by this CIP:"),
      makeTable(
        ["Module #", "Subsystem Name", "Novel Capability"],
        [
          ["19", "Autonomous Event Campaign Orchestrator", "RL-based multi-event campaign design, scheduling & continuous re-optimisation"],
          ["20", "Self-Healing Regulatory Oracle", "Predictive 6\u201318 month horizon scanning + zero-downtime patching + jurisdiction templates"],
          ["21", "Autonomous Investor Relationship Graph Weaver", "Dynamic investor influence graph + proactive touchpoint scheduling for capital raise maximisation"],
          ["22", "Self-Certifying Multi-Event Integrity Chain", "Inter-event blockchain hash linking + quantum-resistant zero-knowledge proofs + cumulative AAA\u2013NR certificate"],
          ["23", "Autonomous AI Agent Swarm Commander", "Dynamic spawning of parallel shadow agents + RL resource allocation + cross-swarm fusion"],
          ["24", "Autonomous Valuation Impact Oracle", "Live Monte-Carlo intrinsic value simulation + fair-value-gap alerts in OCC and teleprompter"],
          ["25", "Self-Auditing Investor Engagement ROI Engine", "Per-investor ROI tracking + cryptographic proof of calculation integrity + self-audited reports"],
          ["26", "Autonomous Dual-Purpose Compliance & Capital-Raising Advisor", "Simultaneous compliant disclosure + optimised investor pitch language + real-time trade-off scoring"],
          ["27", "Self-Optimising Global Event Intelligence Network", "Federated anonymised network across global issuers + continuous self-optimisation + best-practice sharing"],
        ]
      ),

      new Paragraph({ spacing: { after: 200 } }),
      bodyText("Combined Platform Summary \u2014 All 27 Modules:"),
      makeTable(
        ["#", "Subsystem", "Source"],
        [
          ["1", "Event Monitoring System", "Parent (App ID 1773575338868)"],
          ["2", "Communication Signal Processing", "Parent"],
          ["3", "AI Communication Analysis", "Parent"],
          ["4", "Agentic Event Intelligence System", "Parent"],
          ["5", "Cross-Platform Communication Signal Capture", "Parent"],
          ["6", "Embedded Real-Time Intelligence Operator Interface", "Parent"],
          ["7", "Anonymised Communication Intelligence Benchmarking", "Parent"],
          ["8", "Autonomous Compliance Intervention", "Parent"],
          ["9", "Self-Improving Communication Intelligence Models", "Parent"],
          ["10", "Predictive Communication Intelligence", "Parent"],
          ["11", "Communication Intelligence Indexes", "Parent"],
          ["12", "Autonomous Event Intervention", "Parent"],
          ["13", "Autonomous Self-Evolving Platform Intelligence", "Parent"],
          ["14\u201318", "Operational Expansion (Conference, OCC, Partners, Intelligence Suite)", "Built platform (not separately claimed)"],
          ["19", "Autonomous Event Campaign Orchestrator", "This CIP (Second Submission)"],
          ["20", "Self-Healing Regulatory Oracle", "This CIP (Second Submission)"],
          ["21", "Autonomous Investor Relationship Graph Weaver", "This CIP (Second Submission)"],
          ["22", "Self-Certifying Multi-Event Integrity Chain", "This CIP (Second Submission)"],
          ["23", "Autonomous AI Agent Swarm Commander", "This CIP (Second Submission)"],
          ["24", "Autonomous Valuation Impact Oracle", "This CIP (Second Submission)"],
          ["25", "Self-Auditing Investor Engagement ROI Engine", "This CIP (Second Submission)"],
          ["26", "Autonomous Dual-Purpose Compliance & Capital-Raising Advisor", "This CIP (Second Submission)"],
          ["27", "Self-Optimising Global Event Intelligence Network", "This CIP (Second Submission)"],
        ]
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 7. DETAILED DESCRIPTION OF NEW SUBSYSTEMS (MODULES 19-27)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("7", "DETAILED DESCRIPTION OF NEW SUBSYSTEMS (MODULES 19\u201327)"),
      new Paragraph({
        children: [new TextRun({ text: "CIP SUPPLEMENTARY SPECIFICATION \u2014 AUTONOMOUS MODULES 19\u201327", bold: true, size: 32, color: ACCENT, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Continuation-in-Part addition to parent provisional (App ID 1773575338868, filed 12 March 2026)", size: 22, color: GREY, font: "Calibri", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),

      // ── 7.19 Autonomous Event Campaign Orchestrator ──
      subHeading("7.19", "Autonomous Event Campaign Orchestrator (Module 19)"),
      boldLabel("Refer:", "FIG 13"),
      bodyText("Purpose: The AI autonomously designs, schedules, sequences, and continuously re-optimises entire multi-event investor campaigns (earnings season, roadshow series, AGM cycle) based on historical outcomes, regulatory calendars, investor intent graphs, and market volatility forecasts \u2014 without human input after initial high-level goals."),
      numberedItem("1", "Ingests historical event outcomes including sentiment scores, investor attendance, capital raise conversion rates, and regulatory feedback from all prior campaigns."),
      numberedItem("2", "Uses reinforcement learning to optimise campaign sequence, timing, content strategy, and speaker allocation across multi-event series (e.g., Q1 earnings \u2192 roadshow \u2192 AGM \u2192 Q2 earnings)."),
      numberedItem("3", "Autonomously schedules shadow agents (Module 5 of parent) and OCC resources (Module 6 of parent) for each event in the campaign based on predicted complexity and risk profile."),
      numberedItem("4", "Dynamically re-plans remaining events in the campaign based on live regulatory signals, market volatility changes, and outcomes from completed events."),
      numberedItem("5", "Generates pre-event strategic briefings including predicted investor concerns, recommended messaging, and optimal presentation structures."),
      numberedItem("6", "Produces campaign performance dashboards with real-time ROI tracking, sentiment trajectory graphs, and investor engagement funnels."),
      numberedItem("7", "Supports multi-geography campaign planning with timezone optimisation, regulatory calendar awareness, and cross-jurisdiction compliance checks."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art system autonomously designs and continuously re-optimises multi-event investor campaigns using reinforcement learning."),
      claimBullet("Dynamic re-planning of remaining campaign events based on live outcomes from completed events."),
      claimBullet("Autonomous shadow agent and OCC resource scheduling based on predicted event risk profiles."),
      divider(),

      // ── 7.20 Self-Healing Regulatory Oracle ──
      subHeading("7.20", "Self-Healing Regulatory Oracle (Module 20)"),
      boldLabel("Refer:", "FIG 14"),
      bodyText("Purpose: A meta-agent continuously monitors global regulatory changes (SEC, JSE, FCA, EU MAR) via legal feeds and case law. It pre-emptively updates all compliance classifiers, thresholds, and response templates across every module before new rules take effect. This extends the compliance capabilities of Module 8 (Autonomous Compliance Intervention) from the parent specification."),
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

      // ── 7.21 Autonomous Investor Relationship Graph Weaver ──
      subHeading("7.21", "Autonomous Investor Relationship Graph Weaver (Module 21)"),
      boldLabel("Refer:", "FIG 15"),
      bodyText("Purpose: The AI autonomously builds and evolves a global investor influence graph from every interaction across events, emails, and shadow sessions. It proactively suggests and schedules optimal next-touchpoints to maximise engagement and capital raise probability. This extends the predictive capabilities of Module 10 (Predictive Communication Intelligence) from the parent specification."),
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

      // ── 7.22 Self-Certifying Multi-Event Integrity Chain ──
      subHeading("7.22", "Self-Certifying Multi-Event Integrity Chain (Module 22)"),
      boldLabel("Refer:", "FIG 16"),
      bodyText("Purpose: The AI links multiple successive investor events (e.g., Q1 earnings \u2192 roadshow \u2192 AGM \u2192 Q2 earnings) into a single verifiable \"Investor Communication History Chain\" on blockchain. This extends the anonymised benchmarking concepts from Module 7 and the cryptographic audit concepts from Module 8 of the parent specification."),
      bodyText("Blockchain Upgrade: All blockchain elements are strengthened with quantum-resistant cryptography:"),
      numberedItem("1", "Inter-event hash linking uses SHA-256 or quantum-resistant algorithms (e.g., CRYSTALS-Kyber, Dilithium). The final hash of each event's digital twin becomes the genesis hash of the subsequent event's chain, creating an unbroken cryptographic link across the entire investor communication history."),
      numberedItem("2", "Zero-knowledge proofs support zk-SNARKs, zk-STARKs, or post-quantum equivalents, enabling regulators and auditors to verify the integrity and consistency of the communication chain without accessing the underlying transcript content."),
      numberedItem("3", "Smart-contract verification on Ethereum, Polygon, or Hyperledger Fabric for automatic regulatory submission triggering when disclosure quality thresholds are met."),
      numberedItem("4", "Cumulative \"Clean Disclosure History Certificate\" with AAA\u2013NR grading: a single certificate spanning the entire campaign or fiscal year, graded on cumulative disclosure quality, consistency, and regulatory compliance."),
      numberedItem("5", "Automatic anomaly detection for long-term messaging drift: the system detects when executive messaging gradually shifts over multiple events, even when individual events appear internally consistent."),
      numberedItem("6", "Cross-event contradiction scoring: identifies statements in the current event that contradict positions taken in any prior linked event."),
      numberedItem("7", "Regulatory submission package: automatically generates a complete, verifiable disclosure package suitable for submission to JSE, SEC, or FCA upon request."),
      numberedItem("8", "Independent verification portal: external parties (regulators, auditors, institutional investors) can verify certificate authenticity using only the public hash chain."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art creates a cryptographically linked multi-event investor communication history chain with quantum-resistant algorithms."),
      claimBullet("Zero-knowledge proofs enabling integrity verification without content disclosure, supporting post-quantum equivalents."),
      claimBullet("Smart-contract triggered regulatory submission and cumulative Clean Disclosure History Certificate spanning entire fiscal years with AAA\u2013NR grading."),
      divider(),

      pageBreak(),

      // ── 7.23 Autonomous AI Agent Swarm Commander ──
      subHeading("7.23", "Autonomous AI Agent Swarm Commander (Module 23)"),
      boldLabel("Refer:", "FIG 17"),
      bodyText("Purpose: The system autonomously spawns, coordinates, and optimises swarms of shadow AI agents across multiple simultaneous global events. It dynamically allocates compute, re-prioritises high-risk events, and merges intelligence into a unified command view. This extends Module 4 (Agentic Event Intelligence System) and Module 5 (Cross-Platform Capture) from the parent specification to operate at massive parallel scale."),
      numberedItem("1", "Dynamic agent spawning: when multiple investor events occur simultaneously (e.g., multiple companies reporting earnings on the same day), the system autonomously spawns independent shadow agents for each event."),
      numberedItem("2", "Real-time resource allocation using reinforcement learning: compute resources (transcription, AI analysis, sentiment scoring) are dynamically allocated based on event priority, risk profile, and real-time complexity assessment."),
      numberedItem("3", "Cross-swarm intelligence fusion: insights from parallel events are correlated in real time \u2014 identifying sector-wide trends, peer company comparisons, and market-moving patterns that emerge only when viewing multiple events together."),
      numberedItem("4", "Unified command dashboard: the OCC (Module 6 of parent) displays a consolidated view of all active swarm agents with per-event status, risk indicators, and escalation flags."),
      numberedItem("5", "Autonomous escalation: if any agent detects a critical compliance breach, significant sentiment shift, or material disclosure, it autonomously escalates to the unified command view with priority override."),
      numberedItem("6", "Agent health monitoring: each swarm agent is continuously monitored for performance degradation, connectivity issues, or analysis accuracy drift. Unhealthy agents are automatically replaced with fresh instances."),
      numberedItem("7", "Post-session cross-event intelligence report: after all simultaneous events conclude, the system generates a unified cross-event intelligence report highlighting sector trends, relative company performance, and market implications."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art autonomously spawns and coordinates swarms of AI agents across parallel investor events."),
      claimBullet("Reinforcement learning-based dynamic compute resource allocation for parallel event monitoring."),
      claimBullet("Cross-swarm intelligence fusion for identifying sector-wide trends across simultaneous events."),
      divider(),

      // ── 7.24 Autonomous Valuation Impact Oracle ──
      subHeading("7.24", "Autonomous Valuation Impact Oracle (Module 24)"),
      boldLabel("Refer:", "FIG 18"),
      bodyText("Purpose: The AI autonomously runs real-time share price valuation simulations during live events, updating intrinsic value estimates based on live sentiment, guidance tone, and market reaction forecasts. It displays live valuation cones and \"fair value gap\" alerts in the OCC and teleprompter. This extends Module 10 (Predictive Communication Intelligence) from the parent specification with real-time financial modelling."),
      numberedItem("1", "Continuous ingestion of live transcript vectors, sentiment scores, guidance language analysis, and market microstructure data during the event."),
      numberedItem("2", "Real-time Monte-Carlo valuation simulations: runs 1,000+ parallel scenarios computing intrinsic value estimates using discounted cash flow (DCF), comparable company analysis, and precedent transaction models."),
      numberedItem("3", "Live valuation cone display: shows the evolving probability distribution of fair value estimates as the event progresses, with the cone narrowing as more information is disclosed."),
      numberedItem("4", "Fair-value-gap alerts: when the current market price diverges significantly from the AI's evolving fair value estimate, alerts are generated in the OCC (Module 6 of parent) and optionally on the speaker's teleprompter."),
      numberedItem("5", "Guidance impact modelling: when executives provide forward guidance, the system instantly recalculates valuation implications and displays the impact delta."),
      numberedItem("6", "Peer comparison valuation: simultaneously monitors peer company valuations and relative value positioning during the event."),
      numberedItem("7", "Post-event valuation accuracy tracking: after market close, the system compares its live predictions against actual price movements to continuously improve model accuracy."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art performs real-time intrinsic valuation simulations during live investor events with live-updated fair value cones."),
      claimBullet("Fair-value-gap alerts delivered to operator console and teleprompter during live events."),
      claimBullet("Post-event valuation accuracy tracking for continuous model improvement."),
      divider(),

      pageBreak(),

      // ── 7.25 Self-Auditing Investor Engagement ROI Engine ──
      subHeading("7.25", "Self-Auditing Investor Engagement ROI Engine (Module 25)"),
      boldLabel("Refer:", "FIG 19"),
      bodyText("Purpose: The AI autonomously tracks every investor touchpoint, calculates precise ROI per investor (capital raised, meeting conversion, sentiment shift), and generates self-audited quarterly reports with cryptographic proof of calculation integrity. This extends Module 7 (Anonymised Benchmarking) from the parent specification with per-investor attribution and cryptographic auditability."),
      numberedItem("1", "Comprehensive touchpoint tracking: every interaction with every investor is logged across all channels \u2014 events attended, questions asked, shadow session observations (Module 5 of parent), follow-up meetings, email exchanges, and capital allocation decisions."),
      numberedItem("2", "Per-investor ROI calculation: for each investor in the graph (Module 21), the system calculates precise return on engagement investment including: cost of touchpoints (events, travel, time), capital raised or committed, sentiment trajectory, and meeting conversion rates."),
      numberedItem("3", "Campaign ROI attribution: allocates capital raise outcomes to specific events and touchpoints in the campaign (Module 19), enabling precise understanding of which investor relations activities drive the most value."),
      numberedItem("4", "Self-audited quarterly reports: generates comprehensive quarterly investor engagement reports with full calculation methodology, data sources, and assumptions documented for audit review."),
      numberedItem("5", "Cryptographic proof of calculation integrity: every ROI calculation is cryptographically hashed with its input data, methodology, and parameters. Any subsequent query can verify that the reported figures were computed from the stated inputs using the stated methodology."),
      numberedItem("6", "Benchmark comparison: ROI metrics are compared against industry benchmarks from the anonymised aggregate dataset (Module 7 of parent), enabling relative performance assessment."),
      numberedItem("7", "Predictive ROI modelling: based on historical touchpoint-to-outcome patterns, the system predicts expected ROI for proposed future investor engagement activities, enabling data-driven IR budget allocation."),
      bodyText("Novel Elements:"),
      claimBullet("No prior art system calculates per-investor ROI with cryptographic proof of calculation integrity."),
      claimBullet("Self-audited quarterly reports with verifiable methodology and data source documentation."),
      claimBullet("Predictive ROI modelling for data-driven investor relations budget allocation."),
      divider(),

      // ── 7.26 Autonomous Dual-Purpose Compliance & Capital-Raising Advisor ──
      subHeading("7.26", "Autonomous Dual-Purpose Compliance & Capital-Raising Advisor (Module 26)"),
      boldLabel("Refer:", "FIG 20"),
      bodyText("Purpose: The AI autonomously generates two parallel outputs from the same live event data: (1) fully regulatory-compliant disclosure language, and (2) optimised investor pitch language that maximises capital-raising probability while remaining 100% compliant. It scores the \"compliance vs. persuasion trade-off\" in real time and suggests balanced phrasing directly into the teleprompter and OCC. This extends Module 8 (Autonomous Compliance Intervention) and Module 6 (OCC) from the parent specification."),
      numberedItem("1", "Dual-stream analysis: simultaneously processes live event transcript through a compliance engine (generating safe disclosure language) and a persuasion engine (generating investor-optimised language)."),
      numberedItem("2", "Compliance vs. persuasion trade-off scoring: for each statement or disclosure point, the system calculates a real-time score indicating the trade-off between regulatory safety and capital-raising effectiveness."),
      numberedItem("3", "Balanced phrasing suggestions: generates recommended phrasing that maximises persuasion while maintaining full compliance, delivered to the teleprompter and OCC in real time."),
      numberedItem("4", "Jurisdiction-aware optimisation: adjusts the compliance-persuasion balance based on the applicable regulatory regime (SEC, JSE, FCA, EU MAR) and the specific event context."),
      numberedItem("5", "Historical effectiveness analysis: tracks which phrasing styles and disclosure approaches have historically resulted in the highest capital raise conversion rates while maintaining clean regulatory records."),
      numberedItem("6", "Post-event compliance-effectiveness report: generates a detailed report scoring each disclosure point on both compliance and effectiveness dimensions, with recommendations for future events."),
      bodyText("Novel Elements:"),
      claimBullet("First system that simultaneously optimises for regulatory compliance and capital-raising effectiveness during live investor events."),
      claimBullet("Real-time compliance vs. persuasion trade-off scoring with balanced phrasing suggestions."),
      claimBullet("Jurisdiction-aware optimisation adjusting the compliance-persuasion balance by regulatory regime."),
      divider(),

      pageBreak(),

      // ── 7.27 Self-Optimising Global Event Intelligence Network ──
      subHeading("7.27", "Self-Optimising Global Event Intelligence Network (Module 27)"),
      boldLabel("Refer:", "FIG 21"),
      bodyText("Purpose: The AI autonomously connects multiple CuraLive instances across global issuers into a federated intelligence network. It shares anonymised sector trends, regulatory patterns, and best-practice templates while preserving confidentiality. The network self-optimises by weighting contributions based on accuracy and regulatory alignment. This extends Module 7 (Anonymised Benchmarking) and Module 13 (Self-Evolving Platform Intelligence) from the parent specification to operate across independent organisational boundaries."),
      numberedItem("1", "Federated architecture: each CuraLive instance operates independently with full data sovereignty, sharing only anonymised aggregate intelligence with the network."),
      numberedItem("2", "Sector trend aggregation: automatically detects and shares sector-wide trends in investor sentiment, regulatory concerns, and disclosure quality across all network participants."),
      numberedItem("3", "Best-practice template sharing: compliance templates, disclosure formats, and engagement strategies that demonstrate high effectiveness are anonymised and shared across the network."),
      numberedItem("4", "Contribution weighting: each instance's contributions to the network are weighted based on historical accuracy, regulatory alignment, and data quality scores."),
      numberedItem("5", "Privacy-preserving computation: uses differential privacy and federated learning techniques to ensure no individual issuer's confidential data can be reverse-engineered from shared intelligence."),
      numberedItem("6", "Network self-optimisation: the network continuously adjusts its aggregation algorithms, weighting schemes, and sharing protocols based on participant outcomes and feedback."),
      numberedItem("7", "Cross-jurisdiction regulatory intelligence: aggregates regulatory patterns across jurisdictions, enabling participants to anticipate regulatory approaches based on precedents in other markets."),
      bodyText("Novel Elements:"),
      claimBullet("First federated global investor intelligence network that self-optimises across independent issuers."),
      claimBullet("Privacy-preserving federated learning for investor communication intelligence."),
      claimBullet("Contribution weighting based on accuracy and regulatory alignment for network quality assurance."),

      divider(),
      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 8. ALTERNATIVE IMPLEMENTATIONS
      // ══════════════════════════════════════════════════════════════
      sectionHeading("8", "ALTERNATIVE IMPLEMENTATIONS"),
      bodyText("The systems and methods described in this supplementary specification may be implemented using a variety of computational architectures and analytical techniques."),
      bodyText("The reinforcement learning systems described for campaign orchestration (Module 19) and swarm resource allocation (Module 23) may use any suitable RL algorithm including but not limited to: Q-learning, policy gradient methods, proximal policy optimisation (PPO), actor-critic methods, or multi-agent reinforcement learning (MARL) frameworks."),
      bodyText("The blockchain certification systems (Module 22) may utilise any distributed ledger technology including but not limited to: Ethereum, Hyperledger Fabric, Polygon, or private blockchain implementations. Zero-knowledge proof implementations may use zk-SNARKs, zk-STARKs, Bulletproofs, or post-quantum equivalent cryptographic proof systems. Hash algorithms may include SHA-256 or quantum-resistant alternatives such as CRYSTALS-Kyber or Dilithium."),
      bodyText("The graph database systems for investor relationship management (Module 21) may utilise any graph database technology including but not limited to: Neo4j, Amazon Neptune, TigerGraph, or property graph models implemented on relational databases."),
      bodyText("The valuation models (Module 24) may use any financial modelling methodology including but not limited to: discounted cash flow (DCF), dividend discount models (DDM), comparable company analysis, precedent transaction analysis, or hybrid AI-enhanced valuation approaches."),
      bodyText("The federated learning systems (Module 27) may utilise any privacy-preserving computation technique including but not limited to: differential privacy, secure multi-party computation, homomorphic encryption, or federated averaging algorithms."),
      bodyText("The specific examples described in this specification are provided for illustrative purposes and should not be interpreted as limiting the scope of the invention to any particular technology, platform, deployment model, or implementation approach."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 9. CLAIMS (26-34)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("9", "NEW INDEPENDENT CLAIMS (CIP ADDENDUM)"),
      bodyText("The following claims are additional to and supplement Claims 1\u201325 of the parent provisional specification (Application ID 1773575338868)."),
      new Paragraph({ spacing: { after: 200 } }),

      claimParagraph("Claim 26 (CIP)", "A computer-implemented method for autonomous orchestration of multi-event investor communication campaigns, comprising: (a) ingesting outcomes from prior events including sentiment scores, investor attendance, capital raise conversion rates, and regulatory feedback; (b) using reinforcement learning to optimise campaign sequence, timing, content strategy, and speaker allocation; (c) autonomously scheduling shadow agents and OCC resources for each event based on predicted complexity and risk profile; (d) dynamically re-planning remaining events in the campaign based on live regulatory signals, market volatility changes, and outcomes from completed events; and (e) generating campaign performance dashboards with real-time ROI tracking and investor engagement funnels."),

      claimParagraph("Claim 27 (CIP)", "A self-healing regulatory oracle comprising: (a) real-time ingestion of global regulatory updates from SEC, JSE, FCA, and EU MAR notification feeds; (b) predictive impact modelling with 6\u201318 month horizon scanning of proposed regulations, consultation papers, and parliamentary bills; (c) autonomous generation and deployment of updated compliance classifiers and response templates with zero-downtime patching; (d) rollback safety gates that automatically revert to prior classifier versions when anomalous results are detected; (e) jurisdiction-specific template generation for SENS, 8-K, RNS, and equivalent disclosure formats; and (f) blockchain-logged adaptation records for audit-proof regulatory compliance demonstration."),

      claimParagraph("Claim 28 (CIP)", "An autonomous investor relationship graph weaver comprising: (a) construction of a dynamic knowledge graph representing investors, companies, events, topics, and outcomes as nodes and relationships; (b) continuous updating of edge weights based on attendance frequency, question sentiment, engagement duration, follow-up meeting conversion, and capital allocation history; (c) graph embedding analysis to identify hidden influence clusters among investors who co-attend events, ask similar questions, or share investment theses; (d) proactive touchpoint scheduling that autonomously recommends and schedules optimal next interactions including one-on-ones, roadshow meetings, and targeted webcasts based on graph-derived capital raise probability maximisation; (e) per-investor capital raise probability scoring based on engagement patterns, sentiment trajectory, and peer behaviour; and (f) relationship health monitoring that alerts when key investor relationships show declining engagement, sentiment deterioration, or competitor-directed activity."),

      claimParagraph("Claim 29 (CIP)", "A method for creating a self-certifying multi-event integrity chain, comprising: (a) cryptographically linking digital twins of successive investor events into a single verifiable chain where the final hash of each event becomes the genesis hash of the subsequent event using SHA-256 or quantum-resistant algorithms; (b) autonomous consistency scoring across the entire communication history; (c) detection of long-term messaging drift across multiple events even when individual events appear internally consistent; (d) zero-knowledge proof generation using zk-SNARKs, zk-STARKs, or post-quantum equivalents enabling regulators to verify chain integrity without accessing underlying transcript content; (e) smart-contract triggered regulatory submission on Ethereum, Polygon, or Hyperledger Fabric; and (f) issuance of a cumulative Clean Disclosure History Certificate with AAA\u2013NR grading verifiable by regulators and investors through an independent verification portal."),

      claimParagraph("Claim 30 (CIP)", "An autonomous AI agent swarm commander for parallel investor events, comprising: (a) dynamic spawning of multiple silent shadow agents across simultaneous global investor meetings; (b) real-time compute resource allocation using reinforcement learning based on event priority, risk profile, and complexity assessment; (c) cross-swarm intelligence fusion for identifying sector-wide trends and peer company comparisons across parallel events; (d) unified command dashboard with per-event status, risk indicators, and autonomous escalation to the OCC for critical events; (e) agent health monitoring with automatic replacement of degraded agent instances; and (f) post-session cross-event intelligence report generation highlighting market implications."),

      claimParagraph("Claim 31 (CIP)", "An autonomous valuation impact oracle comprising: (a) continuous ingestion of live transcript vectors, sentiment scores, and market microstructure data during investor events; (b) real-time Monte-Carlo valuation simulations with 1,000+ parallel scenarios using DCF, comparable company, and precedent transaction models; (c) live valuation cone display showing evolving probability distribution of fair value estimates; (d) fair-value-gap alerts generated in the operator console and teleprompter when market price diverges from AI fair value estimates; (e) guidance impact modelling that instantly recalculates valuation implications when executives provide forward guidance; and (f) post-event valuation accuracy tracking for continuous model improvement."),

      claimParagraph("Claim 32 (CIP)", "A self-auditing investor engagement ROI engine comprising: (a) autonomous tracking of every investor touchpoint across all channels including events, shadow sessions, follow-up meetings, and capital allocation decisions; (b) per-investor ROI calculation including cost of touchpoints, capital raised, sentiment trajectory, and meeting conversion rates; (c) campaign ROI attribution allocating capital raise outcomes to specific events and touchpoints; (d) generation of self-audited quarterly reports with documented calculation methodology, data sources, and assumptions; (e) cryptographic proof of calculation integrity where every ROI figure is hashed with its inputs and methodology for independent verification; and (f) predictive ROI modelling for proposed future engagement activities enabling data-driven IR budget allocation."),

      claimParagraph("Claim 33 (CIP)", "A method for autonomous dual-purpose compliance and capital-raising advising during live investor events, comprising: (a) simultaneously processing live event transcript through a compliance engine generating safe disclosure language and a persuasion engine generating investor-optimised language; (b) calculating a real-time compliance vs. persuasion trade-off score for each statement or disclosure point; (c) generating balanced phrasing suggestions that maximise persuasion while maintaining full regulatory compliance, delivered to the teleprompter and OCC in real time; (d) adjusting the compliance-persuasion balance based on applicable regulatory regime and event context; (e) tracking historical effectiveness of phrasing styles and disclosure approaches on capital raise conversion rates; and (f) generating post-event compliance-effectiveness reports scoring each disclosure point on both dimensions."),

      claimParagraph("Claim 34 (CIP)", "A self-optimising global event intelligence network comprising: (a) autonomous connection of multiple independent CuraLive instances across global issuers into a federated intelligence network; (b) federated sharing of anonymised sector trends, regulatory patterns, and best-practice templates while preserving data sovereignty and confidentiality; (c) weighting of each instance's contributions based on historical accuracy, regulatory alignment, and data quality scores; (d) privacy-preserving computation using differential privacy and federated learning to prevent reverse-engineering of individual issuer data; (e) continuous self-optimisation of aggregation algorithms, weighting schemes, and sharing protocols based on participant outcomes; and (f) cross-jurisdiction regulatory intelligence aggregation enabling participants to anticipate regulatory approaches based on precedents in other markets."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 10. FIGURES AND DIAGRAMS (FIG 13-21)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("10", "UPDATED DRAWINGS (NEW FIGURES FOR CIP SUBMISSION)"),
      bodyText("The following figures (FIG 13\u201321) supplement Figures 1\u201312 of the parent provisional specification (Application ID 1773575338868)."),
      new Paragraph({ spacing: { after: 200 } }),

      // ── FIG 13: Autonomous Campaign Orchestrator Architecture ──
      diagramTitle(13, "Autonomous Campaign Orchestrator Architecture (Module 19)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  HIGH-LEVEL CAMPAIGN GOALS                     \u2502",
        "\u2502  (earnings season / roadshow / AGM cycle)       \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  REINFORCEMENT LEARNING ENGINE                  \u2502",
        "\u2502  \u2022 Historical outcomes analysis                 \u2502",
        "\u2502  \u2022 Regulatory calendar awareness                \u2502",
        "\u2502  \u2022 Market volatility forecasts                  \u2502",
        "\u2502  \u2022 Investor intent graph inputs (Module 21)     \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "           \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "           \u25BC                   \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 CAMPAIGN SCHEDULE    \u2502\u2502 RESOURCE PLANNER    \u2502",
        "\u2502 \u2022 Event sequence    \u2502\u2502 \u2022 Shadow agents    \u2502",
        "\u2502 \u2022 Timing optim.    \u2502\u2502 \u2022 OCC allocation   \u2502",
        "\u2502 \u2022 Speaker alloc.   \u2502\u2502 \u2022 Compute reserve  \u2502",
        "\u2502 \u2022 Content strategy \u2502\u2502 \u2022 Risk assessment  \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "           \u2502                   \u2502",
        "           \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  LIVE EXECUTION & DYNAMIC RE-PLANNING           \u2502",
        "\u2502  \u2022 Monitor completed event outcomes              \u2502",
        "\u2502  \u2022 Dynamic re-plan remaining events             \u2502",
        "\u2502  \u2022 Campaign performance dashboard               \u2502",
        "\u2502  \u2022 Real-time ROI tracking                       \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 14: Self-Healing Regulatory Oracle ──
      diagramTitle(14, "Self-Healing Regulatory Oracle \u2014 Horizon Scanning Pipeline (Module 20)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 SEC EDGAR  \u2502 \u2502 JSE SENS   \u2502 \u2502 FCA        \u2502 \u2502 EU MAR     \u2502",
        "\u2502 Updates    \u2502 \u2502 Notices    \u2502 \u2502 Register   \u2502 \u2502 Directives \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "      \u2502            \u2502            \u2502            \u2502",
        "      \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  PREDICTIVE HORIZON SCANNER                    \u2502",
        "\u2502  6\u201318 month forward analysis                   \u2502",
        "\u2502  \u2022 Proposed regulations                        \u2502",
        "\u2502  \u2022 Consultation papers                         \u2502",
        "\u2502  \u2022 Parliamentary bills                         \u2502",
        "\u2502  \u2022 Regulatory impact scoring                   \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "           \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "           \u25BC                   \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 CLASSIFIER UPDATER  \u2502\u2502 TEMPLATE GENERATOR  \u2502",
        "\u2502 \u2022 Zero-downtime     \u2502\u2502 \u2022 SENS (JSE)       \u2502",
        "\u2502   hot-swap          \u2502\u2502 \u2022 8-K  (SEC)       \u2502",
        "\u2502 \u2022 Rollback gates    \u2502\u2502 \u2022 RNS  (FCA)       \u2502",
        "\u2502 \u2022 FP rate monitor   \u2502\u2502 \u2022 EU MAR formats   \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "           \u2502                   \u2502",
        "           \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  BLOCKCHAIN ADAPTATION LOG                     \u2502",
        "\u2502  \u2022 Every update cryptographically logged        \u2502",
        "\u2502  \u2022 Audit-proof compliance record                \u2502",
        "\u2502  \u2022 Rollback history preserved                   \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),

      pageBreak(),

      // ── FIG 15: Autonomous Investor Relationship Graph Weaver ──
      diagramTitle(15, "Autonomous Investor Relationship Graph Weaver \u2014 Dynamic Influence Graph (Module 21)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  MULTI-CHANNEL INVESTOR SIGNAL INGESTION       \u2502",
        "\u2502  \u2022 Event attendance                              \u2502",
        "\u2502  \u2022 Questions asked                              \u2502",
        "\u2502  \u2022 Sentiment trajectory                         \u2502",
        "\u2502  \u2022 Follow-up meetings                           \u2502",
        "\u2502  \u2022 Email / outreach interactions                \u2502",
        "\u2502  \u2022 Capital allocation outcomes                  \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  INVESTOR RELATIONSHIP GRAPH ENGINE             \u2502",
        "\u2502  \u2022 Nodes: investors, companies, events, topics  \u2502",
        "\u2502  \u2022 Edges: influence, co-attendance, follow-up   \u2502",
        "\u2502  \u2022 Edge weights updated continuously            \u2502",
        "\u2502  \u2022 Graph embeddings + cluster detection         \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "           \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "           \u25BC                   \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 CAPITAL RAISE      \u2502\u2502 RELATIONSHIP HEALTH\u2502",
        "\u2502 PROBABILITY SCORE  \u2502\u2502 MONITORING          \u2502",
        "\u2502 \u2022 Investor ranking \u2502\u2502 \u2022 Engagement decline\u2502",
        "\u2502 \u2022 Allocation odds  \u2502\u2502 \u2022 Sentiment drift   \u2502",
        "\u2502 \u2022 Peer behaviour   \u2502\u2502 \u2022 Competitor signals\u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "           \u2502                   \u2502",
        "           \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  PROACTIVE TOUCHPOINT ORCHESTRATOR              \u2502",
        "\u2502  \u2022 One-on-one scheduling                        \u2502",
        "\u2502  \u2022 Roadshow targeting                           \u2502",
        "\u2502  \u2022 Targeted webcast invitations                 \u2502",
        "\u2502  \u2022 Next-best-action recommendations             \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 16: Multi-Event Integrity Chain ──
      diagramTitle(16, "Multi-Event Integrity Chain \u2014 Quantum-Resistant Blockchain Linking (Module 22)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  Q1 EARNINGS    \u2502    \u2502   ROADSHOW      \u2502    \u2502     AGM         \u2502",
        "\u2502  EVENT TWIN     \u2502    \u2502   EVENT TWIN    \u2502    \u2502   EVENT TWIN   \u2502",
        "\u2502                 \u2502    \u2502                 \u2502    \u2502                \u2502",
        "\u2502 Genesis: 0x00  \u2502    \u2502 Genesis:        \u2502    \u2502 Genesis:       \u2502",
        "\u2502 SHA-256 /      \u2502    \u2502   = Q1 Final    \u2502    \u2502   = RS Final   \u2502",
        "\u2502 Dilithium      \u2502    \u2502 Seg 1: d4e5..  \u2502    \u2502 Seg 1: f6g7.. \u2502",
        "\u2502 Seg 1: a3f2.. \u2502    \u2502 Seg 2: h8i9..  \u2502    \u2502 Seg 2: j0k1.. \u2502",
        "\u2502 Final: c9d8.. \u2502\u2500\u2500\u25B6\u2502 ...            \u2502    \u2502 ...           \u2502",
        "\u2502               \u2502    \u2502 Final: m2n3.. \u2502\u2500\u2500\u25B6\u2502 Final: p4q5.. \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518    \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518    \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                                                  \u2502",
        "                                                  \u25BC",
        "                  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "                  \u2502  CUMULATIVE HISTORY CERTIFICATE    \u2502",
        "                  \u2502                                    \u2502",
        "                  \u2502  Chain: Q1 \u2192 RS \u2192 AGM              \u2502",
        "                  \u2502  Grade: AAA | AA | A | BBB | NR    \u2502",
        "                  \u2502  Consistency: Cross-event score    \u2502",
        "                  \u2502  Drift Detection: Long-term trend  \u2502",
        "                  \u2502                                    \u2502",
        "                  \u2502  Zero-Knowledge Proof:             \u2502",
        "                  \u2502  zk-SNARKs / zk-STARKs /           \u2502",
        "                  \u2502  Post-quantum equivalents           \u2502",
        "                  \u2502  Smart-contract auto-submission     \u2502",
        "                  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 17: Autonomous Swarm Commander ──
      diagramTitle(17, "Autonomous Swarm Commander \u2014 Resource Allocation (Module 23)"),
      ...diagramBlock([
        "              \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "              \u2502    SWARM COMMAND CONTROLLER              \u2502",
        "              \u2502    Reinforcement Learning Engine         \u2502",
        "              \u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                  \u2502       \u2502       \u2502       \u2502",
        "              \u250C\u2500\u2500\u2500\u25BC\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u25BC\u2500\u2500\u2500\u2500\u2510",
        "              \u2502Agent 1 \u2502\u2502Agent 2 \u2502\u2502Agent 3 \u2502\u2502Agent N \u2502",
        "              \u2502Co. A   \u2502\u2502Co. B   \u2502\u2502Co. C   \u2502\u2502Co. N   \u2502",
        "              \u2502Earnings\u2502\u2502Earnings\u2502\u2502AGM     \u2502\u2502Roadshow\u2502",
        "              \u2502Risk:MED\u2502\u2502Risk:HI \u2502\u2502Risk:LOW\u2502\u2502Risk:HI \u2502",
        "              \u2502CPU:15% \u2502\u2502CPU:35% \u2502\u2502CPU:10% \u2502\u2502CPU:40% \u2502",
        "              \u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518",
        "                  \u2502       \u2502       \u2502       \u2502",
        "                  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                          \u25BC",
        "              \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "              \u2502  CROSS-SWARM INTELLIGENCE FUSION        \u2502",
        "              \u2502  \u2022 Sector-wide trend detection           \u2502",
        "              \u2502  \u2022 Peer company comparison               \u2502",
        "              \u2502  \u2022 Market-moving pattern alerts          \u2502",
        "              \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                          \u25BC",
        "              \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "              \u2502  UNIFIED COMMAND DASHBOARD (OCC)        \u2502",
        "              \u2502  \u2022 Per-event status + risk flags         \u2502",
        "              \u2502  \u2022 Autonomous escalation                 \u2502",
        "              \u2502  \u2022 Agent health monitoring               \u2502",
        "              \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),

      pageBreak(),

      // ── FIG 18: Valuation Impact Oracle ──
      diagramTitle(18, "Valuation Impact Oracle \u2014 Live Simulation Flow (Module 24)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  LIVE EVENT DATA INGESTION                     \u2502",
        "\u2502  \u2022 Transcript vectors                          \u2502",
        "\u2502  \u2022 Sentiment scores (Module 3 of parent)       \u2502",
        "\u2502  \u2022 Guidance language analysis                   \u2502",
        "\u2502  \u2022 Market microstructure data                   \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  MONTE-CARLO VALUATION ENGINE                  \u2502",
        "\u2502  1,000+ parallel scenarios                      \u2502",
        "\u2502  \u2022 DCF model                                    \u2502",
        "\u2502  \u2022 Comparable company analysis                  \u2502",
        "\u2502  \u2022 Precedent transaction model                  \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "           \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "           \u25BC                   \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 VALUATION CONE     \u2502\u2502 FAIR VALUE GAP     \u2502",
        "\u2502                    \u2502\u2502    ALERTS           \u2502",
        "\u2502 Probability        \u2502\u2502                    \u2502",
        "\u2502 distribution       \u2502\u2502 Market: R42.50     \u2502",
        "\u2502 narrows as event   \u2502\u2502 AI Fair: R48.20    \u2502",
        "\u2502 progresses         \u2502\u2502 Gap: +13.4%        \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "           \u2502                   \u2502",
        "           \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  DELIVERED TO:                                 \u2502",
        "\u2502  \u2022 OCC Dashboard (operator) [Module 6]         \u2502",
        "\u2502  \u2022 Teleprompter (speaker)                      \u2502",
        "\u2502  \u2022 Guidance impact delta display               \u2502",
        "\u2502  \u2022 Post-event accuracy tracking                \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 19: Self-Auditing ROI Engine ──
      diagramTitle(19, "Self-Auditing ROI Engine \u2014 Cryptographic Proof Pipeline (Module 25)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 EVENT          \u2502 \u2502 SHADOW         \u2502 \u2502 FOLLOW-UP      \u2502",
        "\u2502 TOUCHPOINTS    \u2502 \u2502 SESSIONS       \u2502 \u2502 MEETINGS       \u2502",
        "\u2502 \u2022 Attendance  \u2502 \u2502 \u2022 Observations \u2502 \u2502 \u2022 Conversions  \u2502",
        "\u2502 \u2022 Questions   \u2502 \u2502 \u2022 Sentiment    \u2502 \u2502 \u2022 Capital alloc\u2502",
        "\u2502 \u2022 Engagement  \u2502 \u2502 \u2022 Intent data  \u2502 \u2502 \u2022 Email trails \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "        \u2502               \u2502               \u2502",
        "        \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  PER-INVESTOR ROI CALCULATOR                   \u2502",
        "\u2502  \u2022 Cost of touchpoints (time, travel)           \u2502",
        "\u2502  \u2022 Capital raised/committed                     \u2502",
        "\u2502  \u2022 Sentiment trajectory                         \u2502",
        "\u2502  \u2022 Meeting conversion rate                      \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "           \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "           \u25BC                   \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 QUARTERLY REPORT   \u2502\u2502 CRYPTO PROOF       \u2502",
        "\u2502 \u2022 Self-audited     \u2502\u2502 Hash =             \u2502",
        "\u2502 \u2022 Methodology      \u2502\u2502 SHA-256(inputs +   \u2502",
        "\u2502   documented       \u2502\u2502 methodology +      \u2502",
        "\u2502 \u2022 Data sources     \u2502\u2502 parameters)        \u2502",
        "\u2502   listed           \u2502\u2502 Independent        \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\u2502 verification       \u2502",
        "           \u2502          \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "           \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  PREDICTIVE ROI MODELLING                     \u2502",
        "\u2502  \u2022 Expected ROI for proposed activities        \u2502",
        "\u2502  \u2022 Data-driven IR budget allocation            \u2502",
        "\u2502  \u2022 Industry benchmark comparison (Module 7)    \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),

      pageBreak(),

      // ── FIG 20: Dual-Purpose Compliance & Capital-Raising Advisor ──
      diagramTitle(20, "Autonomous Dual-Purpose Compliance & Capital-Raising Advisor (Module 26)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  LIVE EVENT TRANSCRIPT (real-time)             \u2502",
        "\u2502  Continuous ingestion from Modules 2 + 3       \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "           \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "           \u25BC                   \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 COMPLIANCE ENGINE  \u2502\u2502 PERSUASION ENGINE  \u2502",
        "\u2502                    \u2502\u2502                    \u2502",
        "\u2502 \u2022 Safe disclosure  \u2502\u2502 \u2022 Investor-optim. \u2502",
        "\u2502   language         \u2502\u2502   language         \u2502",
        "\u2502 \u2022 Regulatory       \u2502\u2502 \u2022 Capital raise   \u2502",
        "\u2502   guardrails       \u2502\u2502   maximisation     \u2502",
        "\u2502 \u2022 JSE/SEC/FCA      \u2502\u2502 \u2022 Historical      \u2502",
        "\u2502   specific         \u2502\u2502   effectiveness    \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "           \u2502                   \u2502",
        "           \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  TRADE-OFF SCORER                              \u2502",
        "\u2502  Compliance vs. Persuasion per statement       \u2502",
        "\u2502  \u2022 Balanced phrasing generation                \u2502",
        "\u2502  \u2022 Jurisdiction-aware optimisation             \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  DELIVERED TO:                                 \u2502",
        "\u2502  \u2022 Teleprompter (balanced phrasing)            \u2502",
        "\u2502  \u2022 OCC (trade-off dashboard)                   \u2502",
        "\u2502  \u2022 Post-event effectiveness report             \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 21: Self-Optimising Global Event Intelligence Network ──
      diagramTitle(21, "Self-Optimising Global Event Intelligence Network (Module 27)"),
      ...diagramBlock([
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 CURALIVE     \u2502 \u2502 CURALIVE     \u2502 \u2502 CURALIVE     \u2502",
        "\u2502 INSTANCE A   \u2502 \u2502 INSTANCE B   \u2502 \u2502 INSTANCE N   \u2502",
        "\u2502              \u2502 \u2502              \u2502 \u2502              \u2502",
        "\u2502 Issuer: JSE  \u2502 \u2502 Issuer: LSE  \u2502 \u2502 Issuer: NYSE \u2502",
        "\u2502 Full data    \u2502 \u2502 Full data    \u2502 \u2502 Full data    \u2502",
        "\u2502 sovereignty  \u2502 \u2502 sovereignty  \u2502 \u2502 sovereignty  \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "       \u2502              \u2502              \u2502",
        "       \u2502  Anonymised  \u2502  Anonymised  \u2502",
        "       \u2502  aggregates  \u2502  aggregates  \u2502",
        "       \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                      \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502  FEDERATED INTELLIGENCE HUB                   \u2502",
        "\u2502  \u2022 Differential privacy guarantees             \u2502",
        "\u2502  \u2022 Federated learning aggregation              \u2502",
        "\u2502  \u2022 Contribution weighting by accuracy          \u2502",
        "\u2502  \u2022 Cross-jurisdiction regulatory intel         \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                     \u2502",
        "           \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "           \u25BC                   \u25BC",
        "\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "\u2502 SECTOR TRENDS     \u2502\u2502 BEST PRACTICES     \u2502",
        "\u2502 \u2022 Sentiment waves \u2502\u2502 \u2022 Templates        \u2502",
        "\u2502 \u2022 Regulatory      \u2502\u2502 \u2022 Strategies       \u2502",
        "\u2502   patterns        \u2502\u2502 \u2022 Engagement       \u2502",
        "\u2502 \u2022 Disclosure      \u2502\u2502   approaches       \u2502",
        "\u2502   quality trends  \u2502\u2502 \u2022 Speaker formats  \u2502",
        "\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 11. COMPLETE CLAIMS SUMMARY
      // ══════════════════════════════════════════════════════════════
      sectionHeading("11", "COMPLETE CLAIMS SUMMARY"),
      bodyText("25 independent claims from the parent provisional (Application ID 1773575338868) + 9 new CIP claims = 34 total claims across all submissions."),
      new Paragraph({ spacing: { after: 100 } }),
      makeTable(
        ["Claim #", "Type", "Scope", "Filing"],
        [
          ["1\u201315", "System Claims", "Core platform: event monitoring, AI analysis, cross-platform capture, OCC, benchmarking, compliance, self-improving models", "Parent (App ID 1773575338868)"],
          ["16\u201320", "Method Claims", "Cross-platform capture method, benchmarking method, collaborative management, self-improving models", "Parent"],
          ["21\u201325", "Autonomous Claims", "Self-evolving platform intelligence, pattern discovery, predictive briefings, benchmark evolution", "Parent"],
          ["26", "CIP Method", "Autonomous Event Campaign Orchestrator (Module 19)", "This CIP (Second Submission)"],
          ["27", "CIP System", "Self-Healing Regulatory Oracle (Module 20)", "This CIP (Second Submission)"],
          ["28", "CIP System", "Autonomous Investor Relationship Graph Weaver (Module 21)", "This CIP (Second Submission)"],
          ["29", "CIP Method", "Self-Certifying Multi-Event Integrity Chain (Module 22)", "This CIP (Second Submission)"],
          ["30", "CIP System", "Autonomous AI Agent Swarm Commander (Module 23)", "This CIP (Second Submission)"],
          ["31", "CIP System", "Autonomous Valuation Impact Oracle (Module 24)", "This CIP (Second Submission)"],
          ["32", "CIP System", "Self-Auditing Investor Engagement ROI Engine (Module 25)", "This CIP (Second Submission)"],
          ["33", "CIP Method", "Autonomous Dual-Purpose Compliance & Capital-Raising Advisor (Module 26)", "This CIP (Second Submission)"],
          ["34", "CIP System", "Self-Optimising Global Event Intelligence Network (Module 27)", "This CIP (Second Submission)"],
        ]
      ),

      new Paragraph({ spacing: { before: 400 } }),
      divider(),
      bodyText("End of Continuation-in-Part Supplementary Specification"),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [new TextRun({ text: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", size: 20, color: "CCCCCC" })],
        alignment: AlignmentType.CENTER, spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "CuraLive \u2014 Confidential | CIP Supplementary Specification | Second CIPC Submission | 18 March 2026",
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
      new Paragraph({
        children: [new TextRun({
          text: "References parent provisional Application ID 1773575338868 (filed 12 March 2026)",
          size: 18, color: GREY, font: "Calibri", italics: true,
        })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync("CuraLive_CIPC_CIP_Submission_2_Final_Modules_19-27.docx", buf);
console.log(`Done  =>  CuraLive_CIPC_CIP_Submission_2_Final_Modules_19-27.docx  (${(buf.length / 1024).toFixed(1)} KB)`);
