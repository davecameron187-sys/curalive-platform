---
REPLIT SUMMARY — copy and paste this block into the Replit chat
---
Feature: Compliance Audit Trail & Regulatory Reporting
Route(s): /post-event/:eventId/compliance, /compliance/audit-log, /compliance/reports
Priority: very-high
Depends on: Post-Event AI Report (implemented), AI Transcription (partial), Recall.ai Bot Recording (implemented)
What to build:
- Add a new "Compliance" tab to the post-event report (/post-event/:eventId/compliance) displaying a compliance audit trail: all material statements made during the event, flagged by AI as potentially non-compliant, with timestamps, speaker, and compliance status (flagged, reviewed, approved, disclosed)
- Create a server-side compliance flagging service that processes the event transcript post-event, uses the LLM to identify material statements (earnings guidance, forward-looking statements, material facts), flags statements that may violate JSE/IFRS/SEC disclosure rules, and assigns a risk level (low/medium/high)
- Add a compliance review UI where compliance officers can review flagged statements, mark them as reviewed, and approve them for disclosure
- Generate a formal Compliance Certificate (PDF) that documents: all material statements made, timestamps, speaker, compliance status, and sign-off by the compliance officer. This certificate is exportable and can be submitted to regulators.
- Add a Compliance Audit Log page (/compliance/audit-log) showing all compliance events across all events (statements flagged, reviewed, approved) with filtering and export
DB changes needed: yes — add compliance_flags table (id, event_id FK, statement_text, timestamp, speaker_name, risk_level enum, flag_reason, compliance_status enum, reviewed_by, reviewed_at, approved_by, approved_at, created_at) and compliance_audit_log table (id, event_id FK, action enum, user_id FK, details JSON, created_at)
New tRPC procedures: yes — compliance.getFlaggedStatements (query, protected), compliance.reviewStatement (mutation, protected), compliance.approveStatement (mutation, protected), compliance.generateComplianceCertificate (mutation, protected), compliance.getAuditLog (query, protected)
New pages/routes: yes — /post-event/:eventId/compliance (compliance tab in post-event report), /compliance/audit-log (audit log page)
---

# Compliance Audit Trail & Regulatory Reporting — Full Specification

## 1. Overview

JSE-listed and other regulated companies must comply with strict disclosure rules. Material statements made during earnings calls and investor days must be carefully reviewed to ensure they do not violate regulations (JSE Listing Rules, IFRS, SEC Regulation FD, etc.). Currently, CuraLive flags potentially non-compliant statements in the Post-Event AI Report, but there is no formal audit trail or compliance certificate for regulatory submission.

The Compliance Audit Trail & Regulatory Reporting feature provides a comprehensive compliance review workflow: the system identifies material statements and flags those that may violate disclosure rules; compliance officers review and approve flagged statements; a formal Compliance Certificate is generated documenting all material statements, compliance status, and sign-off. This certificate can be submitted to regulators to demonstrate compliance.

---

## 2. Compliance Flagging Pipeline

### 2.1 Material Statement Identification

After an event ends, the compliance flagging service processes the event transcript to identify material statements. A material statement is one that could affect investor decisions, including:

- **Earnings Guidance** — Projections of future revenue, earnings, or margins
- **Forward-Looking Statements** — Statements about future business plans, product launches, market expansion
- **Material Facts** — Significant events, acquisitions, partnerships, regulatory changes
- **Risk Disclosures** — Acknowledgment of material risks or uncertainties
- **Management Changes** — Announcements of executive departures or appointments

### 2.2 Compliance Risk Assessment

For each material statement, the system uses the LLM to assess compliance risk based on JSE Listing Rules, IFRS, and SEC Regulation FD. The LLM is prompted with:

```
Assess the compliance risk of this statement made during an earnings call:

Statement: [statement text]
Speaker: [speaker name/title]
Context: [surrounding context from transcript]

Evaluate against:
1. JSE Listing Rules (particularly LR 5.1 — material information disclosure)
2. IFRS disclosure requirements
3. SEC Regulation FD (Fair Disclosure) — if applicable
4. Company's own disclosure policy

Provide:
- risk_level: "low" | "medium" | "high"
- flag_reason: string (why this statement may be non-compliant)
- recommended_action: string (what should be done to ensure compliance)
- regulation_violated: string (which regulation is at risk)

Respond in JSON format.
```

### 2.3 Flagging Logic

Based on the LLM assessment:

- **Low Risk** — Statement is compliant or low risk. No flag. Recorded in audit log.
- **Medium Risk** — Statement may require clarification or additional disclosure. Flagged for review.
- **High Risk** — Statement may violate regulations. Flagged for immediate review and approval before disclosure.

### 2.4 Compliance Status Workflow

Each flagged statement has a compliance status:

1. **Flagged** — AI has flagged the statement as potentially non-compliant
2. **Reviewed** — Compliance officer has reviewed the statement and assessed risk
3. **Approved** — Compliance officer has approved the statement for disclosure
4. **Disclosed** — Statement has been disclosed to investors (e.g., in press release, SEC filing)

---

## 3. Compliance Review UI

### 3.1 Compliance Tab in Post-Event Report

A new "Compliance" tab in the post-event report displays all flagged statements with the following columns:

| Timestamp | Speaker | Statement | Risk Level | Status | Reviewed By | Actions |
|---|---|---|---|---|---|---|
| 12:34:56 | CEO | "We expect 15-20% revenue growth in 2026" | High | Flagged | — | Review, Approve, Reject |
| 12:45:23 | CFO | "We are exploring strategic partnerships" | Medium | Reviewed | John Smith | Approve, Reject |
| 13:02:15 | CEO | "Our R&D budget is $50M annually" | Low | Approved | Jane Doe | View Approval |

### 3.2 Statement Review Dialog

When a compliance officer clicks "Review" on a flagged statement, a modal dialog opens displaying:

- Full statement text
- Speaker name and title
- Timestamp in the event
- AI-assessed risk level and reason
- Recommended action
- Relevant regulation(s)
- Link to the transcript position (to view context)

The compliance officer can:

- **Approve** — Mark the statement as compliant and approved for disclosure
- **Request Clarification** — Add a note requesting the speaker to clarify or modify the statement
- **Reject** — Mark the statement as non-compliant and recommend removal from disclosure materials
- **Escalate** — Escalate to legal or compliance leadership for further review

All actions are logged in the compliance audit log.

### 3.3 Compliance Status Dashboard

A dashboard shows:

- Total statements flagged in the event
- Breakdown by risk level (low, medium, high)
- Statements pending review
- Statements approved for disclosure
- Statements rejected or requiring clarification
- Compliance officer sign-off status

---

## 4. Compliance Certificate Generation

### 4.1 Certificate Content

A formal Compliance Certificate (PDF) is generated for each event after all flagged statements have been reviewed and approved. The certificate includes:

**Header:**
- Company name and logo
- Event name, date, and location
- Certificate title: "Compliance Audit Certificate"
- Certification date and certificate ID

**Material Statements Table:**
A table listing all material statements made during the event:

| # | Timestamp | Speaker | Statement | Risk Level | Compliance Status | Reviewed By | Approval Date |
|---|---|---|---|---|---|---|---|
| 1 | 12:34:56 | CEO | "We expect 15-20% revenue growth in 2026" | High | Approved | John Smith | 2026-03-10 |
| 2 | 13:02:15 | CFO | "Our R&D budget is $50M annually" | Low | Approved | Jane Doe | 2026-03-10 |

**Compliance Summary:**
- Total statements identified: X
- Statements flagged: Y
- Statements approved for disclosure: Z
- Statements rejected or requiring clarification: W
- Compliance status: "Compliant" or "Requires Remediation"

**Sign-Off:**
- Compliance officer name, title, and signature (digital signature)
- Date of sign-off
- Statement: "I certify that all material statements made during [Event Name] have been reviewed for compliance with applicable regulations and approved for disclosure."

**Appendix:**
- List of regulations considered (JSE Listing Rules, IFRS, SEC Regulation FD, etc.)
- Company's disclosure policy summary
- Audit trail of compliance reviews (who reviewed, when, what action was taken)

### 4.2 Certificate Storage & Access

The Compliance Certificate is:

- Generated as a PDF and stored in S3
- Accessible from the post-event report "Compliance" tab
- Downloadable by authorized users (compliance officers, IR team, executives)
- Exportable for regulatory submission

---

## 5. Compliance Audit Log

### 5.1 Audit Log Page

A new page at `/compliance/audit-log` displays a comprehensive audit log of all compliance events across all events:

| Date | Event | Action | User | Details |
|---|---|---|---|---|
| 2026-03-10 | Q4 Earnings Call | Statement Flagged | System | "Revenue guidance" flagged as high risk |
| 2026-03-10 | Q4 Earnings Call | Statement Reviewed | John Smith | CEO guidance approved for disclosure |
| 2026-03-09 | Investor Day | Statement Rejected | Jane Doe | CFO comment on M&A rejected for disclosure |

### 5.2 Filtering & Export

The audit log supports filtering by:

- Date range
- Event
- Action (flagged, reviewed, approved, rejected, disclosed)
- User
- Risk level

The audit log can be exported to CSV or PDF for regulatory submission or internal audit.

---

## 6. Database Schema

### `compliance_flags`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `event_id` | int, FK conferences | |
| `statement_text` | text | Full text of the flagged statement |
| `timestamp` | time | When the statement was made (HH:MM:SS) |
| `speaker_name` | varchar(255) | Name of the speaker |
| `speaker_title` | varchar(255), nullable | Title/role of the speaker |
| `risk_level` | enum (low, medium, high) | AI-assessed risk level |
| `flag_reason` | text | Why the statement was flagged |
| `recommended_action` | text | Recommended action to ensure compliance |
| `regulation_violated` | varchar(255) | Which regulation is at risk |
| `compliance_status` | enum (flagged, reviewed, approved, rejected, disclosed) | Current status |
| `reviewed_by` | int, FK users, nullable | User who reviewed the statement |
| `reviewed_at` | timestamp, nullable | When the statement was reviewed |
| `review_notes` | text, nullable | Notes from the reviewer |
| `approved_by` | int, FK users, nullable | User who approved the statement |
| `approved_at` | timestamp, nullable | When the statement was approved |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `compliance_audit_log`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `event_id` | int, FK conferences | |
| `action` | enum (flagged, reviewed, approved, rejected, disclosed, certificate_generated) | Action taken |
| `user_id` | int, FK users, nullable | User who took the action (null if system action) |
| `details` | JSON | Additional details (e.g., review notes, rejection reason) |
| `created_at` | timestamp | |

### `compliance_certificates`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `event_id` | int, FK conferences | |
| `certificate_id` | varchar(50), unique | Unique certificate ID (e.g., CERT-2026-001) |
| `pdf_url` | varchar(500) | S3 URL to the PDF certificate |
| `generated_by` | int, FK users | User who generated the certificate |
| `generated_at` | timestamp | When the certificate was generated |
| `signed_by` | int, FK users, nullable | User who digitally signed the certificate |
| `signed_at` | timestamp, nullable | When the certificate was signed |
| `created_at` | timestamp | |

---

## 7. tRPC Procedures

| Procedure | Type | Auth | Description |
|---|---|---|---|
| `compliance.getFlaggedStatements` | query | protected | Returns all flagged statements for a given `eventId`. |
| `compliance.reviewStatement` | mutation | protected | Marks a statement as reviewed. Input: `statementId`, `reviewNotes`. |
| `compliance.approveStatement` | mutation | protected | Approves a statement for disclosure. Input: `statementId`. |
| `compliance.rejectStatement` | mutation | protected | Rejects a statement. Input: `statementId`, `rejectionReason`. |
| `compliance.generateComplianceCertificate` | mutation | protected | Generates a Compliance Certificate for an event. Input: `eventId`. Returns: certificate ID and PDF URL. |
| `compliance.getAuditLog` | query | protected | Returns compliance audit log entries. Input: `eventId` (optional), `dateRange` (optional), `action` (optional). |
| `compliance.signCertificate` | mutation | protected | Digitally signs a Compliance Certificate. Input: `certificateId`. |

---

## 8. Compliance Rules Engine

The LLM-based compliance flagging service is configurable to support different regulatory regimes:

- **JSE Listing Rules** — For JSE-listed companies
- **IFRS** — For companies following IFRS accounting standards
- **SEC Regulation FD** — For US-listed companies or those with US investors
- **Custom Policies** — Companies can define custom compliance rules

The compliance officer can select which regulations apply to their company in Settings.

---

## 9. Digital Signature & Non-Repudiation

Compliance Certificates are digitally signed by the compliance officer using a certificate-based digital signature (e.g., using the company's PKI infrastructure or a third-party signing service like DocuSign). This ensures non-repudiation: the compliance officer cannot deny having signed the certificate.

---

## 10. Regulatory Submission

The Compliance Certificate is designed to be submitted to regulators (e.g., JSE, SEC) as evidence of compliance. The certificate includes:

- Audit trail of all compliance reviews
- Sign-off by compliance officer
- List of material statements and their compliance status
- Timestamp and certificate ID for traceability

This allows the company to demonstrate that it has conducted a thorough compliance review and approved all material statements for disclosure.

---

## 11. Error Handling & Escalation

- **LLM Flagging Failure.** If the LLM fails to assess compliance risk, the statement is marked as "requires manual review" and escalated to the compliance officer.
- **Incomplete Review.** If a Compliance Certificate is requested but some statements are still pending review, the system prompts the user to complete all reviews before generating the certificate.
- **Regulatory Change.** If a new regulation is enacted, the compliance officer is notified and can re-assess previously approved statements.
