# Chorus.AI — Live Event Intelligence Platform

**GitHub Repository Setup Guide**

---

## Quick Start

### For Manus
```bash
cd /home/ubuntu/chorus-ai
git remote add github https://github.com/username/chorus-ai.git
git push github ManusChatgpt:main
```

### For ChatGPT
```bash
git clone https://github.com/username/chorus-ai.git
cd chorus-ai
git checkout main  # ManusChatgpt is now main
pnpm install
pnpm dev
```

### For Replit
```bash
git clone https://github.com/username/chorus-ai.git
cd chorus-ai
pnpm install
pnpm dev
```

---

## Repository Structure

```
chorus-ai/
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       ├── sync-manus-to-github.yml
│       ├── test-and-build.yml
│       └── deploy-staging.yml
├── client/                     # React frontend
│   └── src/
│       ├── pages/             # Page components
│       ├── components/        # Reusable components
│       └── lib/               # Utilities
├── server/                     # Express backend
│   ├── routers/               # tRPC procedures
│   ├── middleware/            # Auth, logging, rate limiting
│   └── _core/                 # Framework
├── drizzle/                    # Database schema & migrations
├── infrastructure/             # Terraform & deployment
│   ├── terraform/             # AWS infrastructure
│   ├── monitoring/            # Prometheus & alerts
│   └── runbooks/              # Operational procedures
├── GITHUB_SYNC_SETUP.md        # Sync configuration guide
├── PLATFORM_COLLABORATION_GUIDE.md  # Collaboration framework
├── CODE_TRUTH_AUDIT_c9dd191.md # Code audit report
└── README.md                   # This file
```

---

## Branches

| Branch | Purpose | Owner |
|--------|---------|-------|
| `main` | Production-ready code | All |
| `ManusChatgpt` | Development branch | Manus |
| `chatgpt/*` | ChatGPT features | ChatGPT |
| `replit/*` | Replit features | Replit |
| `fix/*` | Bug fixes | Any |
| `docs/*` | Documentation | Any |

---

## Development Setup

### Prerequisites
- Node.js 22.x
- pnpm 9.x
- MySQL 8.x (or compatible)

### Installation

```bash
# Clone repository
git clone https://github.com/username/chorus-ai.git
cd chorus-ai

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Available Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm test         # Run tests
pnpm lint         # Run linter
pnpm format       # Format code
pnpm tsc          # TypeScript check
pnpm db:push      # Database migrations
```

---

## Features

### ✅ Implemented
- **Operator Console** — Real-time session management, Q&A moderation
- **Moderator Dashboard** — Advanced Q&A filtering and bulk actions
- **Presenter Teleprompter** — Live transcript and approved Q&A queue
- **Attendee Dashboard** — Live transcript, Q&A submission, engagement metrics
- **Admin Dashboard** — Event management, operator management, analytics
- **Post-Event Analytics** — AI summaries, sentiment analysis, compliance reports
- **Session State Machine** — Lifecycle management (idle → running → paused → ended)
- **Q&A Moderation** — Approve, reject, hold, assign questions
- **Compliance Scoring** — Real-time compliance risk assessment
- **Custom Compliance Rules** — Keyword, pattern, sentiment-based filtering
- **Audit Logging** — Complete action history with immutable trail
- **Real-Time Updates** — Ably WebSocket for live data sync

### ⚠️ In Progress
- **Real Transcript Streaming** — Recall.ai webhook integration
- **AI Insights** — Real sentiment analysis and topic extraction
- **Mobile App** — React Native/Expo for iOS/Android

### ❌ Not Started
- **Teams Bot Integration** — Native Microsoft Teams support
- **Zoom Integration** — Native Zoom RTMS support
- **Advanced Analytics** — Speaker performance scoring, trend analysis

---

## Architecture

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **tRPC** for type-safe API calls
- **Ably** for real-time updates
- **shadcn/ui** for components

### Backend
- **Express 4** for HTTP server
- **tRPC 11** for RPC framework
- **Drizzle ORM** for database access
- **MySQL** for data persistence
- **Redis** for caching and sessions

### Infrastructure
- **AWS** for cloud hosting
- **Terraform** for infrastructure-as-code
- **Prometheus** for monitoring
- **GitHub Actions** for CI/CD

---

## Code Review Process

### Before Merging

1. **Code Quality**
   ```bash
   pnpm tsc --noEmit  # Zero TypeScript errors
   pnpm test          # All tests passing
   pnpm build         # Builds successfully
   ```

2. **Code-Truth Verification**
   - Is this real implementation or mock data?
   - Are backend procedures implemented?
   - Do tests prove the workflow?
   - Is this production-ready?

3. **Documentation**
   - README updated if needed
   - Code comments for complex logic
   - todo.md marked [x] for completed items

4. **Review Approval**
   - At least one approval from another platform
   - All conversations resolved
   - All checks passing

---

## Deployment

### Staging (Automatic)
- Triggered on push to `main` or `ManusChatgpt`
- Runs tests and builds
- Deploys to staging environment
- URL: `https://staging.chorusai.manus.space`

### Production (Manual)
- Create release branch: `git checkout -b release/v1.0.0`
- Update version numbers
- Create Pull Request
- Get approvals from all platforms
- Merge to main and tag release

---

## Collaboration

### Communication
- **GitHub Issues** — Bug reports, feature requests
- **Pull Request Comments** — Code review feedback
- **Commit Messages** — Clear, descriptive messages

### Sync Frequency
- **Automated** — Every 6 hours (Manus → GitHub)
- **Manual** — On demand (ChatGPT/Replit → GitHub)

### Branch Naming
- `chatgpt/feature-name` — ChatGPT features
- `replit/feature-name` — Replit features
- `fix/bug-description` — Bug fixes
- `docs/topic-name` — Documentation

---

## Troubleshooting

### "TypeScript errors"
```bash
pnpm tsc --noEmit  # See errors
# Fix the code
```

### "Tests failing"
```bash
pnpm test          # See which tests fail
# Fix the code
```

### "Merge conflicts"
```bash
git status         # See conflicted files
# Edit files to resolve
git add .
git commit -m "fix: Resolve conflicts"
```

### "Build failing"
```bash
pnpm build         # See build errors
# Fix the code
```

---

## Performance Targets

| Component | Target | Status |
|-----------|--------|--------|
| Operator Console | <200ms | ⏳ In Progress |
| Moderator Dashboard | <300ms | ⏳ In Progress |
| Presenter Teleprompter | <100ms | ⏳ In Progress |
| Attendee Dashboard | <500ms | ⏳ In Progress |
| Post-Event Analytics | <2s | ⏳ In Progress |

---

## Security

- ✅ OAuth 2.0 authentication
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting on all endpoints
- ✅ Audit logging for all actions
- ✅ Data encryption at rest and in transit
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ CSRF protection
- ✅ XSS prevention

---

## Support

**For issues:**
1. Check existing GitHub issues
2. Create new issue with clear description
3. Include error messages and steps to reproduce
4. Tag relevant platform: `@manus`, `@chatgpt`, `@replit`

**For sync issues:**
1. Check GitHub Actions logs
2. Review recent commits
3. Contact Manus team

---

## License

Proprietary — Chorus.AI Platform

---

## Contributors

- **Manus** — Infrastructure, deployment, webhooks
- **ChatGPT** — Architecture, code review, features
- **Replit** — Testing, prototyping, validation

---

**Ready to collaborate!** 🚀

See `PLATFORM_COLLABORATION_GUIDE.md` for detailed collaboration framework.
