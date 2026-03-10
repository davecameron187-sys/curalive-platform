# AI Automated Moderator (AI-AM) Phase 1 - Beta Deployment Guide

## Overview

This guide outlines the beta deployment process for AI-AM Phase 1 (Alert-Only Mode) with 5 pilot enterprise customers. The goal is to validate alert accuracy, operator UX, and notification delivery before Phase 2 auto-muting rollout.

---

## Beta Timeline

| Phase | Duration | Objective |
|-------|----------|-----------|
| **Pilot Onboarding** | Week 1-2 | Setup 5 customers, configure alerts, train operators |
| **Live Testing** | Week 3-6 | Run 15-20 live events, collect feedback |
| **Iteration** | Week 7-8 | Fix bugs, optimize detection, prepare Phase 2 |

---

## Pilot Customer Selection Criteria

**Target Profile:**
- Enterprise customers with 500+ attendees per event
- Regular earnings calls, investor events, or board meetings
- Existing Recall.ai integration
- Dedicated operator team (2-3 people)
- Willing to provide detailed feedback

**Ideal Candidates:**
1. Financial services (IR teams, investor relations)
2. Healthcare (regulatory compliance, board meetings)
3. Government agencies (public hearings, briefings)
4. Tech companies (earnings calls, investor days)

---

## Customer Onboarding Workflow

### Step 1: Initial Setup (Day 1-2)

**For Each Customer:**

1. **Create Pilot Account**
   ```bash
   # Create customer in database
   INSERT INTO customers (
     name, 
     email, 
     plan, 
     ai_am_enabled, 
     ai_am_phase, 
     created_at
   ) VALUES (
     'Acme Corp', 
     'ir@acmecorp.com', 
     'enterprise', 
     true, 
     'phase1_beta', 
     NOW()
   );
   ```

2. **Provision Recall.ai Integration**
   - Verify Recall.ai API credentials
   - Register webhook endpoint: `/api/webhooks/recall/ai-am`
   - Test webhook connectivity with test event

3. **Create Operator Accounts**
   - Create 2-3 operator accounts per customer
   - Assign role: `operator` with `ai_am_alerts` permission
   - Send onboarding email with login credentials

4. **Configure Alert Preferences**
   - Set alert severity thresholds (default: all violations)
   - Enable notification channels (email, SMS, in-app)
   - Configure quiet hours (e.g., 6 PM - 8 AM)
   - Set alert deduplication window (default: 30 seconds)

### Step 2: Operator Training (Day 3-4)

**Training Agenda (2 hours per operator):**

1. **Alert Dashboard Overview** (30 min)
   - Navigate AlertDashboard
   - Understand violation cards (type, severity, confidence)
   - View transcript context
   - Filter and search violations

2. **Real-Time Alerts** (20 min)
   - Ably real-time notifications
   - Unread badge system
   - Alert acknowledgment workflow
   - Notification preferences

3. **Compliance Audit Trail** (20 min)
   - View action history
   - Understand immutable logging
   - Export audit trail for compliance

4. **Hands-On Practice** (30 min)
   - Simulate violations with test event
   - Practice acknowledgment workflow
   - Configure personal preferences

**Training Materials:**
- Video walkthrough (5 min)
- PDF quick-start guide
- Live Q&A session
- Slack support channel

### Step 3: Pre-Event Checklist (Day 5)

Before first live event:

- [ ] Recall.ai bot registered for customer
- [ ] Webhook endpoint verified and responding
- [ ] All operators logged in and tested
- [ ] Alert preferences configured
- [ ] Notification channels tested (email, SMS)
- [ ] Audit trail logging enabled
- [ ] Support contact info shared

---

## Live Event Execution

### Before Event

1. **Verify Setup**
   ```bash
   # Check webhook connectivity
   curl -X POST https://api.curalive.com/api/webhooks/recall/ai-am \
     -H "Content-Type: application/json" \
     -d '{
       "bot_id": "test_bot",
       "meeting_id": "12345",
       "data": {
         "speaker_name": "Test Speaker",
         "text": "This is a test violation"
       }
     }'
   ```

2. **Start Recall.ai Bot**
   - Ensure bot joins meeting
   - Verify audio/transcript capture
   - Test webhook delivery

3. **Notify Operators**
   - Send Slack notification: "Event starting in 5 minutes"
   - Confirm all operators are online
   - Share event details (duration, expected attendees)

### During Event

**Operator Responsibilities:**
- Monitor AlertDashboard for violations
- Review high-severity alerts immediately
- Acknowledge violations (optional in Phase 1)
- Take notes on false positives
- Document any technical issues

**AI-AM System:**
- Process transcript segments in real-time (<500ms latency)
- Broadcast violations to Ably channel
- Send notifications based on operator preferences
- Log all actions to audit trail

### After Event

1. **Collect Feedback**
   - Send operator survey (5 min)
   - Questions:
     - Alert accuracy (false positives/negatives)
     - Notification timing
     - UI usability
     - Suggestions for improvement

2. **Generate Compliance Report**
   - Violations summary (count, severity, types)
   - Speaker breakdown
   - Timeline visualization
   - Regulatory findings

3. **Review Metrics**
   ```
   - Total violations detected: ___
   - False positive rate: ___% (violations that weren't real)
   - Avg acknowledgment time: ___ seconds
   - Notification delivery rate: ___% (delivered within 2 sec)
   - System uptime: ___% (target: >99.5%)
   ```

---

## Feedback Collection & Iteration

### Weekly Sync (Every Friday)

**Agenda:**
1. Metrics review (violations, false positives, uptime)
2. Operator feedback summary
3. Bug reports and issues
4. Feature requests
5. Next week priorities

**Participants:**
- Pilot customer representative
- CuraLive product manager
- CuraLive engineering lead

### Feedback Categories

| Category | Threshold | Action |
|----------|-----------|--------|
| **False Positive Rate** | >10% | Retrain detection model |
| **Notification Latency** | >2 sec | Optimize Ably publishing |
| **System Downtime** | >30 min | Root cause analysis |
| **Operator Satisfaction** | <4/5 | UX iteration |

---

## Success Metrics

### Phase 1 Beta Goals

| Metric | Target | Current |
|--------|--------|---------|
| **Detection Accuracy** | >95% | ___ |
| **False Positive Rate** | <5% | ___ |
| **Notification Latency (p95)** | <500ms | ___ |
| **System Availability** | >99.5% | ___ |
| **Operator Satisfaction** | >4.5/5 | ___ |
| **Event Coverage** | 15-20 events | ___ |

### Go/No-Go Decision (Week 8)

**Go to Phase 2 if:**
- Detection accuracy >95%
- False positive rate <5%
- Notification latency <500ms (p95)
- System availability >99.5%
- Operator satisfaction >4.5/5
- No critical bugs

**No-Go Triggers:**
- Detection accuracy <90%
- False positive rate >10%
- System downtime >1 hour
- Operator satisfaction <4/5
- Critical security issues

---

## Pilot Customer Incentives

**Phase 1 Beta Benefits:**
- 50% discount on AI-AM feature (6-month commitment)
- Direct access to product team
- Priority support (24/7 Slack channel)
- Co-marketing opportunity
- Early access to Phase 2 features

**Success Bonus:**
- If pilot customer provides 5+ events and detailed feedback
- Extend 50% discount for 12 months
- Feature their use case in case study

---

## Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript errors resolved
- [ ] Database schema synced
- [ ] Recall.ai webhook endpoints registered
- [ ] Ably channels configured
- [ ] Email/SMS notification templates created
- [ ] Audit trail logging enabled
- [ ] Monitoring dashboards setup
- [ ] Support documentation prepared

### Deployment Day

- [ ] Deploy code to production
- [ ] Run smoke tests (webhook, alerts, notifications)
- [ ] Verify database migrations
- [ ] Check Ably channel connectivity
- [ ] Monitor error logs for 1 hour
- [ ] Notify pilot customers of go-live

### Post-Deployment

- [ ] Daily standup for first week
- [ ] Weekly metrics review
- [ ] Operator feedback collection
- [ ] Bug fix prioritization
- [ ] Iteration planning

---

## Support Plan

### Operator Support

**Slack Channel:** #ai-am-pilot-support
- Response time: <1 hour during business hours
- Available: Monday-Friday, 9 AM - 6 PM (customer timezone)

**Email Support:** support@curalive.com
- Response time: <4 hours
- Available: 24/7

**Documentation:**
- Quick-start guide (PDF)
- Video tutorials (5 min each)
- FAQ document
- Troubleshooting guide

### Escalation Path

1. **Tier 1:** Operator support (Slack)
2. **Tier 2:** Product team (email)
3. **Tier 3:** Engineering lead (urgent issues)

---

## Post-Beta Roadmap

### Week 9-10: Phase 2 Planning
- Review Phase 1 feedback
- Design auto-muting rules
- Plan UI for muting controls
- Prepare Phase 2 spec

### Week 11-12: Phase 2 Development
- Implement configurable muting thresholds
- Add soft/hard mute modes
- Build operator override controls
- Create muting audit trail

### Week 13-14: Phase 2 Beta
- Deploy to same 5 pilot customers
- Collect feedback on auto-muting
- Iterate on rules and thresholds
- Prepare general availability

---

## Contact & Escalation

**Product Manager:** [Name] - product@curalive.com  
**Engineering Lead:** [Name] - engineering@curalive.com  
**Support:** support@curalive.com  
**Slack:** #ai-am-pilot-support

---

## Appendix: Sample Violation Types

| Type | Example | Severity |
|------|---------|----------|
| **Forward-Looking** | "We expect 20% revenue growth next year" | High |
| **Price-Sensitive** | "We're acquiring Company X for $100M" | Critical |
| **Insider Info** | "Our Q4 numbers will beat expectations" | Critical |
| **Profanity** | Explicit language | Medium |
| **Harassment** | Personal attacks, discrimination | High |
| **Misinformation** | False statements, misleading claims | Medium |

---

**Document Version:** 1.0  
**Last Updated:** March 10, 2026  
**Next Review:** April 10, 2026
