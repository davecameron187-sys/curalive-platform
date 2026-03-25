# CuraLive Testing Plan — Step by Step

**Date:** March 13, 2026  
**Version:** 1.0  
**Status:** Ready for Execution  

---

## Overview

This document provides a simple, step-by-step testing plan for validating CuraLive's core functionality. Each test is designed to be executed independently, one at a time, with clear success criteria and troubleshooting guidance.

**Testing Scope:**
- Audio Bridge (PSTN dial-in, Twilio/Telnyx integration)
- Webcasts (Mux streaming, HLS playback)
- Video Platforms (Zoom, Teams, Webex, RTMP integration)
- Shadow Page (operator monitoring interface)
- AI Services (transcription, sentiment analysis, Q&A auto-triage)
- Reports (post-event analytics and summaries)
- AI Infrastructure Applications (LLM integration, compliance detection)

**Total Tests:** 7 major test suites  
**Estimated Duration:** 2-3 hours per test (depending on event complexity)  
**Recommended Schedule:** One test per day, Monday-Friday

---

## Pre-Testing Checklist

Before starting any test, verify the following prerequisites are in place:

| Item | Status | Notes |
|------|--------|-------|
| Dev server running | ⬜ | `pnpm dev` should be active |
| Database connected | ⬜ | MySQL/TiDB connection verified |
| Twilio credentials configured | ⬜ | Account SID, Auth Token, Caller ID set |
| Telnyx credentials configured | ⬜ | API key, SIP connection ID, username/password set |
| Mux token configured | ⬜ | Token ID and Secret set in env vars |
| Recall.ai API key configured | ⬜ | Webhook URL registered |
| Ably API key configured | ⬜ | Real-time messaging enabled |
| Test event created | ⬜ | Event ID: `test-event-001` |
| Test participants registered | ⬜ | At least 3 test accounts created |
| Operator account created | ⬜ | OCC access verified |

**Verification Command:**
```bash
cd /home/ubuntu/chorus-ai && pnpm dev
# Dev server should start without errors
# Check: http://localhost:3000 should load
```

---

## Test 1: Audio Bridge (PSTN Dial-In)

**Duration:** 45 minutes  
**Objective:** Validate that participants can dial into the event via PSTN and be connected to the conference.

### Prerequisites
- Twilio account with active phone number
- Test phone numbers available (at least 2)
- Event created in database with PSTN enabled

### Step-by-Step Execution

**Step 1.1: Create Test Event**
```bash
# Navigate to OCC at http://localhost:3000/occ/test-event-001
# Click "Create New Event"
# Fill in:
#   - Title: "Audio Bridge Test - March 13"
#   - Platform: "PSTN"
#   - Status: "Upcoming"
# Click "Create Event"
```

**Expected Result:** Event appears in event list with status "Upcoming"

---

**Step 1.2: Configure PSTN Dial-In Numbers**
```bash
# In OCC, click "Event Settings" → "Dial-In Numbers"
# Verify Twilio phone number is displayed
# Note the conference access code (e.g., "1234567")
```

**Expected Result:** Dial-in number and access code are visible and correct

---

**Step 1.3: Start Event**
```bash
# In OCC, click "Start Event"
# Status should change to "LIVE"
# Operator Console should load
```

**Expected Result:** Event status changes to LIVE, OCC loads without errors

---

**Step 1.4: Dial Into Conference (Test Phone 1)**
```bash
# From first test phone, dial the Twilio number
# When prompted, enter access code: 1234567
# Wait for connection confirmation
```

**Expected Result:** Call connects, participant hears hold music or welcome message

---

**Step 1.5: Dial Into Conference (Test Phone 2)**
```bash
# From second test phone, dial the Twilio number
# Enter same access code
# Wait for connection
```

**Expected Result:** Second participant connects successfully

---

**Step 1.6: Verify Participant List in OCC**
```bash
# In OCC, check "Participants" panel
# Should show 2 participants with phone numbers
# Status should show "Connected"
```

**Expected Result:** Both participants appear in OCC with "Connected" status

---

**Step 1.7: Test Audio Quality**
```bash
# From Test Phone 1, speak clearly: "Testing audio quality"
# In OCC, verify transcription appears in real-time
# Check sentiment analysis shows neutral tone
```

**Expected Result:** Audio is captured, transcribed, and analyzed correctly

---

**Step 1.8: Test Disconnect**
```bash
# From Test Phone 1, hang up
# Wait 5 seconds
# In OCC, verify participant status changes to "Disconnected"
```

**Expected Result:** Participant removed from active list, status updated

---

**Step 1.9: End Event**
```bash
# In OCC, click "End Event"
# Confirm action
# Status should change to "Completed"
```

**Expected Result:** Event ends, all participants disconnected

---

### Success Criteria

✅ **Test 1 Passes If:**
- Both participants successfully connect via PSTN
- Participants appear in OCC with correct status
- Audio is captured and transcribed
- Sentiment analysis works correctly
- Participants can disconnect cleanly
- Event can be ended without errors

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Call doesn't connect | Check Twilio credentials in env vars; verify phone number is active |
| No transcription | Verify Recall.ai webhook is registered; check audio quality |
| Participants don't appear in OCC | Refresh OCC page; check database connection |
| Audio quality is poor | Check network bandwidth; try different phone |

---

## Test 2: Webcasts (Mux Streaming & HLS Playback)

**Duration:** 45 minutes  
**Objective:** Validate that live webcast can be streamed via Mux and played back via HLS.

### Prerequisites
- Mux account with active token
- OBS or similar streaming software installed
- Test event created with webcast enabled

### Step-by-Step Execution

**Step 2.1: Create Test Event with Webcast**
```bash
# Navigate to OCC
# Create new event: "Webcast Test - March 13"
# Enable "Webcast" option
# Click "Create Event"
```

**Expected Result:** Event created with webcast enabled

---

**Step 2.2: Get RTMP Ingest URL**
```bash
# In OCC, click "Event Settings" → "Webcast"
# Copy RTMP URL and Stream Key
# Format: rtmp://live.mux.com/app/{stream-key}
```

**Expected Result:** RTMP URL and stream key are displayed

---

**Step 2.3: Start Event**
```bash
# Click "Start Event"
# Status changes to "LIVE"
```

**Expected Result:** Event is live

---

**Step 2.4: Configure OBS Streaming**
```bash
# Open OBS Studio
# Go to Settings → Stream
# Service: Custom
# Server: rtmp://live.mux.com/app
# Stream Key: [paste from Step 2.2]
# Click "Start Streaming"
```

**Expected Result:** OBS connects to Mux, streaming starts

---

**Step 2.5: Verify Stream in Mux Dashboard**
```bash
# Log into Mux dashboard
# Navigate to Live Streams
# Find stream with today's date
# Status should show "Active"
# Bitrate should be stable (>2 Mbps)
```

**Expected Result:** Stream is active and receiving data

---

**Step 2.6: Get HLS Playback URL**
```bash
# In Mux dashboard, copy the HLS Playback URL
# Format: https://image.mux.com/{playback-id}.m3u8
```

**Expected Result:** HLS URL is available

---

**Step 2.7: Test Playback in Browser**
```bash
# Open new browser tab
# Navigate to: http://localhost:3000/webcast/test-event-001
# Paste HLS URL (or use auto-loaded URL if available)
# Click "Play"
```

**Expected Result:** Video plays with 5-10 second latency

---

**Step 2.8: Verify Video Quality**
```bash
# Watch stream for 30 seconds
# Check for:
#   - Smooth playback (no buffering)
#   - Clear video quality
#   - Audio sync with video
```

**Expected Result:** Video plays smoothly with good quality

---

**Step 2.9: Stop Streaming**
```bash
# In OBS, click "Stop Streaming"
# In Mux dashboard, verify stream status changes to "Idle"
```

**Expected Result:** Stream stops cleanly

---

**Step 2.10: End Event**
```bash
# In OCC, click "End Event"
# Confirm
```

**Expected Result:** Event ends, webcast archived

---

### Success Criteria

✅ **Test 2 Passes If:**
- RTMP stream connects successfully to Mux
- Stream is active and receiving data
- HLS playback URL is available
- Video plays smoothly in browser
- Stream stops cleanly without errors
- Event can be ended

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Stream won't connect | Check Mux token; verify RTMP URL is correct |
| Video buffering | Check network bandwidth; reduce bitrate in OBS |
| No audio | Check OBS audio input settings; verify mic is enabled |
| HLS URL not available | Wait 10 seconds for Mux to process stream; refresh page |

---

## Test 3: Video Platforms (Zoom, Teams, Webex, RTMP)

**Duration:** 60 minutes  
**Objective:** Validate that CuraLive can integrate with multiple video platforms and capture audio/video.

### Prerequisites
- Zoom, Teams, and Webex accounts with meeting creation permissions
- RTMP encoder (OBS) for RTMP test
- Test event created for each platform

### Step-by-Step Execution

**Step 3.1: Test Zoom Integration**
```bash
# Create Zoom meeting: "CuraLive Test - Zoom"
# Get meeting ID and passcode
# In OCC, create event with Platform: "Zoom"
# Enter Zoom meeting ID
# Start event
```

**Expected Result:** Event linked to Zoom meeting

---

**Step 3.2: Join Zoom Meeting**
```bash
# From 2 test devices, join the Zoom meeting
# Wait 10 seconds for connection
# In OCC, verify participants appear
```

**Expected Result:** Participants show up in OCC

---

**Step 3.3: Test Audio Capture from Zoom**
```bash
# In Zoom, participant 1 speaks: "Testing Zoom audio"
# In OCC, verify transcription appears
# Check sentiment analysis
```

**Expected Result:** Audio captured, transcribed, analyzed

---

**Step 3.4: Test Teams Integration**
```bash
# Create Teams meeting: "CuraLive Test - Teams"
# Get meeting link
# In OCC, create event with Platform: "Teams"
# Enter Teams meeting ID
# Start event
```

**Expected Result:** Event linked to Teams meeting

---

**Step 3.5: Join Teams Meeting**
```bash
# From 2 test devices, join Teams meeting
# Wait 10 seconds
# In OCC, verify participants appear
```

**Expected Result:** Participants show in OCC

---

**Step 3.6: Test Audio Capture from Teams**
```bash
# In Teams, participant 1 speaks: "Testing Teams audio"
# In OCC, verify transcription appears
```

**Expected Result:** Audio captured and transcribed

---

**Step 3.7: Test Webex Integration**
```bash
# Create Webex meeting: "CuraLive Test - Webex"
# Get meeting number and password
# In OCC, create event with Platform: "Webex"
# Enter meeting details
# Start event
```

**Expected Result:** Event linked to Webex meeting

---

**Step 3.8: Join Webex Meeting**
```bash
# From 2 test devices, join Webex meeting
# Wait 10 seconds
# In OCC, verify participants appear
```

**Expected Result:** Participants show in OCC

---

**Step 3.9: Test Audio Capture from Webex**
```bash
# In Webex, participant 1 speaks: "Testing Webex audio"
# In OCC, verify transcription appears
```

**Expected Result:** Audio captured and transcribed

---

**Step 3.10: Test RTMP Integration**
```bash
# In OCC, create event with Platform: "RTMP"
# Get RTMP ingest URL
# In OBS, configure with RTMP URL
# Start streaming
# In OCC, verify stream is active
```

**Expected Result:** RTMP stream connects and is active

---

### Success Criteria

✅ **Test 3 Passes If:**
- All 4 platforms (Zoom, Teams, Webex, RTMP) connect successfully
- Participants appear in OCC for each platform
- Audio is captured and transcribed from each platform
- No errors or connection timeouts
- Events can be ended cleanly

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Platform won't connect | Verify API credentials; check meeting ID is correct |
| Participants don't appear | Refresh OCC; check database connection |
| Audio not captured | Verify Recall.ai is configured; check audio input |
| RTMP stream fails | Check RTMP URL; verify OBS settings |

---

## Test 4: Shadow Page (Operator Monitoring)

**Duration:** 30 minutes  
**Objective:** Validate that the operator can monitor event in real-time via shadow page.

### Prerequisites
- Event running with participants
- Operator account logged in
- Shadow page accessible

### Step-by-Step Execution

**Step 4.1: Navigate to Shadow Page**
```bash
# In OCC, click "Shadow Page" button
# Or navigate to: http://localhost:3000/shadow/test-event-001
# Page should load without errors
```

**Expected Result:** Shadow page loads with event details

---

**Step 4.2: Verify Participant List**
```bash
# Shadow page should show all connected participants
# Each participant should show:
#   - Name
#   - Connection status
#   - Duration connected
#   - Audio level indicator
```

**Expected Result:** All participants listed with correct info

---

**Step 4.3: Verify Live Transcription**
```bash
# Participant speaks: "Shadow page test"
# Transcription should appear in real-time on shadow page
# Should show speaker name and timestamp
```

**Expected Result:** Transcription appears in real-time

---

**Step 4.4: Verify Sentiment Analysis**
```bash
# Participant speaks with different tones:
#   - Positive: "Great question, thank you!"
#   - Negative: "That's disappointing"
#   - Neutral: "The meeting is at 3 PM"
# Shadow page should show sentiment indicator for each
```

**Expected Result:** Sentiment indicators update correctly

---

**Step 4.5: Verify Compliance Alerts**
```bash
# If AI detects compliance issue, alert should appear
# Alert should show:
#   - Issue type (e.g., "Profanity detected")
#   - Speaker name
#   - Timestamp
#   - Severity level
```

**Expected Result:** Alerts appear when triggered

---

**Step 4.6: Verify Live Metrics**
```bash
# Shadow page should show:
#   - Total participants
#   - Average sentiment score
#   - Transcription accuracy
#   - Event duration
#   - Network latency
```

**Expected Result:** All metrics display and update in real-time

---

**Step 4.7: Test Page Responsiveness**
```bash
# Resize browser window (desktop to mobile)
# Shadow page should adapt to screen size
# All elements should remain readable
```

**Expected Result:** Page is responsive on all screen sizes

---

### Success Criteria

✅ **Test 4 Passes If:**
- Shadow page loads without errors
- All participants are listed correctly
- Transcription appears in real-time
- Sentiment analysis works correctly
- Compliance alerts trigger appropriately
- All metrics display and update
- Page is responsive

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Page won't load | Check URL; verify event ID is correct |
| Transcription not appearing | Check Recall.ai webhook; verify audio input |
| Metrics not updating | Refresh page; check database connection |
| Page is slow | Check network bandwidth; close other tabs |

---

## Test 5: AI Services (Transcription, Sentiment, Q&A Auto-Triage)

**Duration:** 60 minutes  
**Objective:** Validate that all AI services work correctly during a live event.

### Prerequisites
- Event running with participants
- Recall.ai configured for transcription
- AI models loaded for sentiment and Q&A analysis
- Test Q&A questions prepared

### Step-by-Step Execution

**Step 5.1: Test Transcription Accuracy**
```bash
# Participant reads prepared script:
#   "The quarterly earnings report shows a 15% increase in revenue"
# In OCC, verify transcription matches exactly
# Check confidence score (should be >90%)
```

**Expected Result:** Transcription is accurate with high confidence

---

**Step 5.2: Test Multi-Language Transcription**
```bash
# Participant speaks in Spanish:
#   "Buenos días, gracias por su atención"
# Verify transcription is in Spanish
# Check language detection is correct
```

**Expected Result:** Language detected correctly, transcription accurate

---

**Step 5.3: Test Sentiment Analysis**
```bash
# Participant 1 speaks positively:
#   "Excellent results, very pleased with performance"
# Verify sentiment shows "Positive" with high score
#
# Participant 2 speaks negatively:
#   "Disappointing numbers, need to improve"
# Verify sentiment shows "Negative" with high score
#
# Participant 3 speaks neutrally:
#   "The meeting is scheduled for Tuesday"
# Verify sentiment shows "Neutral"
```

**Expected Result:** Sentiment analysis matches speaker tone

---

**Step 5.4: Test Q&A Submission**
```bash
# In event interface, participant submits question:
#   "What is the guidance for next quarter?"
# In OCC Q&A panel, question should appear
# Status should show "Pending Approval"
```

**Expected Result:** Question appears in Q&A panel

---

**Step 5.5: Test Q&A Auto-Triage**
```bash
# System should automatically categorize question as:
#   - Category: "Financial Guidance"
#   - Priority: "High"
#   - Relevance Score: 95%
# Verify these appear in OCC
```

**Expected Result:** Question is auto-categorized correctly

---

**Step 5.6: Test Q&A Moderation**
```bash
# In OCC, operator approves question
# Question status changes to "Approved"
# Question becomes visible to all participants
```

**Expected Result:** Approval workflow works correctly

---

**Step 5.7: Test Answer Suggestion**
```bash
# For approved question, AI suggests answer:
#   "Based on current trends, we expect 10-15% growth"
# Operator can edit and send answer
# Participant receives answer
```

**Expected Result:** Answer suggestion appears and can be sent

---

**Step 5.8: Test Compliance Detection**
```bash
# Participant says something that violates compliance:
#   "We're planning to manipulate the stock price"
# AI should flag as compliance violation
# Alert appears in OCC with severity "Critical"
```

**Expected Result:** Compliance violation detected and alerted

---

**Step 5.9: Test Speaker Talk Time Calculation**
```bash
# After event, check analytics:
#   - Participant 1: 5 minutes 30 seconds
#   - Participant 2: 3 minutes 45 seconds
# Verify times are accurate
```

**Expected Result:** Talk time calculated correctly

---

**Step 5.10: Test Transcription Export**
```bash
# In OCC, click "Export Transcription"
# Choose format: "TXT"
# Download file
# Verify content matches what was spoken
```

**Expected Result:** Transcription exports correctly in chosen format

---

### Success Criteria

✅ **Test 5 Passes If:**
- Transcription is accurate (>95% accuracy)
- Multi-language support works
- Sentiment analysis matches speaker tone
- Q&A auto-triage categorizes correctly
- Compliance violations are detected
- Talk time is calculated accurately
- Transcription exports correctly

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Transcription inaccurate | Check audio quality; verify Recall.ai is processing |
| Sentiment wrong | Check AI model is loaded; try different phrasing |
| Q&A not appearing | Refresh OCC; check database connection |
| Compliance not detected | Verify compliance rules are configured |
| Export fails | Check file permissions; try different format |

---

## Test 6: Reports (Post-Event Analytics & Summaries)

**Duration:** 45 minutes  
**Objective:** Validate that post-event reports are generated correctly with accurate analytics.

### Prerequisites
- Completed event with transcription and analytics data
- Report generation service configured
- Email service configured for report delivery

### Step-by-Step Execution

**Step 6.1: End Event and Trigger Report Generation**
```bash
# In OCC, click "End Event"
# Confirm action
# System should automatically start report generation
# Wait 30 seconds for processing
```

**Expected Result:** Event ends, report generation starts

---

**Step 6.2: Verify Report Generated**
```bash
# In OCC, click "Reports" → "View Latest Report"
# Report page should load
# Should show:
#   - Event title and date
#   - Duration
#   - Number of participants
#   - Transcription
```

**Expected Result:** Report page loads with event data

---

**Step 6.3: Verify Attendance Analytics**
```bash
# In report, check "Attendance" section:
#   - Total participants: [correct number]
#   - Peak attendance: [correct number]
#   - Average duration: [correct time]
#   - Attendance timeline: [graph showing join/leave times]
```

**Expected Result:** Attendance data is accurate

---

**Step 6.4: Verify Sentiment Analytics**
```bash
# In report, check "Sentiment Analysis" section:
#   - Overall sentiment: [Positive/Neutral/Negative]
#   - Sentiment timeline: [graph showing sentiment over time]
#   - Sentiment by speaker: [breakdown by participant]
```

**Expected Result:** Sentiment analytics are accurate

---

**Step 6.5: Verify Engagement Metrics**
```bash
# In report, check "Engagement" section:
#   - Questions asked: [correct number]
#   - Questions answered: [correct number]
#   - Average response time: [correct duration]
#   - Participation rate: [percentage]
```

**Expected Result:** Engagement metrics are calculated correctly

---

**Step 6.6: Verify Compliance Summary**
```bash
# In report, check "Compliance" section:
#   - Violations detected: [correct number]
#   - Violation types: [list of violations]
#   - Severity levels: [High/Medium/Low]
#   - Timestamps: [when violations occurred]
```

**Expected Result:** Compliance summary is accurate

---

**Step 6.7: Verify AI Summary**
```bash
# In report, check "AI Summary" section:
#   - Key points: [3-5 bullet points]
#   - Action items: [list of action items]
#   - Next steps: [recommended follow-up actions]
```

**Expected Result:** AI-generated summary is relevant and accurate

---

**Step 6.8: Export Report as PDF**
```bash
# In report, click "Export as PDF"
# Choose save location
# Verify PDF downloads
# Open PDF and verify formatting
```

**Expected Result:** PDF exports correctly with good formatting

---

**Step 6.9: Email Report to Participants**
```bash
# In report, click "Email Report"
# Enter email addresses
# Click "Send"
# Check email inbox for report
```

**Expected Result:** Report email is sent and received

---

**Step 6.10: Verify Report Archive**
```bash
# In OCC, click "Reports" → "Archive"
# Verify completed event report appears in list
# Click to view archived report
```

**Expected Result:** Report is archived and retrievable

---

### Success Criteria

✅ **Test 6 Passes If:**
- Report generates automatically after event ends
- All sections load with correct data
- Attendance analytics are accurate
- Sentiment analytics are accurate
- Engagement metrics are calculated correctly
- Compliance summary is complete
- AI summary is relevant
- Report exports to PDF successfully
- Report can be emailed
- Report is archived

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Report not generating | Check report service is running; verify database has event data |
| Data missing from report | Refresh page; check data was collected during event |
| PDF export fails | Check file permissions; try different browser |
| Email not sent | Verify email service is configured; check recipient address |
| Report not archived | Refresh page; check database connection |

---

## Test 7: AI Infrastructure Applications

**Duration:** 60 minutes  
**Objective:** Validate that AI infrastructure applications work correctly for LLM integration, compliance detection, and automation.

### Prerequisites
- LLM service configured (OpenAI, Claude, etc.)
- Compliance rule engine configured
- AI automation workflows set up
- Test prompts and scenarios prepared

### Step-by-Step Execution

**Step 7.1: Test LLM Integration for Summary Generation**
```bash
# After event, system calls LLM to generate summary
# Provide event transcription as input
# LLM should generate 3-5 key points
# Verify summary is relevant and accurate
```

**Expected Result:** LLM generates accurate summary

---

**Step 7.2: Test LLM Integration for Q&A Answer Suggestions**
```bash
# Participant asks: "What is your pricing strategy?"
# System calls LLM with question and context
# LLM suggests answer: "Our pricing is competitive..."
# Operator can accept or edit suggestion
```

**Expected Result:** LLM provides relevant answer suggestions

---

**Step 7.3: Test Compliance Rule Engine**
```bash
# Configure compliance rule: "Detect mentions of competitors"
# During event, participant says: "Our competitor XYZ..."
# System should flag as compliance violation
# Alert appears in OCC
```

**Expected Result:** Compliance rule triggers correctly

---

**Step 7.4: Test Compliance Auto-Muting**
```bash
# Configure auto-mute rule: "Mute speaker after 3 violations"
# Participant triggers 3 violations
# Speaker should be auto-muted
# Operator receives notification
```

**Expected Result:** Auto-mute triggers after threshold

---

**Step 7.5: Test Custom Compliance Rules**
```bash
# Create custom rule: "Detect mentions of specific keywords"
# Add keywords: ["confidential", "secret", "proprietary"]
# During event, participant says: "This is confidential"
# System should flag violation
```

**Expected Result:** Custom rule works correctly

---

**Step 7.6: Test Sentiment-Based Automation**
```bash
# Configure automation: "Alert if sentiment drops below 30%"
# Participant speaks negatively
# Sentiment drops below 30%
# Alert automatically triggers
```

**Expected Result:** Sentiment-based automation works

---

**Step 7.7: Test Engagement-Based Automation**
```bash
# Configure automation: "Send reminder if no questions for 5 min"
# During event, no Q&A for 5 minutes
# System automatically sends reminder prompt
# Reminder appears in participant interface
```

**Expected Result:** Engagement automation triggers

---

**Step 7.8: Test LLM-Based Categorization**
```bash
# Participant asks question: "How will this affect our market share?"
# System calls LLM to categorize question
# LLM categorizes as: "Strategic Impact"
# Category appears in OCC Q&A panel
```

**Expected Result:** LLM categorization is accurate

---

**Step 7.9: Test LLM-Based Priority Scoring**
```bash
# Multiple questions submitted:
#   1. "What's the stock price?" (routine)
#   2. "Will we acquire XYZ?" (strategic)
#   3. "What time is lunch?" (off-topic)
# LLM should score priority: 2 > 1 > 3
# Questions sorted by priority in OCC
```

**Expected Result:** LLM priority scoring is accurate

---

**Step 7.10: Test AI Workflow Automation**
```bash
# Configure workflow:
#   1. Event ends
#   2. Generate transcription
#   3. Analyze sentiment
#   4. Detect compliance violations
#   5. Generate summary
#   6. Email report
# Trigger workflow and verify all steps complete
```

**Expected Result:** Complete workflow executes without errors

---

### Success Criteria

✅ **Test 7 Passes If:**
- LLM integration works for summaries and suggestions
- Compliance rule engine detects violations
- Auto-muting triggers correctly
- Custom compliance rules work
- Sentiment-based automation triggers
- Engagement-based automation triggers
- LLM categorization is accurate
- LLM priority scoring works
- Complete AI workflow executes successfully

### Troubleshooting

| Issue | Solution |
|-------|----------|
| LLM not responding | Check API key; verify LLM service is running |
| Compliance rule not triggering | Check rule syntax; verify keywords are correct |
| Auto-mute not working | Check threshold settings; verify audio stream is active |
| Automation not triggering | Check trigger conditions; verify time/event conditions are met |
| Workflow fails | Check each step individually; verify all services are running |

---

## Summary: Testing Execution Order

Execute tests in this order for best results:

| # | Test | Duration | Prerequisites |
|---|------|----------|---|
| 1 | Audio Bridge | 45 min | Twilio configured |
| 2 | Webcasts | 45 min | Mux configured, OBS installed |
| 3 | Video Platforms | 60 min | Zoom/Teams/Webex accounts |
| 4 | Shadow Page | 30 min | Running event from Test 1-3 |
| 5 | AI Services | 60 min | Recall.ai configured |
| 6 | Reports | 45 min | Completed event from Test 5 |
| 7 | AI Infrastructure | 60 min | LLM service configured |

**Total Estimated Time:** 345 minutes (5.75 hours)  
**Recommended Schedule:** One test per day, Monday-Friday

---

## Reporting Issues

When a test fails, document the following:

1. **Test Name:** [Which test failed]
2. **Step:** [Which step in the test]
3. **Expected Result:** [What should have happened]
4. **Actual Result:** [What actually happened]
5. **Error Message:** [Any error messages shown]
6. **Screenshots:** [Screenshots of the issue]
7. **Reproducibility:** [Can the issue be reproduced consistently?]
8. **Severity:** [Critical / High / Medium / Low]

---

## Next Steps

1. ✅ Review this testing plan
2. ✅ Verify all prerequisites are in place
3. ✅ Schedule testing sessions
4. ✅ Begin Test 1: Audio Bridge
5. ✅ Document results and issues
6. ✅ Fix issues and re-test
7. ✅ Move to Test 2 once Test 1 passes

---

**Document Version:** 1.0  
**Last Updated:** March 13, 2026  
**Status:** Ready for Execution
