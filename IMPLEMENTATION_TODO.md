# Implementation TODO — WebPhone-First & Webcast/Audio Integration

## Priority 1: WebPhone-First Completion (Phases 3-6)

### Phase 3: Integration Tests
- [ ] Create fallback.test.ts with retry logic tests
- [ ] Test provider switching scenarios (WebPhone → Teams → Zoom, etc.)
- [ ] Test operator notifications on provider change
- [ ] Test session creation with fallback enabled
- [ ] Test error handling and edge cases

### Phase 4: Webcast/Audio Support
- [ ] Add webcast session type to database schema
- [ ] Add audio-only session type to database schema
- [ ] Update session creation to support webcast/audio
- [ ] Ensure WebPhone is default for webcast/audio sessions
- [ ] Test webcast session creation flow

### Phase 5: Final Code Review
- [ ] Verify WebPhone is default in all session creation paths
- [ ] Verify fallback logic is integrated (not isolated)
- [ ] Verify operator notifications work end-to-end
- [ ] Verify customer join flow prioritizes WebPhone
- [ ] Review all WebPhone-related code for consistency

### Phase 6: Final Verification
- [ ] Test full session lifecycle with WebPhone
- [ ] Test fallback triggered during session
- [ ] Verify OperatorConsole WebPhone tab works live
- [ ] Verify Shadow Mode handles WebPhone sessions
- [ ] Document any known limitations

## Priority 2: Webcast/Audio into Shadow Mode

- [ ] Ensure webcast sessions appear in Shadow Mode archive
- [ ] Ensure audio-only sessions appear in Shadow Mode archive
- [ ] Test transcript sync for webcast sessions
- [ ] Test notes/Q&A for webcast sessions
- [ ] Test action log for webcast sessions
- [ ] Test handoff for webcast sessions
- [ ] Test exports for webcast sessions
- [ ] Test playback for webcast sessions
- [ ] Remove any architectural assumptions separating webcast from Shadow Mode
- [ ] Make Shadow Mode the standard control room for webcast

## Priority 3: Replit Readiness

- [ ] Verify all routes are wired and documented
- [ ] Verify all components are imported and used
- [ ] Test pnpm install (clean install)
- [ ] Test pnpm db:push (migrations apply cleanly)
- [ ] Test pnpm dev (dev server starts without errors)
- [ ] Verify staging documents match actual code state
- [ ] Ensure Track A can run without engineering intervention
- [ ] Document any environment-specific setup needed

## Known Blockers

- [ ] ComplianceRulesAdmin.tsx has pre-existing TypeScript errors (non-blocking)
- [ ] None identified yet for WebPhone-First or webcast/audio

## Deliverables for Replit Handoff

- [ ] Commit hash/PR
- [ ] Files changed list
- [ ] What was completed
- [ ] What remains incomplete
- [ ] What specifically needs Replit validation
- [ ] Known blockers
- [ ] Areas where WebPhone is still not fully default
