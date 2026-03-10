# Phase 2 Monitoring Dashboard Setup Guide

## Dashboard Overview

The Phase 2 Monitoring Dashboard provides real-time visibility into auto-muting system performance during live events. The dashboard displays violation detection accuracy, muting success rates, system health, and operator activity in a single, easy-to-read interface.

**Dashboard URL:** `https://your-domain/operator/muting-dashboard`

**Access Control:** Operators and compliance officers only (role-based access)

**Refresh Rate:** Real-time updates via Ably WebSocket (sub-100ms latency)

**Data Retention:** 30 days of historical data with hourly aggregation

## Dashboard Components

### 1. Real-Time Violation Feed

**Purpose:** Display all violations as they occur during the event

**Display Elements**
- Timestamp (HH:MM:SS format)
- Speaker name
- Violation type (forward-looking, price-sensitive, insider info, etc.)
- Violation text (first 100 characters)
- Confidence score (0.0-1.0)
- Severity level (Low/Medium/High/Critical)
- Muting action (Auto-muted, Manual override, False positive)

**Update Frequency:** Real-time (sub-1 second latency)

**Sorting Options**
- By timestamp (newest first)
- By speaker name
- By violation type
- By severity level
- By confidence score

**Filtering Options**
- Severity level (Low, Medium, High, Critical)
- Violation type (8 types)
- Speaker name
- Muting action (Auto-muted, Manual, False positive)
- Time range (last 1 hour, 24 hours, custom)

**Example Violation Entry**
```
14:32:15 | John Smith | Forward-Looking | "We expect 50% revenue growth next quarter" | Confidence: 0.92 | Severity: High | Action: Auto-muted (Soft)
```

### 2. Speaker Muting Status Panel

**Purpose:** Show current muting status for all active speakers

**Display Elements**
- Speaker name
- Current status (Active, Soft Muted, Hard Muted)
- Violation count
- Soft mute count
- Hard mute count
- Time in current status (if muted)
- Manual override option

**Status Indicators**
- **Active:** Green indicator, speaker is unmuted and can speak
- **Soft Muted:** Yellow indicator, speaker is temporarily muted (30 seconds)
- **Hard Muted:** Red indicator, speaker is permanently muted until manual unmute

**Muting History**
- Click on speaker to see full muting history
- Shows all violations, muting events, and manual overrides
- Includes timestamps and reasons

**Example Speaker Entry**
```
John Smith
Status: Hard Muted (Red indicator)
Violations: 6
Soft Mutes: 1
Hard Mutes: 1
Time Muted: 2:34
[Unmute] [View History]
```

### 3. Muting Statistics Dashboard

**Purpose:** Show aggregate metrics for the entire event

**Key Metrics**

**Total Speakers:** Number of unique speakers in the event
- Display: Large number with speaker icon
- Update: Real-time

**Total Violations:** Cumulative violation count
- Display: Large number with violation icon
- Breakdown: By violation type (pie chart)
- Update: Real-time

**Soft Muted:** Number of speakers currently soft-muted
- Display: Number with yellow indicator
- Percentage: % of total speakers
- Update: Real-time

**Hard Muted:** Number of speakers currently hard-muted
- Display: Number with red indicator
- Percentage: % of total speakers
- Update: Real-time

**Pending Review:** Violations flagged for operator review
- Display: Number with alert icon
- Update: Real-time

**Detection Latency:** Average time from speech to violation detection
- Display: Milliseconds (target: <100ms)
- Update: Every 10 seconds

**Muting Success Rate:** % of violations that resulted in muting
- Display: Percentage with green indicator if >99%
- Update: Every 10 seconds

**False Positive Rate:** % of violations manually overridden
- Display: Percentage with yellow indicator if <5%
- Update: Every 10 seconds

**Example Statistics Dashboard**
```
┌─────────────────────────────────────────────────────────┐
│  Total Speakers: 12  │  Total Violations: 24  │  Soft Muted: 3  │  Hard Muted: 1  │
├─────────────────────────────────────────────────────────┤
│  Pending Review: 0  │  Detection Latency: 87ms  │  Muting Success: 99.5%  │  False Positives: 2.1%  │
└─────────────────────────────────────────────────────────┘
```

### 4. Violation Type Breakdown

**Purpose:** Show distribution of violations by type

**Display Format:** Pie chart with 8 segments (one per violation type)

**Violation Types**
1. Forward-Looking Statements
2. Price-Sensitive Information
3. Insider Information
4. Profanity
5. Harassment
6. Misinformation
7. Abuse
8. Policy Breaches

**Interactivity**
- Click on segment to filter violation feed
- Hover to see count and percentage
- Legend shows color coding for each type

**Example Breakdown**
```
Forward-Looking: 8 (33%)
Price-Sensitive: 4 (17%)
Insider Info: 3 (13%)
Profanity: 2 (8%)
Harassment: 2 (8%)
Misinformation: 2 (8%)
Abuse: 1 (4%)
Policy Breach: 2 (8%)
```

### 5. System Health Indicators

**Purpose:** Monitor system performance and health

**Key Indicators**

**Webhook Status**
- Display: Green (Connected) or Red (Disconnected)
- Update: Real-time
- Alert: If disconnected for >10 seconds

**LLM Response Time**
- Display: Milliseconds
- Target: <500ms
- Alert: If >1000ms

**Database Query Time**
- Display: Milliseconds
- Target: <100ms
- Alert: If >500ms

**Ably Connection Status**
- Display: Green (Connected) or Red (Disconnected)
- Update: Real-time
- Alert: If disconnected for >10 seconds

**Memory Usage**
- Display: Percentage of available memory
- Target: <80%
- Alert: If >90%

**CPU Usage**
- Display: Percentage of available CPU
- Target: <70%
- Alert: If >90%

**Example System Health**
```
┌─────────────────────────────────────────────────────────┐
│  Webhook: ● Connected  │  LLM: 234ms  │  DB: 45ms  │  Ably: ● Connected  │
│  Memory: 65%  │  CPU: 42%  │
└─────────────────────────────────────────────────────────┘
```

### 6. Operator Activity Log

**Purpose:** Track all operator actions during the event

**Display Elements**
- Timestamp
- Operator name
- Action (Unmute, Manual mute, Override, etc.)
- Speaker affected
- Reason (if applicable)

**Update Frequency:** Real-time

**Filtering Options**
- By operator
- By action type
- By speaker
- By time range

**Example Activity Log**
```
14:35:42 | Sarah Johnson | Unmute | John Smith | Reason: False Positive
14:34:15 | Mike Chen | Manual Mute | Jane Doe | Reason: Technical Issue
14:32:15 | System | Auto-mute (Soft) | John Smith | Reason: 2 violations
```

## Dashboard Setup Instructions

### Step 1: Create Dashboard Component

Create a new React component at `client/src/components/MutingDashboard.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MutingDashboard({ eventId }: { eventId: string }) {
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState(null);
  const [speakers, setSpeakers] = useState([]);

  // Subscribe to real-time violations via Ably
  useEffect(() => {
    const channel = ably.channels.get(`muting:${eventId}`);
    
    channel.subscribe('violation', (message) => {
      setViolations(prev => [message.data, ...prev].slice(0, 100));
    });

    return () => channel.unsubscribe();
  }, [eventId]);

  // Fetch statistics every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await trpc.aiAmPhase2.getMutingStats.query({ eventId });
      setStats(data);
    }, 10000);

    return () => clearInterval(interval);
  }, [eventId]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="speakers">Speakers</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Statistics Dashboard */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Speakers" value={stats?.totalSpeakers} />
            <StatCard label="Total Violations" value={stats?.totalViolations} />
            <StatCard label="Soft Muted" value={stats?.softMuted} />
            <StatCard label="Hard Muted" value={stats?.hardMuted} />
          </div>
        </TabsContent>

        <TabsContent value="violations">
          {/* Real-Time Violation Feed */}
          <ViolationFeed violations={violations} />
        </TabsContent>

        <TabsContent value="speakers">
          {/* Speaker Muting Status */}
          <SpeakerStatusPanel speakers={speakers} />
        </TabsContent>

        <TabsContent value="health">
          {/* System Health Indicators */}
          <SystemHealthPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Step 2: Create Dashboard Page

Create a new page at `client/src/pages/MutingDashboard.tsx`:

```typescript
import { useParams } from 'wouter';
import { MutingDashboard } from '@/components/MutingDashboard';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function MutingDashboardPage() {
  const { eventId } = useParams();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Muting Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring of Phase 2 Auto-Muting</p>
        </div>
        <MutingDashboard eventId={eventId} />
      </div>
    </DashboardLayout>
  );
}
```

### Step 3: Add Dashboard Route

Add the route to `client/src/App.tsx`:

```typescript
import MutingDashboardPage from '@/pages/MutingDashboard';

// In the router configuration
<Route path="/operator/muting-dashboard/:eventId" component={MutingDashboardPage} />
```

### Step 4: Configure Real-Time Updates

Set up Ably channels for real-time updates in `server/_core/ably.ts`:

```typescript
import Ably from 'ably';

const ably = new Ably.Realtime(process.env.ABLY_API_KEY);

export async function publishViolation(eventId: string, violation: any) {
  const channel = ably.channels.get(`muting:${eventId}`);
  await channel.publish('violation', violation);
}

export async function publishMutingEvent(eventId: string, event: any) {
  const channel = ably.channels.get(`muting:${eventId}`);
  await channel.publish('muting-event', event);
}
```

### Step 5: Add Dashboard to Operator Console

Add the dashboard link to the operator console navigation:

```typescript
// In OperatorDashboard.tsx
<nav className="space-y-2">
  <NavLink to={`/operator/dashboard/${eventId}`}>Dashboard</NavLink>
  <NavLink to={`/operator/muting-control/${eventId}`}>Muting Control</NavLink>
  <NavLink to={`/operator/muting-dashboard/${eventId}`}>Monitoring</NavLink>
</nav>
```

## Dashboard Usage Guide

### During Event

**Operator Responsibilities**
1. Open the Muting Dashboard at event start
2. Monitor the real-time violation feed
3. Watch for system health alerts
4. Review pending violations for false positives
5. Manually override auto-muting decisions as needed

**Key Metrics to Watch**
- Detection latency (should be <100ms)
- Muting success rate (should be >99%)
- False positive rate (should be <5%)
- System health indicators (all should be green)

**Alert Thresholds**
- Detection latency >500ms → Investigate
- Muting success rate <95% → Escalate to support
- False positive rate >10% → Adjust thresholds
- System health red → Switch to manual monitoring

### Post-Event Analysis

**Metrics to Review**
- Total violations detected
- Violations by type (pie chart)
- Violations by speaker
- Muting accuracy (true positive rate)
- False positive rate
- System uptime and performance

**Data Export**
- Export violation log as CSV
- Export muting events as CSV
- Export statistics summary as PDF
- Share with compliance team

## Dashboard Customization

### Adjusting Thresholds

Operators can adjust detection and muting thresholds in real-time:

```typescript
// Update thresholds
await trpc.aiAmPhase2.configureMuting.mutate({
  eventId,
  softMuteThreshold: 2,
  hardMuteThreshold: 5,
  severityFilter: 'High',
});
```

### Filtering Violations

Filter the violation feed by:
- Severity level
- Violation type
- Speaker name
- Confidence score range
- Time range

### Exporting Data

Export dashboard data for compliance review:

```typescript
// Export violation log
const violations = await trpc.aiAmPhase2.getSpeakerViolations.query({
  eventId,
  speakerId: null,
});

// Convert to CSV
const csv = convertToCSV(violations);
downloadFile(csv, 'violations.csv');
```

## Performance Optimization

### Real-Time Updates

The dashboard uses Ably WebSocket for real-time updates to minimize latency:

**Violation Feed:** Sub-1 second latency  
**Statistics:** 10-second update interval  
**Speaker Status:** Real-time updates  
**System Health:** 10-second update interval

### Data Retention

Dashboard data is retained for 30 days with hourly aggregation:

**Raw Data:** 24 hours (real-time)  
**Hourly Aggregation:** 7 days  
**Daily Aggregation:** 30 days  
**Archive:** Available upon request

### Caching Strategy

Reduce database load with intelligent caching:

**Statistics:** Cache for 10 seconds  
**Speaker Status:** Cache for 5 seconds  
**System Health:** Cache for 10 seconds  
**Violation Feed:** No caching (real-time)

## Troubleshooting

### Dashboard Not Updating

**Symptoms:** Violation feed is not updating in real-time. Statistics are stale.

**Root Causes:** Ably connection lost, webhook not connected, database query error.

**Solutions:**
1. Check Ably connection status (should be green)
2. Verify webhook is connected to Recall.ai
3. Check database logs for query errors
4. Refresh the dashboard page

### High Detection Latency

**Symptoms:** Detection latency is >500ms. Violations are delayed.

**Root Causes:** LLM API slow, database query slow, high system load.

**Solutions:**
1. Check LLM API status
2. Monitor database query performance
3. Check system CPU and memory usage
4. Reduce violation feed update frequency if needed

### False Positives in Violation Feed

**Symptoms:** Many violations are being manually overridden. False positive rate >10%.

**Root Causes:** Detection model too sensitive, thresholds too aggressive, industry-specific language not understood.

**Solutions:**
1. Increase soft/hard mute thresholds
2. Change severity filter to "Critical" only
3. Provide feedback to support team
4. Adjust detection prompt for industry context

## Success Metrics

The monitoring dashboard is successful when:

- ✅ **Real-time updates:** <1 second latency for violation feed
- ✅ **System uptime:** >99.9% availability during events
- ✅ **Operator satisfaction:** >4.0/5 rating on dashboard usability
- ✅ **Detection accuracy:** >95% true positive rate
- ✅ **False positives:** <5% of violations
- ✅ **Performance:** <500ms page load time

---

**Document Version:** 1.0  
**Last Updated:** March 10, 2026  
**Next Review:** March 24, 2026
