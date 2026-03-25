# CuraLive — GitHub Codespaces Setup Guide

## Quick Start (5 minutes)

### 1. Open in Codespaces
- Go to `github.com/davecameron187-sys/curalive-platform`
- Click **Code** → **Codespaces** → **Create codespace on main**
- Wait for the container to build (~3-5 minutes first time)

### 2. Set Your API Keys
After the Codespace opens, edit the `.env` file:
```bash
cp .env.codespace .env
```

Edit `.env` and fill in your real keys:
```
DATABASE_URL=postgresql://vscode@localhost:5432/curalive
OPENAI_API_KEY=sk-your-real-key
RECALL_AI_API_KEY=your-real-recall-key
MUX_WEBHOOK_SECRET=your-real-mux-secret
```

### 3. Set Up the Database
```bash
pnpm run db:push
```

### 4. Run the App
**Development mode** (hot reload, port 5000):
```bash
pnpm run dev
```

**Production mode** (bundled, port 23636):
```bash
npm run build
npm run start
```

Codespaces will automatically forward the port and give you a URL to access CuraLive.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (auto-configured in Codespace) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for AI modules (GPT-4, Whisper) |
| `RECALL_AI_API_KEY` | Yes | Recall.ai key for meeting bot integration |
| `MUX_WEBHOOK_SECRET` | No | Mux webhook verification |
| `RESEND_API_KEY` | No | Resend email service key |
| `APP_URL` | No | Public URL for webhooks (set to Codespace forwarded URL) |
| `NODE_ENV` | Auto | `development` for dev, `production` for build |

### Replit-Specific Variables (NOT needed in Codespaces)
These are automatically provided by Replit and are NOT needed in Codespaces:
- `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` — Replit's AI proxy; CuraLive falls back to direct OpenAI API when these are absent
- `REPLIT_DEV_DOMAIN` / `REPLIT_DEPLOYMENT_URL` — The code falls back to `APP_URL` or `window.location.origin`
- `REPL_ID` — Only used by mockup sandbox dev tooling

---

## Webhook Configuration for Shadow Mode

Shadow Mode uses Recall.ai which sends webhooks back to CuraLive. In Codespaces:

1. When the Codespace starts, note your forwarded URL (e.g., `https://abc123-5000.app.github.dev`)
2. Set `APP_URL` in your `.env` to this URL
3. Make sure port 5000 visibility is set to **Public** in the Ports tab
4. The app will use `APP_URL` as the webhook base when `REPLIT_DEV_DOMAIN` is not present

---

## Architecture
```
CuraLive Platform
├── client/          → React 19 + Vite frontend
├── server/          → Express + tRPC backend
│   ├── _core/       → Server entry, env, LLM, auth
│   ├── routers/     → tRPC route handlers
│   └── services/    → Business logic services
├── drizzle/         → Database schema + migrations
├── dist/            → Production build output
└── uploads/         → File uploads (recordings, etc.)
```

- **Dev server**: Port 5000 (Express serves both API and Vite dev middleware)
- **Prod server**: Port 23636 (Express serves API + static built frontend)
- **Database**: PostgreSQL 16

---

## Troubleshooting

### Database connection fails
```bash
sudo service postgresql start
sudo -u postgres createdb curalive
```

### Missing pnpm
```bash
npm install -g pnpm@10
```

### Build fails with memory error
The build script already sets `--max-old-space-size=4096`. If still failing:
```bash
NODE_OPTIONS='--max-old-space-size=8192' npm run build
```

### AI features not working
Make sure `OPENAI_API_KEY` is set in `.env`. The app falls back to direct OpenAI when Replit's Forge proxy is unavailable.
