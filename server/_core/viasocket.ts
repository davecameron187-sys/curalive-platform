/**
 * Viasocket Integration Helper — Action Sync Service
 * 
 * Task 1.6: Implement action sync to Viasocket platform
 * - Publish operator actions to Viasocket for external system integration
 * - Implement retry logic with exponential backoff
 * - Track sync status and handle failures gracefully
 */

import { getDb } from "../db";
import { operatorActions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface ViasocketAction {
  actionId: string;
  sessionId: string;
  operatorId: number;
  actionType: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface ViasocketSyncResult {
  success: boolean;
  actionId: string;
  viasocketId?: string;
  error?: string;
  retryCount: number;
  nextRetryAt?: Date;
}

/**
 * Get Viasocket API configuration from environment
 */
function getViasocketConfig() {
  const apiKey = process.env.VIASOCKET_API_KEY;
  const baseUrl = process.env.VIASOCKET_BASE_URL || "https://api.viasocket.com";
  
  if (!apiKey) {
    console.warn("[Viasocket] VIASOCKET_API_KEY not set — action sync disabled");
    return null;
  }

  return { apiKey, baseUrl };
}

/**
 * Publish action to Viasocket with retry logic
 */
export async function publishActionToViasocket(
  action: ViasocketAction,
  retryCount: number = 0
): Promise<ViasocketSyncResult> {
  const config = getViasocketConfig();
  
  if (!config) {
    return {
      success: false,
      actionId: action.actionId,
      error: "Viasocket not configured",
      retryCount,
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/v1/actions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        externalId: action.actionId,
        sessionId: action.sessionId,
        operatorId: action.operatorId,
        type: action.actionType,
        targetId: action.targetId,
        targetType: action.targetType,
        metadata: action.metadata,
        timestamp: action.timestamp,
      }),
    });

    if (!response.ok) {
      throw new Error(`Viasocket API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[Viasocket] Action synced successfully: ${action.actionId}`);

    return {
      success: true,
      actionId: action.actionId,
      viasocketId: data.id,
      retryCount,
    };
  } catch (error) {
    console.error(`[Viasocket] Sync error (attempt ${retryCount + 1}):`, error);

    // Calculate exponential backoff: 1min → 5min → 25min → 2hr
    const backoffSeconds = [60, 300, 1500, 7200];
    const nextRetrySeconds = backoffSeconds[Math.min(retryCount, backoffSeconds.length - 1)];
    const nextRetryAt = new Date(Date.now() + nextRetrySeconds * 1000);

    // Don't retry beyond 4 attempts (2 hours total)
    if (retryCount >= 3) {
      return {
        success: false,
        actionId: action.actionId,
        error: `Failed after ${retryCount + 1} attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
        retryCount,
      };
    }

    return {
      success: false,
      actionId: action.actionId,
      error: error instanceof Error ? error.message : "Unknown error",
      retryCount: retryCount + 1,
      nextRetryAt,
    };
  }
}

/**
 * Sync operator action to Viasocket (tRPC-callable)
 */
export async function syncOperatorActionToViasocket(
  actionId: number,
  sessionId: string
): Promise<ViasocketSyncResult> {
  const database = await getDb();
  if (!database) {
    return {
      success: false,
      actionId: `action_${actionId}`,
      error: "Database connection unavailable",
      retryCount: 0,
    };
  }

  try {
    // Get action from database
    const actions = await database
      .select()
      .from(operatorActions)
      .where(eq(operatorActions.id, actionId))
      .limit(1);

    if (!actions.length) {
      return {
        success: false,
        actionId: `action_${actionId}`,
        error: "Action not found",
        retryCount: 0,
      };
    }

    const action = actions[0];

    // Prepare Viasocket action payload
    const viasocketAction: ViasocketAction = {
      actionId: `action_${action.id}`,
      sessionId: action.sessionId,
      operatorId: action.operatorId,
      actionType: action.actionType,
      targetId: action.targetId || undefined,
      targetType: action.targetType || undefined,
      metadata: action.metadata as Record<string, any> | undefined,
      timestamp: action.createdAt.toISOString(),
    };

    // Publish to Viasocket
    const result = await publishActionToViasocket(viasocketAction);

    // Update sync status in database
    if (result.success) {
      await database
        .update(operatorActions)
        .set({
          syncedToViasocket: true,
          syncedAt: new Date(),
        })
        .where(eq(operatorActions.id, actionId));

      console.log(`[Viasocket] Action ${actionId} marked as synced`);
    } else if (result.nextRetryAt) {
      // Schedule retry by updating metadata
      const currentMetadata = action.metadata as Record<string, any> || {};
      await database
        .update(operatorActions)
        .set({
          metadata: {
            ...currentMetadata,
            viasocketSyncRetry: {
              nextRetryAt: result.nextRetryAt.toISOString(),
              retryCount: result.retryCount,
              lastError: result.error,
            },
          },
        })
        .where(eq(operatorActions.id, actionId));
    }

    return result;
  } catch (error) {
    console.error(`[Viasocket] Sync error for action ${actionId}:`, error);
    return {
      success: false,
      actionId: `action_${actionId}`,
      error: error instanceof Error ? error.message : "Unknown error",
      retryCount: 0,
    };
  }
}

/**
 * Retry failed action syncs (call periodically)
 */
export async function retryFailedActionSyncs(): Promise<{ retried: number; succeeded: number }> {
  const database = await getDb();
  if (!database) {
    console.warn("[Viasocket] Database connection unavailable for retry");
    return { retried: 0, succeeded: 0 };
  }

  try {
    // Find actions that need retry
    const failedActions = await database
      .select()
      .from(operatorActions)
      .where(eq(operatorActions.syncedToViasocket, false));

    let retried = 0;
    let succeeded = 0;

    for (const action of failedActions) {
      const metadata = action.metadata as Record<string, any> || {};
      const syncRetry = metadata.viasocketSyncRetry;

      // Check if it's time to retry
      if (syncRetry?.nextRetryAt) {
        const nextRetryTime = new Date(syncRetry.nextRetryAt);
        if (nextRetryTime > new Date()) {
          continue; // Not time to retry yet
        }
      }

      // Attempt sync
      const result = await syncOperatorActionToViasocket(action.id, action.sessionId);
      retried++;

      if (result.success) {
        succeeded++;
      }
    }

    console.log(`[Viasocket] Retry cycle: ${retried} retried, ${succeeded} succeeded`);
    return { retried, succeeded };
  } catch (error) {
    console.error("[Viasocket] Retry cycle error:", error);
    return { retried: 0, succeeded: 0 };
  }
}

/**
 * Webhook endpoint handler for Viasocket callbacks
 */
export async function handleViasocketWebhook(
  payload: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  try {
    const { externalId, status, viasocketId, error } = payload;

    if (!externalId) {
      return { success: false, message: "Missing externalId in webhook payload" };
    }

    console.log(`[Viasocket] Webhook received for action ${externalId}: ${status}`);

    // Parse action ID from externalId (format: action_${id})
    const actionIdMatch = externalId.match(/action_(\d+)/);
    if (!actionIdMatch) {
      return { success: false, message: "Invalid externalId format" };
    }

    const actionId = parseInt(actionIdMatch[1], 10);
    const database = await getDb();

    if (!database) {
      return { success: false, message: "Database connection unavailable" };
    }

    // Update action sync status based on webhook status
    if (status === "success") {
      await database
        .update(operatorActions)
        .set({
          syncedToViasocket: true,
          syncedAt: new Date(),
          metadata: {
            viasocketId,
            viasocketStatus: "synced",
          },
        })
        .where(eq(operatorActions.id, actionId));

      console.log(`[Viasocket] Action ${actionId} confirmed synced`);
    } else if (status === "failed") {
      const action = await database
        .select()
        .from(operatorActions)
        .where(eq(operatorActions.id, actionId))
        .limit(1);

      if (action.length) {
        const metadata = action[0].metadata as Record<string, any> || {};
        await database
          .update(operatorActions)
          .set({
            metadata: {
              ...metadata,
              viasocketStatus: "failed",
              viasocketError: error,
              failedAt: new Date().toISOString(),
            },
          })
          .where(eq(operatorActions.id, actionId));

        console.log(`[Viasocket] Action ${actionId} failed: ${error}`);
      }
    }

    return { success: true, message: `Webhook processed for action ${externalId}` };
  } catch (err) {
    console.error("[Viasocket] Webhook processing error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Get sync status for an action
 */
export async function getActionSyncStatus(actionId: number): Promise<{
  synced: boolean;
  syncedAt?: Date;
  status?: string;
  error?: string;
  nextRetryAt?: Date;
}> {
  const database = await getDb();
  if (!database) {
    return { synced: false, error: "Database connection unavailable" };
  }

  try {
    const actions = await database
      .select()
      .from(operatorActions)
      .where(eq(operatorActions.id, actionId))
      .limit(1);

    if (!actions.length) {
      return { synced: false, error: "Action not found" };
    }

    const action = actions[0];
    const metadata = action.metadata as Record<string, any> || {};
    const syncRetry = metadata.viasocketSyncRetry;

    return {
      synced: action.syncedToViasocket,
      syncedAt: action.syncedAt || undefined,
      status: metadata.viasocketStatus || (action.syncedToViasocket ? "synced" : "pending"),
      error: metadata.viasocketError || syncRetry?.lastError,
      nextRetryAt: syncRetry?.nextRetryAt ? new Date(syncRetry.nextRetryAt) : undefined,
    };
  } catch (error) {
    console.error(`[Viasocket] Error getting sync status for action ${actionId}:`, error);
    return { synced: false, error: "Failed to get sync status" };
  }
}
