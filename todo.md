
## Round 4 — Cross-Device Sync, Live Charts & Share Link

- [x] Animated real-time Chart.js bar chart for poll results in Moderator Console
- [x] Share Event Link button in Event Room (copy-to-clipboard shareable attendee URL)
- [x] Cross-device sync test page (/sync-test) + vitest for Ably channel pub/sub

## Round 5 — High Impact Board Demo Features

- [x] AI-Generated Event Summary (LLM) on Post-Event page
- [x] Live Audience Poll Overlay in Event Room attendee view
- [x] Download Transcript as PDF on Post-Event page

## Round 6 — Database, Email & Security

- [ ] Attendee registration persisted to database (name, email, company, event, joined_at)
- [ ] Operator Console shows real attendee list from database
- [ ] Send AI Summary to IR Contacts (server-side email via notification API)
- [ ] Event password protection (access code on Registration + server-side validation)

## Round 7 — Intelligent Webcast Features (Bastion Partnership)

- [ ] Live closed captions overlay on Event Room video player (toggle CC button)
- [ ] Enhanced live sentiment panel with sparkline trend chart and keyword highlights
- [ ] Q&A moderation upgrades: category tags, analyst/retail labels, priority scoring
- [ ] Multi-language transcript selector (EN, FR, PT, SW) in Event Room
- [ ] Enhanced AI post-event summary: financial highlights extraction + branded PDF export

## Round 8 — Top Quick Win AI Features

- [ ] #1 Live Rolling Summary — EventRoom: rolling 2–3 sentence "what you missed" summary updating every 60s
- [ ] #10 Speaking-Pace Coach — Presenter: WPM detector with colour-coded pace indicator
- [ ] #13 Audience Sentiment Feed — Presenter: live sentiment score shown in teleprompter
- [ ] #15 Silence/Anomaly Detector — Operator: alert when audio gap > 10s detected
- [ ] #5 AI Q&A Auto-Triage — Moderator: server LLM pass to auto-classify questions (approved/duplicate/off-topic)
- [ ] #6 Toxicity/Compliance Filter — Moderator: flag abusive/price-sensitive questions before queue
- [ ] #14 AI Event Brief Generator — Operator: paste press release → LLM generates event brief + talking points
- [ ] #19 AI Press Release Draft — PostEvent: one-click SENS/RNS-style press release from transcript
- [ ] #25 Automated Follow-Up Email Draft — PostEvent: draft personalised follow-up emails per IR contact

## Round 9 — Market Coverage & White-Label

- [ ] Add Africa/UAE/Mauritius dial-in numbers to OperatorConsole
- [ ] Build White-Label Configuration panel (logo, brand colours, subdomain preview)
- [ ] Add RTL layout support for Arabic in EventRoom transcript and CC overlay

## Round 10 — Demo Video & Sales Page

- [x] Add MP4 download button for demo video on Sales Demo page and Home page

## Round 11 — Testing Reference Card Webpage

- [x] Add /test-guide webpage version of the testing reference card

## Round 12 — Technical Manager Handover Page

- [x] Build /tech-handover webpage with full handover brief
- [x] Wire route and nav link, deploy permanently

## Round 13 — Operator Console Redesign

- [x] Rebuild Operator Console with production-grade broadcast ops centre UI

## Round 14 — CONTEX SUMMIT Windows Operator Console Web Replication

- [x] Build /summit-console page replicating the CONTEX SUMMIT Windows Operator Console UI
- [x] Wire route and nav link, deploy permanently

## Round 15 — VIER-Style OCC Phase 1 Build

### Schema & Backend
- [x] Extend DB schema: occ_conferences, occ_participants, occ_lounge, occ_operator_requests, occ_operator_sessions, occ_chat_messages, occ_audio_files, occ_participant_history
- [x] Run pnpm db:push to migrate schema
- [x] Build tRPC router: occ.getConferences, occ.getConference, occ.getParticipants, occ.updateParticipantState, occ.dialOut, occ.getLounge, occ.pickFromLounge, occ.getOperatorRequests, occ.pickOperatorRequest, occ.setOperatorState, occ.sendChat, occ.getChatHistory, occ.getParticipantHistory, occ.recordConference, occ.lockConference, occ.terminateConference

### Frontend — OCC Shell
- [x] Build /occ page with top menu bar, operator state machine (Present/Break/Absent), window launcher icons
- [x] Operator state: green dot (Present & Ready), orange (In Call), red (Absent), coffee cup (Break)
- [x] Window launcher icons: Operator Requests, Lounge, Conference Overview, Conference Control Panel, Access Codes, Settings

### Frontend — Conference Overview
- [x] Multi-tab table: Running, Pending, Planned, Connected, Alarms, Events
- [x] Columns: Op.support, Call-ID, Subject, Start, #Part, @Part, ModeratorCode, Part.Code, Security code, State icons
- [x] Click row to open Conference Control Panel for that conference

### Frontend — Conference Control Panel
- [x] Conference bar: Record, Lock, Menu (mute all / terminate / waiting music / participant limit), info area (name, duration, access codes)
- [x] Filter bar: 11 filter toggle buttons with live counts
- [x] Action bar: Mute, Unmute, Park, Connect, Disconnect, Subconference, Pick, Pick & Call
- [x] Participant table: 14 columns, real-time state via Ably, speaking row highlight, state change dropdown
- [x] Feature bar: Monitoring (placeholder), Connection, History, Audio Files, Chat tabs

### Frontend — Supporting Panels
- [x] Lounge panel: participant queue table, Pick button, Lounge alert toggle
- [x] Operator Requests panel: DTMF help request queue, Pick button
- [x] Caller Control popup: appears on incoming call, label fields, Moderator/Participant routing, Hold/Drop/Back

### Integration
- [x] Ably real-time: subscribe to occ:conference:{id} channel for participant state changes
- [x] Ably presence: show which operators have which conference panels open
- [x] Seed realistic demo data for JSE earnings call scenario
- [ ] Write vitest tests for all OCC tRPC procedures

## Round 16 — OCC Enhancements

- [x] Add OCC nav link to Home page header
- [x] Wire Lounge panel to Ably occ:lounge:{conferenceId} real-time channel
- [x] Wire Operator Requests panel to Ably occ:requests:{conferenceId} real-time channel
- [x] Build Caller Control popup modal (name/company label fields, Moderator/Participant/Drop routing)

## Round 17 — OCC Enhancement Round 2

- [x] Add "Simulate Incoming Call" button to Conference Bar
- [x] Route Lounge Pick through Caller Control popup
- [x] Add participant count limit warning badge at 90% capacity

## Round 18 — OCC Enhancement Round 3

- [x] AudioContext beep alert when new Needs Operator caller appears
- [x] Dial-Out quick-launch button in Conference Bar (compact modal)
- [x] Access Codes panel behind top bar launcher icon

## Round 19 — OCC Enhancement Round 4

- [x] Mute All except Moderator button in Conference Bar
- [x] Participant search bar in CCP (real-time filter by name/phone/company)
- [x] Conference timer alert: amber at 15 min remaining, red at 5 min remaining

## Round 20 — OCC Enhancement Round 5

- [x] Raise Hand indicator column in participant table (hand icon lights up on requestToSpeak)
- [x] Operator Notes tab in Feature Bar (auto-save to DB, appears in Post-Event Report)
- [x] Schedule New Conference modal from Conference Overview (subject, date, time, codes, limit)

## Round 21 — Speak Next Q&A Button

- [x] Add Speak Next button to raised-hand rows: unmute + set Speaking + lower hand in one click
- [x] Show a Q&A queue summary badge (number of raised hands) in the Conference Bar
- [x] Auto-mute the previous speaker when Speak Next is triggered on a new participant

## Round 22 — OCC Major Feature Build

- [x] OAuth login protection for /occ — redirect to login if not authenticated
- [x] Operator role guard — only users with role='operator' or 'admin' can access /occ
- [x] Q&A Queue panel — new Feature Bar tab with sorted raised-hand list and Speak Next buttons
- [x] Ably real-time participant state sync — occ:conference:{id} channel broadcasts state changes to all operator screens
- [x] Conference extension — +15 min button in Conference Bar resets timer and end time
- [x] Post-event export — operator notes + full participant list exported to Post-Event Report page
- [x] Multi-conference view — operator can open 2 CCPs side by side simultaneously
