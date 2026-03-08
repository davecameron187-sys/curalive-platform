# Chorus.AI Operator Training Guide

## Overview

Chorus.AI is a live event intelligence platform that provides real-time transcription, AI-powered content moderation, sentiment analysis, and comprehensive event management tools. This guide covers all operator console features and best practices.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Event Brief Generator](#event-brief-generator)
3. [Q&A Auto-Triage](#qa-auto-triage)
4. [Toxicity Filter Dashboard](#toxicity-filter-dashboard)
5. [Transcript Editing & Correction](#transcript-editing--correction)
6. [Redaction Workflow](#redaction-workflow)
7. [Compliance Dashboard](#compliance-dashboard)
8. [Real-Time Collaboration](#real-time-collaboration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Operator Console

1. Navigate to `https://chorusai-mdu4k2ib.manus.space/operator/:eventId`
2. Log in with your Manus account credentials
3. Select your event from the dashboard

### Key Navigation

- **Event Brief Generator**: `/operator/brief-generator`
- **Moderator Q&A Console**: `/moderator/qa-console`
- **Toxicity Filter**: `/moderator/toxicity-filter`
- **Transcript Editor**: `/operator/transcript-editor`
- **Redaction Workflow**: `/operator/redaction`
- **Compliance Dashboard**: `/compliance`

---

## Event Brief Generator

### Purpose

Convert press releases into structured event briefs with talking points, financial highlights, and anticipated Q&A.

### How to Use

1. **Navigate to Event Brief Generator**
   - Go to `/operator/brief-generator`
   - Select your conference from the dropdown

2. **Input Press Release**
   - Paste the full press release text in the textarea
   - Add event title (optional)
   - Character count updates in real-time

3. **Generate Brief**
   - Click "Generate Brief" button
   - Wait for LLM processing (5-20 seconds)
   - Brief appears in tabs below

4. **Review Generated Content**
   - **Key Messages**: Main talking points with emphasis badges
   - **Financial Highlights**: Revenue, margins, guidance
   - **Talking Points**: Speaker notes with context
   - **Anticipated Q&A**: Expected questions with difficulty levels

5. **Approve & Save**
   - Add notes in "Approval Notes" field
   - Click "Approve Brief" to save
   - Brief becomes available in history tab

### Tips

- Keep press releases between 500-2000 words for best results
- Include financial data for better highlight extraction
- Review talking points before event starts
- Use "Copy to Clipboard" for speaker notes

---

## Q&A Auto-Triage

### Purpose

Automatically classify Q&A questions to help moderators prioritize and filter content.

### Classifications

| Classification | Meaning | Action |
|---|---|---|
| **Approved** | High-quality, relevant question | Show in queue |
| **Duplicate** | Similar to previous questions | Flag for review |
| **Off-Topic** | Not related to event | Hide from queue |
| **Spam** | Promotional or irrelevant | Block |
| **Unclear** | Ambiguous or incomplete | Request clarification |
| **Sensitive** | Contains price/confidential info | Flag for moderator |

### How to Use

1. **Access Q&A Console**
   - Go to `/moderator/qa-console`
   - Select event and time range

2. **Review Pending Questions**
   - View triage results with confidence scores
   - See classification reason
   - Check for sensitivity flags

3. **Take Action**
   - **Approve**: Move to speaker queue
   - **Reject**: Remove from queue
   - **Flag**: Mark for manual review
   - **Edit**: Modify question text before approval

4. **Monitor Statistics**
   - Approval rate (target: >85%)
   - Processing time
   - Question distribution by category

### Sensitivity Flags

- **Price-Sensitive**: Contains financial projections or pricing
- **Confidential**: References non-public information
- **Legal-Risk**: Potential legal or compliance issues

---

## Toxicity Filter Dashboard

### Purpose

Flag abusive, harassing, or inappropriate content before it reaches the speaker.

### Risk Levels

| Risk Level | Description | Action |
|---|---|---|
| **High** | Abusive, harassing, explicit | Block immediately |
| **Medium** | Potentially offensive, borderline | Review before approval |
| **Low** | Mildly critical but acceptable | Approve with caution |

### How to Use

1. **Access Toxicity Filter**
   - Go to `/moderator/toxicity-filter`
   - View flagged content by risk level

2. **Review Flagged Content**
   - Read original text
   - Check toxicity score (0-100)
   - See recommended action

3. **Take Action**
   - **Approve**: Accept question as-is
   - **Review**: Send to manual review queue
   - **Flag**: Mark for compliance team
   - **Block**: Reject permanently
   - **Redact**: Mask sensitive parts

4. **Export Report**
   - Generate daily toxicity report
   - Track trends over time
   - Share with compliance team

### Toxicity Categories

- **Abusive**: Insults, name-calling, threats
- **Harassing**: Targeted attacks, bullying
- **Price-Sensitive**: Unauthorized financial info
- **Confidential**: Non-public company data
- **Spam**: Promotional or off-topic content

---

## Transcript Editing & Correction

### Purpose

Correct transcription errors, manage versions, and maintain audit trail for compliance.

### How to Use

1. **Access Transcript Editor**
   - Go to `/operator/transcript-editor`
   - Select event and time range

2. **Review Transcript**
   - View full transcript with speaker names
   - Identify errors (speech-to-text mistakes)
   - Check timestamps

3. **Create Edits**
   - Select text to correct
   - Click "Edit" button
   - Enter corrected text
   - Add reason (typo, unclear audio, etc.)

4. **Approve Changes**
   - Review pending edits in "Pending Edits" tab
   - Compare original vs corrected
   - Click "Accept" or "Reject"
   - Add approval notes

5. **Manage Versions**
   - Create version snapshots
   - View version history
   - Revert to previous versions
   - Export specific versions

6. **Export Transcript**
   - Choose format: TXT, MD, JSON
   - Include/exclude edits
   - Add metadata (event, date, approver)

### Edit Categories

- **Typo**: Spelling or grammar errors
- **Unclear**: Misheard words
- **Speaker**: Wrong speaker attribution
- **Timestamp**: Incorrect timing
- **Context**: Missing context or clarification

### Audit Trail

All edits are logged with:
- Editor name and timestamp
- Original and corrected text
- Edit reason
- Approval status
- Approver name

---

## Redaction Workflow

### Purpose

Identify and mask sensitive content (financial data, personal info, confidential details) before transcript release.

### Redaction Types

| Type | Examples | Action |
|---|---|---|
| **Financial** | Revenue, margins, guidance | Replace with [FINANCIAL] |
| **Personal** | Names, emails, phone numbers | Replace with [PERSONAL] |
| **Confidential** | Non-public strategies, deals | Replace with [CONFIDENTIAL] |
| **Legal** | Legal disputes, litigation | Replace with [LEGAL] |
| **Medical** | Health information | Replace with [MEDICAL] |

### How to Use

1. **Access Redaction Workflow**
   - Go to `/operator/redaction`
   - Select event and transcript

2. **Detect Sensitive Content**
   - Click "Detect Sensitive Content"
   - Review LLM detection results
   - Confidence score for each item

3. **Preview Redactions**
   - View original text
   - See proposed redaction
   - Adjust if needed

4. **Batch Redact**
   - Select multiple items
   - Choose redaction type
   - Click "Batch Redact"
   - Review results

5. **Approve Redactions**
   - Review redacted text
   - Verify completeness
   - Add compliance notes
   - Click "Approve All"

6. **Export Redacted Transcript**
   - Choose format
   - Include redaction summary
   - Add compliance certification
   - Generate audit report

### Best Practices

- Always review LLM suggestions manually
- Err on side of caution for sensitive content
- Document redaction reasons
- Keep original for legal compliance
- Export audit trail for records

---

## Compliance Dashboard

### Purpose

Monitor redaction statistics, approval rates, and compliance metrics in real-time.

### Key Metrics

| Metric | Target | Meaning |
|---|---|---|
| **Approval Rate** | >85% | % of redactions approved |
| **Pending Reviews** | <10 | Redactions awaiting approval |
| **Avg Review Time** | <4 hours | Average time to approve |
| **Rejection Rate** | <15% | % of redactions rejected |

### Dashboard Tabs

1. **Trends**
   - Redactions over time (7-day view)
   - Identify patterns
   - Spot anomalies

2. **By Type**
   - Breakdown by redaction type
   - Financial vs personal vs confidential
   - Identify high-risk content

3. **Top Operators**
   - Operator performance ranking
   - Redactions per operator
   - Approval rates by operator

4. **Risk Distribution**
   - High/Medium/Low risk breakdown
   - Visual pie chart
   - Compliance status

### Compliance Alerts

- **Pending Threshold**: Alert if >5 pending redactions
- **Approval Rate**: Alert if <85% approval rate
- **Rejection Spike**: Alert if rejections increase
- **SLA Violation**: Alert if review time exceeds 4 hours

### Export Reports

- Generate compliance report
- Include all metrics and charts
- Add date range and filters
- Export as JSON or PDF
- Share with compliance team

---

## Real-Time Collaboration

### Purpose

Enable multiple operators to edit transcripts simultaneously with conflict detection and merge strategies.

### Features

1. **Active Collaborators**
   - See who's currently editing
   - View cursor positions
   - Real-time presence updates

2. **Conflict Detection**
   - Automatic detection of overlapping edits
   - Merge strategy options:
     - **First Write Wins**: Accept first edit
     - **Last Write Wins**: Accept latest edit
     - **Manual**: Operator chooses

3. **Event Broadcast**
   - All operators see edits in real-time
   - Notifications for approvals/rejections
   - Version publish notifications

4. **Collaboration Statistics**
   - Total events recorded
   - Active collaborators count
   - Edit frequency
   - Conflict resolution rate

### Best Practices

- Communicate via chat before editing same section
- Use descriptive edit reasons
- Publish versions frequently
- Review conflict resolutions carefully
- Export history for audit trail

---

## Best Practices

### Event Management

1. **Pre-Event Preparation**
   - Generate event brief from press release
   - Review talking points
   - Set up Q&A filters
   - Configure redaction rules

2. **During Event**
   - Monitor Q&A queue in real-time
   - Flag toxicity issues immediately
   - Correct transcription errors as they occur
   - Track sentiment trends

3. **Post-Event**
   - Complete transcript review
   - Apply redactions
   - Generate compliance report
   - Archive for records

### Quality Standards

- **Transcript Accuracy**: >95% accuracy target
- **Q&A Response Time**: <2 minutes average
- **Redaction Completeness**: 100% of sensitive content
- **Compliance Coverage**: All flagged items reviewed

### Operator Efficiency

- Use keyboard shortcuts for common actions
- Batch process similar items
- Collaborate with team members
- Use templates for recurring events
- Export reports regularly

---

## Troubleshooting

### Common Issues

#### Q&A Questions Not Appearing

**Problem**: Questions submitted but not showing in queue

**Solution**:
1. Check toxicity filter settings
2. Verify Q&A is enabled for event
3. Refresh browser
4. Check for network errors in console

#### Transcript Sync Issues

**Problem**: Edits not syncing across operators

**Solution**:
1. Verify Ably connection is active
2. Check for conflict detection alerts
3. Resolve conflicts manually
4. Refresh page if needed

#### Redaction Detection Errors

**Problem**: LLM misses sensitive content

**Solution**:
1. Manually add to redaction list
2. Review LLM confidence scores
3. Adjust detection sensitivity
4. Document for training data

### Performance Tips

- Close unused browser tabs
- Clear browser cache regularly
- Use Chrome or Firefox for best performance
- Disable browser extensions
- Check internet connection speed

### Getting Help

- **Technical Support**: support@chorusai.com
- **Training**: training@chorusai.com
- **Compliance**: compliance@chorusai.com
- **Urgent Issues**: emergency@chorusai.com

---

## Advanced Features

### Custom Redaction Rules

1. Go to Settings → Redaction Rules
2. Add custom patterns (regex)
3. Set redaction type
4. Test on sample text
5. Save and apply to events

### Scheduled Reports

1. Go to Compliance → Scheduled Reports
2. Set frequency (daily, weekly, monthly)
3. Choose metrics to include
4. Set recipients
5. Save schedule

### API Integration

For developers integrating with Chorus.AI:

- **Q&A API**: `/api/trpc/aiFeatures.getEventQATriageResults`
- **Toxicity API**: `/api/trpc/aiFeatures.getEventToxicityResults`
- **Transcript API**: `/api/trpc/transcriptEditor.getTranscript`
- **Redaction API**: `/api/trpc/redaction.detectSensitiveContent`

---

## Glossary

| Term | Definition |
|---|---|
| **Triage** | Automatic classification of Q&A questions |
| **Toxicity** | Measure of abusive or inappropriate content |
| **Redaction** | Masking of sensitive information |
| **Compliance** | Adherence to regulatory requirements |
| **Audit Trail** | Record of all actions and changes |
| **Presence** | Real-time indicator of active users |
| **Conflict** | Overlapping edits by multiple operators |
| **SLA** | Service Level Agreement (response time target) |

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-03-08 | Initial release |

---

## Document Information

- **Last Updated**: 2026-03-08
- **Version**: 1.0
- **Author**: Chorus.AI Training Team
- **Status**: Active
- **Next Review**: 2026-06-08

For updates and corrections, contact training@chorusai.com
