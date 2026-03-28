# CuraLive Production Deployment Guide

## Overview

This guide covers deploying CuraLive to production with all features enabled: operator console, moderator dashboard, presenter teleprompter, attendee dashboard, admin controls, webphone integration, mobile app, and advanced analytics.

---

## Pre-Deployment Checklist

- [ ] All TypeScript errors fixed (0 errors)
- [ ] All unit tests passing (575+ tests)
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Load testing passed

---

## Environment Configuration

### Production Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/curalive

# OAuth
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# API Keys
BUILT_IN_FORGE_API_KEY=your_forge_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
RECALL_AI_API_KEY=your_recall_key
TELNYX_API_KEY=your_telnyx_key
RESEND_API_KEY=your_resend_key
ABLY_API_KEY=your_ably_key

# Security
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key

# Monitoring
SENTRY_DSN=your_sentry_dsn
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id

# Owner Info
OWNER_NAME=your_name
OWNER_OPEN_ID=your_open_id
```

---

## Database Setup

### 1. Run Migrations

```bash
pnpm db:push
```

This creates all necessary tables:
- `operator_sessions` - Session state and lifecycle
- `operator_actions` - Operator action history
- `questions` - Q&A questions with compliance scoring
- `operator_notes` - Session notes
- `events` - Event metadata
- `attendees` - Event attendee records
- `speakers` - Speaker profiles
- `event_speakers` - Speaker assignments
- `analytics` - Event analytics

### 2. Verify Tables

```bash
mysql -u user -p curalive -e "SHOW TABLES;"
```

---

## API Security

### Rate Limiting

- Public endpoints: 100 req/min per IP
- Authenticated endpoints: 1000 req/min per user
- Auth endpoints: 10 req/min per IP
- WebSocket: 50 messages/min per user

### Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: restrictive

### CORS Configuration

Allowed origins:
- https://chorusai-mdu4k2ib.manus.space
- https://curalive-mdu4k2ib.manus.space

---

## Performance Optimization

### Caching Strategy

| Data | TTL | Max Size |
|------|-----|----------|
| Speaker profiles | 10 min | 500 items |
| Event analytics | 5 min | 500 items |
| Session state | 1 min | 1000 items |
| Questions | 2 min | 5000 items |
| Events list | 15 min | 100 items |

### CDN Configuration

Static assets served from CDN:
- Images: `/images/*`
- Fonts: `/fonts/*`
- Videos: `/videos/*`
- JavaScript bundles: `/dist/*`

---

## Monitoring & Logging

### Key Metrics to Monitor

- API response time (target: <200ms p95)
- Database query time (target: <50ms p95)
- WebSocket connection count
- Push notification delivery rate
- Cache hit rate (target: >80%)
- Error rate (target: <0.1%)

### Log Aggregation

Logs are sent to:
- Console (development)
- File system (production)
- Sentry (error tracking)
- CloudWatch (AWS)

### Health Checks

```bash
GET /health
GET /health/db
GET /health/cache
GET /health/ably
```

---

## Mobile App Deployment

### iOS App Store

1. Build release version:
   ```bash
   cd mobile && eas build --platform ios --auto-submit
   ```

2. Configure signing certificates in EAS

3. Submit to App Store

### Google Play Store

1. Build release version:
   ```bash
   cd mobile && eas build --platform android --auto-submit
   ```

2. Configure signing certificates in EAS

3. Submit to Play Store

---

## Backup & Disaster Recovery

### Database Backups

- Daily automated backups
- 30-day retention
- Point-in-time recovery enabled
- Backup verification weekly

### Disaster Recovery Plan

1. **RTO (Recovery Time Objective):** 1 hour
2. **RPO (Recovery Point Objective):** 15 minutes
3. **Failover:** Automatic to standby database
4. **Testing:** Monthly disaster recovery drill

---

## Scaling Strategy

### Horizontal Scaling

- Load balancer: nginx
- App servers: 3+ instances
- Database: Primary + replicas
- Cache: Redis cluster
- WebSocket: Sticky sessions

### Vertical Scaling

- CPU: 4+ cores
- Memory: 8GB+ per instance
- Storage: 100GB+ SSD
- Bandwidth: 1Gbps+

---

## Launch Checklist

- [ ] All features tested in staging
- [ ] Database migrations verified
- [ ] SSL certificates installed
- [ ] CDN configured and warmed
- [ ] Monitoring and alerting active
- [ ] Backup system operational
- [ ] Support team trained
- [ ] Documentation updated
- [ ] Rollback plan prepared
- [ ] Go-live approval obtained

---

## Post-Launch Monitoring

### First 24 Hours

- Monitor error rates every 15 minutes
- Check database performance
- Verify WebSocket stability
- Test push notifications
- Monitor cache hit rates

### First Week

- Analyze user behavior
- Identify performance bottlenecks
- Collect feedback from operators
- Fine-tune rate limits
- Optimize database queries

---

## Rollback Procedure

If critical issues occur:

```bash
# Rollback to previous checkpoint
git revert HEAD
pnpm build
pm2 restart all

# Verify rollback
curl https://api.curalive.com/health
```

---

## Support & Escalation

- **Tier 1:** Automated monitoring and alerts
- **Tier 2:** On-call engineer (30 min response)
- **Tier 3:** Engineering team (1 hour response)
- **Emergency:** Page on-call director

---

## Success Metrics

After launch, track:

- Uptime: >99.9%
- API latency: <200ms p95
- Error rate: <0.1%
- User satisfaction: >4.5/5
- Feature adoption: >80%

---

**Deployment Date:** [TBD]  
**Deployed By:** [Name]  
**Approval:** [Manager]
