# Chorus.AI Platform — Revised Roadmap

**Effective Date:** March 28, 2026  
**Status:** Production-Ready Code Base with Focused Execution Path  
**Checkpoint:** d831d52e → Updated to 4fd5b782

---

## Strategic Shift

**Removed from Roadmap:** Teams and Zoom native integrations. The platform uses Recall.ai universal bot as the primary integration strategy, eliminating the need for platform-specific bot architecture.

**New Focus:** Production safety, console performance, enterprise security, and high-value customer features.

---

## Revised Priority Order

### 🔴 CRITICAL PRIORITY 1: Production Deployment Readiness

**Status:** ⏳ In Progress  
**Timeline:** 2-3 weeks  
**Blocking:** All production operations

Production deployment is now the main blocking work. This is not a vague "deployment ready" claim—it means the environment is actually configured, testable, observable, and recoverable.

**Required Work:**

- **Infrastructure Setup**
  - Production environment provisioning (compute, networking, storage)
  - SSL/TLS certificate configuration (Let's Encrypt or custom CA)
  - Load balancer setup with health checks and auto-scaling
  - Database replication and failover configuration
  - Redis cluster setup for caching layer

- **Monitoring & Alerting**
  - Application performance monitoring (APM) integration
  - Error tracking and alerting (Sentry, DataDog, or equivalent)
  - Real-time dashboard for key metrics (uptime, latency, error rate)
  - Alert thresholds and escalation procedures
  - Log aggregation and retention policy

- **Backup & Disaster Recovery**
  - Automated daily database backups with point-in-time recovery
  - Backup verification and restore testing
  - Disaster recovery runbook with RTO/RPO targets
  - Geographic redundancy strategy
  - Failover testing procedures

- **Deployment & Rollout**
  - CI/CD pipeline configuration (GitHub Actions or equivalent)
  - Blue-green deployment strategy
  - Canary release procedures
  - Rollback automation
  - Deployment validation checklist

- **Operational Readiness**
  - On-call rotation and escalation procedures
  - Runbooks for common incidents
  - Performance baseline establishment
  - Capacity planning documentation
  - Change management process

**Success Criteria:**
- Environment is fully configured and tested
- All monitoring dashboards are live and alerting
- Backup/restore procedures are validated
- Deployment pipeline is automated
- Team is trained on operational procedures
- Production deployment checklist is 100% complete

**Deliverables:**
- `PRODUCTION_DEPLOYMENT_GUIDE.md` (comprehensive)
- `OPERATIONAL_RUNBOOK.md`
- `DEPLOYMENT_CHECKLIST.md`
- `DISASTER_RECOVERY_PLAN.md`
- Infrastructure-as-Code (Terraform or CloudFormation)

---

### 🟡 CRITICAL PRIORITY 2: Performance Optimization

**Status:** ⏳ Not Started  
**Timeline:** 2-3 weeks  
**Focus:** Live operator surfaces

Optimize the surfaces that matter most during live operations. Use this architecture model:

- **Database** = source of truth
- **Ably** = real-time fanout
- **Redis** = derived cache / fast read layer
- **Client cache** = convenience only

**Do NOT use cache as truth for:**
- Session lifecycle
- Moderation state
- Operator actions
- Handoff state

**Optimization Targets (Priority Order):**

1. **Operator Console** (Highest Priority)
   - Real-time session state updates
   - Live Q&A moderation responsiveness
   - Sentiment analysis display latency
   - Compliance scoring performance
   - Operator notes persistence

2. **Moderator Dashboard** (High Priority)
   - Q&A list filtering and sorting
   - Bulk action performance
   - Priority scoring calculations
   - Auto-moderation rule evaluation

3. **Presenter Teleprompter** (High Priority)
   - Live transcript scrolling smoothness
   - Approved Q&A queue updates
   - Keyboard navigation responsiveness

4. **Attendee Dashboard** (Medium Priority)
   - Live transcript display
   - Upvoting responsiveness
   - Engagement metrics updates

5. **Post-Event Analytics** (Medium Priority)
   - Report generation performance
   - Historical data queries
   - Export functionality

**Optimization Techniques:**

- **Database Query Optimization**
  - Profile slow queries using EXPLAIN ANALYZE
  - Add strategic indexes on frequently filtered columns
  - Optimize JOIN operations
  - Implement query result caching where appropriate

- **Redis Caching Strategy**
  - Cache derived analytics (sentiment trends, speaker scores)
  - Cache frequently accessed lookups (user roles, event configs)
  - Implement cache invalidation on state changes
  - Use Redis for rate limiting and session storage

- **Real-Time Optimization**
  - Reduce unnecessary Ably message frequency
  - Batch updates where possible
  - Implement debouncing on client-side updates
  - Optimize WebSocket connection pooling

- **Frontend Code Splitting**
  - Lazy-load console surfaces
  - Implement route-based code splitting
  - Optimize bundle size
  - Reduce initial page load time

- **API Response Compression**
  - Enable gzip compression on all endpoints
  - Implement pagination for large result sets
  - Return only necessary fields in responses

**Success Criteria:**
- Operator Console: <200ms response time for all operations
- Moderator Dashboard: <300ms for Q&A filtering
- Presenter Teleprompter: <100ms for transcript updates
- Attendee Dashboard: <500ms for engagement updates
- Post-Event Analytics: <2s for report generation
- All surfaces remain stable under 1000+ concurrent users

**Deliverables:**
- Performance baseline report
- Query optimization documentation
- Caching strategy guide
- Load testing results
- Performance monitoring dashboard

---

### 🟢 CRITICAL PRIORITY 3: Security Hardening

**Status:** ⏳ Not Started  
**Timeline:** 1-2 weeks  
**Focus:** Pre-production security validation

With Teams/Zoom removed, security hardening becomes more important before production release. Close obvious trust-boundary and production-risk gaps.

**Security Focus Areas:**

- **Authentication & Authorization**
  - Verify OAuth token validation on every request
  - Implement role-based access control (RBAC) enforcement
  - Test authorization boundaries between operators, moderators, presenters, attendees
  - Verify tenant isolation (users cannot access other events)
  - Implement session timeout and re-authentication

- **Audit Logging**
  - Log all operator actions (approve, reject, hold questions)
  - Log all moderation decisions
  - Log all data access and exports
  - Log all configuration changes
  - Implement immutable audit trail

- **Rate Limiting**
  - API rate limiting (100-1000 req/min per endpoint)
  - WebSocket message rate limiting
  - Login attempt rate limiting
  - File upload rate limiting

- **Export & Data Access Controls**
  - Verify only authorized users can export transcripts
  - Implement data masking for sensitive fields
  - Log all data exports
  - Implement time-based access controls

- **Secret Handling**
  - Verify no secrets are logged
  - Implement secret rotation procedures
  - Use environment variables for all secrets
  - Implement secure secret storage

- **Webhook Verification**
  - Verify Recall.ai webhook signatures
  - Implement webhook signature validation
  - Log all webhook events
  - Implement webhook retry logic

- **Token Issuance**
  - Implement scoped tokens (limited permissions)
  - Implement token expiration
  - Implement token refresh logic
  - Verify token claims on every request

- **Dependency & Security Scanning**
  - Run npm audit on all dependencies
  - Implement automated security scanning (Snyk, Dependabot)
  - Review and update vulnerable dependencies
  - Implement security policy for dependency updates

**Success Criteria:**
- All authentication boundaries verified
- All authorization checks implemented and tested
- Audit logging covers all sensitive operations
- Rate limiting is enforced on all endpoints
- No secrets are exposed in logs or error messages
- Webhook signatures are validated
- Security scanning is automated
- Penetration testing results are reviewed

**Deliverables:**
- Security audit report
- Authentication & authorization test results
- Audit logging implementation
- Rate limiting configuration
- Security scanning results
- Penetration testing report

---

### 🟢 PRIORITY 4: Advanced Features (Customer Value)

**Status:** ⏳ Not Started  
**Timeline:** 3-4 weeks (phased)

From the advanced feature list, prioritize these in order of customer value and alignment with platform positioning.

**TOP PRIORITY: Custom Compliance Rules**

**Timeline:** 1-2 weeks  
**Value:** Strongest enterprise feature, best aligns with platform positioning

Custom compliance rules allow customers to define their own compliance keywords and risk levels, rather than using only the built-in rules.

**Implementation:**
- Database schema for custom rules (rule_id, customer_id, keyword, risk_level, description)
- Admin UI for creating/editing/deleting custom rules
- Backend compliance scoring engine update to use custom rules
- Real-time rule evaluation
- Rule versioning and audit trail
- Bulk rule import/export

**Success Criteria:**
- Customers can create custom compliance rules
- Rules are evaluated in real-time
- Rules can be enabled/disabled per event
- Rule changes are audited
- Performance impact is minimal

**Deliverables:**
- Custom rules database schema
- Admin UI for rule management
- Compliance scoring engine update
- API endpoints for rule management
- Tests for custom rule evaluation

---

**NEXT PRIORITY: Multi-Language Support**

**Timeline:** 1-2 weeks  
**Value:** Expands market value, helps platform scale beyond narrow use case

Multi-language support allows transcripts and Q&A to be translated in real-time.

**Implementation:**
- Internationalization (i18n) framework setup
- Language selection UI
- Real-time transcript translation (using LLM or translation API)
- Q&A translation
- Language preference storage per user
- Language-specific formatting (dates, numbers, etc.)

**Success Criteria:**
- UI supports 5+ languages
- Transcripts are translated in real-time
- Q&A is translated
- Language preferences are saved
- Performance impact is minimal

**Deliverables:**
- i18n framework setup
- Translation files for 5+ languages
- Real-time translation implementation
- Language preference storage
- Tests for translation accuracy

---

**THEN: Sentiment-Based Auto-Moderation**

**Timeline:** 1 week  
**Value:** Improves moderation efficiency with strong operator controls

Only implement this with strong operator override controls and clear transparency.

**Implementation:**
- Sentiment-based Q&A filtering
- Auto-hold for negative sentiment questions
- Auto-reject for highly negative questions
- Operator override capability
- Clear transparency (show why question was held/rejected)
- Operator audit trail

**Success Criteria:**
- Auto-moderation rules are configurable per event
- Operators can override auto-moderation decisions
- Transparency is clear (show reasoning)
- Audit trail is complete
- False positive rate is <5%

**Deliverables:**
- Auto-moderation engine
- Operator override UI
- Transparency display
- Audit logging
- Tests for accuracy

---

**LATER: White-Label Support & Speaker Performance Scoring**

These are valuable but lower priority than the above. Defer to next quarter.

---

## Removed from Roadmap

**❌ Teams Native Integration** — Removed  
**❌ Zoom Native Integration** — Removed  
**❌ Provider-Specific Bot Architecture** — Removed

**Rationale:** Recall.ai universal bot provides platform-agnostic integration. Native integrations add complexity without proportional customer value. Focus is on production safety and console performance.

---

## Execution Tracker

| Priority | Feature | Status | Timeline | Owner | Notes |
|----------|---------|--------|----------|-------|-------|
| 1 | Production Deployment | ⏳ In Progress | 2-3 weeks | Manus | Infrastructure, monitoring, backup, DR |
| 2 | Performance Optimization | ⏳ Not Started | 2-3 weeks | Manus | Operator Console, Moderator, Presenter |
| 3 | Security Hardening | ⏳ Not Started | 1-2 weeks | Manus | Auth, audit, rate limiting, secrets |
| 4 | Custom Compliance Rules | ⏳ Not Started | 1-2 weeks | Manus | Top advanced feature |
| 4 | Multi-Language Support | ⏳ Not Started | 1-2 weeks | Manus | Next advanced feature |
| 4 | Sentiment Auto-Moderation | ⏳ Not Started | 1 week | Manus | With operator overrides |
| 5 | White-Label Support | 📋 Backlog | Q2 2026 | TBD | Lower priority |
| 5 | Speaker Performance Scoring | 📋 Backlog | Q2 2026 | TBD | Lower priority |

---

## Delivery Standard

**Do not mark any item complete unless:**
- Implementation is real (not scaffolding or planning)
- Behavior is verified (tested in production-like environment)
- Tests exist where needed (unit, integration, or e2e)
- Docs reflect reality (not aspirational)
- Production claims are supportable (with evidence)

**No fluff. No "complete" language without proof.**

---

## Success Metrics (Post-Launch)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Uptime | >99.9% | N/A | 🔴 Not Deployed |
| API Latency (p95) | <200ms | N/A | 🔴 Not Deployed |
| Error Rate | <0.1% | N/A | 🔴 Not Deployed |
| Cache Hit Rate | >80% | N/A | 🔴 Not Optimized |
| Test Coverage | >80% | 641/692 | 🟡 92.6% |
| TypeScript Errors | 0 | 0 | ✅ Complete |
| Security Audit | Pass | Pending | 🔴 Not Started |
| Operator Console Response | <200ms | N/A | 🔴 Not Optimized |

---

## Next Steps

1. **Production Deployment Planning** — Begin infrastructure setup
2. **Performance Baseline** — Establish current performance metrics
3. **Security Audit** — Conduct pre-production security review
4. **Custom Compliance Rules** — Start implementation
5. **Checkpoint & Sync** — Update GitHub and notify stakeholders

---

**Document Version:** 2.0 (Revised)  
**Last Updated:** March 28, 2026  
**Audience:** Manus Development Team, ChatGPT, Replit  
**Status:** Active Execution Plan
