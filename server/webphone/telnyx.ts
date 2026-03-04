/**
 * Telnyx WebRTC helpers — generates credentials for the Telnyx WebRTC JS SDK.
 * Telnyx uses SIP credentials (username/password) rather than JWT tokens.
 * The frontend uses these to register a SIP UA via the Telnyx WebRTC SDK.
 */

export interface TelnyxCredentialResult {
  sipUser: string;
  sipPassword: string;
  sipDomain: string;
  carrier: "telnyx";
  connectionId: string | null;
}

/**
 * Return SIP credentials for the Telnyx WebRTC SDK.
 * Requires env vars: TELNYX_SIP_USERNAME, TELNYX_SIP_PASSWORD, TELNYX_SIP_CONNECTION_ID
 *
 * In production, generate per-user SIP credentials via the Telnyx API.
 * For the initial integration, a shared credential set is acceptable.
 */
export function getTelnyxCredentials(userId: number): TelnyxCredentialResult | null {
  const sipUser = process.env.TELNYX_SIP_USERNAME;
  const sipPassword = process.env.TELNYX_SIP_PASSWORD;
  const connectionId = process.env.TELNYX_SIP_CONNECTION_ID ?? null;

  if (!sipUser || !sipPassword) {
    console.warn("[Webphone/Telnyx] Missing env vars — credentials not available");
    return null;
  }

  return {
    sipUser: `${sipUser}-${userId}`,
    sipPassword,
    sipDomain: "sip.telnyx.com",
    carrier: "telnyx",
    connectionId,
  };
}

/**
 * Parse a Telnyx call-control webhook payload.
 * Returns a normalised event object for logging.
 */
export function parseTelnyxWebhook(body: Record<string, unknown>): {
  event: string;
  callControlId: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
} | null {
  try {
    const data = body?.data as Record<string, unknown> | undefined;
    if (!data) return null;
    const payload = data?.payload as Record<string, unknown> | undefined;
    return {
      event: String(data?.event_type ?? "unknown"),
      callControlId: String(payload?.call_control_id ?? ""),
      direction: (payload?.direction as "inbound" | "outbound") ?? "outbound",
      from: String(payload?.from ?? ""),
      to: String(payload?.to ?? ""),
    };
  } catch {
    return null;
  }
}
