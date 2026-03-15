# REPLIT DEVELOPMENT BRIEF
## Booking-to-OCC Daily Event Preloading Integration

**For:** Replit Development Team  
**Project:** CuraLive Platform  
**Feature:** Daily Event Preloading from Booking Tool to OCC  
**Priority:** High  
**Timeline:** 3 weeks (phased approach)  
**Status:** Ready for Development  

---

## Quick Start

### What You're Building

A feature that allows CuraLive operators to sync all daily events from the booking system directly into the Operator Console (OCC) with a single click. Events are pre-configured and ready to launch, eliminating manual setup and streamlining the operator workflow.

### Why It Matters

- **Operator Efficiency:** Reduces event setup time from 10-15 minutes per event to < 1 minute
- **Error Reduction:** Eliminates manual data entry errors
- **Better UX:** One unified interface for all daily operations
- **Scalability:** Supports high-volume event days (50+ events)

### Key Features

✓ View all daily events in one panel  
✓ Sync all events with one click  
✓ Auto-populate event settings from booking data  
✓ Edit settings before launch  
✓ Launch events with one click  
✓ Visual sync status indicators  

---

## Implementation Checklist

### Phase 1: Backend Foundation (Week 1)

- [ ] **Database Setup**
  - [ ] Create `event_preload_queue` table
  - [ ] Create `occ_event_preload_settings` table
  - [ ] Modify `occ_sessions` table to add preload fields
  - [ ] Run migrations: `pnpm db:push`

- [ ] **Service Implementation**
  - [ ] Create `server/services/bookingToOCCService.ts`
  - [ ] Implement `getDailyEvents()` method
  - [ ] Implement `syncDailyEventsToOCC()` method
  - [ ] Implement `getPreloadedEvents()` method
  - [ ] Implement `launchPreloadedEvent()` method
  - [ ] Implement `updatePreloadSettings()` method
  - [ ] Add error handling and validation

- [ ] **API Endpoints**
  - [ ] Add `booking.getDailyEvents` to `server/routers/booking.ts`
  - [ ] Add `occ.syncDailyEvents` to `server/routers/occ.ts`
  - [ ] Add `occ.getPreloadedEvents` to `server/routers/occ.ts`
  - [ ] Add `occ.launchPreloadedEvent` to `server/routers/occ.ts`
  - [ ] Add `occ.updatePreloadSettings` to `server/routers/occ.ts`

- [ ] **Unit Tests**
  - [ ] Test `BookingToOCCService` methods
  - [ ] Test data validation
  - [ ] Test error scenarios
  - [ ] Run tests: `pnpm test`

**Deliverable:** All backend endpoints functional and tested

---

### Phase 2: Frontend Components (Week 2)

- [ ] **Components**
  - [ ] Create `client/src/components/DailySchedulePanel.tsx`
  - [ ] Create `client/src/components/EventPreloadSettingsModal.tsx`
  - [ ] Create `client/src/components/PreloadStatusIndicator.tsx`

- [ ] **DailySchedulePanel Features**
  - [ ] Display list of today's events
  - [ ] Show sync status for each event
  - [ ] "Sync All Events" button
  - [ ] Individual event cards with quick launch
  - [ ] Edit settings button for each event
  - [ ] Refresh button to reload events
  - [ ] Loading states and error handling

- [ ] **EventPreloadSettingsModal Features**
  - [ ] Toggle transcription enabled/disabled
  - [ ] Toggle sentiment analysis enabled/disabled
  - [ ] Toggle recording enabled/disabled
  - [ ] Edit platform-specific settings
  - [ ] Review participant list
  - [ ] Save and launch button

- [ ] **OCC Integration**
  - [ ] Add DailySchedulePanel to OCC dashboard (right sidebar)
  - [ ] Wire up tRPC hooks for data fetching
  - [ ] Implement sync button functionality
  - [ ] Implement launch button functionality
  - [ ] Add real-time status updates

- [ ] **Component Tests**
  - [ ] Test component rendering
  - [ ] Test user interactions
  - [ ] Test API integration
  - [ ] Run tests: `pnpm test`

**Deliverable:** All components integrated into OCC and functional

---

### Phase 3: Polish & Testing (Week 3)

- [ ] **End-to-End Testing**
  - [ ] Test complete workflow: sync → review → launch
  - [ ] Test with multiple events (10, 50, 100+)
  - [ ] Test error scenarios (network failure, invalid data)
  - [ ] Test concurrent operator usage
  - [ ] Performance testing

- [ ] **Error Handling**
  - [ ] Handle booking system unavailability
  - [ ] Handle invalid event data
  - [ ] Handle sync failures with retry logic
  - [ ] Show clear error messages to operators
  - [ ] Implement fallback to manual creation

- [ ] **UI/UX Polish**
  - [ ] Refine visual design
  - [ ] Improve loading states
  - [ ] Add animations and transitions
  - [ ] Test on different screen sizes
  - [ ] Accessibility review

- [ ] **Documentation**
  - [ ] Write operator user guide
  - [ ] Document API endpoints
  - [ ] Create troubleshooting guide
  - [ ] Add code comments and docstrings

- [ ] **Deployment Prep**
  - [ ] Code review
  - [ ] Final testing
  - [ ] Create deployment checklist
  - [ ] Plan rollout strategy

**Deliverable:** Feature ready for production deployment

---

## Database Schema

### Table 1: event_preload_queue

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

### Table 2: occ_event_preload_settings

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

### Modify: occ_sessions

```sql
ALTER TABLE occ_sessions ADD COLUMN (
  preload_source_booking_id INT,
  is_preloaded BOOLEAN DEFAULT FALSE,
  preload_timestamp DATETIME,
  FOREIGN KEY (preload_source_booking_id) REFERENCES events(id)
);
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/trpc/booking.getDailyEvents` | GET | Get all events for today from booking system |
| `/api/trpc/occ.syncDailyEvents` | POST | Sync daily events to OCC preload queue |
| `/api/trpc/occ.getPreloadedEvents` | GET | Get preloaded events for OCC session |
| `/api/trpc/occ.launchPreloadedEvent` | POST | Launch a preloaded event |
| `/api/trpc/occ.updatePreloadSettings` | POST | Update settings for preloaded event |

---

## Component Structure

```
OCC Dashboard
├── DailySchedulePanel
│   ├── EventCard (repeating)
│   │   ├── PreloadStatusIndicator
│   │   ├── Launch Button
│   │   ├── Edit Button
│   │   └── More Menu
│   ├── Sync All Button
│   └── Refresh Button
└── EventPreloadSettingsModal
    ├── Transcription Toggle
    ├── Sentiment Analysis Toggle
    ├── Recording Toggle
    ├── Platform Settings
    ├── Participant List
    └── Save & Launch Button
```

---

## Key Implementation Notes

### 1. Data Validation

Always validate booking event data before syncing:
- Check event time is in the future
- Verify platform is supported
- Validate participant list
- Check for required fields

### 2. Error Handling

Implement graceful error handling:
- If booking system is down, show message and allow manual creation
- If sync fails, show error and allow retry
- Log all errors for debugging
- Show clear messages to operators

### 3. Performance Optimization

- Use pagination for large event lists
- Cache daily events for 5 minutes
- Batch sync operations
- Use indexes on frequently queried fields

### 4. Security

- Validate operator has access to events
- Audit log all sync operations
- Encrypt sensitive data in transit
- Validate all API inputs

### 5. Testing Strategy

- Unit test all service methods
- Integration test complete workflows
- End-to-end test with real data
- Load test with 100+ events
- User acceptance testing with operators

---

## File Structure

```
server/
├── services/
│   └── bookingToOCCService.ts (NEW)
├── routers/
│   ├── booking.ts (MODIFY - add getDailyEvents)
│   └── occ.ts (MODIFY - add sync/preload endpoints)
└── db.ts (MODIFY - add helper functions)

client/src/
├── components/
│   ├── DailySchedulePanel.tsx (NEW)
│   ├── EventPreloadSettingsModal.tsx (NEW)
│   └── PreloadStatusIndicator.tsx (NEW)
└── pages/
    └── OCC.tsx (MODIFY - integrate DailySchedulePanel)

drizzle/
└── schema.ts (MODIFY - add new tables)

tests/
├── services/
│   └── bookingToOCCService.test.ts (NEW)
└── components/
    ├── DailySchedulePanel.test.tsx (NEW)
    └── EventPreloadSettingsModal.test.tsx (NEW)
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Sync success rate | 99%+ |
| Sync speed (100 events) | < 5 seconds |
| Launch time | < 10 seconds |
| Operator adoption | 80%+ daily usage |
| User satisfaction | 4.5/5.0+ |
| Error recovery rate | 95%+ |

---

## Deployment Checklist

- [ ] All database migrations applied
- [ ] All API endpoints deployed and tested
- [ ] All frontend components built and tested
- [ ] Unit tests passing (100%+ coverage)
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Documentation complete
- [ ] Operator training completed
- [ ] Rollout strategy approved
- [ ] Monitoring and alerts configured

---

## Support & Questions

For questions about this brief:
1. Review the full specification: `/docs/specs/BOOKING_TO_OCC_INTEGRATION.md`
2. Check the operator dashboard design: `/docs/UNIFIED_OPERATOR_DASHBOARD_FRAMEWORK.md`
3. Reference the OCC router: `/server/routers/occ.ts`
4. Contact the development team

---

## Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Backend | 1 week | Week 1 | Week 1 |
| Phase 2: Frontend | 1 week | Week 2 | Week 2 |
| Phase 3: Polish | 1 week | Week 3 | Week 3 |
| **Total** | **3 weeks** | **Now** | **3 weeks** |

---

**Document Version:** 1.0  
**Created:** March 13, 2026  
**Status:** Ready for Development  
**Next Step:** Assign to development team and begin Phase 1
