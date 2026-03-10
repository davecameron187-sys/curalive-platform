# CuraLive — Full Tech Stack & Project Reference

> Upload this file to Manus at the start of every session to stay in sync with the Replit environment.
> Last updated: March 2026 | GitHub HEAD: `e5c5ea7` (main branch)

---

## 1. Project Overview

**CuraLive** is a real-time investor events platform for earnings calls, webcasts, and board briefings. It provides live transcription, AI summarisation, sentiment analysis, Q&A management, compliance tools, social media amplification, and multi-platform broadcasting.

- **Dev server**: port `5000` (Express serves both API and Vite-built frontend)
- **Repo**: `davecameron187-sys/curalive-platform` (GitHub, `main` branch)
- **Package manager**: pnpm 10.4.1

---

## 2. Tech Stack

### Frontend
| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19.2.1 |
| Build tool | Vite | 7.x |
| Routing | Wouter | 3.3.5 |
| Styling | TailwindCSS | 4.x |
| UI primitives | Radix UI | various |
| Animations | Framer Motion | 12.x |
| Charts | Recharts + Chart.js | 2.x / 4.x |
| Forms | React Hook Form + Zod | 7.x / 4.x |
| Toasts | **Sonner** (NOT shadcn useToast) | 2.0.7 |
| State/cache | TanStack React Query | 5.x |
| API client | tRPC React Query | 11.x |

### Backend
| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js + tsx | - |
| Server | Express | 4.x |
| API layer | tRPC | 11.x |
| Auth | JWT via `jose`, session cookies | 6.x |
| Validation | Zod | 4.x |
| File uploads | Multer | 2.x |
| Email | Resend | 6.x |
| Rate limiting | express-rate-limit | 8.x |

### Database
| Layer | Technology |
|---|---|
| Database | MySQL (external, via `DATABASE_URL`) |
| ORM | Drizzle ORM 0.44.x |
| Schema file | `drizzle/schema.ts` |
| Migrations | `drizzle/` folder (46 migration files) |
| Migration command | `pnpm exec tsx scripts/create-social-tables.ts` or direct SQL — **NEVER use `pnpm db:push`** |

### AI / LLM
| Layer | Technology |
|---|---|
| LLM provider | OpenAI (via Replit integration) |
| LLM wrapper | `server/_core/llm.ts` → `invokeLLM()` |
| `invokeLLM` params | `{ prompt, systemPrompt, response_format }` — **NO `temperature` field** |
| Valid response_format | `{ type: "json_object" }` or `{ type: "text" }` |
| Image gen | `server/_core/imageGeneration.ts` |

### Real-time
| Layer | Technology |
|---|---|
| Real-time pub/sub | Ably | 2.x |
| Service | `server/services/AblyRealtimeService.ts` |

### Media / Video
| Layer | Technology |
|---|---|
| Video streaming | Mux | `@mux/mux-node` 12.x, `@mux/mux-player-react` 3.x |
| Meeting bots | Recall.ai (`RECALL_AI_API_KEY` secret) |
| Mux webhooks | `MUX_WEBHOOK_SECRET` secret |
| Cloud storage | AWS S3 (`@aws-sdk/client-s3` 3.x) |

### Telephony / Voice
| Layer | Technology |
|---|---|
| Primary | Telnyx |
| Secondary | Twilio |
| Voice SDK | `@twilio/voice-sdk` 2.x |

### Payments
| Layer | Technology |
|---|---|
| Processor | Stripe | 20.x |

### DevOps / Deployment
| Layer | Technology |
|---|---|
| Dev workflow | `NODE_ENV=development pnpm exec tsx watch server/_core/index.ts` |
| Build | `pnpm run build` → Vite (client) + esbuild (server) |
| Run (prod) | `node dist/index.js` |
| Deployment target | Replit Autoscale |
| GitHub push | `node scripts/github-push-manual.mjs` (uses `@replit/connectors-sdk` + GraphQL) |

---

## 3. Project Structure

```
curalive/
├── client/
│   └── src/
│       ├── App.tsx                  # All routes defined here
│       ├── pages/                   # One file per page/route
│       └── components/              # Shared UI components
│           └── ui/                  # shadcn/ui primitives
├── server/
│   ├── _core/
│   │   ├── index.ts                 # Express app entry point
│   │   ├── trpc.ts                  # tRPC init + context
│   │   ├── llm.ts                   # invokeLLM() wrapper
│   │   ├── socialOAuth.ts           # OAuth configs for 5 social platforms
│   │   ├── oauth.ts                 # Main auth OAuth
│   │   ├── env.ts                   # Environment variable loading
│   │   └── vite.ts                  # Vite middleware for dev
│   ├── routers/                     # tRPC routers (one file per domain)
│   ├── services/                    # Business logic services
│   └── routers.ts                   # Root router — wires all sub-routers
├── drizzle/
│   ├── schema.ts                    # Full DB schema (source of truth)
│   ├── relations.ts                 # Drizzle relations
│   └── *.sql                        # Migration files (0000–0046)
├── shared/                          # Types shared between client and server
├── scripts/
│   ├── github-push-manual.mjs       # GitHub push via connector
│   └── create-social-tables.ts      # Social DB migration script
└── package.json                     # Single package.json for entire monorepo
```

---

## 4. All Routes (`client/src/App.tsx`)

| Path | Page Component | Description |
|---|---|---|
| `/` | `Home.tsx` | Landing / nav hub |
| `/event/:id` | `EventRoom.tsx` | Live event room (attendee) |
| `/webcast-studio` | `WebcastStudio.tsx` | Operator broadcast console |
| `/operator-console` | `OperatorConsole.tsx` | Main operator hub |
| `/operator-hub` | `OperatorHub.tsx` | Operator management |
| `/moderator` | `Moderator.tsx` | Q&A moderation console |
| `/moderator-qa` | `ModeratorQAConsole.tsx` | Q&A triage |
| `/presenter` | `Presenter.tsx` | Presenter view |
| `/attendee-room` | `AttendeeRoom.tsx` | Attendee room |
| `/sentiment` | `SentimentDashboard.tsx` | Live sentiment |
| `/analytics` | `AnalyticsDashboard.tsx` | Event analytics |
| `/webcast-analytics` | `WebcastAnalytics.tsx` | Webcast metrics |
| `/compliance` | `ComplianceDashboard.tsx` | Compliance tools |
| `/compliance-report` | `ComplianceReport.tsx` | Compliance report |
| `/compliance-audit` | `ComplianceAuditLog.tsx` | Audit log |
| `/transcript` | `TranscriptPage.tsx` | Transcript viewer |
| `/transcript-editor` | `TranscriptEditor.tsx` | Transcript editing |
| `/post-event` | `PostEvent.tsx` | Post-event tools |
| `/post-event-report` | `PostEventReport.tsx` | Automated report |
| `/followups` | `InvestorFollowUps.tsx` | Follow-up emails |
| `/ai-dashboard` | `AIDashboard.tsx` | AI features overview |
| `/ai-shop` | `AIShop.tsx` | 6 AI bundles + app marketplace |
| `/ai-onboarding` | `AIOnboarding.tsx` | Guided quiz → bundle recommendation |
| `/social` | `SocialMediaPage.tsx` | Social Command Center |
| `/billing` | `Billing.tsx` | Billing / subscription |
| `/occ` | `OCC.tsx` | Operator Command Centre |
| `/admin` | `AdminPanel.tsx` | Admin panel |
| `/on-demand` | `OnDemandLibrary.tsx` | On-demand video library |
| `/client-portal` | `ClientPortal.tsx` | Client-facing portal |
| `/roadshow/:id` | `RoadshowDetail.tsx` | Roadshow detail |
| `/training` | `Training.tsx` | Training mode |
| `/integration-hub` | `IntegrationHub.tsx` | Third-party integrations |

---

## 5. tRPC Routers (`server/routers/`)

All routers are wired in `server/routers.ts`. tRPC endpoint: `/api/trpc/`

| Router file | Key domain |
|---|---|
| `aiRouter.ts` | AI features, LLM calls |
| `aiApplications.ts` | AI app catalogue |
| `aiDashboard.ts` | AI dashboard data |
| `aiFeatures.ts` | Feature flags for AI |
| `analytics.ts` | Event analytics |
| `billingRouter.ts` + `billing.ts` | Stripe billing |
| `branding.ts` | White-label branding |
| `clientPortal.ts` | Client portal data |
| `compliance.ts` | Compliance checks |
| `contentTriggers.ts` | Content generation triggers |
| `customisationRouter.ts` | UI customisation |
| `eventBriefRouter.ts` | AI event briefs |
| `followups.ts` | Investor follow-up emails |
| `liveRollingSummary.ts` | Rolling AI summaries |
| `liveVideo.ts` | Mux video streams |
| `mobileNotifications.ts` | Push notifications |
| `muxRouter.ts` | Mux asset management |
| `occ.ts` | Operator Command Centre |
| `polls.ts` | Live polls |
| `postEventReport.ts` | Automated post-event report |
| `recallRouter.ts` | Recall.ai meeting bots |
| `roadshowAI.ts` | Roadshow AI tools |
| `scheduling.ts` | Event scheduling |
| `sentiment.ts` | Sentiment snapshots |
| `socialMedia.ts` | **Social Media Amplification (12 procedures)** |
| `trainingMode.ts` | Training mode |
| `transcriptEditorRouter.ts` | Transcript editing |
| `transcription.ts` | Live transcription |
| `webcastRouter.ts` | Webcast management |
| `webphoneRouter.ts` | Telnyx/Twilio webphone |

---

## 6. Backend Services (`server/services/`)

| Service | Purpose |
|---|---|
| `AblyRealtimeService.ts` | Ably pub/sub channels |
| `ComplianceModerator.ts` | LLM compliance checks + audit log |
| `ContentGenerationTriggerService.ts` | Auto-triggers for content generation |
| `ContentPerformanceAnalyticsService.ts` | Content ROI analytics |
| `EventBriefGeneratorService.ts` | AI event brief generation |
| `EventEchoPipeline.ts` | Live event → social posts (AI pipeline) |
| `LiveRollingSummaryService.ts` | Real-time rolling summaries |
| `QaAutoTriageService.ts` | Auto-categorise Q&A submissions |
| `RealtimeCollaborationService.ts` | Multi-user real-time collaboration |
| `RedactionWorkflowService.ts` | PII redaction in transcripts |
| `SentimentAnalysisService.ts` | Sentiment scoring |
| `SocialMediaService.ts` | Social CRUD, publish, ROI analytics |
| `SpeakingPaceCoachService.ts` | Real-time presenter coaching |
| `ToxicityFilterService.ts` | Toxic content detection |
| `TranscriptEditorService.ts` | Collaborative transcript editing |
| `TranscriptionService.ts` | Live transcription processing |

---

## 7. Database Schema Overview (`drizzle/schema.ts`)

### Core Tables
- `webcastEvents` — events (id, title, status, scheduledAt, …)
- `webcastRegistrations` — attendee registrations
- `occTranscriptionSegments` — live transcript segments (`content` field, NOT `text`)
- `sentimentSnapshots` — sentiment scores (`overallScore` int — NO `label` field)
- `qaSubmissions` — Q&A questions from attendees
- `pollQuestions` / `pollResponses` — live poll data

### Social Media Tables (added Session 3)
- `social_media_accounts` — linked OAuth accounts per platform
- `social_posts` — post drafts and published posts
- `social_post_platforms` — per-platform status of each post
- `social_metrics` — engagement/reach metrics per post
- `social_audit_log` — compliance moderation audit trail

### Other Key Tables
- `users`, `sessions` — auth
- `billingSubscriptions`, `billingInvoices` — Stripe billing
- `aiApplications`, `aiFeatureFlags` — AI shop catalogue
- `brandingConfigs` — white-label settings
- `roadshows`, `roadshowMeetings` — investor roadshow management

---

## 8. Social Media Amplification Feature (`/social`)

### What it does
Transforms live event data (transcription + sentiment + Q&A) into compliance-checked, platform-optimised social posts via an AI pipeline. Supports LinkedIn, Twitter/X, Facebook, Instagram, TikTok.

### Key files
| File | Role |
|---|---|
| `client/src/pages/SocialMediaPage.tsx` | Social Command Center — 4 tabs |
| `client/src/components/SocialPostCreator.tsx` | Manual post composer |
| `client/src/components/SocialMediaLinking.tsx` | OAuth platform connect/disconnect |
| `client/src/components/SocialAnalyticsDashboard.tsx` | ROI metrics dashboard |
| `server/routers/socialMedia.ts` | 12 tRPC procedures |
| `server/services/EventEchoPipeline.ts` | AI post generation from event data |
| `server/services/SocialMediaService.ts` | CRUD + publish + analytics |
| `server/services/ComplianceModerator.ts` | LLM moderation + audit log |
| `server/_core/socialOAuth.ts` | OAuth configs for 5 platforms |

### tRPC procedures
`getLinkedAccounts`, `getPlatformStatus`, `getOAuthUrl`, `unlinkAccount`, `linkDemoAccount`, `createPost`, `listPosts`, `generateEchoPost`, `moderatePost`, `moderateContent`, `publishPost`, `getAggregateAnalytics`, `getEventSocialROI`

### OAuth env vars needed to go live
```
LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
TWITTER_CLIENT_ID / TWITTER_CLIENT_SECRET
FACEBOOK_APP_ID / FACEBOOK_APP_SECRET
INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET
TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET
```
OAuth callback URL pattern: `/api/social/oauth/callback/[platform]`

---

## 9. AI Shop (`/ai-shop`)

6 role-based bundles:
| ID | Name | Price |
|---|---|---|
| A | Investor Relations | $299/mo |
| B | Compliance & Risk | $299/mo |
| C | Operations & Efficiency | $299/mo |
| D | Content Marketing | $299/mo |
| E | Premium All-Access | $499/mo |
| F | Social Amplification | $199/mo add-on |

---

## 10. Critical Development Rules

### Toast notifications
**Use `sonner` only — never shadcn `useToast`.**
```tsx
import { toast } from "sonner";
toast.success("Message");
toast.error("Error message");
toast("Title", { description: "Details here" });
// NEVER: toast({ title: "...", variant: "destructive" })
```

### LLM calls
```typescript
import { invokeLLM } from "../_core/llm";
const result = await invokeLLM({
  prompt: "...",
  systemPrompt: "...",
  response_format: { type: "json_object" },  // Note: response_format, not responseFormat
  // NO temperature field — not supported
});
```

### Schema field names (common gotchas)
- `occTranscriptionSegments.content` — transcript text field is `content`, NOT `text`
- `sentimentSnapshots.overallScore` — integer, no `label` field exists
- `webcastEvents.title` — has `title` but NO `company` field
- `occTranscriptionSegments.conferenceId` — varchar(128)

### JSX rule
Never put `{/* comments */}` after closing `</div>` tags on the same line.

### Auth in dev
`DEV_BYPASS` is active: `ctx.user = { id: 0, name: 'Dev Operator', role: 'operator' }`.

### URL / routing in components
Use `window.location.search` for query params — do NOT use `useSearch()` from wouter.

### Database migrations
- **Never** run `pnpm db:push` for new tables
- Use `pnpm exec tsx scripts/create-social-tables.ts` or write direct SQL

### GitHub push
Run `node scripts/github-push-manual.mjs` from workspace root. Uses `@replit/connectors-sdk` + GraphQL `createCommitOnBranch` mutation. State stored in `.git/github-push-state.json`.

---

## 11. Environment Secrets (already configured in Replit)

| Secret | Used for |
|---|---|
| `MUX_WEBHOOK_SECRET` | Mux webhook signature verification |
| `RECALL_AI_API_KEY` | Recall.ai meeting bot API |

Replit integrations installed:
- `github` — GitHub connector for push/pull
- `javascript_openai_ai_integrations` — OpenAI LLM access

---

## 12. Key Scripts

```bash
pnpm dev                          # Start dev server (port 5000)
pnpm run build                    # Build for production
pnpm check                        # TypeScript type check
node scripts/github-push-manual.mjs  # Push to GitHub
pnpm exec tsx scripts/create-social-tables.ts  # Run DB migration
```
