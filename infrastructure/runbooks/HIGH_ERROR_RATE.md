# Runbook: High Error Rate Alert

**Severity:** Critical  
**Component:** Application  
**Alert Threshold:** Error rate > 0.1% for 5 minutes  
**On-Call Response Time:** 15 minutes

---

## Symptoms

- Alert: "High error rate detected"
- Error rate is consistently above 0.1%
- Users reporting failures when using the platform
- Sentry showing spike in errors

---

## Root Cause Analysis

**Possible causes:**
1. Database connection pool exhausted
2. Redis cache down or unreachable
3. External API dependency (Recall.ai, Ably) down
4. Memory leak causing out-of-memory errors
5. Unhandled exception in recent deployment
6. Rate limiting triggered
7. Network connectivity issues

---

## Diagnosis Steps

### Step 1: Check Recent Deployments
```bash
# Check if deployment happened in last 30 minutes
git log --oneline -10

# If recent deployment, check deployment logs
kubectl logs -n chorus-ai deployment/app --tail=100
```

### Step 2: Check Error Tracking (Sentry)
1. Go to Sentry dashboard
2. Filter errors by timestamp (last 5 minutes)
3. Identify top error types
4. Check error stack traces for patterns

### Step 3: Check Database Health
```bash
# SSH into database server
ssh db-prod-01

# Check connection count
mysql -u admin -p -e "SHOW PROCESSLIST;" | wc -l

# Check slow query log
tail -100 /var/log/mysql/slow.log

# Check replication status
mysql -u admin -p -e "SHOW SLAVE STATUS\G;"
```

### Step 4: Check Redis Health
```bash
# SSH into Redis server
ssh redis-prod-01

# Check Redis status
redis-cli INFO stats

# Check memory usage
redis-cli INFO memory

# Check connected clients
redis-cli INFO clients
```

### Step 5: Check External Dependencies
```bash
# Check Recall.ai webhook delivery
curl -X GET "https://api.recall.ai/status" \
  -H "Authorization: Bearer $RECALL_AI_API_KEY"

# Check Ably status
curl -X GET "https://rest.ably.io/status" \
  -H "Authorization: Bearer $ABLY_API_KEY"
```

### Step 6: Check Application Logs
```bash
# SSH into app server
ssh app-prod-01

# Check application logs
tail -200 /var/log/chorus-ai/app.log | grep ERROR

# Check system logs
tail -100 /var/log/syslog | grep chorus-ai
```

---

## Resolution Steps

### If Recent Deployment is Cause

**Option 1: Rollback**
```bash
# Identify previous stable version
git log --oneline -5

# Rollback to previous version
git revert HEAD
npm run build
npm run deploy

# Verify deployment
curl https://api.chorusai.com/health
```

**Option 2: Fix and Redeploy**
```bash
# Identify and fix the issue
# (depends on specific error)

# Redeploy
npm run build
npm run deploy

# Monitor error rate
watch -n 5 'curl -s https://api.chorusai.com/metrics | grep error_rate'
```

### If Database Connection Pool Exhausted

```bash
# Increase connection pool size
# Edit server/db.ts
# Change pool: { max: 20 } to pool: { max: 50 }

# Redeploy
npm run deploy

# Monitor connections
watch -n 5 'mysql -u admin -p -e "SHOW PROCESSLIST;" | wc -l'
```

### If Redis Down

```bash
# Check Redis status
redis-cli ping

# If no response, restart Redis
sudo systemctl restart redis-server

# Verify Redis is running
redis-cli INFO server

# Clear any corrupted keys (if needed)
redis-cli FLUSHDB

# Redeploy application to reconnect
npm run deploy
```

### If Memory Leak

```bash
# Check memory usage on app servers
free -h

# If memory > 90% used:
# 1. Identify memory-intensive process
ps aux --sort=-%mem | head -10

# 2. Restart application
sudo systemctl restart chorus-ai

# 3. Monitor memory usage
watch -n 5 'free -h'

# 4. If issue persists, investigate code for memory leak
# Review recent code changes in server/routers.ts
```

### If Rate Limiting Triggered

```bash
# Check rate limiting configuration
grep -r "rateLimit" server/

# Temporarily increase rate limits
# Edit server/_core/index.ts
# Change: limiter({ windowMs: 60000, max: 100 })
# To: limiter({ windowMs: 60000, max: 500 })

# Redeploy
npm run deploy

# Monitor error rate
watch -n 5 'curl -s https://api.chorusai.com/metrics | grep error_rate'
```

---

## Monitoring During Recovery

1. **Error Rate Trend:** Should decrease within 5 minutes of fix
2. **API Latency:** Should return to baseline (<200ms p95)
3. **Database Connections:** Should drop to normal levels
4. **Redis Memory:** Should stabilize
5. **User Reports:** Should stop coming in

---

## Post-Incident Steps

1. **Document Root Cause:** Update this runbook with findings
2. **Create Jira Ticket:** For permanent fix if needed
3. **Update Monitoring:** Add alert if this wasn't caught
4. **Team Debrief:** Schedule postmortem within 24 hours
5. **Implement Prevention:** Deploy fix to prevent recurrence

---

## Escalation

If error rate doesn't decrease after 15 minutes:

1. **Page on-call director:** `pagerduty trigger --severity critical`
2. **Notify engineering team:** Slack @engineering-oncall
3. **Prepare customer communication:** Draft status page update
4. **Consider maintenance window:** May need to take service down to investigate

---

## Related Runbooks

- [Database Down](DATABASE_DOWN.md)
- [Redis Down](REDIS_DOWN.md)
- [High Latency](HIGH_LATENCY.md)
- [Deployment Rollback](DEPLOYMENT_ROLLBACK.md)

---

**Last Updated:** March 28, 2026  
**Last Tested:** [Date of last incident]  
**Owner:** Platform Team
