# CuraLive Operator Console — Technical Architecture Brief

## 1. Platform Overview

CuraLive is a real-time investor events intelligence platform built for professional operators managing earnings calls, investor days, AGMs, and corporate webcasts. The platform provides a unified "mission control" console where operators can manage telephony, monitor live transcription, run AI-powered analytics, and ensure regulatory compliance — all in real time.

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Routing | wouter (lightweight client-side routing) |
| API Layer | tRPC (end-to-end type-safe RPC) |
| Backend | Node.js, Express |
| Database | PostgreSQL with Drizzle ORM |
| Real-Time Messaging | Ably (pub/sub event broadcasting) |
| Voice/Telephony | Twilio Voice SDK + Telnyx RTC (dual-carrier with automatic failover) |
| AI Transcription | Recall.ai (meeting bot deployment) + Local Audio Capture (browser fallback) |
| Video Streaming | Mux (RTMP ingest, HLS playback) |
| AI/LLM | OpenAI GPT models for sentiment analysis, summarisation, moderation |

---

## 3. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OPERATOR BROWSER                            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Operator     │  │  Shadow Mode │  │  Webcast     │              │
│  │  Console      │  │  Live Intel  │  │  Studio      │              │
│  │  (OCC)        │  │              │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────┴─────────────────┴──────────────────┴───────┐              │
│  │              tRPC Client (Type-Safe API)           │              │
│  └──────────────────────┬────────────────────────────┘              │
│                         │                                            │
│  ┌──────────────────────┴────────────────────────────┐              │
│  │         Ably Realtime (WebSocket Pub/Sub)          │              │
│  └───────────────────────────────────────────────────┘              │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────┐            │
│  │  WebRTC Webphone     │  │  Local Audio Capture     │            │
│  │  (Twilio/Telnyx SDK) │  │  (MediaStream API)       │            │
│  └──────────────────────┘  └──────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WSS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVER                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Express + tRPC Server                      │  │
│  │                                                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│  │
│  │  │ OCC Router  │ │ Shadow Mode │ │ Webphone Router         ││  │
│  │  │             │ │ Router      │ │                         ││  │
│  │  │ • Mute/Lock │ │ • Sessions  │ │ • WebRTC tokens         ││  │
│  │  │ • Lounge    │ │ • Notes     │ │ • Carrier failover      ││  │
│  │  │ • Record    │ │ • Handoff   │ │ • Call logging          ││  │
│  │  │ • Admit     │ │ • AI Alerts │ │                         ││  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘│  │
│  │                                                               │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│  │
│  │  │ AI/Sentiment│ │ Live Q&A    │ │ Mux Router              ││  │
│  │  │ Router      │ │ Router      │ │                         ││  │
│  │  │ • Analysis  │ │ • Triage    │ │ • Live streams          ││  │
│  │  │ • Moderation│ │ • Moderation│ │ • VOD assets            ││  │
│  │  │ • Compliance│ │ • AI Assist │ │ • Playback IDs          ││  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘│  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │              Webhook Endpoints                          │  │  │
│  │  │  POST /api/recall/webhook  (Recall.ai transcription)    │  │  │
│  │  │  POST /api/mux/webhook     (Mux stream status)          │  │  │
│  │  │  POST /api/twilio/webhook  (Twilio call events)         │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────┴───────────────────────────────────┐  │
│  │                    Ably Server-Side SDK                        │  │
│  │           (Publishes events to operator consoles)              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL Database                         │ │
│  │                                                                │ │
│  │  Core:  users, events, attendee_registrations                 │ │
│  │  OCC:   occ_conferences, occ_participants, occ_lounge,        │ │
│  │         occ_operator_sessions                                  │ │
│  │  Intel: shadow_sessions, bastion_intelligence_sessions,        │ │
│  │         agm_intelligence_sessions, tagged_metrics              │ │
│  │  AI:    agentic_analyses, autonomous_interventions,            │ │
│  │         adaptive_thresholds, operator_corrections              │ │
│  │  Q&A:   live_qa_sessions, live_qa_questions                   │ │
│  │  Billing: billing_clients, billing_quotes, billing_invoices   │ │
│  │  Compliance: compliance_certificates, disclosure_certificates │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Recall.ai   │  │  Twilio      │  │  Mux         │             │
│  │              │  │              │  │              │              │
│  │  Meeting bot │  │  Voice API   │  │  RTMP ingest │             │
│  │  deployment  │  │  PSTN calls  │  │  HLS playback│             │
│  │  Audio/Trans │  │  Dial-out    │  │  VOD storage │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Telnyx      │  │  Ably        │  │  OpenAI      │             │
│  │              │  │              │  │              │              │
│  │  Backup SIP  │  │  Realtime    │  │  GPT models  │             │
│  │  carrier     │  │  pub/sub     │  │  Sentiment   │             │
│  │  Failover    │  │  messaging   │  │  Summaries   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Operator Console (OCC) — Detailed Architecture

The Operator Console is the primary workspace for call centre operators. It provides a single-screen interface with multiple panels:

### 4.1 Console Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Conference Info | Status | Recording Indicator     │
├────────────────┬──────────────────────┬─────────────────────┤
│                │                      │                     │
│  LOUNGE        │  CONFERENCE FLOOR    │  INTELLIGENCE       │
│  (Waiting      │  (Active             │  PANEL              │
│   Room)        │   Participants)      │                     │
│                │                      │  • Live Transcript  │
│  • Caller Name │  • Name              │  • Sentiment Score  │
│  • Number      │  • Status            │  • AI Alerts        │
│  • Wait Time   │  • Mute/Unmute       │  • Compliance Flags │
│  • Admit Btn   │  • Park/Drop        │  • Rolling Summary  │
│                │  • Speaking Indicator│                     │
│                │                      │                     │
├────────────────┴──────────────────────┤                     │
│                                       │                     │
│  WEBPHONE PANEL                       │                     │
│  • Dial pad                           │                     │
│  • Active call controls               │                     │
│  • Carrier status (Twilio/Telnyx)     │                     │
│                                       │                     │
└───────────────────────────────────────┴─────────────────────┘
```

### 4.2 Operator Workflow

1. **Operator signs in** → Session created in `occ_operator_sessions`, status set to `present`
2. **Conference initialised** → Row created in `occ_conferences` with moderator/participant codes
3. **Caller dials in** → Lands in `occ_lounge` (waiting room)
4. **Operator admits caller** → Moved from `occ_lounge` to `occ_participants`, status `connected`
5. **Conference controls** → Operator can mute, unmute, park, drop, lock conference, start recording
6. **Every action** → Published to Ably channel `occ:conference:{id}` for multi-operator sync
7. **Conference ends** → AI generates summary, compliance certificate, disclosure hash

### 4.3 Real-Time Sync (Multi-Operator)

```
Operator A (Browser)                    Operator B (Browser)
       │                                        │
       │  ── tRPC: muteParticipant(5) ──►       │
       │                                        │
       │                    SERVER              │
       │                      │                  │
       │              ┌───────┴────────┐         │
       │              │ Process mute   │         │
       │              │ Update DB      │         │
       │              │ Publish Ably   │         │
       │              └───────┬────────┘         │
       │                      │                  │
       │  ◄── Ably: participant:updated ──►     │
       │                                        │
  UI updates instantly              UI updates instantly
```

---

## 5. Shadow Mode — Live Intelligence Flow

Shadow Mode allows operators to "shadow" external meetings (Zoom, Teams, Webex) and run real-time AI analysis without replacing the meeting platform.

### 5.1 Data Flow

```
External Meeting (Zoom/Teams/Webex)
         │
         │  Recall.ai Bot joins meeting
         ▼
┌─────────────────┐
│   Recall.ai     │
│   Cloud         │
│                 │
│  • Captures     │
│    audio        │
│  • Transcribes  │
│    in real-time │
└────────┬────────┘
         │
         │  Webhook: POST /api/recall/webhook
         │  (HMAC-SHA256 signed, must be registered BEFORE express.json())
         ▼
┌─────────────────────────────────────────────────┐
│   CuraLive Backend                               │
│                                                   │
│   1. Verify webhook signature                     │
│   2. Parse transcription segment                  │
│   3. Store in DB (occ_transcription_segments)     │
│   4. Run AI analysis:                             │
│      • Sentiment scoring                          │
│      • Compliance keyword detection               │
│      • Speaker identification                     │
│      • Materiality assessment                     │
│   5. Publish to Ably channel: shadow-{sessionId}  │
└────────────────────┬────────────────────────────┘
                     │
                     │  Ably Realtime (WebSocket)
                     │  Data format: JSON.stringify({ type, data })
                     │  Client must double-parse (Ably double-stringification)
                     ▼
┌─────────────────────────────────────────────────┐
│   Operator Console — Shadow Mode Tab             │
│                                                   │
│   ┌─────────────────────────────────────────┐    │
│   │ Live Transcript Feed                     │    │
│   │ Speaker-attributed, real-time scroll     │    │
│   ├─────────────────────────────────────────┤    │
│   │ Sentiment Gauge        │ AI Alerts       │    │
│   │ Rolling 30-sec average │ Compliance flags │    │
│   ├─────────────────────────────────────────┤    │
│   │ Operator Notes                           │    │
│   │ Timestamped annotations                  │    │
│   ├─────────────────────────────────────────┤    │
│   │ AI Advisory Bot                          │    │
│   │ Ask questions about the live call        │    │
│   └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 5.2 Fallback: Local Audio Capture

When Recall.ai cannot join a meeting (e.g., Chorus Call, private PBX):

```
Operator opens meeting in browser tab
         │
         │  Browser MediaStream API captures tab audio
         ▼
┌─────────────────┐
│  LocalAudio     │
│  Capture        │
│  Component      │
│                 │
│  • getUserMedia  │
│  • Audio chunks │
│  • Local Whisper│
│    transcription│
└────────┬────────┘
         │
         │  tRPC: shadowMode.addTranscript()
         ▼
    Same pipeline as Recall.ai from step 3 onwards
```

---

## 6. Telephony Architecture

### 6.1 Dual-Carrier Design

```
┌──────────────────────────────────────────────────────┐
│                  Carrier Manager                      │
│                                                       │
│   Primary: Twilio         Backup: Telnyx              │
│   ┌──────────────┐       ┌──────────────┐            │
│   │ Voice API    │       │ SIP/RTC API  │            │
│   │ PSTN dial-out│       │ PSTN dial-out│            │
│   │ WebRTC tokens│       │ WebRTC tokens│            │
│   └──────┬───────┘       └──────┬───────┘            │
│          │                      │                     │
│   Health check every 30s   Health check every 30s     │
│          │                      │                     │
│   ┌──────┴──────────────────────┴──────┐              │
│   │        Automatic Failover          │              │
│   │  If primary health < threshold     │              │
│   │  → Switch to backup carrier        │              │
│   │  → Log carrier switch event        │              │
│   │  → Notify operators via Ably       │              │
│   └────────────────────────────────────┘              │
└──────────────────────────────────────────────────────┘
```

### 6.2 Call Flow (Inbound)

```
PSTN Caller ──► Twilio Number ──► Webhook ──► CuraLive Backend
                                                    │
                                              Validate PIN
                                              (attendee_registrations)
                                                    │
                                           ┌────────┴────────┐
                                           │                  │
                                      Valid PIN          Invalid PIN
                                           │                  │
                                    Add to Lounge        Play error
                                    Notify operators     Disconnect
                                    via Ably
```

### 6.3 Call Flow (Outbound / Operator Dial-Out)

```
Operator clicks "Dial" in Webphone
         │
         │  tRPC: webphone.createCall()
         ▼
┌──────────────────┐
│  Backend selects  │
│  carrier based    │
│  on health score  │
│                   │
│  Twilio: 98% ✓   │
│  Telnyx: 95%      │
└────────┬─────────┘
         │
         │  Twilio REST API: create call
         ▼
PSTN rings ──► Callee answers ──► Bridge to conference
                                         │
                                  Add to occ_participants
                                  Publish via Ably
```

---

## 7. Connectivity Map

### 7.1 All External Connections

| Service | Protocol | Direction | Purpose | Auth Method |
|---------|----------|-----------|---------|-------------|
| Ably | WSS | Bidirectional | Real-time pub/sub for all live events | API Key |
| Twilio | HTTPS + WebRTC | Both | PSTN calls, WebRTC browser phone | Account SID + Auth Token |
| Telnyx | HTTPS + WebRTC | Both | Backup carrier for PSTN | API Key |
| Recall.ai | HTTPS (webhook) | Inbound | Live transcription from meeting bots | HMAC-SHA256 webhook secret |
| Mux | HTTPS (webhook) | Both | Live streaming, VOD, playback | API Token + Webhook Secret |
| OpenAI | HTTPS | Outbound | Sentiment analysis, summarisation, moderation | API Key |
| PostgreSQL | TCP (5432) | Internal | Primary data store | Connection string (DATABASE_URL) |

### 7.2 Ably Channel Structure

| Channel Pattern | Purpose | Publishers | Subscribers |
|----------------|---------|-----------|-------------|
| `occ:conference:{id}` | Conference state changes | Backend | Operator consoles |
| `shadow-{sessionId}` | Live transcript + AI data | Backend | Shadow Mode UI |
| `user:{userId}` | Personal notifications | Backend | Individual user |
| `event:{eventId}` | Event-wide broadcasts | Backend | All event participants |
| `webphone:{operatorId}` | Webphone call state | Backend | Operator webphone |

### 7.3 Webhook Endpoints

| Endpoint | Source | Purpose | Security |
|----------|--------|---------|----------|
| `POST /api/recall/webhook` | Recall.ai | Transcription segments, bot status | HMAC-SHA256 (must be before express.json()) |
| `POST /api/mux/webhook` | Mux | Stream active/idle, asset ready | Webhook signature |
| `POST /api/twilio/voice` | Twilio | Call status, DTMF input | Request validation |

---

## 8. Database Schema — Key Tables

### 8.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Authentication & profiles | id, openId, role (user/admin/operator), email |
| `events` | Central event entity | eventId, title, company, platform, status, scheduledAt |
| `attendee_registrations` | Event sign-ups with dial-in PINs | eventId, name, email, pin, accessType |

### 8.2 Operator Call Centre (OCC)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `occ_conferences` | Telephony state per event | eventId, moderatorCode, participantCode, isLocked, isRecording |
| `occ_participants` | Individual call lines | conferenceId, name, phone, status (incoming/connected/muted/speaking) |
| `occ_lounge` | Waiting room for callers | conferenceId, callerName, callerNumber, waitingSince |
| `occ_operator_sessions` | Operator presence tracking | userId, conferenceId, status (present/in_call/break) |

### 8.3 Intelligence / Shadow Mode

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `shadow_sessions` | Live mirroring sessions | eventId, meetingUrl, recallBotId, status, transcript |
| `bastion_intelligence_sessions` | IR-specific analysis | eventId, managementTone, credibilityScore, guidanceTracking |
| `agm_intelligence_sessions` | AGM-specific tracking | eventId, resolutions, quorumStatus, dissentPatterns |
| `tagged_metrics` | Universal metrics store | eventId, metricType, value, timestamp |
| `adaptive_thresholds` | Self-tuning AI thresholds | metricType, currentThreshold, lastUpdated |
| `operator_corrections` | Human overrides of AI | metricId, originalValue, correctedValue, operatorId |

### 8.4 Billing

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `billing_clients` | Enterprise customers | name, registrationNumber, vatNumber |
| `billing_quotes` | Draft quotes | clientId, status, totalAmount, validUntil |
| `billing_invoices` | Tax invoices | clientId, quoteId, status (draft/sent/paid/overdue) |
| `billing_line_items` | Individual charges | invoiceId/quoteId, description, quantity, unitPrice |

---

## 9. Security & Compliance

| Concern | Implementation |
|---------|---------------|
| Authentication | OpenID Connect (Replit Auth) with PKCE |
| Session Management | JWT tokens stored in secure HTTP-only cookies |
| Webhook Security | HMAC-SHA256 signature verification on all inbound webhooks |
| Audit Trail | Every operator action logged with timestamp, userId, conferenceId |
| Disclosure Certificates | Blockchain-style SHA-256 hashing of transcripts for tamper-proof audit |
| Compliance Monitoring | Real-time JSE Listings Requirements detection during live calls |
| Data Encryption | TLS/HTTPS for all external connections, mTLS for internal proxy |

---

## 10. Deployment

| Component | Environment |
|-----------|-------------|
| Frontend + Backend | Replit (production deployment with autoscale) |
| Database | Replit PostgreSQL (managed) |
| Real-time | Ably Cloud |
| Telephony | Twilio / Telnyx Cloud |
| AI Bots | Recall.ai Cloud |
| Video | Mux Cloud |

The application runs as a single Express server serving both the tRPC API and the Vite-built static frontend. All real-time functionality is offloaded to Ably's pub/sub infrastructure, keeping the server stateless and horizontally scalable.
