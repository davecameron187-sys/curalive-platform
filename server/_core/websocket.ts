/**
 * WebSocket Server for Real-Time Metrics
 * Handles live participant tracking, sentiment updates, and Q&A voting
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server as HTTPServer } from "http";

export interface MetricsUpdate {
  type: "participants" | "sentiment" | "qa_vote" | "compliance_alert";
  conferenceId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ConferenceMetrics {
  conferenceId: string;
  activeParticipants: number;
  sentimentScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  qaVotes: Map<string, number>;
  complianceAlerts: Array<{
    id: string;
    severity: "warning" | "error";
    message: string;
    timestamp: number;
  }>;
}

class WebSocketMetricsServer {
  private wss: WebSocketServer | null = null;
  private metricsMap: Map<string, ConferenceMetrics> = new Map();
  private clientSubscriptions: Map<WebSocket, Set<string>> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.wss = new WebSocketServer({ server: httpServer, path: "/ws/metrics" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[WebSocket] Client connected");
      this.clientSubscriptions.set(ws, new Set());

      ws.on("message", (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("[WebSocket] Error parsing message:", error);
          ws.send(JSON.stringify({ error: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        console.log("[WebSocket] Client disconnected");
        this.clientSubscriptions.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("[WebSocket] Error:", error);
      });
    });

    console.log("[WebSocket] Server initialized on /ws/metrics");
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(
    ws: WebSocket,
    message: Record<string, unknown>
  ): void {
    const { type, conferenceId } = message;

    switch (type) {
      case "subscribe":
        if (conferenceId) {
          const subscriptions = this.clientSubscriptions.get(ws) || new Set();
          subscriptions.add(conferenceId as string);
          this.clientSubscriptions.set(ws, subscriptions);

          // Send current metrics
          const metrics = this.metricsMap.get(conferenceId as string);
          if (metrics) {
            ws.send(
              JSON.stringify({
                type: "metrics_snapshot",
                data: this.metricsToJSON(metrics),
              })
            );
          }
        }
        break;

      case "unsubscribe":
        if (conferenceId) {
          const subscriptions = this.clientSubscriptions.get(ws);
          if (subscriptions) {
            subscriptions.delete(conferenceId as string);
          }
        }
        break;

      default:
        console.warn("[WebSocket] Unknown message type:", type);
    }
  }

  /**
   * Broadcast metrics update to subscribed clients
   */
  broadcastMetricsUpdate(update: MetricsUpdate): void {
    if (!this.wss) return;

    const metrics =
      this.metricsMap.get(update.conferenceId) ||
      this.createMetrics(update.conferenceId);

    // Update metrics based on type
    switch (update.type) {
      case "participants":
        metrics.activeParticipants = (update.data.count as number) || 0;
        break;

      case "sentiment":
        metrics.sentimentScores = {
          positive: (update.data.positive as number) || 0,
          neutral: (update.data.neutral as number) || 0,
          negative: (update.data.negative as number) || 0,
        };
        break;

      case "qa_vote":
        const questionId = update.data.questionId as string;
        const votes = (update.data.votes as number) || 0;
        metrics.qaVotes.set(questionId, votes);
        break;

      case "compliance_alert":
        metrics.complianceAlerts.push({
          id: `alert_${Date.now()}`,
          severity: (update.data.severity as "warning" | "error") || "warning",
          message: (update.data.message as string) || "",
          timestamp: update.timestamp,
        });
        break;
    }

    this.metricsMap.set(update.conferenceId, metrics);

    // Broadcast to subscribed clients
    this.wss.clients.forEach((client: WebSocket) => {
      const subscriptions = this.clientSubscriptions.get(client);
      if (subscriptions && subscriptions.has(update.conferenceId)) {
        client.send(
          JSON.stringify({
            type: "metrics_update",
            conferenceId: update.conferenceId,
            data: this.metricsToJSON(metrics),
            timestamp: update.timestamp,
          })
        );
      }
    });
  }

  /**
   * Create new conference metrics
   */
  private createMetrics(conferenceId: string): ConferenceMetrics {
    return {
      conferenceId,
      activeParticipants: 0,
      sentimentScores: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      qaVotes: new Map(),
      complianceAlerts: [],
    };
  }

  /**
   * Convert metrics to JSON (for WebSocket transmission)
   */
  private metricsToJSON(metrics: ConferenceMetrics): Record<string, unknown> {
    return {
      conferenceId: metrics.conferenceId,
      activeParticipants: metrics.activeParticipants,
      sentimentScores: metrics.sentimentScores,
      qaVotes: Object.fromEntries(metrics.qaVotes),
      complianceAlerts: metrics.complianceAlerts,
    };
  }

  /**
   * Get metrics for a conference
   */
  getMetrics(conferenceId: string): ConferenceMetrics | undefined {
    return this.metricsMap.get(conferenceId);
  }

  /**
   * Clean up conference metrics
   */
  cleanup(conferenceId: string): void {
    this.metricsMap.delete(conferenceId);
  }
}

// Export singleton instance
export const wsMetricsServer = new WebSocketMetricsServer();
