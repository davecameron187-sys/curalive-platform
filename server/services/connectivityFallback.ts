/**
 * Connectivity Fallback Service
 * Manages provider switching when WebPhone fails
 * Implements retry logic, fallback selection, and operator notifications
 */

import { notifyOwner } from "../_core/notification";

// Alias for operator notifications
const notifyOperator = notifyOwner;

export type ConnectivityProvider = "webphone" | "zoom" | "teams" | "webex" | "rtmp" | "pstn";

export interface FallbackConfig {
  maxRetries: number; // Default: 3
  retryDelayMs: number; // Default: 1000ms
  backoffMultiplier: number; // Default: 1.5
  fallbackProviders: ConnectivityProvider[]; // Ordered list of fallback providers
  notifyOperator: boolean; // Default: true
}

export interface FallbackResult {
  success: boolean;
  provider: ConnectivityProvider;
  attempt: number;
  totalAttempts: number;
  reason?: string;
  connectionId?: string;
  error?: string;
}

export interface ProviderStatus {
  provider: ConnectivityProvider;
  status: "available" | "degraded" | "unavailable";
  lastChecked: Date;
  errorCount: number;
  successCount: number;
}

// Default configuration
const DEFAULT_CONFIG: FallbackConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  backoffMultiplier: 1.5,
  fallbackProviders: ["teams", "zoom", "webex", "rtmp", "pstn"],
  notifyOperator: true,
};

// Provider status tracking
const providerStatusMap = new Map<ConnectivityProvider, ProviderStatus>();

/**
 * Initialize provider status tracking
 */
export function initializeProviderStatus(): void {
  const providers: ConnectivityProvider[] = [
    "webphone",
    "zoom",
    "teams",
    "webex",
    "rtmp",
    "pstn",
  ];

  providers.forEach((provider) => {
    providerStatusMap.set(provider, {
      provider,
      status: "available",
      lastChecked: new Date(),
      errorCount: 0,
      successCount: 0,
    });
  });

  console.log("[Connectivity Fallback] Provider status initialized");
}

/**
 * Get current status of a provider
 */
export function getProviderStatus(
  provider: ConnectivityProvider
): ProviderStatus | undefined {
  return providerStatusMap.get(provider);
}

/**
 * Update provider status after connection attempt
 */
function updateProviderStatus(
  provider: ConnectivityProvider,
  success: boolean
): void {
  const status = providerStatusMap.get(provider);
  if (!status) return;

  if (success) {
    status.successCount++;
    status.errorCount = 0;
    status.status = "available";
  } else {
    status.errorCount++;
    // Mark as degraded after 1 error, unavailable after 3 errors
    if (status.errorCount >= 3) {
      status.status = "unavailable";
    } else if (status.errorCount >= 1) {
      status.status = "degraded";
    }
  }

  status.lastChecked = new Date();
  providerStatusMap.set(provider, status);
}

/**
 * Attempt to initialize a connectivity provider
 */
async function attemptProviderInitialization(
  provider: ConnectivityProvider,
  config: any
): Promise<{ success: boolean; connectionId?: string; error?: string }> {
  try {
    switch (provider) {
      case "webphone":
        return await initializeWebPhoneProvider(config);
      case "zoom":
        return await initializeZoomProvider(config);
      case "teams":
        return await initializeTeamsProvider(config);
      case "webex":
        return await initializeWebexProvider(config);
      case "rtmp":
        return await initializeRtmpProvider(config);
      case "pstn":
        return await initializePstnProvider(config);
      default:
        return {
          success: false,
          error: `Unknown provider: ${provider}`,
        };
    }
  } catch (error) {
    console.error(
      `[Connectivity Fallback] Error initializing ${provider}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute fallback logic with retry and provider switching
 */
export async function executeFallbackLogic(
  primaryProvider: ConnectivityProvider,
  config: any,
  userConfig?: Partial<FallbackConfig>
): Promise<FallbackResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...userConfig };
  const sessionId = config.sessionId || "unknown";
  const eventId = config.eventId || "unknown";

  console.log(
    `[Connectivity Fallback] Starting fallback logic for session ${sessionId}`
  );
  console.log(`[Connectivity Fallback] Primary provider: ${primaryProvider}`);

  // Try primary provider with retries
  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    const delay = finalConfig.retryDelayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1);

    if (attempt > 1) {
      console.log(
        `[Connectivity Fallback] Retry attempt ${attempt}/${finalConfig.maxRetries} for ${primaryProvider} (delay: ${delay}ms)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const result = await attemptProviderInitialization(primaryProvider, config);

    if (result.success) {
      updateProviderStatus(primaryProvider, true);
      console.log(
        `[Connectivity Fallback] ${primaryProvider} initialized successfully on attempt ${attempt}`
      );
      return {
        success: true,
        provider: primaryProvider,
        attempt,
        totalAttempts: attempt,
        connectionId: result.connectionId,
      };
    }

    console.warn(
      `[Connectivity Fallback] ${primaryProvider} initialization failed on attempt ${attempt}: ${result.error}`
    );
    updateProviderStatus(primaryProvider, false);
  }

  // Primary provider failed all retries, try fallback providers
  console.warn(
    `[Connectivity Fallback] Primary provider ${primaryProvider} exhausted all retries. Attempting fallback providers.`
  );

  for (const fallbackProvider of finalConfig.fallbackProviders) {
    console.log(
      `[Connectivity Fallback] Attempting fallback provider: ${fallbackProvider}`
    );

    const result = await attemptProviderInitialization(fallbackProvider, config);

    if (result.success) {
      updateProviderStatus(fallbackProvider, true);

      // Notify operator of provider switch
      if (finalConfig.notifyOperator) {
        await notifyOperator({
          title: "Connectivity Provider Switched",
          content: `Session ${sessionId} (Event: ${eventId})\nPrimary provider ${primaryProvider} failed. Switched to ${fallbackProvider}.`,
        });
      }

      console.log(
        `[Connectivity Fallback] Fallback provider ${fallbackProvider} initialized successfully`
      );

      return {
        success: true,
        provider: fallbackProvider,
        attempt: finalConfig.maxRetries + 1,
        totalAttempts: finalConfig.maxRetries + 1,
        reason: `Fallback from ${primaryProvider}`,
        connectionId: result.connectionId,
      };
    }

    console.warn(
      `[Connectivity Fallback] Fallback provider ${fallbackProvider} failed: ${result.error}`
    );
    updateProviderStatus(fallbackProvider, false);
  }

  // All providers failed
  console.error(
    `[Connectivity Fallback] All providers failed for session ${sessionId}`
  );

  if (finalConfig.notifyOperator) {
    await notifyOperator({
      title: "Critical: All Connectivity Providers Failed",
      content: `Session ${sessionId} (Event: ${eventId})\nAll connectivity providers failed. Manual intervention required.`,
    });
  }

  return {
    success: false,
    provider: primaryProvider,
    attempt: finalConfig.maxRetries,
    totalAttempts: finalConfig.maxRetries,
    error: "All connectivity providers failed",
  };
}

/**
 * Provider-specific initialization functions
 * These are placeholder implementations - replace with actual provider APIs
 */

async function initializeWebPhoneProvider(config: any): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  // TODO: Implement actual WebPhone initialization via Telnyx
  try {
    // Simulate WebPhone initialization
    if (!config.sipUsername || !config.sipPassword) {
      return { success: false, error: "Missing SIP credentials" };
    }

    // In production, call Telnyx API here
    const connectionId = `webphone-${Date.now()}`;
    return { success: true, connectionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "WebPhone init failed",
    };
  }
}

async function initializeZoomProvider(config: any): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  // TODO: Implement actual Zoom initialization
  try {
    if (!config.zoomMeetingId) {
      return { success: false, error: "Missing Zoom meeting ID" };
    }

    const connectionId = `zoom-${config.zoomMeetingId}`;
    return { success: true, connectionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Zoom init failed",
    };
  }
}

async function initializeTeamsProvider(config: any): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  // TODO: Implement actual Teams initialization
  try {
    if (!config.teamsMeetingLink) {
      return { success: false, error: "Missing Teams meeting link" };
    }

    const connectionId = `teams-${Date.now()}`;
    return { success: true, connectionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Teams init failed",
    };
  }
}

async function initializeWebexProvider(config: any): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  // TODO: Implement actual Webex initialization
  try {
    if (!config.webexMeetingId) {
      return { success: false, error: "Missing Webex meeting ID" };
    }

    const connectionId = `webex-${config.webexMeetingId}`;
    return { success: true, connectionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Webex init failed",
    };
  }
}

async function initializeRtmpProvider(config: any): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  // TODO: Implement actual RTMP initialization
  try {
    if (!config.rtmpUrl) {
      return { success: false, error: "Missing RTMP URL" };
    }

    const connectionId = `rtmp-${Date.now()}`;
    return { success: true, connectionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "RTMP init failed",
    };
  }
}

async function initializePstnProvider(config: any): Promise<{
  success: boolean;
  connectionId?: string;
  error?: string;
}> {
  // TODO: Implement actual PSTN initialization via Twilio
  try {
    if (!config.phoneNumber) {
      return { success: false, error: "Missing phone number" };
    }

    const connectionId = `pstn-${config.phoneNumber}`;
    return { success: true, connectionId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "PSTN init failed",
    };
  }
}

/**
 * Get all provider statuses
 */
export function getAllProviderStatuses(): ProviderStatus[] {
  return Array.from(providerStatusMap.values());
}

/**
 * Reset provider status (for testing)
 */
export function resetProviderStatus(provider: ConnectivityProvider): void {
  providerStatusMap.set(provider, {
    provider,
    status: "available",
    lastChecked: new Date(),
    errorCount: 0,
    successCount: 0,
  });
}

/**
 * Reset all provider statuses (for testing)
 */
export function resetAllProviderStatuses(): void {
  initializeProviderStatus();
}
