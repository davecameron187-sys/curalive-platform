# CuraLive Product Roadmap

**Last Updated**: March 9, 2026  
**Status**: Active  
**Philosophy**: Launch lean, earn revenue, expand with customers.

---

## What We Have Today (Platform Foundation — Complete)

All 25 core features are live and functional. The platform is production-ready for investor events.

### Core Infrastructure
| Feature | Route | Status |
|---|---|---|
| OCC Operator Console | `/occ` | Live |
| Training Mode Console | `/training-mode` | Live |
| Operator Analytics | `/operator/analytics` | Live |
| Development Dashboard | `/dev-dashboard` | Live |
| AI Features Status | `/ai-features` | Live |
| Live Webcasting | `/live-video/webcast/*` | Live |
| Roadshow Suite | `/live-video/roadshow/*` | Live |
| Enterprise Billing | `/billing` | Live |
| Recall.ai Bot Recording | — | Live |
| Mux Live Streaming | — | Live |
| Ably Real-Time Channels | — | Live |
| Twilio/Telnyx Webphone | — | Live |

### Spec-Delivered Features (9 features, all complete)
| Feature | Route | Status |
|---|---|---|
| Post-Event AI Report (8 tabs) | `/post-event/:eventId` | Live |
| Real-Time Investor Sentiment Dashboard | `/operator/:eventId/sentiment` | Live |
| Automated Investor Follow-Up Workflow | `/post-event/:eventId/followups` | Live |
| Compliance Audit Trail & Regulatory Reporting | `/compliance/audit-log` | Live |
| Complete AI Transcription + TranscriptViewer | `/post-event/:id/transcript` | Live |
| White-Label Client Portal | `/portal/:clientSlug` | Live |
| Attendee Mobile Experience | `/m/:eventId` | Live |
| Live Polling & Audience Interaction | (embedded) | Live |
| Event Scheduling & Calendar | `/events/schedule`, `/events/calendar` | Live |

---

## Roadmap — Budget-First Approach

The roadmap below is sequenced by **revenue impact vs. development cost**. Everything in Phase 1 and 2 can be done on a very small budget. Phases 3 and 4 are funded by early customer revenue.

---

## Phase 1 — Launch-Ready Hardening (Before First Customer)
**Goal**: Make the platform trustworthy enough to hand to a paying customer.  
**Estimated effort**: 3–4 weeks  
**Cost**: Low (no new features — fixes and polish)

### 1.1 Error Monitoring & Alerting
Set up Sentry (free tier) for frontend + backend. Right now errors are silent. Before launching with real customers you need to know when things break.
- Integrate Sentry SDK into Express and React
- Add error boundaries to all pages
- Alert on 500 errors and tRPC exceptions
- **Effort**: 2–3 days

### 1.2 Rate Limiting & Basic Security
Prevent abuse on public-facing endpoints without a full security audit.
- Add `express-rate-limit` to `/api/*` routes (especially registration, auth, Q&A submission)
- Sanitize all tRPC inputs with Zod (already using Zod — ensure all public inputs are validated)
- Disable verbose error messages in production
- **Effort**: 1–2 days

### 1.3 Email Delivery (Required for Follow-Up Workflow)
The investor follow-up feature sends emails but needs a real sender configured.
- Connect Resend (free tier: 3,000 emails/month) or SendGrid
- Add `RESEND_API_KEY` or `SENDGRID_API_KEY` environment variable
- Verify domain + configure SPF/DKIM for deliverability
- **Effort**: 1 day

### 1.4 Production Auth Enforcement
Confirm `AUTH_BYPASS=false` is set as a deployment environment variable. Verify operator/admin role gates are in place on all sensitive routes.
- **Effort**: Half a day

### 1.5 Basic Performance Baseline
Before customer demos, test the platform under real load.
- Run k6 or Artillery against key endpoints (OCC, Ably, tRPC)
- Identify and fix any slow queries (add DB indexes where missing)
- Test with 50–100 concurrent simulated participants
- **Effort**: 2–3 days

---

## Phase 2 — First Customers (Months 1–3)
**Goal**: Win 3–5 paying clients. Add the features that close deals without building anything speculative.  
**Estimated effort**: 6–8 weeks total  
**Cost**: Low — targeted builds with direct revenue justification

### 2.1 Slack & Microsoft Teams Notifications ⭐ High Value
Operators live in Slack/Teams. Routing OCC alerts, Q&A notifications, and sentiment spikes there is a quick win that feels premium.
- Build a Slack webhook integration (no bot needed — just incoming webhooks)
- Add notification config UI in operator settings
- Cover: event start/end, Q&A queue alerts, sentiment spikes, compliance flags
- **Effort**: 2–3 weeks
- **Revenue signal**: Directly mentioned by enterprise buyers

### 2.2 Google Calendar / Outlook / iCal Export
The scheduling module is built. Letting attendees and operators add events to their calendar closes the loop.
- Generate `.ics` files from `event_schedules`
- Add "Add to Calendar" buttons on event pages and confirmation emails
- **Effort**: 3–4 days
- **Revenue signal**: Attendee satisfaction, fewer no-shows

### 2.3 Material Statement Detection (SEC/FINRA Compliance Extension)
The compliance module already flags statements. Extending it to classify specifically as "material" per SEC guidance is a meaningful upgrade for financial services customers — and differentiates from competitors.
- Enhance the Forge AI prompt in `compliance.ts` to classify against SEC Regulation FD
- Add "Material / Forward-Looking / Safe Harbour" labels to compliance flags
- Generate a Regulation FD disclosure summary document
- **Effort**: 1–2 weeks
- **Revenue signal**: Required for any US-listed company customer

### 2.4 Operator Workload Automation (Q&A Auto-Routing)
Reduce operator stress. Auto-approve low-risk Q&A questions and suggest routing for complex ones.
- Add a moderation rules engine: if question passes toxicity check and is on-topic, auto-approve
- Surface AI-suggested routing ("Best suited for CFO") in the OCC Q&A queue
- **Effort**: 1–2 weeks
- **Revenue signal**: Reduces headcount needed per event — direct cost saving for customers

### 2.5 White-Label Reseller Onboarding Flow
The white-label portal is built. Make it self-service so resellers can onboard without developer help.
- Add a guided setup flow: create client → brand it → assign events → share link
- Add logo upload with CDN storage
- Send welcome email to new portal clients
- **Effort**: 1 week
- **Revenue signal**: Enables agency/reseller revenue channel

---

## Phase 3 — Revenue-Funded Growth (Months 4–9)
**Goal**: Use first customer revenue to fund features that open new market segments.  
**Estimated effort**: 12–16 weeks  
**Cost**: Medium — funded by MRR

### 3.1 Salesforce & HubSpot CRM Integration
The investor follow-up workflow supports mock CRM sync. Replace it with real bi-directional Salesforce and HubSpot integration.
- OAuth-based connection flow per account
- Sync attendees, Q&A interactions, and follow-up status to CRM contacts
- Pull CRM contact data into the attendee registration UI
- **Effort**: 5–6 weeks
- **Revenue signal**: Blocker for US enterprise deals (>$100K/year contracts)

### 3.2 Zapier / Make.com Integration
The single feature that turns CuraLive into a platform instead of a product. Customers connect it to their existing stack without developer work.
- Build a Zapier app with 8–10 triggers (event started, Q&A submitted, transcript ready, report generated, etc.)
- Expose the same triggers as webhooks for Make.com / n8n
- **Effort**: 3–4 weeks
- **Revenue signal**: Reduces churn by embedding CuraLive in customer workflows

### 3.3 Predictive Q&A Routing with AI Preparation
Before an event, an AI analyses historical Q&A from similar companies to predict the most likely questions and suggest talking-point preparation for executives.
- Parse historical Q&A data from `qa_questions` table by industry/event type
- Use Forge AI to generate likely questions + suggested answers
- Deliver as a pre-event briefing document
- **Effort**: 4–5 weeks
- **Revenue signal**: Premium feature — IR teams will pay for this specifically

### 3.4 Competitive Intelligence Extraction
During live events, auto-detect competitor mentions and summarise competitive positioning.
- Extend the live transcription pipeline with named-entity recognition for competitor company names
- Build a competitive mentions timeline in the post-event report
- Generate a weekly competitive intelligence digest
- **Effort**: 3–4 weeks
- **Revenue signal**: Strategy teams pay separately for this ($50K+/year premium add-on)

### 3.5 Investor Behavior Analytics Dashboard
Attendees already generate engagement data. Surface it meaningfully.
- Track: join time, drop-off point, questions submitted, polls voted, replay watched
- Build a per-investor engagement profile
- Score investors by engagement level (hot/warm/cold) for follow-up prioritisation
- **Effort**: 4–5 weeks
- **Revenue signal**: IR teams want to know which investors are most engaged

### 3.6 Public Event Marketplace (Viral Growth Channel)
Allow companies to list public investor events on a discovery page. Investors find events they care about. CuraLive gets organic growth.
- Build a public `/events` discovery page (opt-in per event)
- Attendee one-click registration from the marketplace
- Share-to-LinkedIn/Twitter buttons on event pages
- **Effort**: 4–6 weeks
- **Revenue signal**: Drives inbound leads — organic top-of-funnel

---

## Phase 4 — Enterprise Scale (Year 2+)
**Goal**: Unlock regulated verticals and large enterprise contracts.  
**Estimated effort**: 6–12 months  
**Cost**: High — requires dedicated engineering investment

These features require significant investment but unlock $250K–$1M+ contracts. Only pursue once MRR is stable.

| Feature | Effort | Unlocks |
|---|---|---|
| SOC 2 Type II Certification | 6–8 weeks + audit | All enterprise deals |
| Financial Services Compliance Suite (SEC/FINRA/FCA) | 12–14 weeks | Financial services vertical |
| HIPAA-Compliant Infrastructure | 10–12 weeks | Healthcare vertical |
| Emotion & Stress Detection (voice analysis) | 5–6 weeks | Premium differentiator |
| AI Video Avatar Summaries | 8–10 weeks | Premium engagement feature |
| Real-Time Video Translation with Lip-Sync | 10–12 weeks | Global enterprise |
| Attendee Networking & Connection Matching | 6–8 weeks | Investor day events |
| Government / FedRAMP Compliance | 12–16 weeks | Government vertical |
| Metaverse / Virtual Event Support | 12–16 weeks | Future market |

---

## What to Deprioritise (For Now)

The following features from the strategic roadmap are genuinely exciting but are **not worth the investment until you have proven demand**:

- **Predictive Event Success Scoring** — requires substantial historical data to be accurate; build after 50+ events on the platform
- **Competitive Event Benchmarking** — same data requirement; defer
- **Creator Program & Revenue Sharing** — relevant only once there's a marketplace with volume
- **Personalised Event Experience** — requires ML infrastructure; the ROI doesn't justify it at early stage
- **Real-Time Fact-Checking** — expensive API costs + high complexity; impressive but not a Day 1 sales driver

---

## Summary View

| Phase | Timeline | Budget | Primary Goal |
|---|---|---|---|
| **Phase 1** — Hardening | Now (3–4 weeks) | Very low | Safe to launch |
| **Phase 2** — First customers | Months 1–3 | Low | Close first 3–5 deals |
| **Phase 3** — Growth | Months 4–9 | Medium | Open new segments, reduce churn |
| **Phase 4** — Enterprise | Year 2+ | High | $250K+ contracts |

The platform is already differentiated. The goal now is to get customers using it, not to add more features before launch.
