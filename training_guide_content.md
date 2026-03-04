# OCC Operator Training Guide — Full Content Extract

## Structure: 13 Modules across 4 Phases

---

## PHASE 1 — Getting Started (Modules 01–03)

### Module 01 — Welcome & Platform Overview
- Chorus.AI is an AI-powered conference management platform for IR teams, earnings calls, investor days, and board briefings
- The OCC (Operator Control Centre) is the command hub where operators manage live conferences
- Key roles: Operator (manages calls), Moderator (hosts), Presenter (speaker), Attendee (participant)
- Platform supports Zoom RTMS, Microsoft Teams Bot, Recall.ai, RTMP, and PSTN dial-in

### Module 02 — Logging In & Setting Your Status
- URL: chorusai-mdu4k2ib.manus.space/occ
- Login via Manus OAuth — click "Sign in with Manus"
- After login: set status to "Present & Ready" in the top-right status bar
- Status options: Absent (default), Present & Ready, In Call, On Break
- Status is broadcast via Ably presence — other operators can see your state
- **Critical**: If you show Absent, you won't receive conference transfers or appear as a transfer target

### Module 03 — OCC Layout Overview
- Top bar: Status indicator, Webphone launcher, Notifications bell, Settings
- Left panel: Conference Overview (list of all conferences by lifecycle)
- Right panel: CCP (Conference Control Panel) — loads when you open a conference
- Bottom: Conference Bar (timer, bulk actions, terminate button)
- Split View: open two conferences simultaneously using the split-screen icon in the CCP header

---

## PHASE 2 — Conference Management (Modules 04–06)

### Module 04 — Pre-Call Checklist
- Verify headset/microphone is connected and working
- Set status to "Present & Ready" before shift starts
- Review the conference schedule in the Overview panel
- Check dial-in numbers are correct for the event
- Confirm Webphone is registered (green indicator in top bar)

### Module 05 — Conference Overview Panel
- Dashboard of every conference on the platform
- Tabs: Running, Pending, Planned, Completed, Alarms
- RUNNING: Conferences currently in progress — shows live participant count and elapsed timer
- PENDING: Scheduled calls within the next 2 hours — ready to be opened by an operator
- PLANNED: Future conferences booked in the system — not yet active
- COMPLETED: Ended calls — click to open the Post-Event Report
- ALARMS: Conferences with active alerts — timer exceeded, lounge overflow, or operator requests
- Click the headset icon on any conference card to load it into the CCP
- Pro tip: Use Split View to have two conferences open simultaneously

### Module 06 — CCP Basics & Participant List
- CCP = Conference Control Panel — main workspace for a live conference
- Load any conference from the Overview panel by clicking the headset icon
- Filter bar: All / Moderators / Participants / Web / Waiting
- Search by name, company, or phone number
- Table columns: # (line number), Role icon (★=Moderator, @=Web, •=Participant), Name, Company, State, Phone
- States: Connected (green), Muted (amber), Parked (purple), Waiting (red)

### Module 06 — Participant Actions
- **Unmute**: Restores caller's audio → Connected state
- **Mute**: Silences the caller — they remain and can hear everything → Muted state
- **Park**: Places caller on hold with music — use for audio issues or brief holds → Parked state
- **Unpark**: Returns parked caller to live conference → Connected state
- **Disconnect**: Drops caller from conference entirely — PERMANENT, use with caution → Dropped
- **Bulk Selection**: Tick checkboxes to select multiple participants → bulk action bar appears
- **Raise Hand / Q&A Speaker Queue**: Participants press *1 on keypad or use web interface — queue appears in 🖐 column

### Module 06 — Dial-Out & Caller Lounge
- **Dial-Out**: Operator calls a participant directly via Connection tab in CCP
  - Fill in: Caller Name (optional), Phone Number (required, E.164), Role (Moderator/Participant)
  - Click "Dial Now"
- **Caller Lounge**: Callers who self-dialled and are waiting to be admitted
  - Shows: Caller name/number, company, wait time
  - Click "Pick" to admit a caller to the live conference
  - Auto-Accept Lounge: Enable in Settings to automatically admit all lounge callers

---

## PHASE 3 — Advanced Controls (Modules 07–09)

### Module 07 — CCP Feature Tabs
Seven specialist tabs below the participant list:
1. **Monitoring** — Listen, whisper, or barge into any participant's audio line
   - LISTEN: Silent monitoring — you hear them, they don't know
   - WHISPER: Coach mode — you speak to them privately, rest of conference unaffected
   - BARGE: Full intervention — all attendees can hear you — use only for urgent emergencies
2. **Connection** — Dial-out form to add new callers to the live conference
3. **History** — Per-participant event log: joins, mutes, parks, disconnects with timestamps
4. **Audio Files** — Play, pause, or queue hold music and pre-recorded announcements
5. **Chat** — Broadcast text messages to all participants or a specific caller (via Ably)
6. **Notes** — Operator notepad — auto-saved per conference, exported with Post-Event report
7. **Q&A Queue** — Review, approve, or reject attendee questions submitted via the web interface

### Module 08 — Conference Bar (Timer, Actions & Export)
The Conference Bar sits at the bottom of every active CCP session:
- **Live Timer**: Shows elapsed conference time — colour changes based on Settings thresholds
  - Green = within normal duration
  - Amber = approaching limit (warning threshold)
  - Red = exceeded limit (critical threshold)
- **Unmute All**: Restores audio for every participant simultaneously — use to open the floor after presentation
- **Mute All**: Silences every participant at once — essential at start of Q&A or when background noise is disruptive
- **+15 Min**: Extends conference duration by 15 minutes — resets critical timer threshold accordingly
- **Post-Event**: Saves participant data and operator notes to session store, then navigates to Post-Event Report page with Operator Report tab pre-selected
- **Terminate**: Ends the conference and disconnects all participants — IRREVERSIBLE — confirmation prompt appears

### Module 09 — Transfer & Settings
**Transfer Conference** (CCP header button):
- Hand off a live conference to another operator
- Select target operator (shows online operators via Ably presence with their status)
- Add optional handover note (e.g., "Q4 Earnings — 1,247 participants. Moderator Thabo is live. Q&A starts at 45 min mark.")
- Click "Send Transfer" — target operator receives real-time Ably notification with conference details and note

**Operator Settings** (CCP header button):
- Audio Alert Volume: Volume for lounge and alarm sounds (slider)
- Timer Warning Threshold: Minutes before warning colour (amber) — default 50 min
- Timer Critical Threshold: Minutes before critical colour (red) — default 60 min
- Default Participant Filter: Filter applied when opening a conference (All/Moderators/Participants/Web/Waiting)
- Preferred Dial-In Country: Pre-fills the dial-out country code — default South Africa
- Auto-Accept Lounge: Toggle — automatically admit all lounge callers (recommended only for open-access events)
- Show Company Column: Toggle — display company name in participant list

---

## PHASE 4 — Post-Event & Best Practices (Modules 10–13)

### Module 10 — Post-Event Report & Operator Report Tab
When a conference ends:
1. Click "Post-Event" in the Conference Bar — writes full participant list and operator notes to session store
2. Auto-navigates to /post-event/{conferenceId}
3. Operator Report tab auto-activates

**Post-Event Report tabs**: AI Summary | Transcript | Analytics | Operator Report | IR Contacts

**Operator Report includes**:
- Conference metadata (ID, date, duration, dial-in)
- Participant count stats (total, connected, muted, parked)
- Full participant table with join times and roles
- Operator notes written during the call
- Download TXT — plain-text export for filing

### Module 11 — Webphone
- Built-in softphone in the OCC top bar (phone icon)
- Supports outbound calls to any number (PSTN via Twilio or Telnyx)
- Caller ID selection: choose from verified numbers
- Call history: recent calls with duration, status, direction
- Voicemail: when no operators available, callers leave voicemails — auto-transcribed
- Call transfer: blind or warm transfer to another number or operator
- Recording: all calls recorded — playback and transcription available in history

### Module 12 — Alarms & Escalation
- Alarms tab in Overview panel shows conferences with active alerts
- Alert types: Timer exceeded, Lounge overflow (>5 callers waiting), Operator request (moderator pressed *0)
- Alarm badge pulses red in the top navigation
- Escalation: if you cannot handle an alarm, use Transfer to hand off to another operator
- Never leave an alarm unacknowledged for more than 2 minutes

### Module 13 — Operator Best Practices
Six habits that separate a good operator from a great one:

1. **Set Present & Ready before your shift** — status is broadcast via Ably; Absent = invisible to transfer targets
2. **Use the Notes tab throughout every call** — notes are saved per-conference and exported to Post-Event Operator Report; write timestamps for key moments (Q&A start, technical issues, VIP callers)
3. **Park, don't Disconnect, for audio issues** — Park holds with music and lets them reconnect; Disconnect is permanent
4. **Bulk Select → Mute All at Q&A start** — tick header checkbox, click Mute All — silences 500+ callers in one click
5. **Check the Lounge every 60 seconds** — Lounge badge pulses amber when callers are waiting; late-joining VIPs and dial-in participants sit here
6. **Use Transfer for shift handoffs — never just leave** — click Transfer in CCP header, select incoming operator, add handover note, send

**Quick Reference — Common Actions**:
| Action | How to do it |
|--------|-------------|
| Open a conference | Overview panel → click headset icon |
| Mute one caller | Participant row → amber mic-off button |
| Mute all participants | Select all → Bulk bar → Mute All |
| Admit lounge caller | Lounge panel → Pick → Caller Control → Admit |
| Dial out to a participant | CCP → Connection tab → fill form → Dial |
| Extend conference +15 min | Conference Bar → +15 min button |
| Transfer to another operator | CCP header → Transfer → select operator → Send |
| End the conference | Conference Bar → red Terminate button |
| Export to Post-Event Report | Conference Bar → Post-Event → Operator Report tab |

---

## Phase Structure for Interactive Guide

### Phase 1: Getting Started (Est. 15 min)
- Module 01: Welcome & Platform Overview
- Module 02: Logging In & Setting Your Status
- Module 03: OCC Layout Overview
- **Q&A**: 3 questions to test understanding

### Phase 2: Conference Management (Est. 20 min)
- Module 04: Pre-Call Checklist
- Module 05: Conference Overview Panel
- Module 06: CCP Basics, Participant Actions, Dial-Out & Caller Lounge
- **Q&A**: 4 questions to test understanding

### Phase 3: Advanced Controls (Est. 25 min)
- Module 07: CCP Feature Tabs (Monitoring, Connection, History, Audio, Chat, Notes, Q&A Queue)
- Module 08: Conference Bar (Timer, Unmute All, Mute All, +15 Min, Post-Event, Terminate)
- Module 09: Transfer & Settings
- **Q&A**: 4 questions to test understanding

### Phase 4: Post-Event & Best Practices (Est. 15 min)
- Module 10: Post-Event Report & Operator Report Tab
- Module 11: Webphone
- Module 12: Alarms & Escalation
- Module 13: Operator Best Practices
- **Q&A**: 4 questions to test understanding

---

## Deep Links (App URL)
Base URL: https://chorusai-mdu4k2ib.manus.space

- OCC Dashboard: /occ
- Conference Overview: /occ (Overview panel)
- CCP (any conference): /occ → click headset icon on conference card
- Post-Event Report: /post-event/{conferenceId}
- Webphone: /occ → click phone icon in top bar
- Settings: /occ → click gear icon in CCP header
