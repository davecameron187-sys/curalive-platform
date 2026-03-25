import ExcelJS from "exceljs";
import path from "path";

async function generateCostReport() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "CuraLive Platform";
  wb.created = new Date();

  const headerFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a1f2e" } };
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFe2e8f0" }, size: 11 };
  const sectionFill: ExcelJS.FillPattern = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0f172a" } };
  const sectionFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF60a5fa" }, size: 12 };
  const greenFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FF34d399" }, size: 11 };
  const currencyFmt = '"$"#,##0.00';
  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FF334155" } },
    bottom: { style: "thin", color: { argb: "FF334155" } },
    left: { style: "thin", color: { argb: "FF334155" } },
    right: { style: "thin", color: { argb: "FF334155" } },
  };

  function styleHeader(row: ExcelJS.Row, colCount: number) {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= colCount) {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      }
    });
    row.height = 22;
  }

  function styleRow(row: ExcelJS.Row, colCount: number) {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= colCount) {
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle", wrapText: true };
      }
    });
  }

  // ─── SHEET 1: Service Overview ───
  const ws1 = wb.addWorksheet("Service Overview", {
    properties: { tabColor: { argb: "FF60a5fa" } },
  });

  ws1.columns = [
    { header: "Service / Application", key: "service", width: 28 },
    { header: "Category", key: "category", width: 18 },
    { header: "Purpose in CuraLive", key: "purpose", width: 45 },
    { header: "Current Plan", key: "plan", width: 20 },
    { header: "Pricing Model", key: "pricing", width: 18 },
    { header: "Current Monthly Cost ($)", key: "current", width: 22 },
    { header: "Why $0 Now?", key: "whyFree", width: 40 },
    { header: "Fixed Monthly at Scale ($)", key: "fixed", width: 22 },
    { header: "Variable Per Event ($)", key: "variable", width: 20 },
  ];
  styleHeader(ws1.getRow(1), 9);

  const services = [
    { service: "Replit Hosting", category: "Hosting", purpose: "Application hosting, deployment, SSL, auto-scaling compute", plan: "Replit Plan", pricing: "Fixed", current: 0, whyFree: "Included in current Replit subscription", fixed: 25.00, variable: 0 },
    { service: "MySQL Database", category: "Database", purpose: "Primary data store — sessions, archives, metrics, AI reports, CIP4 tables", plan: "Replit Managed", pricing: "Fixed + Storage", current: 0, whyFree: "Included in Replit environment", fixed: 15.00, variable: 0 },
    { service: "OpenAI GPT-4o", category: "AI / LLM", purpose: "20-module AI report, crisis prediction, valuation impact, disclosure cert", plan: "Replit Integration", pricing: "Per Token", current: 0, whyFree: "Bundled via Replit AI integration — not billed separately", fixed: 0, variable: 2.50 },
    { service: "OpenAI GPT-4o-mini", category: "AI / LLM", purpose: "Evolution engine, advisory bot, Bastion AI, support chat", plan: "Replit Integration", pricing: "Per Token", current: 0, whyFree: "Bundled via Replit AI integration", fixed: 0, variable: 0.05 },
    { service: "OpenAI Whisper", category: "AI / Transcription", purpose: "Audio/video file transcription for archive uploads", plan: "Replit Integration", pricing: "Per Minute", current: 0, whyFree: "Bundled via Replit AI integration", fixed: 0, variable: 0.18 },
    { service: "Recall.ai", category: "Meeting Bot", purpose: "Bot joins Zoom/Teams/Meet for live Shadow Mode capture", plan: "API Key configured", pricing: "Per Minute", current: 0, whyFree: "No high-volume live sessions running yet", fixed: 0, variable: 6.00 },
    { service: "Ably Realtime", category: "Messaging", purpose: "Live transcript streaming, OCC notifications", plan: "Free Tier", pricing: "Per Message", current: 0, whyFree: "Free tier: 6M messages/month", fixed: 0, variable: 0 },
    { service: "Resend", category: "Email", purpose: "Transactional emails — intelligence reports, reminders", plan: "Free Tier", pricing: "Per Email", current: 0, whyFree: "Free tier: 100 emails/day (3,000/month)", fixed: 0, variable: 0 },
    { service: "Twilio", category: "Voice / Telco", purpose: "Webphone, PSTN conference dial-out", plan: "Pay-as-you-go", pricing: "Per Minute", current: 0, whyFree: "No voice calls being made yet", fixed: 1.00, variable: 0.21 },
    { service: "Telnyx", category: "Voice / Telco", purpose: "Failover carrier for Africa/EMEA", plan: "Pay-as-you-go", pricing: "Per Minute", current: 0, whyFree: "No voice calls being made yet", fixed: 0, variable: 0.15 },
    { service: "Mux", category: "Video Streaming", purpose: "RTMP live streaming, HLS playback", plan: "Pay-as-you-go", pricing: "Per Minute + Views", current: 0, whyFree: "No live webcasts running yet", fixed: 0, variable: 1.50 },
    { service: "Stripe", category: "Payments", purpose: "Subscription billing, payment processing", plan: "Standard", pricing: "2.9% + $0.30/txn", current: 0, whyFree: "No transactions processed yet", fixed: 0, variable: 0 },
    { service: "GitHub", category: "Source Control", purpose: "Repository hosting, version control", plan: "Free", pricing: "Free", current: 0, whyFree: "Free for public/private repos", fixed: 0, variable: 0 },
    { service: "Zoom", category: "Meeting Platform", purpose: "Target platform for Shadow Mode live capture", plan: "N/A", pricing: "No cost", current: 0, whyFree: "No integration needed — Recall.ai bot joins via meeting link", fixed: 0, variable: 0 },
    { service: "Microsoft Teams", category: "Meeting Platform", purpose: "Target platform for Shadow Mode live capture", plan: "N/A", pricing: "No cost", current: 0, whyFree: "No integration needed — Recall.ai bot joins via meeting link", fixed: 0, variable: 0 },
    { service: "Google Meet", category: "Meeting Platform", purpose: "Target platform for Shadow Mode live capture", plan: "N/A", pricing: "No cost", current: 0, whyFree: "No integration needed — Recall.ai bot joins via meeting link", fixed: 0, variable: 0 },
    { service: "Webex", category: "Meeting Platform", purpose: "Target platform for Shadow Mode live capture", plan: "N/A", pricing: "No cost", current: 0, whyFree: "No integration needed — Recall.ai bot joins via meeting link", fixed: 0, variable: 0 },
    { service: "Shadow Guardian", category: "Internal Service", purpose: "3-layer resilience — shutdown, reconciliation, watchdog", plan: "Built-in", pricing: "No cost", current: 0, whyFree: "Internal service — no external dependency", fixed: 0, variable: 0 },
    { service: "System Diagnostics", category: "Internal Service", purpose: "15-check health monitoring", plan: "Built-in", pricing: "No cost", current: 0, whyFree: "Internal service — no external dependency", fixed: 0, variable: 0 },
  ];

  services.forEach((s) => {
    const row = ws1.addRow(s);
    row.getCell(6).numFmt = currencyFmt;
    row.getCell(6).font = greenFont;
    row.getCell(8).numFmt = currencyFmt;
    row.getCell(9).numFmt = currencyFmt;
    styleRow(row, 9);
  });

  const totalRow1 = ws1.addRow(["", "", "", "", "TOTALS", 0, "", { formula: `SUM(H2:H${ws1.rowCount})` }, { formula: `SUM(I2:I${ws1.rowCount})` }]);
  totalRow1.getCell(5).font = { bold: true };
  totalRow1.getCell(6).font = { bold: true, color: { argb: "FF34d399" }, size: 14 };
  totalRow1.getCell(6).numFmt = currencyFmt;
  totalRow1.getCell(8).font = { bold: true };
  totalRow1.getCell(8).numFmt = currencyFmt;
  totalRow1.getCell(9).font = { bold: true };
  totalRow1.getCell(9).numFmt = currencyFmt;
  styleRow(totalRow1, 9);

  // ─── SHEET 2: Platform Comparison (Zoom/Teams/Meet) ───
  const ws2 = wb.addWorksheet("Platform Comparison", {
    properties: { tabColor: { argb: "FF818cf8" } },
  });

  ws2.columns = [
    { header: "Platform", key: "platform", width: 22 },
    { header: "Integration Required?", key: "integration", width: 22 },
    { header: "API Subscription Needed?", key: "apiSub", width: 24 },
    { header: "App Marketplace Listing?", key: "marketplace", width: 24 },
    { header: "Platform Fee to CuraLive?", key: "fee", width: 24 },
    { header: "How CuraLive Connects", key: "how", width: 50 },
    { header: "Bot Cost / 30-min Event ($)", key: "cost30", width: 24 },
    { header: "Bot Cost / 60-min Event ($)", key: "cost60", width: 24 },
    { header: "Bot Cost / 120-min Event ($)", key: "cost120", width: 24 },
    { header: "AI Processing Cost ($)", key: "aiCost", width: 22 },
    { header: "Total Cost / 60-min Event ($)", key: "total", width: 24 },
  ];
  styleHeader(ws2.getRow(1), 11);

  const platforms = [
    { platform: "Zoom", integration: "NO", apiSub: "NO", marketplace: "NO", fee: "$0", how: "Recall.ai bot joins via meeting URL as a regular participant. No Zoom API or app approval needed.", cost30: 3.00, cost60: 6.00, cost120: 12.00, aiCost: 2.55, total: 8.55 },
    { platform: "Microsoft Teams", integration: "NO", apiSub: "NO", marketplace: "NO", fee: "$0", how: "Recall.ai bot joins via Teams meeting link. No Azure AD registration or Teams Admin approval needed.", cost30: 3.00, cost60: 6.00, cost120: 12.00, aiCost: 2.55, total: 8.55 },
    { platform: "Google Meet", integration: "NO", apiSub: "NO", marketplace: "NO", fee: "$0", how: "Recall.ai bot joins via Meet link. No Google Workspace API setup needed.", cost30: 3.00, cost60: 6.00, cost120: 12.00, aiCost: 2.55, total: 8.55 },
    { platform: "Webex", integration: "NO", apiSub: "NO", marketplace: "NO", fee: "$0", how: "Recall.ai bot joins via Webex meeting link. No Cisco integration required.", cost30: 3.00, cost60: 6.00, cost120: 12.00, aiCost: 2.55, total: 8.55 },
  ];

  platforms.forEach((p) => {
    const row = ws2.addRow(p);
    [7, 8, 9, 10, 11].forEach((c) => { row.getCell(c).numFmt = currencyFmt; });
    styleRow(row, 11);
  });

  ws2.addRow([]);
  const noteRow1 = ws2.addRow(["KEY TAKEAWAY"]);
  ws2.mergeCells(noteRow1.number, 1, noteRow1.number, 11);
  noteRow1.getCell(1).font = { bold: true, color: { argb: "FFfbbf24" }, size: 12 };

  const notes = [
    "CuraLive does NOT integrate directly with any meeting platform. Recall.ai acts as a universal middle layer.",
    "The Recall.ai bot joins meetings as a regular participant — just like any human attendee.",
    "No API keys, marketplace listings, app approvals, or subscriptions needed from Zoom, Teams, Meet, or Webex.",
    "If Recall.ai adds support for a new platform, CuraLive automatically supports it with zero development work.",
    "The cost is identical across all platforms: $0.10/minute of bot time (Recall.ai) + AI processing (OpenAI).",
    "Meeting hosts don't need to do anything special — the bot joins via the standard meeting link.",
  ];
  notes.forEach((note) => {
    const r = ws2.addRow([note]);
    ws2.mergeCells(r.number, 1, r.number, 11);
    r.getCell(1).font = { size: 11, color: { argb: "FF94a3b8" } };
    r.getCell(1).alignment = { wrapText: true };
  });

  // ─── SHEET 3: Cost by Event Type ───
  const ws3 = wb.addWorksheet("Cost by Event Type", {
    properties: { tabColor: { argb: "FF34d399" } },
  });

  ws3.columns = [
    { header: "Event Type", key: "type", width: 38 },
    { header: "Platform", key: "platform", width: 20 },
    { header: "Services Used", key: "services", width: 55 },
    { header: "Platform Integration Cost ($)", key: "platformCost", width: 26 },
    { header: "Recall.ai Bot ($)", key: "recall", width: 16 },
    { header: "OpenAI GPT-4o ($)", key: "gpt4o", width: 16 },
    { header: "OpenAI Mini ($)", key: "mini", width: 14 },
    { header: "Whisper ($)", key: "whisper", width: 12 },
    { header: "Mux ($)", key: "mux", width: 10 },
    { header: "Total Per Event ($)", key: "total", width: 18 },
  ];
  styleHeader(ws3.getRow(1), 10);

  const eventTypes = [
    { type: "Live Shadow Mode — Zoom", platform: "Zoom", services: "Recall bot + 20-module AI report + Crisis + Valuation + Disclosure", platformCost: 0, recall: 6.00, gpt4o: 2.50, mini: 0.05, whisper: 0, mux: 1.50, total: 10.05 },
    { type: "Live Shadow Mode — Teams", platform: "Microsoft Teams", services: "Recall bot + 20-module AI report + Crisis + Valuation + Disclosure", platformCost: 0, recall: 6.00, gpt4o: 2.50, mini: 0.05, whisper: 0, mux: 1.50, total: 10.05 },
    { type: "Live Shadow Mode — Google Meet", platform: "Google Meet", services: "Recall bot + 20-module AI report + Crisis + Valuation + Disclosure", platformCost: 0, recall: 6.00, gpt4o: 2.50, mini: 0.05, whisper: 0, mux: 1.50, total: 10.05 },
    { type: "Live Shadow Mode — Webex", platform: "Webex", services: "Recall bot + 20-module AI report + Crisis + Valuation + Disclosure", platformCost: 0, recall: 6.00, gpt4o: 2.50, mini: 0.05, whisper: 0, mux: 1.50, total: 10.05 },
    { type: "Archive Upload (Audio/Video)", platform: "Any / Offline", services: "Whisper transcription + full AI report pipeline", platformCost: 0, recall: 0, gpt4o: 2.50, mini: 0.05, whisper: 0.18, mux: 0, total: 2.73 },
    { type: "Transcript Paste (Text Only)", platform: "Any / Offline", services: "AI report pipeline only (no transcription needed)", platformCost: 0, recall: 0, gpt4o: 2.50, mini: 0.05, whisper: 0, mux: 0, total: 2.55 },
    { type: "Advisory Bot Query", platform: "N/A", services: "Single GPT-4o call with context retrieval", platformCost: 0, recall: 0, gpt4o: 0.03, mini: 0, whisper: 0, mux: 0, total: 0.03 },
    { type: "Monthly Intelligence Report", platform: "N/A", services: "Data aggregation + GPT-4o analysis + email", platformCost: 0, recall: 0, gpt4o: 0.15, mini: 0, whisper: 0, mux: 0, total: 0.15 },
  ];

  eventTypes.forEach((e) => {
    const row = ws3.addRow(e);
    for (let c = 4; c <= 10; c++) row.getCell(c).numFmt = currencyFmt;
    row.getCell(4).font = greenFont;
    styleRow(row, 10);
  });

  // ─── SHEET 4: Scaled Monthly Projections ───
  const ws4 = wb.addWorksheet("Monthly Projections", {
    properties: { tabColor: { argb: "FFfbbf24" } },
  });

  ws4.columns = [
    { header: "Scenario", key: "scenario", width: 18 },
    { header: "Live Events", key: "live", width: 14 },
    { header: "Archive Uploads", key: "archives", width: 16 },
    { header: "Transcript Pastes", key: "transcripts", width: 16 },
    { header: "Advisory Queries", key: "advisory", width: 16 },
    { header: "Monthly Reports", key: "reports", width: 14 },
    { header: "Platform Fees ($)", key: "platformFees", width: 16 },
    { header: "Fixed Costs ($)", key: "fixedCost", width: 14 },
    { header: "Recall.ai ($)", key: "recallCost", width: 14 },
    { header: "OpenAI ($)", key: "openaiCost", width: 14 },
    { header: "Mux ($)", key: "muxCost", width: 12 },
    { header: "Twilio ($)", key: "twilioCost", width: 12 },
    { header: "TOTAL Monthly ($)", key: "total", width: 18 },
  ];
  styleHeader(ws4.getRow(1), 13);

  const scenarios = [
    { scenario: "Current (Today)", live: 0, archives: 0, transcripts: 0, advisory: 0, reports: 0 },
    { scenario: "Startup", live: 10, archives: 5, transcripts: 5, advisory: 50, reports: 1 },
    { scenario: "Growth", live: 25, archives: 15, transcripts: 10, advisory: 200, reports: 1 },
    { scenario: "Scale", live: 50, archives: 30, transcripts: 20, advisory: 500, reports: 2 },
    { scenario: "Enterprise", live: 120, archives: 80, transcripts: 50, advisory: 2000, reports: 4 },
    { scenario: "High Enterprise", live: 250, archives: 150, transcripts: 100, advisory: 5000, reports: 8 },
  ];

  scenarios.forEach((s) => {
    const fixed = s.live === 0 ? 0 : 41.00;
    const platformFees = 0;
    const recallCost = s.live * 6.00;
    const openaiGpt4o = (s.live + s.archives + s.transcripts) * 2.50 + s.advisory * 0.03 + s.reports * 0.15;
    const openaiMini = (s.live + s.archives + s.transcripts) * 0.05;
    const whisperCost = s.archives * 0.18;
    const openaiTotal = openaiGpt4o + openaiMini + whisperCost;
    const muxCost = s.live * 1.50;
    const twilioCost = s.live === 0 ? 0 : 1.00 + s.live * 0.21;
    const total = fixed + platformFees + recallCost + openaiTotal + muxCost + twilioCost;

    const row = ws4.addRow({
      ...s,
      platformFees,
      fixedCost: fixed,
      recallCost,
      openaiCost: openaiTotal,
      muxCost,
      twilioCost,
      total,
    });
    for (let c = 7; c <= 13; c++) row.getCell(c).numFmt = currencyFmt;
    row.getCell(7).font = greenFont;
    row.getCell(13).font = { bold: true, size: 12 };
    if (s.live === 0) {
      row.getCell(13).font = { bold: true, size: 14, color: { argb: "FF34d399" } };
    }
    styleRow(row, 13);
  });

  // ─── SHEET 5: OpenAI Token Breakdown ───
  const ws5 = wb.addWorksheet("OpenAI Token Details", {
    properties: { tabColor: { argb: "FFa78bfa" } },
  });

  ws5.columns = [
    { header: "Model", key: "model", width: 22 },
    { header: "Input Cost ($/1M tokens)", key: "inputCost", width: 22 },
    { header: "Output Cost ($/1M tokens)", key: "outputCost", width: 22 },
    { header: "Avg Input Tokens/Call", key: "avgInput", width: 20 },
    { header: "Avg Output Tokens/Call", key: "avgOutput", width: 20 },
    { header: "Calls Per Event", key: "calls", width: 16 },
    { header: "Cost Per Event ($)", key: "costPerEvent", width: 16 },
    { header: "Cost @ 50 Events/Mo ($)", key: "cost50", width: 20 },
    { header: "Cost @ 250 Events/Mo ($)", key: "cost250", width: 22 },
  ];
  styleHeader(ws5.getRow(1), 9);

  const models = [
    { model: "GPT-4o", inputCost: 2.50, outputCost: 10.00, avgInput: 4000, avgOutput: 1500, calls: 25, costPerEvent: 2.50, cost50: 125.00, cost250: 625.00 },
    { model: "GPT-4o-mini", inputCost: 0.15, outputCost: 0.60, avgInput: 2000, avgOutput: 800, calls: 15, costPerEvent: 0.05, cost50: 2.50, cost250: 12.50 },
    { model: "Whisper (audio)", inputCost: 0, outputCost: 0, avgInput: 0, avgOutput: 0, calls: 1, costPerEvent: 0.18, cost50: 9.00, cost250: 45.00 },
    { model: "Gemini 2.5 Flash (fallback)", inputCost: 0.15, outputCost: 0.60, avgInput: 3000, avgOutput: 1000, calls: 0, costPerEvent: 0, cost50: 0, cost250: 0 },
  ];

  models.forEach((m) => {
    const row = ws5.addRow(m);
    [2, 3, 7, 8, 9].forEach((c) => { row.getCell(c).numFmt = currencyFmt; });
    styleRow(row, 9);
  });

  // ─── SHEET 6: Optimization Opportunities ───
  const ws6 = wb.addWorksheet("Optimization", {
    properties: { tabColor: { argb: "FFf87171" } },
  });

  ws6.columns = [
    { header: "Area", key: "area", width: 24 },
    { header: "Current Cost Driver", key: "driver", width: 40 },
    { header: "Optimization Strategy", key: "strategy", width: 50 },
    { header: "Potential Savings", key: "savings", width: 20 },
    { header: "Effort", key: "effort", width: 14 },
  ];
  styleHeader(ws6.getRow(1), 5);

  const opts = [
    { area: "Recall.ai Bot Minutes", driver: "~58% of per-event cost ($6.00/event for 60min)", strategy: "Negotiate volume pricing; local audio capture for <30min events; batch scheduling", savings: "30-50% on bot costs", effort: "Medium" },
    { area: "GPT-4o Model Usage", driver: "25 calls/event at $2.50/event", strategy: "Move 10 lower-priority modules (social media, press release) to GPT-4o-mini", savings: "~40% on AI costs", effort: "Low" },
    { area: "Report Caching", driver: "Regenerating reports on repeat queries", strategy: "Cache AI reports after first generation; serve cached for subsequent views", savings: "~$0.50/repeat query", effort: "Low" },
    { area: "Whisper Transcription", driver: "$0.006/min — 30min avg per archive", strategy: "Skip re-transcription of already-processed segments", savings: "20-30% on whisper", effort: "Low" },
    { area: "Mux Streaming", driver: "$1.50/event for encode + delivery", strategy: "Use Mux only for public webcasts; skip for Shadow Mode-only sessions", savings: "Up to 100% for non-webcast", effort: "Low" },
    { area: "Ably Messaging", driver: "Currently free tier (6M msg/mo)", strategy: "Monitor usage — at scale, consider self-hosted WebSocket", savings: "Prevent future $29+/mo", effort: "High" },
    { area: "Advisory Bot Queries", driver: "$0.03/query — scales with users", strategy: "Use GPT-4o-mini for initial response; GPT-4o only for complex queries", savings: "~80% per query", effort: "Low" },
    { area: "Platform Integration", driver: "$0 — no direct platform costs", strategy: "Maintain Recall.ai abstraction layer; avoid building native Zoom/Teams apps", savings: "Avoids $10K+/yr dev cost", effort: "None" },
  ];

  opts.forEach((o) => {
    const row = ws6.addRow(o);
    styleRow(row, 5);
  });

  // ─── SHEET 7: Annual Projection ───
  const ws7 = wb.addWorksheet("Annual Projection", {
    properties: { tabColor: { argb: "FF10b981" } },
  });

  ws7.columns = [
    { header: "Month", key: "month", width: 14 },
    { header: "Live Events", key: "live", width: 14 },
    { header: "Archive Uploads", key: "archives", width: 16 },
    { header: "Advisory Queries", key: "advisory", width: 16 },
    { header: "Platform Fees ($)", key: "platformFees", width: 16 },
    { header: "Monthly Cost ($)", key: "monthly", width: 16 },
    { header: "Cumulative ($)", key: "cumulative", width: 16 },
  ];
  styleHeader(ws7.getRow(1), 7);

  const months = [
    "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026",
    "Oct 2026", "Nov 2026", "Dec 2026", "Jan 2027", "Feb 2027", "Mar 2027",
  ];
  let cumulative = 0;
  months.forEach((month, i) => {
    const growthFactor = 1 + i * 0.15;
    const live = Math.round(10 * growthFactor);
    const archives = Math.round(5 * growthFactor);
    const advisory = Math.round(50 * growthFactor);
    const transcripts = Math.round(5 * growthFactor);

    const fixed = 41.00;
    const platformFees = 0;
    const recallCost = live * 6.00;
    const openaiCost = (live + archives + transcripts) * 2.55 + advisory * 0.03 + archives * 0.18;
    const muxCost = live * 1.50;
    const twilioCost = 1.00 + live * 0.21;
    const monthly = fixed + platformFees + recallCost + openaiCost + muxCost + twilioCost;
    cumulative += monthly;

    const row = ws7.addRow({ month, live, archives, advisory, platformFees, monthly, cumulative });
    row.getCell(5).numFmt = currencyFmt;
    row.getCell(5).font = greenFont;
    row.getCell(6).numFmt = currencyFmt;
    row.getCell(7).numFmt = currencyFmt;
    styleRow(row, 7);
  });

  const annualTotal = ws7.addRow(["ANNUAL TOTAL", "", "", "", 0, "", cumulative]);
  annualTotal.getCell(1).font = { bold: true, size: 12 };
  annualTotal.getCell(5).font = greenFont;
  annualTotal.getCell(5).numFmt = currencyFmt;
  annualTotal.getCell(7).font = { bold: true, size: 12 };
  annualTotal.getCell(7).numFmt = currencyFmt;
  styleRow(annualTotal, 7);

  const outPath = path.resolve("/home/runner/workspace/CuraLive_Infrastructure_Costs.xlsx");
  await wb.xlsx.writeFile(outPath);
  console.log("Excel report written to:", outPath);
}

generateCostReport().catch(console.error);
