/**
 * Shared Ably REST publish helper for webphone real-time events.
 *
 * Channel: "webphone:activity"
 * Events:
 *   call:started   — emitted when logSession is called
 *   call:ended     — emitted when endSession is called
 *   call:failed    — emitted when endSession is called with status "failed"
 *   stats:refresh  — emitted to trigger a stats refresh on all clients
 */

const ABLY_REST_URL = "https://rest.ably.io";
const WEBPHONE_CHANNEL = "webphone:activity";

export type WebphoneEvent =
  | "call:started"
  | "call:ended"
  | "call:failed"
  | "stats:refresh"
  | "voicemail:received";

export interface WebphoneEventData {
  sessionId?: number;
  carrier?: string;
  direction?: string;
  remoteNumber?: string;
  status?: string;
  durationSecs?: number;
  operatorId?: number;
  operatorName?: string;
  timestamp: number;
}

/**
 * Publish a webphone event to the Ably channel.
 * Silently skips if ABLY_API_KEY is not configured.
 */
export async function publishWebphoneEvent(
  event: WebphoneEvent,
  data: WebphoneEventData
): Promise<void> {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) return;

  try {
    const auth = Buffer.from(apiKey).toString("base64");
    const url = `${ABLY_REST_URL}/channels/${encodeURIComponent(WEBPHONE_CHANNEL)}/messages`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        name: event,
        data: JSON.stringify(data),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[Ably Webphone] Publish failed ${res.status}: ${text}`);
    }
  } catch (err) {
    console.warn("[Ably Webphone] Publish error:", err);
  }
}

export { WEBPHONE_CHANNEL };
