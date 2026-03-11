# CuraLive — Tech Stack Brief
**Last updated: March 2026 | Platform version: 1.0.0**

---

## Platform Overview

CuraLive is a full-stack, real-time investor events platform built as a single unified monorepo. The frontend and backend share one codebase, one TypeScript config, and one package manager. There is no separate frontend or backend repo.

**Live dev URL:** `https://1f99a8d9-3543-48bc-8564-b0463564e29d-00-35t44cvw87il9.picard.replit.dev`
**Entry command:** `NODE_ENV=development pnpm exec tsx watch server/_core/index.ts`
**Port:** 5000 (single port serves both API and client)

---

## Monorepo Structure

```
/
├── client/               → React frontend
│   ├── src/
│   │   ├── pages/        → All page components (~80 pages)
│   │   ├── components/   → Shared UI components
│   │   ├── lib/          → Utilities, trpc client, hooks
│   │   └── App.tsx       → Router (wouter)
│   └── public/           → Static assets
├── server/               → Express backend
│   ├── _core/            → index.ts, trpc.ts, llm.ts, db.ts, env.ts
│   ├── routers/          → All tRPC routers (~30 routers)
│   ├── services/         → Business logic services (~25 services)
│   ├── routers.ts        → Central router registration
│   └── webhooks/         → Recall.ai webhook handler
├── shared/               → Types shared between client + server
├── scripts/              → DB migration scripts
├── attached_assets/      → Uploaded documents/specs
└── docs/                 → Specs and guides
```

---

## Language & Runtime

| Layer | Technology |
|---|---|
| Language | TypeScript 5.9.3 (strict mode, full-stack) |
| Runtime | Node.js (via tsx for development watch mode) |
| Package manager | pnpm 10.4.1 |
| Module system | ESM (`"type": "module"`) |
| TypeScript config | Single `tsconfig.json` covering client + server + shared |

---

## Frontend Stack

| Concern | Technology | Notes |
|---|---|---|
| Framework | React 19.2.1 | Latest stable |
| Build tool | Vite 7.1.7 | Serves from `client/` root |
| Routing | wouter 3.3.5 | Lightweight client-side router |
| Styling | Tailwind CSS 4.1.14 | Via `@tailwindcss/vite` plugin |
| UI components | Radix UI (full suite) | Accordion, Dialog, Tabs, Select, etc. |
| Icons | lucide-react 0.453.0 | |
| Charts | Recharts 2.15.2 + Chart.js 4.5.1 | Used across all intelligence pages |
| Animation | Framer Motion 12.23.22 | |
| Forms | react-hook-form 7.64.0 + @hookform/resolvers | Zod validation |
| Toast | sonner 2.0.7 | `toast.success()` / `toast.error()` — no other toast lib |
| Theme | next-themes 0.4.6 | Dark mode support |
| Data fetching | @tanstack/react-query 5.90.2 + tRPC client | |
| Path aliases | `@/` → `client/src/`, `@shared/` → `shared/` | |

**Path aliases (vite.config.ts):**
```typescript
"@": "client/src"
"@shared": "shared"
"@assets": "attached_assets"
```

---

## Backend Stack

| Concern | Technology | Notes |
|---|---|---|
| Server | Express 4.21.2 | |
| API layer | tRPC 11.6.0 | Type-safe end-to-end API, no REST |
| Serialization | superjson 1.13.3 | Handles dates, Maps, etc. |
| Rate limiting | express-rate-limit 8.3.0 | Applied globally |
| Validation | zod 4.1.12 | All tRPC inputs validated with Zod |
| Auth | jose 6.1.0 (JWT) | Dev bypass active in development mode |

**tRPC pattern (all routers):**
```typescript
// @ts-nocheck               ← required on all router files
import { router, publicProcedure } from "../_core/trpc"  // exact path
```

**Auth bypass:** `AUTH_BYPASS=true` env var or `NODE_ENV=development` skips auth automatically.

---

## Database

| Concern | Technology |
|---|---|
| Engine | MySQL (managed, Replit-hosted) |
| ORM | Drizzle ORM 0.44.5 |
| Driver | mysql2 3.15.0 |
| Schema toolkit | drizzle-kit 0.31.4 |
| Migrations | **Custom scripts only** — `pnpm exec tsx scripts/create-*-tables.ts` |

**CRITICAL: Never use `pnpm db:push` for new intelligence tables. Always use custom migration scripts.**

**Raw query pattern (required for complex SQL):**
```typescript
const db = await getDb();
const conn = (db as any).session?.client ?? (db as any).$client;
const [rows] = await conn.execute(sql, params);
```

**Database tables:**

| Table | Feature | Notes |
|---|---|---|
| `users` | Auth | |
| `sessions` | Auth | |
| `events` | Core | All investor events |
| `transcripts` | Core | Live + archive transcripts |
| `metrics` | Core | Real-time event metrics |
| `chat_messages` | Core | Attendee Q&A |
| `investor_questions` | IQI | AI-scored question database |
| `market_reaction_correlations` | Market Reaction | Comm → market outcome mapping |
| `communication_index_snapshots` | CICI | Quarterly index snapshots |
| `aggregate_intelligence` | Benchmarks | Anonymised sector benchmarks |
| `intelligence_reports` | IIR | Post-event AI reports |
| `call_preparations` | ECPI | Pre-event AI briefings |

**ID pattern:** MySQL AUTO_INCREMENT integers (not `serial()`, not UUIDs).

---

## AI / LLM

| Concern | Technology |
|---|---|
| Provider | OpenAI GPT-4o |
| Integration | Replit AI Integration (managed credentials) |
| Client | openai npm package 6.27.0 |
| Wrapper | `invokeLLM()` from `server/_core/llm.ts` |

**Environment variables (set by Replit integration — never hardcode):**
- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`

**LLM call pattern:**
```typescript
const result = await invokeLLM({ messages: [...], model: "gpt-4o" });
const content = result.choices?.[0]?.message?.content;
```

---

## Real-Time Layer

| Concern | Technology |
|---|---|
| Real-time pub/sub | Ably 2.18.0 | Live event data, co-pilot signals |
| Transcription | Recall.ai (webhook at `/webhooks/recall`) |
| Audio processing | Custom audio worklets (client/replit_integrations/audio/) |

**Ably env var:** `ABLY_API_KEY`

---

## Media & Communications

| Concern | Technology | Notes |
|---|---|---|
| Video hosting | Mux (@mux/mux-node, @mux/mux-player-react) | Webcast video |
| Telephony (primary) | Twilio (@twilio/voice-sdk, twilio) | Conference calls |
| Telephony (secondary) | Telnyx | Alternative dial-in |
| Email | Resend 6.9.3 | Transactional email |
| File uploads | multer 2.1.0 | Audio, transcript, slide uploads |
| PDF generation | puppeteer 24.38.0 | Billing PDFs |
| Archive creation | archiver 7.0.1 | Zip exports |
| S3 storage | @aws-sdk/client-s3 | Document storage |

**Secrets:**
- `MUX_WEBHOOK_SECRET`
- `RECALL_AI_API_KEY`

---

## Key Services (server/services/)

| Service | Purpose |
|---|---|
| `TranscriptionService.ts` | Live audio → text pipeline |
| `SentimentAnalysisService.ts` | Real-time sentiment scoring |
| `LiveRollingSummaryService.ts` | Live event summarisation |
| `AblyRealtimeService.ts` | Ably connection management |
| `ComplianceModerator.ts` | Disclosure risk detection |
| `WebcastRecapService.ts` | Post-event recap generation |
| `PodcastConverterService.ts` | Audio format conversion |
| `SocialMediaService.ts` | Social post generation |
| `VirtualStudioService.ts` | Broadcast studio controls |
| `EventEchoPipeline.ts` | Multi-channel content distribution |
| `RedactionWorkflowService.ts` | Sensitive data redaction |
| `ToxicityFilterService.ts` | Q&A content moderation |

---

## tRPC Router Registry (server/routers.ts)

All routers must be registered here — import + add to `appRouter` object.

Current registered routers:
```
benchmarks, marketReaction, communicationIndex,
investorQuestions, intelligenceReport, callPrep,
intelligenceTerminal, shadowMode, archiveUpload,
transcript, transcription, sentiment, polls,
virtualStudio, postEventReport, scheduling,
operatorLinks, trainingMode, socialMedia,
taggedMetrics, interconnectionAnalytics,
liveRollingSummary, mobileNotifications,
transcriptEditor, admin
```

---

## Intelligence Feature Routes

The 5 lock-in features forming the full investor communication lifecycle:

```
PREPARE          → /call-preparation       (ECPI)
MONITOR LIVE     → /shadow-mode            (Real-Time Co-Pilot)
POST-EVENT       → /intelligence-report    (IIR)
DATABASE         → /investor-questions     (IQI)
BENCHMARK        → /benchmarks             (CICI + Sector Benchmarks)
```

**Plus:**
```
/intelligence-terminal   → Bloomberg-style terminal for financial professionals (Side 2)
/market-reaction         → Communication → market outcome correlation
/communication-index     → CICI quarterly index publisher
```

---

## Navigation Architecture

- **Main hub:** `/` → `OperatorLinks.tsx` — lists all features
- **Standalone pages (no back button, back-trap enabled):**
  - `/shadow-mode`
  - `/bastion`
  - `/lumi`
- **Back-trap hook:** `client/src/lib/useSmartBack.ts`
- **Back button component:** `client/src/components/BackToLinks.tsx`

---

## Partner Integration Pages

| Route | Partner | Notes |
|---|---|---|
| `/lumi` | Lumi Global | Audience engagement integration |
| `/bastion` | Bastion Capital | Investor partner integration |

---

## Build & Deployment

| Concern | Config |
|---|---|
| Dev server | `tsx watch server/_core/index.ts` on port 5000 |
| Production build | `vite build && esbuild server/_core/index.ts` |
| Production start | `node dist/index.js` |
| Hosting | Replit (development) |
| TypeScript check | `tsc --noEmit` |
| Tests | vitest 2.1.4 |

**Vite server config:**
```typescript
server: {
  host: "0.0.0.0",
  port: 5000,
  allowedHosts: true   // required for Replit proxy
}
```

---

## Environment Variables

| Variable | Source | Purpose |
|---|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit Integration | GPT-4o access |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit Integration | OpenAI base URL |
| `ABLY_API_KEY` | Secret | Real-time pub/sub |
| `MUX_WEBHOOK_SECRET` | Secret | Mux webhook validation |
| `RECALL_AI_API_KEY` | Secret | Recall.ai transcription |
| `NODE_ENV` | Runtime | `development` bypasses auth |
| `AUTH_BYPASS` | Optional | Explicit auth bypass flag |

---

## Code Conventions (important for any new work)

1. **All router files:** `// @ts-nocheck` at top — required
2. **tRPC import path:** always `"../_core/trpc"` — never `"../trpc"`
3. **DB migrations:** `pnpm exec tsx scripts/create-*-tables.ts` — never `pnpm db:push`
4. **Toast:** `sonner` only — `toast.success("msg")` / `toast.error("msg")`
5. **LLM:** `invokeLLM()` → `result.choices?.[0]?.message?.content`
6. **Raw SQL:** use the `conn.execute(sql, params)` pattern shown above
7. **DB inserts:** `const db = await getDb(); db!.insert(...)`
8. **IDs:** MySQL AUTO_INCREMENT integers — not `serial()`, not UUIDs
9. **Routing:** wouter `<Route path="..." component={...} />` in `App.tsx`
10. **getDb:** always `await getDb()` — async function

---

*CuraLive Intelligence Platform — Confidential*
