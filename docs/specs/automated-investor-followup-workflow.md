---
REPLIT SUMMARY — copy and paste this block into the Replit chat
---
Feature: Automated Investor Follow-Up Workflow
Route(s): /post-event/:eventId/followups, /post-event/:eventId/followups/:followupId
Priority: high
Depends on: Post-Event AI Report (implemented), AI Transcription (partial), Recall.ai Bot Recording (implemented)
What to build:
- Add a new "Follow-Ups" tab to the post-event report (/post-event/:eventId/followups) displaying a list of investor follow-ups extracted from the event transcript and Q&A, grouped by investor, with status tracking (pending, contacted, resolved)
- Create a server-side follow-up extraction service that processes the event transcript and Q&A submissions post-event, uses the LLM to extract investor contact info (name, company, email if available) and follow-up commitments/action items, and deduplicates investors across multiple Q&A submissions
- Add Salesforce/HubSpot integration: for each investor, check if they exist in the CRM; if yes, log the follow-up activity; if no, create a new contact record with extracted info
- Generate pre-filled follow-up email templates for each investor with: greeting, summary of their question, commitment made by the company, next steps, and a signature block
- Add a UI for IR team to review, edit, and send follow-up emails directly from CuraLive; track email send status and delivery
DB changes needed: yes — add investor_followups table (id, event_id FK, investor_name, investor_email, investor_company, question_text, commitment_text, follow_up_status enum, crm_contact_id, crm_activity_id, email_template, email_sent_at, created_at) and followup_emails table (id, followup_id FK, email_body, recipient_email, sent_at, opened_at, clicked_at)
New tRPC procedures: yes — followups.getFollowupsByEvent (query, protected), followups.sendFollowupEmail (mutation, protected), followups.updateFollowupStatus (mutation, protected), followups.syncToCRM (mutation, protected)
New pages/routes: yes — /post-event/:eventId/followups (follow-ups tab in post-event report)
---

# Automated Investor Follow-Up Workflow — Full Specification

## 1. Overview

After an earnings call or investor day, the IR team must manually track investor follow-ups, commitments, and action items. This is error-prone and time-consuming. The Automated Investor Follow-Up Workflow extracts investor contact information and follow-up commitments from the event transcript and Q&A, deduplicates investors, and generates pre-filled follow-up email templates. The IR team can then review, edit, and send emails directly from CuraLive, with automatic CRM integration (Salesforce/HubSpot) to log activities.

---

## 2. Follow-Up Extraction Pipeline

### 2.1 Data Sources

Follow-ups are extracted from two sources:

1. **Event Transcript** — Commitments made by company speakers (e.g., "We will send you the detailed financials by Friday")
2. **Q&A Submissions** — Questions asked by investors and any commitments made in response

### 2.2 Extraction Process

Immediately after the event ends (or on-demand), the follow-up extraction service executes the following steps:

**Step 1 — Fetch Event Data.** Retrieve the full event transcript, Q&A submissions, and attendee list.

**Step 2 — Extract Investor Info.** For each Q&A submission, use the LLM to extract:

- Investor name (from Q&A submission metadata or inferred from question context)
- Investor company (if mentioned in the question)
- Investor email (if provided in Q&A form; if not, attempt to infer from company domain)
- Question text
- Any commitment made by the company in response

Use the following LLM prompt:

```
Extract the following from this Q&A submission:
- investor_name: string (name of the person asking)
- investor_company: string (company name if mentioned)
- investor_email: string (email if provided; otherwise null)
- question_text: string (the full question)
- commitment_text: string (any commitment made by the company in response; null if none)

Q&A: [Q&A text]

Respond in JSON format.
```

**Step 3 — Deduplicate Investors.** Group Q&A submissions by investor name and company. If the same investor asked multiple questions, consolidate their follow-ups into a single record with all questions and commitments.

**Step 4 — Extract Commitments from Transcript.** Scan the event transcript for explicit commitments (e.g., "We will send..."). For each commitment, use the LLM to determine which investor(s) it applies to based on context.

**Step 5 — Create Follow-Up Records.** For each unique investor, create a record in the `investor_followups` table with their contact info, questions, and commitments.

**Step 6 — Sync to CRM.** For each investor, check if they exist in the connected CRM (Salesforce or HubSpot). If yes, log the follow-up activity. If no, create a new contact record.

**Step 7 — Generate Email Templates.** For each follow-up, generate a pre-filled email template (see section 2.3).

### 2.3 Email Template Generation

For each investor follow-up, generate a pre-filled email template with the following structure:

```
Subject: Follow-Up from [Event Name] — [Company Name]

Dear [Investor Name],

Thank you for your participation in [Event Name] on [Date]. We appreciated your question regarding [Question Summary].

As committed during the event, [Commitment Text]. We will ensure this is completed by [Estimated Completion Date].

If you have any additional questions or require further information, please don't hesitate to reach out.

Best regards,
[Sender Name]
[Sender Title]
[Company Name]
[Contact Info]
```

The template is editable by the IR team before sending.

---

## 3. Follow-Up Dashboard

### 3.1 Follow-Ups Tab in Post-Event Report

A new "Follow-Ups" tab in the post-event report displays a list of investor follow-ups with the following columns:

| Investor | Company | Question | Commitment | Status | Email Sent | Actions |
|---|---|---|---|---|---|---|
| John Smith | Acme Corp | Will you expand into Asia? | Yes, by Q3 2026 | Pending | — | Send Email, Edit, Mark Resolved |
| Jane Doe | TechVentures | What is your R&D budget? | Will provide details | Contacted | 2026-03-09 | View Email, Resend, Mark Resolved |

### 3.2 Status Tracking

Each follow-up has a status:

- **Pending** — Follow-up created, email not yet sent
- **Contacted** — Email sent to investor
- **Resolved** — Commitment fulfilled or investor marked as resolved

The IR team can manually update the status.

### 3.3 Email Tracking

When an email is sent, CuraLive tracks:

- Email send timestamp
- Email open timestamp (if the email service supports open tracking)
- Link click timestamp (if the email service supports click tracking)

This data is displayed in the follow-up list and is synced to the CRM.

---

## 4. CRM Integration

### 4.1 Supported CRMs

CuraLive integrates with:

- **Salesforce** — Via REST API
- **HubSpot** — Via REST API

### 4.2 Sync Logic

For each investor follow-up:

1. **Check if Contact Exists.** Query the CRM for a contact with the investor's email or name + company.
2. **If Contact Exists.** Log the follow-up as an activity on the contact record with the following fields:
   - Activity type: "Earnings Call Follow-Up"
   - Subject: Investor's question
   - Description: Commitment made
   - Due date: Estimated commitment completion date
3. **If Contact Does Not Exist.** Create a new contact record with:
   - First name, last name (parsed from investor name)
   - Company name
   - Email
   - Phone (if available)
   - Custom field: "Event Attended" = [Event Name]
   - Log the follow-up as an activity on the new contact

### 4.3 Configuration

The IR team configures CRM integration in Settings:

- Select CRM (Salesforce or HubSpot)
- Provide API credentials (OAuth token)
- Map CuraLive fields to CRM fields (e.g., investor_company → Account Name)

---

## 5. Database Schema

### `investor_followups`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `event_id` | int, FK conferences | |
| `investor_name` | varchar(255) | Full name of investor |
| `investor_email` | varchar(255), nullable | Email address |
| `investor_company` | varchar(255), nullable | Company name |
| `question_text` | text | The investor's question |
| `commitment_text` | text, nullable | Commitment made by the company |
| `follow_up_status` | enum (pending, contacted, resolved) | Current status |
| `crm_contact_id` | varchar(255), nullable | ID of contact record in CRM |
| `crm_activity_id` | varchar(255), nullable | ID of activity record in CRM |
| `email_template` | text, nullable | Pre-filled email template |
| `email_sent_at` | timestamp, nullable | When the email was sent |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `followup_emails`

| Column | Type | Notes |
|---|---|---|
| `id` | int, PK, auto-increment | |
| `followup_id` | int, FK investor_followups | |
| `email_body` | text | Full email body sent |
| `recipient_email` | varchar(255) | Recipient email address |
| `sent_at` | timestamp | When email was sent |
| `opened_at` | timestamp, nullable | When email was opened (if tracked) |
| `clicked_at` | timestamp, nullable | When a link in email was clicked (if tracked) |
| `created_at` | timestamp | |

---

## 6. tRPC Procedures

| Procedure | Type | Auth | Description |
|---|---|---|---|
| `followups.getFollowupsByEvent` | query | protected | Returns all follow-ups for a given `eventId`. |
| `followups.sendFollowupEmail` | mutation | protected | Sends a follow-up email to an investor. Input: `followupId`, `emailBody`. Returns: email send status. |
| `followups.updateFollowupStatus` | mutation | protected | Updates the status of a follow-up. Input: `followupId`, `status`. |
| `followups.syncToCRM` | mutation | protected | Syncs a follow-up to the connected CRM. Input: `followupId`. Returns: CRM contact ID and activity ID. |
| `followups.getFollowupEmail` | query | protected | Retrieves the email body and tracking data for a sent email. Input: `emailId`. |

---

## 7. Email Sending

Follow-up emails are sent via the Resend email service (already integrated in CuraLive). The email includes:

- Pre-filled template with investor name, question, and commitment
- Editable by the IR team before sending
- Tracking pixel for open tracking
- Click tracking on links
- Unsubscribe link (required for compliance)

---

## 8. Error Handling

- **LLM Extraction Failure.** If the LLM fails to extract investor info from a Q&A, the follow-up is marked as "requires manual review" and the IR team is notified.
- **CRM Sync Failure.** If CRM sync fails, the follow-up is marked as "sync pending" and can be retried manually.
- **Email Send Failure.** If email send fails, the IR team is notified and can retry.

---

## 9. Compliance & Privacy

- **GDPR Compliance.** Investor email addresses are stored securely and are not shared with third parties without consent.
- **Unsubscribe.** All follow-up emails include an unsubscribe link. If an investor unsubscribes, their email is marked as "do not contact" and future emails are not sent.
- **Data Retention.** Follow-up records are retained for 2 years, then archived.
