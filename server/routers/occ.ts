/**
 * OCC — Operator Call Centre tRPC router.
 * Handles all conference management, participant actions, lounge, chat, and operator state.
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure, operatorProcedure, adminProcedure } from "../_core/trpc";
import {
  getOccConferences,
  getOccConferenceById,
  getOccConferenceByEventId,
  updateOccConference,
  getOccParticipants,
  getOccParticipantById,
  updateOccParticipantState,
  updateOccParticipant,
  getOccLoungeEntries,
  pickFromLounge,
  getOccOperatorRequests,
  pickOperatorRequest,
  getOrCreateOperatorSession,
  updateOperatorState,
  heartbeatOperatorSession,
  getOccChatMessages,
  insertOccChatMessage,
  updateChatMessageTranslation,
  getOccAudioFiles,
  getOccParticipantHistory,
  getOccAccessCodeLog,
} from "../db.occ";
import { getDb } from "../db";
import {
  occConferences,
  occParticipants,
  occLounge,
  occOperatorRequests,
  occParticipantHistory,
  occDialOutHistory,
  occGreenRooms,
} from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function publishAblyEvent(channel: string, event: string, data: unknown) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;
  try {
    const [keyName, keySecret] = apiKey.split(":");
    const auth = Buffer.from(apiKey).toString("base64");
    const url = `https://rest.ably.io/channels/${encodeURIComponent(channel)}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: event, data }),
    });
  } catch (e) {
    console.warn("[Ably] Failed to publish:", e);
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const occRouter = router({
  // ── Conference queries ────────────────────────────────────────────────────

  getConferences: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "running", "completed", "alarm"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      return getOccConferences(input?.status);
    }),

  getConference: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getOccConferenceById(input.id);
    }),

  getConferenceByEventId: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return getOccConferenceByEventId(input.eventId);
    }),

  // ── Conference actions ────────────────────────────────────────────────────

  toggleRecording: operatorProcedure
    .input(z.object({ conferenceId: z.number(), isRecording: z.boolean() }))
    .mutation(async ({ input }) => {
      const conf = await updateOccConference(input.conferenceId, { isRecording: input.isRecording });
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "conference:updated",
        { isRecording: input.isRecording }
      );
      return conf;
    }),

  toggleLock: operatorProcedure
    .input(z.object({ conferenceId: z.number(), isLocked: z.boolean() }))
    .mutation(async ({ input }) => {
      const conf = await updateOccConference(input.conferenceId, { isLocked: input.isLocked });
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "conference:updated",
        { isLocked: input.isLocked }
      );
      return conf;
    }),

  muteAll: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      // Get all participants and mute connected/speaking ones
      const participants = await getOccParticipants(input.conferenceId);
      for (const p of participants) {
        if (p.state === "connected" || p.state === "speaking") {
          await updateOccParticipantState(p.id, "muted");
        }
      }
      await publishAblyEvent(`occ:conference:${input.conferenceId}`, "conference:mute_all", {});
      return { success: true };
    }),

  terminateConference: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      await updateOccConference(input.conferenceId, { status: "completed", endedAt: new Date() });
      await publishAblyEvent(`occ:conference:${input.conferenceId}`, "conference:terminated", {});
      return { success: true };
    }),

  // ── Participant queries ───────────────────────────────────────────────────

  getParticipants: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return getOccParticipants(input.conferenceId);
    }),

  // ── Participant actions ───────────────────────────────────────────────────

  updateParticipantState: operatorProcedure
    .input(z.object({
      participantId: z.number(),
      conferenceId: z.number(),
      state: z.enum(["connected", "muted", "parked", "speaking", "waiting_operator", "dropped"]),
      operatorId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const participant = await updateOccParticipantState(input.participantId, input.state);
      // Log history
      const db = await getDb();
      if (db) {
        const eventMap: Record<string, string> = {
          muted: "muted",
          connected: "unmuted",
          parked: "parked",
          speaking: "speaking",
          waiting_operator: "picked",
          dropped: "disconnected",
        };
        await db.insert(occParticipantHistory).values({
          conferenceId: input.conferenceId,
          participantId: input.participantId,
          event: (eventMap[input.state] ?? input.state) as any,
          triggeredBy: "operator",
          operatorId: input.operatorId,
          occurredAt: new Date(),
        });
      }
      // Publish real-time update
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "participant:updated",
        { participantId: input.participantId, state: input.state }
      );
      return participant;
    }),

  toggleRequestToSpeak: operatorProcedure
    .input(z.object({
      participantId: z.number(),
      conferenceId: z.number(),
      requestToSpeak: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      await updateOccParticipant(input.participantId, { requestToSpeak: input.requestToSpeak });
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "participant:speak_request",
        { participantId: input.participantId, requestToSpeak: input.requestToSpeak }
      );
      return { success: true };
    }),

  dialOut: operatorProcedure
    .input(z.object({
      conferenceId: z.number(),
      name: z.string().optional(),
      phoneNumber: z.string(),
      role: z.enum(["moderator", "participant"]).default("participant"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };
      // Get next line number
      const existing = await getOccParticipants(input.conferenceId);
      const nextLine = (existing.length > 0 ? Math.max(...existing.map(p => p.lineNumber)) : 0) + 1;
      // Insert as incoming participant
      await db.insert(occParticipants).values({
        conferenceId: input.conferenceId,
        lineNumber: nextLine,
        role: input.role,
        name: input.name ?? null,
        phoneNumber: input.phoneNumber,
        state: "incoming",
        connectedAt: new Date(),
      });
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "participant:added",
        { name: input.name, phoneNumber: input.phoneNumber, role: input.role }
      );
      return { success: true };
    }),

  // ── Lounge ────────────────────────────────────────────────────────────────

  getLounge: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return getOccLoungeEntries(input.conferenceId);
    }),

  pickFromLounge: operatorProcedure
    .input(z.object({
      loungeId: z.number(),
      conferenceId: z.number(),
      operatorId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await pickFromLounge(input.loungeId, input.operatorId ?? 0);
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "lounge:picked",
        { loungeId: input.loungeId }
      );
      return { success: true };
    }),

  // ── Operator Requests ─────────────────────────────────────────────────────

  getOperatorRequests: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return getOccOperatorRequests(input.conferenceId);
    }),

  pickOperatorRequest: operatorProcedure
    .input(z.object({
      requestId: z.number(),
      conferenceId: z.number(),
      operatorId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      await pickOperatorRequest(input.requestId, input.operatorId ?? 0);
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "operator_request:picked",
        { requestId: input.requestId }
      );
      return { success: true };
    }),

  // ── Operator State ────────────────────────────────────────────────────────

  getOperatorSession: protectedProcedure
    .query(async ({ ctx }) => {
      return getOrCreateOperatorSession(ctx.user.id, ctx.user.name ?? "Operator");
    }),

  setOperatorState: protectedProcedure
    .input(z.object({
      state: z.enum(["absent", "present", "in_call", "break"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateOperatorState(ctx.user.id, input.state);
      return { success: true };
    }),

  heartbeat: protectedProcedure
    .mutation(async ({ ctx }) => {
      await heartbeatOperatorSession(ctx.user.id);
      return { success: true };
    }),

  // ── Chat ──────────────────────────────────────────────────────────────────

  getChatMessages: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return getOccChatMessages(input.conferenceId);
    }),

  sendChatMessage: operatorProcedure
    .input(z.object({
      conferenceId: z.number(),
      senderName: z.string(),
      senderType: z.enum(["operator", "participant", "moderator", "system"]),
      message: z.string().min(1).max(2000),
      recipientType: z.enum(["all", "hosts", "participant"]).default("all"),
      autoTranslateTo: z.string().optional(), // e.g. 'en', 'fr' — if set, auto-translate on send
    }))
    .mutation(async ({ input }) => {
      const result = await insertOccChatMessage({
        conferenceId: input.conferenceId,
        senderType: input.senderType,
        senderName: input.senderName,
        message: input.message,
        recipientType: input.recipientType,
        sentAt: new Date(),
      });

      // Auto-translate if requested (fire-and-forget, don't block the response)
      if (input.autoTranslateTo && result) {
        const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
        if (insertId) {
          setImmediate(async () => {
            try {
              const llmResp = await invokeLLM({
                messages: [
                  {
                    role: "system",
                    content: `You are a professional translator. Detect the language of the input text and translate it to ${input.autoTranslateTo}. Respond ONLY with a JSON object: {"detectedLanguage": "<ISO-639-1 code>", "translation": "<translated text>"}. If the text is already in ${input.autoTranslateTo}, set translation to the original text.`,
                  },
                  { role: "user", content: input.message },
                ],
                response_format: {
                  type: "json_schema",
                  json_schema: {
                    name: "translation_result",
                    strict: true,
                    schema: {
                      type: "object",
                      properties: {
                        detectedLanguage: { type: "string" },
                        translation: { type: "string" },
                      },
                      required: ["detectedLanguage", "translation"],
                      additionalProperties: false,
                    },
                  },
                },
              });
              const parsed = JSON.parse(llmResp.choices[0].message.content as string);
              await updateChatMessageTranslation(
                insertId,
                parsed.detectedLanguage,
                parsed.translation,
                input.autoTranslateTo!
              );
              // Publish the translation via Ably so all operators get it instantly
              await publishAblyEvent(
                `occ:conference:${input.conferenceId}`,
                "chat:translation",
                {
                  messageId: insertId,
                  detectedLanguage: parsed.detectedLanguage,
                  translatedMessage: parsed.translation,
                  translationLanguage: input.autoTranslateTo,
                }
              );
            } catch (e) {
              // Translation failure is non-critical
            }
          });
        }
      }

      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "chat:message",
        { senderName: input.senderName, message: input.message, recipientType: input.recipientType }
      );
      return { success: true };
    }),

  // ── Translate a single message on demand
  translateChatMessage: protectedProcedure
    .input(z.object({
      messageId: z.number(),
      message: z.string(),
      targetLanguage: z.string().min(2).max(10),
      conferenceId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const llmResp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Detect the language of the input text and translate it to ${input.targetLanguage}. Respond ONLY with a JSON object: {"detectedLanguage": "<ISO-639-1 code>", "translation": "<translated text>"}. If the text is already in ${input.targetLanguage}, set translation to the original text.`,
          },
          { role: "user", content: input.message },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translation_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                detectedLanguage: { type: "string" },
                translation: { type: "string" },
              },
              required: ["detectedLanguage", "translation"],
              additionalProperties: false,
            },
          },
        },
      });
      const parsed = JSON.parse(llmResp.choices[0].message.content as string);
      await updateChatMessageTranslation(
        input.messageId,
        parsed.detectedLanguage,
        parsed.translation,
        input.targetLanguage
      );
      // Broadcast translation to all operators on this conference
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "chat:translation",
        {
          messageId: input.messageId,
          detectedLanguage: parsed.detectedLanguage,
          translatedMessage: parsed.translation,
          translationLanguage: input.targetLanguage,
        }
      );
      return {
        detectedLanguage: parsed.detectedLanguage,
        translatedMessage: parsed.translation,
        translationLanguage: input.targetLanguage,
      };
    }),

  // ── Audio Files ───────────────────────────────────────────────────────────

  getAudioFiles: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return getOccAudioFiles(input.conferenceId);
    }),

  // ── Participant History ───────────────────────────────────────────────────

  getParticipantHistory: protectedProcedure
    .input(z.object({ participantId: z.number() }))
    .query(async ({ input }) => {
      return getOccParticipantHistory(input.participantId);
    }),

  // ── Access Code Log ───────────────────────────────────────────────────────

  getAccessCodeLog: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      return getOccAccessCodeLog(input.conferenceId);
    }),

  // ── Seed demo data ────────────────────────────────────────────────────────

  seedDemoData: adminProcedure
    .input(z.object({ force: z.boolean().optional().default(false) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      // Check if already seeded
      const existing = await getOccConferences();
      if (existing.length > 0 && !input.force) {
        return { success: true, message: "Demo data already exists", count: existing.length };
      }

      const now = new Date();
      const startTime = new Date(now.getTime() - 42 * 60 * 1000); // started 42 min ago

      // Insert demo conferences
      await db.insert(occConferences).values([
        {
          eventId: "q4-earnings-2026",
          callId: "CC-9921",
          subject: "Q4 2025 Earnings Call",
          reseller: "CuraLive Inc.",
          product: "Event Conference",
          moderatorCode: "4872",
          participantCode: "9341",
          securityCode: "7723",
          dialInNumber: "+27 11 535 0000",
          webAccessCode: "WEB-4872",
          status: "running",
          isLocked: false,
          isRecording: true,
          waitingMusicEnabled: true,
          requestsToSpeakEnabled: true,
          scheduledStart: new Date(now.getTime() - 60 * 60 * 1000),
          actualStart: startTime,
        },
        {
          eventId: "investor-day-2026",
          callId: "CC-9922",
          subject: "Annual Investor Day",
          reseller: "CuraLive Inc.",
          product: "Event Conference",
          moderatorCode: "5511",
          participantCode: "8823",
          dialInNumber: "+27 11 535 0001",
          status: "pending",
          isLocked: false,
          isRecording: false,
          waitingMusicEnabled: true,
          requestsToSpeakEnabled: true,
          scheduledStart: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        },
        {
          eventId: "board-briefing",
          callId: "CC-9919",
          subject: "Board Strategy Briefing",
          reseller: "CuraLive Inc.",
          product: "Event Conference",
          moderatorCode: "3301",
          participantCode: "6612",
          dialInNumber: "+27 11 535 0002",
          status: "completed",
          isLocked: false,
          isRecording: false,
          waitingMusicEnabled: false,
          requestsToSpeakEnabled: false,
          scheduledStart: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          actualStart: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          endedAt: new Date(now.getTime() - 90 * 60 * 1000),
        },
      ]);

      const conferences = await getOccConferences();
      const liveConf = conferences.find(c => c.status === "running");
      if (!liveConf) return { success: true, message: "Conferences seeded" };

      // Insert demo participants for the live conference
      await db.insert(occParticipants).values([
        {
          conferenceId: liveConf.id,
          lineNumber: 1,
          role: "moderator",
          name: "Sarah Nkosi",
          company: "CuraLive Inc.",
          location: "Johannesburg",
          phoneNumber: "+27 82 555 0100",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-01",
          state: "connected",
          isSpeaking: false,
          connectedAt: startTime,
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 2,
          role: "host",
          name: "James Dlamini",
          company: "CuraLive Inc.",
          location: "Cape Town",
          phoneNumber: "+27 82 555 0101",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-01",
          state: "speaking",
          isSpeaking: true,
          connectedAt: new Date(startTime.getTime() + 2 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 3,
          role: "participant",
          name: "Thabo Molefe",
          company: "Investec Asset Management",
          location: "Sandton",
          phoneNumber: "+27 83 555 0200",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-02",
          state: "connected",
          isSpeaking: false,
          connectedAt: new Date(startTime.getTime() + 5 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 4,
          role: "participant",
          name: "Priya Naidoo",
          company: "Old Mutual Investments",
          location: "Durban",
          phoneNumber: "+27 84 555 0300",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-02",
          state: "muted",
          isSpeaking: false,
          connectedAt: new Date(startTime.getTime() + 7 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 5,
          role: "participant",
          name: "Mark van der Berg",
          company: "Coronation Fund Managers",
          location: "Cape Town",
          phoneNumber: "+27 21 555 0400",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-03",
          state: "connected",
          isSpeaking: false,
          requestToSpeak: true,
          requestToSpeakPosition: 1,
          connectedAt: new Date(startTime.getTime() + 10 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 6,
          role: "participant",
          name: "Fatima Ismail",
          company: "Sanlam Investment Management",
          location: "Bellville",
          phoneNumber: "+27 21 555 0500",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-03",
          state: "parked",
          isSpeaking: false,
          connectedAt: new Date(startTime.getTime() + 12 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 7,
          role: "participant",
          name: "David Osei",
          company: "Allan Gray",
          location: "Cape Town",
          phoneNumber: "+27 21 555 0600",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-04",
          state: "connected",
          isSpeaking: false,
          connectedAt: new Date(startTime.getTime() + 15 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 8,
          role: "participant",
          name: null,
          company: null,
          location: "Unknown",
          phoneNumber: "+27 11 555 0700",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-04",
          state: "waiting_operator",
          isSpeaking: false,
          connectedAt: new Date(startTime.getTime() + 38 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 9,
          role: "participant",
          name: "Sipho Khumalo",
          company: "Nedbank Capital",
          location: "Sandton",
          phoneNumber: "+27 11 555 0800",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-05",
          state: "connected",
          isWebParticipant: true,
          isSpeaking: false,
          connectedAt: new Date(startTime.getTime() + 20 * 60 * 1000),
        },
        {
          conferenceId: liveConf.id,
          lineNumber: 10,
          role: "participant",
          name: "Lerato Sithole",
          company: "Public Investment Corporation",
          location: "Pretoria",
          phoneNumber: "+27 12 555 0900",
          dialInNumber: "+27 11 535 0000",
          voiceServer: "VS-05",
          state: "muted",
          isSpeaking: false,
          connectedAt: new Date(startTime.getTime() + 22 * 60 * 1000),
        },
      ]);

      // Insert lounge entries
      await db.insert(occLounge).values([
        {
          conferenceId: liveConf.id,
          callId: "CL-001",
          phoneNumber: "+44 20 7946 0301",
          name: "Andrew Smith",
          company: "London Capital Group",
          dialInNumber: "+27 11 535 0000",
          description: "International investor — London",
          language: "en",
          arrivedAt: new Date(now.getTime() - 3 * 60 * 1000),
          status: "waiting",
        },
        {
          conferenceId: liveConf.id,
          callId: "CL-002",
          phoneNumber: "+1 212 555 0199",
          name: "Jennifer Walsh",
          company: "Goldman Sachs Asset Management",
          dialInNumber: "+27 11 535 0000",
          description: "International investor — New York",
          language: "en",
          arrivedAt: new Date(now.getTime() - 1 * 60 * 1000),
          status: "waiting",
        },
      ]);

      // Insert operator request
      const participants = await getOccParticipants(liveConf.id);
      const waitingP = participants.find(p => p.state === "waiting_operator");
      if (waitingP) {
        await db.insert(occOperatorRequests).values({
          conferenceId: liveConf.id,
          participantId: waitingP.id,
          callId: "OR-001",
          subject: "Q4 2025 Earnings Call",
          phoneNumber: waitingP.phoneNumber ?? "",
          dialInNumber: waitingP.dialInNumber ?? "",
          requestedAt: new Date(now.getTime() - 2 * 60 * 1000),
          status: "pending",
        });
      }

      return { success: true, message: "Demo data seeded successfully", conferenceId: liveConf.id };
    }),

  // ── Multi-Party Dial-Out ─────────────────────────────────────────────────

  multiDialOut: operatorProcedure
    .input(z.object({
      conferenceId: z.number(),
      operatorName: z.string().optional(),
      entries: z.array(z.object({
        name: z.string().optional(),
        company: z.string().optional(),
        phoneNumber: z.string().min(1),
        role: z.enum(["moderator", "participant"]).default("participant"),
      })).min(1).max(50),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, results: [], error: "Database unavailable" };

      const existing = await getOccParticipants(input.conferenceId);
      let nextLine = existing.length > 0 ? Math.max(...existing.map((p) => p.lineNumber)) : 0;

      const results: { phoneNumber: string; name?: string; success: boolean; error?: string }[] = [];

      for (const entry of input.entries) {
        try {
          nextLine += 1;
          await db.insert(occParticipants).values({
            conferenceId: input.conferenceId,
            lineNumber: nextLine,
            role: entry.role,
            name: entry.name ?? null,
            company: entry.company ?? null,
            phoneNumber: entry.phoneNumber,
            state: "incoming",
            connectedAt: new Date(),
          });
          await publishAblyEvent(
            `occ:conference:${input.conferenceId}`,
            "participant:added",
            { name: entry.name, phoneNumber: entry.phoneNumber, role: entry.role, company: entry.company }
          );
          results.push({ phoneNumber: entry.phoneNumber, name: entry.name, success: true });
        } catch (err) {
          results.push({ phoneNumber: entry.phoneNumber, name: entry.name, success: false, error: String(err) });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      // Persist dial-out history
      const db2 = await getDb();
      if (db2) {
        await db2.insert(occDialOutHistory).values({
          conferenceId: input.conferenceId,
          operatorName: input.operatorName ?? "Operator",
          dialEntries: JSON.stringify(results.map((r, i) => ({ ...input.entries[i], status: r.success ? "connected" : "failed" }))),
          successCount,
          failCount: results.length - successCount,
          totalCount: results.length,
          initiatedAt: new Date(),
        });
      }
      return { success: successCount > 0, results, successCount, failCount: results.length - successCount };
    }),

  // ── Dial-Out History ─────────────────────────────────────────────────────

  getDialOutHistory: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(occDialOutHistory)
        .where(eq(occDialOutHistory.conferenceId, input.conferenceId))
        .orderBy(occDialOutHistory.initiatedAt);
    }),

  // ── Green Room (Speaker Sub-Conference) ───────────────────────────────────

  getGreenRoom: protectedProcedure
    .input(z.object({ conferenceId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db.select().from(occGreenRooms)
        .where(eq(occGreenRooms.conferenceId, input.conferenceId))
        .limit(1);
      return rows[0] ?? null;
    }),

  createGreenRoom: operatorProcedure
    .input(z.object({
      conferenceId: z.number(),
      name: z.string().default("Speaker Green Room"),
      dialInNumber: z.string().optional(),
      accessCode: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      // Check if one already exists
      const existing = await db.select().from(occGreenRooms)
        .where(eq(occGreenRooms.conferenceId, input.conferenceId)).limit(1);
      if (existing.length > 0) {
        // Reopen it
        await db.update(occGreenRooms)
          .set({ isOpen: true, isActive: true })
          .where(eq(occGreenRooms.conferenceId, input.conferenceId));
        await publishAblyEvent(`occ:conference:${input.conferenceId}`, "greenroom:opened", { conferenceId: input.conferenceId });
        return { success: true, greenRoom: existing[0] };
      }
      await db.insert(occGreenRooms).values({
        conferenceId: input.conferenceId,
        name: input.name,
        dialInNumber: input.dialInNumber ?? null,
        accessCode: input.accessCode ?? null,
        isActive: true,
        isOpen: true,
      });
      const rows = await db.select().from(occGreenRooms)
        .where(eq(occGreenRooms.conferenceId, input.conferenceId)).limit(1);
      await publishAblyEvent(`occ:conference:${input.conferenceId}`, "greenroom:opened", { conferenceId: input.conferenceId });
      return { success: true, greenRoom: rows[0] };
    }),

  closeGreenRoom: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.update(occGreenRooms)
        .set({ isOpen: false, isActive: false })
        .where(eq(occGreenRooms.conferenceId, input.conferenceId));
      await publishAblyEvent(`occ:conference:${input.conferenceId}`, "greenroom:closed", {});
      return { success: true };
    }),

  // Green room uses subconferenceId = -1 as a sentinel value to mark green room participants
  addToGreenRoom: operatorProcedure
    .input(z.object({
      conferenceId: z.number(),
      name: z.string(),
      phoneNumber: z.string(),
      company: z.string().optional(),
      role: z.enum(["moderator", "participant", "host"]).default("participant"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const existing = await getOccParticipants(input.conferenceId);
      const nextLine = (existing.length > 0 ? Math.max(...existing.map(p => p.lineNumber)) : 0) + 1;
      await db.insert(occParticipants).values({
        conferenceId: input.conferenceId,
        lineNumber: nextLine,
        role: input.role,
        name: input.name,
        company: input.company ?? null,
        phoneNumber: input.phoneNumber,
        state: "incoming",
        connectedAt: new Date(),
        subconferenceId: -1, // -1 = green room sentinel
      });
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "greenroom:participant_added",
        { name: input.name, phoneNumber: input.phoneNumber, role: input.role }
      );
      return { success: true };
    }),

  transferGreenRoomToMain: operatorProcedure
    .input(z.object({ conferenceId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, transferredCount: 0 };
      // Get all green room participants (subconferenceId = -1)
      const participants = await getOccParticipants(input.conferenceId);
      const greenRoomParticipants = participants.filter(p => p.subconferenceId === -1);
      // Move them to main conference (clear subconferenceId)
      let transferredCount = 0;
      for (const p of greenRoomParticipants) {
        await db.update(occParticipants)
          .set({ subconferenceId: null, state: "connected" })
          .where(eq(occParticipants.id, p.id));
        transferredCount++;
      }
      // Mark green room as transferred
      await db.update(occGreenRooms)
        .set({ transferredAt: new Date(), isOpen: false, isActive: false })
        .where(eq(occGreenRooms.conferenceId, input.conferenceId));
      await publishAblyEvent(
        `occ:conference:${input.conferenceId}`,
        "greenroom:transferred_to_main",
        { transferredCount }
      );
      return { success: true, transferredCount };
    }),

  // ── Public: Attendee-facing chat messages (no auth required) ──────────────

  getEventChatMessages: publicProcedure
    .input(z.object({
      eventId: z.string(),
      limit: z.number().min(1).max(200).default(100),
    }))
    .query(async ({ input }) => {
      const conf = await getOccConferenceByEventId(input.eventId);
      if (!conf) return [];
      return getOccChatMessages(conf.id, input.limit);
    }),

  // ── Public: Attendee on-demand translation (broadcasts to chorus-event channel) ──

  translateEventChatMessage: publicProcedure
    .input(z.object({
      messageId: z.number(),
      message: z.string().min(1).max(2000),
      targetLanguage: z.string().min(2).max(10),
      eventId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const llmResp = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Detect the language of the input text and translate it to ${input.targetLanguage}. Respond ONLY with a JSON object: {"detectedLanguage": "<ISO-639-1 code>", "translation": "<translated text>"}. If the text is already in ${input.targetLanguage}, set translation to the original text.`,
          },
          { role: "user", content: input.message },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translation_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                detectedLanguage: { type: "string" },
                translation: { type: "string" },
              },
              required: ["detectedLanguage", "translation"],
              additionalProperties: false,
            },
          },
        },
      });
      const parsed = JSON.parse(llmResp.choices[0].message.content as string);

      // Persist the translation in the DB
      await updateChatMessageTranslation(
        input.messageId,
        parsed.detectedLanguage,
        parsed.translation,
        input.targetLanguage
      );

      // Broadcast to all attendees on this event's Ably channel
      await publishAblyEvent(
        `chorus-event-${input.eventId}`,
        "chat:translation",
        {
          messageId: input.messageId,
          detectedLanguage: parsed.detectedLanguage,
          translatedMessage: parsed.translation,
          translationLanguage: input.targetLanguage,
        }
      );

      return {
        detectedLanguage: parsed.detectedLanguage,
        translatedMessage: parsed.translation,
        translationLanguage: input.targetLanguage,
      };
    }),
});
