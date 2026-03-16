/**
 * Database helpers for network analytics
 * Round 61 Features
 */
import { db } from "./db";
import {
  kioskNetworkMetrics,
  failoverEvents,
  connectionStabilityMetrics,
  networkAnomalies,
  InsertKioskNetworkMetrics,
  InsertFailoverEvent,
  InsertConnectionStabilityMetrics,
  InsertNetworkAnomaly,
} from "@/drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

/**
 * Store kiosk network metrics
 */
export async function storeNetworkMetrics(
  data: InsertKioskNetworkMetrics
): Promise<void> {
  await db.insert(kioskNetworkMetrics).values(data);
}

/**
 * Get network metrics for a kiosk within a time range
 */
export async function getKioskMetrics(
  kioskId: string,
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .select()
    .from(kioskNetworkMetrics)
    .where(
      and(
        eq(kioskNetworkMetrics.kioskId, kioskId),
        eq(kioskNetworkMetrics.eventId, eventId),
        gte(kioskNetworkMetrics.timestamp, startTime),
        lte(kioskNetworkMetrics.timestamp, endTime)
      )
    )
    .orderBy(desc(kioskNetworkMetrics.timestamp));
}

/**
 * Get average metrics for a kiosk
 */
export async function getAverageMetrics(
  kioskId: string,
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  const result = await db
    .select({
      avgLatency: sql`AVG(${kioskNetworkMetrics.latency})`,
      minLatency: sql`MIN(${kioskNetworkMetrics.latency})`,
      maxLatency: sql`MAX(${kioskNetworkMetrics.latency})`,
      avgBandwidth: sql`AVG(${kioskNetworkMetrics.bandwidth})`,
      avgSignalStrength: sql`AVG(${kioskNetworkMetrics.signalStrength})`,
      onlineCount: sql`SUM(CASE WHEN ${kioskNetworkMetrics.isOnline} THEN 1 ELSE 0 END)`,
      totalCount: sql`COUNT(*)`,
    })
    .from(kioskNetworkMetrics)
    .where(
      and(
        eq(kioskNetworkMetrics.kioskId, kioskId),
        eq(kioskNetworkMetrics.eventId, eventId),
        gte(kioskNetworkMetrics.timestamp, startTime),
        lte(kioskNetworkMetrics.timestamp, endTime)
      )
    );

  return result[0] || null;
}

/**
 * Store failover event
 */
export async function storeFailoverEvent(
  data: InsertFailoverEvent
): Promise<void> {
  await db.insert(failoverEvents).values(data);
}

/**
 * Get failover events for a kiosk
 */
export async function getFailoverEvents(
  kioskId: string,
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .select()
    .from(failoverEvents)
    .where(
      and(
        eq(failoverEvents.kioskId, kioskId),
        eq(failoverEvents.eventId, eventId),
        gte(failoverEvents.timestamp, startTime),
        lte(failoverEvents.timestamp, endTime)
      )
    )
    .orderBy(desc(failoverEvents.timestamp));
}

/**
 * Get failover statistics
 */
export async function getFailoverStats(
  kioskId: string,
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  const result = await db
    .select({
      totalFailovers: sql`COUNT(*)`,
      avgLatencyImprovement: sql`AVG(${failoverEvents.latencyImprovement})`,
      wifiToCellular: sql`SUM(CASE WHEN ${failoverEvents.fromNetwork} = 'wifi' AND ${failoverEvents.toNetwork} = 'cellular' THEN 1 ELSE 0 END)`,
      cellularToWifi: sql`SUM(CASE WHEN ${failoverEvents.fromNetwork} = 'cellular' AND ${failoverEvents.toNetwork} = 'wifi' THEN 1 ELSE 0 END)`,
    })
    .from(failoverEvents)
    .where(
      and(
        eq(failoverEvents.kioskId, kioskId),
        eq(failoverEvents.eventId, eventId),
        gte(failoverEvents.timestamp, startTime),
        lte(failoverEvents.timestamp, endTime)
      )
    );

  return result[0] || null;
}

/**
 * Store connection stability metrics
 */
export async function storeStabilityMetrics(
  data: InsertConnectionStabilityMetrics
): Promise<void> {
  await db.insert(connectionStabilityMetrics).values(data);
}

/**
 * Get stability metrics for a kiosk
 */
export async function getStabilityMetrics(
  kioskId: string,
  eventId: string,
  period: "hourly" | "daily" | "weekly",
  startTime: Date,
  endTime: Date
) {
  return await db
    .select()
    .from(connectionStabilityMetrics)
    .where(
      and(
        eq(connectionStabilityMetrics.kioskId, kioskId),
        eq(connectionStabilityMetrics.eventId, eventId),
        eq(connectionStabilityMetrics.period, period),
        gte(connectionStabilityMetrics.periodStart, startTime),
        lte(connectionStabilityMetrics.periodEnd, endTime)
      )
    )
    .orderBy(desc(connectionStabilityMetrics.periodStart));
}

/**
 * Store network anomaly
 */
export async function storeNetworkAnomaly(
  data: InsertNetworkAnomaly
): Promise<void> {
  await db.insert(networkAnomalies).values(data);
}

/**
 * Get active anomalies for a kiosk
 */
export async function getActiveAnomalies(kioskId: string, eventId: string) {
  return await db
    .select()
    .from(networkAnomalies)
    .where(
      and(
        eq(networkAnomalies.kioskId, kioskId),
        eq(networkAnomalies.eventId, eventId),
        eq(networkAnomalies.isResolved, false)
      )
    )
    .orderBy(desc(networkAnomalies.detectedAt));
}

/**
 * Get all anomalies for a kiosk within time range
 */
export async function getAnomalies(
  kioskId: string,
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .select()
    .from(networkAnomalies)
    .where(
      and(
        eq(networkAnomalies.kioskId, kioskId),
        eq(networkAnomalies.eventId, eventId),
        gte(networkAnomalies.detectedAt, startTime),
        lte(networkAnomalies.detectedAt, endTime)
      )
    )
    .orderBy(desc(networkAnomalies.detectedAt));
}

/**
 * Resolve anomaly
 */
export async function resolveAnomaly(anomalyId: number): Promise<void> {
  await db
    .update(networkAnomalies)
    .set({ isResolved: true, resolvedAt: new Date() })
    .where(eq(networkAnomalies.id, anomalyId));
}

/**
 * Get metrics for all kiosks in an event
 */
export async function getEventMetrics(
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .select({
      kioskId: kioskNetworkMetrics.kioskId,
      avgLatency: sql`AVG(${kioskNetworkMetrics.latency})`,
      avgBandwidth: sql`AVG(${kioskNetworkMetrics.bandwidth})`,
      avgSignalStrength: sql`AVG(${kioskNetworkMetrics.signalStrength})`,
      onlinePercentage: sql`(SUM(CASE WHEN ${kioskNetworkMetrics.isOnline} THEN 1 ELSE 0 END) / COUNT(*)) * 100`,
    })
    .from(kioskNetworkMetrics)
    .where(
      and(
        eq(kioskNetworkMetrics.eventId, eventId),
        gte(kioskNetworkMetrics.timestamp, startTime),
        lte(kioskNetworkMetrics.timestamp, endTime)
      )
    )
    .groupBy(kioskNetworkMetrics.kioskId);
}

/**
 * Get network type distribution for a kiosk
 */
export async function getNetworkTypeDistribution(
  kioskId: string,
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .select({
      networkType: kioskNetworkMetrics.networkType,
      count: sql`COUNT(*)`,
      avgLatency: sql`AVG(${kioskNetworkMetrics.latency})`,
      avgBandwidth: sql`AVG(${kioskNetworkMetrics.bandwidth})`,
    })
    .from(kioskNetworkMetrics)
    .where(
      and(
        eq(kioskNetworkMetrics.kioskId, kioskId),
        eq(kioskNetworkMetrics.eventId, eventId),
        gte(kioskNetworkMetrics.timestamp, startTime),
        lte(kioskNetworkMetrics.timestamp, endTime)
      )
    )
    .groupBy(kioskNetworkMetrics.networkType);
}

/**
 * Get connection quality distribution
 */
export async function getConnectionQualityDistribution(
  kioskId: string,
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  return await db
    .select({
      quality: kioskNetworkMetrics.connectionQuality,
      count: sql`COUNT(*)`,
      percentage: sql`(COUNT(*) / (SELECT COUNT(*) FROM ${kioskNetworkMetrics} WHERE ${and(
        eq(kioskNetworkMetrics.kioskId, kioskId),
        eq(kioskNetworkMetrics.eventId, eventId),
        gte(kioskNetworkMetrics.timestamp, startTime),
        lte(kioskNetworkMetrics.timestamp, endTime)
      )})) * 100`,
    })
    .from(kioskNetworkMetrics)
    .where(
      and(
        eq(kioskNetworkMetrics.kioskId, kioskId),
        eq(kioskNetworkMetrics.eventId, eventId),
        gte(kioskNetworkMetrics.timestamp, startTime),
        lte(kioskNetworkMetrics.timestamp, endTime)
      )
    )
    .groupBy(kioskNetworkMetrics.connectionQuality);
}

/**
 * Cleanup old metrics (data retention policy)
 */
export async function cleanupOldMetrics(daysToKeep: number = 90): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  await db
    .delete(kioskNetworkMetrics)
    .where(lte(kioskNetworkMetrics.createdAt, cutoffDate));

  await db
    .delete(failoverEvents)
    .where(lte(failoverEvents.createdAt, cutoffDate));

  await db
    .delete(connectionStabilityMetrics)
    .where(lte(connectionStabilityMetrics.createdAt, cutoffDate));

  await db
    .delete(networkAnomalies)
    .where(lte(networkAnomalies.createdAt, cutoffDate));
}
