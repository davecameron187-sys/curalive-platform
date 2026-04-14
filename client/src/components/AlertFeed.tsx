import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as Ably from "ably";

interface AlertMessage {
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

interface AlertFeedProps {
  eventId: string;
  onAlertClick?: (violation: AlertMessage) => void;
  maxVisible?: number;
}

export function AlertFeed({ eventId, onAlertClick, maxVisible = 5 }: AlertFeedProps) {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Ably connection
  useEffect(() => {
    let channel: Ably.RealtimeChannel | null = null;
    let client: Ably.Realtime | null = null;

    const initAbly = async () => {
      try {
        // Get Ably token from server
        const tokenResponse = await fetch("/api/ably/token");
        const { token } = await tokenResponse.json();

        // Initialize Ably client
        client = new Ably.Realtime({ token });

        // Subscribe to alert channel
        channel = client.channels.get(`aiAm:alerts:${eventId}`);

        // Subscribe to violation detected events
        channel.subscribe("violation_detected", (message) => {
          const alert = message.data as AlertMessage;

          // Add to alerts list
          setAlerts((prev) => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
          setUnreadCount((prev) => prev + 1);

          // Trigger callback
          if (onAlertClick) {
            onAlertClick(alert);
          }
        });

        setIsConnected(true);
      } catch (error) {
        console.error("[AlertFeed] Ably connection error:", error);
        setIsConnected(false);
      }
    };

    initAbly();

    // Cleanup
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
      if (client) {
        client.close();
      }
    };
  }, [eventId, onAlertClick]);

  // Handle alert dismiss
  const dismissAlert = useCallback((violationId: number) => {
    setAlerts((prev) => prev.filter((a) => a.violationId !== violationId));
  }, []);

  // Mark as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] z-50">
      {/* Notification Bell */}
      {unreadCount > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium">{unreadCount} new violation{unreadCount !== 1 ? "s" : ""}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={markAsRead}
            className="text-xs"
          >
            Mark as read
          </Button>
        </div>
      )}

      {/* Connection Status */}
      {!isConnected && (
        <Card className="mb-4 p-3 bg-yellow-50 border-yellow-200">
          <p className="text-xs text-yellow-800">
            Connecting to alert stream...
          </p>
        </Card>
      )}

      {/* Alerts Stack */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {alerts.slice(0, maxVisible).map((alert) => (
          <Card
            key={alert.violationId}
            className={`p-4 border-l-4 ${getSeverityColor(alert.severity)} bg-white cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => onAlertClick?.(alert)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <Badge variant="secondary" className="text-xs">
                  {alert.violationType.replace(/_/g, " ")}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissAlert(alert.violationId);
                }}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm font-medium mb-1 line-clamp-2">
              {alert.transcriptExcerpt}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {alert.speakerName} {alert.speakerRole && `(${alert.speakerRole})`}
              </span>
              <span>{(alert.confidenceScore * 100).toFixed(0)}% confidence</span>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {new Date(alert.detectedAt).toLocaleTimeString()}
            </p>
          </Card>
        ))}

        {alerts.length === 0 && isConnected && (
          <Card className="p-4 text-center text-muted-foreground text-sm">
            No violations detected yet
          </Card>
        )}
      </div>
    </div>
  );
}
