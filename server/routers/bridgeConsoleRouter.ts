import { z } from "zod";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { protectedProcedure, operatorProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import twilio from "twilio";
import {
  bridgeEvents,
  bridgeConferences,
  bridgeParticipants,
  bridgeGreeterQueue,
  bridgeQaQuestions,
  bridgeOperatorActions,
  bridgeCallRecordings,
  shadowSessions,
} from "../../drizzle/schema";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_CALLER_ID = process.env.TWILIO_CALLER_ID ?? "";
const RECALL_API_KEY = process.env.RECALL_AI_API_KEY ?? "";

function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function resolveBaseUrl(): string {
  if (process.env.REPLIT_DEPLOYMENT_URL) return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:3000";
}

async function publishBridgeEvent(conferenceId: number, eventType: string, data: any) {
  try {
    const { AblyRealtimeService } = await import("../services/AblyRealtimeService");
    await AblyRealtimeService.publishToEvent(`bridge-${conferenceId}`, eventType, data);
  } catch (e) {
    console.log("[Bridge] Ably publish skipped:", (e as Error).message);
  }
}

async function logOperatorAction(
  conferenceId: number | null,
  action: string,
  category: string,
  targetId?: number,
  metadata?: any,
) {
  const db = await getDb();
  await db.insert(bridgeOperatorActions).values({
    conferenceId,
    action,
    category,
    targetId: targetId ?? null,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

async function requireConference(db: any, conferenceId: number) {
  const [conf] = await db.select().from(bridgeConferences).where(eq(bridgeConferences.id, conferenceId));
  if (!conf) throw new Error("Conference not found");
  return conf;
}

async function requireParticipantInConference(db: any, participantId: number, conferenceId: number) {
  const [p] = await db.select().from(bridgeParticipants)
    .where(and(eq(bridgeParticipants.id, participantId), eq(bridgeParticipants.conferenceId, conferenceId)));
  if (!p) throw new Error("Participant not found in this conference");
  return p;
}

async function requireQuestionInConference(db: any, questionId: number, conferenceId: number) {
  const [q] = await db.select().from(bridgeQaQuestions)
    .where(and(eq(bridgeQaQuestions.id, questionId), eq(bridgeQaQuestions.conferenceId, conferenceId)));
  if (!q) throw new Error("Question not found in this conference");
  return q;
}

async function requireGreeterInConference(db: any, greeterId: number, conferenceId: number) {
  const [g] = await db.select().from(bridgeGreeterQueue)
    .where(and(eq(bridgeGreeterQueue.id, greeterId), eq(bridgeGreeterQueue.conferenceId, conferenceId)));
  if (!g) throw new Error("Greeter entry not found in this conference");
  return g;
}

export const bridgeConsoleRouter = router({
  createEvent: operatorProcedure
    .input(z.object({
      name: z.string().min(1),
      organiserName: z.string().optional(),
      organiserEmail: z.string().optional(),
      scheduledAt: z.string().optional(),
      dialInNumber: z.string().optional(),
      externalSources: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const accessCode = String(Math.floor(10000000 + Math.random() * 90000000));
      const [event] = await db.insert(bridgeEvents).values({
        name: input.name,
        organiserName: input.organiserName,
        organiserEmail: input.organiserEmail,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        accessCode,
        dialInNumber: input.dialInNumber,
        externalSources: input.externalSources ? JSON.stringify(input.externalSources) : null,
      }).returning();

      const greenRoomName = `bridge-green-room-${event.id}`;
      const mainConfName = `bridge-main-${event.id}`;

      const [greenRoom] = await db.insert(bridgeConferences).values({
        bridgeEventId: event.id,
        twilioConfName: greenRoomName,
        type: "green_room",
        phase: "waiting",
      }).returning();

      const [mainConf] = await db.insert(bridgeConferences).values({
        bridgeEventId: event.id,
        twilioConfName: mainConfName,
        type: "main",
        phase: "waiting",
      }).returning();

      return {
        event,
        greenRoomId: greenRoom.id,
        mainConferenceId: mainConf.id,
        accessCode,
      };
    }),

  getEvents: operatorProcedure.query(async () => {
    const db = await getDb();
    return db.select().from(bridgeEvents).orderBy(desc(bridgeEvents.createdAt));
  }),

  getEvent: operatorProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [event] = await db.select().from(bridgeEvents).where(eq(bridgeEvents.id, input.id));
      if (!event) throw new Error("Bridge event not found");

      const conferences = await db.select().from(bridgeConferences)
        .where(eq(bridgeConferences.bridgeEventId, event.id));

      const mainConf = conferences.find(c => c.type === "main");
      const greenRoom = conferences.find(c => c.type === "green_room");

      let participants: any[] = [];
      let greeterQueue: any[] = [];
      let qaQuestions: any[] = [];

      if (mainConf) {
        participants = await db.select().from(bridgeParticipants)
          .where(eq(bridgeParticipants.bridgeEventId, event.id))
          .orderBy(asc(bridgeParticipants.createdAt));

        qaQuestions = await db.select().from(bridgeQaQuestions)
          .where(eq(bridgeQaQuestions.conferenceId, mainConf.id))
          .orderBy(asc(bridgeQaQuestions.queuePosition));
      }

      greeterQueue = await db.select().from(bridgeGreeterQueue)
        .where(and(
          eq(bridgeGreeterQueue.bridgeEventId, event.id),
          eq(bridgeGreeterQueue.status, "waiting"),
        ))
        .orderBy(asc(bridgeGreeterQueue.queuedAt));

      return { event, mainConf, greenRoom, participants, greeterQueue, qaQuestions };
    }),

  openConference: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireConference(db, input.conferenceId);
      const [conf] = await db.update(bridgeConferences)
        .set({ phase: "live", startedAt: new Date() })
        .where(eq(bridgeConferences.id, input.conferenceId))
        .returning();
      if (!conf) throw new Error("Failed to update conference");

      await db.update(bridgeParticipants)
        .set({ isMuted: false })
        .where(and(
          eq(bridgeParticipants.conferenceId, input.conferenceId),
          eq(bridgeParticipants.role, "presenter"),
        ));

      await logOperatorAction(input.conferenceId, "conference_opened", "conference");
      await publishBridgeEvent(input.conferenceId, "conference:opened", { phase: "live", startedAt: conf.startedAt });

      return { phase: "live", startedAt: conf.startedAt };
    }),

  endConference: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireConference(db, input.conferenceId);
      const [conf] = await db.update(bridgeConferences)
        .set({ phase: "ended", endedAt: new Date() })
        .where(eq(bridgeConferences.id, input.conferenceId))
        .returning();
      if (!conf) throw new Error("Failed to update conference");

      await db.update(bridgeParticipants)
        .set({ status: "left", leaveTime: new Date() })
        .where(and(
          eq(bridgeParticipants.conferenceId, input.conferenceId),
          sql`${bridgeParticipants.status} NOT IN ('left', 'removed', 'failed')`,
        ));

      await logOperatorAction(input.conferenceId, "conference_ended", "conference");
      await publishBridgeEvent(input.conferenceId, "conference:ended", { endedAt: conf.endedAt });

      return { endedAt: conf.endedAt };
    }),

  toggleLock: operatorProcedure
    .input(z.object({ conferenceId: z.number(), locked: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(bridgeConferences)
        .set({ isLocked: input.locked })
        .where(eq(bridgeConferences.id, input.conferenceId));

      await logOperatorAction(input.conferenceId, input.locked ? "conference_locked" : "conference_unlocked", "operator");
      await publishBridgeEvent(input.conferenceId, "conference:lock", { locked: input.locked });

      return { locked: input.locked };
    }),

  toggleRecording: operatorProcedure
    .input(z.object({ conferenceId: z.number(), recording: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(bridgeConferences)
        .set({ isRecording: input.recording })
        .where(eq(bridgeConferences.id, input.conferenceId));

      await logOperatorAction(input.conferenceId, input.recording ? "recording_started" : "recording_paused", "operator");
      await publishBridgeEvent(input.conferenceId, "conference:recording", { recording: input.recording });

      return { recording: input.recording };
    }),

  toggleQA: operatorProcedure
    .input(z.object({ conferenceId: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(bridgeConferences)
        .set({ qaActive: input.active })
        .where(eq(bridgeConferences.id, input.conferenceId));

      await logOperatorAction(input.conferenceId, input.active ? "qa_opened" : "qa_closed", "qa");
      await publishBridgeEvent(input.conferenceId, "qa:toggle", { active: input.active });

      return { qaActive: input.active };
    }),

  // --- GREETER QUEUE ---

  getGreeterQueue: operatorProcedure
    .input(z.object({ bridgeEventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(bridgeGreeterQueue)
        .where(and(
          eq(bridgeGreeterQueue.bridgeEventId, input.bridgeEventId),
          eq(bridgeGreeterQueue.status, "waiting"),
        ))
        .orderBy(asc(bridgeGreeterQueue.queuedAt));
    }),

  admitCaller: operatorProcedure
    .input(z.object({
      greeterId: z.number(),
      conferenceId: z.number(),
      name: z.string(),
      organisation: z.string(),
      role: z.enum(["presenter", "participant", "observer"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const greeter = await requireGreeterInConference(db, input.greeterId, input.conferenceId);

      await db.update(bridgeGreeterQueue)
        .set({ status: "admitted", admittedAt: new Date() })
        .where(and(eq(bridgeGreeterQueue.id, input.greeterId), eq(bridgeGreeterQueue.conferenceId, input.conferenceId)));

      const [conf] = await db.select().from(bridgeConferences)
        .where(eq(bridgeConferences.id, input.conferenceId));

      const [participant] = await db.insert(bridgeParticipants).values({
        bridgeEventId: greeter.bridgeEventId,
        conferenceId: input.conferenceId,
        name: input.name,
        organisation: input.organisation,
        phoneNumber: greeter.phoneNumber,
        role: input.role,
        status: "muted",
        connectionMethod: "phone",
        twilioCallSid: greeter.twilioCallSid,
        isMuted: true,
        greeted: true,
        joinTime: new Date(),
      }).returning();

      await logOperatorAction(input.conferenceId, "caller_admitted", "operator", participant.id, {
        name: input.name, organisation: input.organisation, role: input.role,
      });
      await publishBridgeEvent(input.conferenceId, "greeter:admitted", {
        greeterId: input.greeterId, participant,
      });

      return { participantId: participant.id, status: "muted" };
    }),

  rejectCaller: operatorProcedure
    .input(z.object({ greeterId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [greeter] = await db.update(bridgeGreeterQueue)
        .set({ status: "rejected" })
        .where(eq(bridgeGreeterQueue.id, input.greeterId))
        .returning();

      await logOperatorAction(input.conferenceId, "caller_rejected", "operator", input.greeterId);
      await publishBridgeEvent(input.conferenceId, "greeter:rejected", { greeterId: input.greeterId });

      return { status: "rejected" };
    }),

  editGreeter: operatorProcedure
    .input(z.object({ greeterId: z.number(), name: z.string().optional(), organisation: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: any = {};
      if (input.name) updates.transcribedName = input.name;
      if (input.organisation) updates.transcribedOrg = input.organisation;
      await db.update(bridgeGreeterQueue).set(updates).where(eq(bridgeGreeterQueue.id, input.greeterId));
      return { updated: true };
    }),

  // --- PARTICIPANT MANAGEMENT ---

  dialOut: operatorProcedure
    .input(z.object({
      bridgeEventId: z.number(),
      conferenceId: z.number(),
      name: z.string(),
      organisation: z.string(),
      phoneNumber: z.string(),
      role: z.enum(["presenter", "participant", "observer"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [participant] = await db.insert(bridgeParticipants).values({
        bridgeEventId: input.bridgeEventId,
        conferenceId: input.conferenceId,
        name: input.name,
        organisation: input.organisation,
        phoneNumber: input.phoneNumber,
        role: input.role,
        status: "dialing",
        connectionMethod: "phone",
        isMuted: true,
      }).returning();

      await logOperatorAction(input.conferenceId, "dial_out_initiated", "operator", participant.id, {
        name: input.name, phoneNumber: input.phoneNumber,
      });
      await publishBridgeEvent(input.conferenceId, "participant:dialing", { participant });

      return { participantId: participant.id, status: "dialing" };
    }),

  muteParticipant: operatorProcedure
    .input(z.object({ participantId: z.number(), conferenceId: z.number(), muted: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireParticipantInConference(db, input.participantId, input.conferenceId);
      const newStatus = input.muted ? "muted" : "live";
      await db.update(bridgeParticipants)
        .set({ isMuted: input.muted, status: newStatus })
        .where(and(eq(bridgeParticipants.id, input.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, input.muted ? "participant_muted" : "participant_unmuted", "operator", input.participantId);
      await publishBridgeEvent(input.conferenceId, "participant:updated", {
        participantId: input.participantId, isMuted: input.muted, status: newStatus,
      });

      return { status: newStatus };
    }),

  holdParticipant: operatorProcedure
    .input(z.object({ participantId: z.number(), conferenceId: z.number(), hold: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireParticipantInConference(db, input.participantId, input.conferenceId);
      const newStatus = input.hold ? "hold" : "muted";
      await db.update(bridgeParticipants)
        .set({ isOnHold: input.hold, status: newStatus })
        .where(and(eq(bridgeParticipants.id, input.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, input.hold ? "participant_held" : "participant_unheld", "operator", input.participantId);
      await publishBridgeEvent(input.conferenceId, "participant:updated", {
        participantId: input.participantId, isOnHold: input.hold, status: newStatus,
      });

      return { status: newStatus };
    }),

  removeParticipant: operatorProcedure
    .input(z.object({ participantId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireParticipantInConference(db, input.participantId, input.conferenceId);
      await db.update(bridgeParticipants)
        .set({ status: "removed", leaveTime: new Date() })
        .where(and(eq(bridgeParticipants.id, input.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, "participant_removed", "operator", input.participantId);
      await publishBridgeEvent(input.conferenceId, "participant:removed", { participantId: input.participantId });

      return { status: "removed" };
    }),

  updateParticipant: operatorProcedure
    .input(z.object({
      participantId: z.number(),
      name: z.string().optional(),
      organisation: z.string().optional(),
      role: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.organisation !== undefined) updates.organisation = input.organisation;
      if (input.role !== undefined) updates.role = input.role;
      if (input.notes !== undefined) updates.notes = input.notes;
      updates.updatedAt = new Date();

      await db.update(bridgeParticipants).set(updates)
        .where(eq(bridgeParticipants.id, input.participantId));

      return { updated: true };
    }),

  muteAll: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.update(bridgeParticipants)
        .set({ isMuted: true, status: "muted" })
        .where(and(
          eq(bridgeParticipants.conferenceId, input.conferenceId),
          sql`${bridgeParticipants.role} NOT IN ('presenter', 'operator')`,
          sql`${bridgeParticipants.status} NOT IN ('left', 'removed', 'failed', 'invited')`,
        ))
        .returning();

      await logOperatorAction(input.conferenceId, "mute_all", "operator");
      await publishBridgeEvent(input.conferenceId, "conference:mute_all", { count: result.length });

      return { mutedCount: result.length };
    }),

  unmuteAll: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const result = await db.update(bridgeParticipants)
        .set({ isMuted: false, status: "live" })
        .where(and(
          eq(bridgeParticipants.conferenceId, input.conferenceId),
          sql`${bridgeParticipants.status} NOT IN ('left', 'removed', 'failed', 'invited', 'hold')`,
        ))
        .returning();

      await logOperatorAction(input.conferenceId, "unmute_all", "operator");
      await publishBridgeEvent(input.conferenceId, "conference:unmute_all", { count: result.length });

      return { unmutedCount: result.length };
    }),

  // --- Q&A MANAGEMENT ---

  raiseHand: protectedProcedure
    .input(z.object({
      conferenceId: z.number(),
      participantId: z.number(),
      questionText: z.string().optional(),
      method: z.enum(["phone_keypress", "web_button", "operator_added"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const maxPos = await db.select({ max: sql<number>`COALESCE(MAX(${bridgeQaQuestions.queuePosition}), 0)` })
        .from(bridgeQaQuestions)
        .where(eq(bridgeQaQuestions.conferenceId, input.conferenceId));

      const nextPos = (maxPos[0]?.max ?? 0) + 1;

      const [question] = await db.insert(bridgeQaQuestions).values({
        conferenceId: input.conferenceId,
        participantId: input.participantId,
        questionText: input.questionText,
        method: input.method,
        queuePosition: nextPos,
        status: "pending",
      }).returning();

      await db.update(bridgeParticipants)
        .set({ handRaised: true, handRaisedAt: new Date() })
        .where(eq(bridgeParticipants.id, input.participantId));

      await publishBridgeEvent(input.conferenceId, "qa:raised", { question });

      return { questionId: question.id, queuePosition: nextPos };
    }),

  approveQuestion: operatorProcedure
    .input(z.object({ questionId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireQuestionInConference(db, input.questionId, input.conferenceId);
      const [q] = await db.update(bridgeQaQuestions)
        .set({ status: "approved", approvedAt: new Date() })
        .where(and(eq(bridgeQaQuestions.id, input.questionId), eq(bridgeQaQuestions.conferenceId, input.conferenceId)))
        .returning();
      if (!q) throw new Error("Failed to approve question");

      await logOperatorAction(input.conferenceId, "qa_approved", "qa", input.questionId);
      await publishBridgeEvent(input.conferenceId, "qa:approved", { question: q });

      return { status: "approved", queuePosition: q.queuePosition };
    }),

  takeQuestion: operatorProcedure
    .input(z.object({ questionId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireQuestionInConference(db, input.questionId, input.conferenceId);
      const [q] = await db.update(bridgeQaQuestions)
        .set({ status: "live", wentLiveAt: new Date() })
        .where(and(eq(bridgeQaQuestions.id, input.questionId), eq(bridgeQaQuestions.conferenceId, input.conferenceId)))
        .returning();
      if (!q) throw new Error("Failed to take question");

      if (q.participantId) {
        await db.update(bridgeParticipants)
          .set({ isMuted: false, status: "live" })
          .where(and(eq(bridgeParticipants.id, q.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));
      }

      await logOperatorAction(input.conferenceId, "qa_take", "qa", input.questionId);
      await publishBridgeEvent(input.conferenceId, "qa:live", { question: q });

      return { status: "live" };
    }),

  doneQuestion: operatorProcedure
    .input(z.object({ questionId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireQuestionInConference(db, input.questionId, input.conferenceId);
      const [q] = await db.update(bridgeQaQuestions)
        .set({ status: "answered", answeredAt: new Date() })
        .where(and(eq(bridgeQaQuestions.id, input.questionId), eq(bridgeQaQuestions.conferenceId, input.conferenceId)))
        .returning();
      if (!q) throw new Error("Failed to complete question");

      if (q.participantId) {
        await db.update(bridgeParticipants)
          .set({ isMuted: true, status: "muted", handRaised: false })
          .where(and(eq(bridgeParticipants.id, q.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));
      }

      await logOperatorAction(input.conferenceId, "qa_done", "qa", input.questionId);
      await publishBridgeEvent(input.conferenceId, "qa:done", { question: q });

      return { status: "answered" };
    }),

  dismissQuestion: operatorProcedure
    .input(z.object({ questionId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireQuestionInConference(db, input.questionId, input.conferenceId);
      await db.update(bridgeQaQuestions)
        .set({ status: "dismissed", dismissedAt: new Date() })
        .where(and(eq(bridgeQaQuestions.id, input.questionId), eq(bridgeQaQuestions.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, "qa_dismissed", "qa", input.questionId);
      await publishBridgeEvent(input.conferenceId, "qa:dismissed", { questionId: input.questionId });

      return { status: "dismissed" };
    }),

  skipQuestion: operatorProcedure
    .input(z.object({ questionId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await requireQuestionInConference(db, input.questionId, input.conferenceId);
      const maxPos = await db.select({ max: sql<number>`COALESCE(MAX(${bridgeQaQuestions.queuePosition}), 0)` })
        .from(bridgeQaQuestions)
        .where(eq(bridgeQaQuestions.conferenceId, input.conferenceId));

      const newPos = (maxPos[0]?.max ?? 0) + 1;

      await db.update(bridgeQaQuestions)
        .set({ queuePosition: newPos, status: "pending" })
        .where(and(eq(bridgeQaQuestions.id, input.questionId), eq(bridgeQaQuestions.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, "qa_skipped", "qa", input.questionId);
      await publishBridgeEvent(input.conferenceId, "qa:skipped", { questionId: input.questionId, newPosition: newPos });

      return { newPosition: newPos };
    }),

  // --- OPERATOR EVENT LOG ---

  getOperatorLog: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      return db.select().from(bridgeOperatorActions)
        .where(eq(bridgeOperatorActions.conferenceId, input.conferenceId))
        .orderBy(desc(bridgeOperatorActions.performedAt))
        .limit(200);
    }),

  addLogEntry: operatorProcedure
    .input(z.object({
      conferenceId: z.number(),
      action: z.string(),
      category: z.string(),
      targetId: z.number().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      await logOperatorAction(input.conferenceId, input.action, input.category, input.targetId, input.metadata);
      return { logged: true };
    }),

  // --- ATTENDANCE REPORT ---

  getAttendanceReport: operatorProcedure
    .input(z.object({ bridgeEventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [event] = await db.select().from(bridgeEvents)
        .where(eq(bridgeEvents.id, input.bridgeEventId));

      const participants = await db.select().from(bridgeParticipants)
        .where(eq(bridgeParticipants.bridgeEventId, input.bridgeEventId))
        .orderBy(asc(bridgeParticipants.joinTime));

      const conferences = await db.select().from(bridgeConferences)
        .where(eq(bridgeConferences.bridgeEventId, input.bridgeEventId));

      const mainConf = conferences.find(c => c.type === "main");

      return {
        event,
        conference: mainConf,
        participants: participants.map(p => ({
          name: p.name,
          organisation: p.organisation,
          role: p.role,
          connectionMethod: p.connectionMethod,
          joinTime: p.joinTime,
          leaveTime: p.leaveTime,
          durationSeconds: p.durationSeconds,
          status: p.status,
        })),
        summary: {
          totalParticipants: participants.length,
          presenters: participants.filter(p => p.role === "presenter").length,
          attendees: participants.filter(p => p.role === "participant").length,
          observers: participants.filter(p => p.role === "observer").length,
        },
      };
    }),

  // --- PRE-REGISTER PARTICIPANTS ---

  addInvitedParticipant: operatorProcedure
    .input(z.object({
      bridgeEventId: z.number(),
      name: z.string(),
      organisation: z.string(),
      phoneNumber: z.string(),
      role: z.enum(["presenter", "participant", "observer"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [participant] = await db.insert(bridgeParticipants).values({
        bridgeEventId: input.bridgeEventId,
        name: input.name,
        organisation: input.organisation,
        phoneNumber: input.phoneNumber,
        role: input.role,
        status: "invited",
        connectionMethod: "phone",
        isMuted: true,
      }).returning();

      return participant;
    }),

  twilioDialOut: operatorProcedure
    .input(z.object({
      bridgeEventId: z.number(),
      conferenceId: z.number(),
      name: z.string(),
      organisation: z.string(),
      phoneNumber: z.string(),
      role: z.enum(["presenter", "participant", "observer"]),
    }))
    .mutation(async ({ input }) => {
      const client = getTwilioClient();
      const db = await getDb();
      const conf = await requireConference(db, input.conferenceId);

      const [participant] = await db.insert(bridgeParticipants).values({
        bridgeEventId: input.bridgeEventId,
        conferenceId: input.conferenceId,
        name: input.name,
        organisation: input.organisation,
        phoneNumber: input.phoneNumber,
        role: input.role,
        status: "dialing",
        connectionMethod: "phone",
        isMuted: input.role !== "presenter",
      }).returning();

      if (client && TWILIO_CALLER_ID) {
        try {
          const baseUrl = resolveBaseUrl();
          const call = await client.calls.create({
            to: input.phoneNumber,
            from: TWILIO_CALLER_ID,
            url: `${baseUrl}/api/bridge/admit-to-conference?conferenceName=${encodeURIComponent(conf.twilioConfName ?? "")}`,
            method: "POST",
            statusCallback: `${baseUrl}/api/bridge/call-status`,
            statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
            statusCallbackMethod: "POST",
          } as any);

          await db.update(bridgeParticipants)
            .set({ twilioCallSid: call.sid })
            .where(eq(bridgeParticipants.id, participant.id));

          await logOperatorAction(input.conferenceId, "twilio_dial_out", "operator", participant.id, {
            phoneNumber: input.phoneNumber, callSid: call.sid,
          });
        } catch (err) {
          console.error("[Bridge] Twilio dial-out failed:", (err as Error).message);
          await db.update(bridgeParticipants)
            .set({ status: "failed" })
            .where(eq(bridgeParticipants.id, participant.id));
          throw new Error(`Dial-out failed: ${(err as Error).message}`);
        }
      } else {
        await logOperatorAction(input.conferenceId, "dial_out_simulated", "operator", participant.id, {
          phoneNumber: input.phoneNumber, note: "Twilio not configured",
        });
      }

      await publishBridgeEvent(input.conferenceId, "participant:dialing", { participant });
      return { participantId: participant.id, status: participant.status };
    }),

  twilioAdmitCaller: operatorProcedure
    .input(z.object({
      greeterId: z.number(),
      conferenceId: z.number(),
      name: z.string(),
      organisation: z.string(),
      role: z.enum(["presenter", "participant", "observer"]),
    }))
    .mutation(async ({ input }) => {
      const client = getTwilioClient();
      const db = await getDb();
      const greeter = await requireGreeterInConference(db, input.greeterId, input.conferenceId);
      const conf = await requireConference(db, input.conferenceId);

      await db.update(bridgeGreeterQueue)
        .set({ status: "admitted", admittedAt: new Date() })
        .where(eq(bridgeGreeterQueue.id, input.greeterId));

      const [participant] = await db.insert(bridgeParticipants).values({
        bridgeEventId: greeter.bridgeEventId,
        conferenceId: input.conferenceId,
        name: input.name,
        organisation: input.organisation,
        phoneNumber: greeter.phoneNumber,
        role: input.role,
        status: "muted",
        connectionMethod: "phone",
        twilioCallSid: greeter.twilioCallSid,
        isMuted: true,
        greeted: true,
        joinTime: new Date(),
      }).returning();

      if (client && greeter.twilioCallSid && conf.twilioConfName) {
        try {
          const baseUrl = resolveBaseUrl();
          await client.calls(greeter.twilioCallSid).update({
            url: `${baseUrl}/api/bridge/admit-to-conference?conferenceName=${encodeURIComponent(conf.twilioConfName)}`,
            method: "POST",
          } as any);
        } catch (err) {
          console.error("[Bridge] Twilio redirect failed:", (err as Error).message);
        }
      }

      await logOperatorAction(input.conferenceId, "caller_admitted_twilio", "operator", participant.id, {
        name: input.name, organisation: input.organisation,
      });
      await publishBridgeEvent(input.conferenceId, "greeter:admitted", {
        greeterId: input.greeterId, participant,
      });

      return { participantId: participant.id, status: "muted" };
    }),

  twilioMuteParticipant: operatorProcedure
    .input(z.object({ participantId: z.number(), conferenceId: z.number(), muted: z.boolean() }))
    .mutation(async ({ input }) => {
      const client = getTwilioClient();
      const db = await getDb();
      const p = await requireParticipantInConference(db, input.participantId, input.conferenceId);
      const conf = await requireConference(db, input.conferenceId);

      if (client && conf.twilioConfSid && p.twilioCallSid) {
        try {
          await client.conferences(conf.twilioConfSid)
            .participants(p.twilioCallSid)
            .update({ muted: input.muted });
        } catch (err) {
          console.error("[Bridge] Twilio mute failed:", (err as Error).message);
          throw new Error(`Twilio mute failed: ${(err as Error).message}`);
        }
      }

      const newStatus = input.muted ? "muted" : "live";
      await db.update(bridgeParticipants)
        .set({ isMuted: input.muted, status: newStatus })
        .where(and(eq(bridgeParticipants.id, input.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, input.muted ? "twilio_muted" : "twilio_unmuted", "operator", input.participantId);
      await publishBridgeEvent(input.conferenceId, "participant:updated", {
        participantId: input.participantId, isMuted: input.muted, status: newStatus,
      });

      return { status: newStatus };
    }),

  twilioHoldParticipant: operatorProcedure
    .input(z.object({ participantId: z.number(), conferenceId: z.number(), hold: z.boolean() }))
    .mutation(async ({ input }) => {
      const client = getTwilioClient();
      const db = await getDb();
      const p = await requireParticipantInConference(db, input.participantId, input.conferenceId);
      const conf = await requireConference(db, input.conferenceId);

      if (client && conf.twilioConfSid && p.twilioCallSid) {
        try {
          await client.conferences(conf.twilioConfSid)
            .participants(p.twilioCallSid)
            .update({
              hold: input.hold,
              holdUrl: input.hold ? "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical" : undefined,
            } as any);
        } catch (err) {
          console.error("[Bridge] Twilio hold failed:", (err as Error).message);
          throw new Error(`Twilio hold failed: ${(err as Error).message}`);
        }
      }

      const newStatus = input.hold ? "hold" : "muted";
      await db.update(bridgeParticipants)
        .set({ isOnHold: input.hold, status: newStatus })
        .where(and(eq(bridgeParticipants.id, input.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, input.hold ? "twilio_held" : "twilio_unheld", "operator", input.participantId);
      await publishBridgeEvent(input.conferenceId, "participant:updated", {
        participantId: input.participantId, isOnHold: input.hold, status: newStatus,
      });

      return { status: newStatus };
    }),

  twilioRemoveParticipant: operatorProcedure
    .input(z.object({ participantId: z.number(), conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const client = getTwilioClient();
      const db = await getDb();
      const p = await requireParticipantInConference(db, input.participantId, input.conferenceId);
      const conf = await requireConference(db, input.conferenceId);

      if (client && conf.twilioConfSid && p.twilioCallSid) {
        try {
          await client.conferences(conf.twilioConfSid)
            .participants(p.twilioCallSid)
            .remove();
        } catch (err) {
          console.error("[Bridge] Twilio remove failed:", (err as Error).message);
          throw new Error(`Twilio remove failed: ${(err as Error).message}`);
        }
      }

      await db.update(bridgeParticipants)
        .set({ status: "removed", leaveTime: new Date() })
        .where(and(eq(bridgeParticipants.id, input.participantId), eq(bridgeParticipants.conferenceId, input.conferenceId)));

      await logOperatorAction(input.conferenceId, "twilio_removed", "operator", input.participantId);
      await publishBridgeEvent(input.conferenceId, "participant:removed", { participantId: input.participantId });

      return { status: "removed" };
    }),

  twilioAnnounce: operatorProcedure
    .input(z.object({ conferenceId: z.number(), message: z.string() }))
    .mutation(async ({ input }) => {
      const client = getTwilioClient();
      const db = await getDb();
      const conf = await requireConference(db, input.conferenceId);

      if (client && conf.twilioConfSid) {
        try {
          await client.conferences(conf.twilioConfSid).update({
            announceUrl: `http://twimlets.com/message?Message=${encodeURIComponent(input.message)}`,
            announceMethod: "GET",
          } as any);
        } catch (err) {
          console.error("[Bridge] Twilio announce failed:", (err as Error).message);
        }
      }

      await logOperatorAction(input.conferenceId, "announcement", "operator", undefined, { message: input.message });
      await publishBridgeEvent(input.conferenceId, "conference:announce", { message: input.message });

      return { announced: true };
    }),

  deployRecallBot: operatorProcedure
    .input(z.object({ bridgeEventId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [event] = await db.select().from(bridgeEvents)
        .where(eq(bridgeEvents.id, input.bridgeEventId));
      if (!event) throw new Error("Bridge event not found");

      if (!RECALL_API_KEY) {
        return { deployed: false, reason: "RECALL_AI_API_KEY not configured" };
      }

      const sources: string[] = [];
      if (event.externalSources) {
        try { sources.push(...JSON.parse(event.externalSources)); } catch {}
      }

      if (sources.length === 0) {
        return { deployed: false, reason: "No external meeting URLs configured" };
      }

      const deployedBots: { url: string; botId: string }[] = [];
      const baseUrl = resolveBaseUrl();

      for (const meetingUrl of sources) {
        try {
          const response = await fetch("https://api.recall.ai/api/v1/bot/", {
            method: "POST",
            headers: {
              "Authorization": `Token ${RECALL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              meeting_url: meetingUrl,
              bot_name: `CuraLive Bridge - ${event.name}`,
              transcription_options: { provider: "default" },
              real_time_transcription: {
                destination_url: `${baseUrl}/api/recall/webhook`,
                partial_results: false,
              },
              metadata: {
                bridgeEventId: event.id,
                eventName: event.name,
                ablyChannel: `bridge-recall-${event.id}`,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json() as any;
            deployedBots.push({ url: meetingUrl, botId: data.id });
            console.log(`[Bridge Recall] Bot deployed: ${data.id} for ${meetingUrl}`);
          } else {
            console.error(`[Bridge Recall] Deploy failed for ${meetingUrl}: ${response.status}`);
          }
        } catch (err) {
          console.error(`[Bridge Recall] Deploy error for ${meetingUrl}:`, (err as Error).message);
        }
      }

      if (deployedBots.length === 0) {
        return { deployed: false, reason: "All bot deployments failed", botCount: 0, bots: [] };
      }

      await db.update(bridgeEvents)
        .set({ recallBotIds: JSON.stringify(deployedBots.map(b => b.botId)) })
        .where(eq(bridgeEvents.id, input.bridgeEventId));

      let shadowSessionId: number | null = null;
      try {
        const [session] = await db.insert(shadowSessions).values({
          clientName: event.organiserName ?? "Bridge Event",
          eventName: event.name,
          platform: "bridge",
          status: "live",
          recallBotId: deployedBots[0]?.botId ?? null,
          startedAt: new Date(),
        } as any).returning();
        shadowSessionId = session.id;

        await db.update(bridgeEvents)
          .set({ shadowSessionId: session.id })
          .where(eq(bridgeEvents.id, input.bridgeEventId));
      } catch (err) {
        console.error("[Bridge Recall] Shadow session creation failed:", (err as Error).message);
      }

      return {
        deployed: true,
        botCount: deployedBots.length,
        bots: deployedBots,
        shadowSessionId,
      };
    }),

  getPostCallPackage: operatorProcedure
    .input(z.object({ bridgeEventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [event] = await db.select().from(bridgeEvents)
        .where(eq(bridgeEvents.id, input.bridgeEventId));
      if (!event) throw new Error("Bridge event not found");

      const conferences = await db.select().from(bridgeConferences)
        .where(eq(bridgeConferences.bridgeEventId, input.bridgeEventId));
      const mainConf = conferences.find(c => c.type === "main");

      const participants = await db.select().from(bridgeParticipants)
        .where(eq(bridgeParticipants.bridgeEventId, input.bridgeEventId))
        .orderBy(asc(bridgeParticipants.joinTime));

      let recordings: any[] = [];
      if (mainConf) {
        recordings = await db.select().from(bridgeCallRecordings)
          .where(eq(bridgeCallRecordings.conferenceId, mainConf.id));
      }

      let qaQuestions: any[] = [];
      if (mainConf) {
        qaQuestions = await db.select().from(bridgeQaQuestions)
          .where(eq(bridgeQaQuestions.conferenceId, mainConf.id))
          .orderBy(asc(bridgeQaQuestions.queuePosition));
      }

      let operatorLog: any[] = [];
      if (mainConf) {
        operatorLog = await db.select().from(bridgeOperatorActions)
          .where(eq(bridgeOperatorActions.conferenceId, mainConf.id))
          .orderBy(asc(bridgeOperatorActions.performedAt))
          .limit(500);
      }

      let shadowReport: any = null;
      if (event.shadowSessionId) {
        try {
          const [session] = await db.select().from(shadowSessions)
            .where(eq(shadowSessions.id, event.shadowSessionId));
          if (session) {
            shadowReport = {
              sessionId: session.id,
              status: session.status,
              clientName: session.clientName,
              eventName: session.eventName,
              averageSentiment: (session as any).averageSentiment ?? null,
              complianceFlags: (session as any).complianceFlags ?? 0,
            };
          }
        } catch {}
      }

      const activePresenters = participants.filter(p => p.role === "presenter");
      const activeAttendees = participants.filter(p => p.role === "participant");
      const activeObservers = participants.filter(p => p.role === "observer");

      const confStartedAt = mainConf?.startedAt;
      const confEndedAt = mainConf?.endedAt;
      const durationMinutes = confStartedAt && confEndedAt
        ? Math.round((confEndedAt.getTime() - confStartedAt.getTime()) / 60000)
        : null;

      return {
        event: {
          id: event.id,
          name: event.name,
          organiserName: event.organiserName,
          organiserEmail: event.organiserEmail,
          accessCode: event.accessCode,
          scheduledAt: event.scheduledAt,
          status: event.status,
        },
        conference: mainConf ? {
          id: mainConf.id,
          phase: mainConf.phase,
          startedAt: mainConf.startedAt,
          endedAt: mainConf.endedAt,
          durationMinutes,
        } : null,
        attendance: {
          total: participants.length,
          presenters: activePresenters.length,
          attendees: activeAttendees.length,
          observers: activeObservers.length,
          participants: participants.map(p => ({
            name: p.name,
            organisation: p.organisation,
            role: p.role,
            connectionMethod: p.connectionMethod,
            joinTime: p.joinTime,
            leaveTime: p.leaveTime,
            durationSeconds: p.durationSeconds,
            status: p.status,
          })),
        },
        recordings: recordings.map(r => ({
          id: r.id,
          status: r.status,
          durationSec: r.durationSec,
          storageUrl: r.storageUrl,
          transcriptUrl: r.transcriptUrl,
        })),
        qa: {
          total: qaQuestions.length,
          answered: qaQuestions.filter(q => q.status === "answered").length,
          dismissed: qaQuestions.filter(q => q.status === "dismissed").length,
          pending: qaQuestions.filter(q => q.status === "pending").length,
          questions: qaQuestions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            method: q.method,
            status: q.status,
            raisedAt: q.raisedAt,
            answeredAt: q.answeredAt,
          })),
        },
        operatorLog: operatorLog.map(l => ({
          action: l.action,
          category: l.category,
          performedAt: l.performedAt,
        })),
        shadowReport,
      };
    }),

  exportAttendanceCsv: operatorProcedure
    .input(z.object({ bridgeEventId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      const [event] = await db.select().from(bridgeEvents)
        .where(eq(bridgeEvents.id, input.bridgeEventId));
      if (!event) throw new Error("Bridge event not found");

      const participants = await db.select().from(bridgeParticipants)
        .where(eq(bridgeParticipants.bridgeEventId, input.bridgeEventId))
        .orderBy(asc(bridgeParticipants.joinTime));

      const header = "Name,Organisation,Role,Connection,Join Time,Leave Time,Duration (s),Status";
      const rows = participants.map(p => [
        `"${(p.name ?? "").replace(/"/g, '""')}"`,
        `"${(p.organisation ?? "").replace(/"/g, '""')}"`,
        p.role,
        p.connectionMethod,
        p.joinTime?.toISOString() ?? "",
        p.leaveTime?.toISOString() ?? "",
        p.durationSeconds ?? "",
        p.status,
      ].join(","));

      return {
        filename: `${event.name.replace(/[^a-zA-Z0-9]/g, "_")}_attendance.csv`,
        csv: [header, ...rows].join("\n"),
      };
    }),

  updateEventStatus: operatorProcedure
    .input(z.object({ bridgeEventId: z.number(), status: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db.update(bridgeEvents)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(bridgeEvents.id, input.bridgeEventId));
      return { status: input.status };
    }),
});
