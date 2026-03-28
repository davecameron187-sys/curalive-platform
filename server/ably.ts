/**
 * Ably Real-Time Integration
 * 
 * Handles all Ably channel subscriptions and message publishing
 * for real-time console updates (transcript, Q&A, sentiment, etc.)
 */

import Ably from "ably";

let ablyClient: Ably.Realtime | null = null;

/**
 * Initialize Ably client with server-side credentials
 */
export async function initAblyClient() {
  if (ablyClient) return ablyClient;

  try {
    ablyClient = new Ably.Realtime({
      key: process.env.ABLY_API_KEY || "",
      autoConnect: true,
    });

    ablyClient.connection.on((stateChange) => {
      console.log(`[Ably] Connection state: ${stateChange.current}`);
    });

    return ablyClient;
  } catch (err) {
    console.error("[Ably] Initialization error:", err);
    throw err;
  }
}

/**
 * Get Ably client instance
 */
export function getAblyClient() {
  if (!ablyClient) {
    throw new Error("Ably client not initialized. Call initAblyClient() first.");
  }
  return ablyClient;
}

/**
 * Publish session state change event
 */
export async function publishSessionStateChange(
  sessionId: string,
  fromState: string,
  toState: string,
  metadata?: Record<string, any>
) {
  const client = getAblyClient();
  const channel = client.channels.get(`session:${sessionId}:state`);

  await channel.publish("state.changed", {
    sessionId,
    fromState,
    toState,
    timestamp: new Date().toISOString(),
    metadata,
  });

  console.log(`[Ably] Published state change: ${fromState} → ${toState}`);
}

/**
 * Publish operator action event
 */
export async function publishOperatorAction(
  sessionId: string,
  actionType: string,
  metadata?: Record<string, any>
) {
  const client = getAblyClient();
  const channel = client.channels.get(`session:${sessionId}:actions`);

  await channel.publish("action.created", {
    sessionId,
    actionType,
    timestamp: new Date().toISOString(),
    metadata,
  });

  console.log(`[Ably] Published action: ${actionType}`);
}

/**
 * Publish Q&A event
 */
export async function publishQaEvent(
  sessionId: string,
  eventType: "question.submitted" | "question.approved" | "question.rejected",
  questionId: string,
  metadata?: Record<string, any>
) {
  const client = getAblyClient();
  const channel = client.channels.get(`session:${sessionId}:qa`);

  await channel.publish(eventType, {
    sessionId,
    questionId,
    timestamp: new Date().toISOString(),
    metadata,
  });

  console.log(`[Ably] Published Q&A event: ${eventType}`);
}

/**
 * Publish transcript segment
 */
export async function publishTranscriptSegment(
  sessionId: string,
  speaker: string,
  text: string,
  sentiment?: number
) {
  const client = getAblyClient();
  const channel = client.channels.get(`session:${sessionId}:transcript`);

  await channel.publish("segment.added", {
    sessionId,
    speaker,
    text,
    sentiment,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Ably] Published transcript segment from ${speaker}`);
}

/**
 * Publish AI insights update
 */
export async function publishAiInsights(
  sessionId: string,
  sentimentScore: number,
  complianceFlags: number,
  keyTopics: string[]
) {
  const client = getAblyClient();
  const channel = client.channels.get(`session:${sessionId}:insights`);

  await channel.publish("insights.updated", {
    sessionId,
    sentimentScore,
    complianceFlags,
    keyTopics,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Ably] Published AI insights update`);
}

/**
 * Close Ably connection
 */
export async function closeAblyClient() {
  if (ablyClient) {
    await ablyClient.close();
    ablyClient = null;
    console.log("[Ably] Connection closed");
  }
}
