import { z } from "zod";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { protectedProcedure, operatorProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  bridgeEvents,
  bridgeConferences,
  bridgeParticipants,
  bridgeGreeterQueue,
  bridgeQaQuestions,
  bridgeOperatorActions,
  bridgeCallRecordings,
} from "../../drizzle/schema";

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
});
