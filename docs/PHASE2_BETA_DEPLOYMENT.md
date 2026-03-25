# Phase 2 Auto-Muting Beta Deployment Guide

## Executive Summary

Chorus.AI Phase 2 introduces **AI Automated Moderator (AI-AM) Auto-Muting** — an intelligent system that automatically detects compliance violations in real-time and applies graduated speaker muting (soft mute with auto-unmute, or hard mute) to protect your event from regulatory violations.

This guide is for **enterprise customers** deploying Phase 2 in production. The beta program includes 5 pilot customers with dedicated support and weekly check-ins.

## What's New in Phase 2

### Core Features

**Real-Time Violation Detection**
- Analyzes every speaker's words in real-time using GPT-4
- Detects 8 violation types: forward-looking statements, price-sensitive info, insider information, profanity, harassment, misinformation, abuse, policy breaches
- Confidence scoring (0.0-1.0) and severity levels (low/medium/high/critical)

**Graduated Muting System**
- **Soft Mute** (threshold: 2 violations) — Speaker muted for 30 seconds, then auto-unmutes
- **Hard Mute** (threshold: 5 violations) — Speaker permanently muted until operator unmutes
- **Operator Override** — Operators can manually mute/unmute any speaker at any time

**Operator Dashboard Integration**
- New "Muting Control" tab in operator console
- Real-time violation tracking per speaker
- Muting statistics (total speakers, violations, soft/hard mutes)
- One-click muting controls with reason tracking

**Recall.ai Integration**
- Automatic speaker muting via Recall.ai API
- Works with Zoom RTMS, Microsoft Teams Bot, Webex, RTMP, PSTN
- Sub-100ms latency from violation detection to muting

## Deployment Checklist

### Pre-Deployment (1-2 weeks before)

- [ ] **Notify Recall.ai** — Ensure Recall.ai account is active and bot is configured for your platforms
- [ ] **Review Compliance Policies** — Align muting thresholds with your company's compliance requirements
- [ ] **Train Operators** — Conduct 1-hour training session on Phase 2 features and operator controls
- [ ] **Prepare Communications** — Draft message to event speakers explaining auto-muting feature
- [ ] **Set Up Monitoring** — Configure alerts for high violation rates or system errors
- [ ] **Backup Plan** — Document manual override procedures in case of system issues

### Deployment Day

- [ ] **Enable Phase 2 Features** — Activate auto-muting in event settings
- [ ] **Configure Thresholds** — Set soft mute (default: 2) and hard mute (default: 5) thresholds
- [ ] **Test Webhook** — Verify Recall.ai webhook is connected and receiving payloads
- [ ] **Operator Readiness** — Ensure operators are logged in and monitoring console
- [ ] **Participant Notification** — Inform speakers that auto-muting is active
- [ ] **Start Recording** — Begin event recording and transcription capture
- [ ] **Monitor First 15 Minutes** — Watch for any issues or unexpected behavior

### Post-Deployment (First Week)

- [ ] **Daily Check-Ins** — Review violation logs and muting events
- [ ] **Threshold Adjustment** — Fine-tune soft/hard mute thresholds based on event data
- [ ] **Operator Feedback** — Collect feedback on console UX and controls
- [ ] **Performance Metrics** — Monitor detection latency and accuracy
- [ ] **Escalation Protocol** — Document any issues for support team

## Configuration Guide

### Event Settings

Navigate to **Event Settings → AI Automated Moderator** to configure:

```
Auto-Muting Enabled:           [✓] Toggle on/off
Soft Mute Threshold:           [2] violations before soft mute
Hard Mute Threshold:           [5] violations before hard mute
Soft Mute Duration:            [30] seconds before auto-unmute
Violation Severity Filter:     [Critical/High] Only mute these severities
Notification Recipients:       [email@company.com] Alert on violations
```

### Violation Types to Monitor

By default, Phase 2 detects and mutes for these violations:

| Violation Type | Severity | Example | Action |
|---|---|---|---|
| **Forward-Looking** | High | "We expect 50% revenue growth next quarter" | Soft mute |
| **Price-Sensitive** | Critical | "Our stock should double after this deal" | Hard mute |
| **Insider Info** | Critical | "We have confidential acquisition details" | Hard mute |
| **Profanity** | Medium | Explicit language | Soft mute |
| **Harassment** | High | Discriminatory or hostile language | Soft mute |
| **Misinformation** | High | Factually false statements | Soft mute |
| **Abuse** | Medium | Personal attacks or insults | Soft mute |
| **Policy Breach** | Medium | Violation of event policies | Soft mute |

### Customizing Thresholds

**Conservative (Low Risk)**
- Soft Mute Threshold: 1
- Hard Mute Threshold: 3
- Best for: Highly regulated industries (finance, pharma)

**Balanced (Recommended)**
- Soft Mute Threshold: 2
- Hard Mute Threshold: 5
- Best for: Most enterprise events

**Permissive (High Tolerance)**
- Soft Mute Threshold: 3
- Hard Mute Threshold: 8
- Best for: Internal meetings with trusted speakers

## Operator Training

### Key Responsibilities

**Before Event**
1. Review speaker list and any known compliance risks
2. Test auto-muting system with test violations
3. Ensure backup operator is available
4. Prepare manual override procedures

**During Event**
1. Monitor "Muting Control" tab for violations
2. Watch for false positives (legitimate statements flagged as violations)
3. Use manual override if auto-muting is too aggressive
4. Document any issues for post-event review

**After Event**
1. Review violation log and muting events
2. Provide feedback on threshold accuracy
3. Note any speakers who frequently triggered violations
4. Prepare summary for compliance team

### Operator Console Walkthrough

**Muting Control Tab**

The operator console includes a new "Muting Control" tab with:

- **Speaker Violations Table** — Lists all speakers with violation counts
  - Speaker Name | Violations | Status | Soft Mutes | Hard Mutes | Actions
  
- **Muting Statistics** — Real-time dashboard
  - Total Speakers | Total Violations | Soft Muted | Hard Muted | Pending Review
  
- **Configuration Panel** — View current thresholds
  - Soft Mute Threshold: 2 violations
  - Hard Mute Threshold: 5 violations
  - Auto-Unmute Duration: 30 seconds
  
- **Manual Controls** — One-click muting actions
  - Soft Mute Button — Mute for 30 seconds
  - Hard Mute Button — Mute permanently
  - Unmute Button — Restore speaker audio
  - Reason Dropdown — Document why muting was applied

### Common Scenarios

**Scenario 1: False Positive (Legitimate Statement Flagged)**
- Operator sees violation alert for forward-looking statement
- Operator reviews transcript and determines it's legitimate guidance
- Operator clicks "Unmute" and selects "False Positive" reason
- System learns from feedback and improves future detection

**Scenario 2: Repeated Violations from Same Speaker**
- Speaker triggers 5 violations and is hard-muted
- Operator reviews violations and sees pattern of price-sensitive comments
- Operator keeps hard mute in place and notes speaker for future events
- Compliance team reviews speaker's training needs

**Scenario 3: System Error (Recall.ai Muting Fails)**
- Auto-muting is triggered but speaker is not actually muted
- Operator manually mutes speaker in Zoom/Teams/Webex
- Operator documents issue in system
- Support team investigates Recall.ai API failure

## Monitoring & Alerting

### Key Metrics to Monitor

**Real-Time Metrics (During Event)**
- Violations per minute
- Average detection latency
- Muting success rate
- Operator override rate
- System error rate

**Post-Event Metrics (Analysis)**
- Total violations detected
- Violations by type (forward-looking, price-sensitive, etc.)
- Violations by speaker
- Muting accuracy (true positive rate)
- False positive rate

### Alert Thresholds

Configure alerts for:
- **High Violation Rate**: >5 violations/minute → Escalate to compliance officer
- **Muting Failures**: >10% muting failures → Escalate to technical support
- **System Errors**: Any database/API errors → Immediate escalation
- **False Positive Spike**: >30% manual overrides → Review detection model

### Dashboard Access

Access real-time monitoring at: `https://your-domain/operator/muting-dashboard`

Includes:
- Live violation feed with timestamps
- Speaker muting status
- System health indicators
- Error log viewer
- Performance metrics

## Troubleshooting Guide

### Issue: Violations Not Being Detected

**Symptoms**
- Speakers say things that should trigger violations, but nothing is detected
- Violation count stays at 0

**Root Causes & Solutions**
1. **Recall.ai bot not in call** — Verify bot is active in Zoom/Teams/Webex
2. **Webhook not connected** — Check webhook registration in Recall.ai dashboard
3. **LLM not responding** — Check API logs for GPT-4 errors
4. **Thresholds too high** — Lower soft/hard mute thresholds to test

**Debug Steps**
```bash
# Check webhook logs
tail -f /home/ubuntu/chorus-ai/.manus-logs/devserver.log | grep "AI-AM"

# Verify Recall.ai bot status
curl https://api.recall.ai/v1/bots/{bot_id} \
  -H "Authorization: Bearer $RECALL_API_KEY"

# Test violation detection directly
curl -X POST https://your-domain/api/test/detect-violation \
  -H "Content-Type: application/json" \
  -d '{"text": "We expect revenue to grow 50% next quarter"}'
```

### Issue: Speaker Not Being Muted

**Symptoms**
- Violation detected and muting triggered, but speaker audio is still active
- Operator console shows "Muted" but speaker is still talking

**Root Causes & Solutions**
1. **Recall.ai API error** — Check Recall.ai API status and credentials
2. **Wrong speaker ID** — Verify speaker ID matches Recall.ai bot's participant ID
3. **Platform incompatibility** — Ensure Recall.ai bot supports your platform
4. **Muting permission denied** — Check bot has moderator/host permissions

**Debug Steps**
```bash
# Check Recall.ai API response
curl -X POST https://api.recall.ai/v1/bots/{bot_id}/mute \
  -H "Authorization: Bearer $RECALL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"participant_id": "participant-123"}'

# Check database muting state
SELECT * FROM speaker_muting_state 
WHERE speaker_id = 'speaker-123' 
ORDER BY muted_at DESC LIMIT 1;
```

### Issue: Too Many False Positives

**Symptoms**
- Legitimate statements are being flagged as violations
- Operator is manually overriding mutes frequently (>30% of the time)
- Speakers complain about being muted unfairly

**Root Causes & Solutions**
1. **Thresholds too aggressive** — Increase soft/hard mute thresholds
2. **LLM too sensitive** — Adjust system prompt for compliance detection
3. **Industry-specific language** — Add context about your industry to detection prompt
4. **Severity filter too low** — Increase minimum severity to "High" or "Critical"

**Adjustment Steps**
1. Increase soft mute threshold from 2 to 3
2. Increase hard mute threshold from 5 to 7
3. Change severity filter to "Critical" only
4. Review false positive examples with compliance team
5. Adjust detection prompt to add industry context

### Issue: System Performance Degradation

**Symptoms**
- Operator console is slow or unresponsive
- Violation detection latency increases over time
- Database queries are timing out

**Root Causes & Solutions**
1. **High violation volume** — Database is overwhelmed with records
2. **Memory leak** — Node.js process memory usage increasing
3. **Database connection pool exhausted** — Too many concurrent queries
4. **Ably rate limiting** — Real-time channel publishing is throttled

**Debug Steps**
```bash
# Check database query performance
EXPLAIN SELECT * FROM compliance_violations 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

# Monitor Node.js memory usage
ps aux | grep "node\|tsx" | grep chorus-ai

# Check Ably rate limits
curl https://api.ably.io/v1/stats \
  -H "Authorization: Bearer $ABLY_API_KEY"
```

## Support & Escalation

### Support Channels

**For Operator Questions**
- Slack: #chorus-ai-support
- Email: support@choruscall.ai
- Phone: +1-555-CHORUS-1 (during business hours)

**For Technical Issues**
- GitHub Issues: https://github.com/chorus-ai/chorus-ai/issues
- Email: engineering@choruscall.ai
- Escalation: escalation@choruscall.ai

### SLA Commitments

| Issue Severity | Response Time | Resolution Target |
|---|---|---|
| **Critical** (System down) | 15 minutes | 2 hours |
| **High** (Feature broken) | 1 hour | 8 hours |
| **Medium** (Degraded performance) | 4 hours | 24 hours |
| **Low** (Enhancement request) | 24 hours | 1 week |

### Escalation Path

1. **Operator** reports issue to support team
2. **Support** investigates and attempts fix (1 hour)
3. **Engineering** escalated if support cannot resolve (2 hour response)
4. **VP Engineering** escalated for critical issues (30 minute response)

## Feedback & Iteration

### Weekly Check-In Agenda

Every Friday at 10am PT, we conduct 30-minute check-ins with pilot customers:

1. **Metrics Review** (5 min) — Violations, muting events, system health
2. **Operator Feedback** (10 min) — UX, threshold accuracy, pain points
3. **Compliance Review** (5 min) — False positives, missed violations
4. **Action Items** (5 min) — Adjustments for next week
5. **Q&A** (5 min) — Any other questions or concerns

### Feedback Form

After each event, operators complete a 2-minute feedback form:

```
1. How accurate was violation detection? (1-5 stars)
2. Were muting thresholds appropriate? (Too aggressive / Just right / Too lenient)
3. Any false positives? (Yes / No) If yes, how many?
4. Any missed violations? (Yes / No) If yes, what type?
5. Operator console usability? (1-5 stars)
6. Any technical issues? (Yes / No) If yes, describe
7. Overall satisfaction? (1-5 stars)
8. Suggestions for improvement?
```

## Success Metrics

Phase 2 is considered successful when:

| Metric | Target | Measurement |
|---|---|---|
| **Violation Detection Accuracy** | >95% | True positive rate |
| **False Positive Rate** | <5% | Violations manually overridden |
| **Muting Success Rate** | >99% | Speakers actually muted when triggered |
| **Detection Latency** | <100ms | Time from speech to violation detection |
| **Operator Satisfaction** | >4.0/5 | Weekly feedback form average |
| **System Uptime** | >99.9% | Availability during events |
| **Customer Retention** | 100% | All 5 pilot customers renew |

## Graduation to General Availability

After 4 weeks of beta testing with 5 pilot customers, Phase 2 will graduate to General Availability (GA) when:

- ✅ All success metrics met
- ✅ Zero critical bugs in production
- ✅ All 5 pilot customers satisfied (>4.0/5 rating)
- ✅ Documentation complete and reviewed
- ✅ Support team trained and ready
- ✅ Monitoring and alerting fully operational

**Expected GA Date**: April 10, 2026

## Contact & Support

**Phase 2 Product Manager**: [name] ([email])
**Technical Lead**: [name] ([email])
**Support Email**: support@choruscall.ai
**Escalation**: escalation@choruscall.ai

---

**Document Version**: 1.0  
**Last Updated**: March 10, 2026  
**Next Review**: March 24, 2026
