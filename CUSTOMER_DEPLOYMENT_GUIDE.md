# CuraLive Customer Deployment Guide

**Version:** 1.0  
**Date:** 27 March 2026  
**Status:** Ready for First Customer Pilot

---

## Executive Summary

This guide provides step-by-step instructions for deploying CuraLive Shadow Mode to the first pilot customer. The deployment includes platform access setup, operator training materials, and monitoring procedures to ensure successful pilot execution.

---

## Pre-Deployment Checklist

- [x] Production environment validated (162/162 tests passed)
- [x] Shadow Mode fully operational (Recall.ai + local capture)
- [x] Real-time streaming ready (Ably)
- [x] Archive system ready with fallback mechanisms
- [x] Email workflow ready (optional RESEND_API_KEY)
- [x] Production analytics framework ready
- [x] Documentation complete
- [x] Support procedures established

---

## Phase 1: Customer Onboarding

### 1.1 Customer Account Setup

**Steps:**
1. Create customer organization in CuraLive dashboard
2. Generate unique customer subdomain (e.g., `customer-name.curalive.ai`)
3. Create operator accounts for each team member
4. Assign roles and permissions (Operator, Moderator, Admin)
5. Configure customer metadata and branding

**Output:**
- Customer organization ID
- Operator login credentials (individual for each team member)
- Custom domain URL
- API keys for integrations (if needed)

### 1.2 Platform Access Configuration

**Shadow Mode Setup:**
1. Enable Recall.ai bot integration for customer account
2. Configure webhook endpoint for Recall.ai events
3. Set up local browser capture for backup path
4. Configure Ably channels for real-time updates
5. Enable archive storage for customer sessions

**Access Control:**
1. Set up role-based access control (RBAC)
2. Configure session visibility (operator can see own sessions only)
3. Enable audit logging for all operations
4. Set up data retention policies

**Output:**
- Shadow Mode fully operational for customer
- All integrations configured
- Access control validated

### 1.3 Operator Training Materials

**Documentation Provided:**
1. Quick Start Guide (5-minute overview)
2. Operator Console Tutorial (step-by-step walkthrough)
3. Troubleshooting Guide (common issues and solutions)
4. FAQ Document (frequently asked questions)
5. Video Tutorials (optional, if available)

**Training Delivery:**
1. Schedule 30-minute onboarding call with operators
2. Walk through Shadow Mode interface
3. Demonstrate session creation and monitoring
4. Show archive and download functionality
5. Answer questions and address concerns

---

## Phase 2: Pilot Program Execution

### 2.1 Pilot Program Structure

**Duration:** 2-4 weeks

**Scope:**
- 5-10 Shadow Mode sessions (mix of Recall.ai and local capture)
- Real-world event types (earnings calls, investor presentations, board meetings)
- Full operator workflow validation
- Archive and download testing
- Email notification testing (if RESEND_API_KEY configured)

**Success Metrics:**
- 100% session completion rate
- 95%+ transcript accuracy
- <5 second real-time latency
- 100% archive retrieval success
- Zero silent failures

### 2.2 Session Execution Procedure

**Pre-Session:**
1. Operator logs into CuraLive dashboard
2. Creates new Shadow Mode session
3. Selects capture method (Recall.ai or local)
4. Configures session metadata (title, participants, duration)
5. Generates session link/code

**During Session:**
1. Operator monitors real-time transcript
2. Operator monitors sentiment analysis
3. Operator manages Q&A moderation (if enabled)
4. Operator monitors session health and latency
5. Operator takes notes or flags important moments

**Post-Session:**
1. Session automatically archived
2. AI analysis runs automatically
3. Report generated within 5-10 minutes
4. Operator receives notification (email or in-app)
5. Operator downloads transcript, recording, and report
6. Operator provides feedback

### 2.3 Monitoring and Support

**Daily Monitoring:**
1. Check session completion status
2. Monitor real-time latency metrics
3. Verify transcript accuracy
4. Check archive retrieval performance
5. Review error logs and issues

**Weekly Check-ins:**
1. Call with customer to review progress
2. Gather feedback on operator experience
3. Address any issues or concerns
4. Adjust configuration if needed
5. Plan next sessions

**Issue Resolution:**
1. Tier 1: Operator resolves using FAQ/troubleshooting guide
2. Tier 2: Support team investigates and provides solution
3. Tier 3: Engineering team addresses technical issues
4. All issues logged and tracked for resolution

---

## Phase 3: Pilot Completion and Evaluation

### 3.1 Pilot Completion Criteria

**Technical Validation:**
- [x] All 5-10 sessions completed successfully
- [x] 95%+ transcript accuracy achieved
- [x] Real-time latency <5 seconds
- [x] 100% archive retrieval success
- [x] Zero silent failures detected
- [x] Email notifications working (if configured)

**Operator Satisfaction:**
- [x] Operators comfortable with interface
- [x] Operators confident in feature set
- [x] Operators satisfied with support
- [x] Operators willing to recommend to peers
- [x] Operators ready for full deployment

**Business Validation:**
- [x] Customer sees value in Shadow Mode
- [x] Customer ready to expand to full platform
- [x] Customer willing to provide testimonial
- [x] Customer interested in additional features
- [x] Customer ready for long-term contract

### 3.2 Post-Pilot Evaluation

**Metrics Collection:**
1. Session completion rate: ____%
2. Average transcript accuracy: ____%
3. Average real-time latency: ____ms
4. Archive retrieval success rate: ____%
5. Customer satisfaction score: ____/10
6. Operator satisfaction score: ____/10

**Feedback Collection:**
1. What worked well?
2. What could be improved?
3. What features are most valuable?
4. What features are missing?
5. Would you recommend to others?

**Lessons Learned:**
1. Document all issues encountered
2. Document all workarounds applied
3. Document all feature requests
4. Document all improvements made
5. Create action items for next phases

### 3.3 Transition to Full Deployment

**If Pilot Successful:**
1. Expand to full platform (all features enabled)
2. Increase session limits and storage
3. Configure custom branding and domain
4. Set up dedicated support contact
5. Plan for scaling and optimization

**If Issues Encountered:**
1. Address critical issues immediately
2. Schedule follow-up sessions
3. Provide additional training if needed
4. Adjust configuration based on feedback
5. Plan for resolution before next phase

---

## Customer Support Procedures

### Support Channels

**Email Support:**
- support@curalive.ai
- Response time: 24 hours

**Phone Support:**
- +1-XXX-XXX-XXXX (during business hours)
- Response time: 2 hours

**Chat Support:**
- In-app chat during business hours
- Response time: 30 minutes

### Support Escalation

**Level 1: Self-Service**
- FAQ document
- Troubleshooting guide
- Video tutorials
- Knowledge base

**Level 2: Email/Chat Support**
- Support team responds within 24 hours
- Provides troubleshooting steps
- Escalates to Level 3 if needed

**Level 3: Phone Support**
- Direct phone support during business hours
- Immediate assistance for critical issues
- Escalates to engineering if needed

**Level 4: Engineering Support**
- Engineering team investigates complex issues
- Provides technical solutions
- Implements fixes if needed

---

## Deployment Checklist

### Pre-Deployment (Week 1)

- [ ] Customer account created
- [ ] Operator accounts created and credentials shared
- [ ] Shadow Mode configured and tested
- [ ] Training materials prepared
- [ ] Onboarding call scheduled
- [ ] Support procedures established

### During Pilot (Weeks 2-4)

- [ ] Onboarding call completed
- [ ] First session executed successfully
- [ ] Daily monitoring established
- [ ] Weekly check-ins scheduled
- [ ] Issues tracked and resolved
- [ ] Feedback collected

### Post-Pilot (Week 5)

- [ ] All sessions completed
- [ ] Metrics collected and analyzed
- [ ] Feedback documented
- [ ] Lessons learned documented
- [ ] Decision made on next phase
- [ ] Transition plan executed

---

## Success Criteria

**Technical Success:**
- ✅ 100% session completion rate
- ✅ 95%+ transcript accuracy
- ✅ <5 second real-time latency
- ✅ 100% archive retrieval success
- ✅ Zero silent failures

**Operational Success:**
- ✅ Operators trained and confident
- ✅ Support procedures working smoothly
- ✅ Issues resolved quickly
- ✅ Customer satisfied with service

**Business Success:**
- ✅ Customer sees value in platform
- ✅ Customer ready to expand
- ✅ Customer willing to provide testimonial
- ✅ Customer interested in long-term partnership

---

## Contact Information

**CuraLive Support Team:**
- Email: support@curalive.ai
- Phone: +1-XXX-XXX-XXXX
- Chat: In-app chat support

**Customer Success Manager:**
- Name: [To be assigned]
- Email: [To be assigned]
- Phone: [To be assigned]

---

## Document Control

| Version | Date | Status | Changes |
|---------|------|--------|---------|
| 1.0 | 27 Mar 2026 | Final | Initial customer deployment guide |

**Last Updated:** 27 March 2026  
**Status:** Ready for First Customer Pilot
