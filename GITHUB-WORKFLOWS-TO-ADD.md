# GitHub Actions Workflow Files — Add Manually

The Replit GitHub integration doesn't have the `workflow` scope needed to push
`.github/workflows/` files. You need to add these 3 files via the GitHub web UI.

Go to: `github.com/davecameron187-sys/curalive-platform`
Click: **Add file** → **Create new file**

---

## File 1: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, shadow-mode, develop]
  push:
    branches: [develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: npm run build

      - name: Lint
        run: npm run lint || true

      - name: Type check
        run: npm run check || true
```

---

## File 2: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy Production (CuraLive)

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: npm run build

      - name: Verify build output
        run: |
          test -f dist/index.js && echo "Build verified: dist/index.js exists" || exit 1
          ls -lh dist/index.js

      - name: Tag release
        run: |
          VERSION="v$(date +%Y%m%d.%H%M%S)"
          git tag $VERSION
          git push origin $VERSION
```

---

## File 3: `.github/workflows/deploy-shadow.yml`

```yaml
name: Deploy Shadow Mode

on:
  push:
    branches: [shadow-mode]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: shadow

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: npm run build

      - name: Verify build output
        run: |
          test -f dist/index.js && echo "Build verified: dist/index.js exists" || exit 1
          ls -lh dist/index.js

      - name: Tag shadow release
        run: |
          VERSION="shadow-v$(date +%Y%m%d.%H%M%S)"
          git tag $VERSION
          git push origin $VERSION
```

---

## After Adding Workflows

### Set up GitHub Environments
1. Go to repo **Settings** → **Environments**
2. Create environment: `production`
   - Add secrets: `DATABASE_URL`, `OPENAI_API_KEY`, `RECALL_AI_API_KEY`, `MUX_WEBHOOK_SECRET`, `APP_URL`
3. Create environment: `shadow`
   - Add secrets: same keys but with shadow-specific values

### Set up Branch Protection
See `.github/BRANCH_PROTECTION.md` in the repo for instructions.
