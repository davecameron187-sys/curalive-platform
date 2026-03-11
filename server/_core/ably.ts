/**
 * Ably client helper for server-side real-time messaging.
 * Lazily initializes the Ably REST client using the ABLY_API_KEY env variable.
 */

let _ablyClient: any = null;

export async function getAblyClient() {
  if (_ablyClient) return _ablyClient;
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    console.warn("[Ably] ABLY_API_KEY not set — real-time alerts disabled");
    return null;
  }
  try {
    const Ably = await import("ably");
    _ablyClient = new Ably.Rest(apiKey);
    return _ablyClient;
  } catch (err) {
    console.error("[Ably] Failed to initialise client:", err);
    return null;
  }
}

export async function publishToChannel(
  channelName: string,
  eventName: string,
  data: unknown
): Promise<boolean> {
  const client = await getAblyClient();
  if (!client) return false;
  try {
    const channel = client.channels.get(channelName);
    await channel.publish(eventName, data);
    return true;
  } catch (err) {
    console.error("[Ably] Publish error:", err);
    return false;
  }
}
