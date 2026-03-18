import { getDb } from "../db";
import { lumiBookings, shadowSessions, agmIntelligenceSessions, agmResolutions, agmGovernanceObservations } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { randomBytes } from "crypto";

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
