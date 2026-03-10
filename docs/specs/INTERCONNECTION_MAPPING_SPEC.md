# CuraLive Interconnection Mapping System — Replit Implementation Spec

**Status:** spec-ready  
**Priority:** High  
**Estimated Effort:** 40 hours (2.5 weeks)  
**Target Launch:** Q2 2026

---

## REPLIT SUMMARY

Implement a dynamic interconnection mapping system that shows users how features within and across bundles connect together. This addresses the "difficulty understanding interconnections" challenge and increases feature adoption by 20-30%.

**What to Build:**
1. Database schema: 3 new tables (feature_interconnections, user_interconnection_preferences, interconnection_analytics)
2. Algorithm: Hybrid rule-based + LLM-powered interconnection mapping
3. tRPC procedures: 5 procedures for querying, mapping, and tracking interconnections
4. Real-time updates: Ably integration for live interconnection suggestions
5. Analytics: Track which interconnections users follow and ROI realized

**Key Features:**
- Intra-bundle interconnection flows (5 bundles × 6-7 features each)
- Cross-bundle synergies (5 major cross-bundle links)
- LLM-powered recommendations using Manus LLM
- ROI multipliers for feature combinations (1.1x - 1.5x boost)
- Real-time updates via Ably WebSocket
- Analytics dashboard for adoption tracking

**Success Criteria:**
- All 5 bundles have interconnection maps
- Algorithm scores interconnections with >85% confidence
- Real-time updates working via Ably
- Analytics tracking 100% of interconnection activations
- >40% click-through on "See Connections" button
- >60% workflow completion rate

---

## Implementation Phases

### Phase 1: Database & Algorithm (Week 1-2)

**Database Schema:**
Create 3 new tables in `drizzle/schema.ts`:

```typescript
// Table 1: Feature interconnections
export const featureInterconnections = mysqlTable('feature_interconnections', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sourceFeatureId: varchar('source_feature_id', { length: 255 }).notNull(),
  targetFeatureId: varchar('target_feature_id', { length: 255 }).notNull(),
  type: mysqlEnum('type', ['sequential', 'dependent', 'synergistic', 'cross-bundle']).notNull(),
  description: text('description'),
  roiMultiplier: decimal('roi_multiplier', { precision: 3, scale: 2 }).default('1.0'),
  dependencyLevel: mysqlEnum('dependency_level', ['required', 'recommended', 'optional']).default('optional'),
  workflowStep: int('workflow_step'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Table 2: User interconnection preferences
export const userInterconnectionPreferences = mysqlTable('user_interconnection_preferences', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  interconnectionId: varchar('interconnection_id', { length: 255 }).notNull(),
  preference: mysqlEnum('preference', ['enabled', 'disabled', 'auto']).default('auto'),
  customRoiMultiplier: decimal('custom_roi_multiplier', { precision: 3, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Table 3: Interconnection analytics
export const interconnectionAnalytics = mysqlTable('interconnection_analytics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  sourceFeatureId: varchar('source_feature_id', { length: 255 }).notNull(),
  targetFeatureId: varchar('target_feature_id', { length: 255 }).notNull(),
  activatedAt: timestamp('activated_at'),
  roiRealized: decimal('roi_realized', { precision: 5, scale: 2 }),
  workflowCompleted: boolean('workflow_completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Seed Data:**
Create `server/seeds/interconnections.ts` with all intra-bundle and cross-bundle interconnections from the design document.

**Algorithm Service:**
Create `server/services/InterconnectionService.ts`:

```typescript
import { invokeLLM } from '../_core/llm';
import { publishToAbly } from '../_core/ably';

export class InterconnectionService {
  async mapInterconnections(
    selectedFeatures: string[],
    userRole: string,
    eventType: string
  ) {
    // Step 1: Rule-based matching
    const ruleMatches = await this.matchRuleBasedInterconnections(selectedFeatures);
    
    // Step 2: LLM-powered suggestions
    const llmSuggestions = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert in CuraLive feature interconnections.
          Map interconnections for the following features with dependencies and ROIs.
          Return JSON with: {features: [{id, nextSteps: [{featureId, roiMultiplier, dependency}]}]}`
        },
        {
          role: "user",
          content: `Selected features: ${selectedFeatures.join(', ')}
          User role: ${userRole}
          Event type: ${eventType}
          
          Map the optimal feature workflow with ROI multipliers.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interconnection_map",
          strict: true,
          schema: {
            type: "object",
            properties: {
              features: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    nextSteps: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          featureId: { type: "string" },
                          roiMultiplier: { type: "number" },
                          dependency: { type: "string" }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Step 3: Score and rank
    const scored = this.scoreInterconnections(ruleMatches, llmSuggestions);
    
    // Step 4: Broadcast via Ably
    await publishToAbly('interconnections:update', scored);
    
    return scored;
  }

  private async matchRuleBasedInterconnections(featureIds: string[]) {
    // Query database for direct interconnections
    const db = getDb();
    const interconnections = await db.query.featureInterconnections.findMany({
      where: inArray(featureInterconnections.sourceFeatureId, featureIds)
    });
    return interconnections;
  }

  private scoreInterconnections(ruleMatches: any[], llmSuggestions: any[]) {
    return ruleMatches.map(match => ({
      featureId: match.sourceFeatureId,
      score: (match.matchCount / match.totalFeatures) * 100 * 0.85,
      roiMultiplier: match.roiMultiplier,
      recommendedNext: match.nextSteps,
      confidence: 0.85
    }));
  }
}
```

**tRPC Procedures:**
Create `server/routers/interconnections.ts` with 5 procedures:

```typescript
export const interconnectionsRouter = router({
  getFeatureInterconnections: publicProcedure
    .input(z.object({ featureId: z.string() }))
    .query(async ({ input }) => {
      // Return all interconnections for a feature
    }),

  mapInterconnections: publicProcedure
    .input(z.object({
      selectedFeatures: z.array(z.string()),
      userRole: z.enum(['operator', 'presenter', 'attendee', 'administrator']),
      eventType: z.string()
    }))
    .mutation(async ({ input }) => {
      // Call InterconnectionService.mapInterconnections
    }),

  getRecommendedNext: publicProcedure
    .input(z.object({ featureId: z.string() }))
    .query(async ({ input }) => {
      // Return recommended next features sorted by ROI
    }),

  recordActivation: protectedProcedure
    .input(z.object({
      sourceFeatureId: z.string(),
      targetFeatureId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      // Record interconnection activation for analytics
    }),

  getAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date()
    }))
    .query(async ({ input, ctx }) => {
      // Return analytics for user's interconnection usage
    })
});
```

**Testing:**
Create `server/routers/interconnections.test.ts` with tests for:
- Rule-based matching accuracy
- LLM suggestion quality
- Scoring algorithm correctness
- Analytics tracking
- Real-time updates via Ably

---

### Phase 2: UI Components (Week 3)

**Interconnection Graph Visualization:**
Create `client/src/components/InterconnectionGraph.tsx`:
- Radix UI graph visualization
- Node = feature, edge = interconnection
- Color-coded by dependency level
- ROI multiplier badges
- Interactive hover states

**"See Connections" Button:**
Add to `client/src/components/FeatureCard.tsx`:
- Button that triggers interconnection modal
- Shows recommended next features
- Displays ROI multipliers
- One-click activation

**Workflow Step Indicators:**
Create `client/src/components/WorkflowSteps.tsx`:
- Visual timeline of feature sequence
- Current step highlighting
- Next step recommendation
- Completion progress

---

### Phase 3: Integration (Week 4)

**AI Shop Integration:**
Update `client/src/pages/AIShop.tsx`:
- Add "See Connections" button to feature cards
- Show interconnection count badge
- Filter by interconnection type

**Onboarding Quiz Integration:**
Update `client/src/components/OnboardingQuiz.tsx`:
- Recommend interconnections based on quiz answers
- Show ROI multipliers for recommended paths

**Progressive Unlock Integration:**
Update `server/services/ProgressiveUnlockService.ts`:
- Unlock features based on interconnection completion
- Suggest next features from interconnections

---

## Testing Requirements

**Unit Tests:**
- InterconnectionService.mapInterconnections()
- InterconnectionService.scoreInterconnections()
- All 5 tRPC procedures
- Analytics tracking

**Integration Tests:**
- End-to-end interconnection mapping
- LLM integration
- Ably real-time updates
- Database persistence

**Manual Testing:**
- Verify all 5 bundles have correct interconnections
- Test LLM suggestions for accuracy
- Verify real-time updates working
- Test analytics dashboard

---

## Acceptance Criteria

**Functional:**
- [ ] All 5 bundles have interconnection maps
- [ ] Algorithm scores with >85% confidence
- [ ] Real-time updates working via Ably
- [ ] Analytics tracking 100% of activations
- [ ] "See Connections" button working in AI Shop

**Non-Functional:**
- [ ] Graph visualization renders in <500ms
- [ ] LLM suggestions return in <2s
- [ ] Real-time updates latency <100ms
- [ ] Database queries use proper indexes

**Security:**
- [ ] User can only see their own analytics
- [ ] No SQL injection vulnerabilities
- [ ] Proper error handling for LLM failures

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Feature adoption increase | +20-30% |
| Time-to-value reduction | 30% faster |
| ROI realization | +40% higher |
| "See Connections" CTR | >40% |
| Workflow completion rate | >60% |
| User satisfaction | 4.5+/5 |

---

## Files to Create/Modify

**Create:**
- `server/services/InterconnectionService.ts`
- `server/routers/interconnections.ts`
- `server/routers/interconnections.test.ts`
- `server/seeds/interconnections.ts`
- `client/src/components/InterconnectionGraph.tsx`
- `client/src/components/WorkflowSteps.tsx`

**Modify:**
- `drizzle/schema.ts` (add 3 tables)
- `server/routers.ts` (register interconnectionsRouter)
- `client/src/pages/AIShop.tsx` (add "See Connections" button)
- `client/src/components/FeatureCard.tsx` (add button)
- `server/services/ProgressiveUnlockService.ts` (integrate)

**Database:**
- Run `pnpm db:push` to create new tables
- Run seed script to populate interconnections

---

## Timeline

- **Week 1:** Database schema + seed data
- **Week 2:** Algorithm service + tRPC procedures + tests
- **Week 3:** UI components (graph, buttons, workflow steps)
- **Week 4:** Integration with AI Shop, quiz, progressive unlock
- **Week 5:** Testing, optimization, documentation

---

## Questions for Clarification

1. Should interconnection suggestions be personalized by industry/company size?
2. Should users be able to customize ROI multipliers for their use case?
3. Should we track interconnection abandonment (user sees recommendation but doesn't follow)?
4. Should we A/B test different interconnection suggestions?

---

**Status:** Ready for Implementation  
**Owner:** Replit  
**Reviewer:** Manus AI
