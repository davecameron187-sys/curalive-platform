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
      // THE PILOT PROPOSAL
      // ============================================================
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
