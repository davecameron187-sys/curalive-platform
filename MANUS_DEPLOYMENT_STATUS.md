# CuraLive — Manus/GitHub Handover & Deployment Status

**Date:** March 10, 2026  
**Version:** 2.0 (AI Interconnection Release)  
**Status:** Production Ready  
**Primary URL:** https://curalive-mdu4k2ib.manus.space  

---

## 1. Project Overview

CuraLive is a real-time investor events platform for capital markets and webcasting.  
It provides operators with a unified console, AI-powered features, and virtual broadcasting capabilities.

**Tech Stack:**
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express + tRPC (typed RPC) running on port 5000
- **Database:** MySQL (via Drizzle ORM)
- **Real-time:** Ably Pub/Sub channels
- **Media:** Mux (video ingest/playback) + Recall.ai (meeting bot)
- **AI:** OpenAI GPT-4o (via Replit integration)

---

## 2. All Active Routes (Operator Links Reference)

All routes below are fully implemented, wired in `client/src/App.tsx`, and confirmed working.

### Training
| Path | Component | Status |
|------|-----------|--------|
| `/operator-hub` | OperatorHub | Active |
| `/training` | TrainingSubPage | Active |
| `/training-mode` | TrainingModePage | Active |
| `/operator-guide` | OperatorQuickRef | Active |
| `/training/virtual-studio` | TrainingSubPage (VS) | Active |
| `/training/ai-features` | TrainingSubPage (AI) | Active |

### Operator Console
| Path | Component | Status |
|------|-----------|--------|
| `/occ` | OCC | Active |
| `/operator/analytics` | OperatorAnalytics | Active |
| `/virtual-studio` | VirtualStudio | Active |
| `/live-sentiment` | → redirects to `/webcast-studio/ceo-town-hall-q1-2026` | Active |
| `/intelligent-broadcaster` | IntelligentBroadcasterPage | Active |

### Event Setup
| Path | Component | Status |
|------|-----------|--------|
| `/events/schedule` | EventSchedule | Active |
| `/events/calendar` | EventCalendar | Active |
| `/live-video/webcasting` | WebcastingHub | Active |
| `/live-video/webcast/create` | WebcastCreate | Active |
| `/studio-config` | → redirects to `/virtual-studio` | Active |
| `/esg-setup` | → redirects to `/virtual-studio` | Active |

### AI Interconnection
| Path | Component | Status |
|------|-----------|--------|
| `/feature-map` | FeatureMap | Active |
| `/admin/interconnection-analytics` | InterconnectionAnalytics | Active |
| `/workflows` | WorkflowsPage | Active |
| `/ai-shop` | AIShop | Active |
| `/post-event/:eventId` | PostEventReport | Active |
| `/post-event/q4-earnings-2026` | Demo data pre-loaded | Active |
| `/webcast-recap` | WebcastRecapPage | Active |

### AI Features (16 total)
| Path | Feature |
|------|---------|
| `/features/live-transcription` | Live Transcription |
| `/features/sentiment-analysis` | Sentiment Analysis |
| `/features/qa-triage` | Q&A Auto-Triage |
| `/features/compliance` | Compliance Check |
| `/features/lead-scoring` | Lead Scoring |
| `/features/follow-ups` | Investor Follow-Ups |
| `/features/event-brief` | Event Brief |
| `/features/rolling-summary` | Rolling Summary |
| `/features/press-release` | Press Release |
| `/features/event-echo` | Event Echo |
| `/features/podcast` | Podcast Converter |
| `/features/sustainability` | Sustainability Tracker |
| `/features/video-recap` | AI Video Recap |
| `/features/toxicity` | Toxicity Filter |
| `/features/pace-coach` | Pace Coach |
| `/features/broadcaster` | Intelligent Broadcaster |

### AI Bundles (6 total)
| Path | Bundle |
|------|--------|
| `/bundles/investor-relations` | Bundle A: Investor Relations |
| `/bundles/compliance` | Bundle B: Compliance & Risk |
| `/bundles/operations` | Bundle C: Operations |
| `/bundles/content` | Bundle D: Content Marketing |
| `/bundles/premium` | Bundle E: Premium |
| `/bundles/social` | Bundle F: Social Amplification |

### Webcast Studio (Demo Events)
| Path | Event |
|------|-------|
| `/webcast-studio/q4-earnings-2026` | Q4 Earnings Call 2026 (Capital Markets) |
| `/webcast-studio/ceo-town-hall-q1-2026` | CEO Town Hall Q1 2026 (Webcasting) |

Both events support `?simulate=1` query parameter to auto-start the demo simulation.

### Quick Reference
| Path | Description |
|------|-------------|
| `/operator-links` | Full operator links directory (this page) |
| `/support` | OperatorQuickRef: Support |
| `/docs` | OperatorQuickRef: Documentation |
| `/certification` | OperatorQuickRef: Certification |
| `/my-dashboard` | OperatorQuickRef: Dashboard |
| `/feedback` | OperatorQuickRef: Feedback |
| `/whats-new` | OperatorQuickRef: What's New |

---

## 3. New Features Implemented This Release

### 3.1 Link Analytics Database
**Tables:** `operator_link_analytics` + `operator_links_metadata`  
**File:** `drizzle/schema.ts` (added at end)  
**Migration:** `scripts/create-operator-link-analytics-tables.ts` — run once to create tables and seed 50 link records  
**Status:** Tables created and seeded ✅

### 3.2 Operator Links tRPC Router
**File:** `server/routers/operatorLinksRouter.ts`  
**Registered:** `server/routers.ts` as `operatorLinks`  
**Procedures:**
- `operatorLinks.trackClick` — logs a link click with path, title, category, sessionId
- `operatorLinks.getPopularLinks` — returns top N clicked links sorted by usage
- `operatorLinks.getMyHistory` — returns click history for the current operator
- `operatorLinks.getAllMetadata` — returns all 50 seeded link definitions sorted by display order
- `operatorLinks.getMetadataByCategory` — filters link metadata by category
- `operatorLinks.getAnalyticsSummary` — returns total clicks, unique paths, today's activity, and top 5 links

### 3.3 Simulate Event Button (OperatorLinks Page)
**File:** `client/src/pages/OperatorLinks.tsx`  
**Trigger:** Floating "Run Demo Simulation" button (bottom-right, fixed position)  
**Behaviour:** Opens a slide-up panel that runs a 14-step, ~37-second simulation of a complete Q4 Earnings Call  

**Simulation Steps:**
1. AI Event Brief generated (0s)
2. Virtual Studio configured (2.8s)
3. ESG compliance flags set (5.2s)
4. Event LIVE — 847 viewers joined (8s)
5. Sentiment: 78% Positive (11s)
6. Q&A Auto-Triage: 23 questions (14s)
7. Compliance alert: Revenue guidance (17s)
8. Pace Coach: 148 WPM optimal (20s)
9. Rolling Summary updated (23s)
10. Post-Event Report generated (26s)
11. Press release drafted (28.5s)
12. Webcast Recap + Podcast ready (31s)
13. 47 personalized follow-ups sent (33.5s)
14. ROI realized: 2.7× across all features (36s)

Each completed step shows a "Go to [page]" navigation link.  
Panel includes a progress bar and replay button.  
Toast notifications fire for each step.

---

## 4. Database Tables (Full Reference)

All tables use MySQL InnoDB with `INT AUTO_INCREMENT PRIMARY KEY`.  
Production DB is provisioned via Replit's built-in MySQL integration.

Key tables for this release:
```sql
operator_link_analytics (id, operator_id, link_path, link_title, category, accessed_at, time_spent_seconds, user_agent, ip_address, session_id)
operator_links_metadata (id, link_path UNIQUE, title, description, category, badge_type, sort_order, is_active, click_count, created_at, updated_at)
```

Other notable tables: `events`, `webcast_events`, `virtual_studios`, `esg_studio_flags`, `interconnection_activations`, `interconnection_analytics`, `studio_interconnections`, `attendee_registrations`, `ir_contacts`, `polls`, `compliance_flags`.

---

## 5. File Structure (New Files This Release)

```
client/src/pages/
  FeatureDetail.tsx          — All 16 AI feature detail pages (slug-based)
  BundleDetail.tsx           — All 6 bundle detail pages (slug-based)
  WorkflowsPage.tsx          — Recommended workflow sequences
  IntelligentBroadcasterPage.tsx — AI alert panel demo
  WebcastRecapPage.tsx       — Webcast recap generator
  TrainingSubPage.tsx        — Virtual Studio + AI features training
  OperatorQuickRef.tsx       — Support/docs/certification/feedback/dashboard
  OperatorLinks.tsx          — Full operator links directory + Simulate Event panel

server/routers/
  operatorLinksRouter.ts     — tRPC router: trackClick, getPopularLinks, getAnalyticsSummary

scripts/
  create-operator-link-analytics-tables.ts  — DB migration + seed script
```

---

## 6. GitHub Status

**Repository:** Linked via Replit GitHub integration  
**Main branch:** `main` — HEAD at `da7c745` (12 new pages + router + schema updates)  
**Demo branch:** `manus-demo` — complete 585-file snapshot for Manus deployment  

**To push updates to main:**
```bash
node scripts/github-push-manual.mjs
```

**To update the Manus demo branch:**
```bash
node scripts/create-manus-branch.mjs
```

---

## 7. Environment Variables Required

| Variable | Purpose | Where Set |
|----------|---------|-----------|
| `DATABASE_URL` | MySQL connection string | Replit Secrets |
| `OPENAI_API_KEY` | GPT-4o LLM calls | Replit OpenAI Integration |
| `ABLY_API_KEY` | Real-time pub/sub | Replit Secrets |
| `MUX_TOKEN_ID` | Video ingest | Replit Secrets |
| `MUX_TOKEN_SECRET` | Video ingest | Replit Secrets |
| `MUX_WEBHOOK_SECRET` | Webhook validation | Replit Secrets |
| `RECALL_AI_API_KEY` | Meeting bot | Replit Secrets |
| `SESSION_SECRET` | Cookie signing | Replit Secrets |

---

## 8. Running the Application

```bash
# Development
pnpm install
pnpm exec tsx watch server/_core/index.ts

# Run DB migrations (first time only)
pnpm exec tsx scripts/create-operator-link-analytics-tables.ts

# Access the app
# Development: http://localhost:5000
# Production:  https://curalive-mdu4k2ib.manus.space
```

The app serves both the API (`/trpc/*`) and the React frontend from the same Express server on port 5000.

---

## 9. Demo Walkthrough for Investors/Clients

**Recommended demo path (15 minutes):**

1. `/operator-links` — Overview of the full platform, then click **Run Demo Simulation**
2. Watch the 14-step simulation auto-run (37 seconds) showing the complete event lifecycle
3. Navigate to `/webcast-studio/q4-earnings-2026?simulate=1` — full live event operator view
4. `/feature-map` — Interactive AI feature interconnection visualization
5. `/admin/interconnection-analytics` — ROI tracking and adoption metrics
6. `/post-event/q4-earnings-2026` — AI-generated post-event report
7. `/virtual-studio` — Bundle-specific broadcast studio configuration

**Capital Markets demo:** Use event slug `q4-earnings-2026`  
**Webcasting demo:** Use event slug `ceo-town-hall-q1-2026`

---

## 10. Known Limitations / Next Steps

- **Ably integration:** Requires `ABLY_API_KEY` secret. Without it, real-time features fall back to polling.
- **Mux video:** Live video stream requires active Mux stream key. Demo shows static player UI without active stream.
- **Recall.ai:** Meeting bot requires valid API key. AI transcription works independently via OpenAI Whisper.
- **Link analytics tracking:** The `trackClick` mutation is wired to the tRPC router but not yet called from individual link cards (can be added in a follow-up sprint).

---

*Document generated March 10, 2026 — CuraLive v2.0 AI Interconnection Release*
