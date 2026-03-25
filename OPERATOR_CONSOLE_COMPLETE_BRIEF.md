# CuraLive Operator Console (OCC) — Complete Technical Brief

**Version:** 1.0  
**Status:** Production Specification  
**Audience:** Frontend Development Team (Replit)  
**Priority:** CRITICAL — Control Centre of CuraLive Business  
**Quality Standard:** World-Class, 100% Functional

---

## Executive Summary

The **Operator Console (OCC)** is the command centre for managing live events on the CuraLive platform. It provides operators with real-time visibility into all active conferences, participant management, call control, and advanced features like transcription, sentiment analysis, and Q&A moderation. This brief defines every aspect of the frontend interface, user interactions, data flow, and operational requirements to ensure a production-ready, enterprise-grade control centre.

**Key Objectives:**
- Provide operators with complete control over live events
- Enable real-time monitoring of participant status and sentiment
- Support complex multi-participant call management
- Deliver sub-100ms real-time updates via Ably WebSocket
- Ensure 100% uptime and reliability for mission-critical operations
- Support 18+ countries and 12+ languages
- Maintain enterprise-grade security and audit trails

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Interface Layout & Navigation](#interface-layout--navigation)
3. [Core Sections](#core-sections)
4. [Real-Time Data Flow](#real-time-data-flow)
5. [Feature Specifications](#feature-specifications)
6. [State Management](#state-management)
7. [Performance & Optimization](#performance--optimization)
8. [Security & Compliance](#security--compliance)
9. [Error Handling & Recovery](#error-handling--recovery)
10. [Testing Requirements](#testing-requirements)
11. [Deployment & Monitoring](#deployment--monitoring)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OPERATOR CONSOLE (OCC)                           │
│                    Frontend React Application                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Top Navigation Bar                                          │   │
│  │  - Logo, Operator Name, Window Launcher, State Indicator    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Live Call Counter Dashboard (8 Metric Cards)               │   │
│  │  - Active Calls, Participants, Sentiment, Q&A, etc.        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────┐  ┌──────────────────────────────────────────────┐  │
│  │  LEFT       │  │  MAIN CONTENT AREA                           │  │
│  │  SIDEBAR    │  ├──────────────────────────────────────────────┤  │
│  │             │  │  Conference Overview Section                 │  │
│  │  - Running  │  │  - Table with all active/pending calls       │  │
│  │    Calls    │  │  - Tabs: Running, Pending, Completed, Alarms│  │
│  │  - Post     │  │  - Actions: Open CCP, Split View, Details   │  │
│  │    Event    │  ├──────────────────────────────────────────────┤  │
│  │  - Simulate │  │  Conference Control Panel Section            │  │
│  │    Call     │  │  - Conference Bar (action buttons)           │  │
│  │  - Settings │  │  - Search & Filter Bar                       │  │
│  │  - Operator │  │  - Participant Table (real-time updates)     │  │
│  │    Settings │  │  - Multi-Select Action Bar                   │  │
│  │             │  ├──────────────────────────────────────────────┤  │
│  │             │  │  Feature Tabs Section                        │  │
│  │             │  │  - Monitoring, Connection, History, etc.     │  │
│  │             │  └──────────────────────────────────────────────┘  │
│  └─────────────┘                                                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
         │                                                  │
         └──────────────────┬───────────────────────────────┘
                            │
         ┌──────────────────┴───────────────────────┐
         │                                          │
    ┌────▼─────┐                          ┌────────▼────┐
    │  tRPC    │                          │    Ably     │
    │  Backend │◄─────────────────────────│  WebSocket  │
    │  API     │  REST/tRPC               │  Real-Time  │
    └────┬─────┘                          └────────┬────┘
         │                                          │
    ┌────▼──────────────────────────────────────────▼────┐
    │         Backend Services & Databases              │
    │  - Conference Management                          │
    │  - Participant State                              │
    │  - Call Recording & Transcription                 │
    │  - Sentiment Analysis                             │
    │  - Q&A Management                                 │
    │  - Audit Logs                                     │
    └────────────────────────────────────────────────────┘
```

### Data Flow

**Real-Time Updates (Ably WebSocket):**
- Participant status changes (connected, speaking, muted, parked, disconnected)
- Sentiment scores (updated every 5 seconds)
- Q&A submissions and votes
- Conference state changes (recording, locked, etc.)
- Transcription updates (streaming)
- Chat messages

**Polling Updates (tRPC REST):**
- Initial page load (conference list, participant list)
- Search results
- Filter changes
- Action confirmations
- Audit trail

---

## Interface Layout & Navigation

### 1. Top Navigation Bar

**Components:**
- **Logo/Branding:** CuraLive logo (left), clickable to return to home
- **Operator Name:** Display current logged-in operator name
- **Window Launcher:** Quick access to other modules (Moderator Console, Presenter Teleprompter, etc.)
- **State Indicator:** Shows operator availability status (Available, In Call, Away, Do Not Disturb)
- **Notifications:** Bell icon with unread notification count
- **Settings:** Gear icon for operator preferences
- **Logout:** Sign out button

**Styling:**
- Height: 64px
- Background: Dark gradient (#0f172a to #1e293b)
- Border-bottom: 1px solid #334155
- Sticky positioning (stays at top during scroll)
- Responsive: Hamburger menu on mobile

---

### 2. Left Sidebar Navigation

**Purpose:** Primary navigation for different operator workflows

**Tabs (Vertical Layout):**

| Tab | Icon | Label | Purpose |
|-----|------|-------|---------|
| 1 | 📞 | Running Calls | View active conferences and participants |
| 2 | 📊 | Post Event | Access post-event reports and analytics |
| 3 | 🎙️ | Simulate Call | Test call scenarios and features |
| 4 | ⚙️ | Settings | Operator preferences and configuration |
| 5 | 👤 | Op Settings | Operator-specific settings and permissions |

**Styling:**
- Width: 80-100px (narrow, icon-focused)
- Background: #0f172a with subtle gradient
- Tab Height: 70px
- Padding: 8px (minimal)
- Font: text-[10px], font-semibold
- Icons: 24px, centered above text
- Active Tab: Blue background (#3b82f6/40), blue border-left (4px)
- Inactive Tab: Slate background (#64748b/20), slate text
- Hover: Slight background lighten, cursor pointer
- Transition: 200ms ease-in-out

**Interactions:**
- Click to switch tabs
- Highlight active tab with blue accent
- Show tooltip on hover (for accessibility)
- Smooth transition between tabs

---

### 3. Live Call Counter Dashboard

**Purpose:** At-a-glance metrics for current event status

**Metric Cards (8 Total):**

| Metric | Display | Update Frequency | Color |
|--------|---------|------------------|-------|
| Active Calls | Number + Icon | Real-time (Ably) | Blue (#3b82f6) |
| Total Participants | Number + Icon | Real-time (Ably) | Green (#10b981) |
| Speaking Now | Number + Icon | Real-time (Ably) | Amber (#f59e0b) |
| Muted Participants | Number + Icon | Real-time (Ably) | Red (#ef4444) |
| Sentiment Score | Gauge (0-100) | Every 5s (Ably) | Dynamic (red→green) |
| Q&A Submitted | Number + Badge | Real-time (Ably) | Purple (#a855f7) |
| Transcription Status | Status + % | Real-time (Ably) | Cyan (#06b6d4) |
| Recording Status | Status + Timer | Real-time (Ably) | Red (#ef4444) |

**Card Styling:**
- Grid: 4 columns on desktop, 2 on tablet, 1 on mobile
- Height: 100px
- Background: Gradient (#1e293b to #0f172a)
- Border: 1px solid #334155
- Border-radius: 8px
- Padding: 16px
- Font: Bold number (24px), label (12px)
- Icon: 32px, positioned top-right
- Hover: Slight scale (1.02) and shadow

**Interactions:**
- Click metric card to filter participant table by that status
- Hover to show tooltip with additional details
- Real-time animation when value changes (pulse effect)

---

## Core Sections

### Section 1: Conference Overview

**Location:** Top of main content area (right of sidebar)

**Purpose:** Display all running, pending, and completed conferences with quick access to controls

**Header:**
- Title: "Conference Overview"
- Collapse/Expand button (minimize section)
- Refresh button (manual refresh)
- Export button (export to CSV)

**Tab Bar:**
- **Running:** Active conferences (default view)
- **Pending:** Upcoming conferences (not yet started)
- **Completed:** Finished conferences (last 24 hours)
- **Alarms:** Conferences with alerts (e.g., high sentiment drop, high participant wait time)

**Table Columns:**

| Column | Width | Data Type | Sortable | Filterable | Notes |
|--------|-------|-----------|----------|-----------|-------|
| Checkbox | 40px | Boolean | No | No | For multi-select |
| Call-ID | 100px | String | Yes | Yes | Unique identifier (e.g., CC-9921) |
| Subject | 200px | String | Yes | Yes | Conference title/name |
| Reseller | 120px | String | Yes | Yes | Reseller/Client name |
| Start Time | 100px | DateTime | Yes | Yes | Conference start time (local) |
| Duration | 80px | Duration | Yes | No | Elapsed time (MM:SS) |
| Participants | 80px | Number | Yes | No | Total participant count |
| Mod Code | 80px | String | No | No | Moderator dial-in code |
| Part Code | 80px | String | No | No | Participant dial-in code |
| Dial-In | 100px | String | No | No | Primary dial-in number |
| Status | 100px | Enum | Yes | Yes | Running, Pending, Completed, Error |
| Actions | 200px | Buttons | No | No | Open CCP, Split View, Details, Export |

**Row Styling:**
- Height: 48px
- Background: Alternating #0f172a and #1e293b
- Border-bottom: 1px solid #334155
- Hover: Background lighten to #1e293b, cursor pointer
- Selected: Blue background (#3b82f6/20), blue left border

**Actions:**
- **Open CCP:** Opens Conference Control Panel for that conference
- **Split View:** Opens conference in new window (for multi-monitor setup)
- **Details:** Shows conference metadata (organizer, attendees, recording status, etc.)
- **Export:** Downloads conference data as CSV

**Interactions:**
- Click row to select (highlight)
- Double-click row to open Conference Control Panel
- Click "Open CCP" button to open Conference Control Panel
- Drag column header to resize
- Click column header to sort (ascending/descending)
- Right-click row for context menu (Copy ID, View Details, etc.)

---

### Section 2: Conference Control Panel (CCP)

**Location:** Below Conference Overview

**Purpose:** Detailed controls and management for the selected conference

**Header:**
- Title: "Conference Control Panel — [Conference Name] ([Call ID])"
- Close button (minimize CCP)
- Settings button (CCP preferences)

**Subsection 2A: Conference Bar (Action Buttons)**

**Buttons (Left to Right):**

| Button | Icon | State | Action | Confirmation |
|--------|------|-------|--------|--------------|
| Record | ⏺️ | Toggle | Start/Stop recording | Yes (if stopping) |
| Lock | 🔒 | Toggle | Lock/Unlock conference | No |
| Mute Participants Only | 🔇 | Action | Mute all participants (keep mod unmuted) | Yes |
| Mute All | 🔇🔇 | Action | Mute all participants including mod | Yes |
| Disconnect | ❌ | Action | Disconnect all participants | Yes (confirm) |
| Dial Out | ☎️ | Action | Initiate outbound call | Dialog |
| Capacity Warning | ⚠️ | Info | Show if approaching capacity limit | Tooltip |
| Q&A Raised Hands | ✋ | Badge | Show count of raised hands | Click to view |

**Button Styling:**
- Height: 40px
- Padding: 8px 16px
- Font: 12px, semibold
- Border-radius: 6px
- Background: #1e293b
- Border: 1px solid #334155
- Text: #e2e8f0
- Hover: Background #334155, border #475569
- Active/Pressed: Background #3b82f6, border #3b82f6, text white
- Disabled: Opacity 0.5, cursor not-allowed
- Icon: 16px, margin-right 6px

**Spacing:** 8px gap between buttons

**Interactions:**
- Click to perform action
- Show tooltip on hover (e.g., "Click to start recording")
- Disabled state if no conference selected
- Real-time state update (e.g., Record button turns red when recording)

---

**Subsection 2B: Search Bar**

**Input Field:**
- Placeholder: "Search by name, company, phone, location..."
- Width: Full width of CCP
- Height: 40px
- Background: #0f172a
- Border: 1px solid #334155
- Border-radius: 6px
- Padding: 8px 12px
- Font: 14px
- Text color: #e2e8f0
- Focus: Border color #3b82f6, box-shadow blue glow

**Functionality:**
- Real-time search (debounced 300ms)
- Search across: Name, Company, Phone, Location, Email
- Case-insensitive
- Partial match support
- Clear button (X icon) to reset search

**Results:**
- Highlights matching text in participant table
- Shows "X results found" below search bar
- Clears when search input is empty

---

**Subsection 2C: Filter Bar**

**Filter Buttons:**

| Filter | Purpose | Count Badge |
|--------|---------|-------------|
| All | Show all participants | Total count |
| Mod | Moderators only | Count |
| Part | Participants only | Count |
| Unmuted | Unmuted participants | Count |
| Muted | Muted participants | Count |
| Parked | Parked participants | Count |
| Connected | Connected participants | Count |
| Waiting | Waiting to join | Count |
| Web | Web participants | Count |
| Speak Req | Speaking request raised | Count |

**Button Styling:**
- Height: 32px
- Padding: 6px 12px
- Font: 11px, semibold
- Border-radius: 4px
- Background: #1e293b (inactive), #3b82f6 (active)
- Border: 1px solid #334155 (inactive), #3b82f6 (active)
- Text: #94a3b8 (inactive), white (active)
- Badge: Small circle with count (top-right corner)
- Hover: Background lighten
- Transition: 150ms ease-in-out

**Spacing:** 6px gap between buttons

**Interactions:**
- Click to toggle filter
- Multiple filters can be active simultaneously (AND logic)
- Participant table updates in real-time
- "All" button clears all other filters

---

**Subsection 2D: Participant Table**

**Purpose:** Real-time view of all participants in the conference

**Columns:**

| Column | Width | Data Type | Sortable | Filterable | Real-Time | Notes |
|--------|-------|-----------|----------|-----------|-----------|-------|
| Checkbox | 40px | Boolean | No | No | No | Multi-select |
| Role | 80px | Enum | Yes | Yes | No | Moderator, Participant, Host, Observer |
| Name | 150px | String | Yes | Yes | No | Participant name |
| Company | 150px | String | Yes | Yes | No | Company/Organization |
| Phone | 120px | String | Yes | Yes | No | Phone number (masked for privacy) |
| Location | 100px | String | Yes | Yes | No | Geographic location (from IP) |
| US | 40px | String | No | No | No | Unique Session ID |
| Connected | 80px | DateTime | Yes | No | Yes | Time connected (HH:MM:SS) |
| State | 100px | Enum | Yes | Yes | Yes | Speaking, Connected, Muted, Parked, Waiting, Disconnected |
| Sentiment | 80px | Score | Yes | No | Yes | Real-time sentiment score (0-100, color-coded) |
| Actions | 250px | Buttons | No | No | No | Inline action buttons |

**Row Styling:**
- Height: 44px
- Background: Alternating #0f172a and #1e293b
- Border-bottom: 1px solid #334155
- Hover: Background lighten, cursor pointer
- Selected: Blue background (#3b82f6/20), blue left border (4px)
- State Color Coding:
  - Speaking: Green (#10b981) background
  - Connected: Blue (#3b82f6) background
  - Muted: Amber (#f59e0b) background
  - Parked: Purple (#a855f7) background
  - Waiting: Gray (#64748b) background
  - Disconnected: Red (#ef4444) background

**Interactions:**
- Click checkbox to select/deselect participant
- Click row to highlight (select)
- Shift+Click to select range
- Ctrl/Cmd+Click to select multiple non-contiguous rows
- Double-click to open participant detail panel
- Right-click for context menu

---

**Subsection 2E: Participant Action Buttons (Inline)**

**Buttons (per row):**

| Button | Icon | Action | Confirmation | Notes |
|--------|------|--------|--------------|-------|
| Unmute | 🔊 | Unmute participant | No | Only if muted |
| Mute | 🔇 | Mute participant | No | Only if unmuted |
| Park | 🅿️ | Park participant (hold) | No | Participant can hear hold music |
| Unpark | ▶️ | Unpark participant | No | Resume participant |
| Disconnect | ❌ | Disconnect participant | Yes | Permanent removal |
| History | 📋 | Show participant history | No | Opens detail panel |
| Details | ℹ️ | Show full participant info | No | Opens detail panel |
| Transfer | ↔️ | Transfer to another operator | Dialog | Select target operator |
| Record | ⏺️ | Record this participant's audio | Toggle | Separate recording |
| Transcribe | 📝 | Enable transcription for this participant | Toggle | Real-time transcription |

**Button Styling:**
- Height: 32px
- Width: 32px (icon-only buttons)
- Padding: 6px
- Border-radius: 4px
- Background: #1e293b
- Border: 1px solid #334155
- Icon: 16px, centered
- Hover: Background #334155, border #475569, cursor pointer
- Disabled: Opacity 0.5, cursor not-allowed
- Tooltip: Show on hover (e.g., "Mute participant")

**Spacing:** 4px gap between buttons

---

**Subsection 2F: Multi-Select Action Bar**

**Appears When:** One or more participants selected

**Location:** Below participant table

**Buttons:**

| Button | Action | Confirmation |
|--------|--------|--------------|
| Unmute All Selected | Unmute all selected participants | No |
| Mute All Selected | Mute all selected participants | No |
| Park All Selected | Park all selected participants | No |
| Disconnect All Selected | Disconnect all selected participants | Yes |
| Transfer All Selected | Transfer to another operator | Dialog |

**Styling:**
- Height: 44px
- Background: #1e293b with blue left border (4px)
- Padding: 12px 16px
- Display: Flex, gap 8px
- Show/Hide: Smooth fade transition (200ms)
- Text: "X participants selected" (left side)
- Buttons: Right side

**Interactions:**
- Click button to perform bulk action
- Show confirmation dialog for destructive actions
- Update all selected rows in real-time
- Clear selection after action completes

---

### Section 3: Feature Tabs

**Location:** Below participant table

**Purpose:** Access advanced features and detailed information

**Tabs:**

| Tab | Icon | Purpose | Content |
|-----|------|---------|---------|
| Monitoring | 📊 | Real-time monitoring | Call quality, bandwidth, latency, jitter |
| Connection | 🔗 | Connection details | IP addresses, codec, encryption, NAT info |
| History | 📜 | Participant history | Previous calls, duration, notes |
| Audio Files | 🎵 | Audio recordings | Download, playback, transcription |
| Chat | 💬 | Chat messages | Real-time chat transcript |
| Notes | 📝 | Operator notes | Add/edit notes about participant or call |
| Q&A Queue | ❓ | Q&A management | Submitted questions, voting, moderation |
| CuraLive Direct | 📞 | Direct messaging | Send messages to participant |

**Tab Styling:**
- Height: 40px
- Background: #0f172a
- Border-bottom: 2px solid #334155
- Active Tab: Blue underline (#3b82f6), text white
- Inactive Tab: Text #94a3b8
- Hover: Text #e2e8f0, cursor pointer
- Transition: 150ms ease-in-out

**Content Area:**
- Height: Auto (minimum 200px)
- Background: #0f172a
- Padding: 16px
- Border: 1px solid #334155
- Border-radius: 0 0 6px 6px

---

## Real-Time Data Flow

### Ably WebSocket Channels

**Channel Structure:**
```
conference:{conferenceId}:participants
conference:{conferenceId}:sentiment
conference:{conferenceId}:qa
conference:{conferenceId}:transcription
conference:{conferenceId}:state
conference:{conferenceId}:chat
```

**Update Frequency:**

| Data Type | Frequency | Latency Target | Ably Channel |
|-----------|-----------|-----------------|--------------|
| Participant Status | Real-time | <100ms | participants |
| Sentiment Score | Every 5s | <500ms | sentiment |
| Q&A Updates | Real-time | <100ms | qa |
| Transcription | Streaming | <1s | transcription |
| Conference State | Real-time | <100ms | state |
| Chat Messages | Real-time | <100ms | chat |

**Message Format (JSON):**

```json
{
  "type": "participant_status_changed",
  "timestamp": "2026-03-07T14:30:45.123Z",
  "conferenceId": "CC-9921",
  "participantId": 12345,
  "data": {
    "name": "John Doe",
    "state": "speaking",
    "isMuted": false,
    "sentiment": 78,
    "duration": "00:05:32"
  }
}
```

### Frontend State Management

**Real-Time State Updates:**
- Subscribe to Ably channels on component mount
- Update React state on message received
- Debounce rapid updates (e.g., sentiment changes)
- Unsubscribe on component unmount

**Caching Strategy:**
- Cache participant list (refresh every 30 seconds)
- Cache conference metadata (refresh every 60 seconds)
- Cache operator settings (refresh on change)
- Cache user preferences (localStorage)

---

## Feature Specifications

### Feature 1: Conference Management

**Create Conference:**
- Button: "New Conference" (top-right of Conference Overview)
- Dialog: Event Type, Title, Start Time, Duration, Participants, Settings
- Validation: Required fields, date/time validation
- Success: Conference appears in Running tab

**Edit Conference:**
- Right-click conference row → "Edit"
- Dialog: Edit title, description, settings
- Restrictions: Cannot edit start time or duration (in progress)
- Success: Changes reflected in real-time

**Delete Conference:**
- Right-click conference row → "Delete"
- Confirmation: "Are you sure? This cannot be undone."
- Restrictions: Can only delete pending/completed conferences
- Success: Conference removed from list

**Lock Conference:**
- Button: "Lock" in Conference Bar
- Effect: No new participants can join
- Notification: All participants notified
- Unlock: Click "Lock" button again

**Record Conference:**
- Button: "Record" in Conference Bar
- State: Toggles between recording and not recording
- Indicator: Red "REC" badge in Conference Bar when recording
- Timer: Shows recording duration (HH:MM:SS)
- Stop: Click "Record" button again
- Confirmation: "Stop recording? This will finalize the recording."

---

### Feature 2: Participant Management

**Add Participant:**
- Button: "Add Participant" in Conference Bar
- Dialog: Phone number or email
- Validation: Valid phone/email format
- Action: Sends invitation or dials out
- Success: Participant appears in table (Waiting state)

**Mute/Unmute Participant:**
- Button: "Mute" or "Unmute" in Actions column
- Real-time: Participant state updates immediately
- Notification: Participant notified (optional)
- Bulk: Multi-select and "Mute All Selected"

**Park Participant:**
- Button: "Park" in Actions column
- Effect: Participant placed on hold (hear hold music)
- Notification: Participant notified
- Unpark: Click "Unpark" to resume

**Disconnect Participant:**
- Button: "Disconnect" in Actions column
- Confirmation: "Disconnect participant? This cannot be undone."
- Effect: Participant removed from call
- Notification: Participant notified
- Log: Action logged in audit trail

**Transfer Participant:**
- Button: "Transfer" in Actions column
- Dialog: Select target operator
- Notification: Target operator receives transfer request
- Effect: Participant transferred to new operator
- Log: Transfer logged in audit trail

---

### Feature 3: Search & Filtering

**Search:**
- Input: "Search by name, company, phone, location..."
- Real-time: Results update as user types (debounced 300ms)
- Scope: Searches across all participant fields
- Case-insensitive: "john" matches "John Doe"
- Partial match: "doe" matches "John Doe"
- Clear: Click X button to clear search

**Filters:**
- Multiple filters can be active simultaneously
- AND logic: Participant must match all active filters
- Counts: Each filter shows count of matching participants
- Persistence: Filters persist during session
- Reset: Click "All" to clear all filters

**Saved Filters:**
- Save current filter combination: "Save Filter" button
- Name: "My Filter" (editable)
- Load: Dropdown to select saved filter
- Delete: Right-click saved filter to delete
- Persistence: Saved to user preferences

---

### Feature 4: Real-Time Monitoring

**Call Quality Metrics:**
- Bandwidth: Current bandwidth usage (kbps)
- Latency: Round-trip time (ms)
- Jitter: Variation in latency (ms)
- Packet Loss: Percentage of lost packets (%)
- MOS Score: Mean Opinion Score (1-5)
- Update: Every 5 seconds

**Participant Sentiment:**
- Score: 0-100 (red to green gradient)
- Trend: Sparkline showing sentiment over time
- Update: Every 5 seconds
- Threshold: Alert if sentiment drops below 30

**Transcription Status:**
- Status: "Transcribing...", "Completed", "Error"
- Progress: Percentage complete (0-100%)
- Language: Detected language
- Update: Real-time as transcription progresses

---

### Feature 5: Q&A Management

**Submit Question:**
- Participant submits question via Event Room
- Question appears in Q&A Queue tab
- Operator sees: Question text, submitter name, timestamp

**Moderate Question:**
- Approve: Question becomes visible to all participants
- Reject: Question is hidden (submitter notified)
- Edit: Operator can edit question text before approval
- Pin: Pin important questions to top of queue
- Delete: Remove question from queue

**Voting:**
- Participants can upvote questions
- Operator sees: Vote count for each question
- Sort: Sort by votes, timestamp, or submitter

**Answer Question:**
- Operator marks question as "Answered"
- Notification: Submitter notified that question was answered
- Archive: Answered questions moved to archive

---

### Feature 6: Transcription & Translation

**Enable Transcription:**
- Button: "Transcribe" in participant Actions
- Language: Auto-detect or select language
- Real-time: Transcription appears in real-time
- Display: Shows in Chat tab or separate Transcription panel

**Translate Transcription:**
- Language Selector: Dropdown with 12+ languages
- Real-time: Translation updates as transcription progresses
- Display: Original + translation side-by-side
- Download: Export transcription in selected language

**Transcription History:**
- Tab: "Audio Files" shows all transcriptions
- Search: Search transcription text
- Download: Download as PDF or TXT
- Share: Generate shareable link

---

### Feature 7: Operator Preferences

**Settings Panel:**
- Access: Click gear icon in top-right
- Tabs: General, Audio, Notifications, Shortcuts, Appearance

**General Settings:**
- Operator Name: Display name
- Timezone: Local timezone for time displays
- Language: UI language (EN, FR, PT, SW, AR, etc.)
- Default Conference Type: Webcast, Webinar, etc.

**Audio Settings:**
- Alert Volume: Slider (0-100%)
- Alert Sound: Dropdown (Ding, Bell, Chime, etc.)
- Microphone: Select input device
- Speaker: Select output device
- Test: Button to test audio

**Notification Settings:**
- New Participant: Toggle + sound
- Participant Disconnect: Toggle + sound
- Q&A Submitted: Toggle + sound
- Sentiment Alert: Toggle + threshold
- Transcription Complete: Toggle + sound

**Shortcuts:**
- Custom keyboard shortcuts for common actions
- Mute All: Ctrl+M
- Record: Ctrl+R
- Disconnect All: Ctrl+D
- etc.

**Appearance:**
- Theme: Dark (default), Light
- Font Size: Small, Medium (default), Large
- Compact Mode: Toggle to reduce spacing
- Color Blind Mode: Adjust colors for accessibility

---

## State Management

### React State Structure

```typescript
interface OccState {
  // Sidebar
  activeTab: "running" | "post_event" | "simulate" | "settings" | "op_settings";
  
  // Conference Overview
  overviewTab: "running" | "pending" | "completed" | "alarms";
  conferences: Conference[];
  selectedConferenceId: number | null;
  
  // Conference Control Panel
  participantSearch: string;
  activeFilters: FilterMode[];
  participants: Participant[];
  selectedParticipantIds: number[];
  
  // Feature Tabs
  featureTab: "monitoring" | "connection" | "history" | "audio" | "chat" | "notes" | "qa" | "direct";
  
  // Real-Time Data
  liveMetrics: LiveMetrics;
  sentimentScores: Map<number, number>;
  qaQueue: Question[];
  chatMessages: ChatMessage[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  notification: Notification | null;
  
  // Preferences
  operatorPreferences: OperatorPreferences;
  savedFilters: SavedFilter[];
}
```

### State Management Library

**Recommendation:** Use React Context + useReducer for global state, with Ably for real-time updates

```typescript
// Global OCC Context
const OCCContext = createContext<OccContextType | null>(null);

// OCC Reducer
function occReducer(state: OccState, action: OccAction): OccState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "UPDATE_PARTICIPANT":
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case "ADD_SENTIMENT_SCORE":
      return {
        ...state,
        sentimentScores: new Map(state.sentimentScores).set(
          action.payload.participantId,
          action.payload.score
        ),
      };
    // ... more cases
    default:
      return state;
  }
}

// Provider Component
export function OCCProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(occReducer, initialState);
  
  // Subscribe to Ably channels
  useEffect(() => {
    const channel = ably.channels.get("conference:CC-9921:participants");
    channel.subscribe("participant_status_changed", (message) => {
      dispatch({
        type: "UPDATE_PARTICIPANT",
        payload: message.data,
      });
    });
    
    return () => channel.unsubscribe();
  }, []);
  
  return (
    <OCCContext.Provider value={{ state, dispatch }}>
      {children}
    </OCCContext.Provider>
  );
}
```

---

## Performance & Optimization

### Rendering Optimization

**Virtual Scrolling:**
- Use `react-window` for participant table (can have 1000+ rows)
- Only render visible rows + buffer (50 rows above/below)
- Improves performance from O(n) to O(1)

**Memoization:**
- Memoize expensive components with `React.memo`
- Use `useMemo` for derived state (filtered participants, sorted conferences)
- Use `useCallback` for event handlers

**Debouncing:**
- Search input: Debounce 300ms before filtering
- Sentiment updates: Batch updates, debounce 1s
- Window resize: Debounce 200ms before re-layout

**Code Splitting:**
- Lazy load feature tabs (Monitoring, History, etc.)
- Lazy load settings panel
- Lazy load detail panels

### Network Optimization

**Ably Optimization:**
- Subscribe only to relevant channels (current conference)
- Unsubscribe when switching conferences
- Use message compression (Ably default)
- Batch updates (e.g., multiple participant updates in single message)

**API Optimization:**
- Cache initial data (conference list, participant list)
- Use pagination for large datasets
- Implement request deduplication
- Use GraphQL fragments to request only needed fields

### Bundle Size Optimization

**Target:** < 500KB gzipped

- Remove unused dependencies
- Tree-shake unused code
- Minify and compress assets
- Use dynamic imports for large libraries
- Monitor bundle size with `webpack-bundle-analyzer`

---

## Security & Compliance

### Authentication & Authorization

**Authentication:**
- OAuth 2.0 via Manus platform
- Session tokens with 1-hour expiration
- Refresh tokens for extended sessions
- Logout clears all tokens and local data

**Authorization:**
- Role-based access control (RBAC)
- Operator role: Can manage conferences and participants
- Admin role: Can manage operators and settings
- Viewer role: Read-only access
- Check permissions before rendering UI elements

**Audit Trail:**
- Log all operator actions (mute, disconnect, transfer, etc.)
- Include: Operator ID, action, timestamp, participant ID, result
- Retention: 90 days (configurable)
- Access: Only admins can view audit trail

### Data Security

**Encryption:**
- HTTPS/TLS for all API calls
- End-to-end encryption for sensitive data (optional)
- Secure WebSocket (WSS) for Ably connections

**Privacy:**
- Mask phone numbers (show last 4 digits only)
- Mask email addresses (show first 2 characters + domain)
- Don't store sensitive data in localStorage
- Clear sensitive data on logout

**Compliance:**
- GDPR: Consent for data collection, right to deletion
- CCPA: Privacy notice, opt-out mechanism
- SOC 2: Security controls and audit logs
- HIPAA: If handling healthcare data (optional)

---

## Error Handling & Recovery

### Error Types & Handling

| Error Type | Cause | User Message | Recovery |
|-----------|-------|--------------|----------|
| Network Error | Connection lost | "Connection lost. Retrying..." | Auto-retry with exponential backoff |
| API Error | Server error (5xx) | "Server error. Please try again." | Retry button, fallback to cached data |
| Validation Error | Invalid input | "Invalid phone number format." | Highlight field, show error message |
| Permission Error | User not authorized | "You don't have permission to do this." | None (disable action) |
| Timeout Error | Request takes too long | "Request timed out. Please try again." | Retry button |
| Ably Connection Error | WebSocket disconnected | "Real-time connection lost. Retrying..." | Auto-reconnect |

### Error Display

**Toast Notification:**
- Position: Bottom-right
- Duration: 5 seconds (auto-dismiss)
- Types: Success (green), Error (red), Warning (amber), Info (blue)
- Action: Optional "Retry" or "Dismiss" button

**Error Boundary:**
- Catch React errors
- Display: "Something went wrong. Please refresh the page."
- Log: Send error to error tracking service (Sentry)
- Recovery: Refresh button to reload page

### Retry Strategy

**Exponential Backoff:**
- Initial delay: 1 second
- Max delay: 30 seconds
- Multiplier: 2x
- Max retries: 5

```typescript
async function retryWithBackoff(fn, maxRetries = 5) {
  let delay = 1000;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}
```

---

## Testing Requirements

### Unit Tests

**Coverage Target:** > 80%

**Test Categories:**
- State management (reducer functions)
- Utility functions (search, filter, format)
- Component rendering (with mocked data)
- Event handlers (click, submit, etc.)

**Example Test:**
```typescript
describe("OCCReducer", () => {
  it("should update participant state on UPDATE_PARTICIPANT action", () => {
    const initialState = {
      participants: [{ id: 1, name: "John", state: "connected" }],
    };
    const action = {
      type: "UPDATE_PARTICIPANT",
      payload: { id: 1, name: "John", state: "muted" },
    };
    const newState = occReducer(initialState, action);
    expect(newState.participants[0].state).toBe("muted");
  });
});
```

### Integration Tests

**Scope:** Test multiple components working together

**Test Cases:**
- User selects conference → Conference Control Panel loads
- User searches for participant → Table filters in real-time
- User mutes participant → Participant state updates in real-time
- User applies filter → Multi-select action bar appears

### End-to-End Tests

**Tool:** Cypress or Playwright

**Test Scenarios:**
- Login → View conferences → Select conference → Manage participants
- Search participant → Mute → Verify state change
- Multi-select participants → Disconnect all → Verify removal
- Real-time updates (sentiment, Q&A) appear without page refresh

### Performance Tests

**Metrics:**
- Page load time: < 2 seconds
- Interaction response time: < 100ms
- Real-time update latency: < 500ms
- Participant table scroll: 60 FPS

**Tools:** Lighthouse, WebPageTest, Chrome DevTools

---

## Deployment & Monitoring

### Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] Code review approved
- [ ] Performance budget met (< 500KB gzipped)
- [ ] Security scan passed (no vulnerabilities)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Documentation updated
- [ ] Staging environment tested
- [ ] Rollback plan prepared

### Monitoring & Observability

**Metrics to Monitor:**
- Page load time (target: < 2s)
- API response time (target: < 500ms)
- Ably connection latency (target: < 100ms)
- Error rate (target: < 0.1%)
- User engagement (active sessions, actions per session)

**Logging:**
- Log all errors with stack trace
- Log all user actions (mute, disconnect, etc.)
- Log performance metrics (page load, API calls)
- Retention: 30 days

**Alerting:**
- Alert if error rate > 1%
- Alert if API response time > 2s
- Alert if Ably connection drops
- Alert if page load time > 5s

**Tools:**
- Error tracking: Sentry
- Performance monitoring: New Relic or Datadog
- Log aggregation: ELK Stack or Splunk
- Alerting: PagerDuty or Opsgenie

---

## Success Criteria

### Functional Requirements

- ✅ All 5 sidebar tabs functional and switching correctly
- ✅ Conference Overview displays all conferences with accurate data
- ✅ Conference Control Panel loads when conference selected
- ✅ Participant table displays with real-time updates (< 500ms latency)
- ✅ Search and filters work correctly (real-time, multiple filters)
- ✅ Multi-select and bulk actions work (mute all, disconnect all, etc.)
- ✅ All action buttons functional (record, lock, mute, disconnect, etc.)
- ✅ Feature tabs load and display correct content
- ✅ Real-time sentiment scores update every 5 seconds
- ✅ Q&A queue displays and can be moderated
- ✅ Transcription displays in real-time
- ✅ Operator preferences save and persist

### Performance Requirements

- ✅ Page load time < 2 seconds
- ✅ Interaction response time < 100ms
- ✅ Real-time update latency < 500ms
- ✅ Participant table scroll 60 FPS (1000+ rows)
- ✅ Bundle size < 500KB gzipped

### Quality Requirements

- ✅ No TypeScript errors
- ✅ No console errors or warnings
- ✅ Unit test coverage > 80%
- ✅ All E2E tests passing
- ✅ Accessibility audit passed (WCAG 2.1 AA)
- ✅ Security scan passed (no vulnerabilities)

### User Experience Requirements

- ✅ Intuitive navigation and layout
- ✅ Clear visual hierarchy
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Dark theme consistent throughout
- ✅ Helpful tooltips and error messages
- ✅ Keyboard shortcuts for power users
- ✅ Smooth animations and transitions

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Layout & Navigation | 1 week | Sidebar, top bar, main layout |
| Phase 2: Conference Overview | 1 week | Table, tabs, search, filters |
| Phase 3: Conference Control Panel | 2 weeks | Buttons, participant table, actions |
| Phase 4: Real-Time Updates | 1 week | Ably integration, real-time state |
| Phase 5: Feature Tabs | 1 week | Monitoring, history, Q&A, etc. |
| Phase 6: Testing & Optimization | 1 week | Unit tests, E2E tests, performance |
| Phase 7: Deployment & Monitoring | 1 week | Staging, production, monitoring |

**Total Duration:** 8 weeks

---

## Conclusion

The Operator Console is the command centre of CuraLive and must be world-class, reliable, and intuitive. This brief provides comprehensive specifications for the frontend interface, user interactions, data flow, and operational requirements. The development team should follow this brief closely to ensure a production-ready, enterprise-grade control centre that meets all success criteria.

**Key Principles:**
1. **User-Centric Design:** Every interaction should be intuitive and efficient
2. **Real-Time Performance:** Sub-100ms latency for all real-time updates
3. **Reliability:** 100% uptime and graceful error handling
4. **Security:** Encryption, authentication, audit trails
5. **Scalability:** Support 1000+ participants, 100+ concurrent conferences
6. **Accessibility:** WCAG 2.1 AA compliance for all users

---

## Appendix: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+M | Mute All Participants |
| Ctrl+U | Unmute All Participants |
| Ctrl+R | Start/Stop Recording |
| Ctrl+D | Disconnect All Participants |
| Ctrl+L | Lock/Unlock Conference |
| Ctrl+F | Focus Search Bar |
| Ctrl+1 | Running Calls Tab |
| Ctrl+2 | Post Event Tab |
| Ctrl+3 | Simulate Call Tab |
| Ctrl+4 | Settings Tab |
| Ctrl+5 | Operator Settings Tab |
| Escape | Close Detail Panel |
| Enter | Confirm Action |
| Delete | Delete Selected Item |

---

**Document Version:** 1.0  
**Last Updated:** March 7, 2026  
**Author:** Manus AI  
**Status:** Ready for Implementation
