import twilio from "twilio";
import { getDb } from "../db";
import { conferenceDialouts, conferenceDialoutParticipants } from "../../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
const TWILIO_CALLER_ID = process.env.TWILIO_CALLER_ID ?? "";
const TELNYX_API_KEY = process.env.TELNYX_API_KEY ?? "";
const TELNYX_CALLER_ID = process.env.TELNYX_CALLER_ID ?? "";
const TELNYX_CONNECTION_ID = process.env.TELNYX_CONNECTION_ID ?? "";

type CarrierType = "twilio" | "telnyx";

function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN)");
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function isTelnyxAvailable(): boolean {
  return !!(TELNYX_API_KEY && TELNYX_CALLER_ID && TELNYX_CONNECTION_ID);
}

async function dialViaTelnyx(params: {
  to: string;
  from: string;
  webhookUrl: string;
  statusUrl: string;
  conferenceName: string;
}): Promise<{ callSid: string; carrier: CarrierType }> {
  const response = await fetch("https://api.telnyx.com/v2/calls", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TELNYX_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      connection_id: TELNYX_CONNECTION_ID,
      to: params.to,
      from: params.from,
      webhook_url: params.statusUrl,
      timeout_secs: 45,
      answering_machine_detection: "detect",
      custom_headers: [{ name: "X-Conference", value: params.conferenceName }],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telnyx API error ${response.status}: ${body}`);
  }
  const data = await response.json() as any;
  return { callSid: data.data?.call_control_id ?? data.data?.id ?? "telnyx-unknown", carrier: "telnyx" };
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

  let twilioClient: ReturnType<typeof getTwilioClient> | null = null;
  try {
    twilioClient = getTwilioClient();
  } catch {
    console.warn("[ConferenceDialout] Twilio client unavailable — will attempt Telnyx for all participants");
  }
  const baseUrl = resolveWebhookBaseUrl();
  const twimlUrl = `${baseUrl}/api/conference-dialout/twiml?conferenceName=${encodeURIComponent(dialout.conferenceName)}`;
  const statusUrl = `${baseUrl}/api/conference-dialout/status`;

  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 500;

  for (let i = 0; i < participants.length; i += BATCH_SIZE) {
    const batch = participants.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (p) => {
      let carrier: CarrierType = "twilio";

      if (!twilioClient) {
        if (isTelnyxAvailable()) {
          try {
            carrier = "telnyx";
            const telnyxResult = await dialViaTelnyx({ to: p.phoneNumber, from: TELNYX_CALLER_ID, webhookUrl: twimlUrl, statusUrl, conferenceName: dialout.conferenceName });
            await db.update(conferenceDialoutParticipants).set({ callSid: telnyxResult.callSid, status: "ringing" }).where(eq(conferenceDialoutParticipants.id, p.id));
            console.log(`[ConferenceDialout] Called ${p.phoneNumber} via Telnyx (primary unavailable) → SID ${telnyxResult.callSid}`);
          } catch (err: any) {
            await db.update(conferenceDialoutParticipants).set({ status: "failed", errorMessage: `No Twilio; Telnyx failed: ${err.message?.slice(0, 400)}` }).where(eq(conferenceDialoutParticipants.id, p.id));
          }
        } else {
          await db.update(conferenceDialoutParticipants).set({ status: "failed", errorMessage: "No telephony carrier available" }).where(eq(conferenceDialoutParticipants.id, p.id));
        }
        return;
      }

      try {
        const call = await twilioClient.calls.create({
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

        console.log(`[ConferenceDialout] Called ${p.phoneNumber} via Twilio → SID ${call.sid}`);
      } catch (twilioErr: any) {
        console.warn(`[ConferenceDialout] Twilio failed for ${p.phoneNumber}: ${twilioErr.message} — attempting Telnyx failover`);

        if (isTelnyxAvailable()) {
          try {
            carrier = "telnyx";
            const telnyxResult = await dialViaTelnyx({
              to: p.phoneNumber,
              from: TELNYX_CALLER_ID,
              webhookUrl: twimlUrl,
              statusUrl,
              conferenceName: dialout.conferenceName,
            });

            await db.update(conferenceDialoutParticipants)
              .set({ callSid: telnyxResult.callSid, status: "ringing" })
              .where(eq(conferenceDialoutParticipants.id, p.id));

            console.log(`[ConferenceDialout] Called ${p.phoneNumber} via Telnyx failover → SID ${telnyxResult.callSid}`);
          } catch (telnyxErr: any) {
            console.error(`[ConferenceDialout] Telnyx failover also failed for ${p.phoneNumber}:`, telnyxErr.message);
            await db.update(conferenceDialoutParticipants)
              .set({ status: "failed", errorMessage: `Twilio: ${twilioErr.message?.slice(0, 250)}; Telnyx: ${telnyxErr.message?.slice(0, 250)}` })
              .where(eq(conferenceDialoutParticipants.id, p.id));
          }
        } else {
          console.error(`[ConferenceDialout] No Telnyx failover available for ${p.phoneNumber}`);
          await db.update(conferenceDialoutParticipants)
            .set({ status: "failed", errorMessage: twilioErr.message?.slice(0, 500) ?? "Unknown error" })
            .where(eq(conferenceDialoutParticipants.id, p.id));
        }
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

  let twilioClient: ReturnType<typeof getTwilioClient> | null = null;
  try { twilioClient = getTwilioClient(); } catch { /* Twilio unavailable */ }

  const activeParticipants = participants.filter((p) =>
    p.callSid && ["queued", "ringing", "in-progress"].includes(p.status)
  );

  for (const p of activeParticipants) {
    const isTelnyxCall = p.callSid?.startsWith("telnyx-") || (!twilioClient && isTelnyxAvailable());
    try {
      if (isTelnyxCall && isTelnyxAvailable()) {
        await fetch(`https://api.telnyx.com/v2/calls/${p.callSid}/actions/hangup`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${TELNYX_API_KEY}`, "Content-Type": "application/json" },
        });
      } else if (twilioClient) {
        await twilioClient.calls(p.callSid!).update({ status: "completed" });
      }
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
