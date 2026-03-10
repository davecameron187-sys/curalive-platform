# Interconnection Integration with AI Shop — Replit Implementation Spec

**Status:** spec-ready  
**Priority:** High  
**Estimated Effort:** 20 hours (1.5 weeks)  
**Target Launch:** Q2 2026

---

## REPLIT SUMMARY

Integrate interconnection mapping into the existing AI Shop and feature discovery system. Add "See Connections" buttons to feature cards, show interconnection counts, recommend next features in the shop, and track which interconnections users follow.

**What to Build:**
1. Update FeatureCard component with interconnection badges
2. Add interconnection recommendations to AI Shop homepage
3. Create "Related Features" section in feature detail pages
4. Integrate with progressive unlock system
5. Track interconnection-based activations

**Key Features:**
- Interconnection count badges on feature cards
- "See Connections" button with modal
- Related features carousel
- Recommended next features based on current selection
- One-click activation of interconnected features
- Analytics tracking for interconnection-based adoption

**Success Criteria:**
- >40% click-through on "See Connections"
- >60% of users following recommended workflows
- +20% feature adoption increase
- >4.5/5 user satisfaction

---

## Phase 4: AI Shop Integration (Week 1-1.5)

### 1. Update FeatureCard Component

**File:** `client/src/pages/AIShop.tsx`

Update the feature card grid to show interconnection information:

```typescript
import { FeatureCard } from '@/components/FeatureCardWithConnections';
import { trpc } from '@/lib/trpc';

export function AIShop() {
  const { data: features } = trpc.features.getAll.useQuery();
  const { data: interconnections } = trpc.interconnections.getAll.useQuery();

  // Count interconnections per feature
  const interconnectionCounts = features?.reduce((acc, feature) => {
    const count = interconnections?.filter(
      ic => ic.sourceFeatureId === feature.id
    ).length || 0;
    acc[feature.id] = count;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleSeeConnections = async (featureId: string) => {
    return trpc.interconnections.getFeatureInterconnections.query({
      featureId
    });
  };

  const handleActivate = async (featureId: string) => {
    await trpc.features.activateFeature.mutate({ featureId });
    // Record interconnection activation if applicable
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features?.map(feature => (
        <FeatureCard
          key={feature.id}
          featureId={feature.id}
          name={feature.name}
          description={feature.description}
          category={feature.category}
          roiBase={feature.roiBase}
          interconnectionCount={interconnectionCounts[feature.id] || 0}
          onActivate={handleActivate}
          onSeeConnections={handleSeeConnections}
        />
      ))}
    </div>
  );
}
```

---

### 2. Add Interconnection Recommendations to Homepage

**File:** `client/src/pages/AIShop.tsx` (add new section)

```typescript
function RecommendedInterconnections() {
  const { user } = useAuth();
  const { data: recommendations } = trpc.interconnections.getRecommendedNext.useQuery(
    { featureId: user?.lastActivatedFeature || '' },
    { enabled: !!user?.lastActivatedFeature }
  );

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="py-12 border-t">
      <div className="container">
        <h2 className="text-2xl font-bold mb-6">Recommended Next Features</h2>
        <p className="text-muted-foreground mb-8">
          Based on your current features, these interconnections unlock additional value
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map(ic => (
            <Card key={ic.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{ic.targetFeatureName}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pairs with {ic.sourceFeatureName}
                  </p>
                </div>
                <Badge className="whitespace-nowrap">
                  {ic.roiMultiplier.toFixed(1)}x ROI
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {ic.description}
              </p>

              <Button className="w-full">
                Activate {ic.targetFeatureName}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### 3. Feature Detail Page with Related Features

**File:** `client/src/pages/FeatureDetail.tsx` (new file)

```typescript
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function FeatureDetail() {
  const { featureId } = useParams<{ featureId: string }>();
  const { data: feature } = trpc.features.getById.useQuery({ id: featureId! });
  const { data: interconnections } = trpc.interconnections.getFeatureInterconnections.useQuery(
    { featureId: featureId! },
    { enabled: !!featureId }
  );

  if (!feature) return <div>Loading...</div>;

  return (
    <div className="container py-12">
      <div className="max-w-4xl">
        {/* Feature Header */}
        <div className="mb-8">
          <Badge className="mb-4">{feature.category}</Badge>
          <h1 className="text-4xl font-bold mb-4">{feature.name}</h1>
          <p className="text-lg text-muted-foreground mb-6">{feature.description}</p>

          <div className="flex gap-4">
            <Button size="lg">Activate Feature</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mt-12">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interconnections">
              Related Features ({interconnections?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="use-cases">Use Cases</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Key Benefits</h2>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{feature.roiBase}% base ROI</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <span>Integrates with {interconnections?.length || 0} other features</span>
                </li>
              </ul>
            </Card>
          </TabsContent>

          <TabsContent value="interconnections" className="mt-6">
            <div className="space-y-4">
              {interconnections?.map(ic => (
                <Card key={ic.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{ic.targetFeatureName}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ic.type} interconnection
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {ic.roiMultiplier.toFixed(1)}x ROI
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {ic.description}
                  </p>

                  <Button size="sm">
                    Activate {ic.targetFeatureName}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="use-cases" className="mt-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Common Use Cases</h2>
              <ul className="space-y-3">
                {feature.useCases?.map((useCase, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{useCase}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

### 4. Progressive Unlock Integration

**File:** `server/services/ProgressiveUnlockService.ts` (update)

```typescript
export class ProgressiveUnlockService {
  async checkAndUnlockFeatures(userId: number) {
    // ... existing code ...

    // NEW: Check interconnection-based unlocks
    const activatedFeatures = await this.getActivatedFeatures(userId);
    
    for (const feature of activatedFeatures) {
      const interconnections = await db.query.featureInterconnections.findMany({
        where: eq(featureInterconnections.sourceFeatureId, feature.id)
      });

      for (const ic of interconnections) {
        if (ic.dependencyLevel === 'recommended') {
          // Suggest next feature
          await this.suggestFeature(userId, ic.targetFeatureId);
        }
      }
    }
  }

  private async suggestFeature(userId: number, featureId: string) {
    // Create notification suggesting the feature
    await notifyOwner({
      title: 'Feature Recommendation',
      content: `User ${userId} has activated a feature that pairs well with ${featureId}`
    });
  }
}
```

---

### 5. Analytics Tracking

**File:** `server/routers/interconnections.ts` (add new procedure)

```typescript
export const interconnectionsRouter = router({
  // ... existing procedures ...

  recordInterconnectionActivation: protectedProcedure
    .input(z.object({
      sourceFeatureId: z.string(),
      targetFeatureId: z.string(),
      source: z.enum(['ai-shop', 'recommendation', 'workflow', 'manual'])
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      // Record activation
      await db.insert(interconnectionAnalytics).values({
        id: generateId(),
        userId: ctx.user.id,
        sourceFeatureId: input.sourceFeatureId,
        targetFeatureId: input.targetFeatureId,
        activatedAt: new Date()
      });

      // Track source
      await db.insert(interconnectionActivationSource).values({
        id: generateId(),
        userId: ctx.user.id,
        interconnectionId: `${input.sourceFeatureId}-${input.targetFeatureId}`,
        source: input.source,
        createdAt: new Date()
      });

      return { success: true };
    }),

  getInterconnectionStats: publicProcedure
    .query(async () => {
      const db = getDb();
      
      const stats = await db.query.interconnectionAnalytics.findMany({
        limit: 1000
      });

      return {
        totalActivations: stats.length,
        completedWorkflows: stats.filter(s => s.workflowCompleted).length,
        averageRoiRealized: stats.reduce((sum, s) => sum + (s.roiRealized || 0), 0) / stats.length,
        topInterconnections: this.getTopInterconnections(stats)
      };
    })
});
```

---

## Integration Checklist

- [ ] Update FeatureCard with interconnection badges
- [ ] Add "See Connections" button to feature cards
- [ ] Create RecommendedInterconnections section on homepage
- [ ] Build FeatureDetail page with related features
- [ ] Integrate with progressive unlock system
- [ ] Add analytics tracking for interconnection activations
- [ ] Create interconnection stats dashboard
- [ ] Test end-to-end workflows

---

## Testing Requirements

**Unit Tests:**
- Feature card renders interconnection count
- "See Connections" button fetches data
- Recommended features display correctly
- Analytics tracking working

**Integration Tests:**
- End-to-end feature activation workflow
- Progressive unlock triggering correctly
- Analytics dashboard showing correct data
- Real-time updates via Ably

---

## Success Metrics

| Metric | Target |
|--------|--------|
| "See Connections" CTR | >40% |
| Interconnection-based activations | >30% of new activations |
| Workflow completion rate | >60% |
| Feature adoption increase | +20-30% |
| User satisfaction | 4.5+/5 |

---

**Status:** Ready for Implementation  
**Owner:** Replit
