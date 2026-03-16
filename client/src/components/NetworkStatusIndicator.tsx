/**
 * Network Status Indicator Components
 * Real-time display of network connection status and quality
 */
import { useEffect, useState } from "react";
import { networkFailover, NetworkStatus, FailoverEvent } from "@/services/networkFailover";
import {
  Wifi,
  WifiOff,
  Signal,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react";

interface NetworkStatusIndicatorProps {
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * Main Network Status Indicator Component
 */
export function NetworkStatusIndicator({
  compact = false,
  showDetails = false,
}: NetworkStatusIndicatorProps) {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [failoverEvents, setFailoverEvents] = useState<FailoverEvent[]>([]);
  const [showDetails_, setShowDetails_] = useState(showDetails);

  useEffect(() => {
    // Initialize network failover service
    networkFailover.initialize().catch(console.error);

    // Subscribe to status changes
    const unsubscribeStatus = networkFailover.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    // Subscribe to failover events
    const unsubscribeFailover = networkFailover.onFailover((event) => {
      setFailoverEvents((prev) => [event, ...prev].slice(0, 5)); // Keep last 5
    });

    // Get initial status
    const initialStatus = networkFailover.getStatus();
    if (initialStatus) {
      setStatus(initialStatus);
    }

    return () => {
      unsubscribeStatus();
      unsubscribeFailover();
      networkFailover.stopMonitoring();
    };
  }, []);

  if (!status) {
    return null;
  }

  const getNetworkIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="w-5 h-5 text-red-500" />;
    }

    switch (status.type) {
      case "wifi":
        return <Wifi className="w-5 h-5 text-blue-500" />;
      case "cellular":
        return <Signal className="w-5 h-5 text-green-500" />;
      case "ethernet":
        return <Zap className="w-5 h-5 text-yellow-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    if (!status.isOnline) return "bg-red-500";
    if (status.latency > 200) return "bg-yellow-500";
    if (status.latency > 100) return "bg-orange-500";
    return "bg-green-500";
  };

  const getSignalBars = () => {
    const strength = status.signalStrength;
    if (strength >= 80) return 4;
    if (strength >= 60) return 3;
    if (strength >= 40) return 2;
    if (strength >= 20) return 1;
    return 0;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600">
        <div className="relative">
          {getNetworkIcon()}
          <div
            className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full ${getStatusColor()}`}
          />
        </div>
        <span className="text-xs font-medium text-slate-300">
          {status.isOnline ? `${status.latency}ms` : "Offline"}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {getNetworkIcon()}
            <div>
              <h3 className="font-semibold text-white">
                {status.isOnline ? "Connected" : "Offline"}
              </h3>
              <p className="text-sm text-slate-400">
                {status.type === "unknown" ? "Unknown" : status.type.toUpperCase()}
              </p>
            </div>
          </div>
          <div className={`${getStatusColor()} rounded-full p-2`}>
            {status.isOnline ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-white" />
            )}
          </div>
        </div>

        {/* Network Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Latency</p>
            <p className="text-lg font-bold text-white">{status.latency}ms</p>
          </div>

          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Bandwidth</p>
            <p className="text-lg font-bold text-white">
              {status.bandwidth.toFixed(1)} Mbps
            </p>
          </div>

          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Signal Strength</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-3 rounded-sm ${
                      i < getSignalBars()
                        ? "bg-green-500"
                        : "bg-slate-500"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-white">
                {status.signalStrength}%
              </span>
            </div>
          </div>

          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400 mb-1">Connection Type</p>
            <p className="text-sm font-semibold text-white">
              {status.effectiveType.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        {status.isMetered && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-400">
            ⚠️ Metered connection - data usage may be charged
          </div>
        )}

        {status.saveData && (
          <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
            💾 Data Saver mode enabled
          </div>
        )}
      </div>

      {/* Failover Events */}
      {failoverEvents.length > 0 && (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">Recent Failovers</h4>
          <div className="space-y-2">
            {failoverEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-slate-600 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-300">
                    {event.fromNetwork} → {event.toNetwork}
                  </span>
                </div>
                {event.latencyImprovement > 0 && (
                  <span className="text-green-400 text-xs">
                    -{event.latencyImprovement.toFixed(0)}ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      {showDetails_ && (
        <NetworkStatusDetails />
      )}

      <button
        onClick={() => setShowDetails_(!showDetails_)}
        className="w-full py-2 px-3 text-sm text-slate-300 hover:text-white bg-slate-600 hover:bg-slate-500 rounded transition-colors"
      >
        {showDetails_ ? "Hide Details" : "Show Details"}
      </button>
    </div>
  );
}

/**
 * Detailed Network Status Component
 */
function NetworkStatusDetails() {
  const [metrics, setMetrics] = useState(networkFailover.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(networkFailover.getMetrics());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
      <h4 className="font-semibold text-white mb-3">Network Metrics</h4>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-slate-400">Connection Stability</span>
            <span className="text-sm font-semibold text-white">
              {metrics.connectionStability}%
            </span>
          </div>
          <div className="w-full bg-slate-600 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${metrics.connectionStability}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400">Avg Latency</p>
            <p className="text-lg font-bold text-white">
              {metrics.averageLatency.toFixed(0)}ms
            </p>
          </div>

          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400">Peak Bandwidth</p>
            <p className="text-lg font-bold text-white">
              {metrics.peakBandwidth.toFixed(1)} Mbps
            </p>
          </div>

          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400">Total Failovers</p>
            <p className="text-lg font-bold text-white">
              {metrics.totalFailovers}
            </p>
          </div>

          <div className="bg-slate-600 rounded p-3">
            <p className="text-xs text-slate-400">Downtime</p>
            <p className="text-lg font-bold text-white">
              {(metrics.downtime / 1000).toFixed(1)}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Network Status Badge
 */
export function NetworkStatusBadge() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);

  useEffect(() => {
    const unsubscribe = networkFailover.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  if (!status || !status.isOnline) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 border border-red-500/50">
        <WifiOff className="w-3 h-3 text-red-500" />
        <span className="text-xs font-semibold text-red-500">Offline</span>
      </div>
    );
  }

  const getQualityColor = () => {
    if (status.latency > 200) return "bg-yellow-500/20 border-yellow-500/50";
    if (status.latency > 100) return "bg-orange-500/20 border-orange-500/50";
    return "bg-green-500/20 border-green-500/50";
  };

  const getQualityText = () => {
    if (status.latency > 200) return "Poor";
    if (status.latency > 100) return "Fair";
    return "Good";
  };

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded border ${getQualityColor()}`}
    >
      <Activity className="w-3 h-3" />
      <span className="text-xs font-semibold">
        {getQualityText()} ({status.latency}ms)
      </span>
    </div>
  );
}

/**
 * Hook for using network status in components
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [metrics, setMetrics] = useState(networkFailover.getMetrics());

  useEffect(() => {
    const unsubscribeStatus = networkFailover.onStatusChange(setStatus);

    const metricsInterval = setInterval(() => {
      setMetrics(networkFailover.getMetrics());
    }, 2000);

    return () => {
      unsubscribeStatus();
      clearInterval(metricsInterval);
    };
  }, []);

  return { status, metrics };
}
