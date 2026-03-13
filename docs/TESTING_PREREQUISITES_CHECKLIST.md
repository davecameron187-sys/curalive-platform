# Testing Prerequisites Checklist

**Date:** March 13, 2026  
**Status:** Ready for Verification  

---

## Quick Start

Before running any tests, complete this checklist to ensure your environment is ready.

```bash
# Run this command to verify all prerequisites
cd /home/ubuntu/chorus-ai && pnpm dev
# Dev server should start without errors
```

---

## Environment Verification Checklist

### 1. Development Server ⬜
- [ ] Dev server is running: `pnpm dev`
- [ ] No compilation errors in console
- [ ] Server is listening on `http://localhost:3000`
- [ ] Frontend loads without errors

**Verification:**
```bash
curl http://localhost:3000
# Should return HTML response
```

---

### 2. Database Connection ⬜
- [ ] MySQL/TiDB is running
- [ ] Database connection string is set in `.env`
- [ ] Tables are created (migrations run)
- [ ] Can connect and query tables

**Verification:**
```bash
# Check if database is accessible
pnpm db:push
# Should complete without errors
```

---

### 3. Twilio Configuration ⬜
- [ ] Twilio account created
- [ ] Account SID configured in `.env` as `TWILIO_ACCOUNT_SID`
- [ ] Auth Token configured as `TWILIO_AUTH_TOKEN`
- [ ] Caller ID configured as `TWILIO_CALLER_ID`
- [ ] Test phone number available

**Verification:**
```bash
# Check Twilio credentials are set
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN
# Both should return values
```

---

### 4. Telnyx Configuration ⬜
- [ ] Telnyx account created
- [ ] API Key configured as `TELNYX_API_KEY`
- [ ] SIP Connection ID configured as `TELNYX_SIP_CONNECTION_ID`
- [ ] SIP Username configured as `TELNYX_SIP_USERNAME`
- [ ] SIP Password configured as `TELNYX_SIP_PASSWORD`

**Verification:**
```bash
# Check Telnyx credentials are set
echo $TELNYX_API_KEY
# Should return value
```

---

### 5. Mux Configuration ⬜
- [ ] Mux account created
- [ ] Token ID configured as `MUX_TOKEN_ID`
- [ ] Token Secret configured as `MUX_TOKEN_SECRET`
- [ ] Webhook Secret configured as `MUX_WEBHOOK_SECRET`

**Verification:**
```bash
# Check Mux credentials are set
echo $MUX_TOKEN_ID
# Should return value
```

---

### 6. Recall.ai Configuration ⬜
- [ ] Recall.ai account created
- [ ] API Key configured as `RECALL_AI_API_KEY`
- [ ] Base URL configured as `RECALL_AI_BASE_URL`
- [ ] Webhook Secret configured as `RECALL_AI_WEBHOOK_SECRET`
- [ ] Webhook URL registered in Recall.ai dashboard

**Verification:**
```bash
# Check Recall.ai credentials are set
echo $RECALL_AI_API_KEY
# Should return value
```

---

### 7. Ably Configuration ⬜
- [ ] Ably account created
- [ ] API Key configured as `ABLY_API_KEY`
- [ ] Real-time messaging enabled

**Verification:**
```bash
# Check Ably credentials are set
echo $ABLY_API_KEY
# Should return value
```

---

### 8. OAuth Configuration ⬜
- [ ] OAuth Server URL configured as `OAUTH_SERVER_URL`
- [ ] OAuth Portal URL configured as `VITE_OAUTH_PORTAL_URL`
- [ ] App ID configured as `VITE_APP_ID`
- [ ] User can log in successfully

**Verification:**
```bash
# Check OAuth is configured
echo $OAUTH_SERVER_URL
# Should return value
```

---

### 9. Test Event Created ⬜
- [ ] Test event created with ID: `test-event-001`
- [ ] Event has at least 3 test participants
- [ ] Operator account created and can access OCC

**Verification:**
```bash
# Log in to OCC and verify event exists
# Navigate to: http://localhost:3000/occ/test-event-001
```

---

### 10. Test Participants Registered ⬜
- [ ] Participant 1: test1@example.com
- [ ] Participant 2: test2@example.com
- [ ] Participant 3: test3@example.com
- [ ] All participants can log in

**Verification:**
```bash
# Try logging in with test account
# Navigate to: http://localhost:3000
```

---

### 11. OBS Studio Installed (for webcast tests) ⬜
- [ ] OBS Studio downloaded and installed
- [ ] Can launch OBS without errors
- [ ] Microphone and camera are working

**Verification:**
```bash
# Launch OBS
obs
# Should open without errors
```

---

### 12. Test Phone Numbers Available ⬜
- [ ] At least 2 test phone numbers available
- [ ] Phone numbers can receive calls
- [ ] Phone numbers are in same country as Twilio account

**Verification:**
```bash
# Test phone numbers should be ready to use
# Example: +1-555-123-4567
```

---

### 13. Zoom Account (for platform tests) ⬜
- [ ] Zoom account created
- [ ] Can create meetings
- [ ] Can join meetings from test devices

**Verification:**
```bash
# Create test meeting in Zoom
# Should be able to join from browser
```

---

### 14. Microsoft Teams Account (for platform tests) ⬜
- [ ] Teams account created
- [ ] Can create meetings
- [ ] Can join meetings from test devices

**Verification:**
```bash
# Create test meeting in Teams
# Should be able to join from browser
```

---

### 15. Webex Account (for platform tests) ⬜
- [ ] Webex account created
- [ ] Can create meetings
- [ ] Can join meetings from test devices

**Verification:**
```bash
# Create test meeting in Webex
# Should be able to join from browser
```

---

## Pre-Test Verification Script

Run this script to verify all prerequisites at once:

```bash
#!/bin/bash

echo "=== CuraLive Testing Prerequisites Verification ==="
echo ""

# Check dev server
echo "1. Checking dev server..."
if curl -s http://localhost:3000 > /dev/null; then
  echo "   ✅ Dev server is running"
else
  echo "   ❌ Dev server is not running. Run: pnpm dev"
fi

# Check environment variables
echo ""
echo "2. Checking environment variables..."
vars=("TWILIO_ACCOUNT_SID" "TWILIO_AUTH_TOKEN" "MUXTOKEN_ID" "RECALL_AI_API_KEY" "ABLY_API_KEY")
for var in "${vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "   ❌ $var is not set"
  else
    echo "   ✅ $var is set"
  fi
done

# Check database
echo ""
echo "3. Checking database connection..."
# This would require a database query command

# Check test event
echo ""
echo "4. Checking test event..."
# This would require an API call to check if event exists

echo ""
echo "=== Verification Complete ==="
```

---

## Troubleshooting

### Dev Server Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm dev
```

### Database Connection Error
```bash
# Check database is running
# Verify DATABASE_URL in .env is correct
# Run migrations
pnpm db:push
```

### Missing Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env
# Edit .env and add your credentials
# Restart dev server
```

### Test Event Not Found
```bash
# Create test event via OCC
# Navigate to: http://localhost:3000/occ
# Click "Create New Event"
# Fill in details and save
```

---

## Ready to Test?

Once all checkboxes are marked ✅, you're ready to begin testing!

**Next Step:** Start with [Test 1: Audio Bridge](TESTING_PLAN_STEP_BY_STEP.md#test-1-audio-bridge-pstn-dial-in)

---

**Document Version:** 1.0  
**Last Updated:** March 13, 2026
