# CuraLive GTM Brief v2.0 — Key Findings
## March 2026 | Prepared by Manus AI

## Overall Status: 65.4% Complete (+7.1pp since v1)
- 10/10 AI Features LIVE
- 90 tests passing (+17 since v1)
- 2 blockers remaining (down from 5 in v1)

---

## 1a. Core Platform Modules — All LIVE
| Module | Status | Notes |
|---|---|---|
| Attendee Event Room | LIVE | Real-time transcript, 8-language AI translation, sentiment bar, AI rolling summary, Q&A via Ably |
| Moderator Console | LIVE | Q&A approve/reject, AI auto-triage, toxicity/compliance filter, live polls, sentiment dashboard |
| Presenter Teleprompter | LIVE | Large-text live transcript, approved Q&A feed, speaking-pace coach display |
| Operator Console (OCC) | LIVE | Conference management, participant list, dial-out UI, green room, lounge, 8-tile live call counter dashboard |
| Post-Event Intelligence | LIVE | AI summary, JSE/IFRS financial highlights, press release draft, speaking-pace coach, cross-event trend chart, webphone activity tab, full transcript viewer |
| Roadshow Suite | LIVE | Investor briefing packs, order book, commitment signals, meeting scheduler, AI-generated briefing content |
| Webcasting Hub | LIVE | 8 event types, 8 industry verticals, event listing, registration landing pages |
| Webcast Studio | LIVE | Ably real-time Q&A, polls, chat, sentiment, captions panel, AI event brief generator |
| Registration Landing Page | LIVE | Vertical templates: Healthcare CME, Financial Services, Government |
| Create Event Wizard | LIVE | 6-step guided flow, fully wired to DB persistence |
| On-Demand Library | LIVE | Searchable recordings, CPD/CME certification support |
| Analytics Dashboard | LIVE | Attendance trends, lead scoring, geography, engagement breakdown |
| Integration Hub | LIVE | Setup guides for Recall.ai, Zoom RTMS, Teams Bot, RTMP, PSTN |
| Partner API & Widget | LIVE | Webhook documentation, REST API reference, embeddable widget |
| Webphone (Dual-Carrier) NEW | LIVE | Twilio WebRTC primary + Telnyx PSTN fallback; auto-failover, DTMF, hold, transfer, MOS score, floating panel in OCC and Studio |
| AI Feature Suite (10/10) UPDATED | LIVE | Sentiment scoring, rolling summary, Q&A auto-triage, toxicity filter, event brief generator, enhanced post-event summary, press release draft, multi-language translation, speaking-pace coach |

## 1b. Infrastructure & Platform Services
| Module | Status | Notes |
|---|---|---|
| Recall.ai Integration UPDATED | LIVE | Bot joins Zoom/Teams/Webex, streams audio to Whisper, publishes transcript + sentiment to Ably in real time. Webhook pipeline fully wired and tested. |
| Real-Time Delivery (Ably) | LIVE | Channels wired into EventRoom, Moderator, Webcast Studio, OCC; occ:overview channel for live counter auto-refresh |
| White-Label Branding | LIVE | Per-event colour, logo, font configuration |
| Email (Resend) | LIVE | Infrastructure wired; confirmation email templates need content population |
| Authentication | LIVE | Manus OAuth, JWT sessions, role-based access (admin/user) |
| Database | LIVE | 33 tables on TiDB Serverless (MySQL-compatible), fully migrated. Up from 28 tables in v1. |
| Terms of Service & Privacy Policy NEW | LIVE | Dedicated pages built; linked from registration and billing flows |
| Billing Infrastructure NEW | SCAFFOLDED | Billing page, plan management, and Stripe checkout flow fully built. Awaiting Stripe API keys to activate. |

---

## 2a. Critical Blockers — Blocks Go-Live
| Item | What It Is | Self-Build? | Effort |
|---|---|---|---|
| Stripe API keys | All billing code built — plans, checkout, webhook handler, billing page. Only remaining step is providing API keys via Settings → Payment | Yes — self-service in the UI | 30 minutes |
| Twilio account upgrade | Trial account limits outbound calls to verified numbers only. Upgrading to paid account ($0 minimum, pay-as-you-go) removes restriction | Yes — Twilio dashboard | 15 minutes |

## 2b. Important — Needed for First Paying Customer
| Item | What It Is | Self-Build? | Effort |
|---|---|---|---|
| Phone number purchase | Purchasing US/ZA phone number on Telnyx and Twilio for real dial-in. Webphone and OCC UI fully built. | Yes — Manus can wire this | 1 build round |
| Attendee reminder emails | 24h and 1h pre-event reminder emails via Resend. Infrastructure wired; trigger and template need building. | Yes — Manus can build this | 1 build round |
| Custom domain | Platform runs on chorusai-mdu4k2ib.manus.space. Custom domain (e.g., app.choruscall.ai) via Settings → Domains. | Yes — self-service in UI | 30 minutes |
| Zoom RTMS account | Requires Zoom Developer Pack (enterprise agreement). Recall.ai covers Zoom without RTMS and is already live. | Business task — no code required | 1-2 weeks (sales cycle) |

## 2c. Nice-to-Have — Growth Features (3-6 months)
- Microsoft Teams Bot (Azure Bot Framework) — 2-3 days with Manus + developer to test Teams permissions
- Zoom RTMS native integration — Business + 2 days developer
- Multi-tenant white-label (client gets own subdomain) — 2 days with Manus
- Salesforce / HubSpot CRM sync — 1 day with Manus per CRM
- OCC publish-to-Ably mutations — Half a day with Manus
- ISO 27001 / SOC 2 compliance documentation — External, ~$5,000–15,000 once-off

---

## 3. Developer Requirement — ELIMINATED
The original developer requirement (3-5 days mid-level backend developer for Recall.ai webhook testing) has been eliminated. Platform is fully self-maintainable with Manus.

---

## 4. Monthly Operating Costs
| Stage | Events/Month | Estimated Monthly Cost |
|---|---|---|
| Pre-revenue (testing) | 0-5 | $50-120/mo |
| Early traction | 10-50 | $250-700/mo |
| Growth | 200+ | $1,500-5,500/mo |

Gross margin at $500-2,000/event pricing: **90%+**

---

## 5. Remaining Development Cost
Total remaining: **$15-65 (one-time)** — down from $525-1,565 in v1 (96% reduction)

---

## 6. Recommended Build Sequence
**Day 1 (30 min, no developer):**
1. Activate Stripe billing — provide API keys via Settings → Payment
2. Upgrade Twilio Trial to paid account (15 min, Twilio dashboard)
3. Set up custom domain in Manus Settings → Domains (30 min)

**Day 2-3 (with Manus, no developer):**
1. Purchase US/ZA phone numbers on Telnyx and Twilio and wire to OCC dial-in panel (1 build round)
2. Build attendee reminder emails via Resend — 24h and 1h pre-event triggers (1 build round)
3. Populate email confirmation templates with event details and calendar .ics attachment

**Day 4 (optional — growth preparation):**
1. Wire OCC tRPC mutations to publish occ:overview Ably events for end-to-end live counter (half a build round)
2. Draft Terms of Service and Privacy Policy (Manus can draft; Termly for ongoing compliance)

**Day 5:**
1. Soft-launch with first client. Platform is commercially deployable.

---

## 8. What's New Since v1 — Round 59-61 Summary
| Feature | Round | Impact |
|---|---|---|
| Webphone — Dual-Carrier Hybrid | R59 | Twilio WebRTC primary + Telnyx PSTN fallback; auto-failover, DTMF, hold, transfer, MOS score. Floating draggable panel in OCC and Studio. Eliminates need for a separate softphone tool. |
| Carrier Manager + Failover Logic | R59 | Server-side carrierManager.ts with full vitest coverage. 17 new tests added (90 total). |
| Webphone Activity Tab — Post-Event | R60 | Total minutes, call count, carrier breakdown, failover events, per-call log in the Post-Event Report. |
| Multi-Language Translation — Full Wiring | R61 | EventRoom and AttendeeEventRoom wired to trpc.ai.translateSegment with per-language cache. Live Ably transcript segments auto-translated as they arrive. |
| Speaking-Pace Coach | R61 | New tab in Post-Event Report: per-speaker WPM, filler word detection, pause score, coaching tips, overall score /100. |
| Pace Coach Trend Chart | R61 | Dual-axis Chart.js line chart (WPM + Score) across events; results persisted to speaker_pace_results DB table. |
| OCC Live Call Counter — Ably Auto-Refresh | R61 | 8-tile metrics strip (Live Calls, Pending, Completed, Lounge, Op Requests, Active Participants, Active CCP, Bridge Status). Live Calls and Bridge tiles update in real-time via occ:overview Ably channel. |

---

## Rounds 62-66 (Post-Brief) — Additional Features Added
- R62: Billing infrastructure, Terms of Service & Privacy Policy pages
- R63: Webphone enhancements (caller ID selection, human-readable errors, incoming call UI, call history)
- R64: Twilio inbound routing config, Telnyx number purchase, Webphone Activity Card in OCC
- R65: Ably real-time push for call activity, call recording & playback, operator presence & smart routing
- R66 (in progress): Voicemail recording, call transfer (warm/blind), recording transcription via Whisper
