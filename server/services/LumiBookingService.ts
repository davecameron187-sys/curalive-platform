import { getDb } from "../db";
import { lumiBookings, shadowSessions, agmIntelligenceSessions, agmResolutions, agmGovernanceObservations } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendEmail } from "../_core/email";

export interface ChecklistItem {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
}

export class LumiBookingService {
  private generateToken(): string {
    return randomBytes(24).toString("base64url");
  }

  async createBooking(input: {
    userId?: number | null;
    clientName: string;
    agmTitle: string;
    agmDate?: string;
    agmTime?: string;
    jurisdiction?: string;
    expectedAttendees?: number;
    meetingUrl?: string;
    platform?: string;
    contactName?: string;
    contactEmail?: string;
    lumiReference?: string;
    notes?: string;
    resolutionsJson?: any;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const dashboardToken = this.generateToken();

    const [result] = await db.insert(lumiBookings).values({
      userId: input.userId ?? null,
      clientName: input.clientName,
      agmTitle: input.agmTitle,
      agmDate: input.agmDate ?? null,
      agmTime: input.agmTime ?? null,
      jurisdiction: (input.jurisdiction as any) ?? "south_africa",
      expectedAttendees: input.expectedAttendees ?? null,
      meetingUrl: input.meetingUrl ?? null,
      platform: (input.platform as any) ?? "zoom",
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      lumiReference: input.lumiReference ?? null,
      dashboardToken,
      status: "booked",
      notes: input.notes ?? null,
      resolutionsJson: input.resolutionsJson ?? null,
    } as any);

    const bookingId = (result as any).insertId;
    return { bookingId, dashboardToken };
  }

  async listBookings(userId: number) {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(lumiBookings)
      .where(eq(lumiBookings.userId, userId))
      .orderBy(desc(lumiBookings.createdAt));
    return rows;
  }

  async getBookingById(id: number, userId?: number) {
    const db = await getDb();
    if (!db) return null;
    if (userId != null) {
      const [row] = await db.select().from(lumiBookings)
        .where(and(eq(lumiBookings.id, id), eq(lumiBookings.userId, userId)))
        .limit(1);
      return row ?? null;
    }
    const [row] = await db.select().from(lumiBookings).where(eq(lumiBookings.id, id)).limit(1);
    return row ?? null;
  }

  async getBookingByToken(token: string) {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db.select().from(lumiBookings).where(eq(lumiBookings.dashboardToken, token)).limit(1);
    return row ?? null;
  }

  async updateBooking(id: number, updates: Record<string, any>, userId?: number) {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    if (userId != null) {
      await db.update(lumiBookings).set(updates)
        .where(and(eq(lumiBookings.id, id), eq(lumiBookings.userId, userId)));
    } else {
      await db.update(lumiBookings).set(updates).where(eq(lumiBookings.id, id));
    }
    return this.getBookingById(id, userId);
  }

  async updateStatus(id: number, status: string) {
    return this.updateBooking(id, { status });
  }

  async runChecklist(id: number): Promise<ChecklistItem[]> {
    const booking = await this.getBookingById(id);
    if (!booking) throw new Error("Booking not found");

    const checks: ChecklistItem[] = [];

    checks.push({
      key: "meeting_url",
      label: "Meeting URL provided",
      status: booking.meetingUrl ? "pass" : "fail",
      detail: booking.meetingUrl ? "URL configured" : "No meeting URL set",
    });

    checks.push({
      key: "platform",
      label: "Platform configured",
      status: booking.platform ? "pass" : "warn",
      detail: `Platform: ${booking.platform ?? "not set"}`,
    });

    checks.push({
      key: "agm_date",
      label: "AGM date set",
      status: booking.agmDate ? "pass" : "warn",
      detail: booking.agmDate ?? "No date set",
    });

    checks.push({
      key: "jurisdiction",
      label: "Jurisdiction configured",
      status: booking.jurisdiction ? "pass" : "warn",
      detail: `Jurisdiction: ${booking.jurisdiction}`,
    });

    const resolutions = booking.resolutionsJson as any[] | null;
    checks.push({
      key: "resolutions",
      label: "Resolutions loaded",
      status: resolutions && resolutions.length > 0 ? "pass" : "warn",
      detail: resolutions ? `${resolutions.length} resolution(s)` : "No resolutions loaded yet",
    });

    checks.push({
      key: "contact",
      label: "Client contact information",
      status: booking.contactEmail ? "pass" : "warn",
      detail: booking.contactEmail ?? "No contact email set",
    });

    const recall = process.env.RECALL_AI_API_KEY;
    checks.push({
      key: "recall_api",
      label: "Recall.ai API configured",
      status: recall ? "pass" : "fail",
      detail: recall ? "API key present" : "Missing RECALL_AI_API_KEY",
    });

    await this.updateBooking(id, { checklist: checks });

    const allPass = checks.every(c => c.status !== "fail");
    if (allPass && booking.status === "setup") {
      await this.updateStatus(id, "ready");
    }

    return checks;
  }

  async linkSessions(bookingId: number, shadowSessionId: number, agmSessionId: number | null) {
    const updates: Record<string, any> = { shadowSessionId, status: "live" };
    if (agmSessionId) updates.agmSessionId = agmSessionId;
    return this.updateBooking(bookingId, updates);
  }

  async completeBooking(id: number) {
    return this.updateBooking(id, { status: "completed" });
  }

  async sendBookingConfirmation(bookingId: number, baseUrl: string, userId?: number) {
    const booking = await this.getBookingById(bookingId, userId);
    if (!booking) throw new Error("Booking not found");

    const recipients: string[] = [];

    if (booking.contactEmail) recipients.push(booking.contactEmail);

    const lumiEmails = (booking.lumiRecipients ?? "")
      .split(/[,;\n]/)
      .map((e: string) => e.trim())
      .filter((e: string) => e.includes("@"));
    recipients.push(...lumiEmails);

    if (recipients.length === 0) {
      throw new Error("No recipients configured. Add a client contact email or Lumi recipients.");
    }

    const dashboardUrl = `${baseUrl}/live/${booking.dashboardToken}`;
    const jurisdictionLabel = (booking.jurisdiction ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const platformLabel = (booking.platform ?? "").replace(/\b\w/g, c => c.toUpperCase());

    const html = buildBookingConfirmationEmail({
      clientName: booking.clientName,
      agmTitle: booking.agmTitle,
      agmDate: booking.agmDate ?? "TBC",
      agmTime: booking.agmTime ?? "TBC",
      jurisdiction: jurisdictionLabel,
      platform: platformLabel,
      expectedAttendees: booking.expectedAttendees,
      contactName: booking.contactName,
      lumiReference: booking.lumiReference,
      dashboardUrl,
      notes: booking.notes,
    });

    const result = await sendEmail({
      to: recipients,
      subject: `CuraLive AGM Intelligence — Booking Confirmed: ${booking.agmTitle}`,
      html,
      replyTo: "support@curalive.cc",
    });

    if (result.success) {
      const db = await getDb();
      if (db) {
        await db.update(lumiBookings)
          .set({ confirmationSentAt: new Date() } as any)
          .where(eq(lumiBookings.id, bookingId));
      }
    }

    return {
      success: result.success,
      recipientCount: recipients.length,
      recipients,
      error: result.error,
    };
  }

  async getClientDashboardData(token: string) {
    const booking = await this.getBookingByToken(token);
    if (!booking) return null;

    const db = await getDb();
    if (!db) return null;

    let sessionData: any = null;
    let resolutions: any[] = [];
    let observations: any[] = [];

    if (booking.shadowSessionId) {
      const [session] = await db.select().from(shadowSessions)
        .where(eq(shadowSessions.id, booking.shadowSessionId)).limit(1);
      if (session) {
        sessionData = {
          status: session.status,
          eventName: session.eventName,
          clientName: session.clientName,
          sentimentSummary: session.sentimentSummary,
          sentimentTrend: session.sentimentTrend,
          overallSentiment: session.overallSentiment,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        };
      }
    }

    if (booking.agmSessionId) {
      resolutions = await db.select().from(agmResolutions)
        .where(eq(agmResolutions.sessionId, booking.agmSessionId))
        .orderBy(agmResolutions.resolutionNumber);

      observations = await db.select().from(agmGovernanceObservations)
        .where(eq(agmGovernanceObservations.sessionId, booking.agmSessionId))
        .orderBy(desc(agmGovernanceObservations.createdAt))
        .limit(20);
    }

    return {
      booking: {
        clientName: booking.clientName,
        agmTitle: booking.agmTitle,
        agmDate: booking.agmDate,
        jurisdiction: booking.jurisdiction,
        status: booking.status,
        expectedAttendees: booking.expectedAttendees,
      },
      session: sessionData,
      resolutions: resolutions.map(r => ({
        number: r.resolutionNumber,
        title: r.title,
        category: r.category,
        predictedOutcome: r.predictedApprovalPct != null
          ? (r.predictedApprovalPct >= 50 ? "pass" : "fail")
          : null,
        currentSentiment: r.sentimentDuringDebate,
        confidence: r.predictedApprovalPct != null ? r.predictedApprovalPct / 100 : null,
        status: r.status,
      })),
      observations: observations.map(o => ({
        algorithm: o.algorithmSource,
        type: o.observationType,
        severity: o.severity,
        title: o.title,
        detail: o.detail,
        confidence: o.confidence,
        createdAt: o.createdAt,
      })),
      isLive: booking.status === "live",
      isCompleted: booking.status === "completed",
    };
  }
}

export const lumiBookingService = new LumiBookingService();

function buildBookingConfirmationEmail(data: {
  clientName: string;
  agmTitle: string;
  agmDate: string;
  agmTime: string;
  jurisdiction: string;
  platform: string;
  expectedAttendees: number | null;
  contactName: string | null;
  lumiReference: string | null;
  dashboardUrl: string;
  notes: string | null;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e17;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e17;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;border:1px solid rgba(148,163,184,0.08);overflow:hidden;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0e1a2e,#162033);padding:32px 40px;border-bottom:1px solid rgba(96,165,250,0.15);">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <span style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">CuraLive</span>
      <span style="color:#475569;font-size:14px;margin-left:8px;">×</span>
      <span style="color:#06b6d4;font-size:14px;font-weight:600;margin-left:8px;">Lumi Global</span>
    </td>
    <td align="right">
      <span style="background:rgba(52,211,153,0.12);color:#34d399;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid rgba(52,211,153,0.2);">BOOKING CONFIRMED</span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Title -->
<tr><td style="padding:32px 40px 16px;">
  <h1 style="margin:0;font-size:24px;font-weight:700;color:#f1f5f9;">${escapeHtml(data.agmTitle)}</h1>
  <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">${escapeHtml(data.clientName)} — AGM Intelligence Engagement</p>
</td></tr>

<!-- Event details -->
<tr><td style="padding:0 40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.08);border-radius:12px;">
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);" width="50%">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Date</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.agmDate)}</div>
      </td>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);" width="50%">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Time</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.agmTime)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Jurisdiction</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.jurisdiction)}</div>
      </td>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Platform</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.platform)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Expected Attendees</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${data.expectedAttendees ?? "TBC"}</div>
      </td>
      <td style="padding:16px 20px;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Lumi Reference</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${data.lumiReference ? escapeHtml(data.lumiReference) : "—"}</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Dashboard Link -->
<tr><td style="padding:0 40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.15);border-radius:12px;">
    <tr><td style="padding:24px;">
      <div style="color:#a78bfa;font-size:13px;font-weight:600;margin-bottom:8px;">Live Client Dashboard</div>
      <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;line-height:1.5;">
        Share this link with the Company Secretary or IR team. It provides a real-time, read-only view of AGM intelligence — sentiment analysis, resolution tracking, quorum monitoring, and compliance alerts. No login required.
      </p>
      <table cellpadding="0" cellspacing="0"><tr><td>
        <a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Open Live Dashboard
        </a>
      </td></tr></table>
      <p style="margin:12px 0 0;font-size:11px;color:#64748b;word-break:break-all;">${escapeHtml(data.dashboardUrl)}</p>
    </td></tr>
  </table>
</td></tr>

<!-- What's included -->
<tr><td style="padding:0 40px 24px;">
  <div style="color:#e2e8f0;font-size:14px;font-weight:600;margin-bottom:12px;">CuraLive Intelligence Included</div>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${[
      { label: "Live Sentiment Analysis", desc: "Real-time investor mood tracking throughout the AGM" },
      { label: "Resolution Outcome Predictor", desc: "AI-predicted approval percentages for each resolution" },
      { label: "Quorum & Participation Monitoring", desc: "Jurisdiction-specific quorum tracking with alerts" },
      { label: "Regulatory Compliance Scanner", desc: "Companies Act 71, JSE Listings, King IV compliance checks" },
      { label: "Q&A Governance Triage", desc: "Automated classification and prioritisation of shareholder questions" },
      { label: "Post-AGM Governance Report", desc: "Board-ready 12-section report generated automatically" },
    ].map(item => `
    <tr><td style="padding:6px 0;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;vertical-align:top;"><span style="color:#34d399;font-size:14px;">&#10003;</span></td>
        <td>
          <span style="color:#e2e8f0;font-size:13px;font-weight:500;">${item.label}</span>
          <span style="color:#64748b;font-size:12px;"> — ${item.desc}</span>
        </td>
      </tr></table>
    </td></tr>`).join("")}
  </table>
</td></tr>

${data.notes ? `
<!-- Notes -->
<tr><td style="padding:0 40px 24px;">
  <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.08);border-radius:8px;padding:16px;">
    <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Notes</div>
    <div style="color:#94a3b8;font-size:13px;line-height:1.5;">${escapeHtml(data.notes)}</div>
  </div>
</td></tr>
` : ""}

<!-- Contact -->
${data.contactName ? `
<tr><td style="padding:0 40px 24px;">
  <div style="color:#64748b;font-size:12px;">
    Primary contact: <span style="color:#94a3b8;">${escapeHtml(data.contactName)}</span>
  </div>
</td></tr>
` : ""}

<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid rgba(148,163,184,0.06);">
  <p style="margin:0;font-size:11px;color:#475569;line-height:1.6;">
    This is an automated booking confirmation from CuraLive AGM Intelligence, delivered in partnership with Lumi Global.
    For questions, reply to this email or contact <a href="mailto:support@curalive.cc" style="color:#60a5fa;">support@curalive.cc</a>.
  </p>
  <p style="margin:12px 0 0;font-size:10px;color:#334155;">
    CuraLive Pty Ltd · Jet Park, Johannesburg · curalive.cc
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
