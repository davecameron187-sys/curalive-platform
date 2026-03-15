// @ts-nocheck
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType, PageBreak
} from "docx";
import fs from "fs";

const BLUE = "1a1a2e";
const GREY = "555555";
const DARK = "333333";
const GREEN = "16a34a";
const RED = "dc2626";

function heading(text: string, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 400, after: 200 }, children: [new TextRun({ text, bold: true, color: BLUE, font: "Calibri" })] });
}

function para(text: string, spacing = 120) {
  return new Paragraph({ spacing: { after: spacing }, children: [new TextRun({ text, font: "Calibri", size: 22, color: DARK })], });
}

function italicPara(text: string) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, font: "Calibri", size: 22, color: GREY, italics: true })], });
}

function boldPara(text: string) {
  return new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text, bold: true, font: "Calibri", size: 22, color: BLUE })], });
}

function bullet(text: string) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: [new TextRun({ text, font: "Calibri", size: 22, color: DARK })] });
}

function numberedPara(num: string, text: string) {
  return new Paragraph({ spacing: { after: 100 }, children: [
    new TextRun({ text: `${num}. `, bold: true, font: "Calibri", size: 22, color: BLUE }),
    new TextRun({ text, font: "Calibri", size: 22, color: DARK }),
  ]});
}

function divider() {
  return new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } }, children: [new TextRun({ text: "" })] });
}

function cell(text: string, bold = false, shading?: string) {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold, font: "Calibri", size: 20, color: bold && shading ? "ffffff" : DARK })] })],
    width: { size: 100, type: WidthType.AUTO },
    ...(shading ? { shading: { type: ShadingType.SOLID, color: shading, fill: shading } } : {}),
  });
}

const doc = new Document({
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 } } },
    children: [

      // ============================================================
      // COVER PAGE
      // ============================================================
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: "AI AntiHijack", bold: true, font: "Calibri", size: 52, color: BLUE }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "Pilot Programme Proposal", font: "Calibri", size: 28, color: GREY }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [
        new TextRun({ text: "Prepared for Tragar Logistics", bold: true, font: "Calibri", size: 24, color: DARK }),
      ]}),
      divider(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "Presented by David Cameron", font: "Calibri", size: 22, color: DARK }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [
        new TextRun({ text: "Confidential — March 2026", font: "Calibri", size: 20, color: GREY, italics: true }),
      ]}),

      // ============================================================
      // PAGE BREAK - OPENING
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),

      heading("Why I'm Coming to You First"),
      para("Before I approach any investor, insurer, or tracking company with this technology, I want to test it with someone I trust — and someone who would genuinely benefit from it."),
      para("Tragar is the perfect fit for a pilot because:"),
      bullet("You operate vehicles across South Africa and cross-border — exactly the environments where hijacking and cargo theft risk is highest"),
      bullet("You already track deliveries (POD and parcel tracking) — so you understand the value of vehicle intelligence"),
      bullet("Your drivers are on the road daily in high-risk corridors — Jet Park, Gauteng, national routes, and border crossings"),
      bullet("As family, I want Tragar to be the first company to benefit from this, and I want your honest feedback to make it better"),
      para("This isn't a sales pitch. I'm asking you to help me prove this works in the real world, and in return, Tragar gets the technology at no cost during the pilot and preferential terms afterward."),

      divider(),

      // ============================================================
      // THE PROBLEM
      // ============================================================
      heading("The Problem Tragar Faces Today"),
      para("Logistics companies in South Africa lose millions every year to vehicle hijacking, cargo theft, and route-related incidents. The industry challenges include:"),

      boldPara("Hijacking and cargo theft"),
      bullet("South Africa averages over 16,000 vehicle hijackings per year — logistics vehicles carrying valuable cargo are prime targets"),
      bullet("Cross-border routes (especially to Mozambique, Zimbabwe, Eswatini) pass through known high-risk corridors"),
      bullet("When a truck is hijacked, you lose the vehicle, the cargo, the driver faces danger, and you face insurance claims and client losses"),

      boldPara("Current tracking limitations"),
      bullet("Standard GPS tracking tells you where a vehicle IS, but not whether the situation is NORMAL or DANGEROUS"),
      bullet("Panic buttons require the driver to physically press them — in a hijacking, this is often impossible"),
      bullet("If a jammer is used, standard cellular tracking goes silent — exactly when you need it most"),
      bullet("You find out about an incident AFTER it happens, not while it's developing"),

      boldPara("Insurance and evidence gaps"),
      bullet("After an incident, proving exactly what happened is difficult — was it hijacking or internal theft?"),
      bullet("Insurance claims are disputed when there's insufficient evidence of the sequence of events"),
      bullet("There's no forensic-grade timeline reconstruction available from current tracking systems"),

      divider(),

      // ============================================================
      // THE SOLUTION
      // ============================================================
      heading("What AI AntiHijack Does Differently"),
      para("AI AntiHijack is an artificial intelligence layer that sits on top of vehicle tracking systems and does what no current system does — it THINKS. It learns your drivers, your routes, your patterns, and detects when something is wrong BEFORE or AS it happens."),

      boldPara("1. It learns each driver"),
      para("The AI builds a profile of each driver — their usual routes, typical speeds, normal stop patterns, and driving style. After a few weeks, it knows what 'normal' looks like for every driver individually."),

      boldPara("2. It watches every journey in real time"),
      para("When a driver is on a delivery, the system compares their live movement against the expected route. If the vehicle deviates — especially toward a known high-risk area — the system flags it immediately."),

      boldPara("3. It detects danger without the driver needing to do anything"),
      para("Unlike a panic button, the AI detects hijack indicators automatically:"),
      bullet("Unexpected route deviation toward a known hotspot"),
      bullet("Driver's phone suddenly going offline (common when hijackers take phones)"),
      bullet("Vehicle stopping in an unusual location for an unusual duration"),
      bullet("Vehicle moving but the driver's phone/wearable is no longer with the vehicle"),
      bullet("Multiple signals combining together = high threat score"),

      boldPara("4. It alerts silently and escalates automatically"),
      para("When threat is detected, the system doesn't need the driver to press anything:"),
      bullet("Stage 1: Increased monitoring — system watches more closely, logs everything"),
      bullet("Stage 2: Silent verification — sends a discreet check to the driver"),
      bullet("Stage 3: Trusted contacts alerted — your control room gets notified with the live situation"),
      bullet("Stage 4: Emergency escalation — responders are notified with real-time vehicle tracking"),

      boldPara("5. It survives jammers"),
      para("If cellular signal is jammed, the system uses alternative communication paths — Bluetooth relay, mesh networking, stored data for later transmission. It doesn't just go silent like standard trackers."),

      boldPara("6. It preserves forensic evidence"),
      para("Every incident generates a complete, tamper-proof evidence package:"),
      bullet("Timestamped location breadcrumbs at high frequency"),
      bullet("Audio recording during the incident"),
      bullet("Complete tamper and communication logs"),
      bullet("Cryptographically secured so evidence can't be altered — suitable for insurance claims and police reports"),

      boldPara("7. It predicts risk BEFORE the journey"),
      para("Based on historical crime data and patterns, the system can tell you:"),
      bullet("\"This route has elevated hijacking risk between 17:00–20:00 on Fridays\""),
      bullet("\"Alternative route available that reduces risk exposure by 60%\""),
      bullet("\"3 incidents reported in this corridor this month — increased monitoring active\""),

      divider(),

      // ============================================================
      // HOW IT WORKS — TECHNICAL IMPLEMENTATION
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),

      heading("How It Will Be Implemented — The Technical Approach"),
      para("This section explains exactly how the AI AntiHijack system gets deployed on Tragar's vehicles. The key principle: we work WITH your existing infrastructure, not against it. No ripping out current systems, no expensive hardware, no downtime."),

      // --- LAYER 1: DATA COLLECTION ---
      heading("Layer 1: Connecting to Your Existing Vehicle Data", HeadingLevel.HEADING_2),
      para("Every tracking system (Cartrack, Netstar, MiX, Ctrack, or any other provider Tragar uses) already collects GPS location, speed, ignition status, and stop/start events. The AI AntiHijack system connects to this data in one of three ways:"),

      boldPara("Option A: API Integration (preferred — zero hardware)"),
      para("Most modern tracking providers offer an API — a data feed that allows authorised third-party systems to receive your vehicle data in real time. We connect to your tracking provider's API and receive the same GPS data your control room already sees."),
      bullet("No hardware installation required — purely a software connection"),
      bullet("Takes 1–3 days to set up, depending on your tracking provider"),
      bullet("Your tracking provider continues to work exactly as before — we're reading the data, not changing it"),
      bullet("This is the fastest and cheapest approach — ideal for the pilot"),

      boldPara("Option B: Driver Smartphone App"),
      para("If API access isn't available from your tracking provider, we install a lightweight app on each pilot driver's smartphone. The app runs in the background and provides:"),
      bullet("GPS location updates every 5–10 seconds (uses minimal battery and data)"),
      bullet("Accelerometer data — detects sudden stops, impacts, unusual movement patterns"),
      bullet("Bluetooth connectivity — detects if the driver's phone separates from the vehicle"),
      bullet("Network status monitoring — detects if cellular signal is being jammed"),
      bullet("The app is simple — drivers open it at the start of their shift, and it runs silently in the background"),

      boldPara("Option C: Dedicated OBD-II Device (for maximum data)"),
      para("For vehicles where you want the richest data, a small plug-in device connects to the vehicle's OBD-II diagnostic port (the same port mechanics use to read fault codes). This device provides:"),
      bullet("Real-time vehicle telemetry — engine RPM, fuel level, ignition, door locks, speed"),
      bullet("Independent GPS — works even if the existing tracker is jammed or disabled"),
      bullet("Independent cellular connection — a separate SIM card so the AI has its own communication path"),
      bullet("Tamper detection — alerts if someone tries to remove or disconnect the device"),
      bullet("Cost: approximately R800–R1,500 per device — for the pilot, I'll cover this cost"),

      para("For Tragar's pilot, I'd recommend starting with Option A or B (zero or minimal cost) and adding Option C to 3–5 high-risk vehicles to demonstrate the full capability."),

      divider(),

      // --- LAYER 2: THE AI BRAIN ---
      heading("Layer 2: The AI Brain — Cloud Processing", HeadingLevel.HEADING_2),
      para("All vehicle data feeds into a secure cloud-based AI engine. This is where the intelligence happens. Here's what it does with the data:"),

      boldPara("Step 1: Build driver and route baselines (Week 1–4)"),
      bullet("The AI watches each driver's normal patterns — which routes they take, how fast they drive on different roads, where they typically stop, how long deliveries take"),
      bullet("It builds a unique behavioural profile for each driver — Driver A always takes the N1, stops at Engen for 12 minutes, averages 80km/h on the highway"),
      bullet("It maps Tragar's common routes and identifies normal vs unusual corridors"),
      bullet("It ingests publicly available crime data — SAPS crime statistics, historical hijacking hotspots, time-of-day patterns"),

      boldPara("Step 2: Real-time anomaly detection (Week 5 onwards)"),
      para("Once baselines are established, the AI compares every live data point against what it expects:"),
      bullet("Is this driver on their expected route? If not, how far off and in which direction?"),
      bullet("Has the vehicle stopped in an unusual place? How long has it been stationary?"),
      bullet("Is the driver's phone still with the vehicle? If it suddenly disappears, that's a red flag"),
      bullet("Is the vehicle in or near a known crime hotspot? Is it the time of day when incidents typically occur?"),
      bullet("Has cellular signal dropped? Is the vehicle still moving without any communication?"),
      para("Each of these factors is scored individually. The AI combines them into a single threat score from 0 (normal) to 100 (critical). When the score crosses defined thresholds, alerts are triggered."),

      boldPara("Step 3: Threat scoring and decision engine"),
      para("The AI doesn't just trigger alerts on single events — it combines multiple signals intelligently:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Threat Level", true, "1a1a2e"), cell("Score", true, "1a1a2e"), cell("What Triggered It", true, "1a1a2e"), cell("What Happens", true, "1a1a2e")] }),
          new TableRow({ children: [cell("Normal"), cell("0–20"), cell("Vehicle on expected route, normal speed, driver phone connected"), cell("No action — routine monitoring")] }),
          new TableRow({ children: [cell("Elevated"), cell("21–40"), cell("Minor route deviation OR unexpected stop — but only one factor"), cell("AI watches more closely, increases data collection frequency")] }),
          new TableRow({ children: [cell("Guarded"), cell("41–60"), cell("Route deviation PLUS unusual stop location — two factors combining"), cell("Silent alert to monitoring dashboard, log everything")] }),
          new TableRow({ children: [cell("High"), cell("61–80"), cell("Route deviation + driver phone offline + near crime hotspot"), cell("Alert to Tragar control room with live vehicle position")] }),
          new TableRow({ children: [cell("Critical"), cell("81–100"), cell("Multiple signals + vehicle moving toward known chop-shop area or signal jammed"), cell("Emergency escalation — control room + emergency contacts + evidence recording")] }),
        ],
      }),

      divider(),

      // --- LAYER 3: ALERT SYSTEM ---
      heading("Layer 3: The Alert and Response System", HeadingLevel.HEADING_2),
      para("When the AI detects a threat, it escalates through a defined chain. This is customised for Tragar's operations:"),

      boldPara("Alert Channel 1: Monitoring Dashboard"),
      para("A web-based dashboard accessible from any computer or tablet in Tragar's control room. It shows:"),
      bullet("Live map of all pilot vehicles with colour-coded threat status (green/yellow/orange/red)"),
      bullet("Alert feed showing real-time anomaly detections with context (why the alert was triggered)"),
      bullet("Historical journey replays — see exactly what route a vehicle took and where anomalies occurred"),
      bullet("Driver behaviour scorecards — which drivers are consistent, which have irregular patterns"),

      boldPara("Alert Channel 2: Mobile Push Notifications"),
      para("Designated managers and operations staff receive instant push notifications on their phones when a High or Critical alert triggers. The notification includes:"),
      bullet("Vehicle ID and driver name"),
      bullet("Current location (with map link)"),
      bullet("What triggered the alert (e.g., 'Route deviation + phone offline near Diepsloot corridor')"),
      bullet("Recommended action (e.g., 'Attempt driver contact, prepare escalation')"),

      boldPara("Alert Channel 3: SMS and WhatsApp Escalation"),
      para("If a Critical alert is not acknowledged within 3 minutes, the system automatically escalates via:"),
      bullet("SMS to a pre-defined list of emergency contacts"),
      bullet("WhatsApp message with live location sharing link"),
      bullet("This ensures no critical alert goes unnoticed, even if the control room is unmanned"),

      boldPara("Alert Channel 4: Emergency Services Integration (post-pilot)"),
      para("After the pilot proves the system works, we can integrate with armed response companies and SAPS to enable direct emergency dispatch when critical threats are confirmed. This is a phase 2 capability."),

      divider(),

      // --- LAYER 4: EVIDENCE ---
      heading("Layer 4: Forensic Evidence Preservation", HeadingLevel.HEADING_2),
      para("If an incident occurs during the pilot, the system automatically generates a complete evidence package:"),

      boldPara("What's captured:"),
      bullet("High-frequency GPS breadcrumbs (every 2–5 seconds during an incident, vs every 30–60 seconds normally)"),
      bullet("Complete timeline: exact time of first anomaly, escalation points, route taken, stops made"),
      bullet("Communication log: when cellular signal was lost, when it returned, any jamming indicators"),
      bullet("Device integrity: was the tracker tampered with, was the OBD device disconnected"),
      bullet("Environmental context: was the vehicle in a known hotspot, what time of day, what day of week"),

      boldPara("How it's secured:"),
      bullet("Every data point is cryptographically hashed — this means it's mathematically impossible to alter the data after the fact"),
      bullet("The evidence package is timestamped and stored on multiple servers — it can't be deleted or modified"),
      bullet("This produces a chain-of-custody grade evidence trail suitable for insurance claims, police reports, and legal proceedings"),

      boldPara("Why this matters for Tragar:"),
      para("If a vehicle is hijacked, you'll have a complete, tamper-proof record of exactly what happened, when, and where. This eliminates disputes with insurers and provides SAPS with actionable intelligence. No other tracking system in South Africa currently offers this level of forensic evidence."),

      divider(),

      // --- LAYER 5: PREDICTIVE ---
      heading("Layer 5: Predictive Intelligence and Route Planning", HeadingLevel.HEADING_2),
      para("Beyond detecting incidents as they happen, the AI builds intelligence that helps prevent incidents before they occur:"),

      boldPara("Crime hotspot mapping"),
      bullet("The system ingests SAPS crime statistics, media reports, and (over time) data from all vehicles on the network to build a live crime risk map"),
      bullet("High-risk areas are identified and updated continuously — not just based on last year's statistics, but on what's happening this week"),

      boldPara("Time-based risk patterns"),
      bullet("Hijackings follow patterns — specific times of day, days of the week, and even seasonal trends"),
      bullet("The AI identifies these patterns and adjusts risk scoring accordingly (e.g., a delivery through Soweto at 18:00 on a Friday scores higher than the same route at 10:00 on a Tuesday)"),

      boldPara("Route risk recommendations"),
      para("Before a journey starts, the system can provide:"),
      bullet("A risk score for the planned route at the planned time"),
      bullet("Alternative routes that reduce risk exposure"),
      bullet("Specific corridor warnings (e.g., 'N12 between Daveyton and Springs has had 3 incidents this month — consider N17 alternative')"),
      bullet("This information can be provided to dispatchers so they can make informed routing decisions"),

      boldPara("Fleet intelligence (grows over time)"),
      para("As more vehicles join the network (beyond Tragar, across the industry), the intelligence improves for everyone:"),
      bullet("If a vehicle from another fleet is hijacked on a route Tragar uses, Tragar's risk assessment for that route updates immediately"),
      bullet("This creates a community defence network — each vehicle makes the system smarter for all users"),

      divider(),

      // --- ARCHITECTURE SUMMARY ---
      heading("System Architecture Summary", HeadingLevel.HEADING_2),
      para("Here is how all five layers work together:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Layer", true, "1a1a2e"), cell("What It Does", true, "1a1a2e"), cell("Where It Runs", true, "1a1a2e"), cell("Tragar Effort", true, "1a1a2e")] }),
          new TableRow({ children: [cell("1. Data Collection"), cell("Gathers GPS, speed, phone status, vehicle telemetry"), cell("Tracking API / Driver phone / OBD device"), cell("Minimal — authorise API access or install app")] }),
          new TableRow({ children: [cell("2. AI Brain"), cell("Learns behaviour, detects anomalies, scores threats"), cell("Secure cloud servers"), cell("None — fully managed by us")] }),
          new TableRow({ children: [cell("3. Alerts"), cell("Notifies control room, managers, emergency contacts"), cell("Dashboard + mobile + SMS/WhatsApp"), cell("Designate who receives alerts")] }),
          new TableRow({ children: [cell("4. Forensic Evidence"), cell("Captures and secures incident data for claims/police"), cell("Secure cloud storage"), cell("None — automatic")] }),
          new TableRow({ children: [cell("5. Predictive Intel"), cell("Maps risk, recommends routes, community intelligence"), cell("Dashboard + dispatch integration"), cell("Optional — use insights for routing decisions")] }),
        ],
      }),

      divider(),

      // --- WHAT TRAGAR NEEDS TO DO ---
      heading("What Tragar Actually Needs to Do", HeadingLevel.HEADING_2),
      para("The implementation effort from Tragar's side is minimal. Here is the complete list:"),

      numberedPara("1", "Provide the name of your current tracking provider and authorise API access (I handle the technical connection)"),
      numberedPara("2", "Identify 10–20 pilot vehicles and their primary drivers"),
      numberedPara("3", "Share basic route/delivery schedule data for those vehicles (even a spreadsheet is fine)"),
      numberedPara("4", "If using the smartphone app: ask pilot drivers to install the app (5 minutes per driver)"),
      numberedPara("5", "If using OBD devices: allow installation in 3–5 vehicles (15 minutes per vehicle, I do the install)"),
      numberedPara("6", "Designate 2–3 people to receive alerts and access the dashboard"),
      numberedPara("7", "Give feedback during weekly check-ins (15–20 minutes per week)"),

      para("That's it. Everything else — setup, configuration, AI training, monitoring, reporting — I handle entirely."),

      divider(),

      // --- COST SUMMARY ---
      heading("Cost to Tragar During the Pilot", HeadingLevel.HEADING_2),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Item", true, "1a1a2e"), cell("Cost to Tragar", true, "1a1a2e")] }),
          new TableRow({ children: [cell("AI AntiHijack software and cloud processing"), cell("R0 — free for the full 90-day pilot")] }),
          new TableRow({ children: [cell("Dashboard and alert system access"), cell("R0 — free for the full 90-day pilot")] }),
          new TableRow({ children: [cell("Driver smartphone app"), cell("R0 — free download, minimal data usage (< 50MB/month)")] }),
          new TableRow({ children: [cell("OBD-II devices (if used on 3–5 vehicles)"), cell("R0 — I cover the device cost for the pilot")] }),
          new TableRow({ children: [cell("Setup, configuration, and training"), cell("R0 — I do all setup at no charge")] }),
          new TableRow({ children: [cell("Weekly reporting and check-ins"), cell("R0 — included")] }),
          new TableRow({ children: [cell("TOTAL COST TO TRAGAR"), cell("R0 for 90 days")] }),
        ],
      }),

      para("After the pilot, if Tragar continues, pricing will be at founding partner rates — significantly below the standard market pricing I'll charge other logistics companies."),

      divider(),

      // ============================================================
      // THE PILOT PROPOSAL (original section continues)
      // ============================================================
      new Paragraph({ children: [new PageBreak()] }),

      heading("The Pilot Proposal for Tragar"),

      boldPara("What I'm asking"),
      para("A 90-day pilot programme on 10–20 Tragar vehicles to prove the technology works in real-world logistics conditions."),

      boldPara("What Tragar provides"),
      bullet("Access to 10–20 vehicles (ideally a mix of national, local, and cross-border routes)"),
      bullet("Basic route/delivery schedule data so the AI can learn expected journeys"),
      bullet("Feedback from drivers and your operations team on alerts and accuracy"),
      bullet("Access to your existing tracking system data feed (if possible) — the AI layers on top, it doesn't replace anything"),
      bullet("An honest assessment at the end: does this work? what's missing? would you pay for it?"),

      boldPara("What Tragar gets"),
      bullet("The full AI AntiHijack system at ZERO cost for the entire 90-day pilot"),
      bullet("Real-time AI threat detection and journey monitoring for your pilot vehicles"),
      bullet("Predictive route-risk assessments for your drivers and routes"),
      bullet("Forensic evidence packages for any incidents during the pilot"),
      bullet("A detailed analytics report at the end showing detection rates, false positive rates, and risk insights specific to Tragar's operations"),
      bullet("If the pilot succeeds and you continue, preferential pricing as the founding pilot partner — locked in permanently"),

      boldPara("What I get"),
      bullet("Real-world proof that the technology works on actual logistics vehicles"),
      bullet("Data to refine the AI models (all data stays confidential to Tragar)"),
      bullet("A case study I can use to approach insurers, tracking companies, and investors"),
      bullet("Your honest feedback to make this product better"),

      divider(),

      // ============================================================
      // TIMELINE
      // ============================================================
      heading("Pilot Timeline"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Phase", true, "1a1a2e"), cell("Duration", true, "1a1a2e"), cell("What Happens", true, "1a1a2e")] }),
          new TableRow({ children: [cell("Setup"), cell("Week 1–2"), cell("Install software layer on pilot vehicles, connect to tracking data, configure routes and driver profiles")] }),
          new TableRow({ children: [cell("Learning"), cell("Week 3–4"), cell("AI learns driver behaviour, route patterns, and normal operations — no alerts during this phase, just learning")] }),
          new TableRow({ children: [cell("Silent monitoring"), cell("Week 5–6"), cell("AI begins detecting anomalies but alerts go to me only — I review accuracy before activating live alerts")] }),
          new TableRow({ children: [cell("Live monitoring"), cell("Week 7–10"), cell("Full system active — alerts go to your operations team, real-time monitoring, predictive risk assessments")] }),
          new TableRow({ children: [cell("Review"), cell("Week 11–12"), cell("Analyse results, measure detection accuracy, review false positives, compile final report, discuss next steps")] }),
        ],
      }),

      divider(),

      // ============================================================
      // WHAT SUCCESS LOOKS LIKE
      // ============================================================
      heading("What Success Looks Like"),
      para("At the end of 90 days, if the pilot is successful, we should be able to demonstrate:"),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Metric", true, "1a1a2e"), cell("Target", true, "1a1a2e")] }),
          new TableRow({ children: [cell("Route anomalies correctly detected"), cell("85%+ detection rate")] }),
          new TableRow({ children: [cell("False positive rate"), cell("Less than 5% of alerts are false alarms")] }),
          new TableRow({ children: [cell("Detection speed"), cell("Anomaly flagged within 2–5 minutes of occurrence")] }),
          new TableRow({ children: [cell("Driver behaviour profiles built"), cell("Accurate profiles for all pilot drivers")] }),
          new TableRow({ children: [cell("Predictive risk accuracy"), cell("Route risk assessments align with actual incident data")] }),
          new TableRow({ children: [cell("Evidence package quality"), cell("Complete, tamper-proof timeline for any incidents")] }),
          new TableRow({ children: [cell("Operations team feedback"), cell("Positive — system adds value without adding burden")] }),
        ],
      }),

      divider(),

      // ============================================================
      // RISKS AND CONCERNS
      // ============================================================
      heading("Addressing Your Likely Concerns"),

      boldPara("\"Will this disrupt our operations?\""),
      para("No. The AI sits on top of your existing systems. Nothing changes for your drivers day-to-day. The first 4 weeks are silent learning — no alerts, no disruption. When alerts activate, they go to your control room, not to drivers during deliveries."),

      boldPara("\"What about driver privacy?\""),
      para("The system monitors vehicle behaviour and routes — the same data your existing tracking already captures. We're not adding cameras or recording personal conversations. Driver data stays within Tragar and is never shared externally."),

      boldPara("\"What if it doesn't work?\""),
      para("Then you've lost nothing. There's zero cost to Tragar for the pilot. If after 90 days it hasn't proven its value, we shake hands and part ways. I need honest results — a failed pilot that teaches me what to fix is more valuable to me than a pretend success."),

      boldPara("\"What's the catch?\""),
      para("There isn't one. I need a real-world testing environment with real vehicles on real routes. You need better security for your fleet. This is genuinely a win-win at this stage. The only thing I ask is honest feedback and permission to reference Tragar (with your approval) as a pilot partner when I approach insurers and investors."),

      boldPara("\"Why not go to Cartrack or Netstar directly?\""),
      para("Because they'll want proven results before they listen. I need Tragar to help me CREATE those proven results. Once I have 90 days of real data showing this works on logistics vehicles, every door opens. You're helping me build the proof — and that's why you get founding partner terms."),

      divider(),

      // ============================================================
      // AFTER THE PILOT
      // ============================================================
      heading("After the Pilot — What's in It for Tragar Long Term"),

      boldPara("If the pilot succeeds:"),
      bullet("Tragar gets the system at founding partner pricing — significantly below market rate, locked in permanently"),
      bullet("As I expand to other logistics companies, Tragar's data helps improve the system — but Tragar always gets the best rate"),
      bullet("When insurers come on board (which they will — this reduces their claims), Tragar could see reduced insurance premiums as a direct result"),
      bullet("If the technology is acquired by a Cartrack, Bosch, or insurer, Tragar's founding partner status and case study gives you leverage and recognition in the industry"),

      boldPara("The bigger picture:"),
      para("This patent is filed with CIPC. The technology has 48 patent claims covering AI detection, predictive intelligence, forensic evidence, and vehicle immobilization. If this works — and I believe it will — this becomes a significant business. Tragar being part of that from day one is something I want, both as a business decision and as family."),

      divider(),

      // ============================================================
      // THE ASK
      // ============================================================
      heading("The Ask"),

      para("I'd like to sit down with you for 30 minutes — at your offices in Jet Park or over a coffee — to walk you through this in person and answer any questions."),
      para("All I need from that conversation is a yes or no on whether you're open to a 90-day pilot on 10–20 vehicles starting in the next 4–6 weeks."),
      para("Everything else — setup, technology, monitoring, reporting — I handle. Your team's involvement is minimal."),

      divider(),

      // ============================================================
      // CONTACT
      // ============================================================
      new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "David Cameron", bold: true, font: "Calibri", size: 24, color: BLUE }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [
        new TextRun({ text: "+27 84 444 6001", font: "Calibri", size: 22, color: DARK }),
      ]}),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [
        new TextRun({ text: "AI AntiHijack — CIPC Provisional Patent Filed", font: "Calibri", size: 20, color: GREY, italics: true }),
      ]}),

    ],
  }],
});

async function generate() {
  const buffer = await Packer.toBuffer(doc);
  const path = "docs/AI_AntiHijack_Tragar_Pilot_Proposal.docx";
  fs.writeFileSync(path, buffer);
  const stats = fs.statSync(path);
  console.log(`DOCX saved: ${path}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
}

generate().catch(console.error);
