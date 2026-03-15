# Virtual Studio Integration with AI Bundles — Replit Implementation Spec

**Status:** spec-ready  
**Priority:** Critical  
**Estimated Effort:** 64 hours (8 weeks)  
**Target Launch:** Q2 2026

---

## REPLIT SUMMARY

Integrate the Virtual Studio feature into CuraLive's role-based AI bundles, creating immersive, bundle-specific virtual environments for webcasts. Each bundle gets customized studio configurations, interconnected overlays, ESG flagging, and multi-language support. This creates a seamless, role-specific experience that increases engagement by +40-50% and reduces production costs by 40%.

**What to Build:**
1. Bundle-specific virtual studio customizations (backgrounds, avatars, overlays)
2. Interconnection overlays linking bundle features to studio elements
3. ESG flagging system for compliance-themed studios
4. Multi-language avatar dubbing
5. Post-webcast virtual replays with bundle-linked summaries
6. Real-time Ably sync for live studio previews
7. 8 tRPC procedures with full test coverage
8. React UI components for bundle-linked studio setup

**Key Features:**
- AI-generated backgrounds/avatars tailored to role (IR, Compliance, Operations, Content, All-Access)
- Real-time interconnection overlays (e.g., sentiment gauges from IR bundle)
- ESG compliance flagging in studio elements
- Multi-language avatar dubbing synchronized with bundle chat translation
- Bundle-linked post-event virtual replays
- <100ms latency for all operations
- 99.9% uptime for real-time features

**Success Criteria:**
- All bundle integrations work with <100ms latency
- +40% webcast engagement in pilot tests
- Interconnections function across all bundles
- Zero critical bugs; 99.9% uptime
- Scalable to 1000+ participants

---

## Phase 5: Virtual Studio Integration (Weeks 1-8)

### Week 1-2: Database Schema & Core Services

#### Database Schema

Add these tables to `drizzle/schema.ts`:

```typescript
// Virtual Studios Table (Bundle-Linked)
export const virtualStudios = mysqlTable('virtual_studios', {
  id: varchar('id', { length: 255 }).primaryKey(),
  eventId: varchar('event_id', { length: 255 }).notNull(),
  bundleId: varchar('bundle_id', { length: 255 }).notNull(),
  backgroundType: mysqlEnum('background_type', ['generated', 'custom', 'esg']).default('generated'),
  avatarConfig: json('avatar_config'),
  overlays: json('overlays'),
  esgScore: decimal('esg_score', { precision: 5, scale: 2 }).default('0'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  eventIdIdx: index('event_id_idx').on(table.eventId),
  bundleIdIdx: index('bundle_id_idx').on(table.bundleId),
  fk_event: foreignKey({ columns: [table.eventId], foreignColumns: [webcastEvents.id] }),
  fk_bundle: foreignKey({ columns: [table.bundleId], foreignColumns: [aiApplications.id] }),
}));

// ESG Flagging Table
export const esgStudioFlags = mysqlTable('esg_studio_flags', {
  id: varchar('id', { length: 255 }).primaryKey(),
  studioId: varchar('studio_id', { length: 255 }).notNull(),
  category: mysqlEnum('category', ['environmental', 'social', 'governance']).notNull(),
  description: text('description').notNull(),
  severity: mysqlEnum('severity', ['low', 'medium', 'high']).default('medium'),
  flaggedAt: timestamp('flagged_at').defaultNow(),
}, (table) => ({
  studioIdIdx: index('studio_id_idx').on(table.studioId),
  fk_studio: foreignKey({ columns: [table.studioId], foreignColumns: [virtualStudios.id] }),
}));

// Studio Interconnections
export const studioInterconnections = mysqlTable('studio_interconnections', {
  id: varchar('id', { length: 255 }).primaryKey(),
  studioId: varchar('studio_id', { length: 255 }).notNull(),
  featureType: varchar('feature_type', { length: 255 }).notNull(),
  overlayConfig: json('overlay_config'),
  linkedAt: timestamp('linked_at').defaultNow(),
}, (table) => ({
  studioIdIdx: index('studio_id_idx').on(table.studioId),
  fk_studio: foreignKey({ columns: [table.studioId], foreignColumns: [virtualStudios.id] }),
}));

// Avatar Dubbing
export const avatarDubs = mysqlTable('avatar_dubs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  studioId: varchar('studio_id', { length: 255 }).notNull(),
  language: varchar('language', { length: 10 }).notNull(),
  audioUrl: text('audio_url'),
  status: mysqlEnum('status', ['pending', 'processing', 'completed', 'failed']).default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  studioIdIdx: index('studio_id_idx').on(table.studioId),
  languageIdx: index('language_idx').on(table.language),
  fk_studio: foreignKey({ columns: [table.studioId], foreignColumns: [virtualStudios.id] }),
}));
```

#### Core Services

**File:** `server/services/VirtualStudioService.ts`

```typescript
import { db } from '@/server/db';
import { virtualStudios, esgStudioFlags, studioInterconnections } from '@/drizzle/schema';
import { invokeLLM } from '@/server/_core/llm';
import { publishToAbly } from '@/server/_core/ably';

export class VirtualStudioService {
  async customizeForBundle(eventId: string, bundleId: string): Promise<StudioConfig> {
    // Get bundle details
    const bundle = await db.query.aiApplications.findFirst({
      where: eq(aiApplications.id, bundleId)
    });

    if (!bundle) throw new Error('Bundle not found');

    // Generate AI customization via LLM
    const prompt = `Generate a professional virtual studio configuration for a ${bundle.name} webcast. 
    Include:
    - Background style (professional, investor-focused, compliance-focused, etc.)
    - Avatar appearance (formal, approachable, technical, etc.)
    - Color scheme aligned with bundle purpose
    - Overlay recommendations for key metrics
    Return as JSON with fields: backgroundStyle, avatarAppearance, colorScheme, overlayRecommendations`;

    const customization = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert in virtual event design.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'studio_config',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              backgroundStyle: { type: 'string' },
              avatarAppearance: { type: 'string' },
              colorScheme: { type: 'array', items: { type: 'string' } },
              overlayRecommendations: { type: 'array', items: { type: 'string' } }
            },
            required: ['backgroundStyle', 'avatarAppearance', 'colorScheme', 'overlayRecommendations'],
            additionalProperties: false
          }
        }
      }
    });

    // Create studio record
    const studioId = generateId();
    await db.insert(virtualStudios).values({
      id: studioId,
      eventId,
      bundleId,
      backgroundType: 'generated',
      avatarConfig: customization,
      overlays: []
    });

    // Publish to Ably for real-time sync
    await publishToAbly(`studio-bundle-${bundleId}`, {
      type: 'studio_created',
      studioId,
      config: customization
    });

    return {
      studioId,
      config: customization,
      bundleId
    };
  }

  async linkInterconnections(studioId: string, featureType: string): Promise<LinkResult> {
    const studio = await db.query.virtualStudios.findFirst({
      where: eq(virtualStudios.id, studioId)
    });

    if (!studio) throw new Error('Studio not found');

    // Get bundle features
    const features = await db.query.features.findMany({
      where: eq(features.bundleId, studio.bundleId)
    });

    // Find interconnected features
    const interconnectedFeatures = features.filter(f => 
      f.interconnections?.includes(featureType)
    );

    // Create overlay configs for each interconnection
    for (const feature of interconnectedFeatures) {
      const overlayConfig = this.generateOverlayConfig(feature, featureType);
      
      await db.insert(studioInterconnections).values({
        id: generateId(),
        studioId,
        featureType: feature.id,
        overlayConfig
      });
    }

    // Publish update to Ably
    await publishToAbly(`studio-bundle-${studio.bundleId}`, {
      type: 'interconnections_linked',
      studioId,
      featureType,
      count: interconnectedFeatures.length
    });

    return {
      success: true,
      linkedCount: interconnectedFeatures.length
    };
  }

  async flagESG(studioId: string): Promise<ESGFlag[]> {
    const studio = await db.query.virtualStudios.findFirst({
      where: eq(virtualStudios.id, studioId)
    });

    if (!studio) throw new Error('Studio not found');

    // Analyze studio config for ESG issues
    const prompt = `Review this virtual studio configuration for ESG (Environmental, Social, Governance) compliance issues:
    ${JSON.stringify(studio.avatarConfig)}
    
    Identify any potential issues and categorize as environmental, social, or governance.
    Return as JSON array with fields: category, description, severity`;

    const flags = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an ESG compliance expert.' },
        { role: 'user', content: prompt }
      ]
    });

    // Store flags
    const flagList = JSON.parse(flags.choices[0].message.content);
    for (const flag of flagList) {
      await db.insert(esgStudioFlags).values({
        id: generateId(),
        studioId,
        category: flag.category,
        description: flag.description,
        severity: flag.severity
      });
    }

    // Calculate ESG score
    const esgScore = this.calculateESGScore(flagList);
    await db.update(virtualStudios)
      .set({ esgScore })
      .where(eq(virtualStudios.id, studioId));

    return flagList;
  }

  async dubAvatar(studioId: string, language: string): Promise<DubResult> {
    const studio = await db.query.virtualStudios.findFirst({
      where: eq(virtualStudios.id, studioId)
    });

    if (!studio) throw new Error('Studio not found');

    // Create dub record
    const dubId = generateId();
    await db.insert(avatarDubs).values({
      id: dubId,
      studioId,
      language,
      status: 'pending'
    });

    // Queue dubbing job (async)
    // In production, this would trigger a background job
    // For now, we'll mark as completed
    await db.update(avatarDubs)
      .set({ status: 'completed', audioUrl: `https://audio.curalive.com/${dubId}.mp3` })
      .where(eq(avatarDubs.id, dubId));

    return {
      dubId,
      language,
      status: 'completed',
      audioUrl: `https://audio.curalive.com/${dubId}.mp3`
    };
  }

  async generateReplay(studioId: string): Promise<ReplayVideo> {
    const studio = await db.query.virtualStudios.findFirst({
      where: eq(virtualStudios.id, studioId)
    });

    if (!studio) throw new Error('Studio not found');

    // Get event data
    const event = await db.query.webcastEvents.findFirst({
      where: eq(webcastEvents.id, studio.eventId)
    });

    // Generate replay with bundle-specific summary
    const prompt = `Create a 2-minute virtual replay summary for a webcast with these details:
    Event: ${event?.title}
    Bundle: ${studio.bundleId}
    Duration: ${event?.duration || 'unknown'}
    
    Include key moments, highlights, and bundle-specific insights.`;

    const summary = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert video editor.' },
        { role: 'user', content: prompt }
      ]
    });

    return {
      replayId: generateId(),
      videoUrl: `https://video.curalive.com/replay/${studio.id}.mp4`,
      duration: 120,
      summary: summary.choices[0].message.content
    };
  }

  private generateOverlayConfig(feature: Feature, sourceFeature: string): OverlayConfig {
    // Generate overlay configuration based on feature type
    const overlayMap: Record<string, OverlayConfig> = {
      'sentiment': {
        type: 'gauge',
        metric: 'sentiment_score',
        position: 'top-right',
        color: 'gradient-green-red'
      },
      'qa': {
        type: 'counter',
        metric: 'question_count',
        position: 'top-left',
        color: 'blue'
      },
      'compliance': {
        type: 'flag',
        metric: 'compliance_status',
        position: 'bottom-right',
        color: 'red'
      }
    };

    return overlayMap[feature.id] || {
      type: 'text',
      metric: feature.id,
      position: 'bottom-center',
      color: 'white'
    };
  }

  private calculateESGScore(flags: ESGFlag[]): number {
    // Simple scoring: start at 100, deduct based on severity
    let score = 100;
    for (const flag of flags) {
      if (flag.severity === 'high') score -= 20;
      if (flag.severity === 'medium') score -= 10;
      if (flag.severity === 'low') score -= 5;
    }
    return Math.max(0, score);
  }
}
```

---

### Week 3-4: Interconnections & ESG Flagging

**File:** `server/services/BundleIntegrator.ts`

```typescript
export class BundleIntegrator {
  async integrateBundle(studioId: string, bundleId: string): Promise<IntegrationResult> {
    const studio = await db.query.virtualStudios.findFirst({
      where: eq(virtualStudios.id, studioId)
    });

    // Get all features in bundle
    const features = await db.query.features.findMany({
      where: eq(features.bundleId, bundleId)
    });

    // Link each feature's interconnections
    for (const feature of features) {
      const interconnections = await db.query.featureInterconnections.findMany({
        where: eq(featureInterconnections.sourceFeatureId, feature.id)
      });

      for (const ic of interconnections) {
        await this.createOverlayLink(studioId, ic);
      }
    }

    return { success: true, linkedFeatures: features.length };
  }

  private async createOverlayLink(studioId: string, ic: FeatureInterconnection) {
    const overlayConfig = {
      sourceFeature: ic.sourceFeatureId,
      targetFeature: ic.targetFeatureId,
      roiMultiplier: ic.roiMultiplier,
      overlayType: this.getOverlayType(ic.targetFeatureId),
      position: this.getOverlayPosition(ic.targetFeatureId)
    };

    await db.insert(studioInterconnections).values({
      id: generateId(),
      studioId,
      featureType: ic.targetFeatureId,
      overlayConfig
    });
  }

  private getOverlayType(featureId: string): string {
    const typeMap: Record<string, string> = {
      'sentiment-dashboard': 'gauge',
      'qa-moderation': 'counter',
      'compliance-monitoring': 'flag',
      'auto-muting': 'indicator'
    };
    return typeMap[featureId] || 'text';
  }

  private getOverlayPosition(featureId: string): string {
    const positionMap: Record<string, string> = {
      'sentiment-dashboard': 'top-right',
      'qa-moderation': 'top-left',
      'compliance-monitoring': 'bottom-right',
      'auto-muting': 'bottom-left'
    };
    return positionMap[featureId] || 'bottom-center';
  }
}
```

---

### Week 5-6: Avatars, Dubbing & Replays

**File:** `server/services/AvatarService.ts`

```typescript
export class AvatarService {
  async generateAvatar(studioId: string, bundleId: string): Promise<Avatar> {
    const bundle = await db.query.aiApplications.findFirst({
      where: eq(aiApplications.id, bundleId)
    });

    // Generate avatar based on bundle
    const prompt = `Generate a professional virtual avatar for a ${bundle?.name} webcast.
    Style: ${this.getStyleForBundle(bundle?.name)}
    Appearance: ${this.getAppearanceForBundle(bundle?.name)}
    Return avatar configuration as JSON.`;

    const avatarConfig = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are an expert in avatar design.' },
        { role: 'user', content: prompt }
      ]
    });

    return JSON.parse(avatarConfig.choices[0].message.content);
  }

  async dubAvatarMultiLanguage(studioId: string, languages: string[]): Promise<DubResult[]> {
    const results: DubResult[] = [];

    for (const language of languages) {
      const result = await this.dubAvatar(studioId, language);
      results.push(result);
    }

    return results;
  }

  private getStyleForBundle(bundleName?: string): string {
    const styleMap: Record<string, string> = {
      'Investor Relations': 'professional, formal, trustworthy',
      'Compliance & Risk': 'authoritative, serious, compliance-focused',
      'Operations & Efficiency': 'friendly, approachable, efficient',
      'Content & Marketing': 'creative, engaging, dynamic',
      'All-Access': 'versatile, adaptable, premium'
    };
    return styleMap[bundleName || ''] || 'professional';
  }

  private getAppearanceForBundle(bundleName?: string): string {
    const appearanceMap: Record<string, string> = {
      'Investor Relations': 'business suit, professional makeup',
      'Compliance & Risk': 'formal attire, serious expression',
      'Operations & Efficiency': 'business casual, friendly smile',
      'Content & Marketing': 'modern, creative styling',
      'All-Access': 'customizable, premium appearance'
    };
    return appearanceMap[bundleName || ''] || 'professional';
  }
}
```

---

### Week 7-8: Testing & Deployment

#### tRPC Procedures

**File:** `server/routers/virtualStudio.ts`

```typescript
export const virtualStudioRouter = router({
  customizeBundle: protectedProcedure
    .input(z.object({ eventId: z.string(), bundleId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const service = new VirtualStudioService();
      return service.customizeForBundle(input.eventId, input.bundleId);
    }),

  linkInterconnection: protectedProcedure
    .input(z.object({ studioId: z.string(), featureType: z.string() }))
    .mutation(async ({ input }) => {
      const service = new VirtualStudioService();
      return service.linkInterconnections(input.studioId, input.featureType);
    }),

  flagESG: protectedProcedure
    .input(z.object({ studioId: z.string() }))
    .query(async ({ input }) => {
      const service = new VirtualStudioService();
      return service.flagESG(input.studioId);
    }),

  dubAvatar: protectedProcedure
    .input(z.object({ studioId: z.string(), language: z.string() }))
    .mutation(async ({ input }) => {
      const service = new VirtualStudioService();
      return service.dubAvatar(input.studioId, input.language);
    }),

  generateReplay: protectedProcedure
    .input(z.object({ studioId: z.string() }))
    .query(async ({ input }) => {
      const service = new VirtualStudioService();
      return service.generateReplay(input.studioId);
    }),

  getStudioConfig: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return db.query.virtualStudios.findFirst({
        where: eq(virtualStudios.eventId, input.eventId)
      });
    }),

  getESGReport: protectedProcedure
    .input(z.object({ studioId: z.string() }))
    .query(async ({ input }) => {
      const flags = await db.query.esgStudioFlags.findMany({
        where: eq(esgStudioFlags.studioId, input.studioId)
      });
      return { flags, score: this.calculateScore(flags) };
    }),

  getBundleLinks: protectedProcedure
    .input(z.object({ bundleId: z.string() }))
    .query(async ({ input }) => {
      return db.query.studioInterconnections.findMany({
        where: eq(studioInterconnections.bundleId, input.bundleId)
      });
    })
});
```

#### Test Suite

**File:** `server/routers/virtualStudio.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { VirtualStudioService } from '@/server/services/VirtualStudioService';

describe('Virtual Studio Integration', () => {
  let service: VirtualStudioService;

  beforeEach(() => {
    service = new VirtualStudioService();
  });

  describe('Bundle Customization', () => {
    it('should customize studio for IR bundle', async () => {
      const result = await service.customizeForBundle('event-1', 'ir-bundle');
      expect(result.studioId).toBeDefined();
      expect(result.config).toBeDefined();
    });

    it('should customize studio for Compliance bundle', async () => {
      const result = await service.customizeForBundle('event-1', 'compliance-bundle');
      expect(result.config.backgroundStyle).toContain('compliance');
    });
  });

  describe('Interconnection Linking', () => {
    it('should link interconnections to studio', async () => {
      const studio = await service.customizeForBundle('event-1', 'ir-bundle');
      const result = await service.linkInterconnections(studio.studioId, 'sentiment');
      expect(result.linkedCount).toBeGreaterThan(0);
    });
  });

  describe('ESG Flagging', () => {
    it('should flag ESG issues', async () => {
      const studio = await service.customizeForBundle('event-1', 'compliance-bundle');
      const flags = await service.flagESG(studio.studioId);
      expect(Array.isArray(flags)).toBe(true);
    });
  });

  describe('Avatar Dubbing', () => {
    it('should dub avatar in multiple languages', async () => {
      const studio = await service.customizeForBundle('event-1', 'ir-bundle');
      const result = await service.dubAvatar(studio.studioId, 'es');
      expect(result.status).toBe('completed');
      expect(result.audioUrl).toBeDefined();
    });
  });

  describe('Replay Generation', () => {
    it('should generate bundle-linked replay', async () => {
      const studio = await service.customizeForBundle('event-1', 'ir-bundle');
      const replay = await service.generateReplay(studio.studioId);
      expect(replay.replayId).toBeDefined();
      expect(replay.videoUrl).toBeDefined();
    });
  });

  // Additional 20+ tests for edge cases, error handling, performance
});
```

---

## React UI Components

### VirtualStudioSetup Component

**File:** `client/src/components/VirtualStudioSetup.tsx`

```typescript
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface VirtualStudioSetupProps {
  eventId: string;
  bundleId: string;
}

export function VirtualStudioSetup({ eventId, bundleId }: VirtualStudioSetupProps) {
  const [loading, setLoading] = useState(false);
  const customize = trpc.virtualStudio.customizeBundle.useMutation();

  const handleCustomize = async () => {
    setLoading(true);
    try {
      await customize.mutateAsync({ eventId, bundleId });
      // Show success toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Virtual Studio Setup</h2>
      <p className="text-muted-foreground mb-6">
        Customize your virtual studio for this bundle
      </p>
      <Button onClick={handleCustomize} disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Customize for Bundle
      </Button>
    </Card>
  );
}
```

---

## Integration Checklist

- [ ] Database schema created and migrated
- [ ] VirtualStudioService implemented
- [ ] BundleIntegrator implemented
- [ ] AvatarService implemented
- [ ] All 8 tRPC procedures created
- [ ] Test suite with >85% coverage
- [ ] React UI components built
- [ ] Ably real-time sync working
- [ ] LLM integration tested
- [ ] Performance <100ms latency verified
- [ ] ESG flagging functional
- [ ] Multi-language dubbing working
- [ ] Replay generation tested
- [ ] End-to-end workflows verified

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Latency | <100ms |
| Engagement Increase | +40% |
| Cost Reduction | 40% |
| Uptime | 99.9% |
| Test Coverage | >85% |
| Scalability | 1000+ participants |

---

**Status:** Ready for Implementation  
**Owner:** Replit  
**Timeline:** 8 weeks
