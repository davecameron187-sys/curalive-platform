import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TableRow, TableCell, Table, WidthType } from "docx";
import * as fs from "fs";

const BOLD = { bold: true };
const ITALIC = { italics: true };
const FONT = "Calibri";
const SIZE = 22;

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, font: FONT, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 28 : 24, ...BOLD })] });
}

function para(text: string, opts?: { bold?: boolean; italic?: boolean; spacing?: number }) {
  return new Paragraph({ spacing: { after: opts?.spacing ?? 120 }, children: [new TextRun({ text, font: FONT, size: SIZE, bold: opts?.bold, italics: opts?.italic })] });
}

function bullet(text: string, level = 0) {
  return new Paragraph({ bullet: { level }, spacing: { after: 80 }, children: [new TextRun({ text, font: FONT, size: SIZE })] });
}

function blankLine() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

function sectionDivider() {
  return new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" } }, children: [] });
}

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children: [
      // Title page
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2000, after: 400 }, children: [new TextRun({ text: "CONTINUATION-IN-PART (CIP) APPLICATION", font: FONT, size: 40, ...BOLD })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Filed as a continuation of:", font: FONT, size: SIZE, ...ITALIC })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: "CuraLive — CIPC Provisional Patent Specification", font: FONT, size: 28, ...BOLD })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "\"System and Method for Artificial Intelligence-Based Monitoring, Analysis,", font: FONT, size: SIZE, ...ITALIC })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Cross-Platform Intelligence Capture, and Autonomous Intelligence Generation", font: FONT, size: SIZE, ...ITALIC })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: "for Investor Communication Events\"", font: FONT, size: SIZE, ...ITALIC })] }),
      sectionDivider(),
      para("Applicant: David Cameron", { bold: true }),
      para("41 Rooigras Avenue, 73 Tiffani Gardens, Bassonia, 2090, Johannesburg"),
      para("+27 84 444 6001"),
      para("Republic of South Africa"),
      blankLine(),
      para(`Date of CIP Filing: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`),
      blankLine(),
      sectionDivider(),

      // PREAMBLE
      heading("1. Preamble"),
      para("This Continuation-in-Part (CIP) application is filed as a continuation of the provisional patent specification previously submitted to the Companies and Intellectual Property Commission (CIPC) of the Republic of South Africa, titled:"),
      blankLine(),
      para("\"System and Method for Artificial Intelligence-Based Monitoring, Analysis, Cross-Platform Intelligence Capture, and Autonomous Intelligence Generation for Investor Communication Events\"", { italic: true }),
      blankLine(),
      para("The parent application described a system for capturing communication signals during investor communication events and generating communication intelligence insights using artificial intelligence, including cross-platform bridge connection via DTMF signaling, embedded intelligence operator interfaces, anonymised benchmarking, autonomous compliance intervention, self-evolving platform intelligence, intelligent health monitoring with adaptive baseline learning and AI root cause attribution, agentic event intelligence brain, multi-trigger autonomous intervention, and autonomous post-event content generation."),
      blankLine(),
      para("This CIP application incorporates the full specification and all claims of the parent application by reference and adds new matter describing twelve (12) additional inventive modules and their associated claims, developed and reduced to practice since the filing of the parent application."),

      sectionDivider(),

      // SUMMARY OF NEW MATTER
      heading("2. Summary of New Matter"),
      para("The following twelve inventive modules constitute the new matter added by this CIP application. Each module is described in detail below, with associated system and method claims."),
      blankLine(),
      bullet("Module A — Shadow Mode: Third-Party Meeting Platform Intelligence Capture"),
      bullet("Module B — Historical Archive Intelligence Processing"),
      bullet("Module C — Automated Post-Event Intelligence Report Distribution"),
      bullet("Module D — Unified Operator Command Centre with Contextual Navigation"),
      bullet("Module E — Webcasting Hub and On-Demand Intelligence Library"),
      bullet("Module F — Environmental Sustainability Quantification for Virtual Events"),
      bullet("Module G — Market Reaction Correlation and Prediction Engine"),
      bullet("Module H — Intelligent Mailing List and Zero-Click Registration System"),
      bullet("Module I — Intelligent Broadcaster and Automated Webcast Recap Generation"),
      bullet("Module J — Autonomous Social Media and Podcast Repurposing Engine"),
      bullet("Module K — Communication Index: Composite IR Performance Scoring"),
      bullet("Module L — Virtual Production Studio for Live Event Broadcasting"),

      sectionDivider(),

      // MODULE A
      heading("3. Detailed Description of New Matter"),
      blankLine(),
      heading("Module A — Shadow Mode: Third-Party Meeting Platform Intelligence Capture", HeadingLevel.HEADING_2),
      blankLine(),
      para("The parent application described a cross-platform capture method using telephony dial-out and DTMF authentication to join external audio conference bridges. This CIP adds a fundamentally different and complementary method for capturing communication intelligence from events hosted on video conferencing platforms."),
      blankLine(),
      para("The Shadow Mode module deploys an autonomous AI bot participant into video conferencing sessions hosted on third-party platforms including Zoom, Microsoft Teams, and Google Meet. The bot joins as a named participant (configurable by the operator) and captures communication signals identical in structure to those captured from natively-hosted events."),
      blankLine(),
      para("The Shadow Mode capture method operates as follows:", { bold: true }),
      bullet("Step 1: The operator provides a meeting link (URL) for a Zoom, Microsoft Teams, or Google Meet session, along with event metadata (client name, event type, event name)."),
      bullet("Step 2: The system invokes a bot deployment API to programmatically create and deploy a virtual participant into the specified meeting."),
      bullet("Step 3: The bot joins the meeting as a standard participant, appearing with a configurable display name."),
      bullet("Step 4: Upon joining, the bot establishes real-time audio capture and begins streaming audio to the platform's speech-to-text transcription pipeline."),
      bullet("Step 5: The transcription pipeline generates timestamped, speaker-attributed transcript segments in real time."),
      bullet("Step 6: Each transcript segment is processed through the platform's AI analysis engines including per-segment sentiment scoring, compliance keyword detection, and engagement signal capture."),
      bullet("Step 7: All captured signals are normalised to the same data structure as signals from natively-hosted events and stored in the communication intelligence database."),
      bullet("Step 8: The operator monitors the captured intelligence in real time through the same embedded intelligence interface used for natively-hosted events."),
      blankLine(),
      para("The Shadow Mode module supports concurrent deployment of multiple bots across multiple meetings simultaneously, enabling a single operator to monitor intelligence from several events in parallel."),
      blankLine(),
      para("Unlike the telephony-based cross-platform capture method described in the parent application, the Shadow Mode module operates at the application layer of video conferencing platforms, enabling capture of richer communication signals including participant lists, screen sharing detection, and meeting metadata that are not available through audio-only telephony connections."),
      blankLine(),
      para("The meeting host and participants see the bot as a regular attendee and are not required to install any software, grant any special permissions, or modify their meeting configuration."),

      sectionDivider(),

      // MODULE B
      heading("Module B — Historical Archive Intelligence Processing", HeadingLevel.HEADING_2),
      blankLine(),
      para("The parent application described intelligence capture from live, real-time communication events. This CIP adds a method for retroactive intelligence generation from historical event transcripts."),
      blankLine(),
      para("The Historical Archive Intelligence Processing module enables operators to upload transcript text from past communication events and apply the platform's full AI analysis pipeline to generate communication intelligence retrospectively."),
      blankLine(),
      para("The archive processing method operates as follows:", { bold: true }),
      bullet("Step 1: The operator uploads or pastes a transcript from a past event, along with event metadata including client name, event name, event type, event date, and platform."),
      bullet("Step 2: The system segments the transcript into discrete analysis units using paragraph boundary detection and word count thresholds."),
      bullet("Step 3: Each segment is submitted to the AI sentiment scoring engine, which returns a sentiment score between 0 and 100 for each segment."),
      bullet("Step 4: The system scans the full transcript for compliance-sensitive keywords including forward-looking language, insider trading terminology, merger and acquisition references, and regulatory disclosure terms."),
      bullet("Step 5: The system generates structured tagged intelligence records for each segment, covering sentiment, engagement, compliance, and intervention metrics."),
      bullet("Step 6: All generated intelligence records are stored in the same tagged metrics database used for live events, enabling cross-event and cross-client analytics."),
      bullet("Step 7: The archive event record is stored with aggregate statistics including total word count, segment count, average sentiment score, compliance flag count, and the number of tagged intelligence records generated."),
      blankLine(),
      para("This module enables the platform's intelligence dataset to be primed with historical data, accelerating the self-improving model pipeline described in the parent application by providing a larger training corpus from the outset."),

      sectionDivider(),

      // MODULE C
      heading("Module C — Automated Post-Event Intelligence Report Distribution", HeadingLevel.HEADING_2),
      blankLine(),
      para("The parent application described the generation and storage of communication intelligence metrics. This CIP adds an automated distribution system for delivering formatted intelligence reports to stakeholders via electronic mail."),
      blankLine(),
      para("The report distribution method operates as follows:", { bold: true }),
      bullet("Step 1: The operator selects an archived or completed event from the intelligence database."),
      bullet("Step 2: The operator specifies a recipient name and email address."),
      bullet("Step 3: The system generates a professionally formatted HTML intelligence report containing: event identification (client name, event name, event type, event date); sentiment score with qualitative classification (positive/neutral/negative); compliance risk assessment with flag count and risk level classification (low/moderate/high); quantitative metrics (word count, segment count, intelligence records generated); and operator notes where applicable."),
      bullet("Step 4: The formatted report is dispatched to the specified recipient via a transactional email API."),
      blankLine(),
      para("This module transforms the platform from a data collection and analysis tool into an intelligence distribution platform, enabling operators to deliver professional intelligence summaries to their clients without manual report creation."),

      sectionDivider(),

      // MODULE D
      heading("Module D — Unified Operator Command Centre with Contextual Navigation", HeadingLevel.HEADING_2),
      blankLine(),
      para("The parent application described an embedded intelligence interface within the operator control console. This CIP adds a unified command centre architecture that provides a single entry point to all platform capabilities through a contextually organised navigation system."),
      blankLine(),
      para("The Unified Operator Command Centre comprises:", { bold: true }),
      bullet("A collapsible sidebar navigation organised into contextual sections (Events, Intelligence, Platform) with iconographic identifiers and optional status badges indicating live activity."),
      bullet("A dashboard home view displaying: event schedule for the current day with per-event status indicators (live, synced, pending); aggregate statistics (today's events, active participants, platform health percentage, AI insights count); an interactive calendar with event density indicators per day; system health status panel showing real-time latency for all critical services; AI alerts panel displaying the most recent intelligence findings; and quick-launch actions for common operator workflows."),
      bullet("Contextual navigation wherein selecting any platform module from the sidebar loads the full module interface within the command centre frame, maintaining persistent access to the sidebar navigation and top-level status indicators."),
      blankLine(),
      para("This architecture enables operators to manage all platform capabilities from a single interface without context-switching between separate application pages, reducing cognitive load during high-pressure live event management."),

      sectionDivider(),

      // MODULE E
      heading("Module E — Webcasting Hub and On-Demand Intelligence Library", HeadingLevel.HEADING_2),
      blankLine(),
      para("This CIP adds a public-facing webcasting distribution platform and an on-demand event library."),
      blankLine(),
      para("The Webcasting Hub provides:", { bold: true }),
      bullet("An event creation wizard enabling operators to configure webcast events including title, description, scheduled date, presenters, registration requirements, and AI intelligence modules to activate."),
      bullet("A public-facing event directory enabling investors and analysts to discover upcoming webcasts filtered by industry vertical, event type, and date."),
      bullet("Live webcast streaming with integrated attendee registration, real-time participant count tracking, and embedded Q&A functionality."),
      bullet("On-demand library where completed webcasts are automatically archived with full transcript, AI-generated intelligence summary, and searchable content index."),
      bullet("Webcast analytics including attendee demographics, engagement metrics, drop-off analysis, and sentiment trajectory visualisation."),

      sectionDivider(),

      // MODULE F
      heading("Module F — Environmental Sustainability Quantification for Virtual Events", HeadingLevel.HEADING_2),
      blankLine(),
      para("This CIP adds an environmental sustainability quantification module that calculates the carbon footprint impact of hosting events virtually rather than in person."),
      blankLine(),
      para("The sustainability calculation method comprises:", { bold: true }),
      bullet("Estimating avoided travel emissions by multiplying the number of attendees by an average travel distance and a per-kilometre carbon emission factor."),
      bullet("Calculating the energy consumption of the virtual event including server compute time, bandwidth consumption, and participant device energy usage."),
      bullet("Generating a net carbon savings figure representing the difference between estimated physical event emissions and actual virtual event emissions."),
      bullet("Assigning a sustainability grade (A+ through D) based on the net carbon savings relative to industry benchmarks."),
      bullet("Generating a downloadable Green Event Certificate for the event organiser documenting the sustainability metrics and grade."),

      sectionDivider(),

      // MODULE G
      heading("Module G — Market Reaction Correlation and Prediction Engine", HeadingLevel.HEADING_2),
      blankLine(),
      para("The parent application described predictive communication intelligence correlating communication signals with market data at a conceptual level. This CIP describes a specific implemented system for correlating event communication signals with observed stock price movements."),
      blankLine(),
      para("The Market Reaction Engine operates as follows:", { bold: true }),
      bullet("For each completed communication event associated with a publicly traded company, the system captures the company's stock ticker symbol and records the stock price at event start."),
      bullet("The system monitors stock price changes at 24-hour, 48-hour, and 7-day intervals following the event."),
      bullet("Communication intelligence signals including aggregate sentiment score, executive confidence indicators, Q&A difficulty rating, and compliance flag count are correlated with the observed price movements."),
      bullet("An AI model analyses the correlation data to generate a market direction prediction (positive, negative, or neutral) with a confidence score for future events of similar type and sector."),
      bullet("Historical correlation data is stored and used to refine prediction accuracy over time, creating a self-improving market intelligence capability."),

      sectionDivider(),

      // MODULE H
      heading("Module H — Intelligent Mailing List and Zero-Click Registration System", HeadingLevel.HEADING_2),
      blankLine(),
      para("This CIP adds an intelligent investor contact management and event registration system."),
      blankLine(),
      para("The system comprises:", { bold: true }),
      bullet("A contact import module supporting bulk CSV upload with automatic field mapping and deduplication."),
      bullet("Segmented mailing list management enabling operators to organise contacts by client, industry sector, event type preference, and engagement history."),
      bullet("Personalised event invitation generation with unique tokenised registration links per recipient."),
      bullet("A zero-click registration method wherein clicking the unique tokenised link in an invitation email automatically registers the recipient for the event without requiring them to fill in any form fields, leveraging the pre-existing contact data to complete registration on their behalf."),
      bullet("Registration analytics including invitation send rates, open rates, click rates, and conversion rates per mailing list segment."),

      sectionDivider(),

      // MODULE I
      heading("Module I — Intelligent Broadcaster and Automated Webcast Recap Generation", HeadingLevel.HEADING_2),
      blankLine(),
      para("This CIP adds an intelligent broadcasting assistant and automated post-event recap generation system."),
      blankLine(),
      para("The Intelligent Broadcaster provides:", { bold: true }),
      bullet("Real-time speaking pace analysis calculating words per minute per presenter and providing visual indicators when pace deviates from optimal ranges."),
      bullet("Automated key moment detection identifying significant statements, announcements, and quotable phrases during the live broadcast."),
      bullet("Post-event recap generation that automatically produces a structured summary including: executive summary, key takeaways, notable quotes, financial figures mentioned, strategic commitments, and recommended follow-up actions."),
      bullet("The recap is generated by submitting the full event transcript and tagged intelligence records to the AI engine with structured output instructions."),

      sectionDivider(),

      // MODULE J
      heading("Module J — Autonomous Social Media and Podcast Repurposing Engine", HeadingLevel.HEADING_2),
      blankLine(),
      para("The parent application described autonomous post-event content generation at a conceptual level. This CIP describes specific implemented systems for repurposing event content into social media posts and podcast-format audio."),
      blankLine(),
      para("The Social Media Repurposing Engine:", { bold: true }),
      bullet("Analyses event transcripts and intelligence records to identify content suitable for social media distribution."),
      bullet("Generates platform-specific posts tailored to character limits and communication norms of each target platform (LinkedIn, Twitter/X)."),
      bullet("Provides a scheduling interface for timing post distribution relative to the event."),
      blankLine(),
      para("The Podcast Converter:", { bold: true }),
      bullet("Transforms event audio recordings into podcast-ready format with automated intro/outro generation."),
      bullet("Generates AI-written show notes and episode descriptions from the event transcript."),
      bullet("Supports export in standard podcast distribution formats."),

      sectionDivider(),

      // MODULE K
      heading("Module K — Communication Index: Composite IR Performance Scoring", HeadingLevel.HEADING_2),
      blankLine(),
      para("The parent application described communication intelligence indexes at a conceptual level. This CIP describes a specific implemented composite scoring system."),
      blankLine(),
      para("The Communication Index generates a single composite score for each organisation's investor relations performance by aggregating:", { bold: true }),
      bullet("Sentiment trajectory across events (improving, stable, declining)"),
      bullet("Compliance flag frequency and severity trend"),
      bullet("Investor question difficulty and response quality"),
      bullet("Audience engagement metrics (attendance, retention, Q&A participation)"),
      bullet("Executive communication clarity scores derived from linguistic analysis"),
      blankLine(),
      para("The composite score enables organisations to benchmark their IR performance against sector peers and track improvement over time. Scores are stored historically, enabling trend analysis and period-over-period comparison."),

      sectionDivider(),

      // MODULE L
      heading("Module L — Virtual Production Studio for Live Event Broadcasting", HeadingLevel.HEADING_2),
      blankLine(),
      para("This CIP adds a browser-based virtual production studio for managing the visual presentation layer of live webcasts."),
      blankLine(),
      para("The Virtual Studio provides:", { bold: true }),
      bullet("Multi-source video feed management enabling operators to switch between presenter cameras, screen shares, and pre-recorded video segments during a live broadcast."),
      bullet("Lower third graphic overlay management for displaying presenter names, titles, company logos, and dynamic data (e.g., live sentiment score, participant count)."),
      bullet("Layout template management enabling operators to select from predefined broadcast layouts (single presenter, panel discussion, presentation mode, picture-in-picture)."),
      bullet("Real-time preview of the broadcast output as seen by attendees."),

      sectionDivider(),

      // NEW CLAIMS
      heading("4. Additional Claims"),
      blankLine(),
      heading("Shadow Mode Claims (Module A):", HeadingLevel.HEADING_2),
      blankLine(),
      para("38. The system of claim 1 further comprising a shadow mode module configured to deploy an autonomous AI bot participant into video conferencing sessions hosted on third-party platforms including Zoom, Microsoft Teams, and Google Meet, wherein the bot joins as a named participant, captures real-time audio, generates timestamped speaker-attributed transcript segments, processes each segment through the platform's sentiment scoring and compliance detection engines, and stores all captured signals in the same communication intelligence data structure used for natively-hosted events."),
      blankLine(),
      para("39. The system of claim 38 wherein the shadow mode module supports concurrent deployment of multiple bot participants across multiple simultaneous meetings, enabling a single operator to monitor communication intelligence from several events in parallel through the same embedded intelligence interface."),
      blankLine(),
      para("40. The system of claim 38 wherein the bot participant captures enriched communication signals not available through audio-only telephony connections, including participant lists, meeting metadata, and screen sharing state detection."),
      blankLine(),

      heading("Historical Archive Processing Claims (Module B):", HeadingLevel.HEADING_2),
      blankLine(),
      para("41. The system of claim 1 further comprising a historical archive intelligence processing module configured to: (a) accept transcript text and event metadata for past communication events; (b) segment the transcript into discrete analysis units; (c) process each segment through the platform's AI sentiment scoring and compliance detection engines; (d) generate structured tagged intelligence records identical in format to those generated from live events; and (e) store all generated records in the same tagged metrics database used for live events, enabling cross-event analytics across both live and historical data."),
      blankLine(),
      para("42. A method for retroactively generating communication intelligence from historical event transcripts comprising the steps of: (a) receiving a transcript and event metadata for a past communication event; (b) segmenting the transcript using paragraph boundary detection and word count thresholds; (c) scoring each segment for sentiment using an AI model; (d) scanning the transcript for compliance-sensitive keywords; (e) generating tagged intelligence records for each segment; and (f) storing the intelligence records in the platform's unified intelligence database."),
      blankLine(),

      heading("Intelligence Report Distribution Claims (Module C):", HeadingLevel.HEADING_2),
      blankLine(),
      para("43. The system of claim 1 further comprising an automated intelligence report distribution module configured to: (a) retrieve event intelligence data including sentiment scores, compliance flags, word count, segment count, and tagged intelligence record count for a specified event; (b) generate a professionally formatted HTML report containing event identification, quantitative metrics, qualitative risk assessments, and operator notes; and (c) dispatch the formatted report to a specified recipient via a transactional email API."),
      blankLine(),

      heading("Unified Command Centre Claims (Module D):", HeadingLevel.HEADING_2),
      blankLine(),
      para("44. The system of claim 9 further comprising a unified operator command centre providing a single-interface entry point to all platform capabilities through a contextually organised collapsible sidebar navigation, a dashboard home view displaying current-day event schedules with per-event status indicators, aggregate platform statistics, interactive calendar with event density visualisation, system health indicators for all critical services, AI alerts, and quick-launch actions for common operator workflows."),
      blankLine(),

      heading("Webcasting and On-Demand Library Claims (Module E):", HeadingLevel.HEADING_2),
      blankLine(),
      para("45. The system of claim 1 further comprising a webcasting hub and on-demand intelligence library configured to: (a) provide an event creation wizard for configuring webcast events with AI intelligence module selection; (b) provide a public-facing event directory filterable by industry vertical and event type; (c) support live webcast streaming with integrated attendee registration and embedded Q&A; (d) automatically archive completed webcasts with full transcript and AI-generated intelligence summary; and (e) provide webcast analytics including attendee engagement, drop-off analysis, and sentiment trajectory."),
      blankLine(),

      heading("Sustainability Quantification Claims (Module F):", HeadingLevel.HEADING_2),
      blankLine(),
      para("46. The system of claim 1 further comprising an environmental sustainability quantification module configured to: (a) estimate avoided carbon emissions by calculating the travel that would have been required for a physical event based on attendee count and average travel distance; (b) calculate the energy consumption of the virtual event including server compute and bandwidth; (c) generate a net carbon savings figure; (d) assign a sustainability grade from A+ through D based on industry benchmarks; and (e) generate a downloadable Green Event Certificate documenting the sustainability metrics."),
      blankLine(),

      heading("Market Reaction Correlation Claims (Module G):", HeadingLevel.HEADING_2),
      blankLine(),
      para("47. The system of claim 5 further comprising a market reaction correlation and prediction engine configured to: (a) capture stock price data at event start and at 24-hour, 48-hour, and 7-day intervals post-event; (b) correlate observed price movements with communication intelligence signals including aggregate sentiment, executive confidence, Q&A difficulty, and compliance flag count; (c) generate market direction predictions with confidence scores for future events; and (d) store historical correlation data to refine prediction accuracy over time through the self-improving model pipeline."),
      blankLine(),

      heading("Zero-Click Registration Claims (Module H):", HeadingLevel.HEADING_2),
      blankLine(),
      para("48. The system of claim 1 further comprising an intelligent mailing list and zero-click registration system configured to: (a) import investor contacts via bulk CSV upload with automatic field mapping and deduplication; (b) organise contacts into segmented mailing lists by client, sector, and engagement history; (c) generate personalised event invitations with unique tokenised registration links per recipient; and (d) automatically register recipients upon clicking the tokenised link without requiring any form submission, using pre-existing contact data to complete registration."),
      blankLine(),

      heading("Intelligent Broadcaster and Recap Claims (Module I):", HeadingLevel.HEADING_2),
      blankLine(),
      para("49. The system of claim 1 further comprising an intelligent broadcaster module configured to: (a) analyse presenter speaking pace in real time and provide visual indicators when pace deviates from optimal ranges; (b) detect key moments during live broadcasts including significant announcements, quotable phrases, and financial disclosures; and (c) automatically generate structured post-event recaps including executive summary, key takeaways, notable quotes, financial figures, and recommended follow-up actions."),
      blankLine(),

      heading("Social Media and Podcast Repurposing Claims (Module J):", HeadingLevel.HEADING_2),
      blankLine(),
      para("50. The system of claim 36 further comprising: (a) a social media repurposing engine that analyses event transcripts and intelligence records to generate platform-specific social media posts tailored to the character limits and communication norms of each target platform, with a scheduling interface for timed distribution; and (b) a podcast conversion engine that transforms event audio recordings into podcast-ready format with automated intro/outro generation, AI-written show notes, and episode descriptions derived from the event transcript."),
      blankLine(),

      heading("Communication Index Claims (Module K):", HeadingLevel.HEADING_2),
      blankLine(),
      para("51. The system of claim 4 further comprising a communication index module that generates a composite investor relations performance score for each organisation by aggregating: (a) sentiment trajectory across events; (b) compliance flag frequency and severity trend; (c) investor question difficulty and response quality; (d) audience engagement metrics including attendance, retention, and Q&A participation; and (e) executive communication clarity scores derived from linguistic analysis; and wherein the composite score enables sector-peer benchmarking and historical trend analysis."),
      blankLine(),

      heading("Virtual Production Studio Claims (Module L):", HeadingLevel.HEADING_2),
      blankLine(),
      para("52. The system of claim 1 further comprising a browser-based virtual production studio for live event broadcasting configured to: (a) manage multiple video feed sources including presenter cameras, screen shares, and pre-recorded segments with real-time switching; (b) manage lower third graphic overlays displaying presenter information, company logos, and dynamic data including live sentiment scores and participant counts; (c) provide selectable broadcast layout templates; and (d) provide real-time preview of the broadcast output as seen by attendees."),

      sectionDivider(),

      // DRAWINGS
      heading("5. Additional Drawings"),
      blankLine(),
      heading("FIG 20 — Shadow Mode: Third-Party Meeting Platform Intelligence Capture", HeadingLevel.HEADING_2),
      blankLine(),
      para("+=========================================================+"),
      para("|           SHADOW MODE INTELLIGENCE CAPTURE              |"),
      para("+=========================================================+"),
      para("|                                                         |"),
      para("|  +-------------+ +-------------+ +-------------+        |"),
      para("|  | Zoom        | | Microsoft   | | Google      |        |"),
      para("|  | Meeting     | | Teams       | | Meet        |        |"),
      para("|  +------+------+ +------+------+ +------+------+        |"),
      para("|         |               |               |               |"),
      para("|         +---------------+---------------+               |"),
      para("|                         |                               |"),
      para("|                         v                               |"),
      para("|  +---------------------------------------------------+ |"),
      para("|  |       BOT DEPLOYMENT API                          | |"),
      para("|  |  (Recall.ai / equivalent bot service)             | |"),
      para("|  +---------------------------------------------------+ |"),
      para("|                         |                               |"),
      para("|                         v                               |"),
      para("|  +---------------------------------------------------+ |"),
      para("|  |     AUTONOMOUS AI BOT PARTICIPANT                 | |"),
      para("|  |  • Joins as named participant                     | |"),
      para("|  |  • Real-time audio capture                        | |"),
      para("|  |  • Meeting metadata capture                       | |"),
      para("|  |  • Participant list extraction                    | |"),
      para("|  +---------------------------------------------------+ |"),
      para("|                         |                               |"),
      para("|                         v                               |"),
      para("|  +---------------------------------------------------+ |"),
      para("|  |     UNIFIED SIGNAL PROCESSING PIPELINE            | |"),
      para("|  |  • Speech-to-text transcription                   | |"),
      para("|  |  • Per-speaker sentiment scoring                  | |"),
      para("|  |  • Compliance keyword detection                   | |"),
      para("|  |  • Engagement signal capture                      | |"),
      para("|  +---------------------------------------------------+ |"),
      para("|                         |                               |"),
      para("|                         v                               |"),
      para("|  +---------------------------------------------------+ |"),
      para("|  |     COMMUNICATION INTELLIGENCE DATABASE           | |"),
      para("|  |  (same structure as natively-hosted events)        | |"),
      para("|  +---------------------------------------------------+ |"),
      para("|                                                         |"),
      para("+=========================================================+"),
      blankLine(),

      heading("FIG 21 — Historical Archive Intelligence Processing Pipeline", HeadingLevel.HEADING_2),
      blankLine(),
      para("+---------------------------+"),
      para("| Historical Transcript     |"),
      para("| Upload (text/file)        |"),
      para("+-----------+---------------+"),
      para("            |"),
      para("            v"),
      para("+---------------------------+"),
      para("| Segment Extraction        |"),
      para("| (paragraph boundaries,    |"),
      para("|  word count thresholds)   |"),
      para("+-----------+---------------+"),
      para("            |"),
      para("            v"),
      para("+---------------------------+     +---------------------------+"),
      para("| AI Sentiment Scoring      |     | Compliance Keyword Scan   |"),
      para("| (per segment, 0-100)      |     | (forward-looking, insider |"),
      para("+-----------+---------------+     |  merger, regulatory)      |"),
      para("            |                     +-----------+---------------+"),
      para("            +----------+----------+"),
      para("                       |"),
      para("                       v"),
      para("+---------------------------+"),
      para("| Tagged Intelligence       |"),
      para("| Record Generation         |"),
      para("| (sentiment, compliance,   |"),
      para("|  engagement, intervention)|"),
      para("+-----------+---------------+"),
      para("            |"),
      para("            v"),
      para("+---------------------------+"),
      para("| Unified Tagged Metrics    |"),
      para("| Database                  |"),
      para("| (live + archive events)   |"),
      para("+---------------------------+"),
      blankLine(),

      heading("FIG 22 — Automated Intelligence Report Distribution", HeadingLevel.HEADING_2),
      blankLine(),
      para("+---------------------------+"),
      para("| Event Intelligence Data   |"),
      para("| (sentiment, compliance,   |"),
      para("|  word count, segments)    |"),
      para("+-----------+---------------+"),
      para("            |"),
      para("            v"),
      para("+---------------------------+"),
      para("| HTML Report Generator     |"),
      para("| • Event identification    |"),
      para("| • Sentiment score + class |"),
      para("| • Compliance risk level   |"),
      para("| • Quantitative metrics    |"),
      para("| • Operator notes          |"),
      para("+-----------+---------------+"),
      para("            |"),
      para("            v"),
      para("+---------------------------+"),
      para("| Transactional Email API   |"),
      para("| (branded delivery to      |"),
      para("|  stakeholder inbox)       |"),
      para("+---------------------------+"),
      blankLine(),

      heading("FIG 23 — Unified Operator Command Centre Architecture", HeadingLevel.HEADING_2),
      blankLine(),
      para("+=========================================================+"),
      para("|              UNIFIED OPERATOR COMMAND CENTRE             |"),
      para("+=========================================================+"),
      para("|                                                         |"),
      para("|  +---------+  +---------------------------------------+ |"),
      para("|  | SIDEBAR |  | MAIN CONTENT AREA                    | |"),
      para("|  |         |  |                                       | |"),
      para("|  | Events  |  | +--------+ +--------+ +--------+     | |"),
      para("|  | • Dash  |  | |Today's | |Active  | |Platform|     | |"),
      para("|  | • OCC   |  | |Events  | |Particip| |Health  |     | |"),
      para("|  | • Web   |  | |  4     | | 1,247  | |  98%   |     | |"),
      para("|  | • Book  |  | +--------+ +--------+ +--------+     | |"),
      para("|  |         |  |                                       | |"),
      para("|  | Intel.  |  | +-----------------------------------+ | |"),
      para("|  | • Brain |  | | Daily Schedule + Calendar         | | |"),
      para("|  | • Metric|  | +-----------------------------------+ | |"),
      para("|  | • Shadow|  |                                       | |"),
      para("|  | • Health|  | +---------+ +---------+ +---------+   | |"),
      para("|  |         |  | |AI Alerts| |System   | |Quick    |   | |"),
      para("|  | Platform|  | |         | |Status   | |Launch   |   | |"),
      para("|  | • Integ.|  | +---------+ +---------+ +---------+   | |"),
      para("|  | • Billing|  |                                      | |"),
      para("|  +---------+  +---------------------------------------+ |"),
      para("|                                                         |"),
      para("+=========================================================+"),

      sectionDivider(),

      // INCORPORATION BY REFERENCE
      heading("6. Incorporation by Reference"),
      blankLine(),
      para("The full specification, claims (1–37), drawings (FIG 1–FIG 19), definitions, detailed description, and all alternative implementations described in the parent provisional patent specification are incorporated by reference in their entirety. The new matter described in this CIP application supplements and extends the parent specification without modifying or replacing any of the parent claims or described embodiments."),

      sectionDivider(),

      // SIGNATURE
      heading("7. Declaration"),
      blankLine(),
      para("I, David Cameron, the applicant and inventor, declare that this Continuation-in-Part application contains new matter that was not disclosed in the parent provisional patent specification, that the new matter has been reduced to practice in a working implementation of the CuraLive platform, and that this CIP is filed within the priority period of the parent application."),
      blankLine(),
      blankLine(),
      para("_______________________________"),
      para("David Cameron"),
      para("Applicant and Inventor"),
      para(`Date: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`),
    ],
  }],
});

async function main() {
  const buffer = await Packer.toBuffer(doc);
  const outPath = "CuraLive_CIP_CIPC_Submission.docx";
  fs.writeFileSync(outPath, buffer);
  console.log(`CIP document generated: ${outPath} (${(buffer.byteLength / 1024).toFixed(1)} KB)`);
}

main().catch(console.error);
