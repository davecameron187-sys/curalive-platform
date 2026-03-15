# Phase 2 Pilot Customer Onboarding Checklist

## Overview

This document outlines the onboarding process for the 5 pilot customers selected for Chorus.AI Phase 2 Auto-Muting beta testing. The onboarding spans 2 weeks and includes training, configuration, testing, and go-live support.

## Pilot Customer Roster

| # | Company | Industry | Contact | Email | Phone |
|---|---------|----------|---------|-------|-------|
| 1 | [Company A] | Financial Services | [Name] | [email] | [phone] |
| 2 | [Company B] | Healthcare | [Name] | [email] | [phone] |
| 3 | [Company C] | Technology | [Name] | [email] | [phone] |
| 4 | [Company D] | Professional Services | [Name] | [email] | [phone] |
| 5 | [Company E] | Corporate Communications | [Name] | [email] | [phone] |

## Week 1: Pre-Launch Preparation

### Day 1: Kickoff Meeting (1 hour)

**Participants**: Customer stakeholder, compliance officer, operator lead, Chorus.AI PM & engineer

**Agenda**
1. Welcome & Phase 2 overview (10 min)
2. Feature walkthrough & demo (20 min)
3. Q&A and expectations setting (15 min)
4. Timeline & support plan (10 min)
5. Next steps & action items (5 min)

**Deliverables**
- [ ] Send Phase 2 Beta Deployment Guide
- [ ] Send Recall.ai Webhook Testing Guide
- [ ] Schedule operator training for Day 3
- [ ] Confirm first event date for go-live

**Action Items**
- [ ] Customer: Review deployment guide
- [ ] Customer: Notify Recall.ai of Phase 2 activation
- [ ] Chorus.AI: Prepare operator training materials
- [ ] Chorus.AI: Configure customer's event in staging

### Day 2: Technical Setup

**Participants**: Customer IT/DevOps, Chorus.AI engineer

**Tasks**
- [ ] Verify Recall.ai bot is active and configured
- [ ] Test webhook connectivity from Recall.ai to Chorus.AI
- [ ] Confirm database credentials and connectivity
- [ ] Set up monitoring and alerting for customer
- [ ] Configure Ably real-time channels for violations
- [ ] Create test event in staging environment

**Deliverables**
- [ ] Webhook connectivity test report
- [ ] Monitoring dashboard access credentials
- [ ] Staging event URL for testing
- [ ] Support contact information

**Action Items**
- [ ] Customer: Provide Recall.ai API credentials
- [ ] Customer: Confirm webhook endpoint is accessible
- [ ] Chorus.AI: Set up customer-specific monitoring
- [ ] Chorus.AI: Create runbook for customer support

### Day 3: Operator Training (2 hours)

**Participants**: Customer operators (2-3), compliance officer, Chorus.AI PM & engineer

**Training Agenda**
1. **Phase 2 Overview** (15 min)
   - What is auto-muting and why it matters
   - How violations are detected
   - Graduated muting system (soft vs hard mute)

2. **Operator Console Walkthrough** (30 min)
   - New "Muting Control" tab location
   - Speaker violations table and statistics
   - Configuration panel and thresholds
   - Manual muting controls and reason tracking

3. **Hands-On Demo** (30 min)
   - Live demo with test violations
   - Showing soft mute and auto-unmute
   - Showing hard mute and manual override
   - Showing false positive handling

4. **Troubleshooting & Edge Cases** (20 min)
   - What to do if violations aren't detected
   - What to do if speaker isn't muted
   - How to manually override auto-muting
   - When to escalate to support

5. **Q&A & Role Play** (15 min)
   - Operators practice manual overrides
   - Compliance officer asks questions
   - Discuss customer-specific scenarios

**Deliverables**
- [ ] Operator Training Slides (PDF)
- [ ] Operator Quick Reference Card (laminated)
- [ ] Troubleshooting Flowchart
- [ ] Contact information for support escalation

**Action Items**
- [ ] Customer: Operators attend training
- [ ] Customer: Provide feedback on training
- [ ] Chorus.AI: Record training session for future reference
- [ ] Chorus.AI: Adjust training based on feedback

### Day 4: Staging Testing

**Participants**: Customer operators, Chorus.AI engineer

**Testing Plan**
- [ ] Test webhook connectivity with sample payloads
- [ ] Test violation detection with 8 violation types
- [ ] Test soft mute and auto-unmute timing
- [ ] Test hard mute and manual override
- [ ] Test operator console updates in real-time
- [ ] Test error handling and recovery
- [ ] Load test with rapid-fire violations
- [ ] Test with actual Recall.ai bot (if available)

**Test Scenarios**
1. **Forward-Looking Statement** — "We expect revenue to grow 50% next quarter"
2. **Price-Sensitive Info** — "Our stock price should double after this deal"
3. **Insider Information** — "We have confidential acquisition details"
4. **Profanity** — Test with explicit language
5. **Harassment** — Test with discriminatory language
6. **Misinformation** — Test with false statements
7. **Abuse** — Test with personal attacks
8. **Policy Breach** — Test with policy violations

**Success Criteria**
- ✅ All 8 violation types detected correctly
- ✅ Soft mute applied after 2 violations
- ✅ Hard mute applied after 5 violations
- ✅ Auto-unmute occurs after 30 seconds
- ✅ Manual override works reliably
- ✅ Operator console updates within 1 second
- ✅ No false positives or missed violations
- ✅ System handles errors gracefully

**Deliverables**
- [ ] Staging test report with results
- [ ] Any issues or bugs identified
- [ ] Recommendations for threshold adjustments
- [ ] Sign-off from customer operators

**Action Items**
- [ ] Customer: Execute test scenarios
- [ ] Customer: Provide feedback on accuracy
- [ ] Chorus.AI: Fix any bugs found during testing
- [ ] Chorus.AI: Adjust thresholds if needed

### Day 5: Configuration & Tuning

**Participants**: Customer compliance officer, Chorus.AI PM

**Configuration Tasks**
- [ ] Set soft mute threshold (default: 2)
- [ ] Set hard mute threshold (default: 5)
- [ ] Set auto-unmute duration (default: 30 seconds)
- [ ] Select violation severity filter (default: High/Critical)
- [ ] Configure notification recipients
- [ ] Set up escalation procedures
- [ ] Document customer-specific policies

**Threshold Tuning**
- Review staging test results
- Adjust thresholds based on customer's risk tolerance
- Document rationale for threshold choices
- Get compliance officer sign-off

**Deliverables**
- [ ] Final configuration document
- [ ] Threshold justification memo
- [ ] Escalation procedures guide
- [ ] Customer-specific compliance policies

**Action Items**
- [ ] Customer: Approve final configuration
- [ ] Customer: Sign off on thresholds
- [ ] Chorus.AI: Apply configuration to production
- [ ] Chorus.AI: Schedule go-live for next week

## Week 2: Go-Live & Support

### Day 8: Pre-Go-Live Checklist (1 day before)

**Participants**: Customer stakeholders, Chorus.AI PM & engineer

**Final Verification**
- [ ] Production environment is ready
- [ ] All configurations are applied
- [ ] Monitoring and alerting are active
- [ ] Support team is on standby
- [ ] Recall.ai bot is active and tested
- [ ] Operators are trained and ready
- [ ] Compliance officer is available
- [ ] Backup plan is documented

**Go-Live Readiness
- [ ] Customer confirms readiness
- [ ] Chorus.AI confirms readiness
- [ ] Support team briefed on customer
- [ ] Escalation contacts confirmed
- [ ] Communication plan finalized

**Deliverables**
- [ ] Go-Live Readiness Checklist (signed)
- [ ] Support team contact list
- [ ] Escalation procedures
- [ ] Customer emergency contact information

**Action Items**
- [ ] Customer: Final confirmation of readiness
- [ ] Chorus.AI: Brief support team
- [ ] Chorus.AI: Set up monitoring alerts
- [ ] Chorus.AI: Prepare incident response plan

### Day 9: Go-Live Event

**Participants**: Customer operators, compliance officer, Chorus.AI PM & engineer (on standby)

**Go-Live Execution**
- [ ] Event starts on time
- [ ] Recall.ai bot is in the call
- [ ] Operator console is accessible
- [ ] Muting Control tab is visible
- [ ] Monitoring dashboard is active
- [ ] Support team is monitoring logs
- [ ] First 15 minutes: watch for issues
- [ ] First hour: monitor violation patterns
- [ ] Full event: track all metrics

**During Event Monitoring**
- Watch violation detection latency
- Monitor muting success rate
- Track false positive rate
- Watch for system errors
- Monitor operator override rate
- Verify Ably real-time updates
- Check database query performance

**Post-Event Debrief (30 min)**
- [ ] Review violation statistics
- [ ] Discuss any issues that occurred
- [ ] Collect operator feedback
- [ ] Review false positives/negatives
- [ ] Document lessons learned
- [ ] Plan adjustments for next event

**Deliverables**
- [ ] Go-Live Event Report
- [ ] Violation statistics and analysis
- [ ] Operator feedback form
- [ ] Issues and resolutions log

**Action Items**
- [ ] Customer: Complete feedback form
- [ ] Customer: Provide threshold adjustment requests
- [ ] Chorus.AI: Analyze event data
- [ ] Chorus.AI: Make any necessary adjustments

### Days 10-14: First Week Support

**Daily Activities**
- [ ] Morning standup with customer (15 min)
- [ ] Review overnight logs and metrics
- [ ] Address any issues or questions
- [ ] Monitor system health
- [ ] Collect operator feedback
- [ ] Make threshold adjustments as needed

**Weekly Check-In (Friday)**
- [ ] Review week's metrics and trends
- [ ] Discuss operator feedback
- [ ] Review false positives/negatives
- [ ] Plan adjustments for next week
- [ ] Confirm customer satisfaction
- [ ] Schedule next week's check-in

**Deliverables**
- [ ] Daily status reports
- [ ] Weekly metrics summary
- [ ] Operator feedback compilation
- [ ] Adjustment recommendations

**Action Items**
- [ ] Customer: Attend daily standups
- [ ] Customer: Provide feedback
- [ ] Chorus.AI: Monitor and support
- [ ] Chorus.AI: Make adjustments as needed

## Ongoing Support (Weeks 3-4)

### Weekly Check-In Agenda

**Every Friday at 10am PT (30 minutes)**

1. **Metrics Review** (5 min)
   - Violations per event
   - Muting accuracy
   - False positive rate
   - System uptime

2. **Operator Feedback** (10 min)
   - UX feedback
   - Threshold accuracy
   - Pain points
   - Feature requests

3. **Compliance Review** (5 min)
   - Missed violations
   - False positives
   - Policy compliance
   - Risk assessment

4. **Action Items** (5 min)
   - Threshold adjustments
   - Feature enhancements
   - Bug fixes
   - Next week's plan

5. **Q&A** (5 min)
   - Any questions or concerns

### Success Metrics Tracking

| Metric | Week 1 | Week 2 | Week 3 | Week 4 | Target |
|--------|--------|--------|--------|--------|--------|
| Violation Detection Accuracy | — | — | — | — | >95% |
| False Positive Rate | — | — | — | — | <5% |
| Muting Success Rate | — | — | — | — | >99% |
| Detection Latency (ms) | — | — | — | — | <100ms |
| Operator Satisfaction (1-5) | — | — | — | — | >4.0 |
| System Uptime (%) | — | — | — | — | >99.9% |

### Feedback Form (Post-Event)

**Sent to operators after each event**

```
Phase 2 Auto-Muting Feedback Form

Event: [Event Name]
Date: [Date]
Operator: [Name]

1. How accurate was violation detection? (1-5 stars)
   Comments: _______________

2. Were muting thresholds appropriate?
   ☐ Too aggressive  ☐ Just right  ☐ Too lenient
   Comments: _______________

3. Any false positives? (Yes / No)
   If yes, how many? ___
   Examples: _______________

4. Any missed violations? (Yes / No)
   If yes, what type? _______________

5. Operator console usability? (1-5 stars)
   Comments: _______________

6. Any technical issues? (Yes / No)
   If yes, describe: _______________

7. Overall satisfaction? (1-5 stars)

8. Suggestions for improvement?
   _______________

Thank you for your feedback!
```

## Graduation Criteria

Phase 2 is considered successful for a pilot customer when:

- ✅ Violation detection accuracy >95%
- ✅ False positive rate <5%
- ✅ Muting success rate >99%
- ✅ Detection latency <100ms
- ✅ Operator satisfaction >4.0/5
- ✅ System uptime >99.9%
- ✅ Zero critical bugs in production
- ✅ Customer ready to recommend to others

## Graduation Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Pilot Customer Selection | March 1, 2026 | ✅ Complete |
| Kickoff Meetings | March 3, 2026 | ⏳ In Progress |
| Operator Training | March 5, 2026 | ⏳ Scheduled |
| Staging Testing | March 6, 2026 | ⏳ Scheduled |
| Configuration & Tuning | March 7, 2026 | ⏳ Scheduled |
| Go-Live Events | March 9-13, 2026 | ⏳ Scheduled |
| First Week Support | March 9-13, 2026 | ⏳ Scheduled |
| Ongoing Support | March 16-27, 2026 | ⏳ Scheduled |
| Graduation Review | March 28, 2026 | ⏳ Scheduled |
| General Availability | April 1, 2026 | ⏳ Planned |

## Support Resources

### Chorus.AI Team

**Product Manager**
- Name: [Name]
- Email: [email]
- Phone: [phone]
- Slack: @[handle]

**Technical Lead**
- Name: [Name]
- Email: [email]
- Phone: [phone]
- Slack: @[handle]

**Support Engineer**
- Name: [Name]
- Email: [email]
- Phone: [phone]
- Slack: @[handle]

### Support Channels

- **Slack**: #chorus-ai-phase2-support
- **Email**: support@choruscall.ai
- **Phone**: +1-555-CHORUS-1 (during business hours)
- **Emergency**: escalation@choruscall.ai

### Documentation

- Phase 2 Beta Deployment Guide: `/docs/PHASE2_BETA_DEPLOYMENT.md`
- Recall.ai Webhook Testing Guide: `/docs/RECALL_WEBHOOK_TESTING.md`
- Operator Training Slides: `/docs/OPERATOR_TRAINING.pptx`
- Troubleshooting Guide: `/docs/TROUBLESHOOTING.md`

## Sign-Off

**Customer Stakeholder**
- Name: _______________
- Title: _______________
- Signature: _______________ Date: _______________

**Chorus.AI Product Manager**
- Name: _______________
- Signature: _______________ Date: _______________

**Chorus.AI Technical Lead**
- Name: _______________
- Signature: _______________ Date: _______________

---

**Document Version**: 1.0  
**Last Updated**: March 10, 2026  
**Next Review**: March 24, 2026
