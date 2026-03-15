# Chorus.AI Integration Guide

This guide documents the new components, routes, and features integrated into the Chorus.AI platform.

## New Components

### 1. BookingsEnhanced (`client/src/pages/BookingsEnhanced.tsx`)

**Purpose:** Event creation and management with database persistence and Ably real-time updates.

**Features:**
- Create new events with title, company, platform, and event type
- Display list of upcoming events with status indicators
- Delete events
- Real-time sync via Ably `events:updates` channel
- Loading states and error handling

**Usage:**
```tsx
import BookingsEnhanced from "@/pages/BookingsEnhanced";

// In your router:
<Route path="/bookings" component={BookingsEnhanced} />
```

**Ably Channels:**
- `events:updates` - Subscribe to `event.created` events

---

### 2. RealtimeQaModeration (`client/src/components/RealtimeQaModeration.tsx`)

**Purpose:** Real-time Q&A moderation interface for operators.

**Features:**
- Display incoming Q&A questions in real-time
- Approve/reject questions with one-click actions
- Track approved and rejected questions separately
- Real-time sync across multiple operators
- Toast notifications for all actions

**Usage:**
```tsx
import { RealtimeQaModeration } from "@/components/RealtimeQaModeration";

<RealtimeQaModeration conferenceId={123} />
```

**Ably Channels:**
- `occ:qa:{conferenceId}` - Subscribe to `qa.submitted`, `qa.approved`, `qa.rejected`

---

### 3. SentimentTrendChart (`client/src/components/SentimentTrendChart.tsx`)

**Purpose:** Real-time sentiment analysis visualization with sparkline trend.

**Features:**
- Live sentiment score display (0-100%)
- SVG sparkline chart with historical trend
- Sentiment gauge visualization
- Trend direction indicators (up/down/stable)
- Key topics/keywords display
- Rolling 60-point data window

**Usage:**
```tsx
import { SentimentTrendChart } from "@/components/SentimentTrendChart";

<SentimentTrendChart conferenceId={123} />
```

**Ably Channels:**
- `occ:sentiment:{conferenceId}` - Subscribe to `sentiment.updated` events

---

### 4. ParticipantStatusDashboard (`client/src/components/ParticipantStatusDashboard.tsx`)

**Purpose:** Real-time participant status tracking and management.

**Features:**
- Display active participants with status indicators
- Show speaking status with animated indicator
- Track hand-raised participants
- Display connection quality (excellent/good/fair/poor)
- Active speaker highlight
- Participant statistics (total, active, speaking, hands raised)

**Usage:**
```tsx
import { ParticipantStatusDashboard } from "@/components/ParticipantStatusDashboard";

<ParticipantStatusDashboard conferenceId={123} />
```

**Ably Channels:**
- `occ:participants:{conferenceId}` - Subscribe to `participant.updated` events

---

### 5. OccRealtimeUpdates (`client/src/components/OccRealtimeUpdates.tsx`)

**Purpose:** General OCC (Operator Call Centre) real-time notifications and updates.

**Features:**
- Display live sentiment score
- Show approved Q&A
- Track active participants
- Display recent notifications
- Sentiment trend visualization

**Usage:**
```tsx
import { OccRealtimeUpdates } from "@/components/OccRealtimeUpdates";

<OccRealtimeUpdates conferenceId={123} />
```

**Ably Channels:**
- `occ:notifications:{conferenceId}` - All OCC notifications
- `occ:qa:{conferenceId}` - Q&A approvals
- `occ:sentiment:{conferenceId}` - Sentiment updates
- `occ:participants:{conferenceId}` - Participant updates

---

### 6. PostEventAnalytics (`client/src/pages/PostEventAnalytics.tsx`)

**Purpose:** Display comprehensive post-event analytics and reports.

**Features:**
- AI-generated event summary
- Key topics and quotes extraction
- Full transcript with download/copy options
- Compliance score and report
- Engagement metrics and trends
- Participant statistics
- Tabbed interface (Summary, Transcript, Metrics, Compliance)

**Usage:**
```tsx
import PostEventAnalytics from "@/pages/PostEventAnalytics";

// In your router:
<Route path="/post-event/:eventId" component={PostEventAnalytics} />
```

**Props:**
- `eventId` (string) - The event ID to load analytics for

---

## New Routes

### AppEnhanced Router (`client/src/AppEnhanced.tsx`)

The enhanced app includes the following routes:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page |
| `/bookings` | BookingsEnhanced | Event creation and management |
| `/operator/:conferenceId` | OperatorConsole | Operator dashboard with participant tracking and sentiment |
| `/moderator/:conferenceId` | ModeratorConsole | Moderator Q&A management |
| `/occ/:conferenceId` | OperatorConsole | Alias for operator console |
| `/post-event/:eventId` | PostEventAnalytics | Post-event analytics and reports |

All protected routes require authentication via `useAuth()` hook.

---

## Ably Integration

### Channels Used

1. **events:updates** - Event creation notifications
   - Event: `event.created`
   - Data: `{ eventId, title, company, platform, status }`

2. **registrations:updates** - Registration notifications
   - Event: `registration.created`
   - Data: `{ eventId, name, email, company, jobTitle }`

3. **post_event:updates** - Post-event data notifications
   - Event: `post_event.generated`
   - Data: `{ eventId, aiSummary, complianceScore, engagementScore }`

4. **occ:notifications:{conferenceId}** - General OCC notifications
   - Events: `participant_joined`, `participant_left`, `sentiment_update`, `qa_approval`

5. **occ:qa:{conferenceId}** - Q&A management
   - Events: `qa.submitted`, `qa.approved`, `qa.rejected`

6. **occ:sentiment:{conferenceId}** - Sentiment analysis
   - Event: `sentiment.updated`
   - Data: `{ score, trend, keywords }`

7. **occ:participants:{conferenceId}** - Participant status
   - Event: `participant.updated`
   - Data: `{ participantId, state, isSpeaking, requestToSpeak }`

---

## Database Integration

### Persistence Router (`server/routers/persistence.ts`)

The persistence router provides tRPC procedures for:

- `postEvent.save` - Save post-event data
- `postEvent.get` - Retrieve post-event data
- `stripe.getOrCreateCustomer` - Manage Stripe customers
- `stripe.createSubscription` - Create subscriptions
- `stripe.getActiveSubscription` - Check active subscriptions
- `stripe.getPremiumFeatures` - Get feature access level

### Database Tables

- `post_event_data` - Stores AI summaries, transcripts, compliance reports
- `stripe_customers` - Links users to Stripe customer records
- `stripe_subscriptions` - Tracks active subscriptions and tiers
- `premium_features` - Manages feature flags and usage limits
- `stripe_payment_events` - Audit log for webhook events

---

## Implementation Checklist

To fully integrate these components into your application:

- [ ] Replace `client/src/App.tsx` with `AppEnhanced.tsx`
- [ ] Update navigation in DashboardLayout to include new routes
- [ ] Wire BookingsEnhanced to persist events to database
- [ ] Configure Ably API key in environment variables
- [ ] Test all Ably channel subscriptions
- [ ] Verify database migrations for new tables
- [ ] Test authentication guards on protected routes
- [ ] Add route links to main navigation
- [ ] Test real-time updates across multiple browser tabs
- [ ] Verify error handling and loading states

---

## Next Steps

1. **Complete Database Wiring** - Connect all components to actual database queries
2. **Add Real-Time Simulation** - Create mock Ably publishers for testing
3. **Implement Authentication Guards** - Add role-based access control (admin, operator, moderator)
4. **Add Analytics Dashboard** - Create aggregated analytics across all events
5. **Implement Notifications** - Add email/SMS notifications for key events
6. **Add Export Features** - Allow exporting transcripts, reports, and analytics as PDF

---

## Troubleshooting

### Ably Connection Issues

If components aren't receiving real-time updates:

1. Verify `ABLY_API_KEY` is set in environment variables
2. Check browser console for Ably connection errors
3. Ensure channels are correctly formatted: `occ:participants:123` (not `occ:participants:123:`)
4. Test with Ably console at https://ably.com/console

### Database Persistence Issues

If data isn't being saved:

1. Run `pnpm db:push` to ensure migrations are applied
2. Check server logs for database errors
3. Verify tRPC procedures are properly exported in routers
4. Test database connection in `server/_core/index.ts`

### Route Not Found

If routes aren't working:

1. Ensure AppEnhanced is imported in `client/src/main.tsx`
2. Check route parameters match component expectations
3. Verify DashboardLayout is properly wrapping page content
4. Test route navigation with browser back/forward buttons
