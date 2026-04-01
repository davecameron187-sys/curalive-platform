import twilio from "twilio";
import { and, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../db";
import { occParticipants } from "../../drizzle/schema";

type NullableNumber = number | null;

type QualityMetrics = {
  avgJitterMs: NullableNumber;
  packetLossPct: NullableNumber;
  mosScore: NullableNumber;
};

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function readNested(obj: unknown, path: string[]): number | null {
  let current: unknown = obj;
  for (const segment of path) {
    if (!current || typeof current !== "object" || !(segment in (current as Record<string, unknown>))) {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return asFiniteNumber(current);
}

function extractEdgeMetric(summary: any, metricPath: string[]): number | null {
  const edgeCandidates = [summary?.carrierEdge, summary?.clientEdge, summary?.sdkEdge, summary?.sipEdge];
  const values = edgeCandidates
    .map((edge) => readNested(edge, metricPath))
    .filter((v): v is number => v !== null);

  if (values.length === 0) return null;
  const total = values.reduce((sum, v) => sum + v, 0);
  return Number((total / values.length).toFixed(3));
}

export function extractQualityMetrics(summary: any): QualityMetrics {
  const avgJitterMs =
    extractEdgeMetric(summary, ["metrics", "inbound", "jitter", "avg"]) ??
    extractEdgeMetric(summary, ["metrics", "outbound", "jitter", "avg"]);
  const packetLossPct =
    extractEdgeMetric(summary, ["metrics", "inbound", "packet_loss", "avg"]) ??
    extractEdgeMetric(summary, ["metrics", "outbound", "packet_loss", "avg"]);
  const mosScore =
    extractEdgeMetric(summary, ["metrics", "inbound", "mos", "avg"]) ??
    extractEdgeMetric(summary, ["metrics", "outbound", "mos", "avg"]) ??
    asFiniteNumber(summary?.properties?.mos);

  return { avgJitterMs, packetLossPct, mosScore };
}

export function maskPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return "—";
  const trimmed = phoneNumber.trim();
  if (trimmed.length < 7) return trimmed;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return trimmed;

  const visiblePrefix = trimmed.startsWith("+") ? `+${digits.slice(0, 2)}` : digits.slice(0, 2);
  const visibleSuffix = digits.slice(-3);
  return `${visiblePrefix} XXXX XXXX ${visibleSuffix}`;
}

export async function buildAttendanceReport(conferenceId: number) {
  const db = await getDb();
  if (!db) return [];

  const participants = await db
    .select()
    .from(occParticipants)
    .where(eq(occParticipants.conferenceId, conferenceId));

  return participants.map((p) => {
    const joinedAt = p.connectedAt ? new Date(p.connectedAt) : null;
    const leftAt = p.disconnectedAt ? new Date(p.disconnectedAt) : null;
    const durationSeconds = joinedAt
      ? Math.max(0, Math.floor(((leftAt?.getTime() ?? Date.now()) - joinedAt.getTime()) / 1000))
      : 0;

    return {
      id: p.id,
      name: p.name ?? "Unknown",
      organisation: p.company ?? null,
      role: p.role,
      phone_number: maskPhoneNumber(p.phoneNumber),
      join_method: p.isWebParticipant ? "web" : "dial_in",
      diamond_pass: !!p.isDiamondPass,
      status: p.state,
      join_time: joinedAt?.toISOString() ?? null,
      leave_time: leftAt?.toISOString() ?? null,
      duration_sec: durationSeconds,
      hand_raised: !!p.requestToSpeak,
      connection_quality: {
        avg_jitter_ms: p.avgJitterMs ?? null,
        packet_loss_pct: p.packetLossPct ?? null,
        mos_score: p.mosScore ?? null,
      },
    };
  });
}

export async function syncConferenceQuality(conferenceId: number): Promise<{ updated: number; skipped: number }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN ?? "";

  if (!accountSid || !authToken) {
    return { updated: 0, skipped: 0 };
  }

  const db = await getDb();
  if (!db) {
    return { updated: 0, skipped: 0 };
  }

  const candidates = await db
    .select()
    .from(occParticipants)
    .where(and(eq(occParticipants.conferenceId, conferenceId), isNotNull(occParticipants.twilioCallSid)));

  const client = twilio(accountSid, authToken);
  let updated = 0;
  let skipped = 0;

  for (const participant of candidates) {
    if (!participant.twilioCallSid) {
      skipped += 1;
      continue;
    }
    try {
      const summary = await client.insights.v1.calls(participant.twilioCallSid).summary().fetch({ processingState: "partial" } as any);
      const metrics = extractQualityMetrics(summary);
      await db
        .update(occParticipants)
        .set({
          avgJitterMs: metrics.avgJitterMs,
          packetLossPct: metrics.packetLossPct,
          mosScore: metrics.mosScore,
        })
        .where(eq(occParticipants.id, participant.id));
      updated += 1;
    } catch (error) {
      skipped += 1;
      console.warn(`[QualitySync] Failed for participant ${participant.id}:`, (error as Error).message);
    }
  }

  return { updated, skipped };
}
