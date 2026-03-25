# CuraLive Operational Testing Guide

## Complete End-to-End Workflow Testing

This guide walks you through real operational scenarios: booking an event, managing registrations, running a live event, and delivering post-event services to customers.

---

## Workflow 1: Audio Conference Call

### Phase 1: Book the Event

**Step 1.1: Create Event in Booking System**
- Navigate to the Bookings module
- Click "Create New Event"
- Fill in event details:
  - **Event Name:** "Q4 2026 Earnings Call - Test"
  - **Event Type:** Audio Conference
  - **Date & Time:** Tomorrow at 2:00 PM (1 hour duration)
  - **Expected Participants:** 50
  - **Services:** Transcription, Sentiment Analysis, Q&A Moderation
- Click "Save Event"
- **Expected Result:** Event appears in calendar view with status "Scheduled"

**Step 1.2: Configure Audio Bridge**
- In event settings, select "Audio Bridge" option
- Choose platform: "Twilio + Telnyx (Redundancy)"
- Set dial-in number (auto-generated or custom)
- Set event PIN (auto-generated)
- Enable recording: Yes
- Click "Save Configuration"
- **Expected Result:** Dial-in number and PIN are displayed and can be shared

**Step 1.3: Generate Event Link & Materials**
- Click "Generate Participant Materials"
- System generates:
  - Calendar invite (.ics file)
  - Email template with dial-in details
  - QR code for easy access
- Download or copy materials
- **Expected Result:** All materials are ready for distribution

---

### Phase 2: Manage Registrations

**Step 2.1: Add Participants to Registration List**
- Go to "Registrations" tab in the event
- Click "Add Participants"
- Option A: Upload CSV with participant emails
  - Format: `email, first_name, last_name, company, role`
  - Example: `john@acme.com, John, Smith, ACME Inc, Analyst`
- Option B: Manually add participants
  - Enter email, name, company, role
- Click "Import" or "Add"
- **Expected Result:** Participants appear in registration list with status "Invited"

**Step 2.2: Send Invitations**
- Select all participants (or filter by status)
- Click "Send Invitations"
- System sends email with:
  - Event details
  - Dial-in number and PIN
  - Calendar invite
  - Registration link
- **Expected Result:** Email delivery status shows "Sent" for each participant

**Step 2.3: Monitor Registration Status**
- Check "Registrations" dashboard
- View columns: Name, Email, Company, Status (Invited/Registered/Attended)
- Filter by status to see:
  - **Invited:** Sent email but haven't registered
  - **Registered:** Clicked registration link and confirmed
  - **Attended:** Joined the call
- **Expected Result:** Registration statuses update as participants respond

**Step 2.4: Export Registration Report**
- Click "Export Registrations"
- Choose format: CSV or Excel
- Select fields to include: Name, Email, Company, Role, Status, Registration Date, Registration Source
- Click "Download"
- **Expected Result:** File downloads with all participant data

---

### Phase 3: Upload to OCC & Run Live Event

**Step 3.1: Load Event into OCC**
- Navigate to OCC (Operator Console)
- Click "Load Event"
- Select the event you just created: "Q4 2026 Earnings Call - Test"
- System loads:
  - Participant list (from registrations)
  - Event configuration (dial-in number, PIN, recording settings)
  - Transcription settings
  - Sentiment analysis rules
  - Q&A moderation settings
- Click "Load Event"
- **Expected Result:** Event is fully loaded in OCC with all settings applied

**Step 3.2: Pre-Event Verification**
- Verify dial-in number is correct
- Verify PIN is set
- Verify recording is enabled
- Check transcription service status: "Ready"
- Check sentiment analysis: "Ready"
- Check Q&A moderation: "Ready"
- **Expected Result:** All systems show "Ready" status

**Step 3.3: Start Event**
- Click "Start Event" button
- System transitions to "LIVE" status
- Dial-in bridge becomes active
- Recording starts automatically
- Transcription service begins listening
- **Expected Result:** Event status shows "LIVE" with red indicator

**Step 3.4: Participants Call In**
- Have test participants call the dial-in number
- Participants enter PIN when prompted
- Participants appear in OCC participant list as they join
- **Expected Result:** Participant count increases as each person joins

**Step 3.5: Monitor Live Transcription**
- As participants speak, transcription appears in real-time in OCC
- Verify transcription accuracy and latency (<2 seconds)
- Check speaker identification (name appears with transcript)
- **Expected Result:** Live transcription updates continuously

**Step 3.6: Monitor Sentiment Analysis**
- Watch sentiment scores update for each speaker
- Sentiment indicators show: Positive (green), Neutral (gray), Negative (red)
- Verify sentiment matches actual tone of speech
- **Expected Result:** Sentiment scores appear for each speaker segment

**Step 3.7: Test Q&A Moderation**
- Have participants submit questions via:
  - Web interface (if available)
  - Audio (spoken questions captured in transcription)
  - SMS (if enabled)
- Questions appear in OCC Q&A panel
- Operator approves/rejects questions
- Approved questions are visible to all participants
- **Expected Result:** Q&A workflow functions correctly

**Step 3.8: End Event**
- After test call completes, click "End Event"
- System stops recording
- Transcription service completes
- Event status changes to "Completed"
- **Expected Result:** Event transitions to completed state

---

### Phase 4: Post-Event Services & Delivery

**Step 4.1: Access Post-Event Dashboard**
- Click "Post-Event" or "Reports" section
- System displays:
  - Event summary (date, duration, participants, etc.)
  - Transcription (full text)
  - Sentiment analysis summary
  - Q&A summary
  - Recording status
- **Expected Result:** All post-event data is available

**Step 4.2: AI-Generated Summary**
- Click "Generate AI Summary"
- System processes transcription through LLM
- AI generates:
  - Executive summary (key points, decisions, action items)
  - Topic extraction (main topics discussed)
  - Sentiment trends (overall sentiment throughout event)
  - Key quotes (important statements)
- **Expected Result:** AI summary appears within 30-60 seconds

**Step 4.3: Download Transcription**
- Click "Download Transcript"
- Choose format:
  - **TXT:** Plain text format
  - **PDF:** Formatted document with speaker names and timestamps
  - **VTT:** Video Text Track (for video players)
  - **SRT:** SubRip subtitle format
  - **JSON:** Structured data with metadata
- Click "Download"
- **Expected Result:** File downloads in selected format

**Step 4.4: Download Recording**
- Click "Download Recording"
- Choose format:
  - **MP4:** Video file (if video was captured)
  - **WAV:** Uncompressed audio
  - **MP3:** Compressed audio
  - **M4A:** Apple audio format
- Choose quality (if applicable):
  - High (full quality, larger file)
  - Medium (standard quality)
  - Low (compressed, smaller file)
- Click "Download"
- **Expected Result:** Recording file downloads in selected format

**Step 4.5: Generate Compliance Report**
- Click "Generate Compliance Report"
- System scans transcript for:
  - Regulatory language (SEC, GDPR, etc.)
  - Prohibited statements
  - Risk indicators
  - Flagged segments
- Report shows:
  - Compliance score (0-100%)
  - Flagged items with timestamps
  - Recommended actions
- **Expected Result:** Compliance report is generated with flagged items

**Step 4.6: Generate Analytics Report**
- Click "Generate Analytics Report"
- Report includes:
  - **Participation:** Total attendees, join/leave times, duration
  - **Engagement:** Speaking time per participant, interruptions, sentiment
  - **Topics:** Main topics discussed, topic duration, sentiment per topic
  - **Q&A:** Total questions, approval rate, response time
  - **Sentiment:** Overall sentiment, sentiment by speaker, sentiment trends
- Export options: PDF, Excel, PowerPoint
- **Expected Result:** Comprehensive analytics report is generated

**Step 4.7: Configure Automatic Delivery**
- Click "Configure Delivery"
- Set automatic delivery rules:
  - **Auto-send transcription:** Yes/No (to whom: participants, organizer, custom list)
  - **Auto-send recording:** Yes/No (format: MP3 or MP4)
  - **Auto-send summary:** Yes/No (AI summary or manual)
  - **Auto-send compliance report:** Yes/No
  - **Auto-send analytics:** Yes/No
  - **Delivery timing:** Immediate, 1 hour, next day, custom
  - **Delivery method:** Email, portal, both
- Click "Save Configuration"
- **Expected Result:** Delivery rules are saved

**Step 4.8: Manual Delivery to Customer**
- Click "Send to Customer"
- Select what to send:
  - ☑ Transcription
  - ☑ Recording
  - ☑ AI Summary
  - ☑ Compliance Report
  - ☑ Analytics Report
- Select recipient(s):
  - Event organizer
  - All participants
  - Custom email list
- Add custom message (optional)
- Click "Send"
- **Expected Result:** Email is sent with selected attachments

**Step 4.9: Verify Delivery**
- Check email inbox for delivery
- Verify all attachments are present
- Open each file to verify content:
  - Transcription: Contains full text with speaker names
  - Recording: Plays correctly in media player
  - AI Summary: Contains key points and action items
  - Compliance Report: Shows flagged items with timestamps
  - Analytics: Shows participation and engagement metrics
- **Expected Result:** All files are correct and accessible

---

## Workflow 2: Video Conference (Zoom/Teams/Webex)

### Phase 1: Book the Event
- Follow same steps as Audio Workflow (Step 1.1-1.3)
- In Step 1.2, select "Video Conference" instead of "Audio Bridge"
- Choose platform: Zoom, Microsoft Teams, or Webex
- Configure video settings:
  - Recording: Yes
  - Screen sharing: Yes
  - Video quality: HD or 4K
- **Expected Result:** Video conference event is booked

### Phase 2: Manage Registrations
- Follow same steps as Audio Workflow (Step 2.1-2.4)
- Participants receive meeting link instead of dial-in number
- **Expected Result:** Participants are registered and invited

### Phase 3: Upload to OCC & Run Live Event
- Follow same steps as Audio Workflow (Step 3.1-3.8)
- In Step 3.4, participants join via Zoom/Teams/Webex meeting link
- In Step 3.5, transcription captures video audio
- In Step 3.7, Q&A can include chat messages from video platform
- **Expected Result:** Video event runs successfully

### Phase 4: Post-Event Services & Delivery
- Follow same steps as Audio Workflow (Step 4.1-4.9)
- In Step 4.4, recording includes video (MP4 format)
- Video can be edited to remove sensitive portions before delivery
- **Expected Result:** Video recording is delivered to customer

---

## Workflow 3: Webcast (Live Streaming)

### Phase 1: Book the Event
- Follow same steps as Audio Workflow (Step 1.1-1.3)
- In Step 1.2, select "Webcast" option
- Configure streaming settings:
  - Platform: Mux, YouTube Live, or custom RTMP
  - Resolution: 720p or 1080p
  - Bitrate: Auto or custom
  - Recording: Yes
  - Public or private stream
- Generate streaming key and RTMP URL
- **Expected Result:** Webcast event is booked with streaming configured

### Phase 2: Manage Registrations
- Follow same steps as Audio Workflow (Step 2.1-2.4)
- Participants receive webcast link (not dial-in number)
- Participants can register to receive reminder before stream starts
- **Expected Result:** Participants are registered and invited

### Phase 3: Upload to OCC & Run Live Event
- Follow same steps as Audio Workflow (Step 3.1-3.8)
- In Step 3.2, verify streaming service is ready
- In Step 3.3, start event and streaming begins simultaneously
- In Step 3.4, participants join via webcast link (no dial-in)
- In Step 3.5, transcription captures audio from stream
- **Expected Result:** Webcast streams to public audience

### Phase 4: Post-Event Services & Delivery
- Follow same steps as Audio Workflow (Step 4.1-4.9)
- In Step 4.4, recording is available as MP4 (high quality)
- Webcast recording can be made available on-demand
- Participants can access recording via portal or email link
- **Expected Result:** Webcast recording is delivered and accessible

---

## Summary: What Gets Delivered to Customer

| Deliverable | Audio | Video | Webcast | Format | Auto-Send | Manual |
|---|---|---|---|---|---|---|
| Transcription | ✓ | ✓ | ✓ | TXT, PDF, VTT, SRT, JSON | Yes | Yes |
| Recording | ✓ | ✓ | ✓ | MP3, MP4, WAV, M4A | Yes | Yes |
| AI Summary | ✓ | ✓ | ✓ | PDF, Text | Yes | Yes |
| Compliance Report | ✓ | ✓ | ✓ | PDF, Excel | Optional | Yes |
| Analytics Report | ✓ | ✓ | ✓ | PDF, Excel, PPT | Optional | Yes |
| Participant List | ✓ | ✓ | ✓ | CSV, Excel | Optional | Yes |
| Q&A Summary | ✓ | ✓ | ✓ | PDF, Text | Optional | Yes |

---

## Key Success Criteria

### Booking Phase
- ✓ Event created with all required details
- ✓ Dial-in/meeting link generated correctly
- ✓ Event appears in calendar view

### Registration Phase
- ✓ Participants can be imported via CSV or added manually
- ✓ Invitations are sent successfully
- ✓ Registration statuses update correctly
- ✓ Reports can be exported

### Live Event Phase
- ✓ Event loads into OCC without errors
- ✓ All participants can join (audio/video/webcast)
- ✓ Transcription works in real-time (<2s latency)
- ✓ Sentiment analysis scores are accurate
- ✓ Q&A moderation functions correctly
- ✓ Recording captures all audio/video

### Post-Event Phase
- ✓ AI summary is generated within 60 seconds
- ✓ Transcription can be downloaded in all formats
- ✓ Recording can be downloaded in all formats
- ✓ Compliance report identifies flagged items
- ✓ Analytics report shows accurate metrics
- ✓ Automatic delivery sends correct files
- ✓ Manual delivery allows custom selection

---

## Troubleshooting

### Issue: Participants can't join
- **Audio:** Verify dial-in number and PIN are correct
- **Video:** Verify meeting link is working
- **Webcast:** Verify streaming URL is accessible

### Issue: No transcription appearing
- Check transcription service status in OCC
- Verify audio is being captured
- Check microphone levels

### Issue: Recording not available
- Verify recording was enabled before event started
- Check storage space is available
- Wait 5-10 minutes for recording to be processed

### Issue: AI summary not generating
- Verify transcription is complete
- Check LLM service status
- Try generating again after 2 minutes

---

## Next Steps

1. **Run Workflow 1 (Audio):** Complete full audio conference test
2. **Run Workflow 2 (Video):** Complete full video conference test
3. **Run Workflow 3 (Webcast):** Complete full webcast test
4. **Document Issues:** Note any problems encountered
5. **Optimize Delivery:** Adjust auto-send rules based on customer preferences
6. **Train Team:** Share workflows with operations team
