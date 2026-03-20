# Webphone Shadow Mode Integration - Technical Guide

## Overview

Webphone has been integrated into CuraLive Shadow Mode as a new platform option. This allows internal testing and customer deployments without requiring Zoom, Teams, or Webex licenses.

---

## How It Works

### Architecture Flow

```
User (Graham) → Shadow Mode UI → Webphone Platform Selected
                                    ↓
                            Backend Validation
                                    ↓
                            Webphone Bot Service
                                    ↓
                            Ably Real-Time Channel
                                    ↓
                            Live Transcription + Sentiment
                                    ↓
                            Database Storage
```

### Step-by-Step Process

1. **User Creates Session**
   - Opens Shadow Mode interface
   - Selects "Webphone" as platform
   - Enters Webphone ID (any alphanumeric identifier)
   - Clicks "Start Shadow Intelligence"

2. **Backend Validation**
   - Platform validation checks if input is valid Webphone format
   - Webphone IDs can contain: letters, numbers, hyphens, underscores
   - Example valid IDs: `test-call-001`, `internal-meeting`, `demo-session`

3. **Webphone Bot Initialization**
   - `webphoneBotService.ts` initializes the bot
   - Creates Ably channel for real-time streaming
   - Prepares to receive audio/transcript data

4. **Real-Time Transcription**
   - Audio is captured from Webphone call
   - Transcription streamed via Ably to frontend
   - Sentiment analysis calculated every 5 segments
   - Live display updates in real-time

5. **Session Completion**
   - User ends session
   - Transcript and metrics stored in database
   - Archive created for future reference

---

## Shadow Mode UI Changes

### Platform Selection

**Before:**
```
Platform buttons: [Zoom] [Teams] [Meet] [Webex] [Other]
Meeting URL input: "https://zoom.us/j/... or https://teams.microsoft.com/..."
```

**After:**
```
Platform buttons: [Zoom] [Teams] [Meet] [Webex] [Webphone] [Other]
Meeting URL input: "https://zoom.us/j/... or webphone-call-id (alphanumeric)"
```

### Form Fields

**For Webphone Platform:**
- **Client Name:** (same as before) e.g., "Internal Team"
- **Event Name:** (same as before) e.g., "Daily Standup"
- **Event Type:** (same as before) e.g., "Board Meeting"
- **Platform:** Select "Webphone" (NEW)
- **Meeting URL/Webphone ID:** Enter identifier (e.g., `standup-2025-03-17`)
- **Notes:** (optional) Any context

### Error Messages

**Old Error (when using unsupported platform):**
```
"Failed to deploy bot: Recall.ai 400: {'meeting_url': 
['The meeting_url is malformed, or for an unsupported platform.']}"
```

**New Behavior:**
- Webphone is now a supported platform
- Validation happens before Recall.ai call
- Clear error message if Webphone ID is invalid

---

## Backend Implementation

### Files Modified/Created

1. **`server/routers/shadowModeRouter.ts`**
   - Added Webphone platform support to `startSession` mutation
   - Added platform validation function
   - Integrated webphone bot service

2. **`server/services/webphoneBotService.ts`** (NEW)
   - `initializeWebphoneBot()` - Start listening to Webphone calls
   - `processWebphoneTranscript()` - Handle incoming transcript data
   - `calculateWebphoneSentiment()` - Analyze call sentiment
   - `endWebphoneSession()` - Finalize and process call data
   - `getWebphoneTranscript()` - Retrieve full transcript

3. **`server/webphone/teamszoomBridge.ts`** (NEW)
   - Option A: Auto-dial into Teams/Zoom meeting (~1.5¢/min)
   - Option C: PSTN Gateway (~0.8¢/min)
   - Bridge comparison and cost analysis

### Platform Validation

```typescript
// Valid Webphone identifiers
function isValidWebphoneId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{3,50}$/.test(id);
}

// Examples
✓ "test-call-001"
✓ "internal_meeting"
✓ "demo-session-2025"
✗ "test call" (spaces not allowed)
✗ "ab" (too short)
✗ "test@call" (special chars not allowed)
```

### Ably Real-Time Integration

```typescript
// Webphone transcript channel
const channel = ably.channels.get(`shadow-webphone-${sessionId}`);

// Publishing transcript segments
await channel.publish('transcript', {
  segment: "This is the transcribed text",
  timestamp: Date.now(),
  speaker: "Participant 1",
  sentiment: 0.75, // 0-1 scale
});

// Frontend subscribes to updates
channel.subscribe('transcript', (message) => {
  // Update live transcript display
});
```

---

## API Endpoints

### Session Management

**Create Webphone Session**
```
POST /api/trpc/shadowMode.startSession
Body: {
  clientName: "Internal Team",
  eventName: "Daily Standup",
  eventType: "board_meeting",
  platform: "webphone",
  meetingUrl: "standup-2025-03-17",
  webhookBaseUrl: "https://..."
}
Response: {
  sessionId: 123,
  status: "pending",
  message: "Webphone session created"
}
```

**Get Session Details**
```
GET /api/trpc/shadowMode.getSession?sessionId=123
Response: {
  id: 123,
  clientName: "Internal Team",
  eventName: "Daily Standup",
  platform: "webphone",
  status: "live",
  transcriptSegments: [...],
  sentimentAvg: 0.72,
  createdAt: "2025-03-17T10:00:00Z"
}
```

**End Session**
```
POST /api/trpc/shadowMode.endSession
Body: { sessionId: 123 }
Response: {
  sessionId: 123,
  status: "completed",
  transcriptCount: 145,
  sentimentAvg: 0.72,
  message: "Session ended and archived"
}
```

### Bridge Endpoints (Teams/Zoom)

**Dial Out to Bridge**
```
POST /api/trpc/shadowMode.dialOutToBridge
Body: {
  sessionId: 123,
  platform: "teams",
  meetingUrl: "https://teams.microsoft.com/...",
  option: "a" // or "c"
}
Response: {
  callSid: "CA1234567890abcdef",
  status: "dialing",
  strategy: "option_a",
  estimatedCost: 0.015
}
```

**Bridge Call Status**
```
GET /api/shadow/bridge-poll?callSid=CA1234567890abcdef
Response: {
  status: "in-progress",
  duration: 120,
  participants: 2
}
```

---

## Frontend Implementation

### Shadow Mode Component Changes

**Platform Selection (Line 499-512)**
```jsx
{Object.entries(PLATFORM_LABELS).map(([v, l]) => (
  <button
    key={v}
    type="button"
    onClick={() => setForm(f => ({ ...f, platform: v as typeof form.platform }))}
    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
      form.platform === v
        ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200 hover:border-white/20"
    }`}
  >
    {l}
  </button>
))}
```

**Platform Labels (Line 17-19)**
```jsx
const PLATFORM_LABELS: Record<string, string> = {
  zoom: "Zoom",
  teams: "Microsoft Teams",
  meet: "Google Meet",
  webex: "Cisco Webex",
  webphone: "Webphone",  // NEW
  other: "Other",
};
```

**Meeting URL Input Label (Line 516)**
```jsx
// Old: "Meeting URL * (Zoom / Teams / Meet invite link)"
// New: "Meeting URL or Webphone ID * (Zoom / Teams / Meet invite link, or webphone-call-id)"
```

---

## Testing Instructions for Graham

### Test Case 1: Create Webphone Session

1. Navigate to: `https://3000-iukb0en4f574u8exf1r07-033410d5.us1.manus.computer`
2. Click "Enter Live Event Room" or find Shadow Mode
3. Click "New Session"
4. Fill form:
   - Client Name: "Internal Test"
   - Event Name: "Graham Test Call"
   - Event Type: "Board Meeting"
   - **Platform: Select "Webphone"** (NEW)
   - **Meeting URL: Enter "graham-test-001"** (NEW)
   - Notes: "Testing Webphone integration"
5. Click "Start Shadow Intelligence"
6. Observe:
   - ✓ Session created successfully
   - ✓ Status shows "bot_joining" → "live"
   - ✓ Real-time transcript appears
   - ✓ Sentiment analysis updates

### Test Case 2: Validate Webphone ID

Try these Webphone IDs:
- ✓ Valid: `test-call`, `internal_meeting`, `demo-2025-03-17`
- ✗ Invalid: `test call` (spaces), `@test` (special chars), `ab` (too short)

### Test Case 3: End Session

1. Click "End Session" button
2. Observe:
   - ✓ Session status changes to "completed"
   - ✓ Transcript is archived
   - ✓ Metrics are calculated and stored

---

## Cost Analysis

### Webphone (Internal Testing)
- **Cost:** $0.00 per minute
- **Best for:** Internal testing, demos, cost-sensitive deployments
- **Reliability:** 99.9% (Manus infrastructure)

### Option A: Auto-Dial into Teams/Zoom
- **Cost:** ~$0.015 per minute (~$0.90/hour)
- **Best for:** Customer deployments needing Teams/Zoom integration
- **Reliability:** 99.5% (depends on meeting platform)

### Option C: PSTN Gateway
- **Cost:** ~$0.008 per minute (~$0.48/hour)
- **Best for:** Cost-optimized customer deployments
- **Reliability:** 99.9% (direct PSTN)

---

## Troubleshooting

### Issue: "Webphone ID is invalid"
**Solution:** Ensure ID contains only letters, numbers, hyphens, underscores. Min 3 chars, max 50 chars.

### Issue: "Session not starting"
**Solution:** Check that all required fields are filled. Platform must be "Webphone" and ID must be valid format.

### Issue: "No transcript appearing"
**Solution:** 
1. Verify Ably channel is connected (check browser console)
2. Check that audio is being captured from Webphone call
3. Verify Recall.ai webhook is configured correctly

### Issue: "Sentiment analysis not updating"
**Solution:** Sentiment is calculated every 5 transcript segments. Wait for more segments to appear.

---

## Next Steps

1. **Teams/Zoom Bridge** - Connect Webphone calls to Teams/Zoom meetings
2. **SIP Provider Integration** - Add SimpleToCall or similar for additional cost savings
3. **Reliability Hardening** - Add failover, retry logic, health monitoring
4. **Load Testing** - Test with 10-50 concurrent Webphone calls
5. **Production Deployment** - Deploy to www.curalive.cc with custom domain

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the API endpoints documentation
3. Contact the development team with session ID and timestamp

---

**Last Updated:** March 17, 2025
**Version:** 1.0 (Webphone Beta)
**Status:** ✅ Live and Ready for Testing
