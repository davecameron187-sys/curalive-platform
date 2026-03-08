# Event Scheduling and Calendar Integration

## REPLIT SUMMARY

**Feature**: Event Scheduling and Calendar Integration  
**Route**: `/events/schedule` (scheduling dashboard), `/events/calendar` (calendar view)  
**Priority**: Medium  
**Status**: spec-ready  
**Dependencies**: Enterprise Billing (implemented), OCC Operator Console (implemented), Twilio/Telnyx Webphone (implemented)  

**What to build**: A comprehensive event scheduling system with calendar views, recurring event templates, operator assignment, resource allocation (dial-in numbers, RTMP keys, Mux streams), and external calendar integration (Google Calendar, Outlook/Exchange via iCal). The scheduler allows event hosts to book events in advance, operators to manage their availability, and the system to automatically provision technical resources for each event.

**Key files to create or modify**:
- `client/src/pages/EventScheduler.tsx` — Event creation and scheduling form
- `client/src/pages/EventCalendar.tsx` — Calendar view with day/week/month modes
- `client/src/components/OperatorAvailability.tsx` — Operator availability management
- `server/routers/scheduling.ts` — tRPC router for scheduling operations
- `server/services/SchedulingService.ts` — Service for resource allocation and conflict detection
- `server/services/CalendarSyncService.ts` — iCal/Google Calendar sync service
- `drizzle/schema.ts` — Add `event_schedules`, `operator_availability`, `resource_allocations`, `event_templates` tables

**Database tables**:

`event_schedules`: `id`, `event_id` (FK conferences), `scheduled_start` (timestamp), `scheduled_end` (timestamp), `timezone` (varchar), `recurrence_rule` (varchar, nullable, iCal RRULE format), `parent_schedule_id` (FK self, nullable, for recurring instances), `setup_minutes` (int, default 30), `teardown_minutes` (int, default 15), `status` (enum: tentative, confirmed, cancelled), `created_by` (FK users), `created_at`, `updated_at`

`operator_availability`: `id`, `operator_id` (FK users), `day_of_week` (int, 0-6), `start_time` (time), `end_time` (time), `is_available` (boolean), `override_date` (date, nullable, for specific date overrides), `created_at`, `updated_at`

`resource_allocations`: `id`, `event_id` (FK conferences), `resource_type` (enum: dial_in_number, rtmp_key, mux_stream, recall_bot, ably_channel), `resource_identifier` (varchar), `allocated_at` (timestamp), `released_at` (timestamp, nullable), `created_at`

`event_templates`: `id`, `template_name` (varchar), `created_by` (FK users), `event_type` (enum: earnings_call, investor_day, roadshow, webcast, audio_bridge, board_briefing), `default_duration_minutes` (int), `default_setup_minutes` (int), `default_features` (JSON), `default_platform` (enum: zoom, teams, webex, rtmp, pstn), `dial_in_countries` (JSON), `max_attendees` (int), `requires_registration` (boolean), `compliance_enabled` (boolean), `created_at`, `updated_at`

**tRPC procedures**:
- `scheduling.createEvent` (mutation, protected) — Creates a scheduled event with resource allocation
- `scheduling.updateEvent` (mutation, protected) — Updates event schedule and reallocates resources if needed
- `scheduling.cancelEvent` (mutation, protected) — Cancels event and releases allocated resources
- `scheduling.getCalendar` (query, protected) — Returns events for a date range with operator assignments
- `scheduling.checkConflicts` (query, protected) — Checks for scheduling conflicts (operator, resource, time)
- `scheduling.setAvailability` (mutation, protected) — Sets operator availability schedule
- `scheduling.getAvailableOperators` (query, protected) — Returns operators available for a given time slot
- `scheduling.assignOperator` (mutation, protected) — Assigns an operator to an event
- `scheduling.createTemplate` (mutation, protected) — Creates a reusable event template
- `scheduling.listTemplates` (query, protected) — Lists available event templates
- `scheduling.generateIcal` (query, protected) — Generates iCal feed URL for calendar subscription
- `scheduling.syncGoogleCalendar` (mutation, protected) — Triggers Google Calendar sync

---

## Detailed Specification

### 1. Overview

Event scheduling is currently a manual process in CuraLive — operators create events ad hoc and manually configure technical resources. This specification introduces a structured scheduling system that automates resource provisioning, prevents conflicts, manages operator assignments, and integrates with external calendar systems. The scheduler is essential for scaling CuraLive's operations beyond a handful of concurrent events to dozens of daily events across multiple clients and time zones.

### 2. Event Creation Flow

The event creation flow guides the host through a multi-step form that collects all necessary information and automatically provisions resources.

**Step 1: Template Selection** — The host selects an event template (earnings call, investor day, roadshow, webcast, audio bridge, board briefing) or starts from scratch. Templates pre-fill default values for duration, platform, features, and dial-in countries, reducing setup time for common event types.

**Step 2: Event Details** — The host enters the event title, description, date and time (with timezone selector), expected duration, and maximum attendees. For recurring events, the host configures a recurrence pattern (daily, weekly, monthly, custom) using a visual recurrence builder that generates iCal RRULE strings.

**Step 3: Platform Configuration** — The host selects the primary platform (Zoom, Teams, Webex, RTMP, PSTN) and configures platform-specific settings. For Zoom events, the system generates a Zoom meeting link via the Recall.ai integration. For RTMP events, the system allocates an RTMP ingest key from the Mux pool. For PSTN events, the system allocates dial-in numbers from the Telnyx pool for the selected countries.

**Step 4: Feature Selection** — The host enables or disables CuraLive features for the event: live transcription, Q&A, sentiment analysis, live polling, compliance scanning, and post-event report generation. Feature availability is gated by the client's billing tier if the event is assigned to a white-label portal.

**Step 5: Operator Assignment** — The system displays available operators for the selected time slot (based on `operator_availability` data) and allows the host to assign a primary operator and an optional backup operator. If no operators are available, the system suggests alternative time slots.

**Step 6: Confirmation** — The system displays a summary of the event configuration, allocated resources, and assigned operators. The host confirms and the event is created with status "tentative". The assigned operator receives a notification and must confirm their assignment within 24 hours, at which point the status changes to "confirmed".

### 3. Calendar Views

The EventCalendar page provides three calendar views for managing the event schedule.

**Month View** — A traditional month grid showing event dots on each day. Clicking a day opens the day view. Color-coded dots indicate event status: blue for confirmed, yellow for tentative, red for cancelled, green for live. The month view provides a high-level overview of event density and scheduling patterns.

**Week View** — A 7-column grid with hourly rows showing events as colored blocks. Events span their scheduled duration including setup and teardown time (shown as lighter-colored extensions). Overlapping events are displayed side by side. The week view is the primary working view for operators managing their daily schedule.

**Day View** — A detailed single-day timeline showing all events with their full details: title, time, platform, assigned operator, and status. Each event block is clickable, opening a detail panel with quick actions (edit, cancel, launch, assign operator). The day view also shows operator availability as background shading (green for available, gray for unavailable).

### 4. Conflict Detection

The scheduling system prevents three types of conflicts.

**Operator Conflicts** — An operator cannot be assigned to overlapping events. The conflict check considers the event duration plus setup and teardown time. When a conflict is detected, the system displays the conflicting event and suggests alternative operators or time slots.

**Resource Conflicts** — Certain resources have limited availability: dial-in numbers (pool of 20 numbers shared across events), RTMP keys (pool of 10 Mux stream keys), and Recall.ai bots (pool of 5 concurrent bots). The system tracks resource allocation in the `resource_allocations` table and prevents over-allocation. When a resource pool is exhausted, the system displays a warning and suggests alternative time slots when resources are available.

**Time Conflicts** — The system warns (but does not prevent) when the same host schedules overlapping events, as this may be intentional for multi-track conferences.

### 5. Resource Allocation

When an event is confirmed, the system automatically allocates technical resources.

| Resource | Allocation Trigger | Release Trigger |
|---|---|---|
| Dial-in Numbers | Event confirmed | Event completed + 15 min |
| RTMP Key | Event confirmed | Event completed + 5 min |
| Mux Stream | 30 min before event start | Event completed + 30 min |
| Recall.ai Bot | 5 min before event start | Event completed |
| Ably Channel | Event created | Event archived |

Resources are allocated from pools managed by the SchedulingService. Each pool has a configurable size. When a resource is allocated, it is marked as in-use in the `resource_allocations` table. When released, the `released_at` timestamp is set and the resource returns to the pool. The system monitors pool utilization and sends alerts to admins when utilization exceeds 80%.

### 6. Operator Availability Management

The OperatorAvailability component allows operators to define their working hours and manage exceptions.

**Weekly Schedule** — A grid showing 7 days with configurable time blocks. Operators drag to select their available hours for each day. The default schedule is Monday–Friday, 08:00–18:00 in the operator's timezone.

**Date Overrides** — Operators can mark specific dates as unavailable (holidays, personal time) or extend their availability for specific dates (weekend coverage). Overrides take precedence over the weekly schedule.

**Timezone Handling** — All availability is stored in UTC and converted to the operator's local timezone for display. When scheduling events across timezones, the system converts the event time to each operator's timezone to check availability.

### 7. External Calendar Integration

The system supports two methods of calendar integration.

**iCal Feed** — Each operator and host gets a unique iCal feed URL that can be subscribed to from any calendar application (Google Calendar, Outlook, Apple Calendar). The feed includes all events assigned to the user with standard iCal properties (VEVENT, DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION). The feed is read-only and updates automatically when events are created, modified, or cancelled. The feed URL includes a token for authentication.

**Google Calendar Sync** — For users who connect their Google account, the system provides bidirectional sync. CuraLive events appear in the user's Google Calendar, and the user's Google Calendar availability is imported to prevent scheduling conflicts. The sync uses the Google Calendar API with OAuth2 authentication. Sync runs every 15 minutes via a server-side scheduled job.

### 8. Event Templates

Templates allow hosts to create events quickly by pre-filling common configurations. Each template stores the event type, default duration, platform configuration, feature selections, dial-in countries, and attendee limits. Templates are created by admin users and shared across the organization. Hosts can customize any template field when creating an event — the template serves as a starting point, not a constraint.

### 9. Notifications

The scheduling system sends notifications at key points in the event lifecycle: event created (to assigned operator), operator assignment pending confirmation (to operator), event confirmed (to host and operator), event starting in 24 hours (to host, operator, and registered attendees), event starting in 15 minutes (to all), event cancelled (to all), and schedule change (to affected parties). Notifications are sent via the existing `notifyOwner` helper for operator-facing alerts and via email (Resend integration) for attendee-facing alerts.
