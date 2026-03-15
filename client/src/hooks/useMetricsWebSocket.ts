import { useEffect, useState, useCallback, useRef } from "react";

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

export interface UseMetricsWebSocketOptions {
  conferenceId: string;
  onMetricsUpdate?: (metrics: MetricsData) => void;
  onError?: (error: Error) => void;
}

export function useMetricsWebSocket({
  conferenceId,
  onMetricsUpdate,
  onError,
}: UseMetricsWebSocketOptions) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/metrics`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WebSocket] Connected to metrics server");
        setIsConnected(true);

        // Subscribe to conference metrics
        ws.send(
          JSON.stringify({
            type: "subscribe",
            conferenceId,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (
            message.type === "metrics_update" ||
            message.type === "metrics_snapshot"
          ) {
            const metricsData: MetricsData = message.data;
            setMetrics(metricsData);
            onMetricsUpdate?.(metricsData);
          }
        } catch (error) {
          console.error("[WebSocket] Error parsing message:", error);
        }
      };

      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        const error = new Error("WebSocket connection error");
        onError?.(error);
      };

      ws.onclose = () => {
        console.log("[WebSocket] Disconnected from metrics server");
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("[WebSocket] Connection failed:", err);
      onError?.(err);
    }
  }, [conferenceId, onMetricsUpdate, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "unsubscribe",
          conferenceId,
        })
      );
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    metrics,
    isConnected,
    reconnect: connect,
  };
}
