// @ts-nocheck
import { getDb } from "../db";
import { bastionBookings, bastionIntelligenceSessions, bastionInvestorObservations, bastionGuidanceTracker, shadowSessions } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { sendEmail } from "../_core/email";

export interface ChecklistItem {
  key: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail?: string;
}

export class BastionBookingService {
  private generateToken(): string {
    return randomBytes(24).toString("base64url");
  }

  async createBooking(input: {
    userId?: number | null;
    clientName: string;
    eventTitle: string;
    eventType?: string;
    eventDate?: string;
    eventTime?: string;
    sector?: string;
    ticker?: string;
    expectedAttendees?: number;
    meetingUrl?: string;
    platform?: string;
    contactName?: string;
    contactEmail?: string;
    bastionReference?: string;
    confirmationRecipients?: string;
    notes?: string;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const dashboardToken = this.generateToken();

    const [result] = await db.insert(bastionBookings).values({
      userId: input.userId ?? null,
      clientName: input.clientName,
      eventTitle: input.eventTitle,
      eventType: (input.eventType as any) ?? "earnings_call",
      eventDate: input.eventDate ?? null,
      eventTime: input.eventTime ?? null,
      sector: input.sector ?? null,
      ticker: input.ticker ?? null,
      expectedAttendees: input.expectedAttendees ?? null,
      meetingUrl: input.meetingUrl ?? null,
      platform: (input.platform as any) ?? "zoom",
      contactName: input.contactName ?? null,
      contactEmail: input.contactEmail ?? null,
      bastionReference: input.bastionReference ?? null,
      confirmationRecipients: input.confirmationRecipients ?? null,
      dashboardToken,
      status: "booked",
      notes: input.notes ?? null,
    } as any);

    const bookingId = (result as any).insertId;
    return { bookingId, dashboardToken };
  }

  async listBookings(userId: number) {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(bastionBookings)
      .where(eq(bastionBookings.userId, userId))
      .orderBy(desc(bastionBookings.createdAt));
  }

  async getBookingById(id: number, userId?: number) {
    const db = await getDb();
    if (!db) return null;
    if (userId != null) {
      const [row] = await db.select().from(bastionBookings)
        .where(and(eq(bastionBookings.id, id), eq(bastionBookings.userId, userId)))
        .limit(1);
      return row ?? null;
    }
    const [row] = await db.select().from(bastionBookings).where(eq(bastionBookings.id, id)).limit(1);
    return row ?? null;
  }

  async getBookingByToken(token: string) {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db.select().from(bastionBookings).where(eq(bastionBookings.dashboardToken, token)).limit(1);
    return row ?? null;
  }

  async updateBooking(id: number, updates: Record<string, any>, userId?: number) {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    if (userId != null) {
      await db.update(bastionBookings).set(updates)
        .where(and(eq(bastionBookings.id, id), eq(bastionBookings.userId, userId)));
    } else {
      await db.update(bastionBookings).set(updates).where(eq(bastionBookings.id, id));
    }
    return this.getBookingById(id, userId);
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
      key: "event_date",
      label: "Event date set",
      status: booking.eventDate ? "pass" : "warn",
      detail: booking.eventDate ?? "No date set",
    });

    checks.push({
      key: "event_type",
      label: "Event type configured",
      status: booking.eventType ? "pass" : "warn",
      detail: `Type: ${booking.eventType}`,
    });

    checks.push({
      key: "ticker",
      label: "Ticker / Company identifier",
      status: booking.ticker ? "pass" : "warn",
      detail: booking.ticker ?? "No ticker set — needed for guidance tracking",
    });

    checks.push({
      key: "contact",
      label: "Contact information",
      status: (booking.contactEmail || booking.confirmationRecipients) ? "pass" : "warn",
      detail: booking.contactEmail ?? booking.confirmationRecipients ?? "No contact email set",
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
      await this.updateBooking(id, { status: "ready" });
    }

    return checks;
  }

  async linkSessions(bookingId: number, shadowSessionId: number, bastionSessionId: number | null) {
    const updates: Record<string, any> = { shadowSessionId, status: "live" };
    if (bastionSessionId) updates.bastionSessionId = bastionSessionId;
    return this.updateBooking(bookingId, updates);
  }

  async sendBookingConfirmation(bookingId: number, baseUrl: string, userId?: number) {
    const booking = await this.getBookingById(bookingId, userId);
    if (!booking) throw new Error("Booking not found");

    const allEmails = [booking.contactEmail, booking.confirmationRecipients]
      .filter(Boolean)
      .join(",");

    const recipients = allEmails
      .split(/[,;\n]/)
      .map((e: string) => e.trim())
      .filter((e: string) => e.includes("@"));

    if (recipients.length === 0) {
      throw new Error("No recipients configured. Add confirmation recipients to this booking.");
    }

    const dashboardUrl = `${baseUrl}/live/${booking.dashboardToken}`;
    const eventTypeLabel = (booking.eventType ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const platformLabel = (booking.platform ?? "").replace(/\b\w/g, c => c.toUpperCase());

    const html = buildBastionConfirmationEmail({
      clientName: booking.clientName,
      eventTitle: booking.eventTitle,
      eventType: eventTypeLabel,
      eventDate: booking.eventDate ?? "TBC",
      eventTime: booking.eventTime ?? "TBC",
      sector: booking.sector ?? "—",
      ticker: booking.ticker ?? "—",
      platform: platformLabel,
      expectedAttendees: booking.expectedAttendees,
      contactName: booking.contactName,
      bastionReference: booking.bastionReference,
      dashboardUrl,
      notes: booking.notes,
    });

    const result = await sendEmail({
      to: recipients,
      subject: `CuraLive Investor Intelligence — Booking Confirmed: ${booking.eventTitle}`,
      html,
      replyTo: "support@curalive.cc",
    });

    if (result.success) {
      const db = await getDb();
      if (db) {
        await db.update(bastionBookings)
          .set({ confirmationSentAt: new Date() } as any)
          .where(eq(bastionBookings.id, bookingId));
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
    let observations: any[] = [];
    let guidance: any[] = [];

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

    if (booking.bastionSessionId) {
      observations = await db.select().from(bastionInvestorObservations)
        .where(eq(bastionInvestorObservations.sessionId, booking.bastionSessionId))
        .orderBy(desc(bastionInvestorObservations.createdAt))
        .limit(30);

      guidance = await db.select().from(bastionGuidanceTracker)
        .where(eq(bastionGuidanceTracker.sessionId, booking.bastionSessionId))
        .orderBy(bastionGuidanceTracker.guidanceType);
    }

    return {
      booking: {
        clientName: booking.clientName,
        eventTitle: booking.eventTitle,
        eventType: booking.eventType,
        eventDate: booking.eventDate,
        sector: booking.sector,
        ticker: booking.ticker,
        status: booking.status,
        expectedAttendees: booking.expectedAttendees,
      },
      session: sessionData,
      observations: observations.map(o => ({
        algorithm: o.algorithmSource,
        type: o.observationType,
        severity: o.severity,
        title: o.title,
        detail: o.detail,
        confidence: o.confidence,
        createdAt: o.createdAt,
      })),
      guidance: guidance.map(g => ({
        type: g.guidanceType,
        statement: g.statement,
        value: g.numericValue,
        confidence: g.confidenceLevel,
        delta: g.delta,
        timeframe: g.timeframe,
        metOrMissed: g.metOrMissed,
      })),
      isLive: booking.status === "live",
      isCompleted: booking.status === "completed",
    };
  }
}

export const bastionBookingService = new BastionBookingService();

function buildBastionConfirmationEmail(data: {
  clientName: string;
  eventTitle: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  sector: string;
  ticker: string;
  platform: string;
  expectedAttendees: number | null;
  contactName: string | null;
  bastionReference: string | null;
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
<tr><td style="background:linear-gradient(135deg,#1a150e,#201a10);padding:32px 40px;border-bottom:1px solid rgba(245,158,11,0.15);">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td>
      <span style="font-size:22px;font-weight:700;background:linear-gradient(135deg,#f59e0b,#d97706);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">CuraLive</span>
      <span style="color:#475569;font-size:14px;margin-left:8px;">×</span>
      <span style="color:#f59e0b;font-size:14px;font-weight:600;margin-left:8px;">Bastion Capital</span>
    </td>
    <td align="right">
      <span style="background:rgba(245,158,11,0.12);color:#f59e0b;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid rgba(245,158,11,0.2);">BOOKING CONFIRMED</span>
    </td>
  </tr>
  </table>
</td></tr>

<!-- Title -->
<tr><td style="padding:32px 40px 16px;">
  <h1 style="margin:0;font-size:24px;font-weight:700;color:#f1f5f9;">${escapeHtml(data.eventTitle)}</h1>
  <p style="margin:8px 0 0;font-size:14px;color:#94a3b8;">${escapeHtml(data.clientName)} — ${escapeHtml(data.eventType)} Intelligence</p>
</td></tr>

<!-- Event details -->
<tr><td style="padding:0 40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.08);border-radius:12px;">
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);" width="50%">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Date</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.eventDate)}</div>
      </td>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);" width="50%">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Time</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.eventTime)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Sector</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.sector)}</div>
      </td>
      <td style="padding:16px 20px;border-bottom:1px solid rgba(148,163,184,0.06);">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Ticker</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.ticker)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 20px;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Platform</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${escapeHtml(data.platform)}</div>
      </td>
      <td style="padding:16px 20px;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Expected Attendees</div>
        <div style="color:#f1f5f9;font-size:14px;font-weight:500;">${data.expectedAttendees ?? "TBC"}</div>
      </td>
    </tr>
  </table>
</td></tr>

<!-- Dashboard Link -->
<tr><td style="padding:0 40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:12px;">
    <tr><td style="padding:24px;">
      <div style="color:#f59e0b;font-size:13px;font-weight:600;margin-bottom:8px;">Live Intelligence Dashboard</div>
      <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;line-height:1.5;">
        Real-time investor intelligence — sentiment analysis, management tone scoring, analyst question tracking, forward guidance monitoring, and market-moving statement detection. No login required.
      </p>
      <table cellpadding="0" cellspacing="0"><tr><td>
        <a href="${escapeHtml(data.dashboardUrl)}" style="display:inline-block;background:linear-gradient(135deg,#d97706,#b45309);color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
          Open Live Dashboard
        </a>
      </td></tr></table>
      <p style="margin:12px 0 0;font-size:11px;color:#64748b;word-break:break-all;">${escapeHtml(data.dashboardUrl)}</p>
    </td></tr>
  </table>
</td></tr>

<!-- What's included -->
<tr><td style="padding:0 40px 24px;">
  <div style="color:#e2e8f0;font-size:14px;font-weight:600;margin-bottom:12px;">CuraLive Investor Intelligence Included</div>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${[
      { label: "Earnings Sentiment Decoder", desc: "Management tone vs actual results — detects spin and overpromising" },
      { label: "Forward Guidance Tracker", desc: "Captures, scores, and cross-references every guidance statement" },
      { label: "Analyst Question Intelligence", desc: "Identifies analysts, categorises questions, flags hostile probing" },
      { label: "Management Credibility Scorer", desc: "Cross-quarter consistency and moved goalpost detection" },
      { label: "Market-Moving Statement Detector", desc: "Real-time flagging of share-price-impacting statements" },
      { label: "Investment Brief Generator", desc: "Autonomous post-event portfolio manager report" },
    ].map(item => `
    <tr><td style="padding:6px 0;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;vertical-align:top;"><span style="color:#f59e0b;font-size:14px;">&#10003;</span></td>
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

<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid rgba(148,163,184,0.06);">
  <p style="margin:0;font-size:11px;color:#475569;line-height:1.6;">
    This is an automated booking confirmation from CuraLive Investor Intelligence, delivered in partnership with Bastion Capital Partners.
    For questions, reply to this email or contact <a href="mailto:support@curalive.cc" style="color:#f59e0b;">support@curalive.cc</a>.
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
