interface BrandConfig {
  displayName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
}

const defaultBrand: BrandConfig = {
  displayName: "CuraLive",
  primaryColor: "#1a1a2e",
  accentColor: "#6b21a8",
  fontFamily: "Inter, system-ui, sans-serif",
};

function baseLayout(brand: BrandConfig, content: string): string {
  const b = { ...defaultBrand, ...brand };
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; font-family:${b.fontFamily}; background:#f4f4f8; color:#1a1a2e; }
  .container { max-width:640px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; }
  .header { background:${b.primaryColor}; padding:24px 32px; text-align:center; }
  .header img { max-height:40px; }
  .header h1 { color:#fff; font-size:18px; margin:8px 0 0; }
  .body { padding:32px; }
  .footer { background:#f8f8fc; padding:16px 32px; text-align:center; font-size:12px; color:#888; }
  .btn { display:inline-block; background:${b.accentColor}; color:#fff !important; padding:12px 28px; border-radius:6px; text-decoration:none; font-weight:600; margin:16px 0; }
  .flag { background:#fef2f2; border-left:4px solid #dc2626; padding:12px 16px; margin:8px 0; border-radius:4px; }
  .flag.critical { border-left-color:#dc2626; }
  .flag.high { border-left-color:#f59e0b; }
  .metric-card { display:inline-block; background:#f8f8fc; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; text-align:center; min-width:100px; margin:4px; }
  .metric-value { font-size:20px; font-weight:800; color:${b.accentColor}; }
  .metric-label { font-size:11px; color:#888; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  th,td { text-align:left; padding:8px 12px; border-bottom:1px solid #eee; font-size:14px; }
  th { background:#f8f8fc; font-weight:600; }
</style>
</head><body>
<div class="container">
  <div class="header">
    ${b.logoUrl ? `<img src="${b.logoUrl}" alt="${b.displayName}">` : `<h1>${b.displayName}</h1>`}
  </div>
  <div class="body">${content}</div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${b.displayName}. All rights reserved.</p>
    <p>Real-time investor events intelligence</p>
  </div>
</div>
</body></html>`;
}

export function buildLiveDashboardEmail(opts: {
  recipientName: string;
  eventName: string;
  companyName: string;
  eventDate: string;
  liveUrl: string;
  brand?: BrandConfig;
}): string {
  return baseLayout(opts.brand ?? {}, `
    <h2>Live Intelligence Dashboard</h2>
    <p>Dear ${opts.recipientName},</p>
    <p>Your live intelligence dashboard for <strong>${opts.eventName}</strong> (${opts.companyName}) on ${opts.eventDate} is now active.</p>
    <p>Access your personalised live intelligence feed, including real-time transcript, sentiment analysis, compliance monitoring, and AI-powered insights.</p>
    <p style="text-align:center"><a class="btn" href="${opts.liveUrl}">Open Live Dashboard</a></p>
    <p style="font-size:13px;color:#666">This link is unique to you. Do not share it.</p>
  `);
}

export function buildReportEmail(opts: {
  recipientName: string;
  eventName: string;
  companyName: string;
  eventDate: string;
  reportUrl: string;
  reportModules: number;
  complianceFlags: number;
  sessionDuration: string;
  sentimentScore?: number | null;
  riskFactors?: number;
  actionItems?: number;
  executiveSummary?: string;
  brand?: BrandConfig;
}): string {
  const sentimentColor = (opts.sentimentScore ?? 50) >= 70 ? "#10b981" : (opts.sentimentScore ?? 50) >= 50 ? "#f59e0b" : "#ef4444";
  const sentimentLabel = (opts.sentimentScore ?? 50) >= 70 ? "Positive" : (opts.sentimentScore ?? 50) >= 50 ? "Neutral" : "Negative";
  const compColor = opts.complianceFlags > 3 ? "#dc2626" : opts.complianceFlags > 0 ? "#f59e0b" : "#10b981";

  const metricsRow = `
    <table style="width:100%;margin:16px 0;"><tr>
      ${opts.sentimentScore != null ? `<td style="padding:4px;text-align:center;">
        <div class="metric-card">
          <div class="metric-value" style="color:${sentimentColor}">${opts.sentimentScore}/100</div>
          <div class="metric-label">${sentimentLabel}</div>
        </div>
      </td>` : ""}
      <td style="padding:4px;text-align:center;">
        <div class="metric-card">
          <div class="metric-value" style="color:${compColor}">${opts.complianceFlags}</div>
          <div class="metric-label">Compliance Flags</div>
        </div>
      </td>
      ${opts.riskFactors != null ? `<td style="padding:4px;text-align:center;">
        <div class="metric-card">
          <div class="metric-value">${opts.riskFactors}</div>
          <div class="metric-label">Risk Factors</div>
        </div>
      </td>` : ""}
      ${opts.actionItems != null ? `<td style="padding:4px;text-align:center;">
        <div class="metric-card">
          <div class="metric-value">${opts.actionItems}</div>
          <div class="metric-label">Action Items</div>
        </div>
      </td>` : ""}
    </tr></table>`;

  const execBlock = opts.executiveSummary ? `
    <div style="background:#f8f8fc;border-left:4px solid ${(opts.brand ?? defaultBrand).accentColor ?? "#6b21a8"};padding:16px;border-radius:4px;margin:16px 0;">
      <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:600;">AI Intelligence Verdict</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#333;">${opts.executiveSummary}</p>
    </div>` : "";

  return baseLayout(opts.brand ?? {}, `
    <h2>Post-Event Intelligence Report</h2>
    <p>Dear ${opts.recipientName},</p>
    <p>Your comprehensive intelligence report for <strong>${opts.eventName}</strong> (${opts.companyName}) on ${opts.eventDate} is ready.</p>
    ${metricsRow}
    ${execBlock}
    <table>
      <tr><th>Report Modules</th><td>${opts.reportModules}</td></tr>
      <tr><th>Session Duration</th><td>${opts.sessionDuration}</td></tr>
    </table>
    <p style="text-align:center"><a class="btn" href="${opts.reportUrl}">View Full Report</a></p>
    <p style="font-size:13px;color:#666">This report will be available for 30 days. This link is unique to you.</p>
  `);
}

export function buildComplianceCloseEmail(opts: {
  recipientName: string;
  companyName: string;
  eventName: string;
  flags: { title: string; body: string; severity: string }[];
  deadlines: { action: string; hours: number; jurisdiction: string }[];
  brand?: BrandConfig;
}): string {
  const flagsHtml = opts.flags.map(f => `
    <div class="flag ${f.severity}">
      <strong>${f.severity.toUpperCase()}: ${f.title}</strong>
      <p style="margin:4px 0 0;font-size:13px">${f.body}</p>
    </div>
  `).join("");

  const deadlinesHtml = opts.deadlines.length > 0 ? `
    <h3>Compliance Deadlines</h3>
    <table>
      <tr><th>Action</th><th>Deadline</th><th>Jurisdiction</th></tr>
      ${opts.deadlines.map(d => `<tr><td>${d.action}</td><td>${d.hours}h</td><td>${d.jurisdiction}</td></tr>`).join("")}
    </table>
  ` : "";

  return baseLayout(opts.brand ?? {}, `
    <h2 style="color:#dc2626">Compliance Alert — Immediate Action Required</h2>
    <p>Dear ${opts.recipientName},</p>
    <p>The following compliance flags were raised during <strong>${opts.eventName}</strong> (${opts.companyName}) and require your immediate attention.</p>
    ${flagsHtml}
    ${deadlinesHtml}
    <p style="font-size:13px;color:#666">This is an automated compliance notification. Please review and action within the specified deadlines.</p>
  `);
}

export function buildPreBriefingEmail(opts: {
  recipientName: string;
  eventName: string;
  companyName: string;
  scheduledTime: string;
  briefingSummary: string;
  complianceHotspots?: { area: string; riskLevel: string; description: string }[];
  predictedQuestions?: { topic: string; question: string; riskLevel: string }[];
  readinessScore?: number;
  liveUrl?: string;
  brand?: BrandConfig;
}): string {
  const hotspotsHtml = opts.complianceHotspots?.length ? `
    <h3 style="margin-top:24px;">Compliance Hotspots</h3>
    ${opts.complianceHotspots.map(h => {
      const col = h.riskLevel === "high" ? "#dc2626" : h.riskLevel === "medium" ? "#f59e0b" : "#10b981";
      return `<div style="border-left:3px solid ${col};padding:8px 12px;margin:8px 0;background:#fafafa;border-radius:4px;">
        <p style="margin:0;font-size:13px;"><strong>${h.area}</strong> <span style="color:${col};font-size:11px;font-weight:700;text-transform:uppercase;margin-left:8px;">${h.riskLevel}</span></p>
        <p style="margin:4px 0 0;font-size:13px;color:#555;">${h.description}</p>
      </div>`;
    }).join("")}` : "";

  const questionsHtml = opts.predictedQuestions?.length ? `
    <h3 style="margin-top:24px;">Predicted Questions</h3>
    ${opts.predictedQuestions.slice(0, 5).map(q => {
      const col = q.riskLevel === "high" ? "#dc2626" : q.riskLevel === "medium" ? "#f59e0b" : "#10b981";
      return `<div style="padding:8px 0;border-bottom:1px solid #eee;">
        <p style="margin:0;font-size:13px;font-weight:600;">${q.topic}</p>
        <p style="margin:4px 0 0;font-size:13px;color:#555;">"${q.question}"</p>
        <p style="margin:2px 0 0;font-size:11px;color:${col};font-weight:600;text-transform:uppercase;">${q.riskLevel} risk</p>
      </div>`;
    }).join("")}` : "";

  const readinessHtml = opts.readinessScore != null ? `
    <div style="background:#f8f8fc;border-radius:8px;padding:12px 16px;margin:16px 0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#888;text-transform:uppercase;">Event Readiness</p>
      <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:${opts.readinessScore >= 80 ? "#10b981" : opts.readinessScore >= 50 ? "#f59e0b" : "#ef4444"};">${opts.readinessScore}%</p>
    </div>` : "";

  return baseLayout(opts.brand ?? {}, `
    <h2>Pre-Event Intelligence Briefing</h2>
    <p>Dear ${opts.recipientName},</p>
    <p>Your event <strong>${opts.eventName}</strong> (${opts.companyName}) is scheduled to begin at <strong>${opts.scheduledTime}</strong>.</p>
    ${readinessHtml}
    <h3>Intelligence Briefing</h3>
    <div style="background:#f8f8fc;padding:16px;border-radius:6px;font-size:14px;line-height:1.6">${opts.briefingSummary}</div>
    ${hotspotsHtml}
    ${questionsHtml}
    ${opts.liveUrl ? `<p style="text-align:center"><a class="btn" href="${opts.liveUrl}">Open Live Dashboard</a></p>` : ""}
    <p style="font-size:13px;color:#666">This briefing was generated by AI based on historical data and market context.</p>
  `);
}
