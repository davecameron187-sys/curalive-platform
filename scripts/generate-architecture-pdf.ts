// @ts-nocheck
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const ORANGE = "#f97316";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const VIOLET = "#8b5cf6";
const TEAL = "#14b8a6";
const RED = "#ef4444";
const YELLOW = "#eab308";
const GREY = "#71717a";
const DARK = "#2d3436";
const TEXT_DIM = "#a1a1aa";
const TEXT_MUTED = "#71717a";
const CARD_BG = "#1e2028";

const W = 1400;
const H = 1050;
const assetsDir = path.resolve("docs/diagram-assets-small");

const doc = new PDFDocument({
  size: [W, H],
  margins: { top: 20, bottom: 20, left: 20, right: 20 },
  bufferPages: true,
});

const outputPath = "docs/CuraLive-System-Architecture.pdf";
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

function drawBg() {
  doc.rect(0, 0, W, H).fill(DARK);
}

function drawImg(file: string, x: number, y: number, w: number) {
  const filePath = path.join(assetsDir, file);
  if (fs.existsSync(filePath)) {
    doc.image(filePath, x, y, { width: w });
  }
}

function label(x: number, y: number, text: string, color: string, size = 12, bold = true) {
  doc.fontSize(size).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(color).text(text, x, y, { width: 180, align: "center" });
}

function sublabel(x: number, y: number, text: string, w = 180) {
  doc.fontSize(8).font("Helvetica").fillColor(TEXT_DIM).text(text, x, y, { width: w, align: "center", lineGap: 2 });
}

function connLabel(x: number, y: number, text: string, color: string) {
  const tw = doc.fontSize(7.5).font("Helvetica-Bold").widthOfString(text);
  const pw = tw + 14;
  doc.roundedRect(x - pw / 2, y - 8, pw, 16, 8).fillOpacity(0.9).fill(CARD_BG);
  doc.fillOpacity(1);
  doc.roundedRect(x - pw / 2, y - 8, pw, 16, 8).lineWidth(0.8).strokeColor(color).strokeOpacity(0.4).stroke();
  doc.strokeOpacity(1);
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(color).text(text, x - pw / 2, y - 5, { width: pw, align: "center" });
}

function detailBox(x: number, y: number, w: number, title: string, items: string[], color: string) {
  const titleSize = 12;
  const itemSize = 10;
  const itemGap = 18;
  const h = 30 + items.length * itemGap;
  doc.save();
  doc.roundedRect(x, y, w, h, 10).fillOpacity(0.9).fill(CARD_BG);
  doc.fillOpacity(1);
  doc.roundedRect(x, y, w, h, 10).lineWidth(1).strokeColor(color).strokeOpacity(0.3).stroke();
  doc.strokeOpacity(1);
  doc.restore();
  doc.fontSize(titleSize).font("Helvetica-Bold").fillColor(color).text(title, x + 14, y + 10, { width: w - 28 });
  items.forEach((item, i) => {
    doc.fontSize(itemSize).font("Helvetica").fillColor(TEXT_DIM).text(`>  ${item}`, x + 16, y + 32 + i * itemGap, { width: w - 32 });
  });
}

function curvedLine(x1: number, y1: number, cx1: number, cy1: number, cx2: number, cy2: number, x2: number, y2: number, color: string, width = 2, dash = true) {
  doc.save();
  const p = doc.moveTo(x1, y1).bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  p.lineWidth(width).strokeColor(color).strokeOpacity(0.65);
  if (dash) p.dash(7, { space: 4 });
  p.stroke();
  doc.restore();
  doc.undash();

  const dx = x2 - cx2;
  const dy = y2 - cy2;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ndx = dx / len;
  const ndy = dy / len;
  const as = 6;
  doc.save();
  doc.moveTo(x2, y2)
    .lineTo(x2 - as * ndx + as * 0.5 * ndy, y2 - as * ndy - as * 0.5 * ndx)
    .lineTo(x2 - as * ndx - as * 0.5 * ndy, y2 - as * ndy + as * 0.5 * ndx)
    .fillColor(color).fillOpacity(0.7).fill();
  doc.fillOpacity(1);
  doc.restore();
}

// ========== PAGE 1: VISUAL DIAGRAM ==========
drawBg();

// Title
doc.fontSize(36).font("Helvetica-Bold").fillColor("white").text("CuraLive", 0, 18, { width: W, align: "center" });
doc.fontSize(11).font("Helvetica").fillColor(TEXT_MUTED).text("Real-Time Investor Events Platform  |  Complete System Architecture", 0, 56, { width: W, align: "center" });

// ===== Connection lines (drawn first, behind icons) =====
// Browser -> Server
curvedLine(170, 230, 170, 330, 500, 340, 520, 370, ORANGE);
// Phone -> Server
curvedLine(380, 240, 380, 310, 530, 340, 560, 370, ORANGE);
// Shadow -> Server
curvedLine(660, 220, 660, 310, 620, 340, 610, 370, VIOLET);
// Mobile -> Server
curvedLine(930, 240, 930, 320, 700, 340, 660, 370, ORANGE);
// API -> Server
curvedLine(1180, 220, 1180, 310, 760, 340, 700, 370, YELLOW);

// Server -> AI Brain
curvedLine(510, 510, 430, 550, 280, 560, 230, 580, VIOLET, 2.5, false);
// Server -> Database
curvedLine(620, 520, 620, 580, 640, 620, 650, 640, TEAL, 2.5, false);
// Server -> Shield
curvedLine(730, 510, 830, 550, 1020, 560, 1070, 580, RED, 2.5, false);

// Server -> Integrations
curvedLine(620, 520, 620, 780, 640, 850, 650, 880, GREEN, 2, true);

// AI -> DB cross
curvedLine(280, 720, 400, 760, 550, 760, 620, 730, VIOLET, 1.5, true);
// Shield -> DB cross
curvedLine(1050, 720, 900, 760, 720, 760, 680, 730, RED, 1.5, true);
// AI <-> Shield
doc.save();
doc.moveTo(330, 660).bezierCurveTo(500, 630, 900, 630, 1050, 660)
  .lineWidth(1).strokeColor(GREY).strokeOpacity(0.25).dash(4, { space: 4 }).stroke();
doc.restore();
doc.undash();

// ===== Icons and Labels =====

// Browser
drawImg("icon-browser.png", 100, 100, 120);
label(80, 228, "Web Browser", ORANGE, 11);
sublabel(80, 244, "Operator, Admin & Attendee\nDashboard, OCC, Event Rooms");

// Phone
drawImg("icon-phone.png", 320, 110, 105);
label(290, 228, "Phone Dial-In", ORANGE, 11);
sublabel(290, 244, "Conference bridge\nwith unique PIN");

// Shadow Mode
drawImg("icon-shadow.png", 590, 80, 120);
label(570, 210, "Shadow Mode", VIOLET, 11);
sublabel(570, 226, "Recall.ai bot joins\nexternal calls silently");

// Mobile
drawImg("icon-mobile.png", 880, 110, 105);
label(850, 228, "Mobile Room", ORANGE, 11);
sublabel(850, 244, "5-panel swipe:\nVideo, Transcript, Q&A");

// CRM API
drawImg("icon-api.png", 1120, 80, 120);
label(1100, 210, "CRM / Partner API", YELLOW, 11);
sublabel(1100, 226, "REST + Webhooks\nAPI Key auth (clv_)");

// Server (center)
drawImg("icon-server.png", 530, 350, 160);
label(520, 515, "Express + tRPC", BLUE, 14);
sublabel(520, 533, "45+ Routers | Port 5000\nReact 19 + Vite Frontend");

// AI Brain (bottom left)
drawImg("icon-ai-brain.png", 130, 570, 160);
label(110, 735, "AI Agentic Brain", VIOLET, 12);
sublabel(110, 751, "OpenAI GPT-4o\nSentiment | Transcription\nIntelligence Terminal");

// Database (bottom center)
drawImg("icon-database.png", 570, 630, 130);
label(540, 765, "MySQL Database", TEAL, 12);
sublabel(540, 781, "Drizzle ORM | 80+ Tables\n2,700+ schema lines");

// Shield (bottom right)
drawImg("icon-shield.png", 1000, 570, 160);
label(980, 735, "Compliance & Security", RED, 12);
sublabel(980, 751, "ISO 27001 + SOC 2\nAI Threat Detection (5-min)\nHealth Guardian (30s)");

// Integrations
drawImg("icon-integrations.png", 580, 870, 100);
label(540, 975, "External Integrations", GREEN, 11);
sublabel(540, 991, "Twilio | Ably | Mux\nStripe | Recall.ai | GitHub");

// ===== Connection Labels =====
connLabel(280, 300, "HTTP / WebSocket", ORANGE);
connLabel(500, 325, "tRPC Calls", ORANGE);
connLabel(780, 300, "Audio Stream", VIOLET);
connLabel(1050, 300, "REST API (clv_***)", YELLOW);
connLabel(380, 560, "GPT-4o Analysis", VIOLET);
connLabel(770, 560, "SQL via Drizzle", TEAL);
connLabel(700, 640, "Cross-feed", GREY);

// ===== Detail Boxes =====
detailBox(16, 300, 195, "Frontend Pages", [
  "Dashboard & OCC",
  "Webcast Studio",
  "Event Scheduler / Bookings",
  "Intelligence Terminal",
  "Tagged Metrics",
  "Compliance Engine",
  "Health Guardian",
  "Billing / Admin",
  "Client Portal",
], GREEN);

detailBox(1190, 300, 195, "Backend Routers (45+)", [
  "occ / events / webcast",
  "registrations / scheduling",
  "agenticBrain / sentiment",
  "transcription / shadowMode",
  "complianceEngine",
  "soc2 / iso27001",
  "healthGuardian",
  "billing / crmApi / mailing",
  "mux / ably / recall",
], BLUE);

detailBox(1190, 610, 195, "Security Features", [
  "Compliance Engine (5-min)",
  "Registration fraud detection",
  "Access anomaly monitoring",
  "Data exfiltration alerts",
  "AI threat assessment",
  "Health Guardian (30s)",
  "Anomaly detection (2.5σ)",
  "Auto-incident + root cause",
], RED);

detailBox(16, 800, 180, "AI Services", [
  "Live Transcription",
  "Per-speaker Sentiment",
  "Speaking Pace Coach",
  "Q&A Auto-Triage",
  "Content Generation",
  "Event Brief / Recap",
  "Predictive Analytics",
  "Language Dubber (8 langs)",
], VIOLET);

// Footer
doc.roundedRect(200, H - 38, W - 400, 26, 8).fill("#1e2940");
doc.fontSize(8.5).font("Helvetica-Bold").fillColor("#93c5fd")
  .text("CuraLive © 2026  |  CIPC Patent Filed  |  ISO 27001 + SOC 2 Type II  |  Targeting Microsoft / Zoom Acquisition", 200, H - 32, { width: W - 400, align: "center" });

doc.end();

stream.on("finish", () => {
  const stats = fs.statSync(outputPath);
  console.log(`PDF saved: ${outputPath}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
});
