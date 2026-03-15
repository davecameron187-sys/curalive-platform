# CuraLive Shadow Mode — Quick Setup Guide (With Links)
**For:** All Team Members  
**Date:** March 2026

---

## WHAT IS SHADOW MODE?

Shadow Mode lets CuraLive silently sit inside any live webcast — Zoom, Teams, Google Meet, or Webex — and collect intelligence in the background.

The client sees nothing different. The event runs as normal.
CuraLive quietly listens, transcribes, and analyses everything.

---

## BEFORE THE EVENT — 3 THINGS TO CHECK

**✅ 1. Open the CuraLive platform**

Click the link below to open CuraLive in your browser:
👉 **https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev**

Bookmark this link on your computer. You will use it for every event.

**✅ 2. Get the meeting join link**

Get the standard Zoom / Teams / Meet join URL from the client or event coordinator. This is the same link that gets sent to all participants. You do not need a host link — any join link works.

Examples of what a valid link looks like:
- Zoom: `https://zoom.us/j/123456789?pwd=...`
- Teams: `https://teams.microsoft.com/l/meetup-join/...`
- Google Meet: `https://meet.google.com/abc-defg-hij`

**✅ 3. Tell the meeting host one thing**

Contact the host and say:
> "A participant called CuraLive Intelligence will join your meeting. Please admit them from the waiting room when they appear."

That is all the host needs to know. They do not need to do anything else.

---

## ON THE DAY — STEP BY STEP

### STEP 1 — Open Shadow Mode

Click this direct link to go straight to Shadow Mode:
👉 **https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev/shadow-mode**

Or navigate manually: **CuraLive → Operator Platform Links → Shadow Mode**

---

### STEP 2 — Click "New Session"

Look for the green **New Session** button in the top right corner of the screen. Click it.

---

### STEP 3 — Fill in the session details

A form will appear. Fill in these 5 fields:

| Field | What to type |
|---|---|
| **Client Name** | The company name — e.g. Anglo American Platinum |
| **Event Name** | Short description — e.g. Q4 2025 Earnings Call |
| **Event Type** | Choose from the dropdown — Earnings Call / AGM / Capital Markets Day / CEO Town Hall / Board Meeting / Webcast / Other |
| **Platform** | Choose: Zoom / Teams / Meet / Webex |
| **Meeting URL** | Paste the full join link from the client |

Notes is optional — use it to add any context you want to remember about the event.

---

### STEP 4 — Click "Start Shadow Intelligence"

Click the green **Start Shadow Intelligence** button at the bottom of the form.

⏱ **Wait 30 to 60 seconds.**

The bot will appear in the meeting as **"CuraLive Intelligence"** in the participant list. The status on your screen will change from **Bot Joining** to **LIVE**.

> ⚠️ **Important:** If the meeting has a waiting room, the host must click **Admit** when "CuraLive Intelligence" appears. Make sure the host knows this before the event starts.

---

### STEP 5 — During the event

You will see the live transcript appearing on your screen as people speak. You do not need to do anything else while the event is running.

CuraLive is automatically doing the following in the background:
- Transcribing every word spoken
- Scoring investor sentiment every few minutes
- Scanning for compliance keywords
- Saving everything to the database

You can leave this screen open or close it and come back — the session keeps running.

---

### STEP 6 — End the session

When the event finishes, click the red **End Session** button.

CuraLive will automatically:
1. Remove the bot from the meeting
2. Process the full transcript
3. Save 4 intelligence records to the database
4. Show you a summary on screen

**Done. ✅**

---

### STEP 7 — Check your results

After the session ends, click this link to see what was captured:
👉 **https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev/tagged-metrics**

Or navigate: **CuraLive → Tagged Metrics Dashboard**

You will see 4 new records for the event:
1. **Sentiment score** — how positively the event landed overall
2. **Engagement score** — how active the conversation was
3. **Compliance risk score** — any flagged language to review
4. **Session complete** — confirmation everything was captured

---

## WHAT IF SOMETHING GOES WRONG?

**Bot does not join after 60 seconds**
Check the meeting link is correct and the meeting is live.
Ask the host if there is a waiting room — they may need to admit the bot.

**Session shows "Failed"**
The meeting link may be wrong or the meeting has not started yet.
Click New Session and try again with the correct link.

**No transcript after the event**
The bot may not have been admitted into the meeting.
For Zoom, the account admin may need to allow third-party bots.
Contact the development team if this happens more than once.

**Sentiment shows a dash (—)**
Normal for short events. Sentiment needs at least 5 minutes of active speech to produce a score.

---

## GOOD TO KNOW

- If you forget to click End Session, the bot leaves on its own:
  - 2 minutes after everyone leaves the meeting
  - 10 minutes if no one joined
  - 20 minutes if stuck in a waiting room

- The bot does not speak, does not send messages, and does not interfere with the meeting in any way.

- Run Shadow Mode on every Bastion Group webcast going forward. The more events you capture, the more valuable the data becomes.

---

## QUICK REFERENCE — SAVE THIS

| Action | Link |
|---|---|
| Open CuraLive | https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev |
| Open Shadow Mode directly | https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev/shadow-mode |
| View Tagged Metrics Dashboard | https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev/tagged-metrics |
| View all Operator Tools | https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev/operator-links |

**Before event** → Get the join link. Tell the host to admit "CuraLive Intelligence".
**Start** → Shadow Mode → New Session → Fill in 5 fields → Start Shadow Intelligence
**During event** → Leave it running. CuraLive handles everything automatically.
**After event** → Click End Session → Check Tagged Metrics Dashboard

---

*Document prepared by: CuraLive | March 2026 | Internal Use Only*

> **Note for your team:** When the platform moves to its permanent production address, replace all links in this document with the new URL. The page paths (/shadow-mode, /tagged-metrics, /operator-links) will remain the same.
