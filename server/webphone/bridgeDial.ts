// @ts-nocheck
/**
 * Bridge Dial Service — dials out to an external telephone conference bridge via Twilio REST API.
 * The shadow platform joins the bridge as a silent listener (or active participant),
 * entering the conference ID and access code via DTMF tones automatically.
 */
import twilio from "twilio";

export interface BridgeDialOptions {
  dialInNumber: string;
  conferenceId?: string;
  accessCode?: string;
  hostPin?: string;
  statusCallbackUrl: string;
  twimlUrl: string;
}

export interface BridgeCallResult {
  callSid: string;
  status: string;
  fromNumber: string;
}

let cachedFromNumber: string | null = null;

async function resolveFromNumber(): Promise<string> {
  if (cachedFromNumber) return cachedFromNumber;

  const explicit = process.env.TWILIO_PHONE_NUMBER ?? process.env.TWILIO_FROM_NUMBER;
  if (explicit) {
    cachedFromNumber = explicit;
    return cachedFromNumber;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const client = twilio(accountSid, authToken);

  const numbers = await client.incomingPhoneNumbers.list({ limit: 1 });
  if (numbers.length === 0) {
    throw new Error("No Twilio phone numbers found on this account. Please provision a number or set TWILIO_PHONE_NUMBER.");
  }

  cachedFromNumber = numbers[0].phoneNumber;
  console.log("[BridgeDial] Resolved FROM number:", cachedFromNumber);
  return cachedFromNumber;
}

export async function initiateOutboundBridgeCall(opts: BridgeDialOptions): Promise<BridgeCallResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) are not configured.");
  }

  const client = twilio(accountSid, authToken);
  const fromNumber = await resolveFromNumber();

  const call = await client.calls.create({
    to: opts.dialInNumber,
    from: fromNumber,
    url: opts.twimlUrl,
    statusCallback: opts.statusCallbackUrl,
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
  });

  console.log(`[BridgeDial] Call initiated: ${call.sid} → ${opts.dialInNumber}`);

  return {
    callSid: call.sid,
    status: call.status,
    fromNumber,
  };
}

export async function getCallStatus(callSid: string): Promise<{ status: string; duration: number | null }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const client = twilio(accountSid, authToken);

  const call = await client.calls(callSid).fetch();
  return {
    status: call.status,
    duration: call.duration ? parseInt(call.duration) : null,
  };
}

export async function hangupCall(callSid: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const client = twilio(accountSid, authToken);

  await client.calls(callSid).update({ status: "completed" });
  console.log(`[BridgeDial] Call ${callSid} terminated.`);
}

export function buildBridgeTwiML(conferenceId?: string, accessCode?: string, hostPin?: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  // Pause 5 seconds to let bridge greeting finish, then send conference ID, pause again, send access code
  // 'w' = 0.5s pause in Twilio DTMF notation
  const parts: string[] = [];

  if (conferenceId) {
    // Wait 5s for bridge greeting, enter conference ID, press #
    parts.push(`wwwwwwwwww${conferenceId.replace(/\s/g, "")}#`);
  }
  if (accessCode) {
    // Wait 4s for next prompt, enter access code, press #
    parts.push(`wwwwwwww${accessCode.replace(/\s/g, "").replace(/#$/, "")}#`);
  }
  if (hostPin) {
    // Wait 4s for host pin prompt
    parts.push(`wwwwwwww${hostPin.replace(/\s/g, "").replace(/#$/, "")}#`);
  }

  if (parts.length > 0) {
    // Pause first (bridge needs to answer and start prompting)
    response.pause({ length: 2 });
    response.play({ digits: parts.join("") });
  }

  // Keep the call alive silently (record ambient audio)
  response.record({
    timeout: 7200, // max 2 hours
    playBeep: false,
    trim: "trim-silence",
  });

  return response.toString();
}
