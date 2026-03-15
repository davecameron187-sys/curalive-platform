// @ts-nocheck
import { WebSocketServer } from "ws";
import { Server } from "express";
import { IncomingMessage } from "http";

export interface MetricsData {
  conferenceId: string;
  activeParticipants: number;
  sentimentScore: number;
  qaCount: number;
  complianceAlerts: number;
}

export class MetricsWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<any> = new Set();
  private metricsCache: Map<string, MetricsData> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request: IncomingMessage, socket, head) => {
      if (request.url === "/ws/metrics") {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.handleConnection(ws);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on("connection", (ws) => {
      this.handleConnection(ws);
    });

    // Broadcast metrics every 2 seconds
    setInterval(() => this.broadcastMetrics(), 2000);
  }

  private handleConnection(ws: any) {
    this.clients.add(ws);

    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data);
        if (message.type === "subscribe") {
          const conferenceId = message.conferenceId;
          ws.conferenceId = conferenceId;
          ws.send(JSON.stringify({ type: "subscribed", conferenceId }));
        }
      } catch (error) {
        console.error("[WebSocket] Message parse error:", error);
      }
    });

    ws.on("close", () => {
      this.clients.delete(ws);
    });

    ws.on("error", (error: any) => {
      console.error("[WebSocket] Error:", error);
      this.clients.delete(ws);
    });
  }

  private broadcastMetrics() {
    const metrics = this.generateMetrics();
    const message = JSON.stringify({ type: "metrics", data: metrics });

    this.clients.forEach((ws: any) => {
      if (ws.readyState === 1) {
        try {
          ws.send(message);
        } catch (error) {
          console.error("[WebSocket] Send error:", error);
        }
      }
    });
  }

  private generateMetrics(): MetricsData {
    return {
      conferenceId: "default",
      activeParticipants: Math.floor(Math.random() * 1000) + 100,
      sentimentScore: Math.random() * 100,
      qaCount: Math.floor(Math.random() * 500),
      complianceAlerts: Math.floor(Math.random() * 5),
    };
  }

  public updateMetrics(conferenceId: string, metrics: Partial<MetricsData>) {
    const existing = this.metricsCache.get(conferenceId) || {
      conferenceId,
      activeParticipants: 0,
      sentimentScore: 0,
      qaCount: 0,
      complianceAlerts: 0,
    };
    this.metricsCache.set(conferenceId, { ...existing, ...metrics });
  }
}
