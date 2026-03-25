# Live Polling and Audience Interaction

## REPLIT SUMMARY

**Feature**: Live Polling and Audience Interaction  
**Route**: `/event/:eventId` (embedded in event room), `/moderator/:eventId` (poll management in moderator console)  
**Priority**: Medium  
**Status**: implemented  
**Dependencies**: Ably Real-Time Channels (implemented), OCC Operator Console (implemented)  

**What to build**: A real-time polling system that allows operators and moderators to create, launch, and manage live polls during events. Attendees vote in real time with results displayed instantly via Ably channels. Supports multiple poll types (multiple choice, rating scale, word cloud, yes/no), scheduled polls, and post-event poll analytics. Integrates with the Moderator Console for poll creation and the Event Room for attendee voting.

**Key files to create or modify**:
- `client/src/components/LivePoll.tsx` — Attendee-facing poll voting component
- `client/src/components/PollResults.tsx` — Real-time results display with animated charts
- `client/src/components/PollManager.tsx` — Moderator poll creation and management interface
- `server/routers/polls.ts` — tRPC router for poll CRUD and vote submission
- `server/services/PollService.ts` — Service for poll logic, vote tallying, and Ably publishing
- `drizzle/schema.ts` — Add `polls`, `poll_options`, `poll_votes` tables

**Database tables**:

`polls`: `id`, `event_id` (FK conferences), `created_by` (FK users), `question` (text), `poll_type` (enum: multiple_choice, rating_scale, word_cloud, yes_no), `status` (enum: draft, active, closed, archived), `allow_multiple` (boolean), `is_anonymous` (boolean), `scheduled_at` (timestamp, nullable), `opened_at` (timestamp, nullable), `closed_at` (timestamp, nullable), `display_order` (int), `created_at`, `updated_at`

`poll_options`: `id`, `poll_id` (FK polls), `option_text` (varchar), `option_order` (int), `created_at`

`poll_votes`: `id`, `poll_id` (FK polls), `option_id` (FK poll_options, nullable for word cloud), `voter_id` (FK users, nullable for anonymous), `voter_session` (varchar, for anonymous dedup), `text_response` (text, nullable, for word cloud), `rating_value` (int, nullable, for rating scale), `created_at`

**tRPC procedures**:
- `polls.create` (mutation, protected) — Creates a new poll with options
- `polls.update` (mutation, protected) — Updates a draft poll
- `polls.launch` (mutation, protected) — Opens a poll for voting, publishes to Ably
- `polls.close` (mutation, protected) — Closes a poll, publishes final results to Ably
- `polls.vote` (mutation, public) — Submits a vote (deduplicates by session)
- `polls.getActive` (query, public) — Returns the currently active poll for an event
- `polls.getResults` (query, public) — Returns vote tallies for a poll
- `polls.listForEvent` (query, protected) — Lists all polls for an event with results
- `polls.delete` (mutation, protected) — Deletes a draft poll

---

## Detailed Specification

### 1. Overview

Live polling transforms passive event attendees into active participants. During earnings calls, investor days, and roadshows, polls serve multiple purposes: gauging investor sentiment on strategic decisions, collecting audience feedback on presentation topics, and maintaining engagement during long sessions. The polling system must be fast (sub-second vote-to-display latency via Ably), accessible (large touch targets for mobile, keyboard navigation for desktop), and reliable (no duplicate votes, accurate tallies under high concurrency).

### 2. Poll Types

The system supports four poll types, each with distinct input mechanisms and result visualizations.

| Poll Type | Input | Result Display | Use Case |
|---|---|---|---|
| **Multiple Choice** | Radio buttons (single) or checkboxes (multi) | Horizontal bar chart with percentages | Strategic direction votes, topic preference |
| **Rating Scale** | 1–5 or 1–10 slider | Average score with distribution histogram | Speaker feedback, satisfaction surveys |
| **Word Cloud** | Free text input (max 50 chars) | Animated word cloud (size = frequency) | Open-ended sentiment, topic discovery |
| **Yes/No** | Two large buttons | Donut chart with count | Quick consensus checks, approval votes |

### 3. Poll Lifecycle

Each poll follows a defined lifecycle managed by the moderator or operator.

**Draft** — The poll is created with a question, type, and options. It is visible only in the Moderator Console and can be edited freely. Multiple draft polls can exist simultaneously, allowing moderators to prepare polls in advance.

**Active** — The moderator launches the poll, which publishes a `poll:launched` event to the Ably event channel. The poll appears in all connected attendee event rooms. Only one poll can be active per event at a time. Launching a new poll automatically closes any currently active poll.

**Closed** — The moderator closes the poll (or it auto-closes after a configurable duration). A `poll:closed` event is published to Ably with the final results. The poll remains visible in the event room with results displayed but voting disabled.

**Archived** — After the event, all polls are archived. They remain accessible in the Post-Event Report and the event analytics dashboard.

### 4. Real-Time Vote Flow

The voting flow is designed for sub-second latency from vote submission to results update.

When an attendee submits a vote, the frontend calls `polls.vote` via tRPC. The server validates the vote (checks poll is active, deduplicates by session), inserts the vote into `poll_votes`, recalculates the tally, and publishes a `poll:results` event to the Ably channel with the updated tallies. All connected clients receive the update and re-render the results chart with a smooth animation. The entire flow targets under 500ms end-to-end latency.

Vote deduplication uses a combination of `voter_id` (for authenticated users) and `voter_session` (a UUID stored in localStorage for anonymous attendees). If a user attempts to vote twice on the same poll, the server rejects the duplicate with a descriptive error. For multiple-choice polls with `allow_multiple` enabled, the server tracks individual option selections and allows changing votes by replacing the previous selection.

### 5. Moderator Poll Management

The PollManager component is embedded in the Moderator Console as a dedicated panel. It provides the following capabilities.

**Poll Creation Form** — A form with fields for question text, poll type selector, options list (for multiple choice), scale range (for rating), duration (optional auto-close timer), and toggles for anonymous voting and multiple selection. The form validates that at least 2 options exist for multiple choice polls and that the question is not empty.

**Poll Queue** — A list of draft polls in the order they will be launched. Moderators can drag-and-drop to reorder, edit any draft poll, or delete it. The queue provides a visual overview of the planned polling sequence for the event.

**Active Poll Monitor** — When a poll is active, the monitor shows real-time vote count, response rate (votes / connected attendees), time remaining (if auto-close is set), and a live results chart. The moderator can close the poll manually at any time.

**Results History** — A list of all closed polls with their results. Each entry shows the question, vote count, and a mini chart. Clicking an entry opens the full results view.

### 6. Attendee Voting Interface

The LivePoll component appears in the event room when a poll is active. It is designed for maximum accessibility and speed.

**Desktop Layout** — The poll appears as a slide-in panel on the right side of the event room, overlaying the Q&A panel. The question is displayed prominently at the top, followed by the voting options. A "Dismiss" button allows attendees to hide the poll without voting.

**Mobile Layout** — The poll appears as a full-screen overlay with large tap targets (minimum 56px height per option). The question text is displayed in 20px font. After voting, the overlay transitions to show results and then minimizes to a small badge in the tab bar.

**Accessibility** — All poll options are keyboard-navigable with visible focus indicators. Screen readers announce the question and options. The results chart includes an accessible text summary (e.g., "Option A: 45%, Option B: 55%").

### 7. Results Visualization

Poll results are displayed with animated charts that update in real time as votes arrive.

**Multiple Choice** — Horizontal bar chart where each bar grows from left to right. The bar color uses the CuraLive accent palette. Each bar shows the option text, vote count, and percentage. The leading option is highlighted with a subtle glow effect.

**Rating Scale** — A large average score displayed prominently (e.g., "4.2 / 5") with a distribution histogram below showing the count for each rating value. The histogram bars are color-graded from red (1) to green (5).

**Word Cloud** — An animated word cloud where words appear and grow as more attendees submit them. Common words are larger and centered. The cloud uses the CuraLive color palette with the most frequent words in the primary color. The cloud re-layouts smoothly as new words arrive.

**Yes/No** — A donut chart with two segments (green for Yes, red for No) and the count displayed in the center. The chart animates as votes arrive, with the segments growing proportionally.

### 8. Scheduled Polls

Moderators can schedule polls to launch automatically at a specific time during the event. The scheduled time is stored in the `scheduled_at` field. A server-side scheduler checks for polls due to launch every 10 seconds and triggers the launch flow automatically. Scheduled polls appear in the Poll Queue with a clock icon and the scheduled time. The moderator can cancel or reschedule a pending poll at any time.

### 9. Analytics Integration

Poll data feeds into the Post-Event Report and the event analytics dashboard. The analytics include total polls conducted, average response rate per poll, sentiment trends derived from poll results (e.g., declining satisfaction scores over the event), and correlation between poll timing and Q&A activity. These analytics are computed post-event and stored as part of the event's analytics record.
