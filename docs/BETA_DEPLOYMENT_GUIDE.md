# AI Automated Moderator (AI-AM) — Beta Deployment Guide

## Phase 1 Beta Launch (Alert-Only Mode)

This guide outlines the process for deploying AI-AM Phase 1 to 10 pilot enterprise customers.

---

## 1. Pre-Deployment Checklist

### Infrastructure
- [ ] Production database backup created
- [ ] Redis cache configured for deduplication
- [ ] Ably channels provisioned for real-time alerts
- [ ] Twilio/Resend API keys configured
- [ ] Recall.ai webhook endpoints registered
- [ ] SSL certificates verified
- [ ] Load balancing configured for 1000+ events/minute

### Code Quality
- [ ] All 30+ tests passing (vitest run)
- [ ] TypeScript compilation clean (no errors)
- [ ] Code coverage >80%
- [ ] Security audit completed
- [ ] Performance benchmarks met (<500ms latency)

### Documentation
- [ ] Operator training materials prepared
- [ ] API documentation updated
- [ ] Troubleshooting guide created
- [ ] Incident response playbook drafted
- [ ] Customer onboarding checklist created

### Monitoring & Observability
- [ ] Datadog/New Relic dashboards configured
- [ ] Alert thresholds set (false positive rate, latency, errors)
- [ ] Log aggregation enabled
- [ ] Error tracking (Sentry) configured
- [ ] Metrics collection enabled

---

## 2. Pilot Customer Selection

### Selection Criteria
- **Industry**: Financial services, healthcare, government (regulated sectors)
- **Event Volume**: 5-20 events/month
- **Technical Capability**: Can provide feedback on UX and accuracy
- **Commitment**: 8-week beta period with weekly feedback calls
- **Use Case**: Earnings calls, investor events, board meetings, compliance-critical

### Target Pilot Customers
1. **Goldman Sachs** — Earnings calls, investor relations
2. **JPMorgan Chase** — Quarterly earnings, investor days
3. **CVS Health** — Investor relations, board briefings
4. **Pfizer** — Earnings calls, clinical trial updates
5. **Morgan Stanley** — Investment conferences, earnings
6. **Bank of America** — Quarterly earnings, investor events
7. **Merck** — Investor relations, earnings calls
8. **Citigroup** — Earnings calls, investor days
9. **UnitedHealth** — Earnings calls, investor relations
10. **Visa** — Earnings calls, investor events

---

## 3. Deployment Process

### Phase 3a: Pre-Launch (Week 1)
1. **Customer Kickoff Calls**
   - Introduce AI-AM feature
   - Explain alert-only mode (no auto-muting)
   - Set expectations on accuracy (95% precision, 85% recall)
   - Discuss quiet hours and notification preferences
   - Schedule training session

2. **Environment Setup**
   - Create customer-specific Ably channels
   - Configure alert preferences
   - Set up notification channels (email, SMS)
   - Create operator accounts
   - Enable webhook logging

3. **Operator Training**
   - 1-hour training on AlertDashboard UI
   - Demo of real-time alert feed
   - Walkthrough of violation detail view
   - Q&A on alert types and severity levels
   - Dry run with test violations

### Phase 3b: Soft Launch (Week 2)
1. **Limited Deployment**
   - Deploy to 2-3 pilot customers
   - Monitor alerts in real-time
   - Collect initial feedback
   - Track false positive rate
   - Measure latency (target: <500ms p95)

2. **Daily Monitoring**
   - Check alert accuracy
   - Monitor system performance
   - Collect operator feedback
   - Fix critical bugs immediately
   - Document issues and workarounds

3. **Weekly Feedback Calls**
   - Review alerts from past week
   - Discuss false positives
   - Gather UX feedback
   - Address concerns
   - Plan improvements

### Phase 3c: Full Beta Launch (Week 3-4)
1. **Expand to All 10 Customers**
   - Deploy to remaining 8 customers
   - Stagger deployments (2-3 per day)
   - Monitor each customer's first event
   - Provide 24/7 support
   - Collect feedback continuously

2. **Support Structure**
   - Dedicated Slack channel per customer
   - Daily standup with support team
   - On-call engineer for critical issues
   - Weekly customer sync calls
   - Monthly steering committee meetings

---

## 4. Success Metrics

### Technical Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Alert Latency (p95)** | <500ms | Ably publish timestamp vs. detection timestamp |
| **System Uptime** | >99.5% | Monitoring dashboard |
| **False Positive Rate** | <5% | Manual review of alerts |
| **False Negative Rate** | <15% | Operator feedback + manual audit |
| **Detection Accuracy** | >95% | Precision = TP/(TP+FP) |

### Business Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Customer Satisfaction** | >4.5/5 | Weekly survey |
| **Operator Adoption** | >80% | Usage analytics |
| **Alert Actionability** | >70% | Operator feedback |
| **Time to Acknowledge** | <2 min avg | Audit trail data |
| **Feature Requests** | <3 per customer | Feedback collection |

### Customer Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| **Regulatory Compliance** | 100% | Audit trail verification |
| **Operator Confidence** | >4/5 | Survey |
| **Training Effectiveness** | >90% | Competency assessment |
| **Support Ticket Volume** | <2 per customer | Support system |
| **Churn Rate** | 0% | Retention tracking |

---

## 5. Incident Response Plan

### Critical Issues (P1)
- **Definition**: System down, false alerts, data loss
- **Response Time**: <15 minutes
- **Escalation**: VP Engineering + Customer Success
- **Communication**: Immediate Slack + email notification
- **Resolution Target**: <1 hour

### High Priority Issues (P2)
- **Definition**: Feature not working, high false positive rate
- **Response Time**: <1 hour
- **Escalation**: Engineering Lead
- **Communication**: Within 2 hours
- **Resolution Target**: <24 hours

### Medium Priority Issues (P3)
- **Definition**: Minor bugs, UX improvements, documentation
- **Response Time**: <4 hours
- **Escalation**: Engineering Team
- **Communication**: Daily update
- **Resolution Target**: <1 week

---

## 6. Feedback Collection Process

### Weekly Feedback Calls (30 min)
1. **Alerts Review** (10 min)
   - Review alerts from past week
   - Discuss false positives/negatives
   - Validate detection accuracy

2. **UX Feedback** (10 min)
   - AlertDashboard usability
   - Notification preferences
   - Report export functionality

3. **Feature Requests** (5 min)
   - Desired improvements
   - Phase 2 feedback (auto-muting)
   - Integration requests

4. **Action Items** (5 min)
   - Document feedback
   - Assign to engineering
   - Schedule follow-up

### Monthly Steering Committee
- VP Product, VP Engineering, VP Customer Success
- Review aggregate feedback from all 10 customers
- Prioritize improvements for Phase 2
- Discuss expansion roadmap
- Plan Phase 2 launch timeline

---

## 7. Phase 2 Readiness Criteria

Before launching Phase 2 (Auto-Muting), all of the following must be true:

- [ ] False positive rate <3% (down from <5%)
- [ ] Customer satisfaction >4.7/5
- [ ] >80% operator adoption
- [ ] Zero critical bugs in production
- [ ] All customers trained on Phase 2 features
- [ ] Legal review completed for auto-muting
- [ ] Regulatory compliance verified
- [ ] Performance benchmarks maintained
- [ ] Incident response playbook validated
- [ ] Steering committee approval obtained

---

## 8. Rollback Plan

If critical issues arise that cannot be fixed within 4 hours:

1. **Immediate Actions**
   - Disable AI-AM for affected customers
   - Revert to previous stable version
   - Notify customers within 15 minutes
   - Begin root cause analysis

2. **Communication**
   - Slack notification to all stakeholders
   - Email to affected customers
   - Status page update
   - Daily updates until resolved

3. **Recovery**
   - Fix identified issue
   - Deploy to staging environment
   - Run full test suite
   - Get customer approval before re-enabling
   - Monitor closely for 24 hours

---

## 9. Deployment Checklist

### Pre-Deployment (Day 1)
- [ ] All tests passing
- [ ] Code review approved
- [ ] Database backups created
- [ ] Monitoring dashboards ready
- [ ] Support team briefed
- [ ] Customer notifications sent

### Deployment (Day 1-2)
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Check alert latency
- [ ] Monitor error rates

### Post-Deployment (Day 2-7)
- [ ] Daily monitoring calls
- [ ] Collect operator feedback
- [ ] Track false positive rate
- [ ] Monitor system performance
- [ ] Document lessons learned
- [ ] Plan Phase 2 improvements

---

## 10. Contact Information

### Support Escalation
- **Engineering On-Call**: [Slack Channel]
- **Customer Success Lead**: [Contact Info]
- **VP Product**: [Contact Info]
- **VP Engineering**: [Contact Info]

### Customer Contacts
- **Customer Success Manager**: Assigned per customer
- **Technical Support**: support@curalive.ai
- **Emergency Hotline**: +1-XXX-XXX-XXXX

---

## 11. Timeline

| Week | Phase | Activities |
|------|-------|-----------|
| Week 1 | Pre-Launch | Customer kickoffs, training, environment setup |
| Week 2 | Soft Launch | Deploy to 2-3 customers, monitor, collect feedback |
| Week 3-4 | Full Beta | Deploy to all 10 customers, daily monitoring |
| Week 5-8 | Optimization | Improve accuracy, gather feedback, plan Phase 2 |
| Week 9+ | Phase 2 Planning | Prepare auto-muting features, legal review |

---

## 12. Success Criteria for Beta

✅ **Technical Success**
- Alert latency <500ms p95
- System uptime >99.5%
- False positive rate <5%
- Zero critical bugs

✅ **Business Success**
- Customer satisfaction >4.5/5
- >80% operator adoption
- Zero customer churn
- Clear roadmap to Phase 2

✅ **Operational Success**
- Support team handles all issues
- Incident response validated
- Monitoring dashboards working
- Documentation complete

---

**Beta Launch Date**: [TBD]  
**Beta End Date**: [TBD]  
**Phase 2 Launch Target**: [TBD]
