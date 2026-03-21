# CuraLive — Live Q&A User Guide

A simple step-by-step guide to test the Live Q&A webphone feature.

---

## What is it?

Live Q&A lets investors and attendees submit questions during a live call — directly from their browser. No phone dial-in needed. The operator (you) manages, triages, and approves questions in real time.

There are two sides:
- **Operator side** — where you manage the session (the CuraLive dashboard)
- **Attendee side** — a simple web page where investors submit questions

---

## PART 1: Setting Up a Q&A Session (Operator)

### Step 1: Log in to CuraLive
- Open the CuraLive dashboard in your browser
- You'll see the Operator Dashboard with tabs along the top

### Step 2: Go to Shadow Mode
- Click the **"Shadow Mode"** tab at the top of the page

### Step 3: Open the Live Q&A tab
- Inside Shadow Mode, you'll see a row of smaller tabs
- Click **"Live Q&A"** (near the right end of the tab row)

### Step 4: Launch a session
- You'll see a screen that says "Live Q&A Intelligence Engine"
- Click the purple **"Launch Live Q&A Session"** button
- A new session is created with a unique code (e.g., `2BXLGPE3`)

### Step 5: Copy the webphone link
- At the top of the Q&A management panel, click the **"Webphone Link"** button
- This copies a URL to your clipboard, something like:
  `https://your-domain/qa/2BXLGPE3`
- Send this link to your IT manager (or anyone you want to test with)

---

## PART 2: Submitting a Question (Attendee / IT Manager)

### Step 1: Open the link
- Open the webphone link in any browser (phone or desktop)
- You'll see the event name at the top with a green "LIVE Q&A" indicator

### Step 2: Type a question
- In the "Ask a Question" box, type any question (minimum 5 characters)
- Optionally fill in your name, company, and email
- Or tick "Submit anonymously"

### Step 3: Submit
- Click the purple **"Submit Question"** button
- You'll see a "Question submitted!" confirmation
- Your question now appears in the list below

### Step 4: Upvote
- You can click the up-arrow on any question to upvote it
- Questions with more votes help the operator prioritise

### Step 5: Voice input (optional)
- If your browser supports it, you'll see a microphone icon in the question box
- Click it and speak your question — it will be transcribed automatically

---

## PART 3: Managing Questions (Operator)

### What you see
- When an attendee submits a question, it appears in your Live Q&A dashboard
- Each question shows:
  - The question text
  - Who submitted it (name and company)
  - An AI-assigned **category** (financial, operational, ESG, governance, strategy, general)
  - A **priority score** (how urgent/relevant it is)
  - A **compliance risk** flag if the AI thinks it could be sensitive

### What you can do
- **Approve** — mark the question as ready for the speaker
- **Send to Speaker** — forward the question directly to the presenter
- **Route to Bot** — let the AI generate a draft response
- **Legal Review** — flag it for your legal/compliance team
- **Reject** — remove it from the queue

### AI Auto-Triage
- The AI automatically categorises every question as it comes in
- High-risk questions (e.g., about insider information, forward-looking projections) are flagged automatically
- You can generate an AI draft answer by clicking "Route to Bot"

---

## PART 4: Testing Checklist

Use this checklist when testing with your IT manager:

| Step | Who | Action | Expected Result |
|------|-----|--------|-----------------|
| 1 | Operator | Go to Shadow Mode > Live Q&A tab | See "Launch Live Q&A Session" button |
| 2 | Operator | Click "Launch Live Q&A Session" | Session created, code appears at top |
| 3 | Operator | Click "Webphone Link" | Link copied to clipboard |
| 4 | Operator | Send the link to IT manager | IT manager receives a URL |
| 5 | IT Manager | Open the link in a browser | See the event page with "Ask a Question" form |
| 6 | IT Manager | Type a question and click Submit | See "Question submitted!" message |
| 7 | Operator | Look at the Q&A dashboard | See the question appear with AI category and score |
| 8 | Operator | Click "Approve" on the question | Question status changes to Approved |
| 9 | IT Manager | Refresh the page | See the question marked as Approved |
| 10 | IT Manager | Click upvote on a question | Vote count increases |

---

## Quick Reference

| Item | Details |
|------|---------|
| Operator URL | Your CuraLive dashboard (Shadow Mode > Live Q&A tab) |
| Attendee URL | `/qa/[SESSION-CODE]` (shared via Webphone Link button) |
| Minimum question length | 5 characters |
| AI categories | Financial, Operational, ESG, Governance, Strategy, General |
| Voice input | Supported in Chrome and Edge browsers |
| Cost | Zero — everything runs in the browser, no phone charges |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Session Not Found" on attendee page | Check the session code in the URL matches — codes are case-insensitive |
| Questions not appearing for operator | Make sure you're looking at the correct session in the Live Q&A tab |
| Voice input not working | Voice input requires Chrome or Edge — Safari and Firefox have limited support |
| Link not working | Make sure the full URL was copied, including the session code |

---

*CuraLive — Real-Time Investor Event Intelligence*
*No dial-in required. Browser-based. Zero telephony costs.*
