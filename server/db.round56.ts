/**
 * Round 56 database query helpers.
 * Check-In Kiosk, SMS Retry Automation, Advanced Reporting
 */
import { getDb } from "./db";
import {
  checkInSessions,
  attendeeCheckIns,
  reportConfigs,
  generatedReports,
  type CheckInSession,
  type AttendeeCheckIn,
  type ReportConfig,
  type GeneratedReport,
  type InsertCheckInSession,
  type InsertAttendeeCheckIn,
  type InsertReportConfig,
  type InsertGeneratedReport,
} from "../drizzle/schema";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";

// ─── Check-In Sessions ────────────────────────────────────────────────────────

export async function startCheckInSession(data: InsertCheckInSession) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(checkInSessions).values(data);
  const id = result[0]?.insertId;
  if (!id) return null;
  return getCheckInSessionById(Number(id));
}

export async function getCheckInSessionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(checkInSessions).where(eq(checkInSessions.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCheckInSessionsByEvent(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkInSessions).where(eq(checkInSessions.eventId, eventId)).orderBy(desc(checkInSessions.startedAt));
}

export async function updateCheckInSession(id: number, data: Partial<CheckInSession>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(checkInSessions).set(data).where(eq(checkInSessions.id, id));
  return getCheckInSessionById(id);
}

// ─── Attendee Check-Ins ───────────────────────────────────────────────────────

export async function recordAttendeeCheckIn(data: InsertAttendeeCheckIn) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(attendeeCheckIns).values(data);
  const id = result[0]?.insertId;
  if (!id) return null;
  return getAttendeeCheckInById(Number(id));
}

export async function getAttendeeCheckInById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(attendeeCheckIns).where(eq(attendeeCheckIns.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCheckInsBySession(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attendeeCheckIns).where(eq(attendeeCheckIns.sessionId, sessionId)).orderBy(desc(attendeeCheckIns.checkedInAt));
}

export async function getCheckInsByEvent(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attendeeCheckIns).where(eq(attendeeCheckIns.eventId, eventId)).orderBy(desc(attendeeCheckIns.checkedInAt));
}

export async function getCheckInStats(sessionId: number) {
  const db = await getDb();
  if (!db) return null;
  const session = await getCheckInSessionById(sessionId);
  if (!session) return null;
  const checkIns = await getCheckInsBySession(sessionId);
  const successCount = checkIns.filter((c) => c.result === "success").length;
  const duplicateCount = checkIns.filter((c) => c.result === "duplicate").length;
  const notFoundCount = checkIns.filter((c) => c.result === "not_found").length;
  const invalidCount = checkIns.filter((c) => c.result === "invalid").length;
  return {
    sessionId,
    totalScanned: checkIns.length,
    successCount,
    duplicateCount,
    notFoundCount,
    invalidCount,
    successRate: checkIns.length > 0 ? (successCount / checkIns.length) * 100 : 0,
  };
}

// ─── Report Configurations ────────────────────────────────────────────────────

export async function createReportConfig(data: InsertReportConfig) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(reportConfigs).values(data);
  const id = result[0]?.insertId;
  if (!id) return null;
  return getReportConfigById(Number(id));
}

export async function getReportConfigById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(reportConfigs).where(eq(reportConfigs.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getReportConfigsByEvent(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reportConfigs).where(eq(reportConfigs.eventId, eventId)).orderBy(desc(reportConfigs.createdAt));
}

export async function getActiveReportConfigs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reportConfigs).where(eq(reportConfigs.isActive, true)).orderBy(asc(reportConfigs.nextScheduledAt));
}

export async function updateReportConfig(id: number, data: Partial<ReportConfig>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(reportConfigs).set(data).where(eq(reportConfigs.id, id));
  return getReportConfigById(id);
}

export async function deleteReportConfig(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(reportConfigs).where(eq(reportConfigs.id, id));
  return true;
}

// ─── Generated Reports ────────────────────────────────────────────────────────

export async function createGeneratedReport(data: InsertGeneratedReport) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(generatedReports).values(data);
  const id = result[0]?.insertId;
  if (!id) return null;
  return getGeneratedReportById(Number(id));
}

export async function getGeneratedReportById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(generatedReports).where(eq(generatedReports.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getGeneratedReportsByEvent(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedReports).where(eq(generatedReports.eventId, eventId)).orderBy(desc(generatedReports.generatedAt));
}

export async function getGeneratedReportsByConfig(configId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generatedReports).where(eq(generatedReports.configId, configId)).orderBy(desc(generatedReports.generatedAt));
}

export async function updateGeneratedReport(id: number, data: Partial<GeneratedReport>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(generatedReports).set(data).where(eq(generatedReports.id, id));
  return getGeneratedReportById(id);
}

export async function getReportsByDateRange(eventId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(generatedReports)
    .where(
      and(
        eq(generatedReports.eventId, eventId),
        gte(generatedReports.startDate, startDate),
        lte(generatedReports.endDate, endDate)
      )
    )
    .orderBy(desc(generatedReports.generatedAt));
}
