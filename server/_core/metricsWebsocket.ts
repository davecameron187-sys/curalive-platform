import { WebSocketServer, WebSocket } from "ws";
import { Server } from "express";
import { IncomingMessage } from "http";

export interface MetricsData {
  conferenceId: string;
  activeParticipants: number;
  sentimentScores: {
    positive: number;
    neutral: number;
    negative: number;
  };
  qaVotes: Record<string, number>;
  complianceAlerts: Array<{
    id: string;
    severity: "warning" | "error";
    message: string;
    timestamp: number;
  }>;
}

interface ClientSubscription {
  conferenceId: string;
  ws: WebSocket;
}

export class MetricsWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientSubscription> = new Map();
  private metricsCache: Map<string, MetricsData> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    // Handle upgrade requests
    server.on("upgrade", (request: IncomingMessage, socket, head) => {
      if (request.url === "/ws/metrics") {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws);
        });
      } else {
        socket.destroy();
      }
    });

    // Handle WebSocket connections
    this.wss.on("connection", (ws) => {
      this.handleConnection(ws);
    });

    // Start metrics broadcast loop
    this.startMetricsBroadcast();
  }

  private handleConnection(ws: WebSocket) {
    console.log("[Metrics WebSocket] New client connected");

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "subscribe") {
          const subscription: ClientSubscription = {
            conferenceId: message.conferenceId,
            ws,
          };
          this.clients.set(ws, subscription);
          console.log(
            `[Metrics WebSocket] Client subscribed to ${message.conferenceId}`
          );

          // Send initial metrics snapshot
          const cachedMetrics = this.metricsCache.get(message.conferenceId);
          if (cachedMetrics) {
            ws.send(
              JSON.stringify({
                type: "metrics_snapshot",
                data: cachedMetrics,
              })
            );
          }
        } else if (message.type === "unsubscribe") {
          this.clients.delete(ws);
          console.log(
            `[Metrics WebSocket] Client unsubscribed from ${message.conferenceId}`
          );
        }
      } catch (error) {
        console.error("[Metrics WebSocket] Error parsing message:", error);
      }
    });

    ws.on("close", () => {
      this.clients.delete(ws);
      console.log("[Metrics WebSocket] Client disconnected");
    });

    ws.on("error", (error) => {
      console.error("[Metrics WebSocket] Error:", error);
    });
  }

  private startMetricsBroadcast() {
    // Broadcast metrics every 1 second
    setInterval(() => {
      const metricsUpdates = this.generateMetricsUpdates();

      // Send updates to subscribed clients
      for (const [ws, subscription] of this.clients) {
        const metrics = metricsUpdates[subscription.conferenceId];
        if (metrics && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "metrics_update",
              data: metrics,
            })
          );
        }
      }
    }, 1000);
  }

  private generateMetricsUpdates(): Record<string, MetricsData> {
    const updates: Record<string, MetricsData> = {};

    // Generate mock metrics for active conferences
    const activeConferences = ["q4-earnings-2026", "annual-investor-day-2026"];

    for (const conferenceId of activeConferences) {
      // Simulate dynamic metrics
      const baseParticipants = 1173;
      const variation = Math.sin(Date.now() / 5000) * 50;
      const activeParticipants = Math.round(baseParticipants + variation);

      const sentimentVariation = Math.sin(Date.now() / 3000) * 5;
      const positivePercent = Math.max(
        50,
        Math.min(85, 68 + sentimentVariation)
      );
      const negativePercent = Math.max(
        2,
        Math.min(10, 4 - sentimentVariation / 2)
      );
      const neutralPercent = 100 - positivePercent - negativePercent;

      const metrics: MetricsData = {
        conferenceId,
        activeParticipants,
        sentimentScores: {
          positive: Math.round(positivePercent),
          neutral: Math.round(neutralPercent),
          negative: Math.round(negativePercent),
        },
        qaVotes: {
          "q1-revenue-guidance": 342 + Math.floor(Math.random() * 20),
          "q2-market-expansion": 287 + Math.floor(Math.random() * 20),
          "q3-ma-pipeline": 156 + Math.floor(Math.random() * 20),
        },
        complianceAlerts: this.generateComplianceAlerts(),
      };

      updates[conferenceId] = metrics;
      this.metricsCache.set(conferenceId, metrics);
    }

    return updates;
  }

  private generateComplianceAlerts() {
    // Randomly generate compliance alerts
    const alerts: MetricsData["complianceAlerts"] = [];

    if (Math.random() < 0.1) {
      // 10% chance of generating an alert
      const alertTypes = [
        {
          severity: "warning" as const,
          message: "Forward-looking statement detected",
        },
        {
          severity: "error" as const,
          message: "Personal information mentioned",
        },
        {
          severity: "warning" as const,
          message: "Inappropriate language detected",
        },
      ];

      const randomAlert =
        alertTypes[Math.floor(Math.random() * alertTypes.length)];
      alerts.push({
        id: `alert_${Date.now()}`,
        severity: randomAlert.severity,
        message: randomAlert.message,
        timestamp: Date.now(),
        speakerId: "CEO",
      });
    }

    return alerts;
  }

  public broadcastMetrics(conferenceId: string, metrics: MetricsData) {
    this.metricsCache.set(conferenceId, metrics);

    for (const [ws, subscription] of this.clients) {
      if (
        subscription.conferenceId === conferenceId &&
        ws.readyState === WebSocket.OPEN
      ) {
        ws.send(
          JSON.stringify({
            type: "metrics_update",
            data: metrics,
          })
        );
      }
    }
  }

  public close() {
    this.wss.close();
  }
}
