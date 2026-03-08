# Complete AI Transcription

## REPLIT SUMMARY

**Feature**: Complete AI Transcription Pipeline  
**Route**: No new route — enhances existing transcript views across `/event/:eventId`, `/moderator/:eventId`, `/presenter/:eventId`, and `/post-event/:eventId`  
**Priority**: High  
**Status**: spec-ready  
**Dependencies**: Recall.ai Bot Recording (implemented), Mux Live Streaming (implemented), Ably Real-Time Channels (implemented)  

**What to build**: Complete the AI transcription pipeline by integrating OpenAI Whisper for high-accuracy post-event transcription alongside the existing Forge AI live transcription. The system should support dual-mode transcription: Forge AI for real-time display during live events (already partially implemented), and Whisper for high-accuracy post-event processing. Add speaker diarization, language detection, multi-language transcription (12 languages including Arabic RTL), and transcript editing/correction tools.

**Key files to create or modify**:
- `server/services/TranscriptionService.ts` — Unified transcription service (create or extend existing)
- `server/services/WhisperService.ts` — Whisper API integration service
- `server/routers/transcription.ts` — tRPC router for transcription management
- `drizzle/schema.ts` — Add `transcription_jobs` table, extend `transcript_segments` if needed
- `client/src/components/TranscriptViewer.tsx` — Reusable transcript display component with search, speaker filter, and language toggle
- `client/src/components/TranscriptEditor.tsx` — Extend existing editor with correction tools

**Database table**: `transcription_jobs` with columns: `id`, `event_id`, `source` (enum: forge_ai, whisper, manual), `status` (enum: queued, processing, completed, failed), `language_detected` (varchar), `languages_requested` (JSON array), `audio_url` (text, S3 link to source audio), `duration_seconds` (int), `word_count` (int), `confidence_score` (decimal), `speaker_count` (int), `error_message` (text, nullable), `started_at` (timestamp, nullable), `completed_at` (timestamp, nullable), `created_at`, `updated_at`

**tRPC procedures**:
- `transcription.startWhisperJob` (mutation, protected) — Queues a Whisper transcription job for a completed event
- `transcription.getJobStatus` (query, protected) — Returns current job status and progress
- `transcription.getTranscript` (query, protected) — Returns assembled transcript with speaker labels and timestamps
- `transcription.updateSegment` (mutation, protected) — Allows manual correction of a transcript segment
- `transcription.switchSource` (mutation, protected) — Switches displayed transcript between Forge AI and Whisper versions
- `transcription.exportTranscript` (query, protected) — Returns transcript in requested format (JSON, SRT, VTT, TXT, DOCX)
- `transcription.detectLanguage` (query, protected) — Detects primary language from audio sample

---

## Detailed Specification

### 1. Overview

CuraLive currently uses Forge AI for live transcription during events, delivering sub-1-second latency text to the Ably real-time channels. This works well for the live experience but produces transcripts with lower accuracy than is acceptable for post-event reports, compliance review, and archival purposes. This specification completes the transcription pipeline by adding OpenAI Whisper as a high-accuracy post-event processing layer, speaker diarization for multi-speaker identification, multi-language support for 12 languages, and transcript editing tools for manual correction.

### 2. Dual-Mode Architecture

The transcription system operates in two modes that serve different purposes at different stages of the event lifecycle.

| Mode | Engine | Latency | Accuracy | Use Case |
|---|---|---|---|---|
| **Live** | Forge AI (via `invokeLLM`) | <1 second | ~85–90% | Real-time display during events |
| **Post-Event** | OpenAI Whisper (via `transcribeAudio`) | 2–10 minutes | ~95–98% | Reports, compliance, archival |

During a live event, Forge AI transcription streams to Ably channels in real time. When the event ends, the system automatically queues a Whisper transcription job using the recorded audio from Recall.ai or Mux. Once the Whisper job completes, the high-accuracy transcript replaces the live version as the default display in all post-event views.

### 3. Whisper Integration

The Whisper integration uses the existing `transcribeAudio` helper from `server/_core/voiceTranscription.ts`. The implementation should follow these steps.

**3.1 Audio Source Resolution** — When a Whisper job is triggered, the service first checks for a Recall.ai recording URL. If unavailable, it falls back to the Mux asset URL. If neither is available, the job fails with a descriptive error. The audio source URL is stored in the `transcription_jobs` table for retry purposes.

**3.2 Audio Chunking** — For events longer than 15 minutes, the audio should be split into chunks of no more than 10 minutes each to stay within the Whisper API's 16MB file size limit. Each chunk is transcribed independently with a context hint from the previous chunk's last 30 seconds of text. Chunks are processed sequentially to maintain timestamp accuracy.

**3.3 Transcription Request** — Each chunk is sent to `transcribeAudio` with the following parameters: `audioUrl` (the chunk URL or full recording URL), `language` (if known from event settings, otherwise omitted for auto-detection), and `prompt` (a context hint containing the event title, speaker names, and industry-specific terminology to improve accuracy).

**3.4 Response Processing** — The Whisper response includes `text` (full transcription), `language` (detected language code), and `segments` (timestamped segments with metadata). Each segment is mapped to a `transcript_segments` row with the source set to "whisper", the confidence score from the segment metadata, and timestamps adjusted for chunk offset.

### 4. Speaker Diarization

Speaker diarization identifies who is speaking at each point in the transcript. Since Whisper does not natively support diarization, the system uses a combination of techniques.

**4.1 Recall.ai Speaker Labels** — If the event was recorded via Recall.ai, the bot captures per-participant audio streams with speaker identification. These labels are mapped to transcript segments by aligning timestamps. This is the most accurate method and should be preferred when available.

**4.2 LLM-Assisted Diarization** — When Recall.ai speaker labels are unavailable (e.g., RTMP ingest events), the system sends transcript segments to the LLM with a prompt requesting speaker identification based on context clues (name mentions, role references, speaking patterns). The LLM returns a JSON mapping of segment ranges to speaker identifiers. This method is less accurate but provides reasonable results for events with 2–5 distinct speakers.

**4.3 Manual Override** — The transcript editor allows operators to manually assign or correct speaker labels for any segment. Manual corrections are stored with source "manual" and take precedence over automated labels.

### 5. Multi-Language Support

CuraLive supports transcription in 12 languages, with special handling for Arabic RTL text.

| Language | Code | RTL | Notes |
|---|---|---|---|
| English | en | No | Primary language, highest accuracy |
| Afrikaans | af | No | South African market priority |
| Zulu | zu | No | South African market priority |
| Xhosa | xh | No | South African market priority |
| Arabic | ar | Yes | RTL layout required |
| French | fr | No | — |
| Portuguese | pt | No | — |
| Spanish | es | No | — |
| German | de | No | — |
| Mandarin | zh | No | — |
| Japanese | ja | No | — |
| Korean | ko | No | — |

**5.1 Language Detection** — If the event language is not set in advance, the system detects the primary language from the first 30 seconds of audio using Whisper's language detection. The detected language is stored in the `transcription_jobs` table and used for subsequent processing.

**5.2 Multi-Language Events** — For events where multiple languages are spoken (e.g., a bilingual earnings call), the system processes each language segment independently. Language switches are detected by monitoring confidence scores — a sudden drop in confidence often indicates a language change. When detected, the system re-processes that segment with language auto-detection.

**5.3 Arabic RTL Handling** — Arabic transcript segments must be rendered with `direction: rtl` and `text-align: right` CSS properties. The TranscriptViewer component should detect Arabic segments and apply RTL styling automatically. Mixed-direction content (Arabic with English terms) should use `unicode-bidi: embed` for correct rendering.

### 6. Transcript Export Formats

The system supports exporting transcripts in multiple formats for different downstream uses.

| Format | Extension | Use Case |
|---|---|---|
| **Plain Text** | .txt | Simple reading, email attachment |
| **SRT** | .srt | Video subtitle overlay (Mux player) |
| **WebVTT** | .vtt | Web video subtitle standard |
| **JSON** | .json | API integration, programmatic access |
| **DOCX** | .docx | Professional document distribution |

Each export includes speaker labels, timestamps, and any manual corrections. The SRT and VTT formats are particularly important for the Post-Event Report replay feature, where the transcript syncs with the Mux video player.

### 7. Transcript Editing and Correction

The existing TranscriptEditor component should be extended with the following capabilities.

**7.1 Inline Editing** — Click any transcript segment to enter edit mode. The original text is preserved alongside the corrected text, creating an audit trail. Edits are saved via the `transcription.updateSegment` mutation.

**7.2 Speaker Reassignment** — A dropdown on each segment allows reassigning the speaker label. The dropdown is populated from the event's participant list.

**7.3 Merge/Split Segments** — Operators can merge two adjacent segments (combining their text and extending the timestamp range) or split a segment at a cursor position (creating two segments with adjusted timestamps).

**7.4 Confidence Highlighting** — Segments with confidence scores below 0.8 are highlighted with a subtle yellow background, drawing the operator's attention to sections that may need manual review.

**7.5 Find and Replace** — A search bar supports finding text across the entire transcript and replacing it globally (useful for correcting consistently misspelled names or terms).

### 8. Automatic Job Triggering

Whisper transcription jobs should be triggered automatically when an event transitions to "completed" status. The trigger should be implemented as a post-event hook in the conference management flow. The hook checks whether a recording is available (Recall.ai or Mux), creates a `transcription_jobs` entry with status "queued", and starts processing. If no recording is available within 5 minutes of event completion, the job is created with status "failed" and an appropriate error message.

### 9. Error Handling and Retries

Transcription jobs can fail due to audio quality issues, API timeouts, or file size limits. The system should retry failed jobs up to 3 times with exponential backoff (30 seconds, 2 minutes, 10 minutes). Each retry attempt is logged. If all retries fail, the job status is set to "failed" with the error message from the last attempt, and the event host is notified via the `notifyOwner` helper. The frontend should display the failure reason and offer a manual retry button.

### 10. Performance Considerations

Whisper transcription of a 1-hour event typically takes 3–8 minutes. For events longer than 2 hours, the chunked processing approach ensures that no single API call exceeds the 16MB limit or the 30-second timeout. The system should process chunks sequentially rather than in parallel to maintain timestamp accuracy and avoid rate limiting. Job status should be polled every 10 seconds on the frontend, with a progress indicator showing estimated completion time based on audio duration.
