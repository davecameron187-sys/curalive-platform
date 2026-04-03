# CURALIVE — Rollout Roadmap & Demo Guide

**One complete reference · How everything works · April 2026**

---

**Purpose:** Your complete reference for how the platform works, what every screen does, how to demo it, and what to do next.

**Audience:** Dave Cameron — founder, operator, demo lead

**Platform:** CuraLive on Replit · 110 routers · 208 tables · 211 pages · Health 100%

**Published URL:** https://curalive-platform.replit.app

**Demo target:** Lumi Global partner meeting — week of 7 April 2026

**Exit target:** $80M–$120M strategic acquisition · 24–36 months from commercial launch

---

**How to use this document:**
- Section 1 — What exists and where every screen lives (with clickable links)
- Section 2 — How everything works from booking to report delivery, step by step
- Section 3 — How white label works and what Lumi's clients actually experience
- Section 4 — Your exact demo script for the Lumi meeting with links for every step
- Section 5 — Your action items in priority order
- Section 6 — Every URL in one quick-reference table

---

## Section 1 — What Exists and Where to Find It

Everything below is live and working. This is the complete inventory with direct links to every surface.

### 1.1 The Operator Platform

Your working interface. Clients never see this. It is your intelligence cockpit during every event.

| Screen | Link | What it does |
|--------|------|-------------|
| Main operator dashboard | [Open →](https://curalive-platform.replit.app/) | 6-tab overview: Shadow Mode, Events, Partners, Billing, Settings |
| Shadow Mode — Live Intelligence | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | Your live event console. Transcript, sentiment, compliance, Q&A. 11 tabs. |
| Live Q&A console | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | AI triage, approve/reject, send to speaker, AI draft answers, bulk actions |
| Board Intelligence Compass | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | Governance scoring, prior commitments, director liability |
| Pre-Event Intelligence | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | Auto-generated 60 min before each session. Analyst consensus, predicted Q&A, compliance hotspots. |
| Compliance Monitor | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | Real-time regulatory flags. JSE/SEC/FCA jurisdiction rules. Deadline tracking + escalation emails. |
| AGM Intelligence | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | Resolution tracking, dissent detection, proxy advisor monitoring (ISS, Glass Lewis), post-AGM reports |
| System Diagnostics | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | Health Guardian: 6 services monitored every 30 seconds. DB, Recall.ai, Ably, OpenAI, Twilio, Events. |
| Events & Booking | [Open →](https://curalive-platform.replit.app/?tab=events) | Session scheduler, calendar view, tier selection, recipient management |
| Partners | [Open →](https://curalive-platform.replit.app/?tab=partners) | Lumi Global and Bastion Group. White-label branding, domain, email per partner. |
| Enterprise Billing | [Open →](https://curalive-platform.replit.app/?tab=billing) | Quotes, invoices, Stripe payments, recurring templates, per-tier pricing |

### 1.2 Demo Studio

One URL opens a full simulation of a live earnings call with institutional analysts, real-time Q&A, sentiment, and compliance flags. No real event needed. Use this in every meeting.

| Demo surface | Link | What it shows |
|-------------|------|--------------|
| Full platform simulation | [Launch Demo Studio →](https://curalive-platform.replit.app/live-video/webcast/demo?simulate=1) | Streaming video, transcript, sentiment, Q&A, 1,200 simulated attendees. Goldman Sachs, JP Morgan, Morgan Stanley mock questions. |
| Operator live console demo | [Open →](https://curalive-platform.replit.app/?tab=shadow-mode) | Meridian Holdings Q3 2026 earnings call — operator side 8-min simulation |
| Tier comparison demo | [Open →](https://curalive-platform.replit.app/feature-map) | What Essential vs Intelligence vs Enterprise client sees — side by side |
| Cinematic platform video | [Play →](https://curalive-platform.replit.app/virtual-studio) | AI-enhanced virtual broadcast studio |
| Lumi white-label demo | [Open →](https://curalive-platform.replit.app/?tab=partners&partner=lumi) | Full Lumi-branded experience. Show this in the Lumi partner meeting. |

### 1.3 The Three Client-Facing Pages

These are what your clients actually receive. Token-authenticated. White-label branded. Clients never see anything else.

| Page | Route | Demo link | What the client sees |
|------|-------|-----------|---------------------|
| 📡 Live dashboard | `/live/:token` | [View demo →](https://curalive-platform.replit.app/live/demo-live-001) | 5 tabs: Live Feed (streaming transcript), Sentiment (real-time gauges), Compliance (live flags), Q&A (approved questions), AI Summary (rolling). Floating 💬 chat to operator. Lumi branded. |
| 📊 Post-event report | `/report/:token` | [View demo →](https://curalive-platform.replit.app/report/demo-report-001) | 10 tabs: Executive Summary, Financial Metrics, Compliance Flags, Management Tone, Q&A Log, Full Transcript, Action Items, Social Media Pack, SENS/RNS Draft, Blockchain Certificate. |
| 🎙 Presenter screen | `/presenter/:token` | [View demo →](https://curalive-platform.replit.app/presenter/demo-presenter-001) | Full-screen display for the CFO/CEO during the event. Shows the active approved question in large text, AI suggested talking points (toggle to show), and 3 questions queued up next. |

> ✅ **Demo tokens are live.** The three links above point to a real completed session (Session #17 — Live Stream Validation). Tokens expire in 30 days.

### 1.4 Intelligence Tiers — What Each Client Gets

The operator selects the tier when creating a session. It controls what the client sees live and what report modules run. Four tiers.

| Tier | Pricing | Live dashboard | Post-event report |
|------|---------|----------------|-------------------|
| Essential | Per event | Transcript · 4 sentiment metrics · Compliance flags · AI summary · Q&A queue | 5 core AI modules + disclosure certificate |
| Intelligence | Per event or retainer | All Essential + Speaker scorecards · Evasion index · Crisis prediction oracle · Valuation impact oracle · M&A signal detector | Full 20 AI modules + SENS/RNS draft + social media pack + speaker scorecards |
| Enterprise | Annual licence | All Intelligence + Cross-event benchmarking vs prior quarters · Analyst identity + history · Briefing accuracy tracker · Board commitment monitor | All 20 modules + Board Intelligence + RBAC + white label + cross-event benchmarks |
| AGM | Per AGM event (Enterprise add-on) | All Enterprise + Resolution tracking · Shareholder dissent analysis · Activist language detection · Proxy advisor monitoring (ISS, Glass Lewis, Hermes) | All 20 modules + post-AGM dissent report + resolution-by-resolution analysis + governance scoring |

---

## Section 2 — How Everything Works, End to End

The complete lifecycle of one event — from booking to report delivery. The platform handles steps 6, 7, 17, 18, 19, 20, 21 and 22 automatically. No manual work.

### Phase 1 — Before the Event (You)

| # | You do this | What happens | Where |
|---|------------|-------------|-------|
| 1 | Create or schedule the session | Set company name, event type (earnings call / AGM / investor briefing / roadshow), date, time, meeting URL. | [Events tab →](https://curalive-platform.replit.app/?tab=events) |
| 2 | Select intelligence tier | Essential / Intelligence / Enterprise / AGM. This determines what the client sees live and what AI modules run on report generation. | Session Setup panel |
| 3 | Add client recipients | Name, email, role (IR Manager, CFO, Compliance Officer). Toggle: live link, report, or both. Each person gets a unique personal token. | Session Setup → Recipients |
| 4 | Select partner (if Lumi or Bastion event) | Tag as Lumi or Bastion. All client emails and links automatically use their branding and domain. No extra setup required per event. | Session Setup → Partner |
| 5 | Run readiness check | Platform validates: DB connected · Recall.ai ready · Ably live · OpenAI reachable · Recipients configured · Tier set. 5 green ticks = good to go. | Session Setup → Readiness |
| 6 | Pre-event briefing auto-sends ✓ | Exactly 60 minutes before scheduled start, BriefingScheduler fires. Email from CuraLive (or Lumi) with analyst consensus, predicted Q&A topics, compliance hotspots, readiness score. | Automatic — no action |

### Phase 2 — During the Event

| # | Event | What happens | Where |
|---|-------|-------------|-------|
| 7 | Intelligence Agent joins ✓ Auto | Recall.ai bot joins Zoom/Teams/Meet silently via the meeting link — like a human participant. Call host sees "CuraLive Intelligence Agent." Nothing else changes for the meeting. | Automatic on session start |
| 8 | Live links sent to recipients ✓ Auto | ClientDeliveryService sends branded emails to all recipients. Email from CuraLive or Lumi domain. Contains unique /live/:token link. | Automatic on go-live |
| 9 | Operator watches live transcript | Every word transcribed in real time, speaker-labelled, streamed via Ably. Compliance flags fire automatically as AI detects forward guidance, M&A language, selective disclosure. | [Shadow Mode →](https://curalive-platform.replit.app/?tab=shadow-mode) |
| 10 | Client watches branded dashboard | Client opens /live/:token. Sees 5 tabs in CuraLive or Lumi branding. Transcript streaming. Sentiment bars updating. Compliance flags appearing in real time. | [Live demo →](https://curalive-platform.replit.app/live/demo-live-001) |
| 11 | Operator flags transcript segments | Click 🚩 on any transcript line. Choose flag type: Notable / Compliance / Forward Guidance / Tone Shift / Action Required. Feeds the session timeline and post-event report. | Shadow Mode → transcript |
| 12 | Q&A moderation (webcast events) | Attendees submit via /qa/:accessCode. Questions appear in Live Q&A console. AI classifies each: Approved / Duplicate / Off-topic / Compliance Risk. Operator reviews and acts. | [Live Q&A →](https://curalive-platform.replit.app/?tab=shadow-mode) |
| 13 | Approved question → Presenter screen | Operator clicks "Send to speaker." Question appears immediately on /presenter/:token — large readable text, AI suggested talking points (toggle to show), asker's firm shown. | [Presenter demo →](https://curalive-platform.replit.app/presenter/demo-presenter-001) |
| 14 | IR team messages operator | Client taps 💬 on live dashboard. Types message. Appears in operator console with badge. Operator replies in real time. No phone call needed. Bidirectional via Ably. | Client dashboard chat bubble |
| 15 | Multi-operator coordination | Second operator joins session. Team tab shows inter-operator messages. Operator handoff transfers session state, notes, and open flags cleanly to the incoming operator. | Shadow Mode → Team tab |

### Phase 3 — After the Event (Automatic)

| # | What happens | Detail | Where to see it |
|---|-------------|--------|-----------------|
| 16 | Compliance email fires ✓ Auto | ComplianceDeadlineService sends a compliance-only email within 2 minutes of session close. Sent to compliance officer recipients before the full report. Lists flags with JSE rule references and 48-hour deadline. | Recipient inbox — automatic |
| 17 | 20-module AI report generates ✓ Auto | All 20 intelligence modules run in parallel: Executive summary, financial metrics, management tone, compliance flags, Q&A analysis, SENS/RNS draft, social media pack, blockchain certificate, and 12 more. | ~3–5 minutes post-close |
| 18 | Report links sent to all recipients ✓ Auto | Each recipient receives a personal /report/:token link via email from CuraLive or Lumi domain. Valid 30 days. Access is tracked individually per recipient. | [Report demo →](https://curalive-platform.replit.app/report/demo-report-001) |
| 19 | Compliance deadlines created ✓ Auto | For each critical flag, a compliance deadline is created. JSE = 48 hours. ComplianceDeadlineMonitor checks every 15 minutes and sends escalation emails if deadlines are approaching or missed. | [Compliance →](https://curalive-platform.replit.app/?tab=shadow-mode) |
| 20 | Client views report and submits feedback | Client opens report. Every tab switch logged (client_report_view_log). Operator sees exactly which tabs were viewed. Client submits star rating + feedback comment. | [Archives →](https://curalive-platform.replit.app/?tab=shadow-mode) |
| 21 | Blockchain certificate issued ✓ Auto | SHA-256 hash chain covers the full transcript, all AI analysis, all compliance flags, and the complete report. Immutable. Tamper-proof. Defensible in any regulatory review. Certificate tab in the report. | Report → Certificate tab |

---

## Section 3 — White Label: How It Works for Lumi

White label means Lumi's clients never see CuraLive. They see Lumi Intelligence throughout — branding, domain, email, reports, certificates. CuraLive is the invisible engine underneath.

### 3.1 The Four Layers of White Label

| Layer | What it controls | How it works technically | What Lumi does to activate |
|-------|-----------------|------------------------|---------------------------|
| 1 Visual brand | Logo, colours, fonts on all client pages | useBrandConfig hook reads partners table on every page load. CSS variables swap automatically. No code change. | Provide logo URL + hex colour codes. One SQL update. |
| 2 Domain | intelligence.lumigroup.com instead of app.curalive.com | brandConfigMiddleware reads incoming domain on every request. Automatically serves Lumi branding for that domain. | One DNS CNAME record: intelligence.lumigroup.com → curalive-platform.replit.app |
| 3 Email | All emails arrive from noreply@lumigroup.com | Resend routes through Lumi sending domain. Pre-event briefing, live link, report link — all from Lumi. | Two DNS records: SPF + DKIM for Resend. Standard email authentication. |
| 4 Reports & certs | PDFs, certificates, SENS drafts all carry Lumi brand | All generated content reads brand config. Report headers, logos, footers auto-applied. | Automatic once layers 1–3 are active. |

### 3.2 Activating Lumi White Label — Total Work Required

Lumi does: 3 DNS records. You do: 1 SQL update. That is the entire activation. 30 minutes of technical work. Everything else is already built and configured.

```sql
-- Run this one update when Lumi provides their logo and brand assets:
UPDATE partners SET
  logo_url               = 'https://[lumi-cdn-logo-url]',
  primary_color          = '#[lumi-primary-colour]',
  accent_color           = '#[lumi-dark-colour]',
  custom_domain          = 'intelligence.lumigroup.com',
  custom_domain_verified = true,
  sending_domain         = 'lumigroup.com',
  sending_name           = 'Lumi Intelligence',
  sending_email          = 'noreply@lumigroup.com'
WHERE slug = 'lumi';

-- Lumi IT adds these DNS records:
-- CNAME  intelligence.lumigroup.com  →  curalive-platform.replit.app
-- TXT    lumigroup.com               →  Resend SPF record
-- CNAME  resend._domainkey...        →  Resend DKIM record
```

### 3.3 What Lumi's Client Experiences, Start to Finish

| When | What Lumi's client sees and receives |
|------|-------------------------------------|
| 60 min before | Email from noreply@lumigroup.com — "Your pre-event intelligence briefing." Lumi logo. Analyst consensus predictions, likely Q&A topics, compliance hotspots to watch. All AI-generated. |
| Session goes live | Email from Lumi: "Your live intelligence dashboard is ready." Unique link to intelligence.lumigroup.com/live/[token]. Opens in browser — Lumi branding throughout. |
| During event | Client watches 5 tabs: transcript streaming, sentiment bars, compliance flags, Q&A queue, AI summary. Taps 💬 to message the operator privately. All Lumi branded. No CuraLive visible. |
| Session closes | Compliance email arrives from Lumi within 2 minutes if flags were raised. Lists required actions with regulatory deadlines. |
| 5 min post-close | Email from Lumi: "Your intelligence report is ready." Link to intelligence.lumigroup.com/report/[token]. Full 10-tab report, SENS draft, social media pack, blockchain certificate. All Lumi branded. |
| PDF download | Client downloads report PDF. Lumi-branded header, logo, colours. Blockchain certificate. CuraLive not mentioned anywhere. This is Lumi's product in every sense. |

**Demo:** [Open the Lumi white-label demo now →](https://curalive-platform.replit.app/?tab=partners&partner=lumi)

---

## Section 4 — Demo Script: The Lumi Meeting

45 minutes. 10 steps. Every step has a link. Rehearse twice before the meeting. The product demos itself — your job is to set up each screen and let it run.

**Pre-meeting setup:** Do this the day before: (1) Test every link below opens on your machine. (2) Bookmark the Demo Studio URL. (3) Have the Lumi white-label demo open in a separate tab ready to go.

### 4.1 The 10-Step Demo

| # | Time | What you do | Notes | Link |
|---|------|------------|-------|------|
| 1 | 2 min | Open with the one-sentence pitch | "CuraLive makes a regulated corporate event intelligent before it starts, compliant while it runs, and actionable before the operator leaves the room. One link. Any platform. Zero integration." Then stop and open the demo. | — |
| 2 | 5 min | Launch the Demo Studio | Let it run for 2 minutes without speaking. They will see: transcript streaming, sentiment bars moving, a compliance flag firing with the JSE rule reference, Q&A queue filling. Say: "This is a live earnings call. Everything you see is happening in real time." | [Launch →](https://curalive-platform.replit.app/live-video/webcast/demo?simulate=1) |
| 3 | 3 min | Explain what just happened | Walk back through it: AI agent joined the Zoom silently. Every word transcribed and analysed instantly. A compliance flag fired with the exact JSE rule and a 48-hour deadline. Q&A moderated before the question reached the speaker. All automatic. | — |
| 4 | 4 min | Show the operator console | Open Shadow Mode. Create a test session. Set tier to Intelligence. Add a recipient email. Run the readiness check — 5 green ticks. This is what your operator does 30 minutes before every event. | [Shadow Mode →](https://curalive-platform.replit.app/?tab=shadow-mode) |
| 5 | 3 min | Show the presenter screen | Open on a second screen or tablet. This is what the CFO or CEO sees during Q&A. Approved question in large text. AI talking points behind a toggle. 3 next questions queued. Say: "The speaker never sees an unapproved question." | [Presenter →](https://curalive-platform.replit.app/presenter/demo-presenter-001) |
| 6 | 5 min | Show the client live dashboard | Open /live/:token. Walk through all 5 tabs. Show the floating chat bubble — tap it, type "Please approve the Goldman question." Say: "This is what your IR team watches during the event — on their phone, at their desk, anywhere." | [Live dashboard →](https://curalive-platform.replit.app/live/demo-live-001) |
| 7 | 5 min | Show the post-event report | Open /report/:token. Click through all 10 tabs deliberately. Pause on Compliance — show the JSE rule reference and 48-hour deadline. Show the SENS draft ready to file. Show the certificate. Say: "Delivered automatically within 5 minutes of the call ending." | [Report →](https://curalive-platform.replit.app/report/demo-report-001) |
| 8 | 3 min | White label reveal | Open the Lumi white-label demo. Show: their brand, their domain, their email. Say: "Your clients never see CuraLive. This is your product." Then pause. Let that land. Do not fill the silence. | [Lumi demo →](https://curalive-platform.replit.app/?tab=partners&partner=lumi) |
| 9 | 4 min | The AGM opportunity | Say: "You run hundreds of AGMs a year. No other platform does this for AGMs." Open AGM Intelligence. Show resolution tracking, dissent detection, proxy advisor alerts (ISS, Glass Lewis). Say: "Every activist shareholder signal, every proxy advisor reference — detected in real time and delivered to the board." | [AGM Intel →](https://curalive-platform.replit.app/agm-governance) |
| 10 | 10 min | Commercial conversation | Revenue share to start: add a CuraLive fee to your existing per-event invoice, 70/30 split in your favour, zero upfront cost. White label licence when volume justifies it (R150K–R400K/year + per-event). First event: pick one JSE Top 40 client and run their next earnings call. Ask: "Which client would you most want to show this to first?" | — |

---

## Section 5 — Your Action Items, In Priority Order

Honest and ranked by commercial impact. Items 1 and 2 must happen before the demo. Items 3 and 4 determine whether CuraLive reaches its exit target.

### 5.1 This Week — Non-Negotiable

| Priority | # | Action + why | Owner |
|----------|---|-------------|-------|
| 🔴 URGENT | 1 | **Generate real demo tokens (30 min)** — ✅ DONE. Demo tokens generated for Session #17 (Live Stream Validation). Tokens: `demo-live-001`, `demo-report-001`, `demo-presenter-001`. Valid 30 days. All three links are live. | Replit ✅ |
| 🔴 URGENT | 2 | **Test every link in this document (1 hour)** — Open every clickable link on your machine. Confirm it loads. Fix any that do not. Do this two days before the meeting, not the morning of it. | You |
| 🔴 URGENT | 3 | **Book the Lumi meeting — today** — Contact your C-suite connection at Lumi. Every week this waits is a week of commercial runway burning. You have everything you need: demos, commercial model, white label, AGM pitch. The only thing missing is the meeting. | You |

### 5.2 This Month

| Priority | # | Action + why | Owner |
|----------|---|-------------|-------|
| 🟡 THIS MONTH | 4 | **Send the CCSA employment exit email** — The email was drafted. It has been sitting. Your employment contract restricts commercial activity during employment — this is a live risk. The email asks one question and requests a written response. Send it. | You |
| 🟡 THIS MONTH | 5 | **Submit Microsoft ISV Success Programme application** — partner.microsoft.com — straightforward application. Gets CuraLive on Microsoft's acquisition radar. Provides co-selling support. Direct route to the Teams integration and Copilot acquisition story. | You |
| 🟡 THIS MONTH | 6 | **Run the first Lumi event** — After the Lumi meeting: identify one JSE Top 40 client and run their next earnings call through CuraLive. Produce the post-event report. Make it exceptional. One real deliverable from a real event is worth more than any pitch deck. | You + Steve |
| 🟡 THIS MONTH | 7 | **Start PCT patent preparation** — Hard deadline: 12 March 2027. Self-filing a PCT covering South Africa, USPTO, and EPO is a substantial undertaking. Eleven months sounds long. It is not. Start the preparation process with Claude now. | You + Claude |

### 5.3 Platform — Next 90 Days

| # | Build item | What it does and why it matters |
|---|-----------|-------------------------------|
| 8 | Live Q&A analytics (Gap 7.2) | Pattern detection running live: which firm is asking the most questions, coordinated questioning detection, escalation alerts. High value for Intelligence and Enterprise tier clients wanting real-time analyst intelligence. |
| 9 | Board Intelligence auto-populate (Gap 9.1) | Board Intelligence Compass currently requires manual trigger. Should auto-update from the live session as commitments are mentioned or avoided. Important for Enterprise clients using board governance features. |
| 10 | Cross-event comparison (Gap 3.3) | Side-by-side view of two sessions for quarter-on-quarter benchmarking. High value for Enterprise clients who want to track management consistency over time. |
| 11 | Batch archive upload (Gap 2.3) | Queue-based batch upload for onboarding new clients with historical recordings. Currently one file at a time. Becomes important when Lumi starts onboarding multiple clients simultaneously. |

### 5.4 Patent Pipeline — Hard Deadlines

| Filing | Target date | Status | Action needed |
|--------|------------|--------|---------------|
| CIP 7 — Module 33, Claims 83–90 Communication-to-Capital Causality Engine | September 2026 | Not drafted | Start with Claude — Q2 2026 |
| CIP 8 — Claims 91–94 Microsoft/Copilot acquisition readiness | Q4 2026 | Not drafted | After CIP 7 complete |
| CIP 9 — Modules 43–46 Quantum-safe, Crypto-agile protocols | Q4 2026 | Not drafted | With Claude |
| PCT International Filing South Africa, USPTO, EPO | **12 March 2027 HARD DEADLINE** | ⚠ Preparation must start now | Missing this loses all international protection |

---

## Section 6 — Quick Reference: Every Link

All links below are live and working. Bookmark this page.

### Operator Console

| Screen | URL | What it does |
|--------|-----|-------------|
| Main dashboard | [https://curalive-platform.replit.app/](https://curalive-platform.replit.app/) | Operator home — 6 tabs |
| Shadow Mode — Live Intel | [https://curalive-platform.replit.app/?tab=shadow-mode](https://curalive-platform.replit.app/?tab=shadow-mode) | Active session monitoring |
| Live Q&A | [https://curalive-platform.replit.app/?tab=shadow-mode](https://curalive-platform.replit.app/?tab=shadow-mode) | Q&A moderation console (Live Q&A tab inside Shadow Mode) |
| Board Compass | [https://curalive-platform.replit.app/?tab=shadow-mode](https://curalive-platform.replit.app/?tab=shadow-mode) | Governance intelligence (Board Compass tab inside Shadow Mode) |
| Pre-Event Intel | [https://curalive-platform.replit.app/?tab=shadow-mode](https://curalive-platform.replit.app/?tab=shadow-mode) | Pre-event briefing viewer (Pre-Event tab inside Shadow Mode) |
| Compliance | [https://curalive-platform.replit.app/?tab=shadow-mode](https://curalive-platform.replit.app/?tab=shadow-mode) | Live regulatory monitoring (Compliance tab inside Shadow Mode) |
| AGM Intel | [https://curalive-platform.replit.app/agm-governance](https://curalive-platform.replit.app/agm-governance) | AGM resolution tracking |
| System Diagnostics | [https://curalive-platform.replit.app/health-guardian](https://curalive-platform.replit.app/health-guardian) | Health Guardian — 6 services |
| Events & Booking | [https://curalive-platform.replit.app/?tab=events](https://curalive-platform.replit.app/?tab=events) | Schedule sessions |
| Partners | [https://curalive-platform.replit.app/?tab=partners](https://curalive-platform.replit.app/?tab=partners) | Lumi and Bastion config |
| Billing | [https://curalive-platform.replit.app/?tab=billing](https://curalive-platform.replit.app/?tab=billing) | Quotes, invoices, Stripe |

### Demo and Client Pages

| Page | URL | Notes |
|------|-----|-------|
| Demo Studio (webcast) | [https://curalive-platform.replit.app/live-video/webcast/demo?simulate=1](https://curalive-platform.replit.app/live-video/webcast/demo?simulate=1) | Use in every demo meeting |
| Client Live Dashboard | [https://curalive-platform.replit.app/live/demo-live-001](https://curalive-platform.replit.app/live/demo-live-001) | ✅ Live demo token — Session #17 |
| Post-Event Report | [https://curalive-platform.replit.app/report/demo-report-001](https://curalive-platform.replit.app/report/demo-report-001) | ✅ Live demo token — Session #17 |
| Presenter Screen | [https://curalive-platform.replit.app/presenter/demo-presenter-001](https://curalive-platform.replit.app/presenter/demo-presenter-001) | ✅ Live demo token — Session #17 |
| Attendee Q&A Page | [https://curalive-platform.replit.app/qa/ACCESS-CODE](https://curalive-platform.replit.app/qa/ACCESS-CODE) | Webcast attendees submit here (replace ACCESS-CODE with real code) |
| Lumi White-Label Demo | [https://curalive-platform.replit.app/?tab=partners&partner=lumi](https://curalive-platform.replit.app/?tab=partners&partner=lumi) | Show in partner meeting |
| Feature Map | [https://curalive-platform.replit.app/feature-map](https://curalive-platform.replit.app/feature-map) | Platform feature map and capability explorer |
| Virtual Studio | [https://curalive-platform.replit.app/virtual-studio](https://curalive-platform.replit.app/virtual-studio) | AI-enhanced broadcast studio |

### Key Commercial Numbers

| Metric | Figure |
|--------|--------|
| Exit target | $80M–$120M strategic acquisition |
| Timeline | 24–36 months from commercial launch |
| Lumi event volume | ~4,000 events per year |
| Bastion event volume | ~500 events per year |
| Revenue share split | 70% CuraLive / 30% channel partner on the CuraLive fee component |
| White label licence | R150,000–R400,000 per year depending on volume, plus per-event processing fees |
| Primary acquirers | Microsoft (Teams/Copilot), Bloomberg, Nasdaq, Lumi Global, Broadridge |
| Platform scale | 110 routers · 208 tables · 211 pages · 7 background services · Health Guardian 100% |
| Patent | CIPC App ID 1773575338868 · Priority 12 March 2026 · PCT deadline 12 March 2027 |
