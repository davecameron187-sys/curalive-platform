import twilio from "twilio";
import { getDb } from "../db";
import { conferenceDialouts, conferenceDialoutParticipants } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_CALLER_ID = process.env.TWILIO_CALLER_ID ?? "";

function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function resolveWebhookBaseUrl(): string {
  if (process.env.REPLIT_DEPLOYMENT_URL) return `https://${process.env.REPLIT_DEPLOYMENT_URL}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  throw new Error("Cannot resolve public webhook URL");
}

const ZA_MOBILE_RE = /^\+27[6-8]\d{8}$/;

function normaliseZANumber(raw: string): string {
  let num = raw.replace(/[\s\-().]/g, "");
  if (num.startsWith("00")) num = "+" + num.slice(2);
  if (num.startsWith("0") && num.length === 10) {
    num = "+27" + num.slice(1);
  }
  if (!num.startsWith("+")) {
    num = "+" + num;
  }
  if (!/^\+\d{10,15}$/.test(num)) {
    throw new Error(`Invalid phone number: ${raw}`);
  }
  return num;
}

export function validateTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  if (!TWILIO_AUTH_TOKEN) return false;
  return twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params);
}

interface DialoutParticipant {
  phoneNumber: string;
  label?: string;
}

async function assertOwnership(dialoutId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [dialout] = await db.select().from(conferenceDialouts)
    .where(and(eq(conferenceDialouts.id, dialoutId), eq(conferenceDialouts.userId, userId)))
    .limit(1);

  if (!dialout) throw new Error("Dialout not found or access denied");
  return dialout;
}

export async function createConferenceDialout(params: {
  userId: number;
  name: string;
  callerId?: string;
  participants: DialoutParticipant[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const callerId = params.callerId || TWILIO_CALLER_ID;
  if (!callerId) throw new Error("No caller ID configured. Set TWILIO_CALLER_ID or provide one.");

  const normalised = params.participants.map((p) => ({
    phoneNumber: normaliseZANumber(p.phoneNumber),
    label: p.label ?? null,
  }));

  const conferenceName = `curalive-conf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const [dialoutResult] = await db.insert(conferenceDialouts).values({
    userId: params.userId,
    name: params.name,
    conferenceName,
    callerId,
    totalParticipants: normalised.length,
    connectedCount: 0,
    failedCount: 0,
    status: "pending",
    createdAt: Date.now(),
  });

  const dialoutId = (dialoutResult as { insertId: number }).insertId;

  for (const p of normalised) {
    await db.insert(conferenceDialoutParticipants).values({
      dialoutId,
      phoneNumber: p.phoneNumber,
      label: p.label,
      status: "queued",
    });
  }

  return { dialoutId, conferenceName };
}

export async function startDialling(dialoutId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const dialout = await assertOwnership(dialoutId, userId);
  if (dialout.status !== "pending") throw new Error(`Cannot start dialling — status is ${dialout.status}`);

  await db.update(conferenceDialouts).set({ status: "dialling" }).where(eq(conferenceDialouts.id, dialoutId));

  const participants = await db.select().from(conferenceDialoutParticipants).where(eq(conferenceDialoutParticipants.dialoutId, dialoutId));

  const client = getTwilioClient();
  const baseUrl = resolveWebhookBaseUrl();
  const twimlUrl = `${baseUrl}/api/conference-dialout/twiml?conferenceName=${encodeURIComponent(dialout.conferenceName)}`;
  const statusUrl = `${baseUrl}/api/conference-dialout/status`;

  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 500;

  for (let i = 0; i < participants.length; i += BATCH_SIZE) {
    const batch = participants.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (p) => {
      try {
        const call = await client.calls.create({
          to: p.phoneNumber,
          from: dialout.callerId,
          url: twimlUrl,
          statusCallback: statusUrl,
          statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
          statusCallbackMethod: "POST",
          machineDetection: "Enable",
          timeout: 45,
        });

        await db.update(conferenceDialoutParticipants)
          .set({ callSid: call.sid, status: "ringing" })
          .where(eq(conferenceDialoutParticipants.id, p.id));

        console.log(`[ConferenceDialout] Called ${p.phoneNumber} → SID ${call.sid}`);
      } catch (err: any) {
        console.error(`[ConferenceDialout] Failed to call ${p.phoneNumber}:`, err.message);
        await db.update(conferenceDialoutParticipants)
          .set({ status: "failed", errorMessage: err.message?.slice(0, 500) ?? "Unknown error" })
          .where(eq(conferenceDialoutParticipants.id, p.id));
      }
    });

    await Promise.all(promises);

    if (i + BATCH_SIZE < participants.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  await recomputeDialoutCounts(dialoutId);
  await db.update(conferenceDialouts).set({ status: "active" }).where(eq(conferenceDialouts.id, dialoutId));

  return { success: true, message: `Dialling ${participants.length} participants` };
}

async function recomputeDialoutCounts(dialoutId: number) {
  const db = await getDb();
  if (!db) return;

  const allParticipants = await db.select().from(conferenceDialoutParticipants)
    .where(eq(conferenceDialoutParticipants.dialoutId, dialoutId));

  const connected = allParticipants.filter((p) => p.status === "in-progress").length;
  const failed = allParticipants.filter((p) => ["failed", "busy", "no-answer", "cancelled"].includes(p.status)).length;
  const finished = allParticipants.filter((p) => ["completed", "failed", "busy", "no-answer", "cancelled"].includes(p.status)).length;

  const updates: Record<string, any> = { connectedCount: connected, failedCount: failed };
  if (finished === allParticipants.length && allParticipants.length > 0) {
    updates.status = "completed";
    updates.endedAt = Date.now();
  }

  await db.update(conferenceDialouts).set(updates).where(eq(conferenceDialouts.id, dialoutId));
}

export async function handleCallStatusUpdate(params: {
  callSid: string;
  callStatus: string;
  callDuration?: string;
}) {
  const db = await getDb();
  if (!db) return;

  const [participant] = await db.select().from(conferenceDialoutParticipants)
    .where(eq(conferenceDialoutParticipants.callSid, params.callSid))
    .limit(1);

  if (!participant) return;

  const statusMap: Record<string, string> = {
    initiated: "queued",
    ringing: "ringing",
    "in-progress": "in-progress",
    completed: "completed",
    busy: "busy",
    "no-answer": "no-answer",
    failed: "failed",
    canceled: "cancelled",
  };

  const newStatus = statusMap[params.callStatus] ?? params.callStatus;
  const updates: Record<string, any> = { status: newStatus };

  if (params.callStatus === "in-progress") {
    updates.answeredAt = Date.now();
  }
  if (["completed", "busy", "no-answer", "failed", "canceled"].includes(params.callStatus)) {
    updates.endedAt = Date.now();
    if (params.callDuration) {
      updates.durationSecs = parseInt(params.callDuration, 10) || 0;
    }
  }

  await db.update(conferenceDialoutParticipants)
    .set(updates)
    .where(eq(conferenceDialoutParticipants.id, participant.id));

  await recomputeDialoutCounts(participant.dialoutId);
}

export async function getDialoutStatus(dialoutId: number, userId: number) {
  await assertOwnership(dialoutId, userId);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [dialout] = await db.select().from(conferenceDialouts).where(eq(conferenceDialouts.id, dialoutId)).limit(1);
  if (!dialout) throw new Error("Dialout not found");

  const participants = await db.select().from(conferenceDialoutParticipants)
    .where(eq(conferenceDialoutParticipants.dialoutId, dialoutId));

  return { ...dialout, participants };
}

export async function cancelDialout(dialoutId: number, userId: number) {
  const dialout = await assertOwnership(dialoutId, userId);

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const participants = await db.select().from(conferenceDialoutParticipants)
    .where(eq(conferenceDialoutParticipants.dialoutId, dialoutId));

  const client = getTwilioClient();
  const activeParticipants = participants.filter((p) =>
    p.callSid && ["queued", "ringing", "in-progress"].includes(p.status)
  );

  for (const p of activeParticipants) {
    try {
      await client.calls(p.callSid!).update({ status: "completed" });
      await db.update(conferenceDialoutParticipants)
        .set({ status: "cancelled", endedAt: Date.now() })
        .where(eq(conferenceDialoutParticipants.id, p.id));
    } catch (err: any) {
      console.warn(`[ConferenceDialout] Failed to cancel call ${p.callSid}:`, err.message);
    }
  }

  await db.update(conferenceDialouts)
    .set({ status: "cancelled", endedAt: Date.now() })
    .where(eq(conferenceDialouts.id, dialoutId));

  return { success: true, cancelledCalls: activeParticipants.length };
}

export async function listDialouts(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(conferenceDialouts)
    .where(eq(conferenceDialouts.userId, userId))
    .orderBy(desc(conferenceDialouts.createdAt))
    .limit(limit);
}

export function buildConferenceTwiml(conferenceName: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  twiml.say({ voice: "Polly.Joanna" as any }, "Connecting you to the conference now.");
  const dial = twiml.dial();
  dial.conference(conferenceName, {
    startConferenceOnEnter: true,
    endConferenceOnExit: false,
    waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical",
    waitMethod: "GET",
    beep: "true",
  } as any);
  return twiml.toString();
}
