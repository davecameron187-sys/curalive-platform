# CuraLive Operator Console Roadmap Brief

**Prepared for Manus implementation**  
**Date: 27 March 2026**

---

## Core Direction

**Build the CuraLive Operator Console as the primary product surface.** Use Shadow Mode as the foundation and implement Live Q&A as a tab inside the console. Do not build a separate OCC workstream and do not expand into a standalone native webcast/video platform right now.

---

## 1. Product Decision

- The CuraLive Operator Console should be the main operator surface.
- The Operator Console should be built on top of the existing Shadow Mode console.
- Live Q&A should be implemented as a tab/module inside the Shadow Mode console.
- Do not spend development time reviving the old OCC as a separate product surface.
- Do not build CuraLive into a native meeting or video-hosting platform in this phase.

---

## 2. What the Console Must Do

The console should unify live intelligence and operator actions in one interface.

- **Show the live transcript** in near real time.
- **Show sentiment, compliance, risk, guidance, and engagement signals.**
- **Let the operator manage session state:** start, pause, resume, end.
- **Give the operator a Live Q&A queue** with approve / reject / hold / send-to-speaker actions.
- **Support operator notes, annotations, and action logging.**
- **Support post-session handoff:** archive, transcript, AI report, and downloads.

---

## 3. Current Position

- **Shadow Mode is the strongest and most commercially relevant live feature.**
- Auth hardening, route protection, storage hardening, archive fallback, and diagnostics are already in place.
- Live Q&A code and dashboard components already exist and should be refined rather than re-invented.
- **Shadow Mode should remain the foundation of the operator console roadmap.**

---

## 4. Roadmap Phases

### Phase 1 — Lock the Core Operator Console

- Use the existing Shadow Mode console as the single operator surface.
- Stabilize transcript panel, intelligence panel, and session controls.
- Make operator workflow clear: event status, lag indicators, failure states, and end-session handoff.
- **Ensure the console is usable in production for real events before expanding scope.**

### Phase 2 — Implement Live Q&A Inside the Console

- Add a dedicated Live Q&A tab inside Shadow Mode.
- Support real-time question intake, queue management, AI triage, deduplication, and compliance screening.
- Give operators one-click actions: approve, reject, legal review, AI draft, send to speaker.
- Provide a public attendee Q&A page / share link where required.

### Phase 3 — Deepen Operator Workflow

- Add richer operator action logging and review history.
- Add answer-risk prompts, role-specific views, workflow shortcuts, and better alert prioritization.
- Refine team chat, speaker communications if they improve real event handling.

### Phase 4 — Selective Enhancement Only

- Only after pilots, add small webcast/video enhancements if they directly improve the operator workflow.
- Keep major webcast expansion, standalone Q&A product work, and separate OCC revival out of scope until pilot demand proves they are needed.

---

## 5. Must-Have Modules

| Module | Purpose | Priority | Notes |
|--------|---------|----------|-------|
| **Transcript Panel** | Live transcript feed for operator monitoring | Critical | Must remain visible during the full session |
| **Intelligence Panel** | Sentiment, compliance, risk, guidance, engagement | Critical | Should update alongside transcript |
| **Session Controls** | Start / pause / resume / end / status | Critical | No silent failures or ambiguous states |
| **Live Q&A Tab** | Moderation queue and speaker workflow | Critical | Build inside Shadow Mode, not separately |
| **Operator Notes / Actions** | Annotation and action log | High | Important for review and auditability |
| **Archive Handoff** | Transcript, AI report, downloads, session summary | High | Needed at the end of every live session |

---

## 6. Out of Scope for This Roadmap

- A separate OCC rebuild.
- A native Zoom/Teams replacement.
- A full standalone webcast platform.
- A major virtual studio redesign.
- Large unrelated UI redesign work.
- Speculative AI feature expansion not tied to operator workflow.

---

## 7. Implementation Priorities for Manus

1. **First inspect the current Shadow Mode console and Live Q&A code paths before building anything new.**
2. **Treat the Shadow Mode console as the canonical operator surface.**
3. **Implement the Live Q&A tab inside Shadow Mode rather than as a separate app.**
4. **Preserve existing architecture where it already works.**
5. **Return a map of files, routes, components, and backend services touched.**
6. **Do not expand into webcast/video-platform work unless specifically instructed later.**

---

## 8. Required Manus Deliverables

1. **Operator Console architecture map:** current modules, files, and flows.
2. **Gap analysis:** what already works, what is partial, what is missing.
3. **Implementation plan for Phase 1 and Phase 2 only.**
4. **File-level patch plan.**
5. **Testing plan for transcript, intelligence, Q&A moderation, and session control.**
6. **Clear pass/fail criteria for console readiness.**

---

## 9. Definition of Success

- A single CuraLive Operator Console exists and is clearly the main operator surface.
- Shadow Mode remains the console foundation.
- Live Q&A works as an integrated tab inside that console.
- Operators can monitor, moderate, and complete a live event from one interface.
- The roadmap stays tightly focused on console value rather than platform sprawl.

---

## 10. Copy-Paste Instruction for Manus

**Build the CuraLive Operator Console as the main product surface using the existing Shadow Mode console as the foundation. Do not revive the old OCC as a separate workstream. Implement Live Q&A as a tab inside Shadow Mode, then refine transcript visibility, intelligence panels, session controls, operator notes, and archive handoff. Stay focused on the console only. Do not expand into a native webcast/video platform or broad standalone Q&A product work.**

---

## Key Constraints

- **Do NOT** rebuild OCC as a separate product.
- **Do NOT** build a native Zoom/Teams replacement.
- **Do NOT** expand into webcast/video-platform work unless explicitly instructed.
- **Do NOT** do large unrelated UI redesign work.
- **DO** use Shadow Mode as the foundation.
- **DO** integrate Live Q&A as a tab, not separately.
- **DO** preserve existing architecture where it works.
- **DO** focus on operator workflow and console value.
