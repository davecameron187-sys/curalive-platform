import {getDb, rawSql } from "../db";

type SourceType = "live_session" | "archive_upload";

function engagementLevel(segments: number): "low" | "medium" | "high" {
  if (segments < 10) return "low";
  if (segments <= 50) return "medium";
  return "high";
}

function complianceRisk(flags: number): "low" | "medium" | "high" | "critical" {
  if (flags <= 1) return "low";
  if (flags <= 3) return "medium";
  if (flags <= 6) return "high";
  return "critical";
}

function wordCountRange(words: number): string {
  if (words < 500)   return "< 500";
  if (words < 2000)  return "500–2,000";
  if (words < 5000)  return "2,000–5,000";
  if (words < 15000) return "5,000–15,000";
  return "> 15,000";
}

function deriveQuarter(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const q = Math.ceil((d.getMonth() + 1) / 3);
  return `Q${q} ${d.getFullYear()}`;
}

export async function writeAnonymizedRecord(opts: {
  eventType: string;
  sentimentScore: number | null;
  segmentCount: number;
  complianceFlags: number;
  wordCount: number;
  eventDate?: string | null;
  sourceType: SourceType;
}) {
  try {
    const db = await getDb();
    await rawSql(
      `INSERT INTO aggregate_intelligence
        (event_type, sentiment_score, engagement_level, compliance_risk,
         word_count_range, event_quarter, source_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        opts.eventType,
        opts.sentimentScore,
        engagementLevel(opts.segmentCount),
        complianceRisk(opts.complianceFlags),
        wordCountRange(opts.wordCount),
        deriveQuarter(opts.eventDate),
        opts.sourceType,
      ]
    );
  } catch (err) {
    console.error("[AggregateIntelligence] Failed to write anonymized record:", err);
  }
}
