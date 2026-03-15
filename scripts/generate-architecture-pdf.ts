// @ts-nocheck
import PDFDocument from "pdfkit";
import fs from "fs";

const ORANGE = "#f97316";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const VIOLET = "#8b5cf6";
const TEAL = "#14b8a6";
const RED = "#ef4444";
const YELLOW = "#eab308";
const GREY = "#71717a";
const DARK = "#1a1d23";
const CARD_BG = "#1e2028";
const TEXT_LIGHT = "#e4e4e7";
const TEXT_DIM = "#a1a1aa";
const TEXT_MUTED = "#71717a";

const W = 1190;
const H = 842;
const M = 40;
const CW = W - M * 2;

const doc = new PDFDocument({
  size: [W, H],
  margins: { top: M, bottom: M, left: M, right: M },
  autoFirstPage: true,
  bufferPages: true,
});

const outputPath = "docs/CuraLive-System-Architecture.pdf";
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

function drawBg() {
  doc.rect(0, 0, W, H).fill(DARK);
}

function sectionBar(y: number, text: string, color: string) {
  doc.roundedRect(M, y, CW, 20, 4).fill(color);
  doc.fontSize(9).font("Helvetica-Bold").fillColor("white").text(text.toUpperCase(), M + 10, y + 5, { width: CW - 20 });
}

function cardBox(x: number, y: number, w: number, h: number, borderColor: string) {
  doc.roundedRect(x, y, w, h, 8).lineWidth(1.5).strokeColor(borderColor).fillAndStroke(CARD_BG, borderColor);
  doc.roundedRect(x, y, w, 3, 2).fill(borderColor);
}

function cardTitle(x: number, y: number, w: number, text: string, color: string) {
  doc.fontSize(8).font("Helvetica-Bold").fillColor(color).text(text, x + 8, y + 8, { width: w - 16 });
}

function cardItems(x: number, y: number, w: number, items: string[], startY?: number) {
  let cy = startY || y + 22;
  doc.fontSize(7).font("Helvetica").fillColor(TEXT_DIM);
  items.forEach((item) => {
    doc.text(`•  ${item}`, x + 10, cy, { width: w - 20 });
    cy += 11;
  });
  return cy;
}

function arrow(x: number, y1: number, y2: number, color: string) {
  doc.moveTo(x, y1).lineTo(x, y2 - 4).strokeColor(color).lineWidth(1.5).dash(4, { space: 3 }).stroke().undash();
  doc.moveTo(x - 4, y2 - 6).lineTo(x, y2).lineTo(x + 4, y2 - 6).fillColor(color).fill();
}

function flowSteps(x: number, y: number, w: number, steps: string[], color: string) {
  doc.fontSize(7).font("Helvetica-Bold").fillColor(color);
  const stepText = steps.join("  →  ");
  doc.text(stepText, x, y, { width: w });
  return doc.y + 2;
}

drawBg();

doc.fontSize(28).font("Helvetica-Bold").fillColor("white").text("CuraLive", M, 22, { width: CW, align: "center" });
doc.fontSize(11).font("Helvetica").fillColor(TEXT_MUTED).text("Complete System Architecture  |  Real-Time Investor Events Platform", M, 52, { width: CW, align: "center" });
doc.fontSize(8).fillColor("#52525b").text("React 19 + Vite  |  Express + tRPC  |  MySQL (Drizzle ORM)  |  Ably Real-time  |  OpenAI GPT-4o  |  Port 5000", M, 66, { width: CW, align: "center" });

// === ENTRY POINTS ===
const epY = 84;
sectionBar(epY, "Entry Points — How Users Access the Platform", ORANGE);

const entries = [
  { title: "Web Browser", sub: "Dashboard, OCC,\nevent rooms" },
  { title: "Phone Dial-In", sub: "Conference bridge\nwith unique PIN" },
  { title: "Shadow Mode", sub: "Recall.ai joins\nexternal calls silently" },
  { title: "CRM / Partner API", sub: "REST + Webhooks\nclv_ key auth", color: YELLOW },
  { title: "Mobile Attendee", sub: "5-panel swipe:\nVideo, Q&A, Polls" },
  { title: "OAuth SSO", sub: "Google / GitHub\nJWT + RBAC" },
];
const epCardW = (CW - 50) / 6;
entries.forEach((e, i) => {
  const cx = M + i * (epCardW + 10);
  const cy = epY + 26;
  const color = e.color || ORANGE;
  cardBox(cx, cy, epCardW, 52, color);
  cardTitle(cx, cy, epCardW, e.title, color);
  doc.fontSize(6.5).font("Helvetica").fillColor(TEXT_DIM).text(e.sub, cx + 8, cy + 20, { width: epCardW - 16 });
});

entries.forEach((_, i) => {
  const cx = M + i * (epCardW + 10) + epCardW / 2;
  arrow(cx, epY + 78, epY + 92, ORANGE);
});

// === FRONTEND ===
const feY = epY + 94;
sectionBar(feY, "Frontend — React 19 + Vite + TailwindCSS 4 + shadcn/ui", GREEN);

const feModules = [
  { title: "Events & Operations", items: ["Dashboard", "Operator Console", "Webcast Studio", "Event Scheduler", "Bookings / Registrations"], color: GREEN },
  { title: "AI & Intelligence", items: ["Agentic Brain", "Tagged Metrics", "Intelligence Terminal", "Shadow Mode / Health Guardian", "Compliance Engine"], color: VIOLET },
  { title: "Attendee Experience", items: ["Event Room / Waiting Room", "Mobile Room (5-panel)", "Q&A / Live Polls / Chat", "On-Demand Library", "Webcast Replay"], color: BLUE },
  { title: "Platform & Admin", items: ["Billing / Admin Panel", "Client Portal", "Mailing Lists / CRM Keys", "Branding / Feature Flags", "Integrations Hub"], color: YELLOW },
  { title: "Security & Compliance", items: ["SOC 2 / ISO 27001", "AI Compliance Engine", "Audit Trail / Threats", "Zero Trust Dashboard"], color: RED },
];
const feCardW = (CW - 40) / 5;
feModules.forEach((m, i) => {
  const cx = M + i * (feCardW + 10);
  const cy = feY + 26;
  cardBox(cx, cy, feCardW, 80, m.color);
  cardTitle(cx, cy, feCardW, m.title, m.color);
  cardItems(cx, cy, feCardW, m.items);
});

arrow(W / 2, feY + 108, feY + 120, BLUE);
doc.roundedRect(W / 2 - 28, feY + 111, 56, 14, 7).lineWidth(1).strokeColor(BLUE).fillAndStroke(CARD_BG, BLUE);
doc.fontSize(7).font("Helvetica-Bold").fillColor(BLUE).text("tRPC", W / 2 - 20, feY + 114, { width: 40, align: "center" });

// === BACKEND ===
const beY = feY + 122;
sectionBar(beY, "Backend API — Express + tRPC (45+ Routers) on Port 5000", BLUE);

const beModules = [
  { title: "Core Ops", items: ["occ / events / webcast", "scheduling / registrations", "webphone / polls", "liveVideo / mux"], color: BLUE },
  { title: "AI & Intel", items: ["agenticBrain / ai", "sentiment / transcription", "shadowMode", "taggedMetrics"], color: VIOLET },
  { title: "Media & RT", items: ["mux / recall / ably", "virtualStudio", "socialMedia", "contentTriggers"], color: BLUE },
  { title: "Business", items: ["billing / clientPortal", "mailingList / crmApi", "branding", "followups / callPrep"], color: YELLOW },
  { title: "Compliance", items: ["complianceEngine", "soc2 / iso27001", "healthGuardian"], color: RED },
  { title: "Auth", items: ["OAuth (Google/GitHub)", "JWT / RBAC", "system / auth"], color: GREY },
];
const beCardW = (CW - 50) / 6;
beModules.forEach((m, i) => {
  const cx = M + i * (beCardW + 10);
  const cy = beY + 26;
  cardBox(cx, cy, beCardW, 68, m.color);
  cardTitle(cx, cy, beCardW, m.title, m.color);
  cardItems(cx, cy, beCardW, m.items);
});

arrow(W / 2, beY + 96, beY + 110, VIOLET);

// === SERVICES ===
const svcY = beY + 110;
sectionBar(svcY, "Services — Background Processing & Autonomous AI Engines", VIOLET);

const svcModules = [
  { title: "Real-time & Media", items: ["Ably RT (live + presence)", "Live Transcription", "Audio Enhancer", "Language Dubber (8 langs)"], color: GREEN },
  { title: "AI Analysis", items: ["Sentiment (per-speaker)", "Speaking Pace Coach", "Q&A Auto-Triage", "Content Gen Triggers"], color: VIOLET },
  { title: "Content & Reports", items: ["Event Brief Generator", "Webcast Recap / Podcast", "Live Rolling Summary", "Social Media Pipeline"], color: BLUE },
  { title: "Compliance & Health", items: ["Compliance Engine (5-min)", "Health Guardian (30s)", "AI Threat Assessment", "Anomaly Detection (2.5σ)"], color: RED },
];
const svcCardW = (CW - 30) / 4;
svcModules.forEach((m, i) => {
  const cx = M + i * (svcCardW + 10);
  const cy = svcY + 26;
  cardBox(cx, cy, svcCardW, 68, m.color);
  cardTitle(cx, cy, svcCardW, m.title, m.color);
  cardItems(cx, cy, svcCardW, m.items);
});

arrow(W / 2, svcY + 96, svcY + 110, TEAL);

// === DATA LAYER ===
const dbY = svcY + 110;
sectionBar(dbY, "Data Layer — MySQL (Drizzle ORM) | 80+ Tables | Ably Channels", TEAL);

const dbModules = [
  { title: "Core", items: ["users / events", "attendee_registrations", "ir_contacts / branding"] },
  { title: "OCC / Telephony", items: ["occ_conferences", "occ_participants", "chat_messages"] },
  { title: "Media", items: ["webcast_events / qa", "mux_streams / polls", "transcription_jobs"] },
  { title: "AI / Intel", items: ["agentic_analyses", "tagged_metrics", "briefing_packs / audit_log"] },
  { title: "Billing", items: ["billing_clients", "stripe_customers", "mailing_lists / crm_keys"] },
  { title: "Compliance", items: ["compliance_threats", "soc2_controls (18)", "iso27001_controls (16)"] },
];
const dbCardW = (CW - 50) / 6;
dbModules.forEach((m, i) => {
  const cx = M + i * (dbCardW + 10);
  const cy = dbY + 26;
  const color = i === 5 ? RED : TEAL;
  cardBox(cx, cy, dbCardW, 56, color);
  cardTitle(cx, cy, dbCardW, m.title, color);
  cardItems(cx, cy, dbCardW, m.items);
});

arrow(W / 2, dbY + 84, dbY + 96, RED);

// === EXTERNAL INTEGRATIONS ===
const extY = dbY + 96;
sectionBar(extY, "External Integrations — Third-Party Services & APIs", RED);

const extServices = [
  { name: "Twilio", desc: "Voice, SIP, WebRTC", color: RED },
  { name: "OpenAI", desc: "GPT-4o, Whisper", color: VIOLET },
  { name: "Ably", desc: "Real-time channels", color: GREEN },
  { name: "Recall.ai", desc: "Meeting bots", color: BLUE },
  { name: "Mux", desc: "Video streaming", color: RED },
  { name: "Stripe", desc: "Payments", color: YELLOW },
  { name: "GitHub", desc: "Source / CI", color: GREY },
];
const extCardW = (CW - 60) / 7;
extServices.forEach((s, i) => {
  const cx = M + i * (extCardW + 10);
  const cy = extY + 26;
  cardBox(cx, cy, extCardW, 40, s.color);
  doc.fontSize(8).font("Helvetica-Bold").fillColor(s.color).text(s.name, cx + 6, cy + 8, { width: extCardW - 12, align: "center" });
  doc.fontSize(6.5).font("Helvetica").fillColor(TEXT_DIM).text(s.desc, cx + 6, cy + 22, { width: extCardW - 12, align: "center" });
});

// === PAGE 2: DATA FLOWS ===
doc.addPage({ size: [W, H], margins: { top: M, bottom: M, left: M, right: M } });
drawBg();

doc.fontSize(24).font("Helvetica-Bold").fillColor("white").text("Key Data Flows", M, 30, { width: CW, align: "center" });
doc.fontSize(9).font("Helvetica").fillColor(TEXT_MUTED).text("How information moves through the CuraLive platform", M, 58, { width: CW, align: "center" });

const flowW = (CW - 20) / 2;
const flows = [
  {
    num: "1", title: "Event Lifecycle", color: GREEN,
    lines: [
      ["Booking Form", "Event Created", "Mailing List Import", "Auto-PIN Generation"],
      ["Invitations Sent", "Attendee Clicks & Joins", "OCC Loads Live Event"],
      ["Conference Runs", "Post-Event Report", "Social Content Published"],
    ],
  },
  {
    num: "2", title: "AI Intelligence Pipeline", color: VIOLET,
    lines: [
      ["Live Audio", "Real-time Transcription", "Sentiment Analysis (per speaker)"],
      ["Q&A Auto-Triage", "Speaking Pace Coaching", "Live Rolling Summary"],
      ["Tagged Metrics Extraction", "Post-Event Brief + Recap", "Podcast"],
    ],
  },
  {
    num: "3", title: "Shadow Mode Flow", color: BLUE,
    lines: [
      ["External Bridge Configured", "Recall.ai Bot Joins Call Silently"],
      ["Audio Captured in Real-time", "AI Transcription + Sentiment"],
      ["Insights Feed to OCC", "Operator Sees Live Analysis", "Zero Disruption"],
    ],
  },
  {
    num: "4", title: "Compliance Engine (every 5 min)", color: RED,
    lines: [
      ["Scan Registrations (fraud)", "Scan Audit Log (anomalies)", "Scan Exports (exfiltration)"],
      ["AI Assesses Severity (GPT-4o)", "Threats Persisted to DB"],
      ["ISO 27001 + SOC 2 Scored", "Predictive Alerts Generated"],
    ],
  },
  {
    num: "5", title: "CRM / Partner API", color: YELLOW,
    lines: [
      ["Partner Gets API Key (clv_)", "REST: Create Registrations"],
      ["Bulk Import (up to 500)", "Webhook on Registration"],
      ["Zero-Click Pre-Register", "Confirmation Emails", "Full Audit Trail"],
    ],
  },
  {
    num: "6", title: "Health Guardian (every 30s)", color: ORANGE,
    lines: [
      ["Check: DB, Twilio, OpenAI, Ably, Recall, Active Events"],
      ["Anomaly Detection (2.5σ threshold)", "Auto-Incident Creation"],
      ["AI Root-Cause Analysis", "Customer Impact Reports", "Cross-feeds Compliance"],
    ],
  },
];

flows.forEach((flow, fi) => {
  const col = fi % 2;
  const row = Math.floor(fi / 2);
  const fx = M + col * (flowW + 20);
  const fy = 80 + row * 230;

  cardBox(fx, fy, flowW, 210, flow.color);

  doc.save();
  doc.circle(fx + 22, fy + 22, 12).fillOpacity(0.2).fill(flow.color);
  doc.restore();
  doc.fontSize(12).font("Helvetica-Bold").fillColor(flow.color).text(flow.num, fx + 14, fy + 16, { width: 16, align: "center" });
  doc.fontSize(11).font("Helvetica-Bold").fillColor(flow.color).text(flow.title, fx + 40, fy + 15, { width: flowW - 56 });

  let stepY = fy + 40;
  flow.lines.forEach((line, li) => {
    line.forEach((step, si) => {
      const stepW = Math.min(140, (flowW - 40) / Math.min(line.length, 3));
      const sx = fx + 16 + si * (stepW + 16);
      const sy = stepY;

      doc.save();
      doc.roundedRect(sx, sy, stepW, 22, 5).fillOpacity(0.15).fill(flow.color);
      doc.restore();
      doc.roundedRect(sx, sy, stepW, 22, 5).lineWidth(0.5).strokeOpacity(0.3).strokeColor(flow.color).stroke();
      doc.fontSize(7).font("Helvetica-Bold").fillColor(flow.color).fillOpacity(1).text(step, sx + 4, sy + 6, { width: stepW - 8, align: "center" });

      if (si < line.length - 1) {
        doc.moveTo(sx + stepW + 2, sy + 11).lineTo(sx + stepW + 12, sy + 11).strokeColor(flow.color).lineWidth(1).strokeOpacity(0.5).stroke();
        doc.moveTo(sx + stepW + 10, sy + 8).lineTo(sx + stepW + 14, sy + 11).lineTo(sx + stepW + 10, sy + 14).fillColor(flow.color).fillOpacity(0.5).fill();
        doc.fillOpacity(1).strokeOpacity(1);
      }
    });
    stepY += 34;
  });
});

// Footer
const footY = 770;
doc.roundedRect(M, footY, CW, 30, 8).fill("#1e2940");
doc.fontSize(9).font("Helvetica-Bold").fillColor("#93c5fd")
  .text("CuraLive © 2026   |   Provisional Patent Filed (CIPC — South Africa)   |   ISO 27001 + SOC 2 Type II   |   Targeting Microsoft / Zoom Acquisition", M, footY + 9, { width: CW, align: "center" });

// Legend
const legendItems = [
  { color: ORANGE, label: "Entry Points" },
  { color: GREEN, label: "Events/Ops" },
  { color: VIOLET, label: "AI/Intelligence" },
  { color: BLUE, label: "Media/Attendee" },
  { color: YELLOW, label: "Business/CRM" },
  { color: RED, label: "Compliance" },
  { color: TEAL, label: "Data Layer" },
];
let lx = M + 200;
legendItems.forEach((item) => {
  doc.circle(lx, footY + 44, 4).fill(item.color);
  doc.fontSize(7.5).font("Helvetica").fillColor(TEXT_DIM).text(item.label, lx + 8, footY + 39);
  lx += 100;
});

doc.end();

stream.on("finish", () => {
  const stats = fs.statSync(outputPath);
  console.log(`PDF saved: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
});
