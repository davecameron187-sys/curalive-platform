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

function titleBlock(text, bg) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    borders: noBorders,
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9000, type: WidthType.DXA },
      shading: { type: ShadingType.SOLID, color: bg },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 200, bottom: 200, left: 300, right: 300 },
      borders: noBorders,
      children: text.split("\n").map((line, i) => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: i === 0 ? 0 : 60, after: 0 },
        children: [new TextRun({ text: line, size: i === 0 ? 30 : 21, bold: i === 0, color: "FFFFFF" })],
      })),
    })] })]
  });
}

function sH(text) {
  return new Paragraph({
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, size: 26, bold: true, color: "1E3A8A" })],
  });
}

function sH2(text) {
  return new Paragraph({
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, size: 22, bold: true, color: "374151" })],
  });
}

function p(text) {
  return new Paragraph({
    spacing: { before: 100, after: 100 },
    children: [new TextRun({ text, size: 21, color: "1F2937" })],
  });
}

function b(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    indent: { left: 400 },
    children: [new TextRun({ text: `\u2022  ${text}`, size: 20, color: "1F2937" })],
  });
}

function claim(num, text) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    indent: { left: 200 },
    children: [
      new TextRun({ text: `${num}.  `, bold: true, size: 21, color: "1E3A8A" }),
      new TextRun({ text, size: 21, color: "1F2937" }),
    ],
  });
}

function sp(n = 120) {
  return new Paragraph({ spacing: { before: n, after: 0 }, children: [] });
}

function figTitle(text) {
  return new Paragraph({ spacing: { before: 260, after: 100 }, children: [new TextRun({ text, size: 22, bold: true, color: "1E3A8A" })] });
}

function figLine(text, indent = false) {
  const isArrow = text.includes("\u2193") || text.includes("\u2192") || text.includes("|");
  return new Paragraph({
    spacing: { before: 20, after: 20 },
    indent: { left: indent ? 800 : 400 },
    children: [new TextRun({ text, size: 19, color: isArrow ? "6B7280" : "374151", font: "Courier New" })],
  });
}

function pb() {
  return new Paragraph({ children: [new TextRun({ text: "", size: 2 }), new PageBreak()] });
}

const doc = new Document({
  creator: "CuraLive",
  title: "CuraLive Provisional Patent Specification \u2014 CIPC Submission Ready",
  sections: [{
    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
    children: [

      titleBlock("PROVISIONAL PATENT SPECIFICATION\nCuraLive \u2014 CIPC Submission", "1E3A8A"),
      sp(100),

      // ============ TITLE ============
      sH("Title of the Invention"),
      p("System and Method for Artificial Intelligence-Based Monitoring, Analysis, Cross-Platform Intelligence Capture, and Autonomous Intelligence Generation for Investor Communication Events"),

      // ============ APPLICANT ============
      sH("Applicant"),
      p("David Cameron"),
      p("[INSERT PHYSICAL ADDRESS]"),
      p("Republic of South Africa"),

      // ============ ABSTRACT ============
      sH("Abstract"),
      p("A system and method for capturing communication signals generated during investor communication events and generating communication intelligence insights using artificial intelligence. The system captures audio, video, transcript, investor question, and engagement signals during events including earnings calls, investor briefings, and capital markets days. Artificial intelligence models analyze captured signals in real time to detect sentiment patterns, communication risks, compliance-sensitive language, and investor concern topics. The system includes a cross-platform capture method capable of autonomously connecting to external third-party conference bridges via telephony calls, authenticating using dual-tone multi-frequency (DTMF) signaling, and deploying silent AI monitoring agents within those sessions. An embedded intelligence operator interface presents live AI analysis outputs alongside event management controls, enabling real-time human-AI collaborative decision making. The system aggregates anonymised communication intelligence across events and organizations to generate industry-wide benchmarking datasets, predictive analytics, and communication intelligence indexes."),

      pb(),

      // ============ FIELD ============
      sH("Field of the Invention"),
      p("The present invention relates to systems and methods for monitoring communication events."),
      p("More specifically, the invention relates to artificial intelligence systems capable of capturing communication signals generated during investor communication events and generating communication intelligence insights from those signals."),
      p("The invention further relates to methods for cross-platform communication signal capture, wherein signals are captured from external third-party communication platforms through autonomous bridge connection techniques, and to methods for real-time embedded intelligence presentation within operator control interfaces."),

      // ============ DEFINITIONS ============
      sH("Definitions"),

      sH2("Communication Event"),
      p("A communication event refers to any structured interaction in which information is communicated between presenters and participants including earnings calls, investor briefings, capital markets days, shareholder meetings, analyst meetings, or conference presentations."),

      sH2("Communication Signal"),
      p("A communication signal refers to any measurable indicator generated during a communication event including audio signals, video signals, transcripts, investor questions, executive responses, sentiment indicators, and engagement metrics."),

      sH2("Communication Intelligence"),
      p("Communication intelligence refers to analytical insights generated from communication signals through computational analysis including artificial intelligence techniques."),

      sH2("Artificial Intelligence Model"),
      p("An artificial intelligence model refers to a computational system capable of identifying patterns in data including machine learning models, neural networks, natural language processing systems, rule-based systems, or hybrid analytical systems."),

      sH2("Communication Intelligence Dataset"),
      p("A communication intelligence dataset refers to a structured collection of communication signals or communication intelligence metrics generated across multiple communication events."),

      sH2("External Communication Bridge"),
      p("An external communication bridge refers to a third-party teleconference or webcast platform not operated by the CuraLive system, into which the system may autonomously establish audio connections for the purpose of capturing communication signals."),

      sH2("Autonomous Bridge Connection"),
      p("An autonomous bridge connection refers to the method by which the system programmatically initiates an outbound telephony call to an external communication bridge, automatically transmits authentication credentials using dual-tone multi-frequency (DTMF) signaling, and establishes a persistent silent audio monitoring session."),

      sH2("Embedded Intelligence Interface"),
      p("An embedded intelligence interface refers to an operator-facing control interface in which artificial intelligence analysis results including transcription, sentiment scoring, and compliance monitoring are presented in real time alongside event management controls, enabling simultaneous human oversight and AI-assisted decision making."),

      sH2("Anonymised Communication Intelligence"),
      p("Anonymised communication intelligence refers to communication intelligence data from which all personally identifiable information and organization-identifying information has been removed, enabling aggregation into industry-wide benchmarking datasets without compromising confidentiality."),

      pb(),

      // ============ BACKGROUND ============
      sH("Background of the Invention"),
      p("Investor communication events play a critical role in financial markets. During these events, companies communicate financial results, strategy, and operational updates to investors and analysts."),
      p("Examples of such events include:"),
      b("earnings calls"),
      b("investor briefings"),
      b("capital markets days"),
      b("shareholder meetings"),
      b("analyst presentations."),
      sp(40),
      p("Despite their importance, existing event platforms primarily provide broadcasting and recording functionality and lack systems capable of analyzing communication dynamics occurring during these events."),
      p("Communication signals generated during investor events may include:"),
      b("investor questions"),
      b("executive responses"),
      b("sentiment changes during the event"),
      b("engagement patterns among participants"),
      b("communication transparency indicators."),
      sp(40),
      p("These signals are typically unstructured and are not analyzed systematically across events or organizations."),
      p("Furthermore, many investor communication events are hosted on third-party platforms over which the event intelligence provider has no direct control. Existing systems require events to be hosted natively on their own platform in order to capture and analyze communication signals. There is no known prior art describing a method for autonomously connecting to external conference bridges, authenticating via DTMF signaling, and deploying silent AI monitoring agents within those external sessions to capture communication intelligence."),
      p("Additionally, existing operator consoles for managing investor communication events display only basic call management information. There is no known prior art describing an operator control interface in which live AI intelligence outputs including transcription, sentiment, and compliance flags are embedded alongside event management controls for real-time human-AI collaborative operation."),

      pb(),

      // ============ SUMMARY ============
      sH("Summary of the Invention"),
      p("The present invention provides a system for capturing communication signals generated during communication events and generating communication intelligence insights using artificial intelligence."),
      p("The system captures communication signals including:"),
      b("audio streams from presenters and participants"),
      b("video streams where available"),
      b("real-time transcripts generated via speech-to-text processing"),
      b("investor questions extracted from the communication stream"),
      b("engagement signals indicating participant attention and interaction."),
      sp(40),
      p("Artificial intelligence models analyze these signals to identify patterns including:"),
      b("sentiment signals indicating positive, negative, or neutral communication tone per speaker"),
      b("communication transparency indicators"),
      b("discussion topic classification"),
      b("investor concern detection and categorisation"),
      b("communication risk indicators including compliance-sensitive language."),
      sp(40),
      p("The system stores communication signals and analysis results in a communication intelligence database capable of generating analytics across multiple events or organizations."),
      p("The system further provides a method for cross-platform communication signal capture wherein the system autonomously establishes audio connections to external third-party conference bridges by: (a) programmatically initiating outbound telephony calls to bridge dial-in numbers; (b) automatically transmitting conference access credentials using DTMF signaling; and (c) deploying silent AI monitoring agents within the external session to capture communication signals identical in structure to those captured from natively-hosted events."),
      p("The system further provides an embedded intelligence interface wherein AI analysis outputs are presented in real time within the operator control console, enabling operators to view live transcription, per-speaker sentiment scores, and compliance flags alongside event management controls during live events."),
      p("The system further provides a method for generating anonymised communication intelligence datasets by stripping personally identifiable information from captured communication signals and aggregating intelligence metrics across multiple organizations to produce industry-wide benchmarking data."),

      pb(),

      // ============ SYSTEM OVERVIEW ============
      sH("System Overview"),
      p("The communication intelligence platform may include the following modules and components:"),
      b("event monitoring infrastructure for capturing communication signals from live events"),
      b("communication signal processing modules for converting raw signals into structured data"),
      b("artificial intelligence analysis engines for detecting patterns in communication signals"),
      b("autonomous intervention engines for generating real-time alerts and actions"),
      b("communication intelligence databases for storing and retrieving intelligence data"),
      b("predictive communication intelligence modules for forecasting investor concerns and market reactions"),
      b("cross-platform bridge connection module for connecting to external conference bridges"),
      b("DTMF authentication engine for automatically entering access credentials on external bridges"),
      b("silent AI monitoring agent deployment system for capturing signals from external sessions"),
      b("embedded real-time intelligence operator interface for human-AI collaborative event management"),
      b("anonymised benchmarking aggregation engine for generating industry-wide benchmarks"),
      b("self-improving model training pipeline for refining AI accuracy over time."),
      sp(40),
      p("The system may operate using artificial intelligence models, statistical models, rule-based agents, hybrid decision systems, or equivalent analytical mechanisms capable of analyzing communication signals."),

      pb(),

      // ============ DETAILED DESCRIPTION ============
      sH("Detailed Description of the Invention"),
      sp(40),

      // --- Event Monitoring ---
      sH2("1. Event Monitoring System (refer FIG 1)"),
      p("The event monitoring system captures communication signals generated during investor communication events in real time."),
      p("Signals captured may include:"),
      b("audio streams from all participants via telephony or WebRTC connections"),
      b("video streams where the event includes visual communication"),
      b("real-time transcripts generated by speech-to-text artificial intelligence models"),
      b("investor questions identified and extracted from the communication stream"),
      b("engagement signals indicating participant presence, attention, and interaction levels."),
      p("Communication signals may be captured from events hosted on the CuraLive platform (native events) or from events hosted on external third-party platforms via the cross-platform capture module described below."),

      sp(80),

      // --- Signal Processing ---
      sH2("2. Communication Signal Processing"),
      p("Captured communication signals are processed to generate structured communication data. Processing operations may include:"),
      b("speech-to-text transcription \u2014 converting audio into timestamped, speaker-attributed text segments"),
      b("speaker identification \u2014 distinguishing between presenters, analysts, and other participants"),
      b("question extraction \u2014 identifying investor questions from the communication stream"),
      b("topic classification \u2014 categorising discussion segments by subject matter"),
      b("sentiment analysis \u2014 scoring each speaker's communication tone as positive, negative, or neutral."),

      sp(80),

      // --- AI Analysis ---
      sH2("3. Artificial Intelligence Communication Analysis (refer FIG 1, FIG 2)"),
      p("Artificial intelligence models analyze processed communication signals to detect patterns and generate intelligence insights."),
      p("The models may detect:"),
      b("sentiment changes \u2014 shifts in speaker tone during the event, scored per speaker"),
      b("discussion topics \u2014 subject matter classification and topic transition detection"),
      b("investor question patterns \u2014 frequency, urgency, and concern categorisation"),
      b("communication risk indicators \u2014 language suggesting legal, regulatory, or compliance risk."),
      p("Analysis may be performed in real time during the event and/or as a post-event batch process. Real-time analysis enables the embedded operator intelligence interface. Post-event analysis enables the generation of comprehensive intelligence reports."),

      sp(80),

      // --- Agentic System ---
      sH2("4. Agentic Event Intelligence System (refer FIG 2, FIG 6)"),
      p("The system may include multiple specialised artificial intelligence agents, each responsible for a specific type of analysis:"),
      b("Sentiment Analysis Agent \u2014 monitors and scores speaker sentiment in real time"),
      b("Compliance Monitoring Agent \u2014 detects compliance-sensitive language and generates alerts"),
      b("Investor Question Analysis Agent \u2014 extracts, categorises, and prioritises investor questions"),
      b("Engagement Analysis Agent \u2014 monitors participant engagement levels and interaction patterns."),
      p("An event intelligence orchestration engine coordinates these agents and combines their outputs into a unified intelligence view. The orchestration engine resolves conflicts between agent outputs and prioritises alerts based on severity and relevance."),

      pb(),

      // --- Cross-Platform Capture ---
      sH2("5. Cross-Platform Communication Signal Capture (refer FIG 8)"),
      p("The system includes a cross-platform capture module capable of capturing communication signals from events hosted on external third-party communication platforms."),
      sp(40),
      p("The cross-platform capture method operates as follows:"),
      b("Step 1: An operator configures an external bridge connection by providing a bridge dial-in telephone number and a conference access code."),
      b("Step 2: The system programmatically initiates an outbound telephony call to the bridge dial-in number using a cloud telephony API."),
      b("Step 3: Upon call answer, the system transmits the conference access code using dual-tone multi-frequency (DTMF) signaling to authenticate with the external bridge."),
      b("Step 4: The system establishes a persistent audio monitoring session as a silent participant within the external conference."),
      b("Step 5: A silent AI monitoring agent is deployed within this session to capture and process communication signals in real time."),
      b("Step 6: Communication signals captured from the external bridge are normalised to the same data structure as signals captured from natively-hosted events, enabling identical AI analysis and reporting."),
      sp(40),
      p("The silent AI monitoring agent deployed within an external bridge session performs the following operations concurrently:"),
      b("real-time speech-to-text transcription of all audio"),
      b("speaker identification and attribution"),
      b("per-speaker sentiment analysis"),
      b("compliance-sensitive language detection and flagging"),
      b("audio recording for post-event review."),
      sp(40),
      p("The external conference host and participants are not required to install any software or make any configuration changes. The system joins as a standard dial-in participant. This method enables the CuraLive system to generate communication intelligence from any investor event, regardless of which platform hosts the event."),

      sp(80),

      // --- Embedded OCC ---
      sH2("6. Embedded Real-Time Intelligence Operator Interface (refer FIG 9)"),
      p("The system includes an embedded intelligence interface within the operator control console (OCC)."),
      p("During live communication events, the operator interface simultaneously displays:"),
      b("event management controls \u2014 participant admission, muting, call routing, hold management"),
      b("live word-for-word transcription with speaker attribution"),
      b("real-time per-speaker sentiment scores displayed alongside the transcript"),
      b("compliance flag alerts as they are detected, timestamped and highlighted"),
      b("AI-generated event status indicators summarising the current state of the event."),
      p("This embedded design enables real-time human-AI collaborative decision making. The operator can act on AI insights during the event \u2014 for example, prioritising a question from an investor showing negative sentiment, or intervening when compliance-sensitive language is detected \u2014 rather than reviewing these signals after the event has concluded."),
      p("The embedded intelligence interface operates identically whether the event is hosted natively on the CuraLive platform or captured from an external bridge via the cross-platform capture module."),

      sp(80),

      // --- Anonymised Benchmarking ---
      sH2("7. Anonymised Communication Intelligence Benchmarking (refer FIG 10)"),
      p("The system includes a benchmarking aggregation engine that generates industry-wide communication intelligence benchmarks from anonymised event data."),
      sp(40),
      p("The anonymisation process operates as follows:"),
      b("all personally identifiable information (names, contact details, speaker identities) is removed or replaced with anonymous identifiers"),
      b("organization-identifying information is removed or categorised by industry sector and size band only"),
      b("communication intelligence metrics (sentiment scores, concern topics, engagement patterns, compliance flags) are retained in anonymised form"),
      b("anonymised records are stored in a separate aggregate intelligence dataset."),
      sp(40),
      p("The aggregate intelligence dataset enables the generation of industry-wide benchmarks including:"),
      b("average investor sentiment by sector"),
      b("most common investor concern topics by industry"),
      b("communication transparency benchmarks"),
      b("engagement pattern baselines"),
      b("compliance flag frequency by event type."),
      p("This dataset grows with every event processed by the system. As the dataset expands, the statistical reliability of benchmarks increases, creating a compounding data advantage that becomes more valuable over time."),

      pb(),

      // --- Autonomous Compliance ---
      sH2("8. Autonomous Compliance Intervention"),
      p("The system includes an autonomous compliance intervention module capable of detecting compliance-sensitive communication during live events and generating automated responses."),
      p("Intervention actions may include:"),
      b("real-time operator alerts when compliance-sensitive language is detected"),
      b("automated flagging and timestamping of compliance-relevant transcript segments"),
      b("optional automated participant muting when pre-defined compliance thresholds are breached"),
      b("post-event compliance summary report generation."),
      p("The compliance intervention module operates in real time during live events, enabling regulatory risk to be managed during the event rather than discovered after the fact."),

      sp(80),

      // --- Self-Improving Models ---
      sH2("9. Self-Improving Communication Intelligence Models (refer FIG 11)"),
      p("The system includes a model improvement pipeline wherein communication intelligence data generated from processed events is used to refine the accuracy of AI models over time."),
      p("The self-improvement loop operates as follows:"),
      b("communication events are captured and analysed by current AI models"),
      b("analysis results are stored in the communication intelligence database"),
      b("operator corrections (transcript edits, sentiment adjustments, compliance flag overrides) are captured as training signals"),
      b("periodically, the accumulated data and correction signals are used to fine-tune AI models"),
      b("updated models are deployed for subsequent events with improved accuracy."),
      p("This creates a learning loop where the system becomes more accurate at predicting investor concerns, detecting sentiment shifts, and identifying compliance risks with each event it processes."),

      sp(80),

      // --- Predictive Intelligence ---
      sH2("10. Predictive Communication Intelligence (refer FIG 3)"),
      p("The system may generate predictive analytics by correlating communication intelligence data with external market data."),
      p("Predictive capabilities may include:"),
      b("predicted investor concerns based on historical question patterns and current market conditions"),
      b("predicted market reactions based on communication sentiment and transparency scores"),
      b("communication risk forecasts identifying topics likely to generate negative sentiment."),

      sp(80),

      // --- Intelligence Indexes ---
      sH2("11. Communication Intelligence Indexes (refer FIG 5)"),
      p("The system may generate structured communication intelligence indexes including:"),
      b("Communication Transparency Index \u2014 measuring how openly and clearly an organisation communicates with investors"),
      b("Investor Communication Health Score \u2014 a composite score reflecting overall communication quality across events"),
      b("Global Investor Concern Index \u2014 tracking the most prevalent investor concern topics across all events and sectors."),
      p("These indexes are generated from the anonymised aggregate intelligence dataset and may be distributed via APIs to external analytics platforms."),

      sp(80),

      // --- Event Intervention ---
      sH2("12. Autonomous Event Intervention"),
      p("The system may generate automated actions during communication events including:"),
      b("moderator alerts \u2014 notifying the operator of significant sentiment shifts or compliance triggers"),
      b("automated moderation \u2014 optional muting or question queue management"),
      b("question prioritisation \u2014 reordering investor questions based on sentiment and relevance"),
      b("communication risk alerts \u2014 real-time warnings when risk thresholds are exceeded."),

      sp(80),

      // --- Future Embodiments ---
      sH2("13. Future Embodiments"),
      p("The system may analyse communication signals across multiple organisations to generate market-wide communication intelligence analytics."),
      p("Communication intelligence data may be distributed through APIs or data feeds to external systems including financial analytics platforms, regulatory monitoring systems, or investor relations platforms."),
      p("Communication signals may also be correlated with financial market data, analyst reports, and social sentiment signals to enhance predictive capabilities."),

      sp(80),

      // --- Alternative Implementations ---
      sH2("14. Alternative Implementations"),
      p("The systems and methods described in this specification may be implemented using a variety of computational architectures and analytical techniques."),
      p("The artificial intelligence analysis engines described herein may operate using machine learning models, neural networks, natural language processing systems, large language models, rule-based systems, statistical models, hybrid analytical systems, or equivalent computational mechanisms capable of analysing communication signals."),
      p("Communication signals may be captured from a variety of communication environments including telephony systems, web conferencing platforms, video conferencing platforms, webcast platforms, messaging platforms, or other communication infrastructures capable of transmitting audio, video, or textual communication."),
      p("The communication intelligence system may operate within cloud computing environments, distributed computing environments, on-premise computing environments, edge computing environments, or hybrid deployment architectures."),
      p("The cross-platform bridge connection method may utilise any telephony signaling protocol including but not limited to DTMF, SIP, WebRTC, PSTN, or equivalent signaling mechanisms capable of establishing audio connections to external communication bridges."),
      p("The specific examples described in this specification are provided for illustrative purposes and should not be interpreted as limiting the scope of the invention to any particular technology, platform, deployment model, or implementation approach."),

      pb(),

      // ============ CLAIMS ============
      sH("Claims"),
      sp(40),

      p("System Claims:"),
      sp(20),

      claim("1", "A computer-implemented system for monitoring communication events comprising an event monitoring module configured to capture communication signals generated during a communication event."),
      claim("2", "The system of claim 1 wherein the system converts captured communication signals into structured communication data using speech-to-text transcription, speaker identification, question extraction, topic classification, and sentiment analysis."),
      claim("3", "The system of claim 1 wherein artificial intelligence models analyse communication signals to detect communication patterns including sentiment changes, discussion topics, investor question patterns, and communication risk indicators."),
      claim("4", "The system of claim 1 wherein communication signals are aggregated across multiple events to generate communication intelligence datasets."),
      claim("5", "The system of claim 1 wherein communication signals are correlated with financial market data to generate predictive analytics including predicted investor concerns and predicted market reactions."),
      claim("6", "The system of claim 1 further comprising a cross-platform capture module configured to autonomously establish audio connections to external third-party conference bridges by programmatically initiating outbound telephony calls and transmitting conference access credentials using dual-tone multi-frequency (DTMF) signaling."),
      claim("7", "The system of claim 6 wherein a silent artificial intelligence monitoring agent is deployed within the external conference session to capture communication signals without requiring any software installation or configuration changes by the external conference host or participants."),
      claim("8", "The system of claim 6 wherein communication signals captured from external conference bridges are normalised to the same data structure as signals captured from natively-hosted events, enabling identical AI analysis and reporting regardless of source platform."),
      claim("9", "The system of claim 1 further comprising an embedded intelligence interface within the operator control console wherein live AI analysis outputs including real-time transcription, per-speaker sentiment scores, and compliance flags are presented alongside event management controls during live communication events."),
      claim("10", "The system of claim 9 wherein the embedded intelligence interface enables real-time human-AI collaborative decision making by presenting actionable AI insights to the operator during the communication event, enabling intervention based on AI-detected patterns."),
      claim("11", "The system of claim 4 further comprising an anonymisation module configured to remove personally identifiable information and organisation-identifying information from communication intelligence data and aggregate anonymised metrics into industry-wide benchmarking datasets."),
      claim("12", "The system of claim 11 wherein the anonymised benchmarking dataset generates industry-wide communication intelligence benchmarks including average sentiment by sector, common concern topics by industry, communication transparency benchmarks, and compliance flag frequency by event type."),
      claim("13", "The system of claim 3 further comprising a model improvement pipeline wherein operator corrections to AI analysis outputs are captured as training signals and used to fine-tune artificial intelligence models, creating a self-improving learning loop that increases analysis accuracy over time."),
      claim("14", "The system of claim 1 further comprising an autonomous compliance intervention module configured to detect compliance-sensitive language during live communication events and generate automated operator alerts, transcript flagging, or participant muting actions in real time."),
      claim("15", "The system of claim 1 further comprising multiple specialised artificial intelligence agents including a sentiment analysis agent, a compliance monitoring agent, an investor question analysis agent, and an engagement analysis agent, coordinated by an event intelligence orchestration engine."),

      sp(80),
      p("Method Claims:"),
      sp(20),

      claim("16", "A method for capturing communication intelligence from external third-party communication events, comprising the steps of: (a) receiving from an operator a bridge dial-in telephone number and a conference access code for an external communication event; (b) programmatically initiating an outbound telephony call to the bridge dial-in number; (c) upon call answer, transmitting the conference access code via dual-tone multi-frequency (DTMF) signaling to authenticate with the external bridge; (d) establishing a persistent silent audio monitoring session as a participant within the external conference; (e) deploying a silent AI monitoring agent to perform real-time speech-to-text transcription, speaker identification, per-speaker sentiment analysis, and compliance-sensitive language detection; and (f) normalising captured communication signals to a standard communication intelligence data structure identical to that used for natively-hosted events."),
      claim("17", "The method of claim 16 wherein the external conference host and participants are not required to install any software or make any configuration changes, and the system joins the external conference as a standard dial-in participant."),
      claim("18", "A method for generating anonymised communication intelligence benchmarks comprising the steps of: (a) capturing communication intelligence data from multiple communication events across multiple organisations; (b) removing personally identifiable information and organisation-identifying information from the intelligence data; (c) aggregating anonymised intelligence metrics into an industry-wide benchmarking dataset; and (d) generating benchmark indexes from the aggregated dataset including communication transparency indexes, investor concern indexes, and communication health scores."),
      claim("19", "A method for real-time human-AI collaborative management of communication events comprising the steps of: (a) capturing communication signals during a live communication event; (b) processing captured signals through multiple specialised AI agents including sentiment, compliance, question analysis, and engagement agents; (c) presenting AI analysis outputs in real time within an operator control interface alongside event management controls; and (d) enabling the operator to take actions informed by AI-detected patterns during the live event."),
      claim("20", "A method for generating self-improving communication intelligence models comprising the steps of: (a) analysing communication events using current artificial intelligence models; (b) storing analysis results in a communication intelligence database; (c) capturing operator corrections to analysis outputs as training signals; (d) using accumulated data and correction signals to fine-tune artificial intelligence models; and (e) deploying updated models for subsequent events with improved accuracy."),

      pb(),

      // ============ DRAWINGS ============
      sH("Drawings"),
      sp(40),

      figTitle("FIG 1 \u2013 Communication Intelligence Platform Architecture"),
      figLine("+-----------------------------------+"),
      figLine("|  Investor Communication Events    |"),
      figLine("|  (Earnings Calls, Briefings,      |"),
      figLine("|   Capital Markets Days)           |"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("|  Event Signal Capture             |"),
      figLine("|  \u2022 Audio Streams                  |"),
      figLine("|  \u2022 Video Streams                  |"),
      figLine("|  \u2022 Real-time Transcripts          |"),
      figLine("|  \u2022 Investor Questions             |"),
      figLine("|  \u2022 Engagement Signals             |"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("|  AI Communication Analysis        |"),
      figLine("|  \u2022 Sentiment Detection            |"),
      figLine("|  \u2022 Topic Classification           |"),
      figLine("|  \u2022 Risk Detection                 |"),
      figLine("|  \u2022 Compliance Monitoring          |"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("|  Communication Intelligence       |"),
      figLine("|  Database                         |"),
      figLine("+-----------------------------------+"),

      figTitle("FIG 2 \u2013 Agentic Event Intelligence System"),
      figLine("+-----------------------------------+"),
      figLine("|  Event Intelligence Orchestrator  |"),
      figLine("+--------+--------+--------+-------+"),
      figLine("         |        |        |"),
      figLine("    +----v--+ +---v---+ +--v-----+"),
      figLine("    |Sentim-| |Compli-| |Question|"),
      figLine("    |ent    | |ance   | |Analysis|"),
      figLine("    |Agent  | |Agent  | |Agent   |"),
      figLine("    +---+---+ +---+---+ +---+----+"),
      figLine("        |        |        |"),
      figLine("        +--------+--------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("    +----------------------------+"),
      figLine("    | Event Intervention Engine  |"),
      figLine("    +----------------------------+"),

      figTitle("FIG 3 \u2013 Market Reaction Correlation Engine"),
      figLine("+---------------------------+"),
      figLine("| Communication Signals     |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| Communication Analysis    |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+     +---------------------------+"),
      figLine("| Correlation Engine        | <-- | External Market Data     |"),
      figLine("+-----------+---------------+     +---------------------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| Market Reaction Prediction|"),
      figLine("+---------------------------+"),

      figTitle("FIG 4 \u2013 AI Earnings Call Preparation Engine"),
      figLine("+---------------------------+     +---------------------------+"),
      figLine("| Historical Event Data     |     | External Intelligence    |"),
      figLine("+-----------+---------------+     +-----------+---------------+"),
      figLine("            |                                 |"),
      figLine("            +----------------+----------------+"),
      figLine("                             |"),
      figLine("                             v"),
      figLine("            +-------------------------------+"),
      figLine("            | AI Preparation Engine         |"),
      figLine("            +---------------+---------------+"),
      figLine("                             |"),
      figLine("                             v"),
      figLine("            +-------------------------------+"),
      figLine("            | Executive Preparation Brief   |"),
      figLine("            +-------------------------------+"),

      pb(),

      figTitle("FIG 5 \u2013 Global Communication Intelligence Platform"),
      figLine("+-------------+     +-------------+     +-------------+"),
      figLine("| Investor    | --> | Signal      | --> | AI Analysis |"),
      figLine("| Events      |     | Capture     |     | Engine      |"),
      figLine("+-------------+     +-------------+     +------+------+"),
      figLine("                                               |"),
      figLine("                                               v"),
      figLine("+-------------+     +-------------+     +------+------+"),
      figLine("| Intelligence| <-- | Intelligence| <-- | Communication|"),
      figLine("| API         |     | Indexes     |     | Dataset     |"),
      figLine("+-------------+     +-------------+     +-------------+"),

      figTitle("FIG 6 \u2013 Agent Orchestration Architecture"),
      figLine("            +---------------------------+"),
      figLine("            | AI Orchestration Engine   |"),
      figLine("            +--+------+------+------+--+"),
      figLine("               |      |      |      |"),
      figLine("            +--v-+ +--v-+ +--v-+ +--v--+"),
      figLine("            |Sent| |Comp| |Ques| |Engag|"),
      figLine("            |imen| |lian| |tion| |ement|"),
      figLine("            |t   | |ce  | |    | |     |"),
      figLine("            +--+-+ +--+-+ +--+-+ +--+--+"),
      figLine("               |      |      |      |"),
      figLine("               +------+------+------+"),
      figLine("                       |"),
      figLine("                       v"),
      figLine("            +---------------------------+"),
      figLine("            | Event Intelligence Output |"),
      figLine("            +---------------------------+"),

      figTitle("FIG 7 \u2013 Communication Intelligence Learning Loop"),
      figLine("  +----------+     +---------+     +---------+"),
      figLine("  | Communi- | --> | AI      | --> | Communi-|"),
      figLine("  | cation   |     | Analysis|     | cation  |"),
      figLine("  | Events   |     | Engine  |     | Dataset |"),
      figLine("  +----^-----+     +---------+     +----+----+"),
      figLine("       |                                |"),
      figLine("       |                                v"),
      figLine("  +----+------+                    +----+----+"),
      figLine("  | Improved  | <----------------- | Model   |"),
      figLine("  | AI Models |                    | Training|"),
      figLine("  +-----------+                    +---------+"),

      pb(),

      figTitle("FIG 8 \u2013 Cross-Platform Bridge Capture Method"),
      figLine("+-----------------------------------+"),
      figLine("| Operator enters bridge dial-in    |"),
      figLine("| number and conference access code |"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("| System initiates outbound         |"),
      figLine("| telephony call to bridge number   |"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("| DTMF signaling transmits          |"),
      figLine("| conference access credentials     |"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("| Silent audio monitoring session   |"),
      figLine("| established as dial-in participant|"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("| Silent AI Agent deployed:         |"),
      figLine("| \u2022 Transcription                   |"),
      figLine("| \u2022 Speaker identification          |"),
      figLine("| \u2022 Sentiment analysis              |"),
      figLine("| \u2022 Compliance monitoring           |"),
      figLine("+----------------+------------------+"),
      figLine("                 |"),
      figLine("                 v"),
      figLine("+-----------------------------------+"),
      figLine("| Signals normalised to standard    |"),
      figLine("| intelligence data structure       |"),
      figLine("+-----------------------------------+"),

      figTitle("FIG 9 \u2013 Embedded Intelligence Operator Interface"),
      figLine("+---------------------------------------------------+"),
      figLine("|              OPERATOR CONTROL CONSOLE              |"),
      figLine("+---------------------------------------------------+"),
      figLine("|                    |                               |"),
      figLine("|  EVENT CONTROLS    |   LIVE AI INTELLIGENCE        |"),
      figLine("|                    |                               |"),
      figLine("|  \u2022 Admit/Remove    |   \u2022 Live Transcript          |"),
      figLine("|  \u2022 Mute/Unmute     |     (word-by-word, speaker   |"),
      figLine("|  \u2022 Call Routing    |      attributed)             |"),
      figLine("|  \u2022 Hold Management |                               |"),
      figLine("|  \u2022 Question Queue  |   \u2022 Per-Speaker Sentiment    |"),
      figLine("|                    |     (real-time scores)        |"),
      figLine("|                    |                               |"),
      figLine("|                    |   \u2022 Compliance Flags          |"),
      figLine("|                    |     (timestamped alerts)      |"),
      figLine("|                    |                               |"),
      figLine("|                    |   \u2022 AI Event Status           |"),
      figLine("+---------------------------------------------------+"),
      figLine("|         HUMAN-AI COLLABORATIVE DECISIONS           |"),
      figLine("+---------------------------------------------------+"),

      figTitle("FIG 10 \u2013 Anonymised Benchmarking Pipeline"),
      figLine("+---------------------------+"),
      figLine("| Raw Intelligence Data     |"),
      figLine("| (per event, per org)      |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| Anonymisation Engine      |"),
      figLine("| \u2022 Remove PII              |"),
      figLine("| \u2022 Remove org identifiers  |"),
      figLine("| \u2022 Categorise by sector    |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| Aggregate Intelligence    |"),
      figLine("| Dataset                   |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+     +---------------------------+"),
      figLine("| Industry Benchmarks       | --> | Communication Intelligence|"),
      figLine("| \u2022 Sentiment by sector     |     | API                       |"),
      figLine("| \u2022 Concern topics          |     +---------------------------+"),
      figLine("| \u2022 Compliance frequency    |"),
      figLine("+---------------------------+"),

      figTitle("FIG 11 \u2013 Self-Improving Model Pipeline"),
      figLine("+---------------------------+"),
      figLine("| Events processed by       |"),
      figLine("| current AI models         |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| AI Analysis Results       |"),
      figLine("| stored in database        |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| Operator Corrections      |"),
      figLine("| captured as training      |"),
      figLine("| signals                   |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| Model Fine-Tuning         |"),
      figLine("| Pipeline                  |"),
      figLine("+-----------+---------------+"),
      figLine("            |"),
      figLine("            v"),
      figLine("+---------------------------+"),
      figLine("| Improved AI Models        |"),
      figLine("| deployed for next events  |"),
      figLine("+-------------+-------------+"),
      figLine("              |"),
      figLine("              +-----> (loop back to event processing)"),

      sp(300),

      p("End of Specification"),
      sp(200),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: `CuraLive  \u2014  Confidential  |  Provisional Patent Specification  |  CIPC Submission  |  ${new Date().toLocaleDateString("en-ZA")}`,
          size: 16, color: "9CA3AF", italics: true,
        })],
      }),
    ],
  }],
});

const buf = await Packer.toBuffer(doc);
writeFileSync(join(__dirname, "../public/CuraLive_Patent_CIPC_Submission.docx"), buf);
console.log("Done.");
