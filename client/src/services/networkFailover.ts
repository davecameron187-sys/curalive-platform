/**
 * Network Failover Service
 * Manages automatic failover between WiFi, cellular, and ethernet connections
 * Monitors network quality and switches to best available connection
 */

export type NetworkType = "wifi" | "cellular" | "ethernet" | "unknown";

export interface NetworkStatus {
  type: NetworkType;
  isOnline: boolean;
  effectiveType: "4g" | "3g" | "2g" | "slow-2g" | "unknown";
  downlink: number; // Mbps
  rtt: number; // Round trip time in ms
  saveData: boolean;
  signalStrength: number; // 0-100
  latency: number; // ms
  bandwidth: number; // Mbps
  isMetered: boolean;
  lastUpdate: number;
}

export interface FailoverEvent {
  timestamp: number;
  fromNetwork: NetworkType;
  toNetwork: NetworkType;
  reason: string;
  latencyImprovement: number; // ms
}

export interface NetworkMetrics {
  totalFailovers: number;
  averageLatency: number;
  peakBandwidth: number;
  downtime: number; // ms
  lastFailoverTime?: number;
  connectionStability: number; // 0-100
}

class NetworkFailoverService {
  private currentStatus: NetworkStatus | null = null;
  private statusCallbacks: Array<(status: NetworkStatus) => void> = [];
  private failoverCallbacks: Array<(event: FailoverEvent) => void> = [];
  private metrics: NetworkMetrics = {
    totalFailovers: 0,
    averageLatency: 0,
    peakBandwidth: 0,
    downtime: 0,
    connectionStability: 100,
  };

  private latencyHistory: number[] = [];
  private failoverHistory: FailoverEvent[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastFailoverTime: number = 0;
  private failoverCooldown: number = 5000; // 5 seconds

  async initialize(): Promise<void> {
    console.log("Initializing Network Failover Service");

    // Get initial network status
    await this.updateNetworkStatus();

    // Setup event listeners
    this.setupEventListeners();

    // Start continuous monitoring
    this.startMonitoring();
  }

  /**
   * Setup network change event listeners
   */
  private setupEventListeners(): void {
    // Online/offline events
    window.addEventListener("online", () => {
      console.log("Network came online");
      this.handleNetworkChange();
    });

    window.addEventListener("offline", () => {
      console.log("Network went offline");
      this.handleNetworkChange();
    });

    // Connection change events (if available)
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener("change", () => {
        console.log("Connection type changed");
        this.handleNetworkChange();
      });
    }
  }

  /**
   * Update current network status
   */
  private async updateNetworkStatus(): Promise<void> {
    const status = await this.getNetworkStatus();

    // Check if network type changed
    if (
      this.currentStatus &&
      this.currentStatus.type !== status.type &&
      this.currentStatus.isOnline &&
      status.isOnline
    ) {
      const timeSinceLastFailover = Date.now() - this.lastFailoverTime;

      // Only trigger failover if cooldown has passed
      if (timeSinceLastFailover > this.failoverCooldown) {
        const latencyImprovement =
          this.currentStatus.latency - status.latency;

        const event: FailoverEvent = {
          timestamp: Date.now(),
          fromNetwork: this.currentStatus.type,
          toNetwork: status.type,
          reason: `Automatic failover to ${status.type}`,
          latencyImprovement,
        };

        this.failoverHistory.push(event);
        this.metrics.totalFailovers++;
        this.lastFailoverTime = Date.now();

        console.log(
          `Failover triggered: ${event.fromNetwork} → ${event.toNetwork}`
        );
        this.notifyFailoverCallbacks(event);
      }
    }

    this.currentStatus = status;

    // Update latency history
    this.latencyHistory.push(status.latency);
    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift();
    }

    // Update metrics
    this.updateMetrics(status);

    // Notify subscribers
    this.notifyStatusCallbacks(status);
  }

  /**
   * Get current network status
   */
  private async getNetworkStatus(): Promise<NetworkStatus> {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    const isOnline = navigator.onLine;
    let type: NetworkType = "unknown";
    let effectiveType: "4g" | "3g" | "2g" | "slow-2g" | "unknown" = "unknown";
    let downlink = 0;
    let rtt = 0;
    let saveData = false;
    let isMetered = false;

    if (connection) {
      effectiveType = connection.effectiveType || "unknown";
      downlink = connection.downlink || 0;
      rtt = connection.rtt || 0;
      saveData = connection.saveData || false;
      isMetered = connection.metered || false;

      // Determine network type
      if (connection.type) {
        type = connection.type as NetworkType;
      } else {
        // Fallback detection based on effective type
        if (
          effectiveType === "4g" ||
          effectiveType === "3g" ||
          effectiveType === "2g"
        ) {
          type = "cellular";
        }
      }
    }

    // Measure latency with beacon request
    const latency = await this.measureLatency();

    // Estimate bandwidth
    const bandwidth = this.estimateBandwidth(effectiveType);

    // Estimate signal strength (0-100)
    const signalStrength = this.estimateSignalStrength(effectiveType);

    return {
      type,
      isOnline,
      effectiveType,
      downlink,
      rtt,
      saveData,
      signalStrength,
      latency,
      bandwidth,
      isMetered,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Measure network latency
   */
  private async measureLatency(): Promise<number> {
    const startTime = performance.now();

    try {
      // Use a small beacon request to measure latency
      await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });

      const endTime = performance.now();
      return Math.round(endTime - startTime);
    } catch (error) {
      console.error("Latency measurement failed:", error);
      return 0;
    }
  }

  /**
   * Estimate bandwidth based on connection type
   */
  private estimateBandwidth(effectiveType: string): number {
    const bandwidthMap: Record<string, number> = {
      "4g": 50,
      "3g": 10,
      "2g": 0.5,
      "slow-2g": 0.1,
      unknown: 10,
    };

    return bandwidthMap[effectiveType] || 10;
  }

  /**
   * Estimate signal strength based on connection type and latency
   */
  private estimateSignalStrength(effectiveType: string): number {
    const baseStrength: Record<string, number> = {
      "4g": 90,
      "3g": 70,
      "2g": 50,
      "slow-2g": 30,
      unknown: 50,
    };

    let strength = baseStrength[effectiveType] || 50;

    // Adjust based on recent latency
    if (this.latencyHistory.length > 0) {
      const avgLatency =
        this.latencyHistory.reduce((a, b) => a + b, 0) /
        this.latencyHistory.length;

      if (avgLatency > 200) {
        strength -= 20;
      } else if (avgLatency > 100) {
        strength -= 10;
      }
    }

    return Math.max(0, Math.min(100, strength));
  }

  /**
   * Update metrics
   */
  private updateMetrics(status: NetworkStatus): void {
    // Update average latency
    if (this.latencyHistory.length > 0) {
      this.metrics.averageLatency =
        this.latencyHistory.reduce((a, b) => a + b, 0) /
        this.latencyHistory.length;
    }

    // Update peak bandwidth
    this.metrics.peakBandwidth = Math.max(
      this.metrics.peakBandwidth,
      status.bandwidth
    );

    // Update connection stability
    if (this.latencyHistory.length > 10) {
      const recentLatencies = this.latencyHistory.slice(-10);
      const variance =
        recentLatencies.reduce((sum, val) => {
          const diff = val - this.metrics.averageLatency;
          return sum + diff * diff;
        }, 0) / recentLatencies.length;

      // Lower variance = higher stability
      const stability = Math.max(0, 100 - Math.sqrt(variance) / 10);
      this.metrics.connectionStability = Math.round(stability);
    }
  }

  /**
   * Handle network change
   */
  private async handleNetworkChange(): Promise<void> {
    await this.updateNetworkStatus();
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    // Monitor every 5 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.updateNetworkStatus();
    }, 5000);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus | null {
    return this.currentStatus;
  }

  /**
   * Get metrics
   */
  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  /**
   * Get failover history
   */
  getFailoverHistory(): FailoverEvent[] {
    return [...this.failoverHistory];
  }

  /**
   * Register callback for status updates
   */
  onStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Register callback for failover events
   */
  onFailover(callback: (event: FailoverEvent) => void): () => void {
    this.failoverCallbacks.push(callback);
    return () => {
      this.failoverCallbacks = this.failoverCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  private notifyStatusCallbacks(status: NetworkStatus): void {
    this.statusCallbacks.forEach((callback) => {
      try {
        callback(status);
      } catch (error) {
        console.error("Status callback error:", error);
      }
    });
  }

  private notifyFailoverCallbacks(event: FailoverEvent): void {
    this.failoverCallbacks.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Failover callback error:", error);
      }
    });
  }

  /**
   * Attempt to reconnect if offline
   */
  async reconnect(): Promise<boolean> {
    console.log("Attempting to reconnect...");

    try {
      const response = await fetch("/api/health", {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        console.log("Reconnection successful");
        await this.updateNetworkStatus();
        return true;
      }
    } catch (error) {
      console.error("Reconnection failed:", error);
    }

    return false;
  }

  /**
   * Get network diagnostics
   */
  getDiagnostics(): Record<string, any> {
    return {
      currentStatus: this.currentStatus,
      metrics: this.metrics,
      failoverHistory: this.failoverHistory.slice(-10), // Last 10 failovers
      latencyTrend:
        this.latencyHistory.length > 0
          ? {
              min: Math.min(...this.latencyHistory),
              max: Math.max(...this.latencyHistory),
              avg:
                this.latencyHistory.reduce((a, b) => a + b, 0) /
                this.latencyHistory.length,
            }
          : null,
    };
  }

  /**
   * Clear history and reset metrics
   */
  reset(): void {
    this.latencyHistory = [];
    this.failoverHistory = [];
    this.metrics = {
      totalFailovers: 0,
      averageLatency: 0,
      peakBandwidth: 0,
      downtime: 0,
      connectionStability: 100,
    };
  }
}

// Export singleton instance
export const networkFailover = new NetworkFailoverService();
