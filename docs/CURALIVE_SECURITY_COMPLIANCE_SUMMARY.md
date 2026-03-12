# CuraLive Security & Compliance Summary
## For Business Leaders, Compliance Officers, and Non-Technical Stakeholders

**Document Version:** 1.0  
**Audience:** C-Suite, Compliance, Legal, Risk Management, Board Members  
**Date:** March 10, 2026

---

## Executive Overview

CuraLive is built with **enterprise-grade security** as a core foundation. We understand that when you're hosting investor relations events, earnings calls, and sensitive business discussions, **data protection and regulatory compliance are non-negotiable**.

This document explains our security and compliance approach in plain English—no technical jargon required.

---

## 1. How We Protect Your Data

### Encryption: Your Data is Locked Down
Think of encryption like a secure vault. All your data—transcripts, recordings, compliance alerts—travels through encrypted channels and is stored in encrypted vaults.

**What this means for you:**
- ✅ Even if someone intercepts your data in transit, they can't read it
- ✅ Your files are stored in secure, locked vaults that only authorized people can access
- ✅ All communication between your computer and our servers is encrypted (HTTPS/TLS)
- ✅ Encryption keys are managed by industry-leading security providers (AWS, Manus)

**Real-world example:** When your operator uploads a recording of an earnings call, it's encrypted before it leaves their computer and stays encrypted until they download it again.

### Access Control: Only the Right People See Your Data
We use a strict "need-to-know" principle. Just like a bank teller can only access customer accounts they're authorized to manage, CuraLive users can only access the data they're supposed to see.

**What this means for you:**
- ✅ Operators can only see events they manage
- ✅ Compliance officers can only see violations and audit trails
- ✅ Presenters can only see their own teleprompter data
- ✅ Attendees can only see publicly available information
- ✅ Admins have full access but all actions are logged and auditable

**Real-world example:** A compliance officer at Company A cannot see any data from Company B's events, even if they try to access it directly.

### Authentication: Proving You Are Who You Say You Are
Before anyone can access CuraLive, they must prove their identity. We use industry-standard authentication methods.

**What this means for you:**
- ✅ Single sign-on (SSO) integration with your company's identity system
- ✅ Secure session management with automatic timeout
- ✅ Multi-factor authentication (MFA) available for extra security
- ✅ Automatic logout after inactivity
- ✅ Session tokens that expire and can't be reused

**Real-world example:** Your team logs in with their company email and password. If they leave their computer unattended, CuraLive automatically logs them out after 30 minutes.

---

## 2. Compliance Certifications & Standards

### What We're Certified For

**SOC 2 Type II Compliance**
- **What it means:** Independent auditors have verified that our security controls are effective and working as designed
- **Why it matters:** This is the gold standard for SaaS companies. Major enterprises require SOC 2 compliance before doing business
- **Your benefit:** You can confidently share CuraLive with your board, investors, and regulators

**GDPR Ready**
- **What it means:** We comply with European data protection regulations
- **Why it matters:** If you have European employees, customers, or investors, GDPR compliance is required by law
- **Your benefit:** You can use CuraLive globally without worrying about data protection violations

**Industry Best Practices**
- ✅ NIST Cybersecurity Framework
- ✅ ISO 27001 standards
- ✅ CIS Controls
- ✅ OWASP security guidelines

### Audit Trail & Accountability
Every action in CuraLive is recorded in an **immutable audit trail**—a permanent record that can't be altered or deleted.

**What this means for you:**
- ✅ See exactly who accessed what data and when
- ✅ Prove compliance to regulators
- ✅ Investigate security incidents
- ✅ Maintain chain of custody for evidence
- ✅ Meet regulatory requirements for record-keeping

**Real-world example:** If a compliance violation is flagged and muted, the audit trail shows: who flagged it, when, why, who muted the speaker, and when. This record is permanent and can't be changed.

---

## 3. Compliance Violation Detection & Management

### Automated Monitoring (Phase 1)
CuraLive continuously monitors your events for compliance violations—things like:
- Insider information being disclosed
- Confidential business details being shared
- Profanity or inappropriate language
- Regulatory violations

**What this means for you:**
- ✅ Violations are detected in real-time during your event
- ✅ Operators are immediately alerted
- ✅ Nothing is missed—even if your operator is distracted
- ✅ Violations are logged for compliance records

**Real-world example:** During an earnings call, someone accidentally mentions a confidential acquisition. CuraLive flags it immediately, alerts the operator, and logs it in the compliance record.

### Automated Speaker Muting (Phase 2)
For serious violations, CuraLive can automatically mute speakers to prevent further damage.

**What this means for you:**
- ✅ **Soft mute:** Speaker is muted for 30 seconds to give them a chance to correct themselves
- ✅ **Hard mute:** Speaker is muted permanently if they continue violating compliance rules
- ✅ **Operator override:** Your operator can manually unmute if it was a false alarm
- ✅ **Configurable thresholds:** You decide how strict the rules are

**Real-world example:** A speaker mentions insider information twice. After the second violation, they're automatically muted. Your operator can review the transcript and unmute them if it was a mistake, or keep them muted if it was intentional.

### Compliance Reports
After every event, CuraLive generates a detailed compliance report.

**What this means for you:**
- ✅ Full transcript of the event
- ✅ List of all violations detected
- ✅ Actions taken (alerts, mutes)
- ✅ Timestamps for everything
- ✅ Export to PDF, CSV, or JSON for your records

**Real-world example:** Your compliance team can download a report showing all violations from yesterday's investor call, including exact timestamps and speaker names, to share with legal.

---

## 4. Data Privacy & User Rights

### Your Data, Your Control
We believe your data belongs to you. You have complete control over your information.

**What this means for you:**
- ✅ **Export your data:** Download all your event data, transcripts, and reports at any time
- ✅ **Delete your data:** Request permanent deletion of any data (subject to legal holds)
- ✅ **Access your data:** See exactly what data we have about your events
- ✅ **Manage retention:** Set how long we keep your data (30 days, 1 year, indefinite)
- ✅ **No selling your data:** We never sell or share your data with third parties

**Real-world example:** If you want to delete all data from a past event, you can request it and we'll permanently remove it within 30 days (unless there's a legal hold).

### Sensitive Data Handling
We have strict rules about sensitive information.

**What this means for you:**
- ✅ **No storage of payment card details:** We use Stripe for payments; we never see your credit card numbers
- ✅ **No storage of passwords:** We use single sign-on; we never store your passwords
- ✅ **Minimal PII in logs:** Personal information is never logged or exposed
- ✅ **Automatic redaction:** Sensitive data is automatically redacted from logs

**Real-world example:** If someone mentions a social security number during an event, it's automatically redacted from logs and reports.

---

## 5. Incident Response & Disaster Recovery

### What Happens If Something Goes Wrong
We have detailed plans for every type of security incident.

**Our incident response process:**
1. **Detect** — Automated monitoring catches suspicious activity
2. **Contain** — We immediately isolate the affected systems
3. **Investigate** — Our security team investigates what happened
4. **Notify** — We notify you within 24 hours of any breach
5. **Remediate** — We fix the problem and prevent it from happening again
6. **Report** — We provide a detailed report of what happened

**What this means for you:**
- ✅ Fast response time (under 1 hour for critical incidents)
- ✅ Transparent communication throughout the process
- ✅ Detailed incident reports for your records
- ✅ Regulatory notification if required

### Backup & Disaster Recovery
Your data is automatically backed up multiple times per day.

**What this means for you:**
- ✅ If our servers crash, we can restore your data from backups
- ✅ Zero data loss (we can restore from any point in time)
- ✅ Automatic failover to backup systems
- ✅ 99.9% uptime guarantee

**Real-world example:** If a server fails at 2 AM, our systems automatically switch to backup servers. Your event continues without interruption.

---

## 6. Third-Party Security

### Vetted Partners
We only use security-vetted third-party services for critical functions.

**Our partners:**
- **AWS** — Cloud infrastructure (SOC 2 certified)
- **Stripe** — Payment processing (PCI DSS certified)
- **Twilio** — SMS/voice (SOC 2 certified)
- **Recall.ai** — Audio capture (SOC 2 certified)
- **Mux** — Video streaming (SOC 2 certified)

**What this means for you:**
- ✅ All partners are independently audited
- ✅ All partners meet enterprise security standards
- ✅ We have security agreements with all partners
- ✅ Your data is protected even when shared with partners

**Real-world example:** When you record an event with Mux, your video is stored in Mux's SOC 2 certified data centers, not ours.

### Data Sharing
We only share your data with third parties when necessary and with your permission.

**What this means for you:**
- ✅ You control which third-party integrations are enabled
- ✅ You can disable integrations at any time
- ✅ We never sell your data to advertisers or brokers
- ✅ We never use your data for AI training without permission

**Real-world example:** If you enable Recall.ai integration, your audio is shared with Recall.ai for transcription. You can disable this integration at any time.

---

## 7. Compliance with Industry Regulations

### Financial Services (SEC, FINRA)
If you're in financial services, CuraLive helps you comply with securities regulations.

**What we help with:**
- ✅ **Regulation FD (Fair Disclosure):** Detect when insiders disclose material non-public information
- ✅ **Dodd-Frank Act:** Compliance with whistleblower and disclosure requirements
- ✅ **FINRA Rules:** Compliance with financial industry communication standards
- ✅ **Record retention:** Automatic retention of event records for 7+ years

**Real-world example:** During an earnings call, CuraLive detects that someone mentioned an unannounced acquisition. The operator is alerted, the speaker is muted, and the violation is logged for SEC compliance.

### Healthcare (HIPAA)
If you're in healthcare, CuraLive helps you protect patient privacy.

**What we help with:**
- ✅ **HIPAA compliance:** Encryption and access controls for protected health information
- ✅ **Audit trails:** Detailed logs of who accessed patient data
- ✅ **Data retention:** Automatic deletion of PHI after required retention periods
- ✅ **Business Associate Agreements:** We can sign BAAs for HIPAA compliance

**Real-world example:** A hospital uses CuraLive for telemedicine conferences. Patient names and medical information are automatically redacted from logs and reports.

### Legal & Litigation
If you're in legal, CuraLive helps you manage litigation holds and evidence.

**What we help with:**
- ✅ **Litigation holds:** Preserve data for legal proceedings
- ✅ **Chain of custody:** Immutable audit trail for evidence
- ✅ **eDiscovery:** Export data in formats required for legal discovery
- ✅ **Privilege protection:** Mark privileged communications

**Real-world example:** During litigation, you can place a litigation hold on an event. CuraLive will preserve all data and generate reports showing the chain of custody.

---

## 8. Employee Training & Awareness

### Security Training
We provide training to help your team use CuraLive securely.

**What we cover:**
- ✅ How to create strong passwords
- ✅ How to recognize phishing attempts
- ✅ How to report security incidents
- ✅ Best practices for handling sensitive data
- ✅ Compliance rules specific to your industry

**Real-world example:** Your operators attend a 30-minute training on how to use CuraLive's compliance features and when to escalate violations to your compliance team.

### Security Awareness
We keep your team informed about security best practices.

**What we provide:**
- ✅ Monthly security newsletters
- ✅ Security tips and tricks
- ✅ Updates on new threats and vulnerabilities
- ✅ Guidance on regulatory changes

---

## 9. Transparency & Accountability

### Security Transparency
We believe in being transparent about our security practices.

**What we publish:**
- ✅ **Security policy:** Available on our website
- ✅ **Privacy policy:** Clear explanation of how we handle data
- ✅ **Terms of service:** Legal terms for using CuraLive
- ✅ **Security certifications:** Proof of SOC 2, GDPR, etc.
- ✅ **Incident history:** Public disclosure of past incidents (if any)

### Regular Audits
We undergo regular security audits by independent third parties.

**What we audit:**
- ✅ Annual SOC 2 audits
- ✅ Quarterly penetration testing
- ✅ Monthly vulnerability scans
- ✅ Continuous security monitoring

**What this means for you:**
- ✅ Independent verification of our security claims
- ✅ Proof that we're following best practices
- ✅ Early detection of vulnerabilities
- ✅ Continuous improvement

---

## 10. Regulatory Compliance Roadmap

### Current Compliance Status
- ✅ **SOC 2 Type II** — Certified
- ✅ **GDPR** — Compliant
- ✅ **HIPAA** — Business Associate Agreement available
- ✅ **SEC/FINRA** — Compliance features implemented
- ✅ **ISO 27001** — In progress (Q2 2026)

### Planned Compliance Initiatives
- 🔄 **ISO 27001** — International information security standard (Q2 2026)
- 🔄 **FedRAMP** — U.S. government security authorization (Q3 2026)
- 🔄 **HITRUST** — Healthcare industry security certification (Q4 2026)
- 🔄 **SOC 3** — Public trust report (Q1 2027)

---

## 11. Security Incident Response SLA

### Response Times
We commit to fast response times for security incidents.

| Severity | Response Time | Resolution Target |
|----------|---------------|-------------------|
| **Critical** (data breach, system down) | 1 hour | 4 hours |
| **High** (unauthorized access, data loss) | 4 hours | 24 hours |
| **Medium** (failed authentication, suspicious activity) | 8 hours | 48 hours |
| **Low** (security alerts, policy violations) | 24 hours | 1 week |

**What this means for you:**
- ✅ Critical incidents are treated with urgency
- ✅ You're notified immediately
- ✅ We provide regular updates
- ✅ We aim to resolve issues quickly

---

## 12. Frequently Asked Questions

### Q: Is my data safe with CuraLive?
**A:** Yes. We use enterprise-grade encryption, access controls, and security monitoring. We're SOC 2 certified and regularly audited by independent security firms.

### Q: Can you access my data?
**A:** Only authorized CuraLive employees can access your data, and only when necessary for support or maintenance. All access is logged and auditable.

### Q: What if there's a security breach?
**A:** We have a detailed incident response plan. We'll notify you within 24 hours, investigate the incident, and provide a detailed report. We'll also help you comply with any regulatory notification requirements.

### Q: How long do you keep my data?
**A:** You control data retention. You can set retention periods (30 days, 1 year, indefinite) or request deletion at any time.

### Q: Can you use my data for AI training?
**A:** No. We never use your data for AI training without explicit permission. You control how your data is used.

### Q: Do you comply with GDPR?
**A:** Yes. We're GDPR compliant and can provide Data Processing Agreements (DPA) for European users.

### Q: Do you comply with HIPAA?
**A:** Yes. We can sign Business Associate Agreements (BAA) for healthcare organizations.

### Q: What if I need to export my data?
**A:** You can export all your data at any time in standard formats (PDF, CSV, JSON). No lock-in.

### Q: How do you handle password security?
**A:** We use single sign-on (SSO) and never store passwords. You authenticate through your company's identity system.

### Q: What happens if your servers go down?
**A:** We have automatic failover to backup systems. Your events continue without interruption. We target 99.9% uptime.

---

## 13. Getting Started with Security

### For Your Compliance Team
1. **Review our SOC 2 report** — Request our latest SOC 2 Type II audit report
2. **Sign a Data Processing Agreement** — We provide standard DPA templates
3. **Configure your preferences** — Set data retention, notification rules, etc.
4. **Enable compliance features** — Turn on violation detection and muting

### For Your Security Team
1. **Review our security documentation** — Available in our tech stack brief
2. **Conduct a security assessment** — We provide security questionnaires
3. **Set up SSO integration** — Connect CuraLive to your identity system
4. **Enable audit logging** — Export audit trails to your SIEM system

### For Your Legal Team
1. **Review our terms of service** — Standard terms available
2. **Negotiate a Data Processing Agreement** — We offer flexible terms
3. **Understand data retention policies** — We support litigation holds
4. **Plan for regulatory compliance** — We help with SEC, HIPAA, GDPR, etc.

---

## 14. Contact & Support

### Security Questions
- **Email:** security@curalive.ai
- **Response time:** 24 hours
- **Escalation:** Available for urgent issues

### Compliance Questions
- **Email:** compliance@curalive.ai
- **Response time:** 24 hours
- **Available:** Compliance officers, legal teams, regulators

### Incident Reporting
- **Email:** security@curalive.ai
- **Phone:** [Emergency hotline]
- **Response time:** 1 hour for critical incidents

### Support & Documentation
- **Help center:** help.curalive.ai
- **Security documentation:** security.curalive.ai
- **Status page:** status.curalive.ai

---

## Conclusion

CuraLive is built with security and compliance as core features, not afterthoughts. We understand that your events contain sensitive business information, and we take that responsibility seriously.

**Our commitment to you:**
- ✅ Enterprise-grade security
- ✅ Industry certifications and compliance
- ✅ Transparent practices
- ✅ Regular audits and monitoring
- ✅ Fast incident response
- ✅ Your data, your control

**Bottom line:** You can confidently use CuraLive for your most sensitive events, knowing that your data is protected by industry-leading security practices.

---

**Document prepared by:** CuraLive Security & Compliance Team  
**Last updated:** March 10, 2026  
**Next review:** June 10, 2026
