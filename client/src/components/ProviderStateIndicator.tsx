/**
 * Provider State Indicator Component
 * Displays current connectivity provider, status, and fallback notifications
 * Used in Shadow Mode and operator consoles
 */

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Signal, Phone, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type ProviderType = "webphone" | "teams" | "zoom" | "webex" | "rtmp" | "pstn";
export type ProviderStatus = "active" | "degraded" | "fallback" | "failed";

export interface ProviderState {
  provider: ProviderType;
  status: ProviderStatus;
  fallbackReason?: string;
  previousProvider?: ProviderType;
  switchedAt?: Date;
  connectionQuality?: "excellent" | "good" | "fair" | "poor";
  latency?: number; // ms
}

export interface ProviderStateIndicatorProps {
  state: ProviderState;
  compact?: boolean;
  showNotification?: boolean;
  onDismissNotification?: () => void;
}

const ProviderStateIndicator: React.FC<ProviderStateIndicatorProps> = ({
  state,
  compact = false,
  showNotification = true,
  onDismissNotification,
}) => {
  const [showFallbackAlert, setShowFallbackAlert] = useState(showNotification && state.status === "fallback");

  useEffect(() => {
    if (state.status === "fallback" && showNotification) {
      setShowFallbackAlert(true);
    }
  }, [state.status, showNotification]);

  const providerColors: Record<ProviderType, string> = {
    webphone: "bg-blue-600",
    teams: "bg-purple-600",
    zoom: "bg-cyan-600",
    webex: "bg-green-600",
    rtmp: "bg-orange-600",
    pstn: "bg-gray-600",
  };

  const statusIcons: Record<ProviderStatus, React.ReactNode> = {
    active: <CheckCircle className="w-4 h-4 text-green-600" />,
    degraded: <AlertCircle className="w-4 h-4 text-yellow-600" />,
    fallback: <Signal className="w-4 h-4 text-orange-600" />,
    failed: <AlertCircle className="w-4 h-4 text-red-600" />,
  };

  const statusLabels: Record<ProviderStatus, string> = {
    active: "Connected",
    degraded: "Degraded",
    fallback: "Fallback Active",
    failed: "Failed",
  };

  const statusColors: Record<ProviderStatus, string> = {
    active: "text-green-600",
    degraded: "text-yellow-600",
    fallback: "text-orange-600",
    failed: "text-red-600",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${providerColors[state.provider]} text-white`}>
          {state.provider.toUpperCase()}
        </Badge>
        <div className={`flex items-center gap-1 ${statusColors[state.status]}`}>
          {statusIcons[state.status]}
          <span className="text-xs font-medium">{statusLabels[state.status]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Provider Status */}
      <Card className="p-4 bg-card border border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Connectivity Provider</p>
              <p className="text-xs text-muted-foreground">Current connection status</p>
            </div>
          </div>
          <Badge className={`${providerColors[state.provider]} text-white`}>
            {state.provider.toUpperCase()}
          </Badge>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg ${statusColors[state.status]} bg-opacity-10`}>
          {statusIcons[state.status]}
          <div>
            <p className="font-medium text-sm">{statusLabels[state.status]}</p>
            {state.connectionQuality && (
              <p className="text-xs text-muted-foreground">
                Quality: {state.connectionQuality.charAt(0).toUpperCase() + state.connectionQuality.slice(1)}
                {state.latency && ` • Latency: ${state.latency}ms`}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Fallback Notification */}
      {showFallbackAlert && state.status === "fallback" && state.fallbackReason && (
        <Card className="p-4 bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-amber-900">Fallback Activated</p>
              <p className="text-sm text-amber-800 mt-1">{state.fallbackReason}</p>
              {state.previousProvider && (
                <p className="text-xs text-amber-700 mt-2">
                  Switched from {state.previousProvider.toUpperCase()} to {state.provider.toUpperCase()}
                  {state.switchedAt && ` at ${new Date(state.switchedAt).toLocaleTimeString()}`}
                </p>
              )}
            </div>
            {onDismissNotification && (
              <button
                onClick={() => {
                  setShowFallbackAlert(false);
                  onDismissNotification();
                }}
                className="text-amber-600 hover:text-amber-900 text-lg"
              >
                ✕
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Failed Status Alert */}
      {state.status === "failed" && (
        <Card className="p-4 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-red-900">Connection Failed</p>
              <p className="text-sm text-red-800 mt-1">
                {state.fallbackReason || "Unable to establish connection. Please check your settings."}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProviderStateIndicator;
