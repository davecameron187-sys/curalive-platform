# Phase 2 Operator Training Materials

## Training Overview

**Duration:** 2 hours  
**Format:** Interactive presentation with live demo  
**Audience:** Event operators, compliance officers, IR managers  
**Delivery Date:** March 5, 2026 (per customer)  
**Materials:** Slides, quick reference card, troubleshooting guide

## Training Agenda

### Segment 1: Phase 2 Overview (15 minutes)

**Learning Objectives**
- Understand what Phase 2 Auto-Muting is and why it matters
- Learn how violations are detected in real-time
- Understand the graduated muting system (soft vs hard mute)
- Recognize the compliance benefits

**Key Topics**

**What is Phase 2 Auto-Muting?**

Phase 2 introduces AI-powered, real-time compliance monitoring that automatically detects regulatory violations in speaker audio and applies graduated muting to protect your events. The system uses GPT-4 to analyze every speaker's words in real-time, detecting 8 violation types with confidence scoring and severity levels.

**Why Does It Matter?**

Compliance violations during investor events, earnings calls, and board briefings can result in SEC fines, stock price manipulation charges, and reputational damage. Phase 2 provides the first automated solution to detect and prevent violations before they impact your company.

**How Does It Work?**

The system operates in three stages: (1) Real-time speech capture from Recall.ai bot, (2) GPT-4 analysis for violation detection with severity scoring, (3) Automated muting via Recall.ai API with operator override capability.

**Graduated Muting System**

The system uses configurable thresholds to apply graduated responses: Soft Mute (default threshold: 2 violations) mutes the speaker for 30 seconds then auto-unmutes, allowing recovery. Hard Mute (default threshold: 5 violations) permanently mutes the speaker until an operator manually unmutes them.

**Slide Content**
- Title: "Phase 2 Auto-Muting: Protecting Your Events in Real-Time"
- Subtitle: "AI-Powered Compliance Monitoring for Investor Events"
- Key statistics: "Compliance violations cost companies $X million annually"
- Timeline graphic: "From violation detection to muting in <100ms"
- Problem statement: "Current compliance monitoring is manual, slow, and error-prone"
- Solution statement: "Phase 2 automates compliance monitoring with AI"

### Segment 2: Operator Console Walkthrough (30 minutes)

**Learning Objectives**
- Navigate the new "Muting Control" tab in the operator console
- Understand speaker violations table and statistics dashboard
- Use configuration panel to view current thresholds
- Execute manual muting controls with reason tracking

**Key Topics**

**Muting Control Tab Location**

The new "Muting Control" tab is located in the operator console next to "Chat," "Q&A," and "Polls" tabs. Click the tab to open the muting control panel.

**Speaker Violations Table**

The table displays all speakers with real-time violation data:
- Speaker Name: Full name of the speaker
- Violations: Total violation count (updates in real-time)
- Status: Current muting status (Active, Soft Muted, Hard Muted)
- Soft Mutes: Number of times speaker was soft-muted
- Hard Mutes: Number of times speaker was hard-muted
- Actions: Manual control buttons (Soft Mute, Hard Mute, Unmute)

**Muting Statistics Dashboard**

The dashboard shows real-time metrics:
- Total Speakers: Number of active speakers in the event
- Total Violations: Cumulative violation count
- Soft Muted: Number of speakers currently soft-muted
- Hard Muted: Number of speakers currently hard-muted
- Pending Review: Violations flagged for operator review

**Configuration Panel**

The configuration panel displays current thresholds and settings:
- Soft Mute Threshold: 2 violations (configurable)
- Hard Mute Threshold: 5 violations (configurable)
- Auto-Unmute Duration: 30 seconds (fixed)
- Violation Severity Filter: High/Critical (configurable)

**Manual Controls**

Each speaker row includes action buttons:
- **Soft Mute Button** — Mutes speaker for 30 seconds, then auto-unmutes
- **Hard Mute Button** — Permanently mutes speaker until manually unmuted
- **Unmute Button** — Restores speaker audio immediately
- **Reason Dropdown** — Select reason for manual muting (Auto-muted, Compliance violation, Speaker request, Technical issue, Other)

**Slide Content**
- Screenshot: Muting Control tab in operator console
- Annotated diagram: Speaker violations table with column descriptions
- Dashboard mockup: Muting statistics with real-time updates
- Configuration panel screenshot: Current thresholds and settings
- Manual controls guide: Button locations and functions
- Live demo: Opening the tab and reviewing sample data

### Segment 3: Hands-On Demo (30 minutes)

**Learning Objectives**
- See Phase 2 in action with real violation examples
- Understand soft mute and auto-unmute behavior
- Learn how to apply hard mute and manual override
- Practice handling false positives

**Demo Scenario 1: Soft Mute and Auto-Unmute**

**Setup:** Operator console is open with a live event. A speaker makes a forward-looking statement.

**Action:** GPT-4 detects the violation and increments the violation counter. After 2 violations, the system automatically applies a soft mute.

**Observation:** The speaker is muted in Zoom/Teams/Webex. The operator console shows "Soft Muted" status. After 30 seconds, the speaker is automatically unmuted and can resume speaking.

**Key Learning:** Soft mutes are temporary and automatic, allowing speakers to recover from violations.

**Demo Scenario 2: Hard Mute and Manual Override**

**Setup:** Same event continues. A speaker makes multiple price-sensitive statements.

**Action:** GPT-4 detects 5 violations. The system applies a hard mute and locks the speaker out.

**Observation:** The speaker is muted and cannot unmute themselves. The operator console shows "Hard Muted" status. The operator reviews the violations and determines they are legitimate guidance (false positive).

**Action:** The operator clicks "Unmute" button and selects "False Positive" reason.

**Observation:** The speaker is immediately unmuted and can resume speaking. The system logs the false positive for model improvement.

**Key Learning:** Hard mutes are permanent until operator intervention. Operators can override auto-muting decisions.

**Demo Scenario 3: False Positive Handling**

**Setup:** Event continues. A speaker makes a statement that triggers a violation alert.

**Action:** Operator reviews the violation and determines it's a legitimate statement (not actually a violation).

**Observation:** Operator clicks "Unmute" button and selects "False Positive" reason. System logs the feedback.

**Key Learning:** Operators can correct the system's decisions. False positive feedback improves the model over time.

**Demo Scenario 4: Manual Muting for Non-Compliance Reasons**

**Setup:** Event continues. A speaker has technical audio issues.

**Action:** Operator clicks "Hard Mute" button and selects "Technical Issue" reason.

**Observation:** Speaker is muted. The operator contacts the speaker to fix audio issues. Once fixed, operator clicks "Unmute."

**Key Learning:** Manual muting can be used for reasons beyond compliance violations.

**Live Demo Checklist**
- [ ] Open operator console and navigate to Muting Control tab
- [ ] Show speaker violations table with sample data
- [ ] Highlight muting statistics dashboard
- [ ] Review configuration panel with current thresholds
- [ ] Trigger a test violation and show soft mute
- [ ] Show auto-unmute after 30 seconds
- [ ] Trigger multiple violations and show hard mute
- [ ] Demonstrate manual override with "Unmute" button
- [ ] Show false positive handling with reason selection
- [ ] Answer operator questions

### Segment 4: Troubleshooting & Edge Cases (20 minutes)

**Learning Objectives**
- Recognize common issues and their solutions
- Know when to escalate to technical support
- Understand backup procedures if system fails
- Practice decision-making in edge cases

**Common Issues & Solutions**

**Issue 1: Violations Not Being Detected**

**Symptoms:** Speakers say things that should trigger violations, but nothing is detected. Violation count stays at 0.

**Root Causes:** Recall.ai bot not in call, webhook not connected, LLM not responding, thresholds too high.

**Operator Actions:** (1) Verify Recall.ai bot is active in Zoom/Teams/Webex, (2) Check webhook status in system settings, (3) Contact support if issue persists.

**Issue 2: Speaker Not Being Muted**

**Symptoms:** Violation detected and muting triggered, but speaker audio is still active. Operator console shows "Muted" but speaker is still talking.

**Root Causes:** Recall.ai API error, wrong speaker ID, platform incompatibility, muting permission denied.

**Operator Actions:** (1) Manually mute speaker in Zoom/Teams/Webex, (2) Check Recall.ai bot permissions, (3) Contact support for API error investigation.

**Issue 3: Too Many False Positives**

**Symptoms:** Legitimate statements are being flagged as violations. Operator is manually overriding mutes frequently (>30% of the time). Speakers complain about being muted unfairly.

**Root Causes:** Thresholds too aggressive, LLM too sensitive, industry-specific language not understood, severity filter too low.

**Operator Actions:** (1) Increase soft mute threshold from 2 to 3, (2) Increase hard mute threshold from 5 to 7, (3) Change severity filter to "Critical" only, (4) Provide feedback to support team.

**Issue 4: System Performance Degradation**

**Symptoms:** Operator console is slow or unresponsive. Violation detection latency increases over time. Database queries timing out.

**Root Causes:** High violation volume, memory leak, database connection pool exhausted, Ably rate limiting.

**Operator Actions:** (1) Monitor system health dashboard, (2) Contact support if latency >1 second, (3) Prepare to switch to manual compliance monitoring if needed.

**Edge Case 1: Speaker Intentionally Violating Compliance**

**Scenario:** A speaker repeatedly makes forward-looking statements despite being soft-muted multiple times. After hard mute, speaker continues trying to speak.

**Operator Decision:** Keep speaker hard-muted. Contact event host to discuss speaker removal or replacement. Document incident for compliance review.

**Key Learning:** Operators have authority to keep speakers muted if they repeatedly violate compliance.

**Edge Case 2: Legitimate Business Statement Flagged as Violation**

**Scenario:** A speaker makes a statement that is flagged as "forward-looking" but is actually approved guidance from the compliance team.

**Operator Decision:** Unmute speaker and select "False Positive" reason. Provide context to support team for model improvement.

**Key Learning:** Operators can correct the system. Feedback improves accuracy over time.

**Edge Case 3: System Failure During Event**

**Scenario:** Recall.ai webhook stops receiving payloads. Violations are no longer being detected.

**Operator Decision:** Switch to manual compliance monitoring. Have compliance officer monitor speaker audio in real-time and signal operator to mute if needed.

**Key Learning:** Always have a backup plan if the system fails.

**Slide Content**
- Troubleshooting flowchart: Decision tree for common issues
- Issue-solution matrix: Common problems and recommended actions
- Edge case scenarios: Real-world situations and operator decisions
- Escalation criteria: When to contact support vs. handle manually
- Backup procedures: Manual compliance monitoring if system fails

### Segment 5: Q&A & Role Play (15 minutes)

**Learning Objectives**
- Answer operator questions about Phase 2
- Practice manual override decisions
- Build confidence in using the system
- Address customer-specific concerns

**Role Play Scenarios**

**Scenario 1: Operator Receives Soft Mute Alert**

**Setup:** Operator is monitoring the event. A speaker is soft-muted after 2 violations.

**Operator Question:** "Should I manually unmute the speaker or wait for the 30-second auto-unmute?"

**Answer:** "Let the auto-unmute happen. Soft mutes are designed to give speakers a chance to recover. Only manually unmute if the speaker asks or if there's a technical issue."

**Scenario 2: Operator Sees False Positive**

**Setup:** A speaker makes a statement that is flagged as a violation, but the operator knows it's legitimate.

**Operator Question:** "How do I correct the system's decision?"

**Answer:** "Click the 'Unmute' button and select 'False Positive' as the reason. This tells the system that it made a mistake, and it will improve over time."

**Scenario 3: Operator Needs to Manually Mute**

**Setup:** A speaker has a technical audio issue and is creating feedback.

**Operator Question:** "Can I manually mute a speaker for reasons other than compliance violations?"

**Answer:** "Yes, absolutely. Click the 'Hard Mute' button and select 'Technical Issue' as the reason. You can manually mute for any reason."

**Scenario 4: Operator Encounters System Error**

**Setup:** The operator console is not updating in real-time. Violations are not being detected.

**Operator Question:** "What should I do if the system stops working?"

**Answer:** "First, check the system health dashboard to see if there are any alerts. If the system is down, switch to manual compliance monitoring. Have your compliance officer monitor speaker audio and signal you to mute if needed. Contact support immediately."

**Q&A Session**
- [ ] Allow 10-15 minutes for operator questions
- [ ] Address customer-specific concerns
- [ ] Discuss threshold adjustments for their industry
- [ ] Clarify operator responsibilities and authority
- [ ] Confirm understanding of manual override procedures

## Training Materials Checklist

**Presentation Slides**
- [ ] Title slide: "Phase 2 Auto-Muting: Protecting Your Events in Real-Time"
- [ ] Agenda slide: Overview of 2-hour training
- [ ] Phase 2 overview slides (5 slides)
- [ ] Operator console walkthrough slides (8 slides)
- [ ] Live demo slides (10 slides)
- [ ] Troubleshooting slides (6 slides)
- [ ] Q&A slide: "Questions?"
- [ ] Closing slide: "Thank You & Next Steps"

**Quick Reference Card (Laminated)**
- Front side: Muting Control tab location, speaker violations table, statistics dashboard
- Back side: Manual controls, troubleshooting flowchart, support contact information
- Size: 5" x 8" (fits in pocket)
- Distribution: One per operator

**Troubleshooting Flowchart**
- Decision tree format: "Is the system detecting violations?" → Yes/No branches
- Common issues and solutions
- Escalation criteria and support contact information
- Printable format for operator desk reference

**Video Recording**
- [ ] Record entire training session for future reference
- [ ] Publish to internal knowledge base
- [ ] Make available to new operators joining after beta

**Support Contact Information Card**
- Chorus.AI support email: support@choruscall.ai
- Support phone: +1-555-CHORUS-1
- Escalation email: escalation@choruscall.ai
- Slack channel: #chorus-ai-support
- Emergency contact: [Name], [phone]

## Post-Training Assessment

**Operator Competency Checklist**

After training, operators should be able to:
- [ ] Navigate to the Muting Control tab
- [ ] Interpret the speaker violations table
- [ ] Understand the muting statistics dashboard
- [ ] Execute manual muting controls
- [ ] Handle false positives correctly
- [ ] Recognize common issues and troubleshoot
- [ ] Know when to escalate to support
- [ ] Understand backup procedures

**Feedback Form (Post-Training)**

```
Phase 2 Operator Training Feedback

Operator: [Name]
Company: [Company]
Date: [Date]

1. Training clarity (1-5 stars): ___
   Comments: _______________

2. Hands-on demo usefulness (1-5 stars): ___
   Comments: _______________

3. Confidence in using Phase 2 (1-5 stars): ___
   Comments: _______________

4. Troubleshooting guidance (1-5 stars): ___
   Comments: _______________

5. Overall training quality (1-5 stars): ___
   Comments: _______________

6. Topics that need more coverage?
   _______________

7. Suggestions for improvement?
   _______________

Thank you for your feedback!
```

## Training Success Metrics

- ✅ **100% attendance** — All operators attend training
- ✅ **>4.0/5 satisfaction** — Average training satisfaction rating
- ✅ **>90% competency** — Operators pass post-training assessment
- ✅ **Zero support escalations** — Operators can handle issues independently
- ✅ **Positive feedback** — Operators feel confident using Phase 2

---

**Document Version:** 1.0  
**Last Updated:** March 10, 2026  
**Next Review:** March 24, 2026
