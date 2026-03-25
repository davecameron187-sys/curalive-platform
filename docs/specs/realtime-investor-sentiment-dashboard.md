---
REPLIT SUMMARY — copy and paste this block into the Replit chat
---
Feature: Real-Time Investor Sentiment Dashboard
Route(s): /operator/:eventId/sentiment, WebSocket channel: sentiment-live-:eventId
Priority: high
Depends on: Ably Real-Time Channels (implemented), AI Transcription (partial), Recall.ai Bot Recording (implemented)
What to build:
- Add a new "Sentiment" tab to the OCC (/operator/:eventId/sentiment) displaying a live sentiment gauge (bullish/neutral/bearish), sentiment score (0–100) updated every 30 seconds, a line chart of sentiment over time, and per-speaker sentiment breakdown
- Create a server-side sentiment aggregation service that processes incoming transcription segments and Q&A submissions in real-time, calculates sentiment scores using the LLM (via invokeLLM with structured JSON output), and publishes updates to an Ably channel (sentiment-live-:eventId) every 30 seconds
- Add frontend real-time subscription to the Ably sentiment channel that updates the gauge, chart, and speaker breakdown without polling; display sentiment spikes (>15 point changes) with visual alerts and a "Sentiment Alert" notification to the operator
DB changes needed: yes — add sentiment_snapshots table (id, event_id FK, timestamp, overall_score int, bullish_count int, neutral_count int, bearish_count int, top_sentiment_drivers JSON, created_at) for historical tracking
New tRPC procedures: yes — sentiment.getLiveScore (query, protected, real-time via Ably), sentiment.getSentimentHistory (query, protected), sentiment.getSpeakerSentiment (query, protected)
New pages/routes: yes — /operator/:eventId/sentiment (sentiment dashboard tab in OCC)
---

# Real-Time Investor Sentiment Dashboard — Full Specification

## 1. Overview

During earnings calls and investor days, the operator and IR team need to gauge investor reaction in real-time. Currently, sentiment analysis is only available post-event in the Post-Event AI Report. This feature brings sentiment analysis live, enabling operators to adjust messaging and pacing on the fly if investor sentiment is negative.

The Real-Time Investor Sentiment Dashboard displays a live sentiment gauge updated every 30 seconds, showing whether investors are bullish, neutral, or bearish based on Q&A tone, chat sentiment, and poll responses. Sentiment spikes trigger alerts, allowing operators to pivot messaging immediately.

---

## 2. Sentiment Dashboard Layout

The sentiment dashboard is accessible at `/operator/:eventId/sentiment` within the OCC and consists of four sections.

### 2.1 Live Sentiment Gauge

A large, prominent gauge showing the current overall sentiment score (0–100) with a needle pointing to the current score. The gauge is color-coded:

- **0–33 (Bearish)** — Red
- **34–66 (Neutral)** — Yellow
- **67–100 (Bullish)** — Green

Below the gauge, display three stat cards showing the count of bullish, neutral, and bearish submissions in the last 5 minutes.

### 2.2 Sentiment Timeline Chart

A Chart.js line chart showing sentiment score over the event duration, bucketed into 1-minute intervals. Annotations mark significant sentiment shifts (changes of more than 15 points within 60 seconds). Clicking an annotation scrolls the transcript to that timestamp.

### 2.3 Sentiment Drivers

A list of the top 3 factors driving current sentiment, extracted by the AI. Each driver includes:

- Factor description (e.g. "Positive guidance on Q3 revenue")
- Sentiment impact (positive / negative)
- Timestamp when the factor was first mentioned
- Number of Q&A submissions related to this factor

### 2.4 Per-Speaker Sentiment Breakdown

A table showing sentiment score for each speaker during their segments:

| Speaker | Talk Time | Avg Sentiment | Bullish % | Neutral % | Bearish % |
|---|---|---|---|---|---|
| CEO | 12:34 | 78 | 65% | 25% | 10% |
| CFO | 08:45 | 62 | 40% | 45% | 15% |
| Investor Relations | 05:12 | 85 | 75% | 20% | 5% |

---

## 3. Real-Time Sentiment Calculation

### 3.1 Data Sources

Sentiment is calculated from three real-time sources:

1. **Transcription Segments** — Each segment from Forge AI or Whisper is scored for sentiment using the LLM
2. **Q&A Submissions** — Each question is scored for sentiment (positive/negative/neutral) based on tone
3. **Poll Responses** — If polls are enabled, poll responses are scored (e.g. "Strongly Agree" = bullish, "Strongly Disagree" = bearish)
4. **Chat Messages** — If chat is enabled, chat messages are scored for sentiment

### 3.2 Aggregation Pipeline

Every 30 seconds, the sentiment aggregation service executes the following steps:

**Step 1 — Collect Recent Data.** Fetch all transcription segments, Q&A submissions, and chat messages from the last 30 seconds.

**Step 2 — Score Each Item.** For each item, call `invokeLLM` with a sentiment scoring prompt requesting a JSON response:

```json
{
  "sentiment": "bullish|neutral|bearish",
  "score": 0-100,
  "confidence": 0-1,
  "drivers": ["string"]
}
```

Use batching to score multiple items in a single LLM call for efficiency.

**Step 3 — Aggregate Scores.** Calculate the weighted average sentiment score across all items, weighted by confidence scores. Count bullish, neutral, and bearish submissions.

**Step 4 — Detect Spikes.** Compare the current score to the previous score. If the change is more than 15 points, flag as a sentiment spike.

**Step 5 — Publish to Ably.** Publish the aggregated sentiment data to the Ably channel `sentiment-live-:eventId` with the following payload:

```json
{
  "timestamp": "ISO-8601",
  "overall_score": 0-100,
  "bullish_count": integer,
  "neutral_count": integer,
  "bearish_count": integer,
  "spike_detected": boolean,
  "spike_magnitude": integer,
  "top_drivers": ["string"],
  "per_speaker_sentiment": { "speaker_name": score }
}
```

**Step 6 — Persist to Database.** Store the aggregated snapshot in the `sentiment_snapshots` table for historical analysis.

### 3.3 Spike Detection & Alerts

If a sentiment spike is detected (change > 15 points), the frontend immediately displays a visual alert: a red or green banner at the top of the sentiment dashboard indicating "Sentiment Spike: Bullish" or "Sentiment Spike: Bearish". The alert includes the magnitude of the change and a link to the transcript position where the spike occurred.

The operator can dismiss the alert or click to jump to the relevant transcript section.

---

## 4. Frontend Components

**`/operator/:eventId/sentiment`** — The main sentiment dashboard page. Subscribes to the Ably `sentiment-live-:eventId` channel and updates all charts and gauges in real-time as new sentiment data arrives.

**`SentimentGauge`** — A custom gauge component (using SVG or Canvas) that displays the current sentiment score with a needle. Animates smoothly as the score changes.

**`SentimentTimelineChart`** — A Chart.js line chart showing sentiment over time with spike annotations.

**`SentimentDriversList`** — A component displaying the top 3 sentiment drivers with descriptions and timestamps.

**`PerSpeakerSentimentTable`** — A table component showing per-speaker sentiment breakdown.

**`SentimentAlertBanner`** — A dismissible banner component that appears when a spike is detected, showing spike magnitude and a link to the relevant transcript position.

---

## 5. Database Schema

### `sentiment_snapshots`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `event_id` | int, FK conferences | |
| `timestamp` | timestamp | When the snapshot was taken |
| `overall_score` | int (0–100) | Weighted average sentiment |
| `bullish_count` | int | Number of bullish submissions in the last 30 seconds |
| `neutral_count` | int | Number of neutral submissions in the last 30 seconds |
| `bearish_count` | int | Number of bearish submissions in the last 30 seconds |
| `top_sentiment_drivers` | JSON | Array of top 3 drivers |
| `per_speaker_sentiment` | JSON | Object mapping speaker names to sentiment scores |
| `spike_detected` | boolean | Whether a spike was detected |
| `spike_magnitude` | int, nullable | Magnitude of spike if detected |
| `created_at` | timestamp | |

---

## 6. tRPC Procedures

| Procedure | Type | Auth | Description |
|---|---|---|---|
| `sentiment.getLiveScore` | query | protected | Returns the current sentiment snapshot for a given `eventId`. Subscribed via Ably in real-time. |
| `sentiment.getSentimentHistory` | query | protected | Returns historical sentiment snapshots for a given `eventId` (for charting). |
| `sentiment.getSpeakerSentiment` | query | protected | Returns per-speaker sentiment breakdown for a given `eventId`. |

---

## 7. Ably Real-Time Integration

The frontend subscribes to the Ably channel `sentiment-live-:eventId` using the existing Ably integration. The channel receives sentiment updates every 30 seconds from the server. The frontend automatically updates all charts and gauges when new data arrives, without polling.

---

## 8. Performance Considerations

Sentiment scoring via LLM can be slow. To optimize:

1. **Batch LLM calls** — Score multiple transcription segments and Q&A submissions in a single LLM call
2. **Cache sentiment scores** — Store sentiment scores for each segment/Q&A in the database to avoid re-scoring
3. **Sample Q&A** — If Q&A volume is very high (>100 submissions per 30 seconds), sample 50% of submissions to score, then extrapolate

---

## 9. Error Handling

If LLM sentiment scoring fails, the system falls back to a simple rule-based sentiment scorer (keyword matching) to ensure the dashboard continues to update. The operator is notified that sentiment scoring is in "fallback mode" with reduced accuracy.

If the Ably channel connection drops, the frontend automatically reconnects and fetches the latest sentiment snapshot via the tRPC query.
