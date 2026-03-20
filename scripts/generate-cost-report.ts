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

  function addSectionRow(ws: ExcelJS.Worksheet, text: string, colCount: number) {
    const row = ws.addRow([text]);
    ws.mergeCells(row.number, 1, row.number, colCount);
    row.getCell(1).fill = sectionFill;
    row.getCell(1).font = sectionFont;
    row.getCell(1).alignment = { vertical: "middle" };
    row.height = 28;
    return row;
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
    { header: "Fixed Monthly ($)", key: "fixed", width: 16 },
    { header: "Variable Per Event ($)", key: "variable", width: 20 },
  ];
  styleHeader(ws1.getRow(1), 7);

  const services = [
    { service: "Replit Hosting", category: "Hosting", purpose: "Application hosting, deployment, SSL, auto-scaling compute", plan: "Pro / Teams", pricing: "Fixed", fixed: 25.00, variable: 0 },
    { service: "MySQL Database", category: "Database", purpose: "Primary data store — sessions, archives, metrics, AI reports, CIP4 tables", plan: "Managed DB", pricing: "Fixed + Storage", fixed: 15.00, variable: 0 },
    { service: "OpenAI GPT-4o", category: "AI / LLM", purpose: "20-module AI report, crisis prediction, valuation impact, disclosure cert, compliance", plan: "API Pay-as-you-go", pricing: "Per Token", fixed: 0, variable: 2.50 },
    { service: "OpenAI GPT-4o-mini", category: "AI / LLM", purpose: "Evolution engine, advisory bot, Bastion AI, support chat, quick analysis", plan: "API Pay-as-you-go", pricing: "Per Token", fixed: 0, variable: 0.05 },
    { service: "OpenAI Whisper", category: "AI / Transcription", purpose: "Audio/video file transcription for archive uploads", plan: "API Pay-as-you-go", pricing: "Per Minute", fixed: 0, variable: 0.18 },
    { service: "Recall.ai", category: "Meeting Bot", purpose: "Bot joins Zoom/Teams/Meet for live Shadow Mode capture + real-time transcription", plan: "API Pay-as-you-go", pricing: "Per Minute", fixed: 0, variable: 6.00 },
    { service: "Ably Realtime", category: "Messaging", purpose: "Live transcript streaming to operators, OCC notifications, attendee updates", plan: "Free Tier", pricing: "Per Message", fixed: 0, variable: 0 },
    { service: "Resend", category: "Email", purpose: "Transactional emails — intelligence reports, reminders, registration confirmations", plan: "Free (100/day)", pricing: "Per Email", fixed: 0, variable: 0 },
    { service: "Twilio", category: "Voice / Telco", purpose: "Webphone, PSTN conference dial-out, voice bridging", plan: "Pay-as-you-go", pricing: "Per Minute", fixed: 1.00, variable: 0.21 },
    { service: "Telnyx", category: "Voice / Telco", purpose: "Failover carrier for Africa/EMEA, WebRTC/SIP credentials", plan: "Pay-as-you-go", pricing: "Per Minute", fixed: 0, variable: 0.15 },
    { service: "Mux", category: "Video Streaming", purpose: "RTMP live streaming ingest, HLS adaptive playback, recording storage", plan: "Pay-as-you-go", pricing: "Per Minute + Views", fixed: 0, variable: 1.50 },
    { service: "Stripe", category: "Payments", purpose: "Subscription billing, customer management, payment processing", plan: "Standard", pricing: "2.9% + $0.30/txn", fixed: 0, variable: 0 },
    { service: "GitHub", category: "Source Control", purpose: "Repository hosting, version control, CI/CD integration", plan: "Free / Team", pricing: "Fixed", fixed: 0, variable: 0 },
    { service: "Shadow Guardian", category: "Internal Service", purpose: "3-layer resilience — graceful shutdown, startup reconciliation, watchdog timer", plan: "Built-in", pricing: "No cost", fixed: 0, variable: 0 },
    { service: "System Diagnostics", category: "Internal Service", purpose: "15-check health monitoring — DB, AI, APIs, router registry", plan: "Built-in", pricing: "No cost", fixed: 0, variable: 0 },
  ];

  services.forEach((s) => {
    const row = ws1.addRow(s);
    row.getCell(6).numFmt = currencyFmt;
    row.getCell(7).numFmt = currencyFmt;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 7) {
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle", wrapText: true };
      }
    });
  });

  const totalFixedRow = ws1.addRow(["", "", "", "", "TOTAL FIXED", { formula: `SUM(F2:F${ws1.rowCount})` }, ""]);
  totalFixedRow.getCell(5).font = { bold: true };
  totalFixedRow.getCell(6).font = { bold: true };
  totalFixedRow.getCell(6).numFmt = currencyFmt;
  totalFixedRow.eachCell({ includeEmpty: true }, (cell) => { cell.border = thinBorder; });

  const totalVarRow = ws1.addRow(["", "", "", "", "TOTAL PER EVENT", "", { formula: `SUM(G2:G${ws1.rowCount - 1})` }]);
  totalVarRow.getCell(5).font = { bold: true };
  totalVarRow.getCell(7).font = { bold: true };
  totalVarRow.getCell(7).numFmt = currencyFmt;
  totalVarRow.eachCell({ includeEmpty: true }, (cell) => { cell.border = thinBorder; });

  // ─── SHEET 2: Cost by Event Type ───
  const ws2 = wb.addWorksheet("Cost by Event Type", {
    properties: { tabColor: { argb: "FF34d399" } },
  });

  ws2.columns = [
    { header: "Event Type", key: "type", width: 32 },
    { header: "Services Used", key: "services", width: 55 },
    { header: "Recall.ai ($)", key: "recall", width: 14 },
    { header: "OpenAI GPT-4o ($)", key: "gpt4o", width: 16 },
    { header: "OpenAI Mini ($)", key: "mini", width: 14 },
    { header: "Whisper ($)", key: "whisper", width: 12 },
    { header: "Mux ($)", key: "mux", width: 10 },
    { header: "Twilio ($)", key: "twilio", width: 10 },
    { header: "Total Per Event ($)", key: "total", width: 18 },
  ];
  styleHeader(ws2.getRow(1), 9);

  const eventTypes = [
    { type: "Live Shadow Mode (Zoom/Teams/Meet)", services: "Recall bot + Whisper + 20-module AI report + Crisis + Valuation + Disclosure + Ably streaming", recall: 6.00, gpt4o: 2.50, mini: 0.05, whisper: 0, mux: 1.50, twilio: 0.21, total: 10.26 },
    { type: "Archive Upload (Audio/Video)", services: "Whisper transcription + 20-module AI report + Crisis + Valuation + Disclosure", recall: 0, gpt4o: 2.50, mini: 0.05, whisper: 0.18, mux: 0, twilio: 0, total: 2.73 },
    { type: "Transcript Paste (Text Only)", services: "20-module AI report + Crisis + Valuation + Disclosure (no transcription)", recall: 0, gpt4o: 2.50, mini: 0.05, whisper: 0, mux: 0, twilio: 0, total: 2.55 },
    { type: "Advisory Bot Query", services: "Single GPT-4o call with event context retrieval", recall: 0, gpt4o: 0.03, mini: 0, whisper: 0, mux: 0, twilio: 0, total: 0.03 },
    { type: "Monthly Intelligence Report", services: "Aggregation of month's data + GPT-4o analysis + email delivery", recall: 0, gpt4o: 0.15, mini: 0, whisper: 0, mux: 0, twilio: 0, total: 0.15 },
    { type: "Evolution Audit Run", services: "GPT-4o-mini self-assessment + prompt optimization", recall: 0, gpt4o: 0, mini: 0.02, whisper: 0, mux: 0, twilio: 0, total: 0.02 },
  ];

  eventTypes.forEach((e) => {
    const row = ws2.addRow(e);
    for (let c = 3; c <= 9; c++) row.getCell(c).numFmt = currencyFmt;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 9) { cell.border = thinBorder; cell.alignment = { vertical: "middle", wrapText: true }; }
    });
  });

  // ─── SHEET 3: Scaled Monthly Projections ───
  const ws3 = wb.addWorksheet("Monthly Projections", {
    properties: { tabColor: { argb: "FFfbbf24" } },
  });

  ws3.columns = [
    { header: "Scenario", key: "scenario", width: 18 },
    { header: "Live Events", key: "live", width: 14 },
    { header: "Archive Uploads", key: "archives", width: 16 },
    { header: "Transcript Pastes", key: "transcripts", width: 16 },
    { header: "Advisory Queries", key: "advisory", width: 16 },
    { header: "Monthly Reports", key: "reports", width: 14 },
    { header: "Fixed Costs ($)", key: "fixedCost", width: 14 },
    { header: "Recall.ai ($)", key: "recallCost", width: 14 },
    { header: "OpenAI ($)", key: "openaiCost", width: 14 },
    { header: "Mux ($)", key: "muxCost", width: 12 },
    { header: "Twilio ($)", key: "twilioCost", width: 12 },
    { header: "TOTAL Monthly ($)", key: "total", width: 18 },
  ];
  styleHeader(ws3.getRow(1), 12);

  const scenarios = [
    { scenario: "Current / Startup", live: 10, archives: 5, transcripts: 5, advisory: 50, reports: 1 },
    { scenario: "Growth", live: 25, archives: 15, transcripts: 10, advisory: 200, reports: 1 },
    { scenario: "Scale", live: 50, archives: 30, transcripts: 20, advisory: 500, reports: 2 },
    { scenario: "Enterprise", live: 120, archives: 80, transcripts: 50, advisory: 2000, reports: 4 },
    { scenario: "High Enterprise", live: 250, archives: 150, transcripts: 100, advisory: 5000, reports: 8 },
  ];

  scenarios.forEach((s) => {
    const fixed = 41.00;
    const recallCost = s.live * 6.00;
    const openaiGpt4o = (s.live + s.archives + s.transcripts) * 2.50 + s.advisory * 0.03 + s.reports * 0.15;
    const openaiMini = (s.live + s.archives + s.transcripts) * 0.05;
    const whisperCost = s.archives * 0.18;
    const openaiTotal = openaiGpt4o + openaiMini + whisperCost;
    const muxCost = s.live * 1.50;
    const twilioCost = 1.00 + s.live * 0.21;
    const total = fixed + recallCost + openaiTotal + muxCost + twilioCost;

    const row = ws3.addRow({
      ...s,
      fixedCost: fixed,
      recallCost,
      openaiCost: openaiTotal,
      muxCost,
      twilioCost,
      total,
    });
    for (let c = 7; c <= 12; c++) row.getCell(c).numFmt = currencyFmt;
    row.getCell(12).font = { bold: true, size: 12 };
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 12) { cell.border = thinBorder; cell.alignment = { vertical: "middle" }; }
    });
  });

  // ─── SHEET 4: OpenAI Token Breakdown ───
  const ws4 = wb.addWorksheet("OpenAI Token Details", {
    properties: { tabColor: { argb: "FFa78bfa" } },
  });

  ws4.columns = [
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
  styleHeader(ws4.getRow(1), 9);

  const models = [
    { model: "GPT-4o", inputCost: 2.50, outputCost: 10.00, avgInput: 4000, avgOutput: 1500, calls: 25, costPerEvent: 2.50, cost50: 125.00, cost250: 625.00 },
    { model: "GPT-4o-mini", inputCost: 0.15, outputCost: 0.60, avgInput: 2000, avgOutput: 800, calls: 15, costPerEvent: 0.05, cost50: 2.50, cost250: 12.50 },
    { model: "Whisper (audio)", inputCost: 0, outputCost: 0, avgInput: 0, avgOutput: 0, calls: 1, costPerEvent: 0.18, cost50: 9.00, cost250: 45.00 },
    { model: "Gemini 2.5 Flash (fallback)", inputCost: 0.15, outputCost: 0.60, avgInput: 3000, avgOutput: 1000, calls: 0, costPerEvent: 0, cost50: 0, cost250: 0 },
  ];

  models.forEach((m) => {
    const row = ws4.addRow(m);
    [2, 3, 7, 8, 9].forEach((c) => { row.getCell(c).numFmt = currencyFmt; });
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 9) { cell.border = thinBorder; cell.alignment = { vertical: "middle" }; }
    });
  });

  // ─── SHEET 5: Optimization Opportunities ───
  const ws5 = wb.addWorksheet("Optimization", {
    properties: { tabColor: { argb: "FFf87171" } },
  });

  ws5.columns = [
    { header: "Area", key: "area", width: 24 },
    { header: "Current Cost Driver", key: "driver", width: 40 },
    { header: "Optimization Strategy", key: "strategy", width: 50 },
    { header: "Potential Savings", key: "savings", width: 20 },
    { header: "Effort", key: "effort", width: 14 },
  ];
  styleHeader(ws5.getRow(1), 5);

  const opts = [
    { area: "Recall.ai Bot Minutes", driver: "~58% of per-event cost ($6.00/event for 60min)", strategy: "Negotiate volume pricing; local audio capture for <30min events; batch scheduling", savings: "30-50% on bot costs", effort: "Medium" },
    { area: "GPT-4o Model Usage", driver: "25 calls/event at $2.50/event", strategy: "Move 10 lower-priority modules (social media, press release, etc.) to GPT-4o-mini", savings: "~40% on AI costs", effort: "Low" },
    { area: "Report Caching", driver: "Regenerating reports on repeat queries", strategy: "Cache AI reports after first generation; serve cached version for subsequent views", savings: "~$0.50/repeat query", effort: "Low" },
    { area: "Whisper Transcription", driver: "$0.006/min — 30min avg per archive", strategy: "Skip re-transcription of already-processed segments; use cheaper models for draft", savings: "20-30% on whisper", effort: "Low" },
    { area: "Mux Streaming", driver: "$1.50/event for encode + delivery", strategy: "Use Mux only for public webcasts; skip for internal-only Shadow Mode sessions", savings: "Up to 100% for non-webcast", effort: "Low" },
    { area: "Ably Messaging", driver: "Currently free tier (6M msg/mo)", strategy: "Monitor usage — at scale, switch to self-hosted WebSocket if Ably costs increase", savings: "Prevent future $29+/mo", effort: "High" },
    { area: "Advisory Bot Queries", driver: "$0.03/query — can scale with users", strategy: "Use GPT-4o-mini for initial response; escalate to GPT-4o only for complex queries", savings: "~80% per query", effort: "Low" },
    { area: "Monthly Reports", driver: "Currently negligible cost", strategy: "Pre-aggregate metrics daily; reduce token window for monthly synthesis", savings: "Minimal — already low", effort: "Low" },
  ];

  opts.forEach((o) => {
    const row = ws5.addRow(o);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 5) { cell.border = thinBorder; cell.alignment = { vertical: "middle", wrapText: true }; }
    });
  });

  // ─── SHEET 6: Annual Projection ───
  const ws6 = wb.addWorksheet("Annual Projection", {
    properties: { tabColor: { argb: "FF10b981" } },
  });

  ws6.columns = [
    { header: "Month", key: "month", width: 14 },
    { header: "Live Events", key: "live", width: 14 },
    { header: "Archive Uploads", key: "archives", width: 16 },
    { header: "Advisory Queries", key: "advisory", width: 16 },
    { header: "Monthly Cost ($)", key: "monthly", width: 16 },
    { header: "Cumulative ($)", key: "cumulative", width: 16 },
  ];
  styleHeader(ws6.getRow(1), 6);

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
    const recallCost = live * 6.00;
    const openaiCost = (live + archives + transcripts) * 2.55 + advisory * 0.03 + archives * 0.18;
    const muxCost = live * 1.50;
    const twilioCost = 1.00 + live * 0.21;
    const monthly = fixed + recallCost + openaiCost + muxCost + twilioCost;
    cumulative += monthly;

    const row = ws6.addRow({ month, live, archives, advisory, monthly, cumulative });
    row.getCell(5).numFmt = currencyFmt;
    row.getCell(6).numFmt = currencyFmt;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= 6) { cell.border = thinBorder; cell.alignment = { vertical: "middle" }; }
    });
  });

  const annualTotal = ws6.addRow(["ANNUAL TOTAL", "", "", "", "", cumulative]);
  annualTotal.getCell(1).font = { bold: true, size: 12 };
  annualTotal.getCell(6).font = { bold: true, size: 12 };
  annualTotal.getCell(6).numFmt = currencyFmt;
  annualTotal.eachCell({ includeEmpty: true }, (cell) => { cell.border = thinBorder; });

  const outPath = path.resolve("/home/runner/workspace/CuraLive_Infrastructure_Costs.xlsx");
  await wb.xlsx.writeFile(outPath);
  console.log("Excel report written to:", outPath);
}

generateCostReport().catch(console.error);
