import { getAblyClient } from "./ably";
import { ComplianceViolation } from "./compliance";

/**
 * Ably Channel Manager for AI-AM Real-Time Alerts
 * Manages subscriptions and broadcasts for compliance violations
 */

export interface AlertMessage {
  violationId: number;
  eventId: string;
  conferenceId?: string;
  violationType: string;
  severity: "low" | "medium" | "high" | "critical";
  confidenceScore: number;
  speakerName?: string;
  speakerRole?: string;
  transcriptExcerpt: string;
  startTimeMs?: number;
  endTimeMs?: number;
  detectedAt: string;
}

export interface AcknowledgmentMessage {
  violationId: number;
  acknowledgedBy: string;
  acknowledgedAt: string;
  notes?: string;
}

/**
 * Broadcast a violation alert to all operators monitoring an event
 */
export async function broadcastViolationAlert(alert: AlertMessage) {
  try {
    const ably = getAblyClient();
    const channel = ably.channels.get(`aiAm:alerts:${alert.eventId}`);

    await channel.publish("violation_detected", alert);

    console.log(`[AI-AM Ably] Broadcast violation ${alert.violationId} to event ${alert.eventId}`);
  } catch (error) {
    console.error("[AI-AM Ably] Broadcast error:", error);
    throw error;
  }
}

/**
 * Broadcast violation acknowledgment to all operators
 */
export async function broadcastAcknowledgment(eventId: string, message: AcknowledgmentMessage) {
  try {
    const ably = getAblyClient();
    const channel = ably.channels.get(`aiAm:alerts:${eventId}`);

    await channel.publish("violation_acknowledged", message);

    console.log(`[AI-AM Ably] Broadcast acknowledgment for violation ${message.violationId}`);
  } catch (error) {
    console.error("[AI-AM Ably] Acknowledgment broadcast error:", error);
    throw error;
  }
}

/**
 * Broadcast alert statistics update
 */
export async function broadcastStatsUpdate(
  eventId: string,
  stats: {
    totalViolations: number;
    unacknowledgedCount: number;
    criticalCount: number;
    highCount: number;
  }
) {
  try {
    const ably = getAblyClient();
    const channel = ably.channels.get(`aiAm:alerts:${eventId}`);

    await channel.publish("stats_updated", {
      eventId,
      ...stats,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[AI-AM Ably] Broadcast stats update for event ${eventId}`);
  } catch (error) {
    console.error("[AI-AM Ably] Stats broadcast error:", error);
    throw error;
  }
}

/**
 * Subscribe to violation alerts for an event (for testing/monitoring)
 */
export function subscribeToAlerts(
  eventId: string,
  onViolation: (alert: AlertMessage) => void,
  onAcknowledgment: (msg: AcknowledgmentMessage) => void
) {
  try {
    const ably = getAblyClient();
    const channel = ably.channels.get(`aiAm:alerts:${eventId}`);

    channel.subscribe("violation_detected", (message) => {
      onViolation(message.data as AlertMessage);
    });

    channel.subscribe("violation_acknowledged", (message) => {
      onAcknowledgment(message.data as AcknowledgmentMessage);
    });

    console.log(`[AI-AM Ably] Subscribed to alerts for event ${eventId}`);

    return () => {
      channel.unsubscribe();
    };
  } catch (error) {
    console.error("[AI-AM Ably] Subscription error:", error);
    throw error;
  }
}

/**
 * Get presence of operators monitoring an event
 */
export async function getOperatorPresence(eventId: string) {
  try {
    const ably = getAblyClient();
    const channel = ably.channels.get(`aiAm:alerts:${eventId}`);

    const presenceSet = await channel.presence.get();

    return presenceSet.map((member) => ({
      clientId: member.clientId,
      operatorName: member.data?.name,
      joinedAt: new Date(member.timestamp).toISOString(),
    }));
  } catch (error) {
    console.error("[AI-AM Ably] Presence error:", error);
    return [];
  }
}

/**
 * Enter presence for an operator (indicates they're monitoring alerts)
 */
export async function enterOperatorPresence(eventId: string, operatorName: string) {
  try {
    const ably = getAblyClient();
    const channel = ably.channels.get(`aiAm:alerts:${eventId}`);

    await channel.presence.enter({ name: operatorName });

    console.log(`[AI-AM Ably] Operator ${operatorName} entered presence for event ${eventId}`);
  } catch (error) {
    console.error("[AI-AM Ably] Presence entry error:", error);
    throw error;
  }
}

/**
 * Leave presence for an operator
 */
export async function leaveOperatorPresence(eventId: string) {
  try {
    const ably = getAblyClient();
    const channel = ably.channels.get(`aiAm:alerts:${eventId}`);

    await channel.presence.leave();

    console.log(`[AI-AM Ably] Operator left presence for event ${eventId}`);
  } catch (error) {
    console.error("[AI-AM Ably] Presence leave error:", error);
    throw error;
  }
}
