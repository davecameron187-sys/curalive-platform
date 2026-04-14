# CuraLive Bridge Console — Comprehensive Manus Execution Brief

**Date:** April 2026
**Project:** CuraLive Real-Time Investor Events Intelligence Platform
**Module:** Bridge Console — White-Glove Telephony Operator Console

---

## Executive Summary

CuraLive is a production SaaS platform for managing high-stakes investor events (earnings calls, AGMs, IPO roadshows). The Bridge Console is a new professional operator-assisted conference bridge module that competes directly with Chorus Call, BroadData, and Communique Conferencing.

**What exists today (already built):**
- Full database schema (7 bridge tables, 8 enums)
- Complete tRPC router with 25+ endpoints (event CRUD, conference management, greeter queue, participant control, Q&A queue, operator log)
- Full React UI page at `/bridge` with all panels (greeter queue, participant roster, Q&A, operator log)
- Route registration with operator auth protection
- Ably real-time event publishing for all state changes
- Relational scoping and existence checks on all mutations (security hardened)

**What needs to be built (this brief):**
1. Twilio webhook handlers for inbound IVR, DTMF, conference status, and dial-out callbacks
2. Twilio Client SDK integration for operator browser-based softphone
3. Auto Recall.ai bot deployment when bridge events are created
4. Post-call package generation (attendance report CSV/PDF, recording links, AI summary)
5. Silent monitor mode, assist mode, and wrap-up mode enhancements

---

## 1. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | React 19, Vite 6 |
| Styling | TailwindCSS + shadcn/ui | TailwindCSS 4, Radix UI |
| Routing | Wouter | Latest |
| Backend | Express + tRPC | Express 4, tRPC 11 |
| Database | PostgreSQL + Drizzle ORM | PG 16, Drizzle 0.44 |
| Real-time | Ably Realtime | Latest SDK |
| Telephony | Twilio Programmable Voice + Conference API | Latest |
| AI | OpenAI GPT-4o | Via Replit AI proxy |
| Meeting Bots | Recall.ai | API v1 |
| Package Manager | pnpm | Monorepo workspace |
| Runtime | Node.js 22, TypeScript 5.9 | |

---

## 2. Project Structure

```
/
├── client/
│   └── src/
│       ├── pages/
│       │   └── BridgeConsole.tsx          ← Main Bridge Console UI (1300+ lines)
│       ├── components/                    ← Shared UI components (shadcn/ui)
│       ├── lib/
│       │   └── trpc.ts                    ← tRPC client setup
│       └── App.tsx                        ← Route definitions (bridge at /bridge, /bridge/:id)
├── server/
│   ├── _core/
│   │   ├── index.ts                       ← Express server entry point (webhooks registered here)
│   │   └── trpc.ts                        ← tRPC procedures (publicProcedure, operatorProcedure, etc.)
│   ├── routers/
│   │   └── bridgeConsoleRouter.ts         ← Bridge tRPC router (700+ lines, 25+ endpoints)
│   ├── routers.eager.ts                   ← Router registry (THIS is what the server imports, NOT routers.ts)
│   ├── routers.ts                         ← Secondary router file (keep in sync with routers.eager.ts)
│   ├── services/
│   │   └── AblyRealtimeService.ts         ← Ably publish helper
│   └── db.ts                              ← Database connection (async getDb() — MUST be awaited)
├── drizzle/
│   └── schema.ts                          ← All database table definitions (bridge tables at bottom)
└── attached_assets/
    └── extracted_webcasting/
        ├── CuraLive_Bridge_Full_Spec.md   ← Original full specification (1368 lines)
        └── CuraLive_Bridge_Console_v2.html ← Reference HTML mockup
```

---

## 3. Existing Database Schema (Already Created)

All 7 bridge tables are already created in PostgreSQL and defined in `drizzle/schema.ts`. Here is the exact schema:

```sql
-- BRIDGE EVENTS
CREATE TABLE bridge_events (
  id              SERIAL PRIMARY KEY,
  event_id        VARCHAR(255),
  name            VARCHAR(255) NOT NULL,
  organiser_name  VARCHAR(255),
  organiser_email VARCHAR(255),
  scheduled_at    TIMESTAMP,
  status          VARCHAR(50) DEFAULT 'scheduled',
  bridge_enabled  BOOLEAN DEFAULT true,
  access_code     VARCHAR(20),
  dial_in_number  VARCHAR(50),
  external_sources TEXT,              -- JSON array of URLs for Recall.ai bots
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- BRIDGE CONFERENCES (each event has a green_room + main conference)
CREATE TABLE bridge_conferences (
  id                SERIAL PRIMARY KEY,
  bridge_event_id   INTEGER REFERENCES bridge_events(id),
  twilio_conf_name  VARCHAR(255),
  twilio_conf_sid   VARCHAR(100),
  type              VARCHAR(50) NOT NULL,  -- 'green_room' | 'main'
  phase             VARCHAR(50) DEFAULT 'waiting',  -- 'waiting' | 'lobby' | 'live' | 'ended'
  is_locked         BOOLEAN DEFAULT false,
  is_recording      BOOLEAN DEFAULT false,
  qa_active         BOOLEAN DEFAULT false,
  recording_sid     VARCHAR(100),
  started_at        TIMESTAMP,
  ended_at          TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);

-- BRIDGE PARTICIPANTS
CREATE TABLE bridge_participants (
  id                      SERIAL PRIMARY KEY,
  bridge_event_id         INTEGER REFERENCES bridge_events(id),
  conference_id           INTEGER REFERENCES bridge_conferences(id),
  name                    VARCHAR(255),
  organisation            VARCHAR(255),
  phone_number            VARCHAR(50),
  role                    VARCHAR(50) DEFAULT 'participant',
    -- 'presenter' | 'participant' | 'operator' | 'observer'
  status                  VARCHAR(50) DEFAULT 'invited',
    -- 'invited' | 'dialing' | 'greeter_queue' | 'green_room' | 'lobby'
    -- | 'live' | 'muted' | 'hold' | 'left' | 'removed' | 'failed' | 'no_answer'
  twilio_call_sid         VARCHAR(100),
  twilio_participant_sid  VARCHAR(100),
  connection_method       VARCHAR(50),     -- 'phone' | 'web' | 'dial_out'
  is_muted                BOOLEAN DEFAULT true,
  is_on_hold              BOOLEAN DEFAULT false,
  hand_raised             BOOLEAN DEFAULT false,
  hand_raised_at          TIMESTAMP,
  greeted                 BOOLEAN DEFAULT false,
  notes                   TEXT,
  join_time               TIMESTAMP,
  leave_time              TIMESTAMP,
  duration_seconds        INTEGER,
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- BRIDGE GREETER QUEUE
CREATE TABLE bridge_greeter_queue (
  id                  SERIAL PRIMARY KEY,
  bridge_event_id     INTEGER REFERENCES bridge_events(id),
  conference_id       INTEGER REFERENCES bridge_conferences(id),
  twilio_call_sid     VARCHAR(100),
  phone_number        VARCHAR(50),
  voice_name_url      VARCHAR(500),
  voice_org_url       VARCHAR(500),
  transcribed_name    VARCHAR(255),
  transcribed_org     VARCHAR(255),
  status              VARCHAR(50) DEFAULT 'waiting',
    -- 'waiting' | 'admitted' | 'rejected' | 'timed_out'
  queued_at           TIMESTAMP DEFAULT NOW(),
  admitted_at         TIMESTAMP
);

-- BRIDGE Q&A QUESTIONS
CREATE TABLE bridge_qa_questions (
  id              SERIAL PRIMARY KEY,
  conference_id   INTEGER REFERENCES bridge_conferences(id),
  participant_id  INTEGER REFERENCES bridge_participants(id),
  question_text   TEXT,
  method          VARCHAR(20),   -- 'phone_keypress' | 'web_button' | 'operator_added'
  queue_position  INTEGER,
  status          VARCHAR(50) DEFAULT 'pending',
    -- 'pending' | 'approved' | 'live' | 'answered' | 'dismissed' | 'skipped'
  raised_at       TIMESTAMP DEFAULT NOW(),
  approved_at     TIMESTAMP,
  went_live_at    TIMESTAMP,
  answered_at     TIMESTAMP,
  dismissed_at    TIMESTAMP,
  operator_notes  TEXT
);

-- BRIDGE OPERATOR ACTIONS (audit log)
CREATE TABLE bridge_operator_actions (
  id              SERIAL PRIMARY KEY,
  conference_id   INTEGER,
  action          VARCHAR(100) NOT NULL,
  category        VARCHAR(50),
    -- 'operator' | 'participant' | 'conference' | 'qa' | 'assist' | 'monitor' | 'alert'
  target_id       INTEGER,
  metadata        TEXT,
  performed_at    TIMESTAMP DEFAULT NOW()
);

-- BRIDGE CALL RECORDINGS
CREATE TABLE bridge_call_recordings (
  id                SERIAL PRIMARY KEY,
  conference_id     INTEGER REFERENCES bridge_conferences(id),
  twilio_rec_sid    VARCHAR(100),
  channels          INTEGER DEFAULT 2,
  duration_sec      INTEGER,
  file_size_bytes   BIGINT,
  s3_url            VARCHAR(500),
  transcript_url    VARCHAR(500),
  transcript_text   TEXT,
  status            VARCHAR(50) DEFAULT 'processing',
    -- 'processing' | 'available' | 'failed'
  created_at        TIMESTAMP DEFAULT NOW()
);
```

---

## 4. Existing tRPC Router Endpoints (Already Built)

File: `server/routers/bridgeConsoleRouter.ts`
Registered as: `bridgeConsole` in `server/routers.eager.ts`

### Event Management
| Endpoint | Type | Description |
|----------|------|-------------|
| `bridgeConsole.createEvent` | mutation | Creates bridge event + green room + main conference |
| `bridgeConsole.getEvents` | query | Lists all bridge events (newest first) |
| `bridgeConsole.getEvent` | query | Gets full event state (event + conferences + participants + greeter queue + Q&A) |

### Conference Control
| Endpoint | Type | Description |
|----------|------|-------------|
| `bridgeConsole.openConference` | mutation | Sets phase to "live", unmutes presenters |
| `bridgeConsole.endConference` | mutation | Sets phase to "ended", marks all active participants as "left" |
| `bridgeConsole.toggleLock` | mutation | Locks/unlocks conference |
| `bridgeConsole.toggleRecording` | mutation | Starts/stops recording flag |
| `bridgeConsole.toggleQA` | mutation | Opens/closes Q&A mode |

### Greeter Queue
| Endpoint | Type | Description |
|----------|------|-------------|
| `bridgeConsole.getGreeterQueue` | query | Lists waiting callers for a conference |
| `bridgeConsole.admitCaller` | mutation | Moves caller from greeter queue to main conference as participant |
| `bridgeConsole.rejectCaller` | mutation | Rejects caller from queue |
| `bridgeConsole.editGreeter` | mutation | Edits name/organisation before admitting |

### Participant Management
| Endpoint | Type | Description |
|----------|------|-------------|
| `bridgeConsole.dialOut` | mutation | Creates participant and initiates outbound call |
| `bridgeConsole.muteParticipant` | mutation | Mutes/unmutes with relational scoping |
| `bridgeConsole.holdParticipant` | mutation | Holds/unholds with relational scoping |
| `bridgeConsole.removeParticipant` | mutation | Removes participant with relational scoping |
| `bridgeConsole.updateParticipant` | mutation | Edits name/org/role/notes |
| `bridgeConsole.muteAll` | mutation | Mutes all non-presenter participants |
| `bridgeConsole.unmuteAll` | mutation | Unmutes all participants |

### Q&A Queue
| Endpoint | Type | Description |
|----------|------|-------------|
| `bridgeConsole.raiseHand` | mutation | Creates Q&A question record |
| `bridgeConsole.approveQuestion` | mutation | Approves question with relational scoping |
| `bridgeConsole.takeQuestion` | mutation | Takes question live, unmutes participant |
| `bridgeConsole.doneQuestion` | mutation | Marks answered, remutes participant |
| `bridgeConsole.dismissQuestion` | mutation | Dismisses question |
| `bridgeConsole.skipQuestion` | mutation | Moves question to end of queue |

### Operator Log & Reports
| Endpoint | Type | Description |
|----------|------|-------------|
| `bridgeConsole.getOperatorLog` | query | Returns last 200 log entries for conference |
| `bridgeConsole.addLogEntry` | mutation | Manually adds operator log entry |
| `bridgeConsole.getAttendanceReport` | query | Generates full attendance report with Q&A summary |
| `bridgeConsole.addInvitedParticipant` | mutation | Pre-registers a participant before the event |

---

## 5. Existing React UI (Already Built)

File: `client/src/pages/BridgeConsole.tsx` (~1300 lines)
Route: `/bridge` (no event selected) and `/bridge/:id` (deep link to specific event)

### UI Layout
```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER: CuraLive logo | Event name | Phase pill (LOBBY/LIVE/   │
│          ENDED) | Duration timer | Operator state dropdown |    │
│          REC indicator | Lock indicator                          │
├──────────────┬─────────────────────────┬────────────────────────┤
│ GREETER      │ PARTICIPANTS            │ PARTICIPATION QUEUE    │
│ QUEUE        │                         │ (Q&A)                  │
│              │ Filter strip:           │                        │
│ Caller cards │ All|Speakers|Attendees  │ Question cards with    │
│ with voice   │ |Muted|Live|Hold|Hand   │ Approve/Take/Done/     │
│ playback,    │ Raised                  │ Dismiss/Skip buttons   │
│ name/org     │                         │                        │
│ editing,     │ Presenter section       │ ──────────────────     │
│ admit/reject │ Participant section     │ OPERATOR EVENT LOG     │
│              │ Dial-out form           │ Category-coded entries │
│              │ Assist panel            │                        │
├──────────────┴─────────────────────────┴────────────────────────┤
│  FOOTER: Open Conference / End Call | Open Q&A | Monitor |      │
│          Mute All | Announce | Lock | Record | Signal indicator  │
└──────────────────────────────────────────────────────────────────┘
```

### Key UI Features Already Implemented
- Event selector with "New Bridge Event" creation form
- Phase pill with colour coding (teal=LOBBY, green=LIVE, red=ENDED)
- Duration timer that counts up from conference start
- Operator state dropdown (Available, In Event, On Assist, On Break, Handoff, Wrap Up)
- Greeter queue with caller cards, voice playback buttons, editable name/org, role selector, admit/reject
- Participant roster sorted by role (presenters first), with per-person mute/hold/remove buttons
- Filter strip with All/Speakers/Attendees/Muted/Live/Hold/Hand Raised toggles
- Dial-out form (name, organisation, phone, role, CALL button)
- Assist panel with issue labels and action buttons
- Q&A queue with approve/take/done/dismiss/skip buttons
- Operator event log with category colour coding
- Footer controls for all conference operations
- 3-second polling for real-time state updates
- Toast notifications for all actions

---

## 6. WHAT NEEDS TO BE BUILT — Task Breakdown

### Task A: Twilio Webhook Handlers (T003 from session plan)

These Express routes handle the actual telephony integration. They must be added to `server/_core/index.ts` BEFORE the `express.json()` middleware for proper request handling.

**Routes to implement:**

```
POST /api/bridge/inbound
  - Fires when participant dials PSTN number
  - Look up event by access code (sent as DTMF digits)
  - Serve TwiML: welcome message → Record name (maxLength 8s, transcribe=true)
  - transcribeCallback: /api/bridge/name-transcribed

POST /api/bridge/name-captured
  - Fires after name recording completes
  - Store RecordingUrl in memory/temp
  - Serve TwiML: company prompt → Record company (maxLength 8s, transcribe=true)
  - transcribeCallback: /api/bridge/org-transcribed

POST /api/bridge/org-captured
  - Fires after company recording completes
  - Create bridge_greeter_queue record with:
    - voice_name_url = first recording URL
    - voice_org_url = this recording URL
    - phone_number = req.body.From
    - twilio_call_sid = req.body.CallSid
    - Look up event from access code context
  - Serve TwiML: "Please hold" → <Dial><Conference> greeter queue (muted, hold music)
  - Publish Ably event: greeter:new

POST /api/bridge/name-transcribed
  - Async callback when Twilio finishes transcription
  - Update bridge_greeter_queue.transcribed_name
  - Publish Ably event: greeter:transcription

POST /api/bridge/org-transcribed
  - Same as above for organisation
  - Update bridge_greeter_queue.transcribed_org

POST /api/bridge/participant-dtmf
  - Fires when DTMF digits detected on participant call leg
  - If Digits === '*2' (star-2):
    - Find participant by CallSid
    - Set hand_raised = true
    - Create bridge_qa_questions record with method='phone_keypress'
    - Publish Ably event: qa:raised
  - Respond with empty <Response/>

POST /api/bridge/conference-status
  - Fires for conference events: start, end, join, leave, recording
  - StatusCallbackEvent values:
    - 'conference-start' → update bridge_conferences.started_at
    - 'conference-end' → update bridge_conferences phase='ended', ended_at
    - 'participant-join' → update bridge_participants status/join_time
    - 'participant-leave' → update status='left', leave_time, calculate duration
    - 'recording-completed' → create bridge_call_recordings record
  - Publish appropriate Ably events

POST /api/bridge/call-status
  - Fires for dial-out call status changes
  - CallStatus values:
    - 'ringing' → participant status='dialing'
    - 'in-progress' → participant status='lobby'
    - 'completed' → update leave_time, duration
    - 'failed'/'busy'/'no-answer' → participant status='failed'/'failed'/'no_answer'
  - Publish Ably events for each transition
```

**Critical implementation notes:**
- All Twilio webhooks must validate request signatures using `twilio.validateRequest()`
- Use `twilio` npm package for TwiML generation: `new VoiceResponse()`
- Twilio sends `application/x-www-form-urlencoded` bodies (not JSON)
- Express needs `express.urlencoded({ extended: true })` for these routes
- Environment variables needed: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Task B: Twilio Conference API Integration

The existing tRPC mutations (mute, hold, remove, dial-out, etc.) currently only update the database. They need to also call the Twilio REST API to actually control the conference.

**Add Twilio API calls to these existing mutations:**

```javascript
// In bridgeConsoleRouter.ts, add to openConference:
// - Call Twilio to start conference recording
// - Update conference with recording_sid

// In muteParticipant:
// - POST /Conferences/{confSid}/Participants/{participantSid} with muted=true/false

// In holdParticipant:
// - POST /Conferences/{confSid}/Participants/{participantSid} with hold=true/false

// In removeParticipant:
// - DELETE /Conferences/{confSid}/Participants/{participantSid}

// In dialOut:
// - POST /Calls to create outbound call
// - TwiML URL that puts caller into conference

// In muteAll/unmuteAll:
// - Loop through all participant Twilio SIDs and update
```

**Twilio REST API pattern:**
```javascript
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Mute a participant
await client.conferences(confSid)
  .participants(participantSid)
  .update({ muted: true });

// Remove a participant
await client.conferences(confSid)
  .participants(participantSid)
  .remove();

// Start recording
const recording = await client.conferences(confSid)
  .recordings.create({ recordingChannels: 'dual' });

// Dial out
const call = await client.calls.create({
  to: phoneNumber,
  from: process.env.TWILIO_PHONE_NUMBER,
  url: `${WEBHOOK_BASE_URL}/api/bridge/connect-to-conference?confName=${confName}`,
  statusCallback: `${WEBHOOK_BASE_URL}/api/bridge/call-status`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
});
```

### Task C: Twilio Client SDK — Operator Softphone

The operator needs a browser-based softphone to join conferences without a PSTN line.

**Implementation:**
1. Add capability token endpoint:
```javascript
// In bridgeConsoleRouter.ts or as Express route:
// POST /api/bridge/operator-token
// Returns Twilio Capability Token (or Access Token for new SDK)
// Grant: voice outgoing, voice incoming
```

2. Add React component `<OperatorSoftphone />`:
```
- Uses @twilio/voice-sdk in browser
- Connects operator to conference as participant with special flags:
  - startConferenceOnEnter: true (operator starts the conference)
  - endConferenceOnExit: false (conference persists if operator drops)
  - muted: false (operator can always speak)
  - beep: false (no beep when operator joins)
- Show connection status indicator
- Volume controls
- Mute toggle (operator self-mute)
```

### Task D: Auto Recall.ai Bot Deployment

When a bridge event is created with `externalSources` URLs, automatically deploy Recall.ai bots.

**Implementation in `bridgeConsoleRouter.ts` createEvent mutation:**
```javascript
// After creating the event, check for externalSources
if (input.externalSources?.length) {
  for (const url of input.externalSources) {
    // Deploy Recall.ai bot to each URL
    const response = await fetch('https://us-west-2.recall.ai/api/v1/bot', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_url: url,
        bot_name: `CuraLive Bridge - ${input.name}`,
        transcription_options: { provider: 'default' },
        real_time_transcription: {
          destination_url: `${WEBHOOK_BASE_URL}/api/recall/webhook`,
          partial_results: false,
        },
      }),
    });
    // Store bot ID in bridge_events or a separate table
  }
}
```

**Important:** The Recall.ai webhook is already registered at `POST /api/recall/webhook` in `server/_core/index.ts`. It handles transcription data and feeds it into the Shadow Mode AI pipeline. No changes needed to the webhook handler itself.

### Task E: Post-Call Package

Generate downloadable attendance reports and recordings after a call ends.

**Implementation:**
1. The `getAttendanceReport` query already exists — it returns structured data
2. Add CSV export endpoint:
```javascript
// bridgeConsole.exportAttendanceCSV mutation
// - Query all participants for the conference
// - Generate CSV with columns: Name, Organisation, Role, Phone (masked), Join Method,
//   Status, Join Time, Leave Time, Duration, Hand Raised, Greeted
// - Write to /exports/ directory
// - Return download URL
```

3. Add PDF export (optional):
```javascript
// Use a library like pdfkit or html-pdf
// Template: Event header, summary stats, participant table, Q&A summary, recording link
```

4. Recording delivery:
```javascript
// After conference ends and recording finalises:
// - Store Twilio recording URL in bridge_call_recordings
// - Generate signed download URL
// - Optionally send email to organiser with report + recording link
```

---

## 7. Real-Time Architecture (Ably)

All state changes publish to Ably channel `bridge-{conferenceId}`. The client polls every 3 seconds as a fallback, but Ably provides sub-second updates.

**Existing publish helper:**
```javascript
async function publishBridgeEvent(conferenceId, eventType, data) {
  const { AblyRealtimeService } = await import("../services/AblyRealtimeService");
  await AblyRealtimeService.publishToEvent(`bridge-${conferenceId}`, eventType, data);
}
```

**Event types published:**
- `conference:opened`, `conference:ended`, `conference:lock`
- `conference:recording`, `conference:qa`
- `participant:admitted`, `participant:updated`, `participant:removed`, `participant:dialing`
- `greeter:new`, `greeter:admitted`, `greeter:rejected`, `greeter:transcription`
- `qa:raised`, `qa:approved`, `qa:live`, `qa:done`, `qa:dismissed`, `qa:skipped`

**Ably double-stringification warning:** The AblyRealtimeService does `data: JSON.stringify({ type, data })`. The client must double-parse: first parse the Ably message data string, then parse the inner JSON.

---

## 8. Environment Variables Required

```
# Already configured:
DATABASE_URL=postgresql://...          ← PostgreSQL connection string
ABLY_API_KEY=...                       ← Real-time messaging
JWT_SECRET=...                         ← Session tokens
RECALL_AI_API_KEY=...                  ← Meeting bot API
RECALL_AI_WEBHOOK_SECRET=...           ← Webhook HMAC verification

# Need to be added for Bridge telephony:
TWILIO_ACCOUNT_SID=ACxxxxxxxx          ← Twilio account
TWILIO_AUTH_TOKEN=xxxxxxxx             ← Twilio auth
TWILIO_PHONE_NUMBER=+44XXXXXXXXXX      ← PSTN dial-in number
TWILIO_TWIML_APP_SID=APxxxxxxxx        ← For Client SDK
TWILIO_API_KEY=SKxxxxxxxx              ← For Access Tokens
TWILIO_API_SECRET=xxxxxxxx             ← For Access Tokens
WEBHOOK_BASE_URL=https://...           ← Public HTTPS domain for Twilio callbacks
```

---

## 9. Critical Implementation Rules

1. **Router registration:** New tRPC routers MUST be registered in BOTH `server/routers.eager.ts` AND `server/routers.ts`. The server imports from `routers.eager.ts` — if you only add to `routers.ts`, the procedures will return "not found".

2. **Database access:** `getDb()` is ASYNC — you MUST `await` it:
   ```javascript
   const db = await getDb();  // CORRECT
   const db = getDb();         // WRONG — returns Promise, not db instance
   ```

3. **tRPC imports:** Always use `"../_core/trpc"` for tRPC procedure imports.

4. **Recall.ai webhook:** The webhook handler at `/api/recall/webhook` MUST be registered BEFORE `express.json()` middleware because it needs the raw body for HMAC-SHA256 signature verification.

5. **Ably channel naming:** Bridge events use channel `bridge-{conferenceId}` (numeric conference ID, not event ID).

6. **Relational scoping:** All mutations that modify participants, questions, or greeters MUST verify the entity belongs to the claimed conference. Use compound WHERE clauses:
   ```javascript
   .where(and(eq(table.id, entityId), eq(table.conferenceId, conferenceId)))
   ```

7. **Downloads:** Always put downloadable files in the `exports/` directory.

8. **Schema changes:** Use raw SQL via `node -e` with `pg` Pool for any new table creation. Do NOT use `drizzle-kit push` (requires interactive terminal). Example:
   ```javascript
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.DATABASE_URL });
   await pool.query(`CREATE TABLE IF NOT EXISTS ...`);
   ```

9. **Operator auth:** Use `operatorProcedure` for all bridge mutations. It validates the user has `operator` or `admin` role. In development mode (`NODE_ENV=development`), it auto-bypasses to a dev user.

10. **Phone number masking:** Phone numbers displayed in the UI must be masked: `+44 7XXX XXXX 321` (show first 3 and last 3 digits only).

---

## 10. Build Order (Recommended Phases)

### Phase 1 — Twilio Core (Priority)
1. Add Twilio npm package: `pnpm add twilio`
2. Implement inbound call webhook (`/api/bridge/inbound`) with IVR TwiML
3. Implement name-captured and org-captured webhooks
4. Implement greeter queue placement (caller → hold music → operator sees card)
5. Wire admit/reject to Twilio API (move caller between conferences)
6. Wire mute/hold/remove to Twilio Participants API
7. Implement dial-out with Twilio Calls API
8. Implement conference-status webhook for join/leave/recording events

### Phase 2 — Operator Softphone
9. Add `@twilio/voice-sdk` to client
10. Create operator token endpoint
11. Build `<OperatorSoftphone />` React component
12. Integrate into BridgeConsole.tsx header/footer

### Phase 3 — Advanced Features
13. DTMF *2 hand-raise detection
14. Twilio transcription callbacks for greeter name/org
15. Conference recording start/stop/pause/resume via Twilio API
16. Silent monitor mode (operator joins as muted listener)

### Phase 4 — Post-Call
17. CSV attendance report export
18. Recording download links (signed URLs)
19. Email report delivery to organiser
20. Auto Recall.ai bot deployment on event creation

### Phase 5 — Polish
21. Wrap-up mode panel after call ends
22. Multi-operator co-presence indicators
23. Audio assets (TTS welcome/hold/rejection messages)
24. Phone number encryption at rest

---

## 11. Audio Assets Needed

These audio files need to be produced (ElevenLabs TTS or professional voice) and hosted on S3/object storage:

| File | Content |
|------|---------|
| `welcome.mp3` | "Welcome to the CuraLive event. An operator will greet you shortly. Please state your full name after the tone." |
| `company-prompt.mp3` | "Thank you. Please state your company name after the tone." |
| `please-hold.mp3` | "Thank you. Please hold. An operator will be with you shortly." |
| `hold-music.mp3` | Professional hold music, loops |
| `qa-open.mp3` | "We will now take questions. To raise your hand, press star two on your keypad." |
| `qa-close.mp3` | "We are closing the question queue. Thank you to everyone who participated." |
| `call-opening.mp3` | "Good morning. Thank you for joining today's event. The call will now begin." |
| `call-closing.mp3` | "Thank you for joining today's event. This concludes the call." |
| `rejection.mp3` | "We're sorry, we are unable to place you on today's call. Thank you for calling." |

---

## 12. Security Checklist

- [ ] All Twilio webhook endpoints validate request signature
- [ ] Phone numbers stored encrypted at rest (AES-256)
- [ ] Phone numbers displayed masked in UI
- [ ] Voice recordings stored with signed URLs (1-hour expiry)
- [ ] Conference access code is 8 random digits, regenerated per event
- [ ] Recording consent announcement plays before recording starts
- [ ] All API calls require valid operator session
- [ ] Conference can be locked to prevent new joiners
- [ ] Greeter queue prevents unauthorised direct entry to main conference
- [ ] All mutations have relational scoping (entity must belong to claimed conference)

---

## 13. Reference Files

For the complete original specification with all details, diagrams, and edge cases, refer to:
- `attached_assets/extracted_webcasting/CuraLive_Bridge_Full_Spec.md` (1368 lines)
- `attached_assets/extracted_webcasting/CuraLive_Bridge_Console_v2.html` (reference HTML mockup)

For the existing implementation:
- `server/routers/bridgeConsoleRouter.ts` — Complete tRPC router (read this first)
- `client/src/pages/BridgeConsole.tsx` — Complete React UI
- `drizzle/schema.ts` — Search for "bridge" to find all 7 table definitions
- `server/_core/index.ts` — Express server entry (add webhooks here)

---

*End of Manus execution brief.*
