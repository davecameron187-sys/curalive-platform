/**
 * useKioskNetworkStatus Hook
 * Integration hook for Check-In Kiosk to monitor and respond to network changes
 */
import { useEffect, useState, useCallback } from "react";
import { networkFailover, NetworkStatus, FailoverEvent } from "@/services/networkFailover";

export interface KioskNetworkState {
  isOnline: boolean;
  networkType: string;
  latency: number;
  signalStrength: number;
  isConnecting: boolean;
  lastFailover?: FailoverEvent;
  connectionQuality: "excellent" | "good" | "fair" | "poor" | "offline";
}

export function useKioskNetworkStatus() {
  const [networkState, setNetworkState] = useState<KioskNetworkState>({
    isOnline: navigator.onLine,
    networkType: "unknown",
    latency: 0,
    signalStrength: 100,
    isConnecting: false,
    connectionQuality: "good",
  });

  const updateNetworkState = useCallback((status: NetworkStatus) => {
    let quality: "excellent" | "good" | "fair" | "poor" | "offline";

    if (!status.isOnline) {
      quality = "offline";
    } else if (status.latency < 50) {
      quality = "excellent";
    } else if (status.latency < 100) {
      quality = "good";
    } else if (status.latency < 200) {
      quality = "fair";
    } else {
      quality = "poor";
    }

    setNetworkState({
      isOnline: status.isOnline,
      networkType: status.type,
      latency: status.latency,
      signalStrength: status.signalStrength,
      isConnecting: false,
      connectionQuality: quality,
    });
  }, []);

  const handleFailover = useCallback((event: FailoverEvent) => {
    setNetworkState((prev) => ({
      ...prev,
      lastFailover: event,
    }));

    // Log failover event for diagnostics
    console.log(
      `[Kiosk] Network failover: ${event.fromNetwork} → ${event.toNetwork}`
    );
  }, []);

  useEffect(() => {
    // Initialize network failover service
    networkFailover.initialize().catch(console.error);

    // Subscribe to status changes
    const unsubscribeStatus = networkFailover.onStatusChange(updateNetworkState);

    // Subscribe to failover events
    const unsubscribeFailover = networkFailover.onFailover(handleFailover);

    // Get initial status
    const initialStatus = networkFailover.getStatus();
    if (initialStatus) {
      updateNetworkState(initialStatus);
    }

    return () => {
      unsubscribeStatus();
      unsubscribeFailover();
    };
  }, [updateNetworkState, handleFailover]);

  const reconnect = useCallback(async () => {
    setNetworkState((prev) => ({ ...prev, isConnecting: true }));
    try {
      const success = await networkFailover.reconnect();
      if (!success) {
        setNetworkState((prev) => ({ ...prev, isConnecting: false }));
      }
    } catch (error) {
      console.error("Reconnection error:", error);
      setNetworkState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, []);

  const shouldPauseScanning = networkState.connectionQuality === "offline";
  const shouldWarnUser = networkState.connectionQuality === "poor";

  return {
    ...networkState,
    reconnect,
    shouldPauseScanning,
    shouldWarnUser,
    diagnostics: networkFailover.getDiagnostics(),
  };
}

/**
 * useAdminNetworkMonitoring Hook
 * Integration hook for Admin Dashboard to monitor network across all kiosks
 */
export function useAdminNetworkMonitoring() {
  const [networkMetrics, setNetworkMetrics] = useState(
    networkFailover.getMetrics()
  );
  const [failoverHistory, setFailoverHistory] = useState(
    networkFailover.getFailoverHistory()
  );

  useEffect(() => {
    // Update metrics every 2 seconds
    const metricsInterval = setInterval(() => {
      setNetworkMetrics(networkFailover.getMetrics());
    }, 2000);

    // Subscribe to failover events
    const unsubscribeFailover = networkFailover.onFailover((event) => {
      setFailoverHistory((prev) => [event, ...prev].slice(0, 20)); // Keep last 20
    });

    return () => {
      clearInterval(metricsInterval);
      unsubscribeFailover();
    };
  }, []);

  return {
    metrics: networkMetrics,
    failoverHistory,
    diagnostics: networkFailover.getDiagnostics(),
  };
}

/**
 * Hook for network-aware data syncing
 */
export function useNetworkAwareSync(
  syncFn: () => Promise<void>,
  dependencies: any[] = []
) {
  const { isOnline, connectionQuality } = useKioskNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);

  const performSync = useCallback(async () => {
    if (!isOnline) {
      console.log("Skipping sync: offline");
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      await syncFn();
      setLastSyncTime(Date.now());
      console.log("Sync completed successfully");
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setSyncError(err);
      console.error("Sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, syncFn]);

  // Auto-sync when connection quality improves
  useEffect(() => {
    if (isOnline && connectionQuality !== "offline" && !isSyncing) {
      const timer = setTimeout(performSync, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, connectionQuality, isSyncing, performSync]);

  return {
    isSyncing,
    lastSyncTime,
    syncError,
    performSync,
    canSync: isOnline && connectionQuality !== "offline",
  };
}

/**
 * Hook for network-aware retry logic
 */
export function useNetworkAwareRetry(
  fn: () => Promise<any>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
) {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
  } = options;

  const { isOnline } = useKioskNetworkStatus();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const executeWithRetry = useCallback(async () => {
    let attempt = 0;
    let lastErr: Error | null = null;

    while (attempt < maxRetries) {
      try {
        if (!isOnline) {
          throw new Error("Network offline");
        }

        setIsRetrying(true);
        const result = await fn();
        setIsRetrying(false);
        setRetryCount(0);
        setLastError(null);
        return result;
      } catch (error) {
        lastErr = error instanceof Error ? error : new Error(String(error));
        attempt++;
        setRetryCount(attempt);
        setLastError(lastErr);

        if (attempt < maxRetries) {
          const delay = Math.min(
            initialDelay * Math.pow(backoffMultiplier, attempt - 1),
            maxDelay
          );

          console.log(
            `Retry attempt ${attempt}/${maxRetries} in ${delay}ms:`,
            lastErr.message
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    setIsRetrying(false);
    throw lastErr;
  }, [fn, isOnline, maxRetries, initialDelay, maxDelay, backoffMultiplier]);

  return {
    executeWithRetry,
    isRetrying,
    retryCount,
    lastError,
    canRetry: isOnline && retryCount < maxRetries,
  };
}
