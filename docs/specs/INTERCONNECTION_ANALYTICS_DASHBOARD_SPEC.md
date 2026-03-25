# Interconnection Analytics Dashboard — Replit Implementation Spec

**Status:** spec-ready  
**Priority:** High  
**Estimated Effort:** 32 hours (4 weeks, parallel with Virtual Studio)  
**Target Launch:** Q2 2026

---

## REPLIT SUMMARY

Build a comprehensive analytics dashboard to track interconnection adoption, ROI realization, and feature combination effectiveness. The dashboard provides real-time insights into how users discover and activate interconnected features, enabling data-driven decisions on feature bundling and marketing strategy.

**What to Build:**
1. Real-time adoption metrics (activations, trends, click-through rates)
2. ROI tracking (projected vs. realized, by interconnection)
3. Feature combination analytics (top interconnections, workflow completion)
4. User segment breakdown (by industry, company size, adoption velocity)
5. Engagement metrics (retention, churn, feature velocity)
6. Interactive visualizations (charts, tables, filters)
7. Role-based access control (executives, product, customer success, operators)
8. Real-time alerts for adoption spikes and anomalies

**Key Features:**
- 5+ interactive charts and visualizations
- Real-time updates via Ably (5-second refresh)
- Hourly batch updates for trend metrics
- Drill-down capabilities for detailed analysis
- Export to CSV/PDF for reporting
- Mobile-responsive design
- <2 second page load time

**Success Criteria:**
- All metrics display accurately
- Real-time updates working reliably
- Role-based access functioning correctly
- Stakeholder satisfaction >4.5/5
- <2 second page load time
- 99.9% uptime

---

## Architecture Overview

### Database Schema

**Analytics Tables:**

```typescript
// Track all interconnection activations
export const interconnectionAnalytics = mysqlTable('interconnection_analytics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  customerId: varchar('customer_id', { length: 255 }).notNull(),
  sourceFeatureId: varchar('source_feature_id', { length: 255 }).notNull(),
  targetFeatureId: varchar('target_feature_id', { length: 255 }).notNull(),
  activationSource: mysqlEnum('activation_source', [
    'ai-shop',
    'recommendation',
    'workflow',
    'manual',
    'email'
  ]).default('manual'),
  roiProjected: decimal('roi_projected', { precision: 5, scale: 2 }),
  roiRealized: decimal('roi_realized', { precision: 5, scale: 2 }),
  workflowCompleted: boolean('workflow_completed').default(false),
  activatedAt: timestamp('activated_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  customerIdIdx: index('customer_id_idx').on(table.customerId),
  sourceFeatureIdx: index('source_feature_idx').on(table.sourceFeatureId),
  activatedAtIdx: index('activated_at_idx').on(table.activatedAt),
}));

// Track activation sources for attribution
export const activationSources = mysqlTable('activation_sources', {
  id: varchar('id', { length: 255 }).primaryKey(),
  interconnectionId: varchar('interconnection_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  source: mysqlEnum('source', [
    'see-connections-button',
    'recommended-section',
    'workflow-step',
    'email-recommendation',
    'in-app-notification'
  ]).notNull(),
  clickCount: int('click_count').default(0),
  conversionTime: int('conversion_time_ms'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  interconnectionIdIdx: index('interconnection_id_idx').on(table.interconnectionId),
  userIdIdx: index('user_id_idx').on(table.userId),
}));

// Customer segment data for filtering
export const customerSegments = mysqlTable('customer_segments', {
  customerId: varchar('customer_id', { length: 255 }).primaryKey(),
  industry: varchar('industry', { length: 255 }),
  companySize: mysqlEnum('company_size', ['SMB', 'Mid-Market', 'Enterprise']),
  adoptionVelocity: decimal('adoption_velocity', { precision: 5, scale: 2 }),
  totalFeatures: int('total_features').default(0),
  totalBundles: int('total_bundles').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  industryIdx: index('industry_idx').on(table.industry),
  companySizeIdx: index('company_size_idx').on(table.companySize),
}));

// Workflow tracking
export const workflowTracking = mysqlTable('workflow_tracking', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  workflowId: varchar('workflow_id', { length: 255 }).notNull(),
  currentStep: int('current_step').default(0),
  totalSteps: int('total_steps').notNull(),
  completed: boolean('completed').default(false),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  workflowIdIdx: index('workflow_id_idx').on(table.workflowId),
  completedIdx: index('completed_idx').on(table.completed),
}));
```

### tRPC Procedures

**File:** `server/routers/interconnectionAnalytics.ts`

```typescript
export const interconnectionAnalyticsRouter = router({
  // Adoption Metrics
  getAdoptionTrend: publicProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
      interval: z.enum(['day', 'week', 'month'])
    }))
    .query(async ({ input }) => {
      // Query interconnection_analytics table
      // Group by date interval
      // Return { date, activations, cumulativeActivations }
    }),

  getTopInterconnections: publicProcedure
    .input(z.object({
      limit: z.number().default(10),
      startDate: z.date().optional()
    }))
    .query(async ({ input }) => {
      // Query top interconnections by activation count
      // Include ROI multiplier and engagement metrics
    }),

  getClickThroughRate: publicProcedure
    .input(z.object({
      featureId: z.string().optional(),
      startDate: z.date().optional()
    }))
    .query(async ({ input }) => {
      // Calculate "See Connections" CTR
      // Return { impressions, clicks, ctr }
    }),

  // ROI Metrics
  getRoiAnalysis: publicProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional()
    }))
    .query(async ({ input }) => {
      // Compare projected vs. realized ROI
      // Return { projectedTotal, realizedTotal, realizationRate }
    }),

  getRoiByInterconnection: publicProcedure
    .input(z.object({
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      // ROI metrics per interconnection
      // Return array of { interconnection, projectedRoi, realizedRoi, count }
    }),

  // Feature Combination Metrics
  getWorkflowCompletion: publicProcedure
    .input(z.object({
      workflowId: z.string().optional()
    }))
    .query(async ({ input }) => {
      // Funnel analysis of workflow completion
      // Return { step, completedCount, totalCount, completionRate }
    }),

  getFeatureBundleAdoption: publicProcedure
    .query(async () => {
      // Adoption by bundle
      // Return { bundleId, bundleName, adoptionRate, activeCustomers }
    }),

  getCrossBundleAdoption: publicProcedure
    .query(async () => {
      // % of customers using features from multiple bundles
      // Return { bundleCombination, customerCount, percentage }
    }),

  // User Segment Metrics
  getSegmentAnalysis: publicProcedure
    .input(z.object({
      segmentBy: z.enum(['industry', 'companySize', 'adoptionVelocity']),
      limit: z.number().default(10)
    }))
    .query(async ({ input }) => {
      // Adoption metrics by segment
      // Return { segment, adoptionRate, avgRoi, activeCustomers }
    }),

  getTimeToValue: publicProcedure
    .input(z.object({
      segmentBy: z.enum(['industry', 'companySize']).optional()
    }))
    .query(async ({ input }) => {
      // Time from first activation to ROI realization
      // Return { segment, avgDays, medianDays, distribution }
    }),

  // Engagement Metrics
  getEngagementMetrics: publicProcedure
    .query(async () => {
      // Feature retention, churn, activation velocity
      // Return { retention30d, churn30d, avgActivationVelocity }
    }),

  getFeatureRetention: publicProcedure
    .input(z.object({
      days: z.number().default(30)
    }))
    .query(async ({ input }) => {
      // % of users still using feature after N days
      // Return { featureId, retentionRate, churnRate }
    }),

  // Alerts & Anomalies
  getAnomalies: publicProcedure
    .query(async () => {
      // Detect adoption spikes, drops, or unusual patterns
      // Return { type, severity, description, timestamp }
    }),

  recordActivation: protectedProcedure
    .input(z.object({
      sourceFeatureId: z.string(),
      targetFeatureId: z.string(),
      source: z.enum(['ai-shop', 'recommendation', 'workflow', 'manual', 'email']),
      roiProjected: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      // Record interconnection activation
      // Publish to Ably for real-time updates
    }),

  recordRoiRealization: protectedProcedure
    .input(z.object({
      interconnectionId: z.string(),
      roiRealized: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      // Update realized ROI for interconnection
    })
});
```

---

## React UI Components

### Dashboard Layout

**File:** `client/src/pages/InterconnectionAnalytics.tsx`

```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select } from '@/components/ui/select';
import { AdoptionChart } from './charts/AdoptionChart';
import { RoiChart } from './charts/RoiChart';
import { WorkflowFunnel } from './charts/WorkflowFunnel';
import { SegmentTable } from './tables/SegmentTable';

export function InterconnectionAnalytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });
  const [segment, setSegment] = useState('all');

  // Query metrics
  const { data: adoptionTrend } = trpc.interconnectionAnalytics.getAdoptionTrend.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    interval: 'day'
  });

  const { data: topInterconnections } = trpc.interconnectionAnalytics.getTopInterconnections.useQuery({
    limit: 10,
    startDate: dateRange.start
  });

  const { data: roiAnalysis } = trpc.interconnectionAnalytics.getRoiAnalysis.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end
  });

  const { data: workflowCompletion } = trpc.interconnectionAnalytics.getWorkflowCompletion.useQuery();

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interconnection Analytics</h1>
        <p className="text-muted-foreground">
          Track feature adoption, ROI realization, and engagement metrics
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
        <Select
          value={segment}
          onValueChange={setSegment}
          options={[
            { value: 'all', label: 'All Segments' },
            { value: 'enterprise', label: 'Enterprise' },
            { value: 'mid-market', label: 'Mid-Market' },
            { value: 'smb', label: 'SMB' }
          ]}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Total Activations</p>
          <p className="text-3xl font-bold mt-2">
            {adoptionTrend?.[adoptionTrend.length - 1]?.cumulativeActivations || 0}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Avg ROI Realized</p>
          <p className="text-3xl font-bold mt-2">
            {roiAnalysis?.realizationRate.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Workflow Completion</p>
          <p className="text-3xl font-bold mt-2">
            {workflowCompletion?.completionRate.toFixed(1)}%
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">See Connections CTR</p>
          <p className="text-3xl font-bold mt-2">42%</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="adoption">
        <TabsList>
          <TabsTrigger value="adoption">Adoption</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>

        <TabsContent value="adoption" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Adoption Trend</h2>
            <AdoptionChart data={adoptionTrend} />
          </Card>

          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Top Interconnections</h2>
            <div className="space-y-4">
              {topInterconnections?.map((ic) => (
                <div key={ic.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{ic.sourceFeatureName} → {ic.targetFeatureName}</p>
                    <p className="text-sm text-muted-foreground">{ic.activationCount} activations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{ic.roiMultiplier.toFixed(1)}x ROI</p>
                    <p className="text-sm text-green-600">{ic.engagementRate}% engaged</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">ROI Analysis</h2>
            <RoiChart data={roiAnalysis} />
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Workflow Completion Funnel</h2>
            <WorkflowFunnel data={workflowCompletion} />
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Adoption by Segment</h2>
            <SegmentTable />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Chart Components

**File:** `client/src/components/charts/AdoptionChart.tsx`

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdoptionChartProps {
  data?: Array<{
    date: string;
    activations: number;
    cumulativeActivations: number;
  }>;
}

export function AdoptionChart({ data }: AdoptionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data || []}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="activations"
          stroke="#3b82f6"
          name="Daily Activations"
        />
        <Line
          type="monotone"
          dataKey="cumulativeActivations"
          stroke="#10b981"
          name="Cumulative"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**File:** `client/src/components/charts/RoiChart.tsx`

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RoiChartProps {
  data?: {
    projectedTotal: number;
    realizedTotal: number;
    realizationRate: number;
    byInterconnection: Array<{
      interconnection: string;
      projected: number;
      realized: number;
    }>;
  };
}

export function RoiChart({ data }: RoiChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data?.byInterconnection || []}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="interconnection" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="projected" fill="#94a3b8" name="Projected ROI" />
        <Bar dataKey="realized" fill="#10b981" name="Realized ROI" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**File:** `client/src/components/charts/WorkflowFunnel.tsx`

```typescript
import { Funnel, Tooltip, Cell, ResponsiveContainer } from 'recharts';

interface WorkflowFunnelProps {
  data?: Array<{
    step: string;
    completedCount: number;
    totalCount: number;
    completionRate: number;
  }>;
}

export function WorkflowFunnel({ data }: WorkflowFunnelProps) {
  const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Funnel
        data={data || []}
        dataKey="completedCount"
        margin={{ top: 20, right: 160, bottom: 20, left: 20 }}
      >
        <Tooltip />
        {data?.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Funnel>
    </ResponsiveContainer>
  );
}
```

---

## Real-Time Integration

### Ably Channels

```typescript
// Subscribe to real-time adoption updates
const channel = ably.channels.get('interconnection-analytics');

channel.subscribe('adoption-spike', (message) => {
  // Handle adoption spike alert
  toast.info(`Adoption spike detected: ${message.data.interconnection}`);
});

channel.subscribe('roi-update', (message) => {
  // Update ROI metrics in real-time
  queryClient.invalidateQueries({ queryKey: ['roi-analysis'] });
});

channel.subscribe('workflow-completion', (message) => {
  // Update workflow completion in real-time
  queryClient.invalidateQueries({ queryKey: ['workflow-completion'] });
});
```

### Publishing Updates

```typescript
// From interconnection activation endpoint
await publishToAbly('interconnection-analytics', {
  type: 'adoption-spike',
  interconnection: ic.targetFeatureId,
  activationCount: newCount,
  timestamp: new Date()
});
```

---

## Role-Based Access

```typescript
export const analyticsRouter = router({
  // Public access (all authenticated users)
  getPublicMetrics: protectedProcedure
    .query(async ({ ctx }) => {
      return getPublicMetrics();
    }),

  // Admin access (executives, product managers)
  getDetailedMetrics: protectedProcedure
    .use(({ ctx, next }) => {
      if (!['admin', 'product_manager'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return next({ ctx });
    })
    .query(async ({ ctx }) => {
      return getDetailedMetrics();
    }),

  // Customer success access (segment-specific metrics)
  getCustomerMetrics: protectedProcedure
    .use(({ ctx, next }) => {
      if (!['customer_success', 'admin'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      return next({ ctx });
    })
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input, ctx }) => {
      return getCustomerMetrics(input.customerId);
    })
});
```

---

## Testing Requirements

**Unit Tests:**
- Metric calculation accuracy
- Date range filtering
- Segment filtering
- ROI calculation

**Integration Tests:**
- End-to-end dashboard load
- Real-time updates via Ably
- Role-based access control
- Export functionality

**Performance Tests:**
- Dashboard load time <2 seconds
- Chart rendering <500ms
- Real-time updates <1 second latency

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page Load Time | <2 seconds |
| Chart Rendering | <500ms |
| Real-Time Latency | <1 second |
| Uptime | 99.9% |
| User Satisfaction | >4.5/5 |
| Adoption Insights | Actionable |

---

**Status:** Ready for Implementation  
**Owner:** Replit  
**Timeline:** 4 weeks (parallel with Virtual Studio)
