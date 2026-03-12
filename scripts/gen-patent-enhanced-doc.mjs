import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, ShadingType, WidthType, BorderStyle, VerticalAlign,
  PageBreak,
} from "docx";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(__dirname, "../public"), { recursive: true });

const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder };

function titleBlock(text, bg, textColor = "FFFFFF") {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9000, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: bg },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 180, bottom: 180, left: 300, right: 300 },
      borders: noBorders,
      children: text.split("\n").map((line, i) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: i === 0 ? 0 : 60, after: 0 },
        children: [new TextRun({ text: line, size: i === 0 ? 28 : 20, bold: i === 0, color: textColor })],
      })),
    })] })]
  });
}

function sectionHead(text) {
  return new Paragraph({
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, size: 26, bold: true, color: "1E3A8A" })],
  });
}

function subHead(text) {
  return new Paragraph({
    spacing: { before: 280, after: 100 },
    children: [new TextRun({ text, size: 22, bold: true, color: "374151" })],
  });
}

function para(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: 100 },
    children: [new TextRun({ text, size: 21, color: "1F2937" })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: 400 },
    children: [new TextRun({ text: `\u2022  ${text}`, size: 20, color: "1F2937" })],
  });
}

function claimPara(num, text) {
  return new Paragraph({
    spacing: { before: 140, after: 80 },
    indent: { left: 200 },
    children: [
      new TextRun({ text: `Claim ${num}:  `, bold: true, size: 21, color: "1E3A8A" }),
      new TextRun({ text, size: 21, color: "1F2937" }),
    ],
  });
}

function newLabel(text) {
  return new Table({
    width: { size: 1800, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 1800, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: "DC2626" },
      margins: { top: 30, bottom: 30, left: 60, right: 60 },
      borders: noBorders,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, size: 16, bold: true, color: "FFFFFF" })] })],
    })] })]
  });
}

function spacer(n = 120) {
  return new Paragraph({ spacing: { before: n, after: 0 }, children: [] });
}

function figBlock(title, lines) {
  const children = [
    new Paragraph({ spacing: { before: 200, after: 80 }, children: [new TextRun({ text: title, size: 22, bold: true, color: "1E3A8A" })] }),
    ...lines.map(l => new Paragraph({
      spacing: { before: 40, after: 40 },
      indent: { left: 400 },
      children: [new TextRun({ text: l, size: 19, color: l.includes("\u2193") || l.includes("\u2192") ? "6B7280" : "374151", bold: !l.includes("\u2193") && !l.includes("\u2192") })],
    })),
  ];
  return children;
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive Provisional Patent Specification v2.0 (Enhanced)",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [

      titleBlock("CuraLive\nProvisional Patent Specification v2.0\n(Enhanced)", "1E3A8A"),
      spacer(200),

      // TITLE
      sectionHead("Title of the Invention"),
      para("System and Method for Artificial Intelligence-Based Monitoring, Analysis, Cross-Platform Intelligence Capture, and Autonomous Intelligence Generation for Investor Communication Events"),
      spacer(40),

      // APPLICANT
      sectionHead("Applicant"),
      para("David Cameron"),
      spacer(40),

      // INVENTION DISCLOSURE
      sectionHead("Invention Disclosure Summary"),
      para("The CuraLive invention relates to a system for monitoring communication events and generating communication intelligence insights using artificial intelligence."),
      para("Investor communication events such as earnings calls, investor briefings, and capital markets days generate valuable communication signals including investor questions, executive responses, sentiment patterns, and engagement signals."),
      para("These signals often influence investor sentiment and financial market behavior but are typically not analyzed systematically."),
      para("The CuraLive system captures communication signals generated during investor communication events and analyzes these signals using artificial intelligence models to generate communication intelligence insights."),
      para("The system converts unstructured communication events into structured communication intelligence data that can be used for analytics, benchmarking, predictive insights, and regulatory monitoring."),
      spacer(20),
      newLabel("NEW IN V2.0"),
      para("The system further includes a method for capturing communication signals from external third-party communication platforms by autonomously establishing audio connections to external conference bridges, automatically authenticating using machine-generated dual-tone multi-frequency (DTMF) signaling, and deploying silent artificial intelligence monitoring agents within those external sessions. This cross-platform capture method enables communication intelligence to be generated from events hosted on any communication platform, not only events hosted natively on the CuraLive system."),
      para("The system also includes a method for embedding artificial intelligence analysis engines directly within the operator control interface, enabling real-time human-AI collaborative decision making during live communication events."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // FIELD
      sectionHead("Field of the Invention"),
      para("The present invention relates to systems and methods for monitoring communication events."),
      para("More specifically, the invention relates to artificial intelligence systems capable of capturing communication signals generated during investor communication events and generating communication intelligence insights from those signals."),
      spacer(20),
      newLabel("NEW IN V2.0"),
      para("The invention further relates to methods for cross-platform communication signal capture, wherein signals are captured from external third-party communication platforms through autonomous bridge connection techniques, and to methods for real-time embedded intelligence presentation within operator control interfaces."),

      spacer(100),

      // DEFINITIONS
      sectionHead("Definitions"),
      subHead("Communication Event"),
      para("A communication event refers to any structured interaction in which information is communicated between presenters and participants including earnings calls, investor briefings, capital markets days, shareholder meetings, analyst meetings, or conference presentations."),
      subHead("Communication Signal"),
      para("A communication signal refers to any measurable indicator generated during a communication event including audio signals, video signals, transcripts, investor questions, executive responses, sentiment indicators, and engagement metrics."),
      subHead("Communication Intelligence"),
      para("Communication intelligence refers to analytical insights generated from communication signals through computational analysis including artificial intelligence techniques."),
      subHead("Artificial Intelligence Model"),
      para("An artificial intelligence model refers to a computational system capable of identifying patterns in data including machine learning models, neural networks, natural language processing systems, or hybrid analytical systems."),
      subHead("Communication Intelligence Dataset"),
      para("A communication intelligence dataset refers to a structured collection of communication signals or communication intelligence metrics generated across communication events."),
      spacer(20),
      newLabel("NEW IN V2.0"),
      subHead("External Communication Bridge"),
      para("An external communication bridge refers to a third-party teleconference or webcast platform not operated by the CuraLive system, into which the system may autonomously establish audio connections for the purpose of capturing communication signals."),
      subHead("Autonomous Bridge Connection"),
      para("An autonomous bridge connection refers to the method by which the system programmatically initiates an outbound telephony call to an external communication bridge, automatically transmits authentication credentials using dual-tone multi-frequency (DTMF) signaling, and establishes a persistent silent audio monitoring session."),
      subHead("Embedded Intelligence Interface"),
      para("An embedded intelligence interface refers to an operator-facing control interface in which artificial intelligence analysis results including transcription, sentiment scoring, and compliance monitoring are presented in real time alongside event management controls, enabling simultaneous human oversight and AI-assisted decision making."),
      subHead("Anonymised Communication Intelligence"),
      para("Anonymised communication intelligence refers to communication intelligence data from which all personally identifiable information and organization-identifying information has been removed, enabling aggregation into industry-wide benchmarking datasets without compromising confidentiality."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // BACKGROUND
      sectionHead("Background of the Invention"),
      para("Investor communication events play a critical role in financial markets."),
      para("During these events companies communicate financial results, strategy, and operational updates to investors and analysts."),
      para("Examples include:"),
      bullet("earnings calls"),
      bullet("investor briefings"),
      bullet("capital markets days"),
      bullet("shareholder meetings"),
      bullet("analyst presentations."),
      para("Despite their importance, existing event platforms primarily provide broadcasting and recording functionality and lack systems capable of analyzing communication dynamics occurring during these events."),
      para("Communication signals generated during investor events may include:"),
      bullet("investor questions"),
      bullet("executive responses"),
      bullet("sentiment changes"),
      bullet("engagement patterns"),
      bullet("communication transparency indicators."),
      para("These signals are typically unstructured and are not analyzed systematically across events or organizations."),
      spacer(20),
      newLabel("NEW IN V2.0"),
      para("Furthermore, many investor communication events are hosted on third-party platforms over which the event intelligence provider has no direct control. Existing systems require events to be hosted natively on their own platform in order to capture and analyze communication signals. There is no known prior art describing a method for autonomously connecting to external conference bridges, authenticating via DTMF signaling, and deploying silent AI monitoring agents within those external sessions to capture communication intelligence."),
      para("Additionally, existing operator consoles for managing investor communication events display only basic call management information. There is no known prior art describing an operator control interface in which live AI intelligence outputs (transcription, sentiment, compliance) are embedded alongside event management controls for real-time human-AI collaborative operation."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // SUMMARY
      sectionHead("Summary of the Invention"),
      para("The present invention provides a system for capturing communication signals generated during communication events and generating communication intelligence insights using artificial intelligence."),
      para("The system captures communication signals including:"),
      bullet("audio streams"),
      bullet("video streams"),
      bullet("transcripts"),
      bullet("investor questions"),
      bullet("engagement signals."),
      para("Artificial intelligence models analyze these signals to identify patterns including:"),
      bullet("sentiment signals"),
      bullet("communication transparency"),
      bullet("discussion topics"),
      bullet("investor concerns"),
      bullet("communication risks."),
      para("The system stores communication signals and analysis results in a communication intelligence database capable of generating analytics across multiple events or organizations."),
      spacer(20),
      newLabel("NEW IN V2.0"),
      para("The system further provides a method for cross-platform communication signal capture wherein the system autonomously establishes audio connections to external third-party conference bridges by: (a) programmatically initiating outbound telephony calls to bridge dial-in numbers; (b) automatically transmitting conference access credentials using DTMF signaling; and (c) deploying silent AI monitoring agents within the external session to capture communication signals identical in structure to those captured from natively-hosted events."),
      para("The system further provides an embedded intelligence interface wherein AI analysis outputs are presented in real time within the operator control console, enabling operators to view live transcription, per-speaker sentiment scores, and compliance flags alongside event management controls during live events."),
      para("The system further provides a method for generating anonymised communication intelligence datasets by stripping personally identifiable information from captured communication signals and aggregating intelligence metrics across multiple organizations to produce industry-wide benchmarking data."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // SYSTEM OVERVIEW
      sectionHead("System Overview"),
      para("The communication intelligence platform may include:"),
      bullet("event monitoring infrastructure"),
      bullet("communication signal processing modules"),
      bullet("artificial intelligence analysis engines"),
      bullet("autonomous intervention engines"),
      bullet("communication intelligence databases"),
      bullet("predictive communication intelligence modules."),
      spacer(20),
      newLabel("NEW IN V2.0"),
      bullet("cross-platform bridge connection module"),
      bullet("DTMF authentication engine"),
      bullet("silent AI agent deployment system"),
      bullet("embedded real-time intelligence operator interface"),
      bullet("anonymised benchmarking aggregation engine"),
      bullet("self-improving model training pipeline."),
      para("The system may operate using artificial intelligence models, statistical models, rule-based agents, hybrid decision systems, or equivalent analytical mechanisms capable of analyzing communication signals."),

      spacer(100),

      // CROSS-PLATFORM CAPTURE (NEW SECTION)
      newLabel("ENTIRELY NEW SECTION"),
      sectionHead("Cross-Platform Communication Signal Capture"),
      para("The system includes a cross-platform capture module capable of capturing communication signals from events hosted on external third-party communication platforms."),
      subHead("Autonomous Bridge Connection Method"),
      para("The cross-platform capture method operates as follows:"),
      bullet("An operator configures an external bridge connection by providing a bridge dial-in telephone number and a conference access code."),
      bullet("The system programmatically initiates an outbound telephony call to the bridge dial-in number using a cloud telephony API."),
      bullet("Upon call answer, the system transmits the conference access code using dual-tone multi-frequency (DTMF) signaling to authenticate with the external bridge."),
      bullet("The system establishes a persistent audio monitoring session as a silent participant within the external conference."),
      bullet("A silent AI monitoring agent is deployed within this session to capture and process communication signals in real time."),
      bullet("Communication signals captured from the external bridge are normalized to the same data structure as signals captured from natively-hosted events, enabling identical AI analysis and reporting."),
      subHead("Silent AI Agent Deployment"),
      para("The silent AI agent deployed within an external bridge session performs the following operations concurrently:"),
      bullet("Real-time speech-to-text transcription of all audio"),
      bullet("Speaker identification and attribution"),
      bullet("Per-speaker sentiment analysis"),
      bullet("Compliance-sensitive language detection and flagging"),
      bullet("Audio recording for post-event review."),
      para("The external conference host and participants are not required to install any software or make any configuration changes. The system joins as a standard dial-in participant."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // EMBEDDED INTELLIGENCE (NEW SECTION)
      newLabel("ENTIRELY NEW SECTION"),
      sectionHead("Embedded Real-Time Intelligence Operator Interface"),
      para("The system includes an embedded intelligence interface within the operator control console (OCC)."),
      para("During live communication events, the operator interface simultaneously displays:"),
      bullet("Event management controls (participant admission, muting, call routing)"),
      bullet("Live word-for-word transcription with speaker attribution"),
      bullet("Real-time per-speaker sentiment scores"),
      bullet("Compliance flag alerts as they are detected"),
      bullet("AI-generated event status indicators."),
      para("This embedded design enables real-time human-AI collaborative decision making. The operator can act on AI insights during the event rather than reviewing them after the event has concluded."),
      para("The embedded intelligence interface operates identically whether the event is hosted natively on the CuraLive platform or captured from an external bridge via the cross-platform capture module."),

      spacer(100),

      // ANONYMISED BENCHMARKING (NEW SECTION)
      newLabel("ENTIRELY NEW SECTION"),
      sectionHead("Anonymised Communication Intelligence Benchmarking"),
      para("The system includes a benchmarking aggregation engine that generates industry-wide communication intelligence benchmarks from anonymised event data."),
      subHead("Anonymisation Method"),
      para("The anonymisation process operates as follows:"),
      bullet("All personally identifiable information (names, contact details, speaker identities) is removed or replaced with anonymous identifiers."),
      bullet("Organization-identifying information is removed or categorized by industry sector and size band only."),
      bullet("Communication intelligence metrics (sentiment scores, concern topics, engagement patterns, compliance flags) are retained in anonymised form."),
      bullet("Anonymised records are stored in a separate aggregate intelligence dataset."),
      subHead("Benchmarking Dataset"),
      para("The aggregate intelligence dataset enables the generation of industry-wide benchmarks including:"),
      bullet("Average investor sentiment by sector"),
      bullet("Most common investor concern topics by industry"),
      bullet("Communication transparency benchmarks"),
      bullet("Engagement pattern baselines"),
      bullet("Compliance flag frequency by event type."),
      para("This dataset grows with every event processed by the system. As the dataset expands, the statistical reliability of benchmarks increases, creating a compounding data advantage."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // SELF-IMPROVING MODELS (NEW SECTION)
      newLabel("ENTIRELY NEW SECTION"),
      sectionHead("Self-Improving Communication Intelligence Models"),
      para("The system includes a model improvement pipeline wherein communication intelligence data generated from processed events is used to refine the accuracy of AI models over time."),
      para("The self-improvement loop operates as follows:"),
      bullet("Communication events are captured and analyzed by current AI models."),
      bullet("Analysis results are stored in the communication intelligence database."),
      bullet("Operator corrections (transcript edits, sentiment adjustments, compliance flag overrides) are captured as training signals."),
      bullet("Periodically, the accumulated data and correction signals are used to fine-tune AI models."),
      bullet("Updated models are deployed for subsequent events with improved accuracy."),
      para("This creates a learning loop where the system becomes more accurate at predicting investor concerns, detecting sentiment shifts, and identifying compliance risks with each event it processes."),

      spacer(100),

      // AUTONOMOUS COMPLIANCE (NEW SECTION)
      newLabel("ENTIRELY NEW SECTION"),
      sectionHead("Autonomous Compliance Intervention"),
      para("The system includes an autonomous compliance intervention module capable of detecting compliance-sensitive communication during live events and generating automated responses."),
      para("Intervention actions may include:"),
      bullet("Real-time operator alerts when compliance-sensitive language is detected"),
      bullet("Automated flagging and timestamping of compliance-relevant segments"),
      bullet("Optional automated participant muting when pre-defined compliance thresholds are breached"),
      bullet("Post-event compliance summary report generation."),
      para("The compliance intervention module operates in real time during live events, enabling regulatory risk to be managed during the event rather than discovered after the fact."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // EXISTING SECTIONS (kept from v1)
      sectionHead("Event Monitoring System"),
      para("The event monitoring system captures communication signals generated during communication events."),
      para("Signals captured may include:"),
      bullet("audio streams"),
      bullet("video streams"),
      bullet("transcripts"),
      bullet("investor questions"),
      bullet("engagement signals."),
      para("Communication signals may be captured from webcast platforms, teleconference systems, video communication systems, or external third-party conference bridges via autonomous bridge connection."),

      sectionHead("Communication Signal Processing"),
      para("Captured communication signals are processed to generate structured communication data."),
      para("Processing operations may include:"),
      bullet("speech-to-text transcription"),
      bullet("speaker identification"),
      bullet("question extraction"),
      bullet("topic classification"),
      bullet("sentiment analysis."),

      sectionHead("Artificial Intelligence Communication Analysis"),
      para("Artificial intelligence models analyze communication signals generated during communication events."),
      para("The models may detect patterns including:"),
      bullet("sentiment changes"),
      bullet("discussion topics"),
      bullet("investor question patterns"),
      bullet("communication risk indicators."),

      sectionHead("Agentic Event Intelligence System"),
      para("The system may include multiple specialized artificial intelligence agents including:"),
      bullet("sentiment analysis agents"),
      bullet("compliance monitoring agents"),
      bullet("investor question analysis agents"),
      bullet("engagement analysis agents."),
      para("An event intelligence orchestration engine may combine insights from these agents."),

      sectionHead("Autonomous Event Intervention"),
      para("The system may generate automated actions during communication events including:"),
      bullet("moderator alerts"),
      bullet("automated moderation"),
      bullet("question prioritization"),
      bullet("communication risk alerts."),

      sectionHead("Communication Intelligence Dataset"),
      para("The system may generate structured communication intelligence datasets by aggregating communication signals across multiple communication events."),

      sectionHead("Predictive Communication Intelligence"),
      para("The system may generate predictive analytics including:"),
      bullet("predicted investor concerns"),
      bullet("predicted market reactions"),
      bullet("communication risk forecasts."),

      sectionHead("Communication Intelligence Indexes"),
      para("The system may generate communication intelligence indexes including:"),
      bullet("Communication Transparency Index"),
      bullet("Investor Communication Health Score"),
      bullet("Global Investor Concern Index."),

      sectionHead("Future Embodiments"),
      para("The system may analyze communication signals across multiple organizations to generate market-wide communication intelligence analytics."),
      para("Communication intelligence data may be distributed through APIs or data feeds to external systems including financial analytics platforms, regulatory monitoring systems, or investor relations platforms."),
      para("Communication signals may also be correlated with financial market data, analyst reports, and social sentiment signals."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // ENHANCED CLAIMS
      sectionHead("Claims"),
      spacer(40),
      para("(Original claims retained, enhanced claims added below)"),
      spacer(40),

      claimPara("1", "A computer-implemented system for monitoring communication events comprising an event monitoring module configured to capture communication signals generated during a communication event."),
      claimPara("2", "The system of claim 1 wherein the system converts captured communication signals into structured communication data."),
      claimPara("3", "The system of claim 1 wherein artificial intelligence models analyze communication signals to detect communication patterns."),
      claimPara("4", "The system of claim 1 wherein communication signals are aggregated across multiple events to generate communication intelligence datasets."),
      claimPara("5", "The system of claim 1 wherein communication signals are correlated with financial market data to generate predictive analytics."),

      spacer(60),
      newLabel("NEW CLAIMS \u2014 V2.0"),
      spacer(60),

      claimPara("6", "The system of claim 1 further comprising a cross-platform capture module configured to autonomously establish audio connections to external third-party conference bridges by programmatically initiating outbound telephony calls and transmitting conference access credentials using dual-tone multi-frequency (DTMF) signaling."),
      claimPara("7", "The system of claim 6 wherein a silent artificial intelligence monitoring agent is deployed within the external conference session to capture communication signals without requiring any software installation or configuration by the external conference host or participants."),
      claimPara("8", "The system of claim 6 wherein communication signals captured from external conference bridges are normalized to the same data structure as signals captured from natively-hosted events, enabling identical AI analysis and reporting regardless of source platform."),
      claimPara("9", "The system of claim 1 further comprising an embedded intelligence interface within the operator control console wherein live AI analysis outputs including transcription, per-speaker sentiment scores, and compliance flags are presented alongside event management controls during live communication events."),
      claimPara("10", "The system of claim 9 wherein the embedded intelligence interface enables real-time human-AI collaborative decision making by presenting actionable AI insights to the operator during the communication event."),
      claimPara("11", "The system of claim 4 further comprising an anonymisation module configured to remove personally identifiable information and organization-identifying information from communication intelligence data and aggregate anonymised metrics into industry-wide benchmarking datasets."),
      claimPara("12", "The system of claim 11 wherein the anonymised benchmarking dataset generates industry-wide communication intelligence benchmarks including average sentiment by sector, common concern topics by industry, and compliance flag frequency by event type."),
      claimPara("13", "The system of claim 3 further comprising a model improvement pipeline wherein operator corrections to AI analysis outputs are captured as training signals and used to fine-tune artificial intelligence models, creating a self-improving learning loop."),
      claimPara("14", "The system of claim 1 further comprising an autonomous compliance intervention module configured to detect compliance-sensitive language during live communication events and generate automated operator alerts, flagging, or participant muting actions in real time."),
      claimPara("15", "A method for capturing communication intelligence from external third-party communication events, comprising the steps of: (a) programmatically initiating an outbound telephony call to an external conference bridge dial-in number; (b) transmitting conference access credentials via DTMF signaling; (c) establishing a persistent silent audio monitoring session; (d) deploying an AI monitoring agent to perform real-time transcription, sentiment analysis, and compliance monitoring; and (e) normalizing captured signals to a standard communication intelligence data structure."),

      new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] }),

      // ENHANCED DRAWINGS
      sectionHead("Drawings"),
      spacer(40),

      ...figBlock("FIG 1 \u2013 Communication Intelligence Platform Architecture", [
        "Investor Communication Events", "        \u2193", "Event Signal Capture", "(Audio, Video, Transcripts, Questions)", "        \u2193", "AI Communication Analysis", "(Sentiment, Topics, Risk Detection)", "        \u2193", "Communication Intelligence Database",
      ]),

      ...figBlock("FIG 2 \u2013 Agentic Event Intelligence System", [
        "Event Intelligence Orchestrator", "        \u2193", "Sentiment Agent", "Compliance Agent", "Investor Question Agent", "Engagement Agent", "        \u2193", "Event Intervention Engine",
      ]),

      ...figBlock("FIG 3 \u2013 Market Reaction Correlation Engine", [
        "Communication Signals  \u2192  Communication Analysis  \u2192  External Market Data  \u2192  Market Reaction Prediction",
      ]),

      ...figBlock("FIG 4 \u2013 AI Earnings Call Preparation Engine", [
        "Historical Communication Data  \u2192  External Intelligence Sources  \u2192  AI Preparation Engine  \u2192  Executive Preparation Brief",
      ]),

      ...figBlock("FIG 5 \u2013 Global Communication Intelligence Platform", [
        "Investor Events  \u2192  Signal Capture  \u2192  AI Analysis  \u2192  Communication Intelligence Dataset  \u2192  Indexes  \u2192  API",
      ]),

      ...figBlock("FIG 6 \u2013 Agent Orchestration Architecture", [
        "AI Orchestration Engine  \u2192  [Sentiment | Compliance | Question | Engagement] Agents  \u2192  Event Intelligence Output",
      ]),

      ...figBlock("FIG 7 \u2013 Communication Intelligence Dataset Learning Loop", [
        "Events  \u2192  Signal Capture  \u2192  AI Analysis  \u2192  Dataset  \u2192  Model Training  \u2192  Improved Models  \u2192  (loop)",
      ]),

      spacer(60),
      newLabel("NEW FIGURES \u2014 V2.0"),
      spacer(40),

      ...figBlock("FIG 8 \u2013 Cross-Platform Bridge Capture Method (NEW)", [
        "Operator enters bridge number + access code", "        \u2193", "System initiates outbound telephony call to bridge", "        \u2193", "DTMF signaling transmits access credentials", "        \u2193", "Silent audio session established", "        \u2193", "AI monitoring agent deployed (transcription + sentiment + compliance)", "        \u2193", "Signals normalised to standard intelligence data structure", "        \u2193", "Intelligence Report generated (identical to native events)",
      ]),

      ...figBlock("FIG 9 \u2013 Embedded Intelligence Operator Interface (NEW)", [
        "Live Communication Event", "        \u2193", "OCC Operator Console", "  [Event Controls | Live Transcript | Sentiment Scores | Compliance Flags]", "        \u2193", "Real-time human-AI collaborative decision making",
      ]),

      ...figBlock("FIG 10 \u2013 Anonymised Benchmarking Pipeline (NEW)", [
        "Raw Intelligence Data (per event)", "        \u2193", "Anonymisation Engine (PII removal)", "        \u2193", "Aggregate Intelligence Dataset", "        \u2193", "Industry-wide Benchmarks (sentiment, concerns, compliance)", "        \u2193", "Communication Intelligence API",
      ]),

      ...figBlock("FIG 11 \u2013 Self-Improving Model Pipeline (NEW)", [
        "Events processed by current AI models", "        \u2193", "Operator corrections captured as training signals", "        \u2193", "Model fine-tuning pipeline", "        \u2193", "Improved AI models deployed", "        \u2193", "(loop back to event processing)",
      ]),

      spacer(200),
      para("End of Specification"),
      spacer(200),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `CuraLive  \u2014  Confidential  |  Provisional Patent Specification v2.0  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "../public/CuraLive_Patent_v2.docx"), buf);
console.log("Done.");
