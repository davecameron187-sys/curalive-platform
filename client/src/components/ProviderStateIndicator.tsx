import React from "react";
import { AlertCircle, CheckCircle, AlertTriangle, Wifi } from "lucide-react";

interface ProviderStateIndicatorProps {
  provider: "webphone" | "teams" | "zoom" | "webex" | "rtmp" | "pstn";
  status: "active" | "degraded" | "fallback" | "failed";
  fallbackReason?: string;
}

export function ProviderStateIndicator({ provider, status, fallbackReason }: ProviderStateIndicatorProps) {
  const getProviderColor = (p: string) => {
    switch (p) {
      case "webphone":
        return "bg-blue-600";
      case "teams":
        return "bg-purple-600";
      case "zoom":
        return "bg-cyan-600";
      case "webex":
        return "bg-green-600";
      case "rtmp":
        return "bg-orange-600";
      case "pstn":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "fallback":
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "active":
        return "✓ Connected";
      case "degraded":
        return "⚠ Degraded";
      case "fallback":
        return "⚠ Fallback Active";
      case "failed":
        return "✕ Failed";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "active":
        return "text-green-500";
      case "degraded":
        return "text-yellow-500";
      case "fallback":
        return "text-orange-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="px-4 py-2 border-b border-border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi className="w-4 h-4 text-muted-foreground" />
          <span className={`text-xs font-bold px-2 py-1 rounded ${getProviderColor(provider)} text-white uppercase`}>
            {provider}
          </span>
          <div className="flex items-center gap-1.5">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      {fallbackReason && (
        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-400">
            <p className="font-semibold">Fallback: {fallbackReason}</p>
            <p className="text-xs text-amber-300 mt-1">Switched from WebPhone at 14:32:15</p>
          </div>
        </div>
      )}
    </div>
  );
}
