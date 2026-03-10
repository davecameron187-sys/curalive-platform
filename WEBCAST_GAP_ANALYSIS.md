# CuraLive Webcast — Gap Analysis vs. Intelligent Broadcaster Brief
> March 2026 | Comparing current state vs. Phase 1 MVP brief

---

## What CuraLive Already Has (Built & Working)

### Live Production
- Webcast Studio (operator console, mic/video controls, stream state management)
- Mux RTMP ingest (stream key generation for OBS, vMix, hardware encoders)
- Recall.ai meeting bots (capture live audio/video from Zoom, Teams, Webex)
- Multi-format events: Webinars, Webcasts (100k+ attendees), Virtual Conferences, Hybrid

### Real-Time AI (All services fully built)
- **Live Transcription** with speaker diarization — via Recall.ai
- **Sentiment Analysis** — emotion detection, trend tracking, speaker profiles
- **Speaking Pace Coach** — WPM, filler word count, pause detection, live tips
- **Q&A Auto-Triage** — classifies questions as approved/spam/risk/duplicate/off-topic
- **Toxicity Filter** — text safety for Q&A, chat, transcripts; recommends block/redact
- **Live Rolling Summary** — 60-second window summaries, catchup for late joiners
- **Compliance Moderator** — regulatory checks + audit log

### Audience Engagement
- Live polling with real-time results
- Q&A moderation console
- Multi-language transcript display (English, Afrikaans, isiZulu, etc.)
- Token-gated attendee access + registration with calendar invites
- Automated 24h/1h email reminders

### Post-Event
- AI executive summaries + press release drafting (SENS/RNS-ready)
- Lead scoring (Hot/Warm/Cold) from engagement signals
- Geographic and device analytics
- On-demand video library transition
- Social Media Amplification (Event Echo → LinkedIn, X, Facebook, Instagram, TikTok)
- Content generation triggers: summaries, follow-up emails, talking points
- Compliance audit log
- PII redaction workflow
- Investor follow-up email drafter

---

## Brief vs. Reality: Feature-by-Feature

| Brief Feature | Status | What We Have | What's Missing |
|---|---|---|---|
| AI Content Adaptation | 🟡 Partial | SpeakingPaceCoachService (pace/filler coaching), Sentiment | Dynamic in-event triggers (e.g. "suggest poll if engagement drops"), operator alert panel |
| XR Overlays (AR/VR on video) | 🔴 Not built | Nothing | Full AR/VR overlay system on Mux player |
| Video Podcast Conversion | 🔴 Not built | On-demand library exists, Mux recordings available | LLM-scripted clip extraction, podcast file export (MP3/chapters) |
| Multi-Language Dubbing | 🟡 Partial | Transcript translation in UI | Live audio dubbing / TTS in target language |
| Sustainability Calculator | 🔴 Not built | Nothing | Carbon footprint calc, green scheduling suggestions |
| Interactive Ads | 🔴 Not built | Nothing | AI-personalized ad injection during stream |
| Noise & Audio Enhancement | 🔴 Not built | ToxicityFilter (text-only) | Audio noise suppression, adaptive volume |
| Post-Webcast AI Video Recap | 🟡 Partial | Text summaries, press releases, PostEventReport | Video-format recap with CTAs, clip compilation |

---

## Recommendation: What to Actually Build

### Tier 1 — Build Now (High impact, fully achievable)

**1. Intelligent Broadcaster Panel** (Enhances existing AI)
> Unifies SpeakingPaceCoachService + SentimentAnalysis + QaAutoTriage into a single live operator UI that fires intelligent suggestions in real time — "Engagement dropping, launch a poll?", "3 filler words this minute — remind presenter", "2 compliance risk questions in queue". This turns all our existing AI into visible, actionable intelligence. **Unique to CuraLive.**

**2. Video Podcast Converter**
> Uses Mux recordings + LLM to auto-generate a podcast from any webcast: extracts key moments, creates chapter markers, writes a show-notes script, and exports an MP3 with title/description. Investors could subscribe to a podcast feed of earnings calls. **No competitor does this natively inside their webcast platform.**

**3. Sustainability Dashboard**
> Carbon footprint calculator per event (travel saved vs. virtual attendance, server energy use, bandwidth). Generates an ESG-ready "Green Event" certificate. Highly differentiating for listed companies with ESG reporting requirements. Straightforward to build — pure data + LLM.

**4. Post-Webcast AI Video Recap** (Enhancing what we have)
> Upgrade the existing PostEventReport to generate a short-form video script + visual storyboard: key quotes, sentiment highlights, top Q&A moments formatted as a shareable social clip brief. Works alongside the Social Media Amplification feature already built.

---

### Tier 2 — Build Later (High value but more complex)

**5. Multi-Language Audio Dubbing**
> Real-time TTS dubbing requires OpenAI TTS + audio mixing with the Mux stream. Achievable but needs careful latency management. Massive differentiator for global investor events.

**6. Noise & Audio Enhancement**
> Browser-based noise suppression (Web Audio API + AI model) for presenter audio before it hits the RTMP stream. Feasible via client-side processing in WebcastStudio.

---

### Tier 3 — Not Recommended

**XR Overlays** — Requires WebGL/WebXR hardware integration; technically very heavy and most enterprise webcast viewers use standard browsers. Not practical for MVP.

**Interactive Ads** — Investor events are a compliance-sensitive context; ad injection mid-earnings call is an inappropriate product fit and likely a regulatory risk.

---

## Summary

CuraLive already has one of the deepest AI real-time intelligence stacks of any webcast platform — transcription, sentiment, compliance, pace coaching, Q&A triage, toxicity filtering, rolling summaries, and social amplification are all live. The gap is in **surfacing all that intelligence into a single operator view** (Intelligent Broadcaster Panel) and in **post-event media generation** (podcast, video recap, sustainability report).

The four Tier 1 features above would genuinely set CuraLive apart from every competitor.
