const PDFDocument = require("pdfkit");
const fs = require("fs");

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  info: {
    Title: "CIP Amendment — Module M: Autonomous AI Self-Evolution Engine",
    Author: "David Cameron",
    Subject: "Patent Amendment — CIPC Filing",
  },
});

const output = fs.createWriteStream("docs/CIP-Module-M-AI-Self-Evolution-Engine.pdf");
doc.pipe(output);

const W = doc.page.width - 120;
const FONT_NORMAL = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";
const FONT_ITALIC = "Helvetica-Oblique";
const FONT_MONO = "Courier";

function title(text, size = 18) {
  doc.font(FONT_BOLD).fontSize(size).text(text, { align: "center" });
  doc.moveDown(0.5);
}

function subtitle(text, size = 13) {
  doc.moveDown(0.5);
  doc.font(FONT_BOLD).fontSize(size).text(text);
  doc.moveDown(0.3);
}

function heading(text, size = 11) {
  doc.moveDown(0.3);
  doc.font(FONT_BOLD).fontSize(size).text(text);
  doc.moveDown(0.2);
}

function para(text, opts = {}) {
  doc.font(FONT_NORMAL).fontSize(10).text(text, { lineGap: 3, ...opts });
  doc.moveDown(0.3);
}

function bold(text) {
  doc.font(FONT_BOLD).fontSize(10).text(text, { lineGap: 3 });
}

function italic(text) {
  doc.font(FONT_ITALIC).fontSize(10).text(text, { lineGap: 3 });
}

function bullet(text, indent = 20) {
  const x = doc.x;
  doc.font(FONT_NORMAL).fontSize(10);
  doc.text("•", x + indent, doc.y, { continued: false });
  doc.text(text, x + indent + 15, doc.y - doc.currentLineHeight(), { width: W - indent - 15, lineGap: 3 });
  doc.moveDown(0.15);
}

function formula(text) {
  doc.moveDown(0.2);
  doc.font(FONT_MONO).fontSize(9).text(text, { indent: 30 });
  doc.moveDown(0.2);
}

function step(num, text) {
  doc.font(FONT_NORMAL).fontSize(10);
  doc.text(`Step ${num}: `, { continued: true });
  doc.font(FONT_NORMAL).text(text, { lineGap: 3 });
  doc.moveDown(0.15);
}

function hr() {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.moveTo(60, y).lineTo(doc.page.width - 60, y).stroke("#cccccc");
  doc.moveDown(0.5);
}

function checkPage(needed = 80) {
  if (doc.y > doc.page.height - doc.page.margins.bottom - needed) {
    doc.addPage();
  }
}

// ════════════════════════════════════════════════════════════════════
// COVER / HEADER
// ════════════════════════════════════════════════════════════════════

doc.moveDown(2);
title("CIP AMENDMENT — MODULE M", 20);
doc.moveDown(0.3);
title("Addition to Continuation-in-Part (CIP) Application", 12);
doc.moveDown(0.5);

para("Filed as an amendment to the CIP application dated 16 March 2026, filed as a continuation of:", { align: "center" });
doc.moveDown(0.2);
doc.font(FONT_BOLD).fontSize(10).text("CuraLive — CIPC Provisional Patent Specification", { align: "center" });
doc.moveDown(0.3);
doc.font(FONT_ITALIC).fontSize(10).text(
  '"System and Method for Artificial Intelligence-Based Monitoring, Analysis, Cross-Platform Intelligence Capture, and Autonomous Intelligence Generation for Investor Communication Events"',
  { align: "center" }
);

doc.moveDown(1.5);
para("Applicant: David Cameron");
para("41 Rooigras Avenue, 73 Tiffani Gardens, Bassonia, 2090, Johannesburg");
para("+27 84 444 6001");
para("Republic of South Africa");

hr();

// ════════════════════════════════════════════════════════════════════
// 1. AMENDMENT TO PREAMBLE
// ════════════════════════════════════════════════════════════════════

subtitle("1. Amendment to Preamble");
para(
  "The CIP application summary at Section 2 is amended to add one additional inventive module, increasing the count from twelve (12) to thirteen (13) modules:"
);
doc.moveDown(0.2);
bullet("Module M — Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring");

hr();

// ════════════════════════════════════════════════════════════════════
// 2. AMENDMENT TO SECTION 2
// ════════════════════════════════════════════════════════════════════

subtitle("2. Amendment to Section 2 — Summary of New Matter");
para("The following entry is added to the list of inventive modules:");
bullet("Module M — Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring");

hr();

// ════════════════════════════════════════════════════════════════════
// 3. MODULE M — DETAILED DESCRIPTION
// ════════════════════════════════════════════════════════════════════

doc.addPage();
subtitle("3. Module M — Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring");

heading("Detailed Description");
para(
  'The parent application described a self-evolving platform intelligence capability in which operator corrections train the AI analysis pipeline over time. The CIP Module B described retroactive intelligence generation from historical archives. This new matter adds a fundamentally different and more advanced form of self-evolution: an autonomous system that observes the quality of its own AI-generated intelligence outputs, algorithmically identifies systematic weaknesses and capability gaps, correlates those gaps across multiple events and clients, and autonomously proposes, scores, and promotes new AI tool capabilities without any human input or operator correction.'
);
para(
  "Unlike the operator-driven learning loop described in the parent application (where a human must identify and submit corrections), Module M operates with zero human input. The AI system itself determines where it is underperforming, what new capabilities would improve its outputs, and when sufficient evidence exists to promote a proposed capability from concept to approved implementation."
);

// 3.1
heading("3.1 System Architecture");
para(
  "The Autonomous AI Self-Evolution Engine comprises six interconnected algorithmic components, each independently novel and collectively forming a closed-loop intelligence improvement system with no known prior art in any domain:"
);
const algos = [
  "Module Quality Scoring Algorithm",
  "Evidence Decay Function",
  "Cross-Event Correlation Engine",
  "Autonomous Promotion Pipeline",
  "Gap Detection Matrix",
  "Impact Estimation Model",
];
algos.forEach((a, i) => bullet(`${i + 1}. ${a}`));

doc.moveDown(0.3);
para("The system maintains two persistent data stores:");
bullet(
  "Evolution Observations Table: Stores individual observations of AI output quality and capability gaps, each tagged with source event, client, event type, observation type, module name, confidence score, and suggested capability."
);
bullet(
  "Tool Proposals Table: Stores clustered tool proposals with lifecycle status, evidence count, average confidence, observation linkages, estimated impact label, and prompt templates for future tool generation."
);

// 3.2
checkPage(200);
heading("3.2 Algorithm 1 — Module Quality Scoring");
para(
  "For each AI intelligence report generated by the platform (whether from a live event, uploaded archive, or pasted transcript), the Module Quality Scoring algorithm evaluates every intelligence module output across three independent quality dimensions:"
);

bold("Dimension 1 — Depth (weight: 0.40):");
para(
  "Measures the volume and detail of the module output. For string outputs, depth is calculated as the ratio of character count to a baseline threshold of 600 characters. For array outputs, depth is calculated as the ratio of array length to a baseline of 5 items. For object outputs, depth is assessed by the presence of numeric values, substantive string values (exceeding 20 characters), and the count of populated fields."
);

bold("Dimension 2 — Breadth (weight: 0.30):");
para(
  "Measures the completeness of structured outputs. For array outputs, breadth is the ratio of items with two or more populated fields to total items. For object outputs, breadth is the ratio of non-null, non-empty fields to total fields."
);

bold("Dimension 3 — Specificity (weight: 0.30):");
para(
  'Measures whether the output references actual transcript content versus generic boilerplate language. The algorithm maintains a list of generic phrases commonly produced by language models when they lack sufficient context (including "the company," "management team," "key stakeholders," "various factors," "going forward," "not applicable," "insufficient data," and similar). Each occurrence of a generic phrase reduces the specificity score by a defined penalty factor.'
);
formula("specificity = max(0, 1 - (generic_phrase_count × penalty_factor))");

para("The composite quality score for each module is:");
formula("composite = (depth × 0.40) + (breadth × 0.30) + (specificity × 0.30)");

para(
  "Each module has an assigned importance weight reflecting its value to investors and operators (e.g., board-ready summary: 0.95, compliance review: 0.95, investor signals: 0.90, ESG mentions: 0.50). A module is classified as \"weak\" when its composite score falls below:"
);
formula("weak_threshold = 0.30 × module_importance_weight");

// 3.3
checkPage(200);
heading("3.3 Algorithm 2 — Evidence Decay Function");
para(
  "The Evidence Decay Function applies an exponential time-decay weighting to all observations, ensuring that recent evidence of AI weakness carries significantly more weight than older observations. The decay function implements a configurable half-life (default: 14 days), meaning that an observation's influence on tool proposal scoring halves every 14 days."
);
formula("decay_weight = 0.5 ^ (age_in_days / half_life_days)");
para("The decayed evidence score for a collection of observations linked to a tool proposal is:");
formula("decayed_score = Σ(confidence_i × decay_weight_i) / Σ(decay_weight_i)");

para("This mechanism serves two critical purposes:");
bullet(
  "It prevents stale observations from permanently inflating a tool proposal's evidence score. If a gap is resolved through improvements to existing modules, the evidence naturally decays and the proposal loses momentum."
);
bullet(
  "It ensures that actively recurring gaps maintain strong evidence scores. If the same weakness continues to appear in new events, fresh observations replace decayed ones and sustain the proposal's promotion trajectory."
);

// 3.4
checkPage(200);
heading("3.4 Algorithm 3 — Cross-Event Correlation Engine");
para(
  "The Cross-Event Correlation Engine detects patterns of AI weakness that span multiple independent events, clients, and event types. A gap that appears across different contexts represents a systematic platform limitation rather than an event-specific anomaly."
);
para("The correlation method operates as follows:");
step(1, "All non-weak-module observations are grouped by their suggested capability label or, if no label is assigned, by the first 60 characters of the observation text.");
step(2, "For each group with two or more observations, the engine calculates: client count (distinct client organisations), event type count, frequency, and average confidence.");
step(3, "A breadth score (0.0 to 1.0) is calculated for each group:");
formula("breadth = min(1.0, (clients-1)×0.30 + (event_types-1)×0.30 + min(freq,10)/10×0.40)");
step(4, "Correlation results are ranked by the product of breadth score, average confidence, and frequency.");

// 3.5
checkPage(200);
heading("3.5 Algorithm 4 — Autonomous Promotion Pipeline");
para(
  "The Autonomous Promotion Pipeline manages the lifecycle of tool proposals through a five-stage progression without requiring human input:"
);
bold("Stage 1 — Emerging:");
para("A new tool proposal is created when the Accumulation Engine identifies a cluster of related observations that do not match any existing proposal.");
bold("Stage 2 — Proposed (auto-promoted):");
para("An emerging proposal is automatically promoted when it meets two threshold conditions simultaneously:");
bullet("Active evidence count (observations with decay weight above 0.25) reaches or exceeds 5");
bullet("Decayed evidence score reaches or exceeds 0.55");
bold("Stage 3 — Approved (auto-promoted):");
para("A proposed tool is automatically promoted when:");
bullet("Active evidence count reaches or exceeds 12");
bullet("Decayed evidence score reaches or exceeds 0.70");
bold("Stage 4 — Building:");
para("Reserved for tools that have been approved and are actively being implemented.");
bold("Stage 5 — Live:");
para("Reserved for tools that have been implemented and deployed.");
para(
  'A separate "rejected" status is available for proposals manually rejected by an operator. The demotion path is implicit through the evidence decay function: if a tool proposal\'s evidence stops being reinforced by new observations, the decayed score naturally drops below promotion thresholds, and the proposal stalls at its current stage.'
);

// 3.6
checkPage(200);
heading("3.6 Algorithm 5 — Gap Detection Matrix");
para(
  "The Gap Detection Matrix provides a systematic assessment of the platform's weakest intelligence modules by combining module importance, historical failure rate, current quality score, and the breadth of event types affected."
);
formula("gap_score = importance_weight × failure_rate × (1 - quality) × breadth_factor");
para("Where:");
bullet("module_importance_weight is the module's assigned weight (0.0 to 1.0)");
bullet("failure_rate is the ratio of times the module has been classified as weak to total evaluations");
bullet("current_quality is the module's most recent composite quality score");
bullet("breadth_factor is 1 + (distinct_event_types_affected × 0.10)");

// 3.7
checkPage(200);
heading("3.7 Algorithm 6 — Impact Estimation Model");
para(
  "Every tool proposal receives a continuously updated impact score predicting the value of implementing the proposed tool. The impact model combines four equally weighted dimensions:"
);
bold("Frequency (weight: 0.25):");
para("The ratio of events producing observations supporting this proposal to total events analysed.");
bold("Breadth (weight: 0.25):");
formula("breadth = min(1.0, (client_count × 0.40 + event_type_count × 0.30) / 3)");
bold("Severity (weight: 0.25):");
para("The average confidence score across all observations linked to the proposal.");
bold("Urgency (weight: 0.25):");
para("The ratio of recent observations (decay weight above 0.50) to total observations.");
formula("impact = (frequency × 0.25) + (breadth × 0.25) + (severity × 0.25) + (urgency × 0.25)");
para("Impact labels: Transformative (≥0.75) | High (≥0.55) | Medium (≥0.35) | Low (<0.35)");

// 3.8
checkPage(200);
heading("3.8 The Accumulation Engine — Observation Clustering Method");
para("The Accumulation Engine orchestrates observation clustering into tool proposals:");
step(1, "Retrieve all unclustered observations, ordered by recency, up to 200 per cycle.");
step(2, "Retrieve all existing tool proposals not in rejected or live status.");
step(3, "Run Cross-Event Correlation Engine to identify highest-impact cross-event patterns.");
step(4, "Submit unclustered observations, existing proposals, and patterns to an LLM to match observations to existing proposals or create new proposals.");
step(5, "For matches: link observation, merge into evidence list using set union, recalculate impact.");
step(6, "For new proposals: create record with clustered IDs, initial evidence count, impact score, and prompt template.");
step(7, "Run Autonomous Promotion Pipeline to evaluate all proposals for stage advancement.");

// 3.9
checkPage(200);
heading("3.9 The Meta-Observer — Automatic Invocation");
para(
  "The Meta-Observer is invoked automatically after every AI intelligence report generation, regardless of input method (live session, archive upload, or transcript paste):"
);
step(1, "Module Quality Scoring scores all intelligence modules in the report.");
step(2, "Weak modules are recorded as observations with full quality dimension data.");
step(3, "Gap Detection Matrix is built using historical observation data and current quality scores.");
step(4, "An LLM is invoked with a fingerprint of the report to identify missing capabilities, repeated patterns, and data gaps.");
step(5, "All observations (algorithmic and AI-identified) are persisted.");
step(6, "The Accumulation Engine is triggered asynchronously to process new observations.");
doc.moveDown(0.3);
para(
  "This creates a fully autonomous feedback loop: every event processed makes the system more aware of its own limitations, and that awareness automatically drives the creation and promotion of new tool proposals."
);

// 3.10
checkPage(200);
heading("3.10 Novel Aspects and Differentiation");
const novelty = [
  "Self-observation without human input: Unlike supervised learning systems that require labelled training data or operator corrections, this system evaluates its own output quality using the Module Quality Scoring algorithm. No human needs to identify weak output — the algorithm detects this automatically.",
  "Evidence decay for self-correcting promotion: No known system applies exponential time-decay weighting to AI self-improvement observations. This prevents stale evidence accumulation and ensures only persistently observed gaps progress.",
  "Cross-event correlation for systematic gap detection: The correlation engine detects patterns across multiple independent events and clients — distinct from single-event analysis or A/B testing.",
  "Autonomous tool lifecycle management: The five-stage promotion pipeline operates without human gating at the first three stages. Proposals are created, promoted, and scored entirely by algorithms.",
  "Closed-loop improvement: The combination of all six algorithms creates a complete autonomous cycle: events → reports → scoring → observations → proposals → evidence → promotion → improved reports. No known system implements this for AI intelligence platforms.",
];
novelty.forEach((n, i) => {
  checkPage(60);
  bullet(`${i + 1}. ${n}`);
});

// ════════════════════════════════════════════════════════════════════
// 4. CLAIMS
// ════════════════════════════════════════════════════════════════════

doc.addPage();
subtitle("4. Additional Claims");
heading("AI Self-Evolution Engine Claims (Module M):");

const claims = [
  {
    num: 53,
    text: "The system of claim 1 further comprising an autonomous AI self-evolution engine configured to: (a) score each module of every AI-generated intelligence report across three quality dimensions comprising depth, breadth, and specificity, each computed using module-type-specific algorithms with configurable weighting factors; (b) classify modules as weak when the weighted composite score falls below a threshold defined as a fraction of the module's assigned importance weight; (c) persist each weakness observation with the source event identifier, client name, event type, all three dimension scores, composite score, and classification reason; and (d) invoke a large language model to identify capability gaps not detectable by algorithmic scoring alone.",
  },
  {
    num: 54,
    text: "The system of claim 53 further comprising an evidence decay function that applies an exponential time-decay weighting to all self-evolution observations using a configurable half-life parameter, wherein the decayed evidence score for a collection of observations is calculated as the weighted mean of individual observation confidence scores with weights defined by the formula: decay_weight = 0.5 ^ (observation_age_in_days / half_life_days), and wherein the decay mechanism causes tool proposals to stall or lose momentum when supporting observations are no longer being reinforced by new events, creating a self-correcting promotion pipeline.",
  },
  {
    num: 55,
    text: "The system of claim 53 further comprising a cross-event correlation engine that: (a) groups non-module-quality observations by suggested capability label; (b) calculates for each group the number of distinct client organisations, distinct event types, observation frequency, and average confidence; (c) computes a breadth score combining client diversity, event type diversity, and observation frequency; and (d) ranks correlation results by the product of breadth score, average confidence, and frequency to identify platform-wide capability gaps distinguishable from event-specific anomalies.",
  },
  {
    num: 56,
    text: "The system of claim 53 further comprising an autonomous promotion pipeline that advances tool proposals through a multi-stage lifecycle comprising at least the stages of emerging, proposed, and approved, wherein promotion from each stage to the next requires simultaneous satisfaction of a minimum active evidence count threshold and a minimum decayed evidence score threshold, and wherein the promotion evaluation executes automatically without human input after each accumulation cycle.",
  },
  {
    num: 57,
    text: "The system of claim 56 wherein the promotion thresholds are: (a) from emerging to proposed: minimum 5 active evidence observations with decay weight above 0.25 and minimum decayed evidence score of 0.55; and (b) from proposed to approved: minimum 12 active evidence observations with decay weight above 0.25 and minimum decayed evidence score of 0.70.",
  },
  {
    num: 58,
    text: "The system of claim 53 further comprising a gap detection matrix that calculates a gap score for each intelligence module using the formula: gap_score = module_importance_weight × historical_failure_rate × (1 - current_quality_score) × breadth_factor, where breadth_factor is calculated as 1 plus the product of distinct event types affected and a scaling coefficient, and wherein the matrix is sorted by gap score to produce a ranked identification of systematic intelligence blind spots across the platform's module grid.",
  },
  {
    num: 59,
    text: "The system of claim 53 further comprising an impact estimation model that assigns each tool proposal a composite impact score calculated as the equally weighted mean of four dimensions: frequency of occurrence relative to total events analysed, breadth across distinct clients and event types, average severity of supporting observations, and urgency measured as the ratio of recent observations to total observations, wherein the composite score is classified into impact labels comprising transformative, high, medium, and low.",
  },
  {
    num: 60,
    text: "A computer-implemented method for autonomous self-evolution of an artificial intelligence system for investor communication events, comprising the steps of: (a) generating an intelligence report containing multiple analysis modules from a communication event transcript; (b) algorithmically scoring each module across depth, breadth, and specificity quality dimensions; (c) identifying modules whose composite quality score falls below an importance-weighted threshold; (d) recording each identified weakness as a structured observation with source event metadata and quality dimension data; (e) invoking a large language model to identify additional capability gaps not detectable by algorithmic scoring; (f) clustering observations into tool proposals using a combination of AI-powered semantic matching and cross-event correlation analysis; (g) applying exponential time-decay weighting to observation evidence; (h) autonomously promoting tool proposals through a multi-stage lifecycle based on evidence count and decayed score thresholds; and (i) repeating steps (a) through (h) for each subsequent intelligence report, creating a closed-loop self-improvement cycle.",
  },
  {
    num: 61,
    text: 'The method of claim 60 wherein the specificity dimension score is calculated by detecting the presence of generic language model output phrases in the module content and reducing the score proportionally to the count of detected generic phrases, thereby distinguishing between transcript-specific intelligence and boilerplate language model output.',
  },
  {
    num: 62,
    text: "The method of claim 60 wherein the cross-event correlation step identifies capability gaps that appear across multiple distinct client organisations and multiple distinct event types, and assigns higher priority to gaps with greater client and event type diversity as measured by a breadth score combining client count, event type count, and observation frequency.",
  },
];

for (const c of claims) {
  checkPage(100);
  doc.font(FONT_BOLD).fontSize(10).text(`${c.num}.`, { continued: true });
  doc.font(FONT_NORMAL).fontSize(10).text(` ${c.text}`, { lineGap: 3 });
  doc.moveDown(0.5);
}

// ════════════════════════════════════════════════════════════════════
// 5. DIAGRAMS
// ════════════════════════════════════════════════════════════════════

doc.addPage();
subtitle("5. Additional Drawings");

// --- FIG 24 ---
heading("FIG 24 — AI Self-Evolution Engine: Complete System Architecture");
doc.moveDown(0.3);

const fig24Lines = [
  "+================================================================+",
  "|     AUTONOMOUS AI SELF-EVOLUTION ENGINE                        |",
  "+================================================================+",
  "|                                                                |",
  "|  +---------------------+                                      |",
  "|  | INTELLIGENCE REPORT |  (live session / archive / paste)    |",
  "|  | (20 AI Modules)     |                                      |",
  "|  +----------+----------+                                      |",
  "|             |                                                  |",
  "|             v                                                  |",
  "|  +---------------------+   +----------------------------+     |",
  "|  | ALGORITHM 1:        |   | GENERIC PHRASE LIBRARY     |     |",
  "|  | MODULE QUALITY      |-->| 'the company', 'going      |     |",
  "|  | SCORING             |   |  forward', 'N/A', etc.     |     |",
  "|  |                     |   +----------------------------+     |",
  "|  | Depth    (w: 0.40)  |                                      |",
  "|  | Breadth  (w: 0.30)  |                                      |",
  "|  | Specific (w: 0.30)  |                                      |",
  "|  +----------+----------+                                      |",
  "|        +----+----+                                            |",
  "|        |         |                                            |",
  "|        v         v                                            |",
  "|   +---------+ +---------+                                     |",
  "|   | WEAK    | | STRONG  |                                     |",
  "|   | MODULES | | MODULES |                                     |",
  "|   +----+----+ +---------+                                     |",
  "|        |                                                      |",
  "|        v                                                      |",
  "|  +---------------------+   +----------------------------+     |",
  "|  | LLM META-OBSERVER   |   | ALGORITHM 5:               |     |",
  "|  | (gpt-4o-mini)       |   | GAP DETECTION MATRIX       |     |",
  "|  | Input: fingerprint  |   | gap = importance x fail    |     |",
  "|  | Output: gaps, tools |   |   x (1-quality) x breadth  |     |",
  "|  +----------+----------+   +-------------+--------------+     |",
  "|             |                            |                    |",
  "|             +------------+---------------+                    |",
  "|                          |                                    |",
  "|                          v                                    |",
  "|             +----------------------------+                    |",
  "|             | OBSERVATIONS TABLE         |                    |",
  "|             | source, client, event_type |                    |",
  "|             | module, confidence, gap    |                    |",
  "|             +-------------+--------------+                    |",
  "|                           |                                   |",
  "|                           v                                   |",
  "|             +----------------------------+                    |",
  "|             | ACCUMULATION ENGINE        |                    |",
  "|             | 1. Gather unclustered      |                    |",
  "|             | 2. Cross-Event Corr (A3)   |                    |",
  "|             | 3. LLM clusters into       |                    |",
  "|             |    proposals               |                    |",
  "|             | 4. Calculate Impact (A6)   |                    |",
  "|             +-------------+--------------+                    |",
  "|                           |                                   |",
  "|                           v                                   |",
  "|             +----------------------------+                    |",
  "|             | TOOL PROPOSALS TABLE       |                    |",
  "|             | title, evidence_count,     |                    |",
  "|             | status, impact, prompt     |                    |",
  "|             +-------------+--------------+                    |",
  "|                           |                                   |",
  "|                           v                                   |",
  "|             +----------------------------+                    |",
  "|             | ALGORITHM 4:               |                    |",
  "|             | AUTONOMOUS PROMOTION       |                    |",
  "|             | emerging --> proposed       |                    |",
  "|             |  (5+ evid, 55%+ score)     |                    |",
  "|             | proposed --> approved       |                    |",
  "|             |  (12+ evid, 70%+ score)    |                    |",
  "|             +----------------------------+                    |",
  "|                                                                |",
  "+================================================================+",
];

doc.font(FONT_MONO).fontSize(6.5);
for (const line of fig24Lines) {
  checkPage(10);
  doc.text(line);
}

// --- FIG 25 ---
doc.addPage();
heading("FIG 25 — Evidence Decay Function: Time-Weighted Observation Scoring");
doc.moveDown(0.3);

const fig25Lines = [
  "  Observation Influence (decay_weight)",
  "    |",
  "  1.00 |*",
  "    |  *",
  "    |    *",
  "  0.75 |     *",
  "    |       *",
  "  0.50 |         *    <-- Half-life (14 days)",
  "    |            *",
  "  0.25 |               *  <-- Active evidence threshold",
  "    |                   *",
  "  0.00 |______________________*___________________________",
  "    0     7    14    21    28    35    42    49    56",
  "                    Age in Days",
  "",
  "  Formula: decay_weight = 0.5 ^ (age_days / 14)",
  "",
  "  Decayed Evidence Score (for proposal):",
  "    sum(confidence_i x decay_i) / sum(decay_i)",
  "",
  "  Key:",
  "    * Observations > 28 days contribute < 25% weight",
  "    * Only observations with decay > 0.25 = 'active'",
  "    * Proposals need sustained fresh evidence to promote",
];
doc.font(FONT_MONO).fontSize(7.5);
for (const line of fig25Lines) doc.text(line);

// --- FIG 26 ---
doc.moveDown(1);
heading("FIG 26 — Autonomous Promotion Pipeline: Lifecycle State Machine");
doc.moveDown(0.3);

const fig26Lines = [
  "                +-----------+",
  "           +--->| EMERGING  |",
  "           |    | < 5 obs   |",
  "           |    | score<0.55|",
  "           |    +-----+-----+",
  "           |          |",
  "           |   [5+ evidence AND score >= 0.55]",
  "           |          |",
  "           |          v",
  "           |    +-----------+",
  "           |    | PROPOSED  |----+",
  "           |    | Operator  |    |",
  "           |    | can reject|    |",
  "           |    +-----+-----+    |",
  "           |          |          v",
  "           |   [12+ evidence  +--------+",
  "           |    AND >= 0.70]  |REJECTED|",
  "           |          |       |        |-+",
  "           |          v       +--------+ |",
  "           |    +-----------+   (can     |",
  "           |    | APPROVED  |  restore)  |",
  "           |    | Ready for |            |",
  "           |    | build     |<-----------+",
  "           |    +-----+-----+",
  "           |          |",
  "           |   [implementation started]",
  "           |          v",
  "           |    +-----------+",
  "           |    | BUILDING  |",
  "           |    +-----+-----+",
  "           |          |",
  "           |   [deployed to production]",
  "           |          v",
  "           |    +-----------+",
  "           |    |   LIVE    |",
  "           |    +-----------+",
  "           |",
  "           |  NOTE: Evidence decay provides",
  "           +-- implicit demotion -- proposals",
  "              stall if evidence stops arriving",
];
doc.font(FONT_MONO).fontSize(7.5);
for (const line of fig26Lines) {
  checkPage(10);
  doc.text(line);
}

// --- FIG 27 ---
doc.addPage();
heading("FIG 27 — Cross-Event Correlation: Pattern Detection");
doc.moveDown(0.3);

const fig27Lines = [
  "+================================================================+",
  "|  CROSS-EVENT CORRELATION ENGINE                                |",
  "+================================================================+",
  "|                                                                |",
  "|  Client A     Client B     Client C     Client D              |",
  "|  Earnings     AGM          Earnings     Board Mtg             |",
  "|  +--------+  +--------+  +--------+  +--------+              |",
  "|  |Gap: No |  |Gap: No |  |Gap: No |  |Gap: No |              |",
  "|  |peer    |  |peer    |  |peer    |  |forward |              |",
  "|  |compare |  |compare |  |compare |  |guidance|              |",
  "|  +---+----+  +---+----+  +---+----+  +---+----+              |",
  "|      |           |           |            |                   |",
  "|      +-----+-----+-----+----+            |                   |",
  "|            |            |                 |                   |",
  "|            v            v                 v                   |",
  "|  +------------------+ +------------------+                    |",
  "|  | CLUSTER 1        | | CLUSTER 2        |                    |",
  "|  | 'Peer Comparison'| | 'Fwd Guidance'   |                    |",
  "|  | Clients: 3       | | Clients: 1       |                    |",
  "|  | Event Types: 2   | | Event Types: 1   |                    |",
  "|  | Frequency: 3     | | Frequency: 1     |                    |",
  "|  | Breadth: 0.73    | | Breadth: 0.12    |                    |",
  "|  | RANK: #1 (HIGH)  | | RANK: #4 (LOW)   |                    |",
  "|  +------------------+ +------------------+                    |",
  "|                                                                |",
  "|  breadth = min(1.0, (clients-1)*0.30 +                        |",
  "|    (event_types-1)*0.30 + min(freq,10)/10*0.40)               |",
  "+================================================================+",
];
doc.font(FONT_MONO).fontSize(7);
for (const line of fig27Lines) doc.text(line);

// --- FIG 28 ---
doc.moveDown(1);
heading("FIG 28 — Module Quality Scoring: Worked Example");
doc.moveDown(0.3);

const fig28Lines = [
  "+================================================================+",
  "|  EXAMPLE: 'Investor Signals' Module (weight: 0.90)            |",
  "+================================================================+",
  "|  Input: Array of 3 investor signal objects                    |",
  "|                                                                |",
  "|  DEPTH (w:0.40): len=3, depth=min(1, 3/5) = 0.60             |",
  "|  BREADTH (w:0.30): 2/3 items fully populated = 0.67           |",
  "|  SPECIFICITY (w:0.30): 1 generic phrase, spec=0.85            |",
  "|                                                                |",
  "|  COMPOSITE: (0.60*0.40)+(0.67*0.30)+(0.85*0.30) = 0.696      |",
  "|  THRESHOLD: 0.30 * 0.90 = 0.27                               |",
  "|  RESULT: 0.696 > 0.27 --> NOT WEAK (passes)                   |",
  "+================================================================+",
  "|  EXAMPLE: 'ESG Mentions' Module (weight: 0.50)                |",
  "+================================================================+",
  "|  Input: Empty array []                                        |",
  "|                                                                |",
  "|  DEPTH: 0.00 | BREADTH: 0.00 | SPECIFICITY: 1.00             |",
  "|  COMPOSITE: 0.30 | THRESHOLD: 0.15                           |",
  "|  RESULT: 0.30 > 0.15 --> NOT WEAK (low-weight module passes)  |",
  "+================================================================+",
];
doc.font(FONT_MONO).fontSize(7);
for (const line of fig28Lines) doc.text(line);

// --- FIG 29 ---
doc.addPage();
heading("FIG 29 — Impact Estimation Model: Four-Dimension Scoring");
doc.moveDown(0.3);

const fig29Lines = [
  "+================================================================+",
  "|  PROPOSED TOOL: 'Peer Company Comparison Engine'              |",
  "|  Supporting observations: 8 | Events analysed: 15            |",
  "+================================================================+",
  "|                                                                |",
  "|  FREQUENCY (w:0.25): 8/15 events = 0.533                     |",
  "|  BREADTH   (w:0.25): 4 clients, 3 types = 0.833              |",
  "|  SEVERITY  (w:0.25): avg confidence = 0.720                   |",
  "|  URGENCY   (w:0.25): 6/8 recent = 0.750                      |",
  "|                                                                |",
  "|  COMPOSITE: (0.533+0.833+0.720+0.750)*0.25 = 0.709           |",
  "|                                                                |",
  "|  IMPACT LABEL: HIGH (>= 0.55, < 0.75)                        |",
  "|                                                                |",
  "|  Labels:                                                      |",
  "|    Low (<0.35) | Medium (0.35-0.54) | High (0.55-0.74)       |",
  "|    | Transformative (>= 0.75)                                  |",
  "+================================================================+",
];
doc.font(FONT_MONO).fontSize(7);
for (const line of fig29Lines) doc.text(line);

// --- FIG 30 ---
doc.moveDown(1);
heading("FIG 30 — Closed-Loop Self-Evolution Cycle");
doc.moveDown(0.3);

const fig30Lines = [
  "              +------------------+",
  "              |  LIVE EVENT /    |",
  "              |  ARCHIVE / PASTE |",
  "              +--------+---------+",
  "                       |",
  "              (1)      v",
  "              +------------------+",
  "              |  20-MODULE AI    |",
  "              |  REPORT          |",
  "              +--------+---------+",
  "                       |",
  "              (2)      v",
  "              +------------------+",
  "              |  META-OBSERVER   |",
  "              |  Quality Scoring |",
  "              |  + LLM Gap Det.  |",
  "              +--------+---------+",
  "                       |",
  "              (3)      v",
  "              +------------------+",
  "              |  OBSERVATIONS    |",
  "              |  PERSISTED       |",
  "              +--------+---------+",
  "                       |",
  "              (4)      v",
  "              +------------------+",
  "              |  ACCUMULATION    |",
  "              |  ENGINE + Cross  |",
  "              |  Event Corr.     |",
  "              +--------+---------+",
  "                       |",
  "              (5)      v",
  "              +------------------+",
  "              |  TOOL PROPOSALS  |",
  "              |  Evidence Decay  |",
  "              |  + Impact Score  |",
  "              +--------+---------+",
  "                       |",
  "              (6)      v",
  "              +------------------+",
  "              |  AUTONOMOUS      |",
  "              |  PROMOTION       |",
  "              +--------+---------+",
  "                       |",
  "              (7)      v",
  "              +------------------+",
  "              |  TOOL BUILT &    |",
  "              |  DEPLOYED        |",
  "              +--------+---------+",
  "                       |",
  "                       +----------> back to step (1)",
  "                          (CLOSED LOOP)",
];
doc.font(FONT_MONO).fontSize(7.5);
for (const line of fig30Lines) doc.text(line);

// ════════════════════════════════════════════════════════════════════
// 6. INCORPORATION + PRIOR ART + DECLARATION
// ════════════════════════════════════════════════════════════════════

doc.addPage();
subtitle("6. Incorporation by Reference");
para(
  "The full specification, claims (1–52), drawings (FIG 1–FIG 23), definitions, detailed description, and all alternative implementations described in the parent CIP application and the original provisional patent specification are incorporated by reference in their entirety. The new matter described in this amendment supplements and extends the CIP application without modifying or replacing any of the parent claims or described embodiments."
);

hr();

subtitle("7. Prior Art Differentiation for Module M");
doc.moveDown(0.3);

const priorArt = [
  ["AutoML / Neural Architecture Search (Google, Meta)", "AutoML optimises model hyperparameters and architectures. Module M observes the quality of AI outputs in a domain-specific context and proposes entirely new tools — not model tuning. The evidence decay, cross-event correlation, and autonomous promotion pipeline have no equivalent in AutoML."],
  ["MLflow / Weights & Biases / Neptune", "ML experiment tracking platforms log model metrics and compare runs. Module M does not track experiments — it autonomously identifies what new experiments should be created based on output quality analysis across live production data. No known tracking platform proposes new tools."],
  ["LangSmith / LangFuse (LLM observability)", "LLM observability tools trace prompt-response pairs and measure latency/cost. Module M goes beyond observability: it acts on quality observations by clustering them into tool proposals, scoring proposals with evidence decay, and promoting them through an autonomous lifecycle. Observability tools require humans to act on insights."],
  ["Chorus.ai / Gong (conversation intelligence)", "Conversation analytics platforms generate fixed report types. No known conversation intelligence platform evaluates the quality of its own reports, identifies systematic gaps across clients, and proposes new report types autonomously."],
  ["Reinforcement Learning from Human Feedback (RLHF)", "RLHF requires human preference labels to improve model outputs. Module M requires zero human labels — it evaluates output quality algorithmically using the depth/breadth/specificity scoring method."],
];

for (const [art, diff] of priorArt) {
  checkPage(60);
  bold(art);
  para(diff);
  doc.moveDown(0.2);
}

para(
  "No known prior patent, product, or academic publication combines algorithmic self-quality-assessment, evidence decay weighting, cross-event pattern correlation, and autonomous tool proposal promotion in a closed-loop system for any AI intelligence platform."
);

hr();

subtitle("8. Declaration");
doc.moveDown(0.3);
para(
  "I, David Cameron, the applicant and inventor, declare that the new matter described in this amendment (Module M — Autonomous AI Self-Evolution Engine with Algorithmic Evidence Scoring) was not disclosed in the parent provisional patent specification or the CIP application dated 16 March 2026, that the new matter has been reduced to practice in a working implementation of the CuraLive platform, and that this amendment is filed within the priority period of the parent application."
);

doc.moveDown(2);
doc.font(FONT_NORMAL).fontSize(10).text("_______________________________");
doc.text("David Cameron");
doc.text("Applicant and Inventor");
doc.text("Date: ___ March 2026");

doc.moveDown(2);
hr();
doc.font(FONT_ITALIC).fontSize(8).text(
  "This document is prepared for filing with the Companies and Intellectual Property Commission (CIPC) of South Africa in accordance with the Patents Act 57 of 1978 and the Patent Regulations.",
  { align: "center" }
);

doc.end();

output.on("finish", () => {
  console.log("PDF generated: docs/CIP-Module-M-AI-Self-Evolution-Engine.pdf");
});
