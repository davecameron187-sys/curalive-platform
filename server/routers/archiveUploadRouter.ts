import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { taggedMetrics } from "../../drizzle/schema";
import { invokeLLM } from "../_core/llm";
import { desc, sql } from "drizzle-orm";

const COMPLIANCE_KEYWORDS = [
  "forward-looking", "guidance", "forecast", "predict", "expect",
  "material", "non-public", "insider", "merger", "acquisition",
];

async function scoreSentimentFromText(text: string): Promise<number> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a financial sentiment analyst. Score investor sentiment from 0 to 100 where 0 is very negative, 50 is neutral, and 100 is very positive. Respond with a single integer only.",
        },
        {
          role: "user",
          content: `Score the investor sentiment in this transcript excerpt (0-100):\n\n${text.slice(0, 3000)}`,
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content as string | undefined;
    const score = parseInt(content?.trim() ?? "50", 10);
    return isNaN(score) ? 50 : Math.max(0, Math.min(100, score));
  } catch {
    return 50;
  }
}

async function generateMetricsFromArchive(
  archiveId: number,
  clientName: string,
  eventName: string,
  eventType: string,
  segments: string[],
  sentimentAvg: number,
  complianceFlags: number
) {
  const db = await getDb();

  const eventId = `archive-${archiveId}`;
  const eventTitle = `${clientName} — ${eventName}`;
  const bundle =
    eventType === "earnings_call" || eventType === "capital_markets_day"
      ? "Investor Relations"
      : eventType === "agm" || eventType === "board_meeting"
      ? "Compliance & Risk"
      : "Webcasting";

  const metricsToInsert = [];

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "sentiment" as const,
    metricValue: sentimentAvg,
    label:
      sentimentAvg >= 70
        ? "Positive Sentiment Session"
        : sentimentAvg >= 50
        ? "Neutral Sentiment Session"
        : "Low Sentiment Session",
    detail: `AI-scored sentiment from archived transcript: ${segments.length} segments analysed.`,
    bundle,
    severity:
      sentimentAvg >= 70
        ? ("positive" as const)
        : sentimentAvg >= 50
        ? ("neutral" as const)
        : ("negative" as const),
    source: "archive-upload",
  });

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "engagement" as const,
    metricValue: segments.length,
    label: `${segments.length} Archive Segments Processed`,
    detail: `${segments.length} transcript segments extracted and analysed from uploaded archive. Historical intelligence added to database.`,
    bundle,
    severity:
      segments.length > 20
        ? ("positive" as const)
        : segments.length > 5
        ? ("neutral" as const)
        : ("negative" as const),
    source: "archive-upload",
  });

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "compliance" as const,
    metricValue: parseFloat(
      (complianceFlags / COMPLIANCE_KEYWORDS.length).toFixed(2)
    ),
    label:
      complianceFlags > 2
        ? "Compliance Flags Detected"
        : "Low Compliance Risk",
    detail: `Automated scan found ${complianceFlags} compliance keyword(s) across archived transcript. Keywords: ${COMPLIANCE_KEYWORDS.join(", ")}.`,
    bundle,
    severity:
      complianceFlags > 3
        ? ("critical" as const)
        : complianceFlags > 1
        ? ("negative" as const)
        : ("positive" as const),
    source: "archive-upload",
  });

  metricsToInsert.push({
    eventId,
    eventTitle,
    tagType: "intervention" as const,
    metricValue: 0,
    label: "Archive Upload Processed",
    detail: `Historical event intelligence successfully added. ${metricsToInsert.length + 1} tagged records created from archive data.`,
    bundle,
    severity: "positive" as const,
    source: "archive-upload",
  });

  await db.insert(taggedMetrics).values(metricsToInsert);
  return { eventId, eventTitle, metricsCount: metricsToInsert.length };
}

export const archiveUploadRouter = router({

  processTranscript: publicProcedure
    .input(
      z.object({
        clientName: z.string().min(1).max(255),
        eventName: z.string().min(1).max(255),
        eventType: z.enum([
          "earnings_call", "agm", "capital_markets_day",
          "ceo_town_hall", "board_meeting", "webcast", "other",
        ]),
        eventDate: z.string().optional(),
        platform: z.string().optional(),
        transcriptText: z.string().min(10).max(500000),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();

      const rawSegments = input.transcriptText
        .split(/\n{2,}|\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 10);

      const wordCount = input.transcriptText
        .split(/\s+/)
        .filter(Boolean).length;

      const complianceFlags = COMPLIANCE_KEYWORDS.filter((k) =>
        input.transcriptText.toLowerCase().includes(k)
      ).length;

      const sentimentAvg = await scoreSentimentFromText(input.transcriptText);

      const conn = (db as any).session?.client ?? (db as any).$client;
      const [result] = await conn.execute(
        `INSERT INTO archive_events
          (client_name, event_name, event_type, event_date, platform, transcript_text,
           word_count, segment_count, sentiment_avg, compliance_flags, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing', ?)`,
        [
          input.clientName,
          input.eventName,
          input.eventType,
          input.eventDate ?? null,
          input.platform ?? null,
          input.transcriptText,
          wordCount,
          rawSegments.length,
          sentimentAvg,
          complianceFlags,
          input.notes ?? null,
        ]
      );

      const archiveId: number = (result as any).insertId;

      const { eventId, eventTitle, metricsCount } =
        await generateMetricsFromArchive(
          archiveId,
          input.clientName,
          input.eventName,
          input.eventType,
          rawSegments,
          sentimentAvg,
          complianceFlags
        );

      await conn.execute(
        `UPDATE archive_events SET status = 'completed', tagged_metrics_generated = ? WHERE id = ?`,
        [metricsCount, archiveId]
      );

      return {
        success: true,
        archiveId,
        eventId,
        eventTitle,
        wordCount,
        segmentCount: rawSegments.length,
        sentimentAvg,
        complianceFlags,
        metricsGenerated: metricsCount,
        message: `Archive processed. ${metricsCount} intelligence records added to your Tagged Metrics database.`,
      };
    }),

  listArchives: publicProcedure.query(async () => {
    try {
      const conn = await (async () => {
        const db = await getDb();
        return (db as any).session?.client ?? (db as any).$client;
      })();
      const [rows] = await conn.execute(
        `SELECT id, client_name, event_name, event_type, event_date, platform,
                word_count, segment_count, sentiment_avg, compliance_flags,
                tagged_metrics_generated, status, notes, created_at
         FROM archive_events ORDER BY created_at DESC LIMIT 50`
      );
      return rows as Array<{
        id: number;
        client_name: string;
        event_name: string;
        event_type: string;
        event_date: string | null;
        platform: string | null;
        word_count: number;
        segment_count: number;
        sentiment_avg: number | null;
        compliance_flags: number;
        tagged_metrics_generated: number;
        status: string;
        notes: string | null;
        created_at: string;
      }>;
    } catch {
      return [];
    }
  }),
});
