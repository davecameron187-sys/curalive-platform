# AGENTS.md

## Cursor Cloud specific instructions

### Overview

CuraLive is a real-time investor events platform (React 19 + Vite + Express + tRPC + MySQL via Drizzle ORM). The frontend and backend run as a single process on port 5000.

### Prerequisites

- **Node.js 20+** (v22 works fine)
- **pnpm 10.4.1** (specified in `packageManager` field in `package.json`)
- **MySQL 8.0** — required for most features; app starts without `DATABASE_URL` but DB features are disabled
- **ffmpeg** — required for audio/video processing (pre-installed in cloud VM)
- **Docker** — used to run MySQL in the cloud VM

### Running the dev server

```bash
DATABASE_URL="mysql://root:root@127.0.0.1:3306/curalive" NODE_ENV=development PORT=5000 pnpm dev
```

Auth is bypassed in development mode (`NODE_ENV=development`). The server runs on port 5000.

### Database setup

MySQL runs in Docker. To start it (if not already running):

```bash
sudo dockerd &>/tmp/dockerd.log &
sleep 5
sudo docker start mysql-dev 2>/dev/null || sudo docker run -d --name mysql-dev -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=curalive -p 3306:3306 mysql:8.0
```

After MySQL is up, run Drizzle migrations and the supplementary table-creation scripts:

```bash
export DATABASE_URL="mysql://root:root@127.0.0.1:3306/curalive"
pnpm exec drizzle-kit migrate
for script in scripts/create-*.ts; do pnpm exec tsx "$script" 2>/dev/null; done
```

**Important:** Do NOT use `pnpm db:push` — it can fail with "table already exists" errors. Use `drizzle-kit migrate` instead.

### Lint, test, and build

| Command | Description |
|---------|-------------|
| `pnpm lint` | ESLint (pre-existing warnings/errors in repo) |
| `pnpm test` | Vitest — needs `DATABASE_URL` set |
| `pnpm run build` | Production build (Vite + esbuild) |
| `pnpm check` | TypeScript type-check (`tsc --noEmit`) |

### Key gotchas

- The Drizzle migrations do not cover all tables. Many tables are created by `scripts/create-*.ts` scripts using raw SQL with `CREATE TABLE IF NOT EXISTS`. Always run these after migrations.
- Some test failures are pre-existing (e.g., missing `ABLY_API_KEY`, schema drift in test files). ~730 tests pass, ~60 fail due to these pre-existing issues.
- The `sharp` npm package requires its build script to run. It is listed in `pnpm.onlyBuiltDependencies` in `package.json`.
- External API keys (OpenAI, Ably, Recall.ai, etc.) are optional — the app degrades gracefully without them.
- The `webcast_events` table may need an `ai_application_ids TEXT` column added manually if the Drizzle migrations don't include it.
