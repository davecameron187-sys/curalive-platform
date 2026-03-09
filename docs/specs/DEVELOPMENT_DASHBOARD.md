<!-- status: implemented -->
# Development Dashboard — Implementation Guide

## Overview

The Development Dashboard is a comprehensive platform management interface for CuraLive operators and administrators. It provides real-time visibility into platform health, feature status, team performance, and quick access to critical tools.

**Route:** `/dev-dashboard`

## Key Features

### 1. Development Metrics (4-Card Grid)
- **Features Deployed** — Total number of features live in production
- **Tests Passing** — Test pass rate and count (e.g., 287/290, 99.0%)
- **API Uptime** — Platform uptime percentage over last 30 days
- **Active Users** — Current active users on the platform

Each metric card displays:
- Large numeric value
- Change indicator (e.g., "+3 this week")
- Color-coded icon (emerald, blue, cyan, violet)
- Trending indicator

### 2. Feature Status Overview
A visual progress bar showing:
- Total features: 25
- Completed: 16 (64%)
- In Progress: 1 (4%)
- Planned: 8 (32%)

Includes a "View Detailed Status" button linking to `/ai-features-status`.

### 3. Quick Actions
One-click navigation to:
- Create Event → `/event/q4-earnings-2026`
- View API Docs → `/partner-api`
- Feature Status → `/ai-features-status`
- Training Hub → `/training`

### 4. Recent Activity Feed
Displays recent platform events:
- Deployments (feature releases)
- Test results (pass/fail)
- Feature toggles (beta releases)
- Alerts (errors, warnings)

Each activity shows:
- Event type (deployment, test, toggle, alert)
- Title/description
- Timestamp
- Status badge (success, info, warning)

### 5. Team Statistics
Performance metrics for the operator team:
- Operators Trained (current / target)
- Certification Pass Rate (current / target)
- Feature Adoption (current / target)
- API Calls/Day (current / target)

### 6. Tabbed Interface

#### Tab 1: Overview (Default)
Main dashboard view with all metrics and status cards.

#### Tab 2: Platform Testing
Dropdown selector for testing different platform types:
- **Audio Bridge** — PSTN dial-in testing
- **Video** — Zoom/Teams/Webex integration testing
- **Roadshow** — Multi-location event testing
- **Video Webcast** — RTMP/HLS streaming testing
- **Audio Webcast** — Audio-only streaming testing

Each platform type displays:
- Test checklist (5-8 items)
- "Run Test" button
- "View Results" button
- Last test status and timestamp

#### Tab 3: Operator Console
Displays operator console information and controls:
- **OCC v1.0 (Replit)** — Link to Replit Operator Console
- **Manus OCC** — Link to Manus operator console
- **Real-Time Operator Status:**
  - Active Operators: X
  - Active Calls: Y
  - System Health: Z%
  - Avg Response Time: T seconds
- **Training Mode Toggle** — Enable/disable training mode for practice sessions
- **Operator Performance Analytics:**
  - Operator name, calls handled, avg duration, satisfaction score
  - Export to CSV button

#### Tab 4: API Integration
API documentation and testing tools (placeholder for future implementation).

#### Tab 5: Webhook Testing
Webhook event testing and debugging tools (placeholder for future implementation).

## Component Structure

```
DevelopmentDashboard.tsx
├── Sidebar Navigation
│   ├── Collapsible menu toggle
│   ├── Navigation links (Dashboard, Features, Dev Tools, Training, Admin)
│   └── User profile section (login/logout)
├── Top Bar
│   ├── Page title and description
│   └── System status badge
├── Main Content Area
│   ├── Development Metrics Grid (4 cards)
│   ├── Feature Status & Quick Actions (2-column grid)
│   ├── Tabs Container
│   │   ├── Overview Tab
│   │   ├── Platform Testing Tab
│   │   ├── Operator Console Tab
│   │   ├── API Integration Tab
│   │   └── Webhook Testing Tab
│   └── Recent Activity Feed
└── Team Statistics Grid
```

## State Management

```typescript
const [sidebarOpen, setSidebarOpen] = useState(true);
const [selectedPlatformTest, setSelectedPlatformTest] = useState("audio-bridge");
const [trainingModeEnabled, setTrainingModeEnabled] = useState(false);
const [showOperatorAnalytics, setShowOperatorAnalytics] = useState(false);
```

## Styling

- **Color Scheme:** Dark theme with CuraLive branding
- **Typography:** Bold headers, readable body text
- **Icons:** Lucide React icons for visual clarity
- **Cards:** Shadcn/ui Card component with consistent padding
- **Buttons:** Shadcn/ui Button component with outline and primary variants
- **Badges:** Status indicators with color-coded backgrounds

## Responsive Design

- **Desktop (1024px+):** Full sidebar, 4-column metric grid, 2-column feature/actions
- **Tablet (768px-1023px):** Collapsible sidebar, 2-column metric grid
- **Mobile (<768px):** Hidden sidebar (menu icon), 1-column layout, stacked tabs

## Integration Points

### tRPC Queries
- `metrics.getDevelopmentMetrics()` — Fetch real-time metrics
- `features.getFeatureStatus()` — Get feature completion status
- `team.getTeamStats()` — Fetch team performance data
- `activity.getRecentActivity()` — Get recent platform events
- `operators.getOperatorStatus()` — Real-time operator metrics

### Routes
- `/dev-dashboard` — Main dashboard
- `/ai-features-status` — Detailed feature status
- `/partner-api` — API documentation
- `/training` — Training hub
- `/admin/users` — Admin panel
- `/operator/:eventId` — Operator console
- `/operator/analytics` — Operator analytics
- `/training-mode` — Training mode console

### Real-Time Updates (Ably)
- Operator status updates (active operators, calls)
- System health metrics (API uptime, response times)
- Feature deployment notifications
- Test result updates

## Future Enhancements

1. **Live Sentiment Dashboard** — Real-time investor sentiment gauge
2. **Compliance Audit Trail** — Material statement flagging and review
3. **Performance Alerts** — Threshold-based notifications for SLA violations
4. **Custom Dashboards** — User-configurable dashboard layouts
5. **Export Reports** — Generate PDF/CSV reports of metrics and activity

## File Location

`client/src/pages/DevelopmentDashboard.tsx` (581 lines)

## Dependencies

- React 19
- Wouter (routing)
- Shadcn/ui (components)
- Lucide React (icons)
- Tailwind CSS (styling)
