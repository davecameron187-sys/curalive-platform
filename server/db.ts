import { drizzle } from "drizzle-orm/mysql2";
import { eq, desc } from "drizzle-orm";
import { InsertUser, users, speakerPaceResults, InsertSpeakerPaceResult, userFeedback, InsertUserFeedback } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.id);
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "operator") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  profile: {
    name?: string | null;
    jobTitle?: string | null;
    organisation?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    phone?: string | null;
    linkedinUrl?: string | null;
    timezone?: string | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Filter out undefined keys so we only update what was provided
  const updateSet = Object.fromEntries(
    Object.entries(profile).filter(([, v]) => v !== undefined)
  );
  if (Object.keys(updateSet).length === 0) return;
  await db.update(users).set(updateSet).where(eq(users.id, userId));
}

// ─── Speaking-Pace Coach helpers ─────────────────────────────────────────────

/** Persist a batch of per-speaker pace results for one event. */
export async function savePaceResults(rows: InsertSpeakerPaceResult[]) {
  const db = await getDb();
  if (!db || rows.length === 0) return;
  await db.insert(speakerPaceResults).values(rows);
}

/** Fetch the last N pace results for a given speaker across all events. */
export async function getPaceHistory(speaker: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(speakerPaceResults)
    .where(eq(speakerPaceResults.speaker, speaker))
    .orderBy(desc(speakerPaceResults.analysedAt))
    .limit(limit);
}

/** Fetch all pace results for a specific event. */
export async function getEventPaceResults(eventId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(speakerPaceResults)
    .where(eq(speakerPaceResults.eventId, eventId));
}

// TODO: add feature queries here as your schema grows.


// ─── User Feedback helpers ────────────────────────────────────────────────────
/** Submit user feedback (rating and suggestion). */
export async function submitFeedback(feedback: InsertUserFeedback) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot submit feedback: database not available");
    return null;
  }

  try {
    const result = await db.insert(userFeedback).values(feedback);
    return result;
  } catch (error) {
    console.error("[Database] Failed to submit feedback:", error);
    throw error;
  }
}

/** Get recent feedback (for admin dashboard). */
export async function getRecentFeedback(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(userFeedback)
    .orderBy(desc(userFeedback.createdAt))
    .limit(limit);
}

/** Get feedback statistics. */
export async function getFeedbackStats() {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      totalCount: desc(userFeedback.id),
      avgRating: desc(userFeedback.rating),
    })
    .from(userFeedback)
    .limit(1);

  return result[0] || null;
}


// ─────────────────────────────────────────────────────────────────────────────
// TRAINING MODE DATABASE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

import {
  trainingModeSessions,
  trainingConferences,
  trainingParticipants,
  trainingLounge,
  trainingCallLogs,
  trainingPerformanceMetrics,
  InsertTrainingModeSession,
  InsertTrainingConference,
  InsertTrainingParticipant,
  InsertTrainingCallLog,
  InsertTrainingPerformanceMetrics,
} from "../drizzle/schema";

/**
 * Create a new training mode session for an operator.
 */
export async function createTrainingSession(
  userId: number,
  operatorName: string,
  sessionName: string,
  trainingScenario: string,
  mentorId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(trainingModeSessions).values({
    userId,
    operatorName,
    sessionName,
    trainingScenario,
    mentorId,
    status: "active",
  });

  return result;
}

/**
 * Get all training sessions for a specific operator.
 */
export async function getOperatorTrainingSessions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(trainingModeSessions)
    .where(eq(trainingModeSessions.userId, userId))
    .orderBy(desc(trainingModeSessions.createdAt));
}

/**
 * Get a specific training session with all related data.
 */
export async function getTrainingSessionDetails(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(trainingModeSessions)
    .where(eq(trainingModeSessions.id, sessionId));
}

/**
 * Create a training conference within a training session.
 */
export async function createTrainingConference(
  data: InsertTrainingConference
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(trainingConferences).values(data);
}

/**
 * Get all training conferences for a training session.
 */
export async function getTrainingConferencesBySession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(trainingConferences)
    .where(eq(trainingConferences.trainingSessionId, sessionId))
    .orderBy(desc(trainingConferences.createdAt));
}

/**
 * Add a participant to a training conference.
 */
export async function addTrainingParticipant(
  data: InsertTrainingParticipant
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(trainingParticipants).values(data);
}

/**
 * Log a training call for review and coaching.
 */
export async function logTrainingCall(data: InsertTrainingCallLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(trainingCallLogs).values(data);
}

/**
 * Get all training call logs for a session.
 */
export async function getTrainingCallLogs(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(trainingCallLogs)
    .where(eq(trainingCallLogs.trainingSessionId, sessionId))
    .orderBy(desc(trainingCallLogs.createdAt));
}

/**
 * Update or create training performance metrics for an operator.
 */
export async function upsertTrainingPerformanceMetrics(
  data: InsertTrainingPerformanceMetrics
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .insert(trainingPerformanceMetrics)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        totalCallsHandled: data.totalCallsHandled,
        averageCallDuration: data.averageCallDuration,
        callQualityScore: data.callQualityScore,
        averageParticipantSatisfaction: data.averageParticipantSatisfaction,
        communicationScore: data.communicationScore,
        problemSolvingScore: data.problemSolvingScore,
        professionalism: data.professionalism,
        overallScore: data.overallScore,
        readyForProduction: data.readyForProduction,
        mentorNotes: data.mentorNotes,
        evaluatedAt: data.evaluatedAt,
        updatedAt: new Date(),
      },
    });
}

/**
 * Get training performance metrics for an operator.
 */
export async function getTrainingPerformanceMetrics(
  trainingSessionId: number,
  operatorId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(trainingPerformanceMetrics)
    .where(
      eq(trainingPerformanceMetrics.trainingSessionId, trainingSessionId)
    )
    .where(eq(trainingPerformanceMetrics.operatorId, operatorId));
}

/**
 * Complete a training session and mark as ready for production if metrics are met.
 */
export async function completeTrainingSession(
  sessionId: number,
  finalMetrics: InsertTrainingPerformanceMetrics
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update session status
  await db
    .update(trainingModeSessions)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(trainingModeSessions.id, sessionId));

  // Update performance metrics
  return await upsertTrainingPerformanceMetrics(finalMetrics);
}
