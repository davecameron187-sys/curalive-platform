# Chorus.AI OCC — Operator Quick-Start Guide
**For experienced conference operators transitioning to the Chorus.AI platform**
*Version 2.0 · March 2026*

---

## Before You Start

You already know how to run a conference. This guide is not about that. It is about where to find things in the new console and what is different from the systems you have used before. Read it once, keep it open on a second screen for your first few calls, and you will be comfortable within a session.

**Platform URL:** [https://chorusai-mdu4k2ib.manus.space/occ](https://chorusai-mdu4k2ib.manus.space/occ)

---

## The Four Panels You Will Use Every Day

The OCC is built around four areas. Everything else is secondary.

| Panel | What it does | How to open it |
|---|---|---|
| **Conference Overview** | Lists all conferences by lifecycle (Running, Pending, Planned, Completed, Alarms) | Loads automatically when you open the OCC |
| **Conference Control Panel (CCP)** | Your main workspace for a live call — participant list, actions, feature tabs | Click the headset icon on any conference card in the Overview |
| **Webphone** | Built-in softphone for outbound calls, voicemail, and call transfer | Click the phone icon in the top bar |
| **Post-Event Report** | Full participant list, operator notes, AI summary, and transcript after a call ends | Click **Post-Event** in the Conference Bar, or navigate to `/post-event/{conferenceId}` |

---

## The One Thing You Must Do Before Every Shift

Set your status to **Present & Ready** in the top-right status bar. If you show as **Absent**, you will not receive conference transfers, you will not appear as a transfer target for other operators, and inbound Webphone calls will route to voicemail instead of your browser.

Status options: **Absent** · **Present & Ready** · **In Call** · **On Break**

---

## The Participant List — What Is Different

The CCP participant table will feel familiar. The key differences from most legacy systems:

- **States are colour-coded, not text labels.** Green = Connected, Amber = Muted, Purple = Parked, Red = Waiting/Lounge.
- **Park is not Mute.** Park places the caller on hold music and removes them from the live audio. Mute silences them but they remain in the conference and can hear everything. Use Park for audio issues or brief holds. Use Mute to silence a noisy line during a presentation.
- **Disconnect is permanent.** There is no "reconnect" button. If you Disconnect a caller, they must dial back in. When in doubt, Park.
- **Bulk actions work via the header checkbox.** Tick the top checkbox to select all visible participants, then use the bulk action bar that appears at the bottom. This is how you Mute All or Unmute All in one click.

---

## The Conference Bar — Your Primary Controls

The Conference Bar sits at the bottom of every active CCP session. From left to right:

**Live Timer** — Shows elapsed time. Turns amber at your warning threshold (default 50 min), red at critical (default 60 min). Click **+15 Min** to extend and reset the threshold.

**Unmute All** — Restores audio for every participant simultaneously. Use this to open the floor after a presentation.

**Mute All** — Silences every participant at once. Essential at the start of Q&A or when background noise is disruptive.

**+15 Min** — Extends the conference duration by 15 minutes.

**Post-Event** — Saves all participant data and your operator notes to the session store, then navigates to the Post-Event Report. Click this when the call ends.

**Terminate** *(red button)* — Ends the conference and disconnects all participants. Irreversible. A confirmation prompt appears.

---

## The Seven Feature Tabs

Below the participant list in the CCP, seven tabs give you specialist controls. You will use **Connection**, **Notes**, and **Q&A Queue** most often.

| Tab | Primary Use |
|---|---|
| **Monitoring** | Listen silently to any participant's line, whisper privately to them, or barge in for emergencies |
| **Connection** | Dial out to add a new caller to the live conference |
| **History** | Per-participant event log — joins, mutes, parks, disconnects with timestamps |
| **Audio Files** | Play hold music or pre-recorded announcements |
| **Chat** | Broadcast text messages to all participants or a specific caller |
| **Notes** | Your operator notepad — auto-saved per conference, exported with the Post-Event report |
| **Q&A Queue** | Review and approve attendee questions submitted via the web interface |

> **Tip:** Write timestamps in the Notes tab throughout the call — "14:32 Q&A opened", "14:55 Technical issue, parked line 7". These notes appear verbatim in the Post-Event Operator Report and are invaluable for client queries after the call.

---

## The Caller Lounge

Callers who self-dialled and are waiting to be admitted sit in the Lounge. The Lounge panel is accessible from the launcher icon in the top bar (the waiting room icon). When callers are waiting, the badge pulses amber.

**To admit a caller:** Open the Lounge panel → click **Pick** → the Caller Control popup appears → confirm name, company, and role (Moderator or Participant) → click **Admit**.

Check the Lounge every 60 seconds during a live call. Late-joining VIPs and dial-in participants always land here first.

---

## Transferring a Conference

When you need to hand off a live conference to another operator:

1. Click **Transfer** in the CCP header.
2. Select the target operator from the list — only operators showing **Present & Ready** appear.
3. Add a handover note (e.g., *"Q4 Earnings — 1,247 participants. Moderator Thabo is live. Q&A starts at 45 min mark."*).
4. Click **Send Transfer** — the target operator receives a real-time notification with the conference details and your note.

Never leave a live conference unattended. Always use Transfer for shift handoffs.

---

## The Webphone

The built-in Webphone handles all outbound PSTN calls without leaving the OCC. Open it from the phone icon in the top bar.

- **Caller ID selection** — choose from your verified numbers in the dropdown before dialling.
- **Call history** — recent calls with duration, status, and direction. Click any number to redial.
- **Voicemail** — when no operators are available, callers leave voicemails that are automatically transcribed. The voicemail badge appears in the Webphone header.
- **Call transfer** — during an active call, click the transfer button to blind-transfer or warm-transfer to another number or operator.
- **Recording** — all calls are recorded automatically. Playback and transcription are available in the call history panel.

---

## Alarms

The Alarms tab in the Overview panel shows conferences with active alerts. The alarm badge in the top navigation pulses red when an alarm is active.

| Alarm Type | Cause | Action |
|---|---|---|
| Timer exceeded | Conference has run past the critical threshold | Click **+15 Min** or **Terminate** |
| Lounge overflow | More than 5 callers waiting in the Lounge | Open Lounge panel and admit callers |
| Operator request | Moderator pressed **\*0** on their keypad | Open the Operator Requests panel and pick the request |

Do not leave an alarm unacknowledged for more than 2 minutes.

---

## Quick Reference — Common Actions

| Action | Steps |
|---|---|
| Open a conference | Overview panel → click headset icon on conference card |
| Mute one caller | Participant row → click amber mic-off button |
| Mute all participants | Header checkbox → select all → Bulk bar → **Mute All** |
| Park a caller | Participant row → click purple park button |
| Admit a lounge caller | Lounge panel → **Pick** → Caller Control → **Admit** |
| Dial out to a participant | CCP → **Connection** tab → fill form → **Dial Now** |
| Extend conference +15 min | Conference Bar → **+15 Min** |
| Transfer to another operator | CCP header → **Transfer** → select operator → add note → **Send** |
| End the conference | Conference Bar → red **Terminate** button |
| Export to Post-Event Report | Conference Bar → **Post-Event** → Operator Report tab |
| Open the Webphone | Top bar → phone icon |
| Check voicemails | Webphone → voicemail tab (envelope icon) |
| Set your status | Top-right status bar → select state |

---

## Settings You Should Configure on Day One

Open Settings from the gear icon in the CCP header.

- **Timer Warning Threshold** — set to your typical call length minus 10 minutes (default 50 min).
- **Timer Critical Threshold** — set to your maximum call length (default 60 min).
- **Preferred Dial-In Country** — set to South Africa (or your primary market) to pre-fill the country code in the dial-out form.
- **Audio Alert Volume** — set to a level you will notice without it being disruptive to your headset.
- **Default Participant Filter** — set to **All** for most events; switch to **Moderators** for large calls where you only want to see key participants by default.

---

## Platform Links

| Destination | Link |
|---|---|
| OCC Dashboard | [https://chorusai-mdu4k2ib.manus.space/occ](https://chorusai-mdu4k2ib.manus.space/occ) |
| Full Training Guide | [https://chorusai-mdu4k2ib.manus.space/training](https://chorusai-mdu4k2ib.manus.space/training) |
| Post-Event Reports | [https://chorusai-mdu4k2ib.manus.space/post-event](https://chorusai-mdu4k2ib.manus.space/post-event) |
| Tech Handover | [https://chorusai-mdu4k2ib.manus.space/tech-handover](https://chorusai-mdu4k2ib.manus.space/tech-handover) |

---

*Chorus.AI OCC Operator Quick-Start Guide · v2.0 · March 2026*
*For support, contact your platform administrator or refer to the full training guide at the link above.*
