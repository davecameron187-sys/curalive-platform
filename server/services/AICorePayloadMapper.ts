import { rawSql } from "../db";
import type { AICoreAnalysisRequest } from "./AICoreClient";

const LOG = (msg: string) => console.log(`[AICoreMapper] ${msg}`);

interface TranscriptSegment {
  speaker_name: string | null;
  speaker_role: string | null;
  text: string;
  start_time: number | null;
  end_time: number | null;
  confidence: number | null;
}

interface SessionData {
  id: number;
  client_name?: string;
  company?: string;
  event_name?: string;
  event_type?: string;
  jurisdiction?: string;
  platform?: string;
  local_transcript_json?: string;
  recallBotId?: string;
}

export async function buildCanonicalPayload(
  sessionId: number,
  session: SessionData
): Promise<AICoreAnalysisRequest> {
  const segments = await loadTranscriptSegments(sessionId, session);
  const questions = await loadQuestions(sessionId);

  const speakerMap = new Map<
    string,
    { display_name: string; role: string | null; segment_count: number; total_words: number }
  >();

  for (const seg of segments) {
    const sid = normaliseId(seg.speaker_name ?? "unknown");
    const existing = speakerMap.get(sid);
    const wordCount = seg.text.split(/\s+/).filter(Boolean).length;

    if (existing) {
      existing.segment_count += 1;
      existing.total_words += wordCount;
      if (!existing.role && seg.speaker_role) existing.role = seg.speaker_role;
    } else {
      speakerMap.set(sid, {
        display_name: seg.speaker_name ?? "Unknown",
        role: seg.speaker_role ?? null,
        segment_count: 1,
        total_words: wordCount,
      });
    }
  }

  const speakers = Array.from(speakerMap.entries()).map(([sid, data]) => ({
    speaker_id: sid,
    display_name: data.display_name,
    role: data.role,
    segment_count: data.segment_count,
    total_words: data.total_words,
  }));

  const canonicalSegments = segments.map((seg) => {
    const wordCount = seg.text.split(/\s+/).filter(Boolean).length;
    return {
      speaker_id: normaliseId(seg.speaker_name ?? "unknown"),
      speaker_name: seg.speaker_name ?? null,
      text: seg.text,
      start_time: seg.start_time != null ? seg.start_time / 1000 : null,
      end_time: seg.end_time != null ? seg.end_time / 1000 : null,
      word_count: wordCount,
    };
  });

  const totalWords = canonicalSegments.reduce((sum, s) => sum + s.word_count, 0);
  const companyName = session.company ?? session.client_name ?? "Unknown";

  LOG(
    `Built payload: ${speakers.length} speakers, ${canonicalSegments.length} segments, ${totalWords} words`
  );

  return {
    canonical_event: {
      event_id: `shadow-${sessionId}`,
      title: session.event_name ?? "Session",
      organisation_id: companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      organisation_name: companyName,
      event_type: session.event_type ?? "earnings_call",
      jurisdiction: session.jurisdiction ?? null,
      signal_source: mapPlatform(session.platform),
      speakers,
      segments: canonicalSegments,
      total_segments: canonicalSegments.length,
      total_words: totalWords,
      total_speakers: speakers.length,
      questions: questions.map((q) => ({
        asker_id: q.asker_name ?? "unknown",
        text: q.question_text ?? "",
      })),
      compliance_flags: [],
    },
    modules: [
      "sentiment",
      "engagement",
      "compliance_signals",
      "commitment_extraction",
    ],
  };
}

async function loadTranscriptSegments(
  sessionId: number,
  session: SessionData
): Promise<TranscriptSegment[]> {
  const [rows] = await rawSql(
    `SELECT speaker_name, speaker_role, text, start_time, end_time, confidence
     FROM occ_transcription_segments
     WHERE conference_id = $1
     ORDER BY created_at ASC
     LIMIT 2000`,
    [sessionId]
  );

  if (rows.length > 0) {
    LOG(`Loaded ${rows.length} segments from occ_transcription_segments`);
    return rows as TranscriptSegment[];
  }

  // Fallback 2: recall_bots.transcriptJson via recallBotId
  if (session.recallBotId) {
    try {
      const [botRows] = await rawSql(
        `SELECT transcript_json FROM recall_bots WHERE recall_bot_id = $1`,
        [session.recallBotId]
      );
      if (botRows.length > 0 && botRows[0].transcript_json) {
        const parsed = JSON.parse(botRows[0].transcript_json);
        if (Array.isArray(parsed) && parsed.length > 0) {
          LOG(`Loaded ${parsed.length} segments from recall_bots.transcriptJson`);
          return parsed.map(
            (s: any): TranscriptSegment => ({
              speaker_name: s.speaker ?? s.speaker_name ?? "Unknown",
              speaker_role: s.role ?? s.speaker_role ?? null,
              text: s.text ?? "",
              start_time: s.start_time ?? s.timestamp ?? null,
              end_time: s.end_time ?? null,
              confidence: s.confidence ?? null,
            })
          );
        }
      }
    } catch {}
  }

  // Fallback 3: local_transcript_json
  if (session.local_transcript_json) {
    try {
      const parsed = JSON.parse(session.local_transcript_json);
      if (Array.isArray(parsed)) {
        LOG(`Loaded ${parsed.length} segments from local_transcript_json`);
        return parsed.map(
          (s: any): TranscriptSegment => ({
            speaker_name: s.speaker ?? s.speaker_name ?? "Unknown",
            speaker_role: s.role ?? s.speaker_role ?? null,
            text: s.text ?? "",
            start_time: s.start_time ?? s.timestamp ?? null,
            end_time: s.end_time ?? null,
            confidence: s.confidence ?? null,
          })
        );
      }
    } catch {}
  }

  LOG("No transcript segments found");
  return [];
}

async function loadQuestions(
  sessionId: number
): Promise<Array<{ asker_name: string; question_text: string }>> {
  try {
    const [rows] = await rawSql(
      `SELECT asker_name, question_text
       FROM approved_questions_queue
       WHERE session_id = $1
       ORDER BY queued_at ASC`,
      [sessionId]
    );
    return rows as Array<{ asker_name: string; question_text: string }>;
  } catch {
    return [];
  }
}

function normaliseId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "") || "unknown";
}

function mapPlatform(platform?: string): string {
  switch (platform?.toLowerCase()) {
    case "zoom":
    case "teams":
    case "meet":
    case "webex":
      return "video";
    case "choruscall":
    case "telephony":
      return "telephony";
    default:
      return "manual";
  }
}
