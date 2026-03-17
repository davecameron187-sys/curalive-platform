import Telnyx from "telnyx";

export interface TelnyxDialOptions {
  dialInNumber: string;
  conferenceId?: string;
  accessCode?: string;
  hostPin?: string;
  statusCallbackUrl: string;
}

export interface TelnyxCallResult {
  callControlId: string;
  callLegId: string;
  status: string;
  fromNumber: string;
}

let cachedFromNumber: string | null = null;

function resolveTelnyxFromNumber(): string {
  if (cachedFromNumber) return cachedFromNumber;

  const explicit = process.env.TELNYX_PHONE_NUMBER ?? process.env.TELNYX_FROM_NUMBER;
  if (explicit) {
    cachedFromNumber = explicit;
    return cachedFromNumber;
  }

  throw new Error("TELNYX_PHONE_NUMBER is not configured. Please set it in your environment variables.");
}

function getTelnyxClient() {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    throw new Error("TELNYX_API_KEY is not configured.");
  }
  return new (Telnyx as any)(apiKey);
}

export async function initiateTelnyxBridgeCall(opts: TelnyxDialOptions): Promise<TelnyxCallResult> {
  const telnyx = getTelnyxClient();
  const fromNumber = resolveTelnyxFromNumber();
  const connectionId = process.env.TELNYX_SIP_CONNECTION_ID;

  const callParams: any = {
    to: opts.dialInNumber,
    from: fromNumber,
    connection_id: connectionId,
    webhook_url: opts.statusCallbackUrl,
    webhook_url_method: "POST",
    record: "record-from-answer",
    record_format: "mp3",
  };

  console.log(`[TelnyxDial] Initiating call to ${opts.dialInNumber} from ${fromNumber}`);

  const response = await telnyx.calls.create(callParams);
  const callData = response?.data ?? response;

  const callControlId = callData.call_control_id ?? callData.id ?? "";
  const callLegId = callData.call_leg_id ?? "";

  console.log(`[TelnyxDial] Call initiated: ${callControlId} → ${opts.dialInNumber}`);

  return {
    callControlId,
    callLegId,
    status: "initiated",
    fromNumber,
  };
}

export async function sendTelnyxDTMF(callControlId: string, digits: string): Promise<void> {
  const telnyx = getTelnyxClient();

  console.log(`[TelnyxDial] Sending DTMF: ${digits} on call ${callControlId}`);

  await telnyx.calls.sendDTMF(callControlId, {
    digits,
    duration_millis: 250,
  });
}

export async function scheduleTelnyxDTMF(
  callControlId: string,
  conferenceId?: string,
  accessCode?: string,
  hostPin?: string
): Promise<void> {
  const delays = [
    { digits: conferenceId, delayMs: 5000 },
    { digits: accessCode, delayMs: 4000 },
    { digits: hostPin, delayMs: 4000 },
  ].filter(d => d.digits);

  let cumulativeDelay = 0;
  for (const { digits, delayMs } of delays) {
    cumulativeDelay += delayMs;
    const cleanDigits = digits!.replace(/\s/g, "").replace(/#$/, "") + "#";

    setTimeout(async () => {
      try {
        await sendTelnyxDTMF(callControlId, cleanDigits);
      } catch (e: any) {
        console.error(`[TelnyxDial] DTMF send failed for ${cleanDigits}:`, e.message);
      }
    }, cumulativeDelay);
  }
}

export async function hangupTelnyxCall(callControlId: string): Promise<void> {
  const telnyx = getTelnyxClient();

  await telnyx.calls.hangup(callControlId);
  console.log(`[TelnyxDial] Call ${callControlId} terminated.`);
}

export async function getTelnyxCallStatus(callControlId: string): Promise<{ status: string; duration: number | null }> {
  try {
    const telnyx = getTelnyxClient();
    const response = await telnyx.calls.retrieve(callControlId);
    const callData = response?.data ?? response;
    return {
      status: callData.state ?? callData.status ?? "unknown",
      duration: callData.duration_secs ?? null,
    };
  } catch {
    return { status: "unknown", duration: null };
  }
}
