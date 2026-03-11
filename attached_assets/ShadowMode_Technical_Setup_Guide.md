# CuraLive Shadow Mode — Technical Setup Guide
**For:** Operations & Technical Manager  
**Date:** March 2026  
**Classification:** Internal Use Only

---

## What Shadow Mode Does

Shadow Mode allows CuraLive to silently join any live webcast event running on Zoom, Microsoft Teams, Google Meet, or Cisco Webex. It deploys an AI bot that transcribes the entire event in real time, scores investor sentiment automatically, detects compliance risks, and stores all intelligence into the CuraLive database — without the client or their participants needing to do anything differently.

---

## What You Need Before You Start

**1. A live CuraLive platform instance**  
The platform must be running and accessible at its public URL (e.g. your Replit deployment URL). Shadow Mode uses this URL to receive data back from the bot during the event.

**2. Recall.ai API key configured**  
This is already set up in the CuraLive environment. Recall.ai is the service that deploys the meeting bot. To verify it is active:
- Log into the CuraLive platform
- Navigate to `/shadow-mode`
- If the "New Session" button works without errors, the API key is active

If there is an error about RECALL_AI_API_KEY, contact the development team to confirm it is set in the environment secrets.

**3. A valid meeting invite link from the webcast provider**  
This is the standard join link you would normally send to participants. For example:
- Zoom: `https://zoom.us/j/123456789?pwd=...`
- Teams: `https://teams.microsoft.com/l/meetup-join/...`
- Meet: `https://meet.google.com/abc-defg-hij`

---

## Step-by-Step Setup for Each Event

### Step 1 — Obtain the meeting join link
Before the event starts, get the standard meeting join URL from whoever set up the webcast. This is the same link that gets sent to presenters and participants. You do not need a host link — any valid join link works.

### Step 2 — Open Shadow Mode in CuraLive
Navigate to the CuraLive platform and go to:  
**Operator Platform Links → AI Features → Shadow Mode — Live Intelligence**  
Or go directly to: `/shadow-mode`

### Step 3 — Create a new session
Click **New Session** (green button, top right). Fill in the form:

| Field | What to enter |
|---|---|
| Client Name | The company name (e.g. Anglo American Platinum) |
| Event Name | Descriptive name (e.g. Q4 2025 Earnings Call) |
| Event Type | Select from: Earnings Call, AGM, Capital Markets Day, CEO Town Hall, Board Meeting, Webcast, Other |
| Platform | Select: Zoom / Teams / Meet / Webex |
| Meeting URL | Paste the full join link |
| Notes | Optional — any relevant context about the event |

### Step 4 — Start the session
Click **Start Shadow Intelligence**. The system will:
1. Create a session record in the database
2. Deploy the "CuraLive Intelligence" bot via Recall.ai
3. The bot requests to join the meeting within 30–60 seconds

**Important:** The bot will appear in the meeting as a named participant called **"CuraLive Intelligence"**. If the meeting has a waiting room, someone with host access must admit it. You may want to brief the host in advance that a "CuraLive Intelligence" participant will join and should be admitted.

### Step 5 — Monitor the live session
Once the bot joins:
- The session status changes from **Bot Joining** to **Live**
- The transcript feed begins populating in real time on the session screen
- Sentiment is scored automatically every 5 transcript segments
- You can leave this screen open during the event or check back at any time

### Step 6 — End the session
When the event concludes, click **End Session** (red button). The system will:
1. Remove the bot from the meeting
2. Process the full transcript for sentiment, compliance risk, and engagement scoring
3. Generate structured intelligence records in the Tagged Metrics database
4. Display a summary: how many transcript segments were captured, average sentiment, and how many intelligence records were created

If you forget to click End Session, the bot will leave automatically:
- 2 minutes after all participants have left
- 10 minutes if no one ever joined
- 20 minutes if stuck in a waiting room with no response

---

## What Gets Stored in the Database

After each session, the following records are automatically created in the Tagged Metrics database:

| Record Type | What It Contains |
|---|---|
| Sentiment tag | Average sentiment score across the full event |
| Engagement tag | Number of transcript segments captured (proxy for active speech) |
| Compliance tag | Risk score based on keyword scan (forward-looking, guidance, material, non-public, etc.) |
| Intervention tag | Confirmation that session completed without manual intervention |

These records are visible in the **Tagged Metrics Dashboard** at `/tagged-metrics`.

---

## Troubleshooting

**Bot does not join within 60 seconds**  
Check that the meeting URL is valid and the meeting is actually running. If the meeting has a waiting room, the host must admit the bot. Verify the Recall.ai API key is active.

**Session shows "Failed" status**  
The most common cause is an invalid meeting URL or a meeting that has not started yet. Create a new session with the correct link.

**Transcript is empty after the session ends**  
This can happen if the bot was not admitted to the meeting, or if the platform used is not supported. Recall.ai supports Zoom, Teams, Google Meet, and Webex. Some Zoom accounts with strict security settings may block bots — this requires a Zoom admin to allow third-party bots on the account.

**Sentiment shows "—" (no score)**  
Sentiment requires at least 5 transcript segments to score. Very short events or events where the bot joined late may not produce a sentiment score.

---

## Supported Platforms

| Platform | Support Level |
|---|---|
| Zoom | Full support — transcription + sentiment + compliance |
| Microsoft Teams | Full support |
| Google Meet | Full support |
| Cisco Webex | Full support |
| Other platforms | Not currently supported |

---

## Data Security Notes

- All transcript data is stored in the CuraLive database, not on Recall.ai servers beyond the session
- No audio or video is recorded by default — transcription only
- Compliance keyword detection is automated and does not involve any human review of transcript content
- The bot does not interact with the meeting in any way — it only listens and transcribes

---

## Monthly Workflow Recommendation

Run Shadow Mode on every Bastion Group webcast from this point forward. After each event:
1. Confirm the session completed and metrics were generated
2. Check the Tagged Metrics Dashboard to verify records were added
3. Note any compliance flags for follow-up with the client

After 10 events, the intelligence database will have enough data to show meaningful patterns. After 25 events, you will have investor sentiment baselines by client and event type — data that has direct commercial value.

---

*Document prepared by: CuraLive Engineering Team | March 2026 | Internal Use Only*
