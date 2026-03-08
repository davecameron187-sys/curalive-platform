# Attendee Mobile Experience

## REPLIT SUMMARY

**Feature**: Attendee Mobile Experience  
**Route**: `/m/:eventId` (mobile-optimized event room)  
**Priority**: Medium  
**Status**: spec-ready  
**Dependencies**: Ably Real-Time Channels (implemented), Mux Live Streaming (implemented), Twilio/Telnyx Webphone (implemented)  

**What to build**: A mobile-first event experience optimized for attendees joining from smartphones and tablets. The current event room is desktop-optimized and difficult to use on small screens. This feature creates a dedicated mobile layout with swipeable panels for video, transcript, Q&A, and polls. It includes push notification support for event reminders and Q&A alerts, a mobile-optimized Q&A submission flow, and PSTN dial-in integration for audio-only participants.

**Key files to create or modify**:
- `client/src/pages/MobileEventRoom.tsx` — Mobile-optimized event room component
- `client/src/components/mobile/SwipeablePanel.tsx` — Swipeable panel container
- `client/src/components/mobile/MobileQA.tsx` — Mobile Q&A submission and viewing
- `client/src/components/mobile/MobileTranscript.tsx` — Mobile transcript viewer with auto-scroll
- `client/src/components/mobile/MobilePolls.tsx` — Mobile poll voting interface
- `server/routers/mobileNotifications.ts` — tRPC router for push notification management
- `client/src/App.tsx` — Register mobile route with device detection redirect

**Database table**: `push_subscriptions` with columns: `id`, `user_id` (FK users, nullable for anonymous attendees), `event_id` (FK conferences), `endpoint` (text), `p256dh_key` (text), `auth_key` (text), `device_type` (enum: ios, android, web), `is_active` (boolean), `created_at`, `updated_at`

**tRPC procedures**:
- `mobileNotifications.subscribe` (mutation, public) — Registers a push notification subscription
- `mobileNotifications.unsubscribe` (mutation, public) — Removes a push subscription
- `mobileNotifications.sendEventReminder` (mutation, protected) — Sends reminder to all subscribers for an event
- `mobileNotifications.sendQAAlert` (mutation, protected) — Notifies attendee when their question is answered

---

## Detailed Specification

### 1. Overview

Mobile devices account for a significant portion of event attendees, particularly for investor events where participants join from various locations. The current CuraLive event room is built for desktop screens and presents usability challenges on mobile: the multi-panel layout becomes cramped, text is difficult to read, and interactive elements (Q&A submission, poll voting) are hard to tap accurately. This specification defines a dedicated mobile experience that provides full event participation from any smartphone or tablet.

### 2. Device Detection and Routing

When an attendee navigates to `/event/:eventId`, the system detects the device type using the User-Agent header and viewport width. If the device is identified as mobile (viewport width below 768px or mobile User-Agent), the user is automatically redirected to `/m/:eventId`. A "Switch to Desktop View" link is always available for users who prefer the full layout. Conversely, the desktop event room includes a QR code that attendees can scan to open the mobile view on their phone while keeping the desktop view on their laptop.

### 3. Mobile Layout

The mobile event room uses a single-column layout with swipeable horizontal panels. The bottom of the screen has a fixed tab bar for navigation between panels.

| Panel | Content | Tab Icon |
|---|---|---|
| **Video** | Mux video player (fills viewport width), speaker name overlay, live/replay badge | Play icon |
| **Transcript** | Auto-scrolling live transcript, speaker labels, language toggle | Text icon |
| **Q&A** | Question list with upvote buttons, submission form, category filter | Message icon |
| **Polls** | Active poll with large tap targets, results display, poll history | Chart icon |
| **Info** | Event details, speaker bios, agenda, dial-in numbers | Info icon |

The panels are implemented as a horizontal scroll container with snap points, allowing attendees to swipe left and right between panels. The active panel is indicated by the highlighted tab in the bottom bar. Swiping is smooth with momentum scrolling and snap-to-panel behavior.

### 4. Mobile Video Player

The video panel displays the Mux HLS stream in a player optimized for mobile viewing. The player fills the full viewport width and maintains a 16:9 aspect ratio. Controls include play/pause, mute/unmute, fullscreen toggle, and quality selector (auto, 720p, 480p, 360p). The quality selector defaults to "auto" which adapts to the connection speed. Below the player, a thin sentiment indicator bar shows the current audience sentiment (green for positive, yellow for neutral, red for negative) as a visual pulse.

For audio-only events or when the attendee's connection is poor, the video panel displays a branded audio visualization (waveform animation) with the speaker's name and the event title. A "Switch to Audio Only" button allows attendees to manually downgrade to audio-only mode to save bandwidth.

### 5. Mobile Transcript

The transcript panel displays the live transcript in a vertically scrolling list optimized for mobile reading. Each segment shows the speaker name (color-coded), the timestamp, and the transcript text in a font size appropriate for mobile (16px minimum). The transcript auto-scrolls to follow the live feed, with a "scroll lock" toggle that pauses auto-scroll when the attendee scrolls up to review earlier content. A floating "Jump to Live" button appears when the attendee is scrolled away from the latest content.

The language toggle is a dropdown at the top of the panel that switches the transcript between available languages. When the language is changed, the transcript re-renders with the translated text. The current language selection is persisted in localStorage so it survives page refreshes.

### 6. Mobile Q&A

The Q&A panel is designed for easy question submission and browsing on mobile. The submission form is a sticky input bar at the bottom of the panel (similar to a chat input) with a text field, a category selector (dropdown), and a submit button. The text field expands vertically as the attendee types, up to a maximum of 4 lines.

The question list displays submitted questions sorted by upvote count (default) or chronological order (toggle). Each question card shows the question text, the submitter name (or "Anonymous"), the category badge, the upvote count, and an upvote button. The upvote button is large enough for easy tapping (minimum 44x44px touch target). Questions that have been answered by the moderator are marked with a green checkmark and the answer is displayed below the question.

### 7. Mobile Polls

The polls panel displays the currently active poll with large, tappable option buttons. Each option button spans the full width of the screen and is at least 56px tall for easy selection. After voting, the results are displayed as a horizontal bar chart with percentages. Previous polls are listed below the active poll in a collapsed accordion format.

### 8. Push Notifications

The system supports web push notifications to alert attendees about event updates. Push notifications are implemented using the Web Push API with VAPID keys stored as environment variables.

**8.1 Subscription Flow** — When an attendee opens the mobile event room, they are prompted to enable notifications with a non-intrusive banner at the top of the screen. If they accept, the browser requests notification permission and registers a push subscription. The subscription details (endpoint, keys) are sent to the server via `mobileNotifications.subscribe` and stored in the `push_subscriptions` table.

**8.2 Notification Types** — The system sends four types of notifications: event starting in 15 minutes (reminder), event is now live (start alert), your question has been answered (Q&A alert), and new poll is available (poll alert). Each notification includes the event title, a brief message, and a deep link back to the relevant panel in the mobile event room.

**8.3 Notification Delivery** — Notifications are sent from the server using the `web-push` npm package. The operator triggers reminders manually from the Operator Console, while Q&A alerts and poll alerts are triggered automatically by the respective event handlers.

### 9. PSTN Dial-In Integration

For attendees who cannot use the mobile web experience (poor internet, feature phones), the Info panel prominently displays PSTN dial-in numbers. The dial-in section shows the local number for the attendee's detected country (based on IP geolocation), a list of all available dial-in numbers by country, the conference PIN, and a "Tap to Dial" button that opens the phone dialer with the number pre-filled. The dial-in numbers are sourced from the existing Twilio/Telnyx integration.

### 10. Offline Resilience

Mobile attendees frequently experience intermittent connectivity. The mobile event room should handle connection drops gracefully by displaying a "Reconnecting..." banner when the Ably connection is lost, buffering the last 5 minutes of transcript locally so it remains readable during brief disconnections, queuing Q&A submissions and poll votes locally and sending them when the connection is restored, and maintaining the video player in a paused state (rather than showing an error) during network interruptions. When the connection is restored, the system catches up by fetching missed transcript segments and Q&A updates from the server.

### 11. Performance Requirements

The mobile event room must load within 3 seconds on a 4G connection. The initial bundle size should be under 200KB (gzipped) by code-splitting the mobile components from the desktop bundle. Images and video thumbnails should use responsive sizing with `srcset` attributes. The Ably connection should use the mobile-optimized transport (WebSocket with fallback to long-polling). Battery usage should be minimized by reducing animation frame rates and using `requestIdleCallback` for non-critical updates.
