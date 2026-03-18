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

function formulaBlock(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Courier New", color: DARK_BLUE, bold: true })],
    spacing: { before: 80, after: 80 },
    alignment: AlignmentType.CENTER,
    shading: { type: ShadingType.SOLID, color: DIAGRAM_BG },
    indent: { left: 400, right: 400 },
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
        children: [new TextRun({ text: "Third Submission to CIPC", size: 28, color: DARK_BLUE, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Autonomous AI Self-Evolution Engine \u2014 Module 28", size: 28, color: DARK_BLUE, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "(Extending Modules 1\u201327 and Claims 1\u201333 of the Parent Provisional and CIP Submission 2)", size: 22, color: GREY, font: "Calibri", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", size: 20, color: "CCCCCC" })],
        alignment: AlignmentType.CENTER, spacing: { after: 400 },
      }),
      metaLine("Document Classification", "Confidential \u2014 Patent Filing Support Material"),
      metaLine("Document Type", "Continuation-in-Part (CIP) Supplementary Specification"),
      metaLine("Submission Number", "Third CIPC Filing"),
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
      metaLine("Production URL", "https://curalive-platform.replit.app"),
      metaLine("GitHub Repository", "github.com/davecameron187-sys/curalive-platform"),

      new Paragraph({ spacing: { before: 300 } }),
      new Paragraph({
        children: [new TextRun({
          text: "\"System and Method for Autonomous AI Self-Evolution with Algorithmic Evidence Scoring, Cross-Event Correlation, and Autonomous Tool Promotion for Investor Communication Intelligence Platforms\"",
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
        ["1773575338868", "12 March 2026", "Filed (Parent Provisional)", "Live Event Intelligence Platform (Modules 1\u201313 + 25 claims + 12 figures)"],
        ["CIP Submission 2", "16 March 2026", "Filed", "Autonomous Intelligence Modules 19\u201327 (8 claims 26\u201333 + 8 figures FIG 13\u201320)"],
        ["This Filing (TBD)", "18 March 2026", "Pending", "CIP Submission 3 \u2014 Module 28 (10 claims 34\u201343 + 7 figures FIG 21\u201327)"],
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 1. TITLE
      // ══════════════════════════════════════════════════════════════
      sectionHeading("1", "TITLE OF INVENTION"),
      bodyText("System and Method for Autonomous AI Self-Evolution with Algorithmic Evidence Scoring, Cross-Event Correlation, Evidence Decay Weighting, Autonomous Tool Promotion, Gap Detection Matrix, and Impact Estimation for Investor Communication Intelligence Platforms"),

      // ══════════════════════════════════════════════════════════════
      // 2. ABSTRACT
      // ══════════════════════════════════════════════════════════════
      sectionHeading("2", "ABSTRACT"),
      bodyText("This Continuation-in-Part (CIP) Submission 3 extends the parent provisional specification (Application ID 1773575338868, filed 12 March 2026) and the CIP Submission 2 (filed 16 March 2026) with one fundamentally new autonomous module: the Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring (Module 28)."),
      bodyText("Unlike the operator-driven learning loops described in Module 9 (Self-Improving Communication Intelligence Models) and Module 13 (Autonomous Self-Evolving Platform Intelligence) of the parent specification, Module 28 operates with zero human input. The system autonomously observes the quality of its own AI-generated intelligence outputs, algorithmically identifies systematic weaknesses and capability gaps across multiple events and clients, correlates those gaps using cross-event pattern analysis, and autonomously proposes, scores, and promotes new AI tool capabilities through a five-stage lifecycle pipeline \u2014 all governed by six novel interconnected algorithms."),
      bodyText("The six algorithms \u2014 Module Quality Scoring, Evidence Decay Function, Cross-Event Correlation Engine, Autonomous Promotion Pipeline, Gap Detection Matrix, and Impact Estimation Model \u2014 collectively form a closed-loop intelligence improvement system with no known prior art in any domain. Every event processed makes the system more aware of its own limitations, and that awareness automatically drives the creation, evidence-scoring, and promotion of new tool proposals."),

      // ══════════════════════════════════════════════════════════════
      // 3. FIELD
      // ══════════════════════════════════════════════════════════════
      sectionHeading("3", "FIELD OF THE INVENTION"),
      bodyText("The present invention relates to artificial intelligence systems for investor communication events and more particularly to methods for autonomous self-evolution of AI analysis platforms through algorithmic self-quality-assessment, evidence decay weighting, cross-event pattern correlation, and autonomous tool proposal promotion."),
      bodyText("The invention further relates to closed-loop AI improvement systems that operate without human labelling, operator corrections, or supervised training signals \u2014 instead deriving all improvement signals from algorithmic evaluation of the system's own production outputs across multiple events, clients, and event types."),

      // ══════════════════════════════════════════════════════════════
      // 4. RELATIONSHIP TO PARENT AND PRIOR CIP SPECIFICATIONS
      // ══════════════════════════════════════════════════════════════
      sectionHeading("4", "RELATIONSHIP TO PARENT AND PRIOR CIP SPECIFICATIONS"),
      bodyText("This CIP Submission 3 builds upon and extends the following prior filings:"),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("Parent Provisional Specification (Application ID 1773575338868, filed 12 March 2026):"),
      bodyText("Disclosed 13 subsystems (Modules 1\u201313) with 25 independent claims and 12 figures covering real-time event monitoring, AI communication analysis, cross-platform capture via silent agents, OCC operator integration, anonymised benchmarking, autonomous compliance intervention, self-improving models, predictive intelligence, communication indexes, autonomous event intervention, and autonomous self-evolving platform intelligence."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("CIP Submission 2 (filed 16 March 2026):"),
      bodyText("Extended the parent with 9 autonomous modules (Modules 19\u201327) adding 8 new independent claims (Claims 26\u201333) and 8 new figures (FIG 13\u201320). Modules 14\u201318 are operational expansion modules (Conference Dial-Out, enhanced OCC, partner integrations, Intelligence Suite) that are part of the built platform but not separately claimed."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("This CIP Submission 3 adds Module 28 (Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring), contributing 10 new claims (Claims 34\u201343) and 7 new figures (FIG 21\u201327)."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("Key Differentiation from Parent Modules 9 and 13:"),
      bodyText("Module 9 (Self-Improving Communication Intelligence Models) of the parent specification described a system where operator corrections serve as training signals for model refinement \u2014 requiring human identification and submission of corrections. Module 13 (Autonomous Self-Evolving Platform Intelligence) described three-layer autonomy: real-time adaptation, inter-event learning, and platform evolution \u2014 but relied on operator feedback loops and supervised learning patterns."),
      bodyText("Module 28 is fundamentally different: it operates with zero human input. The AI system itself determines where it is underperforming, what new capabilities would improve its outputs, and when sufficient evidence exists to promote a proposed capability from concept to approved implementation. No operator correction, labelling, or feedback is required at any stage."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 5. BACKGROUND (UPDATED)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("5", "BACKGROUND OF THE INVENTION (UPDATED)"),
      bodyText("The parent provisional specification and CIP Submission 2 collectively disclosed 27 subsystems with 33 independent claims and 20 figures, establishing a comprehensive platform for real-time investor communication intelligence. However, one critical capability gap remains unaddressed by prior art and by all prior filings:"),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("No known system \u2014 in any domain \u2014 combines all of the following capabilities in a single closed-loop architecture:"),
      numberedItem("1", "Algorithmic self-quality-assessment of AI outputs across multiple quality dimensions (depth, breadth, specificity) without human labelling or evaluation."),
      numberedItem("2", "Exponential time-decay weighting of self-improvement observations to prevent stale evidence accumulation and ensure only persistently observed gaps progress toward new tool creation."),
      numberedItem("3", "Cross-event correlation for systematic gap detection that identifies platform-wide capability limitations distinguishable from event-specific anomalies, spanning multiple independent clients and event types."),
      numberedItem("4", "Autonomous tool lifecycle management through a multi-stage promotion pipeline (emerging \u2192 proposed \u2192 approved \u2192 building \u2192 live) that operates without human gating at the first three stages."),
      numberedItem("5", "A complete closed-loop cycle where events produce reports, reports are scored, scores become observations, observations cluster into proposals, proposals accumulate evidence, evidence drives promotion, and promoted tools improve future reports."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("Prior Art Differentiation:"),
      numberedItem("1", "AutoML / Neural Architecture Search (Google, Meta): Optimises model hyperparameters and architectures. Module 28 observes the quality of AI outputs in a domain-specific context and proposes entirely new tools \u2014 not model tuning. The evidence decay, cross-event correlation, and autonomous promotion pipeline have no equivalent in AutoML."),
      numberedItem("2", "MLflow / Weights & Biases / Neptune: ML experiment tracking platforms that log model metrics and compare runs. Module 28 does not track experiments \u2014 it autonomously identifies what new experiments should be created based on output quality analysis across live production data. No known tracking platform proposes new tools."),
      numberedItem("3", "LangSmith / LangFuse (LLM observability): Trace prompt-response pairs and measure latency/cost. Module 28 goes beyond observability: it acts on quality observations by clustering them into tool proposals, scoring proposals with evidence decay, and promoting them through an autonomous lifecycle. Observability tools require humans to act on insights."),
      numberedItem("4", "Chorus.ai / Gong (conversation intelligence): Generate fixed report types from conversation data. No known conversation intelligence platform evaluates the quality of its own reports, identifies systematic gaps across clients, and proposes new report types autonomously."),
      numberedItem("5", "Reinforcement Learning from Human Feedback (RLHF): Requires human preference labels to improve model outputs. Module 28 requires zero human labels \u2014 it evaluates output quality algorithmically using the depth/breadth/specificity scoring method."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("No known prior patent, product, or academic publication combines algorithmic self-quality-assessment, evidence decay weighting, cross-event pattern correlation, and autonomous tool proposal promotion in a closed-loop system for any AI intelligence platform."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 6. SUMMARY (UPDATED)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("6", "SUMMARY OF THE INVENTION (UPDATED)"),
      bodyText("With this CIP Submission 3, the platform now comprises 28 interconnected subsystems: the original 13 from the parent specification (Modules 1\u201313), the operational expansion modules (14\u201318), the 9 autonomous modules from CIP Submission 2 (Modules 19\u201327), and the new Module 28 disclosed herein."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("Module 28 \u2014 Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring \u2014 introduces the final layer of platform autonomy: the ability for the AI system to evaluate, improve, and extend itself without any human input."),
      new Paragraph({ spacing: { after: 100 } }),
      makeTable(
        ["Module #", "Subsystem Name", "Source"],
        [
          ["1\u201313", "Core Intelligence Platform (13 subsystems)", "Parent (App ID 1773575338868)"],
          ["14\u201318", "Operational Expansion (Conference, OCC, Partners, Intelligence Suite)", "Built platform (not separately claimed)"],
          ["19", "Autonomous Event Campaign Orchestrator", "CIP Submission 2 (16 March 2026)"],
          ["20", "Self-Healing Regulatory Oracle", "CIP Submission 2"],
          ["21", "Autonomous Investor Relationship Graph Weaver", "CIP Submission 2"],
          ["22", "Self-Certifying Multi-Event Integrity Chain", "CIP Submission 2"],
          ["23", "Autonomous AI Agent Swarm Commander", "CIP Submission 2"],
          ["24", "Autonomous Valuation Impact Oracle", "CIP Submission 2"],
          ["25", "Self-Auditing Investor Engagement ROI Engine", "CIP Submission 2"],
          ["26", "Autonomous Dual-Purpose Compliance & Capital-Raising Advisor", "CIP Submission 2"],
          ["27", "Self-Optimising Global Event Intelligence Network", "CIP Submission 2"],
          ["28", "Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring", "This CIP Submission 3 (18 March 2026)"],
        ]
      ),

      new Paragraph({ spacing: { after: 200 } }),
      bodyText("Module 28 comprises six interconnected algorithmic components, each independently novel and collectively forming a closed-loop intelligence improvement system:"),
      makeTable(
        ["Algorithm #", "Name", "Function"],
        [
          ["1", "Module Quality Scoring", "Evaluates every AI module output across depth, breadth, and specificity dimensions"],
          ["2", "Evidence Decay Function", "Applies exponential time-decay weighting to observations (14-day half-life)"],
          ["3", "Cross-Event Correlation Engine", "Detects systematic gaps spanning multiple clients and event types"],
          ["4", "Autonomous Promotion Pipeline", "Five-stage lifecycle (emerging \u2192 proposed \u2192 approved \u2192 building \u2192 live)"],
          ["5", "Gap Detection Matrix", "Ranks platform\u2019s weakest modules by importance, failure rate, quality, and breadth"],
          ["6", "Impact Estimation Model", "Scores tool proposals across frequency, breadth, severity, and urgency"],
        ]
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 7. DETAILED DESCRIPTION \u2014 MODULE 28
      // ══════════════════════════════════════════════════════════════
      sectionHeading("7", "DETAILED DESCRIPTION OF MODULE 28 \u2014 AUTONOMOUS AI SELF-EVOLUTION ENGINE WITH ALGORITHMIC EVIDENCE SCORING"),
      new Paragraph({
        children: [new TextRun({ text: "CIP SUBMISSION 3 \u2014 MODULE 28", bold: true, size: 32, color: ACCENT, font: "Calibri" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Continuation-in-Part addition to parent provisional (App ID 1773575338868) and CIP Submission 2 (16 March 2026)", size: 22, color: GREY, font: "Calibri", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),

      subHeading("7.28", "Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring (Module 28)"),
      boldLabel("Refer:", "FIG 21\u201327"),
      bodyText("Purpose: The AI autonomously observes the quality of its own intelligence outputs, algorithmically identifies systematic weaknesses and capability gaps, correlates those gaps across multiple events and clients, and autonomously proposes, scores, and promotes new AI tool capabilities without any human input or operator correction. This fundamentally extends Module 9 (Self-Improving Models) and Module 13 (Self-Evolving Platform Intelligence) from the parent specification by eliminating all human dependency from the improvement loop."),

      new Paragraph({ spacing: { after: 100 } }),
      bodyText("The system maintains two persistent data stores:"),
      claimBullet("Evolution Observations Table: Stores individual observations of AI output quality and capability gaps, each tagged with source event identifier, client name, event type, observation type, module name, confidence score, and suggested capability."),
      claimBullet("Tool Proposals Table: Stores clustered tool proposals with lifecycle status, evidence count, average confidence, observation linkages, estimated impact label, and prompt templates for future tool generation."),

      divider(),

      // ── Algorithm 1 ──
      subHeading("7.28.1", "Algorithm 1 \u2014 Module Quality Scoring"),
      boldLabel("Refer:", "FIG 25"),
      bodyText("For each AI intelligence report generated by the platform (whether from a live event, uploaded archive, or pasted transcript), the Module Quality Scoring algorithm evaluates every intelligence module output across three independent quality dimensions:"),
      new Paragraph({ spacing: { after: 80 } }),
      bodyText("Dimension 1 \u2014 Depth (weight: 0.40): Measures the volume and detail of the module output. For string outputs, depth is calculated as the ratio of character count to a baseline threshold of 600 characters. For array outputs, depth is calculated as the ratio of array length to a baseline of 5 items. For object outputs, depth is assessed by the presence of numeric values, substantive string values (exceeding 20 characters), and the count of populated fields."),
      bodyText("Dimension 2 \u2014 Breadth (weight: 0.30): Measures the completeness of structured outputs. For array outputs, breadth is the ratio of items with two or more populated fields to total items. For object outputs, breadth is the ratio of non-null, non-empty fields to total fields."),
      bodyText("Dimension 3 \u2014 Specificity (weight: 0.30): Measures whether the output references actual transcript content versus generic boilerplate language. The algorithm maintains a library of generic phrases commonly produced by language models when they lack sufficient context (including \"the company,\" \"management team,\" \"key stakeholders,\" \"various factors,\" \"going forward,\" \"not applicable,\" \"insufficient data,\" and similar). Each occurrence of a generic phrase reduces the specificity score by a defined penalty factor:"),
      formulaBlock("specificity = max(0, 1 - (generic_phrase_count \u00D7 penalty_factor))"),
      bodyText("The composite quality score for each module is:"),
      formulaBlock("composite = (depth \u00D7 0.40) + (breadth \u00D7 0.30) + (specificity \u00D7 0.30)"),
      bodyText("Each module has an assigned importance weight reflecting its value to investors and operators (e.g., board-ready summary: 0.95, compliance review: 0.95, investor signals: 0.90, ESG mentions: 0.50). A module is classified as \"weak\" when its composite score falls below:"),
      formulaBlock("weak_threshold = 0.30 \u00D7 module_importance_weight"),

      divider(),

      // ── Algorithm 2 ──
      subHeading("7.28.2", "Algorithm 2 \u2014 Evidence Decay Function"),
      boldLabel("Refer:", "FIG 22"),
      bodyText("The Evidence Decay Function applies an exponential time-decay weighting to all observations, ensuring that recent evidence of AI weakness carries significantly more weight than older observations. The decay function implements a configurable half-life (default: 14 days), meaning that an observation's influence on tool proposal scoring halves every 14 days:"),
      formulaBlock("decay_weight = 0.5 ^ (age_in_days / half_life_days)"),
      bodyText("The decayed evidence score for a collection of observations linked to a tool proposal is:"),
      formulaBlock("decayed_score = weighted_mean(confidence_i \u00D7 decay_weight_i)"),
      bodyText("This mechanism serves two critical purposes:"),
      numberedItem("1", "It prevents stale observations from permanently inflating a tool proposal's evidence score. If a gap is resolved through improvements to existing modules, the evidence naturally decays and the proposal loses momentum."),
      numberedItem("2", "It ensures that actively recurring gaps maintain strong evidence scores. If the same weakness continues to appear in new events, fresh observations replace decayed ones and sustain the proposal's promotion trajectory."),

      divider(),

      // ── Algorithm 3 ──
      subHeading("7.28.3", "Algorithm 3 \u2014 Cross-Event Correlation Engine"),
      boldLabel("Refer:", "FIG 24"),
      bodyText("The Cross-Event Correlation Engine detects patterns of AI weakness that span multiple independent events, clients, and event types. A gap that appears across different contexts represents a systematic platform limitation rather than an event-specific anomaly."),
      bodyText("The correlation method operates as follows:"),
      numberedItem("1", "All non-weak-module observations are grouped by their suggested capability label or, if no label is assigned, by the first 60 characters of the observation text."),
      numberedItem("2", "For each group with two or more observations, the engine calculates: client count (distinct client organisations), event type count, frequency, and average confidence."),
      numberedItem("3", "A breadth score (0.0 to 1.0) is calculated for each group:"),
      formulaBlock("breadth = min(1.0, (clients-1)\u00D70.30 + (event_types-1)\u00D70.30 + min(freq,10)/10\u00D70.40)"),
      numberedItem("4", "Correlation results are ranked by the product of breadth score, average confidence, and frequency to produce a priority-ranked list of systematic platform gaps."),

      divider(),

      pageBreak(),

      // ── Algorithm 4 ──
      subHeading("7.28.4", "Algorithm 4 \u2014 Autonomous Promotion Pipeline"),
      boldLabel("Refer:", "FIG 23"),
      bodyText("The Autonomous Promotion Pipeline manages the lifecycle of tool proposals through a five-stage progression without requiring human input at the first three stages:"),
      new Paragraph({ spacing: { after: 80 } }),
      bodyText("Stage 1 \u2014 Emerging: A new tool proposal is created when the Accumulation Engine identifies a cluster of related observations that do not match any existing proposal."),
      bodyText("Stage 2 \u2014 Proposed (auto-promoted): An emerging proposal is automatically promoted when it meets two threshold conditions simultaneously:"),
      claimBullet("Active evidence count (observations with decay weight above 0.25) reaches or exceeds 5"),
      claimBullet("Decayed evidence score reaches or exceeds 0.55"),
      bodyText("Stage 3 \u2014 Approved (auto-promoted): A proposed tool is automatically promoted when:"),
      claimBullet("Active evidence count reaches or exceeds 12"),
      claimBullet("Decayed evidence score reaches or exceeds 0.70"),
      bodyText("Stage 4 \u2014 Building: Reserved for tools that have been approved and are actively being implemented."),
      bodyText("Stage 5 \u2014 Live: Reserved for tools that have been implemented and deployed to production."),
      new Paragraph({ spacing: { after: 80 } }),
      bodyText("A separate \"rejected\" status is available for proposals manually rejected by an operator. The demotion path is implicit through the evidence decay function: if a tool proposal's evidence stops being reinforced by new observations, the decayed score naturally drops below promotion thresholds, and the proposal stalls at its current stage."),

      divider(),

      // ── Algorithm 5 ──
      subHeading("7.28.5", "Algorithm 5 \u2014 Gap Detection Matrix"),
      boldLabel("Refer:", "FIG 21"),
      bodyText("The Gap Detection Matrix provides a systematic assessment of the platform's weakest intelligence modules by combining module importance, historical failure rate, current quality score, and the breadth of event types affected:"),
      formulaBlock("gap_score = importance_weight \u00D7 failure_rate \u00D7 (1 - quality) \u00D7 breadth_factor"),
      bodyText("Where:"),
      claimBullet("module_importance_weight is the module's assigned weight (0.0 to 1.0)"),
      claimBullet("failure_rate is the ratio of times the module has been classified as weak to total evaluations"),
      claimBullet("current_quality is the module's most recent composite quality score"),
      claimBullet("breadth_factor is 1 + (distinct_event_types_affected \u00D7 0.10)"),
      bodyText("The matrix is sorted by gap score to produce a ranked identification of systematic intelligence blind spots across the platform's entire module grid."),

      divider(),

      // ── Algorithm 6 ──
      subHeading("7.28.6", "Algorithm 6 \u2014 Impact Estimation Model"),
      boldLabel("Refer:", "FIG 26"),
      bodyText("Every tool proposal receives a continuously updated impact score predicting the value of implementing the proposed tool. The impact model combines four equally weighted dimensions:"),
      numberedItem("1", "Frequency (weight: 0.25): The ratio of events producing observations supporting this proposal to total events analysed."),
      numberedItem("2", "Breadth (weight: 0.25): breadth = min(1.0, (client_count \u00D7 0.40 + event_type_count \u00D7 0.30) / 3)"),
      numberedItem("3", "Severity (weight: 0.25): The average confidence score across all observations linked to the proposal."),
      numberedItem("4", "Urgency (weight: 0.25): The ratio of recent observations (decay weight above 0.50) to total observations."),
      formulaBlock("impact = (frequency \u00D7 0.25) + (breadth \u00D7 0.25) + (severity \u00D7 0.25) + (urgency \u00D7 0.25)"),
      bodyText("Impact labels: Transformative (\u2265 0.75) | High (\u2265 0.55) | Medium (\u2265 0.35) | Low (< 0.35)"),

      divider(),

      pageBreak(),

      // ── Accumulation Engine ──
      subHeading("7.28.7", "The Accumulation Engine \u2014 Observation Clustering Method"),
      bodyText("The Accumulation Engine orchestrates observation clustering into tool proposals through the following process:"),
      numberedItem("1", "Retrieve all unclustered observations, ordered by recency, up to 200 per cycle."),
      numberedItem("2", "Retrieve all existing tool proposals not in rejected or live status."),
      numberedItem("3", "Run Cross-Event Correlation Engine (Algorithm 3) to identify highest-impact cross-event patterns."),
      numberedItem("4", "Submit unclustered observations, existing proposals, and correlation patterns to a large language model to match observations to existing proposals or create new proposals."),
      numberedItem("5", "For matches: link observation to existing proposal, merge into evidence list using set union, recalculate impact score using Algorithm 6."),
      numberedItem("6", "For new proposals: create record with clustered observation IDs, initial evidence count, impact score, and prompt template for future tool generation."),
      numberedItem("7", "Run Autonomous Promotion Pipeline (Algorithm 4) to evaluate all proposals for stage advancement."),

      divider(),

      // ── Meta-Observer ──
      subHeading("7.28.8", "The Meta-Observer \u2014 Automatic Invocation"),
      bodyText("The Meta-Observer is invoked automatically after every AI intelligence report generation, regardless of input method (live session, archive upload, or transcript paste):"),
      numberedItem("1", "Module Quality Scoring (Algorithm 1) scores all intelligence modules in the report across depth, breadth, and specificity dimensions."),
      numberedItem("2", "Weak modules (those scoring below the importance-weighted threshold) are recorded as observations with full quality dimension data and source event metadata."),
      numberedItem("3", "Gap Detection Matrix (Algorithm 5) is built using historical observation data and current quality scores to produce a ranked list of systematic blind spots."),
      numberedItem("4", "A large language model is invoked with a fingerprint of the report (module scores, gaps, patterns) to identify missing capabilities, repeated patterns, and data gaps not detectable by algorithmic scoring alone."),
      numberedItem("5", "All observations (both algorithmic and AI-identified) are persisted to the Evolution Observations Table with full metadata."),
      numberedItem("6", "The Accumulation Engine is triggered asynchronously to process new observations, cluster them into proposals, and evaluate promotions."),
      new Paragraph({ spacing: { after: 100 } }),
      bodyText("This creates a fully autonomous feedback loop: every event processed makes the system more aware of its own limitations, and that awareness automatically drives the creation and promotion of new tool proposals. The closed-loop cycle is: events \u2192 reports \u2192 scoring \u2192 observations \u2192 proposals \u2192 evidence \u2192 promotion \u2192 improved reports."),

      divider(),

      // ── Novel Aspects ──
      subHeading("7.28.9", "Novel Aspects and Differentiation"),
      numberedItem("1", "Self-observation without human input: Unlike supervised learning systems that require labelled training data or operator corrections, this system evaluates its own output quality using the Module Quality Scoring algorithm. No human needs to identify weak output \u2014 the algorithm detects this automatically."),
      numberedItem("2", "Evidence decay for self-correcting promotion: No known system applies exponential time-decay weighting to AI self-improvement observations. This prevents stale evidence accumulation and ensures only persistently observed gaps progress through the promotion pipeline."),
      numberedItem("3", "Cross-event correlation for systematic gap detection: The correlation engine detects patterns across multiple independent events and clients \u2014 distinct from single-event analysis or A/B testing. A gap appearing across different clients, event types, and time periods is a systematic platform limitation, not an anomaly."),
      numberedItem("4", "Autonomous tool lifecycle management: The five-stage promotion pipeline operates without human gating at the first three stages. Proposals are created, promoted, and scored entirely by algorithms. Human involvement is only required for the building and deployment stages."),
      numberedItem("5", "Closed-loop improvement: The combination of all six algorithms creates a complete autonomous cycle with no human in the loop at any evaluation, observation, clustering, scoring, or promotion stage. No known system implements this for AI intelligence platforms in any domain."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 8. ALTERNATIVE IMPLEMENTATIONS
      // ══════════════════════════════════════════════════════════════
      sectionHeading("8", "ALTERNATIVE IMPLEMENTATIONS"),
      bodyText("The systems and methods described in this supplementary specification may be implemented using a variety of computational architectures and analytical techniques."),
      bodyText("The Module Quality Scoring algorithm may use any suitable quality assessment methodology including but not limited to: the three-dimension depth/breadth/specificity model described herein, information-theoretic quality measures, semantic similarity scoring against reference outputs, or hybrid approaches combining algorithmic and AI-based evaluation."),
      bodyText("The Evidence Decay Function may use any suitable time-decay model including but not limited to: the exponential half-life model described herein, linear decay, polynomial decay, or sliding window approaches. The half-life parameter (default: 14 days) may be adjusted for different operational contexts."),
      bodyText("The Cross-Event Correlation Engine may use any suitable pattern detection methodology including but not limited to: the breadth-score model described herein, graph-based community detection, hierarchical clustering, or embedding-based similarity analysis."),
      bodyText("The Autonomous Promotion Pipeline may use any number of lifecycle stages and any suitable promotion threshold criteria. The five-stage model and specific thresholds described herein are provided for illustrative purposes."),
      bodyText("The large language model components (Meta-Observer, Accumulation Engine) may utilise any suitable language model including but not limited to: GPT-4o, GPT-4o-mini, Claude, Gemini, Llama, or domain-specific fine-tuned models."),
      bodyText("The specific examples, thresholds, and implementation details described in this specification are provided for illustrative purposes and should not be interpreted as limiting the scope of the invention to any particular technology, model, parameter value, or implementation approach."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 9. CLAIMS (34-43)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("9", "NEW CLAIMS (CIP SUBMISSION 3)"),
      bodyText("The following claims are additional to and supplement Claims 1\u201325 of the parent provisional specification (Application ID 1773575338868) and Claims 26\u201333 of CIP Submission 2 (filed 16 March 2026)."),
      new Paragraph({ spacing: { after: 200 } }),

      claimParagraph("Claim 34 (CIP)", "The system of claim 1 further comprising an autonomous AI self-evolution engine configured to: (a) score each module of every AI-generated intelligence report across three quality dimensions comprising depth, breadth, and specificity, each computed using module-type-specific algorithms with configurable weighting factors; (b) classify modules as weak when the weighted composite score falls below a threshold defined as a fraction of the module's assigned importance weight; (c) persist each weakness observation with the source event identifier, client name, event type, all three dimension scores, composite score, and classification reason; and (d) invoke a large language model to identify capability gaps not detectable by algorithmic scoring alone."),

      claimParagraph("Claim 35 (CIP)", "The system of claim 34 further comprising an evidence decay function that applies an exponential time-decay weighting to all self-evolution observations using a configurable half-life parameter, wherein the decayed evidence score for a collection of observations is calculated as the weighted mean of individual observation confidence scores with weights defined by the formula: decay_weight = 0.5 ^ (observation_age_in_days / half_life_days), and wherein the decay mechanism causes tool proposals to stall or lose momentum when supporting observations are no longer being reinforced by new events, creating a self-correcting promotion pipeline."),

      claimParagraph("Claim 36 (CIP)", "The system of claim 34 further comprising a cross-event correlation engine that: (a) groups non-module-quality observations by suggested capability label; (b) calculates for each group the number of distinct client organisations, distinct event types, observation frequency, and average confidence; (c) computes a breadth score combining client diversity, event type diversity, and observation frequency; and (d) ranks correlation results by the product of breadth score, average confidence, and frequency to identify platform-wide capability gaps distinguishable from event-specific anomalies."),

      claimParagraph("Claim 37 (CIP)", "The system of claim 34 further comprising an autonomous promotion pipeline that advances tool proposals through a multi-stage lifecycle comprising at least the stages of emerging, proposed, and approved, wherein promotion from each stage to the next requires simultaneous satisfaction of a minimum active evidence count threshold and a minimum decayed evidence score threshold, and wherein the promotion evaluation executes automatically without human input after each accumulation cycle."),

      claimParagraph("Claim 38 (CIP)", "The system of claim 37 wherein the promotion thresholds are: (a) from emerging to proposed: minimum 5 active evidence observations with decay weight above 0.25 and minimum decayed evidence score of 0.55; and (b) from proposed to approved: minimum 12 active evidence observations with decay weight above 0.25 and minimum decayed evidence score of 0.70."),

      claimParagraph("Claim 39 (CIP)", "The system of claim 34 further comprising a gap detection matrix that calculates a gap score for each intelligence module using the formula: gap_score = module_importance_weight \u00D7 historical_failure_rate \u00D7 (1 - current_quality_score) \u00D7 breadth_factor, where breadth_factor is calculated as 1 plus the product of distinct event types affected and a scaling coefficient, and wherein the matrix is sorted by gap score to produce a ranked identification of systematic intelligence blind spots across the platform's module grid."),

      claimParagraph("Claim 40 (CIP)", "The system of claim 34 further comprising an impact estimation model that assigns each tool proposal a composite impact score calculated as the equally weighted mean of four dimensions: frequency of occurrence relative to total events analysed, breadth across distinct clients and event types, average severity of supporting observations, and urgency measured as the ratio of recent observations to total observations, wherein the composite score is classified into impact labels comprising transformative, high, medium, and low."),

      claimParagraph("Claim 41 (CIP)", "A computer-implemented method for autonomous self-evolution of an artificial intelligence system for investor communication events, comprising the steps of: (a) generating an intelligence report containing multiple analysis modules from a communication event transcript; (b) algorithmically scoring each module across depth, breadth, and specificity quality dimensions; (c) identifying modules whose composite quality score falls below an importance-weighted threshold; (d) recording each identified weakness as a structured observation with source event metadata and quality dimension data; (e) invoking a large language model to identify additional capability gaps not detectable by algorithmic scoring; (f) clustering observations into tool proposals using a combination of AI-powered semantic matching and cross-event correlation analysis; (g) applying exponential time-decay weighting to observation evidence; (h) autonomously promoting tool proposals through a multi-stage lifecycle based on evidence count and decayed score thresholds; and (i) repeating steps (a) through (h) for each subsequent intelligence report, creating a closed-loop self-improvement cycle."),

      claimParagraph("Claim 42 (CIP)", "The method of claim 41 wherein the specificity dimension score is calculated by detecting the presence of generic language model output phrases in the module content and reducing the score proportionally to the count of detected generic phrases, thereby distinguishing between transcript-specific intelligence and boilerplate language model output."),

      claimParagraph("Claim 43 (CIP)", "The method of claim 41 wherein the cross-event correlation step identifies capability gaps that appear across multiple distinct client organisations and multiple distinct event types, and assigns higher priority to gaps with greater client and event type diversity as measured by a breadth score combining client count, event type count, and observation frequency."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 10. FIGURES AND DIAGRAMS (FIG 21-27)
      // ══════════════════════════════════════════════════════════════
      sectionHeading("10", "UPDATED DRAWINGS (NEW FIGURES FOR CIP SUBMISSION 3)"),
      bodyText("The following figures (FIG 21\u201327) supplement Figures 1\u201312 of the parent provisional specification and Figures 13\u201320 of CIP Submission 2."),
      new Paragraph({ spacing: { after: 200 } }),

      // ── FIG 21: Complete System Architecture ──
      diagramTitle(21, "AI Self-Evolution Engine: Complete System Architecture (Module 28)"),
      ...diagramBlock([
        "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557",
        "\u2551  AUTONOMOUS AI SELF-EVOLUTION ENGINE (Module 28)          \u2551",
        "\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563",
        "\u2551                                                           \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510                                  \u2551",
        "\u2551  \u2502 INTELLIGENCE REPORT \u2502 (live / archive / paste)       \u2551",
        "\u2551  \u2502 (20 AI Modules)     \u2502                                  \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518                                  \u2551",
        "\u2551             \u2502                                              \u2551",
        "\u2551             \u25BC                                              \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510   \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2551",
        "\u2551  \u2502 ALGORITHM 1:        \u2502   \u2502 GENERIC PHRASE       \u2502  \u2551",
        "\u2551  \u2502 MODULE QUALITY      \u2502\u2500\u2500\u25B6\u2502 LIBRARY              \u2502  \u2551",
        "\u2551  \u2502 SCORING             \u2502   \u2502 'the company',       \u2502  \u2551",
        "\u2551  \u2502                     \u2502   \u2502 'going forward',     \u2502  \u2551",
        "\u2551  \u2502 Depth    (w: 0.40)  \u2502   \u2502 'N/A', etc.          \u2502  \u2551",
        "\u2551  \u2502 Breadth  (w: 0.30)  \u2502   \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2551",
        "\u2551  \u2502 Specific (w: 0.30)  \u2502                              \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518                              \u2551",
        "\u2551       \u250C\u2500\u2500\u2500\u2500\u2518   \u2514\u2500\u2500\u2500\u2500\u2510                              \u2551",
        "\u2551       \u25BC              \u25BC                              \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510                           \u2551",
        "\u2551  \u2502 WEAK    \u2502  \u2502 STRONG    \u2502                           \u2551",
        "\u2551  \u2502 MODULES \u2502  \u2502 MODULES   \u2502                           \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518                           \u2551",
        "\u2551       \u2502                                                \u2551",
        "\u2551       \u25BC                                                \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510   \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2551",
        "\u2551  \u2502 LLM META-OBSERVER   \u2502   \u2502 ALGORITHM 5:         \u2502  \u2551",
        "\u2551  \u2502 Input: fingerprint  \u2502   \u2502 GAP DETECTION MATRIX \u2502  \u2551",
        "\u2551  \u2502 Output: gaps, tools \u2502   \u2502 gap = importance \u00D7   \u2502  \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518   \u2502 fail \u00D7 (1-q) \u00D7 br   \u2502  \u2551",
        "\u2551             \u2502              \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2551",
        "\u2551             \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518                        \u2551",
        "\u2551                    \u25BC                                    \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2551",
        "\u2551  \u2502 OBSERVATIONS TABLE                              \u2502  \u2551",
        "\u2551  \u2502 source, client, event_type, module, confidence  \u2502  \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2551",
        "\u2551                        \u25BC                              \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2551",
        "\u2551  \u2502 ACCUMULATION ENGINE                             \u2502  \u2551",
        "\u2551  \u2502 1. Gather unclustered observations              \u2502  \u2551",
        "\u2551  \u2502 2. Cross-Event Correlation (A3)                 \u2502  \u2551",
        "\u2551  \u2502 3. LLM clusters into proposals                 \u2502  \u2551",
        "\u2551  \u2502 4. Calculate Impact (A6)                        \u2502  \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2551",
        "\u2551                        \u25BC                              \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2551",
        "\u2551  \u2502 TOOL PROPOSALS TABLE                            \u2502  \u2551",
        "\u2551  \u2502 title, evidence_count, status, impact, prompt   \u2502  \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2551",
        "\u2551                        \u25BC                              \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2551",
        "\u2551  \u2502 ALGORITHM 4: AUTONOMOUS PROMOTION               \u2502  \u2551",
        "\u2551  \u2502 emerging \u2192 proposed (5+ evid, 55%+ score)      \u2502  \u2551",
        "\u2551  \u2502 proposed \u2192 approved (12+ evid, 70%+ score)     \u2502  \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2551",
        "\u2551                                                           \u2551",
        "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D",
      ]),

      pageBreak(),

      // ── FIG 22: Evidence Decay Function ──
      diagramTitle(22, "Evidence Decay Function: Time-Weighted Observation Scoring"),
      ...diagramBlock([
        "  Observation Influence (decay_weight)",
        "    |",
        "  1.00 |*",
        "    |  *",
        "    |     *",
        "  0.75 |        *",
        "    |          *",
        "  0.50 |             *   <-- Half-life (14 days)",
        "    |                *",
        "  0.25 |                   * <-- Active evidence threshold",
        "    |                       *",
        "  0.00 |______________________*___________________________",
        "    0       7     14    21    28    35    42     49   56",
        "                       Age in Days",
        "",
        "  Formula: decay_weight = 0.5 ^ (age_days / 14)",
        "",
        "  Decayed Evidence Score (for proposal):",
        "    sum(confidence_i \u00D7 decay_i) / sum(decay_i)",
        "",
        "  Key:",
        "    * Observations > 28 days contribute < 25% weight",
        "    * Only observations with decay > 0.25 = 'active'",
        "    * Proposals need sustained fresh evidence to promote",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 23: Autonomous Promotion Pipeline ──
      diagramTitle(23, "Autonomous Promotion Pipeline: Lifecycle State Machine"),
      ...diagramBlock([
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u250C\u2500\u2500\u2500\u25B6\u2502  EMERGING   \u2502",
        "          \u2502    \u2502 < 5 obs     \u2502",
        "          \u2502    \u2502 score < 0.55\u2502",
        "          \u2502    \u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "          \u2502          \u2502",
        "          \u2502   [5+ evidence AND score \u2265 0.55]",
        "          \u2502          \u2502",
        "          \u2502          \u25BC",
        "          \u2502    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u2500\u2500\u2500\u2500\u2510",
        "          \u2502    \u2502  PROPOSED    \u2502    \u2502",
        "          \u2502    \u2502 Operator can \u2502    \u2502",
        "          \u2502    \u2502 reject       \u2502    \u25BC",
        "          \u2502    \u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518 \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502          \u2502        \u2502REJECTED\u2502",
        "          \u2502   [12+ evidence    \u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518",
        "          \u2502    AND \u2265 0.70]          \u2502",
        "          \u2502          \u2502        (can restore)",
        "          \u2502          \u25BC              \u2502",
        "          \u2502    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\u2500\u2500\u2500\u2518",
        "          \u2502    \u2502  APPROVED    \u2502",
        "          \u2502    \u2502 Ready for    \u2502",
        "          \u2502    \u2502 build        \u2502",
        "          \u2502    \u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "          \u2502          \u2502",
        "          \u2502   [implementation started]",
        "          \u2502          \u25BC",
        "          \u2502    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502    \u2502  BUILDING    \u2502",
        "          \u2502    \u2514\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "          \u2502          \u2502",
        "          \u2502   [deployed to production]",
        "          \u2502          \u25BC",
        "          \u2502    \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "          \u2502    \u2502    LIVE      \u2502",
        "          \u2502    \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "          \u2502",
        "          \u2502 NOTE: Evidence decay provides",
        "          \u2514\u2500\u2500 implicit demotion \u2014 proposals",
        "             stall if evidence stops arriving",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 24: Cross-Event Correlation ──
      diagramTitle(24, "Cross-Event Correlation: Pattern Detection Across Clients"),
      ...diagramBlock([
        "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557",
        "\u2551  CROSS-EVENT CORRELATION ENGINE                          \u2551",
        "\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563",
        "\u2551                                                          \u2551",
        "\u2551  Client A      Client B     Client C     Client D       \u2551",
        "\u2551  Earnings      AGM          Earnings     Board Mtg      \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510   \u2551",
        "\u2551  \u2502Gap: No \u2502  \u2502Gap: No \u2502  \u2502Gap: No \u2502  \u2502Gap: No \u2502   \u2551",
        "\u2551  \u2502peer    \u2502  \u2502peer    \u2502  \u2502peer    \u2502  \u2502forward \u2502   \u2551",
        "\u2551  \u2502compare \u2502  \u2502compare \u2502  \u2502compare \u2502  \u2502guidance\u2502   \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2518   \u2551",
        "\u2551      \u2502          \u2502          \u2502          \u2502           \u2551",
        "\u2551      \u2514\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u253C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518          \u2502           \u2551",
        "\u2551           \u2502                           \u2502           \u2551",
        "\u2551           \u25BC                           \u25BC           \u2551",
        "\u2551  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510   \u2551",
        "\u2551  \u2502 CLUSTER 1        \u2502  \u2502 CLUSTER 2        \u2502   \u2551",
        "\u2551  \u2502 'Peer Comparison' \u2502  \u2502 'Fwd Guidance'   \u2502   \u2551",
        "\u2551  \u2502 Clients: 3       \u2502  \u2502 Clients: 1       \u2502   \u2551",
        "\u2551  \u2502 Event Types: 2   \u2502  \u2502 Event Types: 1   \u2502   \u2551",
        "\u2551  \u2502 Frequency: 3     \u2502  \u2502 Frequency: 1     \u2502   \u2551",
        "\u2551  \u2502 Breadth: 0.73    \u2502  \u2502 Breadth: 0.12    \u2502   \u2551",
        "\u2551  \u2502 RANK: #1 (HIGH)  \u2502  \u2502 RANK: #4 (LOW)   \u2502   \u2551",
        "\u2551  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518   \u2551",
        "\u2551                                                          \u2551",
        "\u2551  breadth = min(1.0, (clients-1)\u00D70.30 +                  \u2551",
        "\u2551     (event_types-1)\u00D70.30 + min(freq,10)/10\u00D70.40)       \u2551",
        "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D",
      ]),

      pageBreak(),

      // ── FIG 25: Module Quality Scoring ──
      diagramTitle(25, "Module Quality Scoring: Worked Examples"),
      ...diagramBlock([
        "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557",
        "\u2551  EXAMPLE: 'Investor Signals' Module (weight: 0.90)      \u2551",
        "\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563",
        "\u2551  Input: Array of 3 investor signal objects               \u2551",
        "\u2551                                                          \u2551",
        "\u2551  DEPTH    (w:0.40): len=3, depth=min(1, 3/5) = 0.60     \u2551",
        "\u2551  BREADTH  (w:0.30): 2/3 items fully populated = 0.67    \u2551",
        "\u2551  SPECIFIC (w:0.30): 1 generic phrase, spec = 0.85       \u2551",
        "\u2551                                                          \u2551",
        "\u2551  COMPOSITE: (0.60\u00D70.40)+(0.67\u00D70.30)+(0.85\u00D70.30) = 0.696  \u2551",
        "\u2551  THRESHOLD: 0.30 \u00D7 0.90 = 0.27                          \u2551",
        "\u2551  RESULT: 0.696 > 0.27 \u2192 NOT WEAK (passes)               \u2551",
        "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D",
        "",
        "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557",
        "\u2551  EXAMPLE: 'ESG Mentions' Module (weight: 0.50)          \u2551",
        "\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563",
        "\u2551  Input: Empty array []                                   \u2551",
        "\u2551                                                          \u2551",
        "\u2551  DEPTH: 0.00 | BREADTH: 0.00 | SPECIFICITY: 1.00       \u2551",
        "\u2551  COMPOSITE: 0.30 | THRESHOLD: 0.15                      \u2551",
        "\u2551  RESULT: 0.30 > 0.15 \u2192 NOT WEAK (low-weight passes)    \u2551",
        "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 26: Impact Estimation Model ──
      diagramTitle(26, "Impact Estimation Model: Four-Dimension Scoring"),
      ...diagramBlock([
        "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557",
        "\u2551  PROPOSED TOOL: 'Peer Company Comparison Engine'        \u2551",
        "\u2551  Supporting observations: 8 | Events analysed: 15      \u2551",
        "\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563",
        "\u2551                                                          \u2551",
        "\u2551  FREQUENCY (w:0.25): 8/15 events = 0.533                \u2551",
        "\u2551  BREADTH   (w:0.25): 4 clients, 3 types = 0.833         \u2551",
        "\u2551  SEVERITY  (w:0.25): avg confidence = 0.720              \u2551",
        "\u2551  URGENCY   (w:0.25): 6/8 recent = 0.750                 \u2551",
        "\u2551                                                          \u2551",
        "\u2551  COMPOSITE: (0.533+0.833+0.720+0.750)\u00D70.25 = 0.709      \u2551",
        "\u2551                                                          \u2551",
        "\u2551  IMPACT LABEL: HIGH (\u2265 0.55, < 0.75)                    \u2551",
        "\u2551                                                          \u2551",
        "\u2551  Labels:                                                 \u2551",
        "\u2551    Low (<0.35) | Medium (0.35\u20130.54) | High (0.55\u20130.74)  \u2551",
        "\u2551    | Transformative (\u2265 0.75)                             \u2551",
        "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D",
      ]),
      divider(),

      pageBreak(),

      // ── FIG 27: Closed-Loop Self-Evolution Cycle ──
      diagramTitle(27, "Closed-Loop Self-Evolution Cycle"),
      ...diagramBlock([
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 LIVE EVENT /     \u2502",
        "               \u2502 ARCHIVE / PASTE  \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "               (1)      \u25BC",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 20-MODULE AI     \u2502",
        "               \u2502 REPORT           \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "               (2)      \u25BC",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 META-OBSERVER    \u2502",
        "               \u2502 Quality Scoring  \u2502",
        "               \u2502 + LLM Gap Det.   \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "               (3)      \u25BC",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 OBSERVATIONS     \u2502",
        "               \u2502 PERSISTED        \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "               (4)      \u25BC",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 ACCUMULATION     \u2502",
        "               \u2502 ENGINE + Cross   \u2502",
        "               \u2502 Event Corr.      \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "               (5)      \u25BC",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 TOOL PROPOSALS   \u2502",
        "               \u2502 Evidence Decay   \u2502",
        "               \u2502 + Impact Score   \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "               (6)      \u25BC",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 AUTONOMOUS       \u2502",
        "               \u2502 PROMOTION        \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "               (7)      \u25BC",
        "               \u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510",
        "               \u2502 TOOL BUILT &     \u2502",
        "               \u2502 DEPLOYED         \u2502",
        "               \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518",
        "                        \u2502",
        "                        \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u25B6 back to step (1)",
        "                           (CLOSED LOOP)",
      ]),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════
      // 11. INCORPORATION BY REFERENCE
      // ══════════════════════════════════════════════════════════════
      sectionHeading("11", "INCORPORATION BY REFERENCE"),
      bodyText("The full specification, claims (1\u201333), drawings (FIG 1\u2013FIG 20), definitions, detailed description, and all alternative implementations described in the parent provisional specification (Application ID 1773575338868, filed 12 March 2026) and CIP Submission 2 (filed 16 March 2026) are incorporated by reference in their entirety. The new matter described in this CIP Submission 3 supplements and extends the prior filings without modifying or replacing any of the parent claims or described embodiments."),

      // ══════════════════════════════════════════════════════════════
      // 12. COMPLETE CLAIMS SUMMARY
      // ══════════════════════════════════════════════════════════════
      sectionHeading("12", "COMPLETE CLAIMS SUMMARY"),
      bodyText("25 independent claims from the parent provisional + 8 CIP Submission 2 claims + 10 CIP Submission 3 claims = 43 total claims across all submissions."),
      new Paragraph({ spacing: { after: 100 } }),
      makeTable(
        ["Claim #", "Type", "Scope", "Filing"],
        [
          ["1\u201315", "System Claims", "Core platform: event monitoring, AI analysis, cross-platform capture, OCC, benchmarking, compliance, self-improving models", "Parent (App ID 1773575338868)"],
          ["16\u201320", "Method Claims", "Cross-platform capture method, benchmarking method, collaborative management, self-improving models", "Parent"],
          ["21\u201325", "Autonomous Claims", "Self-evolving platform intelligence, pattern discovery, predictive briefings, benchmark evolution", "Parent"],
          ["26\u201333", "CIP Claims", "Autonomous Modules 19\u201327: Campaign Orchestrator, Regulatory Oracle, Integrity Chain, Swarm Commander, Valuation Oracle, ROI Engine, Compliance Advisor, Global Intelligence Network", "CIP Submission 2 (16 March 2026)"],
          ["34", "CIP System", "Autonomous AI Self-Evolution Engine \u2014 Module Quality Scoring (Module 28)", "This CIP Submission 3"],
          ["35", "CIP System (dep. 34)", "Evidence Decay Function with exponential half-life weighting", "This CIP Submission 3"],
          ["36", "CIP System (dep. 34)", "Cross-Event Correlation Engine for systematic gap detection", "This CIP Submission 3"],
          ["37", "CIP System (dep. 34)", "Autonomous Promotion Pipeline \u2014 multi-stage lifecycle", "This CIP Submission 3"],
          ["38", "CIP System (dep. 37)", "Promotion Thresholds \u2014 specific evidence count and score thresholds", "This CIP Submission 3"],
          ["39", "CIP System (dep. 34)", "Gap Detection Matrix \u2014 ranked module blind spots", "This CIP Submission 3"],
          ["40", "CIP System (dep. 34)", "Impact Estimation Model \u2014 four-dimension scoring", "This CIP Submission 3"],
          ["41", "CIP Method", "Computer-implemented method for autonomous AI self-evolution", "This CIP Submission 3"],
          ["42", "CIP Method (dep. 41)", "Specificity dimension \u2014 generic phrase detection", "This CIP Submission 3"],
          ["43", "CIP Method (dep. 41)", "Cross-event correlation method \u2014 breadth-scored gap detection", "This CIP Submission 3"],
        ]
      ),

      // ══════════════════════════════════════════════════════════════
      // 13. DECLARATION
      // ══════════════════════════════════════════════════════════════
      new Paragraph({ spacing: { before: 400 } }),
      sectionHeading("13", "DECLARATION"),
      bodyText("I, David Cameron, the applicant and inventor, declare that the new matter described in this CIP Submission 3 (Module 28 \u2014 Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring) was not disclosed in the parent provisional patent specification (Application ID 1773575338868, filed 12 March 2026) or CIP Submission 2 (filed 16 March 2026), that the new matter has been reduced to practice in a working implementation of the CuraLive platform, and that this submission is filed within the priority period of the parent application."),
      new Paragraph({ spacing: { before: 400 } }),
      bodyText("_______________________________"),
      bodyText("David Cameron"),
      bodyText("Applicant and Inventor"),
      bodyText("Date: 18 March 2026"),

      new Paragraph({ spacing: { before: 400 } }),
      divider(),
      bodyText("End of Continuation-in-Part Supplementary Specification \u2014 Third Submission"),
      new Paragraph({ spacing: { before: 200 } }),
      new Paragraph({
        children: [new TextRun({ text: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500", size: 20, color: "CCCCCC" })],
        alignment: AlignmentType.CENTER, spacing: { after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: "CuraLive \u2014 Confidential | CIP Supplementary Specification | Third CIPC Submission | 18 March 2026",
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
          text: "References parent provisional Application ID 1773575338868 (filed 12 March 2026) and CIP Submission 2 (filed 16 March 2026)",
          size: 18, color: GREY, font: "Calibri", italics: true,
        })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({
          text: "Production URL: https://curalive-platform.replit.app | GitHub: github.com/davecameron187-sys/curalive-platform",
          size: 18, color: GREY, font: "Calibri", italics: true,
        })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
const filename = "CuraLive_CIPC_CIP_Submission_3_Module_28.docx";
writeFileSync(filename, buf);
console.log(`Done  =>  ${filename}  (${(buf.length / 1024).toFixed(1)} KB)`);
