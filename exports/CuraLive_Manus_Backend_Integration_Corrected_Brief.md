# CuraLive — Corrective Backend Integration Brief for Manus

**Purpose:** The Manus frontend has 6 tabs. This document maps every tab to the EXACT tRPC routers, procedure names, and database tables that ALREADY EXIST in the Replit backend. Do NOT create new routers or tables — everything is already built. You only need to wire your frontend to these existing endpoints.

**Critical:** The tRPC base URL is `/api/trpc`. All procedure calls use the format `trpc.<routerName>.<procedureName>`. The backend uses tRPC v11 with superjson serialization.

---

## HOW tRPC WORKS IN THIS CODEBASE

```typescript
// Frontend client setup (already exists at client/src/lib/trpc.ts)
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../server/routers.eager';

export const trpc = createTRPCReact<AppRouter>();

// Usage in React components:
const { data } = trpc.shadowMode.listSessions.useQuery();
const mutation = trpc.shadowMode.startSession.useMutation();
```

The API endpoint pattern is:
- Queries: `GET /api/trpc/<router>.<procedure>?input=<encoded>`
- Mutations: `POST /api/trpc/<router>.<procedure>` with JSON body

---

## TAB 1: OVERVIEW

### Data Sources (all already exist)

**KPI Cards:**

| Metric | Router.Procedure | Return Type |
|--------|-----------------|-------------|
| Shadow Sessions (active) | `shadowMode.listSessions` | Filter result where `status === 'live'` and count |
| Shadow Sessions (stats) | `shadowMode.getOperatorStats` | `{ totalSessions, activeSessions, totalSegments, metricsGenerated }` |
| Events | `archiveUpload.listArchives` | Array — use `.length` for count |
| Billing KPIs | `billing.getDashboardKpis` | `{ totalClients, activeClients, mrr, totalOutstanding, overdueCount, ... }` |
| Recall Bots | Use `shadowMode.listSessions` and filter for sessions with `recallBotId !== null` and `status === 'live'` |

**Recent Sessions:**
```typescript
trpc.shadowMode.listSessions.useQuery()
// Returns: Array of { id, clientName, eventName, status, platform, startedAt, ... }
// Sort by startedAt DESC, take first 5
```

**Upcoming Events:**
```typescript
trpc.archiveUpload.listArchives.useQuery()
// Returns: Array of archive events
// Filter for future dates
```

**Session Activity Chart (7-day):**
```typescript
// Use shadowMode.listSessions and group by date client-side
// Or use analytics.getSessionEventAnalytics for per-session metrics
```

### Database Tables Used
- `shadow_sessions` — via `shadowMode` router
- `archive_events` — via `archiveUpload` router
- `billing_clients`, `billing_invoices` — via `billing` router

---

## TAB 2: SHADOW MODE

This is the most complex tab. ALL endpoints already exist.

### Sub-tab: Live Intelligence

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| List all sessions | `shadowMode.listSessions` | none | `ShadowSession[]` |
| Get session detail | `shadowMode.getSession` | `{ id: number }` | Full session with transcript, metrics |
| Start session (Recall bot) | `shadowMode.startSession` | `{ meetingUrl, platform, clientName, eventName, eventType }` | `{ sessionId, recallBotId }` |
| End session | `shadowMode.endSession` | `{ sessionId: number }` | Triggers AI report generation |
| Push local transcript | `shadowMode.pushTranscriptSegment` | `{ sessionId, speaker, text, startMs, endMs }` | `{ segmentId }` |
| Delete session | `shadowMode.deleteSession` | `{ sessionId: number }` | `{ success }` |
| Delete multiple | `shadowMode.deleteSessions` | `{ sessionIds: number[] }` | `{ deleted }` |
| Get operator stats | `shadowMode.getOperatorStats` | none | `{ totalSessions, activeSessions, ... }` |
| Export session | `shadowMode.exportSession` | `{ sessionId }` | `{ downloadUrl }` |
| Get handoff package | `shadowMode.getHandoffPackage` | `{ sessionId }` | Full intelligence package |
| Add note | `shadowMode.addNote` | `{ sessionId, content, category }` | `{ noteId }` |
| Get notes | `shadowMode.getNotes` | `{ sessionId }` | `Note[]` |
| Get action log | `shadowMode.getActionLog` | `{ sessionId }` | `ActionLogEntry[]` |

**Platform values:** `"zoom"`, `"teams"`, `"meet"`, `"webex"`, `"local"` (for local audio capture)

**Session statuses:** `"pending"`, `"joining"`, `"live"`, `"processing"`, `"completed"`, `"error"`, `"cancelled"`

### Sub-tab: Archive Upload

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| Upload & process | `archiveUpload.processTranscript` | `{ eventName, eventType, clientName, transcript, platform }` | `{ archiveId, status }` |
| Check job status | `archiveUpload.getJobStatus` | `{ jobId }` | `{ status, progress }` |
| Get archive stats | `archiveUpload.getArchiveStats` | none | `{ totalArchives, totalWords, avgSentiment }` |
| List all archives | `archiveUpload.listArchives` | none | `ArchiveEvent[]` |
| Get archive detail | `archiveUpload.getArchiveDetail` | `{ id }` | Full archive with report |

### Sub-tab: Archives & Reports

```typescript
trpc.archiveUpload.listArchives.useQuery()
// Returns all completed archive events
// Each has: id, eventName, clientName, eventType, platform, status,
//           overallSentiment, complianceFlags, createdAt, fingerprint
```

### Sub-tab: AI Dashboard

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| AI content stats | `aiDashboard.getStats` | `{ eventId }` | `{ total, generated, approved, rejected, sent }` |
| AI event content | `aiDashboard.getEventContent` | `{ eventId }` | Content items array |
| Generate content | `aiDashboard.generateContent` | `{ eventId, type, ... }` | Generated content |

For real-time session metrics (sentiment, compliance, topics):
```typescript
trpc.shadowMode.getSession.useQuery({ id: sessionId })
// The session object contains: averageSentiment, complianceFlags
// Tagged metrics are in the taggedMetrics router:
trpc.taggedMetrics.getBySession.useQuery({ sessionId })
```

### Sub-tab: AI Learning

```typescript
trpc.aiEvolution.getObservations.useQuery()
// Returns AI evolution observations (learning data)
// Also: trpc.aiEvolution.getMaturityAssessment.useQuery()
```

### Sub-tab: AI Advisory

```typescript
trpc.advisoryBot.chat.useMutation()
// Input: { message: string, sessionId?: number }
// Returns: AI advisory response
```

### Sub-tab: Live Q&A

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| Create Q&A session | `liveQa.createSession` | `{ eventName, shadowSessionId? }` | `{ sessionId, accessCode }` |
| List Q&A sessions | `liveQa.listSessions` | none | `Session[]` |
| Get session | `liveQa.getSession` | `{ sessionId }` | Session with config |
| List questions | `liveQa.listQuestions` | `{ sessionId }` | `Question[]` |
| Update question status | `liveQa.updateQuestionStatus` | `{ questionId, status, reason? }` | `{ success }` |
| Submit answer | `liveQa.submitAnswer` | `{ questionId, answerText }` | `{ success }` |
| Generate AI draft | `liveQa.generateDraft` | `{ questionId }` | `{ draft, reasoning }` |
| Go live | `liveQa.goLive` | `{ sessionId }` | `{ success }` |
| Get compliance flags | `liveQa.getComplianceFlags` | `{ sessionId }` | `ComplianceFlag[]` |
| Bulk action | `liveQa.bulkAction` | `{ questionIds, action }` | `{ affected }` |

**Question statuses:** `"pending"`, `"approved"`, `"answered"`, `"rejected"`, `"deferred"`, `"flagged"`

### Sub-tab: System Test

```typescript
trpc.systemDiagnostics.runDiagnostics.useMutation()
// Returns diagnostic results for all system components
trpc.systemDiagnostics.getStatus.useQuery()
// Returns current system health status
```

---

## TAB 3: EVENTS

### Data Sources

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| List all events | `archiveUpload.listArchives` | none | `ArchiveEvent[]` |
| Get event detail | `archiveUpload.getArchiveDetail` | `{ id }` | Full event with report |
| Start shadow session | `shadowMode.startSession` | `{ meetingUrl, platform, clientName, eventName, eventType }` | `{ sessionId }` |

For webcast events specifically:
```typescript
trpc.webcast.listEvents.useQuery()
// Returns webcast events with: id, slug, title, status, scheduledAt, etc.
```

For the main events table:
```typescript
trpc.events.getEvent.useQuery({ eventId: "..." })
trpc.events.upsertEvent.useMutation()
// Input: { eventId, title, company, platform, status, accessCode? }
```

**Event types:** `"earnings_call"`, `"agm"`, `"investor_day"`, `"board_meeting"`, `"roadshow"`, `"ipo"`, `"capital_raise"`, `"special_event"`

**Event statuses:** `"upcoming"`, `"live"`, `"completed"`

**Platforms:** `"zoom"`, `"teams"`, `"meet"`, `"webex"`, `"phone"`, `"local"`

### Database Tables
- `archive_events` — historical processed events
- `events` — core event records
- `webcast_events` — webcast-specific events
- `shadow_sessions` — linked to events for intelligence

---

## TAB 4: PARTNERS

### Data Sources

Partners/contacts are managed through the **mailing list** system and **billing client contacts**.

**IR Contacts / Mailing Lists:**

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| Get all mailing lists | `mailingList.getLists` | none | `MailingList[]` |
| Get list with contacts | `mailingList.getList` | `{ id }` | List with entries |
| Create new list | `mailingList.create` | `{ name, description }` | `{ id }` |
| Import CSV contacts | `mailingList.importCSV` | `{ listId, csvData }` | `{ imported, skipped }` |
| Send invitations | `mailingList.sendInvitations` | `{ listId, eventSlug, ... }` | `{ sent }` |
| Delete list | `mailingList.deleteList` | `{ id }` | `{ success }` |
| Delete entry | `mailingList.deleteEntry` | `{ id }` | `{ success }` |

**Billing Client Contacts (enterprise partners):**

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| List clients | `billing.getClients` | none | `BillingClient[]` |
| Get client detail | `billing.getClient` | `{ id }` | Client + contacts + quotes + invoices |
| Add contact | `billing.addContact` | `{ clientId, name, email, role, phone? }` | `{ contactId }` |
| Update contact | `billing.updateContact` | `{ id, name?, email?, role?, phone? }` | `{ success }` |
| Delete contact | `billing.deleteContact` | `{ id }` | `{ success }` |

**Partner Bookings (specific partners):**
```typescript
trpc.bastionBooking.listBookings.useQuery()  // Bastion Capital
trpc.lumiBooking.listBookings.useQuery()     // Lumi
```

**CRM / API Partners:**
```typescript
trpc.crmApi.listApiKeys.useQuery()
trpc.crmApi.registerPartner.useMutation()
```

### Database Tables
- `ir_contacts` — investor relations contacts
- `billing_clients` — enterprise client companies
- `billing_client_contacts` — multiple contacts per client
- `white_label_clients` — branded portal partners
- `bastion_bookings` — Bastion partner bookings
- `lumi_bookings` — Lumi partner bookings

---

## TAB 5: BILLING

### Data Sources — ALL EXIST in `billing` router

**Dashboard KPIs:**
```typescript
trpc.billing.getDashboardKpis.useQuery()
// Returns: { totalClients, activeClients, mrr, totalOutstanding,
//            overdueCount, quotesAcceptedThisMonth, ... }
```

**Clients:**

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| List all clients | `billing.getClients` | none | `BillingClient[]` |
| Get client detail | `billing.getClient` | `{ id }` | Client + contacts + quotes + invoices |
| Create client | `billing.createClient` | `{ name, tradingAs?, registrationNumber?, vatNumber?, address?, ... }` | `{ clientId }` |
| Update client | `billing.updateClient` | `{ id, ...fields }` | `{ success }` |

**Client fields:** `name`, `tradingAs`, `registrationNumber`, `vatNumber`, `billingEmail`, `address`, `city`, `country`, `postalCode`, `currency`, `paymentTermsDays`, `status` (`"prospect"`, `"active"`, `"inactive"`, `"suspended"`)

**Invoices:**

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| List invoices | `billing.getInvoices` | `{ clientId? }` | `Invoice[]` |
| Get invoice detail | `billing.getInvoice` | `{ id }` | Invoice + line items + payments + credits |
| Send invoice | `billing.sendInvoice` | `{ invoiceId }` | `{ success, emailSent }` |
| Record payment | `billing.recordPayment` | `{ invoiceId, amount, method, reference?, paidAt? }` | `{ paymentId }` |
| Mark overdue | `billing.markOverdueInvoices` | none | `{ markedCount }` |
| Send reminder | `billing.sendPaymentReminder` | `{ invoiceId }` | `{ success }` |
| Create credit note | `billing.createCreditNote` | `{ invoiceId, amount, reason }` | `{ creditNoteId }` |
| Ageing report | `billing.getAgeingReport` | none | Ageing breakdown |

**Invoice statuses:** `"draft"`, `"sent"`, `"viewed"`, `"paid"`, `"partially_paid"`, `"overdue"`, `"cancelled"`, `"credited"`

**Quotes:**

| Action | Router.Procedure | Input | Returns |
|--------|-----------------|-------|---------|
| List quotes | `billing.getQuotes` | `{ clientId? }` | `Quote[]` |
| Get quote detail | `billing.getQuote` | `{ id }` | Quote + line items + versions + log |
| Create quote | `billing.createQuote` | `{ clientId, validUntil, notes?, lineItems[] }` | `{ quoteId, quoteNumber }` |
| Update quote | `billing.updateQuote` | `{ id, ...fields, lineItems? }` | `{ success }` |
| Send quote | `billing.sendQuote` | `{ quoteId }` | `{ success }` |
| Convert to invoice | `billing.convertToInvoice` | `{ quoteId }` | `{ invoiceId }` |

**Quote statuses:** `"draft"`, `"sent"`, `"viewed"`, `"accepted"`, `"rejected"`, `"expired"`, `"invoiced"`

**Line Item Templates:**
```typescript
trpc.billing.getLineItemTemplates.useQuery()
trpc.billing.createLineItemTemplate.useMutation()
trpc.billing.useTemplate.useMutation({ templateId })
```

**Recurring Templates:**
```typescript
trpc.billing.getRecurringTemplates.useQuery()
trpc.billing.createRecurringTemplate.useMutation()
trpc.billing.generateFromRecurringTemplate.useMutation({ templateId })
```

**Activity Log:**
```typescript
trpc.billing.getActivityLog.useQuery({ clientId?, limit? })
// Returns timestamped audit trail of all billing actions
```

### Database Tables (ALL EXIST)
- `billing_clients`
- `billing_client_contacts`
- `billing_quotes`
- `billing_quote_versions`
- `billing_invoices`
- `billing_line_items`
- `billing_payments`
- `billing_credit_notes`
- `billing_fx_rates`
- `billing_activity_log`
- `billing_line_item_templates`
- `billing_email_events`
- `billing_recurring_templates`

---

## TAB 6: SETTINGS

### Data Sources

**User Profile / Preferences:**
```typescript
trpc.profile.get.useQuery()
// Returns: { id, name, email, role, jobTitle, organisation, bio,
//            avatarUrl, phone, linkedinUrl, timezone }

trpc.profile.update.useMutation()
// Input: { name?, jobTitle?, organisation?, bio?, phone?, linkedinUrl?, timezone? }

trpc.profile.uploadAvatar.useMutation()
// Input: { base64, mimeType }
```

**API Keys Section:**
API keys are environment variables/secrets — they should be displayed masked and managed via the settings UI. The backend reads them from `process.env`. Do NOT create a settings table — keys are:
- `RECALL_AI_API_KEY` — Recall.ai
- `ABLY_API_KEY` — Ably real-time
- OpenAI is accessed via Replit's built-in AI proxy (no key needed)

To check which services are configured:
```typescript
trpc.system.getStatus.useQuery()
// Returns system status including which services are active
```

**Branding / Customisation:**
```typescript
trpc.branding.getBranding.useQuery({ eventId })
trpc.branding.saveBranding.useMutation()
// Input: { eventId, primaryColor, secondaryColor, logoUrl, ... }

trpc.customisation.getCustomisation.useQuery({ eventId })
trpc.customisation.saveCustomisation.useMutation()
```

**System Diagnostics:**
```typescript
trpc.systemDiagnostics.runDiagnostics.useMutation()
trpc.systemDiagnostics.getStatus.useQuery()
```

**RBAC (Role-Based Access):**
```typescript
trpc.rbac.getRoles.useQuery()
trpc.rbac.assignRole.useMutation()
// For managing operator/admin roles
```

**Auth:**
```typescript
trpc.auth.me.useQuery()
// Returns current user: { id, name, email, role }
// In dev mode returns: { id: 0, name: 'Dev Operator', role: 'operator' }

trpc.auth.logout.useMutation()
```

---

## COMPLETE ROUTER REGISTRY

These are ALL the registered router names in `server/routers.eager.ts`. Use these exact names as the first part of any tRPC call (`trpc.<name>.<procedure>`):

```
system, occ, liveVideo, roadshowAI, branding, webcast, recall, mux,
billing, ai, webphone, customisation, trainingMode, postEventReport,
transcription, polls, scheduling, clientPortal, compliance, followups,
sentiment, mobileNotifications, aiDashboard, aiFeatures, analytics,
contentTriggers, eventBrief, liveRollingSummary, transcriptEditor,
aiApplications, socialMedia, interconnectionAnalytics, virtualStudio,
operatorLinks, agenticBrain, autonomousIntervention, taggedMetrics,
shadowMode, archiveUpload, benchmarks, marketReaction, communicationIndex,
investorQuestions, intelligenceReport, callPrep, intelligenceTerminal,
bot, mailingList, healthGuardian, crmApi, supportChat, soc2, iso27001,
adaptiveIntelligence, sustainability, broadcaster, conferenceDialout,
agmGovernance, lumiBooking, bastionBooking, evasiveAnswer,
marketImpactPredictor, multiModalCompliance, externalSentiment,
personalizedBriefing, materialityRisk, investorIntent,
crossEventConsistency, volatilitySimulator, regulatoryIntervention,
eventIntegrity, crisisPrediction, valuationImpact, disclosureCertificate,
monthlyReport, advisoryBot, evolutionAudit, systemDiagnostics, liveQa,
platformEmbed, investorEngagement, liveSubtitle, ipoMandA,
complianceEngine, aiAm, rbac, aiEvolution, persistence, aiAmPhase2,
restBridge, session, archive, bridgeConsole,
admin, team, auth, profile, ably, events
```

---

## THINGS MANUS MUST NOT DO

1. **Do NOT create new routers** — Every endpoint listed in your original brief already exists. Wire to the existing ones.

2. **Do NOT create new database tables** — All tables exist. The billing system alone has 13 tables. The schema is in `drizzle/schema.ts`.

3. **Do NOT create an `overview` router** — The overview tab aggregates data from `shadowMode`, `archiveUpload`, `billing`, and `analytics` routers.

4. **Do NOT create a `partners` router** — Partners data comes from `mailingList`, `billing` (client contacts), `bastionBooking`, `lumiBooking`, and `crmApi` routers.

5. **Do NOT create a `settings` router** — Settings come from `profile`, `branding`, `customisation`, `systemDiagnostics`, and `rbac` routers.

6. **Do NOT create an `events` router** — Events come from `archiveUpload.listArchives`, `webcast.listEvents`, and the inline `events` router in `routers.eager.ts`.

7. **Do NOT use `routers.ts`** — The server imports from `routers.eager.ts`. If you only register in `routers.ts`, procedures will return "not found".

8. **`getDb()` is ASYNC** — Always `await getDb()`. Forgetting `await` returns a Promise, not a db instance.

---

## AUTHENTICATION

In development mode (`NODE_ENV=development`), all `operatorProcedure` endpoints auto-bypass authentication and use a dev user:
```javascript
{ id: 0, name: 'Dev Operator', email: 'dev@curalive.local', role: 'operator' }
```

No login is needed during development. The auth check is handled server-side in `server/_core/trpc.ts`.

For production, users authenticate via session cookies. The `trpc.auth.me` query returns the current user or null.

---

## QUICK-START CHECKLIST FOR MANUS

1. Set up tRPC client pointing to `/api/trpc` with superjson transformer
2. For OVERVIEW tab: call `shadowMode.getOperatorStats`, `billing.getDashboardKpis`, `archiveUpload.listArchives`, `shadowMode.listSessions`
3. For SHADOW MODE tab: call `shadowMode.*` procedures for all sub-tabs
4. For EVENTS tab: call `archiveUpload.listArchives` and `webcast.listEvents`
5. For PARTNERS tab: call `mailingList.getLists`, `billing.getClients`
6. For BILLING tab: call `billing.*` procedures (everything is there)
7. For SETTINGS tab: call `profile.get`, `systemDiagnostics.getStatus`
8. Test with: `curl http://localhost:3000/api/trpc/shadowMode.listSessions` (should return JSON)

---

*End of corrective brief.*
