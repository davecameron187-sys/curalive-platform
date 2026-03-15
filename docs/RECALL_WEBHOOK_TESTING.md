# Recall.ai Webhook Integration Testing Guide

## Overview

This guide provides step-by-step instructions for testing the Recall.ai webhook integration with Chorus.AI's Phase 2 Auto-Muting system. The integration enables real-time compliance violation detection and automatic speaker muting during live events.

## Architecture

The Recall.ai webhook integration follows this flow:

1. **Recall.ai Bot** captures audio from the conference call
2. **Webhook Endpoint** (`/api/webhooks/recall`) receives transcript segments in real-time
3. **Compliance Detection** analyzes segments for violations (forward-looking statements, price-sensitive info, etc.)
4. **Violation Alert** creates database record and publishes to Ably real-time channel
5. **Auto-Muting** evaluates speaker violation count and applies soft/hard mute via Recall.ai API
6. **Operator Dashboard** displays violations and allows manual override

## Prerequisites

- Active Recall.ai account with API credentials
- Chorus.AI staging environment deployed
- Webhook endpoint publicly accessible (or ngrok tunnel for local testing)
- Test event created in Chorus.AI with operator access
- Recall.ai bot configured for your conference platform (Zoom, Teams, Webex)

## Testing Checklist

### Phase 1: Webhook Endpoint Validation

**Test 1.1: Webhook Signature Verification**
- Verify webhook signature validation is working
- Expected: Invalid signatures are rejected with 401 Unauthorized
- Test command:
  ```bash
  curl -X POST https://your-domain/api/webhooks/recall \
    -H "Content-Type: application/json" \
    -H "X-Recall-Signature: invalid-signature" \
    -d '{"event": "transcript.segment", "data": {}}'
  ```
- Expected response: `401 Unauthorized`

**Test 1.2: Valid Webhook Payload**
- Send a valid transcript segment payload
- Expected: 200 OK response, segment processed
- Test payload:
  ```json
  {
    "event": "transcript.segment",
    "bot_id": "bot-123",
    "call_id": "call-456",
    "data": {
      "speaker_name": "John Smith",
      "speaker_role": "presenter",
      "text": "We expect revenue to grow 50% next quarter",
      "start_time_ms": 1000,
      "end_time_ms": 5000,
      "confidence": 0.95
    }
  }
  ```

### Phase 2: Violation Detection

**Test 2.1: Forward-Looking Statement Detection**
- Send transcript with forward-looking statement
- Expected: Violation detected, severity=high, confidence>0.8
- Test statement: "We expect revenue to grow 50% next quarter based on our pipeline"
- Verify in database: `SELECT * FROM compliance_violations WHERE violation_type='forward_looking'`

**Test 2.2: Price-Sensitive Information Detection**
- Send transcript with price-sensitive information
- Expected: Violation detected, severity=critical
- Test statement: "Our stock price should increase significantly once this deal closes"
- Verify in database: `SELECT * FROM compliance_violations WHERE violation_type='price_sensitive'`

**Test 2.3: Insider Information Detection**
- Send transcript with insider information
- Expected: Violation detected, severity=critical
- Test statement: "We have confidential information about the acquisition that hasn't been announced"
- Verify in database: `SELECT * FROM compliance_violations WHERE violation_type='insider_info'`

**Test 2.4: Profanity Detection**
- Send transcript with profanity
- Expected: Violation detected, severity=medium
- Test statement: "This is [explicit language] ridiculous"
- Verify in database: `SELECT * FROM compliance_violations WHERE violation_type='profanity'`

### Phase 3: Real-Time Ably Publishing

**Test 3.1: Violation Alert Published to Ably**
- Monitor Ably channel: `compliance:violations:{eventId}`
- Send violation-triggering transcript
- Expected: Message published to Ably within 100ms
- Verify with Ably console or client subscription

**Test 3.2: Operator Dashboard Updates**
- Open operator console for test event
- Send violation-triggering transcript
- Expected: Violation appears in MutingControlPanel within 1 second
- Verify speaker violation count increments

### Phase 4: Auto-Muting Workflow

**Test 4.1: Soft Mute Threshold (2 violations)**
- Send 2 violation-triggering transcripts from same speaker
- Expected: Speaker soft-muted after 2nd violation
- Verify in database: `SELECT * FROM speaker_muting_state WHERE mute_type='soft'`
- Verify in Ably: Mute event published to `muting:events:{eventId}`

**Test 4.2: Soft Mute Auto-Unmute (30 seconds)**
- Trigger soft mute on speaker
- Wait 30 seconds
- Expected: Speaker automatically unmuted
- Verify in database: `SELECT * FROM speaker_muting_state WHERE mute_type IS NULL`

**Test 4.3: Hard Mute Threshold (5 violations)**
- Send 5 violation-triggering transcripts from same speaker
- Expected: Speaker hard-muted after 5th violation
- Verify in database: `SELECT * FROM speaker_muting_state WHERE mute_type='hard'`
- Hard mute persists until operator manually unmutes

**Test 4.4: Operator Override**
- Trigger soft/hard mute on speaker
- Click "Unmute" button in operator console
- Expected: Speaker unmuted immediately, override recorded
- Verify in database: `SELECT * FROM muting_overrides WHERE operator_id=?`

### Phase 5: Rapid-Fire Violations

**Test 5.1: Multiple Speakers, Multiple Violations**
- Send 10 rapid violations from 3 different speakers
- Expected: Each speaker tracked independently
- Verify in database: `SELECT speaker_id, COUNT(*) FROM compliance_violations GROUP BY speaker_id`

**Test 5.2: Duplicate Violation Deduplication**
- Send identical violation twice within 5 minutes
- Expected: Second violation deduplicated, not recorded
- Verify in database: Only 1 record for the violation

**Test 5.3: Rapid Muting/Unmuting**
- Trigger soft mute, then operator unmutes, then triggers again
- Expected: State transitions handled correctly
- Verify in database: Muting history shows all transitions

### Phase 6: Error Handling

**Test 6.1: Malformed Webhook Payload**
- Send invalid JSON or missing required fields
- Expected: 400 Bad Request, error logged, no violation created
- Verify in logs: `[AI-AM] Invalid webhook payload`

**Test 6.2: Database Unavailable**
- Temporarily disable database connection
- Send violation-triggering transcript
- Expected: Webhook returns 503 Service Unavailable, error logged
- Verify in logs: `[AI-AM] Database unavailable`

**Test 6.3: Recall.ai API Failure**
- Mock Recall.ai API returning 500 error
- Attempt to apply mute
- Expected: Error logged, operator notified, manual override available
- Verify in logs: `[AI-AM] Recall.ai API error`

## Manual Testing Steps

### Setup

1. Deploy Chorus.AI to staging environment
2. Create test event: "Phase 2 Auto-Muting Test - [timestamp]"
3. Configure Recall.ai bot for your conference platform
4. Get webhook endpoint URL: `https://staging.choruscall.ai/api/webhooks/recall`
5. Register webhook in Recall.ai dashboard

### Live Testing Scenario

1. **Start Conference Call**
   - Join Zoom/Teams/Webex meeting
   - Ensure Recall.ai bot is in the call
   - Open operator console for test event

2. **Trigger Violations**
   - Speaker 1: "We expect revenue to grow 50% next quarter" (forward-looking)
   - Speaker 2: "Our stock price should double after this announcement" (price-sensitive)
   - Speaker 1: "We have confidential information about the acquisition" (insider info)

3. **Monitor in Real-Time**
   - Watch operator console for violations appearing
   - Verify soft mute triggers after 2nd violation from same speaker
   - Verify hard mute triggers after 5th violation from same speaker

4. **Test Operator Controls**
   - Click "Unmute" button for soft-muted speaker
   - Verify speaker unmuted immediately
   - Verify muting override recorded in database

5. **Test Auto-Unmute**
   - Trigger soft mute
   - Wait 30 seconds
   - Verify speaker automatically unmuted

## Monitoring & Logging

### Key Logs to Monitor

```bash
# Watch real-time logs
tail -f /home/ubuntu/chorus-ai/.manus-logs/devserver.log

# Search for AI-AM violations
grep "\[AI-AM\]" /home/ubuntu/chorus-ai/.manus-logs/devserver.log

# Search for muting events
grep "muting\|MUTE" /home/ubuntu/chorus-ai/.manus-logs/devserver.log
```

### Database Queries for Verification

```sql
-- Check violations
SELECT id, event_id, speaker_name, violation_type, severity, created_at 
FROM compliance_violations 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY created_at DESC;

-- Check speaker muting state
SELECT speaker_id, speaker_name, violation_count, mute_type, muted_at, unmuted_at
FROM speaker_muting_state
WHERE event_id = 'your-event-id';

-- Check muting overrides
SELECT operator_id, speaker_id, mute_type, action, created_at
FROM muting_overrides
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Check deduplication cache
SELECT event_id, speaker_id, violation_type, COUNT(*) as count
FROM compliance_violations
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
GROUP BY event_id, speaker_id, violation_type;
```

## Performance Benchmarks

Target metrics for Phase 2 Auto-Muting:

| Metric | Target | Notes |
|--------|--------|-------|
| Webhook latency | <100ms | Time from webhook received to violation detected |
| Ably publish latency | <50ms | Time to publish violation to real-time channel |
| Operator console update | <1s | Time for violation to appear in UI |
| Muting API call | <500ms | Time to call Recall.ai muting API |
| Auto-unmute accuracy | 99.9% | Soft mutes must unmute after 30s ±1s |
| Deduplication accuracy | 100% | Identical violations must be deduplicated |

## Troubleshooting

### Violations Not Detected

1. Check webhook signature verification
2. Verify Recall.ai bot is in the call
3. Check compliance detection LLM is responding
4. Monitor logs: `grep "detectViolation" /home/ubuntu/chorus-ai/.manus-logs/devserver.log`

### Muting Not Applied

1. Verify Recall.ai API credentials are configured
2. Check speaker ID is correct in database
3. Monitor logs: `grep "applyMuting\|Recall.ai" /home/ubuntu/chorus-ai/.manus-logs/devserver.log`
4. Test Recall.ai API directly with curl

### Operator Console Not Updating

1. Verify Ably channel subscription is active
2. Check browser console for JavaScript errors
3. Verify MutingControlPanel component is mounted
4. Monitor network tab for Ably messages

### Database Errors

1. Verify database connection is active
2. Check database user has INSERT/UPDATE permissions
3. Run migrations: `pnpm db:push`
4. Monitor logs: `grep "Database\|DrizzleQueryError" /home/ubuntu/chorus-ai/.manus-logs/devserver.log`

## Success Criteria

Phase 2 Auto-Muting is ready for beta deployment when:

- ✅ All Phase 1-6 tests pass
- ✅ Webhook latency <100ms consistently
- ✅ Operator console updates within 1 second
- ✅ Auto-muting applies correctly at thresholds
- ✅ Operator overrides work reliably
- ✅ No data loss during high-volume violations
- ✅ Error handling graceful with proper logging
- ✅ Performance meets all benchmarks

## Next Steps

1. Execute manual testing scenario with 5 pilot customers
2. Collect feedback on muting thresholds and UX
3. Adjust thresholds based on customer feedback
4. Deploy to production with monitoring alerts
5. Schedule weekly check-ins with pilot customers for first month
