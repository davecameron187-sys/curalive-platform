
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

## Round 23 — OCC Enhancement Round 6

- [ ] Wire Export button to navigate to Post-Event Report page with participant list + notes pre-populated
- [ ] Transfer Conference button in CCP header — Ably notification to target operator with Accept button
- [ ] Settings panel modal — audio alert volume, default filter, timer thresholds, preferred dial-in country

## Round 24 — Production Hardening
- [x] Protect all OCC tRPC mutations with protectedProcedure + operator/admin role guard
- [x] Add operatorProcedure middleware to server/_core/trpc.ts
- [x] Migrate all OCC publicProcedure mutations to operatorProcedure
- [x] Wire Resend transactional email to irContacts.sendSummary
- [x] Wire Resend confirmation email to registrations.register
- [ ] Configure custom domain demo.choruscall.ai

## Round 25 — OCC Features + Email Domain
- [ ] Transfer Conference button in CCP header with Ably notification to target operator
- [ ] OCC Settings panel modal (audio alert volume, default filter, timer thresholds, dial-in country)
- [ ] Resend domain verification + update FROM address to noreply@choruscall.ai

## Round 27 — Multi-Party Dial-Out
- [ ] Add batchDialOut tRPC procedure to OCC router (operatorProcedure)
- [ ] Add dialOutEntry schema type (name, phone, company, role)
- [ ] Build Multi-Party Dial-Out modal in OCC.tsx
- [ ] Support manual row entry (add/remove rows dynamically)
- [ ] Support CSV paste/import for bulk contact loading
- [ ] Show per-call status badge (Pending / Dialling / Connected / Failed) during batch
- [ ] Wire modal to batchDialOut procedure with real-time Ably status updates
- [ ] Add "Multi-Party Dial-Out" button to CCP header
- [ ] Write vitest for batchDialOut procedure

## Round 28 — CSV Import for Multi-Party Dial-Out
- [ ] Add CSV file input (hidden) and "Import CSV" button to Multi-Dial modal header
- [ ] Parse CSV with columns: name, company, phone, role (header row required)
- [ ] Validate each row: phone required, role must be moderator/participant (default participant)
- [ ] Append parsed rows to dialEntries staged list (skip duplicates by phone)
- [ ] Show import summary toast: N imported, M skipped (invalid)
- [ ] Add downloadable CSV template link in the modal
- [ ] Show per-row validation errors inline

## Round 29 — Load IR Contacts into Multi-Dial Queue
- [ ] Add getIRContacts tRPC query (by conferenceId → look up eventId → fetch irContacts)
- [ ] Add "Load IR Contacts" button to Multi-Dial modal header
- [ ] Fetch IR contacts on button click, map to DialEntry format (name, company, phone, role=participant)
- [ ] Skip contacts already in the queue (deduplicate by phone)
- [ ] Show summary: N loaded, M already in queue

## Round 30 — Edit IR Contact, Dial-Out History, Speaker Green Room, Event Pass
- [ ] Edit IR Contact inline editing in PostEvent IR Contacts panel
- [ ] Dial-out history schema (occ_dial_out_history table), tRPC procedures, PostEvent display
- [ ] Speaker Green Room: sub-conference creation, speaker CCP panel, Transfer All to Main
- [ ] Event Pass page at /event-pass/:eventId (branded, public, no Diamond Pass)
- [ ] Event Pass embeddable widget snippet for choruscall.co.za WordPress

## Round 32 — Dial-Out Notifications & Voice Message
- [ ] Add Auto-Dial on Start toggle (off by default) to Dial-Out conference form
- [ ] Add Send SMS Notification option with customisable message template
- [ ] Add Voice Message option: audio file upload or TTS text entry
- [ ] Add backend sendSmsNotification tRPC procedure
- [ ] Add voiceMessage storage and retrieval tRPC procedure

## Round 42 — Webcasting Platform Expansion
- [ ] Add webcast_events, webcast_registrations, webcast_qa, webcast_polls tables to schema
- [ ] Run pnpm db:push for new schema
- [ ] Add webcasting tRPC router (webcastRouter.ts) with CRUD for events, registrations, Q&A, polls
- [ ] Redesign /live-video hub page into full webcasting platform hub (8 event types, industry verticals)
- [ ] Build /live-video/webcast/:id — Webcast Studio (production console, green room, scenes, engagement)
- [ ] Build /live-video/webcast/:id/register — Event Registration & Landing Page
- [ ] Build /live-video/on-demand — On-Demand Media Hub (video library, search, filter)
- [ ] Build /live-video/analytics — Analytics & Engagement Dashboard
- [ ] Add routes to App.tsx for all new pages
- [ ] Write vitest for webcastRouter procedures

## Round 43 — Create Event Wizard, Vertical Templates & Ably Real-Time
- [ ] Build CreateEventWizard page (6-step: type → branding → agenda → speakers → registration → publish)
- [ ] Add createEvent tRPC mutation with all wizard fields (branding, agenda, speakers, registration config)
- [ ] Build vertical-specific registration templates: Healthcare CME, Financial Services, Government
- [ ] Update WebcastRegister to auto-apply vertical template based on event.industryVertical
- [ ] Wire Ably real-time into WebcastStudio (Q&A, polls, chat via AblyProvider/useAbly)
- [ ] Add webcast Ably channel namespace (webcast:{slug}) to AblyContext
- [ ] Add routes for /live-video/webcast/create and vertical template previews
- [ ] Run all tests and confirm 0 TS errors

## Round 44 — Go-Live Features (March 2026)
- [x] Stream tab visibility fix in WebcastStudio — overflow-x-auto so all 7 tabs accessible
- [x] attendeeToken field added to webcastRegistrations schema (db:push applied)
- [x] Email confirmation with .ics calendar invite sent on registration (Resend + buildRegistrationConfirmationEmail)
- [x] verifyAttendeeToken procedure in webcastRouter for token-gated attendee access
- [x] markAttendeeJoined procedure in webcastRouter to record attendance
- [x] AttendeeEventRoom page (/live-video/webcast/:slug/attend?token=...) — token-gated, live stream, transcript, Q&A, polls, 12-language selector
- [x] WebcastRegister success state shows personal join link and updated confirmation message
- [ ] Stripe billing integration (requires user to provide Stripe API keys via Settings → Payment)

## Round 45 — On-Demand Recording Access for Attendees
- [x] Add getOnDemandAccess tRPC procedure: verify token, return event + recording URL if event ended
- [x] Add setRecordingUrl tRPC mutation (operatorProcedure) to set/update recording URL on an event
- [x] Update AttendeeEventRoom: show Mux on-demand player (or recordingUrl video) when event status is ended/on_demand
- [x] Build dedicated OnDemandWatch page at /live-video/webcast/:slug/watch?token=... for replay
- [x] Update WebcastRegister success state: show "Watch Recording" button if event already ended
- [x] Update PostEvent page: add "Share Recording Link" that generates a token-gated watch URL
- [x] Add route for /live-video/webcast/:slug/watch in App.tsx

## Round 46 — Publish Recording in Operator Console
- [x] Add "Publish Recording" section to WebcastStudio Operator Console tab with URL input, publish button, and status indicator

## Round 47 — Attendee Reminder Emails
- [ ] Add reminder24SentAt and reminder1SentAt timestamp columns to webcastRegistrations schema
- [ ] Push schema migration to DB
- [ ] Build reminder email template (buildReminderEmail) in server/_core/email.ts
- [ ] Create server-side reminder scheduler (server/reminderScheduler.ts) that runs every 5 minutes
- [ ] Wire scheduler into server/_core/index.ts startup
- [ ] Add tRPC procedures: getReminderStatus (list registrations + sent timestamps) and sendRemindersNow (manual trigger)
- [ ] Add Reminders panel to WebcastStudio Stream tab (or new tab) showing sent counts and manual trigger button
- [ ] Write vitest tests for reminder scheduling logic

## Round 48 — GTM 2b: First Paying Customer Features
- [x] Verify Create Event Wizard → DB persistence (createEvent mutation fully wired with all wizard fields)
- [x] Build Webcast Post-Event Report page (/live-video/webcast/:slug/report) — poll results, attendance stats, AI summary, full transcript, recording link
- [x] Add webcast post-event report tRPC procedure (getWebcastReport) returning registrations, attendance, poll results, Q&A, transcript
- [x] Build Terms of Service page (/legal/terms)
- [x] Build Privacy Policy page (/legal/privacy)
- [x] Add footer links to ToS and Privacy Policy on Home, WebcastRegister, and CreateEventWizard pages
- [x] Add routes for /live-video/webcast/:slug/report, /legal/terms, /legal/privacy in App.tsx

## Round 49 — Reminders Tab in WebcastStudio
- [ ] Add "reminders" to StudioTab type in WebcastStudio
- [ ] Add Bell icon to imports in WebcastStudio
- [ ] Add Reminders tab button to the tab bar
- [ ] Add getReminderStatus and sendRemindersNow trpc calls in WebcastStudioInner
- [ ] Build Reminders panel: summary cards (total registered, 24h sent, 1h sent), registration table with per-row sent timestamps, and manual Send Now buttons for each tier

## Round 50 — Platform Links Reference Page
- [x] Build PlatformLinks page at /platform-links with all 35 URLs, search/filter, copy-to-clipboard, section grouping
- [x] Register route in App.tsx
- [x] Add link to PlatformLinks from TechHandover and TestGuide pages

## Round 51 — Recall.ai Integration Fixes
- [x] Fix createRecallBot payload: use realtime_endpoints[] + recallai_streaming transcription provider
- [x] Fix transcript.data webhook handler: match actual Recall.ai payload shape (data.data.words + data.data.participant)
- [x] Add Ably real-time subscription to RecallBotPanel for instant transcript updates (no more polling)

## Round 53 — In-House Testing Preparation

- [x] Add Login button to Home page header (shows user name when logged in, login link when not)
- [x] Add login guard + helpful error message to CreateEventWizard when user is not logged in
- [x] Update TestGuide to cover full webcasting workflow (create event → studio → register → attend → report)
- [x] Add "Quick Start" section to TestGuide with the 3 most important URLs for in-house testing
- [x] Add Recall.ai bot testing section to TestGuide

## Round 54 — Team Role Management, E2E Test Event & Stripe Billing

### Team Role Management
- [x] Add "Request Operator Access" button to WebcastingHub for users with role=user
- [x] Add tRPC mutation requestOperatorAccess that emails owner via notifyOwner
- [x] Improve AdminUsers page: show pending requests, add one-click promote button
- [x] Add role badge to Home page header (shows "Admin" or "Operator" badge next to user name)

### Stripe Billing
- [ ] Add Stripe integration via webdev_add_feature
- [ ] Add stripe_customer_id to users table schema, run db:push
- [ ] Create products.ts with 3 subscription plans (Starter, Professional, Enterprise)
- [ ] Build /pricing page with plan comparison table and checkout buttons
- [ ] Add createCheckoutSession tRPC procedure (operatorProcedure)
- [ ] Add stripeWebhook handler at /api/stripe/webhook
- [ ] Add /billing page showing current plan, invoice history, manage subscription button
- [ ] Wire billing nav link to Home page header and WebcastingHub
- [ ] Write vitest for checkout session creation

## Round 55 — Operator Profile Customisation

- [x] Extend users table: add jobTitle, organisation, bio, avatarUrl, phone, linkedinUrl, timezone columns
- [x] Run pnpm db:push to apply schema migration
- [x] Add getProfile and updateProfile tRPC procedures (protectedProcedure)
- [x] Add avatar upload endpoint using storagePut (S3)
- [x] Build /profile page with avatar upload, name, title, org, bio, phone, LinkedIn, timezone fields
- [x] Add Profile link to Home header user menu (next to Sign Out)
- [x] Show avatar + name in OCC header when profile is set
- [x] Show operator name/title in WebcastStudio header
- [x] Write vitest for updateProfile procedure

## Round 56 — Avatar in Studio/OCC, Speaker Card on Registration, Stripe Billing

### Operator Avatar in Studio & OCC
- [x] Show operator avatar + name + title in WebcastStudio header (fetch from profile.get)
- [x] Show operator avatar + name + title in OCC header

### Speaker Profile Card on Registration
- [x] Add getEventHost tRPC query (returns host profile for a given webcast slug)
- [x] Add speaker profile card to WebcastRegister page (avatar, name, title, org, bio)
- [x] Add speaker profile card to Registration page (existing events)

### Stripe Billing
- [x] Request Stripe API keys from user via webdev_request_secrets
- [x] Add stripe_customer_id + stripeSubscriptionId to users table, run db:push
- [x] Create server/products.ts with Starter/Professional/Enterprise plans
- [x] Create checkout session tRPC mutation (billingRouter.ts)
- [x] Create /api/stripe/webhook endpoint with signature verification (stripeWebhook.ts)
- [x] Build /billing page with plan cards and upgrade CTA
- [x] Add Billing link to Home header for logged-in users
- [x] Write vitest for checkout session procedure (73 tests passing)

## Round 57 — Complete AI Feature Suite

- [x] Wire real-time LLM sentiment scoring from live transcript into Recall webhook (replace simulated data)
- [x] Publish live sentiment.update events to Ably channel every N transcript segments
- [x] Build rolling AI summary: tRPC mutation that summarises last 60s of transcript, published to Ably
- [x] Show rolling summary panel in WebcastStudio (AI tab), Presenter teleprompter, and AttendeeEventRoom
- [x] Build AI Q&A auto-triage: LLM classifies each submitted question (approved/duplicate/off-topic/sensitive)
- [x] Show triage badge on each Q&A card in Moderator console
- [x] Build toxicity/compliance filter: flag price-sensitive or abusive questions before they enter the queue
- [x] Build AI Event Brief Generator in WebcastStudio: paste press release → LLM returns brief + talking points
- [x] Build AI Press Release Draft in WebcastReport: one-click SENS/RNS-style press release from transcript
- [x] Enhance post-event AI summary: add financial highlights extraction, risk factors, forward-looking statements
- [x] Add speaking-pace coach to Presenter teleprompter: WPM detector with colour-coded pace indicator
- [x] Wire multi-language transcript selector to actual LLM translation (aiRouter.translateSegment procedure added)
- [x] Write vitest for AI triage and sentiment scoring procedures (73 tests passing)
