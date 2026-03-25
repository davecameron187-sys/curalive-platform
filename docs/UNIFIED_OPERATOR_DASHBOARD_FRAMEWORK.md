# Unified Operator Dashboard Framework — CuraLive Platform

**Document Version:** 1.0  
**Date:** March 13, 2026  
**Status:** Design Framework (Pre-Development)  
**Prepared for:** IT Manager & Development Team

---

## Executive Summary

The CuraLive platform currently operates through multiple disconnected consoles: the Operator Call Centre (OCC), audio/webcasting controls, video applications, and transcription interfaces. This fragmented approach requires operators to switch between multiple windows and applications, reducing efficiency and increasing error risk during live events.

This framework proposes a **unified operator dashboard** that consolidates all operator-facing controls into a single, cohesive interface. The dashboard will integrate three key feature areas: event booking management with calendar visualization, event registration tracking with reporting capabilities, and real-time operational controls for audio, video, and transcription systems.

The goal is to create an intuitive, role-based interface where operators have complete visibility and control over all event operations from a single location, reducing cognitive load and improving operational reliability during high-stakes investor communication events.

---

## Strategic Objectives

**Consolidation:** Eliminate context switching by bringing all operator functions into one unified interface.

**Efficiency:** Reduce time spent navigating between applications and searching for event information.

**Reliability:** Centralize event state management to prevent synchronization errors and missed critical actions.

**Scalability:** Design a modular architecture that allows new features and integrations to be added without fragmenting the interface.

**Compliance:** Ensure all operator actions are logged and auditable for regulatory and quality assurance purposes.

---

## Architecture Overview

### Dashboard Structure

The unified operator dashboard follows a **three-tier layout model**:

**Tier 1: Global Navigation & Context**  
The top-level navigation bar provides quick access to all major sections, displays the current user role and permissions, shows system status indicators, and provides access to settings and help documentation. This tier remains consistent across all dashboard views.

**Tier 2: Primary Content Area**  
The main content area displays the currently selected feature module. This area is responsive and adapts to the specific requirements of each module (calendar grid, data table, live control panel, etc.). The primary content area occupies the majority of screen real estate to maximize usability.

**Tier 3: Contextual Sidebar & Quick Actions**  
A collapsible sidebar provides contextual information related to the primary content area. This might include event details, participant lists, real-time metrics, or quick action buttons. The sidebar can be toggled to maximize screen space when needed.

### Module Organization

The dashboard is organized into five primary modules, each accessible from the main navigation:

**Events Module** — Calendar view of all bookings, event creation/editing, and event status tracking.

**Registrations Module** — Participant management, registration tracking, and report generation.

**Live Console Module** — Real-time operational controls for audio, video, transcription, and engagement monitoring during active events.

**Analytics Module** — Post-event reporting, sentiment analysis, compliance monitoring, and historical data review.

**Administration Module** — System settings, user management, API configuration, and platform administration (admin-only).

---

## Feature Area 1: Event Booking & Calendar Management

### Purpose & Scope

Operators need a comprehensive view of all scheduled events to manage bookings, identify scheduling conflicts, and quickly access event details. The calendar view provides temporal context, making it easy to see what events are coming up and when they occur.

### User Stories

**As an operator,** I want to see all scheduled events in a calendar view so that I can quickly identify upcoming events and their timing.

**As an operator,** I want to click on any event to view full details including participants, platform configuration, and dial-in numbers.

**As an operator,** I want to edit event details (date, time, participants, platform settings) before the event starts.

**As an operator,** I want to reschedule events and receive confirmation that all participants have been notified.

**As an event manager,** I want to create new event bookings directly from the calendar interface.

### Interface Design Suggestions

#### Calendar View (Primary)

**Layout:** Month-at-a-glance calendar grid with week and day view options. Each day cell displays a summary of events scheduled for that day (event title, time, platform type).

**Visual Hierarchy:** 
- Upcoming events (next 7 days) are highlighted with a distinct color scheme
- Live/in-progress events display a pulsing indicator
- Completed events appear in muted colors
- Cancelled events show a strikethrough or different opacity

**Event Cards:** Each event in the calendar displays:
- Event title (e.g., "Q4 2025 Earnings Call")
- Time (start and duration)
- Platform type (Zoom, Teams, Webex, RTMP, PSTN)
- Participant count
- Status badge (Scheduled, Live, Completed, Cancelled)

**Interactions:**
- Click event card to open event details panel
- Drag-and-drop to reschedule events
- Right-click context menu for quick actions (Edit, Duplicate, Cancel, View Participants)
- Color-coded by event type or platform for quick visual scanning

#### Event Details Panel (Secondary)

**Trigger:** Opens when operator clicks on an event card or creates a new event.

**Content Sections:**

*Event Information*  
Display event title, description, scheduled date/time, timezone, and duration. Allow inline editing with a pencil icon for each field.

*Participants*  
List all registered participants with their email, company affiliation, and registration status. Include a search/filter function to quickly find specific participants. Show participant count summary.

*Platform Configuration*  
Display platform type (Zoom RTMS, Teams Bot, Webex, RTMP, PSTN), connection details, dial-in numbers, and authentication credentials. Include a "Test Connection" button to verify platform connectivity before the event.

*Event Controls*  
Action buttons for: Edit Event, Duplicate Event, Send Reminder Email, View Participants Report, Start Event, Cancel Event.

*Event History*  
Timeline showing when the event was created, last modified, and any status changes.

#### Event Editor Modal

**Trigger:** Opens when operator clicks "Edit Event" or creates a new event.

**Form Sections:**

*Basic Information*
- Event title (required)
- Description (optional)
- Event type dropdown (Earnings Call, Investor Briefing, Capital Markets Day, Shareholder Meeting, Analyst Presentation, Other)

*Scheduling*
- Date picker (with timezone selector)
- Start time picker
- Duration selector (30 min, 1 hour, 2 hours, custom)
- Recurring event option (one-time, weekly, monthly)

*Platform Configuration*
- Platform type dropdown (Zoom, Teams, Webex, RTMP, PSTN)
- Platform-specific settings (meeting ID, access code, dial-in number)
- Audio quality settings (bitrate, codec)
- Video quality settings (resolution, frame rate)

*Participants*
- Add participants by email (with autocomplete from IR contact database)
- Bulk upload participant list (CSV)
- Participant role assignment (Presenter, Moderator, Attendee)
- Send invitation emails checkbox

*Advanced Options*
- Enable recording checkbox
- Enable transcription checkbox
- Enable sentiment analysis checkbox
- Enable compliance monitoring checkbox
- Custom metadata fields

**Validation:** Form validates required fields and shows inline error messages. Save button is disabled until all required fields are populated.

**Save Options:** "Save & Send Invitations" or "Save Draft" (for events not yet ready to invite participants).

---

## Feature Area 2: Registration Management & Reporting

### Purpose & Scope

Event organizers and operators need to track who has registered for events, monitor registration trends, and generate reports for stakeholder communication. The registration module provides comprehensive participant management and reporting capabilities.

### User Stories

**As an event manager,** I want to see a list of all participants registered for an event.

**As an event manager,** I want to filter and search the participant list by company, name, or registration date.

**As an event manager,** I want to export the participant list as a CSV or PDF report.

**As an event manager,** I want to see registration trends (e.g., how many registered in the last 24 hours).

**As an event manager,** I want to send targeted communications to specific participant segments (e.g., all participants from a specific company).

**As an analyst,** I want to generate a post-event report showing who attended, sentiment scores, and key discussion topics.

### Interface Design Suggestions

#### Registrations Dashboard

**Layout:** Two-column layout with filters on the left and participant list on the right.

**Left Column - Filters:**
- Event selector dropdown (to filter by specific event)
- Registration status filter (Registered, Attended, No-Show, Cancelled)
- Company filter (with autocomplete)
- Registration date range picker
- Search box for participant name or email
- Export button (CSV, PDF, Excel)

**Right Column - Participant List:**
- Sortable table with columns: Name, Company, Email, Registration Date, Status, Attended, Sentiment Score (if post-event)
- Pagination controls (show 25, 50, 100 per page)
- Row actions: View Details, Send Email, Remove from Event, Mark as Attended
- Bulk actions: Select multiple rows, then "Send Email to Selected", "Export Selected", "Mark as Attended"

**Summary Statistics (Top of Right Column):**
- Total Registered: [number]
- Attended: [number] ([percentage]%)
- No-Show: [number] ([percentage]%)
- Cancelled: [number] ([percentage]%)
- Registration Trend: [chart showing registrations over time]

#### Participant Details Modal

**Trigger:** Opens when operator clicks on a participant row.

**Content:**
- Participant name, email, company, title
- Registration date and time
- Attendance status (Attended, No-Show, Cancelled)
- Questions asked during event (if applicable)
- Sentiment score (if post-event analysis available)
- Communication history (emails sent, responses received)
- Notes field for operator annotations

**Actions:** Send Email, Mark as Attended, Remove from Event, Add to Future Events, Export Participant Report.

#### Report Generation Interface

**Trigger:** "Generate Report" button in Registrations module.

**Report Types:**

*Registration Summary Report*
- Total registrations by date
- Registrations by company
- Registrations by participant role
- Geographic distribution (if location data available)
- Trend analysis (early registrations vs. last-minute registrations)

*Attendance Report*
- Attendance rate (attended vs. registered)
- No-show analysis
- Participant engagement metrics (questions asked, sentiment)
- Time spent in event

*Participant Report*
- Detailed list of all participants with registration and attendance data
- Customizable columns
- Filterable and sortable
- Export-ready format

*Sentiment Analysis Report*
- Overall sentiment distribution (positive, neutral, negative)
- Sentiment by speaker
- Sentiment trends throughout event
- Key topics and sentiment associations

**Report Customization Options:**
- Date range selector
- Event filter
- Participant segment filter (by company, role, etc.)
- Columns to include
- Format (PDF, Excel, CSV)
- Include charts/visualizations checkbox

**Report Output:** Generated report displays in preview, with options to download, email, or schedule recurring reports.

---

## Feature Area 3: Unified Live Console

### Purpose & Scope

During active events, operators need real-time access to all operational controls and monitoring capabilities. The unified live console consolidates audio controls, video management, transcription monitoring, participant engagement tracking, and compliance alerts into a single interface.

### User Stories

**As an operator,** I want to see a real-time dashboard of all active events with key metrics and status indicators.

**As an operator,** I want to monitor live transcription and make corrections if needed.

**As an operator,** I want to view participant sentiment scores in real-time to identify audience reactions.

**As an operator,** I want to manage audio levels, mute/unmute participants, and control audio routing.

**As an operator,** I want to monitor video quality and adjust settings if needed.

**As an operator,** I want to see compliance alerts and take action on flagged content.

**As an operator,** I want to manage Q&A moderation and approve/reject participant questions.

### Interface Design Suggestions

#### Live Console Main View

**Layout:** Multi-panel dashboard with flexible resizing and customizable panel arrangement.

**Top Bar - Event Context:**
- Event title and status (Live, Scheduled, Ended)
- Event duration timer (elapsed time)
- Participant count (current attendees)
- System health indicators (CPU, bandwidth, latency)
- Emergency stop button (red, prominent)

**Left Panel - Event Control Center (25% width):**

*Active Events List*
- Dropdown showing all active events
- Quick switch between events if multiple are running
- Event status indicator (Live, Scheduled, Paused)

*Audio Control Section*
- Master volume slider
- Per-participant volume controls (expandable list)
- Mute/unmute buttons for each participant
- Audio input/output device selection
- Bitrate and codec display

*Video Control Section*
- Video quality indicator (1080p, 720p, 480p)
- Bitrate display
- Frame rate display
- Video input/output device selection
- Screen share status

*Transcription Control Section*
- Live transcription status (On/Off)
- Language selection
- Transcription confidence score
- Manual correction interface (click to edit)

**Center Panel - Live Monitoring (50% width):**

*Transcription Display*
- Real-time transcript scrolling
- Speaker identification (color-coded by speaker)
- Timestamp for each segment
- Ability to click and edit transcript segments
- Search within transcript

*Participant Engagement Metrics*
- Live sentiment chart (positive/neutral/negative distribution)
- Sentiment by speaker (bar chart)
- Engagement timeline (questions asked, interactions)
- Key topics being discussed (tag cloud or list)

*Q&A Moderation Panel*
- Queue of pending questions
- Approve/reject buttons for each question
- Question text and asking participant name
- Priority indicator for important questions
- Search/filter questions

**Right Panel - Monitoring & Alerts (25% width):**

*Real-Time Metrics*
- Participant count with trend
- Average sentiment score
- Questions asked count
- Compliance alerts count
- Audio quality score
- Video quality score
- Network latency

*Compliance Alerts*
- List of flagged content (compliance-sensitive language, regulatory concerns)
- Alert severity (Critical, Warning, Info)
- Timestamp and speaker
- Action buttons (Acknowledge, Escalate, Note)

*Event Timeline*
- Key events during the call (participant joined, question asked, sentiment spike)
- Scrollable timeline with timestamps
- Color-coded by event type

*System Status*
- Connection status (Connected, Degraded, Disconnected)
- Recording status (Recording, Paused, Stopped)
- Backup connection status (if applicable)
- Error log (expandable)

#### Live Console Customization

**Panel Resizing:** All panels are resizable by dragging dividers. Operators can customize the layout to their preferences.

**Panel Visibility:** Toggle button to show/hide each panel based on operator needs.

**Layout Presets:** Save custom layouts as presets (e.g., "Audio-Focused", "Compliance-Focused", "Engagement-Focused").

**Full-Screen Mode:** Expand any panel to full screen for detailed monitoring.

---

## Navigation & Information Architecture

### Main Navigation Bar (Top)

**Left Side:**
- CuraLive logo (clickable to return to dashboard home)
- Current user name and role
- Organization name

**Center:**
- Navigation tabs: Events | Registrations | Live Console | Analytics | Admin (if applicable)
- Active tab is highlighted with underline or background color

**Right Side:**
- System status indicator (green/yellow/red dot with tooltip)
- Notification bell with unread count
- User profile dropdown (Settings, Help, Logout)
- Search box (global search across events, participants, transcripts)

### Breadcrumb Navigation

Below the main navigation, display breadcrumb trail showing current location in the application (e.g., "Events > Q4 2025 Earnings Call > Details"). Breadcrumbs are clickable for quick navigation.

### Sidebar (Optional)

A collapsible left sidebar can display:
- Quick links to frequently accessed events
- Favorite participants or companies
- Recent reports
- Saved searches/filters

---

## Data Model & Integration Points

### Core Entities

**Events**
- Event ID, title, description
- Scheduled date/time, timezone, duration
- Platform type and configuration
- Status (Scheduled, Live, Completed, Cancelled)
- Created by, created date, last modified date
- Participants (foreign key to Participants table)

**Participants**
- Participant ID, name, email, company, title
- Registration date/time
- Attendance status
- Questions asked, sentiment score
- Event ID (foreign key)

**Transcripts**
- Transcript ID, event ID
- Speaker name, timestamp
- Transcript text
- Sentiment score, compliance flags
- Corrections (if manually edited)

**Compliance Alerts**
- Alert ID, event ID, transcript segment ID
- Alert type (regulatory concern, sensitive language, etc.)
- Severity level
- Timestamp, acknowledged by, action taken

**Reports**
- Report ID, event ID, report type
- Generated date, generated by
- Report data (JSON or structured format)
- Export format (PDF, Excel, CSV)

### API Integration Requirements

The dashboard will require backend APIs for:
- Event CRUD operations (Create, Read, Update, Delete)
- Participant management (Add, remove, update registration status)
- Real-time transcription streaming (WebSocket connection)
- Sentiment analysis (real-time scoring)
- Compliance monitoring (real-time alerts)
- Report generation (async job submission)
- Audio/video control (bitrate adjustment, device selection)
- Q&A moderation (approve/reject questions)

---

## User Roles & Permissions

### Role Definitions

**Operator** — Full access to Events, Registrations, and Live Console modules. Can create events, manage participants, and operate live events. Cannot access Admin module.

**Event Manager** — Access to Events and Registrations modules. Can create and edit events, manage participants, and generate reports. Cannot operate live events or access Admin module.

**Presenter** — Limited access to view their own events and participant lists. Cannot edit events or access Live Console.

**Administrator** — Full access to all modules including Admin. Can manage users, system settings, and API configuration.

### Permission Matrix

| Feature | Operator | Event Manager | Presenter | Admin |
|---------|----------|---------------|-----------|-------|
| View Events | ✓ | ✓ | ✓ | ✓ |
| Create Events | ✓ | ✓ | ✗ | ✓ |
| Edit Events | ✓ | ✓ | ✗ | ✓ |
| Delete Events | ✓ | ✗ | ✗ | ✓ |
| View Participants | ✓ | ✓ | ✓ | ✓ |
| Manage Participants | ✓ | ✓ | ✗ | ✓ |
| Operate Live Console | ✓ | ✗ | ✗ | ✓ |
| Generate Reports | ✓ | ✓ | ✗ | ✓ |
| Access Admin | ✗ | ✗ | ✗ | ✓ |

---

## Design Principles

### Consistency

All modules follow consistent design patterns, color schemes, typography, and interaction patterns. This reduces the learning curve and makes the interface feel cohesive.

### Progressive Disclosure

Complex features are hidden behind expandable sections or modal dialogs. The primary interface shows only the most critical information, with additional details available on demand.

### Real-Time Feedback

All user actions provide immediate visual feedback. Loading states, success messages, and error messages are clearly displayed.

### Accessibility

The interface is designed to meet WCAG 2.1 AA accessibility standards. All interactive elements are keyboard-accessible, color contrast is sufficient, and screen reader support is implemented.

### Responsiveness

The dashboard is responsive and works well on different screen sizes. However, the primary use case is desktop/laptop with large monitors, so the design prioritizes desktop usability.

### Error Prevention

The interface includes confirmations for destructive actions (e.g., canceling an event), validation for required fields, and clear error messages to guide users.

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Design and implement database schema for Events and Participants
- Build basic Events module with calendar view and event details
- Implement event creation/editing functionality
- Create basic navigation structure and layout

### Phase 2: Registrations (Weeks 3-4)
- Build Registrations module with participant list and filtering
- Implement participant management (add, remove, update)
- Create report generation functionality
- Add export capabilities (CSV, PDF, Excel)

### Phase 3: Live Console (Weeks 5-6)
- Design and implement Live Console interface
- Integrate real-time transcription display
- Implement sentiment monitoring
- Add Q&A moderation panel
- Integrate compliance alert system

### Phase 4: Polish & Optimization (Weeks 7-8)
- User testing and feedback collection
- Performance optimization
- Accessibility audit and fixes
- Documentation and training materials

---

## Success Metrics

**Operator Efficiency:** Reduce time spent navigating between applications by 50%.

**Error Reduction:** Decrease operator-caused errors (missed actions, misconfiguration) by 30%.

**User Satisfaction:** Achieve 4.5+ rating on operator satisfaction survey (1-5 scale).

**Feature Adoption:** 90%+ of operators actively using the unified dashboard within 2 weeks of launch.

**System Reliability:** 99.9% uptime for the dashboard during live events.

---

## Next Steps

1. **Review & Feedback:** Share this framework with stakeholders for review and feedback.
2. **Wireframing:** Create detailed wireframes for each interface based on this framework.
3. **Prototyping:** Build interactive prototypes for user testing.
4. **User Testing:** Conduct usability testing with actual operators to validate design decisions.
5. **Development Planning:** Create detailed development specifications and task breakdown.
6. **Implementation:** Begin development following the phased roadmap.

---

**Document prepared by:** Manus AI  
**Last updated:** March 13, 2026  
**Status:** Ready for Review & Feedback
