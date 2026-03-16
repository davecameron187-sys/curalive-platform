/**
 * SMS Retry Service
 * Handles SMS retry queue with exponential backoff
 */
import { getDb } from "../db";
import { smsRetryQueue } from "../../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import { sendSMS } from "../_core/twilio";
import { notifyOwner } from "../_core/notification";

interface RetryAttempt {
  id: number;
  phoneNumber: string;
  message: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryTime: Date;
  status: "pending" | "sent" | "failed" | "exhausted";
  errorMessage?: string;
}

/**
 * Calculate exponential backoff delay in milliseconds
 * Attempt 1: 1 minute
 * Attempt 2: 5 minutes
 * Attempt 3: 25 minutes
 */
function getBackoffDelay(attemptCount: number): number {
  const delays = [
    1 * 60 * 1000, // 1 minute
    5 * 60 * 1000, // 5 minutes
    25 * 60 * 1000, // 25 minutes
  ];

  return delays[Math.min(attemptCount, delays.length - 1)];
}

/**
 * Add SMS to retry queue
 */
export async function addToRetryQueue(
  phoneNumber: string,
  message: string,
  eventId: string,
  maxAttempts: number = 3
): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db.insert(smsRetryQueue).values({
      eventId,
      phoneNumber,
      message,
      attemptCount: 0,
      maxAttempts,
      nextRetryTime: new Date(),
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return result.insertId || null;
  } catch (error) {
    console.error("Failed to add SMS to retry queue:", error);
    return null;
  }
}

/**
 * Get pending SMS retries
 */
export async function getPendingRetries(): Promise<RetryAttempt[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const now = new Date();
    const retries = await db
      .select()
      .from(smsRetryQueue)
      .where(
        and(
          eq(smsRetryQueue.status, "pending"),
          lt(smsRetryQueue.nextRetryTime, now)
        )
      );

    return retries as RetryAttempt[];
  } catch (error) {
    console.error("Failed to get pending retries:", error);
    return [];
  }
}

/**
 * Process a single SMS retry
 */
export async function processSMSRetry(retryId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Get retry record
    const retries = await db.select().from(smsRetryQueue).where(eq(smsRetryQueue.id, retryId));

    if (retries.length === 0) {
      console.error(`Retry record ${retryId} not found`);
      return false;
    }

    const retry = retries[0];

    // Check if max attempts exceeded
    if (retry.attemptCount >= retry.maxAttempts) {
      await db
        .update(smsRetryQueue)
        .set({
          status: "exhausted",
          updatedAt: new Date(),
        })
        .where(eq(smsRetryQueue.id, retryId));

      await notifyOwner({
        title: "SMS Delivery Exhausted",
        content: `SMS to ${retry.phoneNumber} failed after ${retry.maxAttempts} attempts`,
      });

      return false;
    }

    // Attempt to send SMS
    try {
      await sendSMS({
        to: retry.phoneNumber,
        body: retry.message,
      });

      // Mark as sent
      await db
        .update(smsRetryQueue)
        .set({
          status: "sent",
          updatedAt: new Date(),
        })
        .where(eq(smsRetryQueue.id, retryId));

      console.log(`SMS sent successfully to ${retry.phoneNumber}`);
      return true;
    } catch (sendError) {
      // Increment attempt count and schedule next retry
      const nextAttemptCount = retry.attemptCount + 1;
      const backoffDelay = getBackoffDelay(nextAttemptCount);
      const nextRetryTime = new Date(Date.now() + backoffDelay);

      await db
        .update(smsRetryQueue)
        .set({
          attemptCount: nextAttemptCount,
          nextRetryTime,
          status: nextAttemptCount >= retry.maxAttempts ? "exhausted" : "pending",
          errorMessage: sendError instanceof Error ? sendError.message : String(sendError),
          updatedAt: new Date(),
        })
        .where(eq(smsRetryQueue.id, retryId));

      console.log(
        `SMS retry scheduled for ${retry.phoneNumber} at ${nextRetryTime.toISOString()}`
      );

      if (nextAttemptCount >= retry.maxAttempts) {
        await notifyOwner({
          title: "SMS Delivery Failed",
          content: `SMS to ${retry.phoneNumber} failed after ${nextAttemptCount} attempts`,
        });
      }

      return false;
    }
  } catch (error) {
    console.error(`Failed to process SMS retry ${retryId}:`, error);
    return false;
  }
}

/**
 * Process all pending SMS retries
 */
export async function processAllPendingRetries(): Promise<number> {
  try {
    const pendingRetries = await getPendingRetries();

    if (pendingRetries.length === 0) {
      return 0;
    }

    console.log(`Processing ${pendingRetries.length} pending SMS retries`);

    let successCount = 0;
    for (const retry of pendingRetries) {
      const success = await processSMSRetry(retry.id);
      if (success) {
        successCount++;
      }
    }

    console.log(`Processed ${pendingRetries.length} retries, ${successCount} succeeded`);
    return successCount;
  } catch (error) {
    console.error("Failed to process pending retries:", error);
    return 0;
  }
}

/**
 * Get retry queue statistics
 */
export async function getRetryQueueStats(): Promise<{
  pending: number;
  sent: number;
  failed: number;
  exhausted: number;
  total: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { pending: 0, sent: 0, failed: 0, exhausted: 0, total: 0 };
    }

    const allRetries = await db.select().from(smsRetryQueue);

    const stats = {
      pending: allRetries.filter((r) => r.status === "pending").length,
      sent: allRetries.filter((r) => r.status === "sent").length,
      failed: allRetries.filter((r) => r.status === "failed").length,
      exhausted: allRetries.filter((r) => r.status === "exhausted").length,
      total: allRetries.length,
    };

    return stats;
  } catch (error) {
    console.error("Failed to get retry queue stats:", error);
    return { pending: 0, sent: 0, failed: 0, exhausted: 0, total: 0 };
  }
}

/**
 * Clear old retry records (older than 30 days)
 */
export async function clearOldRetries(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db
      .delete(smsRetryQueue)
      .where(lt(smsRetryQueue.createdAt, thirtyDaysAgo));

    return result.rowsAffected || 0;
  } catch (error) {
    console.error("Failed to clear old retries:", error);
    return 0;
  }
}

/**
 * Manual retry trigger
 */
export async function manualRetryTrigger(retryId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    // Reset retry to pending state
    await db
      .update(smsRetryQueue)
      .set({
        status: "pending",
        nextRetryTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(smsRetryQueue.id, retryId));

    // Process immediately
    return await processSMSRetry(retryId);
  } catch (error) {
    console.error(`Failed to manually retry SMS ${retryId}:`, error);
    return false;
  }
}
