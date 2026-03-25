# CuraLive Operator Onboarding Runbook

## Quick Start (First 30 Minutes)

### 1. Account Setup (5 min)
```
1. Go to https://curalive.manus.space
2. Click "Sign In" → Use Manus credentials
3. Complete profile setup
4. Enable 2FA for security
```

### 2. Dashboard Orientation (5 min)
- **Home**: Overview of upcoming events
- **My Events**: Your assigned events
- **AI Features**: Status of all AI capabilities
- **Settings**: Profile, preferences, API keys

### 3. Event Brief Generator Demo (10 min)
```
1. Go to /operator/brief-generator
2. Select "Demo Event" from dropdown
3. Paste sample press release:
   "Q1 2026 Earnings: Revenue up 25% YoY to $1.2B, 
    EPS $2.50 vs $2.00 prior year, FY2026 guidance $5.2B"
4. Click "Generate Brief"
5. Review Key Messages, Talking Points, Q&A
6. Click "Approve Brief"
```

### 4. Q&A Auto-Triage Demo (10 min)
```
1. Go to /moderator/qa-console
2. View sample questions with classifications
3. Try "Approve", "Reject", "Flag" actions
4. Check triage statistics
```

---

## Day 1: Core Features Training

### Morning (2 hours)

#### Session 1: Event Brief Generator (30 min)
**Objective**: Master press release → brief conversion

**Hands-on Exercise**:
1. Open 3 sample press releases
2. Generate briefs for each
3. Compare LLM outputs
4. Identify best practices

**Key Takeaways**:
- Press releases 500-2000 words work best
- Include financial data for better extraction
- Review talking points before event
- Save briefs for speaker reference

#### Session 2: Q&A Auto-Triage (30 min)
**Objective**: Understand question classification

**Hands-on Exercise**:
1. Review 20 sample questions
2. Predict classification before seeing result
3. Compare with LLM classification
4. Understand confidence scores

**Key Takeaways**:
- Approved: Show to speaker
- Duplicate: Flag for review
- Off-Topic: Hide from queue
- Spam: Block permanently
- Sensitive: Flag for moderator
- Unclear: Request clarification

#### Session 3: Toxicity Filter (30 min)
**Objective**: Identify and manage inappropriate content

**Hands-on Exercise**:
1. Review 15 flagged questions
2. Assess toxicity levels
3. Take appropriate actions
4. Generate daily report

**Key Takeaways**:
- High risk: Block immediately
- Medium risk: Review before approval
- Low risk: Approve with caution
- Document all decisions
- Export reports for compliance

#### Session 4: Transcript Editing (30 min)
**Objective**: Correct transcription errors

**Hands-on Exercise**:
1. Review sample transcript
2. Identify 5 errors
3. Create corrections
4. Approve changes
5. Create version snapshot

**Key Takeaways**:
- Fix errors as they occur
- Document edit reasons
- Maintain version history
- Export for records

### Afternoon (2 hours)

#### Session 5: Redaction Workflow (45 min)
**Objective**: Identify and mask sensitive content

**Hands-on Exercise**:
1. Run sensitive content detection
2. Review LLM suggestions
3. Batch redact similar items
4. Approve redactions
5. Export redacted transcript

**Key Takeaways**:
- Financial: Revenue, margins, guidance
- Personal: Names, emails, phones
- Confidential: Non-public info
- Legal: Litigation, disputes
- Medical: Health information

#### Session 6: Compliance Dashboard (45 min)
**Objective**: Monitor compliance metrics

**Hands-on Exercise**:
1. Review key metrics
2. Analyze trends
3. Check operator performance
4. Generate compliance report
5. Identify SLA violations

**Key Takeaways**:
- Target >85% approval rate
- Keep pending <10 items
- Review time <4 hours
- Document all decisions
- Export reports weekly

#### Session 7: Real-Time Collaboration (30 min)
**Objective**: Work with multiple operators

**Hands-on Exercise**:
1. Join shared editing session
2. See active collaborators
3. Update cursor position
4. Resolve conflicts
5. Publish version

**Key Takeaways**:
- Communicate before editing same section
- Use descriptive edit reasons
- Publish versions frequently
- Review conflict resolutions
- Export history for audit

---

## Day 2: Advanced Features & Best Practices

### Morning (2 hours)

#### Session 8: Event Management Workflow (60 min)
**Objective**: Complete end-to-end event management

**Full Scenario**:
1. **Pre-Event** (15 min)
   - Generate event brief from press release
   - Review talking points
   - Configure Q&A filters
   - Set up redaction rules

2. **During Event** (30 min)
   - Monitor Q&A queue
   - Triage incoming questions
   - Flag toxicity issues
   - Correct transcription errors
   - Track sentiment trends

3. **Post-Event** (15 min)
   - Complete transcript review
   - Apply redactions
   - Generate compliance report
   - Archive for records

#### Session 9: Quality Standards & Metrics (60 min)
**Objective**: Understand performance targets

**Metrics Review**:
- Transcript accuracy: >95%
- Q&A response time: <2 min
- Redaction completeness: 100%
- Compliance coverage: All items reviewed
- Approval rate: >85%

**Performance Benchmarks**:
- Beginner: 60% of targets
- Intermediate: 80% of targets
- Advanced: >95% of targets

**Improvement Strategies**:
- Daily practice with sample events
- Weekly performance reviews
- Peer learning sessions
- Continuous feedback

### Afternoon (2 hours)

#### Session 10: Troubleshooting & Edge Cases (60 min)
**Objective**: Handle common issues

**Common Issues & Solutions**:

| Issue | Cause | Solution |
|---|---|---|
| Questions not appearing | Toxicity filter too strict | Adjust filter settings |
| Transcript sync issues | Network connection | Refresh page, check Ably |
| Redaction misses | LLM limitation | Manually add to list |
| Slow performance | Browser cache | Clear cache, restart |
| Approval delays | Pending queue full | Process faster, delegate |

**Edge Cases**:
- Multi-language transcripts
- Real-time corrections
- Concurrent edits
- Sensitive content overlap
- Compliance hold-ups

#### Session 11: Tools & Integrations (60 min)
**Objective**: Maximize efficiency

**Available Tools**:
- Keyboard shortcuts
- Batch processing
- Templates
- API access
- Custom rules

**Integrations**:
- Slack notifications
- Email reports
- Calendar sync
- CRM integration
- Analytics export

---

## Day 3: Certification & Go-Live

### Morning (1 hour)

#### Certification Exam (60 min)
**Format**: 50 questions, 60 minutes, 80% pass required

**Topics Covered**:
- Event brief generation (10 questions)
- Q&A auto-triage (10 questions)
- Toxicity filtering (10 questions)
- Transcript editing (10 questions)
- Redaction workflow (10 questions)

**Sample Questions**:
1. What's the target approval rate for Q&A triage?
   - A) 70% B) 80% C) 85% D) 90%
   - **Answer: C) 85%**

2. Which redaction type covers non-public strategies?
   - A) Financial B) Personal C) Confidential D) Legal
   - **Answer: C) Confidential**

3. What's the average review time target for redactions?
   - A) 2 hours B) 4 hours C) 6 hours D) 8 hours
   - **Answer: B) 4 hours**

### Afternoon (1 hour)

#### Go-Live Preparation (60 min)

**Pre-Go-Live Checklist**:
- [ ] Passed certification exam
- [ ] Completed all training sessions
- [ ] Reviewed OPERATOR_TRAINING_GUIDE.md
- [ ] Practiced with sample events
- [ ] Understood quality standards
- [ ] Know who to contact for help

**First Event Preparation**:
1. Review event details
2. Generate event brief
3. Configure Q&A filters
4. Set up redaction rules
5. Brief team on workflow
6. Start event with confidence

**Support Resources**:
- **Slack Channel**: #curalive-operators
- **Email**: operators@curalive.io
- **Docs**: https://docs.curalive.io
- **Video Tutorials**: https://videos.curalive.io
- **Live Chat**: Available 24/7

---

## Ongoing Development

### Weekly Activities
- **Monday**: Review previous week's metrics
- **Tuesday**: Practice with sample events
- **Wednesday**: Peer learning session
- **Thursday**: Advanced feature deep-dive
- **Friday**: Performance review & feedback

### Monthly Activities
- Certification renewal (if needed)
- Advanced features training
- New feature rollout
- Compliance audit
- Team retrospective

### Quarterly Activities
- Advanced certification
- Specialized training tracks
- Leadership development
- Strategic planning

---

## Performance Tracking

### Metrics Dashboard
Access at: `/operator/performance`

**Key Metrics**:
- Events managed
- Questions processed
- Redactions completed
- Approval rate
- Average response time
- Error rate
- Customer satisfaction

### Goals & Targets

| Level | Events/Month | Approval Rate | Response Time | Accuracy |
|---|---|---|---|---|
| Beginner | 5-10 | 75% | 3 min | 90% |
| Intermediate | 10-20 | 85% | 2 min | 95% |
| Advanced | 20+ | 90% | 1 min | 98% |

---

## Certification Levels

### Level 1: Operator (Basic)
- **Requirements**: Complete Day 1 training, pass exam
- **Permissions**: Manage Q&A, triage questions
- **Events/Month**: 5-10

### Level 2: Senior Operator (Intermediate)
- **Requirements**: 1 month Level 1, advanced training, pass exam
- **Permissions**: All Level 1 + redaction, compliance
- **Events/Month**: 10-20

### Level 3: Lead Operator (Advanced)
- **Requirements**: 3 months Level 2, leadership training, pass exam
- **Permissions**: All Level 2 + team management, training
- **Events/Month**: 20+

### Level 4: Specialist (Expert)
- **Requirements**: 6 months Level 3, specialized training
- **Permissions**: All Level 3 + API access, custom rules
- **Events/Month**: Unlimited

---

## Emergency Procedures

### Critical Issue Response

**Step 1: Identify Issue** (1 min)
- Describe problem
- Note affected systems
- Check error logs

**Step 2: Notify Team** (1 min)
- Post in #curalive-incidents
- Tag on-call lead
- Provide context

**Step 3: Implement Workaround** (5 min)
- Use backup procedures
- Document steps taken
- Notify stakeholders

**Step 4: Escalate if Needed** (2 min)
- Contact engineering team
- Provide detailed logs
- Request priority fix

**Step 5: Post-Incident Review** (24 hours)
- Document what happened
- Identify root cause
- Plan prevention

### Escalation Contacts
- **Level 1**: Team Lead (ops-lead@curalive.io)
- **Level 2**: Engineering (engineering@curalive.io)
- **Level 3**: Executive (cto@curalive.io)

---

## Resources

### Documentation
- **Main Guide**: OPERATOR_TRAINING_GUIDE.md
- **API Docs**: https://docs.curalive.io/api
- **Video Tutorials**: https://videos.curalive.io
- **FAQ**: https://faq.curalive.io

### Training Materials
- Sample press releases
- Practice transcripts
- Test Q&A questions
- Compliance scenarios
- Edge case examples

### Support Channels
- **Slack**: #curalive-operators
- **Email**: operators@curalive.cc
- **Phone**: +27 11 000 0000
- **Chat**: https://chat.curalive.io
- **Ticket System**: https://tickets.curalive.io

---

## Feedback & Improvement

### How to Provide Feedback
1. Go to Settings → Feedback
2. Describe your suggestion
3. Rate impact (1-5)
4. Submit

### Feedback Categories
- Feature requests
- UI/UX improvements
- Documentation updates
- Training suggestions
- Bug reports

### Response Time
- Critical bugs: 1 hour
- Feature requests: 1 week
- Improvements: 2 weeks
- Documentation: 3 days

---

## Document Information

- **Last Updated**: 2026-03-08
- **Version**: 1.0
- **Author**: CuraLive Training Team
- **Status**: Active
- **Next Review**: 2026-06-08

For updates and corrections, contact training@curalive.io

---

## Appendix: Keyboard Shortcuts

| Action | Shortcut |
|---|---|
| Approve | Ctrl+Enter |
| Reject | Ctrl+Shift+R |
| Flag | Ctrl+F |
| Save | Ctrl+S |
| Undo | Ctrl+Z |
| Redo | Ctrl+Shift+Z |
| Search | Ctrl+F |
| Copy | Ctrl+C |
| Paste | Ctrl+V |
| Select All | Ctrl+A |

---

## Appendix: Common Abbreviations

| Abbreviation | Meaning |
|---|---|
| Q&A | Questions and Answers |
| LLM | Large Language Model |
| SLA | Service Level Agreement |
| API | Application Programming Interface |
| UI | User Interface |
| UX | User Experience |
| WPM | Words Per Minute |
| UTC | Coordinated Universal Time |
| JSON | JavaScript Object Notation |
| CSV | Comma-Separated Values |

---

**Welcome to the CuraLive team! 🎉**

We're excited to have you on board. This runbook is your guide to success. Don't hesitate to reach out if you have questions or need additional support.

Good luck with your first event!
