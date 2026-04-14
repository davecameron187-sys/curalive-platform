---
REPLIT SUMMARY — copy and paste this block into the Replit chat
---
Feature: Live Q&A Intelligence Engine — Manus Workflow Integration
Route(s): /qa/:accessCode (attendee), Shadow Mode "Live Q&A" tab (operator)
Priority: high
Depends on: Shadow Mode (implemented), Ably real-time (implemented), Live Q&A Engine (implemented — Module 31)
What to build:
- Create a Manus workflow that orchestrates the end-to-end Live Q&A lifecycle: auto-launch Q&A when a Shadow Mode session starts, distribute the attendee link, monitor incoming questions, and auto-close when the session ends
- Integrate the workflow with the existing Shadow Mode session lifecycle (session start → Q&A active → session end → Q&A closed → certificate generated)
- Add auto-distribution of the Q&A link via Ably broadcast and optional email/SMS to registered attendees
- Add auto-generation of the Clean Disclosure Certificate when the Q&A session closes
- Add post-session Q&A intelligence digest: summarise all questions, responses, compliance flags, and sentiment patterns into a structured report appended to the Shadow Mode session report
DB changes needed: no — all tables exist (live_qa_sessions, live_qa_questions, live_qa_answers, live_qa_compliance_flags, live_qa_platform_shares)
New tRPC procedures: no — all 22 endpoints exist in liveQaRouter.ts
New pages/routes: no — AttendeeQA.tsx and LiveQaDashboard.tsx are built
---

# Live Q&A Intelligence Engine — Manus Workflow Brief

## 1. Overview

Module 31 (Autonomous Live Q&A Intelligence Engine) is fully built and deployed. This brief describes the workflow Manus should implement to orchestrate the Live Q&A lifecycle automatically, so the operator doesn't need to manually launch, monitor, or close Q&A sessions.

**Current state (manual):** Operator clicks "Launch Live Q&A" → copies share link → manages questions → clicks "End Q&A" → generates certificate.

**Target state (automated via Manus):** Shadow Mode session starts → Q&A auto-launches → link auto-distributed → questions auto-monitored → session ends → Q&A auto-closes → certificate auto-generated → digest auto-appended to session report.

---

## 2. What Already Exists (Do NOT Rebuild)

### 2.1 Database Tables (5 tables — all exist in MySQL)

| Table | Purpose |
|-------|---------|
| `live_qa_sessions` | Session management — status, counts, 8-char access code, link to Shadow Mode |
| `live_qa_questions` | Questions with AI triage scores, compliance risk, anonymous flag, operator notes |
| `live_qa_answers` | Responses with auto-draft flag, AI reasoning, operator approval |
| `live_qa_compliance_flags` | Per-jurisdiction compliance flags (ZA_JSE, US_SEC, UK_FCA, EU_ESMA) |
| `live_qa_platform_shares` | Platform-specific share links with white-label and click tracking |

### 2.2 API Endpoints (22 tRPC endpoints — all exist in `server/routers/liveQaRouter.ts`)

**Operator endpoints (require `operatorProcedure`):**

| Endpoint | Type | What it does |
|----------|------|-------------|
| `liveQa.createSession` | Mutation | Creates Q&A session linked to Shadow Mode session. Input: `{ shadowSessionId, eventName, clientName }`. Returns session with 8-char access code. |
| `liveQa.getSession` | Query | Get session by ID |
| `liveQa.getSessionByShadow` | Query | Get Q&A session linked to a specific Shadow Mode session. Input: `{ shadowSessionId }` |
| `liveQa.updateSessionStatus` | Mutation | Set session status. Input: `{ sessionId, status: "active" | "paused" | "closed" }` |
| `liveQa.listQuestions` | Query | List questions with answer count + unresolved compliance flags. Input: `{ sessionId, status? }` |
| `liveQa.updateQuestionStatus` | Mutation | Set question status + optional notes. Input: `{ questionId, status, operatorNotes? }`. Publishes Ably `qa.statusChanged`. |
| `liveQa.generateDraft` | Mutation | AI-generate compliance-safe draft response. Input: `{ questionId }`. Runs AGI compliance verification pass. |
| `liveQa.submitAnswer` | Mutation | Submit response, mark as answered. Input: `{ questionId, answerText }`. Publishes Ably event. |
| `liveQa.getAnswers` | Query | List all answers for a question. Input: `{ questionId }` |
| `liveQa.getComplianceFlags` | Query | List compliance flags. Input: `{ questionId }` |
| `liveQa.resolveComplianceFlag` | Mutation | Mark flag resolved. Input: `{ flagId }` |
| `liveQa.listSessions` | Query | List all Q&A sessions |
| `liveQa.sendToSpeaker` | Mutation | Forward question to speaker with AI-suggested response. Input: `{ questionId }`. Publishes Ably `qa.sentToSpeaker`. |
| `liveQa.broadcastToTeam` | Mutation | Urgent broadcast. Input: `{ sessionId, message, urgency }`. Publishes Ably `qa.teamBroadcast`. |
| `liveQa.postIrChatMessage` | Mutation | IR team chat message. Input: `{ sessionId, message }`. Publishes Ably `qa.irChat`. |
| `liveQa.generateQaCertificate` | Mutation | Generate SHA-256 hash-chained Clean Disclosure Certificate. Input: `{ sessionId }`. Returns grade, hash chain, full certificate JSON. |
| `liveQa.generateAgiTools` | Mutation | Generate autonomous micro-tools from session patterns. Input: `{ sessionId }` |
| `liveQa.predictiveRisk` | Mutation | AGI predictive compliance risk analysis. Input: `{ sessionId }` |

**Public endpoints (no auth — attendee-facing):**

| Endpoint | Type | What it does |
|----------|------|-------------|
| `liveQa.getSessionByCode` | Query | Get session info by access code. Input: `{ code }` |
| `liveQa.submitQuestion` | Mutation | Submit question with AI triage. Input: `{ sessionCode, questionText, submitterName?, submitterEmail?, submitterCompany?, isAnonymous }`. Auto-flags if compliance risk > 70. |
| `liveQa.listQuestionsPublic` | Query | List approved/triaged/answered questions. Input: `{ sessionId }` |
| `liveQa.upvoteQuestion` | Mutation | Upvote with 10s cooldown. Input: `{ questionId, fingerprint }` |

### 2.3 Real-Time Events (Ably)

Channel pattern: `curalive-qa-{sessionId}`

| Event | When | Payload |
|-------|------|---------|
| `qa.submitted` | New question submitted | questionId, text, category, triageScore, complianceRiskScore, status |
| `qa.statusChanged` | Status updated | questionId, newStatus, operatorNotes, timestamp |
| `qa.sentToSpeaker` | Forwarded to speaker | questionId, text, suggestedResponse, category |
| `qa.teamBroadcast` | Broadcast to team | message, urgency, timestamp |
| `qa.irChat` | IR chat message | message, sender, timestamp |

### 2.4 AI Services (all exist)

| Service | File | What it does |
|---------|------|-------------|
| `LiveQaTriageService` | `server/services/LiveQaTriageService.ts` (162 lines) | AI triage + auto-draft with compliance pass. Called automatically on every `submitQuestion`. |
| `AgiComplianceService` | `server/services/AgiComplianceService.ts` (182 lines) | Predictive risk analysis, draft verification, auto-policy generation across 4 jurisdictions |
| `AgiToolGeneratorService` | `server/services/AgiToolGeneratorService.ts` (121 lines) | Autonomous micro-tool proposals from session patterns |
| `PlatformEmbedService` | `server/services/PlatformEmbedService.ts` (256 lines) | Share links, embed codes, event summaries, white-label support |

### 2.5 UI Components (all exist)

| Component | File | What it does |
|-----------|------|-------------|
| `LiveQaDashboard` | `client/src/components/LiveQaDashboard.tsx` (931 lines) | Full operator console — question cards, one-click actions, IR chat, blockchain cert, predictive sidebar |
| `AttendeeQA` | `client/src/pages/AttendeeQA.tsx` (274 lines) | Public attendee page — question form, voice-to-text, live question list, upvotes |

---

## 3. Manus Workflow to Build

### 3.1 Workflow: Auto-Launch Q&A on Shadow Mode Session Start

**Trigger:** Shadow Mode session transitions to `active` status (bot joins meeting).

**Steps:**
1. Call `liveQa.createSession` with `{ shadowSessionId, eventName, clientName }` from the Shadow Mode session data.
2. Store the returned `sessionCode` and `sessionId`.
3. Call `liveQa.updateSessionStatus` with `{ sessionId, status: "active" }`.
4. Publish an Ably message on the Shadow Mode channel notifying the operator that Q&A is live and the share link is ready.
5. Log the Q&A session launch in the Shadow Mode session timeline.

**Error handling:** If `createSession` fails (e.g., Q&A already exists for this Shadow session), call `getSessionByShadow` to retrieve the existing session instead.

### 3.2 Workflow: Auto-Distribute Q&A Link

**Trigger:** Q&A session becomes active (immediately after 3.1).

**Steps:**
1. Construct the attendee URL: `https://company.curalive.app/qa/{sessionCode}`
2. If the event has registered attendees with email addresses, send the link via email using the existing notification system.
3. Broadcast the link via the Shadow Mode Ably channel so the operator sees it in the console.
4. Optionally call `PlatformEmbedService.generateShareLink()` for platform-specific links (Zoom chat, Teams chat, etc.) and store them in `live_qa_platform_shares`.

### 3.3 Workflow: Auto-Monitor & Auto-Triage (Already Built — No Action Needed)

The AI triage pipeline is already fully automatic:
- Every `submitQuestion` call automatically triggers `LiveQaTriageService.triageQuestion()`.
- Questions are auto-scored, auto-categorised, auto-ranked, and auto-flagged.
- Compliance flags are auto-generated per jurisdiction.
- The operator sees everything in real-time via the Live Q&A tab (3s polling).

**No Manus workflow needed here — it's already autonomous.**

### 3.4 Workflow: Auto-Close Q&A on Shadow Mode Session End

**Trigger:** Shadow Mode session transitions to `completed` or `failed` status (bot leaves meeting).

**Steps:**
1. Call `liveQa.getSessionByShadow` with `{ shadowSessionId }` to find the linked Q&A session.
2. If a Q&A session exists and its status is not already `closed`:
   a. Call `liveQa.updateSessionStatus` with `{ sessionId, status: "closed" }`.
   b. Call `liveQa.generateQaCertificate` with `{ sessionId }` to generate the blockchain Clean Disclosure Certificate.
   c. Call `liveQa.generateAgiTools` with `{ sessionId }` to generate AGI tool proposals from the session.
   d. Call `liveQa.predictiveRisk` with `{ sessionId }` to generate the final predictive risk analysis.
3. Store the certificate and risk analysis results for the post-session digest.

### 3.5 Workflow: Post-Session Q&A Intelligence Digest

**Trigger:** Q&A session closed (immediately after 3.4).

**Steps:**
1. Call `liveQa.listQuestions` with `{ sessionId }` to get all questions.
2. For each question, call `liveQa.getAnswers` and `liveQa.getComplianceFlags`.
3. Compile a structured digest containing:

```
Q&A Intelligence Digest
========================
Session: {eventName}
Code: {sessionCode}
Duration: {closedAt - createdAt}

Summary:
- Total questions: {count}
- Approved: {approved} | Rejected: {rejected} | Flagged: {flagged}
- Average triage score: {avg}
- Average compliance risk: {avg}
- Response rate: {answered / (total - rejected)} (excludes auto-drafts)

Top Categories:
1. {category}: {count} ({percentage}%)
2. {category}: {count} ({percentage}%)
...

Compliance Flags:
- {count} total flags across {jurisdictions} jurisdictions
- {unresolvedCount} unresolved
- Highest risk: {riskType} in {jurisdiction} (score: {score})

High-Priority Questions:
1. Q: "{questionText}" [Score: {triageScore}] [Status: {status}]
   A: "{answerText}" [Auto-draft: {isAutoDraft}]
   Flags: {flagCount} ({jurisdictions})
...

Clean Disclosure Certificate:
- Grade: {grade}
- Compliance Score: {score}/100
- Hash Chain Length: {length}
- Root Hash: {hash}

AGI Tool Proposals:
- {toolName}: {toolDescription} [Impact: {estimatedImpact}]
...
```

4. Append this digest to the Shadow Mode session's intelligence report.
5. Store the digest as a downloadable document linked to the session.

---

## 4. Ably Channel Subscriptions for Manus

Manus should subscribe to these channels to trigger workflow steps:

| Channel | Events to Watch | Action |
|---------|----------------|--------|
| `curalive-shadow-{sessionId}` | `session.started` | Trigger 3.1 (Auto-Launch Q&A) |
| `curalive-shadow-{sessionId}` | `session.ended` | Trigger 3.4 (Auto-Close Q&A) |
| `curalive-qa-{qaSessionId}` | `qa.submitted` | Log for monitoring (triage is automatic) |
| `curalive-qa-{qaSessionId}` | `qa.statusChanged` | Log for digest compilation |

---

## 5. Configuration Options

The workflow should support these operator-configurable options (stored per client):

| Setting | Default | Description |
|---------|---------|-------------|
| `autoLaunchQa` | `true` | Auto-launch Q&A when Shadow Mode session starts |
| `autoDistributeLink` | `false` | Auto-send Q&A link to registered attendees |
| `autoCloseQa` | `true` | Auto-close Q&A when Shadow Mode session ends |
| `autoGenerateCertificate` | `true` | Auto-generate Clean Disclosure Certificate on close |
| `autoAppendDigest` | `true` | Auto-append Q&A digest to session report |
| `defaultAnonymousAllowed` | `true` | Allow anonymous submissions by default |

---

## 6. Testing Checklist

- [ ] Shadow Mode session starts → Q&A session auto-created with correct `shadowSessionId` link
- [ ] Share link generated and broadcast to operator via Ably
- [ ] Attendee submits question → AI triage runs → question appears in operator console
- [ ] Operator approves/rejects/drafts/sends-to-speaker → status updates propagate via Ably
- [ ] Shadow Mode session ends → Q&A auto-closes
- [ ] Clean Disclosure Certificate auto-generated with correct hash chain
- [ ] AGI tool proposals generated from session patterns
- [ ] Post-session digest compiled with all questions, answers, flags, and certificate
- [ ] Digest appended to Shadow Mode intelligence report
- [ ] Error case: Q&A already exists for Shadow session → retrieves existing session gracefully
- [ ] Error case: Shadow session ends while Q&A is paused → still closes and generates certificate

---

## 7. File Reference

| File | Lines | Role |
|------|-------|------|
| `server/routers/liveQaRouter.ts` | 596 | All 22 tRPC endpoints — call these from the workflow |
| `server/services/LiveQaTriageService.ts` | 162 | AI triage (auto-called on submit — no workflow action needed) |
| `server/services/AgiComplianceService.ts` | 182 | Predictive risk + draft verification (auto-called — no workflow action needed) |
| `server/services/AgiToolGeneratorService.ts` | 121 | Tool proposals (call via `generateAgiTools` endpoint) |
| `server/services/PlatformEmbedService.ts` | 256 | Share links (call via service for platform-specific URLs) |
| `client/src/components/LiveQaDashboard.tsx` | 931 | Operator console (no changes needed) |
| `client/src/pages/AttendeeQA.tsx` | 274 | Attendee page (no changes needed) |
| `drizzle/schema.ts` | +70 | 5 table definitions (no changes needed) |

---

## 8. Key Constraints

1. **Do NOT rebuild any existing endpoints or UI.** Everything listed in Section 2 is built, tested, and deployed.
2. **Do NOT modify the database schema.** All 5 tables are in production with live data.
3. **Operator endpoints require `operatorProcedure` auth.** The workflow must authenticate as an operator to call them.
4. **Public endpoints have no auth** but have rate limiting (upvotes: 10s cooldown per fingerprint).
5. **Anonymous submissions null name, company, AND email** at insert time — this is a privacy requirement, do not change.
6. **Auto-drafts are excluded from response rate calculations** — maintain this when computing digest stats.
7. **The attendee page polls at 5s, operator console polls at 3s** — Ably client-side subscriptions are a future enhancement, not required for this workflow.

---

*Module 31 — Autonomous Live Q&A Intelligence Engine*
*CIPC Patent App ID 1773575338868 | CIP5 | Claims 46–55*
*Built and deployed: March 2026*
