/**
 * Hook for subscribing to real-time metrics via Ably
 * Round 62 Features
 */
import { useEffect, useState, useCallback } from "react";
import * as Ably from "ably";

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

interface AnomalyAlert {
  id: number;
  anomalyType: string;
  severity: string;
  description: string;
  timestamp: Date;
}

interface FailoverEvent {
  fromNetwork: string;
  toNetwork: string;
  latencyImprovement: number;
  reason: string;
  timestamp: Date;
}

interface UseRealtimeMetricsOptions {
  kioskId: string;
  eventId: string;
  enabled?: boolean;
}

export function useRealtimeMetrics(options: UseRealtimeMetricsOptions) {
  const { kioskId, eventId, enabled = true } = options;

  const [metrics, setMetrics] = useState<StreamedMetric | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [failovers, setFailovers] = useState<FailoverEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null);

  // Initialize Ably client
  useEffect(() => {
    if (!enabled) return;

    try {
      const client = new Ably.Realtime({
        authUrl: "/api/ably-auth",
        authMethod: "POST",
      });

      setAblyClient(client);

      client.connection.on("connected", () => {
        setIsConnected(true);
        setError(null);
        console.log("[RealtimeMetrics] Connected to Ably");
      });

      client.connection.on("disconnected", () => {
        setIsConnected(false);
      });

      client.connection.on("failed", (err) => {
        setError(err.message);
        console.error("[RealtimeMetrics] Connection failed:", err);
      });

      return () => {
        client.close();
      };
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize Ably"
      );
    }
  }, [enabled]);

  // Subscribe to metrics
  useEffect(() => {
    if (!ablyClient || !enabled) return;

    try {
      const metricsChannel = ablyClient.channels.get(
        `metrics:${kioskId}:${eventId}`
      );

      metricsChannel.subscribe("metric-update", (message: any) => {
        setMetrics(message.data);
      });

      return () => {
        metricsChannel.unsubscribe();
      };
    } catch (err) {
      console.error("[RealtimeMetrics] Error subscribing to metrics:", err);
    }
  }, [ablyClient, kioskId, eventId, enabled]);

  // Subscribe to anomalies
  useEffect(() => {
    if (!ablyClient || !enabled) return;

    try {
      const alertsChannel = ablyClient.channels.get(
        `metrics:alerts:${kioskId}:${eventId}`
      );

      alertsChannel.subscribe("anomaly-detected", (message: any) => {
        setAnomalies((prev) => [
          ...prev,
          { ...message.data.anomaly, timestamp: new Date() },
        ]);

        // Keep only last 50 anomalies
        setAnomalies((prev) => prev.slice(-50));
      });

      return () => {
        alertsChannel.unsubscribe();
      };
    } catch (err) {
      console.error("[RealtimeMetrics] Error subscribing to anomalies:", err);
    }
  }, [ablyClient, kioskId, eventId, enabled]);

  // Subscribe to failovers
  useEffect(() => {
    if (!ablyClient || !enabled) return;

    try {
      const failoversChannel = ablyClient.channels.get(
        `metrics:failovers:${kioskId}:${eventId}`
      );

      failoversChannel.subscribe("failover-event", (message: any) => {
        setFailovers((prev) => [
          ...prev,
          { ...message.data.failover, timestamp: new Date() },
        ]);

        // Keep only last 50 failovers
        setFailovers((prev) => prev.slice(-50));
      });

      return () => {
        failoversChannel.unsubscribe();
      };
    } catch (err) {
      console.error("[RealtimeMetrics] Error subscribing to failovers:", err);
    }
  }, [ablyClient, kioskId, eventId, enabled]);

  const clearAnomalies = useCallback(() => {
    setAnomalies([]);
  }, []);

  const clearFailovers = useCallback(() => {
    setFailovers([]);
  }, []);

  return {
    metrics,
    anomalies,
    failovers,
    isConnected,
    error,
    clearAnomalies,
    clearFailovers,
  };
}
