/**
 * Twilio WebRTC helpers — generates Access Tokens for the Twilio Voice JS SDK.
 * The token is short-lived (1 hour) and scoped to outbound calls only.
 */
import twilio from "twilio";

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

export interface TwilioTokenResult {
  token: string;
  identity: string;
  carrier: "twilio";
  expiresIn: number;
}

/**
 * Generate a Twilio Access Token for the Voice JS SDK.
 * Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_TWIML_APP_SID, TWILIO_API_KEY, TWILIO_API_SECRET
 */
export function generateTwilioToken(userId: number): TwilioTokenResult | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    console.warn("[Webphone/Twilio] Missing env vars — token not generated");
    return null;
  }

  const identity = `operator-${userId}`;
  const expiresIn = 3600; // 1 hour

  const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: expiresIn,
  });

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  accessToken.addGrant(voiceGrant);

  return {
    token: accessToken.toJwt(),
    identity,
    carrier: "twilio",
    expiresIn,
  };
}

/**
 * Build a TwiML response for outbound calls.
 * This is served at POST /api/webphone/twiml and tells Twilio how to connect the call.
 */
export function buildTwiMLVoiceResponse(to: string, callerId: string): string {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const dial = twiml.dial({ callerId, record: "do-not-record" });
  dial.number(to);
  return twiml.toString();
}
