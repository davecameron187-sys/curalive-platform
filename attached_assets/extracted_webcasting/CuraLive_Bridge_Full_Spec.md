# CuraLive WebPhone / Bridge — Complete White-Glove Service Specification

**For Manus — execute this in full. This is the definitive spec for the bridge backend and its console UI panel.**

---

## What we are building

A professional operator-assisted conference bridge service that competes directly with Chorus Call, BroadData, and Communique Conferencing. The operator runs every call from the CuraLive console. Participants never self-manage anything. The operator greets every caller, captures their name and company, places them appropriately, runs the call in lecture mode, manages Q&A, and produces a full attendance report after.

This is not a generic conference call tool. It is a white-glove service console — every feature exists to make the operator faster, more precise, and more professional.

---

## The five things that define white-glove bridge service

Research across Chorus Call, BroadData, Communique, CIA Omnigage, and Confertel shows every serious provider does these five things. CuraLive must do all five:

**1. Greeter workflow** — every caller is answered by the operator, their name and company captured before they enter the conference. They never self-join into a live call.

**2. Green room / sub-conference** — presenters meet privately with the operator before the call opens. Participants hear hold music until the operator opens the main conference.

**3. Lecture mode by default** — all participant lines muted when the call opens. Only the presenter speaks. Operator controls who gets unmuted.

**4. Managed Q&A queue** — participants raise their hand (via phone keypress or web), operator sees a prioritisable queue, selects who goes live, unmutes them, remutes after. Queue is reorderable in real time.

**5. Post-call package** — attendance report with name, company, join/leave time, duration. Recording delivered. Optional transcript.

---

## Architecture

```
INBOUND DIAL-IN FLOW
Participant dials PSTN number
  → Twilio answers call
  → IVR: "Please state your name after the tone" (voice capture)
  → IVR: "Please state your company after the tone" (voice capture)
  → Participant placed in GREETER QUEUE (hold music plays)
  → Webhook fires to CuraLive backend
  → Backend pushes to operator console: new caller in queue
  → Operator sees caller card: phone number, captured name, company
  → Operator clicks ADMIT → caller moved to main conference (muted)
  → OR operator clicks DIAL OUT from roster → system calls participant

OUTBOUND DIAL-OUT FLOW
Operator loads pre-registered participant from roster
  → Clicks DIAL OUT
  → Twilio calls participant's number
  → Participant answers
  → Twilio announces: "Connecting you to the CuraLive event"
  → Participant placed directly into conference (muted by default)
  → Console shows participant status update in real time

OPERATOR AUDIO CONNECTION
Operator uses Twilio Client SDK (browser-based softphone)
  → No PSTN required for operator
  → Operator joins conference via browser
  → Operator can speak to all, or whisper to one participant only
  → Operator has backdoor line: private channel to presenter only
```

---

## Backend stack — confirmed

- **Telephony:** Twilio Programmable Voice + Conference API
- **Operator softphone:** Twilio Client SDK (browser WebRTC)
- **Real-time events:** WebSocket server (Node.js ws library or Socket.io)
- **Database:** PostgreSQL
- **API server:** Node.js / Express
- **Storage:** AWS S3 (recordings, voice captures)
- **Queue:** Redis (greeter queue, Q&A queue state)

---

## Database schema — complete

```sql
-- EVENTS
CREATE TABLE events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(255) NOT NULL,
  organiser_name    VARCHAR(255),
  organiser_email   VARCHAR(255),
  scheduled_at      TIMESTAMPTZ,
  status            VARCHAR(50) DEFAULT 'scheduled',
  -- values: scheduled | pre_call | live | ended
  bridge_enabled    BOOLEAN DEFAULT true,
  access_code       VARCHAR(20),         -- 8-digit PSTN passcode
  dial_in_number    VARCHAR(50),         -- PSTN number participants dial
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- CONFERENCES (each event has a green_room + main conference)
CREATE TABLE conferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID REFERENCES events(id),
  twilio_conf_sid   VARCHAR(100) UNIQUE,  -- CF... from Twilio
  type              VARCHAR(50) NOT NULL,  -- green_room | main
  phase             VARCHAR(50) DEFAULT 'waiting',
  -- values: waiting | lobby | live | ended
  recording_sid     VARCHAR(100),
  recording_url     VARCHAR(500),
  dual_channel_rec  BOOLEAN DEFAULT true,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- PARTICIPANTS (pre-registered roster + walk-ins)
CREATE TABLE participants (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              UUID REFERENCES events(id),
  conference_id         UUID REFERENCES conferences(id),
  name                  VARCHAR(255),         -- captured by operator or greeter IVR
  organisation          VARCHAR(255),         -- captured by operator or greeter IVR
  phone_number          VARCHAR(50),          -- E.164, encrypted at rest
  role                  VARCHAR(50) DEFAULT 'participant',
  -- values: presenter | participant | operator | observer
  status                VARCHAR(50) DEFAULT 'invited',
  -- values: invited | dialing | greeter_queue | green_room | lobby
  --         | live | muted | hold | left | removed | failed | no_answer
  twilio_call_sid       VARCHAR(100),         -- CA... from Twilio
  twilio_participant_sid VARCHAR(100),
  voice_capture_url     VARCHAR(500),         -- S3 URL of name recording
  join_time             TIMESTAMPTZ,
  leave_time            TIMESTAMPTZ,
  duration_seconds      INTEGER,
  greeted               BOOLEAN DEFAULT false,
  hand_raised           BOOLEAN DEFAULT false,
  hand_raised_at        TIMESTAMPTZ,
  qa_position           INTEGER,              -- position in Q&A queue (null = not queued)
  notes                 TEXT,                 -- operator private notes
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Q&A QUESTIONS
CREATE TABLE qa_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   UUID REFERENCES conferences(id),
  participant_id  UUID REFERENCES participants(id),
  question_text   TEXT,          -- typed question if web-join, else null
  method          VARCHAR(20),   -- phone_keypress | web_button | operator_added
  queue_position  INTEGER,       -- operator can reorder
  status          VARCHAR(50) DEFAULT 'pending',
  -- values: pending | approved | live | answered | dismissed | skipped
  raised_at       TIMESTAMPTZ DEFAULT NOW(),
  approved_at     TIMESTAMPTZ,
  went_live_at    TIMESTAMPTZ,
  answered_at     TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  operator_notes  TEXT
);

-- GREETER QUEUE (transient — callers waiting to be admitted)
CREATE TABLE greeter_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id),
  twilio_call_sid VARCHAR(100) UNIQUE,
  phone_number    VARCHAR(50),
  voice_name_url  VARCHAR(500),   -- Twilio recording of stated name
  voice_org_url   VARCHAR(500),   -- Twilio recording of stated company
  transcribed_name VARCHAR(255),  -- Twilio transcription attempt
  transcribed_org  VARCHAR(255),
  status          VARCHAR(50) DEFAULT 'waiting',
  -- values: waiting | admitted | rejected | timed_out
  queued_at       TIMESTAMPTZ DEFAULT NOW(),
  admitted_at     TIMESTAMPTZ
);

-- OPERATOR ACTIONS LOG
CREATE TABLE operator_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   UUID REFERENCES conferences(id),
  operator_id     VARCHAR(255),
  action          VARCHAR(100) NOT NULL,
  target_id       UUID,           -- participant_id or qa_question_id
  metadata        JSONB,
  performed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- CALL RECORDINGS
CREATE TABLE call_recordings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id   UUID REFERENCES conferences(id),
  twilio_rec_sid  VARCHAR(100),
  channels        INTEGER DEFAULT 2,  -- 1=mixed, 2=dual channel
  duration_sec    INTEGER,
  file_size_bytes BIGINT,
  s3_url          VARCHAR(500),
  transcript_url  VARCHAR(500),
  transcript_text TEXT,
  status          VARCHAR(50) DEFAULT 'processing',
  -- values: processing | available | failed
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Inbound call flow — step by step

This is the most important flow. Every inbound caller goes through this before the operator sees them.

### Step 1 — Caller dials PSTN number

Twilio answers. Backend serves TwiML:

```xml
<Response>
  <Play>https://s3.curalive.com/audio/welcome.mp3</Play>
  <!-- "Welcome to the CuraLive event. Please state your name after the tone." -->
  <Record
    action="/webhooks/twilio/name-captured"
    maxLength="8"
    playBeep="true"
    transcribe="true"
    transcribeCallback="/webhooks/twilio/name-transcribed"
  />
</Response>
```

### Step 2 — Name captured

```xml
<!-- After name recording, prompt for company -->
<Response>
  <Play>https://s3.curalive.com/audio/company-prompt.mp3</Play>
  <!-- "Please state your company name after the tone." -->
  <Record
    action="/webhooks/twilio/org-captured"
    maxLength="8"
    playBeep="true"
    transcribe="true"
    transcribeCallback="/webhooks/twilio/org-transcribed"
  />
</Response>
```

### Step 3 — Place in greeter queue

```xml
<!-- After org recording, place caller in greeter queue conference room -->
<Response>
  <Play>https://s3.curalive.com/audio/please-hold.mp3</Play>
  <!-- "Thank you. An operator will be with you shortly." -->
  <Dial>
    <Conference
      friendlyName="greeter-queue-{event_id}"
      startConferenceOnEnter="false"
      endConferenceOnExit="false"
      waitUrl="https://s3.curalive.com/audio/hold-music.mp3"
      waitMethod="GET"
      muted="true"
    />
  </Dial>
</Response>
```

### Step 4 — Backend pushes to operator console

```javascript
// Webhook handler fires, creates greeter_queue record
// Emits WebSocket event to operator console:
{
  type: 'greeter_queue_new',
  caller: {
    id: 'gq-uuid',
    call_sid: 'CA...',
    phone_number: '+44XXXXXXXXXX',
    voice_name_url: 'https://...',     // play button in console
    voice_org_url: 'https://...',
    transcribed_name: 'James Mitchell', // may be inaccurate
    transcribed_org: 'Fidelity',
    queued_at: '2026-04-01T09:02:14Z'
  }
}
```

### Step 5 — Operator processes caller in greeter queue

Operator sees the caller card in the GREETER QUEUE panel. They:
- Play the voice recording to hear the name/company stated
- Edit transcription if inaccurate (editable text fields)
- Select participant role (Presenter / Participant / Observer)
- Click ADMIT → caller moved to main conference (muted)
- OR click REJECT → caller removed from queue with polite message

### Step 6 — Admit action (server-side)

```javascript
// POST /api/bridge/greeter/:id/admit
// Body: { name, organisation, role, conference_id }

// 1. Create participant record
// 2. Move caller from greeter conference to main conference:
//    POST /Conferences/{greeter_conf_sid}/Participants/{call_sid}
//    → update conference to main_conf_sid
// 3. Set muted=true in main conference
// 4. Emit WebSocket: { type: 'participant_admitted', participant }
// 5. Update greeter_queue record: status = 'admitted'
```

---

## All API endpoints — complete

### Conference management
```
POST   /api/bridge/conference/create
       Body: { event_id }
       Action: Creates both green_room and main Twilio conferences
       Returns: { green_room_id, main_id, dial_in_number, access_code }

POST   /api/bridge/conference/:id/open
       Action: Moves main conference from lobby → live
               Unmutes all presenters
               Announces: "Good morning. The call will now begin."
               Starts recording
       Returns: { phase: 'live', started_at }

POST   /api/bridge/conference/:id/end
       Action: Plays closing announcement
               Ends Twilio conference
               Triggers recording finalisation
               Generates attendance report
       Returns: { ended_at, participant_count, duration_sec }

POST   /api/bridge/conference/:id/lock
       Action: No new participants can enter the conference
       Returns: { locked: true }

POST   /api/bridge/conference/:id/unlock
       Returns: { locked: false }

POST   /api/bridge/conference/:id/announce
       Body: { text }
       Action: Uses Twilio <Play> to play TTS announcement to all
       Returns: { announced: true }

GET    /api/bridge/conference/:id/status
       Returns: { phase, participant_count, duration_sec,
                  recording_active, locked, qa_active }
```

### Greeter queue
```
GET    /api/bridge/greeter/:event_id/queue
       Returns: array of waiting callers with voice capture URLs

POST   /api/bridge/greeter/:id/admit
       Body: { name, organisation, role, conference_id }
       Action: Moves caller from greeter queue to main conference (muted)
       Returns: { participant_id, status: 'lobby' }

POST   /api/bridge/greeter/:id/reject
       Action: Plays rejection message, ends caller's leg
       Returns: { status: 'rejected' }

GET    /api/bridge/greeter/:id/play-name
       Returns: { audio_url }  -- signed S3 URL for voice recording

PATCH  /api/bridge/greeter/:id/edit
       Body: { name, organisation }
       Action: Edits transcription before admitting
       Returns: { updated: true }
```

### Participant management
```
GET    /api/bridge/conference/:id/participants
       Returns: full participant array, sorted:
                presenters first → participants by join time → observers
                Each participant includes: status, role, muted, hold,
                hand_raised, qa_position, notes, join_time, duration

POST   /api/bridge/participant/dialout
       Body: { conference_id, name, organisation, phone_number, role }
       Action: Creates participant record
               Calls Twilio dial-out to phone_number
               Adds directly to conference muted
       Returns: { participant_id, call_sid, status: 'dialing' }

POST   /api/bridge/participant/:id/mute
       Action: POST Twilio Participants/:sid muted=true
       Returns: { status: 'muted' }

POST   /api/bridge/participant/:id/unmute
       Action: POST Twilio Participants/:sid muted=false
       Returns: { status: 'live' }

POST   /api/bridge/participant/:id/hold
       Action: POST Twilio Participants/:sid hold=true
               Participant hears hold music, disconnected from conference audio
       Returns: { status: 'hold' }

POST   /api/bridge/participant/:id/unhold
       Returns: { status: 'live' }

POST   /api/bridge/participant/:id/remove
       Action: DELETE Twilio Participants/:sid
               Plays message to caller: "Thank you for joining. Goodbye."
               Updates status to 'removed'
       Returns: { status: 'removed' }

POST   /api/bridge/participant/:id/transfer
       Body: { to_conference_id }
       Action: Warm transfer — add to new conference, then remove from current
       Returns: { transferred: true }

POST   /api/bridge/conference/:id/mute-all
       Action: Mutes all participants (not presenters, not operator)
       Returns: { muted_count: N }

POST   /api/bridge/conference/:id/unmute-all
       Action: Unmutes all participants
       Returns: { unmuted_count: N }

PATCH  /api/bridge/participant/:id
       Body: { notes, name, organisation, role }
       Action: Updates participant record (operator edits)
       Returns: { updated: true }
```

### Q&A management — the complete flow
```
GET    /api/bridge/conference/:id/qa
       Returns: ordered array of questions by queue_position
                Each includes: participant name/org, method, status,
                               raised_at, question_text (if web)

POST   /api/bridge/conference/:id/qa/open
       Action: Announces Q&A open to all participants
               "We will now take questions. Press *2 to raise your hand."
               Sets conference qa_active = true
       Returns: { qa_active: true }

POST   /api/bridge/conference/:id/qa/close
       Action: Announces Q&A closed
               Sets conference qa_active = false
       Returns: { qa_active: false }

POST   /api/bridge/qa/:id/approve
       Action: Sets status = 'approved', assigns next queue_position
       Returns: { status: 'approved', queue_position: N }

POST   /api/bridge/qa/:id/reorder
       Body: { new_position }
       Action: Reorders question in queue, shifts others accordingly
       Returns: { queue_position: N }

POST   /api/bridge/qa/:id/take
       Action: Sets status = 'live'
               Unmutes the participant via Twilio
               Mutes all other non-presenter participants
               Announces: "We will now take a question from [name] at [org]"
       Returns: { status: 'live', participant_unmuted: true }

POST   /api/bridge/qa/:id/done
       Action: Sets status = 'answered'
               Remutes the participant
               Emits WS event so console can advance queue
       Returns: { status: 'answered' }

POST   /api/bridge/qa/:id/dismiss
       Returns: { status: 'dismissed' }

POST   /api/bridge/qa/:id/skip
       Action: Moves question to end of queue
       Returns: { status: 'skipped', new_position: N }

POST   /api/bridge/qa/raise
       Body: { conference_id, participant_id, question_text, method }
       Action: Creates qa_question record with status 'pending'
               Emits WebSocket event to operator console
       Returns: { question_id }
```

### Reports and recordings
```
GET    /api/bridge/conference/:id/report
       Returns: full attendance report (see schema below)

POST   /api/bridge/conference/:id/report/export
       Action: Generates CSV, uploads to S3
       Returns: { download_url, expires_at }

GET    /api/bridge/conference/:id/recording
       Returns: { status, url, duration_sec, file_size_mb, channels }

POST   /api/bridge/conference/:id/recording/start
       Action: Starts recording mid-call (if not already started)
       Returns: { recording_sid }

POST   /api/bridge/conference/:id/recording/stop
       Returns: { recording_sid, status: 'processing' }

POST   /api/bridge/conference/:id/recording/pause
       Returns: { paused: true }

POST   /api/bridge/conference/:id/recording/resume
       Returns: { paused: false }
```

---

## DTMF hand-raise — how *2 works

When Q&A is open, participants on PSTN can press *2 to raise their hand. This requires a separate listener per participant call leg.

```javascript
// When participant joins conference, their call has a callback URL:
// statusCallback: '/webhooks/twilio/participant-dtmf'

// Webhook fires when Twilio detects DTMF:
app.post('/webhooks/twilio/participant-dtmf', (req, res) => {
  const { CallSid, Digits } = req.body;
  if (Digits === '2') {
    // Find participant by call_sid
    // Create qa_question record with method='phone_keypress'
    // Update participant: hand_raised=true
    // Emit WebSocket: { type: 'qa_raised', question }
  }
  res.send('<Response/>'); // no-op TwiML
});
```

---

## Twilio webhook handlers

All webhooks must be validated using Twilio request signature before processing.

```
POST /webhooks/twilio/inbound-call
  Fires: when participant dials the PSTN number
  Action: Serves IVR TwiML for name/company capture

POST /webhooks/twilio/name-captured
  Fires: after name recording completes
  Body: RecordingUrl, RecordingSid, Digits (if any)
  Action: Store recording URL, serve company prompt TwiML

POST /webhooks/twilio/org-captured
  Fires: after company recording completes
  Action: Store recording URL, place caller in greeter queue
          Create greeter_queue record
          Emit WS: { type: 'greeter_queue_new', caller }

POST /webhooks/twilio/name-transcribed
  Fires: when Twilio transcription of name is complete (async)
  Action: Update greeter_queue.transcribed_name
          Emit WS: { type: 'greeter_transcription', id, field: 'name', text }

POST /webhooks/twilio/org-transcribed
  Action: Update greeter_queue.transcribed_org
          Emit WS: { type: 'greeter_transcription', id, field: 'org', text }

POST /webhooks/twilio/conference-status
  Fires: conference-start, conference-end, participant-join, participant-leave, recording-complete
  Handler:
    conference-start → update conferences.started_at, emit WS conference_started
    participant-join → update participants status/join_time, emit WS participant_joined
    participant-leave → update status/leave_time/duration, emit WS participant_left
    recording-complete → fetch URL from Twilio, store in call_recordings, emit WS recording_ready

POST /webhooks/twilio/call-status
  Fires: for dial-out calls — initiated, ringing, answered, completed, failed, busy, no-answer
  Handler:
    ringing → participant status='dialing', emit WS participant_dialing
    answered → participant status='lobby', emit WS participant_answered
    failed/busy/no-answer → status='failed', emit WS participant_unreachable
                            → create alert: "Could not reach [name] at [org]"
    completed → update leave_time and duration
```

---

## WebSocket events — complete list

Operator console subscribes to room keyed by `conference_id`.

```javascript
// GREETER QUEUE
{ type: 'greeter_queue_new',       caller: GreeterObject }
{ type: 'greeter_transcription',   id: UUID, field: 'name'|'org', text: String }
{ type: 'greeter_admitted',        caller_id: UUID, participant_id: UUID }
{ type: 'greeter_rejected',        caller_id: UUID }

// PARTICIPANTS
{ type: 'participant_dialing',     participant: ParticipantObject }
{ type: 'participant_answered',    participant: ParticipantObject }
{ type: 'participant_joined',      participant: ParticipantObject }
{ type: 'participant_left',        participant_id: UUID, duration_sec: Number }
{ type: 'participant_status',      participant_id: UUID, status: String }
{ type: 'participant_unreachable', participant_id: UUID, reason: String }

// CONFERENCE
{ type: 'conference_phase',        phase: 'lobby'|'live'|'ended' }
{ type: 'conference_started',      started_at: ISO8601 }
{ type: 'conference_ended',        stats: { count, duration_sec, peak_count } }
{ type: 'conference_locked',       locked: Boolean }
{ type: 'qa_mode',                 active: Boolean }

// Q&A
{ type: 'qa_raised',               question: QuestionObject }
{ type: 'qa_status',               question_id: UUID, status: String }
{ type: 'qa_reordered',            questions: QuestionObject[] }
{ type: 'qa_participant_live',     question_id: UUID, participant_id: UUID }
{ type: 'qa_participant_done',     question_id: UUID, participant_id: UUID }

// RECORDING
{ type: 'recording_started',       recording_sid: String }
{ type: 'recording_paused',        recording_sid: String }
{ type: 'recording_resumed',       recording_sid: String }
{ type: 'recording_ready',         url: String, duration_sec: Number }

// ALERTS (surface in right rail Alerts panel)
{ type: 'alert', level: 'info'|'warning'|'danger', message: String }
// Alert examples:
// warning: "James Mitchell has not yet joined — call scheduled 3 minutes ago"
// danger:  "Could not reach Fidelity (Sarah K.) — number busy"
// info:    "Recording is now active"
// warning: "5 participants in greeter queue — 2 have been waiting over 3 minutes"
```

---

## Attendance report schema

```javascript
{
  event_id:            UUID,
  event_name:          String,
  organiser:           String,
  conference_id:       UUID,
  dial_in_number:      String,
  started_at:          ISO8601,
  ended_at:            ISO8601,
  total_duration_sec:  Number,
  total_invited:       Number,
  total_joined:        Number,
  total_no_show:       Number,
  peak_participant_count: Number,
  participants: [
    {
      name:            String,
      organisation:    String,
      role:            String,
      phone_number:    String,   // masked: +44 7XXX XXXX 321
      join_method:     String,   // dial_in | dial_out
      status:          String,   // completed | left_early | removed | no_show
      join_time:       ISO8601,
      leave_time:      ISO8601,
      duration_sec:    Number,
      hand_raised:     Boolean,
      greeted:         Boolean
    }
  ],
  qa_summary: {
    questions_raised:    Number,
    questions_answered:  Number,
    questions_dismissed: Number,
    questions_pending:   Number
  },
  recording: {
    url:             String,
    duration_sec:    Number,
    file_size_mb:    Number,
    channels:        Number,
    transcript_url:  String   // null if not ordered
  }
}
```

---

## Console bridge panel — complete UI specification for Manus

The bridge panel lives in Zone 4 when the operator is in WebPhone / Bridge mode. It is a three-column layout within Zone 4.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  BRIDGE HEADER — Conference name | Phase | Duration | Lock btn  │
├──────────────────┬──────────────────────┬───────────────────────┤
│  GREETER QUEUE   │  PARTICIPANT ROSTER   │  Q&A QUEUE            │
│  (left, 220px)   │  (center, flex:1)     │  (right, 220px)       │
│                  │                       │                       │
│  Waiting callers │  All participants     │  Questions in queue   │
│  with voice play │  sorted by role       │  reorderable          │
│  Edit name/org   │  Status indicators    │  APPROVE/DISMISS/TAKE │
│  ADMIT / REJECT  │  MUTE/HOLD/REMOVE     │                       │
│                  │  DIAL OUT (empty row) │                       │
└──────────────────┴──────────────────────┴───────────────────────┘
│  BRIDGE FOOTER — Open Conference | End Call | QA Open/Close |   │
│  Mute All | Unmute All | Announce | Lock | Record toggle         │
└─────────────────────────────────────────────────────────────────┘
```

### Greeter queue panel (left column, 220px)

```
Panel header: "GREETER QUEUE" + count badge
Each caller card:
  - Phone number (partially masked)
  - [▶ Name] button — plays voice recording
  - [▶ Company] button — plays voice recording
  - Name text field (pre-filled from transcription, editable)
  - Org text field (pre-filled from transcription, editable)
  - Role dropdown: Participant | Presenter | Observer
  - [ADMIT] button — teal, admits to conference
  - [REJECT] button — red, rejects caller
  - Queued time: "Waiting 2m 14s"
  - Card border pulses amber if waiting > 3 minutes

Empty state: "No callers waiting"
```

### Participant roster panel (center column, flex:1)

```
Panel header: "PARTICIPANTS" + live count badge + "DIAL OUT" button (opens dial-out form)

Section: PRESENTERS (always first)
Each presenter row:
  - Avatar circle (initials, teal background)
  - Name + Organisation
  - Status badge: LIVE (teal) | MUTED | HOLD | DIALING...
  - Duration since join
  - Buttons: [MUTE/UNMUTE] [HOLD/UNHOLD] [▶ WHISPER] [✎ NOTES]
  - Whisper = operator speaks to presenter only, not to participants

Divider line: "─── PARTICIPANTS ─────────────────"

Each participant row:
  - Avatar circle (initials, blue background)
  - Name + Organisation
  - Status badge: LIVE | MUTED | HOLD | DIALING... | FAILED
  - Hand raised indicator: ✋ if hand_raised = true (amber highlight on row)
  - Duration since join
  - Buttons: [MUTE/UNMUTE] [HOLD/UNHOLD] [ADD TO Q&A] [REMOVE] [✎ NOTES]
  - ADD TO Q&A: manually adds participant to Q&A queue (operator can do this on behalf of caller)

Empty invited row (for pre-registered who haven't joined):
  - Name + Org shown in muted color
  - Status: NOT YET JOINED
  - Button: [DIAL OUT] — triggers outbound call

Dial-out form (shown when DIAL OUT is clicked):
  - Name field
  - Organisation field
  - Phone number field (E.164)
  - Role dropdown
  - [CALL NOW] button
```

### Q&A queue panel (right column, 220px)

```
Panel header: "Q&A QUEUE" + count badge + [OPEN Q&A / CLOSE Q&A] toggle

Each question card (draggable to reorder):
  - Position number: 1, 2, 3...
  - Participant name + org
  - Method: PHONE | WEB
  - Typed question text (if web method)
  - Time since raised
  - Status badge: PENDING | APPROVED | LIVE (pulsing) | ANSWERED | DISMISSED
  - Buttons for PENDING: [APPROVE] [DISMISS]
  - Buttons for APPROVED: [TAKE QUESTION] [SKIP] [DISMISS]
  - Buttons for LIVE: [DONE — REMUTE]
  - Card drag handle (⠿) for reordering

When TAKE QUESTION is clicked:
  → Console announces to all: "We will now take a question from [Name] at [Org]"
  → Participant card in roster shows LIVE status (green)
  → Q&A card shows LIVE badge with pulse animation
  → All other participant rows show greyed MUTED status

When DONE is clicked:
  → Participant remuted
  → Q&A card shows ANSWERED
  → Next APPROVED question highlighted, awaiting TAKE QUESTION click

Empty state: "Q&A is closed" or "No questions in queue"
```

### Bridge footer actions

```
Left cluster:
  [▶ Start Broadcast]  — green, opens main conference (changes to ⏹ End Call when live)
  [Open Q&A]           — activates Q&A mode (changes to Close Q&A)

Center cluster:
  [Mute All]           — mutes all participants (not presenters)
  [Unmute All]         — unmutes all participants
  [Announce]           — opens text field, plays TTS to all participants
  [🔒 Lock]            — locks conference (no new joiners)

Right cluster:
  [⏺ Record]           — starts/stops recording (shows REC indicator in header)
  Stream health bars + label (same as webcast mode)
```

---

## Participant status → UI colour mapping

| Status        | Row background  | Badge colour | Badge text     | Buttons available                              |
|---------------|----------------|--------------|----------------|------------------------------------------------|
| `invited`     | Muted/dim       | Gray         | NOT JOINED     | DIAL OUT                                       |
| `dialing`     | Normal, pulse   | Amber        | DIALING...     | —                                              |
| `greeter_queue`| Normal         | Blue         | IN QUEUE       | (managed in greeter panel)                     |
| `lobby`       | Normal          | Blue dim     | LOBBY          | ADMIT TO MAIN, REMOVE                          |
| `live`        | Normal          | Teal         | LIVE           | MUTE, HOLD, ADD TO Q&A, REMOVE                 |
| `muted`       | Normal          | Orange       | MUTED          | UNMUTE, HOLD, ADD TO Q&A, REMOVE               |
| `hold`        | Slightly dim    | Gray         | ON HOLD        | UNHOLD, REMOVE                                 |
| `left`        | Dim             | Gray dim     | LEFT           | REDIAL                                         |
| `removed`     | Very dim        | Red dim      | REMOVED        | —                                              |
| `failed`      | Normal          | Red          | UNREACHABLE    | RETRY DIAL                                     |
| `no_answer`   | Normal          | Red          | NO ANSWER      | RETRY DIAL                                     |

---

## Audio assets required (S3, served by Twilio)

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

All audio assets should be produced by a professional voice artist or high-quality TTS (ElevenLabs recommended). Do not use Twilio's default voices for client-facing audio.

---

## Security checklist

- [ ] All Twilio webhook endpoints validate request signature before processing
- [ ] Phone numbers stored encrypted at rest (AES-256 in PostgreSQL)
- [ ] Phone numbers displayed masked in UI: +44 7XXX XXXX 321
- [ ] Voice recordings stored in private S3 bucket with signed URLs (1-hour expiry)
- [ ] Conference access code is 8 random digits, regenerated per event
- [ ] Recording consent announcement plays before recording starts (logged in operator_actions)
- [ ] Operator JWT tokens expire after 8 hours
- [ ] All API calls require valid operator JWT
- [ ] Conference can be locked to prevent new joiners
- [ ] Greeter queue prevents unauthorised direct entry to main conference

---

## Environment variables

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+44XXXXXXXXXX
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

DATABASE_URL=postgresql://user:pass@host:5432/curalive
REDIS_URL=redis://localhost:6379
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WEBHOOK_BASE_URL=https://api.curalive.com

AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=curalive-recordings
AWS_REGION=eu-west-1

ELEVENLABS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Build order for Manus

**Phase 1 — Core call infrastructure (Week 1)**
1. Twilio account setup, PSTN number configured, TwiML app created
2. Inbound call handler → IVR → greeter queue placement
3. Voice recording capture and S3 storage
4. Greeter queue WebSocket events firing to console
5. Operator admit/reject — caller moves from greeter to main conference
6. Participant mute/unmute/hold/remove via Twilio REST
7. Conference start/end with recording

**Phase 2 — Operator workflow (Week 2)**
8. Dial-out to pre-registered participants
9. Green room / presenter sub-conference
10. Open conference (move from lobby to live, play opening announcement)
11. Lecture mode enforcement (mute all on open)
12. Attendance report generation and CSV export

**Phase 3 — Q&A and advanced features (Week 3)**
13. DTMF hand-raise (*2) detection per participant call leg
14. Web-based raise hand button
15. Q&A queue with approve/take/done/dismiss/reorder
16. Automatic presenter introduction on TAKE QUESTION
17. Q&A open/close announcements
18. Post-call recording delivery + transcript

**Phase 4 — Console panel (Week 4)**
19. Full bridge panel UI inside Zone 4 (three columns as specified)
20. Greeter queue panel with voice playback
21. Participant roster with drag-to-reorder Q&A queue
22. All status colours and button states as specified
23. Real-time updates from WebSocket for all events

---

## Questions Manus must answer before writing code

1. Does CuraLive have an existing Twilio account? What is the Account SID?
2. What PSTN number(s) are available for the bridge dial-in? UK number required?
3. Is the existing database PostgreSQL? What version?
4. What is the public HTTPS domain for the backend API? (Required for Twilio webhooks)
5. Maximum expected participants per call? (Up to 50, 50–250, or 250+?)
6. Is web-join (participants join via browser link) needed in addition to PSTN dial-in?
7. Should Twilio transcription be used for name/company capture, or manual operator entry only?

*End of specification.*

---

## ADDENDUM — VIER-Inspired Operator Functions

*This section extends the core spec with six additional backend and UI requirements derived from analysis of the VIER Conferencing OCC. Each addition is adapted for CuraLive's event-first context — not a call-centre clone, but a modern equivalent.*

---

### A1. Operator State System

Every operator session must carry an explicit state. This is not optional — it is how a multi-operator event stays coordinated and how handoffs work safely.

**States:**

| State | Meaning | Console indicator |
|---|---|---|
| `available` | Operator is monitoring, ready for action | Teal dot |
| `in_event` | Operator is actively running a live event | Teal pulse |
| `on_assist` | Operator is handling a participant support case | Amber pulse |
| `on_break` | Operator is temporarily unavailable | Gray dot |
| `handoff` | Operator is transferring event to another operator | Blue pulse |
| `wrap_up` | Post-event work in progress | Purple dim |

**Database addition:**
```sql
CREATE TABLE operator_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id     VARCHAR(255) NOT NULL,
  event_id        UUID REFERENCES events(id),
  state           VARCHAR(50) DEFAULT 'available',
  state_since     TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**API additions:**
```
PATCH  /api/operator/state
       Body: { state }
       Action: Updates operator_sessions record
               Emits WS: { type: 'operator_state', operator_id, state }
       Returns: { state, state_since }

GET    /api/operator/states/:event_id
       Returns: all operator states for active event
                Used to show co-operator availability in console
```

**WebSocket events:**
```javascript
{ type: 'operator_state', operator_id: String, state: String, state_since: ISO8601 }
```

**Console UI — operator state strip (Zone 1 header, right side):**
- Compact pill showing own state + click-to-change dropdown
- If multiple operators on same event: mini avatar row showing each operator's state
- When another operator enters `on_assist` — their name dims in the roster view so current operator knows they are handling something

---

### A2. Assist Mode — Participant Support Flow

When an operator pulls a participant aside to resolve a problem (wrong PIN, bad audio, lost connection, access issue), they enter Assist Mode. During this mode the main event continues but the operator is flagged as temporarily engaged.

**Assist Mode triggers:**
- Operator clicks "ASSIST" on any participant row
- Operator answers a support request from the greeter queue
- Operator manually enters assist mode from state control

**What changes in Assist Mode:**
- Operator state switches to `on_assist`
- A floating Assist Panel appears above the participant roster showing:
  - Participant name, org, phone, join method
  - Issue label (dropdown): Wrong PIN | Bad audio | Lost connection | Access denied | VIP support | Other
  - Private notes field
  - Action buttons: REJOIN TO EVENT | MOVE TO HOLD | REMOVE | ESCALATE | DONE
- Co-operators see operator is in assist (their state indicator changes)
- When DONE is clicked: operator returns to `in_event` state, assist case is logged

**Database addition:**
```sql
CREATE TABLE assist_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id),
  operator_id     VARCHAR(255),
  participant_id  UUID REFERENCES participants(id),
  issue_label     VARCHAR(100),
  -- wrong_pin | bad_audio | lost_connection | access_denied | vip_support | other
  notes           TEXT,
  resolution      VARCHAR(100),
  -- rejoined | moved_to_hold | removed | escalated | resolved_other
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  duration_sec    INTEGER
);
```

**API additions:**
```
POST   /api/bridge/assist/start
       Body: { participant_id, issue_label, notes }
       Action: Creates assist_case, updates operator state to on_assist
       Returns: { assist_case_id }

PATCH  /api/bridge/assist/:id/resolve
       Body: { resolution, notes }
       Action: Closes assist case, logs to operator_event_log
               Returns operator state to in_event
       Returns: { resolved_at, duration_sec }
```

---

### A3. Participant Filter Strip

When participant count exceeds ~20, operators need to isolate subsets instantly. This is a UI-only filter — no new API calls, filters the in-memory participant list client-side.

**Filter options (shown as toggleable pills above the roster):**

```
[All] [Speakers] [Attendees] [Waiting] [Needs Help] [Muted] [Live] [Web] [Phone] [Hand Raised]
```

**Filter logic:**
- `All` — show everything (default)
- `Speakers` — role === 'presenter'
- `Attendees` — role === 'participant' or 'observer'
- `Waiting` — status === 'lobby' or 'greeter_queue'
- `Needs Help` — status === 'failed' or 'no_answer' or assist_case active
- `Muted` — status === 'muted'
- `Live` — status === 'live'
- `Web` — join_method === 'web'
- `Phone` — join_method === 'dial_in' or 'dial_out'
- `Hand Raised` — hand_raised === true

**Console UI — filter strip placement:**
- Single row of pill buttons immediately above the participant roster list
- Active filter pill highlighted teal
- Count shown next to active filter: "Muted (12)"
- Multiple filters can be combined (AND logic)

**Participant data addition:**
```javascript
// Add join_method to ParticipantObject
join_method: 'dial_in' | 'dial_out' | 'web'
```

---

### A4. Silent Monitor Mode

Operators need to listen to the live conference or to an individual participant's audio line without being heard and without it appearing in call records. This is used to check audio quality, verify a participant is stable, or monitor before intervening.

**Two monitoring modes:**

| Mode | What operator hears | Participants hear operator | Logged |
|---|---|---|---|
| `monitor_conference` | All audio | No | Action only (not audio) |
| `monitor_participant` | One participant's line | No | Action only |

**Implementation via Twilio:**
- Operator joins conference with `muted=true` and `startConferenceOnEnter=false` — they are a silent listener
- For individual participant monitoring: Twilio's coach parameter allows hearing one leg only
- Monitor status must not appear in attendance reports as a participant
- Operator can escalate from monitor → speak by clicking "JOIN AUDIO" which unmutes their line

**API additions:**
```
POST   /api/bridge/monitor/conference
       Body: { conference_id }
       Action: Joins operator to conference as silent listener (muted, not counted as participant)
               Logs to operator_event_log: { action: 'monitor_conference' }
       Returns: { monitoring: true }

POST   /api/bridge/monitor/participant
       Body: { conference_id, participant_id }
       Action: Uses Twilio coach to route one participant's audio to operator
               Logs action
       Returns: { monitoring: true, participant_id }

POST   /api/bridge/monitor/stop
       Action: Removes operator from monitoring state
               If operator was monitor_participant → removes coach routing
       Returns: { monitoring: false }

POST   /api/bridge/monitor/join-audio
       Action: Escalates operator from silent monitor to active speaker
               Sets operator muted=false in conference
       Returns: { speaking: true }
```

**Console UI indicator:**
- When monitoring: header shows "MONITORING" badge (amber, no pulse)
- Participant being monitored: subtle amber left-border on their roster row
- Footer shows "JOIN AUDIO" button (replaces "Open Conference" while monitoring)

---

### A5. Post-Event Wrap-Up Mode

After a call ends, the operator should not immediately become available for another event. They need structured time to complete notes, classify any incidents, confirm the recording is delivered, and close the session properly. This is VIER's postprocessing concept, adapted for events.

**Wrap-up mode triggers automatically when operator clicks "End Call".**

**What happens:**
1. Conference ends, recording finalises
2. Operator state changes to `wrap_up`
3. Wrap-up panel slides into Zone 4, replacing the bridge view
4. Operator has a fixed time window (default 10 minutes, configurable) to complete wrap-up
5. Timer counts down in header — operator can extend or end wrap-up early

**Wrap-up panel contains:**

```
POST-EVENT WRAP-UP
─────────────────────────────────────────────────────
Event: Q2 2026 Investor Day
Duration: 1h 14m 32s
Peak participants: 47
Questions answered: 8 of 11 raised

SESSION NOTES
[Text area — operator notes for this event]

INCIDENT LOG (if any alerts fired during event)
[List of any alerts that occurred — operator marks each resolved/escalated]

RECORDING STATUS
[✓] Recording available — 1h 14m 32s, 487 MB
[ ] Transcript requested
[Export recording] [Copy link]

ATTENDANCE REPORT
[✓] Report generated — 47 participants
[Export CSV] [Send to organiser]

HANDOFF (if applicable)
Handoff to: [operator selector]
Notes for next operator: [text field]

─────────────────────────────────────────────────────
[COMPLETE WRAP-UP]   [EXTEND TIME +5min]
```

**Database addition:**
```sql
CREATE TABLE wrap_up_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id),
  conference_id   UUID REFERENCES conferences(id),
  operator_id     VARCHAR(255),
  notes           TEXT,
  incidents_resolved BOOLEAN DEFAULT false,
  recording_confirmed BOOLEAN DEFAULT false,
  report_exported BOOLEAN DEFAULT false,
  handoff_to      VARCHAR(255),
  handoff_notes   TEXT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  duration_sec    INTEGER
);
```

**API additions:**
```
POST   /api/bridge/wrapup/start
       Body: { conference_id }
       Action: Creates wrap_up_session, sets operator state to wrap_up
       Returns: { wrap_up_id, time_limit_sec: 600 }

PATCH  /api/bridge/wrapup/:id
       Body: { notes, incidents_resolved, recording_confirmed, report_exported,
               handoff_to, handoff_notes }
       Action: Updates wrap_up_session fields progressively
       Returns: { updated: true }

POST   /api/bridge/wrapup/:id/complete
       Action: Marks wrap_up complete, sets operator state to available
               Logs to operator_event_log
       Returns: { completed_at }

POST   /api/bridge/wrapup/:id/extend
       Body: { minutes: 5 }
       Action: Extends wrap-up timer
       Returns: { new_time_limit_sec }
```

---

### A6. Operator Event Log

Every action the operator takes — and every significant system event — must be logged in a persistent, queryable, exportable log. This is not an analytics dashboard. It is an operational audit trail.

**What gets logged:**

| Category | Example entries |
|---|---|
| Operator actions | Muted participant X · Admitted caller from greeter queue · Started recording · Opened Q&A |
| Participant events | Participant joined · Participant left unexpectedly · Participant failed to connect · Hand raised |
| Conference events | Conference opened · Conference locked · Recording started · Recording paused |
| Q&A events | Question approved · Question taken live · Question dismissed · Q&A closed |
| Assist events | Assist case opened for X · Issue: bad audio · Resolved: rejoined |
| Monitor events | Silent monitor started · Monitor participant X · Joined audio |
| Alert events | Alert: participant unreachable · Alert: greeter queue backed up · Alert acknowledged |
| Handoff events | Wrap-up started · Handoff to operator Y · Session marked complete |

**Database — operator_event_log table (replaces operator_actions):**
```sql
CREATE TABLE operator_event_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id),
  conference_id   UUID REFERENCES conferences(id),
  operator_id     VARCHAR(255),
  category        VARCHAR(50) NOT NULL,
  -- operator | participant | conference | qa | assist | monitor | alert | handoff
  action          VARCHAR(100) NOT NULL,
  target_type     VARCHAR(50),  -- participant | question | conference | assist_case
  target_id       UUID,
  target_name     VARCHAR(255), -- denormalised for log readability
  detail          TEXT,         -- human-readable detail string
  metadata        JSONB,        -- structured data for programmatic use
  severity        VARCHAR(20) DEFAULT 'info',
  -- info | warning | error
  logged_at       TIMESTAMPTZ DEFAULT NOW()
);
```

**API additions:**
```
GET    /api/bridge/log/:conference_id
       Query params: ?category=&severity=&limit=100&before=ISO8601
       Returns: array of log entries, newest first

GET    /api/bridge/log/:conference_id/export
       Action: Generates full log as structured JSON or CSV
               Uploads to S3 alongside attendance report
       Returns: { download_url, expires_at }
```

**WebSocket — live log feed:**
```javascript
// Every logged action emits to operator console in real time
{ type: 'event_log', entry: {
    id, category, action, target_name, detail, severity, logged_at
  }
}
```

**Console UI — operator event log pane:**
- Lives in Zone 5 (right rail) as a fourth collapsible section below the Alerts panel
- Shows last 50 entries, scrollable
- Colour-coded by category: teal=operator, blue=participant, purple=Q&A, amber=alert, gray=system
- Each entry: timestamp + category tag + action description
- "EXPORT LOG" button at bottom of pane
- Does not replace the Alerts panel — Alerts are actionable items, log is read-only history

**Example log entries as they appear in console:**
```
09:14:32  [OPERATOR]    Admitted James Mitchell (Fidelity) from greeter queue
09:15:01  [PARTICIPANT] Lisa M. (Schroders) — hand raised
09:15:14  [Q&A]         Question approved: Lisa M. — position 2
09:16:44  [OPERATOR]    Muted Michael T. (Wellington Management)
09:17:02  [ALERT]       Greeter queue backed up — 4 waiting over 3 minutes
09:17:09  [OPERATOR]    Alert acknowledged
09:18:30  [Q&A]         Question taken live: Lisa M.
09:19:10  [ASSIST]      Assist case opened — Andrew Ross (Vanguard) bad audio
09:21:04  [ASSIST]      Resolved: Andrew Ross rejoined conference
09:22:15  [MONITOR]     Silent monitor started — conference audio
09:24:00  [CONFERENCE]  Q&A closed by operator
09:31:17  [HANDOFF]     Wrap-up started — handoff to Operator B
```

---

### A7. Participation Queue — Extended Q&A Beyond Questions

The existing Q&A queue handles typed or phone-keypress questions. The VIER analysis identifies a broader concept: a **Participation Queue** that captures all forms of audience intervention, not just questions.

**Queue item types:**

| Type | Trigger | Console display |
|---|---|---|
| Question | Web form or *2 keypress | Purple badge: QUESTION |
| Raise hand | Web button | Amber badge: HAND RAISED |
| Operator request | Greeter escalation | Red badge: NEEDS OPERATOR |
| Compliance hold | AI or operator flagged | Red badge: COMPLIANCE |
| Speaker request | Presenter requesting help | Blue badge: SPEAKER REQUEST |

**Database addition to qa_questions:**
```sql
ALTER TABLE qa_questions
  ADD COLUMN type VARCHAR(50) DEFAULT 'question',
  -- question | raise_hand | operator_request | compliance_hold | speaker_request
  ADD COLUMN priority INTEGER DEFAULT 5;
  -- 1=urgent, 5=normal, 10=low — operator can reorder by dragging or priority
```

**API addition:**
```
PATCH  /api/bridge/qa/:id/priority
       Body: { priority }
       Returns: { priority, queue_position }
```

**Console UI — Participation Queue header shows type badges not just counts:**
```
Q&A QUEUE  [3Q] [1✋] [1!]
```
Where: 3Q = questions, 1✋ = raised hand, 1! = needs operator

---

### Summary of additions to build order

Add these to the existing Phase 3 / Phase 4 build order:

**Phase 3 additions (alongside Q&A):**
- Participant filter strip (client-side, no new API needed — just UI)
- Operator state system (lightweight DB + API + WS event)
- Participation queue type expansion (minor DB migration)

**Phase 4 additions (alongside console panel):**
- Assist mode panel (floating panel in roster column)
- Operator event log pane (right rail, fourth section)
- Operator event log entries wired to all existing actions

**Phase 5 (post-demo):**
- Silent monitor mode (Twilio implementation)
- Post-event wrap-up mode (replaces bridge view Zone 4 after call ends)
- Multi-operator co-presence indicators in header

