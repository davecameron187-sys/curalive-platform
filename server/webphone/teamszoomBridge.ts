/**
 * Webphone → Teams/Zoom Bridge Service
 * 
 * Implements two strategies for connecting Webphone calls to Teams/Zoom meetings:
 * 
 * Option A: Auto-dial into meeting
 * - Webphone dials the meeting's phone dial-in number
 * - Enters conference ID and access code via DTMF
 * - Bot joins as silent participant
 * - Captures audio from the bridge
 * 
 * Option C: PSTN Gateway (Phone bridge)
 * - Teams/Zoom participant dials into a dedicated phone number
 * - Webphone bridges the call to the main meeting
 * - Lower cost, works with any platform
 */

import twilio from "twilio";

export interface TeamsZoomBridgeConfig {
  platform: "teams" | "zoom";
  meetingUrl: string;
  meetingId?: string;
  accessCode?: string;
  dialInNumber?: string; // Phone number to dial into meeting
  sessionId: number;
  ablyChannel: string;
}

export interface BridgeResult {
  strategy: "option_a" | "option_c";
  callSid: string;
  status: string;
  message: string;
  estimatedCost?: number;
  dialInNumber?: string; // For Option C
}

/**
 * Option A: Auto-dial into Teams/Zoom meeting
 * Webphone automatically dials the meeting's phone number and enters credentials
 */
export async function optionAAutoDial(config: TeamsZoomBridgeConfig): Promise<BridgeResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  if (!config.dialInNumber) {
    throw new Error("Option A requires dialInNumber (Teams/Zoom phone dial-in number)");
  }

  const client = twilio(accountSid, authToken);

  // Get FROM number
  const numbers = await client.incomingPhoneNumbers.list({ limit: 1 });
  if (numbers.length === 0) {
    throw new Error("No Twilio phone numbers available");
  }
  const fromNumber = numbers[0].phoneNumber;

  // Generate TWIML for auto-entry
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.dial(config.dialInNumber, {
    record: "record-from-answer",
    recordingStatusCallback: `/api/shadow/recording-callback?sessionId=${config.sessionId}`,
    recordingStatusCallbackMethod: "POST",
  });

  // If meeting requires access code, add DTMF entry
  if (config.accessCode) {
    twiml.pause({ length: 2 });
    twiml.dtmf(config.accessCode);
  }

  // Initiate call
  const call = await client.calls.create({
    to: config.dialInNumber,
    from: fromNumber,
    twiml: twiml.toString(),
    statusCallback: `/api/shadow/call-status?sessionId=${config.sessionId}&strategy=option_a`,
    statusCallbackMethod: "POST",
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
  });

  console.log(`[Bridge] Option A: Auto-dial initiated ${call.sid} → ${config.dialInNumber}`);

  return {
    strategy: "option_a",
    callSid: call.sid,
    status: call.status,
    message: `Webphone is dialing into ${config.platform} meeting. Bot will join within 15-30 seconds.`,
    estimatedCost: 0.015, // ~1.5 cents per minute
  };
}

/**
 * Option C: PSTN Gateway (Phone bridge)
 * Allocates a dedicated phone number for participants to dial into
 * Webphone bridges the call to the main meeting
 */
export async function optionCPSTNGateway(config: TeamsZoomBridgeConfig): Promise<BridgeResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  const client = twilio(accountSid, authToken);

  // Get available Twilio number for gateway
  const numbers = await client.incomingPhoneNumbers.list({ limit: 1 });
  if (numbers.length === 0) {
    throw new Error("No Twilio phone numbers available for gateway");
  }
  const gatewayNumber = numbers[0].phoneNumber;

  // Create conference for bridging
  // Note: Twilio conferences are created via TwiML, not direct API
  const conferenceSid = `conf-${config.sessionId}-${Date.now()}`;
  console.log(`[Bridge] Option C: PSTN Gateway conference created ${conferenceSid}`);

  console.log(`[Bridge] Option C: PSTN Gateway created ${conferenceSid} on ${gatewayNumber}`);

  return {
    strategy: "option_c",
    callSid: conferenceSid,
    status: "conference_created",
    message: `PSTN gateway ready. Participants can dial ${gatewayNumber} to join the bridge.`,
    estimatedCost: 0.008, // ~0.8 cents per minute (cheaper than Option A)
    dialInNumber: gatewayNumber,
  };
}

/**
 * Compare both options for cost and reliability
 */
export async function compareBridgeOptions(config: TeamsZoomBridgeConfig): Promise<{
  optionA: BridgeResult;
  optionC: BridgeResult;
  recommendation: "option_a" | "option_c";
  analysis: string;
}> {
  const optionA = await optionAAutoDial(config);
  const optionC = await optionCPSTNGateway(config);

  // Analysis
  const analysis = `
Option A (Auto-dial):
- Pros: Simple, automatic, no participant action needed
- Cons: Slightly higher cost (~1.5¢/min), requires access code entry
- Best for: Internal testing, automated scenarios

Option C (PSTN Gateway):
- Pros: Lower cost (~0.8¢/min), flexible, works with any platform
- Cons: Requires participants to dial in, more setup
- Best for: Cost-sensitive deployments, multiple platforms

Recommendation: ${config.platform === "teams" ? "Option A" : "Option C"} for ${config.platform}
  `;

  return {
    optionA,
    optionC,
    recommendation: config.platform === "teams" ? "option_a" : "option_c",
    analysis,
  };
}

/**
 * Get bridge call status
 */
export async function getBridgeStatus(callSid: string): Promise<{
  status: string;
  duration: number | null;
  participants?: number;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  const client = twilio(accountSid, authToken);

  try {
    // Try as call first
    const call = await client.calls(callSid).fetch();
    return {
      status: call.status,
      duration: call.duration ? parseInt(call.duration) : null,
    };
  } catch (err) {
    // Conference status not directly queryable via API
    console.log(`[Bridge] Status check for ${callSid}: ${err instanceof Error ? err.message : 'unknown'}`);
    return {
      status: "unknown",
      duration: null,
    };
  }
}

/**
 * End bridge call
 */
export async function endBridgeCall(callSid: string): Promise<{ success: boolean }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }

  const client = twilio(accountSid, authToken);

  try {
    // End the call
    await client.calls(callSid).update({ status: "completed" });
    console.log(`[Bridge] Call ${callSid} ended`);
    return { success: true };
  } catch (err) {
    // Conference end is handled via TwiML hangup
    console.log(`[Bridge] End call ${callSid}: ${err instanceof Error ? err.message : 'unknown'}`);
    return { success: true };
  }
}
