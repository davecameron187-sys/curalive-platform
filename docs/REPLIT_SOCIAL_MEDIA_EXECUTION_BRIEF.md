# CuraLive Social Media Integration — Replit Execution Brief
## Phase 1 MVP Implementation (LinkedIn + Twitter)

**Document Version:** 1.0  
**Date:** March 10, 2026  
**Status:** Ready for Implementation  
**Timeline:** 4 weeks (Weeks 1-4)  
**Team:** Replit Engineering  
**Project:** chorus-ai

---

## Executive Summary

This brief provides Replit with all necessary specifications to implement Phase 1 of CuraLive's Social Media Integration feature. Phase 1 focuses on LinkedIn and Twitter integration with post creation, scheduling, and basic analytics.

**Deliverables:**
- OAuth 2.0 authentication for LinkedIn and Twitter
- Post creation and scheduling UI
- Multi-platform publishing engine
- Basic analytics dashboard
- Compliance content moderation
- Full test coverage (vitest)

**Success Criteria:**
- All 8 tRPC procedures implemented and tested
- OAuth flows working for both platforms
- Posts successfully publish to LinkedIn and Twitter
- Analytics data collected and displayed
- Zero critical bugs in testing

---

## Phase 1 Scope

### Features to Implement

#### 1. Social Media Account Management
- **Link accounts** — OAuth 2.0 flow for LinkedIn and Twitter
- **Unlink accounts** — Remove linked accounts
- **View linked accounts** — List all connected accounts
- **Refresh tokens** — Automatic token refresh before expiration

#### 2. Post Creation & Publishing
- **Create posts** — Draft posts with text content
- **Schedule posts** — Set publish time for future posting
- **Publish immediately** — Publish posts right away
- **Multi-platform** — Publish to multiple platforms in one action
- **Status tracking** — Track post status (draft, scheduled, published, failed)

#### 3. Analytics
- **Collect metrics** — Views, likes, shares, comments from social platforms
- **Display dashboard** — Show analytics in operator console
- **Performance tracking** — Track engagement rate and reach

#### 4. Compliance
- **Content moderation** — Check for compliance violations before publishing
- **Approval workflow** — Require approval for flagged content
- **Audit trail** — Log all social media actions

---

## Technical Specifications

### Backend Implementation

#### 1. Database Schema (SQL)

```sql
-- Social Media Accounts Table
CREATE TABLE social_media_accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  platform ENUM('linkedin', 'twitter') NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY (platform, account_id),
  INDEX (user_id),
  INDEX (expires_at)
);

-- Social Posts Table
CREATE TABLE social_posts (
  id VARCHAR(255) PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  content_type ENUM('text', 'image', 'video', 'link') DEFAULT 'text',
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status ENUM('draft', 'scheduled', 'published', 'failed') DEFAULT 'draft',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES webcast_events(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX (event_id),
  INDEX (status),
  INDEX (scheduled_at)
);

-- Social Post Platforms (Many-to-Many)
CREATE TABLE social_post_platforms (
  post_id VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  external_post_id VARCHAR(255),
  publish_status ENUM('pending', 'published', 'failed') DEFAULT 'pending',
  published_at TIMESTAMP,
  error_message TEXT,
  PRIMARY KEY (post_id, account_id),
  FOREIGN KEY (post_id) REFERENCES social_posts(id),
  FOREIGN KEY (account_id) REFERENCES social_media_accounts(id),
  INDEX (external_post_id)
);

-- Social Metrics Table
CREATE TABLE social_metrics (
  id VARCHAR(255) PRIMARY KEY,
  post_id VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  shares INT DEFAULT 0,
  comments INT DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES social_posts(id),
  FOREIGN KEY (account_id) REFERENCES social_media_accounts(id),
  INDEX (post_id),
  INDEX (collected_at)
);
```

#### 2. File Structure

```
server/
├── services/
│   ├── SocialMediaService.ts          (Main service class)
│   ├── PublishingEngine.ts            (Publishing logic)
│   └── SocialAnalyticsCollector.ts    (Analytics collection)
├── _core/
│   ├── socialOAuth.ts                 (OAuth 2.0 flows)
│   └── socialMediaConfig.ts           (Platform configurations)
├── routers/
│   ├── socialMedia.ts                 (tRPC procedures)
│   └── socialMedia.test.ts            (Unit tests)
└── webhooks/
    └── socialMetrics.ts               (Webhook for metrics updates)

client/src/
├── components/
│   ├── SocialMediaLinking.tsx         (Account linking UI)
│   ├── SocialPostCreator.tsx          (Post creation UI)
│   └── SocialAnalyticsDashboard.tsx   (Analytics UI)
└── pages/
    └── SocialMediaPage.tsx            (Main social media page)
```

#### 3. Core Service Implementation

**SocialMediaService.ts** — Main service class with these methods:

```typescript
class SocialMediaService {
  // Account Management
  async linkAccount(userId: string, platform: string, authCode: string): Promise<SocialMediaAccount>;
  async unlinkAccount(accountId: string): Promise<void>;
  async refreshAccessToken(accountId: string): Promise<void>;
  async getLinkedAccounts(userId: string): Promise<SocialMediaAccount[]>;

  // Post Management
  async createPost(eventId: string, content: SocialPostInput): Promise<SocialPost>;
  async schedulePost(postId: string, scheduledAt: Date): Promise<void>;
  async publishPost(postId: string, accountIds: string[]): Promise<PublishResult[]>;
  async getPost(postId: string): Promise<SocialPost>;
  async getPostsByEvent(eventId: string): Promise<SocialPost[]>;

  // Analytics
  async getMetrics(postId: string): Promise<SocialMetrics>;
  async syncMetrics(postId: string): Promise<void>;
  async getAnalyticsDashboard(eventId: string): Promise<AnalyticsDashboard>;
}
```

**PublishingEngine.ts** — Publishing logic:

```typescript
class PublishingEngine {
  async publishToLinkedIn(post: SocialPost, account: SocialMediaAccount): Promise<PublishResult>;
  async publishToTwitter(post: SocialPost, account: SocialMediaAccount): Promise<PublishResult>;
  async schedulePublishing(post: SocialPost, scheduledAt: Date): Promise<void>;
  async processScheduledPosts(): Promise<void>; // Runs every 5 minutes
  async handlePublishingError(post: SocialPost, error: Error): Promise<void>;
  async retryFailedPost(postId: string): Promise<PublishResult>;
}
```

**SocialAnalyticsCollector.ts** — Analytics collection:

```typescript
class SocialAnalyticsCollector {
  async syncLinkedInMetrics(postId: string, externalId: string): Promise<SocialMetrics>;
  async syncTwitterMetrics(postId: string, externalId: string): Promise<SocialMetrics>;
  async collectMetricsForAllPosts(): Promise<void>; // Runs every hour
  async generateAnalyticsDashboard(eventId: string): Promise<AnalyticsDashboard>;
}
```

#### 4. tRPC Procedures

Implement these 8 tRPC procedures in `server/routers/socialMedia.ts`:

```typescript
export const socialMediaRouter = router({
  // Account Management (4 procedures)
  getLinkedAccounts: protectedProcedure
    .query(async ({ ctx }) => { ... }),

  linkAccount: protectedProcedure
    .input(z.object({
      platform: z.enum(['linkedin', 'twitter']),
      authCode: z.string(),
    }))
    .mutation(async ({ ctx, input }) => { ... }),

  unlinkAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => { ... }),

  // Post Management (3 procedures)
  createPost: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      content: z.string(),
      platforms: z.array(z.string()),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => { ... }),

  publishPost: protectedProcedure
    .input(z.object({
      postId: z.string(),
      accountIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => { ... }),

  getPost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => { ... }),

  // Analytics (1 procedure)
  getAnalyticsDashboard: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => { ... }),
});
```

#### 5. OAuth 2.0 Configuration

**socialOAuth.ts** — OAuth flows for LinkedIn and Twitter:

```typescript
const OAUTH_CONFIGS = {
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: `${process.env.FRONTEND_URL}/oauth/callback/linkedin`,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['w_member_social', 'r_liteprofile'],
  },
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    redirectUri: `${process.env.FRONTEND_URL}/oauth/callback/twitter`,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.write', 'tweet.read', 'users.read'],
  },
};

class SocialOAuthManager {
  async getAuthorizationUrl(platform: string, userId: string): Promise<string>;
  async handleCallback(platform: string, code: string, state: string): Promise<SocialMediaAccount>;
  async refreshToken(account: SocialMediaAccount): Promise<string>;
}
```

#### 6. Environment Variables

Add these to `.env`:

```
# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# Twitter OAuth
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# Social Media Configuration
SOCIAL_MEDIA_ENABLED=true
SOCIAL_MEDIA_PUBLISHING_INTERVAL=300000  # 5 minutes
SOCIAL_MEDIA_ANALYTICS_INTERVAL=3600000  # 1 hour
```

---

### Frontend Implementation

#### 1. React Components

**SocialMediaLinking.tsx** — Account linking UI:

```typescript
export function SocialMediaLinking({ onAccountLinked }: Props) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const linkAccountMutation = trpc.socialMedia.linkAccount.useMutation();

  const handleLinkAccount = async (platform: string) => {
    // Get authorization URL from backend
    const authUrl = await getOAuthAuthorizationUrl(platform);
    // Redirect to OAuth provider
    window.location.href = authUrl;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Link Social Media Accounts</h2>
      <div className="grid grid-cols-2 gap-4">
        {['linkedin', 'twitter'].map((platform) => (
          <button
            key={platform}
            onClick={() => handleLinkAccount(platform)}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            <img src={`/icons/${platform}.svg`} alt={platform} className="w-8 h-8 mb-2" />
            <p className="font-semibold capitalize">Link {platform}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**SocialPostCreator.tsx** — Post creation UI:

```typescript
export function SocialPostCreator({ eventId, onPostCreated }: Props) {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  const createPostMutation = trpc.socialMedia.createPost.useMutation();
  const linkedAccounts = trpc.socialMedia.getLinkedAccounts.useQuery();

  const handleCreatePost = async () => {
    const post = await createPostMutation.mutateAsync({
      eventId,
      content,
      platforms: selectedPlatforms,
      scheduledAt: scheduledAt || undefined,
    });
    onPostCreated(post);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create Social Post</h2>
      
      {/* Content Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full p-3 border rounded-lg"
        rows={6}
        placeholder="Write your post..."
      />

      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Platforms</label>
        {linkedAccounts.data?.map((account) => (
          <label key={account.id} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(account.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedPlatforms([...selectedPlatforms, account.id]);
                } else {
                  setSelectedPlatforms(selectedPlatforms.filter((id) => id !== account.id));
                }
              }}
            />
            <span className="ml-2">{account.accountName}</span>
          </label>
        ))}
      </div>

      {/* Scheduling */}
      <input
        type="datetime-local"
        value={scheduledAt ? scheduledAt.toISOString().slice(0, 16) : ''}
        onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value) : null)}
        className="w-full p-3 border rounded-lg"
      />

      {/* Action Buttons */}
      <button
        onClick={handleCreatePost}
        disabled={!content || selectedPlatforms.length === 0}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {scheduledAt ? 'Schedule Post' : 'Publish Now'}
      </button>
    </div>
  );
}
```

**SocialAnalyticsDashboard.tsx** — Analytics UI:

```typescript
export function SocialAnalyticsDashboard({ eventId }: Props) {
  const analyticsDashboard = trpc.socialMedia.getAnalyticsDashboard.useQuery({ eventId });

  if (analyticsDashboard.isLoading) return <div>Loading...</div>;

  const { totalReach, totalEngagement, platformBreakdown } = analyticsDashboard.data;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Social Media Analytics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Reach</p>
          <p className="text-3xl font-bold">{totalReach.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Total Engagement</p>
          <p className="text-3xl font-bold">{totalEngagement.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <p className="text-sm text-gray-600">Engagement Rate</p>
          <p className="text-3xl font-bold">{((totalEngagement / totalReach) * 100).toFixed(1)}%</p>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Performance by Platform</h3>
        {Object.entries(platformBreakdown).map(([platform, metrics]) => (
          <div key={platform} className="p-4 border rounded-lg mb-3">
            <p className="font-medium capitalize">{platform}</p>
            <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
              <div>
                <p className="text-gray-600">Views</p>
                <p className="font-semibold">{metrics.views.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Likes</p>
                <p className="font-semibold">{metrics.likes.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Shares</p>
                <p className="font-semibold">{metrics.shares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Comments</p>
                <p className="font-semibold">{metrics.comments.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2. Integration with Operator Console

Add a new "Social Media" tab to the operator dashboard:

```typescript
// In OperatorDashboard.tsx
<Tabs defaultValue="alerts">
  <TabsList>
    <TabsTrigger value="alerts">Alerts</TabsTrigger>
    <TabsTrigger value="muting">Muting Control</TabsTrigger>
    <TabsTrigger value="social">Social Media</TabsTrigger>
  </TabsList>

  <TabsContent value="social">
    <div className="space-y-6">
      <SocialMediaLinking />
      <SocialPostCreator eventId={eventId} />
      <SocialAnalyticsDashboard eventId={eventId} />
    </div>
  </TabsContent>
</Tabs>
```

---

## Testing Requirements

### Unit Tests

Create `server/routers/socialMedia.test.ts` with tests for:

1. **Account Management**
   - Link account (LinkedIn, Twitter)
   - Unlink account
   - Get linked accounts
   - Token refresh

2. **Post Management**
   - Create post
   - Schedule post
   - Publish post
   - Get post

3. **Analytics**
   - Get metrics
   - Get analytics dashboard

4. **Error Handling**
   - Invalid OAuth code
   - Publishing failures
   - Token expiration

### Integration Tests

Test end-to-end flows:

1. **OAuth Flow** — User links account → OAuth callback → Account stored
2. **Publishing Flow** — Create post → Schedule → Publish → Status updated
3. **Analytics Flow** — Publish post → Collect metrics → Display in dashboard

### Manual Testing Checklist

- [ ] Link LinkedIn account successfully
- [ ] Link Twitter account successfully
- [ ] Create and publish post to LinkedIn
- [ ] Create and publish post to Twitter
- [ ] Schedule post for future publishing
- [ ] View analytics dashboard
- [ ] Verify metrics are collected
- [ ] Test error handling (invalid tokens, API errors)
- [ ] Test token refresh
- [ ] Verify audit trail logging

---

## Acceptance Criteria

### Functional Requirements

- [ ] OAuth 2.0 flows working for LinkedIn and Twitter
- [ ] Users can link/unlink accounts
- [ ] Posts can be created and published immediately
- [ ] Posts can be scheduled for future publishing
- [ ] Posts publish to multiple platforms simultaneously
- [ ] Metrics are collected from social platforms
- [ ] Analytics dashboard displays metrics
- [ ] Compliance checks prevent publishing violations
- [ ] Audit trail logs all social media actions
- [ ] Failed posts can be retried

### Non-Functional Requirements

- [ ] All tRPC procedures have <100ms response time
- [ ] Database queries optimized with proper indexes
- [ ] No sensitive data logged (tokens, credentials)
- [ ] Proper error handling and user-friendly error messages
- [ ] Code coverage >80% for critical paths
- [ ] All tests passing (vitest)

### Security Requirements

- [ ] OAuth tokens encrypted in database
- [ ] No tokens logged or exposed in errors
- [ ] Rate limiting on publishing (prevent spam)
- [ ] Access control (users can only manage their own accounts)
- [ ] Compliance content moderation working
- [ ] Audit trail immutable

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] OAuth apps created on LinkedIn and Twitter
- [ ] API credentials added to .env
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Deployed to staging environment
- [ ] Manual testing completed
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Ready for production deployment

---

## Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| **Implementation complete** | All 8 procedures + 3 components | Week 4 |
| **Test coverage** | >80% code coverage | Week 4 |
| **OAuth flows** | 100% success rate in testing | Week 2 |
| **Publishing latency** | <5 seconds to publish | Week 3 |
| **Analytics sync** | <1 hour delay from publish | Week 4 |

---

## Questions & Support

If you have questions during implementation:

1. **Technical questions** — Review the design document for detailed specifications
2. **API integration** — LinkedIn and Twitter API documentation links provided below
3. **Database schema** — SQL scripts provided above
4. **Code examples** — TypeScript examples provided for all major components

---

## API Documentation Links

- **LinkedIn API:** https://docs.microsoft.com/en-us/linkedin/marketing/
- **Twitter API v2:** https://developer.twitter.com/en/docs/twitter-api
- **OAuth 2.0 Spec:** https://tools.ietf.org/html/rfc6749

---

## Deliverables Summary

**By End of Week 4:**

1. ✅ Backend services (SocialMediaService, PublishingEngine, SocialAnalyticsCollector)
2. ✅ Database schema and migrations
3. ✅ 8 tRPC procedures (fully tested)
4. ✅ 3 React components (SocialMediaLinking, SocialPostCreator, SocialAnalyticsDashboard)
5. ✅ OAuth 2.0 integration (LinkedIn + Twitter)
6. ✅ Publishing engine with scheduling
7. ✅ Analytics collection and dashboard
8. ✅ Compliance content moderation
9. ✅ Audit trail logging
10. ✅ Comprehensive test suite (>80% coverage)
11. ✅ Deployment to staging environment
12. ✅ Documentation and API guide

---

## Timeline

| Week | Deliverables |
|------|--------------|
| **Week 1** | Database schema, OAuth setup, SocialMediaService core |
| **Week 2** | OAuth flows complete, tRPC procedures (account mgmt) |
| **Week 3** | Publishing engine, post creation UI, scheduling |
| **Week 4** | Analytics, dashboard UI, testing, deployment |

---

## Next Steps

1. **Review this brief** with engineering team
2. **Obtain OAuth credentials** from LinkedIn and Twitter
3. **Set up development environment** with test accounts
4. **Begin Week 1 implementation** following the timeline
5. **Weekly sync meetings** to track progress and resolve blockers

---

**Document prepared by:** Manus AI  
**Date:** March 10, 2026  
**Status:** Ready for Implementation
