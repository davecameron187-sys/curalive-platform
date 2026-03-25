# CuraLive Social Media Integration Design Document
## Complete Architecture for Content Distribution to Social Platforms

**Document Version:** 1.0  
**Date:** March 10, 2026  
**Status:** Design Phase  
**Audience:** Product, Engineering, Compliance

---

## Executive Summary

CuraLive's new **Social Media Integration** feature enables customers to automatically push event content (clips, highlights, transcripts, quotes) to social media platforms (LinkedIn, Twitter/X, Facebook, YouTube, Instagram) directly from the platform. This feature increases content reach, improves audience engagement, and reduces manual content distribution work.

**Key Benefits:**
- **Increased reach:** Content reaches wider audiences on social platforms
- **Time savings:** Automated distribution eliminates manual posting
- **Brand consistency:** Centralized content management ensures consistent messaging
- **Analytics:** Track social media performance directly from CuraLive
- **Compliance:** Built-in content review and approval workflows

---

## 1. Feature Overview

### What is Social Media Integration?

Social Media Integration allows operators and content managers to:

1. **Select content** from their events (clips, highlights, quotes, transcripts)
2. **Create social posts** with custom captions, hashtags, and branding
3. **Schedule publishing** to one or multiple social platforms
4. **Track performance** with built-in analytics (views, likes, shares, comments)
5. **Manage accounts** by linking multiple social media accounts

### Supported Platforms

| Platform | Content Types | Features | Priority |
|----------|---------------|----------|----------|
| **LinkedIn** | Text posts, images, video clips | Native publishing, analytics | P0 (MVP) |
| **Twitter/X** | Text, images, video clips | Native publishing, threads | P0 (MVP) |
| **Facebook** | Text, images, video, links | Native publishing, analytics | P1 |
| **YouTube** | Full videos, clips, shorts | Native publishing, analytics | P1 |
| **Instagram** | Images, video reels, stories | Native publishing, analytics | P2 |
| **TikTok** | Short video clips | Native publishing, analytics | P2 |

### Content Types

| Content Type | Description | Use Case |
|--------------|-------------|----------|
| **Highlight Clips** | 15-60 second video clips from the event | Social media engagement |
| **Quote Graphics** | Text quotes with branded backgrounds | LinkedIn, Twitter, Instagram |
| **Full Transcript** | Complete event transcript | LinkedIn articles, blog posts |
| **Key Moments** | Timestamped video segments | YouTube, TikTok |
| **Attendee Testimonials** | Video or text testimonials from attendees | Social proof, engagement |
| **Event Recap** | Summary of key points from the event | LinkedIn, Facebook |

---

## 2. Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    CuraLive Platform                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Social Media Integration Module                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ Account Linking │  │ Content Creator │               │   │
│  │  │ & Auth          │  │ & Scheduler     │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                            │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ Publishing      │  │ Analytics &     │               │   │
│  │  │ Engine          │  │ Performance     │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Social Media API Connectors                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                            │   │
│  │  LinkedIn API │ Twitter API │ Facebook API │ YouTube API │   │
│  │                                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    LinkedIn            Twitter/X            Facebook
    Platform            Platform             Platform
```

### Data Flow

1. **Event Content Capture** — Video, transcripts, and metadata captured during event
2. **Content Selection** — Operator selects content to distribute
3. **Post Creation** — Operator creates social media posts with captions, hashtags
4. **Scheduling** — Posts scheduled for optimal publishing times
5. **Publishing** — Automated publishing to social platforms via APIs
6. **Analytics** — Performance metrics collected and displayed in CuraLive dashboard

---

## 3. Technical Implementation

### 3.1 Backend Architecture

#### Social Media Service Layer

```typescript
// server/services/SocialMediaService.ts

interface SocialMediaAccount {
  id: string;
  userId: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'youtube' | 'instagram' | 'tiktok';
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

interface SocialPost {
  id: string;
  eventId: string;
  createdBy: string;
  content: string;
  contentType: 'text' | 'image' | 'video' | 'link';
  platforms: SocialMediaAccount[];
  scheduledAt: Date;
  publishedAt: Date;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metrics: SocialMetrics;
}

interface SocialMetrics {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  lastUpdated: Date;
}

// Core methods
class SocialMediaService {
  // Account Management
  async linkAccount(userId: string, platform: string, authCode: string): Promise<SocialMediaAccount>;
  async unlinkAccount(accountId: string): Promise<void>;
  async refreshAccessToken(accountId: string): Promise<void>;
  async getLinkedAccounts(userId: string): Promise<SocialMediaAccount[]>;

  // Post Creation & Publishing
  async createPost(eventId: string, content: SocialPostInput): Promise<SocialPost>;
  async schedulePost(postId: string, scheduledAt: Date): Promise<void>;
  async publishPost(postId: string, accountIds: string[]): Promise<PublishResult>;
  async getPost(postId: string): Promise<SocialPost>;

  // Analytics
  async getMetrics(postId: string): Promise<SocialMetrics>;
  async syncMetrics(postId: string): Promise<void>;
  async getAnalyticsDashboard(eventId: string): Promise<AnalyticsDashboard>;

  // Content Management
  async extractHighlights(eventId: string): Promise<ContentHighlight[]>;
  async generateQuoteGraphic(quote: string, speaker: string): Promise<string>;
  async createEventRecap(eventId: string): Promise<EventRecap>;
}
```

#### OAuth 2.0 Integration

Each social platform requires OAuth 2.0 authentication:

```typescript
// server/_core/socialOAuth.ts

interface OAuthConfig {
  platform: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

class SocialOAuthManager {
  async getAuthorizationUrl(platform: string, userId: string): Promise<string>;
  async handleCallback(platform: string, code: string, state: string): Promise<SocialMediaAccount>;
  async refreshToken(account: SocialMediaAccount): Promise<string>;
}

// Platform-specific implementations
const OAUTH_CONFIGS = {
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['w_member_social', 'r_liteprofile'],
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.write', 'tweet.read', 'users.read'],
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['pages_manage_posts', 'pages_read_engagement'],
  },
};
```

#### Publishing Engine

```typescript
// server/services/PublishingEngine.ts

interface PublishResult {
  platform: string;
  postId: string;
  success: boolean;
  externalId: string;
  error?: string;
  publishedAt: Date;
}

class PublishingEngine {
  async publishToLinkedIn(post: SocialPost, account: SocialMediaAccount): Promise<PublishResult>;
  async publishToTwitter(post: SocialPost, account: SocialMediaAccount): Promise<PublishResult>;
  async publishToFacebook(post: SocialPost, account: SocialMediaAccount): Promise<PublishResult>;
  async publishToYouTube(post: SocialPost, account: SocialMediaAccount): Promise<PublishResult>;

  // Scheduling
  async schedulePublishing(post: SocialPost, scheduledAt: Date): Promise<void>;
  async processScheduledPosts(): Promise<void>; // Runs every 5 minutes

  // Error Handling
  async handlePublishingError(post: SocialPost, error: Error): Promise<void>;
  async retryFailedPost(postId: string): Promise<PublishResult>;
}
```

#### Analytics Collector

```typescript
// server/services/SocialAnalyticsCollector.ts

class SocialAnalyticsCollector {
  // Sync metrics from social platforms
  async syncLinkedInMetrics(postId: string, externalId: string): Promise<SocialMetrics>;
  async syncTwitterMetrics(postId: string, externalId: string): Promise<SocialMetrics>;
  async syncFacebookMetrics(postId: string, externalId: string): Promise<SocialMetrics>;

  // Scheduled metric collection (runs every hour)
  async collectMetricsForAllPosts(): Promise<void>;

  // Dashboard generation
  async generateAnalyticsDashboard(eventId: string): Promise<{
    totalReach: number;
    totalEngagement: number;
    topPerformingPost: SocialPost;
    platformBreakdown: Record<string, SocialMetrics>;
    timeSeriesData: Array<{ date: Date; metrics: SocialMetrics }>;
  }>;
}
```

### 3.2 Database Schema

```sql
-- Social Media Accounts
CREATE TABLE social_media_accounts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  platform ENUM('linkedin', 'twitter', 'facebook', 'youtube', 'instagram', 'tiktok') NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY (platform, account_id)
);

-- Social Posts
CREATE TABLE social_posts (
  id VARCHAR(255) PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  content_type ENUM('text', 'image', 'video', 'link') NOT NULL,
  scheduled_at TIMESTAMP,
  published_at TIMESTAMP,
  status ENUM('draft', 'scheduled', 'published', 'failed') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES webcast_events(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX (event_id),
  INDEX (status),
  INDEX (scheduled_at)
);

-- Social Post Platforms (many-to-many)
CREATE TABLE social_post_platforms (
  post_id VARCHAR(255) NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  external_post_id VARCHAR(255),
  publish_status ENUM('pending', 'published', 'failed') DEFAULT 'pending',
  published_at TIMESTAMP,
  error_message TEXT,
  PRIMARY KEY (post_id, account_id),
  FOREIGN KEY (post_id) REFERENCES social_posts(id),
  FOREIGN KEY (account_id) REFERENCES social_media_accounts(id)
);

-- Social Metrics
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

-- Content Highlights
CREATE TABLE content_highlights (
  id VARCHAR(255) PRIMARY KEY,
  event_id VARCHAR(255) NOT NULL,
  content_type ENUM('clip', 'quote', 'transcript', 'recap') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  content_url VARCHAR(255),
  start_time_ms INT,
  end_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES webcast_events(id),
  INDEX (event_id)
);
```

### 3.3 tRPC Procedures

```typescript
// server/routers/socialMedia.ts

export const socialMediaRouter = router({
  // Account Management
  getLinkedAccounts: protectedProcedure
    .query(async ({ ctx }) => {
      return await socialMediaService.getLinkedAccounts(ctx.user.id);
    }),

  linkAccount: protectedProcedure
    .input(z.object({
      platform: z.enum(['linkedin', 'twitter', 'facebook', 'youtube']),
      authCode: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await socialMediaService.linkAccount(ctx.user.id, input.platform, input.authCode);
    }),

  unlinkAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await socialMediaService.unlinkAccount(input.accountId);
      return { success: true };
    }),

  // Post Management
  createPost: protectedProcedure
    .input(z.object({
      eventId: z.string(),
      content: z.string(),
      contentType: z.enum(['text', 'image', 'video', 'link']),
      platforms: z.array(z.string()),
      scheduledAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await socialMediaService.createPost(input.eventId, {
        ...input,
        createdBy: ctx.user.id,
      });
    }),

  publishPost: protectedProcedure
    .input(z.object({
      postId: z.string(),
      accountIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      return await socialMediaService.publishPost(input.postId, input.accountIds);
    }),

  getPost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      return await socialMediaService.getPost(input.postId);
    }),

  // Analytics
  getMetrics: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      return await socialMediaService.getMetrics(input.postId);
    }),

  getAnalyticsDashboard: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await analyticsCollector.generateAnalyticsDashboard(input.eventId);
    }),

  // Content Extraction
  getHighlights: protectedProcedure
    .input(z.object({ eventId: z.string() }))
    .query(async ({ input }) => {
      return await socialMediaService.extractHighlights(input.eventId);
    }),
});
```

---

## 4. Frontend Implementation

### 4.1 UI Components

#### Social Media Account Linking

```typescript
// client/src/components/SocialMediaLinking.tsx

interface SocialMediaLinkingProps {
  onAccountLinked: (account: SocialMediaAccount) => void;
}

export function SocialMediaLinking({ onAccountLinked }: SocialMediaLinkingProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const linkAccountMutation = trpc.socialMedia.linkAccount.useMutation();

  const handleLinkAccount = async (platform: string) => {
    // Redirect to OAuth authorization URL
    const authUrl = await getOAuthAuthorizationUrl(platform);
    window.location.href = authUrl;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Link Social Media Accounts</h2>
      <div className="grid grid-cols-2 gap-4">
        {['linkedin', 'twitter', 'facebook', 'youtube'].map((platform) => (
          <button
            key={platform}
            onClick={() => handleLinkAccount(platform)}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            <img src={`/icons/${platform}.svg`} alt={platform} className="w-8 h-8 mb-2" />
            <p className="font-semibold capitalize">{platform}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### Social Post Creator

```typescript
// client/src/components/SocialPostCreator.tsx

interface SocialPostCreatorProps {
  eventId: string;
  onPostCreated: (post: SocialPost) => void;
}

export function SocialPostCreator({ eventId, onPostCreated }: SocialPostCreatorProps) {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

  const createPostMutation = trpc.socialMedia.createPost.useMutation();
  const linkedAccounts = trpc.socialMedia.getLinkedAccounts.useQuery();

  const handleCreatePost = async () => {
    const post = await createPostMutation.mutateAsync({
      eventId,
      content,
      contentType: 'text',
      platforms: selectedPlatforms,
      scheduledAt: scheduledAt || undefined,
    });
    onPostCreated(post);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Create Social Post</h2>

      {/* Content Editor */}
      <div>
        <label className="block text-sm font-medium mb-2">Post Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded-lg"
          rows={6}
          placeholder="Write your post content here..."
        />
        <p className="text-sm text-gray-500 mt-1">{content.length} characters</p>
      </div>

      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Platforms</label>
        <div className="space-y-2">
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
                className="mr-3"
              />
              <span>{account.accountName} ({account.platform})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Scheduling */}
      <div>
        <label className="block text-sm font-medium mb-2">Schedule Post (Optional)</label>
        <input
          type="datetime-local"
          value={scheduledAt ? scheduledAt.toISOString().slice(0, 16) : ''}
          onChange={(e) => setScheduledAt(e.target.value ? new Date(e.target.value) : null)}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCreatePost}
          disabled={!content || selectedPlatforms.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {scheduledAt ? 'Schedule Post' : 'Publish Now'}
        </button>
        <button
          onClick={() => setContent('')}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
```

#### Social Analytics Dashboard

```typescript
// client/src/components/SocialAnalyticsDashboard.tsx

interface SocialAnalyticsDashboardProps {
  eventId: string;
}

export function SocialAnalyticsDashboard({ eventId }: SocialAnalyticsDashboardProps) {
  const analyticsDashboard = trpc.socialMedia.getAnalyticsDashboard.useQuery({ eventId });

  if (analyticsDashboard.isLoading) return <div>Loading analytics...</div>;
  if (!analyticsDashboard.data) return <div>No analytics available</div>;

  const { totalReach, totalEngagement, topPerformingPost, platformBreakdown } = analyticsDashboard.data;

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
        <div className="space-y-3">
          {Object.entries(platformBreakdown).map(([platform, metrics]) => (
            <div key={platform} className="p-4 border rounded-lg">
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

      {/* Top Performing Post */}
      {topPerformingPost && (
        <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
          <p className="text-sm text-gray-600">Top Performing Post</p>
          <p className="font-semibold mt-2">{topPerformingPost.content.substring(0, 100)}...</p>
          <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
            <div>
              <p className="text-gray-600">Views</p>
              <p className="font-semibold">{topPerformingPost.metrics.views.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Likes</p>
              <p className="font-semibold">{topPerformingPost.metrics.likes.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Shares</p>
              <p className="font-semibold">{topPerformingPost.metrics.shares.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-600">Engagement</p>
              <p className="font-semibold">{topPerformingPost.metrics.engagementRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Integration Points

### 5.1 Event Content Extraction

During or after an event, CuraLive automatically extracts shareable content:

- **Video clips** — 15-60 second highlights from the event
- **Quotes** — Key quotes from speakers
- **Transcripts** — Full or partial event transcripts
- **Event recap** — Summary of key points
- **Attendee testimonials** — Feedback from attendees

### 5.2 Operator Console Integration

Add a new "Social Media" tab to the operator console:

```typescript
// client/src/pages/OperatorDashboard.tsx

<Tabs defaultValue="alerts">
  <TabsList>
    <TabsTrigger value="alerts">Alerts</TabsTrigger>
    <TabsTrigger value="muting">Muting Control</TabsTrigger>
    <TabsTrigger value="social">Social Media</TabsTrigger>
  </TabsList>

  <TabsContent value="social">
    <div className="space-y-6">
      <SocialPostCreator eventId={eventId} />
      <SocialAnalyticsDashboard eventId={eventId} />
    </div>
  </TabsContent>
</Tabs>
```

### 5.3 Post-Event Workflow

After an event ends:

1. **Content extraction** — Automatically extract highlights and quotes
2. **Suggested posts** — AI-generated post suggestions based on event content
3. **Operator review** — Operator reviews and customizes posts
4. **Publishing** — Posts published to selected platforms
5. **Analytics tracking** — Monitor performance over time

---

## 6. Compliance & Security

### 6.1 Content Moderation

Before publishing to social media, content must pass compliance checks:

- **Violation detection** — Check for compliance violations in the content
- **Profanity filter** — Remove or flag inappropriate language
- **Confidentiality check** — Ensure no confidential information is being shared
- **Approval workflow** — Require operator or compliance officer approval

### 6.2 Data Privacy

- **OAuth tokens** — Encrypted and stored securely
- **Access control** — Only authorized users can link accounts and publish
- **Audit trail** — All social media actions logged for compliance
- **Data retention** — Social media metrics retained per compliance policy

### 6.3 Rate Limiting

- **API rate limits** — Respect social platform API rate limits
- **Publishing limits** — Limit posts per hour/day to prevent spam
- **Retry logic** — Automatic retry with exponential backoff for failed posts

---

## 7. Implementation Roadmap

### Phase 1: MVP (Weeks 1-4)
- **LinkedIn integration** — Account linking, post creation, publishing
- **Twitter integration** — Account linking, post creation, publishing
- **Basic analytics** — View count, engagement metrics
- **Post scheduling** — Schedule posts for future publishing

### Phase 2: Expansion (Weeks 5-8)
- **Facebook integration** — Account linking, post creation, publishing
- **YouTube integration** — Video upload and publishing
- **Advanced analytics** — Detailed performance tracking, trend analysis
- **Content suggestions** — AI-generated post suggestions

### Phase 3: Enhancement (Weeks 9-12)
- **Instagram integration** — Story and reel publishing
- **TikTok integration** — Short video publishing
- **Multi-account management** — Manage multiple accounts per platform
- **Compliance automation** — Automated content moderation

---

## 8. Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| **Adoption rate** | >60% of customers use social media feature | 3 months |
| **Average posts per event** | 5+ posts per event | 3 months |
| **Engagement rate** | >2% average engagement rate | 3 months |
| **Time saved** | 30 minutes saved per event | 3 months |
| **Customer satisfaction** | >4.5/5 rating | 3 months |

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **API rate limiting** | Implement queue system with exponential backoff |
| **Token expiration** | Automatic token refresh before expiration |
| **Failed publishing** | Retry logic with manual intervention option |
| **Compliance violations** | Content moderation before publishing |
| **Account security** | OAuth 2.0, encrypted token storage, audit logging |

---

## 10. Conclusion

The Social Media Integration feature will significantly enhance CuraLive's value proposition by enabling customers to extend the reach of their events beyond the platform. By providing a seamless, secure, and compliant way to distribute content to social platforms, we'll help customers maximize the impact of their events and build stronger audience engagement.

**Next Steps:**
1. Finalize technical specifications with engineering team
2. Obtain API credentials from social platforms
3. Begin Phase 1 implementation (LinkedIn + Twitter)
4. Set up testing environment with sandbox accounts
5. Plan beta testing with select customers
