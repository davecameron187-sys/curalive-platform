# REPLIT DEVELOPMENT BRIEF
## Booking-to-OCC Daily Event Preloading Integration

**Project:** CuraLive Operator Dashboard  
**Feature:** Booking Tool → OCC Event Preloading  
**Status:** spec-ready  
**Created:** March 13, 2026  
**Author:** Manus AI  

---

## Executive Summary

This specification defines the integration between the CuraLive Booking Tool and the Operator Console (OCC) to enable daily event preloading. Operators will have the ability to upload/sync daily events directly from the booking system into the OCC, ensuring all events for the day are pre-configured and ready to launch without manual setup.

**Key Benefit:** Streamline operator workflow by eliminating manual event setup. Operators can review, edit, and launch events with a single click from a pre-populated daily schedule.

---

## Feature Overview

### What This Feature Does

The Booking-to-OCC integration allows operators to:

1. **View Daily Events** — See all events scheduled for today in a dedicated "Daily Schedule" panel within the OCC
2. **Bulk Upload Events** — Import all daily events from the booking system into OCC with a single action
3. **Pre-Configure Events** — Events are automatically populated with booking data (time, platform, participants, settings)
4. **Quick Launch** — Launch any pre-loaded event with a single click from the OCC
5. **Edit Before Launch** — Modify event settings (participant list, platform settings, transcription options) before going live
6. **Sync Status** — Visual indicators showing which events are synced, pending, or ready to launch

### User Stories

| Story | Description |
|-------|-------------|
| **Story 1: Daily Sync** | As an operator, I want to sync all today's events from the booking system into OCC at the start of my shift, so I don't have to manually set up each event. |
| **Story 2: Quick Review** | As an operator, I want to see all daily events in a list with key details (time, platform, participant count), so I can quickly review the day's schedule. |
| **Story 3: Pre-Configuration** | As an operator, I want events to be automatically pre-configured with booking data (participants, settings), so I can launch them immediately without setup. |
| **Story 4: Edit Before Launch** | As an operator, I want to edit event settings before launching, so I can make last-minute adjustments if needed. |
| **Story 5: One-Click Launch** | As an operator, I want to launch a pre-loaded event with a single click, so I can quickly transition between events. |
| **Story 6: Sync Status Visibility** | As an operator, I want to see which events are synced, pending sync, or ready to launch, so I know the status of my daily schedule. |

---

## Technical Specifications

### 1. Database Schema Changes

#### New Table: `event_preload_queue`

Tracks events pending sync from booking system to OCC.

```sql
CREATE TABLE event_preload_queue (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_event_id INT NOT NULL UNIQUE,
  occ_event_id INT,
  operator_id INT NOT NULL,
  sync_status ENUM('pending', 'synced', 'failed', 'archived') DEFAULT 'pending',
  sync_timestamp DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_event_id) REFERENCES events(id),
  FOREIGN KEY (occ_event_id) REFERENCES occ_sessions(id),
  FOREIGN KEY (operator_id) REFERENCES users(id),
  INDEX idx_operator_date (operator_id, created_at),
  INDEX idx_sync_status (sync_status)
);
```

#### New Table: `occ_event_preload_settings`

Stores pre-configuration settings for OCC events.

```sql
CREATE TABLE occ_event_preload_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  occ_session_id INT NOT NULL UNIQUE,
  booking_event_id INT NOT NULL,
  transcription_enabled BOOLEAN DEFAULT TRUE,
  sentiment_analysis_enabled BOOLEAN DEFAULT TRUE,
  recording_enabled BOOLEAN DEFAULT TRUE,
  participant_list_synced BOOLEAN DEFAULT TRUE,
  platform_settings JSON,
  custom_settings JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (occ_session_id) REFERENCES occ_sessions(id),
  FOREIGN KEY (booking_event_id) REFERENCES events(id)
);
```

#### Modify Existing Table: `occ_sessions`

Add fields to track preload status.

```sql
ALTER TABLE occ_sessions ADD COLUMN (
  preload_source_booking_id INT,
  is_preloaded BOOLEAN DEFAULT FALSE,
  preload_timestamp DATETIME,
  FOREIGN KEY (preload_source_booking_id) REFERENCES events(id)
);
```

### 2. API Endpoints

#### Endpoint 1: Get Daily Events (Booking System)

**Route:** `GET /api/trpc/booking.getDailyEvents`

**Purpose:** Retrieve all events scheduled for today from the booking system.

**Request Parameters:**
- `date` (optional): ISO date string (defaults to today)
- `operatorId` (optional): Filter events for specific operator

**Response:**
```typescript
{
  events: [
    {
      id: number,
      title: string,
      startTime: Date,
      endTime: Date,
      platform: 'zoom' | 'teams' | 'webex' | 'rtmp' | 'pstn',
      participantCount: number,
      registeredCount: number,
      description: string,
      platformSettings: object,
      transcriptionEnabled: boolean,
      recordingEnabled: boolean,
      participants: Array<{id, name, email, company}>
    }
  ],
  totalCount: number
}
```

#### Endpoint 2: Sync Events to OCC

**Route:** `POST /api/trpc/occ.syncDailyEvents`

**Purpose:** Upload/sync daily events from booking system to OCC preload queue.

**Request Body:**
```typescript
{
  bookingEventIds: number[],
  operatorId: number,
  date: Date,
  autoLaunchFirst?: boolean
}
```

**Response:**
```typescript
{
  success: boolean,
  syncedCount: number,
  failedCount: number,
  syncedEvents: Array<{
    bookingEventId: number,
    occEventId: number,
    status: 'synced' | 'failed',
    errorMessage?: string
  }>,
  message: string
}
```

#### Endpoint 3: Get Preloaded Events

**Route:** `GET /api/trpc/occ.getPreloadedEvents`

**Purpose:** Retrieve all preloaded events for the current OCC session.

**Response:**
```typescript
{
  preloadedEvents: Array<{
    id: number,
    bookingEventId: number,
    title: string,
    startTime: Date,
    endTime: Date,
    platform: string,
    participantCount: number,
    syncStatus: 'pending' | 'synced' | 'failed',
    isReadyToLaunch: boolean,
    settings: object
  }>,
  totalCount: number,
  syncedCount: number,
  pendingCount: number
}
```

#### Endpoint 4: Launch Preloaded Event

**Route:** `POST /api/trpc/occ.launchPreloadedEvent`

**Purpose:** Launch a pre-loaded event from the OCC.

**Request Body:**
```typescript
{
  preloadedEventId: number,
  occSessionId: number,
  overrideSettings?: object
}
```

**Response:**
```typescript
{
  success: boolean,
  occEventId: number,
  launchTime: Date,
  message: string
}
```

#### Endpoint 5: Update Preload Settings

**Route:** `POST /api/trpc/occ.updatePreloadSettings`

**Purpose:** Modify settings for a preloaded event before launch.

**Request Body:**
```typescript
{
  preloadedEventId: number,
  settings: {
    transcriptionEnabled?: boolean,
    sentimentAnalysisEnabled?: boolean,
    recordingEnabled?: boolean,
    platformSettings?: object,
    customSettings?: object
  }
}
```

**Response:**
```typescript
{
  success: boolean,
  updatedSettings: object,
  message: string
}
```

### 3. Frontend Components

#### Component 1: Daily Schedule Panel

**Location:** `client/src/components/DailySchedulePanel.tsx`

**Props:**
```typescript
interface DailySchedulePanelProps {
  operatorId: number,
  date?: Date,
  onEventLaunch?: (eventId: number) => void,
  onSyncComplete?: (syncedCount: number) => void
}
```

**Features:**
- Display list of today's events from booking system
- Show sync status (pending, synced, failed)
- "Sync All Events" button to import all daily events
- Individual event cards with quick launch buttons
- Edit settings button for each event
- Visual indicators for event status (ready to launch, in progress, completed)

**UI Layout:**
```
┌─────────────────────────────────────────┐
│ Daily Schedule - March 13, 2026         │
├─────────────────────────────────────────┤
│ [Sync All Events] [Refresh]             │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 2:00 PM - Q4 2025 Earnings Call    │ │
│ │ Platform: Zoom | 1,247 registered  │ │
│ │ Status: ✓ Synced & Ready           │ │
│ │ [Launch] [Edit] [More]             │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 10:00 AM - Annual Investor Day     │ │
│ │ Platform: Teams | 3,500 registered │ │
│ │ Status: ⏳ Pending Sync             │ │
│ │ [Launch] [Edit] [More]             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Component 2: Event Preload Settings Modal

**Location:** `client/src/components/EventPreloadSettingsModal.tsx`

**Purpose:** Allow operators to edit preload settings before launching an event.

**Features:**
- Toggle transcription, sentiment analysis, recording
- Edit platform-specific settings
- Review participant list
- Preview event configuration
- Save and launch button

#### Component 3: Preload Status Indicator

**Location:** `client/src/components/PreloadStatusIndicator.tsx`

**Purpose:** Show visual status of preload sync.

**Indicators:**
- ✓ Synced & Ready (green)
- ⏳ Pending Sync (yellow)
- ✗ Failed (red)
- ⟳ Syncing (blue)

### 4. Backend Logic

#### Service: `BookingToOCCService`

**Location:** `server/services/bookingToOCCService.ts`

**Methods:**

```typescript
class BookingToOCCService {
  // Get all events for a specific date
  async getDailyEvents(date: Date, operatorId?: number): Promise<Event[]>
  
  // Sync booking events to OCC preload queue
  async syncDailyEventsToOCC(
    bookingEventIds: number[],
    operatorId: number,
    date: Date
  ): Promise<SyncResult>
  
  // Get preloaded events for OCC session
  async getPreloadedEvents(occSessionId: number): Promise<PreloadedEvent[]>
  
  // Launch a preloaded event
  async launchPreloadedEvent(
    preloadedEventId: number,
    occSessionId: number,
    overrideSettings?: object
  ): Promise<OCCEvent>
  
  // Update preload settings
  async updatePreloadSettings(
    preloadedEventId: number,
    settings: object
  ): Promise<PreloadedEvent>
  
  // Archive preloaded events (cleanup after day ends)
  async archiveCompletedEvents(date: Date): Promise<number>
  
  // Validate event readiness for launch
  async validateEventReadiness(preloadedEventId: number): Promise<ValidationResult>
}
```

### 5. Data Flow Diagram

```
Booking System                OCC System
    ↓                             ↓
[Daily Events]          [Operator Dashboard]
    ↓                             ↓
[Get Daily Events]      [Daily Schedule Panel]
    ↓                             ↓
[API: getDailyEvents]   [Display Events List]
    ↓                             ↓
                          [Sync All Events Button]
                                  ↓
                          [API: syncDailyEvents]
                                  ↓
[Create Preload Queue]  [BookingToOCCService]
    ↓                             ↓
[Validate Events]       [Validate & Configure]
    ↓                             ↓
[Store in DB]           [Create OCC Sessions]
    ↓                             ↓
[Return Sync Status]    [Update UI Status]
    ↓                             ↓
                          [Display Synced Events]
                                  ↓
                          [Operator Clicks Launch]
                                  ↓
                          [API: launchPreloadedEvent]
                                  ↓
                          [Start Live Event]
```

---

## Implementation Roadmap

### Phase 1: Backend Foundation (Week 1)

**Tasks:**
1. Create database tables (`event_preload_queue`, `occ_event_preload_settings`)
2. Implement `BookingToOCCService` with core methods
3. Create API endpoints (getDailyEvents, syncDailyEvents, getPreloadedEvents)
4. Write unit tests for sync logic
5. Create data validation and error handling

**Deliverables:**
- Database schema migrations
- Service implementation with tests
- API endpoints functional

### Phase 2: Frontend Components (Week 2)

**Tasks:**
1. Build `DailySchedulePanel` component
2. Build `EventPreloadSettingsModal` component
3. Build `PreloadStatusIndicator` component
4. Integrate components into OCC dashboard
5. Add event launch functionality
6. Write component tests

**Deliverables:**
- Functional UI components
- Integration with OCC dashboard
- Component tests passing

### Phase 3: Polish & Testing (Week 3)

**Tasks:**
1. End-to-end testing (booking → OCC → launch)
2. Error handling and edge cases
3. Performance optimization
4. UI/UX refinement
5. Documentation and training materials
6. Operator feedback and iterations

**Deliverables:**
- Full feature testing complete
- Documentation
- Ready for production deployment

---

## Success Criteria

| Criterion | Metric | Target |
|-----------|--------|--------|
| **Sync Accuracy** | % of events synced correctly | 99%+ |
| **Sync Speed** | Time to sync 100 events | < 5 seconds |
| **Launch Time** | Time from click to event live | < 10 seconds |
| **Error Recovery** | % of failed syncs recovered | 95%+ |
| **Operator Adoption** | % of operators using feature daily | 80%+ |
| **User Satisfaction** | Operator satisfaction score | 4.5/5.0+ |

---

## Testing Requirements

### Unit Tests

- `BookingToOCCService` methods
- Data validation logic
- Error handling scenarios
- Database operations

### Integration Tests

- Booking system → OCC sync flow
- Event launch workflow
- Settings update and persistence
- Concurrent sync operations

### End-to-End Tests

- Complete daily workflow (sync → review → launch)
- Multi-event scenarios
- Error recovery scenarios
- Performance under load (100+ events)

### User Acceptance Tests

- Operator workflow validation
- UI/UX feedback
- Real-world event scenarios
- Concurrent operator usage

---

## Security & Compliance

### Data Security

- Validate all booking event data before sync
- Ensure only authorized operators can sync events
- Audit log all sync operations
- Encrypt sensitive participant data in transit

### Access Control

- Only operators assigned to events can sync them
- Role-based access control (admin, operator, viewer)
- Audit trail for all preload operations

### Error Handling

- Graceful failure if booking system is unavailable
- Retry logic for failed syncs
- Clear error messages for operators
- Fallback to manual event creation

---

## Deployment Notes

### Prerequisites

- Database migrations applied
- API endpoints deployed
- Frontend components built and tested
- Operator training completed

### Rollout Strategy

1. **Beta Testing** — Deploy to 2-3 operators for feedback
2. **Staged Rollout** — Deploy to 25% of operators, monitor for issues
3. **Full Rollout** — Deploy to all operators
4. **Post-Launch Support** — Monitor performance and gather feedback

### Monitoring & Alerts

- Track sync success/failure rates
- Monitor API response times
- Alert on sync failures > 5%
- Track operator usage patterns

---

## Future Enhancements

1. **Scheduled Auto-Sync** — Automatically sync events at specific times (e.g., 8 AM daily)
2. **Selective Sync** — Allow operators to choose which events to sync
3. **Event Templates** — Save common event configurations as templates
4. **Batch Operations** — Edit settings for multiple events at once
5. **Smart Recommendations** — AI-powered suggestions for event settings based on history
6. **Integration with Calendar** — Sync with external calendars (Google Calendar, Outlook)
7. **Mobile Support** — Preload events from mobile app

---

## References & Resources

### Related Documentation

- CuraLive Operator Dashboard Design: `/docs/UNIFIED_OPERATOR_DASHBOARD_FRAMEWORK.md`
- OCC Router Implementation: `/server/routers/occ.ts`
- Booking System Schema: `/drizzle/schema.ts`

### External Resources

- tRPC Procedures: https://trpc.io/docs/server/procedures
- Drizzle ORM: https://orm.drizzle.team/
- React Query: https://tanstack.com/query/latest

---

## Questions & Support

For questions or clarifications about this specification, please contact the development team or refer to the related documentation.

**Specification Version:** 1.0  
**Last Updated:** March 13, 2026  
**Status:** Ready for Development
