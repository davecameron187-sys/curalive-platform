/**
 * OCC database query helpers.
 * All functions return raw Drizzle rows — no business logic here.
 */
import { getDb } from "./db";
import {
  occConferences,
  occParticipants,
  occLounge,
  occOperatorRequests,
  occOperatorSessions,
  occChatMessages,
  occAudioFiles,
  occParticipantHistory,
  occAccessCodeLog,
  type OccConference,
  type OccParticipant,
  type InsertOccParticipantHistory,
  type InsertOccChatMessage,
} from "../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

// ─── Conferences ─────────────────────────────────────────────────────────────

export async function getOccConferences(status?: OccConference["status"]) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(occConferences).where(eq(occConferences.status, status)).orderBy(desc(occConferences.scheduledStart));
  }
  return db.select().from(occConferences).orderBy(desc(occConferences.scheduledStart));
}

export async function getOccConferenceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(occConferences).where(eq(occConferences.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOccConferenceByEventId(eventId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(occConferences).where(eq(occConferences.eventId, eventId)).limit(1);
  return rows[0] ?? null;
}

export async function updateOccConference(id: number, data: Partial<OccConference>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(occConferences).set(data).where(eq(occConferences.id, id));
  return getOccConferenceById(id);
}

// ─── Participants ─────────────────────────────────────────────────────────────

export async function getOccParticipants(conferenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(occParticipants)
    .where(eq(occParticipants.conferenceId, conferenceId))
    .orderBy(asc(occParticipants.lineNumber));
}

export async function getOccParticipantById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(occParticipants).where(eq(occParticipants.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function updateOccParticipantState(
  participantId: number,
  state: OccParticipant["state"],
  extra?: Partial<OccParticipant>
) {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(occParticipants)
    .set({ state, isSpeaking: state === "speaking", ...extra })
    .where(eq(occParticipants.id, participantId));
  return getOccParticipantById(participantId);
}

export async function updateOccParticipant(id: number, data: Partial<OccParticipant>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(occParticipants).set(data).where(eq(occParticipants.id, id));
  return getOccParticipantById(id);
}

// ─── Lounge ───────────────────────────────────────────────────────────────────

export async function getOccLoungeEntries(conferenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(occLounge)
    .where(and(eq(occLounge.conferenceId, conferenceId), eq(occLounge.status, "waiting")))
    .orderBy(asc(occLounge.arrivedAt));
}

export async function pickFromLounge(loungeId: number, operatorId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(occLounge)
    .set({ status: "picked", pickedAt: new Date(), pickedByOperatorId: operatorId })
    .where(eq(occLounge.id, loungeId));
}

// ─── Operator Requests ────────────────────────────────────────────────────────

export async function getOccOperatorRequests(conferenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(occOperatorRequests)
    .where(and(eq(occOperatorRequests.conferenceId, conferenceId), eq(occOperatorRequests.status, "pending")))
    .orderBy(asc(occOperatorRequests.requestedAt));
}

export async function pickOperatorRequest(requestId: number, operatorId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(occOperatorRequests)
    .set({ status: "picked", pickedAt: new Date(), pickedByOperatorId: operatorId })
    .where(eq(occOperatorRequests.id, requestId));
}

// ─── Operator Sessions ────────────────────────────────────────────────────────

export async function getOrCreateOperatorSession(userId: number, operatorName: string) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db
    .select()
    .from(occOperatorSessions)
    .where(eq(occOperatorSessions.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  await db
    .insert(occOperatorSessions)
    .values({ userId, operatorName, state: "absent", lastHeartbeat: new Date() });
  const rows = await db.select().from(occOperatorSessions).where(eq(occOperatorSessions.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function updateOperatorState(
  userId: number,
  state: "absent" | "present" | "in_call" | "break"
) {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const extra: Record<string, Date | null> = {};
  if (state === "present") extra.loginAt = now;
  if (state === "break") extra.breakAt = now;
  if (state === "absent") extra.logoutAt = now;
  await db
    .update(occOperatorSessions)
    .set({ state, lastHeartbeat: now, ...extra })
    .where(eq(occOperatorSessions.userId, userId));
}

export async function heartbeatOperatorSession(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(occOperatorSessions)
    .set({ lastHeartbeat: new Date() })
    .where(eq(occOperatorSessions.userId, userId));
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function getOccChatMessages(conferenceId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(occChatMessages)
    .where(eq(occChatMessages.conferenceId, conferenceId))
    .orderBy(asc(occChatMessages.sentAt))
    .limit(limit);
}

export async function insertOccChatMessage(data: InsertOccChatMessage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(occChatMessages).values(data);
}

// ─── Audio Files ──────────────────────────────────────────────────────────────

export async function getOccAudioFiles(conferenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(occAudioFiles)
    .where(eq(occAudioFiles.conferenceId, conferenceId))
    .orderBy(asc(occAudioFiles.name));
}

// ─── Participant History ──────────────────────────────────────────────────────

export async function getOccParticipantHistory(participantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(occParticipantHistory)
    .where(eq(occParticipantHistory.participantId, participantId))
    .orderBy(desc(occParticipantHistory.occurredAt))
    .limit(50);
}

export async function insertOccParticipantHistory(data: InsertOccParticipantHistory) {
  const db = await getDb();
  if (!db) return;
  await db.insert(occParticipantHistory).values(data);
}

// ─── Access Code Log ──────────────────────────────────────────────────────────

export async function getOccAccessCodeLog(conferenceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(occAccessCodeLog)
    .where(eq(occAccessCodeLog.conferenceId, conferenceId))
    .orderBy(desc(occAccessCodeLog.attemptedAt))
    .limit(100);
}
