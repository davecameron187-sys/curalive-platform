/**
 * Ably Real-Time Metrics Streaming Service
 * Streams live network metrics to connected clients
 * Round 62 Features
 */
import { Realtime } from "ably";
import * as analyticsDb from "@/server/db.analytics";

interface MetricStreamConfig {
  kioskId: string;
  eventId: string;
  updateInterval: number; // milliseconds
}

interface StreamedMetric {
  kioskId: string;
  eventId: string;
  timestamp: Date;
  latency: number;
  bandwidth: number;
  signalStrength: number;
  connectionQuality: string;
  isOnline: boolean;
}

class AblyMetricsStreamingService {
  private client: Realtime | null = null;
  private activeStreams: Map<string, NodeJS.Timeout> = new Map();
  private channelPrefix = "metrics:";

  constructor() {
    this.initializeAbly();
  }

  private initializeAbly() {
    try {
      const apiKey = process.env.ABLY_API_KEY;
      if (!apiKey) {
        console.warn(
          "[AblyMetrics] ABLY_API_KEY not configured, streaming disabled"
        );
        return;
      }

      this.client = new Realtime({ key: apiKey });
      console.log("[AblyMetrics] Ably client initialized");
    } catch (error) {
      console.error("[AblyMetrics] Failed to initialize Ably:", error);
    }
  }

  /**
   * Start streaming metrics for a kiosk
   */
  async startMetricStream(config: MetricStreamConfig): Promise<void> {
    if (!this.client) {
      console.warn("[AblyMetrics] Ably client not initialized");
      return;
    }

    const streamKey = `${config.kioskId}:${config.eventId}`;
    const channelName = `${this.channelPrefix}${streamKey}`;

    // Stop existing stream if any
    if (this.activeStreams.has(streamKey)) {
      clearInterval(this.activeStreams.get(streamKey));
    }

    const channel = this.client.channels.get(channelName);

    // Publish metrics at regular intervals
    const interval = setInterval(async () => {
      try {
        const metrics = await analyticsDb.getKioskMetrics(
          config.kioskId,
          config.eventId,
          new Date(Date.now() - 60000), // Last minute
          new Date()
        );

        if (metrics.length > 0) {
          const latestMetric = metrics[metrics.length - 1];
          const streamedMetric: StreamedMetric = {
            kioskId: config.kioskId,
            eventId: config.eventId,
            timestamp: latestMetric.timestamp,
            latency: latestMetric.latency,
            bandwidth: Number(latestMetric.bandwidth),
            signalStrength: latestMetric.signalStrength,
            connectionQuality: latestMetric.connectionQuality,
            isOnline: latestMetric.isOnline,
          };

          await channel.publish("metric-update", streamedMetric);
        }
      } catch (error) {
        console.error(
          `[AblyMetrics] Error streaming metrics for ${streamKey}:`,
          error
        );
      }
    }, config.updateInterval);

    this.activeStreams.set(streamKey, interval);
    console.log(`[AblyMetrics] Started streaming metrics for ${streamKey}`);
  }

  /**
   * Stop streaming metrics for a kiosk
   */
  stopMetricStream(kioskId: string, eventId: string): void {
    const streamKey = `${kioskId}:${eventId}`;

    if (this.activeStreams.has(streamKey)) {
      clearInterval(this.activeStreams.get(streamKey));
      this.activeStreams.delete(streamKey);
      console.log(`[AblyMetrics] Stopped streaming metrics for ${streamKey}`);
    }
  }

  /**
   * Publish anomaly alert
   */
  async publishAnomalyAlert(
    kioskId: string,
    eventId: string,
    anomaly: {
      id: number;
      anomalyType: string;
      severity: string;
      description: string;
    }
  ): Promise<void> {
    if (!this.client) return;

    const channelName = `${this.channelPrefix}alerts:${kioskId}:${eventId}`;
    const channel = this.client.channels.get(channelName);

    await channel.publish("anomaly-detected", {
      kioskId,
      eventId,
      anomaly,
      timestamp: new Date(),
    });

    console.log(
      `[AblyMetrics] Published anomaly alert for ${kioskId}:${eventId}`
    );
  }

  /**
   * Publish failover event
   */
  async publishFailoverEvent(
    kioskId: string,
    eventId: string,
    failover: {
      fromNetwork: string;
      toNetwork: string;
      latencyImprovement: number;
      reason: string;
    }
  ): Promise<void> {
    if (!this.client) return;

    const channelName = `${this.channelPrefix}failovers:${kioskId}:${eventId}`;
    const channel = this.client.channels.get(channelName);

    await channel.publish("failover-event", {
      kioskId,
      eventId,
      failover,
      timestamp: new Date(),
    });

    console.log(
      `[AblyMetrics] Published failover event for ${kioskId}:${eventId}`
    );
  }

  /**
   * Get channel for subscribing to metrics
   */
  getMetricsChannel(kioskId: string, eventId: string) {
    if (!this.client) return null;

    const streamKey = `${kioskId}:${eventId}`;
    const channelName = `${this.channelPrefix}${streamKey}`;
    return this.client.channels.get(channelName);
  }

  /**
   * Get channel for subscribing to alerts
   */
  getAlertsChannel(kioskId: string, eventId: string) {
    if (!this.client) return null;

    const channelName = `${this.channelPrefix}alerts:${kioskId}:${eventId}`;
    return this.client.channels.get(channelName);
  }

  /**
   * Get channel for subscribing to failovers
   */
  getFailoversChannel(kioskId: string, eventId: string) {
    if (!this.client) return null;

    const channelName = `${this.channelPrefix}failovers:${kioskId}:${eventId}`;
    return this.client.channels.get(channelName);
  }

  /**
   * Stop all active streams
   */
  stopAllStreams(): void {
    this.activeStreams.forEach((interval) => clearInterval(interval));
    this.activeStreams.clear();
    console.log("[AblyMetrics] Stopped all metric streams");
  }

  /**
   * Get active stream count
   */
  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}

export const ablyMetricsService = new AblyMetricsStreamingService();
